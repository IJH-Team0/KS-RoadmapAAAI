import type { App } from '@/types/app'
import { getStatusLabel } from '@/types/app'
import { cn } from '@/lib/utils'

interface AppCardProps {
  app: App
  onClick: () => void
  isSelected?: boolean
}

export function AppCard({ app, onClick, isSelected }: AppCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-[20px] border border-ijsselheem-accentblauw/30 bg-white p-3 transition shadow-sm',
        'hover:border-ijsselheem-accentblauw hover:shadow',
        'border-l-4 border-l-gray-300',
        isSelected && 'ring-2 ring-ijsselheem-donkerblauw border-ijsselheem-donkerblauw'
      )}
    >
      <div className="font-semibold text-ijsselheem-donkerblauw">{app.naam}</div>
      {app.doel_app && (
        <p className="mt-1 text-sm text-ijsselheem-donkerblauw/90 line-clamp-2">{app.doel_app}</p>
      )}
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-ijsselheem-donkerblauw">
        {app.platform && <span>{app.platform}</span>}
        {app.complexiteit && <span>{app.complexiteit}</span>}
      </div>
      <div className="mt-1 text-xs text-ijsselheem-donkerblauw/70">{getStatusLabel(app.status)}</div>
    </button>
  )
}
