import { useState, useEffect, useMemo } from 'react'
import { X, ChevronDown, ExternalLink, Info, Search } from 'lucide-react'
import { fetchAppsTestEnProductie } from '@/lib/apps'
import { getAppIcon } from '@/lib/appIcons'
import type { App } from '@/types/app'
import { DOMEIN_OPTIONS } from '@/types/app'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'in_productie' | 'in_testfase'

function AppTegel({
  app,
  expandedId,
  onToggleUitleg,
  onMeerInfoClick,
}: {
  app: App
  expandedId: string | null
  onToggleUitleg: (id: string) => void
  onMeerInfoClick: (app: App) => void
}) {
  const url = app.status === 'in_productie' ? app.url_productie : app.url_test
  const hasUitleg = app.doel_app != null && app.doel_app.trim() !== ''
  const isExpanded = expandedId === app.id
  const IconComponent = getAppIcon(app.icon_key)
  const isTest = app.status === 'in_testfase'
  const accentBorder = isTest ? 'border-ijsselheem-oranje/25' : 'border-ijsselheem-olijfgroen/25'
  const accentBar = isTest
    ? 'bg-gradient-to-r from-ijsselheem-oranje/50 to-ijsselheem-oranje/20'
    : 'bg-gradient-to-r from-ijsselheem-olijfgroen/50 to-ijsselheem-olijfgroen/20'
  const accentIconBg = isTest ? 'bg-ijsselheem-oranje/25' : 'bg-ijsselheem-olijfgroen/25'
  const accentDivider = isTest ? 'border-ijsselheem-oranje/20' : 'border-ijsselheem-olijfgroen/20'

  return (
    <article
      className={cn(
        'rounded-xl border bg-white overflow-hidden',
        accentBorder,
        'shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        'flex flex-col min-h-0'
      )}
    >
      <div className={cn('h-1 w-full', accentBar)} aria-hidden />

      <div className="p-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ijsselheem-donkerblauw',
              accentIconBg
            )}
          >
            <IconComponent className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-ijsselheem-donkerblauw tracking-tight">
                {app.naam}
              </h2>
              {isTest && (
                <span className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-ijsselheem-oranje/20 text-ijsselheem-donkerblauw">
                  In test
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold',
                'bg-ijsselheem-donkerblauw text-white hover:bg-ijsselheem-donkerblauw/90',
                'transition shadow-sm hover:shadow'
              )}
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              Open app
            </a>
          ) : (
            <span className="text-sm text-ijsselheem-donkerblauw/60">
              Geen URL ingesteld
            </span>
          )}
          <button
            type="button"
            onClick={() => onMeerInfoClick(app)}
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium text-ijsselheem-donkerblauw/80',
              'hover:text-ijsselheem-donkerblauw hover:underline'
            )}
          >
            <Info className="w-3.5 h-3.5" aria-hidden />
            Meer info
          </button>
        </div>

        {hasUitleg && (
          <div className={cn('mt-3 pt-3 border-t', accentDivider)}>
            <button
              type="button"
              onClick={() => onToggleUitleg(app.id)}
              className={cn(
                'flex items-center gap-2 text-sm font-medium text-ijsselheem-donkerblauw/90',
                'hover:text-ijsselheem-donkerblauw transition-colors'
              )}
            >
              <ChevronDown
                className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180')}
                aria-hidden
              />
              Wat doet deze app?
            </button>
            {isExpanded && (
              <p className="mt-2 pl-5 text-sm text-ijsselheem-donkerblauw/85 leading-relaxed">
                {app.doel_app}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export function Applicaties() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedAppForModal, setSelectedAppForModal] = useState<App | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDomein, setFilterDomein] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return apps.filter((app) => {
      if (q) {
        const matchNaam = app.naam.toLowerCase().includes(q)
        const matchDoel = app.doel_app?.toLowerCase().includes(q)
        if (!matchNaam && !matchDoel) return false
      }
      if (filterDomein && app.domein !== filterDomein) return false
      if (filterStatus === 'in_productie' && app.status !== 'in_productie') return false
      if (filterStatus === 'in_testfase' && app.status !== 'in_testfase') return false
      return true
    })
  }, [apps, searchQuery, filterDomein, filterStatus])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAppForModal(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchAppsTestEnProductie()
      .then((data) => {
        if (!cancelled) setApps(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggleUitleg = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleMeerInfoClick = (app: App) => {
    setSelectedAppForModal(app)
  }

  const countProductie = apps.filter((a) => a.status === 'in_productie').length
  const countTest = apps.filter((a) => a.status === 'in_testfase').length

  const STATUS_PILLS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: `Alle (${apps.length})` },
    { value: 'in_productie', label: `In productie (${countProductie})` },
    { value: 'in_testfase', label: `In test (${countTest})` },
  ]

  return (
    <main className="flex-1 overflow-auto">
      <div className="min-h-full bg-gradient-to-b from-ijsselheem-pastelgroen/80 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <header className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-ijsselheem-donkerblauw tracking-tight">
              Applicaties
            </h1>
            <p className="mt-1 text-sm text-ijsselheem-donkerblauw/80 max-w-2xl">
              Overzicht van applicaties in test of in productie. Open een app of bekijk meer toelichting via Meer info.
            </p>
          </header>

          {loading ? (
            <div className="flex items-center gap-3 py-12 text-ijsselheem-donkerblauw/80">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-ijsselheem-donkerblauw/30 border-t-ijsselheem-donkerblauw" aria-hidden />
              <span>Laden…</span>
            </div>
          ) : (
            <>
              {/* Filterbalk: zoeken + status pills + domein pills */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <label className="sr-only" htmlFor="applicaties-zoeken">
                  Zoeken op naam
                </label>
                <span className="relative flex items-center w-full sm:w-auto sm:min-w-[200px]">
                  <Search className="absolute left-3 w-4 h-4 text-ijsselheem-donkerblauw/50 pointer-events-none" aria-hidden />
                  <input
                    id="applicaties-zoeken"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Zoeken op naam…"
                    className="w-full rounded-lg border border-ijsselheem-accentblauw/50 py-2 pl-9 pr-3 text-sm text-ijsselheem-donkerblauw placeholder:text-ijsselheem-donkerblauw/50 focus:outline-none focus:ring-2 focus:ring-ijsselheem-donkerblauw/40"
                  />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ijsselheem-donkerblauw">Status:</span>
                  <div className="flex flex-wrap gap-1">
                    {STATUS_PILLS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFilterStatus(value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-sm font-medium transition',
                          filterStatus === value
                            ? 'bg-ijsselheem-donkerblauw text-white border-ijsselheem-donkerblauw'
                            : 'bg-white text-ijsselheem-donkerblauw border-ijsselheem-accentblauw/50 hover:bg-ijsselheem-lichtblauw/50'
                        )}
                        aria-pressed={filterStatus === value}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ijsselheem-donkerblauw">Domein:</span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setFilterDomein('')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-sm font-medium transition',
                        filterDomein === ''
                          ? 'bg-ijsselheem-donkerblauw text-white border-ijsselheem-donkerblauw'
                          : 'bg-white text-ijsselheem-donkerblauw border-ijsselheem-accentblauw/50 hover:bg-ijsselheem-lichtblauw/50'
                      )}
                      aria-pressed={filterDomein === ''}
                    >
                      Alle domeinen
                    </button>
                    {DOMEIN_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFilterDomein(d)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-sm font-medium transition',
                          filterDomein === d
                            ? 'bg-ijsselheem-donkerblauw text-white border-ijsselheem-donkerblauw'
                            : 'bg-white text-ijsselheem-donkerblauw border-ijsselheem-accentblauw/50 hover:bg-ijsselheem-lichtblauw/50'
                        )}
                        aria-pressed={filterDomein === d}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Applicatielijst: volle breedte, 3 kolommen */}
              {apps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ijsselheem-olijfgroen/40 bg-white/60 py-16 px-6 text-center">
                  <p className="text-ijsselheem-donkerblauw/80">Er staan nog geen applicaties in test of productie.</p>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ijsselheem-olijfgroen/40 bg-white/60 py-16 px-6 text-center">
                  <p className="text-ijsselheem-donkerblauw/80">Geen applicaties gevonden. Pas filters of zoekterm aan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredApps.map((app) => (
                    <AppTegel
                      key={app.id}
                      app={app}
                      expandedId={expandedId}
                      onToggleUitleg={handleToggleUitleg}
                      onMeerInfoClick={handleMeerInfoClick}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Meer info modal */}
      {selectedAppForModal != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ijsselheem-donkerblauw/40 backdrop-blur-sm"
          onClick={() => setSelectedAppForModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="meer-info-modal-title"
        >
          <div
            className="rounded-2xl border border-ijsselheem-olijfgroen/30 bg-white shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 p-5 border-b border-ijsselheem-olijfgroen/20">
              <h2 id="meer-info-modal-title" className="text-xl font-bold text-ijsselheem-donkerblauw">
                {selectedAppForModal.naam}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedAppForModal(null)}
                className="rounded-xl p-2 text-ijsselheem-donkerblauw/80 hover:bg-ijsselheem-pastelgroen/50 hover:text-ijsselheem-donkerblauw transition-colors"
                aria-label="Sluiten"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 min-h-0">
              <p className="text-ijsselheem-donkerblauw/90 whitespace-pre-wrap leading-relaxed">
                {selectedAppForModal.doel_app?.trim()
                  ? selectedAppForModal.doel_app
                  : 'Geen beschrijving.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 p-5 border-t border-ijsselheem-olijfgroen/20 bg-ijsselheem-pastelgroen/50">
              <button
                type="button"
                onClick={() => setSelectedAppForModal(null)}
                className="rounded-xl border border-ijsselheem-olijfgroen/60 px-4 py-2.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-pastelgroen/50 transition"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
