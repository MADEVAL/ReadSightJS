/**
 * ReadSight — multilingual comparison.
 *
 * Usage:
 *   npx tsx examples/multilingual.ts
 */

import { ReadSight } from "../src/index.js";

const SAMPLES: Array<[string, string, string]> = [
  ["en-us", "English (US)", "The quick brown fox jumps over the lazy dog."],
  ["de-1996", "German", "Der schnelle braune Fuchs springt über den faulen Hund."],
  ["es", "Spanish", "El rápido zorro marrón salta sobre el perro perezoso."],
  ["fr", "French", "Le rapide renard brun saute par-dessus le chien paresseux."],
  ["it", "Italian", "La veloce volpe marrone salta sul cane pigro."],
  ["ru", "Russian", "Быстрая коричневая лиса прыгает через ленивую собаку."],
];

function main(): void {
  console.log("=".repeat(64));
  console.log("  ReadSight — Multilingual Comparison");
  console.log("=".repeat(64));

  for (const [code, name, text] of SAMPLES) {
    try {
      const rs = new ReadSight(code);
      const stats = rs.analyze(text);
      const fre = rs.fleschReadingEase(text);
      console.log(`\n  ${name} (${code})`);
      console.log(`    Words: ${stats.wordCount}, Sentences: ${stats.sentenceCount}`);
      console.log(`    FRE: ${fre.score} — ${fre.interpretation}`);
    } catch (error) {
      console.log(`  ${name} (${code}): ERROR — ${(error as Error).message}`);
    }
  }
}

main();
