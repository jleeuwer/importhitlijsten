-- Sprint 2H-S — Pattern discovery keep/remove classification
-- Adds a managed list of title-part patterns that must not be suggested as removable cleanup patterns.

CREATE TABLE IF NOT EXISTS public.string_keep_patterns (
  skp_key serial PRIMARY KEY,
  skp_pattern text NOT NULL,
  skp_pattern_normalized text NOT NULL,
  skp_description text,
  skp_created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT string_keep_patterns_pattern_normalized_uk UNIQUE (skp_pattern_normalized)
);

CREATE INDEX IF NOT EXISTS string_keep_patterns_pattern_normalized_idx
  ON public.string_keep_patterns (skp_pattern_normalized);

COMMENT ON TABLE public.string_keep_patterns IS
  'Niet-verwijderbare titelpatronen. Pattern discovery mag deze patronen niet als verwijderbaar voorstellen.';

COMMENT ON COLUMN public.string_keep_patterns.skp_pattern IS
  'Originele invoer zoals door de gebruiker vastgelegd, bijvoorbeeld (Are Made of This).';

COMMENT ON COLUMN public.string_keep_patterns.skp_pattern_normalized IS
  'Genormaliseerde vergelijkingswaarde: lowercase, getrimd, buitenste haakjes/brackets verwijderd.';
