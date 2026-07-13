import { existsSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { Config } from "../../src/config.js";
import {
  defaultCacheDir,
  defaultLanguagesDir,
  defaultPatternsDir,
} from "../../src/internal/dataPaths.js";

describe("dataPaths", () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    vi.unstubAllEnvs();
  });

  it("resolves the packaged languages and patterns directories", () => {
    const langs = defaultLanguagesDir();
    const patterns = defaultPatternsDir();
    expect(existsSync(join(langs, "en-us.json"))).toBe(true);
    expect(existsSync(join(patterns, "hyph-en-us.tex"))).toBe(true);
  });

  it("returns a Windows cache dir when LOCALAPPDATA is set", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    vi.stubEnv("LOCALAPPDATA", "C:\\Users\\Test\\AppData\\Local");
    expect(defaultCacheDir()).toContain("readsight");
  });

  it("falls back to tmpdir on Windows without LOCALAPPDATA", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    vi.stubEnv("LOCALAPPDATA", "");
    expect(defaultCacheDir()).toContain("readsight");
  });

  it("returns a macOS cache dir", () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    expect(defaultCacheDir()).toContain("readsight");
    expect(defaultCacheDir()).toContain("Caches");
  });

  it("uses XDG_CACHE_HOME on Linux when set", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    vi.stubEnv("XDG_CACHE_HOME", "/tmp/xdg-cache");
    expect(defaultCacheDir()).toBe(join("/tmp/xdg-cache", "readsight"));
  });

  it("falls back to ~/.cache on Linux without XDG_CACHE_HOME", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    vi.stubEnv("XDG_CACHE_HOME", "");
    expect(defaultCacheDir()).toContain("readsight");
  });
});

describe("Config", () => {
  it("builds from explicit directories", () => {
    const config = new Config("/p", "/l", "/c");
    expect(config.patternsDir).toBe("/p");
    expect(config.languagesDir).toBe("/l");
    expect(config.cacheDir).toBe("/c");
  });

  it("provides sensible defaults", () => {
    const config = Config.default();
    expect(existsSync(join(config.languagesDir, "en-us.json"))).toBe(true);
    expect(existsSync(join(config.patternsDir, "hyph-en-us.tex"))).toBe(true);
    expect(config.cacheDir).toContain("readsight");
  });
});
