import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ClipboardList, Puzzle, Wrench, FlaskConical, type LucideIcon } from 'lucide-react'
import { fetchFeaturesForBacklog } from '@/lib/roadmap'
import type { BacklogFeatureRow } from '@/types/roadmap'
import { BeveiligingsniveauBadge } from '@/components/BeveiligingsniveauBadge'
import { BasisfunctionaliteitNieuweAppHint } from '@/components/BasisfunctionaliteitNieuweAppHint'
import type { AppStatusDb } from '@/types/app'
import { getStatusLabel, BASISFEATURE_NAAM } from '@/types/app'
import { cn } from '@/lib/utils'

const DESCRIPTION_PREVIEW_LENGTH = 120

/** Processtappen in volgorde (wensenlijst → productie) voor de Roadmap-weergave. */
const PROCES_STATUS_ORDER: AppStatusDb[] = [
  'wensenlijst',
  'stories_maken',
  'in_voorbereiding',
  'in_ontwikkeling',
  'in_testfase',
  'in_productie',
]

/** Secties voor gebruikersweergave: uitwerken, oppakken, ontwikkeling, test. Geen productie. */
const USER_SECTIONS: { key: string; label: string; statuses: AppStatusDb[]; icon: LucideIcon }[] = [
  { key: 'planning', label: 'Uitwerken', statuses: ['wensenlijst', 'stories_maken'], icon: ClipboardList },
  { key: 'sprintbaar', label: 'Oppakken', statuses: ['in_voorbereiding'], icon: Puzzle },
  { key: 'ontwikkeling', label: 'In ontwikkeling', statuses: ['in_ontwikkeling'], icon: Wrench },
  { key: 'test', label: 'In test', statuses: ['in_testfase'], icon: FlaskConical },
]

function descriptionPreview(beschrijving: string | null): string | null {
  if (!beschrijving?.trim()) return null
  const t = beschrijving.trim()
  if (t.length <= DESCRIPTION_PREVIEW_LENGTH) return t
  return t.slice(0, DESCRIPTION_PREVIEW_LENGTH).trim() + '…'
}

function RoadmapUserCard({ row, icon: Icon }: { row: BacklogFeatureRow; icon: LucideIcon }) {
  const desc = descriptionPreview(row.feature.beschrijving ?? null)
  return (
    <div className="rounded-xl border border-ijsselheem-olijfgroen/30 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ijsselheem-olijfgroen/25 text-ijsselheem-donkerblauw">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-ijsselheem-donkerblauw leading-snug flex flex-wrap items-center gap-x-1 gap-y-1">
            <span>
              {row.app_naam}
              {row.feature.naam !== BASISFEATURE_NAAM && ` · ${row.feature.naam}`}
            </span>
            <BasisfunctionaliteitNieuweAppHint featureNaam={row.feature.naam} variant="compact" />
          </h4>
          {desc ? (
            <p className="mt-1.5 text-xs text-ijsselheem-donkerblauw/80 line-clamp-3 leading-relaxed">
              {desc}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-ijsselheem-donkerblauw/50 italic">Geen beschrijving.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Chevron-header: pijl wijst naar rechts (flow links → rechts). Tip van de pijl op de rechterkant. */
function ChevronHeader({ label, count, position }: { label: string; count: number; position: 'first' | 'middle' | 'last' }) {
  const clipPath =
    position === 'first'
      ? 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'
      : position === 'last'
        ? 'polygon(0 0, 10px 50%, 0 100%, 100% 100%, 100% 0)'
        : 'polygon(0 0, 10px 50%, 0 100%, calc(100% - 10px) 100%, 100% 50%, calc(100% - 10px) 0)'
  return (
    <div
      className="flex items-center justify-between gap-2 py-2.5 pl-3 pr-4 bg-ijsselheem-olijfgroen text-ijsselheem-donkerblauw font-semibold text-sm"
      style={{ clipPath }}
    >
      <span className="truncate">{label}</span>
      {count > 0 && <span className="shrink-0 text-ijsselheem-donkerblauw/80">({count})</span>}
    </div>
  )
}

type BeveiligingsniveauFilter = 'L0' | 'L1' | 'L2' | 'L3'
type RoadmapFilter = 'all' | BeveiligingsniveauFilter | 'sparse'

const NIVEAU_FILTERS: { value: RoadmapFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'L0', label: 'L0' },
  { value: 'L1', label: 'L1' },
  { value: 'L2', label: 'L2' },
  { value: 'L3', label: 'L3' },
  { value: 'sparse', label: 'Sparse' },
]

export function Roadmap() {
  const { effectiveRole } = useAuth()
  const [rows, setRows] = useState<BacklogFeatureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<RoadmapFilter>('all')

  useEffect(() => {
    setLoading(true)
    fetchFeaturesForBacklog(undefined, { includeAllPhases: true })
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  const filteredRows = useMemo(() => {
    if (filter === 'sparse') return rows.filter((r) => r.feature.sparse_betrokken === true)
    if (filter === 'L0' || filter === 'L1' || filter === 'L2' || filter === 'L3') {
      return rows.filter((r) => r.app_beveiligingsniveau === filter)
    }
    return rows
  }, [rows, filter])

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
    for (const row of filteredRows) {
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
  }, [filteredRows])

  const userSectionRows = useMemo(() => {
    return USER_SECTIONS.map((sec) => ({
      ...sec,
      rows: sec.statuses.flatMap((s) => byStatus[s]),
    }))
  }, [byStatus])

  const isGebruiker = effectiveRole === 'gebruiker'

  return (
    <div className="w-full max-w-7xl">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw mb-2">
        {isGebruiker ? 'Waar we mee bezig zijn' : 'Roadmap'}
      </h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80 mb-4">
        {isGebruiker
          ? 'Overzicht van applicaties en ideeën in planning, ontwikkeling en test.'
          : 'Gestructureerde weergave van alle applicaties en in welke bak ze zitten.'}
      </p>

      {!isGebruiker && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm font-medium text-ijsselheem-donkerblauw">Toon:</span>
          <div className="flex flex-wrap gap-1">
            {NIVEAU_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-sm font-medium',
                  filter === value
                    ? 'bg-ijsselheem-donkerblauw text-white border-ijsselheem-donkerblauw'
                    : 'bg-white text-ijsselheem-donkerblauw border-ijsselheem-accentblauw/50 hover:bg-ijsselheem-lichtblauw/50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-ijsselheem-donkerblauw">Laden…</p>
      ) : isGebruiker ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-6">
          {userSectionRows.map(({ key, label, rows: sectionRows, icon }, index) => {
            const position = index === 0 ? 'first' : index === userSectionRows.length - 1 ? 'last' : 'middle'
            return (
            <section key={key} className="flex flex-col min-w-0">
              <ChevronHeader label={label} count={sectionRows.length} position={position} />
              <div className="mt-3 space-y-3 flex-1">
                {sectionRows.length === 0 ? (
                  <p className="text-sm text-ijsselheem-donkerblauw/70 py-4">Geen items.</p>
                ) : (
                  sectionRows.map((row) => (
                    <RoadmapUserCard key={row.feature.id} row={row} icon={icon} />
                  ))
                )}
              </div>
            </section>
            )
          })}
        </div>
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
                      <table className="w-full table-fixed text-sm">
                        <thead>
                          <tr className="bg-ijsselheem-lichtblauw/50">
                            <th className="w-[38%] min-w-[12rem] px-4 py-2.5 text-left align-middle whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                              Applicatie · Feature
                            </th>
                            <th className="w-16 min-w-[3.5rem] px-4 py-2.5 text-center align-middle whitespace-nowrap font-semibold text-ijsselheem-donkerblauw" title="Prioriteitsscore">
                              Prio
                            </th>
                            <th className="w-24 min-w-[5rem] px-4 py-2.5 text-center align-middle whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                              Niveau
                            </th>
                            <th className="w-20 min-w-[4.5rem] px-4 py-2.5 text-center align-middle whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                              Zwaarte
                            </th>
                            <th className="w-20 min-w-[4.5rem] px-4 py-2.5 text-center align-middle whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                              Sparse
                            </th>
                            <th className="min-w-[10rem] px-4 py-2.5 text-left align-middle whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                              Productowner
                            </th>
                            <th className="min-w-[10rem] px-4 py-2.5 text-left align-middle whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
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
                              <td className="px-4 py-2.5 text-left align-middle">
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                  <Link
                                    to={`/backlog/feature/${row.feature.id}`}
                                    className="font-medium text-ijsselheem-donkerblauw hover:underline min-w-0 inline-flex items-center gap-1.5"
                                    aria-label={
                                      row.feature.naam === BASISFEATURE_NAAM
                                        ? `${row.app_naam}, eerste feature (Basisfunctionaliteit)`
                                        : `${row.app_naam} · ${row.feature.naam}`
                                    }
                                  >
                                    {row.app_naam}
                                    {row.feature.naam !== BASISFEATURE_NAAM && ` · ${row.feature.naam}`}
                                    <BasisfunctionaliteitNieuweAppHint
                                      featureNaam={row.feature.naam}
                                      variant="compact"
                                    />
                                  </Link>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-center align-middle text-ijsselheem-donkerblauw tabular-nums">
                                {row.feature.prioriteitsscore != null
                                  ? row.feature.prioriteitsscore.toFixed(1)
                                  : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-center align-middle">
                                <BeveiligingsniveauBadge level={row.app_beveiligingsniveau} shortLabel />
                              </td>
                              <td
                                className={cn(
                                  'px-4 py-2.5 text-center align-middle text-ijsselheem-donkerblauw',
                                  row.feature.bouwinspanning === 'L' && 'text-amber-600 font-medium'
                                )}
                              >
                                {row.feature.bouwinspanning ?? '—'}
                              </td>
                              <td className="px-4 py-2.5 text-center align-middle text-ijsselheem-donkerblauw">
                                {row.feature.sparse_betrokken === true ? (
                                  <span
                                    className="inline-flex items-center justify-center rounded bg-ijsselheem-donkerblauw px-1.5 py-0.5 text-xs font-medium text-white"
                                    title="Sparse betrokken"
                                  >
                                    S
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-left align-middle text-ijsselheem-donkerblauw text-xs">
                                {row.app_aanspreekpunt_intern ?? '—'}
                              </td>
                              <td className="px-4 py-2.5 text-left align-middle text-ijsselheem-donkerblauw">
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

