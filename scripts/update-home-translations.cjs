/**
 * Updates the `home` section in all locale files to match the current homepage component.
 * Run: node scripts/update-home-translations.cjs
 */
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

const homeEN = {
  hero: {
    title: "White-label WCAG monitoring for",
    titleHighlight: "agencies and EU-facing teams",
    subtitle: "Scan websites, catch accessibility regressions after every release, and deliver branded reports that support WCAG 2.2 and EAA readiness.",
    ctaPrimary: "Start your free scan",
    ctaSecondary: "View sample report",
    noCreditCard: "Free account required. No credit card needed.",
    imageAlt: "VexNexa accessibility scanning dashboard showing detailed WCAG reports and issue prioritization"
  },
  socialProof: {
    title: "Trusted by agencies across Europe",
    logo1: "Agency Partner",
    logo2: "Digital Studio",
    logo3: "Web Team",
    logo4: "Compliance Co."
  },
  trustStrip: {
    automated: "Automated checks in minutes",
    branded: "Branded reports for clients and stakeholders",
    continuous: "Continuous monitoring for live websites"
  },
  whyTeams: {
    title: "Why teams choose VexNexa",
    subtitle: "Operational accessibility tooling that fits into how you already work.",
    catchIssues: {
      title: "Catch issues before clients do",
      description: "Run scans against WCAG 2.2 criteria and see prioritized issues with element-level detail. Fix what matters most first."
    },
    whiteLabel: {
      title: "Turn scans into white-label reports",
      description: "Export branded PDF and DOCX reports under your own logo. Share professional accessibility reports with clients and stakeholders."
    },
    monitor: {
      title: "Monitor accessibility after every release",
      description: "Schedule recurring scans. Get alerted when scores drop or new critical issues appear. Prevent regressions from reaching production."
    }
  },
  builtFor: {
    title: "Built for agencies and EU-facing teams",
    subtitle: "Whether you manage one site or fifty, VexNexa gives you the workflow tools to deliver accessible websites.",
    agencies: {
      title: "Agencies and web studios",
      description: "Scan client sites, export branded reports, and deliver ongoing monitoring as a service. Manage multiple client projects from one dashboard."
    },
    compliance: {
      title: "In-house compliance teams",
      description: "Track accessibility across your organisation. Schedule scans after every deployment. Build evidence of ongoing accessibility oversight for EAA readiness."
    },
    partners: {
      title: "Partners managing multiple sites",
      description: "Monitor accessibility across a portfolio of websites. Catch regressions early. Deliver clear, prioritized reports to stakeholders."
    }
  },
  whatYouGet: {
    title: "What you get with",
    titleHighlight: "VexNexa",
    subtitle: "Everything you need to scan, report, and monitor — without the noise.",
    c1: "WCAG 2.2 AA scanning with axe-core® engine",
    c2: "Severity-ranked issues: Critical, Serious, Moderate, Minor",
    c3: "PDF and DOCX export with white-label branding",
    c4: "Continuous monitoring with scheduled scans",
    c5: "Score regression alerts via email",
    c6: "Multi-site management from one dashboard",
    c7: "Team collaboration with role-based access",
    c8: "EU-hosted, GDPR compliant infrastructure",
    cta: "Start your free scan",
    axeCoreBadge: "Powered by axe-core® — the world's most trusted accessibility testing engine"
  },
  testimonials: {
    title: "What pilot partners say",
    subtitle: "Early feedback from agencies testing VexNexa in their workflows.",
    t1: {
      quote: "VexNexa saved us hours per client. The white-label reports look like we built them ourselves.",
      attribution: "Pilot partner — Digital agency, Netherlands"
    },
    t2: {
      quote: "We finally have a repeatable accessibility workflow. Scan, report, monitor — done.",
      attribution: "Pilot partner — Web studio, Germany"
    },
    t3: {
      quote: "The prioritization is what sold us. We know exactly what to fix first for each client.",
      attribution: "Pilot partner — Compliance team, Belgium"
    }
  },
  sampleReport: {
    title: "See what a report looks like",
    subtitle: "Professional, structured, and ready to share with clients or stakeholders. Browse a real sample report with accessibility scores, prioritized issues, and remediation guidance.",
    ctaPrimary: "View sample report",
    ctaSecondary: "Learn about white-label reports"
  },
  agencyOffer: {
    badge: "Agency offer",
    title: "Get a branded accessibility report for one site",
    subtitle: "See how VexNexa can fit your agency workflow with a sample report and a practical setup path for ongoing monitoring.",
    ctaPrimary: "View sample report",
    ctaSecondary: "Contact us about agency use"
  },
  workflow: {
    title: "How VexNexa fits your workflow",
    subtitle: "Scan, review, report. Repeat as your sites evolve.",
    stepLabel: "Step",
    s1: {
      title: "Scan a site",
      description: "Enter a URL. Get a full WCAG 2.2 audit in minutes with severity-ranked issues and element-level context."
    },
    s2: {
      title: "Review prioritized issues",
      description: "See exactly what is wrong, why it matters, and how to fix it. Filter by severity, WCAG criterion, or page element."
    },
    s3: {
      title: "Share reports and monitor over time",
      description: "Export branded reports. Schedule recurring scans. Get notified when scores change. Build a continuous improvement loop."
    }
  },
  pilotBanner: {
    badge: "Limited spots",
    title: "Join the Pilot Partner Program",
    subtitle: "Get Business-level access, direct support, and help shape VexNexa — while delivering accessibility to your clients from day one.",
    ctaPrimary: "Learn more",
    ctaSecondary: "Apply now"
  },
  faqSection: {
    q1: {
      question: "Can VexNexa guarantee legal compliance?",
      answer: "No tool can guarantee 100% legal compliance. VexNexa detects and reports accessibility issues, helps prioritize fixes, and supports WCAG and EAA readiness. For legal risk assessment, consider combining automated scanning with expert review."
    },
    q2: {
      question: "Do I need an account to scan?",
      answer: "Yes, a free account is required. This lets us save your results, provide exports, and track improvements over time. No credit card needed to get started."
    },
    q3: {
      question: "Can I export branded reports for clients?",
      answer: "Yes. PDF and DOCX exports are available on paid plans. Business and Enterprise plans include white-label reports with your own logo, colours, and contact details."
    },
    q4: {
      question: "How does continuous monitoring work?",
      answer: "Schedule automatic scans daily, weekly, or monthly. VexNexa alerts you via email when scores drop or new critical issues appear. Track trends over time from your dashboard."
    },
    q5: {
      question: "Is VexNexa an accessibility overlay?",
      answer: "No. We scan your code structure and report real WCAG violations. We never inject widgets or scripts into your site. Our reports help developers fix issues at the source."
    },
    q6: {
      question: "What support is available?",
      answer: "All users get email support. We aim to respond within 1 business day. Business and Enterprise plans include priority support with faster response times."
    }
  },
  finalCta: {
    title: "Start monitoring accessibility today",
    subtitle: "Create your free account. Run your first scan. See results in minutes. Upgrade when you need monitoring, reports, and multi-site management.",
    ctaPrimary: "Start your free scan",
    ctaSecondary: "View pricing"
  }
};

const homeNL = {
  hero: {
    title: "White-label WCAG-monitoring voor",
    titleHighlight: "agencies en EU-gerichte teams",
    subtitle: "Scan websites, detecteer toegankelijkheidsproblemen na elke release en lever rapporten op maat die WCAG 2.2- en EAA-gereedheid ondersteunen.",
    ctaPrimary: "Start je gratis scan",
    ctaSecondary: "Bekijk voorbeeldrapport",
    noCreditCard: "Gratis account vereist. Geen creditcard nodig.",
    imageAlt: "VexNexa dashboard voor toegankelijkheidsscans met gedetailleerde WCAG-rapporten en prioritering van problemen"
  },
  socialProof: {
    title: "Vertrouwd door agencies in heel Europa",
    logo1: "Agency Partner",
    logo2: "Digital Studio",
    logo3: "Web Team",
    logo4: "Compliance Co."
  },
  trustStrip: {
    automated: "Geautomatiseerde controles in minuten",
    branded: "Rapporten op maat voor klanten en stakeholders",
    continuous: "Continue monitoring voor live websites"
  },
  whyTeams: {
    title: "Waarom teams kiezen voor VexNexa",
    subtitle: "Operationele toegankelijkheidstools die passen in je bestaande werkwijze.",
    catchIssues: {
      title: "Ontdek problemen vóór je klanten",
      description: "Voer scans uit op basis van WCAG 2.2-criteria en bekijk geprioriteerde problemen met details op elementniveau. Los eerst op wat het belangrijkst is."
    },
    whiteLabel: {
      title: "Maak van scans white-label rapporten",
      description: "Exporteer PDF- en DOCX-rapporten onder je eigen logo. Deel professionele toegankelijkheidsrapporten met klanten en stakeholders."
    },
    monitor: {
      title: "Monitor toegankelijkheid na elke release",
      description: "Plan terugkerende scans. Ontvang waarschuwingen wanneer scores dalen of nieuwe kritieke problemen verschijnen. Voorkom regressies in productie."
    }
  },
  builtFor: {
    title: "Gebouwd voor agencies en EU-gerichte teams",
    subtitle: "Of je nu één site of vijftig beheert, VexNexa biedt de workflowtools om toegankelijke websites te leveren.",
    agencies: {
      title: "Agencies en webstudio's",
      description: "Scan klantsites, exporteer rapporten op maat en lever doorlopende monitoring als dienst. Beheer meerdere klantprojecten vanuit één dashboard."
    },
    compliance: {
      title: "Interne complianceteams",
      description: "Volg toegankelijkheid binnen je organisatie. Plan scans na elke deployment. Bouw bewijs op van doorlopend toegankelijkheidstoezicht voor EAA-gereedheid."
    },
    partners: {
      title: "Partners die meerdere sites beheren",
      description: "Monitor toegankelijkheid over een portfolio van websites. Detecteer regressies vroegtijdig. Lever duidelijke, geprioriteerde rapporten aan stakeholders."
    }
  },
  whatYouGet: {
    title: "Wat je krijgt met",
    titleHighlight: "VexNexa",
    subtitle: "Alles wat je nodig hebt om te scannen, rapporteren en monitoren — zonder ruis.",
    c1: "WCAG 2.2 AA-scanning met axe-core®-engine",
    c2: "Op ernst gerangschikte problemen: Kritiek, Ernstig, Matig, Klein",
    c3: "PDF- en DOCX-export met white-label branding",
    c4: "Continue monitoring met geplande scans",
    c5: "Waarschuwingen bij scoredaling via e-mail",
    c6: "Multi-site beheer vanuit één dashboard",
    c7: "Teamsamenwerking met rolgebaseerde toegang",
    c8: "EU-gehost, AVG-conforme infrastructuur",
    cta: "Start je gratis scan",
    axeCoreBadge: "Aangedreven door axe-core® — de meest vertrouwde toegankelijkheidstest-engine ter wereld"
  },
  testimonials: {
    title: "Wat pilotpartners zeggen",
    subtitle: "Vroege feedback van agencies die VexNexa testen in hun workflows.",
    t1: {
      quote: "VexNexa bespaarde ons uren per klant. De white-label rapporten zien eruit alsof we ze zelf hebben gebouwd.",
      attribution: "Pilotpartner — Digitaal bureau, Nederland"
    },
    t2: {
      quote: "We hebben eindelijk een herhaalbare toegankelijkheidsworkflow. Scannen, rapporteren, monitoren — klaar.",
      attribution: "Pilotpartner — Webstudio, Duitsland"
    },
    t3: {
      quote: "De prioritering overtuigde ons. We weten precies wat we eerst moeten oplossen voor elke klant.",
      attribution: "Pilotpartner — Complianceteam, België"
    }
  },
  sampleReport: {
    title: "Bekijk hoe een rapport eruitziet",
    subtitle: "Professioneel, gestructureerd en klaar om te delen met klanten of stakeholders. Bekijk een echt voorbeeldrapport met toegankelijkheidsscores, geprioriteerde problemen en hersteladvies.",
    ctaPrimary: "Bekijk voorbeeldrapport",
    ctaSecondary: "Meer over white-label rapporten"
  },
  agencyOffer: {
    badge: "Agencyaanbod",
    title: "Ontvang een toegankelijkheidsrapport op maat voor één site",
    subtitle: "Ontdek hoe VexNexa past in je agencyworkflow met een voorbeeldrapport en een praktisch pad voor doorlopende monitoring.",
    ctaPrimary: "Bekijk voorbeeldrapport",
    ctaSecondary: "Neem contact op over agencygebruik"
  },
  workflow: {
    title: "Hoe VexNexa in je workflow past",
    subtitle: "Scan, beoordeel, rapporteer. Herhaal naarmate je sites evolueren.",
    stepLabel: "Stap",
    s1: {
      title: "Scan een site",
      description: "Voer een URL in. Ontvang een volledige WCAG 2.2-audit in minuten met op ernst gerangschikte problemen en context op elementniveau."
    },
    s2: {
      title: "Beoordeel geprioriteerde problemen",
      description: "Zie precies wat er mis is, waarom het ertoe doet en hoe je het oplost. Filter op ernst, WCAG-criterium of pagina-element."
    },
    s3: {
      title: "Deel rapporten en monitor in de tijd",
      description: "Exporteer rapporten op maat. Plan terugkerende scans. Ontvang meldingen bij scorewijzigingen. Bouw een continu verbeterproces."
    }
  },
  pilotBanner: {
    badge: "Beperkt aantal plekken",
    title: "Word pilotpartner",
    subtitle: "Krijg toegang op Business-niveau, directe ondersteuning en help VexNexa vormgeven — terwijl je vanaf dag één toegankelijkheid levert aan je klanten.",
    ctaPrimary: "Meer informatie",
    ctaSecondary: "Nu aanmelden"
  },
  faqSection: {
    q1: {
      question: "Kan VexNexa wettelijke naleving garanderen?",
      answer: "Geen enkel hulpmiddel kan 100% wettelijke naleving garanderen. VexNexa detecteert en rapporteert toegankelijkheidsproblemen, helpt bij het prioriteren van oplossingen en ondersteunt WCAG- en EAA-gereedheid. Overweeg voor juridische risicobeoordeling geautomatiseerd scannen te combineren met deskundige review."
    },
    q2: {
      question: "Heb ik een account nodig om te scannen?",
      answer: "Ja, een gratis account is vereist. Hiermee kunnen we je resultaten opslaan, exports aanbieden en verbeteringen bijhouden. Geen creditcard nodig om te beginnen."
    },
    q3: {
      question: "Kan ik rapporten op maat exporteren voor klanten?",
      answer: "Ja. PDF- en DOCX-exports zijn beschikbaar bij betaalde abonnementen. Business- en Enterprise-abonnementen bevatten white-label rapporten met je eigen logo, kleuren en contactgegevens."
    },
    q4: {
      question: "Hoe werkt continue monitoring?",
      answer: "Plan automatische scans dagelijks, wekelijks of maandelijks. VexNexa waarschuwt je per e-mail wanneer scores dalen of nieuwe kritieke problemen verschijnen. Volg trends in de tijd vanuit je dashboard."
    },
    q5: {
      question: "Is VexNexa een toegankelijkheidsoverlay?",
      answer: "Nee. We scannen je codestructuur en rapporteren echte WCAG-schendingen. We injecteren nooit widgets of scripts in je site. Onze rapporten helpen ontwikkelaars problemen bij de bron op te lossen."
    },
    q6: {
      question: "Welke ondersteuning is beschikbaar?",
      answer: "Alle gebruikers krijgen e-mailondersteuning. We streven ernaar binnen 1 werkdag te reageren. Business- en Enterprise-abonnementen bevatten prioriteitsondersteuning met snellere reactietijden."
    }
  },
  finalCta: {
    title: "Begin vandaag met toegankelijkheidsmonitoring",
    subtitle: "Maak je gratis account aan. Voer je eerste scan uit. Zie resultaten in minuten. Upgrade wanneer je monitoring, rapporten en multi-site beheer nodig hebt.",
    ctaPrimary: "Start je gratis scan",
    ctaSecondary: "Bekijk tarieven"
  }
};

const homeDE = {
  hero: {
    title: "White-Label-WCAG-Monitoring für",
    titleHighlight: "Agenturen und EU-orientierte Teams",
    subtitle: "Scannen Sie Websites, erkennen Sie Barrierefreiheitsprobleme nach jedem Release und liefern Sie markenspezifische Berichte, die WCAG 2.2 und EAA-Bereitschaft unterstützen.",
    ctaPrimary: "Kostenlos scannen",
    ctaSecondary: "Beispielbericht ansehen",
    noCreditCard: "Kostenloses Konto erforderlich. Keine Kreditkarte nötig.",
    imageAlt: "VexNexa Dashboard für Barrierefreiheitsscans mit detaillierten WCAG-Berichten und Problempriorisierung"
  },
  socialProof: {
    title: "Vertraut von Agenturen in ganz Europa",
    logo1: "Agency Partner",
    logo2: "Digital Studio",
    logo3: "Web Team",
    logo4: "Compliance Co."
  },
  trustStrip: {
    automated: "Automatisierte Prüfungen in Minuten",
    branded: "Markenspezifische Berichte für Kunden und Stakeholder",
    continuous: "Kontinuierliches Monitoring für Live-Websites"
  },
  whyTeams: {
    title: "Warum Teams VexNexa wählen",
    subtitle: "Operative Barrierefreiheits-Tools, die in Ihren bestehenden Workflow passen.",
    catchIssues: {
      title: "Probleme entdecken, bevor Kunden es tun",
      description: "Führen Sie Scans nach WCAG 2.2-Kriterien durch und sehen Sie priorisierte Probleme mit Details auf Elementebene. Beheben Sie zuerst, was am wichtigsten ist."
    },
    whiteLabel: {
      title: "Scans in White-Label-Berichte umwandeln",
      description: "Exportieren Sie PDF- und DOCX-Berichte unter Ihrem eigenen Logo. Teilen Sie professionelle Barrierefreiheitsberichte mit Kunden und Stakeholdern."
    },
    monitor: {
      title: "Barrierefreiheit nach jedem Release überwachen",
      description: "Planen Sie wiederkehrende Scans. Erhalten Sie Benachrichtigungen, wenn Scores sinken oder neue kritische Probleme auftreten. Verhindern Sie Regressionen in der Produktion."
    }
  },
  builtFor: {
    title: "Entwickelt für Agenturen und EU-orientierte Teams",
    subtitle: "Ob Sie eine Website oder fünfzig verwalten — VexNexa bietet Ihnen die Workflow-Tools für barrierefreie Websites.",
    agencies: {
      title: "Agenturen und Webstudios",
      description: "Scannen Sie Kundenwebsites, exportieren Sie markenspezifische Berichte und bieten Sie laufendes Monitoring als Service an. Verwalten Sie mehrere Kundenprojekte über ein Dashboard."
    },
    compliance: {
      title: "Interne Compliance-Teams",
      description: "Verfolgen Sie Barrierefreiheit in Ihrer Organisation. Planen Sie Scans nach jedem Deployment. Dokumentieren Sie laufende Barrierefreiheitsüberwachung für die EAA-Bereitschaft."
    },
    partners: {
      title: "Partner mit mehreren Websites",
      description: "Überwachen Sie Barrierefreiheit über ein Portfolio von Websites. Erkennen Sie Regressionen frühzeitig. Liefern Sie klare, priorisierte Berichte an Stakeholder."
    }
  },
  whatYouGet: {
    title: "Was Sie mit",
    titleHighlight: "VexNexa",
    subtitle: "Alles, was Sie zum Scannen, Berichten und Überwachen brauchen — ohne Rauschen.",
    c1: "WCAG 2.2 AA-Scanning mit axe-core®-Engine",
    c2: "Nach Schweregrad sortierte Probleme: Kritisch, Schwerwiegend, Mäßig, Gering",
    c3: "PDF- und DOCX-Export mit White-Label-Branding",
    c4: "Kontinuierliches Monitoring mit geplanten Scans",
    c5: "Score-Regressionswarnungen per E-Mail",
    c6: "Multi-Site-Verwaltung über ein Dashboard",
    c7: "Teamzusammenarbeit mit rollenbasiertem Zugang",
    c8: "EU-gehostet, DSGVO-konforme Infrastruktur",
    cta: "Kostenlos scannen",
    axeCoreBadge: "Powered by axe-core® — der weltweit vertrauenswürdigsten Engine für Barrierefreiheitstests"
  },
  testimonials: {
    title: "Was Pilotpartner sagen",
    subtitle: "Frühes Feedback von Agenturen, die VexNexa in ihren Workflows testen.",
    t1: {
      quote: "VexNexa hat uns Stunden pro Kunde gespart. Die White-Label-Berichte sehen aus, als hätten wir sie selbst erstellt.",
      attribution: "Pilotpartner — Digitalagentur, Niederlande"
    },
    t2: {
      quote: "Wir haben endlich einen wiederholbaren Barrierefreiheits-Workflow. Scannen, berichten, überwachen — erledigt.",
      attribution: "Pilotpartner — Webstudio, Deutschland"
    },
    t3: {
      quote: "Die Priorisierung hat uns überzeugt. Wir wissen genau, was wir für jeden Kunden zuerst beheben müssen.",
      attribution: "Pilotpartner — Compliance-Team, Belgien"
    }
  },
  sampleReport: {
    title: "Sehen Sie, wie ein Bericht aussieht",
    subtitle: "Professionell, strukturiert und bereit zum Teilen mit Kunden oder Stakeholdern. Durchsuchen Sie einen echten Beispielbericht mit Barrierefreiheits-Scores, priorisierten Problemen und Behebungshinweisen.",
    ctaPrimary: "Beispielbericht ansehen",
    ctaSecondary: "Mehr über White-Label-Berichte"
  },
  agencyOffer: {
    badge: "Agenturangebot",
    title: "Erhalten Sie einen markenspezifischen Barrierefreiheitsbericht für eine Website",
    subtitle: "Sehen Sie, wie VexNexa in Ihren Agentur-Workflow passt — mit einem Beispielbericht und einem praktischen Einrichtungspfad für laufendes Monitoring.",
    ctaPrimary: "Beispielbericht ansehen",
    ctaSecondary: "Kontaktieren Sie uns zur Agenturnutzung"
  },
  workflow: {
    title: "Wie VexNexa in Ihren Workflow passt",
    subtitle: "Scannen, prüfen, berichten. Wiederholen, während sich Ihre Websites weiterentwickeln.",
    stepLabel: "Schritt",
    s1: {
      title: "Website scannen",
      description: "Geben Sie eine URL ein. Erhalten Sie ein vollständiges WCAG 2.2-Audit in Minuten mit nach Schweregrad sortierten Problemen und Kontext auf Elementebene."
    },
    s2: {
      title: "Priorisierte Probleme prüfen",
      description: "Sehen Sie genau, was falsch ist, warum es wichtig ist und wie Sie es beheben. Filtern Sie nach Schweregrad, WCAG-Kriterium oder Seitenelement."
    },
    s3: {
      title: "Berichte teilen und langfristig überwachen",
      description: "Exportieren Sie markenspezifische Berichte. Planen Sie wiederkehrende Scans. Erhalten Sie Benachrichtigungen bei Score-Änderungen. Bauen Sie einen kontinuierlichen Verbesserungsprozess auf."
    }
  },
  pilotBanner: {
    badge: "Begrenzte Plätze",
    title: "Werden Sie Pilotpartner",
    subtitle: "Erhalten Sie Business-Level-Zugang, direkten Support und gestalten Sie VexNexa mit — während Sie Ihren Kunden ab dem ersten Tag Barrierefreiheit bieten.",
    ctaPrimary: "Mehr erfahren",
    ctaSecondary: "Jetzt bewerben"
  },
  faqSection: {
    q1: {
      question: "Kann VexNexa die gesetzliche Konformität garantieren?",
      answer: "Kein Tool kann 100% gesetzliche Konformität garantieren. VexNexa erkennt und meldet Barrierefreiheitsprobleme, hilft bei der Priorisierung von Korrekturen und unterstützt die WCAG- und EAA-Bereitschaft. Für eine rechtliche Risikobewertung empfehlen wir, automatisiertes Scanning mit Expertenprüfung zu kombinieren."
    },
    q2: {
      question: "Benötige ich ein Konto zum Scannen?",
      answer: "Ja, ein kostenloses Konto ist erforderlich. So können wir Ihre Ergebnisse speichern, Exporte bereitstellen und Verbesserungen im Zeitverlauf verfolgen. Keine Kreditkarte erforderlich."
    },
    q3: {
      question: "Kann ich markenspezifische Berichte für Kunden exportieren?",
      answer: "Ja. PDF- und DOCX-Exporte sind in kostenpflichtigen Plänen verfügbar. Business- und Enterprise-Pläne enthalten White-Label-Berichte mit Ihrem eigenen Logo, Farben und Kontaktdaten."
    },
    q4: {
      question: "Wie funktioniert das kontinuierliche Monitoring?",
      answer: "Planen Sie automatische Scans täglich, wöchentlich oder monatlich. VexNexa benachrichtigt Sie per E-Mail, wenn Scores sinken oder neue kritische Probleme auftreten. Verfolgen Sie Trends über Ihr Dashboard."
    },
    q5: {
      question: "Ist VexNexa ein Barrierefreiheits-Overlay?",
      answer: "Nein. Wir scannen Ihre Codestruktur und melden echte WCAG-Verstöße. Wir injizieren niemals Widgets oder Skripte in Ihre Website. Unsere Berichte helfen Entwicklern, Probleme an der Quelle zu beheben."
    },
    q6: {
      question: "Welcher Support ist verfügbar?",
      answer: "Alle Nutzer erhalten E-Mail-Support. Wir antworten in der Regel innerhalb eines Werktages. Business- und Enterprise-Pläne beinhalten Prioritäts-Support mit kürzeren Reaktionszeiten."
    }
  },
  finalCta: {
    title: "Beginnen Sie heute mit der Barrierefreiheitsüberwachung",
    subtitle: "Erstellen Sie Ihr kostenloses Konto. Führen Sie Ihren ersten Scan durch. Sehen Sie Ergebnisse in Minuten. Upgraden Sie, wenn Sie Monitoring, Berichte und Multi-Site-Verwaltung benötigen.",
    ctaPrimary: "Kostenlos scannen",
    ctaSecondary: "Preise ansehen"
  }
};

const homeFR = {
  hero: {
    title: "Surveillance WCAG en marque blanche pour",
    titleHighlight: "les agences et équipes européennes",
    subtitle: "Analysez des sites web, détectez les régressions d'accessibilité après chaque mise en production et livrez des rapports personnalisés compatibles WCAG 2.2 et EAA.",
    ctaPrimary: "Lancer une analyse gratuite",
    ctaSecondary: "Voir un exemple de rapport",
    noCreditCard: "Compte gratuit requis. Aucune carte de crédit nécessaire.",
    imageAlt: "Tableau de bord VexNexa pour les analyses d'accessibilité avec rapports WCAG détaillés et priorisation des problèmes"
  },
  socialProof: {
    title: "Des agences dans toute l'Europe nous font confiance",
    logo1: "Agency Partner",
    logo2: "Digital Studio",
    logo3: "Web Team",
    logo4: "Compliance Co."
  },
  trustStrip: {
    automated: "Vérifications automatisées en quelques minutes",
    branded: "Rapports personnalisés pour vos clients et parties prenantes",
    continuous: "Surveillance continue pour les sites en production"
  },
  whyTeams: {
    title: "Pourquoi les équipes choisissent VexNexa",
    subtitle: "Des outils d'accessibilité opérationnels qui s'intègrent à votre façon de travailler.",
    catchIssues: {
      title: "Détectez les problèmes avant vos clients",
      description: "Lancez des analyses selon les critères WCAG 2.2 et consultez les problèmes priorisés avec des détails au niveau des éléments. Corrigez d'abord ce qui compte le plus."
    },
    whiteLabel: {
      title: "Transformez les analyses en rapports en marque blanche",
      description: "Exportez des rapports PDF et DOCX sous votre propre logo. Partagez des rapports d'accessibilité professionnels avec vos clients et parties prenantes."
    },
    monitor: {
      title: "Surveillez l'accessibilité après chaque mise en production",
      description: "Planifiez des analyses récurrentes. Recevez des alertes lorsque les scores baissent ou que de nouveaux problèmes critiques apparaissent. Prévenez les régressions en production."
    }
  },
  builtFor: {
    title: "Conçu pour les agences et équipes européennes",
    subtitle: "Que vous gériez un site ou cinquante, VexNexa vous offre les outils pour livrer des sites web accessibles.",
    agencies: {
      title: "Agences et studios web",
      description: "Analysez les sites clients, exportez des rapports personnalisés et proposez une surveillance continue en tant que service. Gérez plusieurs projets clients depuis un seul tableau de bord."
    },
    compliance: {
      title: "Équipes de conformité internes",
      description: "Suivez l'accessibilité au sein de votre organisation. Planifiez des analyses après chaque déploiement. Constituez des preuves de surveillance continue pour la conformité EAA."
    },
    partners: {
      title: "Partenaires gérant plusieurs sites",
      description: "Surveillez l'accessibilité sur un portefeuille de sites web. Détectez les régressions tôt. Livrez des rapports clairs et priorisés aux parties prenantes."
    }
  },
  whatYouGet: {
    title: "Ce que vous obtenez avec",
    titleHighlight: "VexNexa",
    subtitle: "Tout ce dont vous avez besoin pour analyser, rapporter et surveiller — sans le bruit.",
    c1: "Analyse WCAG 2.2 AA avec le moteur axe-core®",
    c2: "Problèmes classés par gravité : Critique, Sérieux, Modéré, Mineur",
    c3: "Export PDF et DOCX avec branding en marque blanche",
    c4: "Surveillance continue avec analyses planifiées",
    c5: "Alertes de régression de score par e-mail",
    c6: "Gestion multi-sites depuis un seul tableau de bord",
    c7: "Collaboration d'équipe avec accès par rôle",
    c8: "Hébergé en UE, infrastructure conforme au RGPD",
    cta: "Lancer une analyse gratuite",
    axeCoreBadge: "Propulsé par axe-core® — le moteur de test d'accessibilité le plus fiable au monde"
  },
  testimonials: {
    title: "Ce que disent nos partenaires pilotes",
    subtitle: "Retours d'agences qui testent VexNexa dans leurs workflows.",
    t1: {
      quote: "VexNexa nous a fait gagner des heures par client. Les rapports en marque blanche semblent avoir été créés par nous.",
      attribution: "Partenaire pilote — Agence digitale, Pays-Bas"
    },
    t2: {
      quote: "Nous avons enfin un workflow d'accessibilité reproductible. Analyser, rapporter, surveiller — c'est fait.",
      attribution: "Partenaire pilote — Studio web, Allemagne"
    },
    t3: {
      quote: "La priorisation nous a convaincus. Nous savons exactement quoi corriger en premier pour chaque client.",
      attribution: "Partenaire pilote — Équipe conformité, Belgique"
    }
  },
  sampleReport: {
    title: "Découvrez à quoi ressemble un rapport",
    subtitle: "Professionnel, structuré et prêt à partager avec vos clients ou parties prenantes. Consultez un vrai exemple de rapport avec des scores d'accessibilité, des problèmes priorisés et des conseils de correction.",
    ctaPrimary: "Voir un exemple de rapport",
    ctaSecondary: "En savoir plus sur les rapports en marque blanche"
  },
  agencyOffer: {
    badge: "Offre agence",
    title: "Obtenez un rapport d'accessibilité personnalisé pour un site",
    subtitle: "Découvrez comment VexNexa s'intègre à votre workflow d'agence avec un exemple de rapport et un parcours pratique pour une surveillance continue.",
    ctaPrimary: "Voir un exemple de rapport",
    ctaSecondary: "Contactez-nous pour l'utilisation en agence"
  },
  workflow: {
    title: "Comment VexNexa s'intègre à votre workflow",
    subtitle: "Analysez, examinez, rapportez. Répétez au fil de l'évolution de vos sites.",
    stepLabel: "Étape",
    s1: {
      title: "Analyser un site",
      description: "Entrez une URL. Obtenez un audit WCAG 2.2 complet en quelques minutes avec des problèmes classés par gravité et un contexte au niveau des éléments."
    },
    s2: {
      title: "Examiner les problèmes priorisés",
      description: "Voyez exactement ce qui ne va pas, pourquoi c'est important et comment le corriger. Filtrez par gravité, critère WCAG ou élément de page."
    },
    s3: {
      title: "Partager les rapports et surveiller dans le temps",
      description: "Exportez des rapports personnalisés. Planifiez des analyses récurrentes. Recevez des notifications lors de changements de score. Construisez un processus d'amélioration continue."
    }
  },
  pilotBanner: {
    badge: "Places limitées",
    title: "Rejoignez le programme de partenariat pilote",
    subtitle: "Obtenez un accès niveau Business, un support direct et contribuez à façonner VexNexa — tout en offrant l'accessibilité à vos clients dès le premier jour.",
    ctaPrimary: "En savoir plus",
    ctaSecondary: "Postuler maintenant"
  },
  faqSection: {
    q1: {
      question: "VexNexa peut-il garantir la conformité légale ?",
      answer: "Aucun outil ne peut garantir une conformité légale à 100 %. VexNexa détecte et signale les problèmes d'accessibilité, aide à prioriser les corrections et soutient la préparation aux normes WCAG et EAA. Pour une évaluation des risques juridiques, nous recommandons de combiner l'analyse automatisée avec un examen par un expert."
    },
    q2: {
      question: "Ai-je besoin d'un compte pour analyser ?",
      answer: "Oui, un compte gratuit est requis. Cela nous permet de sauvegarder vos résultats, de fournir des exports et de suivre les améliorations au fil du temps. Aucune carte de crédit nécessaire pour commencer."
    },
    q3: {
      question: "Puis-je exporter des rapports personnalisés pour mes clients ?",
      answer: "Oui. Les exports PDF et DOCX sont disponibles sur les plans payants. Les plans Business et Enterprise incluent des rapports en marque blanche avec votre propre logo, couleurs et coordonnées."
    },
    q4: {
      question: "Comment fonctionne la surveillance continue ?",
      answer: "Planifiez des analyses automatiques quotidiennes, hebdomadaires ou mensuelles. VexNexa vous alerte par e-mail lorsque les scores baissent ou que de nouveaux problèmes critiques apparaissent. Suivez les tendances depuis votre tableau de bord."
    },
    q5: {
      question: "VexNexa est-il un overlay d'accessibilité ?",
      answer: "Non. Nous analysons la structure de votre code et signalons les vraies violations WCAG. Nous n'injectons jamais de widgets ou de scripts dans votre site. Nos rapports aident les développeurs à corriger les problèmes à la source."
    },
    q6: {
      question: "Quel support est disponible ?",
      answer: "Tous les utilisateurs bénéficient du support par e-mail. Nous visons à répondre sous 1 jour ouvré. Les plans Business et Enterprise incluent un support prioritaire avec des délais de réponse plus courts."
    }
  },
  finalCta: {
    title: "Commencez la surveillance de l'accessibilité aujourd'hui",
    subtitle: "Créez votre compte gratuit. Lancez votre première analyse. Voyez les résultats en quelques minutes. Passez à un plan supérieur quand vous avez besoin de surveillance, rapports et gestion multi-sites.",
    ctaPrimary: "Lancer une analyse gratuite",
    ctaSecondary: "Voir les tarifs"
  }
};

const homeES = {
  hero: {
    title: "Monitoreo WCAG en marca blanca para",
    titleHighlight: "agencias y equipos europeos",
    subtitle: "Escanee sitios web, detecte regresiones de accesibilidad después de cada lanzamiento y entregue informes personalizados compatibles con WCAG 2.2 y la preparación para el EAA.",
    ctaPrimary: "Iniciar análisis gratuito",
    ctaSecondary: "Ver informe de ejemplo",
    noCreditCard: "Se requiere cuenta gratuita. No se necesita tarjeta de crédito.",
    imageAlt: "Panel de VexNexa para análisis de accesibilidad con informes WCAG detallados y priorización de problemas"
  },
  socialProof: {
    title: "Agencias de toda Europa confían en nosotros",
    logo1: "Agency Partner",
    logo2: "Digital Studio",
    logo3: "Web Team",
    logo4: "Compliance Co."
  },
  trustStrip: {
    automated: "Verificaciones automatizadas en minutos",
    branded: "Informes personalizados para clientes y partes interesadas",
    continuous: "Monitoreo continuo para sitios web en producción"
  },
  whyTeams: {
    title: "Por qué los equipos eligen VexNexa",
    subtitle: "Herramientas operativas de accesibilidad que se integran en su forma de trabajar.",
    catchIssues: {
      title: "Detecte problemas antes que sus clientes",
      description: "Ejecute análisis según los criterios WCAG 2.2 y vea los problemas priorizados con detalles a nivel de elemento. Corrija primero lo más importante."
    },
    whiteLabel: {
      title: "Convierta análisis en informes de marca blanca",
      description: "Exporte informes PDF y DOCX con su propio logo. Comparta informes de accesibilidad profesionales con clientes y partes interesadas."
    },
    monitor: {
      title: "Monitoree la accesibilidad después de cada lanzamiento",
      description: "Programe análisis recurrentes. Reciba alertas cuando las puntuaciones bajen o aparezcan nuevos problemas críticos. Evite regresiones en producción."
    }
  },
  builtFor: {
    title: "Diseñado para agencias y equipos europeos",
    subtitle: "Ya sea que gestione un sitio o cincuenta, VexNexa le proporciona las herramientas de flujo de trabajo para entregar sitios web accesibles.",
    agencies: {
      title: "Agencias y estudios web",
      description: "Escanee sitios de clientes, exporte informes personalizados y ofrezca monitoreo continuo como servicio. Gestione múltiples proyectos de clientes desde un solo panel."
    },
    compliance: {
      title: "Equipos internos de cumplimiento",
      description: "Realice seguimiento de la accesibilidad en su organización. Programe análisis después de cada despliegue. Genere evidencia de supervisión continua para la preparación al EAA."
    },
    partners: {
      title: "Socios que gestionan múltiples sitios",
      description: "Monitoree la accesibilidad en un portafolio de sitios web. Detecte regresiones tempranamente. Entregue informes claros y priorizados a las partes interesadas."
    }
  },
  whatYouGet: {
    title: "Lo que obtiene con",
    titleHighlight: "VexNexa",
    subtitle: "Todo lo que necesita para analizar, informar y monitorear — sin el ruido.",
    c1: "Análisis WCAG 2.2 AA con motor axe-core®",
    c2: "Problemas clasificados por gravedad: Crítico, Grave, Moderado, Menor",
    c3: "Exportación PDF y DOCX con branding de marca blanca",
    c4: "Monitoreo continuo con análisis programados",
    c5: "Alertas de regresión de puntuación por correo electrónico",
    c6: "Gestión multi-sitio desde un solo panel",
    c7: "Colaboración en equipo con acceso basado en roles",
    c8: "Alojado en la UE, infraestructura conforme al RGPD",
    cta: "Iniciar análisis gratuito",
    axeCoreBadge: "Impulsado por axe-core® — el motor de pruebas de accesibilidad más confiable del mundo"
  },
  testimonials: {
    title: "Lo que dicen nuestros socios piloto",
    subtitle: "Comentarios tempranos de agencias que prueban VexNexa en sus flujos de trabajo.",
    t1: {
      quote: "VexNexa nos ahorró horas por cliente. Los informes de marca blanca parecen creados por nosotros mismos.",
      attribution: "Socio piloto — Agencia digital, Países Bajos"
    },
    t2: {
      quote: "Por fin tenemos un flujo de trabajo de accesibilidad repetible. Escanear, informar, monitorear — listo.",
      attribution: "Socio piloto — Estudio web, Alemania"
    },
    t3: {
      quote: "La priorización nos convenció. Sabemos exactamente qué corregir primero para cada cliente.",
      attribution: "Socio piloto — Equipo de cumplimiento, Bélgica"
    }
  },
  sampleReport: {
    title: "Vea cómo luce un informe",
    subtitle: "Profesional, estructurado y listo para compartir con clientes o partes interesadas. Explore un informe de ejemplo real con puntuaciones de accesibilidad, problemas priorizados y guía de corrección.",
    ctaPrimary: "Ver informe de ejemplo",
    ctaSecondary: "Más sobre informes de marca blanca"
  },
  agencyOffer: {
    badge: "Oferta para agencias",
    title: "Obtenga un informe de accesibilidad personalizado para un sitio",
    subtitle: "Descubra cómo VexNexa se integra en el flujo de trabajo de su agencia con un informe de ejemplo y un camino práctico para el monitoreo continuo.",
    ctaPrimary: "Ver informe de ejemplo",
    ctaSecondary: "Contáctenos sobre uso en agencias"
  },
  workflow: {
    title: "Cómo VexNexa se integra en su flujo de trabajo",
    subtitle: "Analice, revise, informe. Repita a medida que sus sitios evolucionan.",
    stepLabel: "Paso",
    s1: {
      title: "Analizar un sitio",
      description: "Ingrese una URL. Obtenga una auditoría WCAG 2.2 completa en minutos con problemas clasificados por gravedad y contexto a nivel de elemento."
    },
    s2: {
      title: "Revisar problemas priorizados",
      description: "Vea exactamente qué está mal, por qué es importante y cómo corregirlo. Filtre por gravedad, criterio WCAG o elemento de página."
    },
    s3: {
      title: "Compartir informes y monitorear en el tiempo",
      description: "Exporte informes personalizados. Programe análisis recurrentes. Reciba notificaciones cuando cambien las puntuaciones. Construya un proceso de mejora continua."
    }
  },
  pilotBanner: {
    badge: "Plazas limitadas",
    title: "Únase al programa de socios piloto",
    subtitle: "Obtenga acceso nivel Business, soporte directo y ayude a dar forma a VexNexa — mientras ofrece accesibilidad a sus clientes desde el primer día.",
    ctaPrimary: "Más información",
    ctaSecondary: "Solicitar ahora"
  },
  faqSection: {
    q1: {
      question: "¿Puede VexNexa garantizar el cumplimiento legal?",
      answer: "Ninguna herramienta puede garantizar el cumplimiento legal al 100 %. VexNexa detecta e informa problemas de accesibilidad, ayuda a priorizar correcciones y apoya la preparación para WCAG y EAA. Para una evaluación de riesgos legales, recomendamos combinar el análisis automatizado con una revisión experta."
    },
    q2: {
      question: "¿Necesito una cuenta para analizar?",
      answer: "Sí, se requiere una cuenta gratuita. Esto nos permite guardar sus resultados, proporcionar exportaciones y realizar seguimiento de mejoras. No se necesita tarjeta de crédito para comenzar."
    },
    q3: {
      question: "¿Puedo exportar informes personalizados para mis clientes?",
      answer: "Sí. Las exportaciones PDF y DOCX están disponibles en planes de pago. Los planes Business y Enterprise incluyen informes de marca blanca con su propio logo, colores y datos de contacto."
    },
    q4: {
      question: "¿Cómo funciona el monitoreo continuo?",
      answer: "Programe análisis automáticos diarios, semanales o mensuales. VexNexa le alerta por correo electrónico cuando las puntuaciones bajan o aparecen nuevos problemas críticos. Realice seguimiento de tendencias desde su panel."
    },
    q5: {
      question: "¿Es VexNexa un overlay de accesibilidad?",
      answer: "No. Analizamos la estructura de su código e informamos sobre violaciones WCAG reales. Nunca inyectamos widgets o scripts en su sitio. Nuestros informes ayudan a los desarrolladores a corregir problemas en la fuente."
    },
    q6: {
      question: "¿Qué soporte está disponible?",
      answer: "Todos los usuarios reciben soporte por correo electrónico. Respondemos en un plazo de 1 día hábil. Los planes Business y Enterprise incluyen soporte prioritario con tiempos de respuesta más rápidos."
    }
  },
  finalCta: {
    title: "Comience el monitoreo de accesibilidad hoy",
    subtitle: "Cree su cuenta gratuita. Ejecute su primer análisis. Vea resultados en minutos. Actualice cuando necesite monitoreo, informes y gestión multi-sitio.",
    ctaPrimary: "Iniciar análisis gratuito",
    ctaSecondary: "Ver precios"
  }
};

// Update each locale file
function updateLocale(locale, homeData) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  let data;
  
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    // For DE, start from EN as base
    data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf8'));
  }
  
  // Preserve old home keys that might be used elsewhere, but add new structure
  data.home = { ...data.home, ...homeData };
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${locale}.json home section`);
}

updateLocale('en', homeEN);
updateLocale('nl', homeNL);
updateLocale('de', homeDE);
updateLocale('fr', homeFR);
updateLocale('es', homeES);

console.log('Done! All home translations updated.');
