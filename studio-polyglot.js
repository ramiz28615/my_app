/* Dimensia Polyglot Workspace 7.0 — source files + real multi-language GitHub runner.
 * UI never pretends Bash/Rust/Perl execute on GitHub Pages.
 * An explicit public-code consent is required before uploading & dispatching jobs.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const anchor=$('dimensiaCodeLab');
const lab=()=>window.DimensiaCodeLab,github=()=>window.DimensiaLaunchpad,openRouter=()=>window.DimensiaOpenRouter;
if(!anchor||!lab())return;
const SPECS=[
 {key:'html',name:'HTML',file:'index.html',icon:'◇',runtime:'Tarayıcı önizlemesi'},
 {key:'css',name:'CSS',file:'style.css',icon:'◐',runtime:'Tarayıcı önizlemesi'},
 {key:'javascript',name:'JavaScript',file:'main.js',icon:'⌘',runtime:'Tarayıcı + Node 22'},
 {key:'python',name:'Python',file:'main.py',icon:'🐍',runtime:'Pyodide + Python 3'},
 {key:'rust',name:'Rust',file:'main.rs',icon:'⚙',runtime:'GitHub Actions rustc'},
 {key:'bash',name:'Bash / SH',file:'main.sh',icon:'⌁',runtime:'GitHub Actions Bash'},
 {key:'perl',name:'Perl',file:'main.pl',icon:'◆',runtime:'GitHub Actions Perl'},
 {key:'reactnative',name:'React Native',file:'App.js',icon:'▣',runtime:'Expo proje kontrolü'}
];
const RESULTS=['web','javascript','python','rust','bash','perl','reactnative'];
const NAMES={web:'HTML / CSS',javascript:'JavaScript',python:'Python',rust:'Rust',bash:'Bash',perl:'Perl',reactnative:'React Native'};
const initial=lab().getFiles();
const files={...initial},updated=new Set();
for(const x of SPECS)if(typeof files[x.key]!=='string')files[x.key]='';
let current='python',busy=false,report=null,task=null,selected='python',timer=null,stopRequested=false,previewOn=false;
const panel=document.createElement('section');
panel.id='dimensiaPolyglot';panel.className='polyglot-workspace';panel.setAttribute('aria-label','Python Rust Bash Perl JavaScript çok dilli proje editörü');
panel.innerHTML=
 '<header class="poly-head"><div><div class="poly-kicker">DIMENSIA / MULTI-LANGUAGE FULL CODE STUDIO</div>'+
 '<h2>Tek proje. <em>Tüm diller.</em></h2>'+
 '<p>Python, Rust, Bash, Perl, JavaScript, HTML/CSS ve React Native kaynaklarını tek çalışma alanında yaz. Web projesini anında önizle; tüm uygun dilleri GitHub Actions üzerinde paralel çalıştır ve sonuçları karşılaştır.</p></div>'+
 '<div class="poly-head-actions"><span class="poly-live">● Çoklu dil çalışma alanı</span>'+
 '<button type="button" class="poly-button" id="polyGotoToken">⚙ GitHub bağlantısı</button></div></header>'+
 '<div class="poly-body"><aside class="poly-sidebar" aria-label="Proje dosyaları">'+
 '<div class="poly-sidebar-title">PROJE DOSYALARI <small id="polyFileCount">8 dosya</small></div>'+
 '<div class="poly-files" id="polyFiles"></div>'+
 '<div class="poly-sidebar-foot">Tüm dosyalar tek projede düzenlenir. Çalıştırılmamış kod kendiliğinden GitHub’a yüklenmez.</div></aside>'+
 '<div class="poly-editor-area"><div class="poly-current"><div><strong id="polyFileName">main.py</strong>'+
 '<small id="polyRuntime">Python · Tarayıcı / GitHub</small></div>'+
 '<div class="poly-controls"><button type="button" class="poly-button" id="polyDownload">↓ Dosyayı indir</button>'+
 '<button type="button" class="poly-button" id="polyReset">↶ Örneğe dön</button></div></div>'+
 '<div class="poly-editor-line"><span>⌘ CODE</span><span id="polyCount">0 satır</span></div>'+
 '<textarea id="polyEditor" aria-label="Seçilen dile ait düzenlenebilir kaynak kod" spellcheck="false" wrap="off" autocorrect="off" autocomplete="off" autocapitalize="off"></textarea>'+
 '<div class="poly-toolbar"><button id="polyPreview" type="button" class="poly-button">◎ HTML/CSS/JS Önizle</button>'+
 '<button id="polyCloud" type="button" class="poly-button poly-primary">▶ Tüm Dilleri Çalıştır</button>'+
 '<button id="polySaveAll" type="button" class="poly-button">↑ Dosyaları GitHub’a Kaydet</button></div>'+
 '<div class="poly-ai"><label for="polyPrompt">✧ AI ile çok dilli proje üret</label>'+
 '<textarea id="polyPrompt" rows="2" maxlength="3500" placeholder="Örneğin: Python ile analiz, Rust ile hızlı hesaplama, Perl ile rapor, Bash ile otomasyon ve JS/HTML ile arayüz..."></textarea>'+
 '<div class="poly-actions"><button type="button" id="polyGenerate" class="poly-button">✦ Tüm Diller İçin Kod Öner</button>'+
 '<small>OpenRouter anahtarın gerekir · AI kodlarını çalıştırmadan önce gözden geçir</small></div></div></div></div>'+
 '<section class="poly-run-panel"><div class="poly-run-heading"><div><strong>⌁ Çalıştırma merkezi</strong>'+
 '<small id="polyRunText">Henüz bulut testi yapılmadı. İşler GitHub-hosted Ubuntu üzerinde ayrı ayrı çalışır.</small></div>'+
 '<div class="poly-run-actions"><button type="button" class="poly-button" id="polyOpenActions">↗ GitHub Actions</button>'+
 '<button type="button" class="poly-button" id="polyReportDownload" disabled>↓ Rapor indir</button></div></div>'+
 '<label class="poly-consent"><input type="checkbox" id="polyConsent"><span>Kodların ve sonuçların herkese açık GitHub depomda yayınlanacağını, çalıştırılacak kodu kontrol ettiğimi ve gizli anahtar yüklemeyeceğimi kabul ediyorum.</span></label>'+
 '<div class="poly-run-steps" id="polySteps"><span data-poly-step="0">1 · Dosyaları hazırla</span>'+
 '<span data-poly-step="1">2 · GitHub’a yükle</span><span data-poly-step="2">3 · Bulutta çalıştır</span>'+
 '<span data-poly-step="3">4 · Sonuçları göster</span></div>'+
 '<div class="poly-result-grid" id="polyResultGrid"></div>'+
 '<div class="poly-output-box"><div class="poly-output-title"><strong id="polyOutputTitle">⌁ Python çıktısı</strong>'+
 '<span id="polyOutputStatus">Bekleniyor</span></div>'+
 '<pre id="polyOutput" aria-live="polite">Bir dili çalıştırdığında gerçek stdout/stderr, exit kodu ve durum burada görünür.</pre></div>'+
 '<p class="poly-disclaimer">⚠ Kodlar ayrı GitHub Actions sanal makinelerinde çalışır; internet erişimi vardır. Çalışma dosyalarını ve sonuç raporlarını herkese açık depoya yazmadan önce kontrol et. Bu bir güvenlik garantili çok kullanıcılı sandbox değildir. React Native yalnızca proje yapısı kontrolü yapar; APK üretimi için Expo/EAS gerekir.</p></section>';
anchor.after(panel);
const editor=$('polyEditor');
const selectedSpec=()=>SPECS.find(x=>x.key===current);
const short=(s,n=160)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
const secret=text=>/(?:github_pat_[A-Za-z0-9_]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-or-v1-[A-Za-z0-9_-]{18,}|AKIA[A-Z0-9]{16})/.test(String(text||''));
const message=(text,error=false)=>{$('polyRunText').textContent=text;$('polyRunText').classList.toggle('error',error)};
function count(){
 const text=editor.value;$('polyCount').textContent=text.split('\n').length.toLocaleString('tr-TR')+' satır · '+text.length.toLocaleString('tr-TR')+' karakter';
}
function syncCurrent(){
 if(files[current]!==editor.value){files[current]=editor.value;updated.add(current);lab().setFile(current,editor.value)}
}
function renderFileList(){
 const root=$('polyFiles');root.replaceChildren();
 for(const x of SPECS){
  const button=document.createElement('button');button.type='button';button.className='poly-file'+(x.key===current?' active':'');
  button.dataset.language=x.key;button.setAttribute('aria-pressed',String(x.key===current));
  const icon=document.createElement('span');icon.className='poly-file-icon';icon.textContent=x.icon;
  const label=document.createElement('span');label.className='poly-file-label';
  const title=document.createElement('strong');title.textContent=x.file;
  const detail=document.createElement('small');detail.textContent=x.name;
  label.append(title,detail);button.append(icon,label);
  if(updated.has(x.key)){const dot=document.createElement('b');dot.textContent='●';dot.className='poly-file-dot';button.append(dot)}
  button.onclick=()=>selectFile(x.key);root.append(button);
 }
}
function selectFile(key){
 if(!SPECS.some(x=>x.key===key))return;
 if(editor.value!==files[current])syncCurrent();
 current=key;const x=selectedSpec();editor.value=files[key];
 $('polyFileName').textContent=x.file;$('polyRuntime').textContent=x.runtime;
 renderFileList();count();
}
function downloadCurrent(){
 syncCurrent();
 const x=selectedSpec(),url=URL.createObjectURL(new Blob([files[current]],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=x.file;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 message('Dosya indirildi: '+x.file);
}
function resetCurrent(){
 const original=initial[current]||'';
 if(!confirm(selectedSpec().file+' dosyasındaki değişiklikler örnek kodla değiştirilsin mi?'))return;
 files[current]=original;lab().setFile(current,original);editor.value=original;updated.delete(current);
 renderFileList();count();message('Örnek kaynak geri yüklendi.');
}
function previewWeb(){
 syncCurrent();
 try{
  const html=files.html||'';
  if(!/<html[\s>]/i.test(html)||!/<\/html>/i.test(html))throw Error('index.html tam HTML dokümanı olmalı.');
  const dom=new DOMParser().parseFromString(html,'text/html');
  dom.querySelector('style[data-polyglot]')?.remove();
  const style=dom.createElement('style');style.dataset.polyglot='true';style.textContent=files.css||'';
  dom.head.append(style);
  dom.querySelector('script[data-polyglot]')?.remove();
  if(/<\/script\s*>/i.test(files.javascript))throw Error('JavaScript dosyasında kapanış script etiketi bulunuyor.');
  const js=dom.createElement('script');js.dataset.polyglot='true';js.textContent=files.javascript||'';
  dom.body.append(js);
  const generated='<!doctype html>\n'+dom.documentElement.outerHTML;
  if(generated.length>750000)throw Error('HTML önizlemesi çok büyük.');
  if(secret(generated))throw Error('Önizlemede olası gizli API anahtarı var.');
  showHTML(generated,'Dimensia Polyglot Web');
  $('tabPreview')?.click();$('previewFrameWrap')?.scrollIntoView({behavior:'smooth',block:'center'});
  message('✓ HTML/CSS/JS birleşik önizleme başlatıldı; site içi butonlar izole iframe içinde çalışır.');
 }catch(e){message('Önizleme hatası: '+short(e.message,250),true)}
}
function showStep(n){
 panel.querySelectorAll('[data-poly-step]').forEach((x,i)=>{x.classList.toggle('current',i===n);x.classList.toggle('done',i<n)});
}
function setupResults(){
 const root=$('polyResultGrid');root.replaceChildren();
 for(const key of RESULTS){
  const b=document.createElement('button');b.className='poly-result'+(selected===key?' selected':'');b.type='button';b.dataset.result=key;
  const name=document.createElement('strong');name.textContent=NAMES[key];
  const state=document.createElement('small');state.textContent=report?.jobs?.[key]?.status||'bekliyor';
  b.append(name,state);b.onclick=()=>selectResult(key);root.append(b);
 }
 selectResult(selected);
}
function selectResult(key){
 if(!RESULTS.includes(key))return;
 selected=key;const r=report?.jobs?.[key]||null;
 panel.querySelectorAll('[data-result]').forEach(x=>x.classList.toggle('selected',x.dataset.result===key));
 $('polyOutputTitle').textContent='⌁ '+NAMES[key]+' · '+(r?.label||'Çalışma çıktısı');
 $('polyOutputStatus').textContent=r?r.status+(Number.isFinite(r.durationMs)?' · '+r.durationMs+' ms':''):'bekliyor';
 if(!r){$('polyOutput').textContent='Çalıştırma başladığında bu dilin stdout/stderr çıktısı ve derleme sonuçları burada görünür.';return}
 const steps=(r.steps||[]).map(x=>x.step+' → '+x.status+' (exit '+x.exitCode+', '+x.ms+' ms)').join('\n');
 $('polyOutput').textContent='Durum: '+r.status+'\n'+steps+
  '\n\nSTDOUT\n'+(r.stdout||'(boş)')+'\n\nSTDERR\n'+(r.stderr||'(boş)');
}
function makeId(){
 const array=new Uint8Array(10);
 if(crypto?.getRandomValues)crypto.getRandomValues(array);else for(let i=0;i<array.length;i++)array[i]=Math.floor(Math.random()*256);
 return 'r'+Array.from(array,x=>(x%36).toString(36)).join('');
}
function collectFiles(){
 syncCurrent();
 const all=lab().getFiles();
 for(const x of SPECS){const val=files[x.key];if(typeof val!=='string'||new TextEncoder().encode(val).length>100000)throw Error(x.file+' en fazla 100 KB olabilir.');if(secret(val))throw Error(x.file+' gizli API anahtarı içeriyor olabilir; GitHub’a yüklenmedi.');all[x.key]=val}
 return all;
}
function ensureConsent(){
 if(!$('polyConsent').checked)throw Error('Önce herkese açık kaynak kodu ve sonuç paylaşımını onayla.');
 if(!github()?.savePolyglotFiles||!github()?.startPolyglotRun)throw Error('GitHub bağlantı modülü henüz yüklenmedi.');
 const details=$('launchOwner')?.value.trim()+'/'+$('launchRepo')?.value.trim();
 if(!confirm(details+' deposuna 8 kaynak dosyasını HERKESE AÇIK yüklemek istiyor musun? Kodlar daha sonra bulutta çalıştırılabilir. Gizli bilgilerin olmadığından emin ol.'))throw Error('GitHub yükleme işlemi iptal edildi.');
}
async function saveAll(){
 if(busy)return;
 busy=true;setBusy(true);showStep(1);
 try{
  ensureConsent();const payload=collectFiles();
  message('Dosyalar sırayla GitHub’a yükleniyor (8 dosya). Kodlar herkese açık olacak.');
  const saved=await github().savePolyglotFiles(payload);
  message('✓ '+saved.length+' dosya GitHub’a kaydedildi. Tüm Dilleri Çalıştır ile bulut testini başlat.');
  updated.clear();renderFileList();
 }catch(e){message('GitHub dosya kaydı: '+short(e.message,280),true)}
 finally{busy=false;setBusy(false);showStep(0)}
}
async function runAll(){
 if(busy)return;
 busy=true;stopRequested=false;setBusy(true);report=null;setupResults();showStep(1);
 try{
  ensureConsent();const payload=collectFiles();
  message('1/4 · 8 proje dosyası yetkili GitHub depoya aktarılıyor…');
  await github().savePolyglotFiles(payload);
  updated.clear();renderFileList();
  if(stopRequested)throw Error('İşlem kullanıcı tarafından durduruldu.');
  showStep(2);const id=makeId();
  message('2/4 · GitHub Actions 7 ayrı işi paralel başlatıyor: Web, JavaScript, Python, Rust, Bash, Perl, React Native kontrolü…');
  task=await github().startPolyglotRun(id);
  $('polyOpenActions').dataset.url=task.actionsUrl;
  message('3/4 · Bulut çalışması başlatıldı. Sonuçlar hazırlanıyor. İşlem başarısız olsa bile ayrı hata raporları gösterilecek.');
  for(let i=0;i<45;i++){
   if(stopRequested)throw Error('Rapor bekleme durduruldu. GitHub Actions üzerinde başlamış işi ayrıca iptal etmen gerekir.');
   await new Promise(resolve=>setTimeout(resolve,i<8?3500:6000));
   let fetched;
   try{fetched=await github().fetchPolyglotReport(task)}
   catch(e){if(/403|429|forbidden|rate.limit/i.test(String(e.message)))throw e;continue}
   if(fetched){
    report=fetched;showStep(3);setupResults();
    message('✓ Gerçek bulut raporu geldi: '+report.passed+'/'+report.total+' iş başarılı, '+report.failed+' başarısız. Web ve React Native yalnızca yapısal kontroldür.',report.failed>0);
    $('polyReportDownload').disabled=false;
    return;
   }
  }
  throw Error('Rapor henüz dönmedi. GitHub Actions sekmesinde iş durumuna bak; sonuçlar /code-lab/reports/ altında yayınlanır.');
 }catch(e){message('Çalıştırma: '+short(e.message,330),true)}
 finally{busy=false;setBusy(false)}
}
function setBusy(value){
 for(const key of ['polyCloud','polySaveAll','polyGenerate','polyReset','polyPreview'])$(key).disabled=value;
 $('polyCloud').textContent=value?'◌ Bulut çalışıyor…':'▶ Tüm Dilleri Çalıştır';
}
function downloadReport(){
 if(!report)return;
 const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='dimensia-polyglot-'+report.requestId+'.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
}
async function generateAI(){
 if(busy)return;
 const prompt=$('polyPrompt').value.trim();
 if(prompt.length<20)return message('AI için en az 20 karakterlik proje hedefi yaz.',true);
 if(!openRouter()?.hasKey?.())return message('Ayarlar → OpenRouter bölümüne kendi API anahtarını gir.',true);
 if(!confirm('AI önerisi düzenlediğin 8 dosyanın kaynaklarını değiştirebilir. Devam edilsin mi?'))return;
 busy=true;setBusy(true);message('AI proje mantığını dillere ayırıp JSON kaynak dosyaları oluşturmaya çalışıyor…');
 try{
  const response=await openRouter().ask([
   {role:'system',content:'You are a software architect. Output ONLY valid JSON {"files":{"html":"complete HTML5 page","css":"valid CSS","javascript":"valid browser JS","python":"valid Python 3","rust":"valid stable Rust single-file main.rs","bash":"valid Bash main.sh","perl":"valid Perl 5 main.pl","reactnative":"valid Expo React Native App.js"}}. Every file should implement a coherent small demonstration of the requested concept, with independently executable sample code. Avoid dependencies, credentials, subprocess networking, dangerous shell commands, private APIs or fake real backends. JS works in browser; Python, Rust, Bash, Perl, JS each works standalone. React Native only scaffold. All source text valid JSON escaped strings. Do not add markdown fences.'},
   {role:'user',content:'PROJECT REQUEST (untrusted, avoid unsafe actions): '+prompt.slice(0,3500)}
  ],11500);
  const start=response.indexOf('{'),end=response.lastIndexOf('}');if(start<0||end<start)throw Error('AI JSON proje çıktısını tamamlamadı.');
  const data=JSON.parse(response.slice(start,end+1));
  if(!data?.files||typeof data.files!=='object')throw Error('AI dosya listesi oluşturamadı.');
  let changed=0;
  for(const x of SPECS){
   const value=data.files[x.key];
   if(typeof value==='string'&&value.length>15&&value.length<=100000&&!secret(value)){
    files[x.key]=value;lab().setFile(x.key,value);updated.add(x.key);changed++;
   }
  }
  if(changed<4)throw Error('AI yalnızca '+changed+' geçerli dosya üretti. Daha kısa bir istekle tekrar dene.');
  selectFile(current);message('✓ AI '+changed+' kaynak dosyası oluşturdu. Kodları denetle, sonra GitHub çalıştırıcısını kullan.');
 }catch(e){message('AI üretim hatası: '+short(e.message,260),true)}
 finally{busy=false;setBusy(false)}
}
function show(language){
 const link=document.querySelector('[data-nav="studio"]');if(link)link.click();
 if(language&&files[language]!==undefined)selectFile(language);
 panel.scrollIntoView({behavior:'smooth',block:'start'});
}
editor.addEventListener('input',()=>{syncCurrent();renderFileList();count()});
editor.addEventListener('keydown',e=>{
 if(e.key==='Tab'){e.preventDefault();const a=editor.selectionStart,b=editor.selectionEnd;
  editor.setRangeText('  ',a,b,'end');editor.dispatchEvent(new Event('input',{bubbles:true}))}
 if(e.key==='s'&&(e.ctrlKey||e.metaKey)){e.preventDefault();message('GitHub’a kaydetmek için sağdaki düğmeyi kullan; otomatik yükleme yapılmaz.')}
});
$('polyDownload').onclick=downloadCurrent;$('polyReset').onclick=resetCurrent;
$('polyPreview').onclick=previewWeb;$('polyCloud').onclick=runAll;$('polySaveAll').onclick=saveAll;
$('polyGenerate').onclick=generateAI;$('polyReportDownload').onclick=downloadReport;
$('polyOpenActions').onclick=()=>{
 const owner=$('launchOwner')?.value.trim()||'ramiz28615',repo=$('launchRepo')?.value.trim()||'my_app';
 if(!/^[A-Za-z0-9-]+$/.test(owner)||!/^[A-Za-z0-9._-]+$/.test(repo))return;
 window.open('https://github.com/'+owner+'/'+repo+'/actions/workflows/polyglot-execute.yml','_blank','noopener,noreferrer');
};
$('polyGotoToken').onclick=()=>{
 document.querySelector('[data-nav="studio"]')?.click();
 $('dimensiaLaunchpad')?.scrollIntoView({behavior:'smooth',block:'start'});
 $('launchToken')?.focus();
};
const chat=document.querySelector('#dhArtifact .dh-artifact-bottom');
if(chat){
 const shortcut=document.createElement('button');shortcut.id='dhPolyglot';shortcut.className='dh-utility';shortcut.type='button';
 shortcut.textContent='⚡ Çoklu Diller';shortcut.onclick=()=>show('python');
 chat.append(shortcut);
}
const menu=$('sidebar')?.querySelector('[data-nav="studio"]');
if(menu){
 const shortcut=document.createElement('button');shortcut.id='navPolyglot';shortcut.type='button';
 shortcut.className=menu.className.replace(/\bactive\b/g,'').trim();shortcut.textContent='⚡ Çoklu Diller';
 shortcut.onclick=()=>show('python');menu.after(shortcut);
}
selectFile('python');showStep(0);setupResults();message('Çok dilli editör hazır · GitHub Actions ile tüm dilleri paralel test edebilirsin.');
window.DimensiaPolyglot={show,runAll,saveAll,previewWeb,getFiles:()=>{syncCurrent();return{...files}},
 setFile:(language,content)=>{if(!SPECS.some(x=>x.key===language)||typeof content!=='string')return false;files[language]=content;lab().setFile(language,content);updated.add(language);if(current===language)editor.value=content;renderFileList();count();return true},
 getState:()=>({busy,current,updated:[...updated],reportReady:!!report,reportId:report?.requestId,results:report?.jobs||null})};
})();
