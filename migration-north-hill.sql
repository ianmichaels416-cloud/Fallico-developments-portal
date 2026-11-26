-- Add the North Hill by Solmar development.
-- Run this directly in Neon's SQL Editor (Console → SQL Editor → paste → Run),
-- the same way migration.sql was run. Safe to re-run: the insert is a no-op
-- if the slug already exists.
--
-- Hero image ships in the repo at /public/images/north-hill/hero-rendering.webp,
-- so it is available after the next deploy — no Blob upload needed for the hero.
--
-- Gated documents (site plan, floor plans, pricing sheet) are NOT included yet:
-- once those PDFs exist, upload them to Blob under north-hill/… (see
-- scripts/upload-assets.ts) and INSERT matching rows into development_assets.

INSERT INTO developments (slug, name, builder, city, price_from, status, blurb, hero_image_url)
VALUES (
  'north-hill',
  'North Hill',
  'Solmar',
  'Bolton',
  789900.00,
  'active',
  'A new freehold townhome community by Solmar in Upper Bolton — nature-rich surroundings, modern home designs, and a connected location steps from trails, parks, and greenspace. Now selling from the high $700s.',
  '/images/north-hill/hero-rendering.webp'
)
ON CONFLICT (slug) DO NOTHING;
