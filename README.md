# Dimensia AI Workspace 8.0.0 · Sohbette Python / Bash / Perl / PHP Çalıştırma

**AI destekli HTML/CSS/JavaScript oluştur, düzenle, önizle ve GitHub Pages'e yayınla.** Bu sürüm, kişisel deneyler ve statik web projeleri için çalışan açık kaynaklı bir stüdyodur. Bir SaaS platformunun tüm kurumsal özelliklerini veya dünya sıralamasında üstünlüğü iddia etmez.

| | Bağlantı |
|---|---|
| **Canlı stüdyo** | https://ramiz28615.github.io/my_app/?v=8.0.0#home |
| **Gerçek yayınlanmış örnek** | https://ramiz28615.github.io/my_app/sites/aurora-demo/ |
| **Örneğin kaynak kodu** | https://github.com/ramiz28615/my_app/blob/main/sites/aurora-demo/index.html |
| **Otomatik testler** | https://github.com/ramiz28615/my_app/actions |


## 8.0.0 — Sohbet ekranında gerçek Python, Bash, Perl ve PHP çalıştırma

Ana ekran artık yalnızca kod üreten bir sohbet değil: üretilen kodu aynı sohbet penceresinde **düzenleyip, izin vererek çalıştırıp, stdout/stderr raporunu görebileceğin** bir geliştirme alanı.

- **Sohbet kod blokları:** AI yanıtında \`python\`, \`py\`, \`bash\`, \`sh\`, \`shell\`, \`perl\`, \`pl\` veya \`php\` etiketli Markdown kodu varsa **▶ Çalıştır** düğmesi çıkar. Mesajda birden çok dil varsa **⚡ Koddaki tüm dilleri çalıştır** düğmesi görünür. Her tıklamada bulut çalıştırması için açık onay istenir.
- **Sohbet içi editör:** Mesaj kutusunun altındaki **▶ Kod Çalıştır** düğmesinden dört dilin dosyaları (\`main.py\`, \`main.sh\`, \`main.pl\`, \`main.php\`) düzenlenebilir. **▣ 4 dil örneği** hazır kod yükler. İster tek dili ister dolu dört sekmeyi birlikte çalıştırabilirsin.
- **Otomatik işlem seçeneği:** **AI yeni kod yazdığında otomatik çalıştırma onayını sor** seçeneği ilk başta kapalıdır. Açıldığında, desteklenen kod içeren yeni AI yanıtı geldiğinde çalıştırma izni otomatik istenir. **İzinsiz veya arka planda sessizce çalıştırma yoktur.**
- **Gerçek yorumlayıcılar:** GitHub Actions **Ubuntu 24.04** üzerinde Python 3, Bash, Perl 5 ve PHP CLI çalışır. Dil başına önce syntax/compile kontrolü, ardından 20 saniyeye kadar yürütme yapılır; ayrı GitHub işleri aynı anda çalıştırılır. Kod geçici çalışma dizininde kalır ve repo içindeki mevcut proje dosyalarının üzerine yazılmaz.
- **Raporlar ve konsol:** Her dil için ayrı başarı/başarısızlık/atlandı durumu, \`stdout\`, \`stderr\`, exit code ve süre sohbet panelinde gösterilir. Rapor JSON olarak indirilebilir. Bulut sonuçları \`code-lab/chat-reports/<run_id>.json\` altında **herkese açık** yayınlanır.
- **Güvenlik ve sınırlamalar:** Kod parçaları GitHub Actions \`workflow_dispatch\` girişinde taşınır ve GitHub tarafından görülebilir; **hiçbir şekilde gizli veri veya kişisel token gönderme**. Yalnızca yetkili olduğun kodu çalıştır. Kod koşan işler GitHub yazma yetkisi ve repo kimlik bilgisi almadan çalışır; fakat GitHub-hosted Ubuntu bir multi-tenant güvenli sandbox değildir, kodun internet erişimi olabilir. Sonuç raporu yazan görev ayrıdır. GitHub Actions ücretsiz kullanım kotaları ve workflow izni geçerlidir.
- **Backend ve PHP hosting ayrımı:** PHP kodu **CLI** olarak gerçekten çalışır fakat GitHub Pages üzerinde PHP web sunucusu kurulmaz. Tam zamanlı PHP/Python backend, veritabanı ve React Native APK için ayrı hosting/build hizmetleri gerekir.

### Sohbetten otomatik kod çalıştırma kullanım adımları

1. Canlı uygulamaya git: https://ramiz28615.github.io/my_app/?v=8.0.0#home
2. Önce **Studio → GitHub Launchpad** üzerinden kendi public depona bağlı, **Contents: read** ve **Actions: read/write** izinli GitHub tokenini bağla. Sohbet kodu depoya commit edilmez; *sonuç raporları* ayrı commit olarak yayınlanır ve GitHub workflow'u \`main\` dalında bulunmalıdır.
3. Sohbette “Bana Python, Bash, Perl ve PHP ile aynı programı ayrı kod bloklarında yaz” de. Bu aşamada AI yanıtı için kendi OpenRouter anahtarın gerekir.
4. İstersen kod bloklarındaki **▶ Çalıştır** butonuna bas veya **⚡ Koddaki tüm dilleri çalıştır** seç. OpenRouter olmadan denemek için sohbet altındaki **▶ Kod Çalıştır → 4 dil örneği** seçeneğini kullan.
5. Açık işlem onayından sonra GitHub Actions başlar. Sonuçlar sohbet paneline otomatik gelir; hata veren dile dokunarak stderr/exit kodunu incele.
6. AI her yeni kod yazdığında onay sorulmasını istiyorsan **otomatik onay isteme** seçeneğini etkinleştir. Her çalıştırma yine açık onay ister.

**Önemli:** Gerçek yorumlayıcı testleri GitHub Actions CI'da çalıştırıldı. Kullanıcının kişisel GitHub tokeniyle yapılan bir çalıştırma bu otomatik testlerde gerçekleştirilmedi; GitHub API akışı sahte HTTP yanıtlarıyla uçtan uca test edilir.

## 7.1.0 — Aynı veriyle çalışan diller, AI hata onarma ve yerel taslak

- **9. kaynak dosya:** \`numbers.txt\`, Python / Rust / Bash / Perl / JavaScript örneklerine ortak sayı verisi sağlar. Editörde "Ortak Veri" sekmesinden düzenlenebilir. Yalnızca 1–100 küçük tam sayı, en çok 10 KB kabul edilir.
- **Gerçek diller arası doğrulama:** GitHub Actions her dili ayrı işte derler/çalıştırır. Beş dil de \`DIMENSIA_RESULT\` biçiminde \`count\` ve \`sum\` yazabilir; uygulama beklenen sayılarla karşılaştırıp **matched**, **mismatch** veya **not-reported** durumunu gösterir. Kullanıcı farklı amaçla kendi programını yazarsa sonuç bildirimi zorunlu değildir.
- **İzinli, gerçek bulut çalıştırma:** "Tüm Dilleri Çalıştır" GitHub'a 9 dosyayı gönderir. Bu işlem **ayrı açık onay** gerektirir ve içerikler herkese açık depoya yazılır. Yedi Actions işi (HTML/CSS yapısal, JS Node, Python 3, Rust, Bash, Perl, React Native yapısal kontrolü) paralel başlar. Gerçek APK üretimi veya sürekli çalışan backend bu özellikte yoktur.
- **Yerel taslak:** "Yerel taslağı kaydet / aç / sil" tuşları tarayıcının localStorage alanında 9 dosyanın anlık kopyasını **yalnızca açık kullanıcı onayıyla** tutar. GitHub'a göndermez. Anahtar gibi gizli bilgileri algılama sınırlıdır; hassas kaynak için JSON dosyasını güvenli bir yere indirmek daha uygundur.
- **AI ile hatayı düzelt:** Seçilmiş dilin **gerçek başarısız çalışma raporu** ve kodu OpenRouter'a gönderilir. AI önerisini önce ayrı, **salt okunur kod inceleme alanında** gösterir. "Kodu onayla" komutundan önce mevcut dosyayı veya GitHub'ı değiştirmez. Düzeltmenin doğru olması garanti değildir; tekrar test etmek gerekir.
- **Yedek uyumluluğu:** Yeni 9 dosyalı yedekler ile eski 8 dosyalı JSON yedekler okunur. Eski yedekte bulunmayan ortak veri dosyası varsayılan değerine döner.
- **Doğrulama:** Node testleri gerçek Python, Rust, Bash, Perl ve JS örneklerini ortak girdi üzerinden çalıştırır; kasıtlı yanlış toplamın başarısız raporlandığını doğrular. Chromium tarayıcı testleri editör, GitHub izinleri, yerel taslak ve AI onayını sınar.

### Kullanım

Canlı uygulama: https://ramiz28615.github.io/my_app/?v=8.0.0#home . **⚡ Çoklu Diller** sekmesini aç → **Ortak Veri / numbers.txt** sayıları düzenle → her dilin kodunu incele → **Tüm Dilleri Çalıştır** ile yetkili GitHub depoda paralel test yap → sonuçları karşılaştır → başarısız dil seçilmişken **AI ile Düzelt** → AI önerisini incele ve onayla → yeniden çalıştır.

**Güvenlik:** OpenRouter ve GitHub anahtarlarını sohbet, kaynak kod ve herkese açık dosyalara ekleme. ChatGPT sohbetinde daha önce paylaşılmış bir anahtar artık gizli sayılamaz; ilgili sağlayıcıdan iptal edilip yenilenmelidir. GitHub Actions çalıştırma işlerinde erişim sınırlandırılmıştır ancak bu çok kiracılı izolasyon garantisi değildir ve internet erişimi vardır. Ücretsiz GitHub Actions kotaları ve OpenRouter modelleri değişebilir.

## 7.0 — Python, Rust, Bash, Perl ve JavaScript bulut çalıştırma

**Durum:** Aynı proje altında HTML, CSS, JavaScript, Python, Rust, Bash/SH, Perl ve React Native kaynak dosyaları ayrı ayrı düzenlenir. Sekmeler arasında geçildiğinde düzenlemeler korunur. "⚡ Çoklu Diller" tek editörde çalışır.

### Dil bazında destek

| Dil | Editör | Gerçek çalışma |
|---|---|---|
| HTML / CSS | Evet | Tarayıcıda canlı önizleme; Actions'da yapısal kontrol |
| JavaScript | Evet | İzole tarayıcı iframe ve GitHub Actions Node.js 22 |
| Python 3 | Evet | İsteğe bağlı Pyodide tarayıcı motoru, ayrıca GitHub Actions Python 3 |
| Rust | Evet | GitHub Actions Ubuntu ortamında rustc ile derleme ve çalıştırma |
| Bash / SH | Evet | GitHub Actions Ubuntu ortamında Bash kontrolü ve çalıştırma |
| Perl | Evet | GitHub Actions Ubuntu ortamında Perl sözdizimi kontrolü ve çalıştırma |
| React Native | Evet | Expo proje yapısı kontrolü; APK üretimi **yok** |

### 7 sonuçlu bulut çalıştırma

1. **AI Website Studio → ⚡ Çoklu Diller** alanını aç; proje içinde index.html, style.css, main.js, main.py, main.rs, main.sh, main.pl ve App.js kaynaklarını düzenle.
2. **◎ HTML/CSS/JS Önizle** ile HTML/CSS/JS kaynaklarını birleştirip izole tarayıcı iframe'inde çalıştır. Rust/Perl/Bash burada tarayıcıda çalışmaz.
3. **GitHub Launchpad** bölümüne kendi GitHub hesabındaki public depoya özel bir Fine-grained token gir. Gerekli izinler: Contents: Read and write, Actions: Read and write. Token kodlara veya localStorage'a yazılmaz.
4. **▶ Tüm Dilleri Çalıştır** düğmesinden önce herkese açık kaynak kodu yükleme onayını açıkça işaretle ve GitHub'a yazmayı ayrıca onayla. 8 dosya code-lab altına kaydedilir; kodlar **public depoda görülebilir**.
5. GitHub Actions polyglot-execute.yml workflow_dispatch üzerinden 7 ayrı Ubuntu görevi başlatır. JavaScript, Python, Rust, Bash ve Perl gerçek çalıştırılır; HTML/CSS ile React Native yapısal kontrolü yapılır. Kod çalıştıran görevlerde repository write tokeni yoktur.
6. Ayrı bir collector JSON sonuçlarını birleştirip code-lab/reports/r....json dosyasına yazar. Bu sonuçlar herkese açıktır. Site bu dosyaları okuyarak exit kodlarını, stdout/stderr, hataları ve işlem sürelerini ayrı ayrı gösterir.

**Yeni: Proje yedeği / içe aktarma.** Çok dilli editörde **↓ Proje yedeği** ile 8 dosyanın tümünü içeren JSON yedeği cihazına indirip **↑ Yedek yükle** ile geri alabilirsin. Böylece GitHub'a yazmadan da kaynaklarını saklarsın. Kodu eski Code Lab alanında değiştirirsen yeni editöre ve yeni editörde değiştirirsen Code Lab'a senkronize olur. JSON yedekleri içinde özel kod bulunabileceği için güvenli yerde sakla. Otomatik GitHub yüklemesi veya otomatik depolama yapılmaz.

**Güvenlik:** GitHub-hosted runner çok kullanıcılı tam korumalı sandbox değildir. Kodlar internete erişebilir. Gizli anahtar, şifre, özel dosya veya hassas içerik yükleme; yaygın token kalıpları taransa da her sırrın bulunacağı garanti edilemez. GitHub Actions ücretsiz kota/sınırlarına tabidir. AI ile otomatik çok dosyalı üretim isteğe bağlı OpenRouter ücretsiz modele bağlıdır.

**Kapsam:** Tek dosyalık Python/Rust/Bash/Perl/Node örnekleri gerçek derleme/çalıştırma kullanır. Karmaşık full-stack projelerin paket yöneticileri, veri tabanı ve kalıcı sunucu gereksinimleri ayrıca yapılandırılmalıdır. React Native APK'sı bu sürümde derlenmez.

**Canlı bağlantı:** https://ramiz28615.github.io/my_app/?v=7.0.1#studio

## 6.1.0 — Sohbette çalıştırılabilir site önizleme ve kaynak kod düzenleme

- **Sohbet → Site oluştur:** OpenRouter'dan üretilen tek dosyalık HTML/CSS/JS, sağdaki **izole iframe** önizlemesine yüklenir. JavaScript, HTML olayları ve butonlar önizleme içinde gerçekten çalıştırılır.
- **Kodu düzenle:** Önizleme paneli içinde **index.html**, **style.css** ve **app.js** sekmelerini açar. HTML sekmesi tam HTML kaynağını, CSS/JS sekmeleri HTML içindeki **ilk inline** stil/komut bloğunu düzenler. Birden fazla blok varsa etiket üzerinde "ilk blok" uyarısı çıkar; diğerleri korunur.
- **▶ Çalıştır ve önizle:** Kaynağı doğrulayıp izole iframe'i sıfırdan yükler; aynı anda Studio'daki HTML kaynak editörüne de yazar. İsteğe bağlı **düzenlerken otomatik önizleme** (~900 ms) seçeneği vardır.
- **JavaScript Konsolu:** Önizleme içindeki console.log, warn, error, ağ istekleri ve buton tıklamaları gösterilir. Başka sitelerin özel trafiği değil, yalnızca bu iframe'in olayları dinlenir.
- **Geri / İleri:** Son çalıştırılmış kod sürümlerinin en fazla 22 adedi sekme oturumu boyunca bellekte tutulur; değişiklikler geri/ileri alınabilir.
- **HTML indir / Studio'da aç / Projeyi kaydet / GitHub'a yayınla:** Kod, mevcut Studio ve GitHub Launchpad akışına bağlıdır. GitHub yayınlamak için kullanıcının tokeni ve onayı gereklidir.
- **Mobil:** 390 piksel telefonlarda kod düzenleme ve önizleme dikey yerleşimle sunulur. Masaüstü geniş ekranlarda önizleme ve kod paneli yan yana açılır.
- **Sınır:** GitHub Pages PHP, Python, Rust backend veya React Native APK çalıştırmaz. Burada çalışan kod tarayıcı HTML/CSS/JS'dir. Gerçek backend için uygun bir sunucu gerekir. Harici sitelerin CORS/giriş/sunucu kodları otomatik kopyalanmaz.

**Kullanım:** https://ramiz28615.github.io/my_app/?v=8.0.0#home adresini aç → Ayarlar'da OpenRouter'ı bağla → **Site oluştur** modunda isteğini yaz → oluşturulan sitenin **Canlı önizleme** panelinde **⌘ Kodu düzenle** butonunu kullan → HTML/CSS/JS'yi değiştir → **▶ Çalıştır ve önizle** → butonlara tıkla, konsolu kontrol et → **Kaydet** veya **Yayınla**.

## 6.0.2 — Sohbet odaklı yeni ana ekran

Abacus AI ChatLLM'nin sohbet-öncelikli etkileşim akışından esinlenilmiş, ancak görsel marka, kod ve bileşenleri kendine özgü **Dimensia AI** ana ekranı.

- **Ana sayfa artık AI Sohbet:** Sade, göz yormayan koyu tema, büyük mesaj kutusu, dört hazır proje fikri, ücretsiz OpenRouter model durumu ve hızlı "Yeni sohbet".
- **Sol menü sohbet geçmişi:** Yeni konuşma, sohbetler arasında geçiş, sohbeti silme; yalnızca bu cihazın localStorage alanında tutulur. API anahtarı, oturum veya doğrudan özel servis entegrasyonu kaydedilmez. Üretilen HTML dosyaları sohbet geçmişinde saklanmaz; kullanıcı Studio'dan projeyi kaydetmelidir.
- **Sohbet modu:** OpenRouter Ayarlar bölümünde kullanıcının kendisi girdiği session-only anahtar ve seçtiği :free model üzerinden normal konuşma. Kod blokları güvenli metin olarak gösterilir, kopyalama düğmesi vardır. Model yanıtı ücretsiz kota ve servis durumuna bağlıdır.
- **Site oluştur modu:** Kullanıcı talimatından tek dosyalık HTML/CSS/JS üretir; yeni site otomatik olarak **izole iframe önizlemesine** gönderilir. Masaüstü/mobil görünüm, Studio kaynak editörüne geçiş, projeyi kaydet, HTML indir, GitHub Pages'e yayınla. Yayınlama için kullanıcı tokeni ve onay gerekir.
- **Dosya ekleme:** En fazla 60 KB HTML/CSS/JS/TXT/JSON/PY/RS/SH metin kaynak dosyası bağlanabilir. Eklenen metin, mesaj gönderildiğinde OpenRouter sağlayıcısına iletilir. Olası token kalıpları engellenmeye çalışılır ancak tüm sırların algılanacağı garanti edilmez. Gizli dosyalar yüklenmemeli.
- **Kullanıcı arayüzü:** Masaüstünde sohbet + önizleme yan yana; dar ekranlarda uyarlanmış tek sütunlu düzen, cihaz görünümü denetimi, ekranda kalan mesaj kutusu, dar ekranlarda yatay taşma kontrolü. Düşük hareket modu desteklenir.
- **Önceki modüller yerinde:** 2D–7D boyut laboratuvarı, referans analizi, RE Architect, Code Lab, AI Software Architect, GitHub Launchpad ve kayıtlı projeler korunur.
- **Sınırlar:** Abacus AI veya ücretli modellerin hesap özellikleri aktarılmaz. Genel sohbet ekranı web araması, veritabanı veya sunucu çalıştırdığını iddia etmez. İleri düzey native derleme ve full-stack hosting ayrı altyapı gerektirir.

### Kullanım

1. **Canlı uygulama:** https://ramiz28615.github.io/my_app/?v=6.0.2#home
2. **Ayarlar & Kurulum:** OpenRouter API anahtarını sadece uygulamadaki alana kendin gir. Sohbete veya GitHub'a ekleme. Önceden bir yerde paylaşılmış anahtarını iptal edip yenisini oluştur.
3. **Ana ekran:** Yeni sohbet aç, ücretsiz model durumunu kontrol et ve isteğini yaz. Enter gönderir, Shift+Enter yeni satır açar.
4. **Site oluştur:** Mesaj kutusu altındaki "Site oluştur" seçeneğine geç, siteni tarif et ve mesajı gönder. Sonucu sağdaki önizlemede incele.
5. **Düzenle ve yayınla:** "Kodu düzenle" ile HTML/CSS/JS kaynak editörünü aç, "Kaydet" ile tarayıcına kaydet, "Yayınla" ile GitHub Launchpad'e git.

**Gizlilik:** Sohbet geçmişi sadece tarayıcının yerel depolamasındadır; aynı cihazı kullanan başka biri tarafından okunabilir. OpenRouter'a gönderilen mesajlar ve ekli kaynak dosyaları harici sağlayıcıya aktarılır. API anahtarı localStorage'a yazılmaz ancak tarayıcıda gönderilen isteklerde görülebilir.

## 5.3.0 — OpenRouter bağlantı ve ücretsiz model hata düzeltmeleri

- **Anahtarı Doğrula:** OpenRouter resmi GET /api/v1/key isteğiyle anahtarın geçerliliğini doğrular. Anahtarın sadece kutuya girilmesi artık başarılı bağlantı diye gösterilmez.
- **Model Yanıtını Test Et:** Ayrı OpenRouter chat/completions testi; eskiden kullanılan 32 token sınırı yerine en az 512 token. Boş cevapta finish_reason ve reasoning token tüketimi açıklanır. Bağlantı geçerliyse modelin boş cevap vermesi anahtarın geçersiz olduğu anlamına gelmez.
- **Ücretsiz Modelleri Yenile:** OpenRouter canlı model kataloğundan sadece sıfır fiyatlı, metin çıktılı ve :free ile biten modeller listelenir; openrouter/free varsayılanı her zaman kalır. Hedef model veya sağlayıcı belirli bir anda kapasite/kota nedeniyle hata verebilir.
- **Eski sunucu hatası kaldırıldı:** GitHub Pages statik sunucudur; Node.js kurulumu OpenRouter bağlantısı için zorunlu değildir. Bağlantı kartı artık gerçek OpenRouter durumu ile eşleşir.
- **Güvenlik:** OpenRouter anahtarı GitHub kodlarına veya localStorage'a yazılmaz. Ancak tarayıcı ağ paneli ve eklentiler bu anahtarı görebilir. Çok kullanıcılı uygulamalar için güvenli backend/OAuth gerekir.
- **Testler:** GitHub Actions gerçek Chromium testleri, sahte API yanıtlarıyla anahtar doğrulamasını, boş reasoning cevabını, başarılı model yanıtını ve ücretsiz model filtrelemeyi denetler; gerçek kullanıcı anahtarı kullanılmaz.

**Telefon kurulumu:** Sohbette paylaşılan eski anahtarını OpenRouter anahtar yönetiminden iptal et ve yenisini oluştur. Ardından siteyi aç: https://ramiz28615.github.io/my_app/?v=5.3.0#studio . Ayarlar → OpenRouter alanına yeni anahtarını kendin yaz; sırasıyla **Anahtarı Doğrula**, **Ücretsiz Modelleri Yenile** ve **Model Yanıtını Test Et** düğmelerine bas. Onaydan sonra AI Software Architect ile kod üretimi başlat.

## 5.2.1 — Mobil ekran ve URL analizi hata düzeltmeleri

- **Android Custom Tab ve masaüstü sitesi görünümü:** Fiziksel telefon genişliği ile tarayıcının geniş HTML viewport'unu ayırt etmeye çalışan tek sütunlu mobil görünüm, sabit/dar ekran menüsü ve erişilebilir **▯ Telefon / ▣ Normal** geçiş düğmesi eklendi. Telefon görünümü tercihi yalnızca tarayıcıdaki yerel ayar olarak tutulur.
- **390 piksel mobil taşma:** Üst başlıktaki isteğe bağlı masaüstü eylemleri dar ekranda gizlendi. Ana panel, kartlar, kod editörü, GitHub Launchpad ve RE Architect bölümleri dar ekrana uygun hâle getirildi.
- **URL Analiz Et:** Statik GitHub Pages üzerinde bulunmayan \`/api/architect\` uç noktasına boş istek atılmaz. Tarayıcı CORS engelinde anlamlı açıklama ve dört yol görünür: **GitHub Bulut Tarama, HTML Dosyası Yükle, Kendi Projemi Tara, HTML Kaynak Yapıştır**.
- **Gerçek test:** Chromium E2E; 390px mobil yatay taşmayı, telefon menüsünü, 393px fiziksel ekran / 980px geniş HTML viewport'unu, CORS erişim engelini ve alternatif yöntemlerin çalışmasını test eder.
- **Önemli sınır:** Google veya başka bir sitenin CORS koruması yalnızca ön yüz JavaScript'iyle kaldırılamaz. GitHub Bulut Tarama için kendi GitHub hesabında Actions izni ve yetkili URL gerekir. Google'ın bot engelleri gibi ek sınırlamalar olabilir.

**Telefonunda görünüm hâlâ aşırı küçükse:** Chrome'un üç nokta menüsünde **Masaüstü sitesi** açıksa kapat. Stüdyonun üst çubuğundaki **▯ Telefon** düğmesi de tek sütun görünümünü zorlamanı sağlar. Her tarayıcının zorla masaüstü ölçekteki yazı büyütmesini otomatik aşmak mümkün değildir.

## Dimensia 5.1 — Yapay zekâ geliştirme akışı

**AI Software Architect** paneli: fikrini Türkçe yaz, tasarım dilini seç ve **Plan Oluştur → AI ile Site Üret → Kod Denetimi → AI ile Düzelt** adımlarıyla ilerle. **Tam Akış** düğmesi plan, HTML/CSS/JS üretimi ve statik denetimi birleştirir. HTML değişiklikleri izole iframe önizlemesine uygulanır, en fazla 20 sürüm geçici geçmişe alınır ve istenirse tek HTML olarak indirilebilir.

- **OpenRouter Free:** Ayarlar içinde kendi OpenRouter API anahtarını gir. Varsayılan \`openrouter/free\` ücretsiz modeller arasında yönlendirme yapar; kota, kapasite ve yanıt uzunluğu değişebilir. Varsayılan ücretsiz yönlendirici ve \`:free\` uzantılı model alanı desteklenir.
- **Güvenlik:** Anahtar GitHub'a, HTML export dosyalarına veya localStorage'a eklenmez. Yalnızca oturum belleğinde kullanılır; tarayıcı geliştirici araçlarında görülebilir. Sohbette, herkese açık dosyada veya hata kaydında paylaşılan anahtar derhal iptal edilip değiştirilmelidir.
- **Gerçek çalışma sınırı:** Planlama, tek dosyalı HTML/CSS/JS üretimi, temel erişilebilirlik analizi, AI tabanlı kaynak yeniden oluşturma ve yerel sürüm geri alma uygulanmıştır. Bu, tüm bug'ların otomatik çözüldüğü, veritabanı/backend kurulduğu veya üretim ortamı güvenlik denetimi tamamlandığı anlamına gelmez.
- **Model testi:** CI yalnızca **sahte OpenRouter yanıtları** kullanır; gerçek hesap anahtarı veya gerçek model fiyat/kota testi yapmaz.

## RE Architect — Node kurmadan URL analizi

1. **AI Website Studio → RE Architect** bölümünü aç.
2. İnceleme hakkın olan sitenin URL'sini yaz, izin onayını işaretle ve **URL Analiz Et** düğmesini kullan.
3. Önce yerel API bulunursa onunla çoklu sayfa taraması, sonra doğrudan tarayıcıdan CORS izinli HTML erişimi denenir.
4. Tarayıcı HTML'ye erişemiyorsa **☁ GitHub Bulut Tarama** düğmesiyle GitHub Actions üzerinden isteğe bağlı analiz yapabilirsin. Bunun için **GitHub Contents: read ve Actions: write** yetkili, yalnızca seçili depoya erişen fine-grained token gerekir; ilgili \`public-url-audit.yml\` workflow depoda bulunmalıdır.
5. Bulut taraması sonucunda yalnızca **herkese açık yapısal metadata** \`reports/r...json\` biçiminde GitHub'daki **public repo'ya** kaydedilir. Herkese açık rapora yazılmasını istemediğin URL'yi bulutta analiz etme.
6. **Akış Diyagramı**, **Buton/Form**, **Renk/Font**, **HTML/CSS/JS** sekmeleriyle analiz sonuçlarına bak. CORS izinli veya yüklenmiş HTML kodu düzenlenebilir. GitHub bulut raporu gizli kaynakları veya ham HTML/JS dosyalarını içermez.

**CORS**: İzinli olmayan hedefler rastgele URL girilerek kopyalanamaz. **Node.js kurulumu URL analizi için tek yol değildir**, ama **her URL'de sorunsuz tarama garantisi** de yoktur.

## Code Lab — çoklu dil düzenleme

**HTML, CSS, JavaScript, Python, Rust, Bash/SH ve React Native/Expo** kaynakları düzenlenir; GitHub'a kullanıcı izniyle kaydedilebilir veya dosya olarak indirilebilir.

- **JavaScript:** yalnızca sandbox iframe'de çalıştırılır.
- **HTML/CSS:** stüdyonun kendi önizlemesine aktarılabilir.
- **Python:** isteğe bağlı Pyodide WebAssembly motoru indirilebilir; ilk çalıştırmada internet ve yeterli RAM gerekir.
- **Rust / Bash/SH:** tarayıcıda sistem komutu olarak çalıştırılmaz; GitHub Actions \`polyglot-check.yml\` üzerinde örnekleri doğrular veya yerel native derleyici/shell kullanılır.
- **React Native:** düzenlenebilir Expo/App.js başlangıç dosyası ve package.json şablonu sunulur; Android APK/iOS için Expo/EAS Build veya yerel geliştirme aracı gereklidir.
- **Full-stack:** RE Architect sekmesinden kendi projen için Node.js CRUD API taslağı indirilebilir. GitHub Pages yalnızca statik dosya barındırır; gerçek API ve veri kalıcılığı ayrı backend üzerinde çalışır.


## Özellikler

- **Website Studio:** Türkçe açıklamayla yerel tasarım şablonları veya kendi OpenRouter anahtarınla ücretsiz model tabanlı kod üretimi.
- **HTML/CSS/JS editörü:** Gerçek kaynak kodu düzenlemesi, izole iframe önizlemesi, HTML indirme ve tarayıcı tabanlı proje kayıtları.
- **Visual RE Studio:** Kendi önizlemendeki öğeyi seç, metin/CSS değiştir, kaynak koda uygula, son 20 sürüm arasında geri al/ileri al.
- **Reference Lab:** İzinli, herkese açık HTML kaynaklarını ve menü, buton, form, bağlantı, CSS/JS dosya referanslarını incele.
- **Preview DevTools:** İzole önizlemeye ait Console, Network, Source ve kullanıcı aksiyonları.
- **Interaction Flow Recorder:** Önizlemedeki düğme ve menü akışlarını kaydet, JSON indir, desteklenen yerel tıklamaları yeniden oynat.
- **2D–7D boyut laboratuvarı:** Etkileşimli ve matematiksel hiperküp izdüşümleri.
- **Launchpad:** Masaüstü/tablet/mobil önizlemesi, GitHub'a statik site yayınlama/güncelleme, Actions dağıtım durumunu görüntüleme.
- **Launchpad 4.1.1 yenilikleri:** GitHub'dan `sites/` projelerini yeniden listele, yayınlanmış `index.html` kaynağını editöre aç, Aurora örnek sitesini kendi projen olarak içe aktar; GitHub Pages API'sine yalnızca `Contents` izni olan tokenla erişim kısıtlıysa yanlış hata verme.

## Kendi siteni GitHub'da ücretsiz yayınla

1. Stüdyoda **AI Website Studio** bölümüne geç. İstersen **✧ Örnek Siteyi Düzenle** düğmesiyle Aurora tasarımını yükleyip değiştir.
2. **Launchpad** panelinde responsive görünümü kontrol et. HTML tek dosyada CSS/JS içeriyor olmalı. Yayınlama limiti 900 KB.
3. GitHub kullanıcı adını ve **Pages yayınlaması etkin, herkese açık mevcut depoyu** seç. Örnek: `ramiz28615 / my_app`.
4. GitHub'da https://github.com/settings/personal-access-tokens/new adresinden **fine-grained personal access token** oluştur. Yalnızca bu repo için **Contents: Read and write** yetkisi ver, kısa süreli token kullan ve başka izin isteme.
5. Tokeni Launchpad'deki parola alanına **kendin** gir. Sohbete, kaynak koda veya GitHub'a gönderme. **GitHub Bağlantısını Test Et** düğmesi erişimini kontrol eder.
6. Yayın adına `portfolyom` gibi bir değer yaz. Kaynağın yayınlanmasına ilişkin onay kutusunu işaretle. **GitHub'a Yayınla** düğmesi `sites/portfolyom/index.html` dosyasını oluşturur veya günceller.
7. **Yayın Durumunu Kontrol Et** ile Actions dağıtımını kontrol et. Aynı origin üzerinden doğrulanabiliyorsa canlı adrese HTTP 200 HTML kontrolü de yapılır; farklı originlerde yalnızca Actions durumuna bakılabilir. Başarıdan sonra: `https://ramiz28615.github.io/my_app/sites/portfolyom/`.
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
- Tarayıcıda dış URL taraması hedefin CORS ayarına bağlıdır; alternatif olarak yetkili GitHub Actions üzerinden herkese açık metadata raporu alınabilir veya opsiyonel Node.js sunucusu çalıştırılır.

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
- `.github/workflows/public-url-audit.yml`: izinli URL için GitHub Actions metadata analizi
- `.github/workflows/polyglot-check.yml`: örnek JavaScript/Python/Rust/POSIX sh ve React Native başlangıç dosyaları

## Kaynak dosyaları

| Dosya | Ne yapar? |
|---|---|
| `index.html` | Dimensia Studio uygulaması ve 2D–7D çizimler |
| `studio-reference.js` | OpenRouter ücretsiz model bağlantısı ve referans analizi |
| `studio-ai-agent.js`, `studio-ai-agent.css` | Planlama, AI HTML/CSS/JS üretimi, kalite ve kod revizyonları |
| `studio-architect.js`, `studio-architect.css` | Node olmadan URL inceleme seçenekleri, akış diyagramı ve renk/font analizi |
| `studio-code-lab.js`, `studio-code-lab.css` | Python/JS/HTML/CSS/Rust/Bash/React Native kaynak editörü |
| `architect-core.mjs` | Sunucu tarafı güvenli sayfa/CSS/JS ayrıştırma |
| `backend-template.mjs` | İndirilebilir, yerel Node.js CRUD API şablonu |
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
