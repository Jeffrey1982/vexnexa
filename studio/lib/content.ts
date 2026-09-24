export const locales = ['nl', 'en', 'de', 'fr', 'es', 'pt', 'tl'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'nl';
export const languageNames: Record<Locale, string> = {
  nl: 'Nederlands', en: 'English', de: 'Deutsch', fr: 'Français',
  es: 'Español', pt: 'Português', tl: 'Tagalog',
};
export const pageNames = ['home', 'ipiwow', 'studio', 'contact', 'privacy', 'support'] as const;
export type PageName = (typeof pageNames)[number];
export type TextSection = { title: string; body: string };
export type SeoContent = { title: string; description: string };

export interface StudioContent {
  nav: { games: string; studio: string; contact: string };
  common: {
    language: string; skipToContent: string; menu: string; closeMenu: string;
    backHome: string; appStore: string; email: string; mascotAlt: string;
  };
  home: {
    eyebrow: string; heroTitle: [string, string]; intro: string; cta: string;
    gamesEyebrow: string; gamesTitle: string; spotlightTitle: string;
    spotlightDescription: string; gameCta: string; facts: [string, string, string];
    studioEyebrow: string; studioTitle: string; studioIntro: string; studioCta: string;
    contactTitle: string; contactIntro: string; contactCta: string;
  };
  ipiwow: {
    eyebrow: string; tagline: string; intro: string; appStoreNote: string;
    screenshotsTitle: string; screenshotAlts: [string, string, string];
    features: [TextSection, TextSection, TextSection]; detailsTitle: string;
    details: [TextSection, TextSection, TextSection, TextSection];
    languagesTitle: string; languagesBody: string; parentTitle: string;
    parentBody: string; supportCta: string; privacyCta: string;
  };
  studio: {
    eyebrow: string; title: string; intro: string; paragraphs: [string, string];
    values: [TextSection, TextSection, TextSection]; contactCta: string;
  };
  contact: {
    eyebrow: string; title: string; intro: string; directTitle: string; directBody: string;
    nameLabel: string; emailLabel: string; messageLabel: string;
    namePlaceholder: string; emailPlaceholder: string; messagePlaceholder: string;
    requiredHint: string; privacyIntro: string; privacyLink: string; privacyLabel: string;
    submit: string; sending: string; successTitle: string; successBody: string; reset: string;
    errors: {
      name: string; email: string; privacyAccepted: string; message: string;
      rateLimit: string; send: string; unavailable: string;
    };
  };
  privacy: { eyebrow: string; title: string; intro: string; sections: TextSection[]; contactCta: string };
  support: {
    eyebrow: string; title: string; intro: string; gameTitle: string; gameBody: string;
    formerTitle: string; formerBody: string; billingNote: string; contactCta: string;
  };
  footer: { tagline: string; privacy: string; support: string; rights: string };
  seo: Record<PageName, SeoContent>;
}

export const content = {
  nl: {
    nav: { games: 'Games', studio: 'Studio', contact: 'Contact' },
    common: {
      language: 'Taal kiezen', skipToContent: 'Naar de inhoud', menu: 'Menu openen',
      closeMenu: 'Menu sluiten', backHome: 'Terug naar de homepage',
      appStore: 'Bekijk in de App Store', email: 'Mail ons',
      mascotAlt: 'IpiWow, een vrolijke blauwe aardbol met groene continenten',
    },
    home: {
      eyebrow: 'VexNexa gamestudio', heroTitle: ['Nieuwsgierig?', 'Druk op play.'],
      intro: 'Games om te ontdekken. Gemaakt door VexNexa.', cta: 'Ontdek onze games',
      gamesEyebrow: 'Onze games', gamesTitle: 'Klein begin. Groot avontuur.',
      spotlightTitle: 'Spelen. Ontdekken. Meer weten.',
      spotlightDescription: 'Een vrolijk kennisavontuur met vragen, puzzels en 200 levels.',
      gameCta: 'Ontdek IpiWow', facts: ['10 kenniscategorieën', 'Speel offline', 'Geen advertenties of abonnement'],
      studioEyebrow: 'Achter de games', studioTitle: 'Gemaakt met aandacht. Gespeeld met plezier.',
      studioIntro: 'VexNexa is een onafhankelijke gamestudio. We maken speelse werelden die nieuwsgierigheid de ruimte geven, te beginnen met IpiWow.',
      studioCta: 'Maak kennis met VexNexa', contactTitle: 'Een idee? Een vraag? Zeg hallo.',
      contactIntro: 'Over onze games, een samenwerking of iets dat beter kan: we horen graag van je.',
      contactCta: 'Neem contact op',
    },
    ipiwow: {
      eyebrow: 'Een game van VexNexa', tagline: 'Een kleine hop. Een groot avontuur.',
      intro: 'Reis mee met IpiWow en ontdek spelenderwijs de wereld om je heen. Kies een kenniscategorie, los puzzels op en maak stap voor stap nieuwe ontdekkingen.',
      appStoreNote: 'Voor iPhone. De actuele prijs en compatibiliteit staan in de App Store.',
      screenshotsTitle: 'Kijk even binnen',
      screenshotAlts: ['IpiWow: ontdek het kennisavontuur', 'IpiWow: kies uit kleurrijke kenniswerelden', 'IpiWow: spelen en leren met vragen en puzzels'],
      features: [
        { title: 'Volg je nieuwsgierigheid', body: 'Tien kenniscategorieën met elk twintig levels. Quizvragen, korte onderwerp-animaties en afwisselende puzzels houden elke ontdekking anders.' },
        { title: 'Op jouw manier', body: 'Kies een moeilijkheidsniveau voor 5–8, 9–12 of 13–16 jaar. Speel staand of liggend, met of zonder zandloper.' },
        { title: 'Kopen. Spelen. Klaar.', body: 'Alle categorieën en levels zijn inbegrepen. Geen advertenties, abonnement of in-app aankopen. Na het downloaden speel je offline.' },
      ],
      detailsTitle: 'Het avontuur in het kort',
      details: [
        { title: 'Categorieën', body: '10 kenniswerelden' }, { title: 'Levels', body: '200 om te ontdekken' },
        { title: 'Verbinding', body: 'Offline speelbaar' }, { title: 'Spelersaccount', body: 'Geen online account nodig' },
      ],
      languagesTitle: 'Zeven talen. Dezelfde nieuwsgierigheid.',
      languagesBody: 'Speel in het Nederlands, Engels, Duits, Frans, Spaans, Europees Portugees of Tagalog.',
      parentTitle: 'Ook aan ouders gedacht',
      parentBody: 'Een apart oudergedeelte geeft controle over spelinstellingen, geluid en vrijwillige herinneringen. Herinneringen staan standaard uit. Een lokaal profiel gebruikt een bijnaam en leeftijd; voortgang en instellingen blijven op het toestel.',
      supportCta: 'Hulp bij IpiWow', privacyCta: 'Privacy en contact',
    },
    studio: {
      eyebrow: 'Dit is VexNexa', title: 'Ruimte voor een beetje verwondering.',
      intro: 'We maken games voor nieuwsgierige mensen. Kleurrijk, uitnodigend en met aandacht voor de kleine dingen die spelen fijn maken.',
      paragraphs: [
        'VexNexa is een onafhankelijke gamestudio. Met IpiWow brengen we vragen, puzzels en nieuwe ontdekkingen samen in één vrolijk avontuur.',
        'Onze richting is eenvoudig: games maken waar we zelf met plezier aan werken en die je graag nog een keer opent. Geen grote beloften, wel aandacht voor wat je speelt.',
      ],
      values: [
        { title: 'Nieuwsgierigheid voorop', body: 'Een goede vraag kan het begin zijn van een heel avontuur.' },
        { title: 'Plezier in de details', body: 'Van een kleine animatie tot een duidelijke knop: het hoort bij de ervaring.' },
        { title: 'Duidelijk over onze games', body: 'Je ziet wat een game biedt, waar je hem kunt spelen en hoe je ons bereikt.' },
      ], contactCta: 'Praat met ons',
    },
    contact: {
      eyebrow: 'Zeg hallo', title: 'We horen graag van je.',
      intro: 'Een vraag over IpiWow, een idee voor een samenwerking of feedback? Stuur ons een bericht.',
      directTitle: 'Liever je eigen mailprogramma?', directBody: 'Je kunt ons ook rechtstreeks mailen op',
      nameLabel: 'Naam', emailLabel: 'E-mailadres', messageLabel: 'Je bericht',
      namePlaceholder: 'Hoe mogen we je noemen?', emailPlaceholder: 'jij@voorbeeld.nl', messagePlaceholder: 'Waar kunnen we je mee helpen?',
      requiredHint: 'Alle velden zijn verplicht.', privacyIntro: 'We gebruiken je gegevens om op je bericht te reageren. Lees onze', privacyLink: 'privacyverklaring',
      privacyLabel: 'Ik heb de privacyverklaring gelezen.',
      submit: 'Verstuur bericht', sending: 'Bericht versturen…', successTitle: 'Je bericht is verzonden.',
      successBody: 'Bedankt voor je bericht. We reageren via het e-mailadres dat je hebt ingevuld.', reset: 'Nog een bericht sturen',
      errors: {
        name: 'Vul je naam in, met 2 tot 100 tekens.', email: 'Vul een geldig e-mailadres in, zodat we je kunnen antwoorden.',
        privacyAccepted: 'Lees de privacyverklaring en vink het vakje aan om verder te gaan.', message: 'Schrijf een bericht van 10 tot 5.000 tekens.',
        rateLimit: 'Er zijn te veel berichten verstuurd. Probeer het later opnieuw of mail ons rechtstreeks.',
        send: 'We konden de verzending niet bevestigen. Probeer opnieuw of mail info@vexnexa.com.',
        unavailable: 'Het formulier is tijdelijk niet beschikbaar. Mail ons op info@vexnexa.com.',
      },
    },
    privacy: {
      eyebrow: 'Privacy', title: 'Wat er met je gegevens gebeurt.',
      intro: 'Deze uitleg gaat over de VexNexa-website en berichten die je ons stuurt. Voor informatie over IpiWow kun je ook de privacy-informatie in de app lezen.',
      sections: [
        { title: 'Wie je kunt bereiken', body: 'VexNexa beheert deze website. Heb je een privacyvraag of een verzoek over je gegevens? Mail info@vexnexa.com.' },
        { title: 'Als je contact opneemt', body: 'Via het formulier ontvangen we je naam, e-mailadres en bericht. We gebruiken die informatie om je vraag te behandelen en te beantwoorden, niet om je zonder toestemming marketing te sturen. Stuur geen wachtwoorden, betaalkaartgegevens of andere gevoelige informatie mee.' },
        { title: 'Hosting en e-mail', body: 'Vercel verzorgt de hosting en Resend verstuurt formulierberichten naar onze mailbox. Deze diensten verwerken daarbij technische gegevens die nodig zijn voor levering, beveiliging en het voorkomen van misbruik, zoals IP-adres en verzoekgegevens. De website gebruikt geen eigen account- of contactdatabase.' },
        { title: 'Cookies en metingen', body: 'De nieuwe gamestudio-website gebruikt geen advertentietrackers of bezoekersanalyses. Technische verwerking door de hostingprovider kan nodig zijn om de website veilig te laten werken. Als je een externe link volgt, bijvoorbeeld naar de App Store, geldt het privacybeleid van die dienst.' },
        { title: 'Bewaren en verwijderen', body: 'We bewaren correspondentie zolang dat nodig is om je vraag af te handelen en voor eventuele noodzakelijke administratie. Je kunt vragen welke gegevens we van je hebben, of verzoeken om correctie of verwijdering. We beoordelen je verzoek en houden rekening met eventuele bewaarplichten.' },
        { title: 'IpiWow en lokale gegevens', body: 'IpiWow heeft geen online spelersaccount nodig. Een lokaal profiel bevat een bijnaam en leeftijd; voortgang en instellingen blijven op het toestel. De app werkt offline. Apple verwerkt de aankoop via de App Store onder zijn eigen voorwaarden en privacybeleid.' },
        { title: 'Eerdere VexNexa-diensten', body: 'Deze nieuwe website verandert niet automatisch eerdere afspraken, abonnementen of bewaartermijnen van de voormalige toegankelijkheidsdienst. Heb je daar een vraag over, neem dan contact op met je referentie of factuurnummer. Deel geen betaalgegevens.' },
      ], contactCta: 'Stel een privacyvraag',
    },
    support: {
      eyebrow: 'Ondersteuning', title: 'Waar kunnen we je mee helpen?', intro: 'VexNexa richt zich nu op gameontwikkeling. Voor vragen over onze games én eerder gebruik van VexNexa kun je ons bereiken.',
      gameTitle: 'Hulp bij IpiWow', gameBody: 'Vertel wat er gebeurt, welk toestel je gebruikt en, als je het weet, welke appversie je hebt. Stuur geen persoonlijke gegevens van een kind mee.',
      formerTitle: 'Eerdere toegankelijkheidsdiensten', formerBody: 'Heb je een vraag over eerder gebruik, een factuur of een abonnement? Mail ons met je referentie of factuurnummer. De nieuwe website heeft geen SaaS-login of betaalpagina.',
      billingNote: 'De wijziging van deze website is geen bevestiging dat een bestaand abonnement is beëindigd. Neem contact op als je daar duidelijkheid over nodig hebt.', contactCta: 'Neem contact op',
    },
    footer: { tagline: 'Games om te ontdekken.', privacy: 'Privacy', support: 'Ondersteuning', rights: 'Alle rechten voorbehouden.' },
    seo: {
      home: { title: 'VexNexa | Games om te ontdekken', description: 'Ontdek VexNexa, de onafhankelijke gamestudio achter IpiWow. Kleurrijke games voor nieuwsgierige spelers, in zeven talen.' },
      ipiwow: { title: 'IpiWow | Een kennisavontuur van VexNexa', description: 'Ontdek IpiWow: 10 kenniscategorieën, 200 levels, vragen en puzzels. Speel offline op iPhone, zonder advertenties of abonnement.' },
      studio: { title: 'De studio | VexNexa', description: 'Maak kennis met VexNexa, de onafhankelijke gamestudio achter IpiWow. Games met ruimte voor nieuwsgierigheid, ontdekking en plezier.' },
      contact: { title: 'Contact | VexNexa', description: 'Een vraag over IpiWow, feedback of een samenwerking? Neem contact op met VexNexa via het formulier of info@vexnexa.com.' },
      privacy: { title: 'Privacy | VexNexa', description: 'Lees hoe de VexNexa-website omgaat met contactgegevens, hosting en e-mail, en waar je terechtkunt met een privacyvraag.' },
      support: { title: 'Ondersteuning | VexNexa', description: 'Hulp bij IpiWow of een vraag over eerdere VexNexa-diensten? Hier lees je hoe je contact met ons opneemt.' },
    },
  },
  en: {
    nav: { games: 'Games', studio: 'Studio', contact: 'Contact' },
    common: {
      language: 'Choose language', skipToContent: 'Skip to content', menu: 'Open menu',
      closeMenu: 'Close menu', backHome: 'Back to home', appStore: 'View on the App Store',
      email: 'Email us', mascotAlt: 'IpiWow, a cheerful blue globe with green continents',
    },
    home: {
      eyebrow: 'VexNexa game studio', heroTitle: ['Feeling curious?', 'Press play.'],
      intro: 'Games to discover. Made by VexNexa.', cta: 'Explore our games',
      gamesEyebrow: 'Our games', gamesTitle: 'Small beginnings. Big adventures.',
      spotlightTitle: 'Play. Explore. Learn something new.',
      spotlightDescription: 'A cheerful adventure through knowledge, with questions, puzzles and 200 levels.',
      gameCta: 'Discover IpiWow', facts: ['10 knowledge categories', 'Play offline', 'No ads or subscription'],
      studioEyebrow: 'Behind the games', studioTitle: 'Made with care. Played with joy.',
      studioIntro: 'VexNexa is an independent game studio. We make playful worlds that give curiosity room to grow, starting with IpiWow.',
      studioCta: 'Meet VexNexa', contactTitle: 'An idea? A question? Say hello.',
      contactIntro: 'Our games, a collaboration or something we could improve: we would love to hear from you.', contactCta: 'Get in touch',
    },
    ipiwow: {
      eyebrow: 'A game by VexNexa', tagline: 'One little hop. One big adventure.',
      intro: 'Join IpiWow and discover the world through play. Pick a knowledge category, solve puzzles and make new discoveries, one step at a time.',
      appStoreNote: 'For iPhone. See the App Store for current pricing and compatibility.',
      screenshotsTitle: 'Take a peek',
      screenshotAlts: ['IpiWow: discover an adventure through knowledge', 'IpiWow: choose a colourful world of knowledge', 'IpiWow: play and learn with questions and puzzles'],
      features: [
        { title: 'Follow your curiosity', body: 'Ten knowledge categories, each with twenty levels. Quiz questions, short topic animations and varied puzzles make every discovery different.' },
        { title: 'Play your way', body: 'Choose a difficulty level for ages 5–8, 9–12 or 13–16. Play in portrait or landscape, with or without the hourglass.' },
        { title: 'Buy. Play. That is it.', body: 'Every category and level is included. No ads, subscription or in-app purchases. Once downloaded, you can play offline.' },
      ],
      detailsTitle: 'The adventure at a glance',
      details: [
        { title: 'Categories', body: '10 worlds of knowledge' }, { title: 'Levels', body: '200 to discover' },
        { title: 'Connection', body: 'Play offline' }, { title: 'Player account', body: 'No online account needed' },
      ],
      languagesTitle: 'Seven languages. The same curiosity.',
      languagesBody: 'Play in Dutch, English, German, French, Spanish, European Portuguese or Tagalog.',
      parentTitle: 'Parents are part of the picture',
      parentBody: 'A separate parent area gives control over game settings, sound and optional reminders. Reminders are off by default. A local profile uses a nickname and age; progress and settings stay on the device.',
      supportCta: 'Help with IpiWow', privacyCta: 'Privacy and contact',
    },
    studio: {
      eyebrow: 'This is VexNexa', title: 'Room for a little wonder.',
      intro: 'We make games for curious people. Colourful, inviting and thoughtful about the little things that make playing feel good.',
      paragraphs: [
        'VexNexa is an independent game studio. With IpiWow, we bring questions, puzzles and new discoveries together in one cheerful adventure.',
        'Our direction is simple: make games we enjoy creating and you want to open again. No grand promises, just care for what you play.',
      ],
      values: [
        { title: 'Curiosity comes first', body: 'A good question can be the beginning of a whole adventure.' },
        { title: 'Joy in the details', body: 'From a small animation to a clear button, it is all part of the experience.' },
        { title: 'Clear about our games', body: 'See what a game offers, where to play it and how to reach us.' },
      ], contactCta: 'Talk to us',
    },
    contact: {
      eyebrow: 'Say hello', title: 'We would love to hear from you.',
      intro: 'A question about IpiWow, a collaboration idea or feedback? Send us a message.',
      directTitle: 'Prefer your own email app?', directBody: 'You can also email us directly at',
      nameLabel: 'Name', emailLabel: 'Email address', messageLabel: 'Your message',
      namePlaceholder: 'What should we call you?', emailPlaceholder: 'you@example.com', messagePlaceholder: 'How can we help?',
      requiredHint: 'All fields are required.', privacyIntro: 'We use your details to reply to your message. Read our', privacyLink: 'privacy notice',
      privacyLabel: 'I have read the privacy notice.', submit: 'Send message', sending: 'Sending your message…',
      successTitle: 'Your message has been sent.', successBody: 'Thanks for getting in touch. We will reply to the email address you provided.', reset: 'Send another message',
      errors: {
        name: 'Enter your name using 2 to 100 characters.', email: 'Enter a valid email address so we can reply.',
        privacyAccepted: 'Read the privacy notice and tick the box to continue.', message: 'Write a message between 10 and 5,000 characters.',
        rateLimit: 'Too many messages have been sent. Try again later or email us directly.',
        send: 'We could not confirm whether your message was sent. Try again or email info@vexnexa.com.',
        unavailable: 'The form is temporarily unavailable. Email us at info@vexnexa.com.',
      },
    },
    privacy: {
      eyebrow: 'Privacy', title: 'What happens to your information.',
      intro: 'This notice covers the VexNexa website and messages you send us. For information about IpiWow, you can also read the privacy information in the app.',
      sections: [
        { title: 'Who to contact', body: 'VexNexa operates this website. For a privacy question or a request about your information, email info@vexnexa.com.' },
        { title: 'When you contact us', body: 'The form sends us your name, email address and message. We use this information to handle and answer your enquiry, not to send marketing without your permission. Do not include passwords, payment card details or other sensitive information.' },
        { title: 'Hosting and email', body: 'Vercel hosts the website and Resend delivers form messages to our inbox. These services process technical information needed for delivery, security and abuse prevention, such as IP addresses and request details. The website has no account or contact database of its own.' },
        { title: 'Cookies and measurement', body: 'The new game studio website uses no advertising trackers or visitor analytics. The hosting provider may need to process technical data to keep the website secure. External links, such as the App Store, are covered by that service’s own privacy policy.' },
        { title: 'Keeping and deleting information', body: 'We keep correspondence for as long as needed to handle your enquiry and any necessary administration. You can ask what information we hold about you, or request correction or deletion. We assess your request while taking any retention obligations into account.' },
        { title: 'IpiWow and local data', body: 'IpiWow does not require an online player account. A local profile contains a nickname and age; progress and settings stay on the device. The app works offline. Apple processes App Store purchases under its own terms and privacy policy.' },
        { title: 'Previous VexNexa services', body: 'This new website does not automatically change previous agreements, subscriptions or retention periods for the former accessibility service. If you have a question about this, contact us with your reference or invoice number. Do not share payment details.' },
      ], contactCta: 'Ask a privacy question',
    },
    support: {
      eyebrow: 'Support', title: 'How can we help?', intro: 'VexNexa now focuses on game development. You can contact us about our games and your previous use of VexNexa.',
      gameTitle: 'Help with IpiWow', gameBody: 'Tell us what happens, which device you use and, if you know it, your app version. Do not include a child’s personal information.',
      formerTitle: 'Previous accessibility services', formerBody: 'A question about previous use, an invoice or a subscription? Email us with your reference or invoice number. The new website has no SaaS login or checkout.',
      billingNote: 'The change to this website does not confirm that an existing subscription has ended. Contact us if you need clarification.', contactCta: 'Get in touch',
    },
    footer: { tagline: 'Games to discover.', privacy: 'Privacy', support: 'Support', rights: 'All rights reserved.' },
    seo: {
      home: { title: 'VexNexa | Games to discover', description: 'Meet VexNexa, the independent game studio behind IpiWow. Colourful games for curious players, in seven languages.' },
      ipiwow: { title: 'IpiWow | A knowledge adventure by VexNexa', description: 'Discover IpiWow: 10 knowledge categories, 200 levels, questions and puzzles. Play offline on iPhone with no ads or subscription.' },
      studio: { title: 'The studio | VexNexa', description: 'Meet VexNexa, the independent game studio behind IpiWow. Games with room for curiosity, discovery and joy.' },
      contact: { title: 'Contact | VexNexa', description: 'A question about IpiWow, feedback or a collaboration? Contact VexNexa through the form or at info@vexnexa.com.' },
      privacy: { title: 'Privacy | VexNexa', description: 'Learn how the VexNexa website handles contact details, hosting and email, and how to reach us with a privacy question.' },
      support: { title: 'Support | VexNexa', description: 'Need help with IpiWow or have a question about previous VexNexa services? Find out how to get in touch.' },
    },
  },
  de: {
    nav: { games: 'Spiele', studio: 'Studio', contact: 'Kontakt' },
    common: {
      language: 'Sprache wählen', skipToContent: 'Zum Inhalt', menu: 'Menü öffnen', closeMenu: 'Menü schließen',
      backHome: 'Zur Startseite', appStore: 'Im App Store ansehen', email: 'Schreib uns', mascotAlt: 'IpiWow, ein fröhlicher blauer Globus mit grünen Kontinenten',
    },
    home: {
      eyebrow: 'VexNexa Spielestudio', heroTitle: ['Neugierig?', 'Dann spiel los.'],
      intro: 'Spiele zum Entdecken. Von VexNexa.', cta: 'Unsere Spiele entdecken',
      gamesEyebrow: 'Unsere Spiele', gamesTitle: 'Kleiner Anfang. Großes Abenteuer.',
      spotlightTitle: 'Spielen. Entdecken. Mehr wissen.', spotlightDescription: 'Ein fröhliches Wissensabenteuer mit Fragen, Rätseln und 200 Levels.',
      gameCta: 'IpiWow entdecken', facts: ['10 Wissenskategorien', 'Offline spielen', 'Ohne Werbung oder Abo'],
      studioEyebrow: 'Hinter den Spielen', studioTitle: 'Mit Sorgfalt gemacht. Mit Freude gespielt.',
      studioIntro: 'VexNexa ist ein unabhängiges Spielestudio. Wir schaffen spielerische Welten, in denen Neugier wachsen kann. Den Anfang macht IpiWow.',
      studioCta: 'VexNexa kennenlernen', contactTitle: 'Eine Idee? Eine Frage? Sag Hallo.',
      contactIntro: 'Unsere Spiele, eine Zusammenarbeit oder etwas, das wir verbessern können: Wir freuen uns auf deine Nachricht.', contactCta: 'Kontakt aufnehmen',
    },
    ipiwow: {
      eyebrow: 'Ein Spiel von VexNexa', tagline: 'Ein kleiner Hüpfer. Ein großes Abenteuer.',
      intro: 'Begleite IpiWow und entdecke die Welt auf spielerische Weise. Wähle eine Wissenskategorie, löse Rätsel und entdecke Schritt für Schritt etwas Neues.',
      appStoreNote: 'Für iPhone. Aktuelle Preise und Kompatibilität findest du im App Store.', screenshotsTitle: 'Schau mal rein',
      screenshotAlts: ['IpiWow: ein Wissensabenteuer entdecken', 'IpiWow: bunte Wissenswelten auswählen', 'IpiWow: spielen und lernen mit Fragen und Rätseln'],
      features: [
        { title: 'Folge deiner Neugier', body: 'Zehn Wissenskategorien mit jeweils zwanzig Levels. Quizfragen, kurze Themenanimationen und abwechslungsreiche Rätsel machen jede Entdeckung anders.' },
        { title: 'Spiel auf deine Art', body: 'Wähle einen Schwierigkeitsgrad für 5–8, 9–12 oder 13–16 Jahre. Spiele im Hoch- oder Querformat, mit oder ohne Sanduhr.' },
        { title: 'Kaufen. Spielen. Fertig.', body: 'Alle Kategorien und Levels sind enthalten. Keine Werbung, kein Abo und keine In-App-Käufe. Nach dem Herunterladen spielst du offline.' },
      ],
      detailsTitle: 'Das Abenteuer auf einen Blick',
      details: [
        { title: 'Kategorien', body: '10 Wissenswelten' }, { title: 'Levels', body: '200 zum Entdecken' },
        { title: 'Verbindung', body: 'Offline spielbar' }, { title: 'Spielerkonto', body: 'Kein Onlinekonto nötig' },
      ],
      languagesTitle: 'Sieben Sprachen. Dieselbe Neugier.',
      languagesBody: 'Spiele auf Niederländisch, Englisch, Deutsch, Französisch, Spanisch, europäischem Portugiesisch oder Tagalog.',
      parentTitle: 'Auch an Eltern gedacht',
      parentBody: 'Ein eigener Elternbereich bietet Kontrolle über Spieleinstellungen, Ton und freiwillige Erinnerungen. Erinnerungen sind standardmäßig ausgeschaltet. Ein lokales Profil verwendet einen Spitznamen und das Alter; Fortschritt und Einstellungen bleiben auf dem Gerät.',
      supportCta: 'Hilfe zu IpiWow', privacyCta: 'Datenschutz und Kontakt',
    },
    studio: {
      eyebrow: 'Das ist VexNexa', title: 'Raum für ein bisschen Staunen.',
      intro: 'Wir machen Spiele für neugierige Menschen. Bunt, einladend und mit Blick für die kleinen Dinge, die Spielen angenehm machen.',
      paragraphs: [
        'VexNexa ist ein unabhängiges Spielestudio. Mit IpiWow verbinden wir Fragen, Rätsel und neue Entdeckungen zu einem fröhlichen Abenteuer.',
        'Unsere Richtung ist einfach: Spiele machen, an denen wir gern arbeiten und die du gern wieder öffnest. Keine großen Versprechen, sondern Sorgfalt für dein Spielerlebnis.',
      ],
      values: [
        { title: 'Neugier steht am Anfang', body: 'Eine gute Frage kann der Beginn eines ganzen Abenteuers sein.' },
        { title: 'Freude am Detail', body: 'Von einer kleinen Animation bis zu einer klaren Schaltfläche: Alles gehört zum Erlebnis.' },
        { title: 'Klare Informationen', body: 'Du siehst, was ein Spiel bietet, wo du es spielen kannst und wie du uns erreichst.' },
      ], contactCta: 'Sprich mit uns',
    },
    contact: {
      eyebrow: 'Sag Hallo', title: 'Wir freuen uns auf deine Nachricht.',
      intro: 'Eine Frage zu IpiWow, eine Idee für eine Zusammenarbeit oder Feedback? Schreib uns.',
      directTitle: 'Lieber dein eigenes E-Mail-Programm?', directBody: 'Du kannst uns auch direkt schreiben an',
      nameLabel: 'Name', emailLabel: 'E-Mail-Adresse', messageLabel: 'Deine Nachricht',
      namePlaceholder: 'Wie dürfen wir dich nennen?', emailPlaceholder: 'du@beispiel.de', messagePlaceholder: 'Wie können wir dir helfen?',
      requiredHint: 'Alle Felder sind Pflichtfelder.', privacyIntro: 'Wir verwenden deine Angaben, um deine Nachricht zu beantworten. Lies unsere', privacyLink: 'Datenschutzhinweise',
      privacyLabel: 'Ich habe die Datenschutzhinweise gelesen.', submit: 'Nachricht senden', sending: 'Nachricht wird gesendet…',
      successTitle: 'Deine Nachricht wurde gesendet.', successBody: 'Danke für deine Nachricht. Wir antworten an die angegebene E-Mail-Adresse.', reset: 'Weitere Nachricht senden',
      errors: {
        name: 'Gib deinen Namen mit 2 bis 100 Zeichen ein.', email: 'Gib eine gültige E-Mail-Adresse ein, damit wir antworten können.',
        privacyAccepted: 'Lies die Datenschutzhinweise und aktiviere das Kästchen, um fortzufahren.', message: 'Schreibe eine Nachricht mit 10 bis 5.000 Zeichen.',
        rateLimit: 'Es wurden zu viele Nachrichten gesendet. Versuche es später erneut oder schreibe uns direkt eine E-Mail.',
        send: 'Wir konnten den Versand nicht bestätigen. Versuche es erneut oder schreibe an info@vexnexa.com.',
        unavailable: 'Das Formular ist vorübergehend nicht verfügbar. Schreibe an info@vexnexa.com.',
      },
    },
    privacy: {
      eyebrow: 'Datenschutz', title: 'Was mit deinen Daten passiert.',
      intro: 'Diese Hinweise betreffen die VexNexa-Website und Nachrichten, die du uns sendest. Informationen zu IpiWow findest du auch in den Datenschutzhinweisen in der App.',
      sections: [
        { title: 'Dein Ansprechpartner', body: 'VexNexa betreibt diese Website. Bei Datenschutzfragen oder Anliegen zu deinen Daten schreibe an info@vexnexa.com.' },
        { title: 'Wenn du uns kontaktierst', body: 'Über das Formular erhalten wir deinen Namen, deine E-Mail-Adresse und deine Nachricht. Wir nutzen diese Angaben, um dein Anliegen zu bearbeiten und zu beantworten, nicht für Werbung ohne deine Erlaubnis. Sende keine Passwörter, Zahlungskartendaten oder andere vertrauliche Informationen.' },
        { title: 'Hosting und E-Mail', body: 'Vercel hostet die Website. Resend übermittelt Formularnachrichten an unser Postfach. Diese Dienste verarbeiten technische Daten für Zustellung, Sicherheit und Missbrauchsschutz, etwa IP-Adressen und Anfragedaten. Die Website hat keine eigene Konto- oder Kontaktdatenbank.' },
        { title: 'Cookies und Messungen', body: 'Die neue Spielestudio-Website verwendet keine Werbetracker oder Besucheranalysen. Der Hostinganbieter kann technische Daten verarbeiten müssen, um die Website sicher zu betreiben. Für externe Links, etwa zum App Store, gilt die Datenschutzerklärung des jeweiligen Dienstes.' },
        { title: 'Aufbewahrung und Löschung', body: 'Wir bewahren Korrespondenz so lange auf, wie es für dein Anliegen und gegebenenfalls notwendige Verwaltungsaufgaben erforderlich ist. Du kannst Auskunft zu deinen Daten sowie Berichtigung oder Löschung anfragen. Wir prüfen dein Anliegen unter Berücksichtigung möglicher Aufbewahrungspflichten.' },
        { title: 'IpiWow und lokale Daten', body: 'IpiWow benötigt kein Online-Spielerkonto. Ein lokales Profil enthält einen Spitznamen und das Alter; Fortschritt und Einstellungen bleiben auf dem Gerät. Die App funktioniert offline. Apple verarbeitet Käufe im App Store nach seinen eigenen Bedingungen und Datenschutzrichtlinien.' },
        { title: 'Frühere VexNexa-Dienste', body: 'Diese neue Website ändert frühere Vereinbarungen, Abonnements oder Aufbewahrungsfristen des ehemaligen Barrierefreiheitsdienstes nicht automatisch. Bei Fragen kontaktiere uns mit deiner Referenz- oder Rechnungsnummer. Teile keine Zahlungsdaten.' },
      ], contactCta: 'Datenschutzfrage stellen',
    },
    support: {
      eyebrow: 'Hilfe', title: 'Wie können wir dir helfen?', intro: 'VexNexa konzentriert sich jetzt auf Spieleentwicklung. Du erreichst uns zu unseren Spielen und zur früheren Nutzung von VexNexa.',
      gameTitle: 'Hilfe zu IpiWow', gameBody: 'Beschreibe, was passiert, welches Gerät du nutzt und, falls bekannt, deine App-Version. Sende keine personenbezogenen Daten eines Kindes.',
      formerTitle: 'Frühere Barrierefreiheitsdienste', formerBody: 'Eine Frage zur früheren Nutzung, einer Rechnung oder einem Abonnement? Schreibe uns mit deiner Referenz- oder Rechnungsnummer. Die neue Website hat keinen SaaS-Login und keine Bezahlseite.',
      billingNote: 'Die Änderung dieser Website bestätigt nicht, dass ein bestehendes Abonnement beendet wurde. Kontaktiere uns, wenn du dazu Klarheit brauchst.', contactCta: 'Kontakt aufnehmen',
    },
    footer: { tagline: 'Spiele zum Entdecken.', privacy: 'Datenschutz', support: 'Hilfe', rights: 'Alle Rechte vorbehalten.' },
    seo: {
      home: { title: 'VexNexa | Spiele zum Entdecken', description: 'Entdecke VexNexa, das unabhängige Spielestudio hinter IpiWow. Bunte Spiele für neugierige Menschen, in sieben Sprachen.' },
      ipiwow: { title: 'IpiWow | Ein Wissensabenteuer von VexNexa', description: 'Entdecke IpiWow: 10 Wissenskategorien, 200 Levels, Fragen und Rätsel. Offline auf dem iPhone spielen, ohne Werbung oder Abo.' },
      studio: { title: 'Das Studio | VexNexa', description: 'Lerne VexNexa kennen, das unabhängige Spielestudio hinter IpiWow. Spiele mit Raum für Neugier, Entdeckungen und Freude.' },
      contact: { title: 'Kontakt | VexNexa', description: 'Eine Frage zu IpiWow, Feedback oder eine Zusammenarbeit? Kontaktiere VexNexa über das Formular oder info@vexnexa.com.' },
      privacy: { title: 'Datenschutz | VexNexa', description: 'Erfahre, wie die VexNexa-Website mit Kontaktdaten, Hosting und E-Mail umgeht und wie du uns bei Datenschutzfragen erreichst.' },
      support: { title: 'Hilfe | VexNexa', description: 'Hilfe zu IpiWow oder eine Frage zu früheren VexNexa-Diensten? Hier erfährst du, wie du uns erreichst.' },
    },
  },
  fr: {
    nav: { games: 'Jeux', studio: 'Studio', contact: 'Contact' },
    common: {
      language: 'Choisir la langue', skipToContent: 'Aller au contenu', menu: 'Ouvrir le menu', closeMenu: 'Fermer le menu',
      backHome: 'Retour à l’accueil', appStore: 'Voir sur l’App Store', email: 'Écrivez-nous', mascotAlt: 'IpiWow, un joyeux globe bleu aux continents verts',
    },
    home: {
      eyebrow: 'VexNexa, studio de jeux', heroTitle: ['Envie de découvrir ?', 'À vous de jouer.'],
      intro: 'Des jeux à découvrir. Créés par VexNexa.', cta: 'Découvrir nos jeux',
      gamesEyebrow: 'Nos jeux', gamesTitle: 'Un petit départ. Une grande aventure.',
      spotlightTitle: 'Jouer. Explorer. En savoir plus.', spotlightDescription: 'Une joyeuse aventure au fil des connaissances, avec des questions, des énigmes et 200 niveaux.',
      gameCta: 'Découvrir IpiWow', facts: ['10 catégories de connaissances', 'Jouez hors ligne', 'Sans publicité ni abonnement'],
      studioEyebrow: 'Derrière les jeux', studioTitle: 'Créés avec soin. Joués avec plaisir.',
      studioIntro: 'VexNexa est un studio de jeux indépendant. Nous créons des univers ludiques qui laissent la curiosité s’exprimer, à commencer par IpiWow.',
      studioCta: 'Rencontrer VexNexa', contactTitle: 'Une idée ? Une question ? Dites bonjour.',
      contactIntro: 'Nos jeux, une collaboration ou une amélioration à suggérer : nous serons ravis de vous lire.', contactCta: 'Nous contacter',
    },
    ipiwow: {
      eyebrow: 'Un jeu de VexNexa', tagline: 'Un petit bond. Une grande aventure.',
      intro: 'Accompagnez IpiWow et découvrez le monde en jouant. Choisissez une catégorie, résolvez des énigmes et faites de nouvelles découvertes, pas à pas.',
      appStoreNote: 'Pour iPhone. Consultez l’App Store pour le prix actuel et la compatibilité.', screenshotsTitle: 'Jetez un coup d’œil',
      screenshotAlts: ['IpiWow : découvrez une aventure de connaissances', 'IpiWow : choisissez un univers de connaissances coloré', 'IpiWow : jouer et apprendre avec des questions et des énigmes'],
      features: [
        { title: 'Suivez votre curiosité', body: 'Dix catégories de connaissances, chacune avec vingt niveaux. Des quiz, de courtes animations thématiques et des énigmes variées rendent chaque découverte différente.' },
        { title: 'À votre façon', body: 'Choisissez une difficulté pour les 5–8, 9–12 ou 13–16 ans. Jouez en portrait ou en paysage, avec ou sans sablier.' },
        { title: 'Acheter. Jouer. Tout simplement.', body: 'Toutes les catégories et tous les niveaux sont inclus. Sans publicité, abonnement ni achats intégrés. Une fois le jeu téléchargé, jouez hors ligne.' },
      ],
      detailsTitle: 'L’aventure en bref',
      details: [
        { title: 'Catégories', body: '10 univers de connaissances' }, { title: 'Niveaux', body: '200 à découvrir' },
        { title: 'Connexion', body: 'Jouable hors ligne' }, { title: 'Compte joueur', body: 'Aucun compte en ligne nécessaire' },
      ],
      languagesTitle: 'Sept langues. La même curiosité.',
      languagesBody: 'Jouez en néerlandais, anglais, allemand, français, espagnol, portugais européen ou tagalog.',
      parentTitle: 'Les parents ont aussi leur place',
      parentBody: 'Un espace dédié aux parents permet de régler le jeu, le son et les rappels facultatifs. Les rappels sont désactivés par défaut. Un profil local utilise un surnom et un âge ; la progression et les réglages restent sur l’appareil.',
      supportCta: 'Aide pour IpiWow', privacyCta: 'Confidentialité et contact',
    },
    studio: {
      eyebrow: 'Voici VexNexa', title: 'Un peu de place pour l’émerveillement.',
      intro: 'Nous créons des jeux pour les esprits curieux. Colorés, accueillants et attentifs aux petits détails qui rendent le jeu agréable.',
      paragraphs: [
        'VexNexa est un studio de jeux indépendant. Avec IpiWow, nous réunissons questions, énigmes et découvertes dans une aventure joyeuse.',
        'Notre direction est simple : créer des jeux que nous aimons développer et que vous aurez plaisir à retrouver. Pas de grandes promesses, mais du soin dans ce que vous jouez.',
      ],
      values: [
        { title: 'La curiosité d’abord', body: 'Une bonne question peut être le début de toute une aventure.' },
        { title: 'Le plaisir des détails', body: 'D’une petite animation à un bouton clair, tout fait partie de l’expérience.' },
        { title: 'Des informations claires', body: 'Découvrez ce qu’un jeu propose, où y jouer et comment nous joindre.' },
      ], contactCta: 'Parlons-en',
    },
    contact: {
      eyebrow: 'Dites bonjour', title: 'Au plaisir de vous lire.',
      intro: 'Une question sur IpiWow, une idée de collaboration ou un retour ? Envoyez-nous un message.',
      directTitle: 'Vous préférez votre messagerie ?', directBody: 'Vous pouvez aussi nous écrire directement à',
      nameLabel: 'Nom', emailLabel: 'Adresse e-mail', messageLabel: 'Votre message',
      namePlaceholder: 'Comment vous appelez-vous ?', emailPlaceholder: 'vous@exemple.fr', messagePlaceholder: 'Comment pouvons-nous vous aider ?',
      requiredHint: 'Tous les champs sont obligatoires.', privacyIntro: 'Nous utilisons vos coordonnées pour répondre à votre message. Consultez notre', privacyLink: 'politique de confidentialité',
      privacyLabel: 'J’ai lu la politique de confidentialité.', submit: 'Envoyer le message', sending: 'Envoi du message…',
      successTitle: 'Votre message a été envoyé.', successBody: 'Merci pour votre message. Nous répondrons à l’adresse e-mail indiquée.', reset: 'Envoyer un autre message',
      errors: {
        name: 'Saisissez votre nom, avec 2 à 100 caractères.', email: 'Saisissez une adresse e-mail valide pour que nous puissions répondre.',
        privacyAccepted: 'Lisez la politique de confidentialité et cochez la case pour continuer.', message: 'Rédigez un message de 10 à 5 000 caractères.',
        rateLimit: 'Trop de messages ont été envoyés. Réessayez plus tard ou écrivez-nous directement par e-mail.',
        send: 'Nous n’avons pas pu confirmer l’envoi. Réessayez ou écrivez à info@vexnexa.com.',
        unavailable: 'Le formulaire est temporairement indisponible. Écrivez-nous à info@vexnexa.com.',
      },
    },
    privacy: {
      eyebrow: 'Confidentialité', title: 'Ce que deviennent vos informations.',
      intro: 'Ces informations concernent le site VexNexa et les messages que vous nous envoyez. Pour IpiWow, vous pouvez aussi consulter les informations de confidentialité dans l’application.',
      sections: [
        { title: 'Qui contacter', body: 'VexNexa gère ce site. Pour une question de confidentialité ou une demande concernant vos données, écrivez à info@vexnexa.com.' },
        { title: 'Lorsque vous nous contactez', body: 'Le formulaire nous transmet votre nom, votre adresse e-mail et votre message. Nous utilisons ces informations pour traiter votre demande et y répondre, pas pour vous envoyer des messages commerciaux sans votre autorisation. Ne transmettez pas de mots de passe, de données de carte bancaire ou d’autres informations sensibles.' },
        { title: 'Hébergement et e-mail', body: 'Vercel héberge le site et Resend transmet les messages du formulaire à notre boîte mail. Ces services traitent les données techniques nécessaires à la livraison, à la sécurité et à la prévention des abus, comme les adresses IP et les détails des requêtes. Le site ne possède pas sa propre base de comptes ou de contacts.' },
        { title: 'Cookies et mesure d’audience', body: 'Le nouveau site du studio n’utilise ni traceurs publicitaires ni outils d’analyse des visiteurs. L’hébergeur peut traiter des données techniques pour assurer la sécurité du site. Les liens externes, comme l’App Store, sont soumis à la politique de confidentialité du service concerné.' },
        { title: 'Conservation et suppression', body: 'Nous conservons les échanges aussi longtemps que nécessaire pour traiter votre demande et les éventuelles démarches administratives. Vous pouvez demander quelles données nous détenons, leur correction ou leur suppression. Nous examinons votre demande en tenant compte des éventuelles obligations de conservation.' },
        { title: 'IpiWow et les données locales', body: 'IpiWow ne nécessite aucun compte joueur en ligne. Un profil local contient un surnom et un âge ; la progression et les réglages restent sur l’appareil. L’application fonctionne hors ligne. Apple traite les achats App Store selon ses propres conditions et sa politique de confidentialité.' },
        { title: 'Anciens services VexNexa', body: 'Ce nouveau site ne modifie pas automatiquement les accords, abonnements ou durées de conservation liés à l’ancien service d’accessibilité. Pour toute question, contactez-nous avec votre référence ou numéro de facture. Ne partagez pas de données de paiement.' },
      ], contactCta: 'Poser une question de confidentialité',
    },
    support: {
      eyebrow: 'Assistance', title: 'Comment pouvons-nous vous aider ?', intro: 'VexNexa se consacre désormais au développement de jeux. Vous pouvez nous contacter à propos de nos jeux ou de votre utilisation passée de VexNexa.',
      gameTitle: 'Aide pour IpiWow', gameBody: 'Décrivez ce qui se passe, votre appareil et, si vous la connaissez, la version de l’application. N’incluez pas de données personnelles d’un enfant.',
      formerTitle: 'Anciens services d’accessibilité', formerBody: 'Une question sur une utilisation passée, une facture ou un abonnement ? Écrivez-nous avec votre référence ou numéro de facture. Le nouveau site ne propose ni connexion SaaS ni page de paiement.',
      billingNote: 'Le changement de ce site ne confirme pas la résiliation d’un abonnement existant. Contactez-nous si vous avez besoin de précisions.', contactCta: 'Nous contacter',
    },
    footer: { tagline: 'Des jeux à découvrir.', privacy: 'Confidentialité', support: 'Assistance', rights: 'Tous droits réservés.' },
    seo: {
      home: { title: 'VexNexa | Des jeux à découvrir', description: 'Découvrez VexNexa, le studio de jeux indépendant derrière IpiWow. Des jeux colorés pour les esprits curieux, en sept langues.' },
      ipiwow: { title: 'IpiWow | Une aventure de connaissances par VexNexa', description: 'Découvrez IpiWow : 10 catégories, 200 niveaux, des questions et des énigmes. Jouez hors ligne sur iPhone, sans publicité ni abonnement.' },
      studio: { title: 'Le studio | VexNexa', description: 'Rencontrez VexNexa, le studio indépendant derrière IpiWow. Des jeux qui font place à la curiosité, à la découverte et au plaisir.' },
      contact: { title: 'Contact | VexNexa', description: 'Une question sur IpiWow, un retour ou une collaboration ? Contactez VexNexa via le formulaire ou à info@vexnexa.com.' },
      privacy: { title: 'Confidentialité | VexNexa', description: 'Découvrez comment le site VexNexa traite les coordonnées, l’hébergement et les e-mails, et comment poser une question sur vos données.' },
      support: { title: 'Assistance | VexNexa', description: 'Besoin d’aide pour IpiWow ou une question sur les anciens services VexNexa ? Découvrez comment nous contacter.' },
    },
  },
  es: {
    nav: { games: 'Juegos', studio: 'Estudio', contact: 'Contacto' },
    common: {
      language: 'Elegir idioma', skipToContent: 'Ir al contenido', menu: 'Abrir menú', closeMenu: 'Cerrar menú',
      backHome: 'Volver al inicio', appStore: 'Ver en el App Store', email: 'Escríbenos', mascotAlt: 'IpiWow, un alegre globo azul con continentes verdes',
    },
    home: {
      eyebrow: 'VexNexa, estudio de videojuegos', heroTitle: ['¿Tienes curiosidad?', 'Dale al play.'],
      intro: 'Juegos por descubrir. Creados por VexNexa.', cta: 'Descubre nuestros juegos',
      gamesEyebrow: 'Nuestros juegos', gamesTitle: 'Un pequeño comienzo. Una gran aventura.',
      spotlightTitle: 'Jugar. Explorar. Aprender algo nuevo.', spotlightDescription: 'Una alegre aventura de conocimiento con preguntas, puzles y 200 niveles.',
      gameCta: 'Descubre IpiWow', facts: ['10 categorías de conocimiento', 'Juega sin conexión', 'Sin anuncios ni suscripción'],
      studioEyebrow: 'Detrás de los juegos', studioTitle: 'Creados con cuidado. Jugados con alegría.',
      studioIntro: 'VexNexa es un estudio independiente de videojuegos. Creamos mundos que dan espacio a la curiosidad, empezando por IpiWow.',
      studioCta: 'Conoce VexNexa', contactTitle: '¿Una idea? ¿Una pregunta? Salúdanos.',
      contactIntro: 'Nuestros juegos, una colaboración o algo que podamos mejorar: nos encantará leerte.', contactCta: 'Contacta con nosotros',
    },
    ipiwow: {
      eyebrow: 'Un juego de VexNexa', tagline: 'Un pequeño salto. Una gran aventura.',
      intro: 'Acompaña a IpiWow y descubre el mundo jugando. Elige una categoría de conocimiento, resuelve puzles y haz nuevos descubrimientos, paso a paso.',
      appStoreNote: 'Para iPhone. Consulta el precio actual y la compatibilidad en el App Store.', screenshotsTitle: 'Echa un vistazo',
      screenshotAlts: ['IpiWow: descubre una aventura de conocimiento', 'IpiWow: elige un colorido mundo de conocimiento', 'IpiWow: jugar y aprender con preguntas y puzles'],
      features: [
        { title: 'Sigue tu curiosidad', body: 'Diez categorías de conocimiento con veinte niveles cada una. Preguntas, breves animaciones temáticas y puzles variados hacen que cada descubrimiento sea diferente.' },
        { title: 'Juega a tu manera', body: 'Elige una dificultad para edades de 5–8, 9–12 o 13–16 años. Juega en vertical o en horizontal, con o sin reloj de arena.' },
        { title: 'Comprar. Jugar. Así de fácil.', body: 'Todas las categorías y niveles están incluidos. Sin anuncios, suscripción ni compras dentro de la app. Después de descargarlo, puedes jugar sin conexión.' },
      ],
      detailsTitle: 'La aventura en pocas palabras',
      details: [
        { title: 'Categorías', body: '10 mundos de conocimiento' }, { title: 'Niveles', body: '200 por descubrir' },
        { title: 'Conexión', body: 'Se puede jugar sin conexión' }, { title: 'Cuenta de jugador', body: 'No necesitas una cuenta en línea' },
      ],
      languagesTitle: 'Siete idiomas. La misma curiosidad.',
      languagesBody: 'Juega en neerlandés, inglés, alemán, francés, español, portugués europeo o tagalo.',
      parentTitle: 'También pensamos en las familias',
      parentBody: 'Una zona para padres permite controlar los ajustes del juego, el sonido y los recordatorios opcionales. Los recordatorios están desactivados por defecto. Un perfil local usa un apodo y la edad; el progreso y los ajustes permanecen en el dispositivo.',
      supportCta: 'Ayuda con IpiWow', privacyCta: 'Privacidad y contacto',
    },
    studio: {
      eyebrow: 'Así es VexNexa', title: 'Espacio para un poco de asombro.',
      intro: 'Creamos juegos para personas curiosas. Coloridos, acogedores y atentos a esos pequeños detalles que hacen agradable jugar.',
      paragraphs: [
        'VexNexa es un estudio independiente de videojuegos. Con IpiWow, reunimos preguntas, puzles y nuevos descubrimientos en una aventura llena de alegría.',
        'Nuestro rumbo es sencillo: crear juegos que disfrutemos desarrollando y que te apetezca volver a abrir. Sin grandes promesas, pero con atención a lo que juegas.',
      ],
      values: [
        { title: 'La curiosidad, primero', body: 'Una buena pregunta puede ser el comienzo de toda una aventura.' },
        { title: 'Alegría en los detalles', body: 'Desde una pequeña animación hasta un botón claro, todo forma parte de la experiencia.' },
        { title: 'Información clara', body: 'Descubre qué ofrece un juego, dónde puedes jugarlo y cómo contactar con nosotros.' },
      ], contactCta: 'Hablemos',
    },
    contact: {
      eyebrow: 'Salúdanos', title: 'Nos encantará leerte.',
      intro: '¿Una pregunta sobre IpiWow, una idea de colaboración o un comentario? Envíanos un mensaje.',
      directTitle: '¿Prefieres tu aplicación de correo?', directBody: 'También puedes escribirnos directamente a',
      nameLabel: 'Nombre', emailLabel: 'Correo electrónico', messageLabel: 'Tu mensaje',
      namePlaceholder: '¿Cómo te llamas?', emailPlaceholder: 'tu@ejemplo.es', messagePlaceholder: '¿Cómo podemos ayudarte?',
      requiredHint: 'Todos los campos son obligatorios.', privacyIntro: 'Usamos tus datos para responder a tu mensaje. Lee nuestra', privacyLink: 'política de privacidad',
      privacyLabel: 'He leído la política de privacidad.', submit: 'Enviar mensaje', sending: 'Enviando el mensaje…',
      successTitle: 'Tu mensaje se ha enviado.', successBody: 'Gracias por escribirnos. Responderemos al correo electrónico que has indicado.', reset: 'Enviar otro mensaje',
      errors: {
        name: 'Escribe tu nombre con entre 2 y 100 caracteres.', email: 'Introduce un correo electrónico válido para que podamos responderte.',
        privacyAccepted: 'Lee la política de privacidad y marca la casilla para continuar.', message: 'Escribe un mensaje de entre 10 y 5.000 caracteres.',
        rateLimit: 'Se han enviado demasiados mensajes. Inténtalo más tarde o escríbenos directamente por correo.',
        send: 'No hemos podido confirmar el envío. Inténtalo de nuevo o escribe a info@vexnexa.com.',
        unavailable: 'El formulario no está disponible temporalmente. Escríbenos a info@vexnexa.com.',
      },
    },
    privacy: {
      eyebrow: 'Privacidad', title: 'Qué ocurre con tus datos.',
      intro: 'Esta información se refiere al sitio web de VexNexa y a los mensajes que nos envías. Para IpiWow, también puedes consultar la información de privacidad dentro de la aplicación.',
      sections: [
        { title: 'Con quién contactar', body: 'VexNexa gestiona este sitio web. Para preguntas de privacidad o solicitudes sobre tus datos, escribe a info@vexnexa.com.' },
        { title: 'Cuando nos contactas', body: 'El formulario nos envía tu nombre, correo electrónico y mensaje. Usamos esta información para atender y responder a tu consulta, no para enviarte publicidad sin tu permiso. No incluyas contraseñas, datos de tarjetas de pago ni otra información sensible.' },
        { title: 'Alojamiento y correo', body: 'Vercel aloja el sitio web y Resend envía los mensajes del formulario a nuestro buzón. Estos servicios procesan datos técnicos necesarios para la entrega, la seguridad y la prevención de abusos, como direcciones IP y detalles de las solicitudes. El sitio no tiene una base de datos propia de cuentas o contactos.' },
        { title: 'Cookies y medición', body: 'El nuevo sitio del estudio no usa rastreadores publicitarios ni análisis de visitantes. El proveedor de alojamiento puede necesitar procesar datos técnicos para mantener la seguridad del sitio. Los enlaces externos, como el App Store, se rigen por la política de privacidad de ese servicio.' },
        { title: 'Conservación y eliminación', body: 'Conservamos la correspondencia mientras sea necesaria para atender tu consulta y cualquier gestión administrativa necesaria. Puedes preguntar qué datos tenemos sobre ti o solicitar su corrección o eliminación. Evaluamos tu solicitud teniendo en cuenta las posibles obligaciones de conservación.' },
        { title: 'IpiWow y los datos locales', body: 'IpiWow no requiere una cuenta de jugador en línea. Un perfil local contiene un apodo y la edad; el progreso y los ajustes permanecen en el dispositivo. La aplicación funciona sin conexión. Apple procesa las compras del App Store conforme a sus propias condiciones y política de privacidad.' },
        { title: 'Servicios anteriores de VexNexa', body: 'Este nuevo sitio no modifica automáticamente los acuerdos, suscripciones o plazos de conservación del anterior servicio de accesibilidad. Si tienes alguna pregunta, contáctanos con tu referencia o número de factura. No compartas datos de pago.' },
      ], contactCta: 'Hacer una pregunta de privacidad',
    },
    support: {
      eyebrow: 'Ayuda', title: '¿Cómo podemos ayudarte?', intro: 'VexNexa se dedica ahora al desarrollo de videojuegos. Puedes contactarnos sobre nuestros juegos y tu uso anterior de VexNexa.',
      gameTitle: 'Ayuda con IpiWow', gameBody: 'Cuéntanos qué ocurre, qué dispositivo usas y, si la conoces, la versión de la aplicación. No incluyas datos personales de un menor.',
      formerTitle: 'Servicios anteriores de accesibilidad', formerBody: '¿Una pregunta sobre un uso anterior, una factura o una suscripción? Escríbenos con tu referencia o número de factura. El nuevo sitio no tiene acceso SaaS ni página de pago.',
      billingNote: 'El cambio de este sitio no confirma que una suscripción existente se haya cancelado. Contáctanos si necesitas aclararlo.', contactCta: 'Contacta con nosotros',
    },
    footer: { tagline: 'Juegos por descubrir.', privacy: 'Privacidad', support: 'Ayuda', rights: 'Todos los derechos reservados.' },
    seo: {
      home: { title: 'VexNexa | Juegos por descubrir', description: 'Descubre VexNexa, el estudio independiente detrás de IpiWow. Juegos llenos de color para personas curiosas, en siete idiomas.' },
      ipiwow: { title: 'IpiWow | Una aventura de conocimiento de VexNexa', description: 'Descubre IpiWow: 10 categorías, 200 niveles, preguntas y puzles. Juega sin conexión en iPhone, sin anuncios ni suscripción.' },
      studio: { title: 'El estudio | VexNexa', description: 'Conoce VexNexa, el estudio independiente detrás de IpiWow. Juegos con espacio para la curiosidad, el descubrimiento y la alegría.' },
      contact: { title: 'Contacto | VexNexa', description: '¿Una pregunta sobre IpiWow, un comentario o una colaboración? Contacta con VexNexa mediante el formulario o info@vexnexa.com.' },
      privacy: { title: 'Privacidad | VexNexa', description: 'Conoce cómo el sitio de VexNexa trata los datos de contacto, el alojamiento y el correo, y cómo consultar sobre tu privacidad.' },
      support: { title: 'Ayuda | VexNexa', description: '¿Necesitas ayuda con IpiWow o tienes preguntas sobre anteriores servicios de VexNexa? Descubre cómo contactarnos.' },
    },
  },
  pt: {
    nav: { games: 'Jogos', studio: 'Estúdio', contact: 'Contacto' },
    common: {
      language: 'Escolher idioma', skipToContent: 'Ir para o conteúdo', menu: 'Abrir menu', closeMenu: 'Fechar menu',
      backHome: 'Voltar ao início', appStore: 'Ver na App Store', email: 'Envia-nos um e-mail', mascotAlt: 'IpiWow, um alegre globo azul com continentes verdes',
    },
    home: {
      eyebrow: 'VexNexa, estúdio de jogos', heroTitle: ['Tens curiosidade?', 'Carrega no play.'],
      intro: 'Jogos por descobrir. Criados pela VexNexa.', cta: 'Descobre os nossos jogos',
      gamesEyebrow: 'Os nossos jogos', gamesTitle: 'Um pequeno começo. Uma grande aventura.',
      spotlightTitle: 'Jogar. Explorar. Saber mais.', spotlightDescription: 'Uma alegre aventura pelo conhecimento, com perguntas, puzzles e 200 níveis.',
      gameCta: 'Descobre o IpiWow', facts: ['10 categorias de conhecimento', 'Joga sem ligação à Internet', 'Sem anúncios nem subscrição'],
      studioEyebrow: 'Por trás dos jogos', studioTitle: 'Criados com cuidado. Jogados com alegria.',
      studioIntro: 'A VexNexa é um estúdio independente de jogos. Criamos mundos que dão espaço à curiosidade, a começar pelo IpiWow.',
      studioCta: 'Conhece a VexNexa', contactTitle: 'Uma ideia? Uma pergunta? Diz olá.',
      contactIntro: 'Os nossos jogos, uma colaboração ou algo que possamos melhorar: teremos gosto em ouvir-te.', contactCta: 'Entra em contacto',
    },
    ipiwow: {
      eyebrow: 'Um jogo da VexNexa', tagline: 'Um pequeno salto. Uma grande aventura.',
      intro: 'Acompanha o IpiWow e descobre o mundo a jogar. Escolhe uma categoria de conhecimento, resolve puzzles e faz novas descobertas, passo a passo.',
      appStoreNote: 'Para iPhone. Consulta o preço atual e a compatibilidade na App Store.', screenshotsTitle: 'Espreita o jogo',
      screenshotAlts: ['IpiWow: descobre uma aventura pelo conhecimento', 'IpiWow: escolhe um mundo de conhecimento cheio de cor', 'IpiWow: jogar e aprender com perguntas e puzzles'],
      features: [
        { title: 'Segue a tua curiosidade', body: 'Dez categorias de conhecimento com vinte níveis cada. Perguntas, pequenas animações temáticas e puzzles variados tornam cada descoberta diferente.' },
        { title: 'Joga à tua maneira', body: 'Escolhe uma dificuldade para os 5–8, 9–12 ou 13–16 anos. Joga na vertical ou na horizontal, com ou sem ampulheta.' },
        { title: 'Comprar. Jogar. É só isso.', body: 'Todas as categorias e níveis estão incluídos. Sem anúncios, subscrição ou compras integradas. Depois de descarregares o jogo, podes jogar sem ligação à Internet.' },
      ],
      detailsTitle: 'A aventura em poucas palavras',
      details: [
        { title: 'Categorias', body: '10 mundos de conhecimento' }, { title: 'Níveis', body: '200 para descobrir' },
        { title: 'Ligação', body: 'Joga sem Internet' }, { title: 'Conta de jogador', body: 'Não precisas de uma conta online' },
      ],
      languagesTitle: 'Sete idiomas. A mesma curiosidade.',
      languagesBody: 'Joga em neerlandês, inglês, alemão, francês, espanhol, português europeu ou tagalo.',
      parentTitle: 'Também pensámos nos pais',
      parentBody: 'Uma área para pais permite controlar as definições do jogo, o som e os lembretes opcionais. Os lembretes estão desativados por predefinição. Um perfil local usa uma alcunha e a idade; o progresso e as definições ficam no dispositivo.',
      supportCta: 'Ajuda com o IpiWow', privacyCta: 'Privacidade e contacto',
    },
    studio: {
      eyebrow: 'Esta é a VexNexa', title: 'Espaço para um pouco de encanto.',
      intro: 'Criamos jogos para pessoas curiosas. Coloridos, acolhedores e atentos às pequenas coisas que tornam o jogo agradável.',
      paragraphs: [
        'A VexNexa é um estúdio independente de jogos. Com o IpiWow, juntamos perguntas, puzzles e novas descobertas numa aventura alegre.',
        'A nossa direção é simples: criar jogos que gostamos de desenvolver e que te apetece voltar a abrir. Sem grandes promessas, mas com cuidado pelo que jogas.',
      ],
      values: [
        { title: 'A curiosidade vem primeiro', body: 'Uma boa pergunta pode ser o início de toda uma aventura.' },
        { title: 'Alegria nos pormenores', body: 'De uma pequena animação a um botão claro, tudo faz parte da experiência.' },
        { title: 'Informação clara', body: 'Descobre o que um jogo oferece, onde o podes jogar e como nos contactar.' },
      ], contactCta: 'Fala connosco',
    },
    contact: {
      eyebrow: 'Diz olá', title: 'Teremos gosto em ouvir-te.',
      intro: 'Uma pergunta sobre o IpiWow, uma ideia de colaboração ou uma sugestão? Envia-nos uma mensagem.',
      directTitle: 'Preferes a tua aplicação de e-mail?', directBody: 'Também nos podes escrever diretamente para',
      nameLabel: 'Nome', emailLabel: 'Endereço de e-mail', messageLabel: 'A tua mensagem',
      namePlaceholder: 'Como te chamas?', emailPlaceholder: 'tu@exemplo.pt', messagePlaceholder: 'Como te podemos ajudar?',
      requiredHint: 'Todos os campos são obrigatórios.', privacyIntro: 'Usamos os teus dados para responder à tua mensagem. Lê a nossa', privacyLink: 'política de privacidade',
      privacyLabel: 'Li a política de privacidade.', submit: 'Enviar mensagem', sending: 'A enviar a mensagem…',
      successTitle: 'A tua mensagem foi enviada.', successBody: 'Obrigado pela mensagem. Vamos responder para o endereço de e-mail que indicaste.', reset: 'Enviar outra mensagem',
      errors: {
        name: 'Introduz o teu nome com 2 a 100 caracteres.', email: 'Introduz um endereço de e-mail válido para podermos responder.',
        privacyAccepted: 'Lê a política de privacidade e assinala a caixa para continuar.', message: 'Escreve uma mensagem com 10 a 5 000 caracteres.',
        rateLimit: 'Foram enviadas demasiadas mensagens. Tenta mais tarde ou envia-nos um e-mail diretamente.',
        send: 'Não foi possível confirmar o envio. Tenta novamente ou escreve para info@vexnexa.com.',
        unavailable: 'O formulário está temporariamente indisponível. Escreve para info@vexnexa.com.',
      },
    },
    privacy: {
      eyebrow: 'Privacidade', title: 'O que acontece aos teus dados.',
      intro: 'Esta informação diz respeito ao site da VexNexa e às mensagens que nos envias. Para o IpiWow, também podes consultar a informação de privacidade na aplicação.',
      sections: [
        { title: 'Quem contactar', body: 'A VexNexa gere este site. Para questões de privacidade ou pedidos sobre os teus dados, escreve para info@vexnexa.com.' },
        { title: 'Quando nos contactas', body: 'O formulário envia-nos o teu nome, endereço de e-mail e mensagem. Usamos estes dados para tratar e responder à tua questão, não para enviar publicidade sem a tua autorização. Não incluas palavras-passe, dados de cartões de pagamento ou outras informações sensíveis.' },
        { title: 'Alojamento e e-mail', body: 'A Vercel aloja o site e a Resend envia as mensagens do formulário para a nossa caixa de correio. Estes serviços tratam dados técnicos necessários à entrega, segurança e prevenção de abusos, como endereços IP e detalhes dos pedidos. O site não tem uma base de dados própria de contas ou contactos.' },
        { title: 'Cookies e medição', body: 'O novo site do estúdio não utiliza rastreadores publicitários nem análises de visitantes. O fornecedor de alojamento pode precisar de tratar dados técnicos para manter o site seguro. As ligações externas, como a App Store, estão sujeitas à política de privacidade do respetivo serviço.' },
        { title: 'Conservação e eliminação', body: 'Guardamos a correspondência enquanto for necessária para tratar a tua questão e eventuais tarefas administrativas. Podes perguntar que dados temos sobre ti ou pedir a sua correção ou eliminação. Avaliamos o pedido tendo em conta eventuais obrigações de conservação.' },
        { title: 'IpiWow e dados locais', body: 'O IpiWow não exige uma conta de jogador online. Um perfil local contém uma alcunha e a idade; o progresso e as definições ficam no dispositivo. A aplicação funciona sem Internet. A Apple processa as compras na App Store segundo os seus próprios termos e política de privacidade.' },
        { title: 'Serviços anteriores da VexNexa', body: 'Este novo site não altera automaticamente acordos, subscrições ou prazos de conservação do antigo serviço de acessibilidade. Se tiveres dúvidas, contacta-nos com a tua referência ou número de fatura. Não partilhes dados de pagamento.' },
      ], contactCta: 'Colocar uma questão de privacidade',
    },
    support: {
      eyebrow: 'Apoio', title: 'Como te podemos ajudar?', intro: 'A VexNexa dedica-se agora ao desenvolvimento de jogos. Podes contactar-nos sobre os nossos jogos e a tua utilização anterior da VexNexa.',
      gameTitle: 'Ajuda com o IpiWow', gameBody: 'Explica o que acontece, que dispositivo usas e, se souberes, a versão da aplicação. Não incluas dados pessoais de uma criança.',
      formerTitle: 'Serviços anteriores de acessibilidade', formerBody: 'Uma questão sobre uma utilização anterior, uma fatura ou uma subscrição? Envia-nos um e-mail com a tua referência ou número de fatura. O novo site não tem início de sessão SaaS nem página de pagamento.',
      billingNote: 'A alteração deste site não confirma o cancelamento de uma subscrição existente. Contacta-nos se precisares de esclarecimentos.', contactCta: 'Entra em contacto',
    },
    footer: { tagline: 'Jogos por descobrir.', privacy: 'Privacidade', support: 'Apoio', rights: 'Todos os direitos reservados.' },
    seo: {
      home: { title: 'VexNexa | Jogos por descobrir', description: 'Descobre a VexNexa, o estúdio independente por trás do IpiWow. Jogos cheios de cor para pessoas curiosas, em sete idiomas.' },
      ipiwow: { title: 'IpiWow | Uma aventura de conhecimento da VexNexa', description: 'Descobre o IpiWow: 10 categorias, 200 níveis, perguntas e puzzles. Joga sem Internet no iPhone, sem anúncios nem subscrição.' },
      studio: { title: 'O estúdio | VexNexa', description: 'Conhece a VexNexa, o estúdio independente por trás do IpiWow. Jogos com espaço para a curiosidade, a descoberta e a alegria.' },
      contact: { title: 'Contacto | VexNexa', description: 'Uma pergunta sobre o IpiWow, uma sugestão ou uma colaboração? Contacta a VexNexa pelo formulário ou por info@vexnexa.com.' },
      privacy: { title: 'Privacidade | VexNexa', description: 'Sabe como o site da VexNexa trata os dados de contacto, o alojamento e o e-mail, e como colocar uma questão de privacidade.' },
      support: { title: 'Apoio | VexNexa', description: 'Precisas de ajuda com o IpiWow ou tens dúvidas sobre anteriores serviços da VexNexa? Descobre como nos contactar.' },
    },
  },
  tl: {
    nav: { games: 'Mga laro', studio: 'Studio', contact: 'Makipag-ugnayan' },
    common: {
      language: 'Pumili ng wika', skipToContent: 'Dumiretso sa nilalaman', menu: 'Buksan ang menu', closeMenu: 'Isara ang menu',
      backHome: 'Bumalik sa pangunahing pahina', appStore: 'Tingnan sa App Store', email: 'Mag-email sa amin', mascotAlt: 'Si IpiWow, isang masayahing asul na globo na may mga berdeng kontinente',
    },
    home: {
      eyebrow: 'VexNexa, studio ng mga laro', heroTitle: ['Gustong tumuklas?', 'Tara, maglaro.'],
      intro: 'Mga larong matutuklasan. Likha ng VexNexa.', cta: 'Tuklasin ang aming mga laro',
      gamesEyebrow: 'Aming mga laro', gamesTitle: 'Maliit na simula. Malaking pakikipagsapalaran.',
      spotlightTitle: 'Maglaro. Tumuklas. Matuto pa.', spotlightDescription: 'Isang masayang paglalakbay sa kaalaman na may mga tanong, palaisipan at 200 antas.',
      gameCta: 'Kilalanin ang IpiWow', facts: ['10 kategorya ng kaalaman', 'Maglaro nang walang internet', 'Walang patalastas o subscription'],
      studioEyebrow: 'Sa likod ng mga laro', studioTitle: 'Maingat na nilikha. Masayang nilalaro.',
      studioIntro: 'Ang VexNexa ay isang malayang studio ng mga laro. Lumilikha kami ng mga mundong nagbibigay-puwang sa pag-uusisa, simula sa IpiWow.',
      studioCta: 'Kilalanin ang VexNexa', contactTitle: 'May ideya? May tanong? Kumustahin kami.',
      contactIntro: 'Tungkol sa aming mga laro, pakikipagtulungan o isang bagay na maaari pang pagandahin: ikagagalak naming marinig ka.', contactCta: 'Makipag-ugnayan',
    },
    ipiwow: {
      eyebrow: 'Isang laro ng VexNexa', tagline: 'Isang maliit na talon. Isang malaking pakikipagsapalaran.',
      intro: 'Samahan si IpiWow at tuklasin ang mundo sa paglalaro. Pumili ng kategorya ng kaalaman, lutasin ang mga palaisipan at unti-unting tumuklas ng mga bagong bagay.',
      appStoreNote: 'Para sa iPhone. Tingnan ang kasalukuyang presyo at mga sinusuportahang device sa App Store.', screenshotsTitle: 'Silipin ang laro',
      screenshotAlts: ['IpiWow: tuklasin ang paglalakbay sa kaalaman', 'IpiWow: pumili ng makulay na mundo ng kaalaman', 'IpiWow: maglaro at matuto sa mga tanong at palaisipan'],
      features: [
        { title: 'Sundan ang iyong pag-uusisa', body: 'Sampung kategorya ng kaalaman na may tigdalawampung antas. Mga tanong, maiikling animasyon tungkol sa paksa at iba’t ibang palaisipan ang nagbibigay-sigla sa bawat pagtuklas.' },
        { title: 'Maglaro sa gusto mong paraan', body: 'Pumili ng antas ng hirap para sa edad na 5–8, 9–12 o 13–16. Maglaro nang patayo o pahalang, may oras man o wala.' },
        { title: 'Bilhin. Laruin. Iyon lang.', body: 'Kasama na ang lahat ng kategorya at antas. Walang patalastas, subscription o pagbili sa loob ng app. Kapag na-download na, maaari nang maglaro nang walang internet.' },
      ],
      detailsTitle: 'Ang pakikipagsapalaran sa isang sulyap',
      details: [
        { title: 'Mga kategorya', body: '10 mundo ng kaalaman' }, { title: 'Mga antas', body: '200 na matutuklasan' },
        { title: 'Koneksiyon', body: 'Nalalaro nang walang internet' }, { title: 'Account ng manlalaro', body: 'Hindi kailangan ng online account' },
      ],
      languagesTitle: 'Pitong wika. Iisang pag-uusisa.',
      languagesBody: 'Maglaro sa Dutch, English, German, French, Spanish, European Portuguese o Tagalog.',
      parentTitle: 'Kasama sa isip ang mga magulang',
      parentBody: 'May hiwalay na bahagi para sa mga magulang upang baguhin ang mga setting, tunog at opsiyonal na paalala. Naka-off ang mga paalala sa simula. Palayaw at edad ang ginagamit sa lokal na profile; nananatili sa device ang progreso at mga setting.',
      supportCta: 'Tulong sa IpiWow', privacyCta: 'Privacy at pakikipag-ugnayan',
    },
    studio: {
      eyebrow: 'Ito ang VexNexa', title: 'Puwang para sa kaunting pagkamangha.',
      intro: 'Gumagawa kami ng mga laro para sa mga mausisa. Makulay, magiliw at may malasakit sa maliliit na detalyeng nagpapasarap sa paglalaro.',
      paragraphs: [
        'Ang VexNexa ay isang malayang studio ng mga laro. Sa IpiWow, pinagsasama namin ang mga tanong, palaisipan at bagong tuklas sa isang masayang pakikipagsapalaran.',
        'Simple ang aming direksiyon: gumawa ng mga larong masaya naming binubuo at gusto mong balikan. Walang malalaking pangako, kundi malasakit sa iyong nilalaro.',
      ],
      values: [
        { title: 'Nauuna ang pag-uusisa', body: 'Ang isang magandang tanong ay maaaring simula ng isang buong pakikipagsapalaran.' },
        { title: 'Saya sa mga detalye', body: 'Mula sa maliit na animasyon hanggang sa malinaw na pindutan, bahagi ang lahat ng karanasan.' },
        { title: 'Malinaw tungkol sa aming mga laro', body: 'Alamin kung ano ang alok ng laro, saan ito malalaro at paano kami makokontak.' },
      ], contactCta: 'Kausapin kami',
    },
    contact: {
      eyebrow: 'Kumustahin kami', title: 'Ikagagalak naming marinig ka.',
      intro: 'May tanong tungkol sa IpiWow, ideya para sa pakikipagtulungan o mungkahi? Padalhan kami ng mensahe.',
      directTitle: 'Mas gusto mong gamitin ang sarili mong email app?', directBody: 'Maaari ka ring direktang mag-email sa',
      nameLabel: 'Pangalan', emailLabel: 'Email address', messageLabel: 'Iyong mensahe',
      namePlaceholder: 'Paano ka namin tatawagin?', emailPlaceholder: 'ikaw@halimbawa.com', messagePlaceholder: 'Paano kami makatutulong?',
      requiredHint: 'Kailangang sagutan ang lahat ng patlang.', privacyIntro: 'Gagamitin namin ang iyong impormasyon upang sagutin ang mensahe mo. Basahin ang aming', privacyLink: 'patakaran sa privacy',
      privacyLabel: 'Nabasa ko na ang patakaran sa privacy.', submit: 'Ipadala ang mensahe', sending: 'Ipinapadala ang mensahe…',
      successTitle: 'Naipadala na ang iyong mensahe.', successBody: 'Salamat sa iyong mensahe. Sasagot kami sa ibinigay mong email address.', reset: 'Magpadala ng isa pang mensahe',
      errors: {
        name: 'Ilagay ang iyong pangalan, gamit ang 2 hanggang 100 karakter.', email: 'Maglagay ng wastong email address upang masagot ka namin.',
        privacyAccepted: 'Basahin ang patakaran sa privacy at lagyan ng tsek ang kahon upang magpatuloy.', message: 'Sumulat ng mensaheng may 10 hanggang 5,000 karakter.',
        rateLimit: 'Masyadong maraming mensahe ang naipadala. Subukan mamaya o direktang mag-email sa amin.',
        send: 'Hindi namin makumpirma kung naipadala ang mensahe. Subukang muli o mag-email sa info@vexnexa.com.',
        unavailable: 'Pansamantalang hindi magamit ang form. Mag-email sa info@vexnexa.com.',
      },
    },
    privacy: {
      eyebrow: 'Privacy', title: 'Ano ang nangyayari sa iyong impormasyon.',
      intro: 'Saklaw nito ang website ng VexNexa at ang mga mensaheng ipinapadala mo sa amin. Para sa IpiWow, maaari mo ring basahin ang impormasyon sa privacy sa loob ng app.',
      sections: [
        { title: 'Sino ang kokontakin', body: 'VexNexa ang namamahala sa website na ito. Para sa tanong sa privacy o kahilingan tungkol sa iyong datos, mag-email sa info@vexnexa.com.' },
        { title: 'Kapag nakipag-ugnayan ka', body: 'Ipinapadala ng form ang iyong pangalan, email address at mensahe. Ginagamit namin ang mga ito upang asikasuhin at sagutin ang iyong tanong, hindi para magpadala ng patalastas nang walang pahintulot mo. Huwag magsama ng password, detalye ng payment card o iba pang sensitibong impormasyon.' },
        { title: 'Pagho-host at email', body: 'Vercel ang nagho-host ng website at Resend ang naghahatid ng mga mensahe mula sa form patungo sa aming email. Pinoproseso ng mga serbisyong ito ang teknikal na datos na kailangan para sa paghahatid, seguridad at pag-iwas sa pang-aabuso, tulad ng IP address at detalye ng mga request. Walang sariling database ng account o contact ang website.' },
        { title: 'Cookies at pagsukat', body: 'Ang bagong website ng studio ay walang advertising tracker o pagsusuri sa mga bisita. Maaaring kailanganin ng hosting provider na magproseso ng teknikal na datos upang mapanatiling ligtas ang website. Ang mga panlabas na link, tulad ng App Store, ay saklaw ng sariling patakaran sa privacy ng serbisyong iyon.' },
        { title: 'Pag-iingat at pagbura', body: 'Iniingatan namin ang mga sulat habang kailangan para sagutin ang iyong tanong at sa kinakailangang pangangasiwa. Maaari mong itanong kung anong datos ang hawak namin tungkol sa iyo, o humiling ng pagwawasto o pagbura. Sinusuri namin ang iyong kahilingan habang isinasaalang-alang ang anumang obligasyong mag-ingat ng datos.' },
        { title: 'IpiWow at lokal na datos', body: 'Hindi kailangan ng IpiWow ng online account ng manlalaro. May palayaw at edad ang lokal na profile; nananatili sa device ang progreso at mga setting. Gumagana ang app nang walang internet. Apple ang nagpoproseso ng pagbili sa App Store ayon sa sarili nitong mga tuntunin at patakaran sa privacy.' },
        { title: 'Mga dating serbisyo ng VexNexa', body: 'Hindi awtomatikong binabago ng bagong website ang mga dating kasunduan, subscription o panahon ng pag-iingat ng datos para sa dating serbisyo sa accessibility. Kung may tanong ka, makipag-ugnayan gamit ang iyong reference o numero ng invoice. Huwag ibahagi ang detalye ng pagbabayad.' },
      ], contactCta: 'Magtanong tungkol sa privacy',
    },
    support: {
      eyebrow: 'Tulong', title: 'Paano kami makatutulong?', intro: 'Nakatuon na ngayon ang VexNexa sa paggawa ng mga laro. Maaari kang makipag-ugnayan tungkol sa aming mga laro at sa dati mong paggamit ng VexNexa.',
      gameTitle: 'Tulong sa IpiWow', gameBody: 'Sabihin kung ano ang nangyayari, anong device ang gamit mo at, kung alam mo, ang bersiyon ng app. Huwag magsama ng personal na impormasyon ng bata.',
      formerTitle: 'Mga dating serbisyo sa accessibility', formerBody: 'May tanong tungkol sa dating paggamit, invoice o subscription? Mag-email kasama ang iyong reference o numero ng invoice. Walang SaaS login o pahina ng pagbabayad ang bagong website.',
      billingNote: 'Ang pagbabago ng website ay hindi kumpirmasyon na natapos na ang isang kasalukuyang subscription. Makipag-ugnayan kung kailangan mo ng paglilinaw.', contactCta: 'Makipag-ugnayan',
    },
    footer: { tagline: 'Mga larong matutuklasan.', privacy: 'Privacy', support: 'Tulong', rights: 'Nakalaan ang lahat ng karapatan.' },
    seo: {
      home: { title: 'VexNexa | Mga larong matutuklasan', description: 'Kilalanin ang VexNexa, ang malayang studio sa likod ng IpiWow. Makukulay na laro para sa mga mausisa, sa pitong wika.' },
      ipiwow: { title: 'IpiWow | Pakikipagsapalaran sa kaalaman ng VexNexa', description: 'Tuklasin ang IpiWow: 10 kategorya, 200 antas, mga tanong at palaisipan. Laruin sa iPhone nang walang internet, patalastas o subscription.' },
      studio: { title: 'Ang studio | VexNexa', description: 'Kilalanin ang VexNexa, ang malayang studio sa likod ng IpiWow. Mga larong may puwang sa pag-uusisa, pagtuklas at saya.' },
      contact: { title: 'Makipag-ugnayan | VexNexa', description: 'May tanong sa IpiWow, mungkahi o ideya ng pakikipagtulungan? Kontakin ang VexNexa sa form o sa info@vexnexa.com.' },
      privacy: { title: 'Privacy | VexNexa', description: 'Alamin kung paano ginagamit ng website ng VexNexa ang impormasyon sa pakikipag-ugnayan, hosting at email, at paano magtanong sa privacy.' },
      support: { title: 'Tulong | VexNexa', description: 'Kailangan ng tulong sa IpiWow o may tanong tungkol sa mga dating serbisyo ng VexNexa? Alamin kung paano makipag-ugnayan.' },
    },
  },
} satisfies Record<Locale, StudioContent>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function getContent(locale: Locale): StudioContent {
  return content[locale];
}

export function getSeo(locale: Locale, page: PageName): SeoContent {
  return content[locale].seo[page];
}
