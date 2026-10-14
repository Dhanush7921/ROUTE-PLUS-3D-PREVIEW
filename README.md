# ROUTE+ IMMERSIVE 3D

An independent, static nature and devotional travel preview. The working offline planner was copied read-only from `Dhanush7921/ROUTE-PLUS-PREVIEW/index.html`; the original repository and Windows directories were not edited. This version has its own palette, native WebGL scene, storage namespace, workflow and publishing helper.

## Start on your Windows computer

1. Extract the ZIP's `ROUTE-PLUS-3D-PREVIEW` folder into `C:\Users\Asus\Documents\ROUTE+`. If that new folder already exists, stop and keep it; do not overwrite it. Neither sibling preview nor production is used by the helper.
2. Open a terminal in `C:\Users\Asus\Documents\ROUTE+` and run `py -m http.server 8080` (or `python -m http.server 8080`).
3. Open `http://localhost:8080/ROUTE-PLUS-3D-PREVIEW/`. This tests the same project-prefix shape as GitHub Pages. A double-click is not the acceptance test.
4. Scroll through the landscape, choose a nature/devotional panel, or click Find my journey. Load Demo Journey and generate. All planning runs inside your browser.

Node.js 22+ is used only for checks and publishing preparation. No npm install or runtime package is required.

## Visual implementation

`assets/scene.js` builds a native WebGL scene: layered sculpted terrain, trees, an Indian-inspired temple with pillared hall and stepped shikhara, three falling-water ribbons, a pool, moving mist and a winding gold route. Lighting, noise-based surface variation, depth fog and highlights are evaluated by shaders. About 114,000 vertices are generated once and rendered in two geometry batches.

The scene is a stylized landscape illustration, not a photoreal geographic reconstruction. It is not navigation geometry or a screenshot of another website. Destination photographs/landscapes are illustrative.

Scroll moves the camera continuously through the opening section. Pointer movement adds subtle perspective. Glass panels select relevant interests in the actual planner. Editorial cards have tilt and gloss; text and panels have coordinated reveals. Motion pauses offscreen and when the document is hidden. A pause control and reduced-motion support are included. Pixel density is capped on mobile. WebGL failure leaves a bundled landscape fallback and the working planner.

## Preserved functionality

- Offline town lookup and road-network estimates.
- Origin, destination, traveller, interests and days.
- Corridor/phase discovery and transparent rule-based recommendations.
- Solid main route and dashed optional detours.
- Add, skip, remove, trip totals, duration warnings, Keep and Extend.
- Device-local saves using separate `route-plus-3d-*` keys.
- Explicit offline/estimate labels. No live traffic, Google Maps routing, account backend, API keys or server connection.

The public standalone frontend already contains dormant frontend account modules. This preview forces the offline provider and server detection returns null. No backend, database or user data was copied.

## Project files

- `index.html`: copied standalone application plus the new page sections. Its embedded modules retain their original `// ---- module/path` labels.
- `assets/scene.js`: native WebGL geometry, shaders and camera.
- `assets/immersive.js`: section reveals, preference panels and card interactions.
- `assets/immersive.css`: Royal Nature palette, responsive layouts and motion.
- `assets/landscape.jpg`: illustrative image extracted from the original standalone frontend.
- `tests/verify.mjs`: offline-engine and source checks.
- `scripts/check-public.mjs`: prohibited-file and common-credential scan.
- `scripts/package-pages.mjs`: copies only approved website files into `site/`.
- `.github/workflows/pages.yml`: only runs deployment for the exact new repository.
- `PUBLISH-3D-ONLY.ps1`: guarded first-publish helper for Windows.
- `SOURCE.json`: read-only baseline provenance.
- `REPORT.md`: actual checks and remaining blockers.

## Checks

```powershell
node tests/verify.mjs
node scripts/check-public.mjs
```

The first command checks bundled-script syntax, local resources, three offline journeys, route phases, discoveries, cumulative impact, extension, removal and storage. These are engine tests, not browser clicks. The second rejects common secret formats, databases, backend folders and symlinks. A clean scan is not a guarantee against every possible secret; review changed files before publication.

Before publishing, finish the browser checklist in REPORT.md, especially 390px width, keyboard navigation, refresh, asset requests and WebGL rendering on your device.

## Publish only the new preview

Install Git, Node.js 22+ and GitHub CLI if needed. Sign in with `gh auth login`, then run from this NEW folder:

```powershell
.\PUBLISH-3D-ONLY.ps1
```

The helper targets only `https://github.com/Dhanush7921/ROUTE-PLUS-3D-PREVIEW.git`. It checks the folder name, repository root, branch, all fetch/push remotes, public contents and engine tests. It creates the public repository only when absent, and refuses to push when the target has any history. It does not force-push, delete files, reset branches or touch sibling projects.

If PowerShell execution policy blocks the script, run it using your organization's approved script policy; do not change machine policy merely for this preview. You can instead use the visible commands after reviewing the guards.

Pages must use GitHub Actions. The helper tries to enable that through GitHub CLI before pushing. If access prevents it, set the NEW repository's Settings → Pages → Source to GitHub Actions, then run the helper again. Wait for the Pages workflow to succeed and use its deployment URL. No live deployment is claimed in this delivery.

## Limits

This session could not access the Windows filesystem or the supported browser QA environment. It built the separate folder in the session workspace from the accessible GitHub frontend. Differences in unpushed Windows changes cannot be checked. GitHub returned 404 for the new repository; no GitHub CLI or repository-creation tool is available here. Publication has not occurred.
