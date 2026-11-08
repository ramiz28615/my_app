/* Dimensia Native One-Click APK 8.5 — chat -> GitHub Actions -> artifact.
 * Colab is an interactive fallback. It is not a remotely controlled free worker.
 */
(()=>{
'use strict';
const hub=window.DimensiaChatHub,native=window.DimensiaNativeStudio,panel=document.getElementById('drnPanel');
if(!hub||!native||!panel)return;
const $=id=>document.getElementById(id);
const STORE='dimensia-native-build-history-v1',MAX_SOURCE=40000;
const SENSITIVE=/(?:sk-or-v1-[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{17,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})/i;
let records={};try{const old=JSON.parse(localStorage.getItem(STORE)||'{}');if(old&&typeof old==='object'&&!Array.isArray(old))records=old}catch{}
const widget=document.createElement('section');widget.id='dabBox';widget.className='dab-box';
widget.setAttribute('aria-label','Sohbetten tek komutla otomatik Android APK derleme');
widget.innerHTML='<div class="dab-title"><strong>⚡ Otomatik APK Oluştur</strong><span>GitHub Actions · Android debug</span></div>'+
 '<p>ZIP yüklemeden kodunu bulutta derler. GitHub hesabının Actions yetkisi ve onayın gerekir.</p>'+
 '<div class="dab-controls"><button type="button" id="dabBuild" class="drn-btn drn-primary">⚡ APK oluştur</button>'+
 '<button type="button" id="dabGitHub" class="drn-btn">🔑 GitHub bağla</button>'+
 '<button type="button" id="dabColab" class="drn-btn">Colab alternatifi</button></div>'+
 '<div id="dabProgress" role="status" aria-live="polite">Henüz APK derlemesi başlatılmadı.</div>'+
 '<div class="dab-links"><a id="dabRunLink" target="_blank" rel="noopener noreferrer" hidden>GitHub derlemeyi aç</a>'+
 '<a id="dabDownload" target="_blank" rel="noopener noreferrer" hidden>↓ APK paketi indir</a></div>'+
 '<small>Derleme başarılı olunca GitHub Actions APK dosyasını ZIP paketi içinde sunar. ZIP içindeki <code>app-debug.apk</code> dosyasını telefona kurabilirsin. Test APK’sidir; Play Store sürümü değildir. Gönderilen kaynak kodu GitHub Actions üzerinden görülebilir.</small>';
panel.querySelector('.drn-flow')?.before(widget);
const progress=$('dabProgress');
let pending=null;
function info(msg,bad=false){progress.textContent=String(msg).slice(0,350);progress.classList.toggle('error',bad)}
function persist(){
 try{
  const latest=Object.entries(records).sort((a,b)=>(b[1]?.date||0)-(a[1]?.date||0)).slice(0,24);
  localStorage.setItem(STORE,JSON.stringify(Object.fromEntries(latest)));
 }catch{}
}
function show(chatId=hub.getState().active){
 const task=records[chatId];
 const run=$('dabRunLink'),download=$('dabDownload');
 run.hidden=!task?.runUrl;run.removeAttribute('href');
 download.hidden=!task?.downloadUrl;download.removeAttribute('href');
 if(task?.runUrl)run.href=task.runUrl;
 if(task?.downloadUrl)download.href=task.downloadUrl;
 $('dabBuild').disabled=!!pending&&pending.chatId===chatId;
 if(!task)return info('Henüz APK derlemesi başlatılmadı.');
 const labels={queued:'GitHub Actions kuyruğunda…',in_progress:'Gradle derlemesi sürüyor…',
  uploading:'APK derlendi; dosya yükleniyor…',success:'✓ APK başarıyla derlendi. APK paketini indirebilirsin.',
  failed:'APK derlenemedi. GitHub hata ayrıntılarını aç.',interrupted:'Tarayıcı yeniden açıldı. GitHub derlemeyi açıp sonucu kontrol edebilirsin.'};
 info((labels[task.state]||'Derleme hazırlanıyor…')+(task.failedStep?' Hata aşaması: '+task.failedStep:''),
  task.state==='failed');
}
function makeId(){
 const rand=new Uint8Array(8);crypto.getRandomValues(rand);
 return'a'+Array.from(rand,b=>b.toString(36).padStart(2,'0')).join('');
}
function utf8Base64(source){
 const bytes=new TextEncoder().encode(source);
 if(bytes.length>MAX_SOURCE)throw Error('Bu otomatik derleyici tek App.js/App.tsx için en fazla 40 KB kabul ediyor. Daha küçük bileşenler kullan veya Colab yolunu seç.');
 if(bytes.length<32)throw Error('Uygulama kodu çok kısa veya boş.');
 let encoded='';for(const byte of bytes)encoded+=String.fromCharCode(byte);
 return btoa(encoded);
}
function payload(chatId){
 const files=native.getFiles(chatId);
 const entry=files['App.tsx']?'App.tsx':'App.js';
 const app=files[entry]||'';
 if(!/\bexport\s+default\b/.test(app))throw Error('Tam React Native App kodu gerekli (export default).');
 if(SENSITIVE.test(app))throw Error('Gizli anahtar tespit edildi. GitHub’a gönderilmedi.');
 let cfg,packageInfo;
 try{cfg=JSON.parse(files['app.json']);packageInfo=JSON.parse(files['package.json'])}catch{throw Error('app.json veya package.json geçersiz.')}
 const safeDeps=['expo','react','react-native'];
 const extras=Object.keys(packageInfo.dependencies||{}).filter(name=>!safeDeps.includes(name));
 if(extras.length)throw Error('Otomatik bulut derleyici ek npm bağımlılıklarını henüz kurmuyor: '+extras.join(', ')+'. Colab ile derle veya projeyi sadeleştir.');
 const appName=String(cfg.expo?.name||'Dimensia Mobil').slice(0,60);
 const androidPackage=String(cfg.expo?.android?.package||'');
 if(!/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){2,}$/.test(androidPackage))throw Error('Android uygulama paket adı geçersiz.');
 return{id:makeId(),chatId,appB64:utf8Base64(app),name:appName,androidPackage,language:entry==='App.tsx'?'tsx':'jsx'};
}
function openGitHub(){
 hub.openStudio?.();
 $('dimensiaLaunchpad')?.scrollIntoView({behavior:'smooth',block:'start'});
 info('GitHub Launchpad’e ramiz28615 / my_app deponu bağla. Token izinleri: Actions Read/Write, Contents Read.');
}
function post(chatId,text,actions){
 hub.postToolMessage?.(chatId,text,actions);
}
async function build({fromChat=false}={}){
 if(pending)throw Error('Önceki APK derlemesi izleniyor. Sonuç görünene kadar ikinci isteği başlatma.');
 native.open?.();
 const chatId=hub.getState().active;
 if(!chatId)throw Error('Önce bir sohbet oluştur.');
 let config;
 try{config=payload(chatId)}catch(error){info(error.message,true);post(chatId,'APK hazırlanamadı: '+error.message,['native','colab']);return{error:error.message}}
 const consent='Bu sohbetteki '+(config.language==='tsx'?'App.tsx':'App.js')+
   ' kodu GitHub Actions derlemesine gönderilecek. GitHub deposu herkese açık olduğu için kaynak ve işlem kayıtları başkalarınca görülebilir. GitHub Actions kotası kullanılabilir. Devam edilsin mi?';
 if(!confirm(consent)){info('APK derleme kullanıcı tarafından iptal edildi.');return{cancelled:true}}
 const api=window.DimensiaLaunchpad;
 if(!api?.startNativeApkBuild||!api?.fetchNativeApkBuild){
  info('GitHub Launchpad bağlantısı yüklenemedi.',true);return{error:'GitHub Launchpad bağlantısı eksik'};
 }
 $('dabBuild').disabled=true;
 info('GitHub Actions’a derleme isteği gönderiliyor…');
 const taskState={chatId,id:config.id,state:'queued',date:Date.now(),runUrl:'',downloadUrl:''};
 try{
  const remote=await api.startNativeApkBuild(config);
  taskState.runUrl=remote.actionsUrl;
  records[chatId]=taskState;persist();show(chatId);
  post(chatId,'⚡ APK derleme isteği GitHub Actions’a gönderildi. Sonuç bu sohbette gösterilecek.',['apkstatus','colab']);
  pending={chatId,remote};
  // Poll while the page is open. Token is memory-only, no background worker.
  for(let tries=0;tries<180;tries++){
   await new Promise(resolve=>setTimeout(resolve,tries===0?1500:8000));
   let status;
   try{status=await api.fetchNativeApkBuild(remote)}
   catch(error){if(tries>=5)throw error;continue}
   taskState.state=status.state;
   if(status.runUrl)taskState.runUrl=status.runUrl;
   if(status.downloadUrl)taskState.downloadUrl=status.downloadUrl;
   if(status.failedStep)taskState.failedStep=status.failedStep;
   records[chatId]={...taskState};persist();
   if(chatId===hub.getState().active)show(chatId);
   if(status.state==='success'){
    post(chatId,'✅ APK derlemesi başarılı! “APK paketini indir” düğmesinden ZIP dosyasını alıp içindeki app-debug.apk dosyasını kurabilirsin.',['apkdownload','apkstatus']);
    return status;
   }
   if(status.state==='failed'){
    post(chatId,'APK derlemesi başarısız. Hata aşaması: '+String(status.failedStep||'bilinmiyor')+'. GitHub işlem kaydındaki hatayı sohbetten düzelttirebilirsin.',['apkstatus','native']);
    return status;
   }
  }
  taskState.state='interrupted';records[chatId]={...taskState};persist();
  if(chatId===hub.getState().active)show(chatId);
  post(chatId,'Derleme izleme süresi doldu. GitHub derleme bağlantısını açıp sonucu kontrol edebilirsin.',['apkstatus']);
  return{state:'interrupted'};
 }catch(error){
  info('GitHub APK bağlantısı: '+error.message,true);
  post(chatId,'GitHub otomatik APK işlemi başlatılamadı: '+error.message+' GitHub bağlantını kontrol et.',['apkstatus','native','colab']);
  return{error:error.message};
 }finally{
  pending=null;$('dabBuild').disabled=false;
  if(chatId===hub.getState().active)show(chatId);
 }
}
function download(){
 const task=records[hub.getState().active];
 if(!task?.downloadUrl)return info('Henüz indirilebilir APK paketi yok.',true);
 window.open(task.downloadUrl,'_blank','noopener,noreferrer');
}
function openStatus(){
 native.open?.();const task=records[hub.getState().active];
 if(task?.runUrl)window.open(task.runUrl,'_blank','noopener,noreferrer');
 else info('Bu sohbet için GitHub üzerinde derleme kaydı yok.');
}
$('dabBuild').onclick=()=>{void build()};
$('dabGitHub').onclick=openGitHub;
$('dabColab').onclick=()=>window.open(native.colabUrl,'_blank','noopener,noreferrer');
document.addEventListener('dimensia:chat-activated',()=>show());
show();
window.DimensiaNativeBuild={
 build,download,openStatus,show,
 getState:()=>({chatId:hub.getState().active,pending:!!pending,record:records[hub.getState().active]||null}),
 getLast:(chatId)=>records[chatId]||null
};
})();