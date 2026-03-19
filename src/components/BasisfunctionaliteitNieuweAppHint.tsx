import { BASISFEATURE_NAAM } from '@/types/app'
import { cn } from '@/lib/utils'

type Variant = 'banner' | 'compact' | 'inline'

type BasisfunctionaliteitNieuweAppHintProps = {
  featureNaam: string
  /** banner: callout blok; compact: badge voor tabellen; inline: korte tekst naast titel */
  variant?: Variant
  className?: string
}

/**
 * Toont een duidelijke boodschap als de feature de standaard Basisfunctionaliteit is
 * (eerste feature van een nieuwe applicatie).
 */
export function BasisfunctionaliteitNieuweAppHint({
  featureNaam,
  variant = 'banner',
  className,
}: BasisfunctionaliteitNieuweAppHintProps) {
  if (featureNaam !== BASISFEATURE_NAAM) return null

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'ml-1.5 inline-flex max-w-[9rem] shrink-0 items-center rounded-md border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ijsselheem-donkerblauw',
          className
        )}
        title="Dit betreft de Basisfunctionaliteit: de eerste feature van een nieuwe applicatie."
      >
        Nieuwe app
      </span>
    )
  }

  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'ml-2 text-xs font-semibold text-ijsselheem-donkerblauw border border-ijsselheem-accentblauw/40 rounded-md bg-ijsselheem-lichtblauw/60 px-2 py-0.5',
          className
        )}
      >
        Nieuwe applicatie (eerste feature)
      </span>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border-l-4 border-ijsselheem-donkerblauw bg-ijsselheem-lichtblauw/50 px-4 py-3 text-sm text-ijsselheem-donkerblauw',
        className
      )}
      role="status"
    >
      <p className="font-semibold">Nieuwe applicatie</p>
      <p className="mt-1 text-ijsselheem-donkerblauw/90">
        Dit is de feature <strong>Basisfunctionaliteit</strong>: het eerste onderdeel van een nieuwe applicatie. De
        status van deze feature bepaalt het statusniveau van de hele applicatie op de roadmap.
      </p>
    </div>
  )
}
