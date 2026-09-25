import { describe, expect, it } from "vitest";
import {
  ACTIVE_FILE_DETAILS_SQL,
  classifyFileDetailsCandidate,
  isActiveFileDetailsAction,
  mapFileDetailsCandidate,
  sortFileDetailsCandidates
} from "../services/fileDetailsCandidateService.js";

describe("fileDetailsCandidateService", () => {
  it("classifies exact and partial matches", () => {
    const exact = classifyFileDetailsCandidate(
      { canonical_artist_name: "Nirvana", fd_tag_title: "Smells Like Teen Spirit" },
      { artist: "Nirvana", title: "Smells Like Teen Spirit" }
    );
    expect(exact).toEqual({ matchType: "Exact", matchScore: 100 });

    const strong = classifyFileDetailsCandidate(
      { canonical_artist_name: "Nirvana", fd_tag_title: "Smells Like Teen Spirit" },
      { artist: "Nir", title: "Teen" }
    );
    expect(strong.matchType).toBe("Sterke match");
  });

  it("sorts best matching candidates first", () => {
    const rows = [
      mapFileDetailsCandidate({ fd_key: 2, canonical_artist_name: "Nirvana", fd_tag_title: "Come As You Are" }, { artist: "Nirvana", title: "Smells Like Teen Spirit" }),
      mapFileDetailsCandidate({ fd_key: 1, canonical_artist_name: "Nirvana", fd_tag_title: "Smells Like Teen Spirit" }, { artist: "Nirvana", title: "Smells Like Teen Spirit" })
    ];

    const sorted = sortFileDetailsCandidates(rows);
    expect(sorted[0]).toMatchObject({ fd_key: 1, match_type: "Exact", match_score: 100 });
  });

  it("exposes a shared active file_details filter", () => {
    expect(ACTIVE_FILE_DETAILS_SQL).toContain("delete");
    expect(ACTIVE_FILE_DETAILS_SQL).toContain("duplicates");
    expect(ACTIVE_FILE_DETAILS_SQL).toContain("skip");
    expect(isActiveFileDetailsAction("Keep")).toBe(true);
    expect(isActiveFileDetailsAction("Delete")).toBe(false);
    expect(isActiveFileDetailsAction("Duplicates")).toBe(false);
    expect(isActiveFileDetailsAction("Skip")).toBe(false);
  });
});
