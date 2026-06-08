#!/usr/bin/env node
/**
 * Railway startup script — handles schema drift and failed migration records.
 *
 * Strategy:
 *  1. Try prisma migrate deploy.
 *  2. If P3009 (failed migration in DB), mark it as rolled-back and fall back to db push.
 *  3. If any other migrate error, fall back directly to db push.
 *  4. Seed default users (idempotent).
 *  5. Start Next.js.
 */
const { execSync, spawn } = require('child_process')

const MIGRATION_NAME = '20260607235753_init_nomina'

function run(cmd, { allowFail = false } = {}) {
  console.log(`[startup] $ ${cmd}`)
  try {
    execSync(cmd, { stdio: 'inherit', env: process.env })
    return { ok: true, output: '' }
  } catch (err) {
    const msg = (err.stderr || err.stdout || err.message || '').toString()
    if (allowFail) {
      console.warn(`[startup] Command failed (continuing). Error: ${msg.split('\n')[0]}`)
      return { ok: false, output: msg }
    }
    throw err
  }
}

async function main() {
  // ── Step 1: apply migrations ──────────────────────────────
  const migrateResult = run('npx prisma migrate deploy', { allowFail: true })

  if (!migrateResult.ok) {
    const isFailedMigration = migrateResult.output.includes('P3009') ||
                              migrateResult.output.includes('failed migrations')

    if (isFailedMigration) {
      // Prisma recorded a failed migration — mark it as rolled-back so we can proceed
      console.log(`[startup] Resolving failed migration: ${MIGRATION_NAME}`)
      run(`npx prisma migrate resolve --rolled-back ${MIGRATION_NAME}`, { allowFail: true })
    }

    // Fall back to db push — syncs schema without relying on migration history
    console.log('[startup] Falling back to prisma db push...')
    const pushResult = run('npx prisma db push --accept-data-loss', { allowFail: true })

    if (!pushResult.ok) {
      // Last resort: force reset + push (dev/staging only — destroys data)
      console.warn('[startup] db push failed — attempting force reset...')
      run('npx prisma db push --force-reset', { allowFail: true })
    }
  }

  // ── Step 2: seed default users ────────────────────────────
  run('node prisma/runtime-seed.js', { allowFail: true })

  // ── Step 3: start Next.js ─────────────────────────────────
  console.log('[startup] Starting Next.js...')
  const port = process.env.PORT || '3000'
  const next = spawn('npx', ['next', 'start', '-p', port, '-H', '0.0.0.0'], {
    stdio: 'inherit',
    env: process.env,
  })
  next.on('exit', (code) => process.exit(code ?? 0))
}

main().catch((err) => {
  console.error('[startup] Fatal error:', err.message)
  process.exit(1)
})
