/* Dimensia AI 8.4 — chat-first low-code orchestration.
 * The assistant may prepare and preview locally; publication/cloud execution always needs user approval.
 */
(()=>{
'use strict';
const hub=window.DimensiaChatHub,chat=document.getElementById('dhConversation');
if(!hub||!chat)return;
const $=id=>document.getElementById(id);
const STORE='dimensia-chat-autopilot-v1';
const ACTIONS={
 preview:'◎ Önizleme',editweb:'⌘ Web kodu',downloadweb:'↓ Siteyi indir',
 publish:'↗ Yayınla',native:'📱 Mobil editör',zip:'↓ APK için ZIP',
 colab:'↗ Google Colab',terminal:'▶ Terminal',projects:'▦ Projeler',
 layout:'▦ Boyutlar',settings:'⚙ AI Bağlantısı'
};
let enabled=true;
try{enabled=localStorage.getItem(STORE)!=='off'}catch{}
const bar=document.createElement('div');bar.id='dauBar';bar.className='dau-bar';
bar.setAttribute('aria-label','Sohbetten otomatik proje ve AI araç yönetimi');
bar.innerHTML='<div class="dau-top"><button type="button" id="dauToggle" aria-pressed="true" class="dau-toggle">✦ Otomatik AI açık</button>'+
 '<span id="dauProject" class="dau-project">▦ Yeni proje</span>'+
 '<span id="dauStatus" class="dau-status" role="status" aria-live="polite">Ne istediğini yaz, uygun aracı kendim seçeceğim.</span></div>'+
 '<div class="dau-tools">'+
 '<button type="button" data-dau="site">✦ Site yap</button>'+
 '<button type="button" data-dau="app">📱 Uygulama yap</button>'+
 '<button type="button" data-dau="preview">◎ Önizleme</button>'+
 '<button type="button" data-dau="zip">↓ APK ZIP</button>'+
 '<button type="button" data-dau="colab">↗ Colab</button>'+
 '<button type="button" data-dau="projects">▦ Projeler</button>'+
 '<button type="button" data-dau="layout">☷ Boyutlar</button>'+
 '</div>';
chat.querySelector('.dh-composer')?.before(bar);
function setStatus(text){$('dauStatus').textContent=String(text||'').slice(0,165)}
function reflect(){
 const toggle=$('dauToggle');
 toggle.textContent=enabled?'✦ Otomatik AI açık':'◌ Otomatik AI kapalı';
 toggle.setAttribute('aria-pressed',String(enabled));
 toggle.classList.toggle('disabled',!enabled);
}
function enable(next){enabled=!!next;try{localStorage.setItem(STORE,enabled?'on':'off')}catch{}reflect();setStatus(enabled?'Sohbete yaz; ne yapmak istediğini algılayacağım.':'Manuel mod: Sohbet / Site / Mobil APK seçimini sen yap.')}
$('dauToggle').onclick=()=>enable(!enabled);
const clean=str=>String(str||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').trim();
const buildVerbs=/(?:olustur|yap|tasarla|gelistir|duzenle|degistir|ekle|hazirla|kur|yenile|guncelle|uret|ciz|duzelt|baslat)/;
const appWords=/(?:react.native|expo|android|apk|mobil.uygulam|telefon.uygulam|ios.uygulam|app\.tsx|app\.jsx|mobil.app)/;
const webWords=/(?:web.sit|internet.sit|site|web.sayfa|landing.page|dashboard|e.ticaret|html.?css|web.uygulam|frontend|web.tasarim)/;
function localCommand(text){
 const q=clean(text);
 if(q.length>140||/[{}<>;]/.test(q))return null;
 if(/^(?:yeni.sohbet|yeni.proje(?:.olustur)?|sifirdan.basla)$/i.test(q))return'new';
 if(/^(?:onizleme(?:yi)?.(?:ac|goster|yenile)|siteyi.goster|canli.onizleme|onizle)$/i.test(q))return'preview';
 if(/^(?:siteyi.indir|html.indir|web.projeyi.indir)$/i.test(q))return'downloadweb';
 if(/^(?:web.kodunu.(?:ac|duzenle)|html.(?:editor|duzenle)|kod.(?:editorunu.ac|duzenle))$/i.test(q))return'editweb';
 if(/^(?:apk.(?:olustur|indir|hazirla)|apk.yap|apk.icin.zip.hazirla|android.apk)$/i.test(q))return'apkguide';
 if(/^(?:colab.(?:ac|baglan|goster)|google.colab(?:.ac)?)$/i.test(q))return'colab';
 if(/^(?:github.a.yayinla|siteyi.yayinla|yayinlama.ekranini.ac)$/i.test(q))return'publish';
 if(/^(?:terminal(?:i)?.ac|kod.calistir(?:ma.alanini.ac)?)$/i.test(q))return'terminal';
 if(/^(?:proje.(?:sec|degistir|listesi|yonet)|projeler(?:i.ac)?)$/i.test(q))return'projects';
 if(/^(?:ekran.boyut(?:larini)?.(?:ac|degistir)|boyut(?:lari)?.(?:ac|ayarla)|duzeni.ac)$/i.test(q))return'layout';
 if(/^(?:api.(?:bagla|ayarlari)|openrouter.(?:bagla|ayarlari)|ayarlar)$/i.test(q))return'settings';
 return null;
}
function classify(text,currentMode='chat',priorMode='chat'){
 if(!enabled)return{mode:currentMode,auto:false};
 const action=localCommand(text);
 if(action)return{action,mode:currentMode,auto:true};
 const q=clean(text);
 const building=buildVerbs.test(q);
 const mobile=appWords.test(q),website=webWords.test(q);
 let mode=priorMode==='native'||priorMode==='build'?priorMode:currentMode;
 if(building&&mobile&&!website)mode='native';
 else if(building&&website&&!mobile)mode='build';
 else if(building&&mobile&&website){
  // Explicit app packaging beats mixed "mobile website" wording only when APK/React Native are mentioned.
  mode=/(?:apk|react.native|expo|android)/.test(q)?'native':'build';
 }
 if(!['chat','build','native'].includes(mode))mode='chat';
 return{mode,auto:true,reason:mode==='native'?'React Native + APK projesi':mode==='build'?'HTML/CSS/JS web projesi':'AI sohbet'};
}
const suggestions={
 site:'Modern, responsive ve kullanıcı dostu bir web sitesi oluştur. Tüm HTML/CSS/JS kodları tam olsun; çalışan menüler, örnek içerik ve mobil düzen ekle. Sohbette canlı önizle.',
 app:'React Native Expo ile profesyonel bir Android uygulaması oluştur. Eksiksiz App.js kodunu üret; dokunmatik düğmeler, temiz arayüz ve çalışan etkileşimler olsun.',
};
function prepare(kind){
 const id=hub.getState().active;
 if(!id)hub.newChat();
 const mode=kind==='app'?'native':'build';
 hub.setMode(mode);
 const input=$('dhInput');input.value=suggestions[kind];input.focus();
 if(window.DimensiaOpenRouter?.hasKey?.()){
  setStatus('AI üretimi başlatıldı. İlgili proje sohbetinde oluşturulacak.');
  void hub.send();
 }else setStatus('AI üretimi için önce OpenRouter anahtarını bağla. İstek metnin korunuyor.');
}
function execute(action){
 const key=String(action||'');
 if(key==='site'||key==='app'){prepare(key);return{message:'İstek metnini hazırladım. Gönder düğmesine basarak AI üretimini başlatabilirsin.',actions:[]}}
 if(key==='new'){hub.newChat();setStatus('Yeni sohbet ve ona özel proje açıldı.');return{message:'Yeni sohbet açıldı. Bu sohbetin projesi ayrıdır.',actions:['site','app']}}
 if(key==='preview'){
  const info=hub.getArtifact?.();
  if(!info){setStatus('Henüz web önizlemesi yok. Önce “Site yap” seç.');return{message:'Bu sohbette henüz çalışan web önizlemesi yok. Önce bir site oluştur.',actions:['site']}}
  hub.showPreview?.();setStatus('Canlı web önizlemesi açıldı.');return{message:'Canlı site önizlemesi açıldı.',actions:['editweb','downloadweb']}
 }
 if(key==='editweb'){
  if(!hub.getArtifact?.()){setStatus('Düzenlenecek web projesi yok.');return{message:'Düzenlenecek web sitesi bulunamadı.',actions:['site']}}
  hub.showPreview?.();window.DimensiaChatEditor?.open?.();setStatus('HTML/CSS/JS editörü açıldı.');return{message:'HTML/CSS/JS kod düzenleyicisi açıldı.',actions:['preview']}
 }
 if(key==='downloadweb'){
  if(!hub.getArtifact?.()){return{message:'İndirilecek web sitesi yok.',actions:['site']}}
  $('dhDownload')?.click();setStatus('HTML indirme işlemi başlatıldı.');
  return{message:'Web sitenin HTML dosyasının indirilmesi başlatıldı.',actions:['preview']}
 }
 if(key==='native'||key==='apkguide'||key==='zip'){
  hub.setMode('native');window.DimensiaNativeStudio?.open?.();setStatus('Mobil uygulama projesi ve APK adımları açıldı.');
  if(key==='zip')window.DimensiaNativeStudio?.exportZIP?.();
  return{message:key==='zip'?'Mobil proje ZIP paketi hazırlama/indirme işlemi başlatıldı. APK için Colab’da derleme yapmalısın.':
   'APK derlemesi Google Colab’da, senin onayınla yapılır. Mobil editörde kaynakları hazırla, ZIP indir, Colab’a yükleyip derle.',
   actions:['native','zip','colab']}
 }
 if(key==='colab'){
  window.DimensiaNativeStudio?.open?.();
  const url=window.DimensiaNativeStudio?.colabUrl;
  if(url)window.open(url,'_blank','noopener,noreferrer');
  setStatus('Google Colab not defteri açıldı. ZIP dosyanı oraya yüklemen gerekir.');
  // Do not claim a build or silently send code to Colab.
  return{message:'Google Colab Android derleyicisi hazır. ZIP dosyanı indir, Colab bağlantısını aç, yükle ve hücreleri çalıştır. Derleme Colab kaynaklarına bağlıdır.',actions:['zip','colab']}
 }
 if(key==='publish'){
  hub.openStudio?.();$('dimensiaLaunchpad')?.scrollIntoView({block:'start',behavior:'smooth'});
  setStatus('GitHub yayın paneli açıldı. Onaylamadan yayın yapılmaz.');
  return{message:'GitHub yayın paneli açıldı. Depoyu ve hedef site adını kontrol edip yalnızca kendin onayladıktan sonra yayımlayabilirsin.',actions:[]}
 }
 if(key==='terminal'){
  window.DimensiaChatRunner?.open?.();setStatus('Kod çalıştırma alanı açıldı. Bulut çalıştırması için ayrıca onay gerekiyor.');
  return{message:'Kod çalıştırma alanı açıldı. GitHub Actions üzerinde kod çalıştırmak için onay gerekiyor.',actions:[]}
 }
 if(key==='projects'){
  window.DimensiaChatRunner?.open?.();$('dwpBar')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  setStatus('Proje yöneticisi açıldı.');return{message:'Projeler ve kod dosyaları açıldı.',actions:[]}
 }
 if(key==='layout'){
  window.DimensiaLayout?.open?.();setStatus('Sohbet ve terminal ekran boyutlarını ayarlayabilirsin.');
  return{message:'Ekran düzeni açıldı. Bölüm boyutlarını kaydedebilirsin.',actions:[]}
 }
 if(key==='settings'){
  hub.openStudio?.();document.querySelector('[data-nav="settings"]')?.click();$('orKey')?.focus();
  setStatus('OpenRouter API bağlantısı ayarlarını açtım.');
  return{message:'OpenRouter ayarları açıldı. API anahtarını yalnızca kendi tarayıcındaki alana gir.',actions:[]}
 }
 return{message:'Bu komut için otomatik işlem bulunamadı.',actions:[]};
}
function hasAction(a){return Object.hasOwn(ACTIONS,a)||a==='site'||a==='app'}
function noteAction(id){
 const state=hub.getState(),chatId=state.active;
 const chatName=hub.getChats()?.find(c=>c.id===chatId)?.title||'Yeni proje';
 $('dauProject').textContent='▦ '+chatName.slice(0,34);
}
function clickAction(action){
 const result=execute(action);
 if(result?.message)setStatus(result.message);
}
bar.querySelectorAll('[data-dau]').forEach(b=>b.onclick=()=>clickAction(b.dataset.dau));
document.addEventListener('dimensia:chat-activated',noteAction);
document.addEventListener('dimensia:chat-titled',noteAction);
document.addEventListener('dimensia:openrouter-status',()=>{
 if(!window.DimensiaOpenRouter?.hasKey?.())setStatus('AI üretimi için Ayarlar → OpenRouter bağlantısını kur. Yerel araçlar hazır.');
});
reflect();noteAction();
window.DimensiaAutoPilot={
 classify,execute,enabled:()=>enabled,setEnabled:enable,actions:()=>({...ACTIONS}),allowed:hasAction,
 onGeneration:(mode)=>{
  const msg=mode==='native'?'Android uygulaması için React Native kodu hazırlanıyor…':
   mode==='build'?'Web projesi oluşturuluyor; tamamlanınca canlı önizlenecek…':'AI yanıtı hazırlanıyor…';
  setStatus(msg);
 },
 onResult:(mode,success)=>{
  setStatus(success?(mode==='native'?'Mobil proje kodu güncellendi. ZIP ve Colab adımları hazır.':
   mode==='build'?'Web sitesi hazır; canlı önizlemeden kontrol edebilirsin.':'AI yanıtladı.'):
   'Üretim tamamlanamadı. Mevcut proje dosyaları korunuyor.');
 }
};
})();