// app/page.tsx
// Root landing page for plans.thefallicogroup.com — logo plus a
// direct login link to the admin page for generating links.

import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function Home() {
  return (
    <main className={`min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-6 ${montserrat.className}`}>
      <img src="/images/logo-circle.png" alt="The Fallico Group" className="h-28 w-auto" />
      <a href="/developments/admin" className="bg-[#BA0000] text-white text-sm font-medium rounded px-6 py-3 hover:bg-[#a00000] transition-colors">
        Login
      </a>
    </main>
  );
}
