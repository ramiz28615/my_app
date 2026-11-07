/* Dimensia Architect — bounded, read-only HTML/CSS/JS source intelligence.
   Best-effort static analysis; never interprets or executes untrusted source. */
export const ARCHITECT_LIMITS=Object.freeze({pages:5,assets:12,htmlBytes:1400000,assetBytes:180000});
const CUT=150;
const take=(v,n=CUT)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);
const unique=(arr,max=80)=>[...new Set(arr.filter(Boolean))].slice(0,max);
const decode=s=>String(s??'').replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39|#x[0-9a-f]+|#[0-9]+);/gi,entity=>{
 const named={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&nbsp;':' '};
 const normalized=entity.toLowerCase();
 if(named[normalized])return named[normalized];
 try{
  const hex=/^&#x([0-9a-f]+);$/i.exec(entity),num=/^&#([0-9]+);$/.exec(entity);
  if(hex||num){const code=parseInt(hex?hex[1]:num[1],hex?16:10);if(code>0&&code<=0x10ffff)return String.fromCodePoint(code)}
 }catch{}
 return entity;
});
const stripMarkup=s=>decode(String(s??'').replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,' ').replace(/<[^>]+>/g,' '));
export function attrs(markup){
 const found={};
 for(const m of String(markup??'').matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)){
  const key=m[1].toLowerCase();
  if(key==='__proto__'||key==='constructor'||key==='prototype')continue;
  found[key]=decode((m[2]??m[3]??m[4]??'').slice(0,900));
 }
 return found;
}
function sameHost(target,origin){
 try{const url=new URL(target,origin);return url.origin===origin&&['http:','https:'].includes(url.protocol)?url.href.split('#')[0]:null}catch{return null}
}
function safeURL(target,origin){
 try{
  const u=new URL(target,origin);
  return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href.split('#')[0]:null;
 }catch{return null}
}
const list=(s,re,cb,max=120)=>{const out=[];for(const m of String(s).matchAll(re)){if(out.length>=max)break;out.push(cb(m))}return out};
const colors=s=>unique((String(s??'').match(/#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^)]{1,90}\)/g)||[]).map(x=>x.toLowerCase()),48);
const CSSPROPS=/--([a-zA-Z0-9_-]+)\s*:\s*([^;{}]{1,200})\s*(?:;|(?=\}))/g;
function styleIntelligence(css){
 const src=String(css??'').slice(0,500000),vars={};
 for(const m of src.matchAll(CSSPROPS)){const key='--'+m[1];if(Object.keys(vars).length>=80)break;vars[key]=take(m[2],110)}
 const fontFamilies=unique(list(src,/font-family\s*:\s*([^;}]+)/gi,m=>take(m[1],110),70),18);
 const fontSizes=unique(list(src,/font-size\s*:\s*([0-9.]+(?:px|em|rem|pt|vw|vh|%))/gi,m=>m[1],120),35);
 const bgColors=unique(list(src,/background(?:-color)?\s*:\s*([^;}]+)/gi,m=>take(m[1],85),100),30);
 const borderRadius=unique(list(src,/border-radius\s*:\s*([^;}]+)/gi,m=>take(m[1],55),100),18);
 const media=unique(list(src,/@media\s*([^{]{1,150})\s*\{/gi,m=>take(m[1],95),40),20);
 return {variables:vars,colors:colors(src),fontFamilies,fontSizes,bgColors,borderRadius,media};
}
function toAsset(raw,kind,base){
 const u=safeURL(raw,base);
 return u?{kind,url:u,label:take(raw,120)}:null;
}
function getMeta(html){
 const metas=list(html,/<meta\b([^>]*?)\/?>/gi,m=>attrs(m[1]),90);
 const find=(name)=>metas.find(x=>(x.name||'').toLowerCase()===name)?.content||'';
 return {description:take(find('description'),220),themeColor:take(find('theme-color'),35),viewport:take(find('viewport'),90),robots:take(find('robots'),50)};
}
function count(s,regexp){return(s.match(regexp)||[]).length}
export function analyzeHTML(html,pageURL){
 const base=new URL(pageURL);
 const input=String(html??'').slice(0,ARCHITECT_LIMITS.htmlBytes);
 const nonScript=input.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'');
 const textLayer=nonScript.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,'');
 const title=take(stripMarkup((input.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)||[])[1]||''),140);
 const metas=getMeta(input);
 const headings=list(textLayer,/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1\s*>/gi,m=>({
  level:Number(m[1]),text:take(stripMarkup(m[3]),160),id:attrs(m[2]).id||''
 }),90);
 const links=list(textLayer,/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi,m=>{
  const a=attrs(m[1]),url=safeURL(a.href,base),external=url?new URL(url).origin!==base.origin:false;
  return {label:take(stripMarkup(m[2])||a['aria-label']||a.title,110),href:take(a.href,440),resolved:url,external,target:take(a.target,15)};
 },200);
 const navHTML=list(textLayer,/<(?:nav|header)\b[^>]*>([\s\S]*?)<\/(?:nav|header)\s*>/gi,m=>m[1],12);
 const navLinks=[];
 for(const nav of navHTML)for(const n of list(nav,/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi,m=>{
  const a=attrs(m[1]);return{label:take(stripMarkup(m[2])||a['aria-label'],100),href:take(a.href,350),url:safeURL(a.href,base)}
 },40)){if(!navLinks.some(x=>x.url===n.url&&x.label===n.label))navLinks.push(n)}
 const buttons=list(textLayer,/<button\b([^>]*)>([\s\S]*?)<\/button\s*>/gi,m=>{
  const a=attrs(m[1]);return{label:take(stripMarkup(m[2])||a['aria-label']||a.title,130),id:take(a.id,100),type:take(a.type||'button',30),classes:take(a.class,180),dataAction:take(a['data-action'],100),inlineHandler:take(a.onclick,120)};
 },140);
 for(const m of list(textLayer,/<input\b([^>]*?)\/?>/gi,m=>attrs(m[1]),150)){
  if(['button','submit','reset'].includes((m.type||'').toLowerCase()))buttons.push({
   label:take(m.value||m['aria-label']||m.type,120),id:take(m.id,100),
   type:take(m.type,30),classes:take(m.class,150),dataAction:'',inlineHandler:take(m.onclick,120)
  });
 }
 const forms=list(textLayer,/<form\b([^>]*)>([\s\S]*?)<\/form\s*>/gi,m=>{
  const a=attrs(m[1]),fields=list(m[2],/<(?:input|textarea|select)\b([^>]*)>/gi,x=>{
   const p=attrs(x[1]);return{name:take(p.name,80),label:take(p.placeholder||p['aria-label']||p.id,90),type:take(p.type||x[0].match(/^<(\w+)/)?.[1]||'',40),required:/\brequired\b/i.test(x[0])}
  },35);
  return {method:take(a.method||'GET',12).toUpperCase(),action:take(a.action||'',350),id:take(a.id,85),fields};
 },45);
 const externalCSS=list(input,/<link\b([^>]*?)\/?>/gi,m=>{
  const a=attrs(m[1]);return /(?:^|\s)stylesheet(?:\s|$)/i.test(a.rel||'')?toAsset(a.href,'css',base):null
 },100).filter(Boolean);
 const scripts=list(input,/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,m=>({a:attrs(m[1]),body:m[2]}),150);
 const externalJS=scripts.filter(x=>x.a.src).map(x=>toAsset(x.a.src,'js',base)).filter(Boolean).slice(0,70);
 const inlineCSS=list(input,/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi,m=>m[1],60).join('\n').slice(0,450000);
 const inlineJS=scripts.filter(x=>!x.a.src&&x.body.trim()).map(x=>x.body.slice(0,170000)).slice(0,16);
 const styleAttr=list(input,/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,m=>m[1]||m[2],90).join(';');
 const stylesheet=styleIntelligence(inlineCSS+';'+styleAttr);
 const apiHints=unique([
  ...list(inlineJS.join('\n'),/\bfetch\s*\(\s*['"]([^'" \n]{1,350})['"]/g,m=>m[1],95),
  ...list(inlineJS.join('\n'),/\b(?:axios|http)\.(?:get|post|put|patch|delete)\s*\(\s*['"]([^'" \n]{1,350})['"]/g,m=>m[1],60),
  ...forms.map(x=>x.action).filter(Boolean)
 ],75).map(raw=>({path:raw,method:'unknown',source:'static hint'}));
 const handlerHints=unique([
  ...list(input,/\bon(?:click|submit|change|input|load)\s*=/gi,m=>'inline '+m[1],70),
  ...list(inlineJS.join('\n'),/addEventListener\s*\(\s*['"]([^'"]+)['"]/g,m=>'event '+take(m[1],30),90)
 ],40);
 const documentCounts={
  htmlBytes:Buffer.byteLength(input,'utf8'),headings:headings.length,
  links:links.length,buttons:buttons.length,forms:forms.length,
  images:count(textLayer,/<img\b/gi),sections:count(textLayer,/<section\b/gi),
  nav:count(textLayer,/<nav\b/gi),tables:count(textLayer,/<table\b/gi),
  svg:count(textLayer,/<svg\b/gi),canvas:count(textLayer,/<canvas\b/gi),
  diagrams:count(textLayer,/<(?:svg|canvas|diagram|mermaid)\b/gi),
  scriptBlocks:scripts.length,stylesheetLinks:externalCSS.length
 };
 return {url:base.href.split('#')[0],title,metas,headings,links,navLinks,buttons,forms,
  components:documentCounts,
  style:stylesheet,
  assets:{css:externalCSS,js:externalJS,images:list(textLayer,/<img\b([^>]*?)\/?>/gi,m=>{
    const a=attrs(m[1]);return{src:take(a.src,250),alt:take(a.alt,140)}
  },40)},
  code:{html:input.slice(0,300000),inlineCSS:inlineCSS.slice(0,140000),inlineJS:inlineJS.join('\n\n').slice(0,140000)},
  inferred:{apiHints,handlerHints},
  warnings:[
   !/<html\b[^>]*lang=/i.test(input)?'HTML lang eksik':null,
   documentCounts.buttons&&!buttons.some(x=>x.label)?'Butonların erişilebilir adları kontrol edilmeli':null,
   documentCounts.forms?'Formların sunucu işlemleri yalnızca görünür kaynaktan çıkarılamaz':null
  ].filter(Boolean)
 };
}
export function analyzeAsset(content,kind,url){
 const input=String(content??'').slice(0,ARCHITECT_LIMITS.assetBytes);
 if(kind==='css'){
  const style=styleIntelligence(input);
  return{kind,url,bytes:Buffer.byteLength(input,'utf8'),content:input,style};
 }
 const listeners=unique(list(input,/\baddEventListener\s*\(\s*['"]([a-zA-Z-]+)['"]/g,m=>m[1],70),30);
 const apiHints=unique([
  ...list(input,/\bfetch\s*\(\s*['"]([^'"]{1,280})['"]/g,m=>m[1],100),
  ...list(input,/\b(?:axios|http)\.(?:get|post|put|patch|delete)\s*\(\s*['"]([^'"]{1,280})['"]/g,m=>m[1],80)
 ],70);
 const exports=unique(list(input,/\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let)\s+([A-Za-z_$][\w$]*)/g,m=>m[1],75),30);
 return{kind,url,bytes:Buffer.byteLength(input,'utf8'),content:input,js:{listeners,apiHints,exports}};
}
export function discoverInternalPageLinks(page,origin,cap=20){
 const start=new URL(origin);
 const out=[];
 for(const a of page.links){
  if(!a.resolved||a.external)continue;
  const href=sameHost(a.resolved,start.origin);
  if(!href)continue;
  const u=new URL(href);
  if(/\.(?:png|gif|svg|jpg|jpeg|webp|pdf|ico|css|js|json|xml|woff2?|ttf|zip|mp4)$/i.test(u.pathname))continue;
  if(u.search||u.pathname.startsWith('/api/')||u.pathname.endsWith('/logout')||u.pathname.endsWith('/delete'))continue;
  if(!out.includes(href))out.push(href);
  if(out.length>=cap)break;
 }
 return out;
}
export function makeArchitectureGraph(report){
 const pages=report.pages||[],nodes=[],edges=[];
 for(let i=0;i<pages.length;i++){
  const p=pages[i];nodes.push({id:'p'+i,type:'page',label:take(p.title||new URL(p.url).pathname,65),url:p.url});
 }
 const idByURL=new Map(pages.map((p,i)=>[p.url.split('#')[0],'p'+i]));
 let edgeCount=0;
 for(let i=0;i<pages.length;i++){
  const page=pages[i];
  for(const link of page.links||[]){
   if(edgeCount>=160)break;
   const target=idByURL.get(link.resolved?.split('#')[0]);
   if(target&&target!=='p'+i&&!edges.some(e=>e.from==='p'+i&&e.to===target)){
    edges.push({from:'p'+i,to:target,label:take(link.label,45),kind:'navigation'});edgeCount++;
   }
  }
  for(let k=0;k<Math.min(page.forms?.length||0,6);k++){
   const f=page.forms[k],id='f'+i+'_'+k;
   nodes.push({id,type:'form',label:take(f.id||'Form '+(k+1),50),method:f.method});
   edges.push({from:'p'+i,to:id,label:'form',kind:'form'});
   if(f.action)nodes.push({id:id+'a',type:'endpoint',label:take(f.action,85)});
   if(f.action)edges.push({from:id,to:id+'a',label:take(f.method,12),kind:'inferred'});
  }
 }
 return{nodes:nodes.slice(0,80),edges:edges.slice(0,160)};
}
