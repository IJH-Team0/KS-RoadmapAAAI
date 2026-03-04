import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllApps } from '@/lib/apps'
import type { App } from '@/types/app'
import { getStatusLabel } from '@/types/app'
import { cn } from '@/lib/utils'

export function ApplicatiesBeheren() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return q ? apps.filter((app) => app.naam.toLowerCase().includes(q)) : apps
  }, [apps, searchQuery])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchAllApps()
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">
        Applicaties beheren
      </h2>
      <p className="text-sm text-ijsselheem-donkerblauw/90">
        Overzicht van alle applicaties. Klik op <strong>Beheren</strong> om basisinfo (URL, uitleg, icoon), context, features en user stories van een app te bekijken en aan te passen.
      </p>

      {loading ? (
        <p className="text-ijsselheem-donkerblauw">Laden…</p>
      ) : apps.length === 0 ? (
        <p className="text-ijsselheem-donkerblauw">Geen applicaties.</p>
      ) : (
        <>
          <div>
            <input
              type="search"
              placeholder="Zoeken op applicatienaam…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm text-ijsselheem-donkerblauw w-full max-w-md"
              aria-label="Zoeken op applicatienaam"
            />
          </div>
          {filteredApps.length === 0 ? (
            <p className="text-ijsselheem-donkerblauw">
              Geen applicaties gevonden voor &apos;{searchQuery.trim()}&apos;.
            </p>
          ) : (
        <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ijsselheem-lichtblauw/50 text-left">
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Applicatie</th>
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Status programma</th>
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Domein</th>
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw w-28">Actie</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className="border-t border-ijsselheem-accentblauw/20 hover:bg-ijsselheem-lichtblauw/30"
                  >
                    <td className="p-3 font-medium text-ijsselheem-donkerblauw">
                      {app.naam}
                    </td>
                    <td className="p-3 text-ijsselheem-donkerblauw/90">
                      {getStatusLabel(app.status)}
                    </td>
                    <td className="p-3 text-ijsselheem-donkerblauw/90">
                      {app.domein ?? '—'}
                    </td>
                    <td className="p-3">
                      <Link
                        to={`/backlog/${app.id}`}
                        className={cn(
                          'inline-block rounded-ijsselheem-button px-3 py-1.5 text-sm font-medium',
                          'bg-ijsselheem-donkerblauw text-white hover:opacity-90'
                        )}
                      >
                        Beheren
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          )}
        </>
      )}
    </div>
  )
}
