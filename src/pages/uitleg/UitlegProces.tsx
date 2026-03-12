import { Link } from 'react-router-dom'

const WORKFLOW_STEPS = [
  'Wensenlijst',
  'User stories maken',
  'Sprintbaar',
  'In ontwikkeling',
  'Test',
  'Productie',
] as const

const STEPS = [
  { nummer: 1, titel: 'Inloggen', beschrijving: 'Log in met je e-mailadres en wachtwoord. Je komt daarna op het Dashboard.', link: '/login', linkTekst: 'Naar inloggen' },
  { nummer: 2, titel: 'Dashboard bekijken', beschrijving: 'Op het Dashboard zie je een overzicht: totaal aantal ideeën, aantal in ontwikkeling, totale urenwinst (top 10), aantal met risico = Ja, en verdeling op zorgwaarde en bouwinspanning. Vanaf hier kun je snel naar andere onderdelen.', link: '/', linkTekst: 'Naar Dashboard' },
  { nummer: 3, titel: 'Nieuwe aanvraag indienen', beschrijving: 'Heb je een nieuw idee of aanvraag? Ga naar "Nieuwe aanvraag", vul het formulier in en dien het in. De aanvraag komt in de backlog en kan worden beoordeeld.', link: '/nieuw', linkTekst: 'Nieuwe aanvraag' },
  { nummer: 4, titel: 'Backlog bekijken en beheren', beschrijving: 'In de Backlog staan alle aanvragen en ideeën. Je kunt zoeken, filteren en op een item klikken voor details. Hier worden features en user stories of taken gekoppeld aan apps.', link: '/backlog', linkTekst: 'Naar Backlog' },
  { nummer: 5, titel: 'Aanvragen beoordelen', beschrijving: 'Als je beoordelaar bent: ga naar "Beoordelen". Hier geef je prioriteit, complexiteit, zorgwaarde (1–5: hoe belangrijk voor zorgkwaliteit of cliëntwelzijn; 1 = weinig impact, 5 = zeer grote impact) en bouwinspanning af. Na goedkeuring kunnen features worden gemaakt en aan de roadmap worden toegevoegd.', link: '/beoordelen', linkTekst: 'Naar Beoordelen' },
  { nummer: 6, titel: 'User stories of taken maken', beschrijving: 'Features die in de fase "User stories maken" staan, verschijnen op de pagina User stories maken. Je voegt daar user stories toe. Na ten minste één user story gaat de feature automatisch naar Sprintbaar en kun je hem op het werkbord verder verplaatsen.', link: '/stories-maken', linkTekst: 'Naar User stories of taken maken' },
  { nummer: 7, titel: 'Planning en roadmap', beschrijving: 'Planning (werkbord) volgt een Scrum-workflow: Wensenlijst → User stories maken → Sprintbaar → In ontwikkeling → Test → Productie. De fase "User stories maken" heeft ook een aparte pagina (zie stap 6). De eerste stappen gaan automatisch (via beoordeling en user stories); op het bord kun je die niet handmatig wijzigen. Vanaf Sprintbaar verplaats je handmatig naar In ontwikkeling, Test of Productie. Roadmap toont wanneer welke features gepland staan.', link: '/planning', linkTekst: 'Naar Planning' },
  { nummer: 8, titel: 'Rapportage', beschrijving: 'In Rapportage vind je overzichten en cijfers over de aanvragen, status en voortgang. Handig voor verantwoording en besluitvorming.', link: '/rapportage', linkTekst: 'Naar Rapportage' },
] as const

export function UitlegProces() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ijsselheem-donkerblauw">Proces</h2>
        <p className="mt-2 text-ijsselheem-donkerblauw/90 leading-relaxed">
          Van idee tot productie: eerst beoordeling en user stories, daarna handmatig verplaatsen op het werkbord.
        </p>
      </div>

      {/* Visueel schema workflow */}
      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-5">
        <h3 className="text-lg font-semibold text-ijsselheem-donkerblauw mb-4">Workflow feature (Scrum)</h3>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {WORKFLOW_STEPS.map((label, i) => (
            <span key={label} className="flex items-center gap-1 sm:gap-2">
              <span className="rounded-lg border border-ijsselheem-accentblauw/50 bg-ijsselheem-lichtblauw/50 px-2 py-1.5 text-xs font-medium text-ijsselheem-donkerblauw sm:px-3 sm:text-sm whitespace-nowrap">
                {label}
              </span>
              {i < WORKFLOW_STEPS.length - 1 && (
                <span className="text-ijsselheem-donkerblauw/50 shrink-0" aria-hidden>
                  →
                </span>
              )}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-ijsselheem-donkerblauw/70">
          De eerste stappen (Wensenlijst, User stories maken) lopen via backlog en beoordeling. Vanaf Sprintbaar verplaats je op het werkbord handmatig naar In ontwikkeling, Test of Productie.
        </p>
      </section>

      {/* Stappen 1–8 */}
      <div>
        <h3 className="text-lg font-semibold text-ijsselheem-donkerblauw mb-4">Stap voor stap</h3>
        <p className="text-sm text-ijsselheem-donkerblauw/90 mb-4">
          Zo gebruik je Roadmap AAAI: van inloggen tot rapportage. Volg de stappen in volgorde of ga direct naar het onderdeel dat je nodig hebt.
        </p>
        <ol className="space-y-6 list-none pl-0">
          {STEPS.map((step) => (
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
                  <h4 className="text-lg font-semibold text-ijsselheem-donkerblauw">
                    Stap {step.nummer}: {step.titel}
                  </h4>
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
      </div>
    </div>
  )
}
