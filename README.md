# Dimensia RE Studio + Launchpad 4.1

**AI destekli HTML/CSS/JavaScript oluştur, düzenle, önizle ve GitHub Pages'e yayınla.** Bu sürüm, kişisel deneyler ve statik web projeleri için çalışan açık kaynaklı bir stüdyodur. Bir SaaS platformunun tüm kurumsal özelliklerini veya dünya sıralamasında üstünlüğü iddia etmez.

| | Bağlantı |
|---|---|
| **Canlı stüdyo** | https://ramiz28615.github.io/my_app/?v=4.1.0#studio |
| **Gerçek yayınlanmış örnek** | https://ramiz28615.github.io/my_app/sites/aurora-demo/ |
| **Örneğin kaynak kodu** | https://github.com/ramiz28615/my_app/blob/main/sites/aurora-demo/index.html |
| **Otomatik testler** | https://github.com/ramiz28615/my_app/actions |

## Özellikler

- **Website Studio:** Türkçe açıklamayla yerel tasarım şablonları veya kendi OpenRouter anahtarınla ücretsiz model tabanlı kod üretimi.
- **HTML/CSS/JS editörü:** Gerçek kaynak kodu düzenlemesi, izole iframe önizlemesi, HTML indirme ve tarayıcı tabanlı proje kayıtları.
- **Visual RE Studio:** Kendi önizlemendeki öğeyi seç, metin/CSS değiştir, kaynak koda uygula, son 20 sürüm arasında geri al/ileri al.
- **Reference Lab:** İzinli, herkese açık HTML kaynaklarını ve menü, buton, form, bağlantı, CSS/JS dosya referanslarını incele.
- **Preview DevTools:** İzole önizlemeye ait Console, Network, Source ve kullanıcı aksiyonları.
- **Interaction Flow Recorder:** Önizlemedeki düğme ve menü akışlarını kaydet, JSON indir, desteklenen yerel tıklamaları yeniden oynat.
- **2D–7D boyut laboratuvarı:** Etkileşimli ve matematiksel hiperküp izdüşümleri.
- **Launchpad:** Masaüstü/tablet/mobil önizlemesi, GitHub'a statik site yayınlama/güncelleme, Actions dağıtım durumunu görüntüleme.
- **Launchpad 4.1 yenilikleri:** GitHub'dan `sites/` projelerini yeniden listele, yayınlanmış `index.html` kaynağını editöre aç, Aurora örnek sitesini kendi projen olarak içe aktar; GitHub Pages API'sine yalnızca `Contents` izni olan tokenla erişim kısıtlıysa yanlış hata verme.

## Kendi siteni GitHub'da ücretsiz yayınla

1. Stüdyoda **AI Website Studio** bölümüne geç. İstersen **✧ Örnek Siteyi Düzenle** düğmesiyle Aurora tasarımını yükleyip değiştir.
2. **Launchpad** panelinde responsive görünümü kontrol et. HTML tek dosyada CSS/JS içeriyor olmalı. Yayınlama limiti 900 KB.
3. GitHub kullanıcı adını ve **Pages yayınlaması etkin, herkese açık mevcut depoyu** seç. Örnek: `ramiz28615 / my_app`.
4. GitHub'da https://github.com/settings/personal-access-tokens/new adresinden **fine-grained personal access token** oluştur. Yalnızca bu repo için **Contents: Read and write** yetkisi ver, kısa süreli token kullan ve başka izin isteme.
5. Tokeni Launchpad'deki parola alanına **kendin** gir. Sohbete, kaynak koda veya GitHub'a gönderme. **GitHub Bağlantısını Test Et** düğmesi erişimini kontrol eder.
6. Yayın adına `portfolyom` gibi bir değer yaz. Kaynağın yayınlanmasına ilişkin onay kutusunu işaretle. **GitHub'a Yayınla** düğmesi `sites/portfolyom/index.html` dosyasını oluşturur veya günceller.
7. **Yayın Durumunu Kontrol Et** ile Actions dağıtımını kontrol et. Başarıdan sonra: `https://ramiz28615.github.io/my_app/sites/portfolyom/`.
8. **GitHub'dan Tara** düğmesi `sites/` klasöründeki mevcut projeleri listeler. **⌘ GitHub'dan Aç** ise seçilen projenin HTML kaynağını yeniden editöre yükler.

**Not:** Kod değişikliği GitHub'a kaydedilmesi ile Pages üzerinden görünmesi aynı an olmayabilir. GitHub Actions sonucu başarısızsa eylem günlüklerine bak.

## Subdomain: doğru teknik açıklama

GitHub Pages ücretsiz proje adresleri **alt yol** biçimindedir:
`https://KULLANICI.github.io/DEPO/sites/SITE/`.

Kullanıcının ana deposu `KULLANICI.github.io` olarak adlandırılmışsa kullanıcı sitesi için kök `https://KULLANICI.github.io/` kullanılabilir; stüdyo bu özel durumu hesaplar.

**Her projeye `site.github.io` tarzında keyfi, ücretsiz, bağımsız subdomain verilemez.** Kendi domainin varsa GitHub Pages ve DNS üzerinden `site.seninalanadin.com` gibi bir alan adı ayarlayabilirsin. Özel domain GitHub Pages sitesi/deposu düzeyinde çalışır, tek depodaki bütün alt klasörlere ayrı alan adı otomatik vermez.

Resmî rehber: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages

## Güvenlik ve sınırlar

- **GitHub ve OpenRouter tokenleri kalıcı depolanmaz**; tarayıcının açık sekme belleğinde tutulur ve ilgili API'ye HTTPS ile gönderilir. Tarayıcı geliştirici araçları ve uzantılar tarafından yine de görülebilir. Bu BYOK yaklaşımı kişisel denemeler içindir; herkesin kullanacağı ticari serviste OAuth/GitHub App ve güvenli sunucu proxy'si gerekir.
- Herkese açık Pages kodunda **özel şifre, API key veya kişisel veri** bulundurma. Yayınlayıcı bazı bilinen anahtar kalıplarını tarar, ancak tüm sırları tespit etmeyi garanti etmez.
- Başka sitelerin yetkisiz kaynaklarını, özel backend kodunu veya kimlik doğrulaması gerektiren trafiğini çıkarmaya çalışmaz. Referans inceleme yalnızca erişilebilir HTML metadatasıyla sınırlıdır.
- GitHub Pages yalnızca **statik hosting** sağlar. PHP, Node.js API, veritabanı veya gizli server key çalıştırmaz.
- **Önemli same-origin uyarısı:** Tek bir Pages deposunun `/sites/` alt klasörleri ve stüdyo aynı origin'i paylaşır. Güvenmediğin JavaScript kodunu kendi yönetim stüdyonla aynı origin'de barındırma. İzole bir repo veya kendi alan adını kullan.
- Kaynak içe alma/uzak site inceleme yalnızca hak sahibi olduğun veya kullanım izni verilmiş kod için kullanılmalıdır.
- Tarayıcıda dış URL taraması hedefin CORS ayarına bağlıdır; kamuya açık kaynaklar için opsiyonel Node.js sunucu vardır.

## Kurulum ve test

**Node.js 20 veya üzeri** ile:

```bash
git clone https://github.com/ramiz28615/my_app.git
cd my_app
npm run check
npm test
npm start
```

Tarayıcıdan `http://127.0.0.1:3000` adresine gir. Opsiyonel Node.js sunucu kamuya açık HTML/CSS/JS kaynaklarını boyut, hız, IP ve yönlendirme kontrolleriyle okur. Harici JavaScript çalıştırmaz.

Gerçek Chromium E2E testi için:

```bash
npm install --no-save playwright@1.56.1
npx playwright install chromium
node tests/browser-smoke.mjs
```

GitHub Actions:
- `.github/workflows/check.yml`: JavaScript sözdizimi ve güvenlik duman testleri
- `.github/workflows/browser.yml`: gerçek Chromium ile masaüstü/mobil editör, kaynak akışı ve **taklit GitHub API** üzerinde yeni yayın/güncelleme/geri yükleme/örnek site aktarma; gerçek erişim tokeni kullanılmaz
- `.github/workflows/deploy.yml`: Pages yayınlaması

## Kaynak dosyaları

| Dosya | Ne yapar? |
|---|---|
| `index.html` | Dimensia Studio uygulaması ve 2D–7D çizimler |
| `studio-reference.js` | OpenRouter entegrasyonu ve referans analizi |
| `studio-re-engineer.js`, `studio-re.css` | Görsel editör, sürüm ve kaynak gezgini |
| `studio-flow.js` | Etkileşim akış kaydedici |
| `studio-devtools.js` | İzole önizleme Console/Network/Actions |
| `studio-launchpad.js`, `studio-launchpad.css` | GitHub Pages yayınlama, önizleme ve proje yönetimi |
| `sites/aurora-demo/index.html` | Yayınlanmış bağımsız örnek |
| `server.mjs` | Yerel statik dosya sunucusu ve izinli URL inceleme |
| `tests/` | Node.js ve Playwright doğrulama |

## Kullanılan tasarım/beceri referansları

- [Agentic Awesome Skills](https://github.com/sickn33/agentic-awesome-skills): frontend-design, threejs-skills ve web-design-guidelines.
- [Awesome Skills](https://github.com/ningzimu/awesome-skills): uzman beceri keşfi/kürasyon rehberi.

Bu beceri depolarının tüm içeriği otomatik yüklenmez ve çalıştırılmaz; ilgili rehberler tasarım/uygulama prensipleri için değerlendirilmiştir.

---

© 2026 Dimensia Studio — açık kaynaklı, geliştirilmekte olan prototip.
