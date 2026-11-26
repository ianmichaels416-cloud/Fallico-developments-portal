// app/developments/admin/page.tsx
// Protected by middleware.ts (shared password). Any teammate who has
// the password can generate a link for someone who's requested info.
//
// Pick ONE development → a single-development link (/developments/<slug>?t=…).
// Pick TWO OR MORE → a multi-project "package" link (/package/<token>) that
// opens all of them from one link.

import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import CopyLinkButton from './CopyLinkButton';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

async function createLink(formData: FormData) {
  'use server';

  const slugs = formData.getAll('slugs').map((s) => String(s)).filter(Boolean);
  const recipientName = formData.get('recipientName') as string;
  const recipientEmail = (formData.get('recipientEmail') as string) || null;

  let redirectUrl: string;
  try {
    if (slugs.length === 0) {
      throw new Error('Select at least one development.');
    }

    if (slugs.length === 1) {
      // Single-development link — unchanged behavior.
      const devRows = await sql`SELECT id FROM developments WHERE slug = ${slugs[0]} LIMIT 1`;
      const development = devRows[0];
      if (!development) throw new Error(`Unknown development: ${slugs[0]}`);

      const linkRows = await sql`
        INSERT INTO development_links (development_id, recipient_name, recipient_email)
        VALUES (${development.id}, ${recipientName}, ${recipientEmail})
        RETURNING token
      `;
      const params = new URLSearchParams({
        created: linkRows[0].token,
        kind: 'single',
        slug: slugs[0],
        name: recipientName,
      });
      if (recipientEmail) params.set('email', recipientEmail);
      redirectUrl = `/developments/admin?${params.toString()}`;
    } else {
      // Multi-project package link.
      const devRows = await sql`SELECT id, slug FROM developments WHERE slug = ANY(${slugs})`;
      const idBySlug = new Map(devRows.map((d: any) => [d.slug, d.id]));
      const missing = slugs.filter((s) => !idBySlug.has(s));
      if (missing.length) throw new Error(`Unknown development(s): ${missing.join(', ')}`);

      const linkRows = await sql`
        INSERT INTO client_links (recipient_name, recipient_email)
        VALUES (${recipientName}, ${recipientEmail})
        RETURNING id, token
      `;
      const clientLinkId = linkRows[0].id;

      const items = slugs.map((slug, i) => ({
        client_link_id: clientLinkId,
        development_id: idBySlug.get(slug),
        sort_order: i,
      }));
      await sql`INSERT INTO client_link_items ${sql(items, 'client_link_id', 'development_id', 'sort_order')}`;

      const params = new URLSearchParams({
        created: linkRows[0].token,
        kind: 'package',
        name: recipientName,
      });
      if (recipientEmail) params.set('email', recipientEmail);
      redirectUrl = `/developments/admin?${params.toString()}`;
    }
  } catch (err: any) {
    const message = encodeURIComponent(err?.message ?? String(err));
    redirect(`/developments/admin?error=${message}`);
  }

  redirect(redirectUrl);
}

export default async function DevelopmentAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; kind?: string; slug?: string; error?: string; name?: string; email?: string }>;
}) {
  const { created, kind, slug: slugParam, error, name, email } = await searchParams;

  const developments = await sql`SELECT id, slug, name FROM developments ORDER BY created_at DESC`;

  const baseUrl = process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'https://plans.thefallicogroup.com';

  const isPackage = kind === 'package';

  // Projects included in a package link, for the confirmation + email.
  let packageDevelopments: { name: string }[] = [];
  if (created && isPackage) {
    packageDevelopments = (await sql`
      SELECT d.name
      FROM client_links cl
      JOIN client_link_items cli ON cli.client_link_id = cl.id
      JOIN developments d ON d.id = cli.development_id
      WHERE cl.token = ${created}
      ORDER BY cli.sort_order ASC
    `) as any;
  }

  const generatedUrl = created
    ? isPackage
      ? `${baseUrl}/package/${created}`
      : slugParam
        ? `${baseUrl}/developments/${slugParam}?t=${created}`
        : null
    : null;

  let mailtoUrl: string | null = null;
  if (generatedUrl && email) {
    if (isPackage) {
      const projectList = packageDevelopments.map((d) => d.name).join(', ');
      const subject = 'Your Project Portfolio — The Fallico Group';
      const body =
        `Hi ${name || 'there'},\n\n` +
        `Here's your personal link with site plans, floor plans, and pricing for the projects we discussed` +
        `${projectList ? ` (${projectList})` : ''}:\n\n${generatedUrl}\n\n` +
        `Let me know if you have any questions.\n\nFrank Fallico\nThe Fallico Group`;
      mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      const developmentName = developments.find((d: any) => d.slug === slugParam)?.name ?? 'the development';
      const subject = `${developmentName} — Site Plan, Floor Plans & Pricing`;
      const body =
        `Hi ${name || 'there'},\n\n` +
        `Here's your link with the full site plan, floor plans, and pricing for ${developmentName}:\n\n` +
        `${generatedUrl}\n\nLet me know if you have any questions.\n\nFrank Fallico\nThe Fallico Group`;
      mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  }

  return (
    <main className={`max-w-xl mx-auto px-6 py-12 ${montserrat.className}`}>
      <h1 className="text-2xl mb-2">Send Development Info</h1>
      <p className="text-black/60 mb-8">
        Generate a personal link with site plan, floor plans, and pricing for
        someone who&apos;s requested info. Pick one project for a single link,
        or several for one link that covers them all.
      </p>

      {error && (
        <div className="border-l-4 border-red-600 rounded p-4 bg-red-50 mb-8">
          <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
          <code className="text-sm text-red-800 break-all">{decodeURIComponent(error)}</code>
        </div>
      )}

      {generatedUrl && (
        <div className="border-l-4 border-[#BA0000] rounded p-4 bg-black/[0.03] mb-8">
          <p className="text-sm text-black/60 mb-2">
            {isPackage ? 'Multi-project link ready to send:' : 'Link ready to send:'}
          </p>
          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 text-sm break-all">{generatedUrl}</code>
            <CopyLinkButton url={generatedUrl} />
          </div>
          {isPackage && packageDevelopments.length > 0 && (
            <p className="text-xs text-black/50 mb-3">
              Includes: {packageDevelopments.map((d) => d.name).join(', ')}
            </p>
          )}
          {mailtoUrl ? (
            <a href={mailtoUrl} className="inline-block bg-[#BA0000] text-white text-sm rounded px-4 py-2 font-medium">
              Email this link to {email}
            </a>
          ) : (
            <p className="text-xs text-black/40">
              No email was entered — copy the link above to send it manually.
            </p>
          )}
        </div>
      )}

      <form action={createLink} className="space-y-4">
        <fieldset>
          <legend className="block text-sm font-medium mb-2">
            Developments <span className="text-black/40">(select one or more)</span>
          </legend>
          <div className="space-y-1 border rounded px-4 py-3">
            {developments.map((d: any) => (
              <label key={d.id} className="flex items-center gap-3 py-1.5 cursor-pointer">
                <input type="checkbox" name="slugs" value={d.slug} className="w-4 h-4 accent-[#BA0000]" />
                <span>{d.name}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-black/40 mt-1">
            Pick two or more to create a single multi-project link.
          </p>
        </fieldset>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="recipientName" required className="w-full border rounded px-4 py-3" placeholder="John Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-black/40">(optional — lets you email the link with one click)</span>
          </label>
          <input name="recipientEmail" type="email" className="w-full border rounded px-4 py-3" placeholder="john@email.com" />
        </div>
        <button type="submit" className="bg-[#BA0000] text-white rounded px-6 py-3 font-medium">
          Generate Link
        </button>
      </form>
    </main>
  );
}
