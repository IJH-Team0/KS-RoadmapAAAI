import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { urenwinstPerJaar } from '@/lib/prioritering'
import { bepaalBeveiligingsniveau, getBeveiligingsniveauLabel } from '@/lib/beveiligingsniveau'
import { createApp } from '@/lib/apps'
import { useReferenceOptions } from '@/hooks/useReferenceOptions'
import { cn } from '@/lib/utils'

export function NieuweProgramma() {
  const navigate = useNavigate()
  const { options: domeinOptions } = useReferenceOptions('domein')
  const { options: zorgimpactTypeOptions } = useReferenceOptions('zorgimpact_type')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successRef, setSuccessRef] = useState<string | null>(null)
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

  const handleSaveConcept = async () => {
    if (!form.naam.trim()) {
      setError('Titel is verplicht.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const u = urenwinst ?? undefined
      await createApp({
        naam: form.naam.trim(),
        status: 'wensenlijst',
        concept: true,
        probleemomschrijving: form.probleemomschrijving.trim() || null,
        domein: form.domein || null,
        proces: form.proces.trim() || null,
        frequentie_per_week: freq ?? null,
        minuten_per_medewerker_per_week: min ?? null,
        aantal_medewerkers: med ?? null,
        zorgimpact_type: form.zorgimpact_type || null,
        urenwinst_per_jaar: u ?? null,
        beveiligingsniveau,
      })
      navigate('/backlog')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setSubmitting(false)
    }
  }

  const handleIndienen = async () => {
    if (!form.naam.trim()) {
      setError('Titel is verplicht.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const u = urenwinst ?? undefined
      const refNum = `REF-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      const created = await createApp({
        naam: form.naam.trim(),
        status: 'wensenlijst',
        concept: false,
        probleemomschrijving: form.probleemomschrijving.trim() || null,
        domein: form.domein || null,
        proces: form.proces.trim() || null,
        frequentie_per_week: freq ?? null,
        minuten_per_medewerker_per_week: min ?? null,
        aantal_medewerkers: med ?? null,
        zorgimpact_type: form.zorgimpact_type || null,
        referentie_nummer: refNum,
        urenwinst_per_jaar: u ?? null,
        beveiligingsniveau,
      })
      setSuccessRef(created.referentie_nummer ?? refNum)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Indienen mislukt')
    } finally {
      setSubmitting(false)
    }
  }

  if (successRef) {
    return (
      <div className="max-w-xl space-y-4">
        <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Aanvraag ingediend</h2>
        <p className="text-ijsselheem-donkerblauw">
          Uw aanvraag is ontvangen. Referentienummer: <strong>{successRef}</strong>
        </p>
        <button
          type="button"
          onClick={() => navigate('/backlog')}
          className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Naar Backlog
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/nieuw" className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline">
          ← Terug
        </Link>
      </div>
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Nieuw programma</h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80">
        U maakt een nieuw programma aan; de feature &quot;Basisfunctionaliteit&quot; wordt automatisch aangemaakt.
      </p>
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw">1. Probleem</h3>
        <div>
          <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Titel *</label>
          <input
            type="text"
            value={form.naam}
            onChange={(e) => setForm((f) => ({ ...f, naam: e.target.value }))}
            className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
            placeholder="Korte titel"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Probleemomschrijving</label>
          <textarea
            value={form.probleemomschrijving}
            onChange={(e) => setForm((f) => ({ ...f, probleemomschrijving: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
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
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw">2. Werkbelasting</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Frequentie (per week)</label>
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
        <div className="rounded-lg bg-ijsselheem-lichtblauw/50 p-3">
          <span className="text-sm font-medium text-ijsselheem-donkerblauw">Urenwinst per jaar: </span>
          <span className="text-sm font-bold text-ijsselheem-donkerblauw">
            {urenwinst != null
              ? urenwinst.toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' uur'
              : '—'}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw">3. Zorgimpact</h3>
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
        <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw">4. Beveiligingsniveau</h3>
        <p className="text-sm text-ijsselheem-donkerblauw/80">
          Beantwoord de vragen zodat we het beveiligingsniveau kunnen bepalen.
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
          <span className="text-sm font-medium text-ijsselheem-donkerblauw">Bepaald niveau: </span>
          <span className="text-sm font-bold text-ijsselheem-donkerblauw">{getBeveiligingsniveauLabel(beveiligingsniveau)}</span>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSaveConcept}
          disabled={submitting}
          className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50"
        >
          Opslaan als concept
        </button>
        <button
          type="button"
          onClick={handleIndienen}
          disabled={submitting}
          className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Indienen
        </button>
      </div>
    </div>
  )
}
