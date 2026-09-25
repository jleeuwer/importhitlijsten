-- 2026-02-15
-- Enforce that hitlijsten.fd_key is always present and points to an existing file_details row.
--
-- IMPORTANT:
-- 1) If you already have rows in hitlijsten with fd_key NULL, you must fix them first.
-- 2) Run this in a maintenance window.

BEGIN;

-- 1) Ensure column is NOT NULL
ALTER TABLE public.hitlijsten
  ALTER COLUMN fd_key SET NOT NULL;

-- 2) Add FK to file_details
ALTER TABLE public.hitlijsten
  ADD CONSTRAINT hitlijsten_fd_key_fkey
  FOREIGN KEY (fd_key)
  REFERENCES public.file_details (fd_key)
  ON UPDATE NO ACTION
  ON DELETE NO ACTION;

COMMIT;
