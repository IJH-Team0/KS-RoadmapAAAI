import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { fetchFeaturesForBacklog } from '@/lib/roadmap'
import type { BacklogFeatureRow } from '@/types/roadmap'
import type { AppStatusDb } from '@/types/app'
import { APP_STATUS_OPTIONS, DOMEIN_OPTIONS } from '@/types/app'
import { type BacklogFilters } from '@/lib/apps'
import { cn } from '@/lib/utils'

type SortKey =
  | 'naam'
  | 'domein'
  | 'app_aanspreekpunt_intern'
  | 'urenwinst_per_jaar'
  | 'app_urenwinst_per_jaar'
  | 'app_zorgimpact_type'
  | 'zorgwaarde'
  | 'werkbesparing_score'
  | 'bouwinspanning'
  | 'prioriteitsscore'

function getSortValue(row: BacklogFeatureRow, key: SortKey): string | number | boolean | null {
  if (key === 'naam') return `${row.app_naam} · ${row.feature.naam}`
  if (key === 'domein') return row.app_domein ?? ''
  if (key === 'app_aanspreekpunt_intern') return row.app_aanspreekpunt_intern ?? ''
  if (key === 'app_urenwinst_per_jaar') return row.app_urenwinst_per_jaar ?? null
  if (key === 'app_zorgimpact_type') return row.app_zorgimpact_type ?? ''
  const f = row.feature
  if (key === 'urenwinst_per_jaar') return f.urenwinst_per_jaar ?? null
  if (key === 'zorgwaarde') return f.zorgwaarde ?? null
  if (key === 'werkbesparing_score') return f.werkbesparing_score ?? null
  if (key === 'bouwinspanning') return f.bouwinspanning ?? null
  if (key === 'prioriteitsscore') return f.prioriteitsscore ?? null
  return null
}

export function Backlog() {
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState<BacklogFeatureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('prioriteitsscore')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterDomein, setFilterDomein] = useState(searchParams.get('domein') ?? '')
  const [filterStatus, setFilterStatus] = useState<AppStatusDb | ''>(searchParams.get('status') as AppStatusDb ?? '')
  const [filterRisico, setFilterRisico] = useState<boolean | ''>('')
  const [zoek, setZoek] = useState(searchParams.get('zoek') ?? '')

  // API filters: only domein/risico; status filter is applied client-side on feature.planning_status
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

  const SPRINT_PHASES: AppStatusDb[] = [
    'in_voorbereiding',
    'in_ontwikkeling',
    'in_testfase',
    'in_productie',
  ]

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
    if (filterStatus) {
      list = list.filter((r) => (r.feature.planning_status ?? 'wensenlijst') === filterStatus)
    }
    const ps = (r: BacklogFeatureRow) => r.feature.planning_status ?? 'wensenlijst'
    const count = (r: BacklogFeatureRow) => r.app_user_story_count ?? 0
    // Sprintbaar: only features in sprint phases (same definition as Planning "Sprintbaar")
    const sprintbaarMetStory = sortRows(list.filter((r) => SPRINT_PHASES.includes(ps(r) as AppStatusDb)))
    const beoordeeldGeenStory = sortRows(
      list.filter((r) => ps(r) === 'stories_maken' && count(r) === 0)
    )
    const wensen = sortRows(list.filter((r) => ps(r) === 'wensenlijst'))
    return { sprintbaarMetStory, beoordeeldGeenStory, wensen }
  }, [rows, zoek, filterStatus, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a)
    else {
      setSortKey(key)
      setSortAsc(key === 'naam' || key === 'domein')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Backlog</h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80">
        Per feature: programma · feature (Basisfunctionaliteit = eerste app). Prioriteitsscore en beoordeling staan op de feature.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Zoeken op programma, feature, domein..."
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
          {DOMEIN_OPTIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as AppStatusDb | '')}
          className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Alle statussen</option>
          {APP_STATUS_OPTIONS.filter((o) => BACKLOG_PHASES.includes(o.value)).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
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
              title: 'Sprintbaar met user story',
              rows: sprintbaarMetStory,
            },
            {
              title: 'Beoordeeld, nog geen user story',
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
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-ijsselheem-lichtblauw/50 text-left">
                          {(
                            [
                              { key: 'naam' as const, label: 'Programma · Feature' },
                              { key: 'domein' as const, label: 'Domein' },
                              { key: 'app_aanspreekpunt_intern' as const, label: 'Aanspreekpunt intern' },
                              { key: 'urenwinst_per_jaar' as const, label: 'Urenwinst/jaar' },
                              { key: 'app_urenwinst_per_jaar' as const, label: 'Urenwinst (aanvraag)' },
                              { key: 'app_zorgimpact_type' as const, label: 'Zorgimpact (aanvraag)' },
                              { key: 'zorgwaarde' as const, label: 'Zorgwaarde' },
                              { key: 'werkbesparing_score' as const, label: 'Werkbesparing' },
                              { key: 'bouwinspanning' as const, label: 'Bouwinspanning' },
                              { key: 'prioriteitsscore' as const, label: 'Prioriteitsscore' },
                            ] as const
                          ).map(({ key, label }) => (
                            <th key={key} className="p-2 whitespace-nowrap">
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
                            <td className="p-2 text-ijsselheem-donkerblauw">{row.app_domein ?? '—'}</td>
                            <td className="p-2 text-ijsselheem-donkerblauw text-xs">
                              {row.app_aanspreekpunt_intern ?? '—'}
                            </td>
                            <td className="p-2 text-ijsselheem-donkerblauw">
                              {row.feature.urenwinst_per_jaar != null
                                ? row.feature.urenwinst_per_jaar.toLocaleString('nl-NL', {
                                    maximumFractionDigits: 0,
                                  })
                                : '—'}
                            </td>
                            <td className="p-2 text-ijsselheem-donkerblauw/80">
                              {row.app_urenwinst_per_jaar != null
                                ? row.app_urenwinst_per_jaar.toLocaleString('nl-NL', {
                                    maximumFractionDigits: 0,
                                  })
                                : '—'}
                            </td>
                            <td className="p-2 text-ijsselheem-donkerblauw/80 text-xs">
                              {row.app_zorgimpact_type ?? '—'}
                            </td>
                            <td className="p-2 text-ijsselheem-donkerblauw">
                              {row.feature.zorgwaarde ?? '—'}
                            </td>
                            <td className="p-2 text-ijsselheem-donkerblauw">
                              {row.feature.werkbesparing_score ?? '—'}
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
                            <td className="p-2 font-medium text-ijsselheem-donkerblauw">
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
