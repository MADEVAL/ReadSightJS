# ReadSight → Node.js порт (`ReadSightJS`) — план точнейшего порта

Цель: **байт-точный** третий порт библиотеки ReadSight под Node.js/TypeScript, публикуемый в npm.
Эталон приоритета: **PHP (канон)** → **Python** → этот порт. Rust-порт доказал, что байт-точность достижима через golden-векторы, сгенерированные из PHP; повторяем ту же стратегию.

- PHP (канон): https://github.com/MADEVAL/ReadSight
- Python: https://github.com/MADEVAL/ReadSightPy
- Rust: https://github.com/MADEVAL/ReadSightRS
- Исходники клонированы в `temp/` (под .gitignore).

Итог: 86 языков, 17 формул, TeX-гифенация Лианга, **0 runtime-зависимостей**, вся дата (86 JSON + 86 `.tex`) упакована в npm-пакет.

---

## 0. Ключевые факты из анализа исходников

| Параметр | Значение |
|---|---|
| Языковых JSON | 86 (~68 KB суммарно) |
| Паттерн-файлов `.tex` | 86 (~3.25 MB; крупнейший `hyph-hu.tex` ≈ 517 KB) |
| Формул | 17 (5 универсальных `["*"]`, 12 языко-зависимых) |
| Режимы слогов | `tex` (80 языков), `composite` (`en-us`,`en-gb`), `heuristic` (`ru`,`uk`,`be`,`bg`) |
| Точка входа | класс `Engine` (PHP) / `ReadSight` (Py). В JS: экспорт `ReadSight` + alias `Engine`. |
| Кэш | JSON-кэш скомпилированных паттернов (version `"2.0"`), имя файла `syllable.<lang>.json` |

### Архитектура (переносится 1:1)
```
ReadSight (facade)
├── TextAnalyzer (метрики + слоги)
│   ├── SyllableCounter (tex | heuristic | composite)
│   │   ├── CompositeSyllableCounter
│   │   ├── HeuristicSyllableCounter (vowelMode cluster|individual)
│   │   └── TexSyllableCounter → LiangHyphenator
│   ├── LiangHyphenator ← TexSource (парсер .tex) + PatternsCollection + ExceptionsCollection + JsonPatternCache
│   └── TextSplitter (слова/предложения/буквы через regex языка)
├── Language (JSON-конфиг: hyphenMins, паттерны, formulas, syllableHeuristics)
└── FormulaRegistry (17 формул) + FormulaRegistryFactory
```

---

## 1. Целевой стек

- **Язык:** TypeScript (strict), компиляция в **dual ESM + CJS**.
- **Node:** `>=18` (нужны стабильные `Intl`/unicode-regex; целимся LTS 18/20/22).
- **Зависимости runtime:** **ноль**. Всё регулярками нативного JS (`u`-флаг, `\p{L}` работает из коробки).
- **Dev-инструменты (по образцу Py/Rust):**
  - Тест-раннер: **Vitest** (быстрый, ESM-native, встроенное покрытие).
  - Линт/формат: **ESLint (typescript-eslint) + Prettier**.
  - Билд: **tsup** (esbuild) → `dist/` с `.js`, `.cjs`, `.d.ts`.
  - Типизация: `tsc --noEmit` для строгой проверки.

---

## 2. Механизм публикации в npm (изучено)

1. **Имя пакета:** оба варианта свободны (проверено `npm view`): `readsight` и `@madeval/readsight`.
   Рекомендация: **`readsight`** (короткое, как в crates.io/PyPI). Резерв: scoped `@madeval/readsight`.
2. **`package.json` — ключевые поля для точного и корректного пакета:**
   ```jsonc
   {
     "name": "readsight",
     "version": "1.0.0",              // синхронизируем с линией 1.0.x остальных портов
     "type": "module",
     "exports": {                      // dual-пакет
       ".": {
         "types": "./dist/index.d.ts",
         "import": "./dist/index.js",
         "require": "./dist/index.cjs"
       }
     },
     "main": "./dist/index.cjs",
     "module": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "files": ["dist", "data"],        // ⚠ data ОБЯЗАТЕЛЬНО в пакете
     "engines": { "node": ">=18" },
     "sideEffects": false,
     "license": "MIT",
     "repository": "github:MADEVAL/ReadSightJS",
     "keywords": ["readability","syllable","hyphenation","flesch-kincaid",
                  "gunning-fog","smog","coleman-liau","ari","lix","multilingual","tex","liang"]
   }
   ```
3. **Упаковка данных:** папка `data/{languages,patterns}` кладётся в `files`. Проверка `npm pack --dry-run` (ожидаем ~1 MB gzip; `.tex` хорошо жмётся). Данные читаются из пакета через путь относительно модуля (см. §5.8).
4. **Публикация:** `npm publish --access public` (для scoped — обязателен `--access public`). Провенанс: `npm publish --provenance` из GitHub Actions с OIDC.
5. **`.npmignore` не нужен** — используем whitelisting через `files`. Исключаем `temp/`, `tests/`, `src/` из публикации (в пакет идёт только `dist` + `data`).
6. **`prepublishOnly`:** прогон `build + test + typecheck + lint` перед публикацией.

---

## 3. Структура репозитория

```
ReadSightJS/
├── src/
│   ├── index.ts                         # публичные экспорты (§10)
│   ├── engine.ts                        # ReadSight (+ alias Engine)
│   ├── config.ts                        # Config
│   ├── errors.ts                        # иерархия исключений
│   ├── hyphenation/
│   │   ├── hyphenator.ts                # интерфейс Hyphenator
│   │   ├── liangHyphenator.ts
│   │   ├── pattern.ts
│   │   ├── patternsCollection.ts
│   │   ├── hyphenationOverride.ts
│   │   ├── hyphenationExceptionsCollection.ts
│   │   ├── cache/{patternCache.ts,jsonPatternCache.ts}
│   │   └── source/{patternSource.ts,texSource.ts}
│   ├── language/
│   │   ├── language.ts, languageCode.ts, script.ts
│   │   ├── languageRepository.ts, jsonLanguageRepository.ts
│   ├── syllable/
│   │   ├── syllableCounter.ts, texSyllableCounter.ts,
│   │   ├── heuristicSyllableCounter.ts, compositeSyllableCounter.ts
│   ├── text/
│   │   ├── textSplitter.ts, textAnalyzer.ts, textStatistics.ts
│   ├── formula/
│   │   ├── formula.ts, formulaResult.ts, formulaRegistry.ts,
│   │   ├── formulaRegistryFactory.ts, gradeLevelInterpretation.ts,
│   │   ├── textStatisticsHelper.ts
│   │   └── impls/ (17 файлов: fleschReadingEase.ts … osman.ts)
│   └── internal/
│       ├── phpRound.ts                  # ⚠ КРИТИЧНО (§4.1)
│       └── dataPaths.ts                 # резолв пути к data/ (§5.8)
├── data/                                # копия из temp/ReadSightPy/src/readsight/data
│   ├── languages/*.json  (86)
│   └── patterns/hyph-*.tex (86)
├── tests/
│   ├── unit/… (порт всех Py/PHP unit-тестов)
│   ├── integration/…
│   └── golden/{languages.json,analyze.json,syllable.json}
├── examples/{demo.ts,multilingual.ts}
├── scripts/copy-data.mjs                # синхронизация data/ из temp (dev)
├── package.json, tsconfig.json, tsup.config.ts,
├── vitest.config.ts, .eslintrc, .prettierrc
├── .github/workflows/{ci.yml,publish.yml}
├── README.md, LICENSE (MIT, Yevhen Leonidov), CHANGELOG.md
```

---

## 4. ⚠ Критические точки байт-точности (must-get-right)

### 4.1. Округление — главный риск
- PHP `round($x, $n)` = **half away from zero** (round-half-up по модулю).
- JS `Math.round` = half **toward +∞** (для `-2.5` даёт `-2`, а PHP даёт `-3`).
- Python `round` = banker's (half-to-even) — но Rust уже доказал парити с PHP, значит Py-порт где-то компенсирует; **эталон — PHP.**
- **Решение:** реализовать `phpRound(value, precision)` строго как PHP (half away from zero) в `internal/phpRound.ts` и использовать его **во всех** местах, где Py/PHP вызывают `round()`. Покрыть краевыми тестами (`-0.5`, `2.5`, `0.15`, отрицательные score в ARI/Coleman-Liau на простом тексте).

### 4.2. Регулярные выражения
- `wordSplitPattern` (напр. `[^\p{L}'’-]+`), `letterPattern`, `sentenceBoundaryPattern` берутся **из JSON как есть**.
- PHP: `mb_split(wordSplitPattern)` для слов; `preg_match_all('/pattern/u')` для букв/предложений. Python: `regex.compile`.
- JS: компилировать с флагом `u` (unicode). Разбиение слов — `text.split(new RegExp(wordSplitPattern,'u'))`, затем фильтр пустых. Подсчёт букв/предложений — `[...text.matchAll(new RegExp(pattern,'gu'))].length`.
- **Риск:** различия синтаксиса PCRE/`regex`/JS. Классы вида `[А-Яа-яЁёҐ-ӿ]`, `[ก-๛]`, `\p{L}` — валидны в JS с `u`. Проверить каждый из 86 паттернов на компилируемость (авто-тест «все языки грузятся и компилируют regex»). При несовместимости — фикс в JSON **не допускается** (данные общие); вместо этого — нормализация паттерна в `TextSplitter` с задокументированным маппингом, сверяемая golden-векторами.

### 4.3. Целочисленное деление и типы
- В JS один тип `number`. Следить за местами, где PHP/Py делают `int()` (напр. `long_word_threshold = int(threshold)`, веса паттернов) — использовать `Math.trunc`/`| 0` явно.
- Гистограмма слогов: ключи — числа, **порядок по возрастанию ключа** (PHP ksort / Py sorted). В JS использовать `Map<number,number>` с явной сортировкой ключей при выдаче, а для JSON-сравнения — строковые ключи.

### 4.4. Алгоритм Лианга (`liangHyphenator.ts`)
- Перенести `_split_by_patterns` **посимвольно точно** (индексы `min_hyphen_left/right`, `text = "." + lower + "."`, побитовая проверка `scores[i] & 1`). Это сердце парити слогов — покрыть golden-вектором `syllable.json` (per-word для ≥20 языков).
- `count_syllables = len(hyphenate())`.
- `add_hyphenations` влияет на `splitWord`, **не** на `splitSyllables` в composite/heuristic.

### 4.5. Парсер `.tex` (`texSource.ts`)
- Перенести конечный автомат (`command`, `in_braces`, обработка `\patterns{…}`, `\hyphenation{…}`, `%`-комментарии) 1:1.
- Токенизация паттерна: `\d+|\D` (в Py через `regex.findall`). В JS `token.match(/\d+|[^\d]/gu)` — но осторожно с суррогатами; тестировать на не-Latin паттернах.
- Результат: `{patterns, exceptions, maxPatternLength}`.

### 4.6. Кэш паттернов (`jsonPatternCache.ts`)
- Формат идентичен Py: `version:"2.0"`, `patterns:[{chars,weights}]`, `exceptions:{word:hyphenated}`, `maxPatternLength`.
- **Директория кэша по умолчанию:** Py использует `platformdirs`. В Node аналог — вычислять OS-cache-dir вручную (`%LOCALAPPDATA%` / `$XDG_CACHE_HOME` / `~/Library/Caches`) в `config.ts`, папка `readsight`. Runtime-зависимостей не добавляем.
- Кэш опционален для корректности (только скорость первой загрузки). Первый прогон парсит `.tex`, далее — кэш.

### 4.7. Heuristic-счётчик (`heuristicSyllableCounter.ts`)
- Порядок операций: problemWords → strip non-word (`[^\w]` с unicode) → prefixes → suffixes → подсчёт гласных (`cluster` vs `individual`) → subtractPatterns → addPatterns → `max(count,1)`.
- `[^\w]` в Py = `re.UNICODE`. В JS `\w` не-unicode; заменить на явный класс, дающий тот же результат (тест: только problemWords/heuristic-языки `ru/uk/be/bg` + `en-us/en-gb`).
- `has_rules()` определяет, срабатывает ли heuristic в composite-цепочке.

---

## 5. Модуль-к-модулю маппинг (порядок реализации)

| # | Модуль | Источник (Py/PHP) | Заметки парити |
|---|---|---|---|
| 5.1 | `errors.ts` | exceptions.py | 6 классов, те же сообщения |
| 5.2 | `language/script.ts` | script.py | enum (string union) |
| 5.3 | `language/languageCode.ts` | LanguageCode.php | `normalize = trim().toLowerCase()` |
| 5.4 | `language/language.ts` | language.py | `fromJson`, `getFormulaConfig`, `getSupportedFormulas` |
| 5.5 | `language/jsonLanguageRepository.ts` | json_language_repository.py | кэш, `listCodes` (sorted), `find` |
| 5.6 | `hyphenation/*` | вся папка | Pattern, Collections, LiangHyphenator (§4.4), TexSource (§4.5), JsonPatternCache (§4.6) |
| 5.7 | `syllable/*` | вся папка | 4 счётчика + композит (§4.7) |
| 5.8 | `text/*` | text_* | TextSplitter (§4.2), TextAnalyzer, TextStatistics |
| 5.9 | `formula/*` | вся папка | базовый интерфейс + 17 формул + registry + factory + gradeLevel + helper |
| 5.10 | `config.ts` | config.py | пути к data (§5.8-путь), cache-dir |
| 5.11 | `engine.ts` | engine.py / Engine.php | фасад: все методы, camelCase-имена как в PHP (`fleschReadingEase`, `gunningFog`, `smogIndex`, `automatedReadabilityIndex`, `wienerSachtextformel(text,variant=1)` …) |
| 5.12 | `index.ts` | __init__.py | публичный API |

**§5.8 Резолв пути к данным:** `data/` лежит на уровне пакета (рядом с `dist/`). В `dataPaths.ts` вычислять базовый путь через `new URL('../data', import.meta.url)` (ESM) с CJS-фолбэком `__dirname`. `Config.default()` → `{ patternsDir: <pkg>/data/patterns, languagesDir: <pkg>/data/languages, cacheDir: <os-cache>/readsight }`. tsup оставит `data/` вне бандла — путь считается относительно `dist/`, поэтому в `files` включаем и `dist`, и `data`.

### Соответствие имён API (PHP camelCase — публичный контракт JS)
`syllableCount, splitWord, splitSyllables, wordCount, sentenceCount, letterCount, totalSyllables, averageSyllablesPerWord, averageWordsPerSentence, polysyllableCount(text,countProperNouns=true), wordsWithMoreThanNSyllables(text,n,countProperNouns=true), histogramSyllables, analyze, addHyphenations(record), score(name,text), getSupportedFormulas, getLanguage, getHyphenator, getFormulaRegistry` + статические `getSupportedLanguages, setDefaultConfig, withConfig`.
Ключи формул (в `score()`) — snake_case как в реестре: `flesch_reading_ease, flesch_kincaid_grade_level, gunning_fog, smog, coleman_liau, ari, lix, wiener_sachtextformel, gulpease, fernandez_huerta, szigriszt_pazos, gutierrez_polini, crawford, fog_pl, dale_chall, spache, osman`.

---

## 6. Формулы (17) — коэффициенты берём дословно

Универсальные `["*"]`: `gunning_fog`, `smog` (√, `1.0430*…+3.1291`), `coleman_liau` (`0.0588L-0.296S-15.8`), `ari` (`4.71*cpw+0.5*wps-21.43`), `lix`.
Языко-зависимые: `flesch_reading_ease` (12 языков, коэф. из JSON: `base/aslMult/aswMult`), `flesch_kincaid_grade_level` (12), `wiener_sachtextformel` (4 варианта, de-*), `gulpease` (it), `fernandez_huerta/szigriszt_pazos/gutierrez_polini/crawford` (es), `fog_pl` (pl), `dale_chall/spache` (en, через `TextStatisticsHelper.estimateDifficultPercentage`), `osman` (ar).
- `FormulaResult`: `{ formulaName, languageCode, score, gradeLevel: number|null, interpretation, inputs: Record<string, number> }`.
- Интерпретации и пороги — копировать строково точно (включая `GradeLevelInterpretation.forScore` и per-formula `_interpret`).
- `wiener_sachtextformel_<variant>` — имя результата с суффиксом варианта.
- Все `round(...)` → `phpRound(...)` (§4.1).

---

## 7. Стратегия тестирования (парити-first)

1. **Golden-векторы (главный гарант):** переиспользовать/сгенерировать из **PHP** те же три файла, что у Rust:
   - `languages.json` — 86 кодов, порядок и значения.
   - `syllable.json` — `syllable_count/split_word/split_syllables` по словам для ≥20 языков (взять существующий из `temp/ReadSightRS/tests/golden`).
   - `analyze.json` — по каждому языку: `supported_formulas`, статистика и все применимые формулы для `latin` и `cyrillic` образцов + варианты Wiener.
   - Скопировать готовые golden из Rust-порта в `tests/golden/` (они уже сгенерированы из PHP-канона) и написать `tests/golden.test.ts`, повторяющий логику `ReadSightRS/tests/golden.rs` с `TOL=1e-9`.
2. **Порт unit-тестов** из Py (`tests/unit/**`): hyphenation, syllable (composite/heuristic), text splitter/analyzer, language repo, все формулы, grade-level.
3. **Integration** (порт `test_readsight_integration.py`): сквозные сценарии Engine.
4. **Smoke по всем 86 языкам:** создать Engine, проверить компиляцию regex, прогнать `analyze` + все `supported_formulas` без исключений.
5. **Round-тесты** для `phpRound` (§4.1).
6. **Данные-инварианты:** 86 JSON и 86 `.tex` присутствуют; `getSupportedLanguages().length === 86`.

Цель покрытия: строки ≥ 95% (как у Py/Rust). Все golden-сравнения — с допуском `1e-9`.

---

## 8. CI / публикация (GitHub Actions)

- **`ci.yml`** (по образцу Py): матрица Node `18/20/22` на ubuntu → `npm ci` → `lint` → `typecheck (tsc)` → `build (tsup)` → `vitest run --coverage`. Проверка `npm pack --dry-run` (что `data/` попал в тарбол).
- **`publish.yml`:** триггер по git-тегу `v*`; шаги build+test; `npm publish --provenance --access public` через npm OIDC (без хранения токена). Требует `id-token: write`.
- Бейджи в README: CI, npm version, license, languages(86), formulas(17), Node>=18.

---

## 9. Пошаговый график (milestones)

| Этап | Содержание | Критерий готовности |
|---|---|---|
| M0 | Скелет: package.json, tsconfig, tsup, vitest, eslint; копия `data/`; `phpRound` + тесты | `npm run build` и `vitest` зелёные на заглушках |
| M1 | language + config + errors + Script/LanguageCode | 86 языков грузятся, regex компилируются |
| M2 | hyphenation (TexSource, Liang, cache) | golden `syllable.json` (split_word) проходит |
| M3 | syllable (tex/heuristic/composite) | golden `syllable.json` (count/split_syllables) проходит |
| M4 | text (splitter/analyzer/statistics) | golden `analyze.json` stats проходят |
| M5 | 17 формул + registry + factory | golden `analyze.json` formulas + Wiener проходят |
| M6 | engine facade + index + examples (demo/multilingual) | smoke 86 языков, README-примеры исполняются |
| M7 | Полное покрытие тестов, порт Py unit-тестов, README, CHANGELOG | покрытие ≥95%, CI зелёный |
| M8 | Публикация 1.0.0 в npm (provenance) | пакет ставится `npm i readsight`, `data/` внутри |

---

## 10. Публичный API (`index.ts`)
```ts
export { ReadSight, ReadSight as Engine } from "./engine.js";
export { Config } from "./config.js";
export { Language } from "./language/language.js";
export { Script } from "./language/script.js";
export { TextStatistics } from "./text/textStatistics.js";
export { FormulaResult } from "./formula/formulaResult.js";
export {
  ReadabilityEngineException, EmptyTextException,
  UnsupportedFormulaException, UnsupportedLanguageException,
  PatternFileNotFoundException, PatternParseException,
} from "./errors.js";
```

---

## 11. Открытые вопросы / решения по умолчанию
1. **Имя пакета** — по умолчанию `readsight` (свободно); при желании владельца — scoped `@madeval/readsight`.
2. **Async vs sync чтение данных:** по умолчанию **sync** (`fs.readFileSync`) для 1:1 API с PHP/Py (конструктор синхронный). Опционально позже — async-фабрика.
3. **Кэш по умолчанию:** включён (OS cache dir); можно отключить, задав `cacheDir` в память/`Config`. Для serverless-сред документируем отключение/предзагрузку.
4. **Совместимость браузера:** цель — Node. Браузерная сборка (с инлайном данных) — возможное расширение вне рамок 1.0.0.

---

### Резюме
Порт полностью детерминирован: логика PHP/Py переносится структурно один-в-один, единственные реальные риски — **округление (`phpRound`)** и **совместимость 86 regex-паттернов в JS**, оба закрываются golden-векторами из PHP (уже имеются в Rust-порте) и авто-тестом компиляции всех языков. Данные (86 JSON + 86 `.tex`) кладём в `data/` и публикуем через `files`. Zero-dependency, dual ESM/CJS, Node ≥18.
