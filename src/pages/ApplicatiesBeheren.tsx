import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllApps } from '@/lib/apps'
import type { App, AppStatusDb } from '@/types/app'
import { getStatusLabel, APP_STATUS_OPTIONS, DOMEIN_OPTIONS } from '@/types/app'
import { BeveiligingsniveauBadge } from '@/components/BeveiligingsniveauBadge'
import { cn } from '@/lib/utils'

type SortKey = 'naam' | 'status' | 'domein'
type SortDir = 'asc' | 'desc'

export function ApplicatiesBeheren() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<AppStatusDb | 'all'>('all')
  const [filterDomein, setFilterDomein] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('naam')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [error, setError] = useState<string | null>(null)

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = apps
    if (q) list = list.filter((app) => app.naam.toLowerCase().includes(q))
    if (filterStatus !== 'all') list = list.filter((app) => app.status === filterStatus)
    if (filterDomein) list = list.filter((app) => app.domein === filterDomein)
    const statusOrder = Object.fromEntries(APP_STATUS_OPTIONS.map((o, i) => [o.value, i]))
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'naam') {
        cmp = (a.naam ?? '').localeCompare(b.naam ?? '')
      } else if (sortKey === 'status') {
        const oa = statusOrder[a.status] ?? 99
        const ob = statusOrder[b.status] ?? 99
        cmp = oa - ob || (a.naam ?? '').localeCompare(b.naam ?? '')
      } else {
        cmp = (a.domein ?? '').localeCompare(b.domein ?? '') || (a.naam ?? '').localeCompare(b.naam ?? '')
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [apps, searchQuery, filterStatus, filterDomein, sortKey, sortDir])

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

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">
        Applicatiebeheer
      </h2>
      <p className="text-sm text-ijsselheem-donkerblauw/90">
        Overzicht van alle applicaties. Klik op de <strong>applicatienaam</strong> om basisinfo (URL, uitleg, icoon), context, features en user stories of taken van een app te bekijken en aan te passen.
      </p>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading ? (
        <p className="text-ijsselheem-donkerblauw">Laden…</p>
      ) : apps.length === 0 ? (
        <p className="text-ijsselheem-donkerblauw">Geen applicaties.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="search"
              placeholder="Zoeken op applicatienaam…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm text-ijsselheem-donkerblauw w-full max-w-md"
              aria-label="Zoeken op applicatienaam"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ijsselheem-donkerblauw">Status:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-sm font-medium transition',
                    filterStatus === 'all'
                      ? 'bg-ijsselheem-donkerblauw text-white border-ijsselheem-donkerblauw'
                      : 'bg-white text-ijsselheem-donkerblauw border-ijsselheem-accentblauw/50 hover:bg-ijsselheem-lichtblauw/50'
                  )}
                  aria-pressed={filterStatus === 'all'}
                >
                  Alle
                </button>
                {APP_STATUS_OPTIONS.map(({ value, label }) => (
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
                    {getStatusLabel(value)}
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
                  Alle
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
          {filteredApps.length === 0 ? (
            <p className="text-ijsselheem-donkerblauw">
              Geen applicaties gevonden. Pas filters of zoekterm aan.
            </p>
          ) : (
        <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ijsselheem-lichtblauw/50 text-left">
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw">
                    <button
                      type="button"
                      onClick={() => toggleSort('naam')}
                      className="text-left font-semibold text-ijsselheem-donkerblauw hover:underline flex items-center gap-1"
                    >
                      Applicatie
                      {sortKey === 'naam' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  </th>
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw">
                    <button
                      type="button"
                      onClick={() => toggleSort('status')}
                      className="text-left font-semibold text-ijsselheem-donkerblauw hover:underline flex items-center gap-1"
                    >
                      Status programma
                      {sortKey === 'status' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  </th>
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw">
                    <button
                      type="button"
                      onClick={() => toggleSort('domein')}
                      className="text-left font-semibold text-ijsselheem-donkerblauw hover:underline flex items-center gap-1"
                    >
                      Domein
                      {sortKey === 'domein' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className="border-t border-ijsselheem-accentblauw/20 hover:bg-ijsselheem-lichtblauw/30"
                  >
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/backlog/${app.id}`}
                          className="font-medium text-ijsselheem-donkerblauw hover:underline"
                          aria-label={`Beheren: ${app.naam}`}
                        >
                          {app.naam}
                        </Link>
                        <BeveiligingsniveauBadge level={app.beveiligingsniveau} shortLabel />
                      </div>
                    </td>
                    <td className="p-3 text-ijsselheem-donkerblauw/90">
                      {getStatusLabel(app.status)}
                    </td>
                    <td className="p-3 text-ijsselheem-donkerblauw/90">
                      {app.domein ?? '—'}
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
