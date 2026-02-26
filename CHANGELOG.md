# Changelog

All notable project changes are tracked here.

## 2026-02-26
- Fixed HSK mini pie completion logic to use per-level denominators (full slice at level completion).
- Canonicalized HSK counting by simplified character to prevent variant double-counting.
- Updated Home/Bank/Master pie stats to count canonical known characters.
- Canonicalized character-state persistence and log aggregation to reduce duplicate known entries (e.g., `180/174`).

## 2026-02-17
- Improved modal navigation, hover tooltips, milestone behavior, and data updates.

## 2026-02-18
- Updated starter passages to a simpler onboarding set and renamed files.
- Set starter cycle to three passages (Welcome, Tips, Chinese 101 Throwback).
- Refined starter passage labels with difficulty markers.
- Improved home textarea placeholder with clearer paste examples.
- Synced passage content updates and removed older starter passage files.

## 2026-02-16
- Refined onboarding copy, tester bypass behavior, and login flow guidance.
- Required login flow updates and spam-folder guidance for auth email.
- Updated starter passage button wording and load-page UX flow.
- Fixed HSK pie charts so they reflect known-only distribution across pages.
- Adjusted Master character count placement.

## 2026-02-15
- Added starter passages and cycling flow.
- Added one-time milestone popups (500/1000/2500) and pinned table search.
- Added connected underline/word-hint updates.
- Restored table scrolling behavior on bank and master pages.

## 2026-02-14
- Added Supabase authentication and integration updates.
- Iterated top navigation login/logout behavior.
- Added tester/demo bypass path ("just poking around") and refined behavior.
- Updated About and Contact copy; simplified auth nav behavior.
- Tagged release `v2.2.0`.

## 2026-02-13
- Major UI + dataset updates (`v2.0.0`, `v2.1.0`).
- Added/iterated mobile experience (`v3.0.0`, `v3.1.0`).
- Refined mobile disclaimer, header placement, instruction sizing, and simplified mobile tables.

## 2026-02-12
- First app prototype commit ("first hack").
- Added demo-ready local mode, About page, and traditional-character support.
- Fixed Vercel build issue on `/bank` (search params prerender behavior).

## 2026-02-10
- Initialized repository.
- Added initial static page files.
- Added and updated `CNAME` repeatedly while configuring domain routing.
