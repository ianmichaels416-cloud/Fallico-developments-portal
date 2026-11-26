-- Multi-project "package" links.
-- Run this directly in Neon's SQL Editor (Console → SQL Editor → paste → Run),
-- the same way the other migrations were run. Safe to re-run.
--
-- A package link lets one recipient open several developments from a single
-- link (/package/<token>). Single-development links (development_links) are
-- unchanged and keep working.

CREATE TABLE IF NOT EXISTS client_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(43) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  recipient_name VARCHAR(200) NOT NULL,
  recipient_email VARCHAR(320),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS client_link_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_link_id UUID NOT NULL REFERENCES client_links(id) ON DELETE CASCADE,
  development_id UUID NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE (client_link_id, development_id)
);

CREATE INDEX IF NOT EXISTS idx_client_links_token ON client_links(token);
CREATE INDEX IF NOT EXISTS idx_client_link_items_link ON client_link_items(client_link_id);
