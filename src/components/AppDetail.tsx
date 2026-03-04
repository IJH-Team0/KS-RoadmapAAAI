import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { App, AppStatusDb, AppUpdate } from '@/types/app'
import {
  getStatusLabel,
  APP_STATUS_OPTIONS,
  APP_ICON_OPTIONS,
  PLATFORM_OPTIONS,
  PRIORITEIT_OPTIONS,
  COMPLEXITEIT_OPTIONS,
  IMPACT_OPTIONS,
  DOEL_OPTIONS,
  BASISFEATURE_NAAM,
} from '@/types/app'
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

interface AppDetailProps {
  app: App
  onSaved: (app: App) => void
  onCancel?: () => void
}

function hasValue(v: string | null | undefined): v is string {
  return v != null && String(v).trim() !== ''
}
function hasDateValue(v: string | null | undefined): boolean {
  return v != null && String(v).trim() !== ''
}

export function AppDetail({ app: initialApp, onSaved, onCancel }: AppDetailProps) {
  const { role } = useAuth()
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
    prioriteit: null,
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
        prioriteit: editFeatureForm.prioriteit ?? null,
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
        prioriteit: addFeatureForm.prioriteit ?? null,
        status: addFeatureForm.status ?? 'gepland',
      })
      setShowAddFeature(false)
      setAddFeatureForm({ naam: '', beschrijving: '', prioriteit: null, status: 'gepland' })
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

  const isAdmin = role === 'admin'

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
      prioriteit: app.prioriteit || null,
      complexiteit: app.complexiteit || null,
      domein: app.domein || null,
      impact: app.impact || null,
      doel: app.doel || null,
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

  // View mode: only show fields with a value (doel_app shown prominently above)
  const viewFields: { label: string; value: string | boolean }[] = []
  if (hasValue(app.naam)) viewFields.push({ label: 'Applicatie', value: app.naam })
  viewFields.push({ label: 'Status', value: getStatusLabel(app.status) })
  if (hasValue(app.eigenaar)) viewFields.push({ label: 'Eigenaar', value: app.eigenaar })
  if (hasValue(app.aanspreekpunt_proces)) viewFields.push({ label: 'Aanspreekpunt proces', value: app.aanspreekpunt_proces })
  if (hasValue(app.aanspreekpunt_intern)) viewFields.push({ label: 'Aanspreekpunt Intern', value: app.aanspreekpunt_intern })
  if (hasValue(app.ontwikkeld_door)) viewFields.push({ label: 'Ontwikkeld door', value: app.ontwikkeld_door })
  if (hasDateValue(app.datum_oplevering)) viewFields.push({ label: 'Datum oplevering', value: app.datum_oplevering!.slice(0, 10) })
  if (hasValue(app.platform)) viewFields.push({ label: 'Platform', value: app.platform })
  if (hasValue(app.documentatie_url)) viewFields.push({ label: 'Documentatie', value: app.documentatie_url })
  if (hasValue(app.url_test)) viewFields.push({ label: 'URL test', value: app.url_test })
  if (hasValue(app.url_productie)) viewFields.push({ label: 'URL productie', value: app.url_productie })
  if (hasValue(app.icon_key)) {
    const iconLabel = APP_ICON_OPTIONS.find((o) => o.value === app.icon_key)?.label ?? app.icon_key
    viewFields.push({ label: 'Icoon', value: iconLabel })
  }
  if (app.handleiding_aanwezig != null) viewFields.push({ label: 'Handleiding aanwezig', value: app.handleiding_aanwezig ? 'Ja' : 'Nee' })
  if (app.sparse != null) viewFields.push({ label: 'Sparse', value: app.sparse ? 'Ja' : 'Nee' })
  if (hasValue(app.prioriteit)) viewFields.push({ label: 'Prioriteit', value: app.prioriteit })
  if (hasValue(app.complexiteit)) viewFields.push({ label: 'Complexiteit', value: app.complexiteit })
  if (hasValue(app.domein)) viewFields.push({ label: 'Domein', value: app.domein })
  if (hasValue(app.impact)) viewFields.push({ label: 'Impact', value: app.impact })
  if (hasValue(app.doel)) viewFields.push({ label: 'Doel', value: app.doel })

  return (
    <div className="rounded-[20px] border border-ijsselheem-accentblauw/30 bg-white p-6 shadow-sm">
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

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
              <h3 className="text-xs font-semibold uppercase text-ijsselheem-donkerblauw/70 mb-1">
                Wat doet deze applicatie?
              </h3>
              <p className="text-ijsselheem-donkerblauw">{app.doel_app}</p>
            </div>
          )}
          <dl className="space-y-2">
            {viewFields.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase text-ijsselheem-donkerblauw/70">{label}</dt>
                <dd className="mt-0.5 text-ijsselheem-donkerblauw">
                  {typeof value === 'boolean' ? (value ? 'Ja' : 'Nee') : value}
                </dd>
              </div>
            ))}
          </dl>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Applicatie (naam)</label>
              <input
                type="text"
                value={app.naam}
                onChange={(e) => setApp({ ...app, naam: e.target.value })}
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Doel app</label>
              <textarea
                value={app.doel_app ?? ''}
                onChange={(e) => setApp({ ...app, doel_app: e.target.value || null })}
                rows={2}
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Status</label>
              <select
                value={app.status}
                onChange={(e) => setApp({ ...app, status: e.target.value as App['status'] })}
                className="mt-1 input-ijsselheem"
              >
                {APP_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Prioriteit</label>
              <select
                value={app.prioriteit ?? ''}
                onChange={(e) => setApp({ ...app, prioriteit: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              >
                <option value="">—</option>
                {PRIORITEIT_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Platform</label>
              <select
                value={app.platform ?? ''}
                onChange={(e) => setApp({ ...app, platform: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              >
                <option value="">—</option>
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Complexiteit</label>
              <select
                value={app.complexiteit ?? ''}
                onChange={(e) => setApp({ ...app, complexiteit: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              >
                <option value="">—</option>
                {COMPLEXITEIT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Eigenaar</label>
              <input
                type="text"
                value={app.eigenaar ?? ''}
                onChange={(e) => setApp({ ...app, eigenaar: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Aanspreekpunt proces</label>
              <input
                type="text"
                value={app.aanspreekpunt_proces ?? ''}
                onChange={(e) => setApp({ ...app, aanspreekpunt_proces: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Aanspreekpunt Intern</label>
              <input
                type="text"
                value={app.aanspreekpunt_intern ?? ''}
                onChange={(e) => setApp({ ...app, aanspreekpunt_intern: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Ontwikkeld door</label>
              <input
                type="text"
                value={app.ontwikkeld_door ?? ''}
                onChange={(e) => setApp({ ...app, ontwikkeld_door: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Datum oplevering</label>
              <input
                type="date"
                value={app.datum_oplevering?.slice(0, 10) ?? ''}
                onChange={(e) => setApp({ ...app, datum_oplevering: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Domein</label>
              <input
                type="url"
                value={app.domein ?? ''}
                onChange={(e) => setApp({ ...app, domein: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Documentatie</label>
              <input
                type="url"
                value={app.documentatie_url ?? ''}
                onChange={(e) => setApp({ ...app, documentatie_url: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">URL test</label>
              <input
                type="url"
                value={app.url_test ?? ''}
                onChange={(e) => setApp({ ...app, url_test: e.target.value || null })}
                placeholder="https://..."
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">URL productie</label>
              <input
                type="url"
                value={app.url_productie ?? ''}
                onChange={(e) => setApp({ ...app, url_productie: e.target.value || null })}
                placeholder="https://..."
                className="mt-1 input-ijsselheem"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Icoon</label>
              <select
                value={app.icon_key ?? ''}
                onChange={(e) => setApp({ ...app, icon_key: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              >
                <option value="">— Geen icoon —</option>
                {APP_ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="handleiding_aanwezig"
                checked={app.handleiding_aanwezig ?? false}
                onChange={(e) => setApp({ ...app, handleiding_aanwezig: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-ijsselheem-donkerblauw focus:ring-ijsselheem-donkerblauw"
              />
              <label htmlFor="handleiding_aanwezig" className="text-sm text-ijsselheem-donkerblauw">
                Handleiding aanwezig
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sparse"
                checked={app.sparse ?? false}
                onChange={(e) => setApp({ ...app, sparse: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-ijsselheem-donkerblauw focus:ring-ijsselheem-donkerblauw"
              />
              <label htmlFor="sparse" className="text-sm text-ijsselheem-donkerblauw">
                Ondersteund door Sparse
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Impact</label>
              <select
                value={app.impact ?? ''}
                onChange={(e) => setApp({ ...app, impact: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              >
                <option value="">—</option>
                {IMPACT_OPTIONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ijsselheem-donkerblauw">Doel (reden)</label>
              <select
                value={app.doel ?? ''}
                onChange={(e) => setApp({ ...app, doel: e.target.value || null })}
                className="mt-1 input-ijsselheem"
              >
                <option value="">—</option>
                {DOEL_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {/* Features-sectie */}
      <section className="mt-8 border-t border-ijsselheem-accentblauw/30 pt-6">
        <h3 className="text-sm font-semibold uppercase text-ijsselheem-donkerblauw/70 mb-3">Features</h3>
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
            <ul className="space-y-2">
              {features.map((feature) => (
                <li
                  key={feature.id}
                  className="rounded-xl border border-ijsselheem-accentblauw/20 bg-ijsselheem-lichtblauw/30 p-3"
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
                          {APP_STATUS_OPTIONS.filter((o) => o.value !== 'afgewezen').map((o) => (
                            <option key={o.value} value={o.value}>
                              {getStatusLabel(o.value)}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={editFeatureForm.prioriteit ?? ''}
                          onChange={(e) =>
                            setEditFeatureForm((f) => (f ? { ...f, prioriteit: e.target.value ? parseInt(e.target.value, 10) : null } : null))
                          }
                          className="w-20 rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                          placeholder="Prio"
                        />
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
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-ijsselheem-donkerblauw">
                          {feature.naam}
                          {feature.naam === BASISFEATURE_NAAM && (
                            <span className="ml-1 text-xs font-normal text-ijsselheem-donkerblauw/70">
                              (minimaal nodig)
                            </span>
                          )}
                        </span>
                        <p className="mt-0.5 text-sm text-ijsselheem-donkerblauw/80">
                          <span className="text-ijsselheem-donkerblauw/70">Status (roadmap): </span>
                          {getFeatureStatusLabel(feature.status)}
                          {feature.prioriteit != null && ` · Prioriteit ${feature.prioriteit}`}
                        </p>
                        <p className="mt-0.5 text-xs text-ijsselheem-donkerblauw/70">
                          Status feature: {getStatusLabel((feature.planning_status ?? 'wensenlijst') as AppStatusDb)}
                        </p>
                        {feature.beschrijving && (
                          <p className="mt-1 text-sm text-ijsselheem-donkerblauw line-clamp-2">
                            {feature.beschrijving}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
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
                  <input
                    type="number"
                    value={addFeatureForm.prioriteit ?? ''}
                    onChange={(e) =>
                      setAddFeatureForm((f) => ({
                        ...f,
                        prioriteit: e.target.value ? parseInt(e.target.value, 10) : null,
                      }))
                    }
                    className="w-20 rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
                    placeholder="Prio"
                  />
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
                      setAddFeatureForm({ naam: '', beschrijving: '', prioriteit: null, status: 'gepland' })
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
    </div>
  )
}
