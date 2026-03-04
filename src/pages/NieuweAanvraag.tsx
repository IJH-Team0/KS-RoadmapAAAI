import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { urenwinstPerJaar } from '@/lib/prioritering'
import { createApp, fetchAppsForBacklog } from '@/lib/apps'
import { createFeature } from '@/lib/roadmap'
import { DOMEIN_OPTIONS, ZORGIMPACT_TYPE_OPTIONS } from '@/types/app'
import { cn } from '@/lib/utils'

type TypeAanvraag = 'nieuwe_app' | 'nieuwe_feature'

export function NieuweAanvraag() {
  const navigate = useNavigate()
  const [typeAanvraag, setTypeAanvraag] = useState<TypeAanvraag>('nieuwe_app')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successRef, setSuccessRef] = useState<string | null>(null)
  const [successFeatureId, setSuccessFeatureId] = useState<string | null>(null)
  const [appOptions, setAppOptions] = useState<{ id: string; naam: string }[]>([])
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
  const [featureForm, setFeatureForm] = useState({
    appId: '',
    featureNaam: '',
    featureBeschrijving: '',
  })

  useEffect(() => {
    if (typeAanvraag === 'nieuwe_feature') {
      fetchAppsForBacklog()
        .then((apps) => setAppOptions(apps.map((a) => ({ id: a.id, naam: a.naam }))))
        .catch(() => setAppOptions([]))
    }
  }, [typeAanvraag])

  const freq = form.frequentie_per_week ? Number(form.frequentie_per_week) : null
  const min = form.minuten_per_medewerker_per_week ? Number(form.minuten_per_medewerker_per_week) : null
  const med = form.aantal_medewerkers ? Number(form.aantal_medewerkers) : null
  const urenwinst = urenwinstPerJaar(freq, min, med)

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
      })
      setSuccessRef(created.referentie_nummer ?? refNum)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Indienen mislukt')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddFeature = async () => {
    if (!featureForm.appId || !featureForm.featureNaam.trim()) {
      setError('Kies een programma en vul een featurenaam in.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const created = await createFeature(featureForm.appId, {
        naam: featureForm.featureNaam.trim(),
        beschrijving: featureForm.featureBeschrijving.trim() || null,
        status: 'gepland',
      })
      setSuccessFeatureId(created.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Toevoegen mislukt')
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

  if (successFeatureId) {
    return (
      <div className="max-w-xl space-y-4">
        <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Feature toegevoegd</h2>
        <p className="text-ijsselheem-donkerblauw">
          De feature is toegevoegd aan het programma. U kunt deze nu beoordelen op de backlog.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/backlog/feature/${successFeatureId}`)}
          className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Naar beoordeling
        </button>
        <button
          type="button"
          onClick={() => navigate('/backlog')}
          className="ml-2 rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
        >
          Naar Backlog
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Nieuwe aanvraag</h2>
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw">Type aanvraag</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <label
            className={cn(
              'flex-1 rounded-xl border p-4 cursor-pointer transition',
              typeAanvraag === 'nieuwe_app'
                ? 'border-ijsselheem-donkerblauw bg-ijsselheem-lichtblauw/50'
                : 'border-ijsselheem-accentblauw/30 hover:border-ijsselheem-accentblauw/50'
            )}
          >
            <input
              type="radio"
              name="typeAanvraag"
              checked={typeAanvraag === 'nieuwe_app'}
              onChange={() => setTypeAanvraag('nieuwe_app')}
              className="sr-only"
            />
            <span className="block font-medium text-ijsselheem-donkerblauw">Nieuwe app (feature: Basisfunctionaliteit)</span>
            <span className="block mt-1 text-sm text-ijsselheem-donkerblauw/80">
              Een nieuw programma met als eerste feature de Basisfunctionaliteit.
            </span>
          </label>
          <label
            className={cn(
              'flex-1 rounded-xl border p-4 cursor-pointer transition',
              typeAanvraag === 'nieuwe_feature'
                ? 'border-ijsselheem-donkerblauw bg-ijsselheem-lichtblauw/50'
                : 'border-ijsselheem-accentblauw/30 hover:border-ijsselheem-accentblauw/50'
            )}
          >
            <input
              type="radio"
              name="typeAanvraag"
              checked={typeAanvraag === 'nieuwe_feature'}
              onChange={() => setTypeAanvraag('nieuwe_feature')}
              className="sr-only"
            />
            <span className="block font-medium text-ijsselheem-donkerblauw">Nieuwe feature bij bestaand programma</span>
            <span className="block mt-1 text-sm text-ijsselheem-donkerblauw/80">
              Een extra feature toevoegen aan een bestaand programma; deze krijgt een eigen beoordeling op de backlog.
            </span>
          </label>
        </div>
        {typeAanvraag === 'nieuwe_app' && (
          <p className="text-sm text-ijsselheem-donkerblauw/80 pt-1">
            U maakt een nieuw programma aan; de feature &quot;Basisfunctionaliteit&quot; wordt automatisch aangemaakt.
          </p>
        )}
      </section>

      {typeAanvraag === 'nieuwe_feature' ? (
        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw">Nieuwe feature</h3>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Programma *</label>
            <select
              value={featureForm.appId}
              onChange={(e) => setFeatureForm((f) => ({ ...f, appId: e.target.value }))}
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
            >
              <option value="">— Kies programma</option>
              {appOptions.map((a) => (
                <option key={a.id} value={a.id}>{a.naam}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Featurenaam *</label>
            <input
              type="text"
              value={featureForm.featureNaam}
              onChange={(e) => setFeatureForm((f) => ({ ...f, featureNaam: e.target.value }))}
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              placeholder="Naam van de feature"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Beschrijving</label>
            <textarea
              value={featureForm.featureBeschrijving}
              onChange={(e) => setFeatureForm((f) => ({ ...f, featureBeschrijving: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              placeholder="Optioneel"
            />
          </div>
          <button
            type="button"
            onClick={handleAddFeature}
            disabled={submitting || !featureForm.appId || !featureForm.featureNaam.trim()}
            className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Toevoegen…' : 'Feature toevoegen'}
          </button>
        </section>
      ) : (
        <>
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
              {DOMEIN_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
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
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Minuten per medewerker per week</label>
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
            {ZORGIMPACT_TYPE_OPTIONS.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
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
        </>
      )}
    </div>
  )
}
