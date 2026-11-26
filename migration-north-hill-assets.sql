-- Attach North Hill's broker documents as gated assets.
-- The PDFs are already uploaded to Vercel Blob under north-hill/… .
-- Run this in Neon's SQL Editor. Safe to re-run: it resets North Hill's
-- asset list to exactly the rows below.

DELETE FROM development_assets
WHERE development_id = (SELECT id FROM developments WHERE slug = 'north-hill');

INSERT INTO development_assets (development_id, asset_type, label, storage_key, sort_order)
SELECT d.id, v.asset_type, v.label, v.storage_key, v.sort_order
FROM developments d,
(VALUES
  ('site_plan',     'Site Plan',                   'north-hill/site-plan.pdf',               0),
  ('pricing_sheet', 'Price List',                  'north-hill/price-list.pdf',              1),
  ('floor_plan',    'Home Designs & Floor Plans',  'north-hill/home-designs-floor-plans.pdf', 2),
  ('brochure',      'Community Brochure',          'north-hill/community-brochure.pdf',       3)
) AS v(asset_type, label, storage_key, sort_order)
WHERE d.slug = 'north-hill';
