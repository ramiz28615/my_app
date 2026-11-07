/* Dimensia Mobile Rescue — keeps Chrome Android custom-tab in a usable single-column layout
   when "desktop site" emulation reports a much wider layout viewport. */
(() => {
 'use strict';
 const root=document.documentElement;
 const sidebar=document.getElementById('sidebar');
 const menu=document.getElementById('openMenu');
 const scrim=document.getElementById('sidebarScrim');
 const toggle=document.createElement('button');
 toggle.type='button';toggle.id='dimMobileToggle';toggle.className='dim-mobile-toggle';
 toggle.setAttribute('title','Telefon görünümü ile normal görünüm arasında geçiş');
 toggle.setAttribute('aria-label','Telefon görünümü');
 toggle.textContent='▯ Telefon';
 const bar=document.querySelector('.top-left')||document.querySelector('.top-actions');
 bar?.append(toggle);
 let override='';
 try{override=localStorage.getItem('dimensia-mobile-override')||'';}catch{}
 const isHandset=()=>{
   const width=Math.min(Number(screen.width)||9999,Number(screen.availWidth)||9999);
   const touch=(navigator.maxTouchPoints||0)>0;
   const ua=/Android|iPhone|iPod|Mobile/i.test(navigator.userAgent||'');
   return width<=720&&(touch||ua);
 };
 const update=()=>{
   const hasNarrowLayout=matchMedia('(max-width:760px)').matches;
   const shouldForce=override==='force'||(override!=='standard'&&isHandset()&&!hasNarrowLayout);
   root.classList.toggle('dim-handset',shouldForce);
   root.dataset.mobileRescue=shouldForce?'true':'false';
   toggle.setAttribute('aria-pressed',String(shouldForce));
   toggle.textContent=shouldForce?'▣ Normal':'▯ Telefon';
   if(!shouldForce&&sidebar?.classList.contains('open')&&window.innerWidth>760){
     sidebar.classList.remove('open');scrim?.classList.remove('open');
   }
 };
 toggle.addEventListener('click',()=>{
   override=root.classList.contains('dim-handset')?'standard':'force';
   try{localStorage.setItem('dimensia-mobile-override',override)}catch{}
   update();
 });
 update();
 window.addEventListener('resize',update,{passive:true});
 window.addEventListener('orientationchange',update,{passive:true});
 if(menu){
   menu.setAttribute('aria-expanded','false');
   const reflect=()=>menu.setAttribute('aria-expanded',sidebar?.classList.contains('open')?'true':'false');
   menu.addEventListener('click',()=>requestAnimationFrame(reflect));
   scrim?.addEventListener('click',()=>requestAnimationFrame(reflect));
   document.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>requestAnimationFrame(reflect)));
   document.addEventListener('keydown',e=>{
     if(e.key!=='Escape'||!sidebar?.classList.contains('open'))return;
     sidebar.classList.remove('open');scrim?.classList.remove('open');reflect();menu.focus();
   });
 }
 window.DimensiaMobile={update,isHandset,forced:()=>root.classList.contains('dim-handset'),setMode:(mode)=>{override=['force','standard',''].includes(mode)?mode:'';update()}};
})();