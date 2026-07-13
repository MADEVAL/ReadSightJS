import { describe, expect, it } from "vitest";

import { Script } from "../../../src/language/script.js";

describe("Script", () => {
  it("exposes expected values", () => {
    expect(Script.Latin).toBe("Latin");
    expect(Script.Cyrillic).toBe("Cyrillic");
    expect(Script.Arabic).toBe("Arabic");
    expect(Script.Thai).toBe("Thai");
    expect(Script.Coptic).toBe("Coptic");
    expect(Script.CJK).toBe("CJK");
    expect(Script.Other).toBe("Other");
  });

  it("has 21 writing systems", () => {
    expect(Object.keys(Script).length).toBe(21);
  });
});
