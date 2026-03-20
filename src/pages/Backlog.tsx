import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchFeaturesForBacklog } from '@/lib/roadmap'
import type { BacklogFeatureRow } from '@/types/roadmap'
import { type AppStatusDb, BASISFEATURE_NAAM } from '@/types/app'
import { useReferenceOptions } from '@/hooks/useReferenceOptions'
import { type BacklogFilters } from '@/lib/apps'
import { cn } from '@/lib/utils'
import { BeveiligingsniveauBadge } from '@/components/BeveiligingsniveauBadge'
import { BasisfunctionaliteitNieuweAppHint } from '@/components/BasisfunctionaliteitNieuweAppHint'

type SortKey =
  | 'app_naam'
  | 'naam'
  | 'app_beveiligingsniveau'
  | 'urenwinst_per_jaar'
  | 'bouwinspanning'
  | 'prioriteitsscore'

function getSortValue(row: BacklogFeatureRow, key: SortKey): string | number | boolean | null {
  if (key === 'app_naam') return row.app_naam ?? ''
  if (key === 'naam') return row.feature.naam ?? ''
  if (key === 'app_beveiligingsniveau') return row.app_beveiligingsniveau ?? ''
  const f = row.feature
  if (key === 'urenwinst_per_jaar') return f.urenwinst_per_jaar ?? null
  if (key === 'bouwinspanning') return f.bouwinspanning ?? null
  if (key === 'prioriteitsscore') return f.prioriteitsscore ?? null
  return null
}

type BacklogLevelFilter = '' | 'L0' | 'L1' | 'L2' | 'L3'
const LEVEL_OPTIONS: { value: BacklogLevelFilter; label: string }[] = [
  { value: '', label: 'Alle levels' },
  { value: 'L0', label: 'L0' },
  { value: 'L1', label: 'L1' },
  { value: 'L2', label: 'L2' },
  { value: 'L3', label: 'L3' },
]

export function Backlog() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { options: domeinOptions } = useReferenceOptions('domein')
  const [rows, setRows] = useState<BacklogFeatureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('prioriteitsscore')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterDomein, setFilterDomein] = useState(searchParams.get('domein') ?? '')
  const [filterLevel, setFilterLevel] = useState<string>(searchParams.get('level') ?? '')
  const [filterRisico, setFilterRisico] = useState<boolean | ''>('')
  const [zoek, setZoek] = useState(searchParams.get('zoek') ?? '')

  // API filters: only domein/risico; level filter is applied client-side
  const apiFilters: BacklogFilters = useMemo(() => {
    const f: BacklogFilters = {}
    if (filterDomein) f.domein = filterDomein
    if (filterRisico !== '') f.risico = filterRisico
    return f
  }, [filterDomein, filterRisico])

  // Always fetch all non-afgewezen apps and their features; sections and filter use feature.planning_status
  useEffect(() => {
    setLoading(true)
    fetchFeaturesForBacklog(Object.keys(apiFilters).length ? apiFilters : undefined, {
      includeAllPhases: true,
      excludeAppsInDevTestProd: false,
    })
      .then(setRows)
      .finally(() => setLoading(false))
  }, [filterDomein, filterRisico])

  function sortRows(list: BacklogFeatureRow[]) {
    return [...list].sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (sortKey === 'bouwinspanning') {
        const order: Record<string, number> = { S: 3, M: 2, L: 1 }
        const na = va != null ? order[String(va)] ?? 0 : 0
        const nb = vb != null ? order[String(vb)] ?? 0 : 0
        return sortAsc ? na - nb : nb - na
      }
      if (va == null && vb == null) return 0
      if (va == null) return sortAsc ? -1 : 1
      if (vb == null) return sortAsc ? 1 : -1
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb))
      return sortAsc ? cmp : -cmp
    })
  }

  const BACKLOG_PHASES: AppStatusDb[] = ['wensenlijst', 'stories_maken', 'in_voorbereiding']

  const { sprintbaarMetStory, beoordeeldGeenStory, wensen } = useMemo(() => {
    let list = [...rows].filter(
      (r) => BACKLOG_PHASES.includes((r.feature.planning_status ?? 'wensenlijst') as AppStatusDb)
    )
    if (zoek.trim()) {
      const q = zoek.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.app_naam?.toLowerCase().includes(q) ||
          r.feature.naam?.toLowerCase().includes(q) ||
          r.app_domein?.toLowerCase().includes(q) ||
          r.feature.beschrijving?.toLowerCase().includes(q)
      )
    }
    if (filterLevel) {
      list = list.filter((r) => (r.app_beveiligingsniveau ?? '') === filterLevel)
    }
    const ps = (r: BacklogFeatureRow) => r.feature.planning_status ?? 'wensenlijst'
    const count = (r: BacklogFeatureRow) => r.app_user_story_count ?? 0
    // Sprintbaar met stories/taken:
    // - stories_maken met minimaal 1 user story/taken
    // - in_voorbereiding (altijd)
    const sprintbaarMetStory = sortRows(
      list.filter((r) => (ps(r) === 'stories_maken' && count(r) > 0) || ps(r) === 'in_voorbereiding')
    )
    const beoordeeldGeenStory = sortRows(
      list.filter((r) => ps(r) === 'stories_maken' && count(r) === 0)
    )
    const wensen = sortRows(list.filter((r) => ps(r) === 'wensenlijst'))
    return { sprintbaarMetStory, beoordeeldGeenStory, wensen }
  }, [rows, zoek, filterLevel, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a)
    else {
      setSortKey(key)
      setSortAsc(key === 'naam' || key === 'app_naam')
    }
  }

  /** Achtergrondkleur voor prioriteitsscore: donkergroen (hoog) tot lichtgroen (laag), 0–100. */
  function getPriorityBackground(score: number | null | undefined): string {
    if (score == null || score < 0) return 'transparent'
    const t = Math.min(100, score) / 100
    const r = Math.round(22 + (220 - 22) * (1 - t))
    const g = Math.round(101 + (252 - 101) * (1 - t))
    const b = Math.round(52 + (231 - 52) * (1 - t))
    return `rgb(${r},${g},${b})`
  }

  const COLUMNS = [
    { key: 'app_naam' as const, label: 'Applicatie', thClass: 'w-[20%] min-w-[11rem]' },
    { key: 'naam' as const, label: 'Feature', thClass: 'w-[18%] min-w-[10rem]' },
    { key: 'app_beveiligingsniveau' as const, label: 'Level', thClass: 'w-[4.5rem]' },
    { key: 'urenwinst_per_jaar' as const, label: 'Urenwinst/jaar', thClass: 'w-[5.5rem]' },
    { key: 'bouwinspanning' as const, label: 'Bouwinspanning', thClass: 'w-[5rem]' },
    { key: 'prioriteitsscore' as const, label: 'Prioriteitsscore', thClass: 'w-[5.5rem]' },
  ] as const

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Backlog</h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80">
        Per feature: applicatie en feature (Basisfunctionaliteit = eerste app). Prioriteitsscore en beoordeling staan op de feature.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Zoeken op applicatie, feature, domein..."
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-1.5 text-sm w-56"
        />
        <select
          value={filterDomein}
          onChange={(e) => setFilterDomein(e.target.value)}
          className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Alle domeinen</option>
          {domeinOptions.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-1.5 text-sm"
        >
          {LEVEL_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterRisico === '' ? '' : filterRisico ? 'ja' : 'nee'}
          onChange={(e) => setFilterRisico(e.target.value === '' ? '' : e.target.value === 'ja')}
          className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Risico: alle</option>
          <option value="ja">Risico: Ja</option>
          <option value="nee">Risico: Nee</option>
        </select>
      </div>

      {loading ? (
        <p className="text-ijsselheem-donkerblauw">Laden…</p>
      ) : (
        <div className="space-y-6">
          {[
            {
              title: 'Sprintbaar met user story of taken',
              rows: sprintbaarMetStory,
            },
            {
              title: 'Beoordeeld, nog geen user story of taken',
              rows: beoordeeldGeenStory,
            },
            {
              title: 'Wensen',
              rows: wensen,
            },
          ].map(({ title, rows }) => (
            <section key={title}>
              <h3 className="text-base font-semibold text-ijsselheem-donkerblauw mb-2">
                {title} ({rows.length})
              </h3>
              <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  {rows.length === 0 ? (
                    <p className="p-4 text-ijsselheem-donkerblauw/80 text-sm">Geen items.</p>
                  ) : (
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr className="bg-ijsselheem-lichtblauw/50 text-left">
                          {COLUMNS.map(({ key, label, thClass }) => (
                            <th key={key} className={cn('p-2 whitespace-nowrap', thClass)}>
                              <button
                                type="button"
                                onClick={() => toggleSort(key)}
                                className="font-semibold text-ijsselheem-donkerblauw hover:underline text-left flex items-center gap-1"
                              >
                                {label}
                                {sortKey === key && (sortAsc ? ' ↑' : ' ↓')}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr
                            key={row.feature.id}
                            className={cn(
                              'border-t border-ijsselheem-accentblauw/20 cursor-pointer hover:bg-ijsselheem-lichtblauw/30',
                              row.feature.zorgwaarde === 4 || row.feature.zorgwaarde === 5
                                ? 'bg-ijsselheem-pastelgroen/30'
                                : ''
                            )}
                            role="link"
                            tabIndex={0}
                            aria-label={
                              row.feature.naam === BASISFEATURE_NAAM
                                ? `Beoordelen: ${row.app_naam}, eerste feature (Basisfunctionaliteit)`
                                : `Beoordelen: ${row.feature.naam}`
                            }
                            onClick={() => navigate(`/backlog/feature/${row.feature.id}`)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                navigate(`/backlog/feature/${row.feature.id}`)
                              }
                            }}
                          >
                            <td className="p-2 text-ijsselheem-donkerblauw">
                              {row.app_naam}
                            </td>
                            <td className="p-2">
                              <div className="flex flex-wrap items-center gap-1 min-w-0">
                                {row.feature.naam !== BASISFEATURE_NAAM ? (
                                  <span className="font-medium text-ijsselheem-donkerblauw min-w-0">
                                    {row.feature.naam}
                                  </span>
                                ) : null}
                                <BasisfunctionaliteitNieuweAppHint
                                  featureNaam={row.feature.naam}
                                  variant="compact"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <BeveiligingsniveauBadge level={row.app_beveiligingsniveau} shortLabel />
                            </td>
                            <td className="p-2 text-ijsselheem-donkerblauw">
                              {row.feature.urenwinst_per_jaar != null
                                ? row.feature.urenwinst_per_jaar.toLocaleString('nl-NL', {
                                    maximumFractionDigits: 0,
                                  })
                                : '—'}
                            </td>
                            <td className="p-2">
                              <span
                                className={cn(
                                  row.feature.bouwinspanning === 'L'
                                    ? 'text-amber-600 font-medium'
                                    : 'text-ijsselheem-donkerblauw'
                                )}
                              >
                                {row.feature.bouwinspanning ?? '—'}
                              </span>
                            </td>
                            <td
                              className={cn(
                                'p-2 font-medium',
                                (row.feature.prioriteitsscore ?? 0) >= 55
                                  ? 'text-white'
                                  : 'text-ijsselheem-donkerblauw'
                              )}
                              style={{
                                backgroundColor: getPriorityBackground(row.feature.prioriteitsscore),
                              }}
                            >
                              {row.feature.prioriteitsscore != null
                                ? row.feature.prioriteitsscore.toFixed(1)
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
