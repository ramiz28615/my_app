/* Dimensia Interaction Flow Recorder: preview-only, no credential capture. */
(() => {
 'use strict';
 const frame=document.getElementById('siteFrame');
 const studio=document.getElementById('reWorkspace');
 if(!studio||!frame||!window.DimensiaDevTools)return;
 const pane=document.createElement('section');
 pane.className='re-flow';
 pane.innerHTML='<div class="re-flow-top"><div><b>⌁ Interaction Flow Recorder</b><small>Ürettiğin sitede buton ve menü akışını kaydet · yeniden oynat · dışa aktar</small></div><div class="re-actions"><span id="flowLive" class="re-pill">● Hazır</span><button class="re-btn re-btn-primary" id="flowRecord">◉ Kaydı Başlat</button><button class="re-btn" id="flowReplay">↻ Akışı Oynat</button><button class="re-btn re-btn-ghost" id="flowExport">↓ JSON</button><button class="re-btn re-btn-ghost" id="flowClear">Temizle</button></div></div><div class="re-flow-count" id="flowCount">0 işlem kaydedildi · Şifre ve form değerleri kaydedilmez.</div><div class="re-flow-timeline" id="flowTimeline" aria-live="polite"></div><div class="re-flow-foot" id="flowFoot">Yalnızca kendi önizlemendeki tıklamalar, sayfa içi gezinti ve alan türleri kaydedilir. Harici sitelerin Network/Source trafiği okunmaz.</div>';
 studio.insertAdjacentElement('afterend',pane);
 const $=id=>document.getElementById(id);
 let enabled=false,items=[],replaying=false,results=new Map();
 const now=()=>new Date().toLocaleTimeString('tr-TR');
 const short=(v,n=200)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);
 function emitControl(event,details){
   frame.contentWindow?.postMessage({channel:'DIMENSIA_FLOW_CONTROL',event,...(details||{})},'*');
 }
 function setRecording(active){
   enabled=active;
   $('flowRecord').textContent=active?'■ Kaydı Durdur':'◉ Kaydı Başlat';
   $('flowRecord').classList.toggle('re-btn-on',active);
   $('flowLive').classList.toggle('ok',active);
   $('flowLive').textContent=active?'● Kayıt açık':'● Hazır';
   emitControl('record',{enabled:active});
   render();
 }
 function render(){
   const timeline=$('flowTimeline');timeline.replaceChildren();
   $('flowCount').textContent=items.length+' adım · '+new Set(items.map(x=>x.selector)).size+' farklı öğe · Şifre veya form değerleri kaydedilmez.';
   $('flowReplay').disabled=replaying||!items.length;
   $('flowExport').disabled=!items.length;
   if(!items.length){
     const empty=document.createElement('div');empty.className='re-flow-empty';empty.textContent='Kayıt başlatıp önizlemedeki butonlara tıkla. Kullanıcı akışları burada canlı olarak görünecek.';timeline.append(empty);return;
   }
   items.slice(-30).forEach((x,i)=>{
     const node=document.createElement('div');node.className='re-flow-step';
     const index=document.createElement('div');index.className='re-flow-index';index.textContent=String(items.length-Math.min(items.length,30)+i+1).padStart(2,'0');
     const main=document.createElement('div');main.className='re-flow-step-content';
     const name=document.createElement('b');name.textContent=(x.type==='click'?'⌖ Tıklama':x.type==='change'?'✎ Alan Değişti':x.type==='hash'?'↗ Sayfa Geçişi':'▧ Form')+' · '+x.label;
     const detail=document.createElement('small');detail.textContent=x.selector||x.detail||'—';
     const time=document.createElement('span');time.className='re-flow-time';time.textContent=x.time;
     main.append(name,detail);node.append(index,main,time);timeline.append(node);
   });
   timeline.scrollLeft=timeline.scrollWidth;
 }
 function agent(){
   try{
     let recording=false,running=false;
     const emit=(event,data)=>{try{parent.postMessage({channel:'DIMENSIA_FLOW_BRIDGE',event,data},'*')}catch{}};
     const getPath=el=>{
       const parts=[];let node=el;
       while(node&&node.nodeType===1){
         const tag=node.tagName.toLowerCase();let index=1,p=node;
         while((p=p.previousElementSibling))if(p.tagName===node.tagName)index++;
         parts.unshift(tag+':nth-of-type('+index+')');if(tag==='body')break;node=node.parentElement;
       }
       return parts.join(' > ').slice(0,500);
     };
     const labelOf=x=>(x.getAttribute?.('aria-label')||x.innerText||x.getAttribute?.('title')||x.getAttribute?.('name')||x.tagName||'').replace(/\s+/g,' ').trim().slice(0,90);
     document.addEventListener('click',e=>{
       if(!recording||running)return;
       const el=e.target.closest?.('a,button,[role=button],input[type=submit],input[type=button]');
       if(!el)return;
       emit('event',{type:'click',selector:getPath(el),label:labelOf(el),href:String(el.getAttribute('href')||'').slice(0,220)});
     },true);
     document.addEventListener('change',e=>{
       if(!recording||running)return;
       const el=e.target;
       if(!el.matches?.('input,select,textarea'))return;
       // No values, contents, email addresses or password contents are captured.
       emit('event',{type:'change',selector:getPath(el),label:el.getAttribute('name')||el.getAttribute('aria-label')||el.tagName,detail:'type='+String(el.getAttribute('type')||el.tagName).slice(0,50)});
     },true);
     document.addEventListener('submit',e=>{
       if(!recording||running)return;
       emit('event',{type:'submit',selector:getPath(e.target),label:'Form gönderme',detail:'Gizli alanlar kaydedilmez'});
     },true);
     window.addEventListener('hashchange',()=>{
       if(recording&&!running)emit('event',{type:'hash',selector:'location.hash',label:'Sayfa içi yönlendirme',detail:location.hash.slice(0,120)});
     });
     window.addEventListener('message',async e=>{
       if(e.source!==parent||e.data?.channel!=='DIMENSIA_FLOW_CONTROL')return;
       if(e.data.event==='record'){recording=!!e.data.enabled;return;}
       if(e.data.event==='replay'){
         if(running)return;running=true;
         const steps=Array.isArray(e.data.steps)?e.data.steps.slice(0,100):[];
         for(let i=0;i<steps.length;i++){
           const step=steps[i];
           if(step.type!=='click'){emit('result',{index:i,success:false,reason:'Yalnızca tıklama tekrar oynatılır'});continue}
           try{
             const element=document.querySelector(step.selector);
             if(!element)throw Error('Öğe bulunamadı');
             // Do not automatically submit forms or navigate to external URLs.
             if(element.closest('form')||element.matches('input[type=submit],button[type=submit]'))throw Error('Form gönderme güvenlik nedeniyle atlandı');
             const href=element.getAttribute('href');
             if(href&&href!=='#'&&!href.startsWith('#'))throw Error('Harici gezinme yeniden oynatılmadı');
             element.click();emit('result',{index:i,success:true});
           }catch(error){emit('result',{index:i,success:false,reason:String(error.message).slice(0,140)})}
           await new Promise(resolve=>setTimeout(resolve,220));
         }
         running=false;emit('replayDone',{total:steps.length});
       }
     });
     emit('ready',{title:document.title});
   }catch(e){}
 }
 const old=window.DimensiaDevTools.instrument;
 if(!old.__flowWrapped){
   const agentJS='('+agent.toString()+')();';
   const block='<script>'+agentJS+'</scr'+'ipt>';
   const wrapped=(html)=>{
     const output=old(html);if(typeof output!=='string'||output.includes('DIMENSIA_FLOW_BRIDGE'))return output;
     return /<head[^>]*>/i.test(output)?output.replace(/<head[^>]*>/i,x=>x+block):block+output;
   };
   wrapped.__flowWrapped=true;window.DimensiaDevTools.instrument=wrapped;
   if(state.siteHtml)frame.srcdoc=wrapped(state.siteHtml);
 }
 window.addEventListener('message',e=>{
   if(e.source!==frame.contentWindow||e.data?.channel!=='DIMENSIA_FLOW_BRIDGE')return;
   const packet=e.data;
   if(packet.event==='ready'){emitControl('record',{enabled});return}
   if(packet.event==='event'&&enabled&&!replaying){
     const d=packet.data||{};
     if(items.length>=150)items.shift();
     items.push({type:short(d.type,20),selector:short(d.selector,500),label:short(d.label,100),href:short(d.href,230),detail:short(d.detail,160),time:now()});
     render();
   }
   if(packet.event==='result'){
     results.set(packet.data?.index,packet.data);
     const r=packet.data||{};
     $('flowFoot').textContent='Adım '+(Number(r.index)+1)+': '+(r.success?'başarılı':'atlandı · '+(r.reason||'hata'))+'.';
   }
   if(packet.event==='replayDone'){
     replaying=false;
     const all=[...results.values()],ok=all.filter(x=>x.success).length;
     $('flowFoot').textContent='Akış testi tamamlandı: '+ok+' başarılı / '+all.length+' değerlendirilen adım. Harici yönlendirmeler ve form gönderimleri güvenlik nedeniyle atlandı.';
     render();
   }
 });
 $('flowRecord').onclick=()=>{if(state.tab==='code')$('tabPreview').click();setRecording(!enabled)};
 $('flowClear').onclick=()=>{items=[];results.clear();$('flowFoot').textContent='Akış temizlendi.';render()};
 $('flowReplay').onclick=()=>{
   if(!items.length||replaying)return;
   if(!confirm('Kendi önizlemendeki tıklama akışını yeniden oynatmak ister misin? Butonların sunucu işlemleri varsa gerçek yan etkiler oluşturabilir. Form gönderimleri ve dış bağlantılar atlanır.'))return;
   replaying=true;results.clear();
   const prior=enabled;setRecording(false);
   $('flowFoot').textContent='Akış yeniden oynatılıyor…';
   emitControl('replay',{steps:items.map(x=>({type:x.type,selector:x.selector}))});
   render();
 };
 $('flowExport').onclick=()=>{
   const payload=JSON.stringify({name:state.siteName,created:new Date().toISOString(),warning:'No form values or credentials recorded',steps:items},null,2);
   const blob=new Blob([payload],{type:'application/json'}),url=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=url;a.download='dimensia-interaction-flow.json';a.click();
   setTimeout(()=>URL.revokeObjectURL(url),3000);
 };
 frame.addEventListener('load',()=>emitControl('record',{enabled}));
 render();
})();