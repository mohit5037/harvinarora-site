# Harvin Arora - React Static Site

This is a fast, static React site for baby Harvin Arora built with Vite + TypeScript + Tailwind CSS (mobile-first).

## Local Development

```bash
cd harvinarora-site
npm install
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build
npm run preview
```

The static build is generated in `dist/`. Deploy the `dist/` folder to any static host.

## Authentication

- Admin default password: `harvin2025` (change it in Admin page)
- Admin can add/disable login IDs. Gallery is accessible only to logged-in IDs.
- This is client-side only and stores data locally in the browser for simplicity.

## Deployment

You can host `dist/` anywhere. Three easy options:

1) Netlify
- Build command: `npm run build`
- Publish directory: `dist`

2) Vercel
- Framework Preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

3) GitHub Pages
- Build: `npm run build`
- Deploy the `dist/` folder to `gh-pages` branch (or use an action).

## Customize

- Replace `public/baby.jpg` with the real profile photo (`/public/baby.jpg` path is used).
- Add real images/videos under `public/gallery/`.
- Update Home details in `src/pages/Home.tsx`.

## Supabase Setup

1) Environment variables (create `.env.local` in project root):
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

2) Create table for guest IDs:
```sql
create table if not exists public.guest_ids (
  id text primary key,
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);
```

3) Row Level Security:
```sql
alter table public.guest_ids enable row level security;
create policy "allow reads for all" on public.guest_ids
for select using (true);
create policy "allow admin writes" on public.guest_ids
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
```
This policy lets anyone read IDs (so the app can validate guests) and only authenticated users (admin) modify IDs.

4) Storage bucket for gallery:
- Create bucket named `gallery` and make it Public.
- Upload images into the root of the bucket.
- The app lists from this bucket and displays public URLs.

5) YouTube links (optional videos)
```sql
create table if not exists public.youtube_links (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  title text,
  created_at timestamptz not null default now()
);

alter table public.youtube_links enable row level security;

-- Reset policies if needed
drop policy if exists "youtube select for all" on public.youtube_links;
drop policy if exists "youtube insert for admins" on public.youtube_links;
drop policy if exists "youtube update for admins" on public.youtube_links;
drop policy if exists "youtube delete for admins" on public.youtube_links;

create policy "youtube select for all"
on public.youtube_links for select using (true);

create policy "youtube insert for admins"
on public.youtube_links for insert with check (auth.role() = 'authenticated');

create policy "youtube update for admins"
on public.youtube_links for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "youtube delete for admins"
on public.youtube_links for delete using (auth.role() = 'authenticated');
```
Admin can add/remove YouTube URLs in the Admin page; Gallery shows YouTube thumbnails automatically.

If you created the table earlier without `title`, add it:
```sql
alter table public.youtube_links add column if not exists title text;
```

Note: We no longer fetch or store the YouTube published date; only titles are used.

5) Admin account:
- In Supabase Auth, create an admin user (email/password).
- Use those credentials on the site’s Login page under “Admin Login”.

6) Local dev
```bash
cp .env.local.example .env.local  # if you maintain an example
npm run dev
```

