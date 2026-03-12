import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAppsTestEnProductieNogNietPubliek } from '@/lib/apps'
import type { App } from '@/types/app'
import { getStatusLabel } from '@/types/app'
import { BeveiligingsniveauBadge } from '@/components/BeveiligingsniveauBadge'

/** Stap 8: applicaties in Test of Productie die nog niet publiek zijn gezet. Klik om op het tabblad Publicatie te beheren. */
export function PublicatieAfronden() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppsTestEnProductieNogNietPubliek()
      .then(setApps)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-ijsselheem-donkerblauw">Laden…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Publicatie afronden</h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80">
        Applicaties die in Test of Productie staan maar nog niet publiek zijn gezet. Klik op een app om het tabblad Publicatie te openen en publicatie af te ronden.
      </p>
      {apps.length === 0 ? (
        <p className="text-ijsselheem-donkerblauw/80">Geen apps die nog publiek gezet moeten worden.</p>
      ) : (
        <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white overflow-hidden">
          <ul className="divide-y divide-ijsselheem-accentblauw/20">
            {apps.map((app) => (
              <li key={app.id}>
                <Link
                  to={`/backlog/${app.id}?tab=publicatie`}
                  className="flex flex-wrap items-center gap-2 p-3 hover:bg-ijsselheem-lichtblauw/30 transition"
                >
                  <span className="font-medium text-ijsselheem-donkerblauw hover:underline">
                    {app.naam}
                  </span>
                  <BeveiligingsniveauBadge level={app.beveiligingsniveau} shortLabel />
                  <span className="text-xs text-ijsselheem-donkerblauw/80">
                    {getStatusLabel(app.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
