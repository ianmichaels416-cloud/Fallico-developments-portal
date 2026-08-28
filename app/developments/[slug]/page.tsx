// app/developments/[slug]/page.tsx
// Standalone — its own repo, own database, own Vercel project.
// No form. A valid ?t=<token> recognizes the recipient and unlocks
// the assets directly.

import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { resolveAssetUrls } from '@/lib/assets';
import { Montserrat } from 'next/font/google';
import type { Metadata } from 'next';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

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

function AssetIcon({ type }: { type: string }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'site_plan') {
    return (
      <svg {...common}>
        <path d="M3 8l6-3 6 3 6-3v13l-6 3-6-3-6 3V8z" />
        <path d="M9 5v13M15 8v13" />
      </svg>
    );
  }
  if (type === 'floor_plan') {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="1" />
        <path d="M3 12h11M14 4v16" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M20.5 12.5L12 21l-9-9V4h8l9.5 8.5z" />
      <circle cx="7.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SocialIcon({ platform }: { platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'website' }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (platform === 'instagram') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (platform === 'facebook') {
    return (
      <svg {...common}>
        <path d="M15 4h-2a4 4 0 0 0-4 4v3H6v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V4z" />
      </svg>
    );
  }
  if (platform === 'tiktok') {
    return (
      <svg {...common}>
        <path d="M14 4v11a3 3 0 1 1-3-3" />
        <path d="M14 4a5 5 0 0 0 5 5" />
      </svg>
    );
  }
  if (platform === 'youtube') {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="12" rx="3" />
        <path d="M11 10l4 2-4 2v-4z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
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

  const socialLinks = [
    { platform: 'instagram' as const, url: 'https://www.instagram.com/thefallicogroup' },
    { platform: 'tiktok' as const, url: 'https://www.tiktok.com/@thefallicogroup' },
    { platform: 'facebook' as const, url: 'https://www.facebook.com/p/The-Fallico-Group-RE-61588560275233/' },
    { platform: 'youtube' as const, url: 'https://www.youtube.com/@thefallicogroup' },
  ];

  return (
    <main className={`min-h-screen bg-white text-black ${montserrat.className}`}>
      <header className="bg-black py-3 px-6 flex items-center justify-center">
        <a href="https://www.thefallicogroup.com" aria-label="The Fallico Group">
          <img src="/images/logo-circle.png" alt="The Fallico Group" className="h-20 md:h-24 w-auto" />
        </a>
      </header>

      <section className="relative h-[85vh] md:h-[92vh] overflow-hidden">
        <img
          className="w-full h-full object-cover"
          src={development.hero_image_url ?? ''}
          alt={development.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-10 pb-10 md:pb-14">
          <div className="max-w-4xl">
            {development.price_from && (
              <span className="inline-block bg-[#BA0000] text-white text-xs md:text-sm font-semibold tracking-wide uppercase px-3 py-1.5 rounded-sm mb-4">
                From ${Number(development.price_from).toLocaleString()}
              </span>
            )}
            <h1 className="text-white text-4xl md:text-6xl font-semibold leading-[1.05]">
              {development.name}
            </h1>
            <div className="flex items-center gap-3 mt-4">
              {development.builder && (
                <div className="flex items-center gap-2 bg-white/95 rounded-md pl-3 pr-3 py-1.5">
                  <span className="text-black/50 text-[11px] uppercase tracking-wide">Built by</span>
                  <img
                    src="/images/lindvest.png"
                    alt={development.builder}
                    className="h-4 md:h-[18px] w-auto object-contain"
                  />
                </div>
              )}
              {development.city && (
                <span className="text-white/70 text-sm">{development.city}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 md:px-0 py-14 md:py-16">
        <div className="flex gap-5">
          <div className="w-1 bg-[#BA0000] rounded-full flex-shrink-0" />
          <p className="text-lg md:text-xl leading-relaxed text-black/80">{development.blurb}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 md:px-0 pb-20 md:pb-24">
        {link ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#BA0000] mb-1">
              Your package
            </p>
            <h2 className="text-2xl font-semibold mb-6">
              Hi {link.recipient_name}, here&apos;s everything for {development.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {assets.map((asset) => (
                <a key={asset.id} href={asset.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-lg border border-black/10 p-4 hover:border-[#BA0000]/40 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-black/[0.04] group-hover:bg-[#BA0000]/10 flex items-center justify-center text-black/60 group-hover:text-[#BA0000] transition-colors">
                    <AssetIcon type={asset.type} />
                  </span>
                  <span className="font-medium text-sm md:text-base">{asset.label}</span>
                  <span className="ml-auto text-black/30 group-hover:text-[#BA0000] transition-colors text-sm">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </>
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

      <footer className="bg-black text-white py-12 px-6">
        <div className="max-w-md mx-auto flex flex-col items-center text-center gap-4">
          <img src="/images/logo-circle.png" alt="The Fallico Group" className="h-20 w-auto" />
          <div>
            <p className="text-[#BA0000] text-xs font-semibold uppercase tracking-wide mb-2">
              Contact Us
            </p>
            <p className="font-semibold">Frank Fallico</p>
            <p className="text-white/70 text-sm mt-1">416-899-5655</p>
            <p className="text-white/70 text-sm">info@thefallicogroup.com</p>
          </div>
          <div className="flex items-center gap-4 mt-2">
            {socialLinks.map((social) => (
              <a key={social.platform} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.platform} className="text-white/60 hover:text-white transition-colors">
                <SocialIcon platform={social.platform} />
              </a>
            ))}
            <a href="https://www.thefallicogroup.com" target="_blank" rel="noopener noreferrer" aria-label="Website" className="text-white/60 hover:text-white transition-colors">
              <SocialIcon platform="website" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
