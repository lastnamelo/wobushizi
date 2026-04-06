# Changelog

All notable project changes are tracked here.

## 2026-04-06
- Reworked flashcard modal controls to separate navigation from face changes:
  - next/previous now rely on swipes or side arrows,
  - bottom tap zones flip `Front`/`Back`,
  - bottom taps from `Words` return to `Front`.
- Added mobile-friendly long-press/select behavior and made front/back card text selectable for copy workflows.
- Disabled auto-capitalization/autocorrect in word-definition inputs on the card.
- Changed modal keyboard/touch shortcuts:
  - `Up` and swipe-up now open `Words`,
  - hardware keyboard handling now focuses the modal card and listens on `document` for better iPad support.
- Slowed and widened flashcard side-transition motion and added a subtle tinted front face to better distinguish card changes.
- Removed the remaining white chart wrapper/background so the Progress chart now sits directly on the page.

## 2026-03-30
- Suppressed expected signed-out auth errors across Home/Bank/Master so the red `auth session missing` message no longer appears behind the login gate.
- Kept unexpected/runtime errors visible while filtering only pre-login session-missing noise.
- Patched canonical variant rows for common simplified merges:
  - `发` -> `發|髮`
  - `干` -> `乾|幹`
  - `后` -> `後|后`
  - `里` -> `裡|裏`
  - `只` -> `隻|只`
  - `面` -> `麵|面`

## 2026-03-05
- Fixed known/study/master count drift by deriving counts from the same normalized row snapshot used for table data.
- Reworked auth + local testing flow:
  - added localhost-only tester bypass support in data layer,
  - added invisible bypass trigger in auth modal,
  - suppressed noisy `auth session missing` UI errors,
  - prevented auth modal flicker during route changes.
- Cleaned auth/source-selection logic so `Login` explicitly disables local bypass before magic-link flow.
- Tuned toggle interaction and animation behavior across Bank and Master:
  - restored visible bank toggle motion with a short hold,
  - sped up shared table fade timing.
- Performance improvements for large tables and frequent navigation:
  - added in-memory character-state cache (local + per-user Supabase),
  - replaced full-fetch character verification path with targeted character reads.

## 2026-02-26
- Fixed HSK mini pie completion logic to use per-level denominators (full slice at level completion).
- Canonicalized HSK counting by simplified character to prevent variant double-counting.
- Updated Home/Bank/Master pie stats to count canonical known characters.
- Canonicalized character-state persistence and log aggregation to reduce duplicate known entries (e.g., `180/174`).
- Matched Master-list action toggle behavior to Bank with delayed fade/remove animation in filtered views.
- Added one-time per-user reconciliation for canonical character states (Supabase + local mode).
- Fixed Master-list status/toggle mapping to use canonical keys so toggles reliably move characters into Known.
- Hardened milestone popup behavior against first-load hydration race conditions.
- Reduced Trad/Alt filter circle size in Known, Study, and Master tables.
- Updated Load-page passage summary to show unique, known, to-study, and new-to-you counts.

## 2026-02-17
- Improved modal navigation, hover tooltips, milestone behavior, and data updates.

## 2026-02-18
- Updated starter passages to a simpler onboarding set and renamed files.
- Set starter cycle to three passages (Welcome, Tips, Chinese 101 Throwback).
- Refined starter passage labels with difficulty markers.
- Improved home textarea placeholder with clearer paste examples.
- Synced passage content updates and removed older starter passage files.

## 2026-03-31
- Reworked flashcard modal flow with side arrows, card-face cycling, and swipe navigation.
- Expanded quick-add word suggestions so logged known and study characters can both suggest passage words.
- Improved word-hint extraction and added Google Translate shortcuts from hint words and quick-add suggestions.
- Updated Progress page with cumulative chart styling changes, average words per week, and moved Reset Progress there.
- Tightened mobile viewport behavior and removed reset controls from About.

## 2026-03-31
- Refined flashcard modal to a Front/Back flow with words opened from the front card.
- Added side-arrow, swipe, wraparound, and keyboard navigation for modal study flow.
- Updated modal motion to use whole-card slide transitions instead of flip animation.
- Fixed Study table modal navigation so toggled characters can continue through a stable filtered snapshot.
- Improved quick-add word suggestions for traditional passages by matching against canonical characters.
- Restored a white card behind the Progress chart and switched the weekly metric to characters.
- Added directional card clicks and vertical mobile swipes for faster flashcard study actions.
- Simplified mobile bank/master chrome and smoothed the modal side-transition animation.
- Removed the top-right login control and kept only the persistent nav links.
- Tuned the modal staged slide timing to reduce swap flicker during card-to-card navigation.
- Improved Progress chart readability and trimmed duplicate client-side state work on Home/Progress.
- Disabled background scrolling while cards are open and removed mobile swipe-to-toggle behavior.
- Added a mobile-specific Progress chart layout and moved the weekly average metric above the chart.
- Removed the extra Progress card wrapper and let the chart own its white background.

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
