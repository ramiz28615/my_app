/* Dimensia Launchpad 4.0 — user-authorized static site publishing to GitHub Pages.
   No backend, no automatic GitHub credentials, no stored token. */
(() => {
  'use strict';
  const el=id=>document.getElementById(id);
  const studio=document.querySelector('#page-studio');
  const title=studio&&studio.querySelector('.studio-title');
  if(!title||!document.getElementById('siteFrame'))return;
  const STORE='dimensia-published-sites-v1';
  const GH='https://api.github.com';
  let accessToken='';
  let authenticated='';
  let connectedRepo='';
  let connectedBranch='main';
  let pagesVerified=false;
  let repoPagesRoot='';
  let busy=false;
  let liveCheck=null;
  let pollTimer=null;
  let previewTimer=null;
  let slugTouched=false;
  let previewSize='desktop';
  let records=loadRecords();

  const wrap=document.createElement('section');
  wrap.className='launchpad';
  wrap.id='dimensiaLaunchpad';
  wrap.setAttribute('aria-label','GitHub Pages otomatik site yayınlama stüdyosu');
  wrap.innerHTML=
    '<header class="launch-top"><div><div class="launch-kicker">DIMENSIA / LAUNCHPAD 4.0</div>'+
    '<h2 class="launch-title">Fikrini tasarla. <em>İnternete yayınla.</em></h2>'+
    '<p class="launch-desc">Kodunu üret, masaüstü ve telefonda önizle, kendi GitHub hesabın üzerinden ücretsiz GitHub Pages adresine yayınla. Sonra tek tıkla güncelle.</p></div>'+
    '<span class="launch-tag">GitHub Pages · Ücretsiz</span></header>'+
    '<div class="launch-main"><div class="launch-preview">'+
    '<div class="launch-sectionhead"><h3 class="launch-h">◈ Yayımlanmadan önce önizleme</h3>'+
    '<div class="launch-previewtools"><button type="button" class="launch-mini active" data-launch-size="desktop" aria-label="Masaüstü">▣</button>'+
    '<button type="button" class="launch-mini" data-launch-size="tablet" aria-label="Tablet">▤</button>'+
    '<button type="button" class="launch-mini" data-launch-size="mobile" aria-label="Telefon">▯</button>'+
    '<button type="button" class="launch-mini" id="launchRefresh" title="Önizlemeyi yenile">↻</button></div></div>'+
    '<div class="launch-browser"><i></i><i></i><i></i><small id="launchPreviewBar">preview://dimensia/site</small></div>'+
    '<div class="launch-device" id="launchDevice" data-size="desktop"><div class="launch-framewrap">'+
    '<iframe id="launchPreviewFrame" title="Yayınlanacak web sitesi önizlemesi" sandbox="allow-scripts allow-forms" referrerpolicy="no-referrer" loading="lazy"></iframe>'+
    '</div></div><div class="launch-underpreview"><span><strong id="launchSiteName">İlk Web Sitem</strong> · <span id="launchFileSize">0 KB</span></span>'+
    '<div class="launch-actions"><button class="launch-btn" id="launchViewCode" type="button">⌘ Kod</button>'+
    '<button class="launch-btn" id="launchDownload" type="button">↓ HTML indir</button><button class="launch-btn" id="launchImportDemo" type="button">✧ Örnek Siteyi Düzenle</button></div></div>'+
    '<div class="launch-stepper" id="launchSteps"><span class="active">1. Hazırla</span><i>→</i><span>2. Bağlan</span><i>→</i><span>3. Yayınla</span><i>→</i><span>4. Canlı</span></div>'+
    '<div class="launch-help">Yayınlamadan önce kodu kontrol et. GitHub Pages yalnızca statik dosyaları sunar; PHP, Node.js sunucusu, gizli API anahtarları veya veritabanı backend’i barındırmaz.</div>'+
    '</div><div class="launch-form">'+
    '<div class="launch-sectionhead"><h3 class="launch-h">✦ GitHub ile yayınla</h3>'+
    '<span id="launchAuthChip" class="launch-tag" style="background:#27253c;color:#b9b1d6;border-color:#544d7a">Bağlı değil</span></div>'+
    '<div class="launch-dual"><div class="launch-field"><label for="launchOwner">GitHub kullanıcısı</label>'+
    '<input id="launchOwner" maxlength="39" autocomplete="off" value="ramiz28615" spellcheck="false"></div>'+
    '<div class="launch-field"><label for="launchRepo">Pages deposu</label>'+
    '<input id="launchRepo" maxlength="90" autocomplete="off" value="my_app" spellcheck="false"></div></div>'+
    '<div class="launch-field"><label for="launchSlug">Sitenin yayın adı / adresi</label>'+
    '<input id="launchSlug" maxlength="48" placeholder="markam" autocomplete="off" spellcheck="false"></div>'+
    '<div class="launch-linkpreview"><span>↗</span><span id="launchLinkPreview"></span></div>'+
    '<div class="launch-field"><label for="launchToken">GitHub Fine-grained Personal Access Token (yalnızca bu depoya Contents: Read and write)</label>'+
    '<div class="launch-inputrow"><input id="launchToken" type="password" placeholder="github_pat_..." autocomplete="new-password" spellcheck="false">'+
    '<button id="launchTokenReveal" type="button" aria-label="GitHub anahtarını göster veya gizle">◉</button>'+
    '<button id="launchTokenForget" type="button" title="Anahtarı unut">×</button></div></div>'+
    '<p class="launch-help">Anahtar yalnızca bu sekmede tutulur, GitHub deposuna veya localStorage’a yazılmaz. Public siteden doğrudan GitHub API kullanırken anahtar tarayıcıda görülebilir; kişisel hesap için sınırlı süreli, tek depoya izinli token kullan.</p>'+
    '<div class="launch-actions"><button id="launchConnect" type="button" class="launch-btn launch-secondary">⌁ GitHub Bağlantısını Test Et</button>'+
    '<a href="https://github.com/settings/personal-access-tokens/new" class="launch-btn" style="text-decoration:none" target="_blank" rel="noopener noreferrer">+ GitHub Token Al</a></div>'+
    '<label class="launch-check"><input id="launchConfirm" type="checkbox">'+
    '<span>Bu web sitesinin yayınlama haklarına sahibim. Kodda özel şifre/API anahtarı bulunmadığını kontrol ettim. GitHub Pages bağlantısındaki dosyaların <strong>herkese açık</strong> olacağını kabul ediyorum.</span></label>'+
    '<div class="launch-actions"><button id="launchPublish" class="launch-btn launch-primary" type="button">✦ GitHub’a Yayınla</button>'+
    '<button id="launchCheck" class="launch-btn" type="button">◎ Yayın Durumunu Kontrol Et</button></div>'+
    '<div class="launch-feedback" id="launchFeedback" role="status" aria-live="polite" hidden></div>'+
    '<p class="launch-help" style="margin:12px 0 0">Çalışan örnek: <a href="https://ramiz28615.github.io/my_app/sites/aurora-demo/" target="_blank" rel="noopener noreferrer">Aurora Demo · ücretsiz Pages yayını ↗</a></p>'+ 
    '<p class="launch-help" style="margin:12px 0 0">Ücretsiz adres: <b>kullanici.github.io/depo/sites/markam/</b>. Gerçek <b>markam.seninalanadin.com</b> alt alan adı için alan adı sahipliği ve DNS ayarı gerekir.</p>'+
    '</div></div>'+
    '<div class="launch-bottom"><div class="launch-bottomhead"><h3 class="launch-h">◈ Yayınlanmış projelerim</h3>'+
    '<div class="launch-previewtools"><button type="button" id="launchSync" class="launch-mini" title="GitHub deposundaki yayımlanan siteleri bu listeye aktar">↻ GitHub’dan Tara</button><button type="button" id="launchClear" class="launch-mini">Yerel listeyi temizle</button>'+
    '<a class="launch-mini" href="https://github.com/ramiz28615/my_app/actions" id="launchActionsLink" target="_blank" rel="noopener noreferrer" style="text-decoration:none">GitHub Actions ↗</a></div></div>'+
    '<div class="launch-sites" id="launchSites"></div><p class="launch-footnote">Liste sadece bu tarayıcıda tutulur; GitHub’da gerçek kaynağınız durur. Siteniz herkese açık olduğu için üçüncü taraf kod veya gizli verileri yayınlamayın. <a href="https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages" rel="noopener noreferrer" target="_blank" style="color:#ab9bff">Özel alt alan adı rehberi ↗</a></p></div>';
  title.after(wrap);
  const quick=document.createElement('button');
  quick.className='btn btn-primary btn-small';
  quick.type='button';quick.id='launchShortcut';quick.textContent='↗ Ücretsiz Yayınla';
  quick.addEventListener('click',()=>wrap.scrollIntoView({behavior:'smooth',block:'start'}));
  title.querySelector('.studio-title-actions')?.prepend(quick);

  function slug(value) {
    const chars={'ğ':'g','ü':'u','ş':'s','ı':'i','ö':'o','ç':'c','İ':'i'};
    return String(value||'').trim().split('').map(c=>chars[c]||c).join('').toLocaleLowerCase('en-US').normalize('NFKD')
      .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,46).replace(/-+$/g,'');
  }
  function validSlug(v){return /^[a-z0-9](?:[a-z0-9-]{0,44}[a-z0-9])?$/.test(v)&&!/--/.test(v);}
  function validOwner(v){return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(v);}
  function validRepo(v){return /^[a-zA-Z0-9_.-]{1,90}$/.test(v)&&v!=='..'&&v!=='.';}
  function getTarget(){
    const owner=el('launchOwner').value.trim(),repo=el('launchRepo').value.trim(),site=el('launchSlug').value.trim();
    if(!validOwner(owner))throw Error('Geçerli bir GitHub kullanıcı/organizasyon adı gir.');
    if(!validRepo(repo))throw Error('Depo adını kontrol et (harf, sayı, tire, alt çizgi).');
    if(!validSlug(site))throw Error('Site adında yalnızca küçük harf, rakam ve tek tire kullan (2–46 karakter).');
    const path='sites/'+site+'/index.html';
    return{owner,repo,site,path};
  }
  function pageURL(target,base){
    const userSite=target.repo.toLowerCase()===target.owner.toLowerCase()+'.github.io';
    let home=base||'https://'+target.owner+'.github.io/'+(userSite?'':target.repo+'/');
    if(!home.endsWith('/'))home+='/';
    return new URL('sites/'+target.site+'/',home).href;
  }
  function readableURL(){
    try{return pageURL(getTarget(),repoPagesRoot)}catch{return ''}
  }
  function loadRecords(){
    try{
      const arr=JSON.parse(localStorage.getItem(STORE)||'[]');
      return Array.isArray(arr)?arr.filter(x=>x&&typeof x.url==='string'&&typeof x.owner==='string'&&typeof x.repo==='string'&&typeof x.site==='string').slice(0,32):[];
    }catch{return [];}
  }
  function writeRecords(){
    try{localStorage.setItem(STORE,JSON.stringify(records.slice(0,30)));}catch{}
  }
  function recordSite(data){
    records=records.filter(x=>!(x.owner===data.owner&&x.repo===data.repo&&x.site===data.site));
    records.unshift(data);records=records.slice(0,30);writeRecords();renderRecords();
  }
  function makeNode(tag,text,attrs){
    const node=document.createElement(tag);if(text!==undefined)node.textContent=text;
    for(const [k,v] of Object.entries(attrs||{}))node.setAttribute(k,String(v));
    return node;
  }
  function addLink(container,text,url){
    const a=makeNode('a',text,{href:url,target:'_blank',rel:'noopener noreferrer'});
    container.append(a);return a;
  }
  function renderRecords(){
    const root=el('launchSites');root.replaceChildren();
    if(!records.length){root.append(makeNode('div','Henüz yayın kaydı yok. İlk web siteni GitHub Pages ile paylaşabilirsin.',{class:'launch-empty'}));return;}
    for(const item of records){
      const card=makeNode('article',undefined,{class:'launch-site'});
      const head=makeNode('div',undefined,{class:'launch-site-head'});
      head.append(makeNode('h4',item.name||item.site));
      head.append(makeNode('span',new Date(item.updatedAt||Date.now()).toLocaleDateString('tr-TR')));
      card.append(head,makeNode('code',item.owner+'/'+item.repo+' · '+item.site));
      const links=makeNode('div',undefined,{class:'launch-site-links'});
      addLink(links,'↗ Canlı site',item.url);
      const codeURL='https://github.com/'+encodeURIComponent(item.owner)+'/'+encodeURIComponent(item.repo)+'/blob/'+encodeURIComponent(item.branch||'main')+'/sites/'+encodeURIComponent(item.site)+'/index.html';
      addLink(links,'⌘ Kaynak',codeURL);
      const update=makeNode('button','↻ Güncelle');
      update.type='button';
      update.addEventListener('click',()=>{
        el('launchOwner').value=item.owner;el('launchRepo').value=item.repo;el('launchSlug').value=item.site;
        slugTouched=true;connectedRepo='';repoPagesRoot='';
        refreshAddress();wrap.scrollIntoView({behavior:'smooth',block:'start'});
        info('Proje seçildi. Güncellemek için kendi HTML projenizi açıp GitHub’a Yayınla butonuna basın.','info');
      });
      links.append(update);
      const edit=makeNode('button','⌘ GitHub’dan Aç');edit.type='button';
      edit.addEventListener('click',()=>loadGitHubSite(item));
      links.append(edit);card.append(links);root.append(card);
    }
  }
  function info(message,type,links){
    const root=el('launchFeedback');root.hidden=false;root.dataset.type=type||'info';
    root.replaceChildren();
    root.append(makeNode('strong',type==='error'?'⚠ İşlem tamamlanamadı':type==='success'?'✓ Yayınlama bilgisi':'◈ Durum'));
    root.append(makeNode('div',message));
    if(Array.isArray(links)&&links.length){
      const line=makeNode('div');
      for(const item of links)addLink(line,item.label,item.url);
      root.append(line);
    }
  }
  function step(n){
    const nodes=el('launchSteps').querySelectorAll('span');
    nodes.forEach((node,i)=>node.classList.toggle('active',i<=n));
  }
  function setBusy(value,label){
    busy=value;
    for(const id of ['launchConnect','launchPublish','launchCheck'])el(id).disabled=value;
    el('launchPublish').textContent=value?(label||'⌛ GitHub işlemi sürüyor…'):'✦ GitHub’a Yayınla';
  }
  function forget(){
    accessToken='';authenticated='';connectedRepo='';connectedBranch='main';repoPagesRoot='';
    el('launchToken').value='';el('launchToken').type='password';
    el('launchAuthChip').textContent='Bağlı değil';el('launchAuthChip').style.color='#c7b7e8';
    step(0);refreshAddress();
  }
  el('launchTokenForget').addEventListener('click',()=>{forget();info('GitHub anahtarı bu açık sekmeden temizlendi.','info')});
  el('launchTokenReveal').addEventListener('click',()=>{
    el('launchToken').type=el('launchToken').type==='password'?'text':'password';
  });
  el('launchToken').addEventListener('input',e=>{
    accessToken=e.target.value.trim();
    authenticated='';connectedRepo='';repoPagesRoot='';
    el('launchAuthChip').textContent='Bağlı değil';el('launchAuthChip').style.color='#c7b7e8';
  });
  for(const id of ['launchOwner','launchRepo']){
    el(id).addEventListener('input',()=>{connectedRepo='';repoPagesRoot='';refreshAddress()});
  }
  el('launchSlug').addEventListener('input',()=>{slugTouched=true;refreshAddress()});
  function refreshAddress(){
    const url=readableURL();
    const root=el('launchLinkPreview');root.replaceChildren();
    if(url)root.append(makeNode('span',url));else root.append(makeNode('span','Geçerli GitHub kullanıcı, depo ve site adı gir.'));
    const address=el('launchPreviewBar');if(address)address.textContent=url||'preview://dimensia/site';
    el('launchActionsLink').href='https://github.com/'+encodeURIComponent(el('launchOwner').value.trim())+'/'+encodeURIComponent(el('launchRepo').value.trim())+'/actions';
  }
  function refreshPreview(){
    const html=typeof state!=='undefined'&&typeof state.siteHtml==='string'?state.siteHtml:'';
    if(!html)return;
    el('launchPreviewFrame').srcdoc=html;
    const name=state.siteName||'Yeni Web Sitem';
    el('launchSiteName').textContent=name;
    el('launchFileSize').textContent=(new Blob([html]).size/1024).toFixed(1)+' KB';
    if(!slugTouched){el('launchSlug').value=slug(name)||'yeni-sitem';refreshAddress();}
  }
  function schedulePreview(){
    clearTimeout(previewTimer);
    previewTimer=setTimeout(refreshPreview,300);
  }
  el('launchRefresh').addEventListener('click',refreshPreview);
  el('launchDevice').dataset.size='desktop';
  for(const control of wrap.querySelectorAll('[data-launch-size]')){
    control.addEventListener('click',()=>{
      previewSize=control.dataset.launchSize;
      el('launchDevice').dataset.size=previewSize;
      wrap.querySelectorAll('[data-launch-size]').forEach(x=>x.classList.toggle('active',x===control));
    });
  }
  el('launchViewCode').addEventListener('click',()=>{
    const button=el('tabCode');if(button)button.click();
    el('codeEditor')?.focus();document.querySelector('#codePanel')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  el('launchDownload').addEventListener('click',()=>{
    const raw=state.siteHtml||'';
    if(!raw)return info('İndirilecek HTML bulunamadı.','error');
    const fileName=(slug(state.siteName)||'site')+'.html';
    const link=document.createElement('a');
    const object=URL.createObjectURL(new Blob([raw],{type:'text/html;charset=utf-8'}));
    link.href=object;link.download=fileName;link.click();setTimeout(()=>URL.revokeObjectURL(object),4000);
  });
  el('codeEditor')?.addEventListener('input',schedulePreview);
  el('refreshPreview')?.addEventListener('click',schedulePreview);
  const name=el('currentSiteName');
  if(name&&typeof MutationObserver!=='undefined')new MutationObserver(schedulePreview).observe(name,{childList:true,characterData:true,subtree:true});
  // Code is not persisted with the token. Only harmless site metadata is retained.
  function validateSource(){
    const html=state.siteHtml||'';
    if(!/<html[\s>]/i.test(html)||!/<\/html>/i.test(html))throw Error('Önce eksiksiz bir HTML sitesi oluştur. <html> ve </html> bulunmalı.');
    const size=new TextEncoder().encode(html).length;
    if(size>900000)throw Error('GitHub Pages tek-dosya yayınlama sınırı: 900 KB. Gereksiz içerikleri kısalt.');
    if(size<80)throw Error('Yayınlanacak HTML dosyası boş görünüyor.');
    if(/(?:github_pat_[A-Za-z0-9_]{16,}|ghp_[A-Za-z0-9]{20,}|sk-or-v1-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16})/.test(html)){
      throw Error('Kodun içinde bir API anahtarı veya erişim tokeni görünüyor. Güvenlik için yayınlama engellendi.');
    }
    return html;
  }
  function toBase64(data){
    const buf=new TextEncoder().encode(data);
    let binary='';
    for(let i=0;i<buf.length;i+=16384){
      binary+=String.fromCharCode(...buf.subarray(i,i+16384));
    }
    return btoa(binary);
  }
  function githubError(code,data){
    const message=typeof data?.message==='string'?data.message:'Bilinmeyen GitHub API hatası';
    const clean=message.slice(0,230);
    if(code===401)return new Error('GitHub token geçersiz veya süresi dolmuş. Yeni token oluştur.');
    if(code===403)return new Error('GitHub izin/kota hatası. Token için bu depoda Contents: Read and write iznini kontrol et. '+clean);
    if(code===404)return new Error('GitHub kaynağı bulunamadı. Depo adını ve token erişimini kontrol et.');
    if(code===409)return new Error('GitHub’da aynı dosya başka işlemle değişti. Güncellemeden önce yeniden dene.');
    if(code===422)return new Error('GitHub dosyayı kabul etmedi. Dosya ismini, depoyu veya güncel sürümü kontrol et. '+clean);
    return new Error('GitHub HTTP '+code+': '+clean);
  }
  async function api(method,path,payload,allow404=false){
    if(!accessToken||accessToken.length<20)throw Error('GitHub tokeni eksik. Önce sınırlı erişimli token gir.');
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),24000);
    try{
      const response=await fetch(GH+path,{
        method,
        mode:'cors',
        credentials:'omit',
        cache:'no-store',
        signal:ctrl.signal,
        headers:{
          'Accept':'application/vnd.github+json',
          'X-GitHub-Api-Version':'2022-11-28',
          'Authorization':'Bearer '+accessToken,
          ...(payload===undefined?{}:{'Content-Type':'application/json'})
        },
        ...(payload===undefined?{}:{body:JSON.stringify(payload)})
      });
      if(allow404&&response.status===404)return null;
      let result={};
      try{result=await response.json()}catch{}
      if(!response.ok)throw githubError(response.status,result);
      return result;
    }catch(e){
      if(e.name==='AbortError')throw Error('GitHub API zaman aşımı. Ağ bağlantısını kontrol et.');
      if(e instanceof TypeError)throw Error('GitHub API ağına erişilemedi. İnternet/CORS ve tarayıcı uzantılarını kontrol et.');
      throw e;
    }finally{clearTimeout(timer);}
  }
  function paths(t){
    return '/repos/'+encodeURIComponent(t.owner)+'/'+encodeURIComponent(t.repo);
  }
  async function connect(t){
    const user=await api('GET','/user');
    if(!user||typeof user.login!=='string')throw Error('GitHub kullanıcı bilgisi doğrulanamadı.');
    const repo=await api('GET',paths(t));
    if(repo?.permissions?.push===false)throw Error('Bu GitHub hesabının hedef depoya yazma yetkisi bulunmuyor.');
    if(repo?.archived)throw Error('Arşivlenmiş depoya yayınlama yapılamaz.');
    if(repo?.private)throw Error('Ücretsiz herkese açık GitHub Pages için public bir repo kullan.');
    const branch=repo.default_branch||'main';
    repoPagesRoot='';pagesVerified=false;
    let pages=null;
    try{pages=await api('GET',paths(t)+'/pages',undefined,true);}catch(e){/* A token may lack Pages: read permission. */}
    if(pages?.html_url){
      pagesVerified=true;
      const root=pages.html_url;
      if(/^https:\/\//i.test(root))repoPagesRoot=root.endsWith('/')?root:root+'/';
    }
    // Contents-only fine-grained tokens often cannot read the Pages API.
    // Continue with a public repo and report any missing Pages setup after uploading;
    // never mistake missing Pages:read permission for proof that Pages is disabled.
    connectedRepo=t.owner.toLowerCase()+'/'+t.repo.toLowerCase();
    connectedBranch=branch;
    authenticated=user.login;
    el('launchAuthChip').textContent='● '+authenticated+' bağlı';
    el('launchAuthChip').style.color='#9dfbd9';
    step(1);refreshAddress();
    return {branch,user:user.login,pagesVerified};
  }
  el('launchConnect').addEventListener('click',async()=>{
    if(busy)return;
    setBusy(true,'⌛ GitHub bağlantısı kontrol ediliyor…');
    try{
      const t=getTarget();await connect(t);
      info('GitHub bağlantısı doğrulandı: '+authenticated+' · '+t.owner+'/'+t.repo+' · '+connectedBranch+'.'+(!pagesVerified?' Pages ayarı API izni nedeniyle doğrulanamadı; depo Settings → Pages bölümünü kontrol et.':''),'success');
    }catch(e){info(e.message,'error');}
    finally{setBusy(false);}
  });
  function rawFileLink(t,branch){
    return 'https://github.com/'+encodeURIComponent(t.owner)+'/'+encodeURIComponent(t.repo)+'/blob/'+encodeURIComponent(branch)+'/sites/'+encodeURIComponent(t.site)+'/index.html';
  }
  function publishRecord(t,url,sha,branch,commit){
    recordSite({owner:t.owner,repo:t.repo,site:t.site,url,sha,branch,commit,name:state.siteName||t.site,updatedAt:new Date().toISOString()});
  }
  async function publish(){
    if(busy)return;
    try{
      const t=getTarget();
      const html=validateSource();
      if(!el('launchConfirm').checked)throw Error('Yayınlama izni ve kaynak kod güvenliği onay kutusunu işaretle.');
      if(!accessToken||accessToken.length<20)throw Error('GitHub tokeni gir. Token yalnızca açık sekmede kullanılır.');
      setBusy(true,'⌛ GitHub’a kod yükleniyor…');
      if(connectedRepo!==t.owner.toLowerCase()+'/'+t.repo.toLowerCase()||!authenticated)await connect(t);
      const endpoint=paths(t)+'/contents/'+t.path.split('/').map(encodeURIComponent).join('/');
      let old=null;
      const existing=await api('GET',endpoint+'?ref='+encodeURIComponent(connectedBranch),undefined,true);
      if(existing){
        if(existing.type!=='file'||typeof existing.sha!=='string')throw Error('Hedef yol var fakat normal index.html dosyası değil.');
        old=existing.sha;
      }
      const payload={
        message:(old?'Update ':'Publish ')+t.site+' — Dimensia Studio Launchpad',
        content:toBase64(html),
        branch:connectedBranch,
        ...(old?{sha:old}:{})
      };
      const response=await api('PUT',endpoint,payload);
      const commit=response?.commit?.sha;
      if(typeof commit!=='string')throw Error('GitHub işlem yanıtında commit bulunamadı. Deponun durumunu kontrol et.');
      const live=pageURL(t,repoPagesRoot);
      publishRecord(t,live,response?.content?.sha||'',connectedBranch,commit);
      liveCheck={...t,branch:connectedBranch,commit,url:live};
      step(2);
      info('HTML GitHub’a kaydedildi. '+(!pagesVerified?'Pages etkinliği doğrulanamadı; GitHub Settings → Pages alanından yayını kontrol et. ':'')+'Bağlantı hemen açılmayabilir. Yayın Durumunu Kontrol Et düğmesini kullan.','success',[
        {label:'↗ Site adresi',url:live},
        {label:'⌘ GitHub kaynak',url:rawFileLink(t,connectedBranch)},
        {label:'◈ Actions',url:'https://github.com/'+t.owner+'/'+t.repo+'/actions'}
      ]);
      refreshAddress();
      startPoll();
    }catch(e){info(e.message||'Yayınlama başarısız.','error');}
    finally{setBusy(false);}
  }
  el('launchPublish').addEventListener('click',publish);
  async function checkStatus(){
    if(!liveCheck){
      try{
        const t=getTarget();
        const existing=records.find(x=>x.owner===t.owner&&x.repo===t.repo&&x.site===t.site);
        if(existing)liveCheck={...t,branch:existing.branch||'main',commit:existing.commit,url:existing.url};
        else throw Error('Önce bir site yayınla veya yayınlanmış projelerden birini seç.');
      }catch(e){info(e.message,'error');return false;}
    }
    const t=liveCheck;
    try{
      const runs=await api('GET',paths(t)+'/actions/runs?head_sha='+encodeURIComponent(t.commit||'')+'&per_page=20');
      const matches=Array.isArray(runs?.workflow_runs)?runs.workflow_runs:[];
      const deploy=matches.find(x=>x.path?.endsWith('/deploy.yml')||/Deploy.*Pages/i.test(x.name||''));
      if(deploy){
        if(deploy.status==='completed'&&deploy.conclusion==='success'){
          // GitHub Actions confirms deployment. When the URL shares the app's origin,
          // also verify that the concrete published HTML path responds successfully.
          let liveHTTP=null;
          try{
            const url=new URL(t.url);
            if(url.origin===location.origin){
              const response=await fetch(url.href,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(6500)});
              liveHTTP=response.ok&&/html/i.test(response.headers.get('content-type')||'');
            }
          }catch{liveHTTP=false;}
          if(liveHTTP===false){
            step(2);
            info('GitHub Actions başarılı; ancak yayın adresi henüz HTTP 200 HTML yanıtı vermiyor. Kısa süre sonra otomatik tekrar kontrol edilecek.','info',[
              {label:'↗ Yayın adresi',url:t.url},
              {label:'✓ Actions',url:deploy.html_url||'https://github.com/'+t.owner+'/'+t.repo+'/actions'}
            ]);
            return false;
          }
          step(3);
          info(liveHTTP===true?'GitHub Pages canlı: yayın adresi HTTP 200 HTML döndürüyor.':'GitHub Pages dağıtımı başarılı. Farklı origin nedeniyle yayın adresini tarayıcıdan ayrıca doğrulamalısın.','success',[
            {label:'↗ Canlı siteyi aç',url:t.url},
            {label:'✓ Başarılı GitHub Actions',url:deploy.html_url||'https://github.com/'+t.owner+'/'+t.repo+'/actions'},
            {label:'⌘ Kaynak kod',url:rawFileLink(t,t.branch||'main')}
          ]);
          return true;
        }
        if(deploy.status==='completed'&&deploy.conclusion!=='success'){
          info('GitHub Pages dağıtımı tamamlanamadı: '+String(deploy.conclusion||'hata')+'. Actions logunu kontrol et.','error',[
            {label:'GitHub Actions',url:deploy.html_url||'https://github.com/'+t.owner+'/'+t.repo+'/actions'}
          ]);
          return true;
        }
        info('GitHub Pages iş akışı devam ediyor: '+(deploy.status||'başlıyor')+'.','info',[
          {label:'İş akışını aç',url:deploy.html_url||'https://github.com/'+t.owner+'/'+t.repo+'/actions'}
        ]);
      }else info('Dosya GitHub’a kaydedildi; Pages iş akışı henüz görünmüyor. Depoda Pages yayınlamasının açık olduğunu kontrol et.','info',[
        {label:'GitHub Actions',url:'https://github.com/'+t.owner+'/'+t.repo+'/actions'}
      ]);
      return false;
    }catch(e){info('Yayın durumu kontrol edilemedi: '+e.message,'error');return false;}
  }
  function startPoll(){
    clearTimeout(pollTimer);
    let count=0;
    const next=async()=>{
      if(!liveCheck||count++>=12)return;
      const done=await checkStatus();
      if(!done)pollTimer=setTimeout(next,8000);
    };
    pollTimer=setTimeout(next,5000);
  }
  el('launchCheck').addEventListener('click',()=>{if(!busy)checkStatus();});
  // Recover published sites across devices by listing the same repository's /sites directory.
  async function syncGitHubSites(){
    if(busy)return;
    setBusy(true,'⌛ GitHub siteleri taranıyor…');
    try{
      const target=getTarget();
      if(connectedRepo!==target.owner.toLowerCase()+'/'+target.repo.toLowerCase()||!authenticated)await connect(target);
      const entries=await api('GET',paths(target)+'/contents/sites?ref='+encodeURIComponent(connectedBranch),undefined,true);
      if(entries===null){
        info('Depoda sites/ klasörü henüz yok. İlk siteyi yayınlayınca oluşturulur.','info');
        return;
      }
      if(!Array.isArray(entries))throw Error('GitHub sites/ dizini beklenen biçimde değil.');
      const dirs=entries.filter(x=>x&&x.type==='dir'&&typeof x.name==='string'&&validSlug(x.name)).slice(0,60);
      let added=0;
      for(const dir of dirs){
        const same=records.find(x=>x.owner.toLowerCase()===target.owner.toLowerCase()&&x.repo.toLowerCase()===target.repo.toLowerCase()&&x.site===dir.name);
        if(same)continue;
        const t={owner:target.owner,repo:target.repo,site:dir.name};
        records.push({
          owner:t.owner,repo:t.repo,site:t.site,url:pageURL(t,repoPagesRoot),
          name:dir.name,branch:connectedBranch,commit:'',updatedAt:new Date().toISOString()
        });
        added++;
      }
      records=records.slice(0,30);writeRecords();renderRecords();
      info('GitHub dizin taraması tamamlandı: '+dirs.length+' proje klasörü bulundu, '+added+' yeni kayıt eklendi. Yalnızca sites/ klasöründeki projeler listelendi.','success');
    }catch(e){info('GitHub siteleri listelenemedi: '+(e.message||e),'error');}
    finally{setBusy(false);}
  }
  // Restore a self-owned published single-file site into the local HTML editor.
  async function loadGitHubSite(item){
    if(busy)return;
    setBusy(true,'⌛ GitHub kaynağı açılıyor…');
    try{
      if(!accessToken)throw Error('Önce GitHub erişim tokenini gir.');
      const target={owner:item.owner,repo:item.repo,site:item.site};
      if(connectedRepo!==target.owner.toLowerCase()+'/'+target.repo.toLowerCase()||!authenticated)await connect(target);
      const path='/contents/sites/'+encodeURIComponent(target.site)+'/index.html?ref='+encodeURIComponent(item.branch||connectedBranch);
      const result=await api('GET',paths(target)+path);
      if(result?.type!=='file'||result.encoding!=='base64'||typeof result.content!=='string'){
        throw Error('Yayın klasöründe okunabilir bir index.html dosyası bulunamadı.');
      }
      const binary=atob(result.content.replace(/\s/g,''));
      if(binary.length>1000000)throw Error('Kaynak 1 MB üzerindeyse editörde açılmaz.');
      const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
      const html=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
      if(!/<html[\s>]/i.test(html)||!/<\/html>/i.test(html))throw Error('Alınan index.html tamamlanmış HTML sayfası değil.');
      if(!confirm('“'+item.site+'” GitHub kaynağı mevcut açık projenin yerine editöre alınsın mı? Kaydedilmemiş değişikliklerini kaybedebilirsin.'))return;
      showHTML(html,item.name||item.site);
      state.projectId=null;
      el('launchOwner').value=target.owner;el('launchRepo').value=target.repo;el('launchSlug').value=target.site;
      slugTouched=true;refreshAddress();refreshPreview();
      el('tabPreview')?.click();
      info('GitHub kaynağı editöre yüklendi: '+target.site+'. Düzenleyip aynı adla yeniden yayınlayabilirsin.','success');
      wrap.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(e){info('Kaynak açılamadı: '+(e.message||e),'error');}
    finally{setBusy(false);}
  }
  // A public first-party example may be inspected without GitHub credentials.
  async function importDemo(){
    if(busy)return;
    try{
      const response=await fetch(new URL('./sites/aurora-demo/index.html',location.href),{credentials:'omit',cache:'no-cache'});
      if(!response.ok)throw Error('Örnek kaynak HTTP '+response.status);
      const html=await response.text();
      if(html.length>950000||!/<\/html>/i.test(html))throw Error('Örnek HTML eksik veya fazla büyük.');
      if(!confirm('Aurora örnek sitesini HTML editörüne yüklemek ister misin? Kaydedilmemiş açık projenin yerini alır.'))return;
      showHTML(html,'Aurora — Özelleştirilebilir Demo');
      state.projectId=null;slugTouched=false;
      el('launchSlug').value='aurora-kopyam';refreshAddress();refreshPreview();
      info('Aurora örneği düzenlenebilir proje olarak açıldı. İstediğin gibi değiştirip kendi siten olarak yayınlayabilirsin.','success');
    }catch(e){info('Örnek yüklenemedi: '+(e.message||e),'error');}
  }
  el('launchSync').addEventListener('click',syncGitHubSites);
  el('launchImportDemo').addEventListener('click',importDemo);
  el('launchClear').addEventListener('click',()=>{
    if(!records.length)return;
    if(!confirm('Yalnızca bu tarayıcıdaki yayın kayıtları temizlensin mi? GitHub siteleri silinmez.'))return;
    records=[];writeRecords();renderRecords();info('Yerel liste temizlendi. GitHub üzerindeki sitelerin silinmediğini unutma.','info');
  });
  window.addEventListener('pagehide',()=>{clearTimeout(previewTimer);clearTimeout(pollTimer);});
  async function startCloudAnalysis(url,id){
    const t={owner:el('launchOwner').value.trim(),repo:el('launchRepo').value.trim()};
    if(!validOwner(t.owner)||!validRepo(t.repo))throw Error('Geçerli GitHub kullanıcı ve depo bilgisi gir.');
    if(!/^r[a-zA-Z0-9_-]{10,70}$/.test(id))throw Error('Geçersiz analiz istek kimliği.');
    if(!accessToken||accessToken.length<20)throw Error('GitHub Launchpad bölümüne token gir. Bulut analizi için Actions: Read and write, raporu okumak için Contents: Read izni gerekir.');
    if(connectedRepo!==t.owner.toLowerCase()+'/'+t.repo.toLowerCase()||!authenticated)await connect(t);
    await api('POST',paths(t)+'/actions/workflows/public-url-audit.yml/dispatches',{
      ref:connectedBranch,inputs:{url,request_id:id}
    });
    return{owner:t.owner,repo:t.repo,branch:connectedBranch,id};
  }
  async function fetchCloudAnalysis(task){
    if(!/^r[a-zA-Z0-9_-]{10,70}$/.test(task.id))throw Error('Geçersiz rapor kimliği.');
    const t={owner:task.owner,repo:task.repo};
    const path='/contents/reports/'+encodeURIComponent(task.id)+'.json?ref='+encodeURIComponent(task.branch||'main');
    const result=await api('GET',paths(t)+path,undefined,true);
    if(!result)return null;
    if(typeof result.content!=='string'||result.encoding!=='base64')throw Error('GitHub rapor formatı beklenenden farklı.');
    const raw=atob(result.content.replace(/\s/g,''));
    if(raw.length>500000)throw Error('Rapor boyutu fazla büyük.');
    const parsed=JSON.parse(new TextDecoder().decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));
    if(parsed.requestId!==task.id)throw Error('GitHub raporu farklı bir analiz isteğine ait.');
    return parsed;
  }
  async function saveCodeLabFile(language,filename,content){
    const allow={html:'index.html',css:'style.css',javascript:'main.js',python:'main.py',rust:'main.rs',bash:'main.sh',perl:'main.pl',reactnative:'App.js'};
    if(!Object.prototype.hasOwnProperty.call(allow,language)||allow[language]!==filename)throw Error('Code Lab sadece güvenli dosya yollarına kaydedebilir.');
    if(typeof content!=='string'||new TextEncoder().encode(content).length>100000)throw Error('Kod en fazla 100 KB olabilir.');
    if(/(?:github_pat_[a-zA-Z0-9_]{15,}|ghp_[a-zA-Z0-9]{20,}|sk-or-v1-[a-zA-Z0-9_-]{16,})/.test(content))throw Error('Kodda gizli API tokeni bulunuyor. GitHub’a yüklenmesi engellendi.');
    if(!accessToken||accessToken.length<20)throw Error('GitHub Launchpad’e önce kişisel tokenini gir. Contents: Read and write izni gerekir.');
    const t={owner:el('launchOwner').value.trim(),repo:el('launchRepo').value.trim()};
    if(!validOwner(t.owner)||!validRepo(t.repo))throw Error('GitHub kullanıcı/depo bilgisi geçersiz.');
    if(connectedRepo!==t.owner.toLowerCase()+'/'+t.repo.toLowerCase()||!authenticated)await connect(t);
    const filePath='code-lab/'+language+'/'+filename;
    const endpoint=paths(t)+'/contents/'+filePath.split('/').map(encodeURIComponent).join('/');
    const existing=await api('GET',endpoint+'?ref='+encodeURIComponent(connectedBranch),undefined,true);
    const uploaded=await api('PUT',endpoint,{
      message:'Code Lab: save '+language+' '+filename,
      branch:connectedBranch,
      content:toBase64(content),
      ...(existing?.sha?{sha:existing.sha}:{})
    });
    return{path:filePath,sha:uploaded?.commit?.sha||'',url:'https://github.com/'+t.owner+'/'+t.repo+'/blob/'+connectedBranch+'/'+filePath};
  }
  async function savePolyglotFiles(projectFiles){
    const allow={html:'index.html',css:'style.css',javascript:'main.js',python:'main.py',rust:'main.rs',bash:'main.sh',perl:'main.pl',reactnative:'App.js'};
    if(!projectFiles||typeof projectFiles!=='object')throw Error('Kaydedilecek proje dosyaları eksik.');
    const saved=[];
    for(const language of Object.keys(allow)){
      if(!Object.prototype.hasOwnProperty.call(projectFiles,language))continue;
      const value=projectFiles[language];
      if(typeof value!=='string')throw Error('Geçersiz dosya: '+language);
      saved.push(await saveCodeLabFile(language,allow[language],value));
    }
    if(!saved.length)throw Error('Kaydedilecek kaynak dosyası yok.');
    return saved;
  }
  async function startPolyglotRun(runId){
    if(!/^r[a-z0-9]{9,35}$/.test(runId))throw Error('Geçersiz çalışma kimliği.');
    const t={owner:el('launchOwner').value.trim(),repo:el('launchRepo').value.trim()};
    if(!validOwner(t.owner)||!validRepo(t.repo))throw Error('GitHub kullanıcı/depo bilgisi geçersiz.');
    if(!accessToken||accessToken.length<20)throw Error('GitHub Launchpad: Contents (read/write) ve Actions (read/write) izinli token gir. Token yalnızca bellek içinde kalır.');
    if(connectedRepo!==t.owner.toLowerCase()+'/'+t.repo.toLowerCase()||!authenticated)await connect(t);
    if(connectedBranch!=='main')throw Error('Çok dilli workflow şu an yalnızca main dalında kullanılabilir.');
    await api('POST',paths(t)+'/actions/workflows/polyglot-execute.yml/dispatches',{
      ref:connectedBranch,inputs:{run_id:runId}
    });
    return{owner:t.owner,repo:t.repo,branch:connectedBranch,id:runId,
      actionsUrl:'https://github.com/'+t.owner+'/'+t.repo+'/actions/workflows/polyglot-execute.yml'};
  }
  async function fetchPolyglotReport(task){
    if(!task||!/^r[a-z0-9]{9,35}$/.test(task.id))throw Error('Geçersiz rapor kimliği.');
    const t={owner:task.owner,repo:task.repo};
    if(!validOwner(t.owner)||!validRepo(t.repo))throw Error('Geçersiz GitHub deposu.');
    const url=paths(t)+'/contents/code-lab/reports/'+encodeURIComponent(task.id)+'.json?ref='+encodeURIComponent(task.branch||'main');
    const result=await api('GET',url,undefined,true);
    if(!result)return null;
    if(result.encoding!=='base64'||typeof result.content!=='string')throw Error('GitHub raporu beklenen formatta değil.');
    const raw=atob(result.content.replace(/\s/g,''));
    if(raw.length>240000)throw Error('Çalıştırma raporu sınırı aşıldı.');
    const report=JSON.parse(new TextDecoder().decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));
    if(report.schema!=='dimensia-polyglot-v1'||report.requestId!==task.id)throw Error('Rapor farklı bir çalışmaya ait.');
    return report;
  }
  window.DimensiaLaunchpad={slug,validSlug,validOwner,validRepo,pageURL,checkStatus,refreshPreview,
    startCloudAnalysis,fetchCloudAnalysis,saveCodeLabFile,savePolyglotFiles,startPolyglotRun,fetchPolyglotReport};

  el('launchSlug').value=slug(state.siteName||'yeni-site')||'yeni-site';
  refreshAddress();renderRecords();refreshPreview();step(0);
})();