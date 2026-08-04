import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

// ── Constants ──────────────────────────────────────────────────────────────────

const ALGORITHM  = "aes-256-gcm"
const IV_LEN     = 12  // 96-bit IV — recommended for GCM
const TAG_LEN    = 16  // 128-bit authentication tag
const KEY_LEN    = 32  // 256 bits
const V2_PREFIX  = "v2:"  // distinguishes AES-GCM ciphertexts from legacy XOR

// ── Key loader — fails loudly if not configured ────────────────────────────────

function loadKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      "[crypto] ENCRYPTION_KEY is not set. " +
      "The application cannot start without it. " +
      "Generate a secure key with:  openssl rand -base64 32  " +
      "and add it as a Railway variable before deploying."
    )
  }
  const key = Buffer.from(raw, "base64")
  if (key.length !== KEY_LEN) {
    throw new Error(
      `[crypto] ENCRYPTION_KEY must decode to exactly ${KEY_LEN} bytes. ` +
      `Got ${key.length} bytes. Regenerate with:  openssl rand -base64 32`
    )
  }
  return key
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Encrypts plaintext with AES-256-GCM.
 * Output format: "v2:<base64(iv[12] + authTag[16] + ciphertext[n])>"
 */
export function encrypt(plaintext: string): string {
  const key = loadKey()
  const iv  = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const body   = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag    = cipher.getAuthTag()
  return V2_PREFIX + Buffer.concat([iv, tag, body]).toString("base64")
}

/**
 * Decrypts an AES-256-GCM ciphertext produced by encrypt().
 * Throws if the ciphertext is tampered with (GCM authentication failure).
 */
export function decrypt(stored: string): string {
  if (!stored.startsWith(V2_PREFIX)) {
    throw new Error(
      `[crypto] Unexpected cipher format — missing "${V2_PREFIX}" prefix. ` +
      "Run the re-encryption migration script to upgrade legacy records."
    )
  }
  const key     = loadKey()
  const buf     = Buffer.from(stored.slice(V2_PREFIX.length), "base64")
  if (buf.length < IV_LEN + TAG_LEN) {
    throw new Error("[crypto] Cipher data is too short to be valid.")
  }
  const iv         = buf.subarray(0, IV_LEN)
  const tag        = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN)
  const decipher   = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

/**
 * Returns true if the stored value uses the current AES-256-GCM scheme.
 * Returns false if it is a legacy XOR value that needs migration.
 */
export function isModernCipher(stored: string): boolean {
  return stored.startsWith(V2_PREFIX)
}
