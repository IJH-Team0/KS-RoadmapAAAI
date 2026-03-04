import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { fetchFeaturesNeedingBeoordeling, fetchFeaturesInStoriesMaken } from '@/lib/roadmap'

// Sidebar: alleen schermen waar iets gedaan moet worden (acties, werkstromen)
const sidebarProcessSteps: { to: string; label: string }[] = [
  { to: '/nieuw', label: 'Nieuwe aanvraag' },
  { to: '/backlog', label: 'Backlog' },
  { to: '/beoordelen', label: 'Beoordelen' },
  { to: '/stories-maken', label: 'User stories maken' },
  { to: '/planning', label: 'Planning (werkbord)' },
]

function isSidebarStepActive(pathname: string, to: string): boolean {
  return to !== '/' && pathname.startsWith(to)
}

// Header: overzichten en ophalen (waar iets gehaald kan worden)
const navGroups: { to: string; label: string }[][] = [
  [
    { to: '/', label: 'Dashboard' },
    { to: '/applicaties', label: 'Applicaties' },
    { to: '/applicaties-beheren', label: 'Applicaties beheren' },
    { to: '/roadmap', label: 'Roadmap' },
    { to: '/rapportage', label: 'Rapportage' },
    { to: '/uitleg', label: 'Uitleg' },
  ],
]

export function AppLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [beoordelenOpenCount, setBeoordelenOpenCount] = useState<number | null>(null)
  const [storiesMakenCount, setStoriesMakenCount] = useState<number | null>(null)

  useEffect(() => {
    fetchFeaturesNeedingBeoordeling()
      .then((rows) => setBeoordelenOpenCount(rows.length))
      .catch(() => setBeoordelenOpenCount(null))
  }, [location.pathname])

  useEffect(() => {
    fetchFeaturesInStoriesMaken()
      .then((rows) => setStoriesMakenCount(rows.length))
      .catch(() => setStoriesMakenCount(null))
  }, [location.pathname])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/backlog?zoek=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <div className="min-h-screen bg-ijsselheem-lichtblauw flex flex-col">
      {/* Bovenbalk: logo + navigatie + zoeken + profiel */}
      <header className="border-b border-ijsselheem-accentblauw/50 bg-white shrink-0">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <h1 className="text-lg font-bold text-ijsselheem-donkerblauw">
              <Link to="/">Roadmap AAAI</Link>
            </h1>
            <nav className="flex flex-wrap items-center gap-1">
              {navGroups.map((group, groupIdx) => (
                <span key={groupIdx} className="flex flex-wrap items-center gap-1">
                  {groupIdx > 0 && (
                    <span
                      className="mx-1 w-px self-stretch min-h-6 bg-ijsselheem-accentblauw/30"
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
                              : location.pathname.startsWith(to)
                    return (
                      <Link
                        key={to}
                        to={to}
                        className={cn(
                          'rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap',
                          isActive
                            ? 'bg-ijsselheem-lichtblauw text-ijsselheem-donkerblauw'
                            : 'text-ijsselheem-donkerblauw/80 hover:bg-ijsselheem-lichtblauw/70'
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
          <div className="flex items-center gap-2 flex-wrap">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Zoeken..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-1.5 text-sm w-40 min-w-0"
              />
              <button
                type="submit"
                className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 shrink-0"
              >
                Zoek
              </button>
            </form>
            <button
              type="button"
              className="rounded-ijsselheem-button border border-ijsselheem-accentblauw px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
            >
              Filter
            </button>
            <span className="text-sm text-ijsselheem-donkerblauw truncate max-w-[180px]" title={user?.email ?? ''}>
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline shrink-0"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      {/* Body: linkerkolom Roadmap + hoofdinhoud */}
      <div className="flex-1 flex min-h-0">
        <aside className="w-52 min-w-[13rem] border-r border-ijsselheem-accentblauw/30 bg-white flex flex-col shrink-0 overflow-y-auto">
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
                  {step.to === '/stories-maken' && storiesMakenCount !== null && (
                    <span
                      className={cn(
                        'shrink-0 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums',
                        storiesMakenCount > 0
                          ? 'bg-ijsselheem-donkerblauw text-white'
                          : 'bg-ijsselheem-accentblauw/20 text-ijsselheem-donkerblauw/70'
                      )}
                      title={storiesMakenCount === 0 ? 'Geen items in User stories maken' : `${storiesMakenCount} items`}
                    >
                      {storiesMakenCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
