import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { fetchAppsTestEnProductieNogNietPubliek } from '@/lib/apps'
import { fetchFeaturesNeedingBeoordeling, fetchFeaturesInStoriesMaken } from '@/lib/roadmap'
import { fetchWensenBakIngediendCount } from '@/lib/wensenBak'
import packageJson from '../../package.json'

// Sidebar: alleen schermen waar iets gedaan moet worden (acties, werkstromen)
const sidebarProcessSteps: { to: string; label: string }[] = [
  { to: '/nieuw/programma', label: 'Nieuwe applicatie' },
  { to: '/nieuw/feature', label: 'Nieuwe feature' },
  { to: '/wensen', label: 'Ingediende wensen' },
  { to: '/backlog', label: 'Backlog' },
  { to: '/beoordelen', label: 'Beoordelen' },
  { to: '/stories-maken', label: 'User stories of taken maken' },
  { to: '/planning', label: 'Planning (werkbord)' },
  { to: '/publicatie-afronden', label: 'Publicatie afronden' },
]

function isSidebarStepActive(pathname: string, to: string): boolean {
  return to !== '/' && pathname.startsWith(to)
}

// Header: overzichten. Gebruiker: beperkte nav; admin: volledige nav + Beheer.
function getNavGroups(role: string | null): { to: string; label: string }[][] {
  if (role === 'gebruiker') {
    return [[
      { to: '/', label: 'Home' },
      { to: '/roadmap', label: 'Roadmap' },
      { to: '/applicaties', label: 'Applicaties' },
      { to: '/wensen', label: 'Wensen' },
      { to: '/wens-indienen', label: 'Wens indienen' },
    ]]
  }
  const main = [
    { to: '/', label: 'Dashboard' },
    { to: '/applicaties-beheren', label: 'Applicatiebeheer' },
    { to: '/roadmap', label: 'Roadmap' },
    { to: '/rapportage', label: 'Rapportage' },
  ]
  if (role === 'admin') {
    return [[...main, { to: '/beheer', label: 'Beheer' }]]
  }
  return [main]
}

const ADMIN_ONLY_PATHS = [
  '/backlog', '/beoordelen', '/stories-maken', '/planning', '/nieuw',
  '/applicaties-beheren', '/beheer', '/rapportage', '/uitleg',
]

function getInitials(displayName: string | null, email: string | undefined): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) {
      const first = parts[0].charAt(0)
      const last = parts[parts.length - 1].charAt(0)
      if (first && last) return (first + last).toUpperCase()
    }
    if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase()
    return parts[0].charAt(0).toUpperCase() || '?'
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

export function AppLayout() {
  const { user, role, displayName, effectiveRole, setViewAsRole, signOut } = useAuth()
  const initials = getInitials(displayName, user?.email)
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const [beoordelenOpenCount, setBeoordelenOpenCount] = useState<number | null>(null)
  const [storiesMakenCount, setStoriesMakenCount] = useState<number | null>(null)
  const [wensenIngediendCount, setWensenIngediendCount] = useState<number | null>(null)
  const [publicatieAfrondenCount, setPublicatieAfrondenCount] = useState<number | null>(null)

  useEffect(() => {
    if (role !== 'admin') return
    fetchFeaturesNeedingBeoordeling()
      .then((rows) => setBeoordelenOpenCount(rows.length))
      .catch(() => setBeoordelenOpenCount(null))
  }, [location.pathname, role])

  useEffect(() => {
    if (role !== 'admin') return
    fetchFeaturesInStoriesMaken()
      .then((rows) => setStoriesMakenCount(rows.length))
      .catch(() => setStoriesMakenCount(null))
  }, [location.pathname, role])

  useEffect(() => {
    if (role !== 'admin') return
    fetchWensenBakIngediendCount()
      .then(setWensenIngediendCount)
      .catch(() => setWensenIngediendCount(null))
  }, [location.pathname, role])

  useEffect(() => {
    // #region agent log
    if (role !== 'admin') {
      fetch('http://127.0.0.1:7246/ingest/788b46d0-c7c1-4f39-873b-903ba7f3eb27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppLayout.tsx:publicatie-useEffect',message:'publicatie count effect skipped',data:{role,hypothesisId:'H2'},timestamp:Date.now()})}).catch(()=>{});
      return
    }
    fetchAppsTestEnProductieNogNietPubliek()
      .then((apps) => {
        const count = apps.length
        fetch('http://127.0.0.1:7246/ingest/788b46d0-c7c1-4f39-873b-903ba7f3eb27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppLayout.tsx:publicatie-useEffect',message:'publicatie count set',data:{count,hypothesisId:'H1'},timestamp:Date.now()})}).catch(()=>{});
        setPublicatieAfrondenCount(count)
      })
      .catch((err) => {
        fetch('http://127.0.0.1:7246/ingest/788b46d0-c7c1-4f39-873b-903ba7f3eb27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppLayout.tsx:publicatie-useEffect',message:'publicatie fetch failed',data:{err: String(err),hypothesisId:'H3'},timestamp:Date.now()})}).catch(()=>{});
        setPublicatieAfrondenCount(null)
      })
    // #endregion
  }, [location.pathname, role])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false)
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [profileOpen])

  const isAdminPath = ADMIN_ONLY_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))
  const showSidebar = effectiveRole === 'admin'

  // Applicaties-pagina is alleen voor gebruikers; admin wordt doorgestuurd
  if (effectiveRole === 'admin' && location.pathname === '/applicaties') {
    return <Navigate to="/applicaties-beheren" replace />
  }

  const headerBg = effectiveRole === 'gebruiker' || effectiveRole === 'admin'
    ? 'bg-ijsselheem-donkerblauw'
    : 'bg-white'
  const headerLinkActive = effectiveRole === 'gebruiker' || effectiveRole === 'admin'
    ? 'bg-white/20 text-white'
    : 'bg-ijsselheem-lichtblauw text-ijsselheem-donkerblauw'
  const headerLinkInactive = effectiveRole === 'gebruiker' || effectiveRole === 'admin'
    ? 'text-white/90 hover:bg-white/15'
    : 'text-ijsselheem-donkerblauw/80 hover:bg-ijsselheem-lichtblauw/70'
  const headerBorder = effectiveRole === 'gebruiker' || effectiveRole === 'admin' ? 'border-white/20' : 'border-ijsselheem-accentblauw/50'
  /** Profielknop: ronde witte badge met donkerblauwe initialen; focusring donkerblauw zodat zichtbaar op wit */
  const profileButtonBg = 'bg-white text-ijsselheem-donkerblauw'
  const profileFocusRing = 'focus:ring-ijsselheem-donkerblauw/50'

  if (effectiveRole === 'gebruiker' && isAdminPath) {
    return <Navigate to="/" replace />
  }

  const mainBg = effectiveRole === 'gebruiker' ? 'bg-ijsselheem-pastelgroen' : 'bg-ijsselheem-lichtblauw'
  const appVersion = packageJson.version
  return (
    <div className={cn('min-h-screen flex flex-col', mainBg)}>
      {/* Bovenbalk: logo + navigatie + profiel */}
      <header className={cn('relative z-30 border-b shrink-0', headerBorder, headerBg)}>
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <Link to="/" className="hover:opacity-90 flex items-center shrink-0" aria-label="Roadmap AAAI - startpagina">
              <img src="/logo-witte-tekst.svg" alt="Roadmap AAAI" className="h-8 w-auto" />
            </Link>
            <nav className="flex flex-wrap items-center gap-1">
              {getNavGroups(effectiveRole).map((group, groupIdx) => (
                <span key={groupIdx} className="flex flex-wrap items-center gap-1">
                  {groupIdx > 0 && (
                    <span
                      className="mx-1 w-px self-stretch min-h-6 bg-current opacity-40"
                      aria-hidden
                    />
                  )}
                  {group.map(({ to, label }) => {
                    const isActive =
                      to === '/'
                        ? location.pathname === '/'
                        : to === '/applicaties'
                          ? location.pathname === '/applicaties'
                          : to === '/applicaties-beheren'
                            ? location.pathname.startsWith('/applicaties-beheren')
                            : to === '/roadmap'
                              ? location.pathname === '/roadmap'
                              : to === '/wens-indienen'
                                ? location.pathname === '/wens-indienen'
                                : location.pathname.startsWith(to)
                    return (
                      <Link
                        key={to}
                        to={to}
                        className={cn(
                          'rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap',
                          isActive ? headerLinkActive : headerLinkInactive
                        )}
                      >
                        {label}
                      </Link>
                    )
                  })}
                </span>
              ))}
            </nav>
          </div>
          <div className="relative flex items-center gap-2 flex-wrap" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className={cn(
                'rounded-full w-9 h-9 flex items-center justify-center text-sm font-semibold transition hover:opacity-90 focus:outline-none focus:ring-2 shrink-0',
                profileButtonBg,
                profileFocusRing
              )}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="Profielmenu"
              title={user?.email ?? ''}
            >
              {initials}
            </button>
            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-1 py-1 min-w-[13rem] w-max rounded-lg border border-ijsselheem-accentblauw/30 bg-white shadow-lg z-[100] whitespace-nowrap"
                role="menu"
              >
                <Link
                  to="/uitleg"
                  onClick={() => setProfileOpen(false)}
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
                  role="menuitem"
                >
                  Uitleg
                </Link>
                {role === 'admin' && (
                  effectiveRole === 'admin' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setViewAsRole('gebruiker')
                        setProfileOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
                      role="menuitem"
                    >
                      Bekijk als gebruiker
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setViewAsRole('admin')
                        setProfileOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
                      role="menuitem"
                    >
                      Bekijk als admin
                    </button>
                  )
                )}
                <div className="border-t border-ijsselheem-accentblauw/20 mt-1 pt-1">
                  <div className="px-4 py-2 text-xs text-ijsselheem-donkerblauw/70">
                    Versie v{appVersion}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      signOut()
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
                    role="menuitem"
                  >
                    Uitloggen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body: sidebar alleen voor admin, anders alleen hoofdinhoud */}
      <div className="flex-1 flex min-h-0">
        {showSidebar ? (
        <aside className="w-60 min-w-[15rem] border-r border-ijsselheem-accentblauw/30 bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-ijsselheem-accentblauw/30">
            <h2 className="text-sm font-semibold uppercase text-ijsselheem-donkerblauw/80">Werkstromen</h2>
          </div>
          <nav className="p-3 space-y-1" aria-label="Werkstromen">
            {sidebarProcessSteps.map((step, index) => {
              const active = isSidebarStepActive(location.pathname, step.to)
              return (
                <Link
                  key={step.to}
                  to={step.to}
                  className={cn(
                    'flex gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-ijsselheem-lichtblauw text-ijsselheem-donkerblauw'
                      : 'text-ijsselheem-donkerblauw/80 hover:bg-ijsselheem-lichtblauw/70'
                  )}
                >
                  <span className="shrink-0 w-5 text-ijsselheem-donkerblauw/70 tabular-nums">{index + 1}.</span>
                  <span className="min-w-0 truncate">{step.label}</span>
                  {step.to === '/beoordelen' && beoordelenOpenCount !== null && (
                    <span
                      className={cn(
                        'shrink-0 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums',
                        beoordelenOpenCount > 0
                          ? 'bg-ijsselheem-donkerblauw text-white'
                          : 'bg-ijsselheem-accentblauw/20 text-ijsselheem-donkerblauw/70'
                      )}
                      title={beoordelenOpenCount === 0 ? 'Geen openstaande beoordelingen' : `${beoordelenOpenCount} openstaand`}
                    >
                      {beoordelenOpenCount}
                    </span>
                  )}
                  {step.to === '/wensen' && wensenIngediendCount !== null && (
                    <span
                      className={cn(
                        'shrink-0 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums',
                        wensenIngediendCount > 0
                          ? 'bg-ijsselheem-donkerblauw text-white'
                          : 'bg-ijsselheem-accentblauw/20 text-ijsselheem-donkerblauw/70'
                      )}
                      title={wensenIngediendCount === 0 ? 'Geen ingediende wensen' : `${wensenIngediendCount} ingediend`}
                    >
                      {wensenIngediendCount}
                    </span>
                  )}
                  {step.to === '/stories-maken' && storiesMakenCount !== null && (
                    <span
                      className={cn(
                        'shrink-0 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums',
                        storiesMakenCount > 0
                          ? 'bg-ijsselheem-donkerblauw text-white'
                          : 'bg-ijsselheem-accentblauw/20 text-ijsselheem-donkerblauw/70'
                      )}
                      title={storiesMakenCount === 0 ? 'Geen items in User stories of taken maken' : `${storiesMakenCount} items`}
                    >
                      {storiesMakenCount}
                    </span>
                  )}
                  {step.to === '/publicatie-afronden' && publicatieAfrondenCount !== null && (
                    <span
                      className={cn(
                        'shrink-0 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums',
                        publicatieAfrondenCount > 0
                          ? 'bg-ijsselheem-donkerblauw text-white'
                          : 'bg-ijsselheem-accentblauw/20 text-ijsselheem-donkerblauw/70'
                      )}
                      title={publicatieAfrondenCount === 0 ? 'Geen apps die nog publiek gezet moeten worden' : `${publicatieAfrondenCount} apps`}
                    >
                      {publicatieAfrondenCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>
        ) : null}
        <main className="flex-1 overflow-auto p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
