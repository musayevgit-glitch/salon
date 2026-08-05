-- CreateTable
CREATE TABLE "salonomia_provider_image" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salonomia_provider_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salonomia_provider_image_providerId_position_idx" ON "salonomia_provider_image"("providerId", "position");

-- AddForeignKey
ALTER TABLE "salonomia_provider_image" ADD CONSTRAINT "salonomia_provider_image_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "salonomia_provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration note:
-- Provider.imageUrl is kept as a lightweight "cover image" convenience field (used for
-- avatars/thumbnails and the booking picker) instead of being dropped. Every specialist's
-- full portfolio gallery (up to 10 photos) now lives in salonomia_provider_image, ordered by
-- "position". To avoid losing any photo that was already set, we backfill each existing
-- Provider.imageUrl into the gallery as position 0 (the cover photo becomes the first
-- gallery image); the application layer keeps them in sync afterwards.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "salonomia_provider_image" ("id", "providerId", "url", "position", "createdAt", "updatedAt")
SELECT substr(replace(gen_random_uuid()::text, '-', ''), 1, 25), "id", "imageUrl", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "salonomia_provider"
WHERE "imageUrl" IS NOT NULL;
