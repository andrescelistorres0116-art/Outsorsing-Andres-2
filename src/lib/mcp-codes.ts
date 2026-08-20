// In-memory store for OAuth authorization codes.
// Railway runs a persistent Node.js process so this Map survives between requests.
// Codes expire after 60 s and are single-use.

interface CodeEntry {
  codeChallenge: string
  codeChallengeMethod: string
  clientId: string
  redirectUri: string
  expiresAt: number
  used: boolean
}

const store = new Map<string, CodeEntry>()

function prune() {
  const now = Date.now()
  for (const [k, v] of store) {
    if (v.expiresAt < now) store.delete(k)
  }
}

export function storeCode(
  code: string,
  entry: Omit<CodeEntry, "used">
): void {
  prune()
  store.set(code, { ...entry, used: false })
}

/** Returns the entry and marks it used, or null if expired / already used. */
export function consumeCode(code: string): Omit<CodeEntry, "used"> | null {
  const entry = store.get(code)
  if (!entry) return null
  if (entry.used || entry.expiresAt < Date.now()) {
    store.delete(code)
    return null
  }
  entry.used = true
  return entry
}
