import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import { existsSync } from "node:fs";

/**
 * Resolve the packaged `data/` directory.
 *
 * At runtime the compiled bundle lives in `dist/`, with `data/` as a sibling
 * (both are published in the package `files` list). During development and
 * tests the source lives in `src/internal/`, with `data/` two levels up.
 */
function findDataDir(): string {
  const meta = import.meta as ImportMeta & { url?: string };
  const url: string | undefined = meta.url;
  /* c8 ignore start -- environment detection: the CJS fallback is not hit under the ESM test runner */
  let baseDir: string;
  if (typeof url === "string") {
    baseDir = dirname(fileURLToPath(url));
  } else {
    baseDir = __dirname;
  }
  /* c8 ignore stop */

  const candidates = [
    resolve(baseDir, "..", "data"), // dist/ or src/ layout: <pkg>/data
    resolve(baseDir, "..", "..", "data"), // src/internal/ layout: <pkg>/data
    resolve(baseDir, "..", "..", "..", "data"),
  ];

  const found = candidates.find(
    (candidate) =>
      existsSync(join(candidate, "languages")) && existsSync(join(candidate, "patterns")),
  );

  // The fallback is only reached if the packaged data is missing.
  /* c8 ignore next */
  return found ?? candidates[0]!;
}

/** Absolute path to the bundled `data/patterns` directory. */
export function defaultPatternsDir(): string {
  return join(findDataDir(), "patterns");
}

/** Absolute path to the bundled `data/languages` directory. */
export function defaultLanguagesDir(): string {
  return join(findDataDir(), "languages");
}

/** OS-appropriate cache directory for compiled patterns. */
export function defaultCacheDir(): string {
  const platform = process.platform;

  if (platform === "win32") {
    const localAppData = process.env["LOCALAPPDATA"];
    if (localAppData) {
      return join(localAppData, "readsight", "Cache");
    }
    return join(tmpdir(), "readsight");
  }

  if (platform === "darwin") {
    return join(homedir(), "Library", "Caches", "readsight");
  }

  const xdgCache = process.env["XDG_CACHE_HOME"];
  if (xdgCache) {
    return join(xdgCache, "readsight");
  }
  return join(homedir(), ".cache", "readsight");
}
