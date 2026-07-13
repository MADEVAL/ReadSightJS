import { defaultCacheDir, defaultLanguagesDir, defaultPatternsDir } from "./internal/dataPaths.js";

/** Filesystem configuration for pattern, language, and cache directories. */
export class Config {
  readonly patternsDir: string;
  readonly languagesDir: string;
  readonly cacheDir: string;

  constructor(patternsDir: string, languagesDir: string, cacheDir: string) {
    this.patternsDir = patternsDir;
    this.languagesDir = languagesDir;
    this.cacheDir = cacheDir;
  }

  static default(): Config {
    return new Config(defaultPatternsDir(), defaultLanguagesDir(), defaultCacheDir());
  }
}
