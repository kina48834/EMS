import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import type { Role } from '@/system/types'
import { profilePathForRole } from '@/profile/shared/roleMeta'
import { ROLE_NAV_LINKS } from '@/navigation/roleNav'
import { cn } from '@/lib/cn'

function RoleLabel({ role }: { role: Role }) {
  switch (role) {
    case 'resident':
      return <>Resident</>
    case 'barangayOfficial':
      return <>Barangay Official</>
    case 'emergencyResponders':
      return <>Emergency Responders</>
    case 'superAdmin':
      return <>System Admin</>
  }
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-5 w-6 flex-col justify-center" aria-hidden>
      <span
        className={cn(
          'absolute block h-0.5 w-6 rounded-full bg-white transition-all duration-200',
          open ? 'top-2 rotate-45' : 'top-0',
        )}
      />
      <span
        className={cn(
          'absolute top-2 block h-0.5 w-6 rounded-full bg-white transition-all duration-200',
          open ? 'opacity-0' : 'opacity-100',
        )}
      />
      <span
        className={cn(
          'absolute block h-0.5 w-6 rounded-full bg-white transition-all duration-200',
          open ? 'top-2 -rotate-45' : 'top-4',
        )}
      />
    </span>
  )
}

export default function AppShell() {
  const { user, logout } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [menuOpen])

  if (!user) return <Outlet />

  const links = ROLE_NAV_LINKS[user.role] ?? []
  const profilePath = profilePathForRole(user.role)
  const navLinks = links.filter((l) => !l.to.endsWith('/profile'))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md transition',
                'bg-ems-600 text-white hover:bg-ems-700 focus:outline-none focus:ring-2 focus:ring-ems-600/50 focus:ring-offset-2',
                menuOpen && 'ring-2 ring-ems-500/40 ring-offset-2',
              )}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <HamburgerIcon open={menuOpen} />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-[calc(100%+8px)] z-[60] w-[min(calc(100vw-2rem),280px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40"
              >
                <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">
                    <RoleLabel role={user.role} />
                  </div>
                </div>
                <nav className="flex flex-col gap-0.5 p-2">
                  {navLinks.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      end={l.end}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'rounded-xl px-3 py-2.5 text-sm font-medium transition',
                          isActive
                            ? 'bg-ems-600 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-ems-50 hover:text-ems-800',
                        )
                      }
                    >
                      {l.label}
                    </NavLink>
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-ems-50 hover:text-ems-800"
                    onClick={() => {
                      setMenuOpen(false)
                      navigate(profilePath)
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mt-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                      navigate('/login')
                    }}
                  >
                    Logout
                  </button>
                </nav>
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-xs font-bold text-white shadow-md shadow-ems-600/25">
              EMS
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
              <div className="truncate text-xs text-slate-500">
                <RoleLabel role={user.role} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/25"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
