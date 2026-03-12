export function UitlegPrioriteitsscore() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ijsselheem-donkerblauw">Prioriteitsscore en boetes</h2>
        <p className="mt-2 text-ijsselheem-donkerblauw/90 leading-relaxed">
          De prioriteitsscore is een getal dat de prioriteit van een aanvraag of feature samenvat. Het wordt overal gebruikt om te sorteren: in de Backlog, op het Dashboard, in de Planning en in Rapportage. Hoe hoger de score, hoe hoger de prioriteit.
        </p>
      </div>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-5">
        <h3 className="text-lg font-semibold text-ijsselheem-donkerblauw">Formule</h3>
        <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90 leading-relaxed">
          De score wordt automatisch berekend uit: <strong>zorgwaarde</strong> (×20), <strong>urenwinst per jaar</strong> (max. 50 punten), <strong>bouwinspanning</strong> (S/M/L), eventuele <strong>bonussen</strong> voor zorgimpact type, min de <strong>aftrek voor risico</strong> en min de <strong>aftrek voor Sparse betrokken</strong>.
        </p>
        <p className="mt-2 text-sm text-ijsselheem-donkerblauw/80 font-medium">
          Formule: zorgwaarde×20 + urenwinst (0–50) + bouwinspanning + bonussen − aftrek risico − aftrek Sparse
        </p>
      </section>

      <section className="rounded-xl border border-ijsselheem-accentblauw/30 bg-white p-5">
        <h3 className="text-lg font-semibold text-ijsselheem-donkerblauw">Onderdelen die punten opleveren</h3>
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
            <strong>Bonus zorgimpact type</strong>: voor bepaalde types (bijv. Compliance/wetgeving, Cliëntveiligheid) kan een extra bonus worden toegevoegd volgens de configuratie.
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50/50 p-5">
        <h3 className="text-lg font-semibold text-ijsselheem-donkerblauw">Boetes (aftrek van de score)</h3>
        <p className="mt-2 text-sm text-ijsselheem-donkerblauw/90 leading-relaxed">
          De volgende aftrekposten gaan van de totaalscore af:
        </p>
        <ul className="mt-3 list-disc list-inside space-y-1.5 text-ijsselheem-donkerblauw/90 text-sm">
          <li>
            <strong>Risico = Ja</strong>: als bij de beoordeling “risico = ja” is ingevuld, gaan er <strong>15 punten</strong> van de score af. Dit weerspiegelt het extra aandacht dat risicovolle items nodig hebben.
          </li>
          <li>
            <strong>Sparse betrokken</strong>: als de feature wordt opgepakt met de leverancier Sparse (veld “Sparse betrokken” aangevinkt), gaan er eveneens <strong>15 punten</strong> af. Dit houdt rekening met de andere aansturing en afhankelijkheid bij externe betrokkenheid.
          </li>
        </ul>
        <p className="mt-3 text-sm text-ijsselheem-donkerblauw/80">
          De totale score is één getal (bijv. 85,0), afgerond op één decimaal. Het minimum is 0. Overal waar prioriteit een rol speelt, wordt op deze score gesorteerd zodat de belangrijkste items bovenaan staan.
        </p>
      </section>
    </div>
  )
}
