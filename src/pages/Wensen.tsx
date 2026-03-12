import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchWensenBak,
  fetchMijnWensen,
  type WensInBak,
  type WensenBakStatus,
} from '@/lib/wensenBak'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<WensenBakStatus, string> = {
  ingediend: 'Ingediend',
  opgenomen: 'Opgenomen',
  afgekeurd: 'Afgekeurd',
}

export function Wensen() {
  const { effectiveRole } = useAuth()
  const [wensen, setWensen] = useState<WensInBak[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = effectiveRole === 'admin'

  useEffect(() => {
    setLoading(true)
    setError(null)
    const fetch = isAdmin ? () => fetchWensenBak('ingediend') : fetchMijnWensen
    fetch()
      .then(setWensen)
      .catch((e) => setError(e instanceof Error ? e.message : 'Laden mislukt'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  if (loading) return <p className="text-ijsselheem-donkerblauw">Laden…</p>
  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            const fetch = isAdmin ? () => fetchWensenBak('ingediend') : fetchMijnWensen
            fetch()
              .then(setWensen)
              .catch((e) => setError(e instanceof Error ? e.message : 'Laden mislukt'))
              .finally(() => setLoading(false))
          }}
          className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
        >
          Opnieuw laden
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">
        {isAdmin ? 'Ingediende wensen' : 'Mijn wensen'}
      </h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80">
        {isAdmin
          ? 'Beoordel ingediende wensen: open een wens om een reactie te geven en deze af te keuren of op de wensenlijst te zetten.'
          : 'Overzicht van uw ingediende wensen en de status daarvan.'}
      </p>
      {wensen.length === 0 ? (
        <p className="text-ijsselheem-donkerblauw/80">
          {isAdmin ? 'Geen ingediende wensen.' : 'U heeft nog geen wensen ingediend.'}
        </p>
      ) : (
        <div className="space-y-4">
          {wensen.map((wens) => (
            <div
              key={wens.id}
              className={cn(
                'rounded-xl border bg-white p-4 transition',
                isAdmin
                  ? 'border-ijsselheem-accentblauw/30 hover:border-ijsselheem-donkerblauw/50'
                  : 'border-ijsselheem-accentblauw/30'
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {isAdmin ? (
                    <Link
                      to={`/wensen/${wens.id}`}
                      className="font-medium text-ijsselheem-donkerblauw hover:underline"
                    >
                      {wens.naam}
                    </Link>
                  ) : (
                    <Link
                      to={`/wensen/${wens.id}`}
                      className="font-medium text-ijsselheem-donkerblauw hover:underline"
                    >
                      {wens.naam}
                    </Link>
                  )}
                  <p className="text-sm text-ijsselheem-donkerblauw/80 mt-1 line-clamp-2">
                    {wens.probleemomschrijving || '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ijsselheem-donkerblauw/70">
                    {wens.domein && <span>Domein: {wens.domein}</span>}
                    {wens.created_at && (
                      <span>Ingediend: {new Date(wens.created_at).toLocaleDateString('nl-NL')}</span>
                    )}
                    {!isAdmin && (
                      <span
                        className={cn(
                          'font-medium',
                          wens.status === 'afgekeurd' && 'text-red-700',
                          wens.status === 'opgenomen' && 'text-green-700'
                        )}
                      >
                        Status: {STATUS_LABELS[wens.status]}
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <Link
                    to={`/wensen/${wens.id}`}
                    className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw shrink-0"
                  >
                    Beoordelen
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
