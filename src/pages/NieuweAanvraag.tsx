import { Link } from 'react-router-dom'

export function NieuweAanvraag() {
  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-ijsselheem-donkerblauw">Nieuwe aanvraag</h2>
      <p className="text-sm text-ijsselheem-donkerblauw/80">
        Kies welk type aanvraag u wilt doen.
      </p>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/nieuw/programma"
            className="flex-1 rounded-xl border border-ijsselheem-accentblauw/30 p-4 transition hover:border-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw/50 block"
          >
            <span className="block font-medium text-ijsselheem-donkerblauw">1a Nieuwe applicatie</span>
            <span className="block mt-1 text-sm text-ijsselheem-donkerblauw/80">
              Een nieuwe applicatie met als eerste feature de Basisfunctionaliteit.
            </span>
          </Link>
          <Link
            to="/nieuw/feature"
            className="flex-1 rounded-xl border border-ijsselheem-accentblauw/30 p-4 transition hover:border-ijsselheem-donkerblauw hover:bg-ijsselheem-lichtblauw/50 block"
          >
            <span className="block font-medium text-ijsselheem-donkerblauw">1b Nieuwe feature</span>
            <span className="block mt-1 text-sm text-ijsselheem-donkerblauw/80">
              Een extra feature toevoegen aan een bestaande applicatie; deze krijgt een eigen beoordeling op de backlog.
            </span>
          </Link>
        </div>
      </section>
    </div>
  )
}
