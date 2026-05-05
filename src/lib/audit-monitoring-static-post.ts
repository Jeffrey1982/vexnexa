import type { Metadata } from 'next'
import type { BlogSeoLocale } from '@/lib/blog-seo'
import { BLOG_SEO_LOCALES, getBlogPublicUrl } from '@/lib/blog-seo'

export const AUDIT_MONITORING_2026_SLUG = 'waarom-eenmalige-toegankelijkheidsaudits-2026'

type ImageCallout = {
  prompt: string
  alt: string
}

type ArticleSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
  image?: ImageCallout
}

export type AuditMonitoringPost = {
  slug: string
  locale: BlogSeoLocale
  title: string
  metaTitle: string
  metaDescription: string
  badge: string
  intro: string
  readTime: string
  sections: ArticleSection[]
  checklistTitle: string
  checklist: Array<{ phase: string; items: string[] }>
  sourcesTitle: string
  ctaTitle: string
  ctaText: string
}

export const auditMonitoringSources = [
  {
    label: 'ADA.gov - Title II web and mobile accessibility regulations',
    href: 'https://www.ada.gov/law-and-regs/regulations/title-ii-2010-regulations/',
  },
  {
    label: 'ADA.gov - First steps toward complying with the Title II web rule',
    href: 'https://www.ada.gov/resources/web-rule-first-steps/',
  },
  {
    label: 'European Commission - The EU becomes more accessible for all',
    href: 'https://digital-strategy.ec.europa.eu/en/news/eu-becomes-more-accessible-all',
  },
  {
    label: 'ACM ConsuWijzer - Toegankelijkheid van webwinkels en communicatiediensten',
    href: 'https://consument.acm.nl/toegankelijkheid/toegankelijkheid-van-webwinkels-en-communicatiediensten',
  },
]

const nlSections: ArticleSection[] = [
  {
    heading: '2026 is het kantelpunt',
    paragraphs: [
      'Digitale toegankelijkheid is jarenlang behandeld als iets dat je “ook nog even” liet controleren vlak voor livegang. Een externe specialist deed een WCAG-audit, het rapport ging naar IT of UX, een deel van de bevindingen werd opgepakt en daarna verdween toegankelijkheid weer naar de achtergrond. Voor veel organisaties was dat niet ideaal, maar het voelde werkbaar.',
      'In 2026 is die aanpak steeds minder houdbaar. WCAG is niet langer alleen een kwaliteitskader voor goede digitale dienstverlening. In de Verenigde Staten verwijst ADA Title II voor web en mobiele apps expliciet naar WCAG 2.1 AA. In Europa is de European Accessibility Act sinds 28 juni 2025 van toepassing op belangrijke producten en diensten, waaronder e-commerce, consumentenbankieren, e-books, communicatiediensten en delen van vervoer. In Nederland ziet de ACM toe op onder meer webwinkels en communicatiediensten.',
      'Voor universiteiten, hogescholen, uitvoeringsorganisaties, gemeenten, zorggerelateerde instellingen en semipublieke dienstverleners betekent dit: een audit is nog steeds nodig, maar niet meer genoeg. Je moet kunnen laten zien dat toegankelijkheid structureel wordt beheerd.',
    ],
    image: {
      prompt:
        'Abstracte headerafbeelding van een webinterface met toegankelijkheidsiconen, hoogcontrastgrafieken en een checklist op een rustige zakelijke achtergrond.',
      alt: 'Abstract dashboard met toegankelijkheidsiconen, grafieken en een checklist.',
    },
  },
  {
    heading: 'Wat juridisch verandert, zonder juridisch moeras',
    paragraphs: [
      'De kern is eenvoudig: digitale diensten worden steeds vaker beoordeeld als volwaardige toegangspoorten tot onderwijs, overheid, zorg, vervoer, werk en commerciële dienstverlening. Als een formulier, login, betaalstap of studentenportaal niet toegankelijk is, is dat geen klein UI-probleem. Het kan betekenen dat iemand niet zelfstandig kan deelnemen.',
      'ADA Title II richt zich op Amerikaanse state and local governments en hun digitale content en apps. De relevante compliance-deadlines liggen op 24 april 2026 voor grotere publieke entiteiten en 26 april 2027 voor kleinere entiteiten en special district governments. Belangrijker dan de datumdiscussie is de technische norm: WCAG 2.1 Level AA is de referentie in de regel. Ook vóór de deadlines blijven bredere ADA-verplichtingen rond effectieve communicatie en gelijke toegang bestaan.',
      'De EAA werkt anders, maar de richting is vergelijkbaar. De wet geldt vanaf 28 juni 2025 voor een reeks producten en diensten in de EU. Denk aan webwinkels, ticketing, bankdiensten, e-books, elektronische communicatiediensten en digitale klantreizen waarin iemand een overeenkomst sluit, betaalt, reserveert of communiceert. ACM ConsuWijzer legt bijvoorbeeld uit dat zoeken, kiezen, bestellen, inloggen en betalen toegankelijk moeten zijn bij webwinkels.',
      'Voor organisaties in Nederland en de EU is de praktische les: toezichthouders kijken vooral naar functionele gebruikersreizen. Een homepage met goede contrastwaarden helpt, maar een ontoegankelijke inschrijving, tentamenaanmelding, betaalpagina of supportflow is veel kritischer.',
    ],
    image: {
      prompt:
        'Eenvoudige tijdlijn met drie stappen: nu audit en inventarisatie, 2026-2027 deadlines en implementatie, na 2027 striktere handhaving en bewijsvoering.',
      alt: 'Tijdlijn van audit nu, deadlines in 2026-2027 en strengere handhaving daarna.',
    },
  },
  {
    heading: 'Waarom eenmalige audits in de praktijk falen',
    paragraphs: [
      'Het klassieke patroon zie je in veel organisaties. Er komt een grote audit. Het rapport is degelijk, soms zelfs uitstekend. Er staan tientallen of honderden bevindingen in, geordend per WCAG-succescriterium. Daarna begint de echte werkelijkheid: productteams hebben releases, redacties plaatsen nieuwe content, leveranciers leveren componenten aan, ontwikkelaars wisselen van project en een redesign verandert de frontend.',
      'Zes maanden later zijn sommige oorspronkelijke bevindingen opgelost, maar dezelfde type issues verschijnen opnieuw. Een knop zonder toegankelijke naam. Een modal zonder goed focusmanagement. Nieuwe PDF’s zonder structuur. Een formulier met foutmeldingen die niet door schermlezers worden aangekondigd. Niet omdat teams onverschillig zijn, maar omdat toegankelijkheid niet in het proces zit.',
      'Een eenmalige audit geeft je een momentopname. Die momentopname is waardevol als nulmeting, maar hij bewijst niet dat je daarna onder controle blijft. Bij een klacht, intern onderzoek of toezichthoudervraag wil je kunnen laten zien wat je hebt gedaan, wat je prioriteert, welke risico’s bekend zijn en hoe regressies worden opgespoord.',
    ],
    image: {
      prompt:
        'Cartoonachtige zakelijke illustratie met links een stoffig auditrapport op een plank en rechts een live accessibility dashboard met meldingen.',
      alt: 'Vergelijking tussen een oud auditrapport en een live toegankelijkheidsdashboard.',
    },
  },
  {
    heading: 'Hoe een professionele audit er in 2026 uitziet',
    paragraphs: [
      'Een moderne audit begint niet met “scan de website”. Hij begint met scope. Welke websites, apps, portalen, formulieren en documenten zijn essentieel? Welke reizen zijn kritisch voor gebruikers? In het onderwijs zijn dat bijvoorbeeld aanmelden, inloggen, rooster bekijken, vakinformatie lezen, tentamenvoorzieningen aanvragen, betalen en contact opnemen met support.',
      'Daarna combineer je automatische scans met handmatige review. Automatische tools zijn goed in veel technische patronen: ontbrekende labels, contrastproblemen, ARIA-fouten, headingstructuur, formulierrelaties en een deel van keyboard issues. Maar ze zien niet alles. Een mens moet toetsenbordgebruik, schermlezergedrag, vergroting, mobiele interactie, begrijpelijkheid en proceslogica beoordelen.',
      'De output moet meer zijn dan een lijst met fouten. Een bruikbaar auditrapport bevat een WCAG-matrix, prioriteiten per gebruikersimpact, voorbeelden uit echte journeys, screenshots of selectors, advies voor componenten, mapping naar EN 301 549 waar relevant en een samenvatting voor bestuur, compliance en productteams.',
    ],
    bullets: [
      'Scope op domeinen, apps en kritieke user journeys.',
      'Combinatie van automated testing en expert review.',
      'Testen met toetsenbord, schermlezer, zoom en mobiele interactie.',
      'Prioriteiten op impact, niet alleen op aantallen issues.',
    ],
    image: {
      prompt:
        'Close-up van een fictief WCAG-auditrapport met gekleurde prioriteitslabels, WCAG-matrix en actiepunten voor teams.',
      alt: 'Fictief WCAG-auditrapport met prioriteiten, matrix en actiepunten.',
    },
  },
  {
    heading: 'Van audit naar continuous monitoring',
    paragraphs: [
      'De audit is de baseline. Daarna heb je een laag nodig die nieuwe problemen zichtbaar maakt. Vergelijk het met security scanning of performance monitoring. Je doet niet één keer per jaar een pentest en verder niets. Je monitort dependencies, releases, afwijkingen en incidenten. Voor toegankelijkheid zou hetzelfde moeten gelden.',
      'Een accessibility monitoring layer kijkt periodiek naar belangrijke pagina’s en journeys. Hij signaleert regressies, bewaakt scores en maakt trends zichtbaar. Dat betekent niet dat software menselijke audits vervangt. Het betekent dat teams sneller zien waar iets stukgaat en niet hoeven te wachten tot de volgende grote audit.',
      'In de praktijk werkt dit vooral goed wanneer monitoring is gekoppeld aan releaseprocessen. Nieuwe componenten worden getest voordat ze breed worden uitgerold. Belangrijke templates worden na elke release opnieuw gecontroleerd. Product owners zien welke issues terugkomen. Compliance krijgt periodieke voortgang in plaats van losse rapporten.',
    ],
    image: {
      prompt:
        'Dashboardachtige visual met toegankelijkheidsscore over tijd, regressie-alerts en een lijst met kritieke journeys.',
      alt: 'Toegankelijkheidsdashboard met scoretrend, regressies en kritieke journeys.',
    },
  },
  {
    heading: 'Governance en bewijsvoering',
    paragraphs: [
      'Toegankelijkheid faalt zelden door één persoon. Het faalt meestal door onduidelijk eigenaarschap. IT denkt dat UX het bewaakt. UX denkt dat development het oplost. Development denkt dat compliance prioriteert. Compliance heeft geen zicht op de backlog. Ondertussen publiceert communicatie nieuwe content.',
      'Een volwassen aanpak benoemt eigenaarschap per laag: beleid, design system, codebase, content, inkoop en incidentafhandeling. Niet iedereen hoeft WCAG-specialist te zijn, maar iedereen moet weten wanneer toegankelijkheid relevant is en waar signalen landen.',
      'Bewijsvoering hoeft niet zwaar te beginnen. Een toegankelijkheidsbeleid, een backlog met issues, besluiten over prioriteiten, periodieke rapportages en releasechecks zijn al veel sterker dan een los rapport van vorig jaar. In geval van een klacht kun je dan laten zien dat je redelijk en proportioneel handelt: je kent de risico’s, pakt kritieke journeys eerst op en borgt verbetering in processen.',
    ],
    bullets: [
      'Maak één eigenaar verantwoordelijk voor coördinatie, niet voor alle fixes.',
      'Leg uitzonderingen en prioriteiten vast met reden en datum.',
      'Koppel toegankelijkheidsissues aan dezelfde backlog als productwerk.',
      'Rapporteer periodiek aan IT, UX, compliance en management.',
    ],
    image: {
      prompt:
        'Illustratie van een teamworkshop met sticky notes en een groot scherm waarop een accessibility dashboard staat.',
      alt: 'Teamworkshop rond een toegankelijkheidsdashboard en prioriteitenbord.',
    },
  },
]

const checklist = [
  {
    phase: '0-3 maanden: nulmeting en kritieke flows',
    items: [
      'Inventariseer websites, apps, portalen en documenten.',
      'Audit de belangrijkste gebruikersreizen.',
      'Los blokkades in login, formulieren, betalen en support eerst op.',
      'Maak een centrale backlog met eigenaar en prioriteit.',
    ],
  },
  {
    phase: '3-6 maanden: monitoring en componenten',
    items: [
      'Zet periodieke scans en releasechecks op.',
      'Schoon de component library op: knoppen, modals, formulieren, navigatie.',
      'Maak rapportage zichtbaar voor IT, UX en compliance.',
      'Leg afspraken vast met leveranciers en redactieteams.',
    ],
  },
  {
    phase: '6-12 maanden: borging en her-audit',
    items: [
      'Train designers, developers, redacteuren en product owners.',
      'Neem toegankelijkheid op in Definition of Done en acceptatiecriteria.',
      'Plan gerichte her-audits op kritieke journeys.',
      'Rapporteer voortgang aan management en governance-overleggen.',
    ],
  },
]

const localizedSections: Record<Exclude<BlogSeoLocale, 'nl'>, ArticleSection[]> = {
  en: [
    {
      heading: '2026 is the turning point',
      paragraphs: [
        'For years, digital accessibility was treated as a project checkpoint: run a WCAG audit before launch, fix a number of issues, and move on. In 2026 that approach is too fragile. Accessibility is becoming a compliance and governance discipline, not just a quality review.',
        'ADA Title II now points public entities to WCAG 2.1 Level AA for web content and mobile apps, with compliance dates in 2026 and 2027 depending on entity size. In Europe, the European Accessibility Act has applied since 28 June 2025 to key products and services such as e-commerce, banking, e-books, communications, and parts of transport.',
        'The practical lesson for higher education, public bodies, and semi-public organizations is clear: an audit is still necessary, but it is only the baseline. You also need monitoring, ownership, and evidence that accessibility is managed over time.',
      ],
      image: nlSections[0].image,
    },
    {
      heading: 'What is changing legally, without the legal fog',
      paragraphs: [
        'Digital channels are now treated as gateways to education, public services, healthcare, transport, employment, and consumer services. If a login, payment step, enrolment form, or support journey is inaccessible, that is not merely a UX defect. It can block equal participation.',
        'ADA Title II applies to U.S. state and local governments and their web and app services. The relevant technical standard is WCAG 2.1 Level AA. The EAA works differently, but the direction is similar: important digital services must be usable by people with disabilities, especially where users search, choose, order, sign, log in, pay, or communicate.',
        'Regulators are also becoming more visible. In the Netherlands, ACM ConsuWijzer explains that webshops and communication services must be accessible and that problems can be reported. Broken journeys such as checkout, login, booking, and support are therefore especially risky.',
      ],
      image: nlSections[1].image,
    },
    {
      heading: 'Why one-off audits fail in practice',
      paragraphs: [
        'The pattern is familiar: a large audit produces a thick report, teams fix a selection of findings, and six months later the same type of defects return. A new modal traps focus. A new form has unclear errors. A new PDF has no structure. A new component ships without an accessible name.',
        'This usually happens because accessibility is not embedded in the release process. A one-off audit gives you a snapshot; it does not prove that the organization remains in control after new content, new suppliers, new developers, and new design components enter the system.',
        'If a complaint or investigation arrives, you need more than last year’s report. You need to show what you know, what you prioritized, what you fixed, what remains, and how regressions are detected.',
      ],
      image: nlSections[2].image,
    },
    {
      heading: 'What a modern audit looks like in 2026',
      paragraphs: [
        'A professional audit starts with scope: websites, apps, portals, documents, and the user journeys that matter most. In education, that might include enrolment, login, course information, exam accommodations, payments, timetables, and support.',
        'The work combines automated scans with expert review. Automated tools find many technical patterns, but humans still need to test keyboard use, screen reader behaviour, magnification, mobile interaction, understandability, and journey logic.',
        'The output should include a WCAG matrix, impact-based priorities, examples from real journeys, screenshots or selectors, guidance for reusable components, and where relevant a mapping to EN 301 549.',
      ],
      bullets: [
        'Scope domains, apps, documents, and critical user journeys.',
        'Combine automated testing with manual expert review.',
        'Test keyboard, screen reader, zoom, and mobile interaction.',
        'Prioritize by user impact, not just issue count.',
      ],
      image: nlSections[3].image,
    },
    {
      heading: 'From audit to continuous monitoring',
      paragraphs: [
        'The audit is the baseline. After that, organizations need a layer that makes new issues visible. Think of security scanning or performance monitoring: you do not run one annual check and then ignore releases, dependencies, and incidents for the rest of the year.',
        'An accessibility monitoring layer checks important pages and journeys periodically, detects regressions, tracks scores, and shows trends. It does not replace expert audits; it helps teams see problems earlier and act before users or regulators surface them.',
        'Monitoring works best when it is connected to releases. Key templates are tested after deployment, product owners see recurring patterns, and compliance teams receive periodic evidence instead of isolated reports.',
      ],
      image: nlSections[4].image,
    },
    {
      heading: 'Governance and evidence',
      paragraphs: [
        'Accessibility often fails because ownership is unclear. IT expects UX to watch it. UX expects development to fix it. Development expects compliance to prioritize it. Compliance does not see the backlog. Meanwhile, content teams keep publishing.',
        'A mature approach defines ownership across policy, design systems, code, content, procurement, and incident handling. Not everyone needs to be a WCAG specialist, but everyone should know when accessibility matters and where signals go.',
        'Evidence does not need to start heavy. A policy, an issue backlog, prioritization decisions, release checks, and periodic reports already show that the organization is acting reasonably and proportionally.',
      ],
      bullets: [
        'Assign one coordinator for governance, not every fix.',
        'Document exceptions and priorities with date and rationale.',
        'Track accessibility issues in the same backlog as product work.',
        'Report periodically to IT, UX, compliance, and leadership.',
      ],
      image: nlSections[5].image,
    },
  ],
  fr: [],
  es: [],
  pt: [],
}

localizedSections.fr = localizedSections.en.map((section) => ({
  ...section,
  heading: section.heading
    .replace('2026 is the turning point', '2026 est le point de bascule')
    .replace('What is changing legally, without the legal fog', 'Ce qui change juridiquement, sans brouillard juridique')
    .replace('Why one-off audits fail in practice', 'Pourquoi les audits ponctuels échouent en pratique')
    .replace('What a modern audit looks like in 2026', 'À quoi ressemble un audit moderne en 2026')
    .replace('From audit to continuous monitoring', 'De l’audit au monitoring continu')
    .replace('Governance and evidence', 'Gouvernance et preuves'),
  paragraphs: section.paragraphs.map((paragraph) =>
    paragraph
      .replace('For years, digital accessibility was treated as a project checkpoint: run a WCAG audit before launch, fix a number of issues, and move on. In 2026 that approach is too fragile. Accessibility is becoming a compliance and governance discipline, not just a quality review.', 'Pendant des années, l’accessibilité numérique a été traitée comme un point de contrôle projet : réaliser un audit WCAG avant la mise en ligne, corriger une partie des problèmes, puis passer à autre chose. En 2026, cette approche est trop fragile. L’accessibilité devient une discipline de conformité et de gouvernance, pas seulement une revue qualité.')
      .replace('The practical lesson for higher education, public bodies, and semi-public organizations is clear: an audit is still necessary, but it is only the baseline. You also need monitoring, ownership, and evidence that accessibility is managed over time.', 'La leçon pratique pour l’enseignement supérieur, les organismes publics et les organisations parapubliques est claire : l’audit reste nécessaire, mais il ne constitue que la baseline. Il faut aussi du monitoring, des responsabilités claires et des preuves que l’accessibilité est pilotée dans le temps.')
  ),
}))

localizedSections.es = localizedSections.en.map((section) => ({
  ...section,
  heading: section.heading
    .replace('2026 is the turning point', '2026 es el punto de inflexión')
    .replace('What is changing legally, without the legal fog', 'Qué cambia legalmente, sin niebla jurídica')
    .replace('Why one-off audits fail in practice', 'Por qué las auditorías puntuales fallan en la práctica')
    .replace('What a modern audit looks like in 2026', 'Cómo es una auditoría moderna en 2026')
    .replace('From audit to continuous monitoring', 'De auditoría a monitorización continua')
    .replace('Governance and evidence', 'Gobernanza y evidencia'),
}))

localizedSections.pt = localizedSections.en.map((section) => ({
  ...section,
  heading: section.heading
    .replace('2026 is the turning point', '2026 é o ponto de viragem')
    .replace('What is changing legally, without the legal fog', 'O que muda legalmente, sem nevoeiro jurídico')
    .replace('Why one-off audits fail in practice', 'Porque auditorias pontuais falham na prática')
    .replace('What a modern audit looks like in 2026', 'Como é uma auditoria moderna em 2026')
    .replace('From audit to continuous monitoring', 'Da auditoria à monitorização contínua')
    .replace('Governance and evidence', 'Governança e evidência'),
}))

function getChecklist(locale: BlogSeoLocale) {
  if (locale === 'nl') return checklist

  return [
    {
      phase:
        locale === 'fr'
          ? '0-3 mois : baseline et parcours critiques'
          : locale === 'es'
            ? '0-3 meses: línea base y journeys críticos'
            : locale === 'pt'
              ? '0-3 meses: baseline e jornadas críticas'
              : '0-3 months: baseline and critical journeys',
      items:
        locale === 'fr'
          ? ['Inventorier les sites, apps, portails et documents.', 'Auditer les parcours utilisateur essentiels.', 'Corriger d’abord login, formulaires, paiement et support.', 'Créer un backlog central avec responsable et priorité.']
          : locale === 'es'
            ? ['Inventariar sitios, apps, portales y documentos.', 'Auditar los journeys esenciales.', 'Corregir primero login, formularios, pago y soporte.', 'Crear un backlog central con responsable y prioridad.']
            : locale === 'pt'
              ? ['Inventariar sites, apps, portais e documentos.', 'Auditar as jornadas essenciais.', 'Corrigir primeiro login, formulários, pagamento e suporte.', 'Criar um backlog central com responsável e prioridade.']
              : ['Inventory websites, apps, portals, and documents.', 'Audit the most important user journeys.', 'Fix blockers in login, forms, payments, and support first.', 'Create a central backlog with owner and priority.'],
    },
    {
      phase:
        locale === 'fr'
          ? '3-6 mois : monitoring et composants'
          : locale === 'es'
            ? '3-6 meses: monitorización y componentes'
            : locale === 'pt'
              ? '3-6 meses: monitorização e componentes'
              : '3-6 months: monitoring and components',
      items:
        locale === 'fr'
          ? ['Mettre en place des scans périodiques et des contrôles de release.', 'Nettoyer la bibliothèque de composants.', 'Rendre le reporting visible pour IT, UX et compliance.', 'Formaliser les accords avec fournisseurs et équipes contenu.']
          : locale === 'es'
            ? ['Configurar scans periódicos y checks de release.', 'Limpiar la biblioteca de componentes.', 'Hacer visible el reporting para IT, UX y compliance.', 'Documentar acuerdos con proveedores y contenido.']
            : locale === 'pt'
              ? ['Configurar scans periódicos e checks de release.', 'Limpar a biblioteca de componentes.', 'Tornar o reporting visível para IT, UX e compliance.', 'Documentar acordos com fornecedores e conteúdo.']
              : ['Set up periodic scans and release checks.', 'Clean up the component library.', 'Make reporting visible to IT, UX, and compliance.', 'Document agreements with suppliers and content teams.'],
    },
    {
      phase:
        locale === 'fr'
          ? '6-12 mois : intégration et ré-audit'
          : locale === 'es'
            ? '6-12 meses: integración y re-auditoría'
            : locale === 'pt'
              ? '6-12 meses: integração e reauditoria'
              : '6-12 months: embedding and re-audit',
      items:
        locale === 'fr'
          ? ['Former designers, développeurs, rédacteurs et product owners.', 'Ajouter l’accessibilité à la Definition of Done.', 'Planifier des ré-audits ciblés.', 'Rapporter les progrès aux instances de gouvernance.']
          : locale === 'es'
            ? ['Formar a diseño, desarrollo, contenido y product owners.', 'Añadir accesibilidad a la Definition of Done.', 'Planificar re-auditorías específicas.', 'Reportar progreso a la gobernanza.']
            : locale === 'pt'
              ? ['Formar design, desenvolvimento, conteúdo e product owners.', 'Adicionar acessibilidade à Definition of Done.', 'Planear reauditorias direcionadas.', 'Reportar progresso à governança.']
              : ['Train designers, developers, editors, and product owners.', 'Add accessibility to the Definition of Done.', 'Plan targeted re-audits on critical journeys.', 'Report progress to leadership and governance meetings.'],
    },
  ]
}

function translatedPost(locale: BlogSeoLocale): AuditMonitoringPost {
  const titles = {
    nl: 'Waarom éénmalige toegankelijkheidsaudits in 2026 niet meer genoeg zijn',
    en: 'Why one-off accessibility audits are no longer enough in 2026',
    fr: 'Pourquoi les audits d’accessibilité ponctuels ne suffisent plus en 2026',
    es: 'Por qué las auditorías de accesibilidad puntuales ya no bastan en 2026',
    pt: 'Porque auditorias de acessibilidade pontuais já não bastam em 2026',
  }

  if (locale === 'nl') {
    return {
      slug: AUDIT_MONITORING_2026_SLUG,
      locale,
      title: titles.nl,
      metaTitle: `${titles.nl} - VexNexa`,
      metaDescription:
        'Een praktische gids voor WCAG, ADA Title II, EAA, audits, continuous monitoring en governance voor publieke en semipublieke organisaties.',
      badge: 'Toegankelijkheidsstrategie 2026',
      intro:
        'Een WCAG-audit blijft belangrijk, maar in 2026 heb je meer nodig: een professionele nulmeting, doorlopende monitoring en governance die laat zien dat je structureel werkt aan toegankelijke digitale dienstverlening.',
      readTime: '10 min leestijd',
      sections: nlSections,
      checklistTitle: 'Een 12-maandenplan voor audit, monitoring en governance',
      checklist,
      sourcesTitle: 'Bronnen en verdere context',
      ctaTitle: 'Van momentopname naar structurele controle',
      ctaText:
        'Vergelijk je huidige aanpak met deze stappen. Begin klein: kies je meest kritieke journeys, leg eigenaarschap vast en maak regressies zichtbaar voordat gebruikers of toezichthouders ze vinden.',
    }
  }

  const translations = {
    en: {
      badge: 'Accessibility strategy 2026',
      intro:
        'A WCAG audit still matters, but in 2026 it is no longer enough. Teams need a professional baseline, continuous monitoring, and governance that proves accessibility is managed over time.',
      meta:
        'A practical guide to WCAG, ADA Title II, EAA, audits, continuous monitoring, and governance for public and semi-public organizations.',
      ctaTitle: 'Move from snapshot to control',
      ctaText:
        'Compare your current setup with these steps. Start with your most critical journeys, assign ownership, and make regressions visible before users or regulators find them.',
      readTime: '10 min read',
    },
    fr: {
      badge: 'Stratégie accessibilité 2026',
      intro:
        'Un audit WCAG reste essentiel, mais il ne suffit plus en 2026. Les équipes ont besoin d’une baseline professionnelle, d’un monitoring continu et d’une gouvernance documentée.',
      meta:
        'Guide pratique sur WCAG, ADA Title II, EAA, audits, monitoring continu et gouvernance pour organisations publiques et parapubliques.',
      ctaTitle: 'Passer de l’instantané au pilotage',
      ctaText:
        'Comparez votre approche actuelle avec ces étapes. Commencez par les parcours critiques, clarifiez les responsabilités et rendez les régressions visibles.',
      readTime: '10 min de lecture',
    },
    es: {
      badge: 'Estrategia de accesibilidad 2026',
      intro:
        'Una auditoría WCAG sigue siendo importante, pero en 2026 ya no basta. Los equipos necesitan una línea base profesional, monitorización continua y gobernanza documentada.',
      meta:
        'Guía práctica sobre WCAG, ADA Title II, EAA, auditorías, monitorización continua y gobernanza para organizaciones públicas y semipúblicas.',
      ctaTitle: 'Pasar de una foto puntual al control',
      ctaText:
        'Compara tu enfoque actual con estos pasos. Empieza por los journeys críticos, asigna responsables y haz visibles las regresiones.',
      readTime: '10 min de lectura',
    },
    pt: {
      badge: 'Estratégia de acessibilidade 2026',
      intro:
        'Uma auditoria WCAG continua importante, mas em 2026 já não basta. As equipas precisam de uma baseline profissional, monitorização contínua e governança documentada.',
      meta:
        'Guia prático sobre WCAG, ADA Title II, EAA, auditorias, monitorização contínua e governança para organizações públicas e semipúblicas.',
      ctaTitle: 'Passar de fotografia pontual para controlo',
      ctaText:
        'Compare a sua abordagem atual com estes passos. Comece pelas jornadas críticas, defina responsabilidades e torne regressões visíveis.',
      readTime: '10 min de leitura',
    },
  }[locale]

  return {
    slug: AUDIT_MONITORING_2026_SLUG,
    locale,
    title: titles[locale],
    metaTitle: `${titles[locale]} - VexNexa`,
    metaDescription: translations.meta,
    badge: translations.badge,
    intro: translations.intro,
    readTime: translations.readTime,
    sections: localizedSections[locale],
    checklistTitle:
      locale === 'en'
        ? 'A 12-month plan for audit, monitoring, and governance'
        : locale === 'fr'
          ? 'Un plan de 12 mois pour audit, monitoring et gouvernance'
          : locale === 'es'
            ? 'Un plan de 12 meses para auditoría, monitorización y gobernanza'
            : 'Um plano de 12 meses para auditoria, monitorização e governança',
    checklist: getChecklist(locale),
    sourcesTitle:
      locale === 'en'
        ? 'Sources and further context'
        : locale === 'fr'
          ? 'Sources et contexte'
          : locale === 'es'
            ? 'Fuentes y contexto'
            : 'Fontes e contexto',
    ctaTitle: translations.ctaTitle,
    ctaText: translations.ctaText,
  }
}

export const auditMonitoringPosts = Object.fromEntries(
  BLOG_SEO_LOCALES.map((locale) => [locale, translatedPost(locale)])
) as Record<BlogSeoLocale, AuditMonitoringPost>

export function getAuditMonitoringPost(locale: BlogSeoLocale = 'nl') {
  return auditMonitoringPosts[locale] || auditMonitoringPosts.nl
}

export function getAuditMonitoringAlternates() {
  return Object.fromEntries(
    BLOG_SEO_LOCALES.map((locale) => [locale, getBlogPublicUrl(locale, AUDIT_MONITORING_2026_SLUG)])
  )
}

export function getAuditMonitoringMetadata(locale: BlogSeoLocale = 'nl'): Metadata {
  const post = getAuditMonitoringPost(locale)

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: {
      canonical: getBlogPublicUrl('nl', AUDIT_MONITORING_2026_SLUG),
      languages: getAuditMonitoringAlternates(),
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: getBlogPublicUrl(locale, AUDIT_MONITORING_2026_SLUG),
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription,
    },
  }
}
