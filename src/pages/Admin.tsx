import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { addAllowedId, getAllowedIds, getAuthState, removeAllowedId, setDisabled } from '../auth'
import { useNavigate } from 'react-router-dom'
import { supabase, type YouTubeLinkRow } from '../supabaseClient'

export default function Admin() {
  const navigate = useNavigate()
  const [newId, setNewId] = useState('')
  const [allowed, setAllowed] = useState<{ id: string; disabled: boolean }[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ytUrl, setYtUrl] = useState('')
  const [ytLinks, setYtLinks] = useState<YouTubeLinkRow[]>([])

  useEffect(() => {
    getAuthState().then(s => {
      if (!s.isAdmin) {
        navigate('/login')
        return
      }
      setIsAdmin(true)
      refresh()
    })
  }, [navigate])

  function refresh() {
    getAllowedIds().then(rows => {
      setAllowed(rows.map(r => ({ id: r.id, disabled: r.disabled })))
    })
    supabase.from('youtube_links').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setYtLinks((data as YouTubeLinkRow[]) || [])
    })
  }

  function onAddId(e: FormEvent) {
    e.preventDefault()
    addAllowedId(newId).then(err => {
      if (err) setMessage(err)
      else {
        setMessage('ID added')
        setNewId('')
        refresh()
      }
    })
  }

  function onRemove(id: string) {
    removeAllowedId(id).then(() => refresh())
  }

  function onToggle(id: string, isDisabled: boolean) {
    setDisabled(id, !isDisabled).then(() => refresh())
  }

  function parseYouTubeId(url: string): string | null {
    try {
      const u = new URL(url)
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v')
        return v
      }
      if (u.hostname === 'youtu.be') {
        return u.pathname.replace('/', '') || null
      }
      return null
    } catch {
      return null
    }
  }

  async function onAddYouTube(e: FormEvent) {
    e.preventDefault()
    const id = parseYouTubeId(ytUrl)
    if (!id) {
      setMessage('Please paste a valid YouTube URL')
      return
    }
    // Fetch title via YouTube oEmbed (no API key needed)
    let title: string | null = null
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`)
      if (res.ok) {
        const data = await res.json()
        title = data?.title || null
      }
    } catch {}
    const { error } = await supabase.from('youtube_links').insert({ video_id: id, title })
    if (error) setMessage('Failed to add link')
    else {
      setMessage('YouTube link added')
      setYtUrl('')
      refresh()
    }
  }

  function onRemoveYouTube(id: string) {
    supabase.from('youtube_links').delete().eq('id', id).then(() => refresh())
  }

  if (!isAdmin) return null

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      {message && <div className="mb-4 text-sm text-slate-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">{message}</div>}

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={onAddId} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold mb-3">Add Login ID</h3>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="e.g. family_member_1"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
          />
          <button className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 w-full">Add</button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold mb-3">Manage IDs</h3>
          {allowed.length === 0 ? (
            <div className="text-sm text-slate-500">No IDs yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-4">User ID</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allowed.map(({ id, disabled }) => (
                    <tr key={id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-medium">{id}</td>
                      <td className="py-2 pr-4">
                        {disabled ? <span className="text-red-600">Disabled</span> : <span className="text-emerald-700">Active</span>}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggle(id, disabled)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                          >
                            {disabled ? 'Enable' : 'Disable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemove(id)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <form onSubmit={onAddYouTube} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold mb-3">Add YouTube Link</h3>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="Paste YouTube URL (e.g., https://youtu.be/VIDEO_ID)"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
          />
          <button className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 w-full">Add Link</button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold mb-3">YouTube Links</h3>
          {ytLinks.length === 0 ? (
            <div className="text-sm text-slate-500">No videos yet</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ytLinks.map(link => (
                <div key={link.id} className="rounded-xl overflow-hidden border border-slate-200">
                  <a href={`https://www.youtube.com/watch?v=${link.video_id}`} target="_blank" rel="noreferrer">
                    <img
                      src={`https://img.youtube.com/vi/${link.video_id}/hqdefault.jpg`}
                      alt={link.title || link.video_id}
                      className="w-full h-32 object-cover"
                    />
                  </a>
                  <div className="p-2">
                    <div className="text-sm font-semibold text-slate-800 truncate">{link.title || link.video_id}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 truncate">{link.video_id}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveYouTube(link.id)}
                      className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Remove
                    </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}


