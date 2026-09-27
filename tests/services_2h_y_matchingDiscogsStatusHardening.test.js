/** @vitest-environment node */
import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  AMBIGUOUS_FILE_DETAILS_REASON,
  buildVariantAwareSignature,
  classifyFileDetailsMatchCounts,
  classifyRunAfterExport,
  isBlockingExportReasonCode,
  normalizeDiscogsLifecycleLink
} from '../services/matchingDiscogsStatusHardeningService.js';

test('2H-Y treats multiple combined file_details candidates as blocking ambiguity', () => {
  const reason = classifyFileDetailsMatchCounts({
    fdTagTitle: 'The Age Of Love',
    hlArtistKey: 123,
    titleMatchCount: 11,
    artistKeyMatchCount: 20,
    combinedMatchCount: 3
  });

  assert.equal(reason, AMBIGUOUS_FILE_DETAILS_REASON);
  assert.equal(isBlockingExportReasonCode(reason), true);
});

test('2H-Y allows exactly one variant-aware candidate', () => {
  const reason = classifyFileDetailsMatchCounts({
    fdTagTitle: 'The Age Of Love',
    hlArtistKey: 123,
    titleMatchCount: 11,
    artistKeyMatchCount: 20,
    combinedMatchCount: 1
  });

  assert.equal(reason, null);
});

test('2H-Y Discogs lifecycle prefers release URL and accepts safe raw fallback', () => {
  assert.deepEqual(
    normalizeDiscogsLifecycleLink({
      hlDiscogsLink: 'https://www.discogs.com/master/123-title',
      discogsReleaseUrl: 'https://www.discogs.com/release/456-title'
    }),
    { kind: 'release', url: 'https://www.discogs.com/release/456-title', source: 'discogs_release_url', safe: true }
  );

  assert.deepEqual(
    normalizeDiscogsLifecycleLink({ hlDiscogsLink: 'https://www.discogs.com/master/123-title' }),
    { kind: 'master', url: 'https://www.discogs.com/master/123-title', source: 'hl_discogs_link', safe: true }
  );
});

test('2H-Y Discogs lifecycle rejects non-Discogs or non-HTTPS raw links', () => {
  assert.equal(normalizeDiscogsLifecycleLink({ hlDiscogsLink: 'http://www.discogs.com/release/456' }).safe, false);
  assert.equal(normalizeDiscogsLifecycleLink({ hlDiscogsLink: 'https://example.com/release/456' }).safe, false);
});

test('2H-Y variant-aware signature includes desired song type key', () => {
  assert.deepEqual(
    buildVariantAwareSignature({ hl_artist_key: 5, fd_tag_title: '  Would?  ', hl_desired_song_type_key: 7 }),
    { artistKey: 5, title: 'would?', desiredSongTypeKey: 7 }
  );
});

test('2H-Y exported runs with non-blocking warnings are not attention-required', () => {
  assert.deepEqual(
    classifyRunAfterExport({ exported: true, blockingCount: 0, warningCount: 2 }),
    { ir_export_status: 'EXPORTED_WITH_WARNINGS', ir_status: 'GEEXPORTEERD_MET_WAARSCHUWINGEN' }
  );
});
