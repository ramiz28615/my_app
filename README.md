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
