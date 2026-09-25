import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("static export workflow guard coverage", () => {
  const routes = fs.readFileSync("routes/indexroutes.js", "utf8");

  it("guards direct staging mutation endpoints after export", () => {
    const guardedRoutes = [
      '/api/staging-update',
      '/api/edit/staging/:runId/:hlPositie/discogs',
      '/api/edit/staging/:runId/:hlPositie/repair-artist-relation',
      '/api/edit/staging/:runId/:hlPositie/manual-file-details-repair',
      '/api/edit/staging/:runId/:hlPositie/manual-correction',
      '/api/edit/staging/:runId/:hlPositie/repair-title-artist-swap'
    ];

    for (const route of guardedRoutes) {
      const routeIndex = routes.indexOf(route);
      expect(routeIndex, `${route} should exist`).toBeGreaterThan(-1);
      const routeBody = routes.slice(routeIndex, routeIndex + 1600);
      expect(routeBody, `${route} should call assertPreExportActionAllowed`).toContain('assertPreExportActionAllowed(runId)');
    }
  });
});
