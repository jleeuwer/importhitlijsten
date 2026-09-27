import { describe, expect, it } from "vitest";
import { calculateListFingerprint, normalizeFingerprintText } from "../utils/listFingerprint.js";

describe("2H-Z list fingerprint", () => {
  it("normalizes technical text differences but preserves list order", () => {
    const a = calculateListFingerprint([
      { artiest: "Coldcut\u00a0Featuring Yazz", song: "Doctorin’  The House", jaar: "1988" },
      { artiest: "Inner City", song: "Good Life", jaar: "1988" }
    ]);
    const b = calculateListFingerprint([
      { artiest: " coldcut featuring yazz ", song: "Doctorin' The House", jaar: "2026" },
      { artiest: "INNER CITY", song: "Good Life", jaar: "1999" }
    ]);
    expect(a.listFingerprint).toBe(b.listFingerprint);
  });

  it("changes when ranking changes", () => {
    const a = calculateListFingerprint([
      { artiest: "A", song: "One" },
      { artiest: "B", song: "Two" }
    ]);
    const b = calculateListFingerprint([
      { artiest: "B", song: "Two" },
      { artiest: "A", song: "One" }
    ]);
    expect(a.listFingerprint).not.toBe(b.listFingerprint);
  });

  it("does not strip meaningful version text", () => {
    const a = calculateListFingerprint([{ artiest: "U2", song: "One" }]);
    const b = calculateListFingerprint([{ artiest: "U2", song: "One (Live)" }]);
    expect(a.listFingerprint).not.toBe(b.listFingerprint);
  });

  it("normalizes apostrophe variants", () => {
    expect(normalizeFingerprintText("Doctorin’ The House")).toBe("doctorin' the house");
  });
});
