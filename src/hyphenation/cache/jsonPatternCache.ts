import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { HyphenationExceptionsCollection } from "../hyphenationExceptionsCollection.js";
import { HyphenationOverride } from "../hyphenationOverride.js";
import { Pattern } from "../pattern.js";
import { PatternsCollection } from "../patternsCollection.js";
import type { CachedPatterns, PatternCache } from "./patternCache.js";

const CACHE_VERSION = "2.0";

interface SerializedPattern {
  chars: string[];
  weights: number[];
}

interface CachePayload {
  version: string;
  patterns: SerializedPattern[];
  exceptions: Record<string, string>;
  maxPatternLength: number;
}

/** JSON-file backed cache for compiled hyphenation patterns. */
export class JsonPatternCache implements PatternCache {
  private readonly cacheDir: string;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
  }

  has(languageCode: string): boolean {
    return existsSync(this.getFilePath(languageCode));
  }

  get(languageCode: string): CachedPatterns | null {
    const filePath = this.getFilePath(languageCode);
    if (!existsSync(filePath)) {
      return null;
    }

    let data: CachePayload;
    try {
      data = JSON.parse(readFileSync(filePath, "utf-8")) as CachePayload;
    } catch {
      return null;
    }

    if (data.version !== CACHE_VERSION) {
      return null;
    }

    const patterns = new PatternsCollection();
    for (const p of data.patterns) {
      patterns.add(new Pattern(p.chars, p.weights));
    }

    const exceptions = new HyphenationExceptionsCollection();
    for (const [word, hyphenated] of Object.entries(data.exceptions ?? {})) {
      exceptions.add(new HyphenationOverride(String(word), String(hyphenated)));
    }

    return {
      patterns,
      exceptions,
      maxPatternLength: data.maxPatternLength,
    };
  }

  set(languageCode: string, data: CachedPatterns): void {
    const payload: CachePayload = {
      version: CACHE_VERSION,
      patterns: JsonPatternCache.serializePatterns(data.patterns),
      exceptions: data.exceptions.all(),
      maxPatternLength: data.maxPatternLength,
    };

    const cachePath = this.getFilePath(languageCode);
    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, JSON.stringify(payload), "utf-8");
  }

  clear(languageCode: string): void {
    const filePath = this.getFilePath(languageCode);
    if (existsSync(filePath)) {
      rmSync(filePath);
    }
  }

  clearAll(): void {
    if (!existsSync(this.cacheDir)) {
      return;
    }
    for (const entry of readdirSync(this.cacheDir)) {
      if (entry.endsWith(".json")) {
        rmSync(join(this.cacheDir, entry));
      }
    }
  }

  private getFilePath(languageCode: string): string {
    return join(this.cacheDir, `syllable.${languageCode}.json`);
  }

  private static serializePatterns(collection: PatternsCollection): SerializedPattern[] {
    const result: SerializedPattern[] = [];
    for (const [key, weights] of Object.entries(collection.all())) {
      const chars = Array.from(key);
      const weightValues = Array.from(weights).map((d) => Number(d));
      result.push({ chars, weights: weightValues });
    }
    return result;
  }
}
