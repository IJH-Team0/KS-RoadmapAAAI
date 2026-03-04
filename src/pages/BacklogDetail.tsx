import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchAppById, updateApp } from '@/lib/apps'
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
import type { UserStory, UserStoryInsert } from '@/lib/userStories'
import {
  urenwinstPerJaar,
  werkbesparingScore,
  prioriteitsscore as calcPrioriteitsscore,
} from '@/lib/prioritering'
import type { App, AppStatusDb, BouwinspanningDb } from '@/types/app'
import type { Feature, FeatureUpdate } from '@/types/roadmap'
import {
  APP_STATUS_OPTIONS,
  BOUWINSPANNING_OPTIONS,
  ZORGIMPACT_TYPE_OPTIONS,
  ZORGWAARDE_OPTIONS,
  getStatusLabel,
  getBouwinspanningLabel,
  BASISFEATURE_NAAM,
} from '@/types/app'
import { AppDetail } from '@/components/AppDetail'
import { cn } from '@/lib/utils'
import {
  getFocusText,
  getStoryTemplate,
  isHighImpact,
  getZorgimpactHints,
  getAcceptatiecriteriaPlaceholder,
  getStoryQualityChecklist,
} from '@/lib/storyFocus'

export function BacklogDetail() {
  const params = useParams<{ id?: string; featureId?: string }>()
  const featureId = params.featureId
  const legacyId = params.id
  const navigate = useNavigate()

  const [app, setApp] = useState<App | null>(null)
  const [feature, setFeature] = useState<Feature | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Feature>>({})
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)
  const [addStoryForm, setAddStoryForm] = useState<UserStoryInsert>({ titel: '' })
  const [addingStory, setAddingStory] = useState(false)
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null)
  const [editStoryDraft, setEditStoryDraft] = useState<Pick<UserStory, 'titel' | 'beschrijving' | 'acceptatiecriteria'> | null>(null)

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
        .finally(() => setLoading(false))
      return
    }
    if (legacyId) {
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

  const handleAddStory = async () => {
    if (!app?.id || !addStoryForm.titel.trim()) return
    setAddingStory(true)
    setError(null)
    try {
      const created = await createUserStory(app.id, {
        titel: addStoryForm.titel.trim(),
        beschrijving: addStoryForm.beschrijving?.trim() || null,
        acceptatiecriteria: addStoryForm.acceptatiecriteria?.trim() || null,
      })
      const newStories = [...userStories, created].sort((a, b) => a.volgorde - b.volgorde || a.titel.localeCompare(b.titel))
      setUserStories(newStories)
      const high = feature ? isHighImpact(draft.zorgwaarde ?? feature.zorgwaarde, draft.risico ?? feature.risico, draft.zorgimpact_type ?? feature.zorgimpact_type) : false
      const t = getStoryTemplate(high, draft.zorgimpact_type ?? feature?.zorgimpact_type)
      setAddStoryForm({ titel: t.titel, beschrijving: t.beschrijving || null, acceptatiecriteria: null })
      if (feature?.planning_status === 'stories_maken' && newStories.length >= 1) {
        const updatedFeature = await updateFeature(feature.id, {
          planning_status: 'in_voorbereiding',
        })
        setFeature(updatedFeature)
        setDraft(updatedFeature)
        await maybeSyncAppStatusToFeaturePlanningStatus(feature.app_id, 'in_voorbereiding')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'User story toevoegen mislukt')
    } finally {
      setAddingStory(false)
    }
  }

  const handleSaveStory = async (id: string) => {
    if (!editStoryDraft) return
    setError(null)
    try {
      const updated = await updateUserStory(id, editStoryDraft)
      setUserStories((prev) =>
        prev.map((s) => (s.id === id ? updated : s)).sort((a, b) => a.volgorde - b.volgorde || a.titel.localeCompare(b.titel))
      )
      setEditingStoryId(null)
      setEditStoryDraft(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bewerken mislukt')
    }
  }

  const handleDeleteStory = async (id: string) => {
    if (!window.confirm('Deze user story verwijderen?')) return
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

  const prioriteitsscore = calcPrioriteitsscore(
    draft.zorgwaarde ?? feature?.zorgwaarde,
    urenwinst,
    (draft.bouwinspanning ?? feature?.bouwinspanning) as BouwinspanningDb | null,
    draft.risico ?? feature?.risico
  )
  const werkbesparing = werkbesparingScore(urenwinst)

  const currentZorgwaarde = feature ? (draft.zorgwaarde ?? feature.zorgwaarde) : null
  const currentRisico = feature ? (draft.risico ?? feature.risico) : null
  const currentBouwinspanning = feature ? (draft.bouwinspanning ?? feature.bouwinspanning) : null
  const zorgimpactType = feature ? (draft.zorgimpact_type ?? feature.zorgimpact_type) : null

  useEffect(() => {
    if (!feature || addStoryForm.titel.trim() !== '') return
    const high = isHighImpact(currentZorgwaarde, currentRisico, zorgimpactType)
    const t = getStoryTemplate(high, zorgimpactType)
    setAddStoryForm({
      titel: t.titel,
      beschrijving: t.beschrijving || null,
      acceptatiecriteria: null,
    })
  }, [feature?.id, addStoryForm.titel, currentZorgwaarde, currentRisico, zorgimpactType])

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
      ...(isWensenlijst && isFullyFilled ? { planning_status: 'stories_maken' as AppStatusDb } : {}),
    }
    try {
      await updateFeature(feature.id, update)
      if (app && app.status === 'wensenlijst' && isFullyFilled) {
        await updateApp(app.id, { status: 'stories_maken' as AppStatusDb })
      }
      navigate('/backlog')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt')
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
        <AppDetail
          app={app}
          onSaved={(updated) => setApp(updated)}
          onCancel={() => navigate('/backlog')}
        />
        <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-3">
          <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2">
            User stories
          </h3>
          <p className="text-xs text-ijsselheem-donkerblauw/70">
            Voeg hier user stories toe voor dit programma.
          </p>
          {storiesLoading ? (
            <p className="text-sm text-ijsselheem-donkerblauw/80">Laden…</p>
          ) : (
            <>
              <ul className="space-y-2">
                {userStories.map((story) => (
                  <li
                    key={story.id}
                    className="rounded-lg border border-ijsselheem-accentblauw/20 bg-ijsselheem-lichtblauw/30 p-3"
                  >
                    {editingStoryId === story.id && editStoryDraft ? (
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-3">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editStoryDraft.titel}
                            onChange={(e) =>
                              setEditStoryDraft((d) => (d ? { ...d, titel: e.target.value } : null))
                            }
                            placeholder="Titel"
                            className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm"
                          />
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
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveStory(story.id)}
                            className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline"
                          >
                            Opslaan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStoryId(null)
                              setEditStoryDraft(null)
                            }}
                            className="text-sm text-ijsselheem-donkerblauw/70 hover:underline"
                          >
                            Annuleren
                          </button>
                        </div>
                        </div>
                        {editStoryDraft && (
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
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ijsselheem-donkerblauw text-sm">
                            {story.titel}
                          </p>
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
              <div className="border-t border-ijsselheem-accentblauw/30 pt-3 space-y-2">
                <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70">
                  Nieuwe user story
                </label>
                <input
                  type="text"
                  value={addStoryForm.titel}
                  onChange={(e) => setAddStoryForm((f) => ({ ...f, titel: e.target.value }))}
                  placeholder="Titel (verplicht)"
                  className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                />
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
                <button
                  type="button"
                  onClick={handleAddStory}
                  disabled={addingStory || !addStoryForm.titel.trim()}
                  className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50"
                >
                  {addingStory ? 'Toevoegen…' : 'User story toevoegen'}
                </button>
              </div>
            </>
          )}
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">
          Beoordelen: {app?.naam ?? '—'} · {feature.naam}
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

      {/* Blok 1 (100%): alle bekende info – context, werkbelasting, scores, status */}
      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {app && (
            <>
              <div>
                <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Programma</span>
                <p className="text-sm font-medium text-ijsselheem-donkerblauw">{app.naam}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Domein</span>
                <p className="text-sm text-ijsselheem-donkerblauw">{app.domein ?? '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Status programma</span>
                <p className="text-sm text-ijsselheem-donkerblauw">
                  {app ? getStatusLabel(app.status as AppStatusDb) : '—'}
                </p>
              </div>
            </>
          )}
          <div>
            <span className="text-xs font-medium text-ijsselheem-donkerblauw/70">Feature</span>
            <p className="text-sm font-medium text-ijsselheem-donkerblauw">
              {feature.naam}
              {feature.naam === BASISFEATURE_NAAM && (
                <span className="ml-1 text-ijsselheem-donkerblauw/70 font-normal">(eerste app)</span>
              )}
            </p>
          </div>
        </div>
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
                    <span className="text-ijsselheem-donkerblauw/70">Minuten per medewerker per week: </span>
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
            <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70 mb-1">Frequentie (per week)</label>
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
            <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70 mb-1">
              Minuten per medewerker per week
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
            <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70 mb-1">Aantal medewerkers</label>
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
              <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70">Status programma wijzigen</label>
              <select
                value={app.status}
                onChange={async (e) => {
                  const status = e.target.value as AppStatusDb
                  try {
                    const updated = await updateApp(app.id, { status })
                    setApp(updated)
                  } catch (_) {}
                }}
                className="mt-1 w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
              >
                {APP_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {getStatusLabel(o.value)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="min-w-[12rem]">
            <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70">Status feature</label>
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
              {APP_STATUS_OPTIONS.filter((o) => o.value !== 'afgewezen').map((o) => (
                <option key={o.value} value={o.value}>
                  {getStatusLabel(o.value)}
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
            <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70 mb-1">Zorgimpact type</label>
            <select
              value={draft.zorgimpact_type ?? feature.zorgimpact_type ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, zorgimpact_type: e.target.value || null }))
              }
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">— Kies</option>
              {ZORGIMPACT_TYPE_OPTIONS.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70">
              Zorgwaarde (1–5)
            </label>
            <p className="text-xs text-ijsselheem-donkerblauw/60 mt-0.5">
              Hoe belangrijk is dit idee voor de kwaliteit van zorg of het welzijn van cliënten? 1 = weinig impact, 5 = zeer grote impact.
            </p>
            <div className="flex gap-2 mt-1">
              {ZORGWAARDE_OPTIONS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, zorgwaarde: z }))}
                  className={cn(
                    'w-9 h-9 rounded-lg border text-sm font-medium transition',
                    currentZorgwaarde === z
                      ? 'bg-ijsselheem-donkerblauw text-white border-ijsselheem-donkerblauw'
                      : 'border-ijsselheem-accentblauw/50 text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw'
                  )}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70">Bouwinspanning</label>
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
              {BOUWINSPANNING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70">Risico</label>
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
            <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70">Toelichting</label>
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
        </section>

        {app && (
          <>
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
                Focus voor deze story
              </h4>
              <p className="text-sm text-ijsselheem-donkerblauw">
                {getFocusText(urenwinst, currentZorgwaarde, werkbesparing)}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw border-b border-ijsselheem-accentblauw/30 pb-2">
              User stories
            </h3>
            <p className="text-xs text-ijsselheem-donkerblauw/70">
              Voeg hier user stories toe voor dit programma.
            </p>
          {storiesLoading ? (
            <p className="text-sm text-ijsselheem-donkerblauw/80">Laden…</p>
          ) : (
            <>
              <ul className="space-y-2">
                {userStories.map((story) => (
                  <li
                    key={story.id}
                    className="rounded-lg border border-ijsselheem-accentblauw/20 bg-ijsselheem-lichtblauw/30 p-3"
                  >
                    {editingStoryId === story.id && editStoryDraft ? (
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-3">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editStoryDraft.titel}
                            onChange={(e) =>
                              setEditStoryDraft((d) => (d ? { ...d, titel: e.target.value } : null))
                            }
                            placeholder="Titel"
                            className="w-full rounded border border-ijsselheem-accentblauw/50 px-2 py-1 text-sm"
                          />
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
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveStory(story.id)}
                            className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline"
                          >
                            Opslaan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStoryId(null)
                              setEditStoryDraft(null)
                            }}
                            className="text-sm text-ijsselheem-donkerblauw/70 hover:underline"
                          >
                            Annuleren
                          </button>
                        </div>
                        </div>
                        {editStoryDraft && (
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
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ijsselheem-donkerblauw text-sm">
                            {story.titel}
                          </p>
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
              {currentBouwinspanning === 'L' && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Deze feature is groot. Splits dit op in meerdere stories.
                </div>
              )}
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
                  <label className="block text-xs font-medium text-ijsselheem-donkerblauw/70">
                    Nieuwe user story
                  </label>
                  <input
                    type="text"
                    value={addStoryForm.titel}
                    onChange={(e) => setAddStoryForm((f) => ({ ...f, titel: e.target.value }))}
                    placeholder="Titel (verplicht)"
                    className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                  />
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
                  <button
                    type="button"
                    onClick={handleAddStory}
                    disabled={addingStory || !addStoryForm.titel.trim()}
                    className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50"
                  >
                    {addingStory ? 'Toevoegen…' : 'User story toevoegen'}
                  </button>
                </div>
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
              </div>
            </>
          )}
          </section>
          </>
        )}
      </div>

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
          onClick={() => navigate('/backlog')}
          className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
        >
          Annuleren
        </button>
      </div>
    </div>
  )
}
