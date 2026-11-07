/* Dimensia Architect: URL analysis without local Node, graph & design editor.
   Runs as a browser module; GitHub Actions remote mode requires user's own GitHub token. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const studio=$('page-studio'),ref=$('referenceUrl');
 if(!studio||!$('siteFrame'))return;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const trim=(s,n=110)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
 const unique=(values,n=50)=>[...new Set(values.filter(Boolean))].slice(0,n);
 let report=null,sourceMode='local',tab='summary',running=false,sourceIndex=0;
 let files=[];
 const root=document.createElement('section');
 root.className='arch-studio';root.id='architectStudio';
 root.dataset.comfort='soft';
 root.innerHTML=
 '<header class="arch-head"><div><div class="arch-kicker">RE ARCHITECT · DIMENSIA 5.0</div><h2>Siteyi çözümle. <em>Mimariyi düzenle.</em></h2>'+
 '<p>HTML, CSS, JavaScript, buton, form, renk, font ve gezinme akışını adım adım incele. Kendi sitende tasarımı değiştir; full-stack projene kaynak üret.</p></div>'+
 '<div class="arch-controls" role="group" aria-label="Göz yormayan renk seçenekleri">'+
 '<button type="button" class="arch-btn" data-comfort="midnight">☾ Koyu</button><button type="button" class="arch-btn" data-comfort="soft">◒ Yumuşak</button>'+
 '<button type="button" class="arch-btn" data-comfort="paper">☀ Açık</button></div></header>'+
 '<div class="arch-toolbar"><div class="arch-line"><input type="url" class="arch-input" id="archURL" aria-label="Site URL" placeholder="https://ornek.com">'+
 '<button type="button" id="archURLScan" class="arch-btn arch-btn-primary">◎ URL Analiz Et</button>'+
 '<button type="button" id="archOwnScan" class="arch-btn">⌘ Kendi Sitemi Tara</button>'+
 '<button type="button" id="archHTMLFileBtn" class="arch-btn">↑ HTML Yükle</button>'+
 '<input type="file" id="archHTMLFile" accept=".html,.htm,text/html" hidden></div>'+
 '<label class="arch-consent"><input type="checkbox" id="archConsent"> Yalnızca bana ait veya inceleme hakkım bulunan sitenin erişilebilir kaynaklarını analiz edeceğim.</label>'+
 '<p class="arch-intro">URL Analiz Et: Önce doğrudan CORS erişimini, ardından isteğe bağlı Node API’sini dener. İkisi de mümkün değilse GitHub Actions ile bulut taraması önerir. GitHub Pages’te Node kurulumu gerekmez.</p>'+
 '<div class="arch-actions"><button class="arch-btn" type="button" id="archCloud">☁ GitHub Bulut Tarama</button>'+
 '<button class="arch-btn" type="button" id="archReport">↓ Raporu İndir</button>'+
 '<button class="arch-btn" type="button" id="archGoLaunch">⌁ GitHub Token Ayarları</button></div></div>'+
 '<div class="arch-steps" id="archSteps">'+
 '<div class="arch-step" data-step="0"><strong>1</strong> URL / Yetki</div>'+
 '<div class="arch-step" data-step="1"><strong>2</strong> HTML / DOM</div>'+
 '<div class="arch-step" data-step="2"><strong>3</strong> CSS / Renk</div>'+
 '<div class="arch-step" data-step="3"><strong>4</strong> JS / Etkinlik</div>'+
 '<div class="arch-step" data-step="4"><strong>5</strong> Akış Diyagramı</div>'+
 '<div class="arch-step" data-step="5"><strong>6</strong> Düzenleme</div></div>'+
 '<div class="arch-notice" id="archNotice" aria-live="polite">Kendi siteni tara veya izinli bir URL gir. Node.js kurulu olmasına gerek yok.</div>'+
 '<div class="arch-statline" id="archStats"><div class="arch-stat"><b>0</b> Sayfa</div></div>'+
 '<div class="arch-tabs" role="tablist">'+
 '<button class="arch-tab active" data-tab="summary">◈ Özet</button>'+
 '<button class="arch-tab" data-tab="flow">⟷ Akış Diyagramı</button>'+
 '<button class="arch-tab" data-tab="components">⌖ Buton / Form</button>'+
 '<button class="arch-tab" data-tab="design">◐ Renk / Font</button>'+
 '<button class="arch-tab" data-tab="source">⌘ Kod Kaynakları</button>'+
 '<button class="arch-tab" data-tab="backend">▤ Full-Stack</button></div>'+
 '<div class="arch-content" id="archContent"></div>'+
 '<div class="arch-bottom">© Dimensia · İzinli kaynak analizi, göz yormayan renkler <button class="arch-btn" id="archOpenFlow" type="button">↗ İş Akışı Kaydedici</button></div>';
 const anchor=$('dimensiaLaunchpad')||studio.querySelector('.studio-title');
 anchor?.after(root);
 const area=$('archContent');
 const notice=(text,error=false)=>{$('archNotice').textContent=text;$('archNotice').classList.toggle('error',error)};
 const progression=n=>root.querySelectorAll('[data-step]').forEach((x,i)=>{x.classList.toggle('current',i===n);x.classList.toggle('done',i<n)});
 const setTheme=t=>{
  const valid=['midnight','soft','paper'].includes(t)?t:'soft';
  root.dataset.comfort=valid;document.body.dataset.archComfort=valid;
  root.querySelectorAll('[data-comfort]').forEach(x=>x.classList.toggle('active',x.dataset.comfort===valid));
  try{localStorage.setItem('dimensia-architect-theme',valid)}catch{}
 };
 root.querySelectorAll('[data-comfort]').forEach(x=>x.onclick=()=>setTheme(x.dataset.comfort));
 try{setTheme(localStorage.getItem('dimensia-architect-theme')||'soft')}catch{setTheme('soft')}
 function parseHTML(html,base){
  const doc=new DOMParser().parseFromString(html,'text/html');
  const styles=[...doc.querySelectorAll('style')].map(x=>x.textContent).join('\n').slice(0,200000);
  const inlineJS=[...doc.scripts].filter(x=>!x.src).map(x=>x.textContent).join('\n\n').slice(0,120000);
  const css=styles+' '+[...doc.querySelectorAll('[style]')].slice(0,200).map(x=>x.getAttribute('style')).join(';');
  const colors=unique([...css.matchAll(/#[a-fA-F0-9]{3,8}\b|rgba?\([^)]+\)/g)].map(x=>x[0]),50);
  const sizes=unique([...css.matchAll(/font-size\s*:\s*([0-9.]+(?:px|rem|em|pt|vw|%))/gi)].map(x=>x[1]),35);
  const fonts=unique([...css.matchAll(/font-family\s*:\s*([^;}\n]+)/gi)].map(x=>trim(x[1],110)),30);
  const resolve=raw=>{try{const u=new URL(raw,base);return ['http:','https:'].includes(u.protocol)?u.href.split('#')[0]:null}catch{return null}};
  const links=[...doc.querySelectorAll('a[href]')].slice(0,150).map(x=>({label:trim(x.textContent||x.getAttribute('aria-label')),href:x.getAttribute('href')||'',resolved:resolve(x.getAttribute('href'))}));
  const buttons=[...doc.querySelectorAll('button,[role=button],input[type=submit]')].slice(0,100).map(x=>({
   label:trim(x.textContent||x.getAttribute('aria-label')||x.getAttribute('value')||x.id||'Buton'),
   id:x.id||'',type:x.getAttribute('type')||'button',classes:trim(x.className,100),
   dataAction:x.getAttribute('data-action')||''}));
  const forms=[...doc.querySelectorAll('form')].slice(0,30).map(f=>({id:f.id||'',method:(f.method||'GET').toUpperCase(),action:f.getAttribute('action')||'',fields:[...f.querySelectorAll('input,select,textarea')].slice(0,20).map(x=>({name:x.name||'',type:x.type||x.tagName.toLowerCase(),label:x.getAttribute('placeholder')||x.getAttribute('aria-label')||''}))}));
  const hints=unique([...inlineJS.matchAll(/addEventListener\s*\(\s*['"]([^'"]+)['"]/g)].map(x=>'event: '+x[1]).concat([...inlineJS.matchAll(/\bfetch\s*\(\s*['"]([^'"]+)['"]/g)].map(x=>'fetch: '+x[1])),50);
  const page={url:base,title:doc.title||'Başlıksız',metas:{description:doc.querySelector('meta[name=description]')?.content||''},
   headings:[...doc.querySelectorAll('h1,h2,h3')].slice(0,90).map(x=>({level:Number(x.tagName.slice(1)),text:trim(x.textContent,140)})),
   links,buttons,forms,
   navLinks:[...doc.querySelectorAll('nav a,header a')].slice(0,70).map(x=>({label:trim(x.textContent),href:x.getAttribute('href')||''})),
   style:{colors,fontSizes:sizes,fontFamilies:fonts,variables:{}},
   components:{sections:doc.querySelectorAll('section').length,images:doc.images.length,svg:doc.querySelectorAll('svg').length,canvas:doc.querySelectorAll('canvas').length},
   assets:{css:[...doc.querySelectorAll('link[rel~=stylesheet]')].slice(0,20).map(x=>({url:resolve(x.href),kind:'css'})).filter(x=>x.url),
    js:[...doc.scripts].filter(x=>x.src).slice(0,20).map(x=>({url:resolve(x.src),kind:'js'})).filter(x=>x.url)},
   code:{html:html.slice(0,400000),inlineCSS:styles,inlineJS},
   inferred:{handlerHints:hints,apiHints:hints.filter(x=>x.startsWith('fetch')).map(x=>({path:x.slice(7)}))}};
  return{kind:'browser-html',origin:base,pages:[page],assets:[],
   totals:{pages:1,buttons:buttons.length,forms:forms.length,links:links.length,assets:0,colors,fontSizes:sizes,fontFamilies:fonts},
   activity:[{stage:'html',detail:'HTML/DOM tarandı',status:'complete'},{stage:'css',detail:'Inline CSS renk ve font özellikleri bulundu',status:'complete'},{stage:'js',detail:'JavaScript event ipuçları çıkarıldı',status:'complete'}]};
 }
 function remoteReport(result,mode){
  report=result;sourceMode=mode;
  const total=report.totals||{};
  if(!Array.isArray(report.pages)||!report.pages.length)throw Error('Analiz sonucu geçerli sayfa içermiyor.');
  files=[];for(const [i,p] of report.pages.entries()){
   if(p.code?.html)files.push({label:'HTML · '+(p.title||i+1),type:'html',content:p.code.html});
   if(p.code?.inlineCSS)files.push({label:'CSS · '+(p.title||i+1),type:'css',content:p.code.inlineCSS});
   if(p.code?.inlineJS)files.push({label:'JS · '+(p.title||i+1),type:'js',content:p.code.inlineJS});
  }
  for(const a of report.assets||[])if(a.content)files.push({label:a.kind.toUpperCase()+' · '+(a.url||''),type:a.kind,content:a.content});
  sourceIndex=0;
  const stats=[['Sayfa',total.pages||report.pages.length],['Buton',total.buttons||0],['Form',total.forms||0],['Link',total.links||0],['CSS/JS',total.assets||0],['Renk',(total.colors||[]).length]];
  const root=$('archStats');root.replaceChildren();for(const [label,num] of stats){const item=document.createElement('div');item.className='arch-stat';const strong=document.createElement('b');strong.textContent=String(num);item.append(strong,document.createTextNode(' '+label));root.append(item)}
  progression(5);render();
  const first=report.pages[0];
  const previous=window.DimensiaReference;
  if(previous?.present){
   try{previous.present({sourceURL:first.url,title:first.title,headings:(first.headings||[]).map(x=>x.text),menu:(first.navLinks||[]).map(x=>x.label),
    buttons:(first.buttons||[]).map(x=>x.label),forms:first.forms||[],colors:first.style?.colors||[],
    stylesheets:(first.assets?.css||[]).map(x=>x.url),scripts:(first.assets?.js||[]).map(x=>x.url),
    links:(first.links||[]).map(x=>x.label+' → '+x.href),
    counters:{links:first.links?.length||0,buttons:first.buttons?.length||0,forms:first.forms?.length||0}},mode)}
   catch{}
  }
  notice('✓ '+report.pages.length+' sayfa analiz edildi · '+mode+'. Renkler, butonlar, akışlar ve kaynaklar sekmelerde.');
 }
 function setBusy(active){running=active;$('archURLScan').disabled=active;$('archOwnScan').disabled=active;$('archCloud').disabled=active}
 async function analyseURL(value){
  if(running)return;
  if(!elConsent())return notice('Önce siteyi inceleme hakkına sahip olduğunu onayla.',true);
  let target;try{target=new URL(value||$('archURL').value.trim());if(!['http:','https:'].includes(target.protocol)||target.username||target.password)throw Error()}catch{return notice('Geçerli bir HTTP/HTTPS URL gir.',true)}
  $('archURL').value=target.href;if(ref)ref.value=target.href;
  setBusy(true);progression(0);notice('1/6 · URL ve erişim izni kontrol ediliyor…');
  let reason='';
  try{
   // Local Node server provides multi-page safe crawling. GitHub Pages does not.
   const api=new URL('api/architect?'+new URLSearchParams({url:target.href,consent:'yes',pages:'5',assets:'10'}),document.baseURI);
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),32000);
   try{
    const response=await fetch(api,{credentials:'omit',cache:'no-store',signal:controller.signal});
    if(response.ok&&(response.headers.get('content-type')||'').includes('json')){
     const j=await response.json();if(Array.isArray(j.pages)&&j.pages.length){remoteReport(j,'Yerel sunucu çoklu analiz');return}
    }
   }finally{clearTimeout(timer)}
  }catch(e){reason=String(e.message||e)}
  progression(1);notice('2/6 · Doğrudan CORS HTML erişimi deneniyor…');
  try{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12500);
   try{
    const response=await fetch(target.href,{credentials:'omit',mode:'cors',signal:controller.signal});
    if(!response.ok)throw Error('HTTP '+response.status);
    if(!/html/i.test(response.headers.get('content-type')||''))throw Error('Hedef HTML yanıtı vermedi.');
    const html=(await response.text()).slice(0,1250000);
    if(!/<html\b/i.test(html))throw Error('Geçerli HTML görünmüyor.');
    remoteReport(parseHTML(html,target.href),'Tarayıcı CORS analizi');return;
   }finally{clearTimeout(timer)}
  }catch(e){reason=String(e.message||e)}
  notice('Tarayıcı doğrudan HTML kaynağını açamadı (CORS). ☁ GitHub Bulut Tarama düğmesini kullan; Node kurmana gerek yok. GitHub tokenine Actions: write izni gerekir. Alternatif: HTML dosyası yükle. '+trim(reason,100),true);
  setTab('summary');
  return;
  }finally{setBusy(false)}
 }
 function elConsent(){return $('archConsent').checked}
 async function cloudScan(){
  if(running)return;
  if(!elConsent())return notice('Bulut taraması için site analiz yetkisini onayla.',true);
  let url;try{url=new URL($('archURL').value.trim());if(!['http:','https:'].includes(url.protocol))throw Error()}catch{return notice('URL gir.',true)}
  const service=window.DimensiaLaunchpad;
  if(!service?.startCloudAnalysis)return notice('GitHub Launchpad bağlantısı bulunamadı.',true);
  const id='r'+Date.now().toString(36)+Math.random().toString(36).slice(2,12);
  setBusy(true);progression(0);
  try{
   notice('1/6 · GitHub Actions taraması başlatılıyor. Token için Actions: read/write + Contents: read gerekir.');
   const task=await service.startCloudAnalysis(url.href,id);
   progression(1);notice('2/6 · Tarama GitHub bulut sunucusunda çalışıyor. Node.js kurulumuna gerek yok. Rapor kamuya açık metadata olacaktır.');
   for(let attempt=0;attempt<32;attempt++){
    await new Promise(resolve=>setTimeout(resolve,attempt<5?3500:5500));
    let result;
    try{result=await service.fetchCloudAnalysis(task)}
    catch(e){if(/403|429|forbidden|limit/i.test(String(e.message)))throw e;continue}
    if(result){
     if(result.error)throw Error(result.error);
     remoteReport(result,'GitHub bulut metadata');
     notice('✓ GitHub Actions taraması tamamlandı. Geri getirilen veriler HTML/CSS/JS kaynak kodu değil, kamuya açık yapı ve stil metadatasıdır.');
     return;
    }
   }
   throw Error('Bulut tarama raporu henüz dönmedi. GitHub Actions sekmesinden çalışma durumunu kontrol et. Daha sonra yeniden dene.');
  }catch(e){notice('Bulut URL analizi: '+trim(e.message,240)+' · Depo Actions bölümünde public-url-audit workflow’unu kontrol et.',true)}
  finally{setBusy(false)}
 }
 $('archURLScan').onclick=()=>analyseURL();
 $('archCloud').onclick=cloudScan;
 $('archOwnScan').onclick=()=>{
  try{progression(1);remoteReport(parseHTML(state.siteHtml,'https://preview.dimensia.local/'),'Kendi HTML projen');}
  catch(e){notice(e.message,true)}
 };
 $('archHTMLFileBtn').onclick=()=>$('archHTMLFile').click();
 $('archHTMLFile').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>1400000)return notice('HTML dosyası en fazla 1.4 MB olabilir.',true);
  try{remoteReport(parseHTML(await file.text(),'https://uploaded.dimensia.local/'),'Yüklenen HTML');}catch(error){notice(error.message,true)}
  e.target.value='';
 };
 $('archGoLaunch').onclick=()=>{
  $('dimensiaLaunchpad')?.scrollIntoView({behavior:'smooth',block:'start'});
  $('launchToken')?.focus();
 };
 $('archReport').onclick=()=>{
  if(!report)return notice('Önce analiz oluştur.',true);
  const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
  a.href=url;a.download='dimensia-architect-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 };
 $('archOpenFlow').onclick=()=>$('flowRecord')?.scrollIntoView({behavior:'smooth',block:'center'});
 const tags=(items,limit=35)=>'<div class="arch-chipline">'+(items||[]).slice(0,limit).map(x=>'<span class="arch-chip">'+escape(typeof x==='string'?x:String(x?.text||x?.label||x?.path||''))+'</span>').join('')+'</div>';
 const card=(title,detail)=>'<div class="arch-entry"><b>'+escape(title)+'</b><small>'+escape(detail||'')+'</small></div>';
 function renderSummary(){
  if(!report){area.innerHTML='<div class="arch-empty">Önce kendi HTML projenizi veya izinli bir URL’yi analiz edin. CORS engeline takılırsan Node yüklemek zorunda değilsin: GitHub Bulut Tarama veya HTML Dosyası Yükle seçeneklerini kullan.</div>';return}
  const p=report.pages[0];
  area.innerHTML='<h3>◈ Mimari Analiz Özeti</h3><p class="arch-lead">Yalnızca erişilebilir HTML, CSS ve JavaScript kaynaklarından elde edilen bilgiler. Gizli sunucu kodu değildir.</p>'+
   '<div class="arch-columns"><div class="arch-box"><h4>Sayfalar ('+report.pages.length+')</h4><div class="arch-list">'+report.pages.map((x,i)=>card((i+1)+'. '+(x.title||'Başlıksız'),x.url)).join('')+'</div></div>'+
   '<div class="arch-box"><h4>İnceleme adımları</h4><div class="arch-list">'+(report.activity||[]).slice(0,25).map(x=>card((x.status==='complete'?'✓ ':'· ')+x.stage,x.detail)).join('')+'</div></div></div>'+
   '<div class="arch-box" style="margin-top:12px"><h4>Başlıklar ve gezinme</h4>'+tags((p.headings||[]).map(x=>x.text),30)+
   '<hr class="arch-divider"><h4>Menü öğeleri</h4>'+tags((p.navLinks||[]).map(x=>x.label),35)+'</div>';
 }
 function graphModel(){
  if(!report)return{nodes:[],edges:[]};
  const nodes=[],edges=[];
  report.pages.slice(0,6).forEach((p,i)=>{
   nodes.push({id:'p'+i,type:'page',label:trim(p.title,38)});
   (p.buttons||[]).slice(0,5).forEach((b,j)=>{const id='b'+i+'_'+j;nodes.push({id,type:'button',label:trim(b.label||b.id||'Buton',38)});edges.push({from:'p'+i,to:id,label:'click'})});
   (p.forms||[]).slice(0,4).forEach((f,j)=>{const id='f'+i+'_'+j;nodes.push({id,type:'form',label:trim(f.id||'Form '+(j+1),38)});edges.push({from:'p'+i,to:id,label:f.method||'submit'})});
  });
  if(report.diagram?.edges?.length){
   const mapping=new Map(report.pages.map((p,i)=>[p.url,'p'+i]));
   for(const e of report.diagram.edges){
    if(e.kind==='navigation'&&nodes.some(n=>n.id===e.from)&&nodes.some(n=>n.id===e.to))edges.push({from:e.from,to:e.to,label:trim(e.label,25)});
   }
  }
  return{nodes:nodes.slice(0,60),edges:edges.slice(0,120)};
 }
 function renderFlow(){
  if(!report){area.innerHTML='<div class="arch-empty">Akış diyagramı için önce bir analiz oluştur.</div>';return}
  area.innerHTML='<h3>⟷ Sayfa → Buton → Form İş Akışı</h3><p class="arch-lead">Oklar HTML kaynak ilişkilerini gösterir. Dinamik API sonucunu veya gizli iş mantığını garanti etmez. Önizlemedeki gerçek tıklamaları kaydetmek için Flow Recorder bölümünü kullan.</p>';
  const {nodes,edges}=graphModel();
  const graph=document.createElement('div');graph.className='arch-graph';
  const width=960,height=Math.max(320,Math.ceil(nodes.length/4)*86+60);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.setAttribute('aria-label','Site iş akışı diyagramı');
  const pos=new Map();
  nodes.forEach((node,i)=>{const col=i%4,row=Math.floor(i/4);pos.set(node.id,{x:20+col*236,y:22+row*84});});
  function element(tag,atts,parent){const x=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(atts))x.setAttribute(k,String(v));(parent||svg).append(x);return x}
  for(const e of edges){
   const a=pos.get(e.from),b=pos.get(e.to);if(!a||!b)continue;
   const path=element('path',{d:'M '+(a.x+205)+' '+(a.y+21)+' L '+b.x+' '+(b.y+21),class:'edge'+(e.label==='submit'?' flow':'')});
   path.setAttribute('stroke-width','1.5');
  }
  for(const node of nodes){
   const p=pos.get(node.id),group=element('g',{class:'node '+node.type});
   element('rect',{x:p.x,y:p.y,width:205,height:47,rx:9},group);
   const line=element('text',{x:p.x+10,y:p.y+18},group);line.textContent=trim(node.label,27);
   const label=element('text',{x:p.x+10,y:p.y+36,class:'node-label'},group);label.textContent=node.type;
  }
  graph.append(svg);area.append(graph);
  const note=document.createElement('p');note.className='arch-lead';note.textContent=nodes.length+' bileşen · '+edges.length+' yönlü bağlantı';area.append(note);
 }
 function renderComponents(){
  if(!report){area.innerHTML='<div class="arch-empty">Buton ve form listesi için önce analiz yap.</div>';return}
  area.innerHTML='<h3>⌖ Butonlar, Formlar ve Mantık İpuçları</h3><p class="arch-lead">Her bir butonun erişilebilir adı, HTML tipi ve varsa data-action bilgisi gösterilir. Harici sitenin özel backend’i kopyalanmaz.</p>';
  const cols=document.createElement('div');cols.className='arch-columns';
  const buttons=document.createElement('div');buttons.className='arch-box';
  buttons.innerHTML='<h4>Butonlar</h4><div class="arch-list">'+report.pages.flatMap((p,i)=>(p.buttons||[]).map(b=>card((b.label||'İsimsiz')+' · '+(b.type||'button'),'Sayfa '+(i+1)+' · '+(b.id?'#'+b.id+' ':'')+(b.dataAction?'data-action='+b.dataAction:'type='+b.type)))).slice(0,90).join('')+'</div>';
  const forms=document.createElement('div');forms.className='arch-box';
  forms.innerHTML='<h4>Formlar / Alanlar</h4><div class="arch-list">'+report.pages.flatMap((p,i)=>(p.forms||[]).map(f=>card((f.id||'Form')+' · '+(f.method||'GET'),'Sayfa '+(i+1)+' → '+(f.action||'Belirtilmemiş')+' · Alanlar: '+(f.fields||[]).map(x=>x.name||x.label||x.type).join(', ')))).slice(0,55).join('')+'</div>';
  cols.append(buttons,forms);area.append(cols);
  const hints=report.pages.flatMap(p=>p.inferred?.handlerHints||[]);
  if(hints.length){const part=document.createElement('div');part.className='arch-box';part.style.marginTop='12px';part.innerHTML='<h4>JavaScript olay ipuçları (doğrulanmış akış değildir)</h4>'+tags(hints);area.append(part)}
 }
 function colorHex(input){return/^#[\da-fA-F]{6}$/.test(input||'')}
 function renderDesign(){
  if(!report){area.innerHTML='<div class="arch-empty">Renkleri ve fontları görebilmek için önce siteyi analiz et.</div>';return}
  const t=report.totals||{},palette=(t.colors||[]).slice(0,30),fonts=t.fontFamilies||[],sizes=t.fontSizes||[];
  area.innerHTML='<h3>◐ Renk, Tipografi ve Konfor Düzenleyicisi</h3><p class="arch-lead">Renkler kaynak CSS içinden çıkarılır. Düzenlemeler yalnızca kendi açık projenin HTML koduna uygulanır; izinsiz dış sitelere yazılmaz.</p>'+
   '<div class="arch-columns"><div class="arch-box"><h4>Algılanan renkler</h4>'+
   '<div class="arch-colorgrid">'+palette.map(c=>'<div class="arch-coloritem"><div class="arch-swatch" data-swatch="'+escape(c)+'"></div>'+escape(c)+'</div>').join('')+'</div>'+
   '<hr class="arch-divider"><h4>Font aileleri</h4>'+tags(fonts,15)+'<hr class="arch-divider"><h4>Yazı boyutları</h4>'+tags(sizes,25)+'</div>'+
   '<div class="arch-box"><h4>Yeni tasarım değerlerini uygula</h4><div class="arch-form">'+
   '<label>Arka plan <input type="color" id="archBG" value="#151f2d"></label>'+
   '<label>Yazı rengi <input type="color" id="archFG" value="#e6edf4"></label>'+
   '<label>Vurgu rengi <input type="color" id="archAccent" value="#75c9ba"></label>'+
   '<label>Yazı boyutu (px) <input type="number" id="archFont" min="12" max="24" value="16"></label>'+
   '<label>Köşe yuvarlama (px) <input type="number" id="archRadius" min="0" max="32" value="12"></label>'+
   '<label>Yazı tipi <select id="archFamily"><option value="system">Sistem / Rahat Okuma</option><option value="serif">Serif / Kitap</option><option value="mono">Mono / Kod</option></select></label></div>'+
   '<div class="arch-actions"><button id="archApplyDesign" class="arch-btn arch-btn-primary">✓ Kendi Siteme Uygula</button>'+
   '<button id="archCopyDesign" class="arch-btn">↓ CSS İndir</button></div><p class="arch-lead">Göz yormayan modlar Architect arayüzünü değiştirir; bu paneldeki ayarlar oluşturduğun sitenin HTML/CSS kodunu düzenler.</p></div></div>';
  area.querySelectorAll('[data-swatch]').forEach(x=>{const c=x.getAttribute('data-swatch');if(colorHex(c)||/^#[0-9a-fA-F]{3}$/.test(c)||/^(rgba?|hsla?)\(/i.test(c))x.style.background=c});
  const makeCSS=()=>{
   const bg=$('archBG').value,fg=$('archFG').value,accent=$('archAccent').value;
   const font=Math.min(24,Math.max(12,Number($('archFont').value)||16));
   const radius=Math.min(32,Math.max(0,Number($('archRadius').value)||12));
   if(![bg,fg,accent].every(colorHex))throw Error('Renkler geçerli 6 haneli HEX olmalıdır.');
   const family={system:'system-ui,-apple-system,Segoe UI,sans-serif',serif:'Georgia,Times New Roman,serif',mono:'ui-monospace,Consolas,monospace'}[$('archFamily').value]||'system-ui,sans-serif';
   return ':root{--dimensia-bg:'+bg+';--dimensia-fg:'+fg+';--dimensia-accent:'+accent+';--dimensia-radius:'+radius+'px;}'+
    '\nbody{background-color:'+bg+';color:'+fg+';font-family:'+family+';font-size:'+font+'px;}'+
    '\nbutton,input,select,textarea{font-family:inherit;font-size:inherit;border-radius:var(--dimensia-radius);}'+
    '\na{color:var(--dimensia-accent);}button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid var(--dimensia-accent);outline-offset:3px;}';
  };
  $('archCopyDesign').onclick=()=>{try{const css=makeCSS(),url=URL.createObjectURL(new Blob([css],{type:'text/css'}));const a=document.createElement('a');a.href=url;a.download='dimensia-design.css';a.click();setTimeout(()=>URL.revokeObjectURL(url),2400)}catch(e){notice(e.message,true)}};
  $('archApplyDesign').onclick=()=>{
   try{
    if(!state.siteHtml)throw Error('Önce kendi HTML projenizi oluştur.');
    const css=makeCSS();
    const doc=new DOMParser().parseFromString(state.siteHtml,'text/html');
    doc.querySelector('style[data-dimensia-architect]')?.remove();
    const style=doc.createElement('style');style.dataset.dimensiaArchitect='true';style.textContent=css;
    (doc.head||doc.documentElement).append(style);
    showHTML('<!doctype html>\n'+doc.documentElement.outerHTML,state.siteName||'Yeni Sitem');
    notice('✓ CSS güncellendi, HTML kaynağına işlendi. Önizleme sekmesinden sonucu gör.');
   }catch(e){notice(e.message,true)}
  };
 }
 function renderSource(){
  if(!report){area.innerHTML='<div class="arch-empty">Kaynakları açmak için önce siteyi analiz et.</div>';return}
  area.innerHTML='<h3>⌘ HTML / CSS / JS Kaynak Kodları</h3><p class="arch-lead">'+(files.length?'Kaynağı seç, düzenle, indir veya kendi HTML projen olarak aktar.':'GitHub bulut raporu sadece yapısal metadata içerir; tam kod için HTML yükle veya CORS izinli kaynağa eriş. Gizli backend otomatik bulunamaz.')+'</p>';
  if(!files.length)return;
  const layout=document.createElement('div');layout.className='arch-code-layout';
  const nav=document.createElement('div');nav.className='arch-files';
  files.forEach((f,i)=>{const btn=document.createElement('button');btn.className='arch-file'+(i===sourceIndex?' active':'');btn.textContent=f.label;btn.onclick=()=>{sourceIndex=i;renderSource()};nav.append(btn)});
  const main=document.createElement('div');main.className='arch-box';
  main.innerHTML='<h4>Kaynak: '+escape(files[sourceIndex]?.label||'')+'</h4>'+
   '<textarea spellcheck="false" id="archCode" class="arch-code" aria-label="HTML CSS JS kaynak kod düzenleyicisi"></textarea>'+
   '<div class="arch-actions"><button id="archSaveCode" class="arch-btn">✓ Düzenlemeyi Belleğe Al</button>'+
   '<button id="archDownloadCode" class="arch-btn">↓ Dosya İndir</button>'+
   '<button id="archApplyCode" class="arch-btn arch-btn-primary">↗ Projeye Uygula</button></div>';
  layout.append(nav,main);area.append(layout);
  const file=files[sourceIndex];$('archCode').value=file.content;
  $('archSaveCode').onclick=()=>{file.content=$('archCode').value;notice('Kaynak bellekte düzenlendi. Projeye Uygula ile kendi sitene aktar.')};
  $('archDownloadCode').onclick=()=>{
   file.content=$('archCode').value;
   const url=URL.createObjectURL(new Blob([file.content],{type:'text/plain;charset=utf-8'}));
   const a=document.createElement('a');a.href=url;a.download='architect-'+(sourceIndex+1)+'.'+(file.type==='html'?'html':file.type==='css'?'css':'js');a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);
  };
  $('archApplyCode').onclick=()=>{
   try{
    file.content=$('archCode').value;
    if(!confirm('Seçili kaynak kendi proje koduna eklenecek veya mevcut HTML’nin yerine geçecek. Devam edilsin mi?'))return;
    let html=state.siteHtml;
    if(file.type==='html'){
     if(!/<html[\s>]/i.test(file.content)||!/<\/html>/i.test(file.content))throw Error('Geçerli, tam HTML dokümanı gerekli.');
     if(sourceMode!=='Kendi HTML projen'){
      const doc=new DOMParser().parseFromString(file.content,'text/html');
      doc.querySelectorAll('script,iframe,object,embed,base').forEach(x=>x.remove());
      doc.querySelectorAll('*').forEach(x=>{for(const a of [...x.attributes])if(/^on/i.test(a.name)||/^(?:javascript:|data:)/i.test(a.value.trim())&&['src','href','action'].includes(a.name))x.removeAttribute(a.name)});
      html='<!doctype html>\n'+doc.documentElement.outerHTML;
     }else html=file.content;
    }else if(file.type==='css'){
     html=html.replace(/<\/head>/i,'<style data-dimensia-import>\\n'+file.content.replace(/<\/style/gi,'<\\/style')+'\\n</style>\\n</head>');
    }else{
     if(sourceMode!=='Kendi HTML projen')throw Error('Dış kaynaktan JavaScript otomatik çalıştırılamaz. JS dosyasını indirip kontrol et.');
     html=html.replace(/<\/body>/i,'<script data-dimensia-import>\\n'+file.content.replace(/<\/script/gi,'<\\/script')+'\\n</scr'+'ipt>\\n</body>');
    }
    showHTML(html,state.siteName||'Yeni Sitem');notice('✓ Kaynak HTML projenin editörüne uygulandı. Geri al için eski projeyi kaydetmiş ol.');
   }catch(e){notice(e.message,true)}
  };
 }
 function renderBackend(){
  area.innerHTML='<h3>▤ Full-Stack: Yerel Node.js CRUD Şablonu</h3><p class="arch-lead">Bu, senin kendi uygulaman için bir API şablonudur. GitHub Pages üzerinde Node/Python/Rust sunucu çalıştırılamaz. Oluşturulan backend’i bilgisayarda, VPS’te veya destekleyen bir platformda çalıştırabilirsin.</p>'+
   '<div class="arch-backend-row"><div class="arch-box"><div class="arch-form">'+
   '<label>API koleksiyon adı <input id="archCollection" value="items" maxlength="40"></label>'+
   '<label>Birinci alan <input id="archFieldOne" value="title" maxlength="36"></label>'+
   '<label>İkinci alan <input id="archFieldTwo" value="done" maxlength="36"></label>'+
   '<label>İkinci alan türü <select id="archTypeTwo"><option value="boolean">boolean</option><option value="text">text</option><option value="number">number</option></select></label>'+
   '</div><div class="arch-actions"><button class="arch-btn arch-btn-primary" id="archBackendDownload">↓ Node.js API Dosyası Üret</button></div></div>'+
   '<div class="arch-box"><h4>Planlanan yerel API</h4><div class="arch-api-preview" id="archAPIPreview"></div>'+
   '<p class="arch-lead">GET /api/health, GET/POST /api/:koleksiyon, GET/PATCH/DELETE /api/:koleksiyon/:id. JSON dosyasıyla veri kaydeder. Gerçek production için yetkilendirme, HTTPS, CSRF ve veri tabanı gerekir.</p></div></div>';
  const fields=['archCollection','archFieldOne','archFieldTwo','archTypeTwo'];
  const validate=()=>{const name=$('archCollection').value.trim(),f1=$('archFieldOne').value.trim(),f2=$('archFieldTwo').value.trim();
   for(const x of [name,f1,f2])if(!/^[a-z][a-z0-9_]{1,31}$/i.test(x))throw Error('Adlarda yalnızca harf, rakam, alt çizgi kullan; en az 2 karakter.');
   if(f1===f2||name==='health')throw Error('Alan adları farklı olmalı; health koleksiyon adı olamaz.');
   return{collection:name,fields:[{name:f1,type:'text',required:true},{name:f2,type:$('archTypeTwo').value,required:false}],
    routes:[{method:'GET',path:'/api/hello',response:{message:'Merhaba Dimensia!'}}]};
  };
  const refresh=()=>{try{const c=validate();$('archAPIPreview').textContent='GET /api/health\\nGET /api/'+c.collection+'\\nPOST /api/'+c.collection+'\\nGET /api/'+c.collection+'/:id\\nPATCH /api/'+c.collection+'/:id\\nDELETE /api/'+c.collection+'/:id';}catch(e){$('archAPIPreview').textContent=e.message}};
  fields.forEach(x=>$(x).addEventListener('input',refresh));refresh();
  $('archBackendDownload').onclick=async()=>{
   try{
    const config=validate();
    const response=await fetch(new URL('./backend-template.mjs',document.baseURI),{credentials:'omit',cache:'no-store'});
    if(!response.ok)throw Error('API şablonu sunucudan alınamadı: '+response.status);
    let source=await response.text();
    if(!source.includes('/*DIMENSIA_HTML*/')||!source.includes('/*DIMENSIA_CONFIG*/'))throw Error('Node.js şablonu güncel değil.');
    source=source.replace(/^const SITE_HTML=.*$/m,'const SITE_HTML='+JSON.stringify(state.siteHtml||'<!doctype html><html><body><h1>Demo</h1></body></html>')+';');
    source=source.replace(/^const CONFIG=.*$/m,'const CONFIG='+JSON.stringify(config)+';');
    const url=URL.createObjectURL(new Blob([source],{type:'application/javascript;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='dimensia-fullstack-server.mjs';a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);
    notice('✓ Kendi projen için Node.js API şablonu indirildi. Node.js destekleyen bir ortamda çalıştırılabilir.');
   }catch(e){notice(e.message,true)}
  };
 }
 function render(){
  for(const btn of root.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab===tab);
  if(tab==='summary')renderSummary();
  if(tab==='flow')renderFlow();
  if(tab==='components')renderComponents();
  if(tab==='design')renderDesign();
  if(tab==='source')renderSource();
  if(tab==='backend')renderBackend();
 }
 function setTab(next){tab=next;render()}
 root.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>setTab(btn.dataset.tab));
 window.DimensiaArchitect={analyzeURL:analyseURL,scanOwn:()=>$('archOwnScan').click(),show:()=>root.scrollIntoView({behavior:'smooth',block:'start'}),getReport:()=>report};
 try{const url=new URLSearchParams(location.search).get('inspect');if(url)$('archURL').value=url}catch{}
 progression(0);render();
})();