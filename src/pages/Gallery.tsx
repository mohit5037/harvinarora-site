import { useEffect, useMemo, useState } from 'react'
import { getAuthState } from '../auth'
import { Link } from 'react-router-dom'
import { supabase, type YouTubeLinkRow } from '../supabaseClient'

// Public photos visible to everyone (place these in public/gallery/)
const PUBLIC_PHOTOS = [
  '/gallery/photo1.jpg',
  '/gallery/photo2.jpg',
  '/gallery/photo3.jpg',
  '/gallery/photo4.jpg'
]

export default function Gallery() {
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [paths, setPaths] = useState<string[]>([])
  const [ytLinks, setYtLinks] = useState<YouTubeLinkRow[]>([])
  const [query, setQuery] = useState('')
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null)

  useEffect(() => {
    getAuthState().then(async (s) => {
      setCurrentId(s.currentUserId)
      setIsAdmin(s.isAdmin)
      
      // Only load protected content if logged in
      if (s.currentUserId || s.isAdmin) {
        const { data } = await supabase.storage.from('gallery').list('', { limit: 100 })
        const files = (data || []).filter(f => f.name && !f.name.endsWith('/')).map(f => f.name)
        setPaths(files)
        const yt = await supabase.from('youtube_links').select('*').order('created_at', { ascending: false })
        setYtLinks((yt.data as YouTubeLinkRow[]) || [])
      }
      
      setIsLoading(false)
    })
  }, [])

  const filteredYt = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ytLinks
    return ytLinks.filter(l => (l.title || l.video_id).toLowerCase().includes(q))
  }, [query, ytLinks])

  const isLoggedIn = currentId || isAdmin

  // Close modal on ESC key
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setFullSizeImage(null)
    }
    if (fullSizeImage) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [fullSizeImage])

  if (isLoading) return null

  return (
    <section>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Gallery</h2>
        {isLoggedIn ? (
          <div className="text-sm text-slate-600">
            Logged in as <span className="font-semibold">{isAdmin ? 'Admin' : currentId}</span>
          </div>
        ) : (
          <Link to="/login" className="text-sm text-sky-600 hover:underline font-medium">Login for more</Link>
        )}
      </div>

      {/* Public photos - visible to everyone */}
      {!isLoggedIn && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-slate-700">Preview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PUBLIC_PHOTOS.map((src, idx) => (
              <div 
                key={idx} 
                className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setFullSizeImage(src)}
              >
                <img
                  src={src}
                  className="h-full w-full object-cover"
                  alt={`Baby photo ${idx + 1}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-sky-50 border border-sky-200">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Want to see more?</span> Login to access the full gallery with photos and videos.
            </p>
          </div>
        </div>
      )}

      {/* Protected content - only visible when logged in */}
      {isLoggedIn && (
        <>
          {ytLinks.length > 0 && (
            <div className="mb-4">
              <input
                className="w-full max-w-lg rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="Search videos by title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Show public photos first, then protected gallery */}
            {PUBLIC_PHOTOS.map((src, idx) => (
              <div 
                key={`public-${idx}`} 
                className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setFullSizeImage(src)}
              >
                <img
                  src={src}
                  className="h-full w-full object-cover"
                  alt={`Baby photo ${idx + 1}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            ))}
            
            {paths.map((name) => {
              const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/gallery/${encodeURIComponent(name)}`
              return (
                <div 
                  key={name} 
                  className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setFullSizeImage(imageUrl)}
                >
                  <img
                    src={imageUrl}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/vite.svg'
                    }}
                    alt={name}
                  />
                </div>
              )
            })}
            
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
        </>
      )}

      {/* Full-size image modal */}
      {fullSizeImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullSizeImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-slate-300 text-3xl font-bold z-10 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full"
            onClick={() => setFullSizeImage(null)}
            aria-label="Close"
          >
            ×
          </button>
          <img
            src={fullSizeImage}
            className="max-w-full max-h-full object-contain"
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}


