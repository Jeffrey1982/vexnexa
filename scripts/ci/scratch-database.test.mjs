import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { assertScratchEnvironment, checksum, planMigrations } from './scratch-database.mjs'

const safeUrl = 'postgresql://test:test@localhost:5432/vexnexa_ci_scratch'
const safe = { CI: 'true', CI_SCRATCH_DATABASE_IS_SAFE: 'true', DATABASE_URL: safeUrl, DIRECT_URL: safeUrl }

test('allows only explicitly opted-in loopback scratch databases', () => {
  assert.doesNotThrow(() => assertScratchEnvironment(safe))
  for (const host of ['127.0.0.1', '[::1]']) {
    const url = `postgresql://test:test@${host}:5432/vexnexa_ci_scratch?schema=public`
    assert.doesNotThrow(() => assertScratchEnvironment({ ...safe, DATABASE_URL: url, DIRECT_URL: url }))
  }
})

for (const [name, overrides] of Object.entries({
  'missing CI': { CI: undefined },
  'missing explicit safety flag': { CI_SCRATCH_DATABASE_IS_SAFE: undefined },
  'production Node environment': { NODE_ENV: 'production' },
  'production Vercel environment': { VERCEL_ENV: 'production' },
  'remote database': { DATABASE_URL: 'postgresql://test:test@remote.example/vexnexa_ci_scratch' },
  'generic test database': { DATABASE_URL: 'postgresql://test:test@localhost/test' },
  'malformed URL': { DATABASE_URL: 'not-a-url' },
  'missing direct URL': { DIRECT_URL: undefined },
  'alternate direct connection': { DIRECT_URL: 'postgresql://test:test@127.0.0.1/vexnexa_ci_scratch' },
  'unexpected schema': { DATABASE_URL: `${safeUrl}?schema=lead_intelligence` },
  'socket override': { DATABASE_URL: `${safeUrl}?host=remote.example` },
  'non-Postgres protocol': { DATABASE_URL: 'https://localhost/vexnexa_ci_scratch' },
  'fragment': { DATABASE_URL: `${safeUrl}#other` },
})) {
  test(`rejects ${name}`, () => assert.throws(() => assertScratchEnvironment({ ...safe, ...overrides })))
}

const oldName = '20260503090000_legacy'
const oldSql = 'CREATE TABLE "Example" ("id" TEXT);\n'
const manifest = { legacyMigrations: { [oldName]: checksum(oldSql) } }
const legacy = { name: oldName, sql: oldSql }

test('accepts unchanged legacy migrations across checkout line endings', () => {
  assert.deepEqual(planMigrations(manifest, [{ ...legacy, sql: oldSql.replace(/\n/g, '\r\n') }]), [])
})
test('replays future migrations in order, not the legacy history', () => {
  const first = { name: '20260906120000_add_example', sql: 'ALTER TABLE "Example" ADD COLUMN "value" TEXT;' }
  const second = { name: '20260907120000_add_index', sql: 'CREATE INDEX ON "Example" ("value");' }
  assert.deepEqual(planMigrations(manifest, [second, legacy, first]), [first, second])
})
test('rejects changed legacy SQL', () => assert.throws(() => planMigrations(manifest, [{ ...legacy, sql: 'SELECT 1;' }]), /modified/))
test('rejects missing legacy migrations', () => assert.throws(() => planMigrations(manifest, []), /missing/))
test('rejects empty legacy manifest', () => assert.throws(() => planMigrations({ legacyMigrations: {} }, []), /empty/))
test('rejects backdated new migrations', () => assert.throws(() => planMigrations(manifest, [legacy, { name: '20260101000000_backdated', sql: 'SELECT 1;' }]), /forward-dated/))
test('rejects invalid migration directory names', () => assert.throws(() => planMigrations(manifest, [legacy, { name: 'bad_name', sql: 'SELECT 1;' }]), /forward-dated/))
test('rejects empty new migration SQL', () => assert.throws(() => planMigrations(manifest, [legacy, { name: '20260906120000_empty', sql: '  ' }]), /empty/))

test('checked-in frozen baseline and legacy checksums are valid', async () => {
  const checkedIn = JSON.parse(await readFile(new URL('./legacy-migrations.json', import.meta.url), 'utf8'))
  const snapshot = await readFile(new URL('./baseline.prisma', import.meta.url), 'utf8')
  assert.equal(checksum(snapshot), checkedIn.baselineSha256)
  const root = new URL('../../prisma/migrations/', import.meta.url)
  const directories = await readdir(root, { withFileTypes: true })
  const migrations = await Promise.all(directories.filter((entry) => entry.isDirectory()).map(async (entry) => ({
    name: entry.name,
    sql: await readFile(new URL(`${entry.name}/migration.sql`, root), 'utf8'),
  })))
  assert.doesNotThrow(() => planMigrations(checkedIn, migrations))
})

test('CLI refuses missing opt-in before it can invoke Prisma or access a DB', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./scratch-database.mjs', import.meta.url))], {
    env: {},
    encoding: 'utf8',
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /requires CI=true and CI_SCRATCH_DATABASE_IS_SAFE=true/)
})
