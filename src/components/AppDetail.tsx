import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { App, AppStatusDb, AppUpdate } from '@/types/app'
import {
  getStatusLabel,
  getBouwinspanningLabel,
  BASISFEATURE_NAAM,
} from '@/types/app'
import { useReferenceOptions } from '@/hooks/useReferenceOptions'
import { BEVEILIGINGSNIVEAU_OPTIONS, getBeveiligingsniveauLabel } from '@/lib/beveiligingsniveau'
import { updateApp } from '@/lib/apps'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchFeaturesByAppId,
  createFeature,
  updateFeature,
  deleteFeature,
  maybeSyncAppStatusToFeaturePlanningStatus,
} from '@/lib/roadmap'
import type { Feature, FeatureInsert } from '@/types/roadmap'
import {
  FEATURE_STATUS_OPTIONS,
  getFeatureStatusLabel,
} from '@/types/roadmap'

export type AppDetailShowOnly = 'algemene' | 'features' | 'all'

interface AppDetailProps {
  app: App
  onSaved: (app: App) => void
  onCancel?: () => void
  /** Alleen dit onderdeel tonen; 'all' = alles (standaard). */
  showOnly?: AppDetailShowOnly
}

function hasValue(v: string | null | undefined): v is string {
  return v != null && String(v).trim() !== ''
}
function hasDateValue(v: string | null | undefined): boolean {
  return v != null && String(v).trim() !== ''
}

export function AppDetail({ app: initialApp, onSaved, onCancel, showOnly = 'all' }: AppDetailProps) {
  const { effectiveRole } = useAuth()
  const { options: appStatusOptions } = useReferenceOptions('app_status')
  const { options: appIconOptions } = useReferenceOptions('app_icon')
  const { options: platformOptions } = useReferenceOptions('platform')
  const { options: complexiteitOptions } = useReferenceOptions('complexiteit')
  const { options: domeinOptions } = useReferenceOptions('domein')
  const { options: zorgimpactTypeOptions } = useReferenceOptions('zorgimpact_type')
  const { options: bouwinspanningOptions } = useReferenceOptions('bouwinspanning')
  const { options: zorgwaardeOptions } = useReferenceOptions('zorgwaarde')
  const [app, setApp] = useState<App>(initialApp)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [features, setFeatures] = useState<Feature[]>([])
  const [loadingFeatures, setLoadingFeatures] = useState(false)
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null)
  const [editFeatureForm, setEditFeatureForm] = useState<Feature | null>(null)
  const [showAddFeature, setShowAddFeature] = useState(false)
  const [addFeatureForm, setAddFeatureForm] = useState<FeatureInsert>({
    naam: '',
    beschrijving: '',
    status: 'gepland',
  })
  const [errorFeature, setErrorFeature] = useState<string | null>(null)
  const [savingFeature, setSavingFeature] = useState(false)

  useEffect(() => {
    setApp(initialApp)
  }, [initialApp])

  const refetchFeatures = () => {
    if (!app.id) return
    setLoadingFeatures(true)
    fetchFeaturesByAppId(app.id)
      .then((list) => {
        setFeatures(
          [...list].sort((a, b) =>
            a.naam === BASISFEATURE_NAAM ? -1 : b.naam === BASISFEATURE_NAAM ? 1 : a.naam.localeCompare(b.naam)
          )
        )
      })
      .finally(() => setLoadingFeatures(false))
  }

  useEffect(() => {
    if (!app.id) {
      setFeatures([])
      return
    }
    refetchFeatures()
  }, [app.id])

  const handleSaveFeature = async () => {
    if (!editingFeatureId || !editFeatureForm) return
    setSavingFeature(true)
    setErrorFeature(null)
    try {
      const planningStatus = editFeatureForm.planning_status ?? null
      await updateFeature(editingFeatureId, {
        naam: editFeatureForm.naam,
        beschrijving: editFeatureForm.beschrijving ?? null,
        status: editFeatureForm.status,
        planning_status: planningStatus,
      })
      if (planningStatus) {
        await maybeSyncAppStatusToFeaturePlanningStatus(app.id, planningStatus as AppStatusDb)
      }
      setEditingFeatureId(null)
      setEditFeatureForm(null)
      refetchFeatures()
    } catch (e) {
      setErrorFeature(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setSavingFeature(false)
    }
  }

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addFeatureForm.naam.trim()) return
    setSavingFeature(true)
    setErrorFeature(null)
    try {
      await createFeature(app.id, {
        naam: addFeatureForm.naam.trim(),
        beschrijving: addFeatureForm.beschrijving?.trim() || null,
        status: addFeatureForm.status ?? 'gepland',
      })
      setShowAddFeature(false)
      setAddFeatureForm({ naam: '', beschrijving: '', status: 'gepland' })
      refetchFeatures()
    } catch (err) {
      setErrorFeature(err instanceof Error ? err.message : 'Toevoegen mislukt')
    } finally {
      setSavingFeature(false)
    }
  }

  const handleDeleteFeature = async (feature: Feature) => {
    if (feature.naam === BASISFEATURE_NAAM) return
    if (!window.confirm(`Feature "${feature.naam}" verwijderen?`)) return
    setSavingFeature(true)
    setErrorFeature(null)
    try {
      await deleteFeature(feature.id)
      refetchFeatures()
    } catch (err) {
      setErrorFeature(err instanceof Error ? err.message : 'Verwijderen mislukt')
    } finally {
      setSavingFeature(false)
    }
  }

  const isAdmin = effectiveRole === 'admin'

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const update: AppUpdate = {
      naam: app.naam,
      status: app.status,
      doel_app: app.doel_app || null,
      eigenaar: app.eigenaar || null,
      aanspreekpunt_proces: app.aanspreekpunt_proces || null,
      aanspreekpunt_intern: app.aanspreekpunt_intern || null,
      ontwikkeld_door: app.ontwikkeld_door || null,
      datum_oplevering: app.datum_oplevering || null,
      platform: app.platform || null,
      documentatie_url: app.documentatie_url || null,
      url_test: app.url_test || null,
      url_productie: app.url_productie || null,
      icon_key: app.icon_key || null,
      handleiding_aanwezig: app.handleiding_aanwezig ?? false,
      sparse: app.sparse ?? false,
      complexiteit: app.complexiteit || null,
      domein: app.domein || null,
      probleemomschrijving: app.probleemomschrijving ?? null,
      proces: app.proces ?? null,
      frequentie_per_week: app.frequentie_per_week ?? null,
      minuten_per_medewerker_per_week: app.minuten_per_medewerker_per_week ?? null,
      aantal_medewerkers: app.aantal_medewerkers ?? null,
      zorgimpact_type: app.zorgimpact_type ?? null,
      zorgwaarde: app.zorgwaarde ?? null,
      bouwinspanning: app.bouwinspanning ?? null,
      risico: app.risico ?? null,
      beoordeling_toelichting: app.beoordeling_toelichting ?? null,
      concept: app.concept ?? null,
      urenwinst_per_jaar: app.urenwinst_per_jaar ?? null,
      werkbesparing_score: app.werkbesparing_score ?? null,
      prioriteitsscore: app.prioriteitsscore ?? null,
      beveiligingsniveau: app.beveiligingsniveau ?? null,
    }
    try {
      const updated = await updateApp(app.id, update)
      setApp(updated)
      setEditMode(false)
      onSaved(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setApp(initialApp)
    setEditMode(false)
    setError(null)
    onCancel?.()
  }

  // View mode: only show fields with a value (doel_app shown prominently above), grouped by section
  type ViewField = { label: string; value: string | boolean }
  const viewSections: { title: string; fields: ViewField[] }[] = []

  const add = (sectionTitle: string) => {
    const fields: ViewField[] = []
    const section = { title: sectionTitle, fields }
    viewSections.push(section)
    return {
      push: (label: string, value: string | boolean) => {
        fields.push({ label, value })
      },
    }
  }

  const basis = add('Basis')
  if (hasValue(app.naam)) basis.push('Applicatie', app.naam)
  basis.push('Status', getStatusLabel(app.status))
  if (hasValue(app.domein)) basis.push('Domein', app.domein)
  if (hasValue(app.platform)) basis.push('Platform', app.platform)
  if (hasValue(app.complexiteit)) basis.push('Complexiteit', app.complexiteit)

  const contact = add('Contact')
  if (hasValue(app.eigenaar)) contact.push('Eigenaar', app.eigenaar)
  if (hasValue(app.aanspreekpunt_proces)) contact.push('Aanspreekpunt proces', app.aanspreekpunt_proces)
  if (hasValue(app.aanspreekpunt_intern)) contact.push('Aanspreekpunt Intern', app.aanspreekpunt_intern)
  if (hasValue(app.ontwikkeld_door)) contact.push('Ontwikkeld door', app.ontwikkeld_door)
  if (hasDateValue(app.datum_oplevering)) contact.push('Datum oplevering', app.datum_oplevering!.slice(0, 10))

  const urls = add('URLs en documentatie')
  if (hasValue(app.documentatie_url)) urls.push('Documentatie', app.documentatie_url)
  if (hasValue(app.url_test)) urls.push('URL test', app.url_test)
  if (hasValue(app.url_productie)) urls.push('URL productie', app.url_productie)
  if (hasValue(app.icon_key)) {
    const iconLabel = appIconOptions.find((o) => o.value === app.icon_key)?.label ?? app.icon_key
    urls.push('Icoon', iconLabel)
  }
  if (app.handleiding_aanwezig != null) urls.push('Handleiding aanwezig', app.handleiding_aanwezig)
  if (app.sparse != null) urls.push('Ondersteund door Sparse', app.sparse)

  const intake = add('Intake (prioritering)')
  if (hasValue(app.probleemomschrijving)) intake.push('Probleemomschrijving', app.probleemomschrijving)
  if (hasValue(app.proces)) intake.push('Proces', app.proces)
  if (app.frequentie_per_week != null) intake.push('Frequentie per week', String(app.frequentie_per_week))
  if (app.minuten_per_medewerker_per_week != null) intake.push('Minuten per medewerker per week', String(app.minuten_per_medewerker_per_week))
  if (app.aantal_medewerkers != null) intake.push('Aantal medewerkers', String(app.aantal_medewerkers))
  if (hasValue(app.zorgimpact_type)) intake.push('Zorgimpact type', app.zorgimpact_type)

  const beoordeling = add('Beoordeling')
  if (app.zorgwaarde != null) beoordeling.push('Zorgwaarde', String(app.zorgwaarde))
  if (app.bouwinspanning != null) beoordeling.push('Bouwinspanning', getBouwinspanningLabel(app.bouwinspanning))
  if (app.risico != null) beoordeling.push('Risico', app.risico)
  if (hasValue(app.beoordeling_toelichting)) beoordeling.push('Beoordeling toelichting', app.beoordeling_toelichting)

  const beveiliging = add('Beveiliging')
  if (app.beveiligingsniveau != null) beveiliging.push('Beveiligingsniveau', getBeveiligingsniveauLabel(app.beveiligingsniveau))

  const overig = add('Overig')
  if (hasValue(app.referentie_nummer)) overig.push('Referentienummer', app.referentie_nummer)
  if (app.concept != null) overig.push('Concept', app.concept)
  if (app.urenwinst_per_jaar != null) overig.push('Urenwinst per jaar', String(app.urenwinst_per_jaar))
  if (app.werkbesparing_score != null) overig.push('Werkbesparing score', String(app.werkbesparing_score))
  if (app.prioriteitsscore != null) overig.push('Prioriteitsscore', String(app.prioriteitsscore))

  const sectionsWithFields = viewSections.filter((s) => s.fields.length > 0)

  return (
    <div className="rounded-[20px] border border-ijsselheem-accentblauw/30 bg-white p-6 shadow-sm">
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {(showOnly === 'algemene' || showOnly === 'all') && (
      <>
      {!editMode ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">{app.naam || 'Applicatie'}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="rounded-[16px] border border-ijsselheem-accentblauw bg-ijsselheem-accentblauw px-3 py-1.5 text-sm font-semibold text-ijsselheem-donkerblauw hover:opacity-90"
              >
                Bewerken
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-[16px] border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
                >
                  Sluiten
                </button>
              )}
            </div>
          </div>
          {hasValue(app.doel_app) && (
            <div className="mb-6 rounded-xl bg-ijsselheem-lichtblauw/50 border border-ijsselheem-accentblauw/30 p-4">
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 mb-2">
                Wat doet deze applicatie?
              </h3>
              <p className="text-ijsselheem-donkerblauw">{app.doel_app}</p>
            </div>
          )}
          <div className="space-y-4">
            {sectionsWithFields.map((section) => (
              <section key={section.title} className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
                <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 mb-2">{section.title}</h3>
                <dl className="space-y-2">
                  {section.fields.map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-sm font-medium text-ijsselheem-donkerblauw">{label}</dt>
                      <dd className="mt-0.5 text-ijsselheem-donkerblauw">
                        {typeof value === 'boolean' ? (value ? 'Ja' : 'Nee') : value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Bewerk modus</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-[16px] bg-ijsselheem-donkerblauw px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Opslaan…' : 'Opslaan'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-[16px] border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
              >
                Annuleren
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 mb-3">Basis</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Applicatie (naam)</label>
                  <input
                    type="text"
                    value={app.naam}
                    onChange={(e) => setApp({ ...app, naam: e.target.value })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Status</label>
                  <select
                    value={app.status}
                    onChange={(e) => setApp({ ...app, status: e.target.value as App['status'] })}
                    className="mt-1 input-ijsselheem"
                  >
                    {appStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Domein</label>
                  <select
                    value={app.domein ?? ''}
                    onChange={(e) => setApp({ ...app, domein: e.target.value || null })}
                    className="mt-1 input-ijsselheem"
                  >
                    <option value="">—</option>
                    {domeinOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Platform</label>
                  <select
                    value={app.platform ?? ''}
                    onChange={(e) => setApp({ ...app, platform: e.target.value || null })}
                    className="mt-1 input-ijsselheem"
                  >
                    <option value="">—</option>
                    {platformOptions.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Complexiteit</label>
                  <select
                    value={app.complexiteit ?? ''}
                    onChange={(e) => setApp({ ...app, complexiteit: e.target.value || null })}
                    className="mt-1 input-ijsselheem"
                  >
                    <option value="">—</option>
                    {complexiteitOptions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 mb-3">Contact</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Eigenaar</label>
                  <input
                    type="text"
                    value={app.eigenaar ?? ''}
                    onChange={(e) => setApp({ ...app, eigenaar: e.target.value || null })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Aanspreekpunt proces</label>
                  <input
                    type="text"
                    value={app.aanspreekpunt_proces ?? ''}
                    onChange={(e) => setApp({ ...app, aanspreekpunt_proces: e.target.value || null })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Aanspreekpunt Intern</label>
                  <input
                    type="text"
                    value={app.aanspreekpunt_intern ?? ''}
                    onChange={(e) => setApp({ ...app, aanspreekpunt_intern: e.target.value || null })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Datum oplevering</label>
                  <input
                    type="date"
                    value={app.datum_oplevering?.slice(0, 10) ?? ''}
                    onChange={(e) => setApp({ ...app, datum_oplevering: e.target.value || null })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 mb-3">Intake (prioritering)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Probleemomschrijving</label>
                  <textarea
                    value={app.probleemomschrijving ?? ''}
                    onChange={(e) => setApp({ ...app, probleemomschrijving: e.target.value || null })}
                    rows={2}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Proces</label>
                  <textarea
                    value={app.proces ?? ''}
                    onChange={(e) => setApp({ ...app, proces: e.target.value || null })}
                    rows={2}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Frequentie per week</label>
                  <input
                    type="number"
                    min={0}
                    value={app.frequentie_per_week ?? ''}
                    onChange={(e) => setApp({ ...app, frequentie_per_week: e.target.value === '' ? null : parseInt(e.target.value, 10) || null })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Minuten per medewerker per week</label>
                  <input
                    type="number"
                    min={0}
                    value={app.minuten_per_medewerker_per_week ?? ''}
                    onChange={(e) => setApp({ ...app, minuten_per_medewerker_per_week: e.target.value === '' ? null : parseInt(e.target.value, 10) || null })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Aantal medewerkers</label>
                  <input
                    type="number"
                    min={0}
                    value={app.aantal_medewerkers ?? ''}
                    onChange={(e) => setApp({ ...app, aantal_medewerkers: e.target.value === '' ? null : parseInt(e.target.value, 10) || null })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Zorgimpact type</label>
                  <select
                    value={app.zorgimpact_type ?? ''}
                    onChange={(e) => setApp({ ...app, zorgimpact_type: e.target.value || null })}
                    className="mt-1 input-ijsselheem"
                  >
                    <option value="">—</option>
                    {zorgimpactTypeOptions.map((z) => (
                      <option key={z.value} value={z.value}>
                        {z.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 mb-3">Beoordeling</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Zorgwaarde (1–5)</label>
                  <select
                    value={app.zorgwaarde ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      const n = v === '' ? null : parseInt(v, 10)
                      setApp({ ...app, zorgwaarde: v === '' ? null : (Number.isInteger(n) ? n : null) })
                    }}
                    className="mt-1 input-ijsselheem"
                  >
                    <option value="">—</option>
                    {zorgwaardeOptions.map((z) => (
                      <option key={z.value} value={z.value}>
                        {z.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Bouwinspanning</label>
                  <select
                    value={app.bouwinspanning ?? ''}
                    onChange={(e) => setApp({ ...app, bouwinspanning: (e.target.value || null) as App['bouwinspanning'] })}
                    className="mt-1 input-ijsselheem"
                  >
                    <option value="">—</option>
                    {bouwinspanningOptions.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    id="risico"
                    checked={app.risico ?? false}
                    onChange={(e) => setApp({ ...app, risico: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-ijsselheem-donkerblauw focus:ring-ijsselheem-donkerblauw"
                  />
                  <label htmlFor="risico" className="text-sm text-ijsselheem-donkerblauw">
                    Risico
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Beoordeling toelichting</label>
                  <textarea
                    value={app.beoordeling_toelichting ?? ''}
                    onChange={(e) => setApp({ ...app, beoordeling_toelichting: e.target.value || null })}
                    rows={2}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 mb-3">Beveiliging</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Beveiligingsniveau</label>
                  <select
                    value={app.beveiligingsniveau ?? ''}
                    onChange={(e) => setApp({ ...app, beveiligingsniveau: (e.target.value || null) as App['beveiligingsniveau'] })}
                    className="mt-1 input-ijsselheem"
                  >
                    <option value="">—</option>
                    {BEVEILIGINGSNIVEAU_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 mb-3">Overig</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {hasValue(app.referentie_nummer) && (
                  <div>
                    <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Referentienummer</label>
                    <input
                      type="text"
                      value={app.referentie_nummer ?? ''}
                      readOnly
                      className="mt-1 input-ijsselheem bg-gray-100"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="concept"
                    checked={app.concept ?? false}
                    onChange={(e) => setApp({ ...app, concept: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-ijsselheem-donkerblauw focus:ring-ijsselheem-donkerblauw"
                  />
                  <label htmlFor="concept" className="text-sm text-ijsselheem-donkerblauw">
                    Concept
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Urenwinst per jaar</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={app.urenwinst_per_jaar ?? ''}
                    onChange={(e) => setApp({ ...app, urenwinst_per_jaar: e.target.value === '' ? null : parseFloat(e.target.value) || null })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Werkbesparing score</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={app.werkbesparing_score ?? ''}
                    onChange={(e) => setApp({ ...app, werkbesparing_score: e.target.value === '' ? null : parseFloat(e.target.value) || null })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Prioriteitsscore</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={app.prioriteitsscore ?? ''}
                    onChange={(e) => setApp({ ...app, prioriteitsscore: e.target.value === '' ? null : parseFloat(e.target.value) || null })}
                    className="mt-1 input-ijsselheem"
                  />
                </div>
              </div>
            </section>
          </div>
        </>
      )}
      </>
      )}

      {(showOnly === 'features' || showOnly === 'all') && (
      <>
      {/* Features-sectie */}
      <section className={showOnly === 'features' ? '' : 'mt-8 border-t border-ijsselheem-accentblauw/30 pt-6'}>
        <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 mb-3">Features</h3>
        <p className="text-sm text-ijsselheem-donkerblauw/80 mb-3">
          Nieuwe functionaliteit: bewerk de Basisfunctionaliteit of voeg een feature toe.
        </p>
        {errorFeature && (
          <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{errorFeature}</div>
        )}
        {loadingFeatures ? (
          <p className="text-sm text-ijsselheem-donkerblauw">Laden…</p>
        ) : (
          <>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li
                  key={feature.id}
                  className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 shadow-sm"
                >
                  {editingFeatureId === feature.id && editFeatureForm ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editFeatureForm.naam}
                        onChange={(e) =>
                          setEditFeatureForm((f) => (f ? { ...f, naam: e.target.value } : null))
                        }
                        className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                        placeholder="Naam"
                      />
                      <textarea
                        value={editFeatureForm.beschrijving ?? ''}
                        onChange={(e) =>
                          setEditFeatureForm((f) => (f ? { ...f, beschrijving: e.target.value } : null))
                        }
                        rows={2}
                        className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                        placeholder="Beschrijving"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-ijsselheem-donkerblauw/70 mr-1">Status (roadmap):</span>
                        <select
                          value={editFeatureForm.status}
                          onChange={(e) =>
                            setEditFeatureForm((f) =>
                              f ? { ...f, status: e.target.value as Feature['status'] } : null
                            )
                          }
                          className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                        >
                          {FEATURE_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-ijsselheem-donkerblauw/70 mr-1">Status feature:</span>
                        <select
                          value={editFeatureForm.planning_status ?? 'wensenlijst'}
                          onChange={(e) =>
                            setEditFeatureForm((f) =>
                              f ? { ...f, planning_status: e.target.value as AppStatusDb } : null
                            )
                          }
                          className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                          title="Workflow-status voor Backlog en Planning"
                        >
                          {appStatusOptions.filter((o) => o.value !== 'afgewezen').map((o) => (
                            <option key={o.value} value={o.value}>
                              {getStatusLabel(o.value as AppStatusDb)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleSaveFeature}
                          disabled={savingFeature}
                          className="rounded-[16px] bg-ijsselheem-donkerblauw px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {savingFeature ? 'Opslaan…' : 'Opslaan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFeatureId(null)
                            setEditFeatureForm(null)
                          }}
                          className="rounded-[16px] border border-gray-300 bg-white px-3 py-1.5 text-sm text-ijsselheem-donkerblauw"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-base font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/20 pb-2">
                        {feature.naam}
                        {feature.naam === BASISFEATURE_NAAM && (
                          <span className="ml-1 text-xs font-normal text-ijsselheem-donkerblauw/70">
                            (minimaal nodig)
                          </span>
                        )}
                      </h4>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-md bg-ijsselheem-lichtblauw/70 px-2 py-0.5 text-xs font-medium text-ijsselheem-donkerblauw"
                          title="Status roadmap"
                        >
                          {getFeatureStatusLabel(feature.status)}
                        </span>
                        <span
                          className="rounded-md border border-ijsselheem-accentblauw/40 bg-white px-2 py-0.5 text-xs font-medium text-ijsselheem-donkerblauw"
                          title="Status workflow"
                        >
                          {getStatusLabel((feature.planning_status ?? 'wensenlijst') as AppStatusDb)}
                        </span>
                      </div>
                      {feature.beschrijving ? (
                        <p className="mt-3 text-sm text-ijsselheem-donkerblauw/90 line-clamp-3 leading-relaxed">
                          {feature.beschrijving}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-ijsselheem-donkerblauw/50 italic">
                          Geen beschrijving
                        </p>
                      )}
                      <div className="mt-3 pt-3 border-t border-ijsselheem-accentblauw/20 flex flex-wrap gap-2">
                        <Link
                          to={`/backlog/feature/${feature.id}`}
                          className="rounded-[16px] border border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                        >
                          Beoordelen
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFeatureId(feature.id)
                            setEditFeatureForm({ ...feature })
                          }}
                          className="rounded-[16px] border border-ijsselheem-accentblauw bg-white px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
                        >
                          Bewerken
                        </button>
                        {isAdmin && feature.naam !== BASISFEATURE_NAAM && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFeature(feature)}
                            disabled={savingFeature}
                            className="rounded-[16px] border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Verwijderen
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {!showAddFeature ? (
              <button
                type="button"
                onClick={() => setShowAddFeature(true)}
                className="mt-3 rounded-[16px] border border-dashed border-ijsselheem-accentblauw bg-white px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
              >
                Feature toevoegen
              </button>
            ) : (
              <form onSubmit={handleAddFeature} className="mt-3 rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-3">
                <input
                  type="text"
                  required
                  value={addFeatureForm.naam}
                  onChange={(e) => setAddFeatureForm((f) => ({ ...f, naam: e.target.value }))}
                  className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                  placeholder="Naam *"
                />
                <textarea
                  value={addFeatureForm.beschrijving ?? ''}
                  onChange={(e) => setAddFeatureForm((f) => ({ ...f, beschrijving: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                  placeholder="Beschrijving"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={addFeatureForm.status ?? 'gepland'}
                    onChange={(e) =>
                      setAddFeatureForm((f) => ({ ...f, status: e.target.value as Feature['status'] }))
                    }
                    className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                  >
                    {FEATURE_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={savingFeature || !addFeatureForm.naam.trim()}
                    className="rounded-[16px] bg-ijsselheem-donkerblauw px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {savingFeature ? 'Toevoegen…' : 'Toevoegen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFeature(false)
                      setAddFeatureForm({ naam: '', beschrijving: '', status: 'gepland' })
                    }}
                    className="rounded-[16px] border border-gray-300 bg-white px-3 py-1.5 text-sm text-ijsselheem-donkerblauw"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
      </>
      )}
    </div>
  )
}
