// app/developments/[slug]/page.tsx
// Standalone — its own repo, own database, own Vercel project.
// No form. A valid ?t=<token> recognizes the recipient and unlocks
// the assets directly.

import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { resolveAssetUrls } from '@/lib/assets';
import { Montserrat } from 'next/font/google';
import type { Metadata } from 'next';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '600', '700'] });

export const revalidate = 0;

async function getDevelopment(slug: string) {
  const rows = await sql`
    SELECT id, slug, name, builder, city, price_from, hero_image_url, blurb
    FROM developments WHERE slug = ${slug} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const development = await getDevelopment(slug);
  if (!development) return { title: 'The Fallico Group' };
  return {
    title: `${development.name} | The Fallico Group`,
    description: development.blurb ?? undefined,
    icons: { icon: [{ url: '/images/logo-circle.png', type: 'image/png' }] },
  };
}

export default async function DevelopmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t: token } = await searchParams;

  const development = await getDevelopment(slug);
  if (!development) {
    return (
      <main className="p-8 font-mono text-sm">
        <p>DEBUG: no development found.</p>
        <p>slug received: &quot;{slug}&quot; (length: {slug.length})</p>
      </main>
    );
  }

  let link = null;
  let assets: Awaited<ReturnType<typeof resolveAssetUrls>> = [];

  if (token) {
    const linkRows = await sql`
      SELECT id, recipient_name, first_viewed_at
      FROM development_links
      WHERE development_id = ${development.id} AND token = ${token}
      LIMIT 1
    `;
    link = linkRows[0] ?? null;

    if (link) {
      await sql`
        UPDATE development_links
        SET last_viewed_at = NOW(),
            first_viewed_at = COALESCE(first_viewed_at, NOW()),
            view_count = view_count + 1
        WHERE id = ${link.id}
      `;

      const assetRows = await sql`
        SELECT id, asset_type, label, storage_key
        FROM development_assets
        WHERE development_id = ${development.id}
        ORDER BY sort_order ASC
      `;
      assets = await resolveAssetUrls(assetRows as any);
    }
  }

  return (
    <main className={`min-h-screen bg-white text-black ${montserrat.className}`}>
      <header className="bg-black py-4 px-6 flex items-center justify-between">
        <img src="/images/logo-circle.png" alt="The Fallico Group" className="w-12 h-12" />
        <a href="https://www.thefallicogroup.com" className="text-white/70 text-sm hover:text-white">
          thefallicogroup.com
        </a>
      </header>

      <section className="relative">
        <img
          className="w-full h-[60vh] object-cover"
          src={development.hero_image_url ?? ''}
          alt={development.name}
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-8">
          <h1 className="text-white text-4xl md:text-5xl">{development.name}</h1>
          {development.builder && (
            <p className="text-white/80 mt-2">by {development.builder}</p>
          )}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-lg leading-relaxed">{development.blurb}</p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        {link ? (
          <div className="border-l-4 border-[#BA0000] rounded p-6 bg-black/[0.03]">
            <p className="font-medium mb-4">
              Hi {link.recipient_name}, here&apos;s everything for {development.name}:
            </p>
            <ul className="space-y-2">
              {assets.map((asset) => (
                <li key={asset.id}>
                  <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-[#BA0000] underline underline-offset-2 font-medium">
                    {asset.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="border rounded-lg p-6 bg-black/[0.03]">
            <p>
              This page is for people who&apos;ve requested information —
              reach out and we&apos;ll send you your own link with the full
              site plan, floor plans, and pricing.
            </p>
          </div>
        )}
      </section>

      <footer className="bg-black text-white/60 text-sm py-8 px-6 text-center">
        The Fallico Group · Harvey Kalles Real Estate Ltd.
      </footer>
    </main>
  );
}
