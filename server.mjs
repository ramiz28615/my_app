/* Dimensia optional Node.js reference inspector. Public pages only, SSRF-aware. */
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns/promises';
import net from 'node:net';
import { readFile } from 'node:fs/promises';
import { createGunzip, createInflate, createBrotliDecompress } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {analyzeHTML,analyzeAsset,discoverInternalPageLinks,makeArchitectureGraph,ARCHITECT_LIMITS} from './architect-core.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT||3000);
const HOST=process.env.HOST||'127.0.0.1';
const allowed=new Map([
 ['/', ['index.html','text/html; charset=utf-8']],
 ['/index.html',['index.html','text/html; charset=utf-8']],
 ['/studio-enhancements.css',['studio-enhancements.css','text/css; charset=utf-8']],
 ['/studio-devtools.js',['studio-devtools.js','application/javascript; charset=utf-8']],
 ['/studio-reference.js',['studio-reference.js','application/javascript; charset=utf-8']],
 ['/studio-re.css',['studio-re.css','text/css; charset=utf-8']],
 ['/studio-re-engineer.js',['studio-re-engineer.js','application/javascript; charset=utf-8']],
 ['/studio-flow.js',['studio-flow.js','application/javascript; charset=utf-8']],
 ['/studio-launchpad.css',['studio-launchpad.css','text/css; charset=utf-8']],
 ['/studio-launchpad.js',['studio-launchpad.js','application/javascript; charset=utf-8']],
 ['/studio-architect.css',['studio-architect.css','text/css; charset=utf-8']],
 ['/studio-architect.js',['studio-architect.js','application/javascript; charset=utf-8']],
 ['/studio-code-lab.js',['studio-code-lab.js','application/javascript; charset=utf-8']],
 ['/studio-code-lab.css',['studio-code-lab.css','text/css; charset=utf-8']],
 ['/studio-ai-agent.css',['studio-ai-agent.css','text/css; charset=utf-8']],
 ['/studio-ai-agent.js',['studio-ai-agent.js','application/javascript; charset=utf-8']],
 ['/studio-chat.css',['studio-chat.css','text/css; charset=utf-8']],
 ['/studio-chat.js',['studio-chat.js','application/javascript; charset=utf-8']],
 ['/studio-chat-runner.js',['studio-chat-runner.js','application/javascript; charset=utf-8']],
 ['/studio-chat-runner.css',['studio-chat-runner.css','text/css; charset=utf-8']],
 ['/studio-workspace-projects.js',['studio-workspace-projects.js','application/javascript; charset=utf-8']],
 ['/studio-layout.js',['studio-layout.js','application/javascript; charset=utf-8']],
 ['/studio-layout.css',['studio-layout.css','text/css; charset=utf-8']],
 ['/studio-chat-web.js',['studio-chat-web.js','application/javascript; charset=utf-8']],
 ['/studio-chat-web.css',['studio-chat-web.css','text/css; charset=utf-8']],
 ['/studio-reactnative.js',['studio-reactnative.js','application/javascript; charset=utf-8']],
 ['/studio-reactnative.css',['studio-reactnative.css','text/css; charset=utf-8']],
 ['/studio-chat-autopilot.js',['studio-chat-autopilot.js','application/javascript; charset=utf-8']],
 ['/studio-chat-autopilot.css',['studio-chat-autopilot.css','text/css; charset=utf-8']],
 ['/studio-native-build.js',['studio-native-build.js','application/javascript; charset=utf-8']],
 ['/studio-native-build.css',['studio-native-build.css','text/css; charset=utf-8']],
 ['/studio-chat-editor.js',['studio-chat-editor.js','application/javascript; charset=utf-8']],
 ['/studio-chat-editor.css',['studio-chat-editor.css','text/css; charset=utf-8']],
 ['/studio-polyglot.css',['studio-polyglot.css','text/css; charset=utf-8']],
 ['/studio-polyglot.js',['studio-polyglot.js','application/javascript; charset=utf-8']],
 ['/studio-mobile-fix.css',['studio-mobile-fix.css','text/css; charset=utf-8']],
 ['/studio-mobile-fix.js',['studio-mobile-fix.js','application/javascript; charset=utf-8']],
 ['/backend-template.mjs',['backend-template.mjs','application/javascript; charset=utf-8']],
 ['/studio-architect.css',['studio-architect.css','text/css; charset=utf-8']],
 ['/studio-architect.js',['studio-architect.js','application/javascript; charset=utf-8']]
]);
const hits=new Map();
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body))};
const unique=(arr,n=20)=>[...new Set(arr.filter(Boolean))].slice(0,n);
const decode=s=>String(s||'').replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/gi,entity=>({
 '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' ','&#39;':"'"
})[entity.toLowerCase()]||entity).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(0x10FFFF,Number(n))));
const text=s=>decode(String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()).slice(0,160);
function attr(markup,name){
 const match=String(markup).match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27|([^\\s>]+))','i'));
 return match?(match[1]??match[2]??match[3]??''):'';
}
function matches(str,re,selector,n=25){
 const arr=[];for(const found of str.matchAll(re)){arr.push(selector?selector(found):text(found[1]||found[0]));if(arr.length>=n*4)break}
 return unique(arr,n);
}
function parsePage(html,siteUrl){
 const content=String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,'');
 const nav=matches(content,/<(?:nav|header)\b[^>]*>([\s\S]*?)<\/(?:nav|header)\s*>/gi,m=>m[1],7).join(' ');
 const anchor=/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
 const scriptTags=matches(html,/<script\b[^>]*src\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)[^>]*>/gi,m=>attr(m[0],'src'),20);
 const stylesheetTags=matches(html,/<link\b[^>]*>/gi,m=>/stylesheet/i.test(attr(m[0],'rel'))?attr(m[0],'href'):'',20);
 const menus=matches(nav,anchor,m=>text(m[2]),25);
 const buttons=matches(content,/<button\b[^>]*>([\s\S]*?)<\/button\s*>/gi,m=>text(m[1]),30);
 const inputs=matches(content,/<input\b[^>]*>/gi,m=>attr(m[0],'placeholder')||attr(m[0],'name')||attr(m[0],'type'),25);
 const forms=matches(content,/<form\b([^>]*)>([\s\S]*?)<\/form\s*>/gi,m=>({
   method:attr(m[1],'method')||'GET',fields:matches(m[2],/<(?:input|select|textarea)\b[^>]*>/gi,x=>attr(x[0],'name')||attr(x[0],'placeholder')||'',15)
 }),10);
 const getHead=re=>text((html.match(re)||[])[1]||'');
 const urls=matches(content,anchor,m=>{
   const href=attr(m[1],'href').split('?')[0].slice(0,160);
   return text(m[2])+' → '+href;
 },30);
 const styles=(html.match(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)||[]).join('\n').slice(0,110000);
 return {
   sourceURL:siteUrl.origin+siteUrl.pathname,
   title:getHead(/<title[^>]*>([\s\S]*?)<\/title>/i)||'Başlıksız sayfa',
   description:text(attr((html.match(/<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/i)||[])[0]||'','content')),
   headings:matches(content,/<h[123]\b[^>]*>([\s\S]*?)<\/h[123]\s*>/gi,m=>text(m[1]),25),
   menu:menus,buttons,forms,fields:inputs,
   colors:unique(styles.match(/#[\da-fA-F]{3,8}\b/g)||[],16),
   stylesheets:stylesheetTags,scripts:scriptTags,links:urls,
   counters:{
     links:(content.match(/<a\b/gi)||[]).length,
     buttons:(content.match(/<button\b/gi)||[]).length,
     forms:(content.match(/<form\b/gi)||[]).length
   }
 };
}
function publicIPv4(ip){
 if(net.isIP(ip)!==4)return false;
 const a=ip.split('.').map(Number),[x,y,z]=a;
 if([0,10,127].includes(x)||x>=224||x===169&&y===254||x===172&&y>=16&&y<=31||x===192&&y===168||x===100&&y>=64&&y<=127||x===198&&(y===18||y===19)||x===192&&y===0||x===192&&y===0&&z===2||x===198&&y===51&&z===100||x===203&&y===0&&z===113||x===192&&y===88)return false;
 return true;
}
async function checkURL(value){
 let url;
 try{url=new URL(value)}catch{throw Error('Geçersiz URL')}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Yalnızca giriş gerektirmeyen HTTP/HTTPS bağlantısı.');
 if(url.port && !['80','443'].includes(url.port))throw Error('Yalnızca standart 80/443 portları kabul edilir.');
 if(!url.hostname||url.hostname.length>253||/(\.local|\.internal|\.lan|\.home|\.test|\.invalid|\.localhost|\.onion)$/i.test(url.hostname)||url.hostname.toLowerCase()==='localhost')throw Error('Özel ağ adresleri desteklenmiyor.');
 if(net.isIP(url.hostname)===6)throw Error('Doğrudan IPv6 adresleri desteklenmiyor.');
 let addresses;
 if(net.isIP(url.hostname)===4)addresses=[{address:url.hostname,family:4}];
 else addresses=await dns.lookup(url.hostname,{all:true,verbatim:true});
 const ipv4=addresses.filter(x=>x.family===4);
 if(!ipv4.length||addresses.some(x=>x.family===4&&!publicIPv4(x.address)))throw Error('URL özel veya ayrılmış IP aralığına çözülüyor.');
 url.hash='';
 return {url,pinned:ipv4[0].address};
}
async function requestHTML(target,redirects=0,kind='html',allowedOrigin=null){
 if(redirects>3)throw Error('Çok fazla yönlendirme.');
 const {url,pinned}=await checkURL(target);
 if(allowedOrigin&&url.origin!==allowedOrigin)throw Error('İzinli tarama aynı origin ile sınırlıdır.');
 return new Promise((resolve,reject)=>{
   const transport=url.protocol==='https:'?https:http;
   const req=transport.request(url,{
     method:'GET',family:4,lookup:(_host,_options,cb)=>cb(null,pinned,4),
     headers:{'User-Agent':'Dimensia-Public-Reference-Inspector/1.0','Accept':'text/html,application/xhtml+xml','Accept-Encoding':'gzip, deflate, br'}
   },res=>{
     if([301,302,303,307,308].includes(res.statusCode)&&res.headers.location){
       res.resume();requestHTML(new URL(res.headers.location,url).href,redirects+1,kind,allowedOrigin).then(resolve,reject);return;
     }
     if(res.statusCode!==200){res.resume();reject(Error('Hedef HTTP '+res.statusCode));return}
     const type=String(res.headers['content-type']||'');
     const valid=kind==='html'?/html|xhtml/i.test(type):kind==='css'?/css|plain|octet-stream/i.test(type):/javascript|ecmascript|plain|octet-stream/i.test(type);
     if(!valid){res.resume();reject(Error('Beklenmeyen kaynak Content-Type.'));return}
     const encoding=String(res.headers['content-encoding']||'').toLowerCase();
     let stream=res;
     if(encoding==='gzip')stream=res.pipe(createGunzip());
     if(encoding==='deflate')stream=res.pipe(createInflate());
     if(encoding==='br')stream=res.pipe(createBrotliDecompress());
     let size=0,parts=[];
     stream.on('data',chunk=>{
       size+=chunk.length;
       if(size>1400000){stream.destroy(Error('HTML boyutu 1.4 MB üstünde.'));return}
       parts.push(chunk);
     });
     stream.once('error',reject);
     stream.once('end',()=>resolve({html:Buffer.concat(parts).toString('utf-8'),url}));
   });
   req.setTimeout(9500,()=>req.destroy(Error('URL zaman aşımı.')));
   req.once('error',reject);req.end();
 });
}

/* Bounded sequential public-site crawl. The analyzer makes HTTP GET requests only;
   it neither authenticates nor submits forms, and keeps all follow-up requests same-origin. */
async function architectScan(urlValue,requestedPages=3,requestedAssets=8){
 const first=await requestHTML(urlValue);
 const origin=first.url.origin;
 const pagesMax=Math.max(1,Math.min(ARCHITECT_LIMITS.pages,Number(requestedPages)||3));
 const assetsMax=Math.max(0,Math.min(ARCHITECT_LIMITS.assets,Number(requestedAssets)||8));
 const queue=[{url:first.url.href,html:first.html,final:first.url}],visited=new Set(),pages=[],activity=[];
 const assetQueue=[],assetSeen=new Set(),assets=[];
 function note(stage,detail,status){activity.push({stage,detail:String(detail).slice(0,180),status});}
 note('start','Yalnızca aynı origin üzerindeki herkese açık GET istekleri','complete');
 while(queue.length&&pages.length<pagesMax){
  const item=queue.shift(),address=new URL(item.url).href.split('#')[0];
  if(visited.has(address))continue;
  visited.add(address);
  try{
   const result=item.html?{html:item.html,url:item.final}:await requestHTML(address,0,'html',origin);
   if(result.url.origin!==origin)throw Error('Hedef farklı origin adresine yönlendirdi.');
   const page=analyzeHTML(result.html,result.url.href);
   pages.push(page);
   note('page',page.title||page.url,'complete');
   for(const link of discoverInternalPageLinks(page,origin,30)){
    if(pages.length+queue.length>=pagesMax||visited.has(link)||queue.some(x=>x.url===link))break;
    queue.push({url:link});
   }
   for(const a of [...page.assets.css,...page.assets.js]){
    if(assetQueue.length>=assetsMax*3||!a?.url||assetSeen.has(a.url))continue;
    const target=new URL(a.url);
    if(target.origin!==origin){note('external',a.url,'skipped');continue}
    assetSeen.add(a.url);assetQueue.push(a);
   }
  }catch(error){note('page',address+' · '+String(error.message||error),'skipped')}
 }
 for(const asset of assetQueue){
  if(assets.length>=assetsMax)break;
  try{
   const response=await requestHTML(asset.url,0,asset.kind,origin);
   if(response.html.length>ARCHITECT_LIMITS.assetBytes)throw Error('Kaynak boyut sınırı');
   const data=analyzeAsset(response.html,asset.kind,response.url.href);
   assets.push(data);note('asset',asset.kind.toUpperCase()+' · '+asset.url,'complete');
  }catch(error){note('asset',asset.url+' · '+String(error.message||error),'skipped')}
 }
 const diagram=makeArchitectureGraph({pages});
 const totals={pages:pages.length,assets:assets.length,
  buttons:pages.reduce((n,p)=>n+p.buttons.length,0),
  forms:pages.reduce((n,p)=>n+p.forms.length,0),
  links:pages.reduce((n,p)=>n+p.links.length,0),
  colors:[...new Set([...pages.flatMap(p=>p.style.colors),...assets.flatMap(a=>a.style?.colors||[])])].slice(0,54),
  fontFamilies:[...new Set([...pages.flatMap(p=>p.style.fontFamilies),...assets.flatMap(a=>a.style?.fontFamilies||[])])].slice(0,32),
  fontSizes:[...new Set([...pages.flatMap(p=>p.style.fontSizes),...assets.flatMap(a=>a.style?.fontSizes||[])])].slice(0,48)
 };
 return{kind:'authorized-public-static-analysis',origin,requestedURL:urlValue,
  generatedAt:new Date().toISOString(),
  limitations:'Statik kaynak incelemesi: gizli sunucu kodu, veritabanı, oturum, hesap ve dinamik JS davranışı elde edilemez.',
  limits:{pagesMax,assetsMax,assetBytes:ARCHITECT_LIMITS.assetBytes},
  totals,pages,assets,diagram,activity};
}

const server=http.createServer(async(req,res)=>{
 try{
   const incoming=new URL(req.url,'http://localhost');
   if(req.method!=='GET')return json(res,405,{error:'Yalnızca GET.'});
   if(incoming.pathname==='/api/status')return json(res,200,{aiEnabled:false,urlImport:true,mode:'local'});
   if(incoming.pathname==='/api/architect'){
     const ip=req.socket.remoteAddress||'unknown',now=Date.now();
     const list=(hits.get(ip)||[]).filter(t=>now-t<60000);
     if(list.length>=6)return json(res,429,{error:'Detaylı tarama sınırı: 6 istek/dakika.'});
     list.push(now);hits.set(ip,list);
     if(incoming.searchParams.get('consent')!=='yes')return json(res,403,{error:'Yalnızca sahibi olduğunuz veya inceleme izniniz bulunan siteleri tarayın.'});
     const value=incoming.searchParams.get('url');
     if(!value||value.length>1700)return json(res,400,{error:'Geçerli ve kısa bir URL gir.'});
     try{
       const report=await architectScan(value,incoming.searchParams.get('pages'),incoming.searchParams.get('assets'));
       return json(res,200,report);
     }catch(error){return json(res,422,{error:String(error.message||error).slice(0,260)})}
   }
   if(incoming.pathname==='/api/inspect'){
     const ip=req.socket.remoteAddress||'unknown',now=Date.now();
     let list=(hits.get(ip)||[]).filter(t=>now-t<60000);
     if(list.length>=12)return json(res,429,{error:'URL taraması hız sınırına ulaştı.'});
     list.push(now);hits.set(ip,list);
     const value=incoming.searchParams.get('url');
     if(!value||value.length>1700)return json(res,400,{error:'Kısa ve geçerli bir URL gir.'});
     try{const page=await requestHTML(value);return json(res,200,parsePage(page.html,page.url))}
     catch(error){return json(res,422,{error:String(error.message||error).slice(0,240)})}
   }
   if(incoming.pathname==='/api/source'){
     const ip=req.socket.remoteAddress||'unknown',now=Date.now();
     const list=(hits.get(ip)||[]).filter(t=>now-t<60000);
     if(list.length>=18)return json(res,429,{error:'Kaynak alma hız sınırı.'});
     list.push(now);hits.set(ip,list);
     const value=incoming.searchParams.get('url');
     const kind=incoming.searchParams.get('kind');
     if(!['html','css','js'].includes(kind))return json(res,400,{error:'Kaynak türü html/css/js olmalıdır.'});
     if(!value||value.length>1700)return json(res,400,{error:'Kısa ve geçerli URL gir.'});
     try{
       const page=await requestHTML(value,0,kind);
       return json(res,200,{kind,resolvedURL:page.url.href,content:page.html,bytes:Buffer.byteLength(page.html,'utf8')});
     }catch(error){return json(res,422,{error:String(error.message||error).slice(0,220)})}
   }
   // Serve locally generated site folders only; no user-supplied path traversal.
   const siteMatch=/^\/sites\/([a-z0-9](?:[a-z0-9-]{0,44}[a-z0-9])?)\/(?:index\.html)?$/.exec(incoming.pathname);
   if(siteMatch){
     try{
       const html=await readFile(path.join(ROOT,'sites',siteMatch[1],'index.html'));
       res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','Referrer-Policy':'strict-origin-when-cross-origin','X-Content-Type-Options':'nosniff'});
       res.end(html);return;
     }catch{return json(res,404,{error:'Site bulunamadı'})}
   }
   const asset=allowed.get(incoming.pathname);
   if(!asset)return json(res,404,{error:'Bulunamadı'});
   const file=await readFile(path.join(ROOT,asset[0]));
   res.writeHead(200,{'Content-Type':asset[1],'Content-Security-Policy':"frame-ancestors 'self'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});
   res.end(file);
 }catch(error){json(res,500,{error:'Sunucu hatası.'})}
});
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  server.listen(PORT,HOST,()=>console.log('Dimensia Studio: http://'+HOST+':'+PORT));
}
export {architectScan};
