const EXCLUDED_ACTIONS = ["delete", "duplicates", "skip"];

export const ACTIVE_FILE_DETAILS_SQL = "lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) NOT IN ('delete', 'duplicates', 'skip')";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function includes(haystack, needle) {
  const h = normalize(haystack);
  const n = normalize(needle);
  return Boolean(n) && h.includes(n);
}

function exact(haystack, needle) {
  const h = normalize(haystack);
  const n = normalize(needle);
  return Boolean(n) && h === n;
}

function getCandidateArtist(row = {}) {
  return row.canonical_artist_name || row.fd_correct_artist || "";
}

function getCandidateTitle(row = {}) {
  return row.fd_tag_title || "";
}

export function classifyFileDetailsCandidate(row = {}, { artist = "", title = "", query = "" } = {}) {
  const candidateArtist = getCandidateArtist(row);
  const candidateTitle = getCandidateTitle(row);
  const artistTerm = String(artist || "").trim();
  const titleTerm = String(title || "").trim();
  const queryTerm = String(query || "").trim();

  const artistExact = artistTerm ? exact(candidateArtist, artistTerm) : false;
  const titleExact = titleTerm ? exact(candidateTitle, titleTerm) : false;
  const artistPartial = artistTerm ? includes(candidateArtist, artistTerm) : false;
  const titlePartial = titleTerm ? includes(candidateTitle, titleTerm) : false;
  const queryPartial = queryTerm
    ? includes(candidateArtist, queryTerm) || includes(candidateTitle, queryTerm) || includes(row.fd_file_name, queryTerm)
    : false;

  let matchType = "Gedeeltelijk";
  let matchScore = 10;

  if ((artistTerm && titleTerm && artistExact && titleExact) || (!artistTerm && !titleTerm && queryTerm && (exact(candidateArtist, queryTerm) || exact(candidateTitle, queryTerm)))) {
    matchType = "Exact";
    matchScore = 100;
  } else if ((artistTerm && titleTerm && artistPartial && titlePartial) || (artistTerm && artistExact) || (titleTerm && titleExact)) {
    matchType = "Sterke match";
    matchScore = 70;
  } else if (artistPartial || titlePartial || queryPartial) {
    matchType = "Gedeeltelijk";
    matchScore = 40;
  }

  return { matchType, matchScore };
}

export function mapFileDetailsCandidate(row = {}, search = {}) {
  const match = classifyFileDetailsCandidate(row, search);
  return {
    fd_key: row.fd_key,
    fd_correct_artist: row.fd_correct_artist,
    fd_tag_title: row.fd_tag_title,
    fd_artist_key: row.fd_artist_key,
    canonical_artist_name: row.canonical_artist_name || row.fd_correct_artist || null,
    fd_file_name: row.fd_file_name,
    fd_hitlijst: row.fd_hitlijst,
    fd_duration: row.fd_duration,
    fd_year_song_publish: row.fd_year_song_publish,
    fd_year_song_version: row.fd_year_song_version,
    st_song_type: row.st_song_type,
    st_song_type_desc: row.st_song_type_desc,
    match_type: match.matchType,
    match_score: match.matchScore
  };
}

export function sortFileDetailsCandidates(candidates = []) {
  return [...candidates].sort((a, b) => {
    const scoreDiff = Number(b.match_score || 0) - Number(a.match_score || 0);
    if (scoreDiff) return scoreDiff;
    const artistDiff = String(a.canonical_artist_name || a.fd_correct_artist || "").localeCompare(String(b.canonical_artist_name || b.fd_correct_artist || ""), "nl", { sensitivity: "base" });
    if (artistDiff) return artistDiff;
    const titleDiff = String(a.fd_tag_title || "").localeCompare(String(b.fd_tag_title || ""), "nl", { sensitivity: "base" });
    if (titleDiff) return titleDiff;
    return Number(a.fd_key || 0) - Number(b.fd_key || 0);
  });
}

export function isActiveFileDetailsAction(action) {
  return !EXCLUDED_ACTIONS.includes(normalize(action || "keep"));
}
