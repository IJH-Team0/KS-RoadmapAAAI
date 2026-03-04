import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  fetchFeaturesForPlanning,
  updateFeature,
  maybeSyncAppStatusToFeaturePlanningStatus,
} from '@/lib/roadmap'
import type { AppStatusDb } from '@/types/app'
import type { BacklogFeatureRow } from '@/types/roadmap'

// Scrum-workflow: wensenlijst → user stories maken → sprintbaar → ontwikkeling → test → productie
const KANBAN_STATUSES: AppStatusDb[] = [
  'wensenlijst',
  'stories_maken',
  'in_voorbereiding',
  'in_ontwikkeling',
  'in_testfase',
  'in_productie',
]

/** Alleen in deze fases kan de gebruiker op het bord handmatig de status wijzigen. */
const MANUAL_PHASES: AppStatusDb[] = [
  'in_voorbereiding',
  'in_ontwikkeling',
  'in_testfase',
  'in_productie',
]

const COLLAPSED_BUCKETS_KEY = 'planning-collapsed-buckets'

/** Standaard ingeklapt: Wensenlijst, User stories maken, Productie */
const DEFAULT_COLLAPSED = new Set<AppStatusDb>(['wensenlijst', 'stories_maken', 'in_productie'])

function loadCollapsedBuckets(): Set<AppStatusDb> {
  try {
    const raw = localStorage.getItem(COLLAPSED_BUCKETS_KEY)
    if (!raw) return new Set(DEFAULT_COLLAPSED)
    const arr = JSON.parse(raw) as string[]
    const set = new Set(arr.filter((s): s is AppStatusDb => KANBAN_STATUSES.includes(s as AppStatusDb)))
    return set.size > 0 ? set : new Set(DEFAULT_COLLAPSED)
  } catch {
    return new Set(DEFAULT_COLLAPSED)
  }
}

function saveCollapsedBuckets(set: Set<AppStatusDb>) {
  try {
    localStorage.setItem(COLLAPSED_BUCKETS_KEY, JSON.stringify([...set]))
  } catch {
    // ignore
  }
}

const COLUMN_LABELS: Record<AppStatusDb, string> = {
  wensenlijst: 'Wensenlijst',
  stories_maken: 'User stories maken',
  in_voorbereiding: 'Sprintbaar',
  in_ontwikkeling: 'In ontwikkeling',
  in_testfase: 'Test',
  in_productie: 'Productie',
  afgewezen: 'Afgewezen',
}

/** Vorige kolom in de workflow. Sprintbaar heeft geen vorige (alleen vooruit); Productie ← Test. */
function getPrevStatus(current: AppStatusDb): AppStatusDb | null {
  if (current === 'in_voorbereiding') return null
  const i = KANBAN_STATUSES.indexOf(current)
  if (i <= 0) return null
  return KANBAN_STATUSES[i - 1]
}

/** Volgende kolom in de workflow. Productie heeft geen volgende; Sprintbaar alleen → In ontwikkeling. */
function getNextStatus(current: AppStatusDb): AppStatusDb | null {
  const i = KANBAN_STATUSES.indexOf(current)
  if (i < 0 || i >= KANBAN_STATUSES.length - 1) return null
  return KANBAN_STATUSES[i + 1]
}

export function Planning() {
  const [rows, setRows] = useState<BacklogFeatureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<AppStatusDb>>(loadCollapsedBuckets)

  const toggleCollapsed = useCallback((status: AppStatusDb) => {
    setCollapsedBuckets((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      saveCollapsedBuckets(next)
      return next
    })
  }, [])

  useEffect(() => {
    fetchFeaturesForPlanning()
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  const byStatus = KANBAN_STATUSES.reduce(
    (acc, status) => {
      acc[status] = rows
        .filter((r) => (r.feature.planning_status ?? 'wensenlijst') === status)
        .sort((a, b) => (b.feature.prioriteitsscore ?? 0) - (a.feature.prioriteitsscore ?? 0))
      return acc
    },
    {} as Record<AppStatusDb, BacklogFeatureRow[]>
  )

  const handleStatusChange = async (featureId: string, newStatus: AppStatusDb) => {
    setUpdatingId(featureId)
    try {
      const updated = await updateFeature(featureId, { planning_status: newStatus })
      setRows((prev) =>
        prev.map((r) =>
          r.feature.id === featureId ? { ...r, feature: updated } : r
        )
      )
      const row = rows.find((r) => r.feature.id === featureId)
      if (row) {
        await maybeSyncAppStatusToFeaturePlanningStatus(row.feature.app_id, newStatus)
      }
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <p className="text-ijsselheem-donkerblauw">Laden…</p>

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Planning</h2>
        <p className="mt-1 text-sm text-ijsselheem-donkerblauw/80 max-w-2xl">
          Scrum-workflow op <strong>feature</strong>-niveau: Wensenlijst → User stories maken → Sprintbaar → In ontwikkeling → Test → Productie. De eerste stappen (Wensenlijst, User stories maken) gaan automatisch via backlog en beoordeling; op dit bord kun je ze niet handmatig wijzigen. Vanaf Sprintbaar verplaats je handmatig naar In ontwikkeling, Test of Productie.
        </p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_STATUSES.map((status) => {
          const collapsed = collapsedBuckets.has(status)
          return (
          <div
            key={status}
            className={`flex-shrink-0 rounded-xl border border-ijsselheem-accentblauw/30 bg-white flex flex-col ${collapsed ? 'w-14 min-h-[4rem]' : 'w-72 min-h-[6rem]'}`}
          >
            <div
              className={`border-b border-ijsselheem-accentblauw/30 bg-ijsselheem-lichtblauw/50 flex shrink-0 ${collapsed ? 'flex-col items-center justify-center gap-2 p-2 min-h-[4rem]' : 'flex-row items-center justify-between gap-2 p-3'}`}
            >
              {collapsed ? (
                <>
                  <span
                    className="text-[10px] font-semibold text-ijsselheem-donkerblauw text-center leading-tight [writing-mode:vertical-rl] [text-orientation:mixed] inline-block origin-center rotate-180"
                    style={{ minHeight: '3rem' }}
                    title={COLUMN_LABELS[status]}
                  >
                    {COLUMN_LABELS[status]}
                  </span>
                  <span className="text-sm font-semibold text-ijsselheem-donkerblauw tabular-nums">
                    {byStatus[status].length}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(status)}
                    className="rounded p-1 hover:bg-ijsselheem-accentblauw/20 text-ijsselheem-donkerblauw shrink-0"
                    title="Uitklappen"
                    aria-label="Kolom uitklappen"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ijsselheem-donkerblauw leading-tight">
                      {COLUMN_LABELS[status]}
                    </h3>
                    <span className="inline-flex items-center mt-1 rounded-md bg-ijsselheem-donkerblauw px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
                      {byStatus[status].length} items
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(status)}
                    className="rounded p-1 hover:bg-ijsselheem-accentblauw/20 text-ijsselheem-donkerblauw shrink-0"
                    title="Inklappen"
                    aria-label="Kolom inklappen"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {!collapsed && (
            <div className="p-2 space-y-2">
              {byStatus[status].map((row) => (
                <div
                  key={row.feature.id}
                  className="rounded-lg border border-ijsselheem-accentblauw/30 bg-white p-2.5 shadow-sm hover:bg-ijsselheem-lichtblauw/30 transition border-l-4 border-l-ijsselheem-donkerblauw/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/backlog/feature/${row.feature.id}`}
                      className="font-medium text-ijsselheem-donkerblauw hover:underline text-sm leading-tight flex-1 min-w-0"
                    >
                      {row.app_naam} · {row.feature.naam}
                    </Link>
                    {MANUAL_PHASES.includes((row.feature.planning_status ?? 'wensenlijst') as AppStatusDb) && (() => {
                      const prev = getPrevStatus(status)
                      const next = getNextStatus(status)
                      return (prev != null || next != null) ? (
                        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.preventDefault()}>
                          {prev != null && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); handleStatusChange(row.feature.id, prev) }}
                              disabled={updatingId === row.feature.id}
                              className="rounded-full p-1 text-ijsselheem-donkerblauw hover:bg-ijsselheem-accentblauw/50 disabled:opacity-50"
                              title={`Naar ${COLUMN_LABELS[prev]}`}
                              aria-label={`Terug naar ${COLUMN_LABELS[prev]}`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          )}
                          {next != null && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); handleStatusChange(row.feature.id, next) }}
                              disabled={updatingId === row.feature.id}
                              className="rounded-full p-1 text-ijsselheem-donkerblauw hover:bg-ijsselheem-accentblauw/50 disabled:opacity-50"
                              title={`Naar ${COLUMN_LABELS[next]}`}
                              aria-label={`Verder naar ${COLUMN_LABELS[next]}`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : null
                    })()}
                  </div>
                  <p className="mt-1.5 text-xs text-ijsselheem-donkerblauw/80">
                    Score {row.feature.prioriteitsscore != null ? row.feature.prioriteitsscore.toFixed(1) : '—'}
                    {row.feature.urenwinst_per_jaar != null && ` · ${row.feature.urenwinst_per_jaar.toLocaleString('nl-NL', { maximumFractionDigits: 0 })} u/j`}
                    {row.feature.zorgwaarde != null && ` · ZW ${row.feature.zorgwaarde}`}
                  </p>
                </div>
              ))}
            </div>
            )}
          </div>
          )
        })}
      </div>
    </div>
  )
}
