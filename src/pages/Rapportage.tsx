import { useState, useEffect, useMemo } from 'react'
import { fetchAppsForBacklog } from '@/lib/apps'
import type { App, AppStatusDb } from '@/types/app'
import { useReferenceOptions } from '@/hooks/useReferenceOptions'

export function Rapportage() {
  const { options: domeinOptions } = useReferenceOptions('domein')
  const { options: appStatusOptions } = useReferenceOptions('app_status')
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDomein, setFilterDomein] = useState('')
  const [filterStatus, setFilterStatus] = useState<AppStatusDb | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchAppsForBacklog()
      .then(setApps)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = [...apps]
    if (filterDomein) list = list.filter((a) => a.domein === filterDomein)
    if (filterStatus) list = list.filter((a) => a.status === filterStatus)
    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      list = list.filter((a) => new Date(a.created_at).getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo).setHours(23, 59, 59, 999)
      list = list.filter((a) => new Date(a.created_at).getTime() <= to)
    }
    return list
  }, [apps, filterDomein, filterStatus, dateFrom, dateTo])

  const top10Urenwinst = useMemo(
    () => [...filtered].sort((a, b) => (b.urenwinst_per_jaar ?? 0) - (a.urenwinst_per_jaar ?? 0)).slice(0, 10),
    [filtered]
  )
  const top10Prioriteit = useMemo(
    () => [...filtered].sort((a, b) => (b.prioriteitsscore ?? 0) - (a.prioriteitsscore ?? 0)).slice(0, 10),
    [filtered]
  )
  const urenwinstPerDomein = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((a) => {
      const key = a.domein ?? 'Onbekend'
      map.set(key, (map.get(key) ?? 0) + (a.urenwinst_per_jaar ?? 0))
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [filtered])
  const maxUren = Math.max(1, ...urenwinstPerDomein.map(([, v]) => v))

  const exportCsv = () => {
    const headers = [
      'Titel',
      'Domein',
      'Status',
      'Urenwinst/jaar',
      'Zorgwaarde',
      'Prioriteitsscore',
      'Risico',
      'Created',
    ]
    const rows = filtered.map((a) => [
      a.naam,
      a.domein ?? '',
      a.status,
      a.urenwinst_per_jaar ?? '',
      a.zorgwaarde ?? '',
      a.prioriteitsscore ?? '',
      a.risico ? 'Ja' : 'Nee',
      a.created_at?.slice(0, 10) ?? '',
    ])
    const csv = [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\r\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapportage-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p className="text-ijsselheem-donkerblauw">Laden…</p>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Rapportage</h2>

      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-ijsselheem-donkerblauw">Domein</span>
          <select
            value={filterDomein}
            onChange={(e) => setFilterDomein(e.target.value)}
            className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Alle</option>
            {domeinOptions.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-ijsselheem-donkerblauw">Status</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AppStatusDb | '')}
            className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Alle</option>
            {appStatusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-ijsselheem-donkerblauw">Van</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-ijsselheem-donkerblauw">Tot</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Export CSV
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw mb-3">Top 10 urenwinst</h3>
          <ul className="space-y-2">
            {top10Urenwinst.map((a, i) => (
              <li key={a.id} className="flex justify-between text-sm">
                <span className="text-ijsselheem-donkerblauw truncate mr-2">{i + 1}. {a.naam}</span>
                <span className="font-medium text-ijsselheem-donkerblauw shrink-0">
                  {a.urenwinst_per_jaar != null
                    ? a.urenwinst_per_jaar.toLocaleString('nl-NL', { maximumFractionDigits: 0 }) + ' u'
                    : '—'}
                </span>
              </li>
            ))}
          </ul>
          {top10Urenwinst.length === 0 && (
            <p className="text-sm text-ijsselheem-donkerblauw/70">Geen data.</p>
          )}
        </section>
        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw mb-3">Top 10 prioriteit</h3>
          <ul className="space-y-2">
            {top10Prioriteit.map((a, i) => (
              <li key={a.id} className="flex justify-between text-sm">
                <span className="text-ijsselheem-donkerblauw truncate mr-2">{i + 1}. {a.naam}</span>
                <span className="font-medium text-ijsselheem-donkerblauw shrink-0">
                  {a.prioriteitsscore != null ? a.prioriteitsscore.toFixed(1) : '—'}
                </span>
              </li>
            ))}
          </ul>
          {top10Prioriteit.length === 0 && (
            <p className="text-sm text-ijsselheem-donkerblauw/70">Geen data.</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
        <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw mb-3">Totaal urenwinst per domein</h3>
        <div className="space-y-2">
          {urenwinstPerDomein.map(([domein, uren]) => (
            <div key={domein} className="flex items-center gap-2">
              <span className="w-40 text-sm text-ijsselheem-donkerblauw truncate">{domein}</span>
              <div className="flex-1 h-6 bg-ijsselheem-lichtblauw rounded overflow-hidden max-w-xs">
                <div
                  className="h-full bg-ijsselheem-accentblauw rounded"
                  style={{ width: `${(uren / maxUren) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-ijsselheem-donkerblauw w-20 text-right">
                {uren.toLocaleString('nl-NL', { maximumFractionDigits: 0 })} u
              </span>
            </div>
          ))}
        </div>
        {urenwinstPerDomein.length === 0 && (
          <p className="text-sm text-ijsselheem-donkerblauw/70">Geen data.</p>
        )}
      </section>
    </div>
  )
}
