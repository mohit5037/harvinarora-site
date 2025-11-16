import { useEffect, useMemo, useState } from 'react'
import { getAuthState } from '../auth'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, type YouTubeLinkRow } from '../supabaseClient'

export default function Gallery() {
  const navigate = useNavigate()
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [paths, setPaths] = useState<string[]>([])
  const [ytLinks, setYtLinks] = useState<YouTubeLinkRow[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    getAuthState().then(async (s) => {
      if (!s.currentUserId && !s.isAdmin) {
        navigate('/login')
        return
      }
      setCurrentId(s.currentUserId)
      setIsAdmin(s.isAdmin)
      const { data } = await supabase.storage.from('gallery').list('', { limit: 100 })
      const files = (data || []).filter(f => f.name && !f.name.endsWith('/')).map(f => f.name)
      setPaths(files)
      const yt = await supabase.from('youtube_links').select('*').order('created_at', { ascending: false })
      setYtLinks((yt.data as YouTubeLinkRow[]) || [])
    })
  }, [navigate])

  const filteredYt = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ytLinks
    return ytLinks.filter(l => (l.title || l.video_id).toLowerCase().includes(q))
  }, [query, ytLinks])

  // Show the page for admins even if no guest ID is set
  if (!currentId && !isAdmin) return null

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gallery</h2>
        <div className="text-sm text-slate-600">
          Logged in as <span className="font-semibold">{isAdmin ? 'Admin' : currentId}</span>
        </div>
      </div>
      
      <div className="mb-4">
        <input
          className="w-full max-w-lg rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"
          placeholder="Search videos by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {paths.map((name) => (
          <div key={name} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm flex items-center justify-center">
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/gallery/${encodeURIComponent(name)}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/vite.svg'
              }}
              alt={name}
            />
          </div>
        ))}
        {filteredYt.map(link => (
          <div key={link.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            <a
              href={`https://www.youtube.com/watch?v=${link.video_id}`}
              target="_blank"
              rel="noreferrer"
              className="block aspect-video bg-black"
            >
              <img
                src={`https://img.youtube.com/vi/${link.video_id}/hqdefault.jpg`}
                className="h-full w-full object-cover"
                alt={link.title || link.video_id}
              />
            </a>
            <div className="p-2">
              <div className="text-sm font-semibold text-slate-800 line-clamp-2">{link.title || 'YouTube Video'}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-slate-500">
        Want access? Ask admin to add your ID. <Link className="text-sky-600 hover:underline" to="/login">Login</Link>
      </div>
    </section>
  )
}


