import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Sprint 2H-L Fix 1 find-cmd export script", () => {
  it("genereert geen strict-mode pipefail header en quote TARGET", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "routes/indexroutes.js"), "utf8");
    const routeStart = source.indexOf("/api/run-findcmd-script");
    expect(routeStart).toBeGreaterThan(0);
    const routeSource = source.slice(routeStart, source.indexOf("router.", routeStart + 20));

    expect(routeSource).not.toContain("set -euo pipefail");
    expect(routeSource).toContain("export TARGET=${JSON.stringify(target)}");
  });
});
