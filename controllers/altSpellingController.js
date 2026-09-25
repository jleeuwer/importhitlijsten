import { z } from "zod";
import { applyAltSpellingForRow } from "../models/altspelling.js";

const bodySchema = z.object({
  runId: z.string().uuid("runId must be a UUID"),
  hl_positie: z.coerce.number().int().min(1),
  fd_tag_title: z.string().trim().min(1).max(255)
});

/**
 * Backward-compatible helper for older /api/altspelling/select callers.
 *
 * The model is the single source of truth: AltSpelling always stores
 * song_spelling on the original staging values (hl_titel_song + hl_artiest),
 * then updates staging.fd_tag_title and clears hl_find_cmd. This deliberately
 * does not use corrected artist spelling yet; the current apply-song-spelling
 * flow also resolves mappings on the original hitlijst title + artist text.
 */
export async function selectAltSpellingForRow({ runId, hl_positie, selectedFdTagTitle }) {
  const fd_tag_title = String(selectedFdTagTitle ?? "").trim();
  if (!fd_tag_title) {
    const err = new Error("selected_fd_tag_title is required");
    err.status = 400;
    throw err;
  }

  const result = await applyAltSpellingForRow({ runId, hl_positie, fd_tag_title });

  return {
    ok: true,
    runId,
    hl_positie,
    hl_titel_song: result.songSpellingRow?.hl_titel_song,
    hl_artiest: result.songSpellingRow?.hl_artiest,
    fd_tag_title: result.songSpellingRow?.fd_tag_title,
    songSpellingRow: result.songSpellingRow,
    staging: result.staging
  };
}

/**
 * POST /api/altspelling-apply
 * Applies the selected fd_tag_title for a staging row and upserts song_spelling.
 */
export async function altSpellingApply(req, res, next) {
  try {
    const parsed = bodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }

    const { runId, hl_positie, fd_tag_title } = parsed.data;
    const result = await applyAltSpellingForRow({ runId, hl_positie, fd_tag_title });

    return res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}
