// app/package/[token]/page.tsx
// A multi-project "package" link. One token unlocks several developments.
// Each card links into the existing per-development page, authorized by the
// same token. Package-level view tracking lives here so individual
// development opens don't inflate the count.

import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { Montserrat } from 'next/font/google';
import type { Metadata } from 'next';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const revalidate = 0;

async function getPackage(token: string) {
  const rows = await sql`
    SELECT id, recipient_name FROM client_links WHERE token = ${token} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Your Projects | The Fallico Group',
    icons: { icon: [{ url: '/images/logo-circle.png', type: 'image/png' }] },
  };
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

export default async function PackagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const pkg = await getPackage(token);
  if (!pkg) notFound();

  await sql`
    UPDATE client_links
    SET last_viewed_at = NOW(),
        first_viewed_at = COALESCE(first_viewed_at, NOW()),
        view_count = view_count + 1
    WHERE id = ${pkg.id}
  `;

  const developments = await sql`
    SELECT d.slug, d.name, d.builder, d.city, d.price_from, d.hero_image_url, d.blurb
    FROM client_link_items cli
    JOIN developments d ON d.id = cli.development_id
    WHERE cli.client_link_id = ${pkg.id}
    ORDER BY cli.sort_order ASC
  `;

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

      <section className="max-w-4xl mx-auto px-6 pt-12 md:pt-16 pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#BA0000] mb-2">Your projects</p>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
          Hi {pkg.recipient_name}, here are the projects we picked for you
        </h1>
        <p className="text-black/60 mt-3">
          Tap any project to view its site plan, floor plans, and pricing.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20 md:pb-24 grid sm:grid-cols-2 gap-5">
        {developments.map((d: any) => (
          <a
            key={d.slug}
            href={`/developments/${d.slug}?t=${token}`}
            className="group block rounded-xl overflow-hidden border border-black/10 hover:border-[#BA0000]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all bg-white"
          >
            <div className="relative h-48 overflow-hidden bg-black/[0.04]">
              {d.hero_image_url && (
                <img
                  src={d.hero_image_url}
                  alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              {d.price_from && (
                <span className="absolute top-3 left-3 bg-[#BA0000] text-white text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-sm">
                  From ${Number(d.price_from).toLocaleString()}
                </span>
              )}
            </div>
            <div className="p-5">
              <h2 className="text-xl font-semibold">{d.name}</h2>
              <p className="text-black/50 text-sm mt-0.5">
                {d.builder ? `Built by ${d.builder}` : ''}
                {d.builder && d.city ? ' · ' : ''}
                {d.city ?? ''}
              </p>
              {d.blurb && (
                <p className="text-black/70 text-sm mt-3 leading-relaxed line-clamp-3">{d.blurb}</p>
              )}
              <span className="inline-flex items-center gap-1 text-[#BA0000] text-sm font-medium mt-4">
                View details →
              </span>
            </div>
          </a>
        ))}
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
