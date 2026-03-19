import { useMemo, useState, useRef, useEffect } from 'react'
import type { App, AppStatusDb } from '@/types/app'
import { APP_STATUS_OPTIONS, getStatusLabel } from '@/types/app'
import { cn } from '@/lib/utils'

type DomeinOption = { value: string; label: string }

type ProgrammaZoekerProps = {
  apps: App[]
  value: string
  onChange: (appId: string) => void
  domeinOptions: DomeinOption[]
  disabled?: boolean
  id?: string
}

/** Zoek- en filterbare keuze voor een applicatie (geen lange &lt;select&gt;-lijst). */
export function ProgrammaZoeker({
  apps,
  value,
  onChange,
  domeinOptions,
  disabled,
  id = 'programma-zoeker',
}: ProgrammaZoekerProps) {
  const [search, setSearch] = useState('')
  const [filterDomein, setFilterDomein] = useState('')
  const [filterStatus, setFilterStatus] = useState<AppStatusDb | ''>('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => apps.find((a) => a.id === value) ?? null, [apps, value])

  const filtered = useMemo(() => {
    let list = apps
    if (filterDomein) list = list.filter((a) => a.domein === filterDomein)
    if (filterStatus) list = list.filter((a) => a.status === filterStatus)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (a) =>
          a.naam.toLowerCase().includes(q) ||
          (a.domein != null && a.domein.toLowerCase().includes(q))
      )
    }
    return [...list].sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
  }, [apps, filterDomein, filterStatus, search])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  const startWijzigen = () => {
    onChange('')
    setSearch('')
    setPickerOpen(true)
  }

  const pick = (app: App) => {
    onChange(app.id)
    setPickerOpen(false)
    setSearch('')
  }

  const showList = !selected || pickerOpen

  return (
    <div ref={rootRef} className="space-y-2">
      {selected && !pickerOpen ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/30 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ijsselheem-donkerblauw truncate">{selected.naam}</p>
            <p className="text-xs text-ijsselheem-donkerblauw/70">
              {selected.domein ?? 'Geen domein'} · {getStatusLabel(selected.status)}
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={startWijzigen}
            className="shrink-0 rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-1.5 text-sm font-medium text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw disabled:opacity-50"
          >
            Wijzigen
          </button>
        </div>
      ) : null}

      {(!selected || pickerOpen) && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${id}-domein`} className="block text-xs font-medium text-ijsselheem-donkerblauw/80 mb-1">
                Filter domein
              </label>
              <select
                id={`${id}-domein`}
                disabled={disabled}
                value={filterDomein}
                onChange={(e) => setFilterDomein(e.target.value)}
                className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              >
                <option value="">Alle domeinen</option>
                {domeinOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-status`} className="block text-xs font-medium text-ijsselheem-donkerblauw/80 mb-1">
                Filter status applicatie
              </label>
              <select
                id={`${id}-status`}
                disabled={disabled}
                value={filterStatus}
                onChange={(e) => setFilterStatus((e.target.value || '') as AppStatusDb | '')}
                className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
              >
                <option value="">Alle statussen</option>
                {APP_STATUS_OPTIONS.filter((o) => o.value !== 'afgewezen').map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor={`${id}-search`} className="block text-xs font-medium text-ijsselheem-donkerblauw/80 mb-1">
              Zoek applicatie
            </label>
            <input
              id={`${id}-search`}
              type="text"
              disabled={disabled}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setPickerOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setPickerOpen(false)
              }}
              placeholder="Typ een deel van de naam…"
              autoComplete="off"
              role="combobox"
              aria-expanded={showList}
              aria-controls={`${id}-listbox`}
              aria-autocomplete="list"
              className="w-full rounded-lg border border-ijsselheem-accentblauw/50 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div
            id={`${id}-listbox`}
            role="listbox"
            className={cn(
              'max-h-56 overflow-y-auto rounded-lg border border-ijsselheem-accentblauw/40 bg-white shadow-sm',
              showList ? 'block' : 'hidden'
            )}
          >
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-ijsselheem-donkerblauw/70">Geen applicaties gevonden. Pas filters of zoekterm aan.</p>
            ) : (
              <ul className="py-1">
                {filtered.map((app) => (
                  <li key={app.id} role="presentation">
                    <button
                      type="button"
                      disabled={disabled}
                      role="option"
                      aria-selected={value === app.id}
                      onClick={() => pick(app)}
                      className="w-full text-left px-3 py-2 text-sm text-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw/60 focus:bg-ijsselheem-lichtblauw/60 focus:outline-none"
                    >
                      <span className="font-medium">{app.naam}</span>
                      <span className="block text-xs text-ijsselheem-donkerblauw/65">
                        {app.domein ?? '—'} · {getStatusLabel(app.status)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
