/**
 * Adds translation keys for all marketing pages to all locale files.
 * Run: node scripts/update-all-translations.cjs
 */
const fs = require('fs');
const path = require('path');
const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

function loadLocale(locale) {
  const fp = path.join(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function saveLocale(locale, data) {
  const fp = path.join(MESSAGES_DIR, `${locale}.json`);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`  Updated ${locale}.json`);
}

// ─── FOR-AGENCIES ───────────────────────────────────────────
const forAgencies = {
  en: {
    hero: {
      title: "Accessibility reporting your agency can",
      titleHighlight: "actually deliver",
      subtitle: "Scan client sites for WCAG 2.2 issues, export branded reports, set up continuous monitoring, and manage accessibility across your entire portfolio — all from one platform.",
      ctaPrimary: "Start your free scan",
      ctaSecondary: "View sample report",
      noCreditCard: "Free account required. No credit card needed."
    },
    painPoints: {
      title: "Common challenges agencies face",
      subtitle: "Accessibility is becoming a client expectation, not a nice-to-have.",
      p1: { title: "Clients ask about accessibility but you lack a repeatable process", description: "Without a standardised workflow, every accessibility review takes longer than it should. VexNexa gives you a scannable, reportable, monitorable process from day one." },
      p2: { title: "You cannot scale manual audits across 10+ client sites", description: "Manual testing is important but expensive. Automated scans give you baseline coverage across your entire portfolio so you can focus manual effort where it counts." },
      p3: { title: "Reports look inconsistent or unprofessional", description: "Generic scan output does not impress clients. VexNexa exports branded PDF and DOCX reports under your own logo with clear issue prioritisation." }
    },
    workflows: {
      title: "Why VexNexa fits agency workflows",
      subtitle: "Practical tooling that maps to how agencies already work with clients.",
      w1: { title: "Scan any client site in minutes", description: "Enter a URL, get a full WCAG 2.2 audit with severity-ranked issues. No setup needed per client." },
      w2: { title: "Export white-label reports", description: "Generate branded PDF and DOCX reports with your logo, colours, and contact info. Ready to share with clients." },
      w3: { title: "Schedule recurring scans", description: "Set up weekly or monthly monitoring. Get alerted when scores drop or new critical issues appear on any client site." },
      w4: { title: "Manage multiple clients from one dashboard", description: "Organise sites by client. Track scores, trends, and open issues across your entire portfolio." },
      w5: { title: "Catch regressions before clients do", description: "After a redesign, migration, or new release — VexNexa catches accessibility regressions automatically." },
      w6: { title: "Support EAA readiness for EU clients", description: "Help clients strengthen their ongoing accessibility oversight with continuous monitoring and evidence of improvement." }
    },
    included: {
      title: "Included on Business and Enterprise plans",
      i1: "White-label PDF and DOCX reports",
      i2: "Custom logo, colours, and footer text",
      i3: "Multi-site dashboard",
      i4: "Scheduled scans with email alerts",
      i5: "Role-based team access",
      i6: "WCAG 2.2 AA coverage with axe-core",
      i7: "Severity-ranked issue prioritisation",
      i8: "EU-hosted, GDPR compliant"
    },
    agencyWorkflow: {
      title: "How agencies use VexNexa",
      subtitle: "A revenue-positive accessibility workflow in four steps.",
      stepLabel: "Step",
      s1: { title: "Client onboarding", description: "Scan their site on day one — instant baseline audit." },
      s2: { title: "Deliver branded report", description: "White-label PDF within 24 hours, ready to share." },
      s3: { title: "Fix & monitor", description: "Schedule recurring scans, track improvements over time." },
      s4: { title: "Retain & upsell", description: "Ongoing monitoring as a monthly service for your clients." }
    },
    pilotBanner: {
      badge: "Limited spots",
      title: "Join the Pilot Partner Program",
      subtitle: "Get Business-level access, direct support, and help shape VexNexa — while delivering accessibility to your clients from day one.",
      ctaPrimary: "Learn more",
      ctaSecondary: "Apply now"
    },
    finalCta: {
      title: "Start delivering accessibility to your clients",
      subtitle: "Create a free account, scan your first client site, and see how VexNexa fits your workflow.",
      ctaPrimary: "Start your free scan",
      ctaSecondary: "View sample report",
      ctaTertiary: "Contact us"
    }
  },
  nl: {
    hero: {
      title: "Toegankelijkheidsrapportage die je agency daadwerkelijk kan",
      titleHighlight: "leveren",
      subtitle: "Scan klantsites op WCAG 2.2-problemen, exporteer rapporten op maat, stel continue monitoring in en beheer toegankelijkheid over je hele portfolio — alles vanuit één platform.",
      ctaPrimary: "Start je gratis scan",
      ctaSecondary: "Bekijk voorbeeldrapport",
      noCreditCard: "Gratis account vereist. Geen creditcard nodig."
    },
    painPoints: {
      title: "Veelvoorkomende uitdagingen voor agencies",
      subtitle: "Toegankelijkheid wordt een klantverwachting, geen nice-to-have.",
      p1: { title: "Klanten vragen naar toegankelijkheid maar je mist een herhaalbaar proces", description: "Zonder een gestandaardiseerde workflow duurt elke toegankelijkheidsreview langer dan nodig. VexNexa biedt je een scanbaar, rapporteerbaar en monitorbaar proces vanaf dag één." },
      p2: { title: "Je kunt handmatige audits niet schalen over 10+ klantsites", description: "Handmatig testen is belangrijk maar duur. Geautomatiseerde scans geven basisdekking over je hele portfolio zodat je handmatige inspanning kunt richten waar het telt." },
      p3: { title: "Rapporten zien er inconsistent of onprofessioneel uit", description: "Generieke scanuitvoer maakt geen indruk op klanten. VexNexa exporteert rapporten op maat onder je eigen logo met duidelijke probleemprioritering." }
    },
    workflows: {
      title: "Waarom VexNexa past bij agencyworkflows",
      subtitle: "Praktische tools die aansluiten bij hoe agencies al met klanten werken.",
      w1: { title: "Scan elke klantsite in minuten", description: "Voer een URL in, ontvang een volledige WCAG 2.2-audit met op ernst gerangschikte problemen. Geen setup per klant nodig." },
      w2: { title: "Exporteer white-label rapporten", description: "Genereer rapporten met je logo, kleuren en contactgegevens in PDF en DOCX. Klaar om te delen met klanten." },
      w3: { title: "Plan terugkerende scans", description: "Stel wekelijkse of maandelijkse monitoring in. Ontvang waarschuwingen bij scoredaling of nieuwe kritieke problemen." },
      w4: { title: "Beheer meerdere klanten vanuit één dashboard", description: "Organiseer sites per klant. Volg scores, trends en openstaande problemen over je hele portfolio." },
      w5: { title: "Ontdek regressies vóór je klanten", description: "Na een herontwerp, migratie of nieuwe release — VexNexa detecteert toegankelijkheidsregressies automatisch." },
      w6: { title: "Ondersteun EAA-gereedheid voor EU-klanten", description: "Help klanten hun doorlopend toegankelijkheidstoezicht te versterken met continue monitoring en bewijs van verbetering." }
    },
    included: {
      title: "Inbegrepen bij Business- en Enterprise-abonnementen",
      i1: "White-label PDF- en DOCX-rapporten",
      i2: "Eigen logo, kleuren en voettekst",
      i3: "Multi-site dashboard",
      i4: "Geplande scans met e-mailwaarschuwingen",
      i5: "Rolgebaseerde teamtoegang",
      i6: "WCAG 2.2 AA-dekking met axe-core",
      i7: "Op ernst gerangschikte probleemprioritering",
      i8: "EU-gehost, AVG-conform"
    },
    agencyWorkflow: {
      title: "Hoe agencies VexNexa gebruiken",
      subtitle: "Een omzetpositieve toegankelijkheidsworkflow in vier stappen.",
      stepLabel: "Stap",
      s1: { title: "Klant onboarding", description: "Scan hun site op dag één — directe baseline-audit." },
      s2: { title: "Lever rapport op maat", description: "White-label PDF binnen 24 uur, klaar om te delen." },
      s3: { title: "Herstel & monitor", description: "Plan terugkerende scans, volg verbeteringen in de tijd." },
      s4: { title: "Behoud & upsell", description: "Doorlopende monitoring als maandelijkse dienst voor je klanten." }
    },
    pilotBanner: {
      badge: "Beperkt aantal plekken",
      title: "Word pilotpartner",
      subtitle: "Krijg toegang op Business-niveau, directe ondersteuning en help VexNexa vormgeven — terwijl je vanaf dag één toegankelijkheid levert aan je klanten.",
      ctaPrimary: "Meer informatie",
      ctaSecondary: "Nu aanmelden"
    },
    finalCta: {
      title: "Begin met het leveren van toegankelijkheid aan je klanten",
      subtitle: "Maak een gratis account aan, scan je eerste klantsite en ontdek hoe VexNexa in je workflow past.",
      ctaPrimary: "Start je gratis scan",
      ctaSecondary: "Bekijk voorbeeldrapport",
      ctaTertiary: "Neem contact op"
    }
  },
  de: {
    hero: {
      title: "Barrierefreiheitsberichte, die Ihre Agentur",
      titleHighlight: "tatsächlich liefern kann",
      subtitle: "Scannen Sie Kundenwebsites auf WCAG 2.2-Probleme, exportieren Sie markenspezifische Berichte, richten Sie kontinuierliches Monitoring ein und verwalten Sie Barrierefreiheit über Ihr gesamtes Portfolio — alles über eine Plattform.",
      ctaPrimary: "Kostenlos scannen",
      ctaSecondary: "Beispielbericht ansehen",
      noCreditCard: "Kostenloses Konto erforderlich. Keine Kreditkarte nötig."
    },
    painPoints: {
      title: "Häufige Herausforderungen für Agenturen",
      subtitle: "Barrierefreiheit wird zur Kundenerwartung, nicht zum Nice-to-have.",
      p1: { title: "Kunden fragen nach Barrierefreiheit, aber Ihnen fehlt ein wiederholbarer Prozess", description: "Ohne einen standardisierten Workflow dauert jede Barrierefreiheitsprüfung länger als nötig. VexNexa bietet Ihnen einen scan-, berichts- und überwachbaren Prozess ab Tag eins." },
      p2: { title: "Manuelle Audits lassen sich nicht über 10+ Kundenwebsites skalieren", description: "Manuelles Testen ist wichtig, aber teuer. Automatisierte Scans bieten Basisdabdeckung über Ihr gesamtes Portfolio, damit Sie manuelle Prüfungen gezielt einsetzen können." },
      p3: { title: "Berichte wirken inkonsistent oder unprofessionell", description: "Generische Scan-Ausgaben beeindrucken Kunden nicht. VexNexa exportiert markenspezifische PDF- und DOCX-Berichte unter Ihrem eigenen Logo mit klarer Problempriorisierung." }
    },
    workflows: {
      title: "Warum VexNexa zu Agentur-Workflows passt",
      subtitle: "Praktische Tools, die darauf abgestimmt sind, wie Agenturen bereits mit Kunden arbeiten.",
      w1: { title: "Jede Kundenwebsite in Minuten scannen", description: "Geben Sie eine URL ein und erhalten Sie ein vollständiges WCAG 2.2-Audit mit nach Schweregrad sortierten Problemen. Kein Setup pro Kunde nötig." },
      w2: { title: "White-Label-Berichte exportieren", description: "Erstellen Sie markenspezifische PDF- und DOCX-Berichte mit Ihrem Logo, Ihren Farben und Kontaktdaten. Sofort teilbar mit Kunden." },
      w3: { title: "Wiederkehrende Scans planen", description: "Richten Sie wöchentliches oder monatliches Monitoring ein. Erhalten Sie Benachrichtigungen bei sinkenden Scores oder neuen kritischen Problemen." },
      w4: { title: "Mehrere Kunden über ein Dashboard verwalten", description: "Organisieren Sie Websites nach Kunde. Verfolgen Sie Scores, Trends und offene Probleme über Ihr gesamtes Portfolio." },
      w5: { title: "Regressionen erkennen, bevor Kunden es tun", description: "Nach einem Redesign, einer Migration oder einem neuen Release — VexNexa erkennt Barrierefreiheitsregressionen automatisch." },
      w6: { title: "EAA-Bereitschaft für EU-Kunden unterstützen", description: "Unterstützen Sie Kunden dabei, ihre laufende Barrierefreiheitsüberwachung mit kontinuierlichem Monitoring und Verbesserungsnachweisen zu stärken." }
    },
    included: {
      title: "Im Business- und Enterprise-Plan enthalten",
      i1: "White-Label-PDF- und DOCX-Berichte",
      i2: "Eigenes Logo, Farben und Fußzeilentext",
      i3: "Multi-Site-Dashboard",
      i4: "Geplante Scans mit E-Mail-Benachrichtigungen",
      i5: "Rollenbasierter Teamzugang",
      i6: "WCAG 2.2 AA-Abdeckung mit axe-core",
      i7: "Nach Schweregrad sortierte Problempriorisierung",
      i8: "EU-gehostet, DSGVO-konform"
    },
    agencyWorkflow: {
      title: "Wie Agenturen VexNexa nutzen",
      subtitle: "Ein umsatzpositiver Barrierefreiheits-Workflow in vier Schritten.",
      stepLabel: "Schritt",
      s1: { title: "Kunden-Onboarding", description: "Scannen Sie deren Website am ersten Tag — sofortiges Baseline-Audit." },
      s2: { title: "Markenspezifischen Bericht liefern", description: "White-Label-PDF innerhalb von 24 Stunden, bereit zum Teilen." },
      s3: { title: "Beheben & überwachen", description: "Planen Sie wiederkehrende Scans, verfolgen Sie Verbesserungen im Zeitverlauf." },
      s4: { title: "Binden & Upselling", description: "Laufendes Monitoring als monatlicher Service für Ihre Kunden." }
    },
    pilotBanner: {
      badge: "Begrenzte Plätze",
      title: "Werden Sie Pilotpartner",
      subtitle: "Erhalten Sie Business-Level-Zugang, direkten Support und gestalten Sie VexNexa mit — während Sie Ihren Kunden ab dem ersten Tag Barrierefreiheit bieten.",
      ctaPrimary: "Mehr erfahren",
      ctaSecondary: "Jetzt bewerben"
    },
    finalCta: {
      title: "Beginnen Sie, Ihren Kunden Barrierefreiheit zu liefern",
      subtitle: "Erstellen Sie ein kostenloses Konto, scannen Sie Ihre erste Kundenwebsite und sehen Sie, wie VexNexa in Ihren Workflow passt.",
      ctaPrimary: "Kostenlos scannen",
      ctaSecondary: "Beispielbericht ansehen",
      ctaTertiary: "Kontakt aufnehmen"
    }
  },
  fr: {
    hero: {
      title: "Des rapports d'accessibilité que votre agence peut",
      titleHighlight: "réellement livrer",
      subtitle: "Analysez les sites clients pour les problèmes WCAG 2.2, exportez des rapports personnalisés, configurez la surveillance continue et gérez l'accessibilité de tout votre portefeuille — depuis une seule plateforme.",
      ctaPrimary: "Lancer une analyse gratuite",
      ctaSecondary: "Voir un exemple de rapport",
      noCreditCard: "Compte gratuit requis. Aucune carte de crédit nécessaire."
    },
    painPoints: {
      title: "Défis courants des agences",
      subtitle: "L'accessibilité devient une attente client, pas un simple bonus.",
      p1: { title: "Les clients posent des questions sur l'accessibilité mais vous manquez d'un processus reproductible", description: "Sans un workflow standardisé, chaque audit d'accessibilité prend plus de temps que nécessaire. VexNexa vous donne un processus analysable, rapportable et surveillable dès le premier jour." },
      p2: { title: "Vous ne pouvez pas mettre à l'échelle les audits manuels sur plus de 10 sites clients", description: "Les tests manuels sont importants mais coûteux. Les analyses automatisées fournissent une couverture de base sur l'ensemble de votre portefeuille pour concentrer l'effort manuel là où ça compte." },
      p3: { title: "Les rapports semblent incohérents ou peu professionnels", description: "Les résultats de scan génériques n'impressionnent pas les clients. VexNexa exporte des rapports PDF et DOCX personnalisés sous votre propre logo avec une priorisation claire des problèmes." }
    },
    workflows: {
      title: "Pourquoi VexNexa convient aux workflows d'agence",
      subtitle: "Des outils pratiques alignés sur la façon dont les agences travaillent déjà avec leurs clients.",
      w1: { title: "Analyser n'importe quel site client en minutes", description: "Entrez une URL, obtenez un audit WCAG 2.2 complet avec des problèmes classés par gravité. Aucune configuration requise par client." },
      w2: { title: "Exporter des rapports en marque blanche", description: "Générez des rapports PDF et DOCX personnalisés avec votre logo, vos couleurs et vos coordonnées. Prêts à partager avec les clients." },
      w3: { title: "Planifier des analyses récurrentes", description: "Configurez une surveillance hebdomadaire ou mensuelle. Recevez des alertes en cas de baisse des scores ou de nouveaux problèmes critiques." },
      w4: { title: "Gérer plusieurs clients depuis un seul tableau de bord", description: "Organisez les sites par client. Suivez les scores, tendances et problèmes ouverts sur l'ensemble de votre portefeuille." },
      w5: { title: "Détecter les régressions avant vos clients", description: "Après une refonte, une migration ou une nouvelle version — VexNexa détecte automatiquement les régressions d'accessibilité." },
      w6: { title: "Soutenir la conformité EAA pour les clients européens", description: "Aidez vos clients à renforcer leur surveillance continue de l'accessibilité avec un monitoring permanent et des preuves d'amélioration." }
    },
    included: {
      title: "Inclus dans les plans Business et Enterprise",
      i1: "Rapports PDF et DOCX en marque blanche",
      i2: "Logo, couleurs et texte de pied de page personnalisés",
      i3: "Tableau de bord multi-sites",
      i4: "Analyses planifiées avec alertes par e-mail",
      i5: "Accès équipe basé sur les rôles",
      i6: "Couverture WCAG 2.2 AA avec axe-core",
      i7: "Priorisation des problèmes par gravité",
      i8: "Hébergé en UE, conforme au RGPD"
    },
    agencyWorkflow: {
      title: "Comment les agences utilisent VexNexa",
      subtitle: "Un workflow d'accessibilité rentable en quatre étapes.",
      stepLabel: "Étape",
      s1: { title: "Intégration client", description: "Analysez leur site dès le premier jour — audit de référence instantané." },
      s2: { title: "Livrer un rapport personnalisé", description: "PDF en marque blanche sous 24 heures, prêt à partager." },
      s3: { title: "Corriger & surveiller", description: "Planifiez des analyses récurrentes, suivez les améliorations dans le temps." },
      s4: { title: "Fidéliser & vendre plus", description: "Surveillance continue comme service mensuel pour vos clients." }
    },
    pilotBanner: {
      badge: "Places limitées",
      title: "Rejoignez le programme de partenariat pilote",
      subtitle: "Obtenez un accès niveau Business, un support direct et contribuez à façonner VexNexa — tout en offrant l'accessibilité à vos clients dès le premier jour.",
      ctaPrimary: "En savoir plus",
      ctaSecondary: "Postuler maintenant"
    },
    finalCta: {
      title: "Commencez à offrir l'accessibilité à vos clients",
      subtitle: "Créez un compte gratuit, analysez votre premier site client et découvrez comment VexNexa s'intègre à votre workflow.",
      ctaPrimary: "Lancer une analyse gratuite",
      ctaSecondary: "Voir un exemple de rapport",
      ctaTertiary: "Nous contacter"
    }
  },
  es: {
    hero: {
      title: "Informes de accesibilidad que su agencia puede",
      titleHighlight: "realmente entregar",
      subtitle: "Escanee sitios de clientes para problemas WCAG 2.2, exporte informes personalizados, configure monitoreo continuo y gestione la accesibilidad de todo su portafolio — todo desde una sola plataforma.",
      ctaPrimary: "Iniciar análisis gratuito",
      ctaSecondary: "Ver informe de ejemplo",
      noCreditCard: "Se requiere cuenta gratuita. No se necesita tarjeta de crédito."
    },
    painPoints: {
      title: "Desafíos comunes de las agencias",
      subtitle: "La accesibilidad se está convirtiendo en una expectativa del cliente, no en un extra opcional.",
      p1: { title: "Los clientes preguntan sobre accesibilidad pero usted carece de un proceso repetible", description: "Sin un flujo de trabajo estandarizado, cada revisión de accesibilidad toma más tiempo del necesario. VexNexa le ofrece un proceso escaneable, reportable y monitoreable desde el primer día." },
      p2: { title: "No puede escalar auditorías manuales en más de 10 sitios de clientes", description: "Las pruebas manuales son importantes pero costosas. Los análisis automatizados proporcionan cobertura base en todo su portafolio para concentrar el esfuerzo manual donde más importa." },
      p3: { title: "Los informes lucen inconsistentes o poco profesionales", description: "Los resultados genéricos de escaneo no impresionan a los clientes. VexNexa exporta informes PDF y DOCX personalizados bajo su propio logo con priorización clara de problemas." }
    },
    workflows: {
      title: "Por qué VexNexa se adapta a los flujos de trabajo de agencias",
      subtitle: "Herramientas prácticas alineadas con la forma en que las agencias ya trabajan con sus clientes.",
      w1: { title: "Escanee cualquier sitio de cliente en minutos", description: "Ingrese una URL y obtenga una auditoría WCAG 2.2 completa con problemas clasificados por gravedad. Sin configuración por cliente." },
      w2: { title: "Exporte informes de marca blanca", description: "Genere informes PDF y DOCX personalizados con su logo, colores y datos de contacto. Listos para compartir con clientes." },
      w3: { title: "Programe análisis recurrentes", description: "Configure monitoreo semanal o mensual. Reciba alertas cuando las puntuaciones bajen o aparezcan nuevos problemas críticos." },
      w4: { title: "Gestione múltiples clientes desde un solo panel", description: "Organice sitios por cliente. Realice seguimiento de puntuaciones, tendencias y problemas abiertos en todo su portafolio." },
      w5: { title: "Detecte regresiones antes que sus clientes", description: "Después de un rediseño, migración o nuevo lanzamiento — VexNexa detecta regresiones de accesibilidad automáticamente." },
      w6: { title: "Apoye la preparación para el EAA en clientes europeos", description: "Ayude a sus clientes a fortalecer su supervisión continua de accesibilidad con monitoreo permanente y evidencia de mejoras." }
    },
    included: {
      title: "Incluido en los planes Business y Enterprise",
      i1: "Informes PDF y DOCX de marca blanca",
      i2: "Logo, colores y texto de pie de página personalizados",
      i3: "Panel multi-sitio",
      i4: "Análisis programados con alertas por correo",
      i5: "Acceso de equipo basado en roles",
      i6: "Cobertura WCAG 2.2 AA con axe-core",
      i7: "Priorización de problemas por gravedad",
      i8: "Alojado en la UE, conforme al RGPD"
    },
    agencyWorkflow: {
      title: "Cómo las agencias usan VexNexa",
      subtitle: "Un flujo de trabajo de accesibilidad rentable en cuatro pasos.",
      stepLabel: "Paso",
      s1: { title: "Incorporación de cliente", description: "Escanee su sitio el primer día — auditoría de referencia instantánea." },
      s2: { title: "Entregar informe personalizado", description: "PDF de marca blanca en 24 horas, listo para compartir." },
      s3: { title: "Corregir y monitorear", description: "Programe análisis recurrentes, realice seguimiento de mejoras en el tiempo." },
      s4: { title: "Retener y vender más", description: "Monitoreo continuo como servicio mensual para sus clientes." }
    },
    pilotBanner: {
      badge: "Plazas limitadas",
      title: "Únase al programa de socios piloto",
      subtitle: "Obtenga acceso nivel Business, soporte directo y ayude a dar forma a VexNexa — mientras ofrece accesibilidad a sus clientes desde el primer día.",
      ctaPrimary: "Más información",
      ctaSecondary: "Solicitar ahora"
    },
    finalCta: {
      title: "Comience a ofrecer accesibilidad a sus clientes",
      subtitle: "Cree una cuenta gratuita, escanee su primer sitio de cliente y descubra cómo VexNexa se integra en su flujo de trabajo.",
      ctaPrimary: "Iniciar análisis gratuito",
      ctaSecondary: "Ver informe de ejemplo",
      ctaTertiary: "Contáctenos"
    }
  }
};

// ─── BLOG PAGE UI ───────────────────────────────────────────
const blog = {
  en: {
    title: "Insights & Updates",
    subtitle: "Latest developments in web accessibility and WCAG compliance",
    empty: "No blog posts found. Check back later for new content!",
    writtenBy: "Written by:",
    metadata: {
      description: "Latest news, tips, and insights on web accessibility and WCAG compliance."
    }
  },
  nl: {
    title: "Inzichten & Updates",
    subtitle: "De laatste ontwikkelingen in webtoegankelijkheid en WCAG-naleving",
    empty: "Geen blogposts gevonden. Kom later terug voor nieuwe content!",
    writtenBy: "Geschreven door:",
    metadata: {
      description: "Laatste nieuws, tips en inzichten over webtoegankelijkheid en WCAG-naleving."
    }
  },
  de: {
    title: "Einblicke & Neuigkeiten",
    subtitle: "Aktuelle Entwicklungen in Web-Barrierefreiheit und WCAG-Konformität",
    empty: "Keine Blogbeiträge gefunden. Schauen Sie später wieder vorbei!",
    writtenBy: "Geschrieben von:",
    metadata: {
      description: "Aktuelle Nachrichten, Tipps und Einblicke zu Web-Barrierefreiheit und WCAG-Konformität."
    }
  },
  fr: {
    title: "Perspectives & Actualités",
    subtitle: "Les dernières évolutions en accessibilité web et conformité WCAG",
    empty: "Aucun article trouvé. Revenez plus tard pour du nouveau contenu !",
    writtenBy: "Rédigé par :",
    metadata: {
      description: "Dernières nouvelles, conseils et perspectives sur l'accessibilité web et la conformité WCAG."
    }
  },
  es: {
    title: "Ideas & Novedades",
    subtitle: "Últimos desarrollos en accesibilidad web y cumplimiento WCAG",
    empty: "No se encontraron publicaciones. ¡Vuelva más tarde para nuevo contenido!",
    writtenBy: "Escrito por:",
    metadata: {
      description: "Últimas noticias, consejos e ideas sobre accesibilidad web y cumplimiento WCAG."
    }
  }
};

// ─── SAMPLE REPORT (new download section) ────────────────────
const sampleReportDownload = {
  en: {
    downloadTitle: "Download the full sample report",
    downloadSubtitle: "See exactly what your clients will receive — branded, structured, and ready to share.",
    downloadBranded: "Request PDF sample",
    downloadWhiteLabel: "Request white-label example",
    downloadNote: "We'll send you a personalized sample report within 1 business day."
  },
  nl: {
    downloadTitle: "Download het volledige voorbeeldrapport",
    downloadSubtitle: "Zie precies wat je klanten ontvangen — op maat, gestructureerd en klaar om te delen.",
    downloadBranded: "Vraag PDF-voorbeeld aan",
    downloadWhiteLabel: "Vraag white-label voorbeeld aan",
    downloadNote: "We sturen je binnen 1 werkdag een persoonlijk voorbeeldrapport."
  },
  de: {
    downloadTitle: "Vollständigen Beispielbericht herunterladen",
    downloadSubtitle: "Sehen Sie genau, was Ihre Kunden erhalten — markenspezifisch, strukturiert und bereit zum Teilen.",
    downloadBranded: "PDF-Beispiel anfordern",
    downloadWhiteLabel: "White-Label-Beispiel anfordern",
    downloadNote: "Wir senden Ihnen innerhalb von 1 Werktag einen personalisierten Beispielbericht."
  },
  fr: {
    downloadTitle: "Télécharger l'exemple de rapport complet",
    downloadSubtitle: "Voyez exactement ce que vos clients recevront — personnalisé, structuré et prêt à partager.",
    downloadBranded: "Demander un exemple PDF",
    downloadWhiteLabel: "Demander un exemple en marque blanche",
    downloadNote: "Nous vous enverrons un rapport d'exemple personnalisé sous 1 jour ouvré."
  },
  es: {
    downloadTitle: "Descargar el informe de ejemplo completo",
    downloadSubtitle: "Vea exactamente lo que recibirán sus clientes — personalizado, estructurado y listo para compartir.",
    downloadBranded: "Solicitar ejemplo PDF",
    downloadWhiteLabel: "Solicitar ejemplo de marca blanca",
    downloadNote: "Le enviaremos un informe de ejemplo personalizado en 1 día hábil."
  }
};

// ─── PRICING new sections ────────────────────────────────────
const pricingNew = {
  en: {
    pilotBanner: {
      badge: "Agency Pilot",
      title: "First month Business plan at Pro price",
      subtitle: "New to VexNexa? Start with full Business features — white-label reports, 10 websites, and priority support — for just €59.99 your first month. No lock-in. Cancel anytime.",
      cta: "Claim your pilot spot"
    },
    noCreditCard: "No credit card required · Cancel anytime"
  },
  nl: {
    pilotBanner: {
      badge: "Agency Pilot",
      title: "Eerste maand Business-abonnement voor Pro-prijs",
      subtitle: "Nieuw bij VexNexa? Start met alle Business-functies — white-label rapporten, 10 websites en prioriteitsondersteuning — voor slechts €59,99 in je eerste maand. Geen verplichtingen. Altijd opzegbaar.",
      cta: "Claim je pilotplek"
    },
    noCreditCard: "Geen creditcard vereist · Altijd opzegbaar"
  },
  de: {
    pilotBanner: {
      badge: "Agentur-Pilot",
      title: "Erster Monat Business-Plan zum Pro-Preis",
      subtitle: "Neu bei VexNexa? Starten Sie mit allen Business-Funktionen — White-Label-Berichte, 10 Websites und Prioritäts-Support — für nur 59,99 € im ersten Monat. Keine Bindung. Jederzeit kündbar.",
      cta: "Pilotplatz sichern"
    },
    noCreditCard: "Keine Kreditkarte erforderlich · Jederzeit kündbar"
  },
  fr: {
    pilotBanner: {
      badge: "Pilote Agence",
      title: "Premier mois du plan Business au prix Pro",
      subtitle: "Nouveau sur VexNexa ? Commencez avec toutes les fonctionnalités Business — rapports en marque blanche, 10 sites web et support prioritaire — pour seulement 59,99 € le premier mois. Sans engagement. Résiliable à tout moment.",
      cta: "Réserver votre place pilote"
    },
    noCreditCard: "Aucune carte de crédit requise · Résiliable à tout moment"
  },
  es: {
    pilotBanner: {
      badge: "Piloto para Agencias",
      title: "Primer mes del plan Business al precio Pro",
      subtitle: "¿Nuevo en VexNexa? Comience con todas las funciones Business — informes de marca blanca, 10 sitios web y soporte prioritario — por solo 59,99 € el primer mes. Sin compromiso. Cancele en cualquier momento.",
      cta: "Reserve su plaza piloto"
    },
    noCreditCard: "No se requiere tarjeta de crédito · Cancele en cualquier momento"
  }
};

// ─── APPLY UPDATES ──────────────────────────────────────────
const locales = ['en', 'nl', 'de', 'fr', 'es'];

for (const locale of locales) {
  console.log(`Processing ${locale}...`);
  const data = loadLocale(locale);
  
  // Add forAgencies namespace
  data.forAgencies = forAgencies[locale];
  
  // Add blog namespace  
  data.blog = blog[locale];
  
  // Add sampleReport download keys
  if (!data.sampleReport) data.sampleReport = {};
  Object.assign(data.sampleReport, sampleReportDownload[locale]);
  
  // Add pricing new sections
  if (!data.pricing) data.pricing = {};
  if (!data.pricing.page) data.pricing.page = {};
  data.pricing.page.pilotBanner = pricingNew[locale].pilotBanner;
  data.pricing.page.noCreditCard = pricingNew[locale].noCreditCard;
  
  saveLocale(locale, data);
}

console.log('\nDone! All page translations updated.');
