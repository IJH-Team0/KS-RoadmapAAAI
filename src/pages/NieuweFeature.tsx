import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { urenwinstPerJaar } from '@/lib/prioritering'
import { bepaalBeveiligingsniveau, getBeveiligingsniveauLabel } from '@/lib/beveiligingsniveau'
import { fetchAppsForBacklog, updateApp } from '@/lib/apps'
import { createFeature, updateFeature } from '@/lib/roadmap'
import { useReferenceOptions } from '@/hooks/useReferenceOptions'
import { cn } from '@/lib/utils'

export function NieuweFeature() {
  const navigate = useNavigate()
  const { options: zorgimpactTypeOptions } = useReferenceOptions('zorgimpact_type')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successFeatureId, setSuccessFeatureId] = useState<string | null>(null)
  const [appOptions, setAppOptions] = useState<{ id: string; naam: string }[]>([])
  const [featureForm, setFeatureForm] = useState({
    appId: '',
    featureNaam: '',
    featureBeschrijving: '',
    frequentie_per_week: '' as string,
    minuten_per_medewerker_per_week: '' as string,
    aantal_medewerkers: '' as string,
    zorgimpact_type: '',
  })
  const [featureBeveiliging, setFeatureBeveiliging] = useState({
    clientgegevens: false,
    medewerkersgegevens: false,
    intern_team: false,
  })

  useEffect(() => {
    fetchAppsForBacklog()
      .then((apps) => setAppOptions(apps.map((a) => ({ id: a.id, naam: a.naam }))))
      .catch(() => setAppOptions([]))
  }, [])

  const featureFreq = featureForm.frequentie_per_week ? Number(featureForm.frequentie_per_week) : null
  const featureMin = featureForm.minuten_per_medewerker_per_week ? Number(featureForm.minuten_per_medewerker_per_week) : null
  const featureMed = featureForm.aantal_medewerkers ? Number(featureForm.aantal_medewerkers) : null
  const featureUrenwinst = urenwinstPerJaar(featureFreq, featureMin, featureMed)
  const featureBeveiligingsniveau = bepaalBeveiligingsniveau(featureBeveiliging)

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
      })
      const updatePayload = {
        frequentie_per_week: featureFreq ?? null,
        minuten_per_medewerker_per_week: featureMin ?? null,
        aantal_medewerkers: featureMed ?? null,
        zorgimpact_type: featureForm.zorgimpact_type || null,
        urenwinst_per_jaar: featureUrenwinst ?? null,
      }
      const hasPrioritering = updatePayload.frequentie_per_week != null || updatePayload.minuten_per_medewerker_per_week != null || updatePayload.aantal_medewerkers != null || updatePayload.zorgimpact_type != null || updatePayload.urenwinst_per_jaar != null
      if (hasPrioritering) {
        await updateFeature(created.id, updatePayload)
      }
      if (featureBeveiligingsniveau) {
        await updateApp(featureForm.appId, { beveiligingsniveau: featureBeveiligingsniveau })
      }
      setSuccessFeatureId(created.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Toevoegen mislukt')
    } finally {
      setSubmitting(false)
    }
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
      <div className="flex items-center gap-3">
        <Link to="/nieuw" className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline">
          ← Terug
        </Link>
      </div>
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Nieuwe feature</h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80">
        Een extra feature toevoegen aan een bestaand programma; deze krijgt een eigen beoordeling op de backlog.
      </p>
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

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

        <div className="border-t border-ijsselheem-accentblauw/30 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-ijsselheem-donkerblauw mb-3">Werkbelasting</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Frequentie (per week)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={featureForm.frequentie_per_week}
                onChange={(e) => setFeatureForm((f) => ({ ...f, frequentie_per_week: e.target.value }))}
                className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Minuten per medewerker per keer</label>
              <input
                type="number"
                min={0}
                step={1}
                value={featureForm.minuten_per_medewerker_per_week}
                onChange={(e) => setFeatureForm((f) => ({ ...f, minuten_per_medewerker_per_week: e.target.value }))}
                className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Aantal medewerkers</label>
              <input
                type="number"
                min={0}
                step={1}
                value={featureForm.aantal_medewerkers}
                onChange={(e) => setFeatureForm((f) => ({ ...f, aantal_medewerkers: e.target.value }))}
                className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="rounded-lg bg-ijsselheem-lichtblauw/50 p-3 mt-3">
            <span className="text-sm font-medium text-ijsselheem-donkerblauw">Urenwinst per jaar: </span>
            <span className="text-sm font-bold text-ijsselheem-donkerblauw">
              {featureUrenwinst != null
                ? featureUrenwinst.toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' uur'
                : '—'}
            </span>
          </div>
        </div>

        <div className="border-t border-ijsselheem-accentblauw/30 pt-4">
          <h4 className="text-sm font-semibold text-ijsselheem-donkerblauw mb-3">Zorgimpact</h4>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Zorgimpact type</label>
            <select
              value={featureForm.zorgimpact_type}
              onChange={(e) => setFeatureForm((f) => ({ ...f, zorgimpact_type: e.target.value }))}
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
            >
              <option value="">— Kies</option>
              {zorgimpactTypeOptions.map((z) => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-ijsselheem-accentblauw/30 pt-4">
          <h4 className="text-sm font-semibold text-ijsselheem-donkerblauw mb-3">Beveiligingsniveau</h4>
          <p className="text-sm text-ijsselheem-donkerblauw/80 mb-3">
            Beantwoord de vragen zodat we het beveiligingsniveau van het programma kunnen bepalen.
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-ijsselheem-donkerblauw mb-1">Bevat de applicatie cliëntgegevens?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFeatureBeveiliging((b) => ({ ...b, clientgegevens: true }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', featureBeveiliging.clientgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => setFeatureBeveiliging((b) => ({ ...b, clientgegevens: false }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', !featureBeveiliging.clientgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
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
                  onClick={() => setFeatureBeveiliging((b) => ({ ...b, medewerkersgegevens: true }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', featureBeveiliging.medewerkersgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => setFeatureBeveiliging((b) => ({ ...b, medewerkersgegevens: false }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', !featureBeveiliging.medewerkersgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
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
                  onClick={() => setFeatureBeveiliging((b) => ({ ...b, intern_team: true }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', featureBeveiliging.intern_team ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => setFeatureBeveiliging((b) => ({ ...b, intern_team: false }))}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', !featureBeveiliging.intern_team ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                >
                  Nee
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-ijsselheem-lichtblauw/50 p-3 mt-3">
            <span className="text-sm font-medium text-ijsselheem-donkerblauw">Bepaald niveau: </span>
            <span className="text-sm font-bold text-ijsselheem-donkerblauw">{getBeveiligingsniveauLabel(featureBeveiligingsniveau)}</span>
          </div>
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
    </div>
  )
}
