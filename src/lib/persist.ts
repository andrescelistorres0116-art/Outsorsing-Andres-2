import fs from "fs";
import path from "path";

// On Railway: set DATA_DIR to the mounted volume path (e.g. /data).
// Locally: falls back to .data/ in the project root (gitignored).
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), ".data");

export function readStore<T>(name: string, fallback: T): T {
  try {
    const file = path.join(DATA_DIR, `${name}.json`);
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(name: string, data: T): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(DATA_DIR, `${name}.json`),
      JSON.stringify(data, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error(`[persist] Failed to write ${name}:`, err);
  }
}
