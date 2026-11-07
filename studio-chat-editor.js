/* Dimensia Inline Web IDE 6.1 — edit, execute, inspect, undo and export.
 * Source is never run in the parent app; only the sandboxed preview iframe executes it.
 * CSS/JS tabs edit the FIRST inline style/script block. Other blocks remain untouched.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const hub=window.DimensiaChatHub,artifact=$('dhArtifact'),frame=$('dhPreview');
 if(!hub||!artifact||!frame)return;
 const windowArea=artifact.querySelector('.dh-artifact-window');
 if(!windowArea)return;
 const panel=document.createElement('section');
 panel.id='dcePanel';panel.className='dce-panel';panel.hidden=true;
 panel.setAttribute('aria-label','HTML CSS JavaScript kaynak kod editörü');
 panel.innerHTML=
 '<div class="dce-header"><div class="dce-label"><span class="dce-live-dot">●</span>'+
 '<strong>Kod çalışma alanı</strong><small id="dceFileHint">index.html</small></div>'+
 '<div class="dce-header-actions"><button class="dce-icon" id="dceAdvanced" type="button" title="Gelişmiş Studio editörünü aç">↗ Studio</button>'+
 '<button class="dce-icon" id="dceClose" type="button" aria-label="Düzenleyiciyi kapat">✕</button></div></div>'+
 '<div class="dce-tabs" role="tablist" aria-label="Kaynak dosya seçimi">'+
 '<button type="button" data-dce-tab="html" class="active" aria-selected="true">⌘ index.html</button>'+
 '<button type="button" data-dce-tab="css" aria-selected="false">◐ style.css</button>'+
 '<button type="button" data-dce-tab="js" aria-selected="false">⚡ app.js</button></div>'+
 '<div class="dce-editor-wrap"><div class="dce-linebar" id="dceLinebar">01</div>'+
 '<textarea id="dceSource" spellcheck="false" wrap="off" aria-label="Düzenlenebilir kaynak kodu" autocomplete="off" autocapitalize="off" autocorrect="off"></textarea></div>'+
 '<div class="dce-state"><span id="dceState">Kaynak hazır</span><span id="dceCounter">0 satır</span></div>'+
 '<div class="dce-toolbar"><button type="button" class="dce-run" id="dceRun">▶ Çalıştır ve önizle</button>'+
 '<button type="button" class="dce-btn" id="dceUndo" title="Son çalıştırılan kaynağa geri dön">↶ Geri</button>'+
 '<button type="button" class="dce-btn" id="dceRedo" title="İleri al">↷ İleri</button>'+
 '<button type="button" class="dce-btn" id="dceDownload">↓ İndir</button></div>'+
 '<label class="dce-auto"><input type="checkbox" id="dceAuto" /> Düzenlerken otomatik önizleme <small>~900 ms sonra çalıştırır</small></label>'+
 '<div class="dce-console-head"><strong>⌁ JavaScript konsolu</strong><span id="dceLogCount">0 kayıt</span>'+
 '<button type="button" id="dceClear">Temizle</button></div>'+
 '<div id="dceConsole" class="dce-console" role="log" aria-live="polite"><div class="dce-log-empty">Çalıştır düğmesine bas, ardından önizlemede butonlara tıkla. Hata ve loglar burada görünür.</div></div>'+
 '<div class="dce-footnote">HTML/CSS/JS yalnızca izole önizlemede çalışır. Sunucu kodu, Python, Rust ve mobil APK için ayrı çalışma ortamı gerekir.</div>';
 const device=artifact.querySelector('.dh-device'),frameBox=$('dhFrameWrap');
 windowArea.insertBefore(panel,frameBox);
 const runTop=document.createElement('button');runTop.type='button';runTop.className='dh-primary';runTop.id='dhRunPreview';runTop.textContent='▶ Çalıştır';
 const bottom=artifact.querySelector('.dh-artifact-bottom');
 bottom?.insertBefore(runTop,$('dhEdit'));
 const textArea=$('dceSource');
 let currentId='',source='',draft='',tab='html',dirty=false,opened=false,history=[],pointer=0,timer=0,logs=[],applying=false;
 const limit=650000;
 const filename=t=>({html:'index.html',css:'style.css',js:'app.js'}[t]||'index.html');
 const info=()=>hub.getArtifact?.();
 const notify=(msg,bad=false)=>{const state=$('dceState');state.textContent=msg;state.classList.toggle('error',bad)};
 function hide(){
  opened=false;panel.hidden=true;windowArea.classList.remove('editor-open');
  artifact.classList.remove('editor-open');$('dhMain').classList.remove('editor-open');
  $('dhEdit').textContent='⌘ Kodu düzenle';
  clearTimeout(timer);
 }
 function open(){
  const current=info();
  if(!current){hide();return}
  if(current.id!==currentId){load(current)}
  opened=true;panel.hidden=false;windowArea.classList.add('editor-open');artifact.classList.add('editor-open');
  $('dhMain').classList.add('editor-open');$('dhEdit').textContent='⌘ Editörü kapat';
  renderTab();notify(dirty?'Kaydedilmemiş düzenleme var':'Kaynak hazır · Çalıştır ile siteyi yenile');
 }
 function load(current){
  currentId=current.id;source=current.html;draft=current.html;history=[current.html];pointer=0;dirty=false;
  tab='html';logs=[];clearTimeout(timer);
  renderLogs();renderTab();updateButtons();
 }
 function detectBlocks(html,kind){
  const documentHTML=new DOMParser().parseFromString(html,'text/html');
  if(kind==='css'){
   const els=[...documentHTML.querySelectorAll('style')];
   return{content:els[0]?.textContent||'',count:els.length};
  }
  const els=[...documentHTML.querySelectorAll('script:not([src])')].filter(e=>!e.type||e.type==='text/javascript'||e.type==='module');
  return{content:els[0]?.textContent||'',count:els.length};
 }
 function editSection(html,kind,content){
  if(kind==='html')return content;
  if(kind==='js'&&/<\/script\s*>/i.test(content))throw Error('JavaScript içinde kapanış script etiketi bulunamaz.');
  if(kind==='css'&&/<\/style\s*>/i.test(content))throw Error('CSS içinde kapanış style etiketi bulunamaz.');
  const dom=new DOMParser().parseFromString(html,'text/html');
  if(kind==='css'){
   const styles=dom.querySelectorAll('style');
   const tag=styles[0]||dom.createElement('style');
   tag.textContent=content;
   if(!styles.length)dom.head.append(tag);
  }else{
   const scripts=[...dom.querySelectorAll('script:not([src])')].filter(e=>!e.type||e.type==='text/javascript'||e.type==='module');
   const tag=scripts[0]||dom.createElement('script');
   tag.textContent=content;
   if(!scripts.length)dom.body.append(tag);
  }
  return '<!doctype html>\n'+dom.documentElement.outerHTML;
 }
 function countLines(){
  const v=textArea.value;
  $('dceCounter').textContent=(v.split('\n').length).toLocaleString('tr-TR')+' satır · '+v.length.toLocaleString('tr-TR')+' karakter';
  $('dceLinebar').textContent=String(v.slice(0,textArea.selectionStart).split('\n').length).padStart(2,'0');
 }
 function renderTab(){
  if(!panel)return;
  panel.querySelectorAll('[data-dce-tab]').forEach(b=>{
   const active=b.dataset.dceTab===tab;b.classList.toggle('active',active);
   b.setAttribute('aria-selected',String(active));
  });
  const parsed=tab==='html'?{content:draft,count:1}:detectBlocks(draft,tab);
  textArea.value=parsed.content;
  $('dceFileHint').textContent=filename(tab)+(parsed.count>1?' · ilk blok (toplam '+parsed.count+')':'');
  countLines();updateButtons();
 }
 function saveCurrentTab(){
  if(tab==='html'){draft=textArea.value;dirty=draft!==source;return}
  const original=detectBlocks(draft,tab).content;
  if(textArea.value!==original)draft=editSection(draft,tab,textArea.value);
  dirty=draft!==source;
 }
 function switchTab(next){
  if(!['html','css','js'].includes(next))return;
  try{saveCurrentTab()}catch(e){notify(e.message,true);return}
  tab=next;renderTab();notify(dirty?'Değişiklikler henüz çalıştırılmadı':'Kaynak hazır');
 }
 function updateButtons(){
  $('dceUndo').disabled=pointer<=0;
  $('dceRedo').disabled=pointer>=history.length-1;
 }
 function validate(html){
  if(html.length>limit)throw Error('Kod 650 KB sınırını aştı.');
  if(!/<!doctype html/i.test(html)||!/<html[\s>]/i.test(html)||!/<body[\s>]/i.test(html)||!/<\/html>/i.test(html))throw Error('Tam HTML5 dosyası gerekir: doctype, html, body ve kapanış etiketi.');
  if(/(?:sk-or-v1-[a-zA-Z0-9_-]{20,}|github_pat_[a-zA-Z0-9_]{15,}|ghp_[a-zA-Z0-9]{22,})/.test(html))throw Error('Olası gizli API anahtarı bulundu; çalıştırma engellendi.');
  return html;
 }
 function addLog(level,message){
  logs.push({level:String(level||'info').slice(0,12),message:String(message||'').slice(0,950),at:new Date().toLocaleTimeString('tr-TR')});
  if(logs.length>100)logs.shift();
  renderLogs();
 }
 function renderLogs(){
  const root=$('dceConsole');root.replaceChildren();
  $('dceLogCount').textContent=logs.length+' kayıt';
  if(!logs.length){
   const div=document.createElement('div');div.className='dce-log-empty';
   div.textContent='Önizlemede bir butona tıkla veya console.log çalıştır. Hatalar ve olaylar burada görünecek.';
   root.append(div);return;
  }
  for(const item of logs.slice(-45)){
   const div=document.createElement('div');div.className='dce-log '+(item.level==='error'?'is-error':item.level==='warn'?'is-warn':'');
   const content=document.createElement('span');content.textContent='['+item.level+'] '+item.message;
   const time=document.createElement('small');time.textContent=item.at;
   div.append(content,time);root.append(div);
  }
  root.scrollTop=root.scrollHeight;
 }
 function apply(html,{record=true}={}){
  const complete=validate(html);
  applying=true;
  try{hub.updateArtifact(complete)}finally{applying=false}
  source=complete;draft=complete;dirty=false;
  if(record&&history[pointer]!==complete){
   history=history.slice(0,pointer+1);
   history.push(complete);
   if(history.length>22)history.shift();
   pointer=history.length-1;
  }
  updateButtons();notify('✓ Kod çalıştırıldı ve önizleme yenilendi');
  addLog('info','HTML/CSS/JS yeniden yüklendi · '+Math.round(complete.length/1024)+' KB');
 }
 function run(){
  if(!info())return notify('Önce bir site oluştur.',true);
  try{saveCurrentTab();logs=[];renderLogs();apply(draft);renderTab()}
  catch(e){notify('✕ '+e.message,true);addLog('error',e.message)}
 }
 function undoRedo(direction){
  if(!info())return;
  const target=pointer+direction;if(target<0||target>=history.length)return;
  if(dirty&&!confirm('Henüz çalıştırılmamış değişikliklerin yerine sürüm geçmişi yüklensin mi?'))return;
  pointer=target;
  try{apply(history[pointer],{record:false});renderTab();notify('↶ Geçmiş sürüm yüklendi')}
  catch(e){notify(e.message,true)}
 }
 function download(){
  if(!info())return;
  try{saveCurrentTab()}catch(e){notify(e.message,true);return}
  const blob=new Blob([draft],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='dimensia-edited-site.html';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  notify('HTML indirildi · '+Math.round(draft.length/1024)+' KB');
 }
 function updateFromHub(e){
  if(applying)return;
  const data=e.detail||{};
  if(!data.available){hide();currentId='';source='';draft='';return}
  if(data.id!==currentId){load({id:data.id,html:data.html})}
  else if(data.html!==source&&!dirty){
   source=data.html;draft=data.html;history=[data.html];pointer=0;renderTab();
  }
 }
 document.addEventListener('dimensia:chat-artifact-change',updateFromHub);
 window.addEventListener('message',event=>{
  if(event.source!==frame.contentWindow||!event.data||event.data.channel!=='DIMENSIA_PREVIEW_V1')return;
  const d=event.data;
  if(!['console','network','actions'].includes(d.type)||typeof d.message!=='string')return;
  addLog(d.level==='error'?'error':d.level==='warn'?'warn':d.type,d.message);
 });
 panel.querySelectorAll('[data-dce-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.dceTab));
 textArea.addEventListener('input',()=>{
  clearTimeout(timer);
  dirty=true;countLines();notify('● Düzenleme var · Çalıştır ile uygula');
  if($('dceAuto').checked)timer=setTimeout(run,900);
 });
 textArea.addEventListener('keydown',event=>{
  if(event.key==='Tab'){
   event.preventDefault();const a=textArea.selectionStart,b=textArea.selectionEnd;
   textArea.setRangeText('  ',a,b,'end');textArea.dispatchEvent(new Event('input',{bubbles:true}));
  }
  if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();run()}
 });
 textArea.addEventListener('click',countLines);textArea.addEventListener('keyup',countLines);
 $('dceRun').onclick=run;
 runTop.onclick=()=>{if(opened)run();else{logs=[];renderLogs();hub.updateArtifact(info()?.html||'');addLog('info','Önizleme sıfırdan çalıştırıldı')}};
 $('dceUndo').onclick=()=>undoRedo(-1);
 $('dceRedo').onclick=()=>undoRedo(1);
 $('dceDownload').onclick=download;
 $('dceClose').onclick=hide;
 $('dceAdvanced').onclick=()=>hub.openStudio?.('code');
 $('dceClear').onclick=()=>{logs=[];renderLogs()};
 $('dceAuto').onchange=()=>{if(!$('dceAuto').checked)clearTimeout(timer)};
 $('dhEdit').onclick=()=>{if(opened)hide();else open()};
 const existing=info();if(existing)load(existing);
 window.DimensiaChatEditor={
  open,close:hide,run,switchTab,
  getState:()=>({opened,tab,dirty,versions:history.length,version:pointer+1,logs:logs.length,
   sourceBytes:draft.length,previewedBytes:source.length})
 };
})();
