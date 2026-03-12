import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchFeaturesNeedingBeoordeling } from '@/lib/roadmap'
import type { BacklogFeatureRow } from '@/types/roadmap'
import { BeveiligingsniveauBadge } from '@/components/BeveiligingsniveauBadge'

/** Lijst van features die nog beoordeling nodig hebben (geen zorgwaarde of geen bouwinspanning). */
export function Beoordelen() {
  const [rows, setRows] = useState<BacklogFeatureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [zoek, setZoek] = useState('')

  useEffect(() => {
    fetchFeaturesNeedingBeoordeling()
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  const sortedRows = useMemo(() => {
    let list = [...rows]
    if (zoek.trim()) {
      const q = zoek.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.app_naam?.toLowerCase().includes(q) ||
          r.feature.naam?.toLowerCase().includes(q) ||
          r.app_domein?.toLowerCase().includes(q) ||
          r.app_aanspreekpunt_intern?.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => {
      const pa = a.feature.prioriteitsscore ?? -Infinity
      const pb = b.feature.prioriteitsscore ?? -Infinity
      if (pa !== pb) return pb - pa
      return `${a.app_naam} · ${a.feature.naam}`.localeCompare(`${b.app_naam} · ${b.feature.naam}`)
    })
  }, [rows, zoek])

  if (loading) return <p className="text-ijsselheem-donkerblauw">Laden…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Beoordelen</h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80">
        Features zonder zorgwaarde of bouwinspanning. Klik om te beoordelen. De prioriteitsscore
        staat op de feature; na invullen kun je het programma op het werkbord (Planning) naar
        Oppakken zetten.
      </p>
      {rows.length === 0 ? (
        <p className="text-ijsselheem-donkerblauw/80">Geen openstaande beoordelingen.</p>
      ) : (
        <>
          <input
            type="search"
            placeholder="Zoeken op programma, feature, domein, aanspreekpunt..."
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-1.5 text-sm w-56"
          />
          <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              {sortedRows.length === 0 ? (
                <p className="p-4 text-ijsselheem-donkerblauw/80 text-sm">Geen items.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ijsselheem-lichtblauw/50 text-left">
                      <th className="p-2 whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                        Programma · Feature
                      </th>
                      <th className="p-2 whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                        Domein
                      </th>
                      <th className="p-2 whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                        Aanspreekpunt intern
                      </th>
                      <th className="p-2 whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                        Urenwinst (aanvraag)
                      </th>
                      <th className="p-2 whitespace-nowrap font-semibold text-ijsselheem-donkerblauw">
                        Zorgimpact (aanvraag)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row) => (
                      <tr
                        key={row.feature.id}
                        className="border-t border-ijsselheem-accentblauw/20"
                      >
                        <td className="p-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/backlog/feature/${row.feature.id}?focus=beoordelen&view=compact`}
                              className="font-medium text-ijsselheem-donkerblauw hover:underline"
                            >
                              {row.app_naam} · {row.feature.naam}
                            </Link>
                            <BeveiligingsniveauBadge level={row.app_beveiligingsniveau} shortLabel />
                          </div>
                        </td>
                        <td className="p-2 text-ijsselheem-donkerblauw">{row.app_domein ?? '—'}</td>
                        <td className="p-2 text-ijsselheem-donkerblauw text-xs">
                          {row.app_aanspreekpunt_intern ?? '—'}
                        </td>
                        <td className="p-2 text-ijsselheem-donkerblauw">
                          {row.app_urenwinst_per_jaar != null
                            ? row.app_urenwinst_per_jaar.toLocaleString('nl-NL', {
                                maximumFractionDigits: 0,
                              })
                            : '—'}
                        </td>
                        <td className="p-2 text-ijsselheem-donkerblauw/80 text-xs">
                          {row.app_zorgimpact_type ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
