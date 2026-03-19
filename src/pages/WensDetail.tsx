import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchWensBakById,
  updateWensBakOpgenomen,
  updateWensBakAfgekeurd,
  type WensInBak,
  type WensenBakStatus,
} from '@/lib/wensenBak'
import { createApp } from '@/lib/apps'
import { bepaalBeveiligingsniveau, getBeveiligingsniveauLabel } from '@/lib/beveiligingsniveau'
import { urenwinstPerJaar } from '@/lib/prioritering'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<WensenBakStatus, string> = {
  ingediend: 'Ingediend',
  opgenomen: 'Opgenomen',
  afgekeurd: 'Afgekeurd',
}

export function WensDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { effectiveRole } = useAuth()
  const [wens, setWens] = useState<WensInBak | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reactie, setReactie] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const isAdmin = effectiveRole === 'admin'

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetchWensBakById(id)
      .then((w) => {
        setWens(w ?? null)
        if (w?.reactie) setReactie(w.reactie)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Laden mislukt'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAfkeuren = async () => {
    if (!wens) return
    setActionError(null)
    setSaving(true)
    try {
      await updateWensBakAfgekeurd(wens.id, reactie.trim() || null)
      navigate('/wensen')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Afkeuren mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleOpWensenlijst = async () => {
    if (!wens) return
    setActionError(null)
    setSaving(true)
    try {
      const beveiligingsniveau = bepaalBeveiligingsniveau({
        clientgegevens: wens.clientgegevens,
        medewerkersgegevens: wens.medewerkersgegevens,
        intern_team: wens.intern_team,
      })
      const urenwinst = urenwinstPerJaar(
        wens.frequentie_per_week ?? undefined,
        wens.minuten_per_medewerker_per_week ?? undefined,
        wens.aantal_medewerkers ?? undefined
      )
      const app = await createApp({
        naam: wens.naam,
        concept: false,
        probleemomschrijving: wens.probleemomschrijving ?? null,
        domein: wens.domein ?? null,
        proces: wens.proces ?? null,
        frequentie_per_week: wens.frequentie_per_week ?? null,
        minuten_per_medewerker_per_week: wens.minuten_per_medewerker_per_week ?? null,
        aantal_medewerkers: wens.aantal_medewerkers ?? null,
        zorgimpact_type: wens.zorgimpact_type ?? null,
        urenwinst_per_jaar: urenwinst ?? undefined,
        beveiligingsniveau,
      })
      await updateWensBakOpgenomen(wens.id, app.id, reactie.trim() || null)
      navigate('/backlog')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Op wensenlijst zetten mislukt')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-ijsselheem-donkerblauw">Laden…</p>
  if (error || !wens) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
          {error || 'Wens niet gevonden.'}
        </p>
        <Link
          to="/wensen"
          className="inline-block rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
        >
          Terug naar wensen
        </Link>
      </div>
    )
  }

  const beveiligingsniveau = bepaalBeveiligingsniveau({
    clientgegevens: wens.clientgegevens,
    medewerkersgegevens: wens.medewerkersgegevens,
    intern_team: wens.intern_team,
  })
  const urenwinst = urenwinstPerJaar(
    wens.frequentie_per_week ?? undefined,
    wens.minuten_per_medewerker_per_week ?? undefined,
    wens.aantal_medewerkers ?? undefined
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/wensen"
          className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline"
        >
          ← Terug naar wensen
        </Link>
      </div>
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">{wens.naam}</h2>
      <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4 text-sm">
        <div>
          <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Probleemomschrijving</span>
          <p className="mt-0.5 text-ijsselheem-donkerblauw whitespace-pre-wrap">
            {wens.probleemomschrijving || '—'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {wens.domein && (
            <div>
              <span className="text-xs text-ijsselheem-donkerblauw/70">Domein</span>
              <p className="font-medium text-ijsselheem-donkerblauw">{wens.domein}</p>
            </div>
          )}
          {wens.proces && (
            <div>
              <span className="text-xs text-ijsselheem-donkerblauw/70">Proces</span>
              <p className="font-medium text-ijsselheem-donkerblauw">{wens.proces}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-ijsselheem-donkerblauw/70">Ingediend op</span>
            <p className="font-medium text-ijsselheem-donkerblauw">
              {new Date(wens.created_at).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="text-xs text-ijsselheem-donkerblauw/70">Status</span>
            <p
              className={cn(
                'font-medium',
                wens.status === 'afgekeurd' && 'text-red-700',
                wens.status === 'opgenomen' && 'text-green-700'
              )}
            >
              {STATUS_LABELS[wens.status]}
            </p>
          </div>
        </div>
        {(wens.frequentie_per_week != null ||
          wens.minuten_per_medewerker_per_week != null ||
          wens.aantal_medewerkers != null ||
          wens.zorgimpact_type ||
          urenwinst != null) && (
          <div className="border-t border-ijsselheem-accentblauw/20 pt-3">
            <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Werkbelasting / impact</span>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-ijsselheem-donkerblauw">
              {wens.frequentie_per_week != null && <span>Frequentie: {wens.frequentie_per_week}/week</span>}
              {wens.minuten_per_medewerker_per_week != null && (
                <span>Min/medewerker: {wens.minuten_per_medewerker_per_week}</span>
              )}
              {wens.aantal_medewerkers != null && <span>Medewerkers: {wens.aantal_medewerkers}</span>}
              {urenwinst != null && (
                <span>Urenwinst: {urenwinst.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} u/j</span>
              )}
              {wens.zorgimpact_type && <span>Zorgimpact: {wens.zorgimpact_type}</span>}
            </div>
          </div>
        )}
        <div>
          <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Beveiligingsniveau (indicatief)</span>
          <p className="mt-0.5 font-medium text-ijsselheem-donkerblauw">
            {getBeveiligingsniveauLabel(beveiligingsniveau)}
          </p>
        </div>
        {(wens.reactie || isAdmin) && (
          <div className="border-t border-ijsselheem-accentblauw/20 pt-3">
            <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">
              Reactie product owner
            </span>
            {isAdmin ? (
              <textarea
                value={reactie}
                onChange={(e) => setReactie(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                placeholder="Optioneel: reactie aan de indiener (bij afkeuren of opnemen)"
              />
            ) : (
              <p className="mt-0.5 text-ijsselheem-donkerblauw whitespace-pre-wrap">
                {wens.reactie || '—'}
              </p>
            )}
          </div>
        )}
      </div>

      {isAdmin && wens.status === 'ingediend' && (
        <>
          {actionError && (
            <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{actionError}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAfkeuren}
              disabled={saving}
              className="rounded-ijsselheem-button border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {saving ? 'Bezig…' : 'Afkeuren'}
            </button>
            <button
              type="button"
              onClick={handleOpWensenlijst}
              disabled={saving}
              className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Bezig…' : 'Op wensenlijst zetten'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
