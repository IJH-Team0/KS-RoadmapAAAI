import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchFeaturesForBacklog } from '@/lib/roadmap'
import type { BacklogFeatureRow } from '@/types/roadmap'
import type { AppStatusDb, BouwinspanningDb } from '@/types/app'
import { getStatusLabel, getBouwinspanningLabel } from '@/types/app'
import { cn } from '@/lib/utils'

/** Processtappen in volgorde (wensenlijst → productie) voor de Roadmap-weergave. */
const PROCES_STATUS_ORDER: AppStatusDb[] = [
  'wensenlijst',
  'stories_maken',
  'in_voorbereiding',
  'in_ontwikkeling',
  'in_testfase',
  'in_productie',
]

export function Roadmap() {
  const [rows, setRows] = useState<BacklogFeatureRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchFeaturesForBacklog(undefined, { includeAllPhases: true })
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  const byStatus = useMemo(() => {
    const ps = (r: BacklogFeatureRow) => r.feature.planning_status ?? 'wensenlijst'
    const result: Record<AppStatusDb, BacklogFeatureRow[]> = {
      wensenlijst: [],
      stories_maken: [],
      in_voorbereiding: [],
      in_ontwikkeling: [],
      in_testfase: [],
      in_productie: [],
      afgewezen: [],
    }
    for (const row of rows) {
      const status = ps(row) as AppStatusDb
      if (status in result && status !== 'afgewezen') {
        result[status].push(row)
      }
    }
    for (const status of PROCES_STATUS_ORDER) {
      result[status].sort((a, b) => {
        const pa = a.feature.prioriteitsscore ?? 0
        const pb = b.feature.prioriteitsscore ?? 0
        if (pa !== pb) return pb - pa
        return (a.app_naam + a.feature.naam).localeCompare(b.app_naam + b.feature.naam)
      })
    }
    return result
  }, [rows])

  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw mb-2">Roadmap</h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80 mb-6">
        Gestructureerde weergave van alle applicaties en in welke bak ze zitten. Zonder filters.
      </p>

      {loading ? (
        <p className="text-ijsselheem-donkerblauw">Laden…</p>
      ) : (
        <div className="space-y-6">
          {PROCES_STATUS_ORDER.map((status) => {
            const sectionRows = byStatus[status]
            return (
              <section key={status}>
                <h3 className="text-base font-semibold text-ijsselheem-donkerblauw mb-2">
                  {getStatusLabel(status)} ({sectionRows.length})
                </h3>
                <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    {sectionRows.length === 0 ? (
                      <p className="p-4 text-ijsselheem-donkerblauw/80 text-sm">Geen items.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-ijsselheem-lichtblauw/50 text-left">
                            <th className="p-2 whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                              Programma · Feature
                            </th>
                            <th className="p-2 whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                              Zwaarte
                            </th>
                            <th className="p-2 whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                              Platform
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sectionRows.map((row) => (
                            <tr
                              key={row.feature.id}
                              className={cn(
                                'border-t border-ijsselheem-accentblauw/20',
                                row.feature.zorgwaarde === 4 || row.feature.zorgwaarde === 5
                                  ? 'bg-ijsselheem-pastelgroen/30'
                                  : ''
                              )}
                            >
                              <td className="p-2">
                                <Link
                                  to={`/backlog/feature/${row.feature.id}`}
                                  className="font-medium text-ijsselheem-donkerblauw hover:underline"
                                >
                                  {row.app_naam} · {row.feature.naam}
                                </Link>
                              </td>
                              <td className="p-2 text-ijsselheem-donkerblauw">
                                <span
                                  className={cn(
                                    row.feature.bouwinspanning === 'L'
                                      ? 'text-amber-600 font-medium'
                                      : ''
                                  )}
                                >
                                  {getBouwinspanningLabel((row.feature.bouwinspanning ?? undefined) as BouwinspanningDb | undefined)}
                                </span>
                              </td>
                              <td className="p-2 text-ijsselheem-donkerblauw">
                                {row.app_platform ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
