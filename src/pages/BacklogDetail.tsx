import { useState, useEffect, useMemo, Fragment } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchAppById, updateApp, deleteApp } from '@/lib/apps'
import {
  fetchFeatureById,
  updateFeature,
  maybeSyncAppStatusToFeaturePlanningStatus,
} from '@/lib/roadmap'
import {
  fetchUserStoriesByAppId,
  createUserStory,
  updateUserStory,
  deleteUserStory,
} from '@/lib/userStories'
import type { UserStory, UserStoryInsert, WeergaveType } from '@/lib/userStories'
import {
  urenwinstPerJaar,
  werkbesparingScore,
  prioriteitsscore as calcPrioriteitsscore,
} from '@/lib/prioritering'
import { usePrioriteitsscoreConfig } from '@/hooks/usePrioriteitsscoreConfig'
import type { App, AppStatusDb, BouwinspanningDb } from '@/types/app'
import type { Feature, FeatureUpdate } from '@/types/roadmap'
import {
  getStatusLabel,
  getBouwinspanningLabel,
} from '@/types/app'
import { useReferenceOptions } from '@/hooks/useReferenceOptions'
import { getAppIcon } from '@/lib/appIcons'
import { AppDetail } from '@/components/AppDetail'
import { BeveiligingsniveauBadge } from '@/components/BeveiligingsniveauBadge'
import { BasisfunctionaliteitNieuweAppHint } from '@/components/BasisfunctionaliteitNieuweAppHint'
import { cn } from '@/lib/utils'
import type { BeveiligingsniveauAntwoorden } from '@/lib/beveiligingsniveau'
import {
  bepaalBeveiligingsniveau,
  getBeveiligingsniveauLabel,
  antwoordenFromLevel,
  getBeveiligingsniveauEisen,
} from '@/lib/beveiligingsniveau'
import { impactSummary } from '@/lib/impactSummary'
import {
  getFocusText,
  getStoryTemplate,
  isHighImpact,
  getZorgimpactHints,
  getAcceptatiecriteriaPlaceholder,
  getStoryQualityChecklist,
} from '@/lib/storyFocus'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

function normalizeDirtyValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  return String(value)
}

const FEATURE_DIRTY_KEYS = [
  'frequentie_per_week',
  'minuten_per_medewerker_per_week',
  'aantal_medewerkers',
  'zorgimpact_type',
  'zorgwaarde',
  'bouwinspanning',
  'sparse_betrokken',
  'risico',
  'beoordeling_toelichting',
  'planning_status',
] as const

export function BacklogDetail() {
  const params = useParams<{ id?: string; featureId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const featureId = params.featureId
  const legacyId = params.id
  const navigate = useNavigate()

  const view = searchParams.get('view') ?? 'compact'
  const focus = searchParams.get('focus')

  const [app, setApp] = useState<App | null>(null)
  const [feature, setFeature] = useState<Feature | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Feature>>({})
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)
  const [addStoryForm, setAddStoryForm] = useState<UserStoryInsert>({ titel: '', weergave_type: 'taaklijst' })
  const [addingStory, setAddingStory] = useState(false)
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null)
  const [editStoryDraft, setEditStoryDraft] = useState<Pick<UserStory, 'titel' | 'beschrijving' | 'acceptatiecriteria' | 'weergave_type'> | null>(null)
  const [editAlgemeneInfo, setEditAlgemeneInfo] = useState(false)
  const [appBeheerTab, setAppBeheerTab] = useState<'algemene' | 'features' | 'documentatie' | 'userstories'>('algemene')
  const [savingDocumentatie, setSavingDocumentatie] = useState(false)
  const [showAddStoryForm, setShowAddStoryForm] = useState(false)
  const [newLooseTaskInput, setNewLooseTaskInput] = useState('')
  const [savedContactFields, setSavedContactFields] = useState<
    { aanspreekpunt_intern: string | null; eigenaar: string | null; aanspreekpunt_proces: string | null } | undefined
  >(undefined)
  const { config: prioriteitsscoreConfig } = usePrioriteitsscoreConfig()
  const { options: appStatusOptions } = useReferenceOptions('app_status')
  const { options: appIconOptions } = useReferenceOptions('app_icon')
  const { options: bouwinspanningOptions } = useReferenceOptions('bouwinspanning')
  const { options: zorgimpactTypeOptions } = useReferenceOptions('zorgimpact_type')
  const { options: zorgwaardeOptions } = useReferenceOptions('zorgwaarde')
  const [beveiliging, setBeveiliging] = useState({
    clientgegevens: false,
    medewerkersgegevens: false,
    intern_team: false,
  })

  useEffect(() => {
    setBeveiliging(antwoordenFromLevel(app?.beveiligingsniveau))
  }, [app?.id, app?.beveiligingsniveau])

  useEffect(() => {
    if (!app?.id) {
      setSavedContactFields(undefined)
      return
    }
    setSavedContactFields({
      aanspreekpunt_intern: app.aanspreekpunt_intern ?? null,
      eigenaar: app.eigenaar ?? null,
      aanspreekpunt_proces: app.aanspreekpunt_proces ?? null,
    })
  }, [app?.id])

  const hasDraftChanges = useMemo(() => {
    if (!feature) return false
    return FEATURE_DIRTY_KEYS.some((key) => {
      const draftValue =
        draft[key] !== undefined ? draft[key] : feature[key]
      return (
        normalizeDirtyValue(draftValue) !== normalizeDirtyValue(feature[key])
      )
    })
  }, [draft, feature])

  const hasUnsavedStoryInput =
    (showAddStoryForm &&
      (addStoryForm.titel.trim() !== '' ||
        (addStoryForm.beschrijving?.trim() ?? '') !== '' ||
        (addStoryForm.acceptatiecriteria?.trim() ?? '') !== '' ||
        newLooseTaskInput.trim() !== '')) ||
    editingStoryId !== null

  const hasUnsavedInlineAppInput =
    savedContactFields !== undefined &&
    ((app?.aanspreekpunt_intern ?? null) !== savedContactFields.aanspreekpunt_intern ||
      (app?.eigenaar ?? null) !== savedContactFields.eigenaar ||
      (app?.aanspreekpunt_proces ?? null) !== savedContactFields.aanspreekpunt_proces)

  const hasUnsavedChanges =
    !saving &&
    !addingStory &&
    (hasDraftChanges || hasUnsavedStoryInput || hasUnsavedInlineAppInput)

  useUnsavedChangesGuard(hasUnsavedChanges)

  // Open Publicatie-tab wanneer ?tab=publicatie in de URL (bijv. vanaf Stap 8 op Planning)
  useEffect(() => {
    if (legacyId && !featureId && searchParams.get('tab') === 'publicatie') {
      setAppBeheerTab('documentatie')
    }
  }, [legacyId, featureId, searchParams])

  const handleBeveiligingChange = (next: BeveiligingsniveauAntwoorden) => {
    setBeveiliging(next)
    const newLevel = bepaalBeveiligingsniveau(next)
    if (app?.id && newLevel !== app.beveiligingsniveau) {
      updateApp(app.id, { beveiligingsniveau: newLevel }).then(setApp).catch(() => {})
    }
  }

  useEffect(() => {
    function hasIntake(
      x: {
        frequentie_per_week?: number | null
        minuten_per_medewerker_per_week?: number | null
        aantal_medewerkers?: number | null
        zorgimpact_type?: string | null
        urenwinst_per_jaar?: number | null
      } | null
    ): boolean {
      if (!x) return false
      return (
        x.frequentie_per_week != null ||
        x.minuten_per_medewerker_per_week != null ||
        x.aantal_medewerkers != null ||
        (x.zorgimpact_type != null && x.zorgimpact_type !== '') ||
        x.urenwinst_per_jaar != null
      )
    }
    function intakeFromApp(app: App): Partial<Feature> {
      return {
        frequentie_per_week: app.frequentie_per_week ?? null,
        minuten_per_medewerker_per_week: app.minuten_per_medewerker_per_week ?? null,
        aantal_medewerkers: app.aantal_medewerkers ?? null,
        zorgimpact_type: app.zorgimpact_type ?? null,
        urenwinst_per_jaar: app.urenwinst_per_jaar ?? null,
      }
    }
    if (featureId) {
      setLoading(true)
      fetchFeatureById(featureId)
        .then((f): Promise<{ a: App | null; f: Feature | null }> => {
          setFeature(f ?? null)
          setDraft(f ?? {})
          if (f?.app_id) return fetchAppById(f.app_id).then((a) => ({ a, f }))
          return Promise.resolve({ a: null, f: null })
        })
        .then(({ a, f }) => {
          setApp(a ?? null)
          if (a && f && !hasIntake(f) && hasIntake(a)) {
            setDraft({ ...f, ...intakeFromApp(a) })
          }
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Laden mislukt')
        })
        .finally(() => setLoading(false))
      return
    }
    if (legacyId) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/788b46d0-c7c1-4f39-873b-903ba7f3eb27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BacklogDetail.tsx:data-load-legacyId',message:'legacyId branch start',data:{legacyId,hypothesisId:'H4'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setLoading(true)
      fetchFeatureById(legacyId)
        .then((f) => {
          if (f) {
            setFeature(f)
            setDraft(f)
            return fetchAppById(f.app_id).then((a) => {
              setApp(a ?? null)
              if (a && !hasIntake(f) && hasIntake(a)) {
                setDraft({ ...f, ...intakeFromApp(a) })
              }
            })
          }
          return fetchAppById(legacyId).then((a) => {
            if (!a) return
            setApp(a)
            setFeature(null)
          })
        })
        .catch((e) => {
          // #region agent log
          const errMsg = e instanceof Error ? e.message : String(e)
          fetch('http://127.0.0.1:7246/ingest/788b46d0-c7c1-4f39-873b-903ba7f3eb27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BacklogDetail.tsx:data-load-legacyId-catch',message:'legacyId load failed',data:{err:errMsg,hypothesisId:'H1'},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          setError(e instanceof Error ? e.message : 'Laden mislukt')
        })
        .finally(() => setLoading(false))
    }
  }, [featureId, legacyId, navigate])

  useEffect(() => {
    if (!app?.id) {
      setUserStories([])
      return
    }
    setStoriesLoading(true)
    fetchUserStoriesByAppId(app.id)
      .then(setUserStories)
      .finally(() => setStoriesLoading(false))
  }, [app?.id])

  useEffect(() => {
    if (view === 'compact' && focus === 'stories') {
      setShowAddStoryForm(true)
    } else if (view !== 'compact') {
      setShowAddStoryForm(false)
    }
  }, [view, focus])

  const handleAddStory = async () => {
    if (!app?.id || !addStoryForm.titel.trim()) return
    setAddingStory(true)
    setError(null)
    try {
      const weergaveType = addStoryForm.weergave_type ?? 'taaklijst'
      const created = await createUserStory(app.id, {
        titel: addStoryForm.titel.trim(),
        beschrijving: addStoryForm.beschrijving?.trim() || null,
        acceptatiecriteria: weergaveType === 'taaklijst' ? null : (addStoryForm.acceptatiecriteria?.trim() || null),
        weergave_type: weergaveType,
      })
      const newStories = [...userStories, created].sort((a, b) => a.volgorde - b.volgorde || a.titel.localeCompare(b.titel))
      setUserStories(newStories)
      const high = feature ? isHighImpact(draft.zorgwaarde ?? feature.zorgwaarde, draft.risico ?? feature.risico, draft.zorgimpact_type ?? feature.zorgimpact_type) : false
      const t = getStoryTemplate(high, draft.zorgimpact_type ?? feature?.zorgimpact_type)
      setAddStoryForm({ titel: t.titel, beschrijving: t.beschrijving || null, acceptatiecriteria: null, weergave_type: 'user_story' })
      setNewLooseTaskInput('')
      setShowAddStoryForm(false)
      if (feature?.planning_status === 'stories_maken' && newStories.length >= 1) {
        const updatedFeature = await updateFeature(feature.id, {
          planning_status: 'in_voorbereiding',
        })
        setFeature(updatedFeature)
        setDraft(updatedFeature)
        await maybeSyncAppStatusToFeaturePlanningStatus(feature.app_id, 'in_voorbereiding')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Toevoegen mislukt')
    } finally {
      setAddingStory(false)
    }
  }

  const handleSaveStory = async (id: string) => {
    if (!editStoryDraft) return
    setError(null)
    const payload =
      editStoryDraft.weergave_type === 'taaklijst'
        ? { ...editStoryDraft, acceptatiecriteria: null }
        : editStoryDraft
    try {
      const updated = await updateUserStory(id, payload)
      setUserStories((prev) =>
        prev.map((s) => (s.id === id ? updated : s)).sort((a, b) => a.volgorde - b.volgorde || a.titel.localeCompare(b.titel))
      )
      setEditingStoryId(null)
      setEditStoryDraft(null)
      setNewLooseTaskInput('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bewerken mislukt')
    }
  }

  const handleDeleteStory = async (id: string) => {
    if (!window.confirm('Dit item verwijderen?')) return
    setError(null)
    try {
      await deleteUserStory(id)
      setUserStories((prev) => prev.filter((s) => s.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verwijderen mislukt')
    }
  }

  const freq = draft.frequentie_per_week ?? feature?.frequentie_per_week ?? null
  const min = draft.minuten_per_medewerker_per_week ?? feature?.minuten_per_medewerker_per_week ?? null
  const med = draft.aantal_medewerkers ?? feature?.aantal_medewerkers ?? null
  const urenwinstFromFormula = urenwinstPerJaar(freq, min, med)
  const urenwinst =
    urenwinstFromFormula ?? draft.urenwinst_per_jaar ?? feature?.urenwinst_per_jaar ?? null

  const sparseBetrokken = draft.sparse_betrokken ?? feature?.sparse_betrokken ?? false
  const prioriteitsscore = calcPrioriteitsscore(
    draft.zorgwaarde ?? feature?.zorgwaarde,
    urenwinst,
    (draft.bouwinspanning ?? feature?.bouwinspanning) as BouwinspanningDb | null,
    draft.risico ?? feature?.risico,
    draft.zorgimpact_type ?? feature?.zorgimpact_type,
    prioriteitsscoreConfig,
    sparseBetrokken
  )
  const werkbesparing = werkbesparingScore(urenwinst)

  const currentZorgwaarde = feature ? (draft.zorgwaarde ?? feature.zorgwaarde) : null
  const currentRisico = feature ? (draft.risico ?? feature.risico) : null
  const currentBouwinspanning = feature ? (draft.bouwinspanning ?? feature.bouwinspanning) : null
  const zorgimpactType = feature ? (draft.zorgimpact_type ?? feature.zorgimpact_type) : null

  const hasMinOneTask = (b: string | null | undefined) =>
    (b ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).length >= 1

  useEffect(() => {
    if (!feature || addStoryForm.titel.trim() !== '' || (addStoryForm.weergave_type ?? 'taaklijst') !== 'user_story') return
    const high = isHighImpact(currentZorgwaarde, currentRisico, zorgimpactType)
    const t = getStoryTemplate(high, zorgimpactType)
    setAddStoryForm({
      titel: t.titel,
      beschrijving: t.beschrijving || null,
      acceptatiecriteria: null,
      weergave_type: 'user_story',
    })
  }, [feature?.id, addStoryForm.titel, addStoryForm.weergave_type, currentZorgwaarde, currentRisico, zorgimpactType])

  const handleSave = async () => {
    if (!feature) return
    setError(null)
    setSaving(true)
    const newZorgwaarde = draft.zorgwaarde ?? feature.zorgwaarde
    const newBouwinspanning = draft.bouwinspanning ?? feature.bouwinspanning
    const isWensenlijst = (feature.planning_status ?? 'wensenlijst') === 'wensenlijst'
    const isFullyFilled = newZorgwaarde != null && newBouwinspanning != null
    const update: FeatureUpdate = {
      zorgwaarde: newZorgwaarde ?? null,
      bouwinspanning: newBouwinspanning ?? null,
      risico: draft.risico ?? feature.risico ?? null,
      beoordeling_toelichting:
        draft.beoordeling_toelichting ?? feature.beoordeling_toelichting ?? null,
      frequentie_per_week: draft.frequentie_per_week ?? feature.frequentie_per_week ?? null,
      minuten_per_medewerker_per_week:
        draft.minuten_per_medewerker_per_week ?? feature.minuten_per_medewerker_per_week ?? null,
      aantal_medewerkers: draft.aantal_medewerkers ?? feature.aantal_medewerkers ?? null,
      zorgimpact_type: draft.zorgimpact_type ?? feature.zorgimpact_type ?? null,
      urenwinst_per_jaar: urenwinst ?? null,
      werkbesparing_score: werkbesparing ?? null,
      prioriteitsscore: prioriteitsscore ?? null,
      sparse_betrokken: draft.sparse_betrokken ?? feature?.sparse_betrokken ?? null,
      ...(isWensenlijst && isFullyFilled ? { planning_status: 'stories_maken' as AppStatusDb } : {}),
    }
    try {
      await updateFeature(feature.id, update)
      const newBeveiligingsniveau = bepaalBeveiligingsniveau(beveiliging)
      if (app && newBeveiligingsniveau !== app.beveiligingsniveau) {
        const updated = await updateApp(app.id, { beveiligingsniveau: newBeveiligingsniveau })
        setApp(updated)
      }
      navigate('/backlog')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleResetBeoordeling = async () => {
    if (!feature) return
    const ok = window.confirm(
      'Beoordeling en intake leegmaken voor deze feature? Dit verwijdert de ingevulde waarden.'
    )
    if (!ok) return
    setError(null)
    setSaving(true)
    const resetUpdate: FeatureUpdate = {
      zorgwaarde: null,
      bouwinspanning: null,
      risico: null,
      beoordeling_toelichting: null,
      prioriteitsscore: null,
      frequentie_per_week: null,
      minuten_per_medewerker_per_week: null,
      aantal_medewerkers: null,
      urenwinst_per_jaar: null,
      zorgimpact_type: null,
      werkbesparing_score: null,
      sparse_betrokken: false,
    }
    try {
      const updatedFeature = await updateFeature(feature.id, resetUpdate)
      if (app?.id) {
        const updatedApp = await updateApp(app.id, {
          frequentie_per_week: null,
          minuten_per_medewerker_per_week: null,
          aantal_medewerkers: null,
          zorgimpact_type: null,
          urenwinst_per_jaar: null,
        })
        setApp(updatedApp)
      }
      setFeature(updatedFeature)
      setDraft(updatedFeature)
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: unknown }).message)
          : 'Reset mislukt'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-ijsselheem-donkerblauw">Laden…</p>
  }
  if (legacyId && !feature && app && !featureId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">
            Applicatie beheren: {app.naam}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/backlog')}
            className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline"
          >
            ← Backlog
          </button>
        </div>
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}
        <nav className="flex gap-0 border-b border-ijsselheem-accentblauw/30 -mb-px">
          {(
            [
              { id: 'algemene' as const, label: 'Algemene informatie' },
              { id: 'features' as const, label: 'Features' },
              { id: 'documentatie' as const, label: 'Publicatie' },
              { id: 'userstories' as const, label: 'User story en taken' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={async () => {
                if (appBeheerTab === 'documentatie' && app) {
                  setSavingDocumentatie(true)
                  setError(null)
                  try {
                    const updated = await updateApp(app.id, {
                      doel_app: app.doel_app ?? null,
                      ontwikkeld_door: app.ontwikkeld_door ?? null,
                      documentatie_url: app.documentatie_url ?? null,
                      url_test: app.url_test ?? null,
                      url_productie: app.url_productie ?? null,
                      icon_key: app.icon_key ?? null,
                      handleiding_aanwezig: app.handleiding_aanwezig ?? false,
                    })
                    setApp(updated)
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Opslaan mislukt')
                  } finally {
                    setSavingDocumentatie(false)
                  }
                }
                setAppBeheerTab(id)
              }}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition',
                appBeheerTab === id
                  ? 'border-ijsselheem-donkerblauw text-ijsselheem-donkerblauw bg-white'
                  : 'border-transparent text-ijsselheem-donkerblauw/70 hover:bg-ijsselheem-lichtblauw/50'
              )}
            >
              {label}
            </button>
          ))}
        </nav>
        {appBeheerTab === 'algemene' && (
          <AppDetail
            app={app}
            onSaved={(updated) => setApp(updated)}
            onCancel={() => navigate('/backlog')}
            showOnly="algemene"
          />
        )}
        {appBeheerTab === 'features' && (
          <AppDetail
            app={app}
            onSaved={(updated) => setApp(updated)}
            onCancel={() => navigate('/backlog')}
            showOnly="features"
          />
        )}
        {appBeheerTab === 'documentatie' && (
          <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
            <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 mb-4">
              Publicatie
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Doel app</label>
                <input
                  type="text"
                  value={app.doel_app ?? ''}
                  onChange={(e) => setApp({ ...app, doel_app: e.target.value || null })}
                  className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Ontwikkeld door</label>
                <input
                  type="text"
                  value={app.ontwikkeld_door ?? ''}
                  onChange={(e) => setApp({ ...app, ontwikkeld_door: e.target.value || null })}
                  className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Documentatie</label>
                <input
                  type="url"
                  value={app.documentatie_url ?? ''}
                  onChange={(e) => setApp({ ...app, documentatie_url: e.target.value || null })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">URL test</label>
                <input
                  type="url"
                  value={app.url_test ?? ''}
                  onChange={(e) => setApp({ ...app, url_test: e.target.value || null })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">URL productie</label>
                <input
                  type="url"
                  value={app.url_productie ?? ''}
                  onChange={(e) => setApp({ ...app, url_productie: e.target.value || null })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-2">Icoon</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setApp({ ...app, icon_key: null })}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 min-w-[4rem] transition',
                      !app.icon_key
                        ? 'border-ijsselheem-donkerblauw bg-ijsselheem-lichtblauw/50 text-ijsselheem-donkerblauw'
                        : 'border-ijsselheem-accentblauw/30 bg-white text-ijsselheem-donkerblauw/80 hover:border-ijsselheem-accentblauw/50 hover:bg-ijsselheem-lichtblauw/30'
                    )}
                    title="Geen icoon"
                  >
                    <span className="text-xs font-medium opacity-70">—</span>
                    <span className="text-[10px]">Geen</span>
                  </button>
                  {appIconOptions.map((opt) => {
                    const IconComponent = getAppIcon(opt.value)
                    const selected = (app.icon_key ?? '') === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setApp({ ...app, icon_key: opt.value })}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 min-w-[4rem] transition',
                          selected
                            ? 'border-ijsselheem-donkerblauw bg-ijsselheem-lichtblauw/50 text-ijsselheem-donkerblauw'
                            : 'border-ijsselheem-accentblauw/30 bg-white text-ijsselheem-donkerblauw/80 hover:border-ijsselheem-accentblauw/50 hover:bg-ijsselheem-lichtblauw/30'
                        )}
                        title={opt.label}
                      >
                        <IconComponent className="w-5 h-5 shrink-0" strokeWidth={2} />
                        <span className="text-[10px] leading-tight truncate max-w-[3.5rem]" title={opt.label}>
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  id="doc_handleiding_aanwezig"
                  checked={app.handleiding_aanwezig ?? false}
                  onChange={(e) => setApp({ ...app, handleiding_aanwezig: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-ijsselheem-donkerblauw focus:ring-ijsselheem-donkerblauw"
                />
                <label htmlFor="doc_handleiding_aanwezig" className="text-sm font-medium text-ijsselheem-donkerblauw">
                  Handleiding aanwezig
                </label>
              </div>
            </div>
            <p className="mt-3 text-xs text-ijsselheem-donkerblauw/70">
              Vul Doel app en minimaal URL test of URL productie in. Zet daarna &quot;Zichtbaar op Applicaties-pagina&quot; aan of gebruik de knop &quot;Afronden voltooid&quot; (status moet Test of Productie zijn).
            </p>
            {(app.status === 'in_testfase' || app.status === 'in_productie') && (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-ijsselheem-donkerblauw">Zichtbaar op Applicaties-pagina</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={app.publicatie_afgerond ?? false}
                    disabled={savingDocumentatie}
                    onClick={async () => {
                      const next = !(app.publicatie_afgerond ?? false)
                      if (next) {
                        const hasDoel = (app.doel_app ?? '').trim() !== ''
                        const hasUrl = ((app.url_test ?? '').trim() !== '') || ((app.url_productie ?? '').trim() !== '')
                        if (!hasDoel || !hasUrl) {
                          setError('Vul Doel app en minimaal URL test of URL productie in om zichtbaar te maken.')
                          return
                        }
                      }
                      setError(null)
                      setSavingDocumentatie(true)
                      try {
                        const updated = await updateApp(app.id, { publicatie_afgerond: next })
                        setApp(updated)
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Opslaan mislukt')
                      } finally {
                        setSavingDocumentatie(false)
                      }
                    }}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ijsselheem-donkerblauw focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                      (app.publicatie_afgerond ?? false) ? 'bg-ijsselheem-olijfgroen' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition',
                        (app.publicatie_afgerond ?? false) ? 'translate-x-5' : 'translate-x-1'
                      )}
                      style={{ marginTop: 2 }}
                    />
                  </button>
                  <span className={cn(
                    'text-sm font-medium',
                    (app.publicatie_afgerond ?? false) ? 'text-ijsselheem-primair-groen' : 'text-ijsselheem-donkerblauw/80'
                  )}>
                    {(app.publicatie_afgerond ?? false) ? 'App is zichtbaar voor gebruikers.' : 'App is niet zichtbaar voor gebruikers.'}
                  </span>
                </div>
              </>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  setSavingDocumentatie(true)
                  setError(null)
                  try {
                    const updated = await updateApp(app.id, {
                      doel_app: app.doel_app ?? null,
                      ontwikkeld_door: app.ontwikkeld_door ?? null,
                      documentatie_url: app.documentatie_url ?? null,
                      url_test: app.url_test ?? null,
                      url_productie: app.url_productie ?? null,
                      icon_key: app.icon_key ?? null,
                      handleiding_aanwezig: app.handleiding_aanwezig ?? false,
                    })
                    setApp(updated)
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Opslaan mislukt')
                  } finally {
                    setSavingDocumentatie(false)
                  }
                }}
                disabled={savingDocumentatie}
                className="rounded-lg border border-ijsselheem-accentblauw bg-ijsselheem-accentblauw px-3 py-1.5 text-sm font-semibold text-ijsselheem-donkerblauw hover:opacity-90 disabled:opacity-50"
              >
                {savingDocumentatie ? 'Opslaan…' : 'Opslaan'}
              </button>
              {(app.status === 'in_testfase' || app.status === 'in_productie') && !(app.publicatie_afgerond ?? false) && (
                <button
                  type="button"
                  onClick={async () => {
                    const hasDoel = (app.doel_app ?? '').trim() !== ''
                    const hasUrl = ((app.url_test ?? '').trim() !== '') || ((app.url_productie ?? '').trim() !== '')
                    if (!hasDoel || !hasUrl) {
                      setError('Vul Doel app en minimaal URL test of URL productie in om afronden te voltooien.')
                      return
                    }
                    setSavingDocumentatie(true)
                    setError(null)
                    try {
                      const updated = await updateApp(app.id, {
                        doel_app: app.doel_app ?? null,
                        ontwikkeld_door: app.ontwikkeld_door ?? null,
                        documentatie_url: app.documentatie_url ?? null,
                        url_test: app.url_test ?? null,
                        url_productie: app.url_productie ?? null,
                        icon_key: app.icon_key ?? null,
                        handleiding_aanwezig: app.handleiding_aanwezig ?? false,
                        publicatie_afgerond: true,
                      })
                      setApp(updated)
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Opslaan mislukt')
                    } finally {
                      setSavingDocumentatie(false)
                    }
                  }}
                  disabled={savingDocumentatie}
                  className="rounded-lg border border-ijsselheem-olijfgroen bg-ijsselheem-olijfgroen px-3 py-1.5 text-sm font-semibold text-ijsselheem-donkerblauw hover:opacity-90 disabled:opacity-50"
                >
                  {savingDocumentatie ? 'Opslaan…' : 'Afronden voltooid'}
                </button>
              )}
            </div>
          </section>
        )}
        {appBeheerTab === 'userstories' && (
        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-3">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2">
            User stories of taken
          </h3>
          <p className="text-xs text-ijsselheem-donkerblauw/70">
            Uitgebreide user story: rol, handeling, acceptatiecriteria. Eenvoudige userstory: titel met een lijst van taken. Sprintplanning gebeurt op het werkbord; hier breng je alleen de inhoud in kaart.
          </p>
          <p className="text-xs font-medium text-ijsselheem-donkerblauw/80 mt-1">Lijst</p>
          {storiesLoading ? (
            <p className="text-sm text-ijsselheem-donkerblauw/80">Laden…</p>
          ) : (
            <>
              {userStories.length === 0 ? (
                <p className="text-sm text-ijsselheem-donkerblauw/80 py-3 text-center border border-dashed border-ijsselheem-accentblauw/40 rounded-lg">
                  Nog geen user stories of taken. Voeg hieronder een uitgebreide user story of een eenvoudige userstory toe.
                </p>
              ) : (
              <ul className="space-y-2">
                {userStories.map((story) => (
                  <li
                    key={story.id}
                    className="rounded-lg border border-ijsselheem-accentblauw/20 bg-ijsselheem-lichtblauw/30 p-3"
                  >
                    {editingStoryId === story.id && editStoryDraft ? (
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-3">
                        <div className="space-y-2">
                          <div className="flex gap-3">
                            <label
                              className={cn(
                                'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                                editStoryDraft.weergave_type === 'user_story'
                                  ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                                  : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                              )}
                            >
                              <input
                                type="radio"
                                name={`weergave-edit-${story.id}`}
                                checked={editStoryDraft.weergave_type === 'user_story'}
                                onChange={() =>
                                  setEditStoryDraft((d) => (d ? { ...d, weergave_type: 'user_story' as WeergaveType } : null))
                                }
                                className="rounded sr-only"
                              />
                              Uitgebreide user story
                            </label>
                            <label
                              className={cn(
                                'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                                editStoryDraft.weergave_type === 'taaklijst'
                                  ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                                  : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                              )}
                            >
                              <input
                                type="radio"
                                name={`weergave-edit-${story.id}`}
                                checked={editStoryDraft.weergave_type === 'taaklijst'}
                                onChange={() =>
                                  setEditStoryDraft((d) => (d ? { ...d, weergave_type: 'taaklijst' as WeergaveType } : null))
                                }
                                className="rounded sr-only"
                              />
                              Eenvoudige userstory
                            </label>
                          </div>
                          <input
                            type="text"
                            value={editStoryDraft.titel}
                            onChange={(e) =>
                              setEditStoryDraft((d) => (d ? { ...d, titel: e.target.value } : null))
                            }
                            placeholder={editStoryDraft.weergave_type === 'taaklijst' ? 'Titel' : 'Titel'}
                            className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm"
                          />
                          {editStoryDraft.weergave_type === 'taaklijst' ? (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-ijsselheem-donkerblauw/70">Taken</p>
                              {((editStoryDraft.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)).map((line, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-sm text-ijsselheem-donkerblauw flex-1 min-w-0">{line}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const lines = (editStoryDraft!.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
                                      setEditStoryDraft((d) => (d ? { ...d, beschrijving: lines.filter((_, idx) => idx !== i).join('\n') || null } : null))
                                    }}
                                    className="text-xs text-red-600 hover:underline shrink-0"
                                  >
                                    Verwijderen
                                  </button>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newLooseTaskInput}
                                  onChange={(e) => setNewLooseTaskInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      const t = newLooseTaskInput.trim()
                                      if (t) {
                                        setEditStoryDraft((d) => (d ? { ...d, beschrijving: (d.beschrijving ?? '').trim() ? (d.beschrijving ?? '').trim() + '\n' + t : t } : null))
                                        setNewLooseTaskInput('')
                                      }
                                    }
                                  }}
                                  placeholder="Nieuwe taak toevoegen"
                                  className="flex-1 rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const t = newLooseTaskInput.trim()
                                    if (t) {
                                      setEditStoryDraft((d) => (d ? { ...d, beschrijving: (d.beschrijving ?? '').trim() ? (d.beschrijving ?? '').trim() + '\n' + t : t } : null))
                                      setNewLooseTaskInput('')
                                    }
                                  }}
                                  disabled={!newLooseTaskInput.trim()}
                                  className="rounded border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/50 px-2 py-1 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50 disabled:bg-gray-100"
                                >
                                  Taak toevoegen
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <textarea
                                value={editStoryDraft.beschrijving ?? ''}
                                onChange={(e) =>
                                  setEditStoryDraft((d) => (d ? { ...d, beschrijving: e.target.value || null } : null))
                                }
                                placeholder="Beschrijving (optioneel)"
                                rows={2}
                                className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm"
                              />
                              <textarea
                                value={editStoryDraft.acceptatiecriteria ?? ''}
                                onChange={(e) =>
                                  setEditStoryDraft((d) => (d ? { ...d, acceptatiecriteria: e.target.value || null } : null))
                                }
                                placeholder={getAcceptatiecriteriaPlaceholder(urenwinst, med)}
                                rows={2}
                                className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm"
                              />
                            </>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveStory(story.id)}
                              className="rounded-lg border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/50 px-2 py-1 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
                            >
                              Opslaan
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStoryId(null)
                                setEditStoryDraft(null)
                                setNewLooseTaskInput('')
                              }}
                              className="text-sm text-ijsselheem-donkerblauw/70 hover:underline"
                            >
                              Annuleren
                            </button>
                          </div>
                        </div>
                        {editStoryDraft && editStoryDraft.weergave_type === 'user_story' && (
                          <div className="sm:w-48 shrink-0">
                            <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">Kwaliteitscheck</h4>
                            <ul className="space-y-1 text-xs text-ijsselheem-donkerblauw">
                              {[
                                { label: 'Rol benoemd', ok: getStoryQualityChecklist(editStoryDraft.titel, editStoryDraft.beschrijving, editStoryDraft.acceptatiecriteria).rol },
                                { label: 'Eén actie', ok: getStoryQualityChecklist(editStoryDraft.titel, editStoryDraft.beschrijving, editStoryDraft.acceptatiecriteria).eenActie },
                                { label: 'Meetbaar', ok: getStoryQualityChecklist(editStoryDraft.titel, editStoryDraft.beschrijving, editStoryDraft.acceptatiecriteria).meetbaar },
                                { label: 'Eén functionaliteit', ok: getStoryQualityChecklist(editStoryDraft.titel, editStoryDraft.beschrijving, editStoryDraft.acceptatiecriteria).eenFunctionaliteit },
                              ].map(({ label, ok }) => (
                                <li key={label} className="flex items-center gap-1.5">
                                  {ok ? <span className="text-green-600">✓</span> : <span className="text-ijsselheem-donkerblauw/40">○</span>}
                                  <span>{label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {editStoryDraft && editStoryDraft.weergave_type === 'taaklijst' && (
                          <div className="sm:w-48 shrink-0">
                            <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">Kwaliteitscheck</h4>
                            <ul className="space-y-1 text-xs text-ijsselheem-donkerblauw">
                              <li className="flex items-center gap-1.5">
                                {hasMinOneTask(editStoryDraft.beschrijving) ? <span className="text-green-600">✓</span> : <span className="text-ijsselheem-donkerblauw/40">○</span>}
                                <span>Minimaal 1 taak aanwezig</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ijsselheem-donkerblauw text-sm">
                            {story.titel}
                          </p>
                          {(story.weergave_type ?? 'taaklijst') === 'taaklijst' ? (
                            story.beschrijving ? (
                              <ul className="mt-0.5 list-disc list-inside text-xs text-ijsselheem-donkerblauw/80 space-y-0.5">
                                {(story.beschrijving || '')
                                  .split(/\r?\n/)
                                  .map((line) => line.trim())
                                  .filter(Boolean)
                                  .map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                              </ul>
                            ) : null
                          ) : (
                            <>
                              {story.beschrijving && (
                                <p className="mt-0.5 text-xs text-ijsselheem-donkerblauw/80 whitespace-pre-wrap">
                                  {story.beschrijving}
                                </p>
                              )}
                              {story.acceptatiecriteria && (
                                <p className="mt-0.5 text-xs text-ijsselheem-donkerblauw/70 whitespace-pre-wrap">
                                  Acceptatie: {story.acceptatiecriteria}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStoryId(story.id)
                              setEditStoryDraft({
                                titel: story.titel,
                                beschrijving: story.beschrijving ?? null,
                                acceptatiecriteria: story.acceptatiecriteria ?? null,
                                weergave_type: story.weergave_type ?? 'taaklijst',
                              })
                            }}
                            className="text-xs text-ijsselheem-donkerblauw/80 hover:underline"
                          >
                            Bewerken
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStory(story.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Verwijderen
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              )}
              <p className="text-xs font-medium text-ijsselheem-donkerblauw/80 mt-2">Nieuwe toevoegen</p>
              <div className="border-t border-ijsselheem-accentblauw/30 pt-3 space-y-2">
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw">
                  Type
                </label>
                <div className="flex gap-3 mb-2">
                  <label
                    className={cn(
                      'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                      (addStoryForm.weergave_type ?? 'taaklijst') === 'user_story'
                        ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                        : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                    )}
                  >
                    <input
                      type="radio"
                      name="weergave-add-1"
                      checked={(addStoryForm.weergave_type ?? 'taaklijst') === 'user_story'}
                      onChange={() => setAddStoryForm((f) => ({ ...f, weergave_type: 'user_story' }))}
                      className="rounded sr-only"
                    />
                    Uitgebreide user story
                  </label>
                  <label
                    className={cn(
                      'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                      (addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst'
                        ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                        : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                    )}
                  >
                    <input
                      type="radio"
                      name="weergave-add-1"
                      checked={(addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst'}
                      onChange={() => setAddStoryForm((f) => ({ ...f, weergave_type: 'taaklijst', titel: '', beschrijving: null }))}
                      className="rounded sr-only"
                    />
                    Eenvoudige userstory
                  </label>
                </div>
                <input
                  type="text"
                  value={addStoryForm.titel}
                  onChange={(e) => setAddStoryForm((f) => ({ ...f, titel: e.target.value }))}
                  placeholder="Titel (verplicht)"
                  className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                />
                {(addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst' ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-ijsselheem-donkerblauw/70">Taken</p>
                    {((addStoryForm.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)).map((line, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm text-ijsselheem-donkerblauw flex-1 min-w-0">{line}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const lines = (addStoryForm.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
                            setAddStoryForm((f) => ({ ...f, beschrijving: lines.filter((_, idx) => idx !== i).join('\n') || null }))
                          }}
                          className="text-xs text-red-600 hover:underline shrink-0"
                        >
                          Verwijderen
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLooseTaskInput}
                        onChange={(e) => setNewLooseTaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const t = newLooseTaskInput.trim()
                            if (t) {
                              setAddStoryForm((f) => ({ ...f, beschrijving: (f.beschrijving ?? '').trim() ? (f.beschrijving ?? '').trim() + '\n' + t : t }))
                              setNewLooseTaskInput('')
                            }
                          }
                        }}
                        placeholder="Nieuwe taak toevoegen"
                        className="flex-1 rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const t = newLooseTaskInput.trim()
                          if (t) {
                            setAddStoryForm((f) => ({ ...f, beschrijving: (f.beschrijving ?? '').trim() ? (f.beschrijving ?? '').trim() + '\n' + t : t }))
                            setNewLooseTaskInput('')
                          }
                        }}
                        disabled={!newLooseTaskInput.trim()}
                        className="rounded-lg border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/50 px-2 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50 disabled:bg-gray-100"
                      >
                        Taak toevoegen
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={addStoryForm.beschrijving ?? ''}
                      onChange={(e) => setAddStoryForm((f) => ({ ...f, beschrijving: e.target.value || null }))}
                      placeholder="Beschrijving (optioneel)"
                      rows={2}
                      className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                    />
                    <textarea
                      value={addStoryForm.acceptatiecriteria ?? ''}
                      onChange={(e) =>
                        setAddStoryForm((f) => ({ ...f, acceptatiecriteria: e.target.value || null }))
                      }
                      placeholder="Acceptatiecriteria (optioneel)"
                      rows={2}
                      className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                    />
                  </>
                )}
                {(addStoryForm.weergave_type ?? 'taaklijst') === 'user_story' && (
                  <div className="sm:w-48">
                    <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">Kwaliteitscheck</h4>
                    <ul className="space-y-1 text-xs text-ijsselheem-donkerblauw">
                      {[
                        { label: 'Rol benoemd', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).rol },
                        { label: 'Eén actie', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).eenActie },
                        { label: 'Meetbaar', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).meetbaar },
                        { label: 'Eén functionaliteit', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).eenFunctionaliteit },
                      ].map(({ label, ok }) => (
                        <li key={label} className="flex items-center gap-1.5">
                          {ok ? <span className="text-green-600">✓</span> : <span className="text-ijsselheem-donkerblauw/40">○</span>}
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst' && (
                  <div className="sm:w-48">
                    <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">Kwaliteitscheck</h4>
                    <ul className="space-y-1 text-xs text-ijsselheem-donkerblauw">
                      <li className="flex items-center gap-1.5">
                        {hasMinOneTask(addStoryForm.beschrijving) ? <span className="text-green-600">✓</span> : <span className="text-ijsselheem-donkerblauw/40">○</span>}
                        <span>Minimaal 1 taak aanwezig</span>
                      </li>
                    </ul>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddStory}
                  disabled={addingStory || !addStoryForm.titel.trim()}
                  className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw bg-ijsselheem-lichtblauw/50 px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50 disabled:bg-gray-100"
                >
                  {addingStory ? 'Toevoegen…' : (addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst' ? 'Eenvoudige userstory toevoegen' : 'Toevoegen'}
                </button>
              </div>
            </>
          )}
        </section>
        )}
        <section className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Applicatie verwijderen</h3>
          <p className="text-xs text-red-700/90 mb-3">
            Verwijder deze applicatie definitief. Alle gekoppelde features en user stories worden ook verwijderd. Deze actie kan niet ongedaan worden gemaakt.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (!app || !window.confirm(`Applicatie "${app.naam}" definitief verwijderen? Dit verwijdert ook alle features en user stories.`)) return
              setError(null)
              try {
                await deleteApp(app.id)
                navigate('/applicaties-beheren')
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Verwijderen mislukt')
              }
            }}
            className="rounded-lg border border-red-300 bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200"
          >
            Applicatie verwijderen
          </button>
        </section>
      </div>
    )
  }
  if (!feature && !app) {
    return (
      <div>
        <p className="text-ijsselheem-donkerblauw">Niet gevonden.</p>
        <button
          type="button"
          onClick={() => navigate('/backlog')}
          className="mt-2 text-sm font-medium text-ijsselheem-donkerblauw hover:underline"
        >
          Naar Backlog
        </button>
      </div>
    )
  }
  if (!feature) {
    return (
      <div>
        <p className="text-ijsselheem-donkerblauw">Geen feature gevonden voor dit item.</p>
        <button
          type="button"
          onClick={() => navigate('/backlog')}
          className="mt-2 text-sm font-medium text-ijsselheem-donkerblauw hover:underline"
        >
          Naar Backlog
        </button>
      </div>
    )
  }

  const setView = (newView: 'classic' | 'compact') => {
    const next = new URLSearchParams(searchParams)
    next.set('view', newView)
    setSearchParams(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">
          Beoordelen: {app?.naam ?? '—'} · {feature.naam}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ijsselheem-donkerblauw/70">Weergave:</span>
          <button
            type="button"
            onClick={() => setView('classic')}
            className={cn(
              'rounded-lg border px-2 py-1 text-xs font-medium',
              view === 'classic'
                ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white'
                : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw'
            )}
          >
            Oude weergave
          </button>
          <button
            type="button"
            onClick={() => setView('compact')}
            className={cn(
              'rounded-lg border px-2 py-1 text-xs font-medium',
              view === 'compact'
                ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white'
                : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw'
            )}
          >
            Nieuwe weergave
          </button>
          <button
            type="button"
            onClick={() => navigate('/backlog')}
            className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline"
          >
            ← Backlog
          </button>
        </div>
      </div>
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <BasisfunctionaliteitNieuweAppHint featureNaam={feature.naam} variant="banner" />

      {view === 'compact' ? (
        /* Compact layout: Algemene info (read-only + Bewerken), 70/30 Beoordeling + Impactanalyse, User stories */
        <>
          {/* 2.1 Algemene informatie */}
          <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2 flex-1">
                Algemene informatie
              </h3>
              <button
                type="button"
                onClick={() => setEditAlgemeneInfo((e) => !e)}
                className="rounded-lg border border-ijsselheem-accentblauw/50 px-2 py-1 text-xs font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw shrink-0"
              >
                {editAlgemeneInfo ? 'Sluiten' : 'Bewerken'}
              </button>
            </div>
            <>
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {app && (
                    <>
                      <div>
                        <span className="text-xs text-ijsselheem-donkerblauw/70">Applicatie</span>
                        <p className="font-medium text-ijsselheem-donkerblauw">{app.naam}</p>
                      </div>
                      <div>
                        <span className="text-xs text-ijsselheem-donkerblauw/70">Domein</span>
                        <p className="text-ijsselheem-donkerblauw">{app.domein ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-ijsselheem-donkerblauw/70">Productowner</span>
                        <p className="text-ijsselheem-donkerblauw">{app.aanspreekpunt_intern ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-ijsselheem-donkerblauw/70">Aanvrager/Eigenaar</span>
                        <p className="text-ijsselheem-donkerblauw">{app.eigenaar ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-ijsselheem-donkerblauw/70">Aanspreekpunt proces</span>
                        <p className="text-ijsselheem-donkerblauw">{app.aanspreekpunt_proces ?? '—'}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-xs text-ijsselheem-donkerblauw/70">Feature</span>
                    <p className="font-medium text-ijsselheem-donkerblauw">{feature.naam}</p>
                  </div>
                  {app && (
                    <div>
                      <span className="text-xs text-ijsselheem-donkerblauw/70">Beveiligingsniveau</span>
                      <p className="mt-0.5">
                        <BeveiligingsniveauBadge level={app.beveiligingsniveau} />
                      </p>
                    </div>
                  )}
                </div>
                {app &&
                  (app.frequentie_per_week != null ||
                    app.minuten_per_medewerker_per_week != null ||
                    app.aantal_medewerkers != null ||
                    app.urenwinst_per_jaar != null ||
                    (app.zorgimpact_type != null && app.zorgimpact_type !== '')) && (
                  <div className="rounded-lg border border-ijsselheem-accentblauw/20 bg-ijsselheem-lichtblauw/30 p-3 text-sm">
                    <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw mb-1">Ingevuld bij aanvraag</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {app.frequentie_per_week != null && <span>Frequentie: {app.frequentie_per_week}/week</span>}
                      {app.minuten_per_medewerker_per_week != null && (
                        <span>Min/medewerker/keer: {app.minuten_per_medewerker_per_week}</span>
                      )}
                      {app.aantal_medewerkers != null && <span>Medewerkers: {app.aantal_medewerkers}</span>}
                      {app.urenwinst_per_jaar != null && (
                        <span>Urenwinst: {app.urenwinst_per_jaar.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} u/j</span>
                      )}
                      {app.zorgimpact_type && <span>Zorgimpact: {app.zorgimpact_type}</span>}
                    </div>
                  </div>
                )}
                {app?.probleemomschrijving && (
                  <div className="pt-2 border-t border-ijsselheem-accentblauw/20">
                    <span className="text-xs text-ijsselheem-donkerblauw/70">Probleem</span>
                    <p className="text-sm text-ijsselheem-donkerblauw whitespace-pre-wrap mt-0.5">
                      {app.probleemomschrijving}
                    </p>
                  </div>
                )}
              </div>
            </>
            {editAlgemeneInfo && (
              <div className="mt-3 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  {app && (
                    <>
                      <div className="min-w-[12rem]">
                        <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Productowner</label>
                        <input
                          type="text"
                          value={app.aanspreekpunt_intern ?? ''}
                          onChange={(e) =>
                            setApp((a) => (a ? { ...a, aanspreekpunt_intern: e.target.value || null } : null))
                          }
                          onBlur={async () => {
                            if (!app?.id) return
                            try {
                              const updated = await updateApp(app.id, { aanspreekpunt_intern: app.aanspreekpunt_intern ?? null })
                              setApp(updated)
                              setSavedContactFields((prev) => ({
                                aanspreekpunt_intern: updated.aanspreekpunt_intern ?? null,
                                eigenaar: prev?.eigenaar ?? updated.eigenaar ?? null,
                                aanspreekpunt_proces: prev?.aanspreekpunt_proces ?? updated.aanspreekpunt_proces ?? null,
                              }))
                            } catch (_) {}
                          }}
                          placeholder="Naam of team"
                          className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div className="min-w-[12rem]">
                        <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Aanvrager/Eigenaar</label>
                        <input
                          type="text"
                          value={app.eigenaar ?? ''}
                          onChange={(e) => setApp((a) => (a ? { ...a, eigenaar: e.target.value || null } : null))}
                          onBlur={async () => {
                            if (!app?.id) return
                            try {
                              const updated = await updateApp(app.id, { eigenaar: app.eigenaar ?? null })
                              setApp(updated)
                              setSavedContactFields((prev) => ({
                                aanspreekpunt_intern: prev?.aanspreekpunt_intern ?? updated.aanspreekpunt_intern ?? null,
                                eigenaar: updated.eigenaar ?? null,
                                aanspreekpunt_proces: prev?.aanspreekpunt_proces ?? updated.aanspreekpunt_proces ?? null,
                              }))
                            } catch (_) {}
                          }}
                          placeholder="Naam of team"
                          className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div className="min-w-[12rem]">
                        <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Aanspreekpunt proces</label>
                        <input
                          type="text"
                          value={app.aanspreekpunt_proces ?? ''}
                          onChange={(e) =>
                            setApp((a) => (a ? { ...a, aanspreekpunt_proces: e.target.value || null } : null))
                          }
                          onBlur={async () => {
                            if (!app?.id) return
                            try {
                              const updated = await updateApp(app.id, { aanspreekpunt_proces: app.aanspreekpunt_proces ?? null })
                              setApp(updated)
                              setSavedContactFields((prev) => ({
                                aanspreekpunt_intern: prev?.aanspreekpunt_intern ?? updated.aanspreekpunt_intern ?? null,
                                eigenaar: prev?.eigenaar ?? updated.eigenaar ?? null,
                                aanspreekpunt_proces: updated.aanspreekpunt_proces ?? null,
                              }))
                            } catch (_) {}
                          }}
                          placeholder="Naam of team"
                          className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                        />
                      </div>
                    </>
                  )}
                  <div className="min-w-[12rem]">
                    <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Status feature</label>
                    <select
                      value={feature.planning_status ?? 'wensenlijst'}
                      onChange={async (e) => {
                        const planningStatus = e.target.value as AppStatusDb
                        try {
                          const updated = await updateFeature(feature.id, { planning_status: planningStatus })
                          setFeature(updated)
                          setDraft((d) => ({ ...d, planning_status: planningStatus }))
                          if (app) await maybeSyncAppStatusToFeaturePlanningStatus(app.id, planningStatus)
                        } catch (_) {}
                      }}
                      className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                    >
                      {appStatusOptions.filter((o) => o.value !== 'afgewezen').map((o) => (
                        <option key={o.value} value={o.value}>{getStatusLabel(o.value as AppStatusDb)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 2.2 Beoordeling (70%) + Impactanalyse (30%) */}
          <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-6">
            <section className="rounded-xl border-2 border-ijsselheem-donkerblauw bg-white p-4 space-y-4">
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2">
                Beoordeling (Zorgimpact)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Frequentie (per week)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.frequentie_per_week ?? feature.frequentie_per_week ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, frequentie_per_week: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Minuten per medewerker per keer</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.minuten_per_medewerker_per_week ?? feature.minuten_per_medewerker_per_week ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, minuten_per_medewerker_per_week: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Aantal medewerkers</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.aantal_medewerkers ?? feature.aantal_medewerkers ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, aantal_medewerkers: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="rounded-lg bg-ijsselheem-lichtblauw/50 p-3">
                  <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Urenwinst per jaar: </span>
                  <span className="text-sm font-bold text-ijsselheem-donkerblauw">
                    {urenwinst != null ? urenwinst.toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' uur' : '—'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Zorgimpact type</label>
                <select
                  value={draft.zorgimpact_type ?? feature.zorgimpact_type ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, zorgimpact_type: e.target.value || null }))}
                  className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                >
                  <option value="">— Kies</option>
                  {zorgimpactTypeOptions.map((z) => (
                    <option key={z.value} value={z.value}>{z.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Zorgwaarde (1–5)</label>
                <p className="text-xs text-ijsselheem-donkerblauw/60 mt-0.5">
                  Hoe belangrijk is dit idee voor de kwaliteit van zorg of het welzijn van cliënten? 1 = weinig impact, 5 = zeer grote impact.
                </p>
                <div className="flex gap-2 mt-1">
                  {zorgwaardeOptions.map((z) => (
                    <button
                      key={z.value}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, zorgwaarde: Number(z.value) }))}
                      className={cn(
                        'w-9 h-9 rounded-lg border text-sm font-medium transition',
                        currentZorgwaarde === Number(z.value)
                          ? 'bg-ijsselheem-donkerblauw text-white border-ijsselheem-donkerblauw'
                          : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw'
                      )}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Bouwinspanning</label>
                  <select
                    value={currentBouwinspanning ?? ''}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        bouwinspanning: (e.target.value || null) as BouwinspanningDb | null,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="">—</option>
                    {bouwinspanningOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Sparse betrokken</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, sparse_betrokken: true }))}
                      className={cn(
                        'rounded-lg border px-2 py-1 text-xs font-medium',
                        sparseBetrokken ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw'
                      )}
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, sparse_betrokken: false }))}
                      className={cn(
                        'rounded-lg border px-2 py-1 text-xs font-medium',
                        !sparseBetrokken ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw'
                      )}
                    >
                      Nee
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Risico</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, risico: true }))}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm font-medium',
                      currentRisico === true
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'border-gray-300 text-ijsselheem-donkerblauw hover:bg-gray-50'
                    )}
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, risico: false }))}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm font-medium',
                      currentRisico === false
                        ? 'bg-ijsselheem-lichtblauw border-ijsselheem-accentblauw text-ijsselheem-donkerblauw'
                        : 'border-gray-300 text-ijsselheem-donkerblauw hover:bg-gray-50'
                    )}
                  >
                    Nee
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Toelichting</label>
                <textarea
                  value={draft.beoordeling_toelichting ?? feature.beoordeling_toelichting ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, beoordeling_toelichting: e.target.value || null }))}
                  rows={2}
                  className="mt-0.5 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                />
              </div>
              {app && (
                <>
                  <div className="border-t border-ijsselheem-accentblauw/30 pt-3">
                    <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-2">Beveiligingsniveau (app)</h4>
                    <p className="text-xs text-ijsselheem-donkerblauw/60 mb-2">
                      Beantwoord de vragen zodat we het beveiligingsniveau van de app kunnen bepalen.
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-ijsselheem-donkerblauw/70 mb-1">Bevat de applicatie cliëntgegevens?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleBeveiligingChange({ ...beveiliging, clientgegevens: true })}
                            className={cn('rounded-lg border px-2 py-1 text-xs font-medium', beveiliging.clientgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                          >
                            Ja
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBeveiligingChange({ ...beveiliging, clientgegevens: false })}
                            className={cn('rounded-lg border px-2 py-1 text-xs font-medium', !beveiliging.clientgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                          >
                            Nee
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-ijsselheem-donkerblauw/70 mb-1">Bevat de applicatie persoonsgegevens van medewerkers?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBeveiliging((b) => ({ ...b, medewerkersgegevens: true }))}
                            className={cn('rounded-lg border px-2 py-1 text-xs font-medium', beveiliging.medewerkersgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                          >
                            Ja
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBeveiligingChange({ ...beveiliging, medewerkersgegevens: false })}
                            className={cn('rounded-lg border px-2 py-1 text-xs font-medium', !beveiliging.medewerkersgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                          >
                            Nee
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-ijsselheem-donkerblauw/70 mb-1">Is de applicatie bedoeld voor intern gebruik door een team of locatie?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBeveiliging((b) => ({ ...b, intern_team: true }))}
                            className={cn('rounded-lg border px-2 py-1 text-xs font-medium', beveiliging.intern_team ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                          >
                            Ja
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBeveiligingChange({ ...beveiliging, intern_team: false })}
                            className={cn('rounded-lg border px-2 py-1 text-xs font-medium', !beveiliging.intern_team ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                          >
                            Nee
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 rounded-lg bg-ijsselheem-lichtblauw/50 p-2">
                      <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Bepaald niveau: </span>
                      <span className="text-xs font-bold text-ijsselheem-donkerblauw">{getBeveiligingsniveauLabel(bepaalBeveiligingsniveau(beveiliging))}</span>
                    </div>
                  </div>
                </>
              )}
            </section>

            {app && (
              <section className="rounded-xl bg-ijsselheem-middenblauw p-4 space-y-3 text-white">
                <h3 className="text-sm font-semibold border-b border-white/30 pb-2">
                  Impactanalyse
                </h3>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-white/20 p-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-white/90">Werkbesparing-score</p>
                    <p className="text-2xl font-bold">{werkbesparing != null ? werkbesparing : '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-white/90">Prioriteitsscore</p>
                    <p className="text-2xl font-bold">{prioriteitsscore != null ? prioriteitsscore.toFixed(1) : '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-white/80">Urenwinst: </span>
                    <span className="font-medium">
                      {urenwinst != null
                        ? urenwinst.toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' uur/jaar'
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/80">Zorgwaarde: </span>
                    <span className="font-medium">{currentZorgwaarde != null ? currentZorgwaarde : '—'}</span>
                  </div>
                  <div>
                    <span className="text-white/80">Bouwinspanning: </span>
                    <span className="font-medium">
                      {currentBouwinspanning != null ? getBouwinspanningLabel(currentBouwinspanning as BouwinspanningDb) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/80">Risico: </span>
                    <span className="font-medium">
                      {currentRisico === true ? 'Ja' : currentRisico === false ? 'Nee' : '—'}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-white/15 p-3">
                  <h4 className="text-xs font-semibold mb-1">Eisen voor dit level</h4>
                  {getBeveiligingsniveauEisen(app.beveiligingsniveau).length > 0 ? (
                    <ul className="text-xs text-white/90 space-y-1 list-disc list-inside">
                      {getBeveiligingsniveauEisen(app.beveiligingsniveau).map((eis, i) => (
                        <li key={i}>{eis}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-white/80">Stel het beveiligingsniveau in (bij beoordeling) om de eisen te zien.</p>
                  )}
                </div>
                <div className="rounded-lg bg-white/15 p-3">
                  <h4 className="text-xs font-semibold mb-1">Samenvatting</h4>
                  <p className="text-sm">
                    {impactSummary({
                      urenwinstPerJaar: urenwinst ?? 0,
                      zorgwaarde: (currentZorgwaarde != null && currentZorgwaarde >= 1 && currentZorgwaarde <= 5 ? currentZorgwaarde : null) as 1 | 2 | 3 | 4 | 5 | null,
                      bouwinspanning: (currentBouwinspanning === 'S' || currentBouwinspanning === 'M' || currentBouwinspanning === 'L' ? currentBouwinspanning : null),
                      risico: currentRisico ?? false,
                      impactType: zorgimpactType ?? undefined,
                    })}
                  </p>
                </div>
                <div className="rounded-lg bg-white/15 p-3">
                  <h4 className="text-xs font-semibold mb-1">Focus voor deze story</h4>
                  <p className="text-sm">{getFocusText(urenwinst, currentZorgwaarde, werkbesparing)}</p>
                </div>
              </section>
            )}
          </div>

          {/* 2.3 User stories of taken */}
          {app && (
            <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2">
                User stories of taken
              </h3>
              <p className="text-xs text-ijsselheem-donkerblauw/70">
                Uitgebreide user story: rol, handeling, acceptatiecriteria. Eenvoudige userstory: titel met een lijst van taken. Sprintplanning gebeurt op het werkbord; hier breng je alleen de inhoud in kaart.
              </p>
              <p className="text-xs font-medium text-ijsselheem-donkerblauw/80">Lijst</p>
              {storiesLoading ? (
                <p className="text-sm text-ijsselheem-donkerblauw/80">Laden…</p>
              ) : (
                <>
                  {userStories.length === 0 ? (
                    <p className="text-sm text-ijsselheem-donkerblauw/80 py-3 text-center border border-dashed border-ijsselheem-accentblauw/40 rounded-lg">Nog geen user stories of taken. Voeg hieronder een uitgebreide user story of een eenvoudige userstory toe.</p>
                  ) : (
                  <ul className="space-y-2">
                    {userStories.map((story) => (
                      <li key={story.id} className="rounded-lg border border-ijsselheem-accentblauw/20 bg-ijsselheem-lichtblauw/30 p-3">
                        {editingStoryId === story.id && editStoryDraft ? (
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-3">
                            <div className="space-y-2">
                              <div className="flex gap-3">
                                <label
                                  className={cn(
                                    'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                                    editStoryDraft.weergave_type === 'user_story'
                                      ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                                      : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                                  )}
                                >
                                  <input type="radio" name={`weergave-edit-2-${story.id}`} checked={editStoryDraft.weergave_type === 'user_story'} onChange={() => setEditStoryDraft((d) => (d ? { ...d, weergave_type: 'user_story' as WeergaveType } : null))} className="rounded sr-only" />
                                  Uitgebreide user story
                                </label>
                                <label
                                  className={cn(
                                    'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                                    editStoryDraft.weergave_type === 'taaklijst'
                                      ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                                      : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                                  )}
                                >
                                  <input type="radio" name={`weergave-edit-2-${story.id}`} checked={editStoryDraft.weergave_type === 'taaklijst'} onChange={() => setEditStoryDraft((d) => (d ? { ...d, weergave_type: 'taaklijst' as WeergaveType } : null))} className="rounded sr-only" />
                                  Eenvoudige userstory
                                </label>
                              </div>
                              <input type="text" value={editStoryDraft.titel} onChange={(e) => setEditStoryDraft((d) => (d ? { ...d, titel: e.target.value } : null))} placeholder="Titel" className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm" />
                              {editStoryDraft.weergave_type === 'taaklijst' ? (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-ijsselheem-donkerblauw/70">Taken</p>
                                  {((editStoryDraft.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)).map((line, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <span className="text-sm text-ijsselheem-donkerblauw flex-1 min-w-0">{line}</span>
                                      <button type="button" onClick={() => { const lines = (editStoryDraft!.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean); setEditStoryDraft((d) => (d ? { ...d, beschrijving: lines.filter((_, idx) => idx !== i).join('\n') || null } : null)) }} className="text-xs text-red-600 hover:underline shrink-0">Verwijderen</button>
                                    </div>
                                  ))}
                                  <div className="flex gap-2">
                                    <input type="text" value={newLooseTaskInput} onChange={(e) => setNewLooseTaskInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = newLooseTaskInput.trim(); if (t) { setEditStoryDraft((d) => (d ? { ...d, beschrijving: (d.beschrijving ?? '').trim() ? (d.beschrijving ?? '').trim() + '\n' + t : t } : null)); setNewLooseTaskInput('') } } }} placeholder="Nieuwe taak toevoegen" className="flex-1 rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm" />
                                    <button type="button" onClick={() => { const t = newLooseTaskInput.trim(); if (t) { setEditStoryDraft((d) => (d ? { ...d, beschrijving: (d.beschrijving ?? '').trim() ? (d.beschrijving ?? '').trim() + '\n' + t : t } : null)); setNewLooseTaskInput('') } }} disabled={!newLooseTaskInput.trim()} className="rounded border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/50 px-2 py-1 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50 disabled:bg-gray-100">Taak toevoegen</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <textarea value={editStoryDraft.beschrijving ?? ''} onChange={(e) => setEditStoryDraft((d) => (d ? { ...d, beschrijving: e.target.value || null } : null))} placeholder="Beschrijving" rows={2} className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm" />
                                  <textarea value={editStoryDraft.acceptatiecriteria ?? ''} onChange={(e) => setEditStoryDraft((d) => (d ? { ...d, acceptatiecriteria: e.target.value || null } : null))} placeholder={getAcceptatiecriteriaPlaceholder(urenwinst, med)} rows={2} className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm" />
                                </>
                              )}
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleSaveStory(story.id)} className="rounded-lg border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/50 px-2 py-1 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw">Opslaan</button>
                                <button type="button" onClick={() => { setEditingStoryId(null); setEditStoryDraft(null); setNewLooseTaskInput('') }} className="text-sm text-ijsselheem-donkerblauw/70 hover:underline">Annuleren</button>
                              </div>
                            </div>
                            {editStoryDraft && editStoryDraft.weergave_type === 'user_story' && (
                              <div className="sm:w-48 shrink-0">
                                <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">Kwaliteitscheck</h4>
                                <ul className="space-y-1 text-xs text-ijsselheem-donkerblauw">
                                  {['Rol benoemd', 'Eén actie', 'Meetbaar', 'Eén functionaliteit'].map((label, i) => {
                                    const keys = ['rol', 'eenActie', 'meetbaar', 'eenFunctionaliteit'] as const
                                    const ok = getStoryQualityChecklist(editStoryDraft.titel, editStoryDraft.beschrijving, editStoryDraft.acceptatiecriteria)[keys[i]]
                                    return (
                                      <li key={label} className="flex items-center gap-1.5">
                                        {ok ? <span className="text-green-600">✓</span> : <span className="text-ijsselheem-donkerblauw/40">○</span>}
                                        <span>{label}</span>
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}
                            {editStoryDraft && editStoryDraft.weergave_type === 'taaklijst' && (
                              <div className="sm:w-48 shrink-0">
                                <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">Kwaliteitscheck</h4>
                                <ul className="space-y-1 text-xs text-ijsselheem-donkerblauw">
                                  <li className="flex items-center gap-1.5">
                                    {hasMinOneTask(editStoryDraft.beschrijving) ? <span className="text-green-600">✓</span> : <span className="text-ijsselheem-donkerblauw/40">○</span>}
                                    <span>Minimaal 1 taak aanwezig</span>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-ijsselheem-donkerblauw text-sm">{story.titel}</p>
                              {(story.weergave_type ?? 'taaklijst') === 'taaklijst' ? (
                                story.beschrijving ? (
                                  <ul className="mt-0.5 list-disc list-inside text-xs text-ijsselheem-donkerblauw/80 space-y-0.5">
                                    {(story.beschrijving || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, i) => <li key={i}>{line}</li>)}
                                  </ul>
                                ) : null
                              ) : (
                                <>
                                  {story.beschrijving && <p className="mt-0.5 text-xs text-ijsselheem-donkerblauw/80 whitespace-pre-wrap">{story.beschrijving}</p>}
                                  {story.acceptatiecriteria && <p className="mt-0.5 text-xs text-ijsselheem-donkerblauw/70 whitespace-pre-wrap">Acceptatie: {story.acceptatiecriteria}</p>}
                                </>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <button type="button" onClick={() => { setEditingStoryId(story.id); setEditStoryDraft({ titel: story.titel, beschrijving: story.beschrijving ?? null, acceptatiecriteria: story.acceptatiecriteria ?? null, weergave_type: story.weergave_type ?? 'taaklijst' }) }} className="text-xs text-ijsselheem-donkerblauw/80 hover:underline">Bewerken</button>
                              <button type="button" onClick={() => handleDeleteStory(story.id)} className="text-xs text-red-600 hover:underline">Verwijderen</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  )}
                  <p className="text-xs font-medium text-ijsselheem-donkerblauw/80 mt-2">Nieuwe toevoegen</p>
                  {!showAddStoryForm ? (
                    <button
                      type="button"
                      onClick={() => setShowAddStoryForm(true)}
                      className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
                    >
                      User story toevoegen
                    </button>
                  ) : (
                    <>
                      {currentBouwinspanning === 'L' && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                          Deze feature is groot. Splits dit op in meerdere stories.
                        </div>
                      )}
                      {getZorgimpactHints(zorgimpactType).length > 0 && (
                        <div className="rounded-lg border border-ijsselheem-accentblauw/20 bg-ijsselheem-lichtblauw/30 p-3">
                          <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-2">Focus voor deze story (zorgimpact)</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-ijsselheem-donkerblauw">
                            {getZorgimpactHints(zorgimpactType).map((q) => (
                              <li key={q}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 border-t border-ijsselheem-accentblauw/30 pt-3">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Nieuwe toevoegen</label>
                          <div className="flex gap-3">
                            <label
                              className={cn(
                                'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                                (addStoryForm.weergave_type ?? 'taaklijst') === 'user_story'
                                  ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                                  : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                              )}
                            >
                              <input type="radio" name="weergave-add-2" checked={(addStoryForm.weergave_type ?? 'taaklijst') === 'user_story'} onChange={() => setAddStoryForm((f) => ({ ...f, weergave_type: 'user_story' }))} className="rounded sr-only" />
                              Uitgebreide user story
                            </label>
                            <label
                              className={cn(
                                'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                                (addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst'
                                  ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                                  : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                              )}
                            >
                              <input type="radio" name="weergave-add-2" checked={(addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst'} onChange={() => setAddStoryForm((f) => ({ ...f, weergave_type: 'taaklijst', titel: '', beschrijving: null }))} className="rounded sr-only" />
                              Eenvoudige userstory
                            </label>
                          </div>
                          <input type="text" value={addStoryForm.titel} onChange={(e) => setAddStoryForm((f) => ({ ...f, titel: e.target.value }))} placeholder="Titel (verplicht)" className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm" />
                          {(addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst' ? (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-ijsselheem-donkerblauw/70">Taken</p>
                              {((addStoryForm.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)).map((line, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-sm text-ijsselheem-donkerblauw flex-1 min-w-0">{line}</span>
                                  <button type="button" onClick={() => { const lines = (addStoryForm.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean); setAddStoryForm((f) => ({ ...f, beschrijving: lines.filter((_, idx) => idx !== i).join('\n') || null })) }} className="text-xs text-red-600 hover:underline shrink-0">Verwijderen</button>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <input type="text" value={newLooseTaskInput} onChange={(e) => setNewLooseTaskInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = newLooseTaskInput.trim(); if (t) { setAddStoryForm((f) => ({ ...f, beschrijving: (f.beschrijving ?? '').trim() ? (f.beschrijving ?? '').trim() + '\n' + t : t })); setNewLooseTaskInput('') } } }} placeholder="Nieuwe taak toevoegen" className="flex-1 rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm" />
                                <button type="button" onClick={() => { const t = newLooseTaskInput.trim(); if (t) { setAddStoryForm((f) => ({ ...f, beschrijving: (f.beschrijving ?? '').trim() ? (f.beschrijving ?? '').trim() + '\n' + t : t })); setNewLooseTaskInput('') } }} disabled={!newLooseTaskInput.trim()} className="rounded-lg border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/50 px-2 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50 disabled:bg-gray-100">Taak toevoegen</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <textarea value={addStoryForm.beschrijving ?? ''} onChange={(e) => setAddStoryForm((f) => ({ ...f, beschrijving: e.target.value || null }))} placeholder="Beschrijving (optioneel)" rows={2} className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm" />
                              <textarea value={addStoryForm.acceptatiecriteria ?? ''} onChange={(e) => setAddStoryForm((f) => ({ ...f, acceptatiecriteria: e.target.value || null }))} placeholder={getAcceptatiecriteriaPlaceholder(urenwinst, med)} rows={2} className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm" />
                            </>
                          )}
                          <div className="flex gap-2">
                            <button type="button" onClick={handleAddStory} disabled={addingStory || !addStoryForm.titel.trim()} className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw bg-ijsselheem-lichtblauw/50 px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50 disabled:bg-gray-100">
                              {addingStory ? 'Toevoegen…' : (addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst' ? 'Eenvoudige userstory toevoegen' : 'Toevoegen'}
                            </button>
                            <button type="button" onClick={() => setShowAddStoryForm(false)} className="text-sm text-ijsselheem-donkerblauw/70 hover:underline">
                              Annuleren
                            </button>
                          </div>
                        </div>
                        {(addStoryForm.weergave_type ?? 'taaklijst') === 'user_story' && (
                          <div className="lg:w-56 shrink-0">
                            <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-2">Kwaliteitscheck</h4>
                            <ul className="space-y-1.5 text-sm text-ijsselheem-donkerblauw">
                              {[
                                { label: 'Rol concreet benoemd', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).rol },
                                { label: 'Eén duidelijke actie', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).eenActie },
                                { label: 'Meetbaar resultaat', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).meetbaar },
                                { label: 'Max. één primaire functionaliteit', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).eenFunctionaliteit },
                              ].map(({ label, ok }) => (
                                <li key={label} className="flex items-center gap-2">
                                  {ok ? <span className="text-green-600">✓</span> : <span className="text-ijsselheem-donkerblauw/40">○</span>}
                                  <span className={ok ? 'text-ijsselheem-donkerblauw' : 'text-ijsselheem-donkerblauw/70'}>{label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst' && (
                          <div className="lg:w-56 shrink-0">
                            <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-2">Kwaliteitscheck</h4>
                            <ul className="space-y-1.5 text-sm text-ijsselheem-donkerblauw">
                              <li className="flex items-center gap-2">
                                {hasMinOneTask(addStoryForm.beschrijving) ? <span className="text-green-600">✓</span> : <span className="text-ijsselheem-donkerblauw/40">○</span>}
                                <span>Minimaal 1 taak aanwezig</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </section>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={handleSave} disabled={saving} className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
            <button
              type="button"
              onClick={handleResetBeoordeling}
              disabled={saving || !feature}
              className="rounded-ijsselheem-button border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Reset beoordeling
            </button>
            <button type="button" onClick={() => navigate('/backlog')} className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw">
              Annuleren
            </button>
          </div>
        </>
      ) : (
      /* Classic layout: bestaande weergave */
      <Fragment>
      {/* Blok 1 (100%): alle bekende info – context, werkbelasting, scores, status */}
      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {app && (
            <>
              <div>
                <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Applicatie</span>
                <p className="text-sm font-medium text-ijsselheem-donkerblauw">{app.naam}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Domein</span>
                <p className="text-sm text-ijsselheem-donkerblauw">{app.domein ?? '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Productowner</span>
                <p className="text-sm text-ijsselheem-donkerblauw">
                  {app?.aanspreekpunt_intern ?? '—'}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Aanvrager/Eigenaar</span>
                <p className="text-sm text-ijsselheem-donkerblauw">{app?.eigenaar ?? '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Aanspreekpunt proces</span>
                <p className="text-sm text-ijsselheem-donkerblauw">{app?.aanspreekpunt_proces ?? '—'}</p>
              </div>
            </>
          )}
          <div>
            <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Feature</span>
            <p className="text-sm font-medium text-ijsselheem-donkerblauw">{feature.naam}</p>
          </div>
        </div>
        {app && (
          <div className="rounded-lg bg-ijsselheem-lichtblauw/50 border border-ijsselheem-accentblauw/30 p-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-ijsselheem-donkerblauw">Beveiligingsniveau</span>
            <BeveiligingsniveauBadge level={app.beveiligingsniveau} />
          </div>
        )}
        {app &&
          (app.frequentie_per_week != null ||
            app.minuten_per_medewerker_per_week != null ||
            app.aantal_medewerkers != null ||
            app.urenwinst_per_jaar != null ||
            (app.zorgimpact_type != null && app.zorgimpact_type !== '')) && (
            <div className="rounded-xl border border-ijsselheem-accentblauw/20 bg-ijsselheem-lichtblauw/30 p-3 space-y-2">
              <h4 className="text-sm font-semibold text-ijsselheem-donkerblauw">Ingevuld bij aanvraag</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {app.frequentie_per_week != null && (
                  <div>
                    <span className="text-ijsselheem-donkerblauw/70">Frequentie (per week): </span>
                    <span className="font-medium text-ijsselheem-donkerblauw">{app.frequentie_per_week}</span>
                  </div>
                )}
                {app.minuten_per_medewerker_per_week != null && (
                  <div>
                    <span className="text-ijsselheem-donkerblauw/70">Minuten per medewerker per keer: </span>
                    <span className="font-medium text-ijsselheem-donkerblauw">
                      {app.minuten_per_medewerker_per_week}
                    </span>
                  </div>
                )}
                {app.aantal_medewerkers != null && (
                  <div>
                    <span className="text-ijsselheem-donkerblauw/70">Aantal medewerkers: </span>
                    <span className="font-medium text-ijsselheem-donkerblauw">{app.aantal_medewerkers}</span>
                  </div>
                )}
                {(app.urenwinst_per_jaar != null || app.zorgimpact_type) && (
                  <>
                    {app.urenwinst_per_jaar != null && (
                      <div>
                        <span className="text-ijsselheem-donkerblauw/70">Urenwinst per jaar: </span>
                        <span className="font-medium text-ijsselheem-donkerblauw">
                          {app.urenwinst_per_jaar.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} uur
                        </span>
                      </div>
                    )}
                    {app.zorgimpact_type && (
                      <div>
                        <span className="text-ijsselheem-donkerblauw/70">Zorgimpact type: </span>
                        <span className="font-medium text-ijsselheem-donkerblauw">{app.zorgimpact_type}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Frequentie (per week)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={draft.frequentie_per_week ?? feature.frequentie_per_week ?? ''}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  frequentie_per_week: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">
              Minuten per medewerker per keer
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={draft.minuten_per_medewerker_per_week ?? feature.minuten_per_medewerker_per_week ?? ''}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  minuten_per_medewerker_per_week: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Aantal medewerkers</label>
            <input
              type="number"
              min={0}
              step={1}
              value={draft.aantal_medewerkers ?? feature.aantal_medewerkers ?? ''}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  aantal_medewerkers: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
            />
          </div>
          <div className="rounded-lg bg-ijsselheem-lichtblauw/50 p-3">
            <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Urenwinst per jaar: </span>
            <span className="text-sm font-bold text-ijsselheem-donkerblauw">
              {urenwinst != null
                ? urenwinst.toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' uur'
                : '—'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-ijsselheem-accentblauw/30">
          <div className="rounded-lg bg-ijsselheem-lichtblauw/50 p-3 text-center min-w-[7rem]">
            <p className="text-xs font-medium text-ijsselheem-donkerblauw/70">Werkbesparing-score</p>
            <p className="text-xl font-bold text-ijsselheem-donkerblauw">
              {werkbesparing != null ? werkbesparing : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-ijsselheem-lichtblauw/50 p-3 text-center min-w-[7rem]">
            <p className="text-xs font-medium text-ijsselheem-donkerblauw/70">Prioriteitsscore</p>
            <p className="text-xl font-bold text-ijsselheem-donkerblauw">
              {prioriteitsscore != null ? prioriteitsscore.toFixed(1) : '—'}
            </p>
          </div>
          {app && (
            <div className="min-w-[12rem]">
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Productowner</label>
              <input
                type="text"
                value={app.aanspreekpunt_intern ?? ''}
                onChange={(e) => setApp((a) => (a ? { ...a, aanspreekpunt_intern: e.target.value || null } : null))}
                onBlur={async () => {
                  if (!app?.id) return
                  try {
                    const updated = await updateApp(app.id, { aanspreekpunt_intern: app.aanspreekpunt_intern ?? null })
                    setApp(updated)
                    setSavedContactFields((prev) => ({
                      aanspreekpunt_intern: updated.aanspreekpunt_intern ?? null,
                      eigenaar: prev?.eigenaar ?? updated.eigenaar ?? null,
                      aanspreekpunt_proces: prev?.aanspreekpunt_proces ?? updated.aanspreekpunt_proces ?? null,
                    }))
                  } catch (_) {}
                }}
                placeholder="Naam of team"
                className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
              />
            </div>
          )}
          {app && (
            <div className="min-w-[12rem]">
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Aanvrager/Eigenaar</label>
              <input
                type="text"
                value={app.eigenaar ?? ''}
                onChange={(e) => setApp((a) => (a ? { ...a, eigenaar: e.target.value || null } : null))}
                onBlur={async () => {
                  if (!app?.id) return
                  try {
                    const updated = await updateApp(app.id, { eigenaar: app.eigenaar ?? null })
                    setApp(updated)
                    setSavedContactFields((prev) => ({
                      aanspreekpunt_intern: prev?.aanspreekpunt_intern ?? updated.aanspreekpunt_intern ?? null,
                      eigenaar: updated.eigenaar ?? null,
                      aanspreekpunt_proces: prev?.aanspreekpunt_proces ?? updated.aanspreekpunt_proces ?? null,
                    }))
                  } catch (_) {}
                }}
                placeholder="Naam of team"
                className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
              />
            </div>
          )}
          {app && (
            <div className="min-w-[12rem]">
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Aanspreekpunt proces</label>
              <input
                type="text"
                value={app.aanspreekpunt_proces ?? ''}
                onChange={(e) => setApp((a) => (a ? { ...a, aanspreekpunt_proces: e.target.value || null } : null))}
                onBlur={async () => {
                  if (!app?.id) return
                  try {
                    const updated = await updateApp(app.id, { aanspreekpunt_proces: app.aanspreekpunt_proces ?? null })
                    setApp(updated)
                    setSavedContactFields((prev) => ({
                      aanspreekpunt_intern: prev?.aanspreekpunt_intern ?? updated.aanspreekpunt_intern ?? null,
                      eigenaar: prev?.eigenaar ?? updated.eigenaar ?? null,
                      aanspreekpunt_proces: updated.aanspreekpunt_proces ?? null,
                    }))
                  } catch (_) {}
                }}
                placeholder="Naam of team"
                className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
              />
            </div>
          )}
          <div className="min-w-[12rem]">
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Status feature</label>
            <select
              value={feature.planning_status ?? 'wensenlijst'}
              onChange={async (e) => {
                const planningStatus = e.target.value as AppStatusDb
                try {
                  const updated = await updateFeature(feature.id, { planning_status: planningStatus })
                  setFeature(updated)
                  setDraft((d) => ({ ...d, planning_status: planningStatus }))
                  if (app) {
                    await maybeSyncAppStatusToFeaturePlanningStatus(app.id, planningStatus)
                  }
                } catch (_) {}
              }}
              className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
            >
              {appStatusOptions.filter((o) => o.value !== 'afgewezen').map((o) => (
                <option key={o.value} value={o.value}>
                  {getStatusLabel(o.value as AppStatusDb)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {app?.probleemomschrijving && (
          <div className="pt-2 border-t border-ijsselheem-accentblauw/20">
            <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Probleem</span>
            <p className="text-sm text-ijsselheem-donkerblauw whitespace-pre-wrap mt-0.5">
              {app.probleemomschrijving}
            </p>
          </div>
        )}
      </section>

      {/* Blok 2: twee kolommen 50% – links Beoordeling (Zorgimpact), rechts User stories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2">
            Beoordeling (Zorgimpact)
          </h3>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-1">Zorgimpact type</label>
            <select
              value={draft.zorgimpact_type ?? feature.zorgimpact_type ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, zorgimpact_type: e.target.value || null }))
              }
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">— Kies</option>
              {zorgimpactTypeOptions.map((z) => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw">
              Zorgwaarde (1–5)
            </label>
            <p className="text-xs text-ijsselheem-donkerblauw/60 mt-0.5">
              Hoe belangrijk is dit idee voor de kwaliteit van zorg of het welzijn van cliënten? 1 = weinig impact, 5 = zeer grote impact.
            </p>
            <div className="flex gap-2 mt-1">
              {zorgwaardeOptions.map((z) => (
                <button
                  key={z.value}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, zorgwaarde: Number(z.value) }))}
                  className={cn(
                    'w-9 h-9 rounded-lg border text-sm font-medium transition',
                    currentZorgwaarde === Number(z.value)
                      ? 'bg-ijsselheem-donkerblauw text-white border-ijsselheem-donkerblauw'
                      : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw'
                  )}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Bouwinspanning</label>
              <select
                value={currentBouwinspanning ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    bouwinspanning: (e.target.value || null) as BouwinspanningDb | null,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">—</option>
                {bouwinspanningOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Sparse betrokken</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, sparse_betrokken: true }))}
                  className={cn(
                    'rounded-lg border px-2 py-1 text-xs font-medium',
                    sparseBetrokken ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw'
                  )}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, sparse_betrokken: false }))}
                  className={cn(
                    'rounded-lg border px-2 py-1 text-xs font-medium',
                    !sparseBetrokken ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw'
                  )}
                >
                  Nee
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Risico</label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, risico: true }))}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-sm font-medium',
                  currentRisico === true
                    ? 'bg-red-100 border-red-300 text-red-800'
                    : 'border-gray-300 text-ijsselheem-donkerblauw hover:bg-gray-50'
                )}
              >
                Ja
              </button>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, risico: false }))}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-sm font-medium',
                  currentRisico === false
                    ? 'bg-ijsselheem-lichtblauw border-ijsselheem-accentblauw text-ijsselheem-donkerblauw'
                    : 'border-gray-300 text-ijsselheem-donkerblauw hover:bg-gray-50'
                )}
              >
                Nee
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ijsselheem-donkerblauw">Toelichting</label>
            <textarea
              value={
                draft.beoordeling_toelichting ?? feature.beoordeling_toelichting ?? ''
              }
              onChange={(e) =>
                setDraft((d) => ({ ...d, beoordeling_toelichting: e.target.value || null }))
              }
              rows={2}
              className="mt-0.5 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
            />
          </div>
          {app && (
            <div className="border-t border-ijsselheem-accentblauw/30 pt-3">
              <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-2">Beveiligingsniveau (app)</h4>
              <p className="text-xs text-ijsselheem-donkerblauw/60 mb-2">
                Beantwoord de vragen zodat we het beveiligingsniveau van de app kunnen bepalen.
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-ijsselheem-donkerblauw/70 mb-1">Bevat de applicatie cliëntgegevens?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleBeveiligingChange({ ...beveiliging, clientgegevens: true })}
                      className={cn('rounded-lg border px-2 py-1 text-xs font-medium', beveiliging.clientgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBeveiligingChange({ ...beveiliging, clientgegevens: false })}
                      className={cn('rounded-lg border px-2 py-1 text-xs font-medium', !beveiliging.clientgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                    >
                      Nee
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-ijsselheem-donkerblauw/70 mb-1">Bevat de applicatie persoonsgegevens van medewerkers?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBeveiliging((b) => ({ ...b, medewerkersgegevens: true }))}
                      className={cn('rounded-lg border px-2 py-1 text-xs font-medium', beveiliging.medewerkersgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBeveiligingChange({ ...beveiliging, medewerkersgegevens: false })}
                      className={cn('rounded-lg border px-2 py-1 text-xs font-medium', !beveiliging.medewerkersgegevens ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                    >
                      Nee
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-ijsselheem-donkerblauw/70 mb-1">Is de applicatie bedoeld voor intern gebruik door een team of locatie?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBeveiliging((b) => ({ ...b, intern_team: true }))}
                      className={cn('rounded-lg border px-2 py-1 text-xs font-medium', beveiliging.intern_team ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBeveiligingChange({ ...beveiliging, intern_team: false })}
                      className={cn('rounded-lg border px-2 py-1 text-xs font-medium', !beveiliging.intern_team ? 'border-ijsselheem-donkerblauw bg-ijsselheem-donkerblauw text-white' : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw')}
                    >
                      Nee
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-2 rounded-lg bg-ijsselheem-lichtblauw/50 p-2">
                <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Bepaald niveau: </span>
                <span className="text-xs font-bold text-ijsselheem-donkerblauw">{getBeveiligingsniveauLabel(bepaalBeveiligingsniveau(beveiliging))}</span>
              </div>
            </div>
          )}
        </section>

        {app && (
            <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2">
                Impactanalyse
              </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-ijsselheem-donkerblauw/70">Urenwinst: </span>
                <span className="font-medium text-ijsselheem-donkerblauw">
                  {urenwinst != null
                    ? urenwinst.toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' uur per jaar'
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-ijsselheem-donkerblauw/70">Zorgwaarde: </span>
                <span className="font-medium text-ijsselheem-donkerblauw">
                  {currentZorgwaarde != null ? currentZorgwaarde : '—'}
                </span>
              </div>
              <div>
                <span className="text-ijsselheem-donkerblauw/70">Bouwinspanning: </span>
                <span className="font-medium text-ijsselheem-donkerblauw">
                  {currentBouwinspanning != null
                    ? getBouwinspanningLabel(currentBouwinspanning as BouwinspanningDb)
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-ijsselheem-donkerblauw/70">Risico: </span>
                <span className="font-medium text-ijsselheem-donkerblauw">
                  {currentRisico === true ? 'Ja' : currentRisico === false ? 'Nee' : '—'}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-ijsselheem-lichtblauw/30 border border-ijsselheem-accentblauw/20 p-3">
              <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">
                Eisen voor dit level
              </h4>
              {getBeveiligingsniveauEisen(app.beveiligingsniveau).length > 0 ? (
                <ul className="text-sm text-ijsselheem-donkerblauw/90 space-y-1 list-disc list-inside">
                  {getBeveiligingsniveauEisen(app.beveiligingsniveau).map((eis, i) => (
                    <li key={i}>{eis}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ijsselheem-donkerblauw/80">Stel het beveiligingsniveau in (bij beoordeling) om de eisen te zien.</p>
              )}
            </div>
            <div className="rounded-lg bg-ijsselheem-lichtblauw/30 border border-ijsselheem-accentblauw/20 p-3">
              <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">
                Samenvatting
              </h4>
              <p className="text-sm text-ijsselheem-donkerblauw">
                {impactSummary({
                  urenwinstPerJaar: urenwinst ?? 0,
                  zorgwaarde: (currentZorgwaarde != null && currentZorgwaarde >= 1 && currentZorgwaarde <= 5 ? currentZorgwaarde : null) as 1 | 2 | 3 | 4 | 5 | null,
                  bouwinspanning: (currentBouwinspanning === 'S' || currentBouwinspanning === 'M' || currentBouwinspanning === 'L' ? currentBouwinspanning : null),
                  risico: currentRisico ?? false,
                  impactType: zorgimpactType ?? undefined,
                })}
              </p>
            </div>
            <div className="rounded-lg bg-ijsselheem-lichtblauw/30 border border-ijsselheem-accentblauw/20 p-3">
              <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">
                Focus voor deze story
              </h4>
              <p className="text-sm text-ijsselheem-donkerblauw">
                {getFocusText(urenwinst, currentZorgwaarde, werkbesparing)}
              </p>
            </div>
          </section>
        )}
      </div>

        {app && (
          <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2">
              User stories of taken
            </h3>
            <p className="text-xs text-ijsselheem-donkerblauw/70">
              Uitgebreide user story: rol, handeling, acceptatiecriteria. Eenvoudige userstory: titel met een lijst van taken. Sprintplanning gebeurt op het werkbord; hier breng je alleen de inhoud in kaart.
            </p>
            <p className="text-xs font-medium text-ijsselheem-donkerblauw/80">Lijst</p>
          {storiesLoading ? (
            <p className="text-sm text-ijsselheem-donkerblauw/80">Laden…</p>
          ) : (
            <>
              {userStories.length === 0 ? (
                <p className="text-sm text-ijsselheem-donkerblauw/80 py-3 text-center border border-dashed border-ijsselheem-accentblauw/40 rounded-lg">
                  Nog geen user stories of taken. Voeg hieronder een uitgebreide user story of een eenvoudige userstory toe.
                </p>
              ) : (
              <ul className="space-y-2">
                {userStories.map((story) => (
                  <li
                    key={story.id}
                    className="rounded-lg border border-ijsselheem-accentblauw/20 bg-ijsselheem-lichtblauw/30 p-3"
                  >
                    {editingStoryId === story.id && editStoryDraft ? (
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-3">
                        <div className="space-y-2">
                          <div className="flex gap-3">
                            <label
                              className={cn(
                                'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                                editStoryDraft.weergave_type === 'user_story'
                                  ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                                  : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                              )}
                            >
                              <input
                                type="radio"
                                name={`weergave-edit-3-${story.id}`}
                                checked={editStoryDraft.weergave_type === 'user_story'}
                                onChange={() =>
                                  setEditStoryDraft((d) => (d ? { ...d, weergave_type: 'user_story' as WeergaveType } : null))
                                }
                                className="rounded sr-only"
                              />
                              Uitgebreide user story
                            </label>
                            <label
                              className={cn(
                                'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                                editStoryDraft.weergave_type === 'taaklijst'
                                  ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                                  : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                              )}
                            >
                              <input
                                type="radio"
                                name={`weergave-edit-3-${story.id}`}
                                checked={editStoryDraft.weergave_type === 'taaklijst'}
                                onChange={() =>
                                  setEditStoryDraft((d) => (d ? { ...d, weergave_type: 'taaklijst' as WeergaveType } : null))
                                }
                                className="rounded sr-only"
                              />
                              Eenvoudige userstory
                            </label>
                          </div>
                          <input
                            type="text"
                            value={editStoryDraft.titel}
                            onChange={(e) =>
                              setEditStoryDraft((d) => (d ? { ...d, titel: e.target.value } : null))
                            }
                            placeholder="Titel"
                            className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm"
                          />
                          {editStoryDraft.weergave_type === 'taaklijst' ? (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-ijsselheem-donkerblauw/70">Taken</p>
                              {((editStoryDraft.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)).map((line, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-sm text-ijsselheem-donkerblauw flex-1 min-w-0">{line}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const lines = (editStoryDraft!.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
                                      setEditStoryDraft((d) => (d ? { ...d, beschrijving: lines.filter((_, idx) => idx !== i).join('\n') || null } : null))
                                    }}
                                    className="text-xs text-red-600 hover:underline shrink-0"
                                  >
                                    Verwijderen
                                  </button>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newLooseTaskInput}
                                  onChange={(e) => setNewLooseTaskInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      const t = newLooseTaskInput.trim()
                                      if (t) {
                                        setEditStoryDraft((d) => (d ? { ...d, beschrijving: (d.beschrijving ?? '').trim() ? (d.beschrijving ?? '').trim() + '\n' + t : t } : null))
                                        setNewLooseTaskInput('')
                                      }
                                    }
                                  }}
                                  placeholder="Nieuwe taak toevoegen"
                                  className="flex-1 rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const t = newLooseTaskInput.trim()
                                    if (t) {
                                      setEditStoryDraft((d) => (d ? { ...d, beschrijving: (d.beschrijving ?? '').trim() ? (d.beschrijving ?? '').trim() + '\n' + t : t } : null))
                                      setNewLooseTaskInput('')
                                    }
                                  }}
                                  disabled={!newLooseTaskInput.trim()}
                                  className="rounded border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/50 px-2 py-1 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50 disabled:bg-gray-100"
                                >
                                  Taak toevoegen
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <textarea
                                value={editStoryDraft.beschrijving ?? ''}
                                onChange={(e) =>
                                  setEditStoryDraft((d) => (d ? { ...d, beschrijving: e.target.value || null } : null))
                                }
                                placeholder="Beschrijving (optioneel)"
                                rows={2}
                                className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm"
                              />
                              <textarea
                                value={editStoryDraft.acceptatiecriteria ?? ''}
                                onChange={(e) =>
                                  setEditStoryDraft((d) => (d ? { ...d, acceptatiecriteria: e.target.value || null } : null))
                                }
                                placeholder={getAcceptatiecriteriaPlaceholder(urenwinst, med)}
                                rows={2}
                                className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm"
                              />
                            </>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveStory(story.id)}
                              className="rounded-lg border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/50 px-2 py-1 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
                            >
                              Opslaan
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStoryId(null)
                                setEditStoryDraft(null)
                                setNewLooseTaskInput('')
                              }}
                              className="text-sm text-ijsselheem-donkerblauw/70 hover:underline"
                            >
                              Annuleren
                            </button>
                          </div>
                        </div>
                        {editStoryDraft && editStoryDraft.weergave_type === 'user_story' && (
                          <div className="sm:w-48 shrink-0">
                            <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">Kwaliteitscheck</h4>
                            <ul className="space-y-1 text-xs text-ijsselheem-donkerblauw">
                              {[
                                { label: 'Rol benoemd', ok: getStoryQualityChecklist(editStoryDraft.titel, editStoryDraft.beschrijving, editStoryDraft.acceptatiecriteria).rol },
                                { label: 'Eén actie', ok: getStoryQualityChecklist(editStoryDraft.titel, editStoryDraft.beschrijving, editStoryDraft.acceptatiecriteria).eenActie },
                                { label: 'Meetbaar', ok: getStoryQualityChecklist(editStoryDraft.titel, editStoryDraft.beschrijving, editStoryDraft.acceptatiecriteria).meetbaar },
                                { label: 'Eén functionaliteit', ok: getStoryQualityChecklist(editStoryDraft.titel, editStoryDraft.beschrijving, editStoryDraft.acceptatiecriteria).eenFunctionaliteit },
                              ].map(({ label, ok }) => (
                                <li key={label} className="flex items-center gap-1.5">
                                  {ok ? <span className="text-green-600">✓</span> : <span className="text-ijsselheem-donkerblauw/40">○</span>}
                                  <span>{label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {editStoryDraft && editStoryDraft.weergave_type === 'taaklijst' && (
                          <div className="sm:w-48 shrink-0">
                            <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-1">Kwaliteitscheck</h4>
                            <ul className="space-y-1 text-xs text-ijsselheem-donkerblauw">
                              <li className="flex items-center gap-1.5">
                                {hasMinOneTask(editStoryDraft.beschrijving) ? <span className="text-green-600">✓</span> : <span className="text-ijsselheem-donkerblauw/40">○</span>}
                                <span>Minimaal 1 taak aanwezig</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ijsselheem-donkerblauw text-sm">
                            {story.titel}
                          </p>
                          {(story.weergave_type ?? 'taaklijst') === 'taaklijst' ? (
                            story.beschrijving ? (
                              <ul className="mt-0.5 list-disc list-inside text-xs text-ijsselheem-donkerblauw/80 space-y-0.5">
                                {(story.beschrijving || '')
                                  .split(/\r?\n/)
                                  .map((line) => line.trim())
                                  .filter(Boolean)
                                  .map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                              </ul>
                            ) : null
                          ) : (
                            <>
                              {story.beschrijving && (
                                <p className="mt-0.5 text-xs text-ijsselheem-donkerblauw/80 whitespace-pre-wrap">
                                  {story.beschrijving}
                                </p>
                              )}
                              {story.acceptatiecriteria && (
                                <p className="mt-0.5 text-xs text-ijsselheem-donkerblauw/70 whitespace-pre-wrap">
                                  Acceptatie: {story.acceptatiecriteria}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStoryId(story.id)
                              setEditStoryDraft({
                                titel: story.titel,
                                beschrijving: story.beschrijving ?? null,
                                acceptatiecriteria: story.acceptatiecriteria ?? null,
                                weergave_type: story.weergave_type ?? 'taaklijst',
                              })
                            }}
                            className="text-xs text-ijsselheem-donkerblauw/80 hover:underline"
                          >
                            Bewerken
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStory(story.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Verwijderen
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              )}
              {currentBouwinspanning === 'L' && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Deze feature is groot. Splits dit op in meerdere stories.
                </div>
              )}
              <p className="text-xs font-medium text-ijsselheem-donkerblauw/80 mt-2">Nieuwe toevoegen</p>
              {getZorgimpactHints(zorgimpactType).length > 0 && (
                <div className="rounded-lg border border-ijsselheem-accentblauw/20 bg-ijsselheem-lichtblauw/30 p-3">
                  <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-2">
                    Focus voor deze story (zorgimpact)
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-ijsselheem-donkerblauw">
                    {getZorgimpactHints(zorgimpactType).map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 border-t border-ijsselheem-accentblauw/30 pt-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ijsselheem-donkerblauw">
                    Nieuwe toevoegen
                  </label>
                  <div className="flex gap-3">
                    <label
                      className={cn(
                        'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                        (addStoryForm.weergave_type ?? 'taaklijst') === 'user_story'
                          ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                          : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                      )}
                    >
                      <input
                        type="radio"
                        name="weergave-add-3"
                        checked={(addStoryForm.weergave_type ?? 'taaklijst') === 'user_story'}
                        onChange={() => setAddStoryForm((f) => ({ ...f, weergave_type: 'user_story' }))}
                        className="rounded sr-only"
                      />
                      Uitgebreide user story
                    </label>
                    <label
                      className={cn(
                        'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-1.5 cursor-pointer transition-colors',
                        (addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst'
                          ? 'bg-ijsselheem-lichtblauw/60 border-ijsselheem-accentblauw'
                          : 'bg-white border-ijsselheem-accentblauw/40 hover:bg-ijsselheem-lichtblauw/30'
                      )}
                    >
                      <input
                        type="radio"
                        name="weergave-add-3"
                        checked={(addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst'}
                        onChange={() => setAddStoryForm((f) => ({ ...f, weergave_type: 'taaklijst', titel: '', beschrijving: null }))}
                        className="rounded sr-only"
                      />
                      Eenvoudige userstory
                    </label>
                  </div>
                  <input
                    type="text"
                    value={addStoryForm.titel}
                    onChange={(e) => setAddStoryForm((f) => ({ ...f, titel: e.target.value }))}
                    placeholder="Titel (verplicht)"
                    className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                  />
                  {(addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst' ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-ijsselheem-donkerblauw/70">Taken</p>
                      {((addStoryForm.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)).map((line, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-sm text-ijsselheem-donkerblauw flex-1 min-w-0">{line}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const lines = (addStoryForm.beschrijving ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
                              setAddStoryForm((f) => ({ ...f, beschrijving: lines.filter((_, idx) => idx !== i).join('\n') || null }))
                            }}
                            className="text-xs text-red-600 hover:underline shrink-0"
                          >
                            Verwijderen
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newLooseTaskInput}
                          onChange={(e) => setNewLooseTaskInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const t = newLooseTaskInput.trim()
                              if (t) {
                                setAddStoryForm((f) => ({ ...f, beschrijving: (f.beschrijving ?? '').trim() ? (f.beschrijving ?? '').trim() + '\n' + t : t }))
                                setNewLooseTaskInput('')
                              }
                            }
                          }}
                          placeholder="Nieuwe taak toevoegen"
                          className="flex-1 rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const t = newLooseTaskInput.trim()
                            if (t) {
                              setAddStoryForm((f) => ({ ...f, beschrijving: (f.beschrijving ?? '').trim() ? (f.beschrijving ?? '').trim() + '\n' + t : t }))
                              setNewLooseTaskInput('')
                            }
                          }}
                          disabled={!newLooseTaskInput.trim()}
                          className="rounded-lg border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/50 px-2 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50 disabled:bg-gray-100"
                        >
                          Taak toevoegen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={addStoryForm.beschrijving ?? ''}
                        onChange={(e) => setAddStoryForm((f) => ({ ...f, beschrijving: e.target.value || null }))}
                        placeholder="Beschrijving (optioneel)"
                        rows={2}
                        className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                      />
                      <textarea
                        value={addStoryForm.acceptatiecriteria ?? ''}
                        onChange={(e) =>
                          setAddStoryForm((f) => ({ ...f, acceptatiecriteria: e.target.value || null }))
                        }
                        placeholder={getAcceptatiecriteriaPlaceholder(urenwinst, med)}
                        rows={2}
                        className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleAddStory}
                    disabled={addingStory || !addStoryForm.titel.trim()}
                    className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw bg-ijsselheem-lichtblauw/50 px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50 disabled:bg-gray-100"
                  >
                    {addingStory ? 'Toevoegen…' : (addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst' ? 'Eenvoudige userstory toevoegen' : 'Toevoegen'}
                  </button>
                </div>
                {(addStoryForm.weergave_type ?? 'taaklijst') === 'user_story' && (
                  <div className="lg:w-56 shrink-0">
                    <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-2">
                      Kwaliteitscheck
                    </h4>
                    <ul className="space-y-1.5 text-sm text-ijsselheem-donkerblauw">
                      {(
                        [
                          { label: 'Rol concreet benoemd', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).rol },
                          { label: 'Eén duidelijke actie', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).eenActie },
                          { label: 'Meetbaar resultaat', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).meetbaar },
                          { label: 'Max. één primaire functionaliteit', ok: getStoryQualityChecklist(addStoryForm.titel, addStoryForm.beschrijving, addStoryForm.acceptatiecriteria).eenFunctionaliteit },
                        ] as const
                      ).map(({ label, ok }) => (
                        <li key={label} className="flex items-center gap-2">
                          {ok ? (
                            <span className="text-green-600" aria-hidden>✓</span>
                          ) : (
                            <span className="text-ijsselheem-donkerblauw/40" aria-hidden>○</span>
                          )}
                          <span className={ok ? 'text-ijsselheem-donkerblauw' : 'text-ijsselheem-donkerblauw/70'}>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(addStoryForm.weergave_type ?? 'taaklijst') === 'taaklijst' && (
                  <div className="lg:w-56 shrink-0">
                    <h4 className="text-xs font-semibold text-ijsselheem-donkerblauw/80 mb-2">Kwaliteitscheck</h4>
                    <ul className="space-y-1.5 text-sm text-ijsselheem-donkerblauw">
                      <li className="flex items-center gap-2">
                        {hasMinOneTask(addStoryForm.beschrijving) ? (
                          <span className="text-green-600" aria-hidden>✓</span>
                        ) : (
                          <span className="text-ijsselheem-donkerblauw/40" aria-hidden>○</span>
                        )}
                        <span>Minimaal 1 taak aanwezig</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
          </section>
        )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Opslaan…' : 'Opslaan'}
        </button>
        <button
          type="button"
          onClick={handleResetBeoordeling}
          disabled={saving || !feature}
          className="rounded-ijsselheem-button border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Reset beoordeling
        </button>
        <button
          type="button"
          onClick={() => navigate('/backlog')}
          className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
        >
          Annuleren
        </button>
      </div>
      </Fragment>
      ) }
    </div>
  )
}

