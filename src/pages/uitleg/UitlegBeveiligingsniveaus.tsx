export function UitlegBeveiligingsniveaus() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ijsselheem-donkerblauw">Beveiligingsniveaus voor applicaties</h2>
        <p className="mt-2 text-ijsselheem-donkerblauw/90 leading-relaxed">
          Bij het registreren van een nieuwe applicatie bepalen we eerst welk beveiligingsniveau van toepassing is. Dit noemen we het applicatielevel. Het level bepaalt waar de applicatie gehost wordt en aan welke technische en organisatorische eisen deze moet voldoen.
        </p>
        <p className="mt-2 text-ijsselheem-donkerblauw/90 leading-relaxed">
          De levels lopen van L0 tot en met L3. Hoe hoger het level, hoe gevoeliger de data en hoe strenger de eisen.
        </p>
      </div>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-5 space-y-6">
        <div>
          <h3 className="text-base font-semibold text-ijsselheem-donkerblauw flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" aria-hidden />
            L0 – Experimenteel
          </h3>
          <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90">Dit level is bedoeld voor experimenten, trainingen en persoonlijke projecten.</p>
          <p className="mt-2 text-xs font-medium text-ijsselheem-donkerblauw/80">Kenmerken</p>
          <ul className="list-disc list-inside text-sm text-ijsselheem-donkerblauw/90 space-y-1">
            <li>Geen bedrijfsinformatie</li>
            <li>Geen persoonsgegevens</li>
            <li>Geen cliëntgegevens</li>
            <li>Geen koppeling met Microsoft accounts (SSO)</li>
          </ul>
          <p className="mt-2 text-sm"><strong className="text-ijsselheem-donkerblauw">Hosting</strong><br />Externe platforms zoals Supabase of Netlify.</p>
          <p className="mt-1 text-sm"><strong className="text-ijsselheem-donkerblauw">Beheer</strong><br />De gebruiker is zelf verantwoordelijk voor ontwikkeling en beheer.</p>
          <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90 italic">Gebruik dit level alleen voor prototypes en leerprojecten.</p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-ijsselheem-donkerblauw flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" aria-hidden />
            L1 – Interne tools
          </h3>
          <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90">L1-applicaties zijn kleine hulpmiddelen voor intern gebruik. Deze tools bevatten geen gevoelige gegevens.</p>
          <p className="mt-2 text-xs font-medium text-ijsselheem-donkerblauw/80">Kenmerken</p>
          <ul className="list-disc list-inside text-sm text-ijsselheem-donkerblauw/90 space-y-1">
            <li>Geen cliëntgegevens</li>
            <li>Geen persoonsgegevens van medewerkers</li>
            <li>Gebruikt door een klein team of één locatie</li>
          </ul>
          <p className="mt-2 text-sm"><strong className="text-ijsselheem-donkerblauw">Hosting</strong><br />Self-hosted omgeving buiten Azure.</p>
          <p className="mt-2 text-xs font-medium text-ijsselheem-donkerblauw/80">Technische eisen</p>
          <ul className="list-disc list-inside text-sm text-ijsselheem-donkerblauw/90 space-y-1">
            <li>Code staat in GitHub</li>
            <li>Techstack gebaseerd op NextJS, React, NodeJS en TypeScript</li>
            <li>Applicatie voldoet aan de huisstijl van IJsselheem</li>
          </ul>
          <p className="mt-2 text-sm"><strong className="text-ijsselheem-donkerblauw">Beheer</strong><br />De applicatie mag door de gebruiker zelf worden doorontwikkeld.</p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-ijsselheem-donkerblauw flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
            L2 – Medewerkersinformatie
          </h3>
          <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90">L2-applicaties verwerken interne bedrijfsinformatie of persoonsgegevens van medewerkers.</p>
          <p className="mt-2 text-xs font-medium text-ijsselheem-donkerblauw/80">Kenmerken</p>
          <ul className="list-disc list-inside text-sm text-ijsselheem-donkerblauw/90 space-y-1">
            <li>HR-gegevens of adresgegevens van medewerkers</li>
            <li>Organisatiebrede interne tools</li>
          </ul>
          <p className="mt-2 text-sm"><strong className="text-ijsselheem-donkerblauw">Hosting</strong><br />Altijd in Microsoft Azure.</p>
          <p className="mt-2 text-xs font-medium text-ijsselheem-donkerblauw/80">Technische eisen</p>
          <ul className="list-disc list-inside text-sm text-ijsselheem-donkerblauw/90 space-y-1">
            <li>Database staat in Azure en is niet publiek toegankelijk</li>
            <li>Authenticatie via Entra ID</li>
            <li>Secrets opgeslagen in Azure Key Vault</li>
            <li>Logging verplicht</li>
            <li>Omgevingen voor Development, Acceptatie en Productie</li>
            <li>Deployment via Infrastructure-as-Code (Bicep pipelines)</li>
            <li>Code staat in Azure DevOps</li>
          </ul>
          <p className="mt-2 text-sm"><strong className="text-ijsselheem-donkerblauw">Beheer</strong><br />Doorontwikkeling gebeurt onder regie van IT.</p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-ijsselheem-donkerblauw flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" aria-hidden />
            L3 – Cliëntgegevens
          </h3>
          <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90">L3 is het hoogste beveiligingsniveau. Deze applicaties verwerken cliëntinformatie en vallen onder strenge regelgeving.</p>
          <p className="mt-2 text-xs font-medium text-ijsselheem-donkerblauw/80">Kenmerken</p>
          <ul className="list-disc list-inside text-sm text-ijsselheem-donkerblauw/90 space-y-1">
            <li>Bevat cliëntgegevens</li>
            <li>Ondersteunt het primaire zorgproces</li>
          </ul>
          <p className="mt-2 text-sm"><strong className="text-ijsselheem-donkerblauw">Hosting</strong><br />Microsoft Azure.</p>
          <p className="mt-2 text-xs font-medium text-ijsselheem-donkerblauw/80">Extra eisen</p>
          <ul className="list-disc list-inside text-sm text-ijsselheem-donkerblauw/90 space-y-1">
            <li>Alle eisen van L2 zijn van toepassing</li>
            <li>Strikt toegangsbeheer via PIM</li>
            <li>Geavanceerde logging en auditing</li>
            <li>Georedundante back-ups</li>
            <li>Data-isolatie per applicatie</li>
            <li>Confidential computing wordt overwogen</li>
          </ul>
          <p className="mt-2 text-sm"><strong className="text-ijsselheem-donkerblauw">Beheer</strong><br />Ontwikkeling en beheer liggen volledig bij IT.</p>
        </div>

        <div className="pt-4 border-t border-ijsselheem-accentblauw/20">
          <h4 className="text-base font-semibold text-ijsselheem-donkerblauw">Hoe het level wordt bepaald</h4>
          <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90">Bij registratie van een applicatie stellen we een aantal vragen:</p>
          <ul className="mt-2 list-disc list-inside text-sm text-ijsselheem-donkerblauw/90 space-y-1">
            <li>Verwerkt de applicatie cliëntgegevens?</li>
            <li>Verwerkt de applicatie persoonsgegevens van medewerkers?</li>
            <li>Is de applicatie bedoeld voor intern gebruik door een team of locatie?</li>
          </ul>
          <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90">Op basis van de antwoorden bepaalt het systeem automatisch het juiste beveiligingslevel.</p>
        </div>

        <div className="pt-4 border-t border-ijsselheem-accentblauw/20">
          <h4 className="text-base font-semibold text-ijsselheem-donkerblauw">Waarom deze indeling bestaat</h4>
          <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90">Deze indeling helpt om:</p>
          <ul className="mt-2 list-disc list-inside text-sm text-ijsselheem-donkerblauw/90 space-y-1">
            <li>cliëntgegevens goed te beschermen</li>
            <li>te voldoen aan wetgeving zoals AVG</li>
            <li>kosten en infrastructuur beheersbaar te houden</li>
            <li>experimenten mogelijk te maken zonder risico voor de organisatie</li>
          </ul>
          <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90">Door applicaties correct te classificeren blijft de digitale omgeving veilig en overzichtelijk.</p>
        </div>
      </section>
    </div>
  )
}
