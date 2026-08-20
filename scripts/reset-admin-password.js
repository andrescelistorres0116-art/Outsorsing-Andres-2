#!/usr/bin/env node
/**
 * reset-admin-password.js
 *
 * Updates the admin user's password in /data/users.json (or DATA_DIR/users.json)
 * to a bcrypt hash of the value supplied via NEW_ADMIN_PASSWORD env var.
 *
 * Usage (never pass the password as a CLI argument):
 *   NEW_ADMIN_PASSWORD="<your-new-password>" DATA_DIR="/data" node scripts/reset-admin-password.js
 *
 * Dry-run (reads and validates without writing):
 *   NEW_ADMIN_PASSWORD="<your-new-password>" DATA_DIR="/data" node scripts/reset-admin-password.js --dry-run
 *
 * Environment variables:
 *   NEW_ADMIN_PASSWORD  — required. The new plaintext password to hash and store.
 *   DATA_DIR            — optional. Defaults to ".data" (local dev). Set to "/data" on Railway.
 *   ADMIN_EMAIL         — optional. Defaults to "admin@contaflow.co".
 */

const fs    = require("fs")
const path  = require("path")
const bcrypt = require("bcryptjs")

const DRY_RUN     = process.argv.includes("--dry-run")
const BCRYPT_COST = 10  // matches src/app/api/app-users/route.ts

const newPassword = process.env.NEW_ADMIN_PASSWORD
if (!newPassword) {
  console.error("[error] NEW_ADMIN_PASSWORD is not set.")
  console.error("        Set it as an environment variable — never pass passwords as CLI args.")
  process.exit(1)
}

if (newPassword.length < 10) {
  console.error("[error] NEW_ADMIN_PASSWORD must be at least 10 characters.")
  process.exit(1)
}

const DATA_DIR    = process.env.DATA_DIR ?? path.join(process.cwd(), ".data")
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@contaflow.co").toLowerCase()
const USERS_FILE  = path.join(DATA_DIR, "users.json")

console.log("═══════════════════════════════════════════════════════")
console.log("  Admin password reset")
console.log(`  Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "REAL UPDATE"}`)
console.log(`  Target email: ${ADMIN_EMAIL}`)
console.log(`  Users file: ${USERS_FILE}`)
console.log("═══════════════════════════════════════════════════════\n")

// ── Read current file ──────────────────────────────────────────────────────────

let users
if (fs.existsSync(USERS_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"))
    if (!Array.isArray(users)) throw new Error("users.json is not an array")
    console.log(`[read] Loaded ${users.length} user(s) from ${USERS_FILE}`)
  } catch (err) {
    console.error(`[error] Could not read/parse ${USERS_FILE}: ${err.message}`)
    process.exit(1)
  }
} else {
  console.warn(`[warn] ${USERS_FILE} not found. This script only updates existing files.`)
  console.warn("       If this is first boot, the default admin password comes from the")
  console.warn("       ADMIN_INITIAL_PASSWORD env var set in Railway — no file to update yet.")
  process.exit(0)
}

// ── Find admin user ────────────────────────────────────────────────────────────

const adminIdx = users.findIndex(
  u => (u.email ?? "").trim().toLowerCase() === ADMIN_EMAIL
)

if (adminIdx === -1) {
  console.error(`[error] No user found with email "${ADMIN_EMAIL}".`)
  console.error("        Available emails:", users.map(u => u.email).join(", "))
  process.exit(1)
}

const admin = users[adminIdx]
const currentIsLegacy = !admin.password.startsWith("$2")
console.log(`[scan] User found: ${admin.nombre ?? admin.name ?? "(no name)"}`)
console.log(`[scan] Current password: ${currentIsLegacy ? "PLAINTEXT (legacy)" : "bcrypt hash"}`)

// ── Hash new password ──────────────────────────────────────────────────────────

console.log("\n[hash] Generating bcrypt hash (this takes ~1 second)...")
const newHash = bcrypt.hashSync(newPassword, BCRYPT_COST)

// Verification: only print the first 7 chars of the hash (always "$2b$10$")
// so we can confirm the format without leaking any useful portion.
console.log(`[hash] New hash prefix: ${newHash.substring(0, 7)}... (bcrypt, cost=${BCRYPT_COST})`)

// ── Dry-run exit ───────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log("\n[dry-run] ✓ Validation passed. Would update admin password.")
  console.log("[dry-run]   Run without --dry-run to apply the change.\n")
  process.exit(0)
}

// ── Backup original file ───────────────────────────────────────────────────────

const ts = new Date().toISOString().replace(/[:.]/g, "-")
const backupPath = `${USERS_FILE}.backup-${ts}`
fs.copyFileSync(USERS_FILE, backupPath)
console.log(`\n[backup] ✓ Saved backup to ${backupPath}`)

// ── Write updated file ─────────────────────────────────────────────────────────

users[adminIdx] = { ...admin, password: newHash }
fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8")
console.log(`[write] ✓ Updated ${USERS_FILE}`)

console.log("\n═══════════════════════════════════════════════════════")
console.log("  Done. Admin password updated to bcrypt hash.")
console.log("  The next login will use bcrypt.compare() — no further")
console.log("  migration needed for this account.")
console.log("═══════════════════════════════════════════════════════\n")
