/* Dimensia Chat Multi-Runner 8.0.
 * The frontend never executes Bash, Perl or PHP. User-approved snippets are sent
 * to a read-only GitHub Actions runner; public stdout/stderr returns to this chat.
 * Auto mode prepares/initiates approval, never silently runs generated code.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const chat=$('dhConversation');
if(!chat||!window.DimensiaChatHub)return;
const LANGS=['python','bash','perl','php'];
const CONFIG={
 python:{name:'Python 3',file:'main.py'},
 bash:{name:'Bash / SH',file:'main.sh'},
 perl:{name:'Perl 5',file:'main.pl'},
 php:{name:'PHP 8.3',file:'main.php'}
};
const aliases={python:'python',py:'python',bash:'bash',sh:'bash',shell:'bash',perl:'perl',pl:'perl',php:'php'};
const empty=()=>({python:'',bash:'',perl:'',php:''});
let sources=empty(),current='python',busy=false,auto=false,report=null,runTask=null,runId='',polling=0,loadedChat='';
const section=document.createElement('section');
section.id='dhrPanel';section.className='dhr-panel';section.hidden=true;
section.setAttribute('aria-label','Sohbet Python Bash Perl PHP kod çalıştırma alanı');
section.innerHTML=
 '<div class="dhr-head"><div><strong>▶ Sohbette Kod Çalıştırıcı</strong>'+
 '<small>Python · Bash · Perl · PHP — gerçek GitHub Actions bulut çalıştırması</small></div>'+
 '<div class="dhr-top-actions"><button type="button" id="dhrGitHub" class="dhr-small">⚙ GitHub</button>'+
 '<button type="button" id="dhrClose" class="dhr-small" aria-label="Kod çalıştırma panelini kapat">✕</button></div></div>'+
 '<div id="dhrTabs" class="dhr-tabs" role="tablist" aria-label="Kodlama dili"></div>'+
 '<div class="dhr-editor-head"><span id="dhrFilename">main.py</span>'+
 '<span id="dhrEditorCount">0 karakter</span></div>'+
 '<textarea id="dhrEditor" rows="6" spellcheck="false" wrap="off" autocorrect="off" autocomplete="off" autocapitalize="off" aria-label="Sohbette çalıştırılacak kodu düzenle" placeholder="Kodunu buraya yaz veya sohbet yanıtındaki Çalıştır düğmesine bas..."></textarea>'+
 '<div class="dhr-toolbar"><button type="button" class="dhr-primary" id="dhrRunOne">▶ Bu dili çalıştır</button>'+
 '<button type="button" class="dhr-primary dhr-all" id="dhrRunAll">⚡ Dört dili birlikte çalıştır</button>'+
 '<button type="button" class="dhr-small" id="dhrClear">⌫ Temizle</button>'+
 '<button type="button" class="dhr-small" id="dhrToLab">⌘ Kod Lab’a aktar</button></div>'+
 '<label class="dhr-auto"><input id="dhrAuto" type="checkbox">'+
 '<span>AI yeni kod yazdığında otomatik çalıştırma onayını sor</span></label>'+
 '<p class="dhr-warning">Güvenlik: Kodlar ve sonuçlar herkese açık GitHub Actions kayıtlarında görülebilir. Her çalıştırma için açık onay gerekir. Kod GitHub deposundaki mevcut dosyaların üstüne yazılmaz. Gizli bilgi ekleme.</p>'+
 '<div id="dhrStatus" class="dhr-status" role="status" aria-live="polite">Kodunu yaz, sonra Çalıştır’a bas. GitHub Launchpad bağlantısı gerekir.</div>'+
 '<div class="dhr-result-head"><strong>Çalıştırma sonuçları</strong>'+
 '<div><button type="button" id="dhrActions" class="dhr-small" disabled>↗ GitHub İşleri</button>'+
 '<button type="button" id="dhrDownload" class="dhr-small" disabled>↓ Rapor</button></div></div>'+
 '<div id="dhrResultTabs" class="dhr-results" aria-label="Dil bazında çalışma sonuçları"></div>'+
 '<pre id="dhrOutput" class="dhr-output" aria-live="polite">Çalıştırma sonucu burada gösterilecek.</pre>';
const composer=chat.querySelector('.dh-composer-wrap');
if(!composer)return;
composer.before(section);
const editor=$('dhrEditor');
const short=(text,n=180)=>String(text??'').replace(/\s+/g,' ').trim().slice(0,n);
const secret=s=>/(?:sk-or-v1-[A-Za-z0-9_-]{18,}|github_pat_[A-Za-z0-9_]{18,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})/i.test(String(s||''));
const status=(msg,error=false)=>{$('dhrStatus').textContent=String(msg).slice(0,640);$('dhrStatus').classList.toggle('error',error)};
const encodeUtf8=str=>{
 const data=new TextEncoder().encode(str);
 if(data.length>38000)throw Error('Toplam kod paketi 38 KB sınırını aşıyor.');
 let bytes='';
 for(let offset=0;offset<data.length;offset+=4000)bytes+=String.fromCharCode(...data.subarray(offset,offset+4000));
 return btoa(bytes);
};
const id=()=>{
 const data=new Uint8Array(16);
 if(!window.crypto?.getRandomValues)throw Error('Güvenli çalışma kimliği oluşturulamıyor; HTTPS bağlantısı gerekli.');
 crypto.getRandomValues(data);
 return'r'+Array.from(data,x=>(x%36).toString(36)).join('');
};
const extract=text=>{
 const src=String(text||'');
 const blocks=empty();
 const exp=/(?:^|\n)\x60{3}(python|py|bash|sh|shell|perl|pl|php)[ \t]*\r?\n([\s\S]*?)\x60{3}/gi;
 let match;
 while((match=exp.exec(src))!==null){
  const language=aliases[match[1].toLowerCase()];
  if(language)blocks[language]=match[2].trim();
 }
 return blocks;
};
function count(){
 $('dhrEditorCount').textContent=editor.value.length.toLocaleString('tr-TR')+' karakter';
}
function saveTab(){sources[current]=editor.value}
function choose(lang){
 if(!CONFIG[lang])return;
 saveTab();
 current=lang;editor.value=sources[lang];
 $('dhrFilename').textContent=CONFIG[lang].file;
 section.querySelectorAll('[data-dhr-lang]').forEach(b=>{
  const selected=b.dataset.dhrLang===lang;b.classList.toggle('active',selected);
  b.setAttribute('aria-selected',String(selected));
 });
 count();renderResults();
}
function createTabs(){
 const root=$('dhrTabs');
 for(const lang of LANGS){
  const btn=document.createElement('button');btn.type='button';
  btn.dataset.dhrLang=lang;btn.textContent=CONFIG[lang].name;
  btn.onclick=()=>choose(lang);root.append(btn);
 }
}
function renderResults(){
 const root=$('dhrResultTabs');root.replaceChildren();
 for(const lang of LANGS){
  const data=report?.results?.[lang];
  const button=document.createElement('button');
  button.type='button';button.dataset.dhrResult=lang;
  button.className='dhr-result'+(current===lang?' active':'')+
   (data?.status==='passed'?' passed':data?.status==='failed'?' failed':'');
  button.textContent=CONFIG[lang].name+' · '+(data?.status==='passed'?'Başarılı':data?.status==='failed'?'Hata':data?.status==='skipped'?'Atlandı':'Bekliyor');
  button.onclick=()=>choose(lang);
  root.append(button);
 }
 const data=report?.results?.[current];
 if(!data){$('dhrOutput').textContent='Çalışma raporu geldiğinde '+CONFIG[current].name+' için sözdizimi, stdout, stderr ve çıkış kodu burada görünür.';return}
 const steps=Array.isArray(data.steps)?data.steps.map(x=>x.name+': '+x.status+' (exit '+x.exitCode+', '+x.durationMs+' ms)').join('\n'):'';
 $('dhrOutput').textContent=CONFIG[current].name+'\nDurum: '+data.status+'\nÇıkış kodu: '+data.exitCode+'\n'+steps+
  '\n\nSTDOUT\n'+(data.stdout||'(boş)')+'\n\nSTDERR\n'+(data.stderr||'(boş)');
}
function open(){
 section.hidden=false;
 section.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function hide(){section.hidden=true}
function fill(request){
 const next=request||{};
 const provided=LANGS.filter(x=>typeof next[x]==='string'&&next[x].trim().length);
 if(!provided.length)throw Error('Sohbet mesajında Python, Bash, Perl veya PHP kod bloğu bulunamadı.');
 if(busy)throw Error('Bir bulut çalıştırma işlemi devam ediyor.');
 const merged=empty();
 for(const lang of provided){
  if(new TextEncoder().encode(next[lang]).length>10000)throw Error(CONFIG[lang].file+' için kod sınırı 10 KB.');
  merged[lang]=next[lang];
 }
 sources=merged;
 current=provided[0];
 editor.value=sources[current];$('dhrFilename').textContent=CONFIG[current].file;
 section.querySelectorAll('[data-dhr-lang]').forEach(b=>{
  b.classList.toggle('active',b.dataset.dhrLang===current);
  b.setAttribute('aria-selected',String(b.dataset.dhrLang===current));
 });
 report=null;runTask=null;runId='';$('dhrActions').disabled=true;$('dhrDownload').disabled=true;
 count();renderResults();open();
 status(provided.map(x=>CONFIG[x].name).join(', ')+' kodu hazır. Kodları kontrol edip çalıştırabilirsin.');
 return provided;
}
function setBusy(value){
 busy=value;
 for(const key of ['dhrRunOne','dhrRunAll','dhrClear','dhrToLab'])$(key).disabled=value;
 $('dhrRunAll').textContent=value?'◌ Bulut kod çalıştırılıyor…':'⚡ Dört dili birlikte çalıştır';
}
async function run(which='all'){
 if(busy)return;
 saveTab();
 const selected=which==='one'?[current]:LANGS;
 const send={};
 for(const lang of selected){
  const code=String(sources[lang]||'').trim();
  if(!code)continue;
  if(new TextEncoder().encode(code).length>10000)return status(CONFIG[lang].file+' 10 KB sınırını aşıyor.',true);
  if(secret(code))return status('Olası gizli API anahtarı bulundu. Kodu buluta göndermeden önce kaldır.',true);
  send[lang]=code;
 }
 const names=Object.keys(send);
 if(!names.length)return status('Çalıştırılacak kod yok. Önce Python/Bash/Perl/PHP kodu yaz.',true);
 const api=window.DimensiaLaunchpad;
 if(!api?.startChatRun||!api?.fetchChatRunReport)
  return status('GitHub Launchpad erişilemiyor. Stüdyo → GitHub alanını kontrol et.',true);
 const disclosure='GitHub Actions üzerinde '+names.map(x=>CONFIG[x].name).join(', ')+' kodunu gerçekten çalıştırmak istiyor musun?\n\n'+
  'Kodlar workflow girişinde ve sonuçları herkese açık GitHub kayıtlarında görünebilir. Kodlar internete erişebilir; gizli veri içermemeli. Devam edilsin mi?';
 if(!confirm(disclosure))return status('Çalıştırma iptal edildi. Kodların editörde korunuyor.');
 let newId;
 try{newId=id()}catch(e){return status(e.message,true)}
 let encoded;
 try{encoded=encodeUtf8(JSON.stringify(send));if(encoded.length>58000)throw Error('GitHub girdi sınırı aşıldı.');}
 catch(e){return status('Paketleme: '+short(e.message,180),true)}
 setBusy(true);report=null;runTask=null;runId=newId;renderResults();
 status('GitHub Actions işine gönderiliyor… '+names.map(x=>CONFIG[x].name).join(', '));
 try{
  const task=await api.startChatRun(newId,encoded);
  runTask=task;
  $('dhrActions').disabled=false;
  status('Bulut işi başlatıldı. Her dil ayrı çalışıyor; sonuçlar sohbet panelinde gösterilecek.');
  for(let i=0;i<36;i++){
   await new Promise(resolve=>setTimeout(resolve,i<8?3200:5500));
   let response=null;
   try{response=await api.fetchChatRunReport(task)}
   catch(e){if(/401|403|429|forbidden|rate.limit/i.test(String(e?.message)))throw e;continue}
   if(response){
    report=response;
    $('dhrDownload').disabled=false;
    renderResults();
    const requestedPassed=names.filter(x=>report.results?.[x]?.status==='passed').length;
    status('✓ Bulut işlemi tamamlandı: '+requestedPassed+'/'+names.length+' dil başarılı. Hataları dil sekmelerinden inceleyebilirsin.',requestedPassed!==names.length);
    return;
   }
  }
  status('Rapor henüz yayınlanmadı. GitHub Actions düğmesiyle işin durumunu inceleyebilirsin.',true);
 }catch(e){status('Bulut çalıştırma hatası: '+short(e.message||e,410),true)}
 finally{setBusy(false)}
}
function navigateGitHub(){
 document.querySelector('[data-nav="studio"]')?.click();
 $('dimensiaLaunchpad')?.scrollIntoView({behavior:'smooth',block:'start'});
 $('launchToken')?.focus();
}
function exportReport(){
 if(!report)return;
 const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='dimensia-chat-'+report.requestId+'.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function goToLab(){
 saveTab();
 const lang=current;
 if(!window.DimensiaPolyglot?.setFile||lang==='php'){
  status(lang==='php'?'PHP kodunu sohbet editöründe çalıştırabilirsin. Code Lab PHP editörü bu sürümde yok.':'Code Lab henüz yüklenmedi.',true);
  return;
 }
 if(!confirm(CONFIG[lang].file+' kodunu Code Lab içindeki mevcut '+lang+' dosyasının yerine aktarmak istiyor musun?'))return;
 window.DimensiaPolyglot.setFile(lang,sources[lang]);
 window.DimensiaPolyglot.show(lang);
}
function handleRequest(data){
 if(!data)return;
 if(data.chatId&&data.chatId!==window.DimensiaChatHub.getState().active)return;
 try{
  const snippets=data.sources||extract(data.text);
  fill(snippets);
 }catch(e){status(e.message,true);open()}
}
createTabs();renderResults();choose('python');
$('dhrClose').onclick=hide;
$('dhrRunOne').onclick=()=>run('one');
$('dhrRunAll').onclick=()=>run('all');
$('dhrClear').onclick=()=>{
 if(busy)return;
 if(!confirm('Dört dilin geçici kod editörleri temizlensin mi?'))return;
 sources=empty();editor.value='';report=null;renderResults();count();status('Kod editörleri temizlendi.');
};
$('dhrToLab').onclick=goToLab;
$('dhrGitHub').onclick=navigateGitHub;
$('dhrActions').onclick=()=>{
 if(runTask?.actionsUrl&&/^https:\/\/github\.com\//.test(runTask.actionsUrl))
  window.open(runTask.actionsUrl,'_blank','noopener,noreferrer');
};
$('dhrDownload').onclick=exportReport;
editor.addEventListener('input',()=>{sources[current]=editor.value;count()});
editor.addEventListener('keydown',event=>{
 if(event.key==='Tab'){event.preventDefault();const a=editor.selectionStart,b=editor.selectionEnd;
  editor.setRangeText('  ',a,b,'end');editor.dispatchEvent(new Event('input',{bubbles:true}))}
 if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();void run('one')}
});
$('dhrAuto').onchange=()=>{
 const requested=$('dhrAuto').checked;
 if(requested&&!confirm('AI yeni Python/Bash/Perl/PHP kodu yazdığında bulut çalıştırma ONAYI otomatik sorulsun mu? Her işlem yine tek tek senin iznini gerektirir.'))$('dhrAuto').checked=false;
 auto=$('dhrAuto').checked;
 status(auto?'Otomatik onay isteme açık. Her çalışma için ayrıca izin sorulacak.':'Otomatik onay isteme kapalı.');
};
$('dhRunQuick')?.addEventListener('click',open);
document.addEventListener('dimensia:chat-code-request',event=>handleRequest(event.detail));
document.addEventListener('dimensia:chat-assistant-code',event=>{
 if(!auto)return;
 const state=window.DimensiaChatHub.getState();
 if(event.detail?.chatId!==state.active)return;
 try{
  const found=fill(extract(event.detail.text));
  if(found.length)void run('all'); // confirm before ANY GitHub network submission
 }catch(e){status(e.message,true)}
});
window.DimensiaChatRunner={
 open,fill,run,extract,
 getState:()=>({busy,auto,current,hasReport:!!report,runId,sources:Object.fromEntries(LANGS.map(x=>[x,sources[x].length])),
  results:report?.results||null}),
 getSources:()=>({...sources}),
 load:(src)=>fill(src),
 reset:()=>{if(busy)return;sources=empty();choose(current);report=null;renderResults()}
};
})();
