# Curd

A mobile-first, independent cheese learning prototype. Serve `dist/` as static files, or run `node server.mjs` for local development. No build step.

Five original lessons, mistake review, XP, streaks and a tasting journal. Data is stored locally in the browser under `curd-v1`. The nine-topic curriculum map is inspired by the public Academy of Cheese Associate outline; this is not an official course or a complete exam preparation product.

Course outline: https://academyofcheese.org/study-cheese/associate/

Content: `dist/content.js`. UI and state: `dist/app.js`. Responsive styles: `dist/style.css`.

## GitHub Pages

`.github/workflows/pages.yml` publishes only `dist/` on pushes to `main` or manual dispatch. This `curd/` folder is the repository root. Enable Settings → Pages → Source → GitHub Actions before the first deployment. Relative asset URLs support project URLs such as `https://OWNER.github.io/curd-cheese-study/` without a build-time base path.

GitHub Pages is a separate deployment from the existing private Sites preview. Browser-local progress does not automatically transfer between their different origins.
