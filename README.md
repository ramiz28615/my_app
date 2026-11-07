
## Dimensia RE Studio 3.0 — Visual Editor / Source Explorer / AI Patch

This is a professional, permission-based **public-site reference analysis and original-site reconstruction workbench**, not a tool for retrieving private backend code or bypassing access controls.

### Live frontend
https://ramiz28615.github.io/my_app/

The public GitHub Pages website includes the complete browser-side toolset. It **cannot** fetch arbitrary third-party sites when CORS restrictions prohibit it. Run the optional Node server for public HTML/CSS/JS source fetching:

    git clone https://github.com/ramiz28615/my_app.git
    cd my_app
    npm run check
    npm test
    npm start

Visit http://127.0.0.1:3000 and open **AI Website Studio > Dimensia RE Studio**.

### Professional RE workflow
1. In **Reference Lab**, inspect a publicly accessible URL, upload an HTML file, or paste source HTML. This produces menu, button, form, visual and asset metadata.
2. In **RE Studio > Kaynak Kodları**, confirm you own or are authorized to work with the reference code. Click **Referans Dosyalarını Bul**.
3. Open an HTML, CSS or JavaScript asset. Click **Kaynağı Getir** to retrieve publicly served code (Node backend required for targets without browser CORS).
4. Review/edit that file in the embedded text editor, download it, or apply authorized code to your current website. Imported external HTML is sanitized by default: scripts, iframes and active inline handlers are removed.
5. In **Görsel Editör**, select a visible element in your own generated preview and modify its text, colors, font size, padding and radius. The modifications are persisted into editable HTML source, not merely applied to pixels.
6. Review **Sürümler & Diff** to undo, redo or compare recent source versions. This keeps up to 20 in-memory snapshots; use the regular project save/export functionality for durable storage.
7. Run **Analiz & SEO** for basic accessibility/semantic/SEO checks; download a JSON audit.
8. In **AI Revizyon**, connect your own OpenRouter Free API key and request custom CSS or a complete HTML rewrite. Free model quotas and output limits apply.


### Interaction Flow Recorder
Below the visual editor in AI Website Studio, use the interactive workflow recorder:
1. Click **Kaydı Başlat**, then click menus, buttons and complete the interactions you want to observe in your **own preview**.
2. Recorded click events, form-event types and hash navigation are displayed in a horizontal flow timeline. **No form contents, passwords, emails or other entered values are recorded.**
3. Click **Akışı Oynat** to replay eligible local button/hash interactions. For safety, form submissions and external link navigation are skipped. Buttons that call backend services may have side effects; review the site before replaying.
4. Click **JSON** to export the interaction sequence, element selectors and timestamps.

Recording works only in the instrumented sandbox preview, not in the remote reference URL. When a page navigates completely outside the preview, the recorder cannot follow the new site.

### Source and browser security boundaries
- Only **publicly reachable** URL resources are fetched. The optional Node service blocks loopback, private and reserved IP addresses, disallows nonstandard ports, pins DNS and validates redirects, caps response size, checks expected MIME types and rate-limits clients. **Do not** expose it as an unauthenticated public scraping service.
- The URL inspector does **not** execute scripts on remote sites and does not reproduce JavaScript-rendered dynamic pages, logged-in actions, private code or protected endpoints.
- The visual element picker and the developer Console/Network/Actions panel instrument **only the isolated preview iframe** inside Dimensia, not third-party Chrome tabs.
- Reusing another organization's assets, trademarks or licensed source may require permission. Do not use this to imitate a website for credential collection.
- Browser-only OpenRouter BYOK is meant for personal experimentation; real multi-user services need a credential-safe authenticated server proxy.

### File map
- index.html — application shell, dimensional visualization and website builder.
- studio-enhancements.css, studio-re.css — presentation systems.
- studio-reference.js — URL reference metadata and OpenRouter client.
- studio-re-engineer.js — visual editor, source file explorer, versioning, audit and AI revision UI.
- studio-devtools.js — preview-only console, network and action capture.
- studio-flow.js — interaction flow timeline, replay and JSON export.
- server.mjs — dependency-free optional public URL inspector and source retrieval.
- tests/server.test.mjs — local network restrictions and integration smoke tests.
- .github/workflows/check.yml — CI syntax and smoke tests.
- .github/workflows/deploy.yml — GitHub Pages publication.

### Skills and design references
- sickn33/agentic-awesome-skills — frontend-design, threejs-skills, web-design-guidelines.
- ningzimu/awesome-skills — curated skill discovery guide.

These repositories are reference catalogs; the app does not silently install arbitrary third-party packages or scripts.


# Dimensia Studio — 2D–7D + Website Builder

Web üzerinde çalışan Türkçe deneysel boyut laboratuvarı ve şablon tabanlı website stüdyosu.

**Canlı yayın hedefi:** https://ramiz28615.github.io/my_app/

## Özellikler
- 2D, 3D, 4D, 5D, 6D ve 7D hiperküplerin 2D matematiksel izdüşümleri.
- Etkileşimli animasyon, dönüşüm ve kontrol paneli.
- Prompt açıklamasına göre yerel şablon seçimi; canlı HTML düzenleme ve önizleme.
- Kaydetme, proje JSON yedekleme ve HTML indirme.
- Mobil ve masaüstü uyumlu karanlık arayüz.

## GitHub Pages
Bu depodaki `index.html` tek dosyalık **statik** sürümdür. Node.js gerektirmez. GitHub Pages için Settings > Pages > Build and deployment > Source: **GitHub Actions** seçin; ardından Actions sekmesinden **Deploy Dimensia Studio** workflow'unu çalıştırın. Site yayınlandıktan sonra URL: https://ramiz28615.github.io/my_app/

GitHub Pages sunucu tarafı Node.js veya gizli API anahtarı çalıştırmadığından, burada **gerçek model çağrısı yoktur**; oluşturucu şablon tabanlıdır. Tam Node.js / API bağlantılı sürüm `source/` altındaki dosyalarla yerel ortamda başlatılabilir.

## Yerel geliştirme
```bash
cd source
npm test
npm start
```


## URL Reference Lab + OpenRouter Free + Preview DevTools

### Live site
https://ramiz28615.github.io/my_app/

### OpenRouter free model (bring your own key)
1. Open Ayarlar; create your API key at https://openrouter.ai/settings/keys .
2. Paste the key into the OpenRouter Free panel. Model defaults to openrouter/free; alternatively choose an ID ending with :free.
3. Click Bağlantıyı Test Et (uses a free request).
4. In AI Website Studio, enter your desired website prompt, then choose Siteyi Oluştur. Edit and export generated HTML/CSS/JS.

The API key stays in the open tab memory / password input, never in GitHub or localStorage. Browser-side API requests expose the key to your own browser developer tools/extensions. This mode is appropriate for personal experiments only. A public multi-user app requires an authenticated backend proxy with per-user limits, and should NEVER ship a shared provider secret in frontend source.

### Import a website reference
- In AI Website Studio > Reference Lab, enter an HTTP(S) URL and click URL Analiz.
- Inspect public page headings, menu labels, buttons, forms, CSS/JS file references and color hints.
- On GitHub Pages, directly fetching another site requires CORS permission by that site. When blocked, upload a saved HTML file or paste accessible HTML source instead.
- The optional Node.js server fetches public HTML over HTTP(S) with private-address checks, DNS pinning, redirect validation and response-size limits.
- The inspected metadata guides generation of an ORIGINAL website. It is not an exact clone of protected branding/assets, hidden backends or private API behavior.

### Preview-only developer panels
- Console: JavaScript logs/errors from the isolated generated-site iframe.
- Network: fetch, XMLHttpRequest and selected resource timing events triggered inside the preview.
- Actions: preview button/link clicks.
- Source: open generated HTML/CSS/JS editor.

These are NOT the browser's full DevTools, and cannot read hidden traffic from external websites.

### Local URL-inspection server
Requires Node.js 20+; no external npm packages.

    git clone https://github.com/ramiz28615/my_app.git
    cd my_app
    npm test
    npm start

Then open http://127.0.0.1:3000 . Server only inspects public HTML and does not execute external JS. JavaScript-rendered sites require dedicated authorized browser automation. Before public hosting, provide authentication, stronger abuse prevention and request monitoring.

### Tests and sources
- Frontend: index.html, studio-enhancements.css, studio-reference.js, studio-devtools.js
- Optional backend: server.mjs
- Smoke/security tests: tests/server.test.mjs
- CI: .github/workflows/check.yml
- Deployment workflow: .github/workflows/deploy.yml
- Skill references: https://github.com/sickn33/agentic-awesome-skills and https://github.com/ningzimu/awesome-skills


## Aurora Edition
- Boyut kartlarında imleci takip eden ışık efekti ve yeni renk sistemi.
- Klavye ile hızlı gezinme: **Ctrl+K** (Mac: Cmd+K), **Alt+2–7** boyut değiştirme.
- Açılır komut penceresi, erişilebilir gezinme, mobil düzenlemeler ve hareket azaltma desteği.
- Statik sürüm dış ağ bağlantısı gerektirmeden açılır; Google Fonts yüklenemediğinde sistem fontları kullanılır.

## Skills referansları
- [Awesome Skills capability index](https://github.com/ningzimu/awesome-skills) — uzman becerileri bulma ve seçme yöntemi.
- [Agentic Awesome Skills](https://github.com/sickn33/agentic-awesome-skills)
- [frontend-design](https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/frontend-design/SKILL.md)
- [threejs-skills](https://github.com/sickn33/agentic-awesome-skills/blob/main/plugins/agentic-awesome-skills/skills/threejs-skills/SKILL.md)

Beceri dokümanları tasarım ve uygulama rehberi olarak kullanılmıştır; harici depo bu uygulamada yüklenip çalıştırılmaz.
