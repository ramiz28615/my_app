/* Dimensia 8.1.0 — device-local, editable multi-project workspace.
 * No tokens are collected or sent to GitHub. Code stays in localStorage until an approved run.
 */
(()=>{
'use strict';
const runner=window.DimensiaChatRunner;
const panel=document.getElementById('dhrPanel');
const chat=document.getElementById('dhConversation');
if(!runner||!panel||!chat)return;
const LANGS=['python','bash','perl','php','javascript','rust'],KEY='dimensia-code-projects-v1';
const MAX_PROJECTS=48,MAX_CODE_BYTES=10000;
const CHAT_MAP='dimensia-chat-project-links-v1';
let chatLinks={};
try{const data=JSON.parse(localStorage.getItem(CHAT_MAP)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))chatLinks=data}catch{}
function persistLinks(){try{localStorage.setItem(CHAT_MAP,JSON.stringify(chatLinks))}catch{}}
const $=id=>document.getElementById(id);
const bytes=value=>new TextEncoder().encode(value).length;
const blank=()=>Object.fromEntries(LANGS.map(x=>[x,'']));
const safeName=v=>String(v||'').trim().replace(/[\x00-\x1f]/g,' ').slice(0,55);
function normalize(files){
 const clean=blank();
 for(const lang of LANGS){
  if(typeof files?.[lang]!=='string')continue;
  if(bytes(files[lang])>MAX_CODE_BYTES)throw Error(lang+' için 10 KB sınırı aşıldı.');
  clean[lang]=files[lang];
 }
 return clean;
}
function uid(){
 if(window.crypto?.randomUUID)return crypto.randomUUID();
 const data=new Uint32Array(2);crypto.getRandomValues(data);
 return'dim-'+data[0].toString(36)+data[1].toString(36);
}
function initial(){const id=uid();return{active:id,items:[{id,name:'Ana Proje',files:blank(),updatedAt:Date.now()}]}}
function restore(){
 try{
  const stored=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!stored||!Array.isArray(stored.items))return initial();
  const items=stored.items.slice(0,MAX_PROJECTS).filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string')
   .map(x=>({id:x.id.slice(0,90),name:safeName(x.name)||'Adsız proje',files:normalize(x.files),updatedAt:Number(x.updatedAt)||Date.now()}));
  if(!items.length)return initial();
  return{active:items.some(x=>x.id===stored.active)?stored.active:items[0].id,items};
 }catch{return initial()}
}
let state=restore(),loading=false,writeError=false;
function current(){return state.items.find(x=>x.id===state.active)}
function persist(){
 try{
  localStorage.setItem(KEY,JSON.stringify(state));
  if(writeError){writeError=false;notice('Yerel kaydetme yeniden çalışıyor.');}
 }catch{writeError=true;notice('Tarayıcı hafızasına kaydedilemiyor; Projeyi İndir ile yedekle.',true)}
}
const bar=document.createElement('section');bar.id='dwpBar';bar.className='dwp-bar';
bar.setAttribute('aria-label','Proje dosyaları ve proje yönetimi');
bar.innerHTML='<div class="dwp-title"><strong>▦ PROJELERİM</strong><small id="dwpNotice" role="status">Kodlar bu cihazda otomatik kaydedilir. API anahtarı kaydetme.</small></div>'+
 '<div class="dwp-controls"><label for="dwpSelect" class="dwp-label">Aktif proje</label>'+
 '<select id="dwpSelect" aria-label="Aktif kod projesini seç"></select>'+
 '<button type="button" id="dwpNew">＋ Yeni</button>'+
 '<button type="button" id="dwpRename">✎ Adlandır</button>'+
 '<button type="button" id="dwpDuplicate">▣ Kopyala</button>'+
 '<button type="button" id="dwpDelete">⌫ Sil</button>'+
 '<button type="button" id="dwpExport">↓ İndir</button>'+
 '<button type="button" id="dwpImport">↑ Yükle</button>'+
 '<input type="file" id="dwpImportFile" accept=".json,application/json" hidden></div>';
panel.querySelector('.dhr-head')?.after(bar);
const quick=document.createElement('button');quick.type='button';quick.id='dwpQuickOpen';
quick.className='dh-tool';quick.title='Projelerini aç, seç ve oluştur';
const quickTools=chat.querySelector('.dh-tools');
quickTools?.insertBefore(quick,document.getElementById('dhRunQuick'));
const notice=(msg,bad=false)=>{const root=$('dwpNotice');root.textContent=msg;root.style.color=bad?'#ffb9b9':'#a3e2d4'};
function repaint(){
 const select=$('dwpSelect');select.replaceChildren();
 for(const item of state.items){
  const option=document.createElement('option');option.value=item.id;option.textContent=item.name;
  select.append(option);
 }
 select.value=state.active;
 quick.textContent='▦ '+(current()?.name||'Proje').slice(0,18);
 $('dwpDelete').disabled=state.items.length<=1;
}
function ensureIdle(){
 if(runner.getState().busy){notice('Bulut çalıştırması bitene kadar proje değiştirilemez.',true);return false}
 return true;
}
function saveCurrent(){
 if(loading)return;
 const project=current();if(!project)return;
 try{project.files=normalize(runner.getSources());project.updatedAt=Date.now();persist();}
 catch(e){notice(e.message,true)}
}
function activate(id,{silent=false,link=true}={}){
 if(!ensureIdle())return repaint();
 const project=state.items.find(x=>x.id===id);
 if(!project)return repaint();
 saveCurrent();
 loading=true;
 try{
  runner.replaceSources(project.files);
  state.active=id;
  if(link){const chatId=window.DimensiaChatHub?.getState?.().active;if(chatId){chatLinks[chatId]=id;persistLinks()}}
  persist();repaint();if(!silent)runner.open();
  notice('Aktif proje: '+project.name+' · Kodlarını düzenleyebilir ve çalıştırabilirsin.');
 }catch(e){notice(e.message,true)}
 finally{loading=false}
}
function create(name,files=blank(),{silent=false,link=true}={}){
 if(!ensureIdle())return;
 if(state.items.length>=MAX_PROJECTS)return notice('En fazla '+MAX_PROJECTS+' yerel proje oluşturabilirsin.',true);
 const label=safeName(name);
 if(!label)return notice('Geçerli bir proje adı gir.',true);
 const clean=normalize(files);
 saveCurrent();
 const project={id:uid(),name:label,files:clean,updatedAt:Date.now()};
 state.items.push(project);state.active=project.id;
 loading=true;
 try{runner.replaceSources(clean)}finally{loading=false}
 if(link){const chatId=window.DimensiaChatHub?.getState?.().active;if(chatId){chatLinks[chatId]=project.id;persistLinks()}}
 persist();repaint();if(!silent)runner.open();notice('Yeni proje oluşturuldu: '+label);
 return project.id;
}
$('dwpSelect').onchange=e=>activate(e.target.value);
$('dwpNew').onclick=()=>{
 const name=prompt('Yeni projenin adını yaz:','Yeni Proje');
 if(name!==null)create(name);
};
$('dwpRename').onclick=()=>{
 if(!ensureIdle())return;
 const item=current(),name=prompt('Projenin yeni adı:',item.name);
 if(name===null)return;
 const clean=safeName(name);if(!clean)return notice('Proje adı boş olamaz.',true);
 item.name=clean;persist();repaint();notice('Proje adı güncellendi.');
};
$('dwpDuplicate').onclick=()=>{
 const item=current();create(item.name+' - Kopya',runner.getSources());
};
$('dwpDelete').onclick=()=>{
 if(!ensureIdle())return;
 if(state.items.length<=1)return notice('Son proje silinemez; Yeni düğmesiyle başkasını oluşturabilirsin.',true);
 const item=current();
 if(!confirm('“'+item.name+'” projesini ve bu cihazdaki kodlarını kalıcı olarak silmek istiyor musun?'))return;
 state.items=state.items.filter(x=>x.id!==item.id);
 for(const [chat,id] of Object.entries(chatLinks))if(id===item.id)delete chatLinks[chat];
 persistLinks();state.active=state.items[0].id;
 const chatId=window.DimensiaChatHub?.getState?.().active;if(chatId){chatLinks[chatId]=state.active;persistLinks()}
 loading=true;try{runner.replaceSources(current().files)}finally{loading=false}
 persist();repaint();notice('Proje silindi.');
};
$('dwpExport').onclick=()=>{
 saveCurrent();
 const project=current();
 const payload={schema:'dimensia-code-project-v1',name:project.name,files:project.files,exportedAt:new Date().toISOString()};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const href=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=href;a.download='dimensia-'+project.name.toLocaleLowerCase('tr').replace(/[^a-z0-9_-]/gi,'-').slice(0,34)+'.json';
 a.click();setTimeout(()=>URL.revokeObjectURL(href),2500);
 notice('Proje yedeği indirildi. Dosyada özel anahtar bulunmadığını kontrol et.');
};
$('dwpImport').onclick=()=>{if(ensureIdle())$('dwpImportFile').click()};
$('dwpImportFile').onchange=async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>95000)return notice('Proje dosyası 95 KB sınırını aşıyor.',true);
 try{
  const data=JSON.parse(await file.text());
  if(data.schema!=='dimensia-code-project-v1')throw Error('Geçersiz Dimensia proje yedeği.');
  create(safeName(data.name)||'İçe aktarılan proje',normalize(data.files));
 }catch(error){notice('Proje içe aktarılamadı: '+String(error.message||error).slice(0,100),true)}
};
function bindToChat(chatId,title){
 if(!/^dh-[\w-]{1,85}$/.test(String(chatId||'')))return;
 if(runner.getState().busy)return notice('Bulut kodu çalışırken sohbet proje eşlemesi yapılamaz.',true);
 const linked=chatLinks[chatId];
 if(linked&&state.items.some(item=>item.id===linked)){
  if(state.active!==linked)activate(linked,{silent:true,link:false});
  return;
 }
 const label='Sohbet: '+safeName(title==='Yeni sohbet'?'Yeni web projesi':title||'Yeni web projesi').slice(0,35);
 const id=create(label,blank(),{silent:true,link:false});
 if(id){chatLinks[chatId]=id;persistLinks()}
}
document.addEventListener('dimensia:chat-activated',event=>{
 const {chatId,title}=event.detail||{};
 if(chatId)bindToChat(chatId,title);
});
document.addEventListener('dimensia:chat-titled',event=>{
 const {chatId,title}=event.detail||{};
 const item=state.items.find(x=>x.id===chatLinks[chatId]);
 if(item&&item.name.startsWith('Sohbet:')){
  item.name='Sohbet: '+safeName(title).slice(0,35);
  persist();repaint();
 }
});
quick.onclick=()=>{runner.open();bar.scrollIntoView({behavior:'smooth',block:'nearest'})};
document.addEventListener('dimensia:runner-sources-changed',saveCurrent);
loading=true;
try{runner.replaceSources(current().files)}finally{loading=false}
repaint();persist();
const firstChat=window.DimensiaChatHub?.getState?.().active;
if(firstChat)bindToChat(firstChat,window.DimensiaChatHub.getChats()?.find(x=>x.id===firstChat)?.title);
window.DimensiaProjects={
 list:()=>state.items.map(x=>({id:x.id,name:x.name,updatedAt:x.updatedAt})),
 getActive:()=>({id:state.active,name:current()?.name}),
 create:(name)=>create(name),
 select:(id)=>activate(id),
 chatProject:(chatId)=>chatLinks[chatId]||null,
 save:saveCurrent,
};
})();
