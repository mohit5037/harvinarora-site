import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAuthState, logout } from './auth'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    getAuthState().then(s => {
      setIsAdmin(s.isAdmin)
      setIsGuest(!!s.currentUserId)
    })
  }, [location.pathname])

  const linkBase = "px-3 py-2 rounded-lg text-sm font-medium"
  const active = " bg-sky-600 text-white"
  const inactive = " hover:bg-sky-100"

  function isActive(path: string) {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white text-slate-800">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="harvin-container flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold shadow-sm">H</div>
            <div className="leading-tight">
              <div className="text-lg font-bold">Harvin Arora</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link className={linkBase + (isActive('/') ? active : inactive)} to="/">Home</Link>
            <Link className={linkBase + (isActive('/gallery') ? active : inactive)} to="/gallery">Gallery</Link>
            {isAdmin && (
              <Link className={linkBase + (isActive('/settings') ? active : inactive)} to="/settings">Settings</Link>
            )}
            {(isAdmin || isGuest) ? (
              <button
                className={linkBase + inactive}
                onClick={() => { logout().then(() => navigate('/')); }}
              >
                Logout
              </button>
            ) : (
              <Link className={linkBase + (isActive('/login') ? active : inactive)} to="/login">Login</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="harvin-container py-6 sm:py-10">
        <Outlet />
      </main>
      <footer className="mt-12 border-t border-slate-200">
        <div className="harvin-container py-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} Harvin Arora</div>
          <Link to="/settings" className="hover:text-slate-700">Settings</Link>
        </div>
      </footer>
    </div>
  )
}

export default App
