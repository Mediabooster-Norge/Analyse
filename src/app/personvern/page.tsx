import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Personvern og personopplysninger | Nettsjekk',
  description:
    'Les om hvordan Nettsjekk samler inn, bruker og beskytter dine personopplysninger i samsvar med GDPR.',
};

export default function PersonvernPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-8"
          >
            ← Tilbake til forsiden
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Personvern og personopplysninger
          </h1>
          <p className="text-neutral-500 text-sm">Sist oppdatert: mars 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Behandlingsansvarlig</h2>
            <p className="text-neutral-700 leading-relaxed">
              Nettsjekk er ansvarlig for behandlingen av personopplysninger som skjer gjennom
              tjenesten. Hvis du har spørsmål om personvern, kan du kontakte oss på{' '}
              <a
                href="mailto:kontakt@mediabooster.no"
                className="text-blue-600 hover:underline"
              >
                kontakt@mediabooster.no
              </a>
              .
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              2. Hvilke opplysninger samler vi inn?
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Vi samler kun inn det som er nødvendig for å levere tjenesten:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>
                <strong>E-postadresse</strong> — brukes til innlogging og kontoidentifikasjon.
              </li>
              <li>
                <strong>Nettadresser (URL-er)</strong> — nettstedene du velger å analysere, inkludert
                eventuelle konkurrentadresser du oppgir.
              </li>
              <li>
                <strong>Søkeord og bransje</strong> — oppgitt av deg ved analyse, brukes til å
                generere AI-baserte anbefalinger.
              </li>
              <li>
                <strong>Analyseresultater</strong> — SEO-, innholds-, sikkerhets- og ytelsesdata
                lagres knyttet til din konto.
              </li>
              <li>
                <strong>Bruksstatistikk</strong> — antall analyser kjørt per måned, for å håndheve
                kvoter.
              </li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-3">
              Vi samler <strong>ikke</strong> inn betalingsinformasjon direkte — betalinger
              håndteres av tredjepart.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              3. Hva bruker vi opplysningene til?
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Levere og forbedre analysetjenesten.</li>
              <li>Beregne og håndheve månedlige analysekvoter.</li>
              <li>Sende transaksjonsbaserte e-poster (kontobekreftelse, passordtilbakestilling).</li>
              <li>
                Vise historikk og trender i dine analyseresultater over tid (score-utvikling).
              </li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-3">
              Vi selger <strong>ikke</strong> dine opplysninger til tredjeparter og bruker dem ikke
              til markedsføring uten samtykke.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. Rettslig grunnlag</h2>
            <p className="text-neutral-700 leading-relaxed">
              Behandlingen av personopplysninger er basert på{' '}
              <strong>oppfyllelse av avtale</strong> (GDPR art. 6 nr. 1 b) — dvs. at vi behandler
              opplysningene fordi det er nødvendig for å levere tjenesten du har registrert deg for.
              Bruksstatistikk for kvotehåndtering er begrunnet i vår{' '}
              <strong>legitime interesse</strong> i å drifte tjenesten forsvarlig (art. 6 nr. 1 f).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              5. Tredjepartstjenester vi benytter
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>
                <strong>Supabase</strong> (EU-servere) — autentisering og database. Dataene lagres i
                EU/EØS.
              </li>
              <li>
                <strong>OpenAI</strong> — AI-analyse. URL-innhold og søkeord sendes til OpenAIs API
                for prosessering. Se OpenAIs personvernpolicy for detaljer.
              </li>
              <li>
                <strong>Google PageSpeed Insights API</strong> — ytelsesmåling. Nettadressen din
                sendes til Google for analyse.
              </li>
              <li>
                <strong>Vercel</strong> — hosting og serverinfrastruktur (USA/EU).
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. Lagringstid</h2>
            <p className="text-neutral-700 leading-relaxed">
              Analyseresultater lagres så lenge du har en aktiv konto. Ved sletting av konto slettes
              alle tilhørende data. Du kan be om sletting av spesifikke analyser direkte fra
              analyseoversikten i applikasjonen.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. Dine rettigheter</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              I henhold til GDPR har du følgende rettigheter:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>
                <strong>Innsyn</strong> — du kan be om en kopi av opplysningene vi har om deg.
              </li>
              <li>
                <strong>Retting</strong> — du kan be oss rette feilaktige opplysninger.
              </li>
              <li>
                <strong>Sletting</strong> — du kan be oss slette dine opplysninger («retten til å
                bli glemt»).
              </li>
              <li>
                <strong>Dataportabilitet</strong> — du kan be om å få utlevert dine data i et
                maskinlesbart format.
              </li>
              <li>
                <strong>Innsigelse</strong> — du kan protestere mot behandling basert på legitim
                interesse.
              </li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-3">
              Send forespørsler til{' '}
              <a href="mailto:kontakt@mediabooster.no" className="text-blue-600 hover:underline">
                kontakt@mediabooster.no
              </a>
              . Vi svarer innen 30 dager.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              8. Analyse av offentlig tilgjengelige nettsteder
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              Nettsjekk analyserer nettstedsdata som er offentlig tilgjengelig på internett (HTML,
              HTTP-headers, ytelsesdata). Vi lagrer ikke personopplysninger fra nettsteder vi
              analyserer — kun tekniske metadata som SEO-score, innholdskvalitet og
              sikkerhetskonfigurasjon. Tjenesten er ment for analyse av egne nettsteder og
              offentlige konkurrenters nettsteder. Bruk av tjenesten til analyse av nettsteder du
              ikke har tillatelse til å analysere, er brukerens eget ansvar.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">9. Informasjonskapsler</h2>
            <p className="text-neutral-700 leading-relaxed">
              Vi bruker sesjonsbaserte informasjonskapsler (cookies) utelukkende for
              autentisering. Vi bruker ikke tredjeparts sporings- eller markedsføringscookies.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">10. Klageadgang</h2>
            <p className="text-neutral-700 leading-relaxed">
              Dersom du mener vi behandler dine personopplysninger i strid med
              personvernregelverket, har du rett til å klage til{' '}
              <a
                href="https://www.datatilsynet.no"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Datatilsynet
              </a>
              .
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">11. Endringer</h2>
            <p className="text-neutral-700 leading-relaxed">
              Vi kan oppdatere denne personvernerklæringen. Ved vesentlige endringer vil vi varsle
              registrerte brukere via e-post. Dato for siste oppdatering er angitt øverst på siden.
            </p>
          </section>
        </div>

        {/* Footer link */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <p className="text-sm text-neutral-500">
            Spørsmål?{' '}
            <a href="mailto:kontakt@mediabooster.no" className="text-blue-600 hover:underline">
              Kontakt oss
            </a>{' '}
            eller se{' '}
            <Link href="/" className="text-blue-600 hover:underline">
              forsiden
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
