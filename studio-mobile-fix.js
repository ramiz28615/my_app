/* Dimensia Mobile Rescue — keeps Chrome Android custom-tab in a usable single-column layout
   when "desktop site" emulation reports a much wider layout viewport. */
(() => {
 'use strict';
 const root=document.documentElement;
 const sidebar=document.getElementById('sidebar');
 const menu=document.getElementById('openMenu');
 const scrim=document.getElementById('sidebarScrim');
 const isHandset=()=>{
   const width=Math.min(Number(screen.width)||9999,Number(screen.availWidth)||9999);
   const touch=(navigator.maxTouchPoints||0)>0;
   const ua=/Android|iPhone|iPod|Mobile/i.test(navigator.userAgent||'');
   return width<=720&&(touch||ua);
 };
 const update=()=>{
   const hasNarrowLayout=matchMedia('(max-width:760px)').matches;
   const shouldForce=isHandset()&&!hasNarrowLayout;
   root.classList.toggle('dim-handset',shouldForce);
   root.dataset.mobileRescue=shouldForce?'true':'false';
   if(!shouldForce&&sidebar?.classList.contains('open')&&window.innerWidth>760){
     sidebar.classList.remove('open');scrim?.classList.remove('open');
   }
 };
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
 window.DimensiaMobile={update,isHandset,forced:()=>root.classList.contains('dim-handset')};
})();