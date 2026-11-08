/* Dimensia Web Projects 8.2 — per-conversation HTML/CSS/JS sources and sandboxed inline previews.
 * Raw code stays on this device until an approved publication. No automatic GitHub upload.
 */
(()=>{
'use strict';
const KEY='dimensia-web-chat-projects-v1',LIMIT=650000;
const secure=text=>/(?:sk-or-v1-[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{17,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})/i.test(text);
const cleanName=name=>String(name||'Web projesi').replace(/\s+/g,' ').trim().slice(0,64);
const blank=()=>({html:'',css:'',js:''});
let records={};
try{
 const data=JSON.parse(localStorage.getItem(KEY)||'{}');
 if(data&&typeof data==='object'&&!Array.isArray(data)){
  for(const [id,item] of Object.entries(data)){
   if(!/^dh-[\w-]{1,85}$/.test(id)||!item||typeof item!=='object')continue;
   const files=blank();
   for(const key of Object.keys(files))if(typeof item[key]==='string'&&item[key].length<=LIMIT)files[key]=item[key];
   records[id]={...files,name:cleanName(item.name),updatedAt:Number(item.updatedAt)||0};
  }
 }
}catch{}
function save(){
 try{
  const latest=Object.entries(records).sort((a,b)=>b[1].updatedAt-a[1].updatedAt).slice(0,16);
  // Keep old projects in memory if browser quota is reached; report it, never silently overwrite code.
  const bounded=Object.fromEntries(latest);
  const text=JSON.stringify(bounded);
  if(text.length>3500000)throw Error('Tarayıcı alan sınırına ulaşıldı. Projeleri JSON olarak yedekle.');
  localStorage.setItem(KEY,text);
  return true;
 }catch(e){
  document.dispatchEvent(new CustomEvent('dimensia:web-save-error',{detail:{message:e.message}}));
  return false;
 }
}
function ensure(id){
 if(!/^dh-[\w-]{1,85}$/.test(id))throw Error('Geçersiz sohbet kimliği.');
 if(!records[id])records[id]={...blank(),name:'Web projesi',updatedAt:Date.now()};
 return records[id];
}
function hasCompleteHTML(text){
 return /<html(?:\s|>)/i.test(text)&&/<body(?:\s|>)/i.test(text)&&/<\/html\s*>/i.test(text);
}
function compose(files){
 const html=String(files.html||'').trim();
 const css=String(files.css||'');
 const js=String(files.js||'');
 const base=/<html(?:\s|>)/i.test(html)?html:
  '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dimensia Web Projesi</title></head><body>'+
  (html||'<main style="font-family:system-ui;padding:24px"><h1>Dimensia Web Projesi</h1><p>HTML, CSS ve JavaScript kodlarını sohbette üret veya editörden düzenle.</p></main>')+
  '</body></html>';
 if(!/<\/html\s*>/i.test(base))throw Error('HTML tamamlanmamış, önizlemeye uygulanmadı.');
 if(base.length+css.length+js.length>LIMIT)throw Error('Önizleme kaynakları 650 KB sınırını aşıyor.');
 let output=base;
 if(css){
  const style='<style id="dimensia-generated-css">'+css.replace(/<\/style/gi,'<\\/style')+'</style>';
  output=/<\/head\s*>/i.test(output)?output.replace(/<\/head\s*>/i,style+'</head>'):
   output.replace(/<body\b/i,style+'<body');
 }
 if(js){
  const script='<script id="dimensia-generated-js">'+js.replace(/<\/script/gi,'<\\/script')+'<\/script>';
  output=/<\/body\s*>/i.test(output)?output.replace(/<\/body\s*>/i,script+'</body>'):
   output.replace(/<\/html\s*>/i,script+'</html>');
 }
 if(secure(output))throw Error('Kodda API anahtarı/şifre olabilir; önizleme engellendi.');
 return output;
}
function getPreview(id){
 const item=records[id];if(!item||!item.html&&!item.css&&!item.js)return null;
 try{return{html:compose(item),name:item.name}}catch{return null}
}
function getFiles(id){const item=records[id];return item?{html:item.html,css:item.css,js:item.js}:blank()}
function setDocument(id,html,name){
 if(typeof html!=='string'||!hasCompleteHTML(html)||html.length>LIMIT||secure(html))throw Error('Tam ve güvenli HTML dokümanı gerekiyor.');
 const item=ensure(id);
 item.html=html;item.css='';item.js='';item.name=cleanName(name||item.name);item.updatedAt=Date.now();
 save();return{html,name:item.name};
}
function captureAssistant(id,answer,name){
 const text=String(answer||'');
 const fences=/(?:^|\n)\x60{3}(html|htm|css|javascript|js)\s*\r?\n([\s\S]*?)\r?\n?\x60{3}(?=\r?\n|$)/gi;
 const changes={};let m;
 while((m=fences.exec(text))){
  const type=m[1].toLowerCase()==='htm'?'html':m[1].toLowerCase()==='javascript'||m[1].toLowerCase()==='js'?'js':m[1].toLowerCase();
  const code=m[2];
  if(type==='html'&&/<html(?:\s|>)/i.test(code)&&!hasCompleteHTML(code))continue;
  changes[type]=code;
 }
 if(!Object.keys(changes).length){
  const raw=text.trim();
  if(/^(?:<!doctype html>|<html[\s>])/i.test(raw)&&hasCompleteHTML(raw))changes.html=raw;
 }
 if(!Object.keys(changes).length)return null;
 const previous=records[id]||{...blank(),name:cleanName(name),updatedAt:0};
 const next={...previous,...changes,name:cleanName(name||previous.name),updatedAt:Date.now()};
 if(next.html.length+next.css.length+next.js.length>LIMIT||secure(Object.values(changes).join('\n')))throw Error('Kod önizleme sınırını aşıyor veya API anahtarı içeriyor.');
 const html=compose(next);
 records[id]=next;save();return{html,name:next.name,files:getFiles(id)};
}
function setFile(id,type,source){
 const key=type==='javascript'?'js':type;
 if(!['html','css','js'].includes(key))throw Error('Desteklenen web dosyaları: HTML, CSS, JS.');
 if(typeof source!=='string'||secure(source))throw Error('Gizli anahtar içeriyor veya kod biçimi geçersiz.');
 const old=ensure(id),next={...old,[key]:source,updatedAt:Date.now()};
 const html=compose(next);records[id]=next;save();
 if(id===window.DimensiaChatHub?.getState?.().active)window.DimensiaChatHub.setWebArtifact(html,next.name);
 return html;
}
function openInline(container,id){
 const preview=getPreview(id);if(!preview)return;
 const panel=document.createElement('section');panel.className='dh-inline-preview';
 panel.setAttribute('aria-label','Sohbet içi HTML CSS JavaScript canlı önizleme');
 const head=document.createElement('div');head.className='dh-inline-preview-head';
 const title=document.createElement('strong');title.textContent='◎ Canlı web önizlemesi';
 const actions=document.createElement('div');actions.className='dh-inline-preview-actions';
 const refresh=document.createElement('button');refresh.type='button';refresh.textContent='↻ Yenile';
 const edit=document.createElement('button');edit.type='button';edit.textContent='⌘ Düzenle';
 const expand=document.createElement('button');expand.type='button';expand.textContent='⛶ Tam ekran';
 const frame=document.createElement('iframe');frame.title='Bu sohbete ait web projesi';
 frame.setAttribute('sandbox','allow-scripts allow-forms');frame.referrerPolicy='no-referrer';frame.loading='lazy';
 frame.srcdoc=window.DimensiaDevTools?.instrument?.(preview.html)??preview.html;
 refresh.onclick=()=>{const p=getPreview(id);if(p)frame.srcdoc=window.DimensiaDevTools?.instrument?.(p.html)??p.html};
 edit.onclick=()=>{
  if(id!==window.DimensiaChatHub?.getState?.().active)return;
  window.DimensiaChatHub?.showPreview?.();
  window.DimensiaChatEditor?.open?.();
 };
 expand.onclick=()=>{if(frame.requestFullscreen)void frame.requestFullscreen().catch(()=>window.DimensiaChatHub?.showPreview?.());else window.DimensiaChatHub?.showPreview?.()};
 actions.append(refresh,edit,expand);head.append(title,actions);
 const note=document.createElement('small');note.textContent='HTML + CSS + JS · İzole tarayıcıda otomatik çalışır · Sunucu/Node/PHP kodu burada çalışmaz.';
 panel.append(head,frame,note);container.append(panel);
}
document.addEventListener('dimensia:chat-assistant-web',e=>{
 const {chatId,text,name}=e.detail||{};
 try{
  const result=captureAssistant(chatId,text,name);
  if(result&&chatId===window.DimensiaChatHub?.getState?.().active)
   window.DimensiaChatHub.setWebArtifact(result.html,result.name);
 }catch(error){document.dispatchEvent(new CustomEvent('dimensia:web-save-error',{detail:{message:error.message}}))}
});
document.addEventListener('dimensia:chat-artifact-edited',e=>{
 const {chatId,html,name}=e.detail||{};
 if(!chatId||!html)return;
 try{setDocument(chatId,html,name)}catch{}
});
window.DimensiaWebProjects={getPreview,getFiles,setDocument,captureAssistant,setFile,openInline,compose};
window.DimensiaChatHub?.refreshWebArtifact?.();
})();