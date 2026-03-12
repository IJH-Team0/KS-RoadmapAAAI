import { Link } from 'react-router-dom'

const TOPICS = [
  {
    to: '/uitleg/proces',
    title: 'Proces',
    description: 'Stap-voor-stap en visueel overzicht van de workflow van idee tot productie.',
  },
  {
    to: '/uitleg/beveiligingsniveaus',
    title: 'Beveiligingsniveaus',
    description: 'L0 tot en met L3: wanneer welk level van toepassing is en welke eisen gelden.',
  },
  {
    to: '/uitleg/prioriteitsscore',
    title: 'Prioriteitsscore en boetes',
    description: 'Hoe de score wordt berekend en welke aftrek (risico, Sparse) van toepassing is.',
  },
] as const

export function UitlegOverzicht() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ijsselheem-donkerblauw">Uitleg Roadmap AAAI</h2>
        <p className="mt-2 text-ijsselheem-donkerblauw/90 leading-relaxed">
          Hier vind je uitleg over het proces, beveiligingsniveaus en prioriteitsscore. Kies een onderwerp om verder te lezen.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {TOPICS.map(({ to, title, description }) => (
          <Link
            key={to}
            to={to}
            className="block rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-5 shadow-sm hover:border-ijsselheem-accentblauw hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-ijsselheem-donkerblauw">{title}</h3>
            <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90 leading-relaxed">
              {description}
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-ijsselheem-donkerblauw underline hover:no-underline">
              Lees meer →
            </span>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-ijsselheem-lichtblauw/50 p-5">
        <h3 className="text-base font-semibold text-ijsselheem-donkerblauw">Tip</h3>
        <p className="mt-2 text-sm text-ijsselheem-donkerblauw">
          Gebruik de zoekbalk in de header om snel in de backlog te zoeken. Via het menu ga je direct naar Dashboard, Backlog, Beoordelen, User stories maken, Planning, Roadmap, Applicaties, Rapportage of Uitleg.
        </p>
      </section>
    </div>
  )
}
