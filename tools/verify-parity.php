<?php

declare(strict_types=1);

/**
 * Cross-language parity verifier.
 *
 * Re-derives every committed golden vector directly from the canonical PHP
 * reference implementation and fails on any drift beyond TOLERANCE. This is
 * the source of truth behind ReadSight's "byte-accurate port" claim: the
 * JSON files under tests/golden are produced by PHP, and this script proves
 * they still match the PHP reference.
 *
 * Usage:
 *   READSIGHT_PHP_DIR=/path/to/ReadSight php tools/verify-parity.php
 *
 * If READSIGHT_PHP_DIR is unset, ./temp/ReadSight is used (local dev layout).
 */

$phpDir = getenv('READSIGHT_PHP_DIR');
if ($phpDir === false || $phpDir === '') {
    $phpDir = __DIR__ . '/../temp/ReadSight';
}
$phpDir = rtrim(str_replace('\\', '/', $phpDir), '/');

if (!is_dir($phpDir . '/src')) {
    fwrite(STDERR, "PHP reference not found at: {$phpDir}\n");
    fwrite(STDERR, "Set READSIGHT_PHP_DIR to the ReadSight (PHP) repo root.\n");
    exit(2);
}

spl_autoload_register(static function (string $class) use ($phpDir): void {
    $prefix = 'GlobusStudio\\ReadSight\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $rel = substr($class, strlen($prefix));
    $file = $phpDir . '/src/' . str_replace('\\', '/', $rel) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

use GlobusStudio\ReadSight\Config;
use GlobusStudio\ReadSight\Engine;

Engine::setDefaultConfig(new Config(
    $phpDir . '/data/patterns',
    $phpDir . '/data/languages',
    sys_get_temp_dir() . '/readsight_parity_cache_' . getmypid(),
));

const TOLERANCE = 1e-9;

$goldenDir = __DIR__ . '/../tests/golden';

/** Same sample texts as tests/golden.test.ts */
$SAMPLE_TEXTS = [
    'latin' => 'The quick brown fox jumps over the lazy dog. This sentence provides a simple readability sample for testing purposes and evaluation.',
    'cyrillic' => 'Быстрая коричневая лиса прыгает через ленивую собаку. Это предложение служит хорошим примером для тестирования читабельности текста.',
];

/** @var list<string> */
$failures = [];
$checks = 0;

function loadJson(string $path): mixed
{
    $raw = file_get_contents($path);
    if ($raw === false) {
        fwrite(STDERR, "Cannot read {$path}\n");
        exit(2);
    }
    return json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
}

function numEq(float|int|null $a, float|int|null $b): bool
{
    if ($a === null || $b === null) {
        return $a === $b;
    }
    if (is_nan((float) $a) && is_nan((float) $b)) {
        return true;
    }
    return abs((float) $a - (float) $b) <= TOLERANCE;
}

// ---- 1. languages.json --------------------------------------------------
$expectedLangs = loadJson($goldenDir . '/languages.json');
$actualLangs = Engine::getSupportedLanguages();
$checks++;
if ($expectedLangs !== $actualLangs) {
    $failures[] = 'languages.json: supported-language list differs from PHP output';
}

// ---- 2. syllable.json ---------------------------------------------------
$syllable = loadJson($goldenDir . '/syllable.json');
foreach ($syllable as $lang => $entry) {
    $rs = new Engine($lang);
    foreach ($entry['syllable_count'] as $word => $exp) {
        $checks++;
        $got = $rs->syllableCount((string) $word);
        if ($got !== $exp) {
            $failures[] = "syllable[{$lang}].count('{$word}'): golden={$exp} php={$got}";
        }
    }
    foreach ($entry['split_word'] as $word => $exp) {
        $checks++;
        $got = $rs->splitWord((string) $word);
        if ($got !== $exp) {
            $failures[] = "syllable[{$lang}].splitWord('{$word}'): golden=" . json_encode($exp) . ' php=' . json_encode($got);
        }
    }
    foreach ($entry['split_syllables'] as $word => $exp) {
        $checks++;
        $got = $rs->splitSyllables((string) $word);
        if ($got !== $exp) {
            $failures[] = "syllable[{$lang}].splitSyllables('{$word}'): golden=" . json_encode($exp) . ' php=' . json_encode($got);
        }
    }
}

// ---- 3. analyze.json ----------------------------------------------------
$analyze = loadJson($goldenDir . '/analyze.json');
foreach ($analyze as $code => $entry) {
    $rs = new Engine($code);

    $checks++;
    if ($rs->getSupportedFormulas() !== $entry['supported_formulas']) {
        $failures[] = "{$code}: supported_formulas differ";
    }

    foreach (['latin', 'cyrillic'] as $textKey) {
        $text = $SAMPLE_TEXTS[$textKey];
        $block = $entry[$textKey];
        $ctx = "{$code}/{$textKey}";

        $stats = $rs->analyze($text);
        $es = $block['stats'];

        $checks++;
        if (
            $stats->letterCount !== $es['letter_count']
            || $stats->wordCount !== $es['word_count']
            || $stats->sentenceCount !== $es['sentence_count']
            || $stats->syllableCount !== $es['syllable_count']
            || $stats->polysyllableCount !== $es['polysyllable_count']
            || $stats->longWordCount !== $es['long_word_count']
            || !numEq($stats->averageSyllablesPerWord, $es['average_syllables_per_word'])
            || !numEq($stats->averageWordsPerSentence, $es['average_words_per_sentence'])
        ) {
            $failures[] = "{$ctx}: text statistics differ";
        }

        $checks++;
        $expHist = [];
        foreach ($es['syllable_histogram'] as $k => $v) {
            $expHist[(int) $k] = $v;
        }
        if ($stats->syllableHistogram !== $expHist) {
            $failures[] = "{$ctx}: syllable histogram differs";
        }

        foreach ($block['formulas'] as $fname => $exp) {
            $checks++;
            $got = $rs->score($fname, $text);
            assertResult($got, $exp, "{$ctx}:{$fname}", $failures);
        }

        if (isset($block['wiener']) && $block['wiener'] !== []) {
            foreach ($block['wiener'] as $vk => $exp) {
                $checks++;
                $variant = (int) ltrim($vk, 'v');
                $got = $rs->wienerSachtextformel($text, $variant);
                assertResult($got, $exp, "{$ctx}:wiener{$vk}", $failures);
            }
        }
    }
}

/**
 * @param array<string, mixed> $exp
 * @param list<string> $failures
 */
function assertResult(object $got, array $exp, string $ctx, array &$failures): void
{
    if ($got->formulaName !== $exp['formula_name']) {
        $failures[] = "{$ctx}: formula_name golden={$exp['formula_name']} php={$got->formulaName}";
    }
    if ($got->languageCode !== $exp['language_code']) {
        $failures[] = "{$ctx}: language_code golden={$exp['language_code']} php={$got->languageCode}";
    }
    if (!numEq($got->score, $exp['score'])) {
        $failures[] = "{$ctx}: score golden={$exp['score']} php={$got->score}";
    }
    if (!numEq($got->gradeLevel, $exp['grade_level'])) {
        $failures[] = "{$ctx}: grade_level golden=" . json_encode($exp['grade_level']) . " php=" . json_encode($got->gradeLevel);
    }
    if ($got->interpretation !== $exp['interpretation']) {
        $failures[] = "{$ctx}: interpretation golden='{$exp['interpretation']}' php='{$got->interpretation}'";
    }

    $gotKeys = array_keys($got->inputs);
    $expKeys = array_keys($exp['inputs']);
    sort($gotKeys);
    sort($expKeys);
    if ($gotKeys !== $expKeys) {
        $failures[] = "{$ctx}: input keys differ";
        return;
    }
    foreach ($exp['inputs'] as $key => $val) {
        if (!numEq($got->inputs[$key], $val)) {
            $failures[] = "{$ctx}: input[{$key}] golden={$val} php={$got->inputs[$key]}";
        }
    }
}

// ---- report -------------------------------------------------------------
printf("Parity checks run: %d\n", $checks);
if ($failures === []) {
    printf("PASS — all golden vectors match the PHP reference (tolerance %g).\n", TOLERANCE);
    exit(0);
}

printf("FAIL — %d mismatch(es):\n", count($failures));
foreach (array_slice($failures, 0, 100) as $f) {
    printf("  - %s\n", $f);
}
if (count($failures) > 100) {
    printf("  ... and %d more\n", count($failures) - 100);
}
exit(1);
