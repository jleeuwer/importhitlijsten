import { describe, expect, it } from "vitest";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

describe("2H-AA Hotfix 1 test stability", () => {
  it("keeps package and lock versions aligned on the current release", () => {
    const pkg = JSON.parse(read("package.json"));
    const lock = JSON.parse(read("package-lock.json"));
    expect(pkg.version).toBe("1.2.0");
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages?.[""]?.version).toBe(pkg.version);
  });

  it("associates the directory scan label with its input", () => {
    const page = read("src/ui/pages/ImportPage.jsx");
    expect(page).toMatch(/htmlFor="import-directory">Directory met CSV-bestanden/);
    expect(page).toMatch(/id="import-directory"[\s\S]*name="directory"/);
  });

  it("scopes the single-upload focus assertion to candidate metadata", () => {
    const test = read("tests/react/ImportDragDropInbox.test.jsx");
    expect(test).toMatch(/metadata tijdelijke importkandidaat/i);
    expect(test).toMatch(/within\(candidatePanel\)\.getByLabelText\(\/Hitlijst name\/i\)/);
  });

  it("gives the two deliberately heavy pagination regressions a local timeout", () => {
    expect(read("tests/react/EditPaginationAndTitle.test.jsx")).toMatch(/paginates the song table[\s\S]*10000\);/);
    expect(read("tests/react/EditLargeRunRendering.test.jsx")).toMatch(/renders only the active page[\s\S]*10000\);/);
  });
});
