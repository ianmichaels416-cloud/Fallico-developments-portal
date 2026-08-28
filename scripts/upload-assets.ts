// scripts/upload-assets.ts
// One-time script to upload the Klein Estates documents to Vercel Blob
// with the exact paths the app expects.
//
// Usage: npx tsx scripts/upload-assets.ts

import { put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { join } from 'path';

const ASSETS_DIR = join(process.cwd(), 'assets-to-upload');

const files = [
  'site-plan.webp',
  'pricing-sheet.pdf',
  'floorplan-cliff.pdf',
  'floorplan-dale.pdf',
  'floorplan-lea.pdf',
  'floorplan-forest.pdf',
  'floorplan-valley.pdf',
  'floorplan-ridge.pdf',
];

async function main() {
  for (const filename of files) {
    const filePath = join(ASSETS_DIR, filename);
    const fileBuffer = readFileSync(filePath);
    const blobPath = `klein-estates/${filename}`;

    const result = await put(blobPath, fileBuffer, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    console.log(`Uploaded ${blobPath} -> ${result.url}`);
  }
  console.log('\nAll files uploaded.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
