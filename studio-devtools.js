/* Dimensia preview-only developer console. */
(() => {
  const frame = document.getElementById('siteFrame');
  const panel = document.querySelector('.preview-panel');
  if (!frame || !panel) return;
  const shell = document.createElement('section');
  shell.className = 'preview-devtools';
  shell.innerHTML = '<div class="devtools-toolbar"><div class="devtools-tabs" role="tablist" aria-label="Geliştirici paneli"><button type="button" data-debug="console" class="active">Console</button><button type="button" data-debug="network">Network</button><button type="button" data-debug="actions">Actions</button><button type="button" data-debug="source">Source</button></div><div class="devtools-actions"><button type="button" data-clear>Temizle</button><button type="button" data-fold>Daralt</button></div></div><div class="devtools-body" role="log" aria-live="polite"></div><div class="devtools-disclaimer">Yalnızca Dimensia önizlemesindeki Console, Network ve kullanıcı tıklamaları gösterilir; başka sitelerin gizli trafik ve kaynaklarına erişim yoktur.</div>';
  panel.append(shell);
  const log = { console: [], network: [], actions: [] };
  let active = 'console';
  const area = shell.querySelector('.devtools-body');
  function display() {
    area.replaceChildren();
    if (active === 'source') {
      const b = document.createElement('button'); b.textContent = 'Kaynak kodu düzenle'; b.onclick = () => document.getElementById('tabCode').click(); area.append(b); return;
    }
    if (!log[active].length) { const p=document.createElement('div');p.className='devtools-empty';p.textContent='Henüz kayıt yok. Önizlemede işlem yap veya yenile.';area.append(p); return; }
    for (const item of log[active].slice(-80)) {
      const row=document.createElement('div');row.className='devtools-row '+item.level;
      const value=document.createElement('span');value.textContent=item.message;
      const when=document.createElement('small');when.textContent=item.time;
      row.append(value,when);area.append(row);
    }
    area.scrollTop=area.scrollHeight;
  }
  shell.querySelectorAll('[data-debug]').forEach(b=>b.addEventListener('click',()=>{
    active=b.dataset.debug;shell.querySelectorAll('[data-debug]').forEach(x=>x.classList.toggle('active',x===b));display();
  }));
  shell.querySelector('[data-clear]').onclick=()=>{for(const key of Object.keys(log))log[key]=[];display()};
  shell.querySelector('[data-fold]').onclick=()=>{const folded=shell.dataset.collapsed!=='true';shell.dataset.collapsed=String(folded);shell.querySelector('[data-fold]').textContent=folded?'Genişlet':'Daralt'};
  window.addEventListener('message',e=>{
    if(e.source!==frame.contentWindow||!e.data||e.data.channel!=='DIMENSIA_PREVIEW_V1')return;
    const d=e.data;if(!Object.hasOwn(log,d.type)||typeof d.message!=='string')return;
    const level=String(d.level||'').replace(/[^a-z]/g,'').slice(0,12);
    log[d.type].push({level,message:d.message.slice(0,1100),time:new Date().toLocaleTimeString('tr-TR')});
    if(log[d.type].length>150)log[d.type].shift();if(active===d.type)display();
  });
  function agent() {
    try {
      const emit=(type,level,message)=>{try{parent.postMessage({channel:'DIMENSIA_PREVIEW_V1',type,level,message:String(message).slice(0,1100)},'*')}catch{}};
      const stringify=x=>{if(typeof x==='string')return x;try{return JSON.stringify(x)}catch{return String(x)}};
      for(const level of ['log','info','warn','error']){const old=console[level].bind(console);console[level]=(...args)=>{emit('console',level,args.map(stringify).join(' '));old(...args)}}
      addEventListener('error',e=>emit('console','error',e.message));
      addEventListener('unhandledrejection',e=>emit('console','error',stringify(e.reason)));
      if(typeof fetch==='function'){
        const original=fetch.bind(window);
        window.fetch=async (...args)=>{
          const start=performance.now(),method=args[1]?.method||args[0]?.method||'GET',url=typeof args[0]==='string'?args[0]:args[0]?.url||'?';
          try{const res=await original(...args);emit('network',res.status>=400?'error':'network',method+' '+url+' → '+res.status+' ('+Math.round(performance.now()-start)+'ms)');return res}
          catch(err){emit('network','error',method+' '+url+' → '+stringify(err));throw err}
        };
      }
      const origOpen=XMLHttpRequest.prototype.open,origSend=XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open=function(method,url,...args){this.__dimMethod=method;this.__dimUrl=url;return origOpen.call(this,method,url,...args)};
      XMLHttpRequest.prototype.send=function(...args){const start=performance.now();this.addEventListener('loadend',()=>emit('network',this.status>=400?'error':'network',(this.__dimMethod||'GET')+' '+(this.__dimUrl||'?')+' → '+this.status+' ('+Math.round(performance.now()-start)+'ms)'));return origSend.apply(this,args)};
      document.addEventListener('click',e=>{const element=e.target.closest?.('button,a,[role="button"],input[type="submit"]');if(!element)return;const caption=element.getAttribute('aria-label')||element.innerText||element.value||element.tagName;emit('actions','action',element.tagName+' '+String(caption).trim().slice(0,90)+(element.getAttribute('href')?' → '+element.getAttribute('href').slice(0,120):''))},true);
      if('PerformanceObserver' in window){try{new PerformanceObserver(list=>list.getEntries().slice(0,30).forEach(x=>emit('network','network','resource '+x.name+' ('+Math.round(x.duration)+'ms)'))).observe({type:'resource',buffered:true})}catch{}}
      addEventListener('DOMContentLoaded',()=>emit('console','info','Önizleme yüklendi'));
    }catch{}
  }
  const agentText='('+agent.toString()+')();';
  function instrument(html){
    if(!html||typeof html!=='string')return html;
    const script='<script>'+agentText+'</scr'+'ipt>';
    if(/<head[^>]*>/i.test(html))return html.replace(/<head[^>]*>/i,x=>x+script);
    if(/<html[^>]*>/i.test(html))return html.replace(/<html[^>]*>/i,x=>x+'<head>'+script+'</head>');
    return script+html;
  }
  window.DimensiaDevTools={instrument};
  const existing=frame.getAttribute('srcdoc');if(existing)frame.srcdoc=instrument(existing);
  display();
})();