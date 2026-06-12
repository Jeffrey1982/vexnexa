/**
 * Seed script to insert three Dutch blog posts:
 *  1. De EAA is actief — wat betekent dat concreet voor uw website?
 *  2. Waarom axe-core niet genoeg is voor een volledige WCAG-audit
 *  3. Hoe gemeentes hun toegankelijkheidsverklaring up-to-date houden in 2026
 *
 * Usage:
 *   node scripts/seed-blog-nl-trio.cjs
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const POSTS = [
  {
    slug: 'eaa-actief-wat-betekent-dat-voor-uw-website-nl',
    locale: 'nl',
    title: 'De EAA is actief — wat betekent dat concreet voor uw website?',
    excerpt:
      'Sinds 28 juni 2025 is de European Accessibility Act van kracht. Dit zijn de drie dingen die elke organisatie met een website nú moet weten — en de drie stappen om vandaag te zetten.',
    metaTitle: 'De EAA is actief: wat betekent dat voor uw website? | VexNexa',
    metaDescription:
      'De European Accessibility Act wordt gehandhaafd. Wie valt eronder, wat zijn de eisen en welke drie stappen zet u vandaag? Een praktische uitleg zonder juridisch jargon.',
    metaKeywords: [
      'European Accessibility Act',
      'EAA',
      'EAA Nederland',
      'digitale toegankelijkheid',
      'WCAG 2.2',
      'toegankelijkheid website',
      'EAA verplichting',
    ],
    category: 'EAA',
    tags: ['EAA', 'WCAG', 'compliance', 'digitale toegankelijkheid'],
    publishedAt: new Date('2026-06-12T09:00:00Z'),
    content: `
<p>Een jaar geleden was de European Accessibility Act (EAA) voor veel organisaties nog een stip op de horizon. Dat is voorbij: sinds 28 juni 2025 is de wet van kracht in alle EU-lidstaten, en daarmee is digitale toegankelijkheid geen ambitie meer maar een wettelijke verplichting. Toch merken wij in gesprekken met gemeentes, onderwijsinstellingen en bedrijven dat er nog veel onduidelijkheid is over wat dit concreet betekent. Daarom op een rij: wie valt eronder, wat wordt er geëist, en wat doet u vandaag?</p>

<h2>Wie valt onder de EAA?</h2>

<p>De EAA is breder dan veel organisaties denken. Waar eerdere wetgeving zich vooral richtte op overheidswebsites, geldt de EAA juist voor private dienstverlening aan consumenten. Denk aan:</p>

<ul>
  <li><strong>Webshops en e-commerce</strong> — van productpagina tot afrekenproces;</li>
  <li><strong>Banken en financiële dienstverleners</strong> — internetbankieren, betaalomgevingen;</li>
  <li><strong>Vervoersdiensten</strong> — ticketverkoop, reisplanners, boekingsplatforms;</li>
  <li><strong>Telecom en streaming</strong> — klantportalen, mediadiensten, e-books;</li>
  <li><strong>Onderwijs en zorg</strong> — voor zover zij digitale diensten aan consumenten aanbieden, zoals aanmeldportalen of webshops.</li>
</ul>

<p>Er is één uitzondering: micro-ondernemingen met minder dan tien medewerkers én een jaaromzet onder de twee miljoen euro zijn vrijgesteld. Voor vrijwel alle andere organisaties geldt: de verplichting is er, ook als u buiten de EU gevestigd bent maar wel EU-consumenten bedient.</p>

<p>Overheidsorganisaties vielen overigens al langer onder eigen wetgeving (in Nederland het Besluit digitale toegankelijkheid overheid). Voor hen verandert de EAA weinig aan de norm, maar wel aan de context: de maatschappelijke en politieke aandacht voor toegankelijkheid neemt zichtbaar toe.</p>

<h2>Wat wordt er concreet geëist?</h2>

<p>De EAA verwijst naar de Europese norm EN 301 549, die voor websites en apps in de praktijk neerkomt op <strong>WCAG 2.1 niveau AA</strong>. Dat betekent onder meer:</p>

<ul>
  <li>Voldoende kleurcontrast tussen tekst en achtergrond;</li>
  <li>Volledige bedienbaarheid met het toetsenbord, zonder muis;</li>
  <li>Correcte koppenstructuur en betekenisvolle alternatieve teksten bij afbeeldingen;</li>
  <li>Formulieren met duidelijke labels en begrijpelijke foutmeldingen;</li>
  <li>Video&apos;s met ondertiteling en content die begrijpelijk blijft bij 200% zoom.</li>
</ul>

<p>Belangrijk om te weten: toegankelijkheid is geen eenmalige checkbox. Elke nieuwe pagina, elke redesign en elke contentupdate kan nieuwe barrières introduceren. Toezichthouders kijken daarom niet alleen naar hoe uw website er vandaag voor staat, maar ook naar of u een proces heeft om toegankelijkheid te bewaken.</p>

<h2>Wat is het risico als u niets doet?</h2>

<p>Handhaving verschilt per lidstaat, maar de richting is overal hetzelfde: toezichthouders kunnen onderzoeken instellen, herstelmaatregelen eisen en boetes opleggen. Minstens zo relevant is het indirecte risico. Klachten van gebruikers, negatieve publiciteit en vragen van opdrachtgevers of inkopers komen in de praktijk eerder dan een formele sanctie — en juist daar wilt u een onderbouwd antwoord klaar hebben.</p>

<h2>Drie stappen om vandaag te zetten</h2>

<ol>
  <li><strong>Doe een nulmeting.</strong> U kunt niet verbeteren wat u niet meet. Een geautomatiseerde scan laat binnen minuten zien waar de grootste barrières zitten en hoe uw site scoort ten opzichte van de norm.</li>
  <li><strong>Prioriteer de kritieke bevindingen.</strong> Niet elke bevinding is even urgent. Begin bij barrières die gebruikers daadwerkelijk blokkeren: ontoegankelijke formulieren, ontbrekende focus-indicatoren, onvoldoende contrast in de hoofdnavigatie.</li>
  <li><strong>Richt continue monitoring in.</strong> Een audit is een momentopname. Met automatische monitoring weet u het direct als een nieuwe release of contentwijziging een barrière introduceert — vóórdat een gebruiker of toezichthouder het meldt.</li>
</ol>

<h2>Hoe VexNexa hierbij helpt</h2>

<p>VexNexa scant uw website automatisch op WCAG 2.2 en genereert een volledig auditrapport — inclusief Lighthouse-scores, SEO-analyse en kleurenblindheidssimulatie — dat u direct kunt gebruiken richting bestuur, opdrachtgever of toezichthouder. <a href="/auth/register">Start een gratis scan</a> en zie binnen enkele minuten waar u staat.</p>
`,
  },
  {
    slug: 'waarom-axe-core-niet-genoeg-is-voor-wcag-audit-nl',
    locale: 'nl',
    title: 'Waarom axe-core niet genoeg is voor een volledige WCAG-audit',
    excerpt:
      'Rule-based scanners zoals axe-core zijn een uitstekende basis, maar ze zien lang niet alles. Dit is wat geautomatiseerde regels structureel missen — en hoe je dat gat dicht.',
    metaTitle: 'Waarom axe-core niet genoeg is voor een volledige WCAG-audit | VexNexa',
    metaDescription:
      'axe-core vindt veel, maar lang niet alle toegankelijkheidsbarrières. Lees wat rule-based scanners structureel missen en hoe visuele AI-analyse het verschil maakt.',
    metaKeywords: [
      'axe-core',
      'WCAG audit',
      'geautomatiseerd toegankelijkheidsonderzoek',
      'accessibility testing',
      'WCAG 2.2',
      'toegankelijkheid scanner',
    ],
    category: 'WCAG 2.2',
    tags: ['WCAG', 'axe-core', 'testing', 'developers', 'agencies'],
    publishedAt: new Date('2026-06-12T09:05:00Z'),
    content: `
<p>Als je als developer of agency met toegankelijkheid bezig bent, ken je axe-core. De open-source engine van Deque is de de-factostandaard voor geautomatiseerd toegankelijkheidsonderzoek en zit verwerkt in talloze tools — van browser-extensies tot CI-pipelines. Terecht: axe-core is snel, betrouwbaar en vrijwel vrij van false positives.</p>

<p>Maar er is een misverstand dat hardnekkig blijft bestaan: dat een schone axe-rapportage betekent dat je website toegankelijk is. Dat is niet zo, en axe-core claimt dat zelf ook nergens. Het is belangrijk om te begrijpen waarom.</p>

<h2>Wat rule-based scanners goed kunnen</h2>

<p>Een rule-based scanner controleert wat programmatisch vaststelbaar is in de DOM. Ontbreekt er een <code>alt</code>-attribuut? Heeft een formulier­veld een label? Is het kleurcontrast tussen tekst en achtergrond berekenbaar onder de drempel? Dat soort controles doet axe-core foutloos en op schaal — en daarmee vang je een belangrijk deel van de meest voorkomende barrières af.</p>

<h2>Wat ze structureel missen</h2>

<p>Het probleem zit in de WCAG-criteria die menselijke of visuele interpretatie vragen. Een paar voorbeelden uit de praktijk:</p>

<ul>
  <li><strong>Betekenisloze alt-teksten.</strong> Een afbeelding met <code>alt="afbeelding123.jpg"</code> passeert de regel &quot;alt-attribuut aanwezig&quot; — terwijl de tekst voor een schermlezergebruiker waardeloos is.</li>
  <li><strong>Visuele volgorde versus DOM-volgorde.</strong> Een layout die er visueel logisch uitziet maar in de DOM een andere volgorde heeft, is voor toetsenbord- en schermlezergebruikers desoriënterend. Een regel ziet dat niet; een visuele analyse wel.</li>
  <li><strong>Informatie die alleen via kleur wordt overgebracht.</strong> &quot;De verplichte velden zijn rood gemarkeerd&quot; — geen enkele DOM-regel detecteert dat de betekenis verloren gaat voor wie kleuren niet kan onderscheiden.</li>
  <li><strong>Interactielogica.</strong> Een dropdown die technisch focusbaar is maar bij openen de focus kwijtraakt, een modal die je met het toetsenbord niet meer uitkomt, een carrousel die automatisch doordraait — dit soort barrières ontstaan pas tijdens interactie en zijn met statische regels nauwelijks te vangen.</li>
  <li><strong>Contrast in echte rendering.</strong> Tekst over een afbeelding of gradient heeft geen berekenbare achtergrondkleur. De regel slaat de check dan over — precies op de plekken waar contrastproblemen het vaakst voorkomen.</li>
</ul>

<p>Ook Deque zelf is hier transparant over: geautomatiseerde regels dekken een deel van de WCAG-criteria, niet het geheel. De rest vereist beoordeling — door een mens, of door tooling die verder kijkt dan de DOM.</p>

<h2>Hoe je het gat dichtmaakt</h2>

<p>De klassieke oplossing is een handmatige audit naast de scanner. Dat werkt, maar is duur en een momentopname: drie releases later is het rapport verouderd.</p>

<p>VexNexa kiest een andere route. Bovenop de rule-based laag draait onze <strong>AI-Vision-analyse</strong>, die de gerenderde pagina visueel beoordeelt: zijn alt-teksten betekenisvol in hun context, klopt de visuele hiërarchie met de structuur, blijft informatie overeind zonder kleur, is de focus-indicator daadwerkelijk zichtbaar? In onze vergelijkingen levert die combinatie consistent aanzienlijk meer relevante bevindingen op dan rule-based scanning alleen — bevindingen die anders pas in een handmatige audit (of een klacht van een gebruiker) naar boven waren gekomen.</p>

<h2>Conclusie</h2>

<p>Blijf axe-core gebruiken — in je CI-pipeline, tijdens development, als eerste vangnet. Maar presenteer een schone scan nooit als bewijs van compliance. Voor een audit die ook de visuele en interactieve werkelijkheid meeneemt, heb je meer nodig. <a href="/sample-report">Bekijk een volledig voorbeeldrapport</a> om het verschil zelf te zien.</p>
`,
  },
  {
    slug: 'toegankelijkheidsverklaring-up-to-date-gemeentes-2026-nl',
    locale: 'nl',
    title: 'Hoe gemeentes hun toegankelijkheidsverklaring up-to-date houden in 2026',
    excerpt:
      'Een verouderde toegankelijkheidsverklaring is een van de meest voorkomende — en meest vermijdbare — compliance-problemen bij gemeentes. Zo houdt u de verklaring actueel zonder elk jaar een dure externe audit.',
    metaTitle: 'Toegankelijkheidsverklaring actueel houden: gids voor gemeentes (2026) | VexNexa',
    metaDescription:
      'Hoe houdt uw gemeente de toegankelijkheidsverklaring actueel in 2026? Praktische aanpak: wat is verplicht, waar gaat het mis en hoe automatiseert u het onderzoek.',
    metaKeywords: [
      'toegankelijkheidsverklaring',
      'gemeente digitale toegankelijkheid',
      'DigiToegankelijk',
      'Besluit digitale toegankelijkheid overheid',
      'WCAG gemeente',
      'toegankelijkheidsregister',
    ],
    category: 'Overheid',
    tags: ['overheid', 'gemeentes', 'toegankelijkheidsverklaring', 'WCAG', 'compliance'],
    publishedAt: new Date('2026-06-12T09:10:00Z'),
    content: `
<p>Elke Nederlandse gemeente heeft er een: de toegankelijkheidsverklaring. Verplicht sinds het Besluit digitale toegankelijkheid overheid, openbaar vindbaar in het register, voorzien van een nalevingsstatus van A tot en met E. En toch is precies dit document bij veel gemeentes het zwakste punt in het compliance-dossier — niet omdat er niets gebeurd is, maar omdat de verklaring niet meer klopt met de werkelijkheid.</p>

<h2>Wat er precies verplicht is</h2>

<p>De kern van de verplichting is simpel: elke website en app van een overheidsorganisatie moet een toegankelijkheidsverklaring hebben die gebaseerd is op <strong>actueel onderzoek</strong>. De verklaring vermeldt welke WCAG-criteria nog niet gehaald worden, welke maatregelen gepland zijn en wanneer. Verouderd onderzoek betekent in de praktijk een lagere status in het register — zichtbaar voor iedereen, inclusief raadsleden, journalisten en belangenorganisaties die er met enige regelmaat overzichten van publiceren.</p>

<h2>Waar het misgaat</h2>

<p>In de verklaringen die wij analyseren zien we drie terugkerende patronen:</p>

<h3>1. De website is vernieuwd, de verklaring niet</h3>

<p>Een redesign of migratie is hét moment waarop een verklaring veroudert. Het onderzoek waarop de verklaring rust, beschrijft een website die niet meer bestaat. Nieuwe templates introduceren nieuwe barrières, opgeloste problemen staan nog als openstaand vermeld — en formeel zegt de verklaring dus niets meer over de huidige situatie.</p>

<h3>2. Subdomeinen worden vergeten</h3>

<p>De hoofdwebsite is onderzocht, maar het meldingenportaal, het raadsinformatiesysteem, de afsprakenmodule en het parkeerloket draaien op aparte subdomeinen of bij externe leveranciers. Ook die vallen onder de verplichting. Juist deze portalen — waar inwoners daadwerkelijk iets moeten <em>doen</em> — zijn het vaakst ontoegankelijk en het minst vaak onderzocht.</p>

<h3>3. Het onderzoek is een momentopname</h3>

<p>Een handmatig onderzoek kost al snel duizenden euro&apos;s en beschrijft de situatie van één dag. Daarna publiceert de redactie wekelijks nieuwe pagina&apos;s, plaatst documenten en past templates aan. Zonder tussentijdse controle groeit het gat tussen verklaring en werkelijkheid elke week.</p>

<h2>Een werkbare aanpak voor 2026</h2>

<p>Goed nieuws: de verklaring actueel houden hoeft geen jaarlijks project te zijn. Een aanpak die wij bij gemeentes goed zien werken:</p>

<ol>
  <li><strong>Breng het volledige digitale landschap in kaart.</strong> Inventariseer alle domeinen en subdomeinen, inclusief portalen van leveranciers. Dit overzicht is de basis van elke verklaring — en vaak al een eye-opener.</li>
  <li><strong>Automatiseer het doorlopende onderzoek.</strong> Laat elke site periodiek automatisch scannen op WCAG 2.2. Zo signaleert u nieuwe barrières binnen dagen in plaats van bij de volgende audit, en bouwt u doorlopend bewijs op dat u de toegankelijkheid bewaakt.</li>
  <li><strong>Reserveer handmatig onderzoek voor wat automatisch niet kan.</strong> Combineer de automatische monitoring met een gerichte handmatige steekproef op de belangrijkste taakprocessen (melding doen, afspraak maken, document aanvragen). Zo besteedt u het budget waar het verschil maakt.</li>
  <li><strong>Actualiseer de verklaring op basis van de monitoringdata.</strong> Met actuele scanresultaten per domein is het bijwerken van de verklaring geen onderzoeksproject meer, maar een administratieve handeling van een middag.</li>
</ol>

<h2>Wat dit oplevert</h2>

<p>Een actuele verklaring met onderbouwing is meer dan een vinkje. Het is het verschil tussen reactief verantwoorden wanneer er een klacht of raadsvraag komt, en proactief kunnen laten zien dat toegankelijkheid structureel geborgd is. Bovendien: hoe eerder een barrière gesignaleerd wordt, hoe goedkoper het herstel.</p>

<p>VexNexa genereert per domein een volledig auditrapport — WCAG 2.2, Lighthouse, kleurenblindheidsanalyse — en monitort doorlopend op nieuwe barrières. Het rapport sluit direct aan op de structuur van de toegankelijkheidsverklaring. <a href="/auth/register">Vraag een gratis scan aan</a> van uw hoofdwebsite en zie binnen enkele minuten waar uw gemeente staat.</p>
`,
  },
];

async function main() {
  // Find an admin user to use as author
  const admin = await prisma.user.findFirst({
    where: {
      email: { in: ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'] },
    },
    select: { id: true, email: true },
  });

  if (!admin) {
    console.error('No admin user found. Cannot create blog posts without an author.');
    process.exit(1);
  }

  for (const post of POSTS) {
    const existing = await prisma.blogPost.findFirst({
      where: { slug: post.slug, locale: post.locale },
    });

    const data = {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      metaKeywords: post.metaKeywords,
      category: post.category,
      tags: post.tags,
      status: 'published',
      publishedAt: post.publishedAt,
      authorName: 'Jeffrey',
    };

    if (existing) {
      await prisma.blogPost.update({ where: { id: existing.id }, data });
      console.log(`Updated: ${post.slug} (id: ${existing.id})`);
    } else {
      const created = await prisma.blogPost.create({
        data: { ...data, slug: post.slug, locale: post.locale, authorId: admin.id },
      });
      console.log(`Created: ${post.slug} (id: ${created.id})`);
    }

    const baseSlug = post.slug.replace(/-nl$/, '');
    console.log(`URL: https://vexnexa.com/blog/${baseSlug}`);
  }
}

main()
  .catch((e) => {
    console.error('Failed to seed blog posts:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
