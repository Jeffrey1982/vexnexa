/**
 * Updates sampleReport translations with all needed keys
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

const sampleReportTranslations = {
  en: {
    badge: "Sample Report",
    title: "What a VexNexa accessibility report looks like",
    titleHighlight: "looks like",
    subtitle: "This is a sample report based on realistic scan data. Business and Enterprise plans can white-label this with your own logo, colours, and company name.",
    ctaPrimary: "Scan your own site",
    ctaSecondary: "Learn about white-label",
    executiveSummary: "Executive Summary",
    scoreTitle: "Accessibility Score",
    severityCritical: "Critical",
    severitySerious: "Serious", 
    severityModerate: "Moderate",
    severityMinor: "Minor",
    downloadTitle: "Download the full sample report",
    downloadSubtitle: "See exactly what your clients will receive — branded, structured, and ready to share.",
    downloadBranded: "Request PDF sample",
    downloadWhiteLabel: "Request white-label example",
    downloadNote: "We'll send you a personalized sample report within 1 business day.",
    exportTitle: "Export as PDF or DOCX — with your branding",
    exportSubtitle: "Business and Enterprise plans include white-label exports. Replace the VexNexa brand with your own logo, company name, colours, and footer text. Reports export as ready-to-share PDF or editable DOCX.",
    exportLearnMore: "Learn about white-label reports"
  },
  nl: {
    badge: "Voorbeeldrapport",
    title: "Hoe een VexNexa toegankelijkheidsrapport eruitziet",
    titleHighlight: "eruitziet",
    subtitle: "Dit is een voorbeeldrapport gebaseerd op realistische scandata. Business- en Enterprise-abonnementen kunnen dit white-labelen met je eigen logo, kleuren en bedrijfsnaam.",
    ctaPrimary: "Scan je eigen site",
    ctaSecondary: "Meer over white-label",
    executiveSummary: "Samenvatting",
    scoreTitle: "Toegankelijkheidsscore",
    severityCritical: "Kritiek",
    severitySerious: "Ernstig",
    severityModerate: "Matig", 
    severityMinor: "Klein",
    downloadTitle: "Download het volledige voorbeeldrapport",
    downloadSubtitle: "Zie precies wat je klanten ontvangen — op maat, gestructureerd en klaar om te delen.",
    downloadBranded: "Vraag PDF-voorbeeld aan",
    downloadWhiteLabel: "Vraag white-label voorbeeld aan",
    downloadNote: "We sturen je binnen 1 werkdag een persoonlijk voorbeeldrapport.",
    exportTitle: "Exporteer als PDF of DOCX — met je branding",
    exportSubtitle: "Business- en Enterprise-abonnementen bevatten white-label exports. Vervang het VexNexa-merk door je eigen logo, bedrijfsnaam, kleuren en voettekst. Rapporten exporteren als deelbare PDF of bewerkbaar DOCX.",
    exportLearnMore: "Meer over white-label rapporten"
  },
  de: {
    badge: "Beispielbericht",
    title: "Wie ein VexNexa-Barrierefreiheitsbericht aussieht",
    titleHighlight: "aussieht",
    subtitle: "Dies ist ein Beispielbericht basierend auf realistischen Scandaten. Business- und Enterprise-Pläne können dies mit Ihrem eigenen Logo, Farben und Firmennamen als White-Label versehen.",
    ctaPrimary: "Eigene Website scannen",
    ctaSecondary: "Mehr über White-Label",
    executiveSummary: "Zusammenfassung",
    scoreTitle: "Barrierefreiheits-Score",
    severityCritical: "Kritisch",
    severitySerious: "Schwerwiegend",
    severityModerate: "Mäßig",
    severityMinor: "Gering",
    downloadTitle: "Vollständigen Beispielbericht herunterladen",
    downloadSubtitle: "Sehen Sie genau, was Ihre Kunden erhalten — markenspezifisch, strukturiert und bereit zum Teilen.",
    downloadBranded: "PDF-Beispiel anfordern",
    downloadWhiteLabel: "White-Label-Beispiel anfordern",
    downloadNote: "Wir senden Ihnen innerhalb von 1 Werktag einen personalisierten Beispielbericht.",
    exportTitle: "Als PDF oder DOCX exportieren — mit Ihrer Branding",
    exportSubtitle: "Business- und Enterprise-Pläne enthalten White-Label-Exports. Ersetzen Sie die VexNexa-Marke durch Ihr eigenes Logo, Firmennamen, Farben und Fußzeilentext. Berichte exportieren als teilbare PDF oder bearbeitbare DOCX.",
    exportLearnMore: "Mehr über White-Label-Berichte"
  },
  fr: {
    badge: "Exemple de rapport",
    title: "À quoi ressemble un rapport d'accessibilité VexNexa",
    titleHighlight: "ressemble",
    subtitle: "Ceci est un exemple de rapport basé sur des données d'analyse réalistes. Les plans Business et Enterprise peuvent le mettre en marque blanche avec votre propre logo, couleurs et nom d'entreprise.",
    ctaPrimary: "Analyser votre propre site",
    ctaSecondary: "En savoir plus sur la marque blanche",
    executiveSummary: "Résumé",
    scoreTitle: "Score d'accessibilité",
    severityCritical: "Critique",
    severitySerious: "Sérieux",
    severityModerate: "Modéré",
    severityMinor: "Mineur",
    downloadTitle: "Télécharger l'exemple de rapport complet",
    downloadSubtitle: "Voyez exactement ce que vos clients recevront — personnalisé, structuré et prêt à partager.",
    downloadBranded: "Demander un exemple PDF",
    downloadWhiteLabel: "Demander un exemple en marque blanche",
    downloadNote: "Nous vous enverrons un rapport d'exemple personnalisé sous 1 jour ouvré.",
    exportTitle: "Exporter en PDF ou DOCX — avec votre branding",
    exportSubtitle: "Les plans Business et Enterprise incluent les exports en marque blanche. Remplacez la marque VexNexa par votre propre logo, nom d'entreprise, couleurs et texte de pied de page. Les rapports s'exportent en PDF partageable ou DOCX modifiable.",
    exportLearnMore: "En savoir plus sur les rapports en marque blanche"
  },
  es: {
    badge: "Informe de ejemplo",
    title: "Cómo se ve un informe de accesibilidad de VexNexa",
    titleHighlight: "se ve",
    subtitle: "Este es un informe de ejemplo basado en datos de análisis realistas. Los planes Business y Enterprise pueden ponerlo en marca blanca con su propio logo, colores y nombre de empresa.",
    ctaPrimary: "Analizar su propio sitio",
    ctaSecondary: "Más sobre marca blanca",
    executiveSummary: "Resumen",
    scoreTitle: "Puntuación de accesibilidad",
    severityCritical: "Crítico",
    severitySerious: "Grave",
    severityModerate: "Moderado",
    severityMinor: "Menor",
    downloadTitle: "Descargar el informe de ejemplo completo",
    downloadSubtitle: "Vea exactamente lo que recibirán sus clientes — personalizado, estructurado y listo para compartir.",
    downloadBranded: "Solicitar ejemplo PDF",
    downloadWhiteLabel: "Solicitar ejemplo de marca blanca",
    downloadNote: "Le enviaremos un informe de ejemplo personalizado en 1 día hábil.",
    exportTitle: "Exportar como PDF o DOCX — con su branding",
    exportSubtitle: "Los planes Business y Enterprise incluyen exportaciones de marca blanca. Reemplace la marca VexNexa con su propio logo, nombre de empresa, colores y texto de pie de página. Los informes se exportan como PDF compartible o DOCX editable.",
    exportLearnMore: "Más sobre informes de marca blanca"
  }
};

const locales = ['en', 'nl', 'de', 'fr', 'es'];

for (const locale of locales) {
  console.log(`Processing ${locale}...`);
  const data = loadLocale(locale);
  
  // Update sampleReport with complete translations
  data.sampleReport = sampleReportTranslations[locale];
  
  saveLocale(locale, data);
}

console.log('\nDone! Sample report translations updated for all locales.');
