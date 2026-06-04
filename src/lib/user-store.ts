import type { AppUser } from "./app-auth";
import { DEFAULT_ADMIN } from "./app-auth";

// Module-level store — shared across all requests in the same server process.
// Resets to DEFAULT_ADMIN on server restart (Railway deploy).
export const userStore: { list: AppUser[] } = {
  list: [{ ...DEFAULT_ADMIN }],
};
