import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/uitleg', end: true, label: 'Overzicht' },
  { to: '/uitleg/proces', end: false, label: 'Proces' },
  { to: '/uitleg/beveiligingsniveaus', end: false, label: 'Beveiligingsniveaus' },
  { to: '/uitleg/prioriteitsscore', end: false, label: 'Prioriteitsscore en boetes' },
] as const

export function UitlegLayout() {
  return (
    <div className="max-w-4xl mx-auto">
      <nav
        className="flex flex-wrap gap-1 border-b border-ijsselheem-accentblauw/30 pb-4 mb-6"
        aria-label="Uitleg onderwerpen"
      >
        {NAV_ITEMS.map(({ to, end, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'px-4 py-2 rounded-t-lg text-sm font-medium transition',
                isActive
                  ? 'bg-ijsselheem-donkerblauw text-white'
                  : 'text-ijsselheem-donkerblauw/80 hover:bg-ijsselheem-lichtblauw/50'
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
