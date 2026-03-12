import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { createApp } from '@/lib/apps'
import { urenwinstPerJaar } from '@/lib/prioritering'
import { bepaalBeveiligingsniveau } from '@/lib/beveiligingsniveau'
import { fetchWensenBak, updateWensBakOpgenomen, type WensInBak } from '@/lib/wensenBak'
import { usePrioriteitsscoreConfig } from '@/hooks/usePrioriteitsscoreConfig'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/contexts/AuthContext'

type BeheerTab = 'gebruikers' | 'keuzelijsten' | 'prioriteitsscore' | 'wensenbak'

interface UserProfileRow {
  id: string
  email: string
  display_name: string
  role: UserRole
  created_at: string
}

interface ZorgimpactRow {
  id: string
  value: string
  label: string
  prioriteit_bonus: number
}

const KEUZELIJST_CATEGORIEEN: { key: string; label: string; enumOnly?: boolean }[] = [
  { key: 'app_status', label: 'Status programma', enumOnly: true },
  { key: 'domein', label: 'Domein' },
  { key: 'platform', label: 'Platform' },
  { key: 'complexiteit', label: 'Complexiteit' },
  { key: 'zorgimpact_type', label: 'Zorgimpact type' },
  { key: 'bouwinspanning', label: 'Bouwinspanning' },
  { key: 'zorgwaarde', label: 'Zorgwaarde' },
  { key: 'app_icon', label: 'App-icoon' },
]

export function Beheer() {
  const { role } = useAuth()
  const [activeTab, setActiveTab] = useState<BeheerTab>('gebruikers')

  if (role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Beheer</h2>

      <nav className="flex gap-2 border-b border-ijsselheem-accentblauw/30">
        {(
          [
            { id: 'gebruikers' as const, label: 'Gebruikers' },
            { id: 'keuzelijsten' as const, label: 'Keuzelijsten' },
            { id: 'prioriteitsscore' as const, label: 'Prioriteitsscore' },
            { id: 'wensenbak' as const, label: 'Wensen bak' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition',
              activeTab === id
                ? 'border-ijsselheem-donkerblauw text-ijsselheem-donkerblauw bg-white'
                : 'border-transparent text-ijsselheem-donkerblauw/70 hover:bg-ijsselheem-lichtblauw/50'
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'gebruikers' && <BeheerGebruikers />}
      {activeTab === 'keuzelijsten' && <BeheerKeuzelijsten categorien={KEUZELIJST_CATEGORIEEN} />}
      {activeTab === 'prioriteitsscore' && <BeheerPrioriteitsscore />}
      {activeTab === 'wensenbak' && <BeheerWensenBak />}
    </div>
  )
}

function BeheerGebruikers() {
  const [users, setUsers] = useState<UserProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [roleById, setRoleById] = useState<Record<string, UserRole>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('user_profiles')
      .select('id, email, display_name, role, created_at')
      .order('email')
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
          return
        }
        setUsers((data as UserProfileRow[]) ?? [])
        const map: Record<string, UserRole> = {}
        for (const row of data ?? []) {
          map[row.id] = row.role as UserRole
        }
        setRoleById(map)
      })
      .then(
        () => setLoading(false),
        () => setLoading(false)
      )
  }, [])

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setRoleById((prev) => ({ ...prev, [userId]: newRole }))
  }

  const handleSaveRole = async (userId: string) => {
    const newRole = roleById[userId]
    const user = users.find((u) => u.id === userId)
    if (!user || newRole === user.role) return
    setError(null)
    setSavingId(userId)
    const { error: err } = await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId)
    if (err) setError(err.message)
    else setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    setSavingId(null)
  }

  if (loading) return <p className="text-ijsselheem-donkerblauw">Laden…</p>
  if (error) return <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{error}</p>

  return (
    <section className="space-y-4">
      <p className="text-sm text-ijsselheem-donkerblauw/90">
        Overzicht van alle gebruikers. Wijzig de rol (gebruiker of admin) en klik op Opslaan om te bevestigen.
      </p>
      <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ijsselheem-lichtblauw/50 text-left">
              <th className="p-3 font-semibold text-ijsselheem-donkerblauw">E-mail</th>
              <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Weergavenaam</th>
              <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Rol</th>
              <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Aanmaakdatum</th>
              <th className="p-3 font-semibold text-ijsselheem-donkerblauw w-32">Acties</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-ijsselheem-accentblauw/20">
                <td className="p-3 text-ijsselheem-donkerblauw">{u.email}</td>
                <td className="p-3 text-ijsselheem-donkerblauw">{u.display_name}</td>
                <td className="p-3">
                  <select
                    value={roleById[u.id] ?? u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                    className="rounded border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="gebruiker">Gebruiker</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-3 text-ijsselheem-donkerblauw/80">{u.created_at?.slice(0, 10)}</td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => handleSaveRole(u.id)}
                    disabled={savingId === u.id || (roleById[u.id] ?? u.role) === u.role}
                    className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline disabled:opacity-50"
                  >
                    {savingId === u.id ? 'Opslaan…' : 'Opslaan'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

interface RefOptionRow {
  id: string
  value: string
  label: string
  sort_order: number
  prioriteit_bonus?: number
}

function BeheerKeuzelijsten({
  categorien,
}: {
  categorien: { key: string; label: string; enumOnly?: boolean }[]
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categorien[0]?.key ?? '')
  const [rows, setRows] = useState<RefOptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Record<string, { label: string; sort_order: number; prioriteit_bonus?: number }>>({})
  const [addForm, setAddForm] = useState<{ value: string; label: string }>({ value: '', label: '' })
  const [showAdd, setShowAdd] = useState(false)

  const isEnumOnly = categorien.find((c) => c.key === selectedCategory)?.enumOnly ?? false

  useEffect(() => {
    if (!selectedCategory) return
    setLoading(true)
    supabase
      .from('reference_options')
      .select('id, value, label, sort_order, prioriteit_bonus')
      .eq('category', selectedCategory)
      .order('sort_order')
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
          return
        }
        setRows((data as RefOptionRow[]) ?? [])
        const map: Record<string, { label: string; sort_order: number; prioriteit_bonus?: number }> = {}
        for (const r of data ?? []) {
          map[r.id] = { label: r.label, sort_order: r.sort_order, prioriteit_bonus: r.prioriteit_bonus ?? 0 }
        }
        setEditing(map)
      })
      .then(
        () => setLoading(false),
        () => setLoading(false)
      )
    setShowAdd(false)
    setAddForm({ value: '', label: '' })
  }, [selectedCategory])

  const handleSaveRow = async (row: RefOptionRow) => {
    const e = editing[row.id]
    if (!e) return
    setError(null)
    setSaving(true)
    const payload: { label?: string; sort_order?: number; prioriteit_bonus?: number } = {
      label: e.label,
      sort_order: e.sort_order,
    }
    if (selectedCategory === 'zorgimpact_type' && e.prioriteit_bonus !== undefined) {
      payload.prioriteit_bonus = e.prioriteit_bonus
    }
    const { error: err } = await supabase.from('reference_options').update(payload).eq('id', row.id)
    if (err) setError(err.message)
    else setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...payload } : r)))
    setSaving(false)
  }

  const handleAdd = async () => {
    if (!addForm.value.trim() || !addForm.label.trim() || isEnumOnly) return
    setError(null)
    setSaving(true)
    const sortOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order), 0) + 1 : 0
    const { error: err } = await supabase.from('reference_options').insert({
      category: selectedCategory,
      value: addForm.value.trim(),
      label: addForm.label.trim(),
      sort_order: sortOrder,
      prioriteit_bonus: selectedCategory === 'zorgimpact_type' ? 0 : undefined,
    })
    if (err) setError(err.message)
    else {
      const { data } = await supabase
        .from('reference_options')
        .select('id, value, label, sort_order, prioriteit_bonus')
        .eq('category', selectedCategory)
        .order('sort_order')
      setRows((data as RefOptionRow[]) ?? [])
      const map: Record<string, { label: string; sort_order: number; prioriteit_bonus?: number }> = {}
      for (const r of data ?? []) {
        map[r.id] = { label: r.label, sort_order: r.sort_order, prioriteit_bonus: r.prioriteit_bonus ?? 0 }
      }
      setEditing(map)
      setAddForm({ value: '', label: '' })
      setShowAdd(false)
    }
    setSaving(false)
  }

  const handleDelete = async (row: RefOptionRow) => {
    if (isEnumOnly) return
    if (!window.confirm(`Optie "${row.label}" verwijderen?`)) return
    setError(null)
    setSaving(true)
    const { error: err } = await supabase.from('reference_options').delete().eq('id', row.id)
    if (err) setError(err.message)
    else setRows((prev) => prev.filter((r) => r.id !== row.id))
    setSaving(false)
  }

  const setEdit = (id: string, field: 'label' | 'sort_order' | 'prioriteit_bonus', value: string | number) => {
    setEditing((prev) => {
      const cur = prev[id] ?? { label: '', sort_order: 0 }
      if (field === 'label') return { ...prev, [id]: { ...cur, label: value as string } }
      if (field === 'sort_order') return { ...prev, [id]: { ...cur, sort_order: Number(value) || 0 } }
      return { ...prev, [id]: { ...cur, prioriteit_bonus: Number(value) || 0 } }
    })
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-ijsselheem-donkerblauw/90">
        Beheer de keuzelijsten die in de app worden gebruikt. Selecteer een categorie en pas waarden, labels en volgorde aan.
      </p>
      <div className="flex flex-wrap gap-4 items-start">
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium text-ijsselheem-donkerblauw mb-2">Categorie</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
          >
            {categorien.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isEnumOnly && (
        <p className="text-xs text-ijsselheem-donkerblauw/80">
          Alleen label en volgorde zijn bewerkbaar; waarden komen overeen met het systeem. Nieuwe status toevoegen kan via een migratie.
        </p>
      )}
      {error && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {loading ? (
        <p className="text-ijsselheem-donkerblauw">Laden…</p>
      ) : (
        <>
          <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ijsselheem-lichtblauw/50 text-left">
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Waarde</th>
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Label</th>
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw w-24">Volgorde</th>
                  {selectedCategory === 'zorgimpact_type' && (
                    <th className="p-3 font-semibold text-ijsselheem-donkerblauw w-28">Bonus</th>
                  )}
                  <th className="p-3 font-semibold text-ijsselheem-donkerblauw w-32">Acties</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-ijsselheem-accentblauw/20">
                    <td className="p-3 text-ijsselheem-donkerblauw/80">{row.value}</td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={editing[row.id]?.label ?? row.label}
                        onChange={(e) => setEdit(row.id, 'label', e.target.value)}
                        className="w-full rounded border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        value={editing[row.id]?.sort_order ?? row.sort_order}
                        onChange={(e) => setEdit(row.id, 'sort_order', e.target.value)}
                        className="w-16 rounded border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                      />
                    </td>
                    {selectedCategory === 'zorgimpact_type' && (
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          value={editing[row.id]?.prioriteit_bonus ?? row.prioriteit_bonus ?? 0}
                          onChange={(e) => setEdit(row.id, 'prioriteit_bonus', e.target.value)}
                          className="w-20 rounded border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                        />
                      </td>
                    )}
                    <td className="p-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveRow(row)}
                        disabled={saving}
                        className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline disabled:opacity-50"
                      >
                        Opslaan
                      </button>
                      {!isEnumOnly && (
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          disabled={saving}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        >
                          Verwijderen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isEnumOnly && (
            <div className="space-y-2">
              {!showAdd ? (
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline"
                >
                  + Optie toevoegen
                </button>
              ) : (
                <div className="flex flex-wrap gap-2 items-end p-3 rounded-lg bg-ijsselheem-lichtblauw/30">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-ijsselheem-donkerblauw">Waarde</span>
                    <input
                      type="text"
                      value={addForm.value}
                      onChange={(e) => setAddForm((p) => ({ ...p, value: e.target.value }))}
                      className="rounded border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm w-48"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-ijsselheem-donkerblauw">Label</span>
                    <input
                      type="text"
                      value={addForm.label}
                      onChange={(e) => setAddForm((p) => ({ ...p, label: e.target.value }))}
                      className="rounded border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm w-48"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={saving || !addForm.value.trim() || !addForm.label.trim()}
                    className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Toevoegen
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-ijsselheem-donkerblauw/80 hover:underline">
                    Annuleren
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function BeheerPrioriteitsscore() {
  const { config, loading: configLoading, error: configError } = usePrioriteitsscoreConfig()
  const [zorgimpactRows, setZorgimpactRows] = useState<ZorgimpactRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [riskPenalty, setRiskPenalty] = useState(15)
  const [bouwinspanningS, setBouwinspanningS] = useState(30)
  const [bouwinspanningM, setBouwinspanningM] = useState(20)
  const [bouwinspanningL, setBouwinspanningL] = useState(10)
  const [sparseBoetePunten, setSparseBoetePunten] = useState(15)
  const [bonusByOptionId, setBonusByOptionId] = useState<Record<string, number>>({})

  useEffect(() => {
    supabase
      .from('reference_options')
      .select('id, value, label, prioriteit_bonus')
      .eq('category', 'zorgimpact_type')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) return
        setZorgimpactRows((data as ZorgimpactRow[]) ?? [])
        const map: Record<string, number> = {}
        for (const row of data ?? []) {
          map[row.id] = row.prioriteit_bonus ?? 0
        }
        setBonusByOptionId(map)
      })
      .then(
        () => setLoadingOptions(false),
        () => setLoadingOptions(false)
      )
  }, [])

  useEffect(() => {
    setRiskPenalty(config.riskPenalty)
    setBouwinspanningS(config.bouwinspanningS)
    setBouwinspanningM(config.bouwinspanningM)
    setBouwinspanningL(config.bouwinspanningL)
    setSparseBoetePunten(config.sparseBoetePunten)
  }, [config])

  const handleSaveConfig = async () => {
    setSaveError(null)
    setSaving(true)
    try {
      const updates = [
        supabase.from('prioriteitsscore_config').update({ value: riskPenalty }).eq('key', 'risk_penalty'),
        supabase.from('prioriteitsscore_config').update({ value: bouwinspanningS }).eq('key', 'bouwinspanning_s'),
        supabase.from('prioriteitsscore_config').update({ value: bouwinspanningM }).eq('key', 'bouwinspanning_m'),
        supabase.from('prioriteitsscore_config').update({ value: bouwinspanningL }).eq('key', 'bouwinspanning_l'),
        supabase.from('prioriteitsscore_config').update({ value: sparseBoetePunten }).eq('key', 'sparse_boete_punten'),
      ]
      for (const u of updates) {
        const { error } = await u
        if (error) throw error
      }
      for (const row of zorgimpactRows) {
        const bonus = bonusByOptionId[row.id] ?? 0
        const { error } = await supabase
          .from('reference_options')
          .update({ prioriteit_bonus: bonus })
          .eq('id', row.id)
        if (error) throw error
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const setBonus = (id: string, value: number) => {
    setBonusByOptionId((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-ijsselheem-donkerblauw/90">
        Stel hier de formule-parameters in. De score wordt berekend als: zorgwaarde×20 + urenwinst (0–50) + bouwinspanning (S/M/L) − aftrek risico + bonus per zorgimpact type.
      </p>
      {configError && (
        <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">{configError}</p>
      )}
      {configLoading ? (
        <p className="text-ijsselheem-donkerblauw">Laden…</p>
      ) : (
        <div className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-ijsselheem-donkerblauw">Aftrek bij risico (punten)</span>
              <input
                type="number"
                min={0}
                step={1}
                value={riskPenalty}
                onChange={(e) => setRiskPenalty(Number(e.target.value) || 0)}
                className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-ijsselheem-donkerblauw">Punten S (klein)</span>
              <input
                type="number"
                min={0}
                step={1}
                value={bouwinspanningS}
                onChange={(e) => setBouwinspanningS(Number(e.target.value) || 0)}
                className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-ijsselheem-donkerblauw">Punten M (gemiddeld)</span>
              <input
                type="number"
                min={0}
                step={1}
                value={bouwinspanningM}
                onChange={(e) => setBouwinspanningM(Number(e.target.value) || 0)}
                className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-ijsselheem-donkerblauw">Punten L (groot)</span>
              <input
                type="number"
                min={0}
                step={1}
                value={bouwinspanningL}
                onChange={(e) => setBouwinspanningL(Number(e.target.value) || 0)}
                className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-ijsselheem-donkerblauw">Boete Sparse betrokken (punten)</span>
              <input
                type="number"
                min={0}
                step={1}
                value={sparseBoetePunten}
                onChange={(e) => setSparseBoetePunten(Number(e.target.value) || 0)}
                className="rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              />
              <span className="text-xs text-ijsselheem-donkerblauw/70">Aftrek op prioriteitsscore wanneer bij beoordeling &quot;Sparse betrokken = Ja&quot; (vanaf niveau L2).</span>
            </label>
          </div>
          <div>
            <h4 className="text-sm font-medium text-ijsselheem-donkerblauw mb-2">Bonus per zorgimpact type</h4>
            <p className="text-xs text-ijsselheem-donkerblauw/80 mb-3">
              Deze types komen uit de keuzelijst Zorgimpact type. Wijzigingen aan de lijst zelf doe je onder Keuzelijsten.
            </p>
            {loadingOptions ? (
              <p className="text-sm text-ijsselheem-donkerblauw">Laden…</p>
            ) : (
              <div className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ijsselheem-lichtblauw/50 text-left">
                      <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Label</th>
                      <th className="p-3 font-semibold text-ijsselheem-donkerblauw">Waarde</th>
                      <th className="p-3 font-semibold text-ijsselheem-donkerblauw w-32">Bonus (prioriteit)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zorgimpactRows.map((row) => (
                      <tr key={row.id} className="border-t border-ijsselheem-accentblauw/20">
                        <td className="p-3 text-ijsselheem-donkerblauw">{row.label}</td>
                        <td className="p-3 text-ijsselheem-donkerblauw/80">{row.value}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={bonusByOptionId[row.id] ?? row.prioriteit_bonus}
                            onChange={(e) => setBonus(row.id, Number(e.target.value) || 0)}
                            className="w-full rounded border border-ijsselheem-accentblauw/50 bg-white px-2 py-1.5 text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {saveError && (
            <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{saveError}</p>
          )}
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={saving}
            className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      )}
    </section>
  )
}

function BeheerWensenBak() {
  const [wensen, setWensen] = useState<WensInBak[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [promotingId, setPromotingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    fetchWensenBak()
      .then(setWensen)
      .catch((e) => setError(e instanceof Error ? e.message : 'Laden mislukt'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const ingediend = wensen.filter((w) => w.status === 'ingediend')
  const afgekeurd = wensen.filter((w) => w.status === 'afgekeurd')

  const handleOpWensenlijst = async (wens: WensInBak) => {
    setError(null)
    setPromotingId(wens.id)
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
        status: 'wensenlijst',
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
      await updateWensBakOpgenomen(wens.id, app.id)
      setWensen((prev) =>
        prev.map((x) => (x.id === wens.id ? { ...x, status: 'opgenomen' as const, app_id: app.id } : x))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Op wensenlijst zetten mislukt')
    } finally {
      setPromotingId(null)
    }
  }

  if (loading) return <p className="text-ijsselheem-donkerblauw">Laden…</p>
  if (error) {
    return (
      <section>
        <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
        >
          Opnieuw laden
        </button>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <p className="text-sm text-ijsselheem-donkerblauw/90">
        Overzicht van ingediende en afgekeurde wensen. Beoordelen (met reactie, afkeuren of op wensenlijst zetten) doe je via <strong>Werkstromen → Ingediende wensen</strong>. Hier kun je ook direct <strong>Op wensenlijst zetten</strong> zonder detailscherm.
      </p>

      <div>
        <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw mb-2">Ingediende wensen</h3>
        {ingediend.length === 0 ? (
          <p className="text-ijsselheem-donkerblauw/80">Geen ingediende wensen.</p>
        ) : (
          <div className="space-y-4">
            {ingediend.map((wens) => (
              <div
                key={wens.id}
                className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-ijsselheem-donkerblauw">{wens.naam}</h4>
                  <p className="text-sm text-ijsselheem-donkerblauw/80 mt-1 whitespace-pre-wrap">
                    {wens.probleemomschrijving || '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ijsselheem-donkerblauw/70">
                    {wens.domein && <span>Domein: {wens.domein}</span>}
                    {wens.proces && <span>Proces: {wens.proces}</span>}
                    {wens.created_at && <span>Ingediend: {wens.created_at.slice(0, 10)}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link
                    to={`/wensen/${wens.id}`}
                    className="rounded-ijsselheem-button border border-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw"
                  >
                    Beoordelen
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleOpWensenlijst(wens)}
                    disabled={promotingId !== null}
                    className="rounded-ijsselheem-button bg-ijsselheem-donkerblauw px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {promotingId === wens.id ? 'Bezig…' : 'Op wensenlijst zetten'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ijsselheem-donkerblauw mb-2">Afgekeurde wensen</h3>
        {afgekeurd.length === 0 ? (
          <p className="text-ijsselheem-donkerblauw/80">Geen afgekeurde wensen.</p>
        ) : (
          <div className="space-y-4">
            {afgekeurd.map((wens) => (
              <div
                key={wens.id}
                className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 flex flex-wrap items-start justify-between gap-4 border-l-4 border-l-red-400"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-ijsselheem-donkerblauw">{wens.naam}</h4>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-800">
                      Afgekeurd
                    </span>
                  </div>
                  <p className="text-sm text-ijsselheem-donkerblauw/80 mt-1 whitespace-pre-wrap">
                    {wens.probleemomschrijving || '—'}
                  </p>
                  {wens.reactie && (
                    <div className="mt-2 p-2 rounded bg-ijsselheem-lichtblauw/30 text-sm text-ijsselheem-donkerblauw/90">
                      <span className="font-medium">Reactie product owner:</span>{' '}
                      <span className="whitespace-pre-wrap">{wens.reactie}</span>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ijsselheem-donkerblauw/70">
                    {wens.domein && <span>Domein: {wens.domein}</span>}
                    {wens.proces && <span>Proces: {wens.proces}</span>}
                    {wens.created_at && <span>Ingediend: {wens.created_at.slice(0, 10)}</span>}
                    {wens.updated_at && <span>Afgekeurd: {wens.updated_at.slice(0, 10)}</span>}
                  </div>
                </div>
                <Link
                  to={`/wensen/${wens.id}`}
                  className="rounded-ijsselheem-button border border-ijsselheem-accentblauw/50 px-4 py-2 text-sm font-medium text-ijsselheem-donkerblauw/80 hover:bg-ijsselheem-lichtblauw/50 shrink-0"
                >
                  Bekijken
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
