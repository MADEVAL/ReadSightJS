import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { UnsupportedLanguageException } from "../errors.js";
import { Language, type LanguageData } from "./language.js";
import { LanguageCode } from "./languageCode.js";
import type { LanguageRepository } from "./languageRepository.js";

/** Loads and memoizes `Language` definitions from a directory of JSON files. */
export class JsonLanguageRepository implements LanguageRepository {
  private readonly languagesDir: string;
  private readonly cache = new Map<string, Language>();

  constructor(languagesDir: string) {
    this.languagesDir = languagesDir;
  }

  find(languageCode: string): Language {
    const normalized = LanguageCode.normalize(languageCode);

    const cached = this.cache.get(normalized);
    if (cached !== undefined) {
      return cached;
    }

    const filePath = join(this.languagesDir, `${normalized}.json`);
    if (!existsSync(filePath)) {
      throw UnsupportedLanguageException.withCode(languageCode);
    }

    const data = JSON.parse(readFileSync(filePath, "utf-8")) as LanguageData;
    const language = Language.fromData(data);
    this.cache.set(normalized, language);
    return language;
  }

  listCodes(): string[] {
    const entries = readdirSync(this.languagesDir);
    return entries
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.slice(0, -".json".length))
      .sort();
  }

  exists(languageCode: string): boolean {
    const normalized = LanguageCode.normalize(languageCode);
    if (this.cache.has(normalized)) {
      return true;
    }
    return existsSync(join(this.languagesDir, `${normalized}.json`));
  }
}
