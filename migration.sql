-- Run this directly in Neon's SQL Editor (Console → SQL Editor → paste → Run).
-- This is the ONLY setup step needed for the database — no CLI, no
-- migration engine, nothing that can get stuck.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE developments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  builder VARCHAR(200),
  city VARCHAR(100),
  price_from NUMERIC(12,2),
  hero_image_url TEXT,
  blurb TEXT,
  status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE development_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id UUID NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL, -- 'site_plan' | 'floor_plan' | 'pricing_sheet'
  label VARCHAR(200) NOT NULL,
  storage_key TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE development_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id UUID NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  token VARCHAR(43) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  recipient_name VARCHAR(200) NOT NULL,
  recipient_email VARCHAR(320),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0
);

CREATE INDEX idx_dev_assets_dev_id ON development_assets(development_id);
CREATE INDEX idx_dev_links_token ON development_links(token);
CREATE INDEX idx_developments_slug ON developments(slug);

-- Klein Estates — real data from the materials you provided.
INSERT INTO developments (slug, name, builder, city, price_from, status, blurb, hero_image_url)
VALUES (
  'klein-estates',
  'Klein Estates',
  'Lindvest',
  'Vaughan',
  976900.00,
  'active',
  'The Townhome Collection by Lindvest — freehold Traditional and Dual Front towns at Teston Rd & Pine Valley Dr in Vaughan, from 1,739 to 2,777 sq.ft.',
  '/images/klein-estates/hero-kitchen.jpg'
);

INSERT INTO development_assets (development_id, asset_type, label, storage_key, sort_order)
SELECT id, 'site_plan', 'Site Plan', 'klein-estates/site-plan.webp', 0
FROM developments WHERE slug = 'klein-estates';

INSERT INTO development_assets (development_id, asset_type, label, storage_key, sort_order)
SELECT id, 'pricing_sheet', 'Freehold Inventory & Pricing', 'klein-estates/pricing-sheet.pdf', 1
FROM developments WHERE slug = 'klein-estates';

INSERT INTO development_assets (development_id, asset_type, label, storage_key, sort_order)
SELECT id, 'floor_plan', label, storage_key, sort_order
FROM developments,
(VALUES
  ('Cliff — 1,739 Sq.Ft., 3 Bed', 'klein-estates/floorplan-cliff.pdf', 2),
  ('Dale — 1,843 Sq.Ft., 3 Bed', 'klein-estates/floorplan-dale.pdf', 3),
  ('Lea — 2,015 Sq.Ft., 3 Bed', 'klein-estates/floorplan-lea.pdf', 4),
  ('Forest — 2,055 Sq.Ft., 3 Bed', 'klein-estates/floorplan-forest.pdf', 5),
  ('Valley — 2,135 Sq.Ft., 3 Bed', 'klein-estates/floorplan-valley.pdf', 6),
  ('Ridge — 2,777 Sq.Ft., 4 Bed', 'klein-estates/floorplan-ridge.pdf', 7)
) AS models(label, storage_key, sort_order)
WHERE slug = 'klein-estates';
