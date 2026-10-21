# Curd

Live app: https://mattsimiele.github.io/curd_study/

A mobile-friendly, independent cheese study app with 45 original lessons and 189 exercises across the nine subject areas in the public Academy of Cheese Associate outline.

## Learning experience

- Two selectable paths: 27 Foundations lessons and 18 applied CCP study lessons. Three reading cards, source references and six exercises in every applied lesson.
- Each path has a winding path and sequential unlocks within each unit. Each unit starts open.
- Single-answer, multiple-selection and ordered-step questions.
- Immediate explanations, optional lesson reminders, and repeat attempts for missed questions before completion.
- First-attempt accuracy, combos, unit completion, milestone badges, daily goal and streak.
- New lesson: 20 XP, plus 5 XP for a perfect first attempt. Replays and practice: 5 XP.
- Five-question mixed practice, saved mistake review and a tasting journal.

Existing browser progress remains under `curd-v1`; the original lesson and question indices are unchanged. Progress, XP and notes stay in this browser, without account sync. All nine subject areas have introductory practice, but this is not a complete certification course. The Academy's MPM and tasting models, full official 25-cheese list and exam material remain part of its official course.

## Development

Serve `dist/` as static files or run `npm run dev`. No build step. Run `npm run check` and `npm test` with Node.js. The rules test checks all 189 exercise definitions, exercise scoring, repeated mistakes, legacy progress tier navigation, answer shuffling and lesson selection.

`dist/content.js` contains foundations and assembles the course; `dist/advanced.js` contains applied content, domain mapping and references; `dist/learning.js` contains pure exercise and progress rules; `dist/app.js` contains UI and persistence; `dist/style.css` contains responsive styles.

Course outline: https://academyofcheese.org/study-cheese/associate/
Additional subject guides and primary sources are linked in each unit's About this course & sources panel. Foundations reference UK guidance; the advanced retail lessons explicitly scope FDA model-code examples to their applicable setting and local adoption. See [content provenance and note corrections](CONTENT_SOURCES.md).

## Publishing

`.github/workflows/pages.yml` publishes `dist/` on changes to that directory on `main`, or manual dispatch. Relative assets support the GitHub Pages project path. The private Sites preview is separate and is not automatically updated by this workflow.

### Cheese library — v0.4

Open **Cheeses** for 107 individual identification lessons and 12 comparison flights. Search by name (accents optional), milk or region, or filter by family. Every cheese has three study cards, four exercises, explanations and references. Comparison flights provide side-by-side tables and six exercises. Existing XP, notes and completions are preserved. Total: 164 lessons and 689 exercises.

Data authoring: edit `scripts/cheese-profiles.psv`, run `python3 scripts/build-cheeses.py`, then `npm run check && npm test`.

### Accounts and iPhone — v0.5 preparation

An account screen, email-code login client, append-only cloud progress queue, explicit guest import, and isolated user caches are implemented. Live sign-in requires a configured dedicated Supabase project; until then the app clearly reports setup in progress and retains guest mode. See `docs/ACCOUNTS.md` for schema, email delivery and release validation. iPhone Home Screen metadata, app icons and safe-area layout are included. This is an installable web app, not a native iOS binary.
