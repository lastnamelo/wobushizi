# 我不识字

A minimal, cozy web app for pasting Chinese text, color-coding characters by HSK level, and logging known/study characters to Supabase.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `@supabase/supabase-js`
- Local dictionary at `/data/hanzidb.json`

## Current Mode

The app is currently in **temporary local guest mode** (no sign-in screen), using `localStorage` for character state while you build UI/features.

When you want to switch back to Supabase Auth + RLS, re-enable the auth-backed data flow in the page files.

## Setup

1. Create a Supabase project.
2. In Supabase dashboard, enable **Email OTP / magic link** auth provider.
3. In SQL editor, run the schema:
   - File: `/Users/lastnamelo/wobushizi.com/sql/schema.sql`
4. Copy env template and fill values:

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- `/` Home (Load & Log)
  - Paste text, load clickable rendered Hanzi, toggle selection
  - Log event writes to `log_events`, `log_event_items`, and `character_states`
  - Shows event result tables: new known vs queued study
- `/bank`
  - Tabs: Character Bank (known), Study Bank (study)
  - Search, sort, one-click move between known/study
- `/master`
  - Full local dictionary browser with filters (status/HSK/search)
  - Set known/study for any character

## Data Notes

- Dictionary map is loaded from `/Users/lastnamelo/wobushizi.com/data/hanzidb.json`.
- The included JSON is a small starter dataset. Replace with your full file as needed.
- Code is resilient to extra fields and missing optional metadata.

## Lazy Seeding Strategy

No global pre-seed of all characters is required.
Rows in `character_states` are created lazily on-demand when a user logs text or manually sets status in `/master` or `/bank`.

## RLS Summary

RLS is enabled on all app tables.
Policies only allow reads/writes where `user_id = auth.uid()` (or `profiles.id = auth.uid()`).

## Flashcards TODO (not implemented)

Suggested future tables:

```sql
create table flashcard_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table flashcards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references flashcard_sets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  character text not null,
  ease_factor numeric not null default 2.5,
  interval_days integer not null default 0,
  due_at timestamptz,
  created_at timestamptz not null default now()
);
```

## Key Files

- `/Users/lastnamelo/wobushizi.com/app/page.tsx`
- `/Users/lastnamelo/wobushizi.com/app/bank/page.tsx`
- `/Users/lastnamelo/wobushizi.com/app/master/page.tsx`
- `/Users/lastnamelo/wobushizi.com/components/TextLoader.tsx`
- `/Users/lastnamelo/wobushizi.com/lib/hanzidb.ts`
- `/Users/lastnamelo/wobushizi.com/sql/schema.sql`
