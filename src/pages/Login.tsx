import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { getAuthState, loginAdminWithEmail, loginUser, logout } from '../auth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentGuest, setCurrentGuest] = useState<string | null>(null)

  useEffect(() => {
    getAuthState().then(s => {
      setIsAdmin(s.isAdmin)
      setCurrentGuest(s.currentUserId)
    })
  }, [])

  function onUserLogin(e: FormEvent) {
    e.preventDefault()
    loginUser(userId).then(err => {
      if (err) setError(err)
      else {
        setError(null)
        navigate('/gallery')
      }
    })
  }

  function onAdminLogin(e: FormEvent) {
    e.preventDefault()
    loginAdminWithEmail(adminEmail, adminPass).then(err => {
      if (err) setError(err)
      else {
        setError(null)
        navigate('/settings')
      }
    })
  }

  return (
    <section className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      {currentGuest || isAdmin ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-4">
            {isAdmin ? (
              <div className="text-sm text-slate-600">Logged in as <span className="font-semibold">Admin</span></div>
            ) : (
              <div className="text-sm text-slate-600">Logged in as <span className="font-semibold">{currentGuest}</span></div>
            )}
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
            onClick={() => { logout().then(() => navigate('/')); }}
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          <form onSubmit={onUserLogin} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Guest Login</h3>
            <label className="block text-sm text-slate-600 mb-1">User ID</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Enter your ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
            <button className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 w-full">Login</button>
          </form>

          <form onSubmit={onAdminLogin} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Admin Login</h3>
            <label className="block text-sm text-slate-600 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="admin email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
            <label className="block text-sm text-slate-600 mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Enter admin password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
            />
            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
            <button className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 w-full">Login as Admin</button>
          </form>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-4">Note: IDs are validated against Supabase; admin uses Supabase Auth.</p>
    </section>
  )
}


