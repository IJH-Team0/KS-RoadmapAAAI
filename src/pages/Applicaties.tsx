import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CircleDot,
  Globe,
  FileText,
  BarChart3,
  LayoutDashboard,
  FormInput,
  Settings,
  Users,
  Calendar,
  ClipboardList,
  Link as LinkIcon,
  X,
  type LucideIcon,
} from 'lucide-react'
import { fetchAppsTestEnProductie } from '@/lib/apps'
import type { App } from '@/types/app'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  'circle-dot': CircleDot,
  globe: Globe,
  'file-text': FileText,
  'bar-chart-3': BarChart3,
  'layout-dashboard': LayoutDashboard,
  'form-input': FormInput,
  settings: Settings,
  users: Users,
  calendar: Calendar,
  'clipboard-list': ClipboardList,
  link: LinkIcon,
}

function getAppIcon(iconKey: string | null): LucideIcon {
  if (iconKey && ICON_MAP[iconKey]) return ICON_MAP[iconKey]
  return CircleDot
}

function AppTegel({
  app,
  isProductie,
  expandedId,
  onToggleUitleg,
  onMeerInfoClick,
}: {
  app: App
  isProductie: boolean
  expandedId: string | null
  onToggleUitleg: (id: string) => void
  onMeerInfoClick: (app: App) => void
}) {
  const url = isProductie ? app.url_productie : app.url_test
  const hasUitleg = app.doel_app != null && app.doel_app.trim() !== ''
  const isExpanded = expandedId === app.id
  const IconComponent = getAppIcon(app.icon_key)

  const headerContent = (
    <>
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          isProductie ? 'bg-ijsselheem-olijfgroen/20 text-ijsselheem-donkerblauw' : 'bg-ijsselheem-lichtblauw text-ijsselheem-donkerblauw'
        )}
      >
        <IconComponent className="h-5 w-5" strokeWidth={2} />
      </span>
      <h2 className="text-lg font-semibold text-ijsselheem-donkerblauw min-w-0">
        {app.naam}
      </h2>
    </>
  )

  return (
    <article
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col min-h-0 transition hover:shadow',
        'border-l-4',
        isProductie ? 'border-l-ijsselheem-olijfgroen' : 'border-l-ijsselheem-accentblauw'
      )}
    >
      <div className="flex items-center gap-3">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90"
          >
            {headerContent}
          </a>
        ) : (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {headerContent}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Open app →
          </a>
        )}
        {!url && (
          <span className="text-sm text-ijsselheem-donkerblauw/70">
            Geen URL ingesteld.
          </span>
        )}
        <button
          type="button"
          onClick={() => onMeerInfoClick(app)}
          className="text-sm font-medium text-ijsselheem-donkerblauw/80 underline hover:no-underline text-left"
        >
          Meer info
        </button>
      </div>

      {hasUitleg && (
        <div className="mt-4 mt-auto">
          <button
            type="button"
            onClick={() => onToggleUitleg(app.id)}
            className="flex items-center gap-2 text-sm font-medium text-ijsselheem-donkerblauw hover:underline"
          >
            <span
              className={cn(
                'inline-block transition-transform',
                isExpanded && 'rotate-90'
              )}
            >
              ▶
            </span>
            Wat doet deze app?
          </button>
          {isExpanded && (
            <p className="mt-2 pl-5 text-sm text-ijsselheem-donkerblauw/90">
              {app.doel_app}
            </p>
          )}
        </div>
      )}
    </article>
  )
}

export function Applicaties() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedAppForModal, setSelectedAppForModal] = useState<App | null>(null)

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

  const inProductie = apps.filter((a) => a.status === 'in_productie')
  const inTest = apps.filter((a) => a.status === 'in_testfase')

  const handleToggleUitleg = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleMeerInfoClick = (app: App) => {
    setSelectedAppForModal(app)
  }

  return (
    <main className="flex-1 p-6 overflow-auto bg-white">
      {selectedAppForModal != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={() => setSelectedAppForModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="meer-info-modal-title"
        >
          <div
            className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 p-4 border-b border-ijsselheem-accentblauw/30">
              <h2 id="meer-info-modal-title" className="text-lg font-semibold text-ijsselheem-donkerblauw">
                {selectedAppForModal.naam}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedAppForModal(null)}
                className="rounded p-1 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw/50"
                aria-label="Sluiten"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              <p className="text-sm text-ijsselheem-donkerblauw/90 whitespace-pre-wrap">
                {selectedAppForModal.doel_app?.trim()
                  ? selectedAppForModal.doel_app
                  : 'Geen beschrijving.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 p-4 border-t border-ijsselheem-accentblauw/30">
              <Link
                to={`/backlog/${selectedAppForModal.id}`}
                className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Hele app openen
              </Link>
              <button
                type="button"
                onClick={() => setSelectedAppForModal(null)}
                className="rounded-ijsselheem-button border border-ijsselheem-accentblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw/50"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto rounded-xl bg-white shadow-sm p-6">
        <h1 className="text-2xl font-bold text-ijsselheem-donkerblauw mb-2">
          Startpagina applicaties
        </h1>
        <p className="text-sm text-ijsselheem-donkerblauw/90 mb-8">
          Overzicht van alle applicaties die in test of in productie staan. Klik op de titel of het
          icoon om de app te openen. Gebruik <strong>Meer info</strong> voor het volledige overzicht
          (doel, eigenaar, documentatie, URLs en icoon bewerken).
        </p>

        {loading ? (
          <p className="text-ijsselheem-donkerblauw py-4">Laden…</p>
        ) : apps.length === 0 ? (
          <p className="text-ijsselheem-donkerblauw py-4">Geen applicaties in test of productie.</p>
        ) : (
          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 shrink-0 rounded-full bg-ijsselheem-olijfgroen"
                  aria-hidden
                />
                <h2 className="text-lg font-semibold text-ijsselheem-donkerblauw">
                  In productie {inProductie.length > 0 && `(${inProductie.length})`}
                </h2>
              </div>
              <p className="text-sm text-ijsselheem-donkerblauw/80 mb-5">Live applicaties.</p>
              {inProductie.length === 0 ? (
                <p className="text-ijsselheem-donkerblauw/80 py-2">Geen applicaties in productie.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProductie.map((app) => (
                    <AppTegel
                      key={app.id}
                      app={app}
                      isProductie
                      expandedId={expandedId}
                      onToggleUitleg={handleToggleUitleg}
                      onMeerInfoClick={handleMeerInfoClick}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 shrink-0 rounded-full bg-ijsselheem-accentblauw"
                  aria-hidden
                />
                <h2 className="text-lg font-semibold text-ijsselheem-donkerblauw">
                  In test {inTest.length > 0 && `(${inTest.length})`}
                </h2>
              </div>
              <p className="text-sm text-ijsselheem-donkerblauw/80 mb-5">
                Applicaties in testfase.
              </p>
              {inTest.length === 0 ? (
                <p className="text-ijsselheem-donkerblauw/80 py-2">Geen applicaties in test.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inTest.map((app) => (
                    <AppTegel
                      key={app.id}
                      app={app}
                      isProductie={false}
                      expandedId={expandedId}
                      onToggleUitleg={handleToggleUitleg}
                      onMeerInfoClick={handleMeerInfoClick}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
