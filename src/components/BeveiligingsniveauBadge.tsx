import type { Beveiligingsniveau } from '@/lib/beveiligingsniveau'
import {
  getBeveiligingsniveauLabel,
  getBeveiligingsniveauShortLabel,
  getBeveiligingsniveauBadgeColor,
  getBeveiligingsniveauGovernance,
} from '@/lib/beveiligingsniveau'

interface BeveiligingsniveauBadgeProps {
  level: Beveiligingsniveau | null | undefined
  /** Toon alleen het rondje (geen label) */
  dotOnly?: boolean
  /** In lijsten: alleen L0 t/m L3; op detailkaarten: volledige omschrijving */
  shortLabel?: boolean
  className?: string
}

export function BeveiligingsniveauBadge({ level, dotOnly, shortLabel = false, className = '' }: BeveiligingsniveauBadgeProps) {
  if (level == null) {
    return <span className={`text-ijsselheem-donkerblauw/50 text-xs ${className}`}>—</span>
  }
  const label = shortLabel ? getBeveiligingsniveauShortLabel(level) : getBeveiligingsniveauLabel(level)
  const fullLabel = getBeveiligingsniveauLabel(level)
  const color = getBeveiligingsniveauBadgeColor(level)
  const governance = getBeveiligingsniveauGovernance(level)
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={governance || fullLabel}
    >
      <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${color}`} aria-hidden />
      {!dotOnly && <span className="text-xs font-medium text-ijsselheem-donkerblauw">{label}</span>}
    </span>
  )
}
