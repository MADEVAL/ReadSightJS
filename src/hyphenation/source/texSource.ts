import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";

import { PatternFileNotFoundException, PatternParseException } from "../../errors.js";
import { HyphenationExceptionsCollection } from "../hyphenationExceptionsCollection.js";
import { HyphenationOverride } from "../hyphenationOverride.js";
import { Pattern } from "../pattern.js";
import { PatternsCollection } from "../patternsCollection.js";
import type { LoadedPatterns, PatternSource } from "./patternSource.js";

/**
 * Parses TeX hyphenation pattern files (hyph-utf8 `.tex` format).
 *
 * A minimal `\patterns{ ... }` / `\hyphenation{ ... }` state machine, ported
 * verbatim from the Python reference. All indexing is done over Unicode code
 * points so non-Latin pattern files parse identically to PHP/Python.
 */
export class TexSource implements PatternSource {
  private readonly texFilePath: string;

  constructor(texFilePath: string) {
    this.texFilePath = texFilePath;
  }

  load(): LoadedPatterns {
    if (!existsSync(this.texFilePath)) {
      throw PatternFileNotFoundException.forFile(this.texFilePath);
    }

    const content = readFileSync(this.texFilePath, "utf-8");
    const lines = content.split(/\r\n|\r|\n/);
    const patterns = new PatternsCollection();
    const exceptions = new HyphenationExceptionsCollection();
    let lineNumber = 0;

    let command: string | null = null;
    let inBraces = false;

    for (const line of lines) {
      lineNumber += 1;
      const chars = Array.from(line);
      let offset = 0;
      const strlen = chars.length;

      while (offset < strlen) {
        const char = chars[offset]!;

        if (char === "%" && !inBraces) {
          break;
        }

        if (char === "\\" && !inBraces) {
          const rest = chars.slice(offset).join("");
          const m = /^\\([a-zA-Z]+)/.exec(rest);
          if (m) {
            command = m[1]!;
            offset += Array.from(m[0]).length;
            continue;
          }
          offset += 1;
          continue;
        }

        if (char === "{") {
          if (command !== null) {
            inBraces = true;
          }
          offset += 1;
          continue;
        }

        if (char === "}" && inBraces) {
          inBraces = false;
          command = null;
          offset += 1;
          continue;
        }

        if (inBraces) {
          if (command === "patterns") {
            const rest = chars.slice(offset).join("");
            const m = /^(\S+)/u.exec(rest);
            if (m) {
              const token = m[0];
              const pattern = this.parsePatternToken(token, lineNumber);
              if (pattern !== null) {
                patterns.add(pattern);
              }
              offset += Array.from(m[0]).length;
              continue;
            }
          } else if (command === "hyphenation") {
            const rest = chars.slice(offset).join("");
            const m = /^(\S+)/u.exec(rest);
            if (m) {
              const token = m[0];
              const word = token.replace(/-/g, "").toLowerCase();
              const hyphenated = token.toLowerCase();
              exceptions.add(new HyphenationOverride(word, hyphenated));
              offset += Array.from(m[0]).length;
              continue;
            }
          }
        }

        offset += 1;
      }
    }

    return {
      patterns,
      exceptions,
      maxPatternLength: patterns.maxLength(),
    };
  }

  private parsePatternToken(token: string, lineNumber: number): Pattern | null {
    const chars: string[] = [];
    const numbersParts: string[] = [];
    let expectNumber = true;
    let hasDigit = false;

    const segments = token.match(/\d+|\D/gu);
    /* c8 ignore next 3 -- defensive: a non-empty \S+ token always yields segments */
    if (segments === null) {
      throw PatternParseException.withLine(token, lineNumber, this.texFilePath);
    }

    for (const segment of segments) {
      if (/^[0-9]+$/.test(segment)) {
        numbersParts.push(segment);
        hasDigit = true;
        expectNumber = false;
      } else {
        if (expectNumber) {
          numbersParts.push("0");
        }
        chars.push(segment);
        expectNumber = true;
      }
    }

    if (expectNumber) {
      numbersParts.push("0");
    }

    if (chars.length === 0 || !hasDigit) {
      return null;
    }

    const numbersStr = numbersParts.join("");
    const weights = Array.from(numbersStr).map((d) => Number(d));

    return new Pattern(chars, weights);
  }
}
