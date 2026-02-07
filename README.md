# VexNexa

Next.js 14 + TypeScript + Tailwind + Prisma + Supabase accessibility scanner.

## Scripts
- npm run dev
- npm run build
- npm run start
- npm run lint

## Prisma + Supabase setup

Prisma CLI leest configuratie uit `.env` (niet `.env.local`). Voor Supabase heb je twee database URLs nodig:

- **DATABASE_URL**: Transaction pooler (poort 6543) voor runtime queries
- **DIRECT_URL**: Directe verbinding (poort 5432) voor migraties

### Wachtwoorden encoden
Wachtwoorden met speciale tekens moeten URL-encoded worden. Bijvoorbeeld `!` wordt `%21`.

In PowerShell:
```powershell
[System.Uri]::EscapeDataString("JOUW_WACHTWOORD")
```

### Setup commando's
```bash
# 1. Kopieer .env.example naar .env en vul credentials in
# 2. Valideer configuratie
npx prisma validate
# 3. Run migraties
npx prisma migrate dev --name init  
# 4. Genereer client
npx prisma generate
# 5. Start dev server
npm run dev
```

## Scanning runtime
- De scan-API gebruikt Playwright en draait in `runtime = "nodejs"`.
- We gebruiken `@axe-core/playwright` (AxeBuilder). Als een site de ESM/UMD-variant vereist, kun je tijdelijk de fallback forceren:
  ```bash
  USE_AXE_UMD=1 npm run dev
  ```

## Documentation
- [/docs/design/](/docs/design/)
- [/docs/architecture/](/docs/architecture/)
- [/docs/notes/](/docs/notes/)
