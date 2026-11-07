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
