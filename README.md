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

UI Pages (/Users/lastnamelo/wobushizi.com/app)

  page.tsx: Home flow (paste text, load, log complete view).
  page.tsx: Known Bank + Study Bank page.
  page.tsx: Master List page.
  page.tsx: About page.
  page.tsx: Contact page.
  layout.tsx: Shared app shell used on all pages.
  globals.css: Global styles.
  route.ts: Download/export endpoint for master list.
  /Users/lastnamelo/wobushizi.com/app/.DS_Store: macOS metadata file (not app logic).

UI Components (/Users/lastnamelo/wobushizi.com/components)

  AuthGate.tsx: Login popup / auth gate logic in UI.
  BankQuickNav.tsx: Main toggle navigation (Home/Known/Study/Master).
  CharacterDetailModal.tsx: Character popup card.
  CharacterTable.tsx: Shared table used by banks/master (search/filter/sort/toggle).
  HskMiniPies.tsx: HSK pie-chart summary.
  Logo.tsx: Top logo.
  Milestone500Modal.tsx, Milestone1000Modal.tsx, Milestone2500Modal.tsx: milestone popups.
  ProgressBar.tsx: known-progress bar.
  TextLoader.tsx: colored clickable characters in loaded text view.
  TopRightTextNav.tsx: top-right links (About/Contact/Login).

App Logic / Data Helpers (/Users/lastnamelo/wobushizi.com/lib)

  localStore.ts: local persistence + read/write character states.
  stateCanonical.ts: canonical mapping logic (trad/simp treated as one base char where needed).
  hanzidb.ts: loads/queries your hanzi dataset.
  pinyin.ts: pinyin normalization/tokenization for search.
  cjk.ts: Chinese-character parsing helpers.
  hskCounts.ts: HSK count aggregation.
  hskStyles.ts: HSK color mapping.
  types.ts: shared TypeScript types.
  starterPassages.ts: starter passage cycle config.
  useDeviceCapabilities.ts: one hook for hover/coarse-pointer/iPad behavior.
  useMilestone500.ts: milestone trigger hooks (500/1000/2500).
  useSupabaseAuth.ts: auth session/sign-in helpers.
  supabaseClient.ts: Supabase client initialization.
  db.ts: DB-related helper layer.
  useHomePageState.ts: extracted state/actions for Home page.
  useMasterPageState.ts: extracted state/actions for Master page.
  lib/.DS_Store: macOS metadata.

Static Public Content (/Users/lastnamelo/wobushizi.com/public)

  wobushizi-logo.png: logo image.
  *.txt: editable starter passages users can auto-load.
  .DS_Store files: macOS metadata.

Dataset Files (/Users/lastnamelo/wobushizi.com/data)

  hanzidb.json: main dataset used by the app.
  hanzidb_enhanced.csv: editable/source-style dataset snapshot.

Database Schema (/Users/lastnamelo/wobushizi.com/sql)
  schema.sql: Supabase tables/RLS schema.

Scripts (/Users/lastnamelo/wobushizi.com/scripts)

  convert_hanzidb_csv.py: convert CSV data into app-usable JSON format.

CI / Automation (/Users/lastnamelo/wobushizi.com/.github)

  lint.yml: runs lint checks automatically on push/PR.

Root Config + Docs (wobushizi.com)

  package.json: project scripts + dependencies.
  package-lock.json: exact dependency versions.
  tsconfig.json: TypeScript settings.
  tailwind.config.ts, postcss.config.js: styling/build config.
  next.config.mjs, next-env.d.ts: Next.js config/types.
  .eslintrc.json: lint rules.
  .gitignore: files Git should ignore.
  .env.example: template env vars.
  .env.local: your local secrets/settings.
  README.md: setup/use docs.
  CHANGELOG.md: release history.
  CNAME: custom domain for GitHub Pages style setup.
  hanzidb.json (root): extra dataset copy (likely legacy/duplicate).
  index.html, .gitkeep, .DS_Store: misc/metadata.

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
