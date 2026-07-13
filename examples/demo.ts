/**
 * ReadSight — interactive demo.
 *
 * Usage:
 *   npx tsx examples/demo.ts
 *   npx tsx examples/demo.ts --lang=de-1996
 */

import { ReadSight } from "../src/index.js";

const PLAIN =
  "We made an app that reads your text. It tells you how easy it is to read. You get a score in one second.";
const LEGAL =
  "The parties acknowledge that any unauthorized disclosure of confidential information may cause irreparable harm. In such an event, the affected party shall be entitled to seek injunctive relief.";

const SAMPLE_WORDS = [
  "banana",
  "character",
  "communication",
  "incredible",
  "information",
  "automatic",
  "extraordinary",
  "university",
  "readability",
];

function parseArgs(): { lang: string } {
  let lang = "en-us";
  for (const arg of process.argv.slice(2)) {
    const match = /^--lang=(.+)$/.exec(arg);
    if (match) {
      lang = match[1]!;
    }
  }
  return { lang };
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function main(): void {
  const { lang } = parseArgs();
  const rs = new ReadSight(lang);
  const language = rs.getLanguage();

  console.log("=".repeat(64));
  console.log(`  ReadSight Demo — ${language.name} (${language.nativeName})`);
  console.log("=".repeat(64));
  console.log(`  Script:   ${language.script}`);
  console.log(`  Formulas: ${rs.getSupportedFormulas().length} available`);

  console.log("\n" + "-".repeat(64));
  console.log("  Syllable Analysis");
  console.log("-".repeat(64));
  console.log(`\n  ${pad("Word", 15)}  ${pad("Syllables", 9)}  Split`);
  console.log(`  ${"-".repeat(15)}  ${"-".repeat(9)}  ${"-".repeat(30)}`);
  for (const word of SAMPLE_WORDS) {
    const count = rs.syllableCount(word);
    const parts = rs.splitSyllables(word).join(" - ");
    console.log(`  ${pad(word, 15)}  ${pad(String(count), 9)}  ${parts}`);
  }

  console.log("\n" + "-".repeat(64));
  console.log("  Readability Grid (plain vs. legalese)");
  console.log("-".repeat(64));
  console.log(`\n  ${pad("FORMULA", 28)} | ${pad("Plain text", 24)} | Legalese`);
  console.log("  " + "-".repeat(80));
  for (const formula of rs.getSupportedFormulas()) {
    const plain = rs.score(formula, PLAIN);
    const legal = rs.score(formula, LEGAL);
    const left = `${plain.score}  ${plain.interpretation}`;
    const right = `${legal.score}  ${legal.interpretation}`;
    console.log(`  ${pad(formula, 28)} | ${pad(left, 24)} | ${right}`);
  }

  console.log("\n" + "-".repeat(64));
  console.log("  Text Statistics (legalese)");
  console.log("-".repeat(64));
  const stats = rs.analyze(LEGAL);
  const rows: Array<[string, string]> = [
    ["Letters", String(stats.letterCount)],
    ["Words", String(stats.wordCount)],
    ["Sentences", String(stats.sentenceCount)],
    ["Syllables (total)", String(stats.syllableCount)],
    ["Avg syllables/word", stats.averageSyllablesPerWord.toFixed(2)],
    ["Avg words/sentence", stats.averageWordsPerSentence.toFixed(2)],
    ["Polysyllables (>2)", String(stats.polysyllableCount)],
  ];
  for (const [label, value] of rows) {
    console.log(`  ${pad(label + ":", 22)} ${value}`);
  }

  const maxCount = Math.max(...stats.syllableHistogram.values());
  console.log("\n  Syllable distribution:");
  for (const [n, count] of stats.syllableHistogram) {
    const barLen = Math.round((count / maxCount) * 20);
    console.log(`  ${n}-syl: ${"#".repeat(barLen)} ${count}`);
  }
}

main();
