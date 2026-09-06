import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const directory = path.dirname(fileURLToPath(import.meta.url))
const repository = path.resolve(directory, '../..')
const require = createRequire(import.meta.url)

/** Refuse every database except the explicitly opted-in local CI scratch DB. */
export function assertScratchEnvironment(env) {
  if (env.CI !== 'true' || env.CI_SCRATCH_DATABASE_IS_SAFE !== 'true') {
    throw new Error('Scratch database setup requires CI=true and CI_SCRATCH_DATABASE_IS_SAFE=true.')
  }
  if (['production', 'prod'].includes(env.NODE_ENV) || ['production', 'prod'].includes(env.VERCEL_ENV)) {
    throw new Error('Scratch database setup is forbidden in a production environment.')
  }

  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    let url
    try {
      url = new URL(env[key])
    } catch {
      throw new Error(`${key} must be an explicit local scratch database URL.`)
    }
    if (!['postgresql:', 'postgres:'].includes(url.protocol)
      || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      || url.pathname !== '/vexnexa_ci_scratch'
      || url.hash
      || [...url.searchParams].some(([name, value]) => name !== 'schema' || value !== 'public')) {
      throw new Error(`${key} must target the loopback-only vexnexa_ci_scratch database and public schema.`)
    }
  }
  if (env.DATABASE_URL !== env.DIRECT_URL) {
    throw new Error('DATABASE_URL and DIRECT_URL must be identical for scratch verification.')
  }
}

// Git may check out SQL with CRLF on Windows; checksums describe SQL content.
export function checksum(contents) {
  return createHash('sha256').update(contents.replace(/\r\n/g, '\n')).digest('hex')
}

/** Legacy SQL stays immutable; only new, forward-dated migrations are replayed. */
export function planMigrations(manifest, migrations) {
  const legacy = manifest.legacyMigrations
  if (!legacy || Object.keys(legacy).length === 0) throw new Error('The legacy migration manifest is empty.')
  const byName = new Map(migrations.map((migration) => [migration.name, migration.sql]))
  for (const [name, expected] of Object.entries(legacy)) {
    if (!byName.has(name)) throw new Error(`Legacy migration is missing: ${name}`)
    if (checksum(byName.get(name)) !== expected) throw new Error(`Legacy migration was modified: ${name}`)
  }
  const cutoff = Object.keys(legacy).sort().at(-1)
  return migrations.filter(({ name }) => !Object.hasOwn(legacy, name)).sort((a, b) => a.name.localeCompare(b.name)).map((migration) => {
    if (!/^\d{14}_[a-zA-Z0-9_]+$/.test(migration.name) || migration.name <= cutoff) {
      throw new Error(`New migrations must use a forward-dated YYYYMMDDHHMMSS_name directory: ${migration.name}`)
    }
    if (!migration.sql.trim()) throw new Error(`New migration is empty: ${migration.name}`)
    return migration
  })
}

export async function verifyScratchDatabase() {
  // Deliberately do not load .env: the workflow must supply the safe URLs.
  assertScratchEnvironment(process.env)
  const manifest = JSON.parse(await readFile(path.join(directory, 'legacy-migrations.json'), 'utf8'))
  const migrationDirectory = path.join(repository, 'prisma/migrations')
  const entries = await readdir(migrationDirectory, { withFileTypes: true })
  const migrations = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => ({
    name: entry.name,
    sql: await readFile(path.join(migrationDirectory, entry.name, 'migration.sql'), 'utf8'),
  })))
  const future = planMigrations(manifest, migrations)
  const baseline = await readFile(path.join(directory, 'baseline.prisma'), 'utf8')
  if (checksum(baseline) !== manifest.baselineSha256) throw new Error('The frozen CI baseline was modified.')

  // Work outside the checkout so Prisma cannot discover developer .env files.
  const temporary = await mkdtemp(path.join(tmpdir(), 'vexnexa-ci-schema-'))
  const prismaCli = require.resolve('prisma/build/index.js')
  const run = (args, capture = false) => {
    const result = spawnSync(process.execPath, [prismaCli, ...args], {
      cwd: temporary,
      env: process.env,
      encoding: 'utf8',
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(`Prisma ${args.slice(0, 2).join(' ')} failed (exit ${result.status}).`)
    return result.stdout
  }

  try {
    await writeFile(path.join(temporary, 'baseline.prisma'), baseline)
    await writeFile(path.join(temporary, 'schema.prisma'), await readFile(path.join(repository, 'prisma/schema.prisma')))
    const sql = run(['migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'baseline.prisma', '--script'], true)
    const baselineDirectory = path.join(temporary, 'migrations/00000000000000_ci_schema_baseline')
    await mkdir(baselineDirectory, { recursive: true })
    await writeFile(path.join(baselineDirectory, 'migration.sql'), sql)
    await writeFile(path.join(temporary, 'migrations/migration_lock.toml'), 'provider = "postgresql"\n')
    for (const migration of future) {
      const target = path.join(temporary, 'migrations', migration.name)
      await mkdir(target)
      await writeFile(path.join(target, 'migration.sql'), migration.sql)
    }
    console.log(`CI-only schema baseline plus ${future.length} post-baseline migrations; ${migrations.length - future.length} legacy checksums verified.`)
    console.log('This checks the scratch schema and future migrations, not production migration history.')
    run(['migrate', 'deploy', '--schema', 'schema.prisma'])
    run(['migrate', 'status', '--schema', 'schema.prisma'])
    run(['migrate', 'diff', '--from-url', process.env.DATABASE_URL, '--to-schema-datamodel', 'schema.prisma', '--exit-code'])
  } finally {
    // mkdtemp generated this exact directory; no user-supplied cleanup paths.
    await rm(temporary, { recursive: true, force: true })
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyScratchDatabase().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
