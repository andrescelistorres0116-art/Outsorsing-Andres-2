#!/usr/bin/env node
/**
 * Railway startup script.
 * 1. Applies pending migrations; if schema drift is detected, pushes schema directly.
 * 2. Ensures default users exist (idempotent runtime-seed).
 * 3. Starts Next.js via `next start`.
 */
const { execSync, spawn } = require('child_process')

function run(cmd, { allowFail = false } = {}) {
  console.log(`[startup] $ ${cmd}`)
  try {
    execSync(cmd, { stdio: 'inherit', env: process.env })
    return true
  } catch {
    if (allowFail) {
      console.warn(`[startup] Command failed (continuing): ${cmd}`)
      return false
    }
    throw new Error(`Command failed: ${cmd}`)
  }
}

async function main() {
  // 1. Apply migrations. If they fail (e.g., schema drift from a previous deploy),
  //    fall back to prisma db push which syncs schema without migration history.
  const migrated = run('npx prisma migrate deploy', { allowFail: true })
  if (!migrated) {
    console.log('[startup] migrate deploy failed — falling back to db push (schema sync)...')
    run('npx prisma db push --accept-data-loss --skip-generate')
  }

  // 2. Seed default users (upserts are idempotent — safe on every restart)
  run('node prisma/runtime-seed.js', { allowFail: true })

  // 3. Hand off to Next.js
  console.log('[startup] Starting Next.js...')
  const port = process.env.PORT || '3000'
  const next = spawn(
    'npx',
    ['next', 'start', '-p', port, '-H', '0.0.0.0'],
    { stdio: 'inherit', env: process.env }
  )
  next.on('exit', (code) => process.exit(code ?? 0))
}

main().catch((err) => {
  console.error('[startup] Fatal error:', err.message)
  process.exit(1)
})
