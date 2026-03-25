/**
 * Adds missing metadata keys to blog translations
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

const blogMetadata = {
  en: { metadata: { title: "Blog - VexNexa", description: "Latest news, tips, and insights on web accessibility and WCAG compliance." } },
  nl: { metadata: { title: "Blog - VexNexa", description: "Laatste nieuws, tips en inzichten over webtoegankelijkheid en WCAG-naleving." } },
  de: { metadata: { title: "Blog - VexNexa", description: "Aktuelle Nachrichten, Tipps und Einblicke zu Web-Barrierefreiheit und WCAG-Konformität." } },
  fr: { metadata: { title: "Blog - VexNexa", description: "Dernières nouvelles, conseils et perspectives sur l'accessibilité web et la conformité WCAG." } },
  es: { metadata: { title: "Blog - VexNexa", description: "Últimas noticias, consejos e ideas sobre accesibilidad web y cumplimiento WCAG." } }
};

const locales = ['en', 'nl', 'de', 'fr', 'es'];

for (const locale of locales) {
  console.log(`Processing ${locale}...`);
  const data = loadLocale(locale);
  
  // Add metadata to blog namespace
  if (!data.blog) data.blog = {};
  Object.assign(data.blog, blogMetadata[locale]);
  
  saveLocale(locale, data);
}

console.log('\nDone! Blog metadata updated for all locales.');
