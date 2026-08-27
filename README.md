# Fallico Developments Portal (standalone)

Own repo, own database, own Vercel project — nothing shared with Infifu.
No Prisma — a direct Postgres connection instead, which avoids the
migration-engine issues we hit today entirely.

## Setup

1. **Push this to your new GitHub repo:**

   From inside this folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/ianmichaels416-cloud/Fallico-developments-portal.git
   git push -u origin main
   ```
   (adjust the URL if your repo name differs)

2. **Set up the database:** open your new Neon project's SQL Editor,
   paste the entire contents of `migration.sql`, and run it. This
   creates the three tables AND seeds real Klein Estates data in one
   step — no separate seed script needed, no CLI required.

3. **Upload assets:** everything in `assets-to-upload/` goes to Vercel
   Blob under the `klein-estates/` prefix, matching filenames exactly.

4. **Set environment variables in Vercel** (Project Settings → Environment Variables):
   - `DATABASE_URL` — your new Neon connection string
   - `BLOB_READ_WRITE_TOKEN` — from Vercel Blob storage setup
   - `ADMIN_PASSWORD` — a password for you/Frank/Anthony to use when
     generating links (this replaces relying on Infifu's login, since
     this app has none of its own)
   - `NEXT_PUBLIC_PORTAL_BASE_URL` — set to `https://plans.thefallicogroup.com`
     once that subdomain is pointed here (see step 6)

5. **Deploy** — Vercel should auto-deploy once you push to `main`.

6. **Point the subdomain:** in Vercel, add `plans.thefallicogroup.com`
   as a domain on *this* project (not infifu-leads). Get the CNAME
   value it gives you, and add that record with RealtyNinja (your
   current DNS host) or your registrar — same process as before, just
   pointing at this new project instead.

## Generating a link for someone

Visit `plans.thefallicogroup.com/developments/admin`, log in with the
`ADMIN_PASSWORD` you set, pick the development, enter a name (and
optional email), and copy the generated link to send.

## Adding the next development after Klein Estates

Insert a new row into `developments` and its `development_assets` rows
via the SQL Editor — same pattern as the Klein Estates seed at the
bottom of `migration.sql`. No code changes needed.
