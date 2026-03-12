import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { createWensInBak } from '@/lib/wensenBak'
import { urenwinstPerJaar } from '@/lib/prioritering'
import { bepaalBeveiligingsniveau, getBeveiligingsniveauLabel } from '@/lib/beveiligingsniveau'
import { useReferenceOptions } from '@/hooks/useReferenceOptions'
import { cn } from '@/lib/utils'

export function WensIndienen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { options: domeinOptions } = useReferenceOptions('domein')
  const { options: zorgimpactTypeOptions } = useReferenceOptions('zorgimpact_type')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    naam: '',
    probleemomschrijving: '',
    domein: '',
    proces: '',
    frequentie_per_week: '' as string,
    minuten_per_medewerker_per_week: '' as string,
    aantal_medewerkers: '' as string,
    zorgimpact_type: '',
  })
  const [beveiliging, setBeveiliging] = useState({
    clientgegevens: false,
    medewerkersgegevens: false,
    intern_team: false,
  })

  const freq = form.frequentie_per_week ? Number(form.frequentie_per_week) : null
  const min = form.minuten_per_medewerker_per_week ? Number(form.minuten_per_medewerker_per_week) : null
  const med = form.aantal_medewerkers ? Number(form.aantal_medewerkers) : null
  const urenwinst = urenwinstPerJaar(freq, min, med)
  const beveiligingsniveau = bepaalBeveiligingsniveau(beveiliging)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.naam.trim()) {
      setError('Titel is verplicht.')
      return
    }
    if (!user?.id) {
      setError('Je moet ingelogd zijn om een wens in te dienen.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await createWensInBak(user.id, {
        naam: form.naam.trim(),
        probleemomschrijving: form.probleemomschrijving.trim() || null,
        domein: form.domein || null,
        proces: form.proces.trim() || null,
        frequentie_per_week: freq ?? null,
        minuten_per_medewerker_per_week: min ?? null,
        aantal_medewerkers: med ?? null,
        zorgimpact_type: form.zorgimpact_type || null,
        clientgegevens: beveiliging.clientgegevens,
        medewerkersgegevens: beveiliging.medewerkersgegevens,
        intern_team: beveiliging.intern_team,
      })
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Indienen mislukt')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-xl space-y-4">
        <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Wens ontvangen</h2>
        <p className="text-ijsselheem-donkerblauw">
          Uw wens is opgenomen in onze wensenbak. De productowners beoordelen of deze op de wensenlijst komt.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Naar home
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Wens indienen</h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80">
        Heeft u een idee of wens voor een applicatie? Vul het formulier in. Uw wens komt in de wensenbak; productowners bepalen of deze op onze wensenlijst wordt gezet.
      </p>
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw">1. Uw wens</h3>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Titel *</label>
            <input
              type="text"
              value={form.naam}
              onChange={(e) => setForm((f) => ({ ...f, naam: e.target.value }))}
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              placeholder="Korte titel van uw wens"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Toelichting</label>
            <textarea
              value={form.probleemomschrijving}
              onChange={(e) => setForm((f) => ({ ...f, probleemomschrijving: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              placeholder="Optioneel: beschrijf het probleem of de wens"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Domein</label>
              <select
                value={form.domein}
                onChange={(e) => setForm((f) => ({ ...f, domein: e.target.value }))}
                className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              >
                <option value="">— Kies</option>
                {domeinOptions.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Proces</label>
              <input
                type="text"
                value={form.proces}
                onChange={(e) => setForm((f) => ({ ...f, proces: e.target.value }))}
                className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                placeholder="Optioneel"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw">2. Werkbelasting (optioneel)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Frequentie per week</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.frequentie_per_week}
                onChange={(e) => setForm((f) => ({ ...f, frequentie_per_week: e.target.value }))}
                className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Minuten per medewerker per keer</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.minuten_per_medewerker_per_week}
                onChange={(e) => setForm((f) => ({ ...f, minuten_per_medewerker_per_week: e.target.value }))}
                className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Aantal medewerkers</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.aantal_medewerkers}
                onChange={(e) => setForm((f) => ({ ...f, aantal_medewerkers: e.target.value }))}
                className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          {urenwinst != null && (
            <div className="rounded-lg bg-ijsselheem-lichtblauw/50 p-3">
              <span className="text-sm font-medium text-ijsselheem-donkerblauw">Geschatte urenwinst per jaar: </span>
              <span className="text-sm font-bold text-ijsselheem-donkerblauw">
                {urenwinst.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} uur
              </span>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw">3. Zorgimpact (optioneel)</h3>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Zorgimpact type</label>
            <select
              value={form.zorgimpact_type}
              onChange={(e) => setForm((f) => ({ ...f, zorgimpact_type: e.target.value }))}
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
            >
              <option value="">— Kies</option>
              {zorgimpactTypeOptions.map((z) => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw">4. Beveiligingsniveau (optioneel)</h3>
          <p className="text-sm text-ijsselheem-donkerblauw/80">
            Beantwoord de vragen zodat we het beveiligingsniveau kunnen inschatten.
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-ijsselheem-donkerblauw mb-1">Bevat de applicatie cliëntgegevens?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBeveiliging((b) => ({ ...b, clientgegevens: true }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', beveiliging.clientgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => setBeveiliging((b) => ({ ...b, clientgegevens: false }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', !beveiliging.clientgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                >
                  Nee
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-ijsselheem-donkerblauw mb-1">Bevat de applicatie persoonsgegevens van medewerkers?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBeveiliging((b) => ({ ...b, medewerkersgegevens: true }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', beveiliging.medewerkersgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => setBeveiliging((b) => ({ ...b, medewerkersgegevens: false }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', !beveiliging.medewerkersgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                >
                  Nee
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-ijsselheem-donkerblauw mb-1">Is de applicatie bedoeld voor intern gebruik door een team of locatie?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBeveiliging((b) => ({ ...b, intern_team: true }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', beveiliging.intern_team ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => setBeveiliging((b) => ({ ...b, intern_team: false }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', !beveiliging.intern_team ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                >
                  Nee
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-ijsselheem-lichtblauw/50 p-3">
            <span className="text-sm font-medium text-ijsselheem-donkerblauw">Ingeschat niveau: </span>
            <span className="text-sm font-bold text-ijsselheem-donkerblauw">{getBeveiligingsniveauLabel(beveiligingsniveau)}</span>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting || !form.naam.trim()}
          className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Bezig…' : 'Wens indienen'}
        </button>
      </form>
    </div>
  )
}
