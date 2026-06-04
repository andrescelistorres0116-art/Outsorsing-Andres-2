import type { AppUser } from "./app-auth";
import { DEFAULT_ADMIN } from "./app-auth";
import { readStore } from "./persist";

export const userStore: { list: AppUser[] } = {
  list: readStore("users", [{ ...DEFAULT_ADMIN }]),
};
