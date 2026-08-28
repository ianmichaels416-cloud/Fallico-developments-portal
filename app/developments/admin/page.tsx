// app/developments/admin/page.tsx
// Protected by middleware.ts (shared password). Any teammate who has
// the password can generate a link for someone who's requested info.

import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import CopyLinkButton from './CopyLinkButton';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '600', '700'] });

async function createLink(formData: FormData) {
  'use server';

  const slug = formData.get('slug') as string;
  const recipientName = formData.get('recipientName') as string;
  const recipientEmail = formData.get('recipientEmail') as string;

  let token: string;
  try {
    const devRows = await sql`SELECT id FROM developments WHERE slug = ${slug} LIMIT 1`;
    const development = devRows[0];
    if (!development) throw new Error(`Unknown development: ${slug}`);

    const linkRows = await sql`
      INSERT INTO development_links (development_id, recipient_name, recipient_email)
      VALUES (${development.id}, ${recipientName}, ${recipientEmail || null})
      RETURNING token
    `;
    token = linkRows[0].token;
  } catch (err: any) {
    const message = encodeURIComponent(err?.message ?? String(err));
    redirect(`/developments/admin?error=${message}`);
  }

  redirect(`/developments/admin?created=${token}&slug=${slug}`);
}

export default async function DevelopmentAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; slug?: string; error?: string }>;
}) {
  const { created, slug: slugParam, error } = await searchParams;

  const developments = await sql`SELECT id, slug, name FROM developments ORDER BY created_at DESC`;

  const baseUrl = process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'https://plans.thefallicogroup.com';
  const generatedUrl = created && slugParam ? `${baseUrl}/developments/${slugParam}?t=${created}` : null;

  return (
    <main className={`max-w-xl mx-auto px-6 py-12 ${montserrat.className}`}>
      <h1 className="text-2xl mb-2">Send Development Info</h1>
      <p className="text-black/60 mb-8">
        Generate a personal link with site plan, floor plans, and pricing
        for someone who&apos;s requested info.
      </p>

      {error && (
        <div className="border-l-4 border-red-600 rounded p-4 bg-red-50 mb-8">
          <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
          <code className="text-sm text-red-800 break-all">{decodeURIComponent(error)}</code>
        </div>
      )}

      {generatedUrl && (
        <div className="border-l-4 border-[#BA0000] rounded p-4 bg-black/[0.03] mb-8">
          <p className="text-sm text-black/60 mb-2">Link ready to send:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm break-all">{generatedUrl}</code>
            <CopyLinkButton url={generatedUrl} />
          </div>
        </div>
      )}

      <form action={createLink} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Development</label>
          <select name="slug" required className="w-full border rounded px-4 py-3">
            {developments.map((d: any) => (
              <option key={d.id} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="recipientName" required className="w-full border rounded px-4 py-3" placeholder="John Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-black/40">(optional)</span>
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
