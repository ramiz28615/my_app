# Dimensia Code Lab — Çok Dilli Çalışma Alanı

Tarayıcı: HTML/CSS/JS sandbox iframe ve isteğe bağlı Python Pyodide WebAssembly.

GitHub Actions bulut çalıştırıcısı: JavaScript (Node 22), Python 3, Rust (rustc), Bash ve Perl. Bir workflow_dispatch 5 matrix job çalıştırır. Her iş yalnızca ilgili code-lab dil dosyasını çalıştırır. run-polyglot.mjs stdout/stderr ve exit kodlarını kaydeder. Ayrı bir collector işi rapor üretir.

**Güvenlik:** Bu repo herkese açıktır. Koda ASLA API key, şifre, kişisel veri ekleme. Kullanıcı kodu GitHub Actions sanal makinesinde çalışır, internet erişimi vardır. Çalıştırıcı işler secrets veya write GITHUB_TOKEN erişimi olmadan çalışır; yalnızca collector işi sonuçları depoya yazar. Kod yüklenmeden önce kullanıcı onayı gerekir.

Bu bir production seviyesinde çok kiracılı güvenli sandbox değildir. Kendi GitHub hesabın ve yetki sahibi olduğun kodla kullan.

Gerçek web backend ve React Native APK için uygun sunucu/database ve Expo/EAS gibi ayrı araçlar gerekir.
