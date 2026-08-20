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
  // Prefer base64-encoded keys (openssl rand -base64 32 → 44 chars → 32 bytes).
  // Fall back to raw UTF-8 bytes for keys that are exactly KEY_LEN characters
  // (e.g. a 32-char plain-text key set before the base64 convention was adopted).
  const keyB64 = Buffer.from(raw, "base64")
  if (keyB64.length === KEY_LEN) return keyB64

  const keyUtf8 = Buffer.from(raw, "utf8")
  if (keyUtf8.length === KEY_LEN) return keyUtf8

  throw new Error(
    `[crypto] ENCRYPTION_KEY is not usable as an AES-256 key. ` +
    `It must either be a base64 string that decodes to ${KEY_LEN} bytes, ` +
    `or a plain string of exactly ${KEY_LEN} UTF-8 characters. ` +
    `Got base64-decoded length ${keyB64.length} and UTF-8 length ${keyUtf8.length}. ` +
    `Generate a proper key with:  openssl rand -base64 32`
  )
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
 * Decrypts a ciphertext produced by encrypt().
 *
 * Supports two formats:
 *   - Modern (v2:): AES-256-GCM — used for all new records.
 *   - Legacy (no prefix): XOR with OLD_ENCRYPTION_KEY env var
 *     (fallback "default-key"). Accepted until the migration script
 *     has re-encrypted all records; remove this branch afterwards.
 */
export function decrypt(stored: string): string {
  if (stored.startsWith(V2_PREFIX)) {
    // ── AES-256-GCM path ────────────────────────────────────────
    const key = loadKey()
    const buf = Buffer.from(stored.slice(V2_PREFIX.length), "base64")
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

  // ── Legacy XOR path (migration bridge — remove after migration) ─
  // The original XOR used ENCRYPTION_KEY (same variable), not a separate old key.
  const xorKey = process.env.ENCRYPTION_KEY || "default-key"
  const keyBytes  = Buffer.from(xorKey)
  const encBytes  = Buffer.from(stored, "base64")
  const result    = Buffer.alloc(encBytes.length)
  for (let i = 0; i < encBytes.length; i++) {
    result[i] = encBytes[i] ^ keyBytes[i % keyBytes.length]
  }
  return result.toString("utf8")
}

/**
 * Returns true if the stored value uses the current AES-256-GCM scheme.
 * Returns false if it is a legacy XOR value that needs migration.
 */
export function isModernCipher(stored: string): boolean {
  return stored.startsWith(V2_PREFIX)
}
