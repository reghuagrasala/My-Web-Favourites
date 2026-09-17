
Favorites - Ulaa Mode - Separate Files Deployment
==================================================

ULAA BEHAVIOR: All links stay INSIDE the app, never open native YouTube/Instagram/Google apps
- Like Ulaa browser, uses iframe + youtube-nocookie embed + about:blank trick

FILES:
- index.html       : Main HTML (structure only)
- css/style.css    : All styling (gradient, grid, capsules, fullscreen viewer)
- js/app.js        : All logic (Ulaa link handling, import, edit, share, favicons)
- manifest.json    : PWA manifest (standalone, icons)
- sw.js            : Service Worker (offline + better iOS Add to Home)

CUSTOMIZATION - EASY:
1. Change colors: Edit css/style.css -> .title, .cap, html,body background
2. Change grid: css/style.css -> main { grid-template-columns:repeat(4,1fr) }
3. Change default folders: js/app.js -> const defaultFolders={...}
4. Change Ulaa logic: js/app.js -> function toUlaaUrl(url) -> add more sites to convert to embed
5. Change share text: js/app.js -> shareCap.onclick
6. Change offline cache: sw.js -> urlsToCache

DEPLOYMENT (Cloudflare Pages / Netlify / GitHub Pages):
1. Upload entire folder "ulaa_deployment" contents (keep structure css/ and js/)
2. Enable HTTPS (required for share + PWA)
3. Optional: Add Zero Trust Access for privacy
4. Open site on iPhone -> Share -> Add to Home Screen -> full-screen app like native
5. Test: Tap YouTube.com -> should stay INSIDE, not open YouTube app (Ulaa mode verified)

PRIVACY:
- Bookmarks stored in localStorage (favDeploy_v3) - never uploaded
- No external CSS/JS CDN except favicons (Google S2)
- No tracking

BUILT FOR: iPhone with Dynamic Island (Today 7:17 PM) - 100dvh full-screen, no scroll
