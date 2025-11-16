import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load envs from .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
// Prefer service-role key to bypass RLS for bulk import; fallback to anon
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PUBLIC_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const KEY = SERVICE_KEY || PUBLIC_ANON_KEY
if (!SUPABASE_URL || !KEY) {
  console.error('Missing env. Required: VITE_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY (preferred) or VITE_SUPABASE_ANON_KEY.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, KEY)

function parseYouTubeId(url) {
  try {
    const u = new URL(url.trim())
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v')
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.replace('/', '')
    }
    return null
  } catch {
    return null
  }
}

async function fetchTitle(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`)
    if (!res.ok) return null
    const data = await res.json()
    return data?.title || null
  } catch {
    return null
  }
}

async function main() {
  let csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Usage: npm run import:youtube -- /absolute/path/to/youtube-links.csv')
    process.exit(1)
  }
  // Strip accidental wrapping quotes
  csvPath = csvPath.replace(/^['"]|['"]$/g, '')
  const content = fs.readFileSync(csvPath, 'utf8')
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  console.log(`Found ${lines.length} lines`)

  // Insert top-to-bottom to ensure first appears last (gallery orders by created_at desc)
  for (let i = 0; i < lines.length; i++) {
    const url = lines[i]
    const videoId = parseYouTubeId(url)
    if (!videoId) {
      console.warn(`Skipping invalid URL at line ${i + 1}: ${url}`)
      continue
    }
    const title = await fetchTitle(videoId)
    const { error } = await supabase.from('youtube_links').insert({ video_id: videoId, title })
    if (error) {
      console.error(`Failed to insert at line ${i + 1} (${videoId}):`, error.message)
    } else {
      console.log(`Inserted ${i + 1}/${lines.length}: ${videoId}${title ? ` - ${title}` : ''}`)
    }
    // tiny delay to be polite to oEmbed
    await new Promise(r => setTimeout(r, 120))
  }
  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


