/* Dimensia Layout Studio 8.1.0 — user-adjustable split panes on mobile and desktop.
 * Sizes are stored locally, not tied to credentials or code execution.
 */
(()=>{
'use strict';
const KEY='dimensia-layout-v1',root=document.documentElement;
const controls=[
 {key:'sidebar',label:'Sol menü genişliği',min:200,max:390,initial:254},
 {key:'previewWidth',label:'Sohbet / önizleme bölmesi genişliği',min:310,max:1050,initial:500},
 {key:'chatHeight',label:'Mobil sohbet yüksekliği',min:310,max:900,initial:490},
 {key:'previewHeight',label:'Mobil önizleme yüksekliği',min:260,max:950,initial:420},
 {key:'runnerHeight',label:'Terminal paneli yüksekliği',min:320,max:960,initial:580},
 {key:'editorHeight',label:'Terminal kod editörü yüksekliği',min:95,max:610,initial:150},
 {key:'outputHeight',label:'Terminal çıktısı yüksekliği',min:70,max:510,initial:160},
 {key:'webEditorHeight',label:'HTML / CSS / JS editör yüksekliği',min:180,max:780,initial:280},
 {key:'webCodeWidth',label:'Web kod editörü genişliği (PC)',min:230,max:720,initial:380},
 {key:'jsConsoleHeight',label:'JavaScript konsolu yüksekliği',min:80,max:410,initial:170},
 {key:'polyEditorHeight',label:'Çok dilli Code Lab editörü',min:250,max:920,initial:360},
 {key:'studioPreviewHeight',label:'Studio site önizlemesi yüksekliği',min:240,max:900,initial:400}
];
const propertyNames={
 sidebar:'--dl-sidebar-width',previewWidth:'--dl-preview-width',chatHeight:'--dl-chat-height',
 previewHeight:'--dl-preview-height',runnerHeight:'--dl-runner-height',
 editorHeight:'--dl-editor-height',outputHeight:'--dl-output-height',
 webEditorHeight:'--dl-web-editor-height',webCodeWidth:'--dl-web-code-width',
 jsConsoleHeight:'--dl-js-console-height',polyEditorHeight:'--dl-poly-editor-height',
 studioPreviewHeight:'--dl-studio-preview-height'
};
const clamp=(spec,value)=>Math.round(Math.max(spec.min,Math.min(spec.max,Number(value)||spec.initial)));
const defaults=()=>Object.fromEntries(controls.map(x=>[x.key,x.initial]));
let sizes=defaults();
try{
 const stored=JSON.parse(localStorage.getItem(KEY)||'null');
 if(stored&&typeof stored==='object'){
  for(const spec of controls){
   if(Number.isFinite(stored[spec.key]))sizes[spec.key]=clamp(spec,stored[spec.key]);
  }
 }
}catch{}
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify(sizes))}
 catch{document.getElementById('dlHelp').textContent='Tarayıcı bu boyutları kaydedemedi. Gizli mod veya depolama ayarlarını kontrol et.'}
}
function apply(){
 for(const spec of controls)root.style.setProperty(propertyNames[spec.key],sizes[spec.key]+'px');
 for(const spec of controls){
  const input=document.getElementById('dl-'+spec.key),output=document.getElementById('dl-value-'+spec.key);
  if(input)input.value=sizes[spec.key];
  if(output)output.textContent=sizes[spec.key]+' px';
 }
 for(const [id,key] of [['dlChatSplit','previewWidth'],['dlEditorGrip','editorHeight'],['dlOutputGrip','outputHeight']]){
  const node=document.getElementById(id);if(node)node.setAttribute('aria-valuenow',String(sizes[key]));
 }
}
function update(key,value){
 const spec=controls.find(x=>x.key===key);if(!spec)return;
 sizes[key]=clamp(spec,value);apply();persist();
}
const settings=document.createElement('section');
settings.id='dlPanel';settings.hidden=true;settings.setAttribute('aria-label','Ekran bölümlerini boyutlandır');
settings.innerHTML='<header><strong>▦ Ekran düzeni</strong><button type="button" id="dlClose" aria-label="Boyut ayarlarını kapat">✕</button></header>'+
 '<p id="dlHelp">Kaydırıcılarla her bölümün boyutunu ayrı ayarla. PC’de panel ayırıcısını, telefonda terminalin çizgili tutamaçlarını da sürükleyebilirsin. Ayarlar bu cihazda saklanır.</p>'+
 '<div id="dlSettings" class="dl-settings"></div><div class="dl-bottom">'+
 '<button type="button" id="dlReset">↶ Varsayılana dön</button>'+
 '<button type="button" id="dlDone">✓ Tamam</button></div>';
document.body.append(settings);
const list=document.getElementById('dlSettings');
for(const spec of controls){
 const item=document.createElement('div');item.className='dl-setting';
 const label=document.createElement('label');label.htmlFor='dl-'+spec.key;label.textContent=spec.label;
 const value=document.createElement('output');value.id='dl-value-'+spec.key;
 label.append(value);
 const input=document.createElement('input');input.type='range';input.id='dl-'+spec.key;
 input.min=spec.min;input.max=spec.max;input.step=10;input.value=sizes[spec.key];
 input.setAttribute('aria-label',spec.label);
 input.addEventListener('input',()=>update(spec.key,input.value));
 item.append(label,input);list.append(item);
}
const toggle=()=>{settings.hidden=!settings.hidden;if(!settings.hidden)document.getElementById('dlClose').focus()};
document.getElementById('dlClose').onclick=()=>settings.hidden=true;
document.getElementById('dlDone').onclick=()=>settings.hidden=true;
document.getElementById('dlReset').onclick=()=>{
 if(!confirm('Kaydettiğin bütün ekran boyutlarını varsayılana döndürmek istiyor musun?'))return;
 sizes=defaults();apply();persist();
};
settings.addEventListener('keydown',e=>{if(e.key==='Escape'){settings.hidden=true;e.preventDefault()}});
function openButton(container,id,cls){
 if(!container)return;
 const btn=document.createElement('button');btn.id=id;btn.type='button';
 btn.className=cls+' dl-toggle';btn.textContent='▦ Boyutlar';btn.title='Ekran bölümlerinin boyutunu değiştir';
 btn.onclick=toggle;container.prepend(btn);
}
openButton(document.querySelector('#dimensiaChatHub .dh-actions'),'dlChatToggle','dh-utility');
openButton(document.querySelector('.topbar .top-actions'),'dlStudioToggle','');
const main=document.getElementById('dhMain'),artifact=document.getElementById('dhArtifact');
if(main&&artifact){
 const split=document.createElement('div');split.id='dlChatSplit';
 split.setAttribute('role','separator');split.setAttribute('aria-label','Sohbet ve önizleme arasındaki bölmeyi boyutlandır');
 split.setAttribute('aria-orientation','vertical');split.tabIndex=0;
 main.insertBefore(split,artifact);
 bindDrag(split,()=>window.matchMedia('(max-width:820px)').matches?'chatHeight':'previewWidth',
  (key,initial,delta)=>key==='chatHeight'?initial+delta:initial-delta);
}
function grip(after,id,label,key){
 if(!after)return;
 const el=document.createElement('div');el.id=id;el.className='dl-grip';
 el.setAttribute('role','separator');el.tabIndex=0;el.setAttribute('aria-label',label);
 el.setAttribute('aria-orientation','horizontal');
 after.after(el);bindDrag(el,()=>key,(_key,initial,delta)=>initial+delta);
}
grip(document.getElementById('dhrEditor'),'dlEditorGrip','Kod editörü yüksekliğini sürükle','editorHeight');
const tabs=document.getElementById('dhrResultTabs');
grip(tabs,'dlOutputGrip','Terminal çıktı alanı yüksekliğini sürükle','outputHeight');
function bindDrag(element,getKey,compute){
 let start=null;
 element.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.isPrimary===false)return;
  const key=getKey(),spec=controls.find(x=>x.key===key);
  if(!spec)return;
  start={id:e.pointerId,key,x:e.clientX,y:e.clientY,value:sizes[key]};
  element.setPointerCapture(e.pointerId);
  e.preventDefault();
 });
 element.addEventListener('pointermove',e=>{
  if(!start||start.id!==e.pointerId)return;
  const delta=start.key==='previewWidth'?e.clientX-start.x:e.clientY-start.y;
  update(start.key,compute(start.key,start.value,delta));
 });
 const stop=e=>{if(start&&start.id===e.pointerId)start=null};
 element.addEventListener('pointerup',stop);element.addEventListener('pointercancel',stop);
 element.addEventListener('lostpointercapture',()=>start=null);
 element.addEventListener('keydown',e=>{
  if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft'&&e.key!=='ArrowUp'&&e.key!=='ArrowDown')return;
  const key=getKey(),delta=e.key==='ArrowRight'||e.key==='ArrowDown'?20:-20;
  update(key,sizes[key]+delta);e.preventDefault();
 });
}
apply();
window.DimensiaLayout={get:()=>({...sizes}),set:update,reset:()=>{sizes=defaults();apply();persist()},open:()=>settings.hidden=false};
})();