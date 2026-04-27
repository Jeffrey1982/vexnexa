# Audit registratieproces — VexNexa

**Datum:** 26 april 2026
**Scope:** `src/app/auth/**`, `src/app/api/auth/**`, `src/app/api/sync-user/**`, `src/components/auth/ModernRegistrationForm.tsx`, `src/lib/user-sync.ts`, `src/middleware.ts`, `src/lib/rate-limit.ts`, callback flow en Prisma-schema (`User`, `AssuranceSubscription`, `BillingProfile`, `CheckoutQuote`).

Onderaan staat een prioriteitenlijst (P0/P1/P2) met concrete code-locaties en aanbevolen patches.

---

## 0. Architectuurplaatje (zoals nu geïmplementeerd)

1. Client `ModernRegistrationForm` doet client-side validatie (4 stappen) en roept `supabase.auth.signUp()` rechtstreeks aan met de anon-key.
2. Supabase mailt een verificatielink naar `auth/callback?flow=signup`.
3. `src/app/auth/callback/route.ts` ruilt de PKCE-code voor een sessie, roept `ensureUserInDatabase()` aan (Prisma `upsert` op `User`) en stuurt door naar `/auth/verified` of `/dashboard`.
4. Pas wanneer de gebruiker handmatig een Assurance-plan kiest, wordt er een `AssuranceSubscription`-rij aangemaakt en gaat de gebruiker via Mollie `create-payment` naar de hosted checkout.

Belangrijk: er is in het schema **geen aparte `Company`- of `Subscription`-entiteit** voor de basis-registratie. `company` is een vrij-tekstveld op `User`, en abonnementen leven in `AssuranceSubscription`/`AddOn`/`mollieSubscriptionId` (op User). Dat heeft consequenties voor punt 4 hieronder.

---

## 1. Validatielogica — bevindingen

### 1.1 E-mailvalidatie te permissief (P1)
`ModernRegistrationForm.tsx:172` gebruikt `^[^\s@]+@[^\s@]+\.[^\s@]+$`. Dit accepteert `a@b.c`, `x@localhost`, en strings met spaties tussen quotes. Server-side valideert Supabase wel netter, maar klantervaring (typo's) lijdt eronder.

Aanbevolen: gebruik dezelfde Zod-stijl als in `validation-schemas.ts` (`z.string().email()`) plús een DNS-MX-check op de domeinnaam aan server-zijde voor enterprise-signups, en weiger bekende disposable-providers (`mailinator`, `tempmail`, `yopmail`, …). Trim & lowercase voorafgaand aan submit (Supabase normaliseert wel intern, maar UI-feedback voor "al in gebruik" werkt nu inconsistent als gebruiker `JOHN@x.nl` typt en eerder met `john@x.nl` heeft gesignupd).

### 1.2 Wachtwoordsterkte mist breach-check en speciale tekens (P1)
Regels (regel 182-197): ≥8 tekens, hoofdletter, kleine letter, cijfer. Geen eis voor speciale tekens en — belangrijker — geen check tegen [HaveIBeenPwned](https://haveibeenpwned.com/API/v3#PwnedPasswords). 8 tekens met `Welkom01` voldoet en zit gewoon in elke wordlist.

Aanbevolen: ≥10 tekens of NIST 800-63B-stijl ("zxcvbn score ≥ 3"), HIBP k-anonymity check, optionele speciale-tekens-eis, en een visuele strength-meter (`zxcvbn-ts`).

### 1.3 Naam-regex blokkeert internationale namen (P0 voor i18n)
`/^[a-zA-Z\s'-]+$/` (regel 205) wijst `Müller`, `José`, `Niño`, `Renée`, `İlhan`, `王明`, `محمد` allemaal af.

Voor een product dat zich op de internationale markt richt is dit een **directe conversiekiller**. Vervangen door bijvoorbeeld:

```ts
const nameRegex = /^[\p{L}\p{M}\s'\-.]{1,80}$/u
```

Test ook met Unicode-zwbsp en RTL-marks (Hebreeuws/Arabisch).

### 1.4 Telefoon-regex laat onzin door (P2)
`/^[\d\s\+\-\(\)]+$/` matcht `(((+))) -- ` als geldig.

Vervang door `libphonenumber-js` met `country` als hint (al gevraagd in stap 3) — direct ook E.164-genormaliseerd voor latere SMS/2FA-toepassing.

### 1.5 Website-URL accepteert `javascript:` en `file:` (P1)
`new URL(formData.website)` vangt alleen syntaxfouten. `javascript:alert(1)` komt erdoorheen en wordt later ergens als hyperlink getoond → potentiële stored XSS.

Forceer `https?:`-protocol en log warn bij `http:` (downgrade-attack op AVG-hostnames).

### 1.6 Domein-validatie voor Axe-core scan (P1)
In `src/app/dashboard/assurance/domains/new/page.tsx` (regel 109-117) staat alleen `<Input type="url" required>`. De server-side `POST /api/assurance/domains` checkt enkel `if (!domain || typeof domain !== 'string')`. Dat betekent: `https://localhost`, `https://10.0.0.1`, `https://intern.lan`, en `https://[2001:db8::1]` worden geaccepteerd en doorgestuurd naar de scanner — dat is niet alleen lelijk maar een **SSRF-risico** (de scanner draait server-side en kan zo intern netwerkverkeer genereren).

Aanbevolen op API-laag:
* Parse via `new URL()`; afdwingen `https:` of `http:` met expliciete waarschuwing voor http;
* DNS-resolve het hostname en weiger als het in RFC1918 / loopback / link-local valt;
* Block `localhost`, `*.local`, `*.internal`, IDN-homoglyphs;
* Stuur een korte `HEAD`-request voorafgaand aan de full crawl voor reachability-feedback aan de gebruiker.

### 1.7 Stap 4 valideert niets (P2)
`validateStep(4)` keert direct `true` terug. Submit gebeurt op die stap, dus niet-bestaande check is niet meteen een bug — maar de form valideert tijdens `handleSubmit` niet opnieuw stap 1-3. Als de gebruiker via terug-knoppen e-mail/wachtwoord wijzigt en vooruit klikt zonder valideren te triggeren, kan ongeldige input worden verzonden.

Aanbevolen: roep `validateStep(1) && validateStep(2) && validateStep(3)` aan in `handleSubmit` of consolideer naar één Zod schema en valideer aan het einde de hele state.

### 1.8 ToS/Privacy-checkbox ontbreekt (P0 voor EU-compliance)
Er is geen verplicht "Ik ga akkoord met de Algemene Voorwaarden en Privacybeleid"-vinkje. Dat is op grond van AVG/Wbp en de UWV-richtlijnen voor SaaS in NL/EU **vereist** en bij audits het eerste wat gevraagd wordt. Voeg toe in stap 1 of stap 4, met links naar `/terms` en `/privacy`, en log de versies in een `consents`-tabel.

---

## 2. Security-check — bevindingen

### 2.1 Rate-limiter is in-memory en nutteloos op Vercel (P0)
`src/lib/rate-limit.ts` regel 9: `const rateLimitStore = new Map<string, RateLimitEntry>()`. De code-comment zegt het zelf: "for production, use Redis". In een serverless deployment heeft elke cold-start zijn eigen Map → een aanvaller die signup-spam stuurt vanaf één IP raakt nooit de limiet, omdat zijn opeenvolgende requests verschillende workers raken.

Effect: brute-force op `/api/auth/*` en `/api/sync-user` is feitelijk onbeperkt.

Aanbevolen: gebruik [Upstash Redis](https://upstash.com/) of Vercel KV met `@upstash/ratelimit` (sliding window, `auth: 5/15m per ip+email`, `signup: 10/h per ip`). Zet limiteer op `email`-key voor signup, niet alleen op IP.

### 2.2 Plan- en subscription-status worden bij elke login overschreven (P0)
`src/lib/user-sync.ts` regel 28-29 in het `update`-pad van `upsert`:

```ts
plan: 'FREE' as PrismaPlan,
subscriptionStatus: 'active',
```

`ensureUserInDatabase()` draait bij élke succesvolle callback (regel 176 in `auth/callback/route.ts`). Een betalende klant met `plan: 'PRO'` wordt elke login dus stilletjes naar `FREE` gezet. Mollie-webhook of een latere job moet dit weer herstellen, en in de window daartussen krijgt de klant feature-restricties.

**Fix:** verwijder `plan` en `subscriptionStatus` uit de `update`-tak. Zet ze alleen in `create`. Beter nog: splits de upsert in (a) `update` voor profielvelden en (b) een aparte create-only voor billing-defaults.

```ts
const dbUser = await prisma.user.upsert({
  where: { email },
  update: { /* alleen profielvelden, géén plan/subscriptionStatus */ },
  create: { /* idem als nu */ },
})
```

### 2.3 ID-overschrijving in upsert is een data-integriteitsval (P0)
Regel 13 in de `update`-tak zet `id: supabaseUser.id`. Stel: een gebruiker wordt verwijderd in Supabase Auth en signupt opnieuw met dezelfde e-mail (bij Supabase krijgt hij dan een nieuwe `auth.users.id`). De Prisma `User.id` wordt dan ook overschreven, terwijl die als FK is gekoppeld aan ~25 child-tabellen (`Site`, `Issue`, `BillingProfile`, …). Dat zal Postgres weigeren of (erger) cascade-deletes triggeren.

**Fix:** match de `where` op `id` óf op `email` consistent, en haal `id` uit de `update`-tak. Doe een aparte migratiepad voor "user re-registers".

### 2.4 Wachtwoord-hashing (P2 — informatief)
Wachtwoorden worden door Supabase Auth gehashed (bcrypt). Geen custom auth-pad gevonden → goed.

### 2.5 SQL-injection (P2 — informatief)
Alleen Prisma + parametrised queries in registratiepad. Geen `$queryRawUnsafe`. Geen risico.

### 2.6 CSRF op `/api/sync-user` (P1)
Endpoint POST zonder CSRF-token, alleen sessie-cookie. Met `SameSite=Lax` (Supabase default) is dit *meestal* veilig, maar bij top-level POST forms vanaf een third party (`<form method=POST action=...>`) zou het kunnen tickelen. Voeg een `Origin`-header check toe of een CSRF-token via `next-csrf`/`@edge-csrf/nextjs`.

### 2.7 Open-redirect / domeinwhitelist (P1)
`auth/callback/route.ts` regel 24-30 heeft `localhost` óók in productie als allowed host. Filter dat op `process.env.NODE_ENV !== 'production'`. Dezelfde geldt voor `vexnexa.vercel.app` als je productie alleen op `vexnexa.com` draait.

### 2.8 CSP staat `'unsafe-inline'` en `'unsafe-eval'` toe (P1)
`middleware.ts` regel 162. Dit ontmantelt grotendeels het XSS-vangnet. Migreer inline scripts naar nonces of hashes (Next.js ondersteunt dit native sinds 14). Sentry CDN heeft de eval-toestemming nodig — overweeg `Sentry` zelf-hosted.

### 2.9 E-mail-enumeration via foutmeldingen (P1)
Wanneer Supabase "User already registered" terug geeft, wordt die boodschap rauw doorgegeven aan de UI (`setError(error.message)` in `handleSubmit` catch). Een aanvaller kan zo een lijst van geldige accounts verzamelen.

**Fix:** vang `User already registered` op en toon een generieke "Als je e-mailadres bij ons bekend is, sturen we een bevestigingsmail" in plaats van een error. Stuur ook geen verschillende statuscodes terug per scenario.

### 2.10 Geen captcha / Turnstile (P0 voor productie)
Een open `supabase.auth.signUp` met alleen client-side rate-limiting via cooldown in localStorage betekent dat een script `localStorage.clear()` doet en eindeloos accounts kan aanmaken. Voeg Cloudflare Turnstile of hCaptcha toe vóór de signUp-call.

### 2.11 E-mailverificatie wordt niet hard afgedwongen (P1)
In Supabase staat default "Confirm email" aan, maar de callback redirect logica opent de sessie ook bij `flow=signup` zonder hardcoded check op `email_confirmed_at`. Voeg in de callback (regel 192) een `if (!data.user.email_confirmed_at) return redirect('/auth/check-email')` toe als zekerheidsnet.

### 2.12 Marketing/product-update consent (P1)
`productUpdates: true` als default in `ModernRegistrationForm.tsx:157`. Onder AVG art. 7 is opt-in vereist voor *commerciële* communicatie. Productupdates vallen hier deels onder. Zet beide checkboxes op `false` default of wees expliciet over de scope ("alleen security-en outage-communicatie kun je niet uitschakelen").

---

## 3. Foutafhandeling — bevindingen

### 3.1 Rauwe error-messages worden getoond (P1)
`ModernRegistrationForm.tsx:298` `setError(error.message)`. Supabase geeft soms berichten als "Database error querying schema 'auth'..."; eindgebruiker moet daar niets mee. Map errors naar een dictionary in `t('errors.*')`.

### 3.2 "Pagina hangt" bij timeout (P2)
De 25-seconden timeout (`Promise.race`) is slim, maar er is geen tussentijdse "we zijn nog bezig"-feedback. Voeg een progress-state in de button toe (`Verzenden... 0:08`).

### 3.3 DB-sync-failure is "non-fatal" maar app crasht erdoor (P1)
In `auth/callback/route.ts:175-181` wordt `ensureUserInDatabase` in try/catch, dbSyncSuccess gemarkeerd maar de gebruiker wordt alsnog naar `/dashboard` doorgestuurd. Dashboard-pages doen vervolgens `prisma.user.findUnique({ where: { id }})` en die geeft `null` terug → 500. Stuur de gebruiker bij DB-sync-fail naar een retry-pagina met een knop "opnieuw proberen", of trigger sync vanuit `/dashboard` als fallback.

### 3.4 Geen retry-queue voor welcome / admin-mail (P2)
`sendWelcomeEmail` en `sendNewUserNotification` falen "non-fatal" met enkel `console.error`. Bij Resend-outage missen ze. Schrijf naar een `EmailQueue`-tabel of gebruik Inngest/Resend-events.

### 3.5 Stap-state gaat verloren bij refresh (P2)
Geen autosave naar `localStorage` of server-side draft. Gebruiker die per ongeluk refresht (heel vaak op mobiel) is alle ingevulde data kwijt.

### 3.6 Resend-knop ontbreekt in success-state (P1)
Na `success.accountCreated` toont de form een melding maar geen *zichtbare* "verstuur opnieuw"-knop met cooldown. De `useAuthCooldown`-hook wordt aangemaakt (regel 110) maar nergens als button gerenderd. Gebruikers met spamfilter blijven hangen.

### 3.7 `/auth/verified` redirect bij sessieverlies naar login (P2)
`VerifiedClient.tsx` regel 33: bij `!data.user` → `?error=session_expired`. Dat is correct, maar de loginpagina toont voor `session_expired` géén specifieke melding (alleen generiek). Voeg vertaling toe.

---

## 4. Database-integriteit — bevindingen

### 4.1 Geen `Company`-entiteit (P1 — productbeslissing)
Het Prisma-schema (regel 11-83) heeft `company: String?` als vrij-tekstveld op `User`. Dat betekent:

* Twee collega's van *Acme NV* maken twee accounts → twee losse abonnementen, geen team-zicht.
* B2B-uitbreiding ("invite teamlid") werkt al via `Team`/`TeamMember`, maar de ingevoerde `company`-string wordt nergens gekoppeld aan een gedeelde organisatie-entiteit.

Voor enterprise-go-to-market raad ik een `Organization`-model aan, met `User.organizationId`. Migratiestrategie: domain-based auto-association (vandaar belang van strakke e-mail-validatie + reverse-DNS-check).

### 4.2 Geen Subscription-rij bij signup (P2)
Bij free signup wordt enkel `User.plan = FREE` gezet. Pas bij Mollie-checkout ontstaat `AssuranceSubscription`. Dat is een keuze — maar als je binnenkort trial-flows wilt aanbieden (`trialEndsAt`/`trialStartsAt`), zul je een `Trial` of `Subscription`-rij moeten initialiseren bij signup binnen één Prisma-transactie.

### 4.3 `BillingProfile` wordt niet aangemaakt (P1)
Gebruiker komt op de Mollie-checkout en moet daar plotseling factuuradres + VAT-ID invoeren. Dat is een extra friction point. Maak een `BillingProfile`-stub aan bij signup met de al ingevoerde `country` en `company`, zodat de checkout pre-filled is.

### 4.4 Geen transactie rond user-creation (P1)
`ensureUserInDatabase` doet alleen één `upsert`. Als je daarna besluit ook `BillingProfile`/`Notification`/`Portfolio` te initialiseren, doe dat in `prisma.$transaction([...])` om half-aangemaakte gebruikers te voorkomen.

### 4.5 `profileCompleted` te streng (P2)
Regel 24-27 in `user-sync.ts` markeert `profileCompleted: true` zodra first/last name aanwezig is. Voor je dashboard "complete-your-profile" prompts moet je ook `country`, `company` (of `organization`) en `phoneNumber` meenemen. Maak het een afgeleide property of voeg `profileCompletionScore: Int` toe.

### 4.6 Geen audit-log bij signup (P2)
`AuditLog`-model bestaat in het schema maar wordt niet geschreven bij user-creation. Voor SOC2/AVG-incident-response is een `AuditLog`-rij met `action: 'user.signup'`, IP en user-agent essentieel.

### 4.7 Index op `User.email` is impliciet via `@unique` (P3)
Goed.

---

## 5. UX drop-off & internationale markt — bevindingen

### 5.1 Vier stappen vóór account-creation (P0 voor conversie)
Industry-benchmarks (Baymard, Stripe Atlas) tonen ~10% drop per extra verplichte stap. De huidige flow heeft minimaal **7 verplichte velden** verspreid over 4 schermen, terwijl `firstName`, `lastName`, `company`, `jobTitle`, `phoneNumber`, `website`, `country` allemaal **na de eerste scan** verzameld kunnen worden.

**Aanbeveling:**
* Stap 1 (alles wat nu nodig is): `email`, `password`, `country` (voor VAT/Mollie), `acceptTerms`. Plus Google-OAuth-knop bovenin.
* Verplaats alle overige velden naar `/onboarding` of een progressive-profiling-flow op het dashboard.
* Verwacht effect: 25-40% hogere conversie van homepage → confirmed-account.

### 5.2 Hardcoded Engelse strings in step renders (P1 voor i18n)
Stap-titels in `renderStep1/2/3/4` zijn hardcoded ("Create Your Account", "Personal Information", "Stay connected with us (optional)"). De rest van het project gebruikt `next-intl` (`useTranslations('auth.register')` is geïmporteerd maar niet altijd toegepast). Voor NL/FR/ES/PT-markten zien gebruikers daardoor half-vertaalde flows.

### 5.3 Geen wachtwoord-toggle (show/hide) (P2)
Mobiele gebruikers met autocorrect maken vaak typ-fouten in `confirmPassword`. Toggle + één-veld-met-strength-meter is moderner dan twee velden.

### 5.4 Geen sociale login bovenin stap 1 (P1)
Google-knop zit nu onder de Card-content, ná de "Next"-knop, en is qua hierarchie ondergeschikt. Best practice: Google + Microsoft + (eventueel) Apple bovenin met `Of registreer met e-mail`-divider eronder.

### 5.5 `CountrySelect` zit op stap 3 (P1)
Country is nodig voor (a) Mollie BTW-berekening, (b) localisatie van wettelijke teksten, (c) hostname-validatie van de scan-domain. Zet hem op stap 1 zodat de hele rest van de flow gelokaliseerd kan worden.

### 5.6 Geen valuta/taal-detectie uit Accept-Language (P2)
De form is altijd Engels initieel. Detect `request.headers['accept-language']` in de page server-component en zet de juiste `useLocale()` start-waarde.

### 5.7 Geen direct doorzetten richting Mollie checkout (P1 — funnel)
Na e-mailverificatie redirect je naar `/dashboard?welcome=true`. Voor een betaald product ('Assurance') is dit een gemiste *purchase intent moment*. Aanbevolen funnel:

```
Pricing-pagina → Tier kiezen → Signup → Mailverificatie → Direct Mollie checkout (pre-filled)
```

Sla het gekozen tier in een query-param op (`?intent=assurance-pro`), en lees die in de callback uit om door te schakelen naar `/dashboard/billing/checkout?tier=PRO` in plaats van de generieke welcome.

### 5.8 Geen state-persistentie tussen stappen (P2)
React-state in component → `window.beforeunload` waarschuwing toevoegen, of een `localStorage` autosave per gebruiker (vergeet GDPR niet: ruim na 24h op).

### 5.9 ToS-link / Privacy-link (P0 voor compliance)
Zie ook punt 1.8. Toevoegen onder de submit-knop met expliciete checkbox en versie-tracking.

### 5.10 Welkomsmail-CTA gaat naar `/onboarding`, maar email-signups slaan onboarding over (P2)
`auth/callback/route.ts:255-258` stuurt OAuth-users zonder profiel naar `/onboarding`, maar email-signups (die wel firstName/lastName vulden) naar `/dashboard?welcome=true`. Twee verschillende paden voor "first-time experience". Eén consistente onboarding-wizard (4-stap progress: connect site → run scan → invite team → activate plan) verbetert activation-rate.

### 5.11 Geen progressie-indicator naar Mollie (P2)
Op de checkout-page zelf (Mollie-hosted) kun je niet veel doen, maar in *jouw* `/dashboard/billing/checkout`-pagina ervoor zou een visueel funnel-stappen-bar (`Account → Profiel → Plan → Betalen → Klaar`) helpen.

### 5.12 RTL-talen (Arabisch/Hebreeuws) niet ondersteund (P3)
Tailwind class `flex` + hardcoded `ml-2 mr-2` werkt voor LTR maar niet voor RTL. Niet acuut, maar goed om mee te nemen als je naar MENA-markt opschaalt.

---

## 6. Prioriteitenlijst (kort overzicht)

**P0 — Direct fixen (data-integriteit, security, of conversie-blokkers)**

1. Plan & subscriptionStatus uit upsert-update-tak halen (§2.2).
2. ID-overschrijving in upsert vermijden (§2.3).
3. Rate-limiter naar Redis/KV migreren (§2.1).
4. Captcha/Turnstile toevoegen aan signup (§2.10).
5. ToS/Privacy-checkbox + AVG-consent verplichten (§1.8 + §5.9).
6. Naam-regex i18n-proof maken (§1.3).
7. SSRF-bescherming voor Assurance-domein-input (§1.6).
8. 4-stap form reduceren naar 1 essentiële stap + onboarding (§5.1).

**P1 — Binnen 1-2 sprints**

* E-mail-enumeration generieker afhandelen (§2.9).
* CSP `'unsafe-inline'`/`'unsafe-eval'` weg (§2.8).
* `localhost` uit prod-allowlist (§2.7).
* CSRF-strategy expliciet maken (§2.6).
* `email_confirmed_at` hard verifiëren in callback (§2.11).
* Wachtwoord HIBP-check + strength-meter (§1.2).
* Website-URL protocol-whitelist (§1.5).
* Hardcoded Engelse strings i18n-iseren (§5.2).
* Sociale login bovenin (§5.4).
* `CountrySelect` naar stap 1 (§5.5).
* `Organization`-entiteit voor B2B (§4.1).
* `BillingProfile`-stub bij signup (§4.3).
* Resend-knop met cooldown zichtbaar maken (§3.6).
* DB-sync-failure naar retry-pagina (§3.3).
* Plan-aware redirect naar Mollie checkout (§5.7).
* Marketing/product-update opt-in default `false` (§2.12).
* Rauwe error-messages mappen naar i18n (§3.1).

**P2 — Nice to have / volgend kwartaal**

* libphonenumber-js (§1.4).
* Stap 4 valideren (§1.7).
* Wachtwoord-toggle (§5.3).
* Locale-autodetect (§5.6).
* State-persistence (§5.8).
* Audit-log bij signup (§4.6).
* Email-retry queue (§3.4).
* Progress-state in submit-button (§3.2).
* `profileCompleted` strenger maken of vervangen door score (§4.5).

**P3 — Roadmap**

* RTL-support (§5.12).
* SOC2-audit-log uitbreiden.

---

## 7. Concrete patch-suggesties (snippets)

### 7.1 Plan/subscriptionStatus uit upsert halen — `src/lib/user-sync.ts`

```ts
const dbUser = await prisma.user.upsert({
  where: { email },
  update: {
    // GEEN id, plan, subscriptionStatus meer hier
    firstName: supabaseUser.user_metadata?.first_name ?? undefined,
    lastName:  supabaseUser.user_metadata?.last_name  ?? undefined,
    company:   supabaseUser.user_metadata?.company    ?? undefined,
    jobTitle:  supabaseUser.user_metadata?.job_title  ?? undefined,
    phoneNumber: supabaseUser.user_metadata?.phone_number ?? undefined,
    website:   supabaseUser.user_metadata?.website    ?? undefined,
    country:   supabaseUser.user_metadata?.country    ?? undefined,
    marketingEmails: supabaseUser.user_metadata?.marketing_emails === true,
    productUpdates:  supabaseUser.user_metadata?.product_updates !== false,
    profileCompleted: !!(
      supabaseUser.user_metadata?.first_name &&
      supabaseUser.user_metadata?.last_name &&
      supabaseUser.user_metadata?.country
    ),
    updatedAt: now,
  },
  create: {
    id: supabaseUser.id,
    email,
    /* ... overige velden ... */
    plan: 'FREE',
    subscriptionStatus: 'active',
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: now,
  },
})
```

### 7.2 Generieke "email-already-exists"-respons — `ModernRegistrationForm.tsx`

```ts
if (error?.message?.toLowerCase().includes('already registered')) {
  setMessage(t('success.checkInbox'))     // niet als error tonen
  startResendCooldown()
  return
}
```

### 7.3 SSRF-bescherming voor Assurance-domein — `src/app/api/assurance/domains/route.ts`

```ts
import { lookup } from 'node:dns/promises'

const url = new URL(domain)
if (!['http:', 'https:'].includes(url.protocol)) throwBadRequest('Invalid protocol')
const { address } = await lookup(url.hostname)
if (isPrivateRange(address) || isLoopback(address)) throwBadRequest('Private network not allowed')
```

### 7.4 Naam-validatie i18n — `ModernRegistrationForm.tsx:205`

```ts
const nameRegex = /^[\p{L}\p{M}\p{Zs}'\-.]{1,80}$/u
```

### 7.5 ToS-checkbox — `renderStep1`

```tsx
<div className="flex items-start gap-2">
  <Checkbox
    id="acceptTerms"
    checked={formData.acceptTerms}
    onCheckedChange={(c) => updateFormData('acceptTerms', !!c)}
    required
  />
  <Label htmlFor="acceptTerms" className="text-xs leading-snug">
    {t.rich('legal.acceptTerms', {
      terms: (chunks) => <Link href="/terms" className="underline">{chunks}</Link>,
      privacy: (chunks) => <Link href="/privacy" className="underline">{chunks}</Link>,
    })}
  </Label>
</div>
```

---

## 8. Verificatiechecklist

Voor elk P0-fix:

* Schrijf een unit-test die de oude (slechte) state verwerpt en de nieuwe accepteert.
* Run `npm run test`, `npm run lint`, `npx prisma validate`.
* Test handmatig met deze 5 personae:
  1. NL-bedrijfje, betaalt PRO, normaal account.
  2. Duitser met `Müller`, `Sjö`, accent-rijke namen.
  3. Disposable e-mail (mailinator.com) — moet geweigerd worden.
  4. Gebruiker met `localhost` of `10.0.0.1` als domein in Assurance.
  5. Gebruiker die op stap 4 op refresh drukt.

Als alle 5 personae door de flow tot Mollie-checkout komen zonder console-errors of orphaned DB-rows, ben je een stuk verder.

---

*Auditor: Claude — gegenereerd op basis van code op `D:\Vexnexa-clean` (commit/working-copy 26 april 2026). Geen automatische tests of pen-test uitgevoerd; aanbevelingen zijn op basis van static analysis.*
