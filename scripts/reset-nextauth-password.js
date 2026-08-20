#!/usr/bin/env node
/**
 * reset-nextauth-password.js
 *
 * Resets a NextAuth user's password directly in PostgreSQL.
 * Use this when you're locked out and can't log in through the UI.
 *
 * Usage (never pass passwords as CLI args — use env vars only):
 *
 *   # From Railway shell:
 *   NEW_PASS="<new-password>" node scripts/reset-nextauth-password.js
 *
 *   # From local machine with Railway CLI:
 *   NEW_PASS="<new-password>" railway run node scripts/reset-nextauth-password.js
 *
 *   # Dry-run (reads DB, validates, writes nothing):
 *   NEW_PASS="<new-password>" railway run node scripts/reset-nextauth-password.js --dry-run
 *
 * Environment variables:
 *   DATABASE_URL  — PostgreSQL connection string (injected automatically by Railway)
 *   NEW_PASS      — New plaintext password (will be bcrypt-hashed; min 8 chars)
 *   TARGET_EMAIL  — Email to reset (default: admin@contaflow.co)
 */

const bcrypt = require('bcryptjs')
const { Client } = require('pg')

const DRY_RUN      = process.argv.includes('--dry-run')
const BCRYPT_COST  = 10
const TARGET_EMAIL = (process.env.TARGET_EMAIL ?? 'admin@contaflow.co').toLowerCase()
const NEW_PASS     = process.env.NEW_PASS

if (!NEW_PASS) {
  console.error('[error] NEW_PASS is not set.')
  console.error('        Set it as an environment variable, never as a CLI argument.')
  process.exit(1)
}
if (NEW_PASS.length < 8) {
  console.error('[error] NEW_PASS must be at least 8 characters.')
  process.exit(1)
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('[error] DATABASE_URL is not set.')
  process.exit(1)
}

console.log('═══════════════════════════════════════════════════════')
console.log('  NextAuth password reset')
console.log(`  Mode:   ${DRY_RUN ? 'DRY RUN (no writes)' : 'REAL UPDATE'}`)
console.log(`  Target: ${TARGET_EMAIL}`)
console.log('═══════════════════════════════════════════════════════\n')

async function main() {
  const client = new Client({ connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined })
  await client.connect()
  console.log('[db] Connected.\n')

  try {
    // Verify user exists
    const { rows } = await client.query(
      'SELECT id, email, name, role FROM "User" WHERE LOWER(email) = $1',
      [TARGET_EMAIL]
    )

    if (rows.length === 0) {
      console.error(`[error] No user found with email "${TARGET_EMAIL}".`)
      const all = await client.query('SELECT email, role FROM "User" ORDER BY "createdAt"')
      console.error('  Users in DB:', all.rows.map(r => `${r.email} (${r.role})`).join(', '))
      process.exit(1)
    }

    const user = rows[0]
    console.log(`[found] ${user.name} <${user.email}> — role: ${user.role}`)

    console.log('\n[hash] Generating bcrypt hash...')
    const newHash = await bcrypt.hash(NEW_PASS, BCRYPT_COST)
    console.log(`[hash] Done — prefix: ${newHash.substring(0, 7)}... (cost=${BCRYPT_COST})`)

    if (DRY_RUN) {
      console.log('\n[dry-run] ✓ Validation passed. Would update password in User table.')
      console.log('[dry-run]   Run without --dry-run to apply.\n')
      return
    }

    await client.query(
      'UPDATE "User" SET password = $1 WHERE id = $2',
      [newHash, user.id]
    )

    console.log('\n[done] ✓ Password updated in PostgreSQL.')
    console.log(`[done]   You can now log in as ${user.email} with your new password.\n`)
    console.log('═══════════════════════════════════════════════════════\n')

  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error('\n[fatal]', err.message)
  process.exit(1)
})
