import { describe, expect, test } from "vitest";
import fs from "node:fs";

describe("Edit Pattern Suggesties keep/remove UI", () => {
  test("modal biedt acties voor verwijderbaar en titelonderdeel", () => {
    const ui = fs.readFileSync("src/ui/pages/EditPage.jsx", "utf8");
    expect(ui).toContain("Toevoegen als verwijderbaar");
    expect(ui).toContain("Toevoegen als titelonderdeel");
    expect(ui).toContain("addKeepPatternSuggestions");
    expect(ui).toContain("/pattern-suggestions/add-keep");
    expect(ui).toContain("Onderdrukt als titelonderdeel");
  });
});
