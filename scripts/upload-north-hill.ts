// scripts/upload-north-hill.ts
// Upload the North Hill broker documents to Vercel Blob with the exact
// paths the app expects (storage_key in development_assets must match).
//
// Usage: set -a; source .env.local; set +a; npx tsx scripts/upload-north-hill.ts

import { put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { join } from 'path';

const ASSETS_DIR = join(process.cwd(), 'assets-to-upload', 'north-hill');

const files = [
  'site-plan.pdf',
  'price-list.pdf',
  'home-designs-floor-plans.pdf',
  'community-brochure.pdf',
];

async function main() {
  for (const filename of files) {
    const filePath = join(ASSETS_DIR, filename);
    const fileBuffer = readFileSync(filePath);
    const blobPath = `north-hill/${filename}`;

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
