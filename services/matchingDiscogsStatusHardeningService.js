/**
 * Sprint 2H-Y — Matching, Discogs lifecycle & status hardening helpers.
 *
 * This module contains deterministic rules that are also enforced in the SQL
 * export layer. It keeps the business rules separately testable.
 */

export const AMBIGUOUS_FILE_DETAILS_REASON = 'MULTIPLE_FILE_DETAILS_COMBINED_MATCHES';

export const BLOCKING_EXPORT_REASON_CODES = Object.freeze([
  'MISSING_FD_TAG_TITLE',
  'MISSING_HL_ARTIST_KEY',
  'NO_FILE_DETAILS_TITLE_MATCH',
  'NO_FILE_DETAILS_ARTIST_KEY_MATCH',
  'NO_FILE_DETAILS_COMBINED_MATCH',
  AMBIGUOUS_FILE_DETAILS_REASON
]);

const DISCOGS_MASTER_RE = /^https:\/\/(www\.)?discogs\.com\/master\/\d+(?:[-/?#].*)?$/i;
const DISCOGS_RELEASE_RE = /^https:\/\/(www\.)?discogs\.com\/release\/\d+(?:[-/?#].*)?$/i;

function text(value) {
  return String(value ?? '').trim();
}

export function isBlockingExportReasonCode(reasonCode) {
  return BLOCKING_EXPORT_REASON_CODES.includes(text(reasonCode).toUpperCase());
}

export function classifyFileDetailsMatchCounts({
  fdTagTitle = '',
  hlArtistKey = null,
  titleMatchCount = 0,
  artistKeyMatchCount = 0,
  combinedMatchCount = 0
} = {}) {
  if (!text(fdTagTitle)) return 'MISSING_FD_TAG_TITLE';
  if (hlArtistKey === null || hlArtistKey === undefined || hlArtistKey === '') return 'MISSING_HL_ARTIST_KEY';
  if (Number(titleMatchCount || 0) === 0) return 'NO_FILE_DETAILS_TITLE_MATCH';
  if (Number(artistKeyMatchCount || 0) === 0) return 'NO_FILE_DETAILS_ARTIST_KEY_MATCH';
  if (Number(combinedMatchCount || 0) === 0) return 'NO_FILE_DETAILS_COMBINED_MATCH';
  if (Number(combinedMatchCount || 0) > 1) return AMBIGUOUS_FILE_DETAILS_REASON;
  return null;
}

export function normalizeDiscogsLifecycleLink({
  hlDiscogsLink = null,
  discogsMasterUrl = null,
  discogsReleaseUrl = null
} = {}) {
  const master = text(discogsMasterUrl);
  const release = text(discogsReleaseUrl);
  const raw = text(hlDiscogsLink);

  if (release && DISCOGS_RELEASE_RE.test(release)) {
    return { kind: 'release', url: release, source: 'discogs_release_url', safe: true };
  }
  if (master && DISCOGS_MASTER_RE.test(master)) {
    return { kind: 'master', url: master, source: 'discogs_master_url', safe: true };
  }
  if (raw && DISCOGS_RELEASE_RE.test(raw)) {
    return { kind: 'release', url: raw, source: 'hl_discogs_link', safe: true };
  }
  if (raw && DISCOGS_MASTER_RE.test(raw)) {
    return { kind: 'master', url: raw, source: 'hl_discogs_link', safe: true };
  }
  if (raw || master || release) {
    return { kind: 'invalid', url: raw || release || master, source: raw ? 'hl_discogs_link' : release ? 'discogs_release_url' : 'discogs_master_url', safe: false };
  }
  return { kind: 'none', url: null, source: null, safe: false };
}

export function buildVariantAwareSignature(row = {}) {
  return {
    artistKey: row.hl_artist_key ?? row.fd_artist_key ?? null,
    title: text(row.fd_tag_title || row.hl_titel_song).toLowerCase().replace(/\s+/g, ' '),
    desiredSongTypeKey: row.hl_desired_song_type_key ?? row.fd_song_type_key ?? null
  };
}

export function classifyRunAfterExport({ exported = false, blockingCount = 0, warningCount = 0 } = {}) {
  const blockers = Number(blockingCount || 0);
  const warnings = Number(warningCount || 0);
  if (blockers > 0) {
    return { ir_export_status: 'EXPORT_BLOCKED', ir_status: 'AANDACHT_NODIG' };
  }
  if (!exported) {
    return { ir_export_status: 'NOT_EXPORTED', ir_status: warnings > 0 ? 'KLAAR_VOOR_EXPORT_MET_WAARSCHUWINGEN' : 'KLAAR_VOOR_EXPORT' };
  }
  return {
    ir_export_status: warnings > 0 ? 'EXPORTED_WITH_WARNINGS' : 'EXPORTED',
    ir_status: warnings > 0 ? 'GEEXPORTEERD_MET_WAARSCHUWINGEN' : 'GEEXPORTEERD'
  };
}
