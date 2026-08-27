// lib/assets.ts
// Serves gated documents via short-lived signed URLs (Vercel Blob)
// instead of static public files.

import { head } from '@vercel/blob';

export async function getSignedAssetUrl(storageKey: string): Promise<string> {
  const blob = await head(storageKey);
  if (!blob) {
    throw new Error(`Asset not found: ${storageKey}`);
  }
  return blob.url;
}

export interface DevelopmentAssetRow {
  id: string;
  asset_type: 'site_plan' | 'floor_plan' | 'pricing_sheet';
  label: string;
  storage_key: string;
}

export async function resolveAssetUrls(assets: DevelopmentAssetRow[]) {
  return Promise.all(
    assets.map(async (asset) => ({
      id: asset.id,
      type: asset.asset_type,
      label: asset.label,
      url: await getSignedAssetUrl(asset.storage_key),
    }))
  );
}
