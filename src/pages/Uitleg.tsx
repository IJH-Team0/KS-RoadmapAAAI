import { Link } from 'react-router-dom'

export function Uitleg() {
  const steps = [
    {
      nummer: 1,
      titel: 'Inloggen',
      beschrijving: 'Log in met je e-mailadres en wachtwoord. Je komt daarna op het Dashboard.',
      link: '/login',
      linkTekst: 'Naar inloggen',
    },
    {
      nummer: 2,
      titel: 'Dashboard bekijken',
      beschrijving:
        'Op het Dashboard zie je een overzicht: totaal aantal ideeën, aantal in ontwikkeling, totale urenwinst (top 10), aantal met risico = Ja, en verdeling op zorgwaarde en bouwinspanning. Vanaf hier kun je snel naar andere onderdelen.',
      link: '/',
      linkTekst: 'Naar Dashboard',
    },
    {
      nummer: 3,
      titel: 'Nieuwe aanvraag indienen',
      beschrijving:
        'Heb je een nieuw idee of aanvraag? Ga naar "Nieuwe aanvraag", vul het formulier in en dien het in. De aanvraag komt in de backlog en kan worden beoordeeld.',
      link: '/nieuw',
      linkTekst: 'Nieuwe aanvraag',
    },
    {
      nummer: 4,
      titel: 'Backlog bekijken en beheren',
      beschrijving:
        'In de Backlog staan alle aanvragen en ideeën. Je kunt zoeken, filteren en op een item klikken voor details. Hier worden features en user stories gekoppeld aan apps.',
      link: '/backlog',
      linkTekst: 'Naar Backlog',
    },
    {
      nummer: 5,
      titel: 'Aanvragen beoordelen',
      beschrijving:
        'Als je beoordelaar bent: ga naar "Beoordelen". Hier geef je prioriteit, complexiteit, zorgwaarde (1–5: hoe belangrijk voor zorgkwaliteit of cliëntwelzijn; 1 = weinig impact, 5 = zeer grote impact) en bouwinspanning af. Na goedkeuring kunnen features worden gemaakt en aan de roadmap worden toegevoegd.',
      link: '/beoordelen',
      linkTekst: 'Naar Beoordelen',
    },
    {
      nummer: 6,
      titel: 'User stories maken',
      beschrijving:
        'Features die in de fase "User stories maken" staan, verschijnen op de pagina User stories maken. Je voegt daar user stories toe. Na ten minste één user story gaat de feature automatisch naar Sprintbaar en kun je hem op het werkbord verder verplaatsen.',
      link: '/stories-maken',
      linkTekst: 'Naar User stories maken',
    },
    {
      nummer: 7,
      titel: 'Planning en roadmap',
      beschrijving:
        'Planning (werkbord) volgt een Scrum-workflow: Wensenlijst → User stories maken → Sprintbaar → In ontwikkeling → Test → Productie. De fase "User stories maken" heeft ook een aparte pagina (zie stap 6). De eerste stappen gaan automatisch (via beoordeling en user stories); op het bord kun je die niet handmatig wijzigen. Vanaf Sprintbaar verplaats je handmatig naar In ontwikkeling, Test of Productie. Roadmap toont wanneer welke features gepland staan.',
      link: '/planning',
      linkTekst: 'Naar Planning',
    },
    {
      nummer: 8,
      titel: 'Rapportage',
      beschrijving:
        'In Rapportage vind je overzichten en cijfers over de aanvragen, status en voortgang. Handig voor verantwoording en besluitvorming.',
      link: '/rapportage',
      linkTekst: 'Naar Rapportage',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ijsselheem-donkerblauw">Stap voor stap uitleg</h2>
        <p className="mt-2 text-ijsselheem-donkerblauw">
          Zo gebruik je Roadmap AAAI: van inloggen tot rapportage. Volg de stappen in volgorde of ga direct naar het onderdeel dat je nodig hebt.
        </p>
      </div>

      <ol className="space-y-6 list-none pl-0">
        {steps.map((step) => (
          <li
            key={step.nummer}
            className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-5 shadow-sm"
          >
            <div className="flex gap-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ijsselheem-donkerblauw text-sm font-bold text-white"
                aria-hidden
              >
                {step.nummer}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-ijsselheem-donkerblauw">
                  Stap {step.nummer}: {step.titel}
                </h3>
                <p className="mt-2 text-ijsselheem-donkerblauw/90 leading-relaxed">
                  {step.beschrijving}
                </p>
                <Link
                  to={step.link}
                  className="mt-3 inline-block text-sm font-medium text-ijsselheem-donkerblauw underline hover:no-underline"
                >
                  {step.linkTekst} →
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-5">
        <h3 className="text-lg font-semibold text-ijsselheem-donkerblauw">Prioriteitsscore</h3>
        <p className="mt-2 text-ijsselheem-donkerblauw/90 leading-relaxed">
          De prioriteitsscore is een getal dat de prioriteit van een aanvraag of feature samenvat. Het wordt overal gebruikt om te sorteren: in de Backlog, op het Dashboard, in de Planning en in Rapportage. Hoe hoger de score, hoe hoger de prioriteit.
        </p>
        <p className="mt-3 text-ijsselheem-donkerblauw/90 leading-relaxed">
          De score wordt automatisch berekend uit de beoordeling: zorgwaarde, urenwinst per jaar, bouwinspanning en risico. De onderdelen:
        </p>
        <ul className="mt-3 list-disc list-inside space-y-1.5 text-ijsselheem-donkerblauw/90 text-sm">
          <li>
            <strong>Zorgwaarde (1–5)</strong>: hoe belangrijk voor zorgkwaliteit of cliëntwelzijn; 1 = weinig impact, 5 = zeer grote impact. Levert 20 tot 100 punten (20 punten per punt).
          </li>
          <li>
            <strong>Urenwinst per jaar</strong>: geschatte besparing in uren. Levert tot 50 punten: 1 punt per 10 uur, maximum bij 500 uur of meer.
          </li>
          <li>
            <strong>Bouwinspanning (S / M / L)</strong>: S (klein) = 30 punten, M (gemiddeld) = 20 punten, L (groot) = 10 punten. Een kleinere inspanning geeft een hogere bijdrage aan de score.
          </li>
          <li>
            <strong>Risico</strong>: als bij de beoordeling "risico = ja" is ingevuld, gaan er 15 punten van de score af.
          </li>
        </ul>
        <p className="mt-3 text-ijsselheem-donkerblauw/90 leading-relaxed">
          De totale score is één getal (bijv. 85,0), afgerond op één decimaal. Het minimum is 0. Overal waar prioriteit een rol speelt, wordt op deze score gesorteerd zodat de belangrijkste items bovenaan staan.
        </p>
      </section>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-ijsselheem-lichtblauw/50 p-5">
        <h3 className="text-base font-semibold text-ijsselheem-donkerblauw">Tip</h3>
        <p className="mt-2 text-sm text-ijsselheem-donkerblauw">
          Gebruik de zoekbalk in de header om snel in de backlog te zoeken. Via het menu in de header ga je direct naar Dashboard, Nieuwe aanvraag, Backlog, Beoordelen, User stories maken, Planning, Roadmap, Applicaties, Rapportage of Uitleg.
        </p>
      </section>
    </div>
  )
}
