#!/usr/bin/env node
/**
 * Railway startup script — handles schema drift and failed migration records.
 *
 * Strategy:
 *  1. Try prisma migrate deploy.
 *  2. If P3009 (failed migration in DB), extract the failed migration name from
 *     the error output and mark it rolled-back, then retry migrate deploy.
 *  3. If any other migrate error, fall back to prisma db push --accept-data-loss.
 *  4. Seed default users (idempotent).
 *  5. Start Next.js.
 */
const { execSync, spawn } = require('child_process')

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

function runCapture(cmd) {
  try {
    const output = execSync(cmd, { env: process.env }).toString()
    return { ok: true, output }
  } catch (err) {
    const output = (err.stderr || err.stdout || err.message || '').toString()
    return { ok: false, output }
  }
}

function extractFailedMigration(errorOutput) {
  // Prisma P3009 error includes the migration name in the output like:
  // "Migration `20260607235753_init_nomina` failed"
  const match = errorOutput.match(/Migration `([^`]+)` failed/i)
    || errorOutput.match(/migration "([^"]+)" failed/i)
    || errorOutput.match(/(\d{14}_\w+)/i)
  return match ? match[1] : null
}

// ── Accesos XOR → AES-256-GCM inline migration (idempotent) ──────────────────
async function migrateAccesosEncryption() {
  const { createCipheriv, randomBytes } = require('crypto')
  const { Client } = require('pg')

  const encKey = process.env.ENCRYPTION_KEY
  if (!encKey) {
    console.log('[startup] ENCRYPTION_KEY not set — skipping accesos re-encryption.')
    return
  }

  // Resolve AES key: prefer base64-decoded (openssl rand -base64 32),
  // fall back to raw UTF-8 bytes (32-char plaintext key).
  const keyB64  = Buffer.from(encKey, 'base64')
  const keyUtf8 = Buffer.from(encKey, 'utf8')
  const aesKey  = keyB64.length === 32 ? keyB64
                : keyUtf8.length === 32 ? keyUtf8
                : null
  if (!aesKey) {
    console.warn('[startup] ENCRYPTION_KEY is not usable as AES-256 key — skipping re-encryption.')
    return
  }

  const xorBytes = keyUtf8  // original XOR cipher used raw UTF-8 bytes of ENCRYPTION_KEY
  const V2       = 'v2:'

  function xorDecrypt(b64) {
    const enc = Buffer.from(b64, 'base64')
    const out = Buffer.alloc(enc.length)
    for (let i = 0; i < enc.length; i++) out[i] = enc[i] ^ xorBytes[i % xorBytes.length]
    return out.toString('utf8')
  }

  function aesEncrypt(plaintext) {
    const iv     = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', aesKey, iv)
    const body   = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag    = cipher.getAuthTag()
    return V2 + Buffer.concat([iv, tag, body]).toString('base64')
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    const { rows } = await client.query(
      `SELECT id, contrasena FROM "Acceso" WHERE contrasena IS NOT NULL AND contrasena NOT LIKE $1`,
      [V2 + '%']
    )
    if (rows.length === 0) {
      console.log('[startup] Accesos re-encryption: no legacy XOR records. ✓')
      return
    }
    console.log(`[startup] Accesos re-encryption: migrating ${rows.length} XOR records → AES-256-GCM ...`)
    await client.query('BEGIN')
    let ok = 0, skip = 0
    for (const row of rows) {
      try {
        const plain  = xorDecrypt(row.contrasena)
        const cipher = aesEncrypt(plain)
        await client.query('UPDATE "Acceso" SET contrasena = $1 WHERE id = $2', [cipher, row.id])
        ok++
      } catch (err) {
        console.warn(`[startup]   Skipping Acceso ${row.id}: ${err.message}`)
        skip++
      }
    }
    await client.query('COMMIT')
    console.log(`[startup] Accesos re-encryption: ${ok} migrated, ${skip} skipped. ✓`)
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[startup] Accesos re-encryption failed:', err.message)
  } finally {
    await client.end().catch(() => {})
  }
}

async function main() {
  // ── Step 1: apply migrations ──────────────────────────────
  const migrateResult = runCapture('npx prisma migrate deploy')
  console.log('[startup] migrate deploy:', migrateResult.ok ? 'success' : 'failed')

  if (!migrateResult.ok) {
    const isFailedMigration = migrateResult.output.includes('P3009') ||
                              migrateResult.output.includes('failed migrations') ||
                              migrateResult.output.includes('Failed migrations')

    if (isFailedMigration) {
      const failedName = extractFailedMigration(migrateResult.output)
      if (failedName) {
        console.log(`[startup] Resolving failed migration: ${failedName}`)
        run(`npx prisma migrate resolve --rolled-back "${failedName}"`, { allowFail: true })
        // Retry migrate deploy after resolving
        const retryResult = run('npx prisma migrate deploy', { allowFail: true })
        if (retryResult.ok) {
          // Migration deployed successfully after resolving failed one
          console.log('[startup] Migration succeeded after resolving failed record')
          run('node prisma/runtime-seed.js', { allowFail: true })
          startNextjs()
          return
        }
      } else {
        console.warn('[startup] Could not extract failed migration name from error output')
        console.warn('[startup] Error output:', migrateResult.output.slice(0, 500))
      }
    }

    // Fall back to db push — syncs schema without relying on migration history
    console.log('[startup] Falling back to prisma db push...')
    const pushResult = run('npx prisma db push --accept-data-loss', { allowFail: true })

    if (!pushResult.ok) {
      console.error('[startup] db push failed — schema may be out of sync.')
      console.error('[startup] Check Railway logs and consider running migrations manually.')
      // Do NOT force reset — it destroys production data
    }
  }

  // ── Step 2: seed default users ────────────────────────────
  run('node prisma/runtime-seed.js', { allowFail: true })

  // ── Step 3: migrate legacy XOR passwords → AES-256-GCM (idempotent) ──────
  await migrateAccesosEncryption()

  // ── Step 4: start Next.js ─────────────────────────────────
  startNextjs()
}

function startNextjs() {
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
