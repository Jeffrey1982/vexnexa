"use client"

import type { Metadata } from 'next'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Cookie Beleid
            </h1>

            <div className="text-gray-600 mb-6">
              <p className="mb-4">Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Wat zijn cookies?</h2>
                <p className="mb-4">
                  Cookies zijn kleine tekstbestanden die op uw apparaat worden opgeslagen wanneer u onze website bezoekt.
                  Ze helpen ons de website beter te laten functioneren en uw ervaring te verbeteren.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welke cookies gebruiken wij?</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">🔧 Noodzakelijke Cookies</h3>
                  <p className="text-blue-800 mb-3">
                    Deze cookies zijn essentieel voor het functioneren van onze website en kunnen niet worden uitgeschakeld.
                  </p>
                  <ul className="list-disc list-inside text-blue-800 space-y-2">
                    <li><strong>Sessie cookies:</strong> Voor het bijhouden van uw inlogstatus</li>
                    <li><strong>Beveiliging cookies:</strong> Voor bescherming tegen CSRF-aanvallen</li>
                    <li><strong>Voorkeuren cookies:</strong> Voor het onthouden van uw taalvoorkeur</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-green-900 mb-3">📊 Functionele Cookies</h3>
                  <p className="text-green-800 mb-3">
                    Deze cookies verbeteren de functionaliteit van de website maar zijn niet strikt noodzakelijk.
                  </p>
                  <ul className="list-disc list-inside text-green-800 space-y-2">
                    <li><strong>Dashboard instellingen:</strong> Voor het onthouden van uw dashboard voorkeuren</li>
                    <li><strong>Service Worker:</strong> Voor offline functionaliteit</li>
                    <li><strong>Cache beheer:</strong> Voor betere laadtijden</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-3">📈 Analytische Cookies</h3>
                  <p className="text-yellow-800 mb-3">
                    Deze cookies helpen ons begrijpen hoe bezoekers onze website gebruiken.
                  </p>
                  <ul className="list-disc list-inside text-yellow-800 space-y-2">
                    <li><strong>Gebruik statistieken:</strong> Anonieme data over website gebruik</li>
                    <li><strong>Performance monitoring:</strong> Voor het verbeteren van laadtijden</li>
                    <li><strong>Error tracking:</strong> Voor het oplossen van technische problemen</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8" id="instellingen">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Instellingen</h2>
                <div className="bg-gray-50 border rounded-lg p-6">
                  <p className="mb-4">
                    U kunt uw cookie voorkeuren hieronder beheren. Let op: het uitschakelen van bepaalde cookies
                    kan de functionaliteit van de website beïnvloeden.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded border">
                      <div>
                        <h4 className="font-semibold">Noodzakelijke Cookies</h4>
                        <p className="text-sm text-gray-600">Altijd actief - vereist voor basisfunctionaliteit</p>
                      </div>
                      <div className="bg-gray-400 rounded-full w-12 h-6 flex items-center">
                        <div className="bg-gray-600 w-5 h-5 rounded-full ml-1"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded border">
                      <div>
                        <h4 className="font-semibold">Functionele Cookies</h4>
                        <p className="text-sm text-gray-600">Voor verbeterde gebruikerservaring</p>
                      </div>
                      <button
                        type="button"
                        className="bg-blue-500 rounded-full w-12 h-6 flex items-center transition-colors hover:bg-blue-600"
                        onClick={() => window.location.reload()}
                      >
                        <div className="bg-white w-5 h-5 rounded-full ml-6 transition-transform"></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded border">
                      <div>
                        <h4 className="font-semibold">Analytische Cookies</h4>
                        <p className="text-sm text-gray-600">Voor website analyse en verbetering</p>
                      </div>
                      <button
                        type="button"
                        className="bg-blue-500 rounded-full w-12 h-6 flex items-center transition-colors hover:bg-blue-600"
                        onClick={() => window.location.reload()}
                      >
                        <div className="bg-white w-5 h-5 rounded-full ml-6 transition-transform"></div>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-4">
                    <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Alle accepteren
                    </button>
                    <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                      Alleen noodzakelijke
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                      Opslaan & sluiten
                    </button>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Uw rechten</h2>
                <p className="mb-4">
                  Onder de AVG/GDPR heeft u de volgende rechten betreffende cookies:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Recht op informatie:</strong> U heeft het recht te weten welke cookies we gebruiken</li>
                  <li><strong>Recht van toegang:</strong> U kunt inzage vragen in uw cookie data</li>
                  <li><strong>Recht op rectificatie:</strong> U kunt onjuiste cookie data laten corrigeren</li>
                  <li><strong>Recht op verwijdering:</strong> U kunt uw cookie data laten verwijderen</li>
                  <li><strong>Recht op bezwaar:</strong> U kunt bezwaar maken tegen cookie gebruik</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies beheren in uw browser</h2>
                <p className="mb-4">
                  U kunt cookies ook direct in uw browser beheren:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Chrome:</strong> Instellingen → Privacy en beveiliging → Cookies en andere sitegegevens</li>
                  <li><strong>Firefox:</strong> Voorkeuren → Privacy en beveiliging → Cookies en sitegegevens</li>
                  <li><strong>Safari:</strong> Safari → Voorkeuren → Privacy → Cookies en websitegegevens</li>
                  <li><strong>Edge:</strong> Instellingen → Cookies en sitemachtigingen</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Derde partijen</h2>
                <p className="mb-4">
                  Onze website maakt gebruik van de volgende externe services die mogelijk cookies plaatsen:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Supabase:</strong> Voor authenticatie en database services</li>
                  <li><strong>Vercel:</strong> Voor website hosting en CDN</li>
                  <li><strong>Resend:</strong> Voor e-mail services</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Wijzigingen in dit beleid</h2>
                <p className="mb-4">
                  We kunnen dit cookie beleid van tijd tot tijd bijwerken. Wijzigingen worden gepubliceerd op deze pagina
                  met een nieuwe &ldquo;laatst bijgewerkt&rdquo; datum.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
                <p className="mb-4">
                  Voor vragen over dit cookie beleid kunt u contact met ons opnemen:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="mb-2"><strong>E-mail:</strong> <a href="mailto:privacy@tutusporta.com" className="text-blue-600 hover:text-blue-800">privacy@tutusporta.com</a></p>
                  <p className="mb-2"><strong>Website:</strong> <a href="/contact" className="text-blue-600 hover:text-blue-800">Contactformulier</a></p>
                  <p><strong>Adres:</strong> TutusPorta, Nederland</p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <a
                  href="/legal/privacy"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  ← Terug naar Privacybeleid
                </a>
                <a
                  href="/legal/terms"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Algemene Voorwaarden
                </a>
                <a
                  href="/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Terug naar Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}