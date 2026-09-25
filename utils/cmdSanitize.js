// utils/cmdSanitize.js

/**
 * Only for hl_find_cmd generation:
 * - removes diacritics (Beyoncé -> Beyonce)
 * - removes punctuation/special characters (incl &)
 * - keeps letters + digits (unicode-aware)
 * - collapses whitespace
 */
export function sanitizeForFindCmd(input) {
  return String(input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // diacritics
    .replace(/&/g, " ")              // Excel concat sign -> separator
    .replace(/[^\p{L}\p{N}]+/gu, " ") // keep letters/numbers only
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Excel formula meaning:
 * findcopy.sh "*<left(fd_correct_artist,10)>*<fd_tag_title>*" "$TARGET"
 *
 * We use:
 * - artistForCmd = as_correcte_artiest_spelling ?? hl_artiest
 * - titleForCmd  = fd_tag_title
 */
export function buildFindCopyCmd({ artistForCmd, titleForCmd }) {
  const a = sanitizeForFindCmd(artistForCmd);
  const t = sanitizeForFindCmd(titleForCmd);

  const a10 = a.slice(0, 10); // left(artist,10)
  if (!a10 && !t) return null;

  // quotes + wildcards, exactly like your excel intent
  return `findcopy.sh "*${a10}*${t}*" "$TARGET"`;
}

