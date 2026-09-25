/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { getDiscogsResultDetailId, getDiscogsResultDetailType, getDiscogsResultViewKey } from "../../src/ui/pages/EditPage.jsx";

describe("Discogs bekeken-markering key", () => {
  it("gebruikt type:id zodat release en master niet tegelijk Bekeken worden", () => {
    const releaseResult = {
      id: 456,
      type: "release",
      masterId: 123,
      releaseId: 456,
      title: "Nirvana - Smells Like Teen Spirit"
    };
    const masterResult = {
      id: 123,
      type: "master",
      masterId: 123,
      title: "Nirvana - Smells Like Teen Spirit"
    };

    expect(getDiscogsResultDetailType(releaseResult)).toBe("release");
    expect(getDiscogsResultDetailId(releaseResult)).toBe(456);
    expect(getDiscogsResultViewKey(releaseResult)).toBe("release:456");
    expect(getDiscogsResultViewKey(masterResult)).toBe("master:123");
    expect(getDiscogsResultViewKey(releaseResult)).not.toBe(getDiscogsResultViewKey(masterResult));
  });
});
