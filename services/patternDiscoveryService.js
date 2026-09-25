function compactWhitespace(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function stripOuterWrapper(value) {
  let out = compactWhitespace(value);
  let changed = true;
  while (changed && out.length >= 2) {
    changed = false;
    const pairs = [["(", ")"], ["[", "]"], ["{", "}"]];
    for (const [open, close] of pairs) {
      if (out.startsWith(open) && out.endsWith(close)) {
        out = compactWhitespace(out.slice(1, -1));
        changed = true;
        break;
      }
    }
  }
  return out;
}

export function normalizePatternValue(pattern) {
  return stripOuterWrapper(pattern).toLocaleLowerCase("nl-NL");
}

export function normalizePatternForCompare(pattern) {
  return normalizePatternValue(pattern);
}

function stripTrailingPattern(title, rawPattern) {
  const source = String(title ?? "");
  if (!rawPattern) return compactWhitespace(source);
  const idx = source.toLocaleLowerCase("nl-NL").lastIndexOf(String(rawPattern).toLocaleLowerCase("nl-NL"));
  if (idx < 0) return compactWhitespace(source);
  return compactWhitespace(source.slice(0, idx));
}

const VERSION_PATTERN_TERMS = [
  "live",
  "remaster",
  "remastered",
  "radio edit",
  "single edit",
  "single version",
  "album version",
  "extended",
  "extended mix",
  "12\" mix",
  "12 inch mix",
  "7\" mix",
  "7 inch mix",
  "remix",
  "mix",
  "mono",
  "stereo",
  "version",
  "edit"
];

export const PATTERN_CLASSIFICATIONS = Object.freeze({
  SAFE_REMOVE_PATTERN: "SAFE_REMOVE_PATTERN",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  LIKELY_TITLE_CONTENT: "LIKELY_TITLE_CONTENT",
  KNOWN_KEEP_PATTERN: "KNOWN_KEEP_PATTERN",
  KNOWN_REMOVE_PATTERN: "KNOWN_REMOVE_PATTERN"
});

function classifyPattern(rawPattern) {
  const normalized = normalizePatternValue(rawPattern);
  const inner = normalized;
  const hasYear = /\b(19|20)\d{2}\b/.test(inner);
  const hasRemaster = /\bremaster(?:ed)?\b/.test(inner);
  const hasVersionTerm = VERSION_PATTERN_TERMS.some((term) => inner.includes(term));

  if (hasYear && hasRemaster) {
    return {
      groupKey: "family:remaster_with_year",
      family: "remaster_with_year",
      canonicalLabel: "Remaster met jaartal",
      classification: PATTERN_CLASSIFICATIONS.SAFE_REMOVE_PATTERN,
      classificationLabel: "Waarschijnlijk verwijderbaar",
      genericHint: "Herken varianten zoals (2011 Remaster), (Remaster 2011) en (Remastered 2011) als één familie."
    };
  }

  if (hasVersionTerm) {
    return {
      groupKey: `literal:${normalized}`,
      family: "literal_suffix",
      canonicalLabel: rawPattern,
      classification: PATTERN_CLASSIFICATIONS.SAFE_REMOVE_PATTERN,
      classificationLabel: "Waarschijnlijk verwijderbaar",
      genericHint: "Bekende versie-/opschoonterm gevonden. Controleer de preview voordat je toevoegt."
    };
  }

  const wordCount = inner.split(/\s+/).filter(Boolean).length;
  const looksLikeSentence = wordCount >= 3 && !hasVersionTerm;

  return {
    groupKey: `literal:${normalized}`,
    family: "literal_suffix",
    canonicalLabel: rawPattern,
    classification: looksLikeSentence
      ? PATTERN_CLASSIFICATIONS.LIKELY_TITLE_CONTENT
      : PATTERN_CLASSIFICATIONS.NEEDS_REVIEW,
    classificationLabel: looksLikeSentence ? "Waarschijnlijk titelonderdeel" : "Controle nodig",
    genericHint: looksLikeSentence
      ? "Deze haakjesinhoud lijkt op officiële titeltekst. Voeg deze liever toe aan titelonderdelen als hij niet verwijderd mag worden."
      : "Concrete suffix-pattern kandidaat; controleer of dit opschoonmetadata of titelinhoud is."
  };
}

export function discoverPatternsForTitle(title) {
  const source = compactWhitespace(title);
  if (!source) return [];

  const candidates = [];
  const suffixMatchers = [
    /\s*(\([^()]{2,80}\))\s*$/u,
    /\s*(\[[^\[\]]{2,80}\])\s*$/u,
    /\s*(\{[^{}]{2,80}\})\s*$/u,
    /\s+[-–—]\s+([A-Za-z0-9][A-Za-z0-9 '"./&+]{2,80})\s*$/u
  ];

  for (const matcher of suffixMatchers) {
    const match = source.match(matcher);
    if (!match) continue;
    const rawPattern = compactWhitespace(match[1]);
    if (!rawPattern) continue;
    const classification = classifyPattern(rawPattern);
    candidates.push({
      rawPattern,
      normalizedPattern: normalizePatternValue(rawPattern),
      type: rawPattern.startsWith("(")
        ? "parentheses_suffix"
        : rawPattern.startsWith("[")
          ? "bracket_suffix"
          : rawPattern.startsWith("{")
            ? "brace_suffix"
            : "dash_suffix",
      ...classification,
      before: source,
      after: stripTrailingPattern(source, rawPattern)
    });
    break;
  }

  return candidates;
}

function normalizeRowsToPatternValues(rows, fieldNames) {
  return new Set((rows || []).map((row) => {
    if (typeof row === "string") return normalizePatternValue(row);
    for (const fieldName of fieldNames) {
      if (row?.[fieldName]) return normalizePatternValue(row[fieldName]);
    }
    return "";
  }).filter(Boolean));
}

export function groupPatternCandidates(candidates, existingPatterns = [], keepPatterns = []) {
  const existingNormalized = normalizeRowsToPatternValues(existingPatterns, ["st_string_delete", "pattern"]);
  const keepNormalized = normalizeRowsToPatternValues(keepPatterns, ["skp_pattern", "pattern"]);
  const groups = new Map();
  const suppressedKeep = [];

  for (const candidate of candidates) {
    const candidateNormalized = normalizePatternValue(candidate.rawPattern);
    if (keepNormalized.has(candidateNormalized)) {
      suppressedKeep.push({
        ...candidate,
        normalizedPattern: candidateNormalized,
        classification: PATTERN_CLASSIFICATIONS.KNOWN_KEEP_PATTERN,
        classificationLabel: "Bekend titelonderdeel"
      });
      continue;
    }

    const key = candidate.groupKey || `literal:${candidate.normalizedPattern}`;
    if (!groups.has(key)) {
      groups.set(key, {
        groupKey: key,
        family: candidate.family,
        canonicalLabel: candidate.canonicalLabel,
        genericHint: candidate.genericHint,
        classification: candidate.classification,
        classificationLabel: candidate.classificationLabel,
        count: 0,
        variants: new Map(),
        examples: []
      });
    }
    const group = groups.get(key);
    group.count += 1;
    const variantKey = candidate.normalizedPattern;
    const exists = existingNormalized.has(candidate.normalizedPattern);
    const variant = group.variants.get(variantKey) || {
      pattern: candidate.rawPattern,
      normalizedPattern: candidate.normalizedPattern,
      count: 0,
      exists,
      knownKeep: false,
      type: candidate.type,
      classification: exists ? PATTERN_CLASSIFICATIONS.KNOWN_REMOVE_PATTERN : candidate.classification,
      classificationLabel: exists ? "Bekend verwijderbaar" : candidate.classificationLabel
    };
    variant.count += 1;
    variant.exists = variant.exists || exists;
    group.variants.set(variantKey, variant);
    if (group.examples.length < 5) {
      group.examples.push({
        hl_positie: candidate.hl_positie ?? candidate.position ?? null,
        before: candidate.before,
        after: candidate.after,
        pattern: candidate.rawPattern
      });
    }
  }

  const suggestions = [...groups.values()]
    .map((group) => {
      const variants = [...group.variants.values()].sort((a, b) => b.count - a.count || a.pattern.localeCompare(b.pattern));
      const newVariants = variants.filter((variant) => !variant.exists && !variant.knownKeep);
      return {
        groupKey: group.groupKey,
        family: group.family,
        canonicalLabel: group.canonicalLabel,
        genericHint: group.genericHint,
        classification: group.classification,
        classificationLabel: group.classificationLabel,
        count: group.count,
        variants,
        newVariants,
        existingVariants: variants.filter((variant) => variant.exists),
        exists: variants.length > 0 && variants.every((variant) => variant.exists),
        examples: group.examples
      };
    })
    .sort((a, b) => b.count - a.count || a.canonicalLabel.localeCompare(b.canonicalLabel));

  Object.defineProperty(suggestions, "suppressedKeep", {
    value: suppressedKeep,
    enumerable: false
  });
  return suggestions;
}

export function previewPatternEffect(patterns, titles) {
  const selected = patterns.map((pattern) => compactWhitespace(pattern)).filter(Boolean);
  const selectedLower = selected.map(normalizePatternValue);
  const changes = [];

  for (const item of titles) {
    const title = typeof item === "string" ? item : item.title;
    const before = compactWhitespace(title);
    let after = before;
    const applied = [];
    for (let i = 0; i < selected.length; i += 1) {
      const pattern = selected[i];
      const patternLower = selectedLower[i];
      const afterLower = normalizePatternValue(after.slice(Math.max(0, after.length - pattern.length - 4)));
      if (after.toLocaleLowerCase("nl-NL").endsWith(String(pattern).toLocaleLowerCase("nl-NL")) || afterLower === patternLower) {
        after = stripTrailingPattern(after, pattern);
        applied.push(pattern);
      }
    }
    if (after !== before) {
      changes.push({
        hl_positie: item.hl_positie ?? item.position ?? null,
        before,
        after,
        patternsApplied: applied
      });
    }
  }

  return changes;
}

async function getRunTitles(client, runId) {
  const result = await client.query(
    `
    SELECT hl_positie, hl_titel_song
    FROM public.staging_hitlijsten
    WHERE hl_import_run_id = $1
    ORDER BY hl_positie ASC
    `,
    [runId]
  );
  return result.rows.map((row) => ({ hl_positie: row.hl_positie, title: row.hl_titel_song }));
}

async function getExistingPatterns(client) {
  const result = await client.query(
    `SELECT st_key, st_string_delete FROM public.string_del_patterns ORDER BY st_string_delete ASC`
  );
  return result.rows;
}

async function getExistingKeepPatterns(client) {
  const result = await client.query(
    `
    SELECT skp_key, skp_pattern, skp_pattern_normalized, skp_description
    FROM public.string_keep_patterns
    ORDER BY skp_pattern ASC
    `
  );
  return result.rows;
}

export async function getPatternSuggestionsForRun(runId) {
  const { pool } = await import("../config/db.js");
  const client = await pool.connect();
  try {
    const titles = await getRunTitles(client, runId);
    const existingPatterns = await getExistingPatterns(client);
    const keepPatterns = await getExistingKeepPatterns(client);
    const candidates = [];
    for (const row of titles) {
      const discovered = discoverPatternsForTitle(row.title).map((candidate) => ({
        ...candidate,
        hl_positie: row.hl_positie
      }));
      candidates.push(...discovered);
    }
    const suggestions = groupPatternCandidates(candidates, existingPatterns, keepPatterns);
    const suppressedKeepPatterns = suggestions.suppressedKeep || [];
    return {
      runId,
      summary: {
        candidateGroups: suggestions.length,
        candidateVariants: suggestions.reduce((sum, item) => sum + item.variants.length, 0),
        candidateOccurrences: suggestions.reduce((sum, item) => sum + item.count, 0),
        existingVariants: suggestions.reduce((sum, item) => sum + item.existingVariants.length, 0),
        newVariants: suggestions.reduce((sum, item) => sum + item.newVariants.length, 0),
        suppressedKeepPatterns: suppressedKeepPatterns.length
      },
      suggestions,
      suppressedKeepPatterns
    };
  } finally {
    client.release();
  }
}

export async function previewPatternSuggestionsForRun(runId, patterns) {
  const { pool } = await import("../config/db.js");
  const client = await pool.connect();
  try {
    const titles = await getRunTitles(client, runId);
    const changes = previewPatternEffect(patterns, titles);
    return { runId, requestedPatterns: patterns, changes };
  } finally {
    client.release();
  }
}

function uniqueCleanedPatterns(patterns) {
  return [...new Map(
    patterns
      .map((pattern) => compactWhitespace(pattern))
      .filter(Boolean)
      .map((pattern) => [normalizePatternValue(pattern), pattern])
  ).values()];
}

export async function addPatternsToStringDelPatterns(patterns) {
  const cleaned = uniqueCleanedPatterns(patterns);

  const { pool } = await import("../config/db.js");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await getExistingPatterns(client);
    const existingNormalized = normalizeRowsToPatternValues(existing, ["st_string_delete"]);
    const keepPatterns = await getExistingKeepPatterns(client);
    const keepNormalized = normalizeRowsToPatternValues(keepPatterns, ["skp_pattern", "skp_pattern_normalized"]);
    const inserted = [];
    const skippedExisting = [];
    const skippedKeep = [];

    for (const pattern of cleaned) {
      const normalized = normalizePatternValue(pattern);
      if (keepNormalized.has(normalized)) {
        skippedKeep.push(pattern);
        continue;
      }
      if (existingNormalized.has(normalized)) {
        skippedExisting.push(pattern);
        continue;
      }
      const result = await client.query(
        `
        INSERT INTO public.string_del_patterns (st_string_delete)
        VALUES ($1)
        RETURNING st_key, st_string_delete
        `,
        [pattern]
      );
      inserted.push(result.rows[0]);
      existingNormalized.add(normalized);
    }

    await client.query("COMMIT");
    return { inserted, skippedExisting, skippedKeep };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function addPatternsToStringKeepPatterns(patterns, description = null) {
  const cleaned = uniqueCleanedPatterns(patterns);

  const { pool } = await import("../config/db.js");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await getExistingKeepPatterns(client);
    const existingNormalized = normalizeRowsToPatternValues(existing, ["skp_pattern", "skp_pattern_normalized"]);
    const inserted = [];
    const skippedExisting = [];

    for (const pattern of cleaned) {
      const normalized = normalizePatternValue(pattern);
      if (existingNormalized.has(normalized)) {
        skippedExisting.push(pattern);
        continue;
      }
      const result = await client.query(
        `
        INSERT INTO public.string_keep_patterns (skp_pattern, skp_pattern_normalized, skp_description)
        VALUES ($1, $2, $3)
        ON CONFLICT (skp_pattern_normalized) DO NOTHING
        RETURNING skp_key, skp_pattern, skp_pattern_normalized, skp_description
        `,
        [pattern, normalized, description || "Toegevoegd vanuit Pattern suggesties"]
      );
      if (result.rows[0]) {
        inserted.push(result.rows[0]);
        existingNormalized.add(normalized);
      } else {
        skippedExisting.push(pattern);
      }
    }

    await client.query("COMMIT");
    return { inserted, skippedExisting };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function summarizeImportPatternCandidates(titles, keepPatterns = []) {
  const candidates = [];
  for (const title of titles) {
    candidates.push(...discoverPatternsForTitle(title));
  }
  const suggestions = groupPatternCandidates(candidates, [], keepPatterns);
  const suppressedKeepPatterns = suggestions.suppressedKeep || [];
  return {
    candidateGroups: suggestions.length,
    candidateOccurrences: suggestions.reduce((sum, item) => sum + item.count, 0),
    suppressedKeepPatterns: suppressedKeepPatterns.length,
    topSuggestions: suggestions.slice(0, 5).map((item) => ({
      canonicalLabel: item.canonicalLabel,
      count: item.count,
      variants: item.variants.map((variant) => variant.pattern)
    }))
  };
}
