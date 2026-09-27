import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

describe("2H-Z Hotfix 4 pagination selector hardening", () => {
  it("uses multi-match-safe assertions for duplicated artist text in edit pagination tests", () => {
    const pagination = read("tests/react/EditPaginationAndTitle.test.jsx");
    const large = read("tests/react/EditLargeRunRendering.test.jsx");

    expect(pagination).toContain('getAllByText("Artist 1")');
    expect(pagination).toContain('getAllByText("Artist 60")');
    expect(pagination).toContain('queryAllByText("Artist 1")');
    expect(large).toContain('getAllByText("Artist 51", { exact: true })');
    expect(large).toContain('queryAllByText("Artist 1", { exact: true })');
  });
});
