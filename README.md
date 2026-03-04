# 我不识字

A lightweight Chinese reading companion that helps you log recognized characters over time.

Core idea:
- Paste Chinese text
- Review character-by-character
- Keep a Known/Study bank
- Track progress toward a 2,500-character literacy benchmark

## What The App Does Now

- Home (`/`)
  - Paste text or load a starter passage
  - Parse unique Chinese characters from the passage
  - Show Load view with HSK-colored characters
  - Toggle each character as known/study for this log event
  - Optional word-hint underlines
  - Log Complete view with two lists: `new known` and `added to study`

- Bank (`/bank`)
  - Known Bank + Study Bank toggle
  - Shared searchable/sortable/filterable table
  - One-click status toggle (`known` <-> `study`)
  - Character detail modal on row click

- Master (`/master`)
  - Full dictionary-backed table
  - Status, HSK, trad/alt, and sort controls
  - Set any character to known/study

- About (`/about`)
  - Project origin text
  - Reset progress action

- Contact (`/contact`)
  - Contact information and data-patch notes

## Auth + Persistence

The app supports two modes automatically:

1. Supabase mode (recommended)
- If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present, users see an email magic-link gate.
- Progress is stored per authenticated user in Supabase.

2. Local fallback mode
- If env vars are missing, or no auth session exists, the app falls back to browser `localStorage`.
- This is useful for demo/testing but not portable across browsers/devices.

Tester bypass:
- In the auth modal, tapping the invisible top-left hotspot 5 times enables a 24-hour local bypass for testing.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `@supabase/supabase-js`
- Local dictionary data: `/Users/lastnamelo/wobushizi.com/data/hanzidb.json`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure env vars:

```bash
cp .env.example .env.local
```

Add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Create Supabase tables/policies:
- Run `/Users/lastnamelo/wobushizi.com/sql/schema.sql` in Supabase SQL Editor.

4. Start dev server:

```bash
npm run dev
```

5. Build check:

```bash
npm run build
```

## Data Files

- Main runtime dataset:
  - `/Users/lastnamelo/wobushizi.com/data/hanzidb.json`
- Editable/source-like dataset:
  - `/Users/lastnamelo/wobushizi.com/data/hanzidb_enhanced.csv`
- CSV -> JSON conversion script:
  - `/Users/lastnamelo/wobushizi.com/scripts/convert_hanzidb_csv.py`

Example conversion:

```bash
python3 /Users/lastnamelo/wobushizi.com/scripts/convert_hanzidb_csv.py \
  --input /Users/lastnamelo/wobushizi.com/data/hanzidb_enhanced.csv \
  --output-json /Users/lastnamelo/wobushizi.com/data/hanzidb.json \
  --output-csv /Users/lastnamelo/wobushizi.com/data/hanzidb_enhanced.csv
```

## File Map (Beginner-Friendly)

Current project file categories (excluding `node_modules`, `.next`, `.git`):

- UI pages/routes (`/app`): 9
  - Screen-level routes (`home`, `bank`, `master`, `about`, `contact`)

- UI components (`/components`): 12
  - Reusable visual blocks (table, logo, progress bar, modals, nav)

- App logic/hooks/helpers (`/lib`): 17
  - Data logic, parsing, local storage, Supabase bridge, shared hooks

- Static assets/content (`/public`): 6
  - Logo and starter passage `.txt` files

- Dataset files (`/data`): 2
  - Hanzi source/runtime datasets

- SQL schema (`/sql`): 1
  - Supabase schema and RLS setup

- Utility scripts (`/scripts`): 1
  - CSV/JSON conversion tooling

- CI workflow (`/.github/workflows`): 1
  - GitHub Actions lint check

- Root config/docs files: 18
  - `package.json`, `tsconfig`, `tailwind`, `README`, `CHANGELOG`, etc.

## Quality Checks

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

CI:
- Lint runs on push/PR via `/Users/lastnamelo/wobushizi.com/.github/workflows/lint.yml`.

## Notes

- The app canonicalizes simplified/traditional variants for status tracking so counts remain stable.
- Search is character + pinyin focused (not definition-driven fuzzy search).
- Starter passages are editable text files in `/Users/lastnamelo/wobushizi.com/public/starter-passages/`.
