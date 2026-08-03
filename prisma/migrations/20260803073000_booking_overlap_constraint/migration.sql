CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "salonomia_appointment"
  ADD CONSTRAINT "salonomia_appointment_no_provider_overlap"
  EXCLUDE USING gist (
    "providerId" WITH =,
    tsrange("startsAt", "blockedEndTime", '[)') WITH &&
  ) WHERE ("status" IN ('PENDING', 'CONFIRMED', 'NEEDS_REASSIGNMENT'));
