"use client"

import type { Metadata } from 'next'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Cookie Policy
            </h1>

            <div className="text-muted-foreground mb-6">
              <p className="mb-4">Last updated: {new Date().toLocaleDateString('en-US')}</p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">What are cookies?</h2>
                <p className="mb-4">
                  Cookies are small text files that are stored on your device when you visit our website.
                  They help us make the website function better and improve your experience.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Which cookies do we use?</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">🔧 Essential Cookies</h3>
                  <p className="text-blue-800 mb-3">
                    These cookies are essential for the functioning of our website and cannot be disabled.
                  </p>
                  <ul className="list-disc list-inside text-blue-800 space-y-2">
                    <li><strong>Session cookies:</strong> To track your login status</li>
                    <li><strong>Security cookies:</strong> For protection against CSRF attacks</li>
                    <li><strong>Preference cookies:</strong> To remember your language preference</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-green-900 mb-3">📊 Functional Cookies</h3>
                  <p className="text-green-800 mb-3">
                    These cookies improve the functionality of the website but are not strictly necessary.
                  </p>
                  <ul className="list-disc list-inside text-green-800 space-y-2">
                    <li><strong>Dashboard settings:</strong> To remember your dashboard preferences</li>
                    <li><strong>Service Worker:</strong> For offline functionality</li>
                    <li><strong>Cache management:</strong> For better loading times</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-3">📈 Analytics Cookies</h3>
                  <p className="text-yellow-800 mb-3">
                    These cookies help us understand how visitors use our website.
                  </p>
                  <ul className="list-disc list-inside text-yellow-800 space-y-2">
                    <li><strong>Usage statistics:</strong> Anonymous data about website usage</li>
                    <li><strong>Performance monitoring:</strong> To improve loading times</li>
                    <li><strong>Error tracking:</strong> To resolve technical issues</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8" id="instellingen">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Settings</h2>
                <div className="bg-gray-50 border rounded-lg p-6">
                  <p className="mb-4">
                    You can manage your cookie preferences below. Please note: disabling certain cookies
                    may affect the functionality of the website.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded border">
                      <div>
                        <h4 className="font-semibold">Essential Cookies</h4>
                        <p className="text-sm text-muted-foreground">Always active - required for basic functionality</p>
                      </div>
                      <div className="bg-gray-400 rounded-full w-12 h-6 flex items-center">
                        <div className="bg-gray-600 w-5 h-5 rounded-full ml-1"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded border">
                      <div>
                        <h4 className="font-semibold">Functional Cookies</h4>
                        <p className="text-sm text-muted-foreground">For enhanced user experience</p>
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
                        <h4 className="font-semibold">Analytics Cookies</h4>
                        <p className="text-sm text-muted-foreground">For website analysis and improvement</p>
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
                      Accept all
                    </button>
                    <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                      Essential only
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                      Save & close
                    </button>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your rights</h2>
                <p className="mb-4">
                  Under GDPR you have the following rights regarding cookies:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Right to information:</strong> You have the right to know which cookies we use</li>
                  <li><strong>Right of access:</strong> You can request access to your cookie data</li>
                  <li><strong>Right to rectification:</strong> You can have incorrect cookie data corrected</li>
                  <li><strong>Right to erasure:</strong> You can have your cookie data deleted</li>
                  <li><strong>Right to object:</strong> You can object to the use of cookies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing cookies in your browser</h2>
                <p className="mb-4">
                  You can also manage cookies directly in your browser:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                  <li><strong>Firefox:</strong> Preferences → Privacy and security → Cookies and site data</li>
                  <li><strong>Safari:</strong> Safari → Preferences → Privacy → Cookies and website data</li>
                  <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third parties</h2>
                <p className="mb-4">
                  Our website uses the following external services that may place cookies:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Supabase:</strong> For authentication and database services</li>
                  <li><strong>Vercel:</strong> For website hosting and CDN</li>
                  <li><strong>Resend:</strong> For email services</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to this policy</h2>
                <p className="mb-4">
                  We may update this cookie policy from time to time. Changes will be published on this page
                  with a new &ldquo;last updated&rdquo; date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
                <p className="mb-4">
                  For questions about this cookie policy, you can contact us:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@vexnexa.com" className="text-blue-600 hover:text-blue-800">info@vexnexa.com</a></p>
                  <p className="mb-2"><strong>Website:</strong> <a href="/contact" className="text-blue-600 hover:text-blue-800">Contact form</a></p>
                  <p className="mb-2"><strong>Address:</strong> Provencialeweg 46B, 1562TB Krommenie, Netherlands</p>
                  <p className="mb-2"><strong>Chamber of Commerce:</strong> 94848262</p>
                  <p><strong>Establishment Number:</strong> 000060294744</p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <a
                  href="/legal/privacy"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  ← Back to Privacy Policy
                </a>
                <a
                  href="/legal/terms"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Terms and Conditions
                </a>
                <a
                  href="/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Back to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}