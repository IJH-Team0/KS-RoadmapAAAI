import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAppsForBacklog } from '@/lib/apps'
import { fetchStatusCounts } from '@/lib/apps'
import type { App } from '@/types/app'

export function Dashboard() {
  const [apps, setApps] = useState<App[]>([])
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAppsForBacklog(), fetchStatusCounts()])
      .then(([data, cnt]) => {
        setApps(data)
        setCounts(cnt)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalIdeeen = apps.length
  const inOntwikkeling = counts?.in_ontwikkeling ?? 0
  const top10 = apps.slice(0, 10)
  const urenwinstTop10 = top10.reduce(
    (sum, a) => sum + (a.urenwinst_per_jaar ?? 0),
    0
  )
  const aantalRisico = apps.filter((a) => a.risico === true).length

  const zorgwaardeVerdeling = [1, 2, 3, 4, 5].map((z) => ({
    waarde: z,
    count: apps.filter((a) => a.zorgwaarde === z).length,
  }))
  const bouwVerdeling = [
    { label: 'S', count: apps.filter((a) => a.bouwinspanning === 'S').length },
    { label: 'M', count: apps.filter((a) => a.bouwinspanning === 'M').length },
    { label: 'L', count: apps.filter((a) => a.bouwinspanning === 'L').length },
  ]
  const maxZorg = Math.max(1, ...zorgwaardeVerdeling.map((x) => x.count))
  const maxBouw = Math.max(1, ...bouwVerdeling.map((x) => x.count))

  if (loading) {
    return <p className="text-ijsselheem-donkerblauw">Laden…</p>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Dashboard</h2>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
          <p className="text-sm font-medium text-ijsselheem-donkerblauw/70">Totaal aantal ideeën</p>
          <p className="text-2xl font-bold text-ijsselheem-donkerblauw">{totalIdeeen}</p>
        </div>
        <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
          <p className="text-sm font-medium text-ijsselheem-donkerblauw/70">Aantal in ontwikkeling</p>
          <p className="text-2xl font-bold text-ijsselheem-donkerblauw">{inOntwikkeling}</p>
        </div>
        <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
          <p className="text-sm font-medium text-ijsselheem-donkerblauw/70">Totale urenwinst top 10</p>
          <p className="text-2xl font-bold text-ijsselheem-donkerblauw">
            {urenwinstTop10.toLocaleString('nl-NL', { maximumFractionDigits: 0 })} u
          </p>
        </div>
        <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
          <p className="text-sm font-medium text-ijsselheem-donkerblauw/70">Aantal met risico = Ja</p>
          <p className="text-2xl font-bold text-ijsselheem-donkerblauw">{aantalRisico}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw mb-3">Verdeling zorgwaarde</h3>
          <div className="space-y-2">
            {zorgwaardeVerdeling.map(({ waarde, count }) => (
              <div key={waarde} className="flex items-center gap-2">
                <span className="w-6 text-sm font-medium text-ijsselheem-donkerblauw">{waarde}</span>
                <div className="flex-1 h-6 bg-ijsselheem-lichtblauw rounded overflow-hidden">
                  <div
                    className="h-full bg-ijsselheem-accentblauw rounded"
                    style={{ width: `${(count / maxZorg) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-ijsselheem-donkerblauw w-8">{count}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw mb-3">Verdeling bouwinspanning</h3>
          <div className="space-y-2">
            {bouwVerdeling.map(({ label, count }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-6 text-sm font-medium text-ijsselheem-donkerblauw">{label}</span>
                <div className="flex-1 h-6 bg-ijsselheem-lichtblauw rounded overflow-hidden">
                  <div
                    className="h-full bg-ijsselheem-middenblauw rounded"
                    style={{ width: `${(count / maxBouw) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-ijsselheem-donkerblauw w-8">{count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white overflow-hidden">
        <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw p-4 border-b border-ijsselheem-accentblauw/30">
          Top 10 op prioriteit
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ijsselheem-lichtblauw/50 text-left">
                <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Titel</th>
                <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Domein</th>
                <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Zorgwaarde</th>
                <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Werkbesparing-score</th>
                <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Bouwinspanning</th>
                <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Prioriteitsscore</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((app) => (
                <tr key={app.id} className="border-t border-ijsselheem-accentblauw/20">
                  <td className="p-3">
                    <Link
                      to={`/backlog/${app.id}`}
                      className="font-medium text-ijsselheem-donkerblauw hover:underline"
                    >
                      {app.naam}
                    </Link>
                  </td>
                  <td className="p-3 text-ijsselheem-donkerblauw">{app.domein ?? '—'}</td>
                  <td className="p-3 text-ijsselheem-donkerblauw">{app.zorgwaarde ?? '—'}</td>
                  <td className="p-3 text-ijsselheem-donkerblauw">{app.werkbesparing_score ?? '—'}</td>
                  <td className="p-3 text-ijsselheem-donkerblauw">{app.bouwinspanning ?? '—'}</td>
                  <td className="p-3 font-medium text-ijsselheem-donkerblauw">
                    {app.prioriteitsscore != null ? app.prioriteitsscore.toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {top10.length === 0 && (
          <p className="p-4 text-ijsselheem-donkerblauw/80">Geen ideeën met prioriteitsscore.</p>
        )}
      </section>
    </div>
  )
}
