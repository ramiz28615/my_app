import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const PORT=31876;
const base='http://127.0.0.1:'+PORT;
const child=spawn(process.execPath,['server.mjs'],{
  cwd:process.cwd(),env:{...process.env,HOST:'127.0.0.1',PORT:String(PORT)},
  stdio:['ignore','pipe','pipe']
});
let browser=null;
const errors=[];
const log=(name,msg)=>console.log('[BROWSER]',name,msg||'OK');
const wait=async(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
async function ensureServer(){
 for(let i=0;i<55;i++){
  if(child.exitCode!==null)throw Error('Local server exited '+child.exitCode);
  try {const res=await fetch(base+'/api/status');if(res.ok)return;}
  catch{}
  await wait(120);
 }
 throw Error('Local server failed to launch');
}
function checkNoErrors(label){
 if(errors.length)throw Error(label+' page errors:\n'+errors.join('\n').slice(0,7000));
}
try{
 await ensureServer();
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:950},reducedMotion:'reduce'});
 page.on('pageerror',e=>{const detail=e.stack||String(e);errors.push(detail);console.error('[PAGE ERROR]',detail)});
 page.on('console',m=>{if(m.type()==='error')console.log('[CONSOLE ERROR]',m.text().slice(0,250))});
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.locator('#homeDimensionCards .dim-card').first().waitFor({timeout:12000});
 assert.equal(await page.locator('#homeDimensionCards .dim-card').count(),6);
 checkNoErrors('Homepage');
 log('Homepage','6 dimension cards rendered');

 await page.locator('[data-nav="dimensions"]').click();
 await page.locator('[data-dimension="7"]').click();
 await page.waitForFunction(()=>document.getElementById('vertexCount').textContent==='128');
 checkNoErrors('Dimension Lab');
 log('Dimension Lab','7D renders 128 vertices');

 await page.locator('[data-nav="studio"]').click();
 for(const id of ['reWorkspace','flowRecord','referenceUrl','rePick']){
  await page.locator('#'+id).waitFor({timeout:10000});
 }
 await page.locator('.preview-devtools').waitFor({timeout:10000});
 assert.equal(await page.locator('#referenceFile').count(),1);
 checkNoErrors('Studio modules');
 log('Studio','RE editor, flow recorder, reference lab and DevTools mounted');

 const snippet='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Smoke test</title></head><body><main><h1>Deneme</h1><button id="samplePick" type="button">Test Butonu</button></main><script>console.log("Dimensia smoke preview")</scr'+'ipt></body></html>';
 await page.locator('#tabCode').click();
 await page.locator('#codeEditor').fill(snippet);
 await page.locator('#tabPreview').click();
 const button=page.frameLocator('#siteFrame').locator('#samplePick');
 await button.waitFor({timeout:12000});
 await page.evaluate(()=>{window.__dimReEvents=[];window.addEventListener('message',e=>{if(e.data?.channel==='DIMENSIA_RE_EDITOR')window.__dimReEvents.push({event:e.data.event,data:e.data.data?.tag||''})})});
 await page.locator('#rePick').click();
 await button.click();
 await page.waitForTimeout(700);
 const inspected=await page.evaluate(()=>({pickLabel:document.getElementById('rePick').innerText,events:window.__dimReEvents,iframeSource:document.getElementById('siteFrame').srcdoc.includes('DIMENSIA_RE_EDITOR'),frameBytes:document.getElementById('siteFrame').srcdoc.length,selectedVisible:!!document.getElementById('reText')}));
 console.log('[RE DIAGNOSTICS]',JSON.stringify(inspected));
 await page.locator('#reText').waitFor({timeout:2200});
 await page.locator('#reText').fill('Düzenlenmiş Buton');
 await page.locator('#reApply').click();
 await page.frameLocator('#siteFrame').locator('#samplePick').waitFor();
 assert.equal(await page.frameLocator('#siteFrame').locator('#samplePick').innerText(),'Düzenlenmiş Buton');
 await page.locator('#tabCode').click();
 const edited=await page.locator('#codeEditor').inputValue();
 assert.ok(edited.includes('Düzenlenmiş Buton'),'Visual edits were not persisted to source');
 await page.locator('#tabPreview').click();
 checkNoErrors('Visual editor');
 log('Visual editor','selection, edit, source serialization and preview passed');

 if((await page.locator('#rePick').innerText()).includes('Açık'))await page.locator('#rePick').click();
 await page.locator('#flowRecord').click();
 await page.frameLocator('#siteFrame').locator('#samplePick').click();
 await page.waitForFunction(()=>/1 adım|1 işlem/.test(document.getElementById('flowCount').textContent),{timeout:9000}).catch(async()=>{throw Error('Flow recorder did not capture click: '+await page.locator('#flowCount').innerText())});
 await page.locator('#flowRecord').click();
 checkNoErrors('Flow recorder');
 log('Flow recorder','button click captured');

 await page.locator('[data-retab="files"]').click();
 await page.locator('#reLocalSource').click();
 assert.ok((await page.locator('#reSourceCode').inputValue()).includes('Düzenlenmiş Buton'));
 checkNoErrors('Source editor');
 log('Source editor','local source loaded');

 await page.locator('[data-retab="audit"]').click();
 await page.locator('#reAuditDownload').waitFor();
 await page.locator('[data-retab="history"]').click();
 assert.ok((await page.locator('#reBody').innerText()).includes('Sürüm'));
 checkNoErrors('Audit and history');
 log('Audit/history','ready');

 await page.locator('.reference-details summary').click();
 await page.locator('#referenceHtml').fill('<!doctype html><html><head><title>Örnek Başlık</title></head><body><nav><a href="/test">Menü</a></nav><button>Deneme</button></body></html>');
 await page.locator('#inspectPastedHtml').click();
 assert.ok((await page.locator('#referenceReport').innerText()).includes('Örnek Başlık'));
 checkNoErrors('Reference importer');
 log('Reference Lab','pasted HTML parsed');

 await page.locator('[data-nav="settings"]').click();
 await page.locator('#orKey').waitFor();
 const testKey='sk-or-test-01234567890123456789012345';
 await page.locator('#orKey').fill(testKey);
 assert.ok((await page.locator('#aiModeBadge').innerText()).includes('OPENROUTER FREE'));
 await page.locator('#orForget').click();
 assert.equal(await page.locator('#orKey').inputValue(),'');
 checkNoErrors('OpenRouter settings');
 log('OpenRouter settings','key stored in memory and clear action works');


 // Browser-level GitHub API simulation: real tokens are NEVER used in CI.
 await page.locator('[data-nav="studio"]').click();
 for(const id of ['dimensiaLaunchpad','launchPreviewFrame','launchToken','launchConnect','launchPublish','launchSites'])await page.locator('#'+id).waitFor();
 const previewSite=await page.locator('#launchPreviewFrame').getAttribute('srcdoc');
 assert.ok(previewSite.includes('Düzenlenmiş Buton'),'Launchpad preview must reflect current generated HTML');
 const ghWrites=[];
 let fileExists=false;
 const cors={
   'Access-Control-Allow-Origin':'*',
   'Access-Control-Allow-Headers':'Authorization,Content-Type,Accept,X-GitHub-Api-Version',
   'Access-Control-Allow-Methods':'GET,PUT,OPTIONS'
 };
 await page.route('https://api.github.com/**',async route=>{
   const req=route.request(),u=new URL(req.url()),method=req.method();
   const reply=(status,body)=>route.fulfill({status,contentType:'application/json',headers:cors,body:JSON.stringify(body)});
   if(method==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(u.pathname==='/user')return reply(200,{login:'ramiz28615'});
   if(u.pathname==='/repos/ramiz28615/my_app')return reply(200,{default_branch:'main',permissions:{push:true},private:false,archived:false});
   if(u.pathname==='/repos/ramiz28615/my_app/pages')return reply(200,{html_url:'https://ramiz28615.github.io/my_app/'});
   if(u.pathname==='/repos/ramiz28615/portfolio-host')return reply(200,{default_branch:'main',permissions:{push:true},private:false,archived:false});
   if(u.pathname==='/repos/ramiz28615/portfolio-host/pages')return reply(403,{message:'Pages: read permission required'});
   if(u.pathname==='/repos/ramiz28615/my_app/contents/sites/e2e-lansman/index.html'){
     if(method==='GET')return fileExists?reply(200,{type:'file',sha:'mock-old-blob',encoding:'base64',content:ghWrites.at(-1)?.payload?.content||''}):reply(404,{message:'Not Found'});
     if(method==='PUT'){
       const payload=req.postDataJSON();
       ghWrites.push({payload,path:u.pathname,auth:req.headers().authorization});
       fileExists=true;
       return reply(ghWrites.length===1?201:200,{commit:{sha:'mockcommit'+ghWrites.length},content:{sha:'mockblob'+ghWrites.length}});
     }
   }
   if(u.pathname==='/repos/ramiz28615/my_app/contents/sites'&&method==='GET')return reply(200,[{name:'e2e-lansman',type:'dir'},{name:'aurora-demo',type:'dir'}]);
   if(u.pathname==='/repos/ramiz28615/my_app/actions/runs')return reply(200,{workflow_runs:[{name:'Deploy Dimensia Studio to GitHub Pages',path:'.github/workflows/deploy.yml',status:'completed',conclusion:'success',html_url:'https://github.com/ramiz28615/my_app/actions/runs/123'}]});
   return reply(404,{message:'Not Found'});
 });
 await page.locator('#launchOwner').fill('ramiz28615');
 await page.locator('#launchRepo').fill('my_app');
 await page.locator('#launchSlug').fill('e2e-lansman');
 await page.locator('#launchToken').fill('github_pat_e2e_fake_token_1234567890123456');
 await page.locator('#launchConnect').click();
 await page.waitForFunction(()=>document.querySelector('#launchAuthChip')?.textContent.includes('ramiz28615 bağlı'));
 await page.locator('#launchConfirm').check();
 await page.locator('#launchPublish').click();
 await page.waitForFunction(()=>document.querySelector('#launchFeedback')?.textContent.includes('HTML GitHub’a kaydedildi'),{timeout:11000});
 assert.equal(ghWrites.length,1,'Publisher should create exactly one file');
 assert.equal(ghWrites[0].path,'/repos/ramiz28615/my_app/contents/sites/e2e-lansman/index.html');
 assert.ok(ghWrites[0].payload.content,'GitHub Contents API should receive base64-encoded website');
 assert.ok(Buffer.from(ghWrites[0].payload.content,'base64').toString('utf8').includes('Düzenlenmiş Buton'));
 assert.equal(ghWrites[0].payload.branch,'main');
 assert.equal(ghWrites[0].payload.sha,undefined,'First publish should create without previous SHA');
 assert.ok((await page.locator('#launchSites').innerText()).includes('e2e-lansman'));
 assert.ok((await page.locator('#launchFeedback').innerText()).includes('GitHub’a kaydedildi'));
 await page.locator('#launchCheck').click();
 await page.waitForFunction(()=>document.querySelector('#launchFeedback')?.textContent.includes('GitHub Pages dağıtımı başarılı'));
 checkNoErrors('Launchpad initial publish');
 log('Launchpad publish','GitHub API create, live link, deployment status passed');

 await page.locator('#launchPublish').click();
 await page.waitForFunction(()=>document.querySelector('#launchFeedback')?.textContent.includes('HTML GitHub’a kaydedildi')&&document.querySelector('#launchFeedback')?.textContent.includes('Yayın Durumunu'),{timeout:11000});
 assert.equal(ghWrites.length,2,'Second publish should update existing GitHub file');
 assert.equal(ghWrites[1].payload.sha,'mock-old-blob','Update must include current existing file SHA');
 checkNoErrors('Launchpad update');
 log('Launchpad update','existing file SHA correctly included');

 const hostUrl=await page.evaluate(()=>window.DimensiaLaunchpad.pageURL({owner:'ramiz28615',repo:'ramiz28615.github.io',site:'portfolio'}));
 assert.equal(hostUrl,'https://ramiz28615.github.io/sites/portfolio/','GitHub username repository must not duplicate repo path');

 await page.locator('#launchSync').click();
 await page.waitForFunction(()=>document.querySelector('#launchFeedback')?.textContent.includes('proje klasörü bulundu'));
 assert.ok((await page.locator('#launchSites').innerText()).includes('aurora-demo'),'GitHub discovery should recover remote sites');
 checkNoErrors('Launchpad GitHub discovery');
 log('Launchpad discover','remote sites list reconstructed from GitHub');

 page.once('dialog',dialog=>dialog.accept());
 await page.locator('.launch-site').filter({hasText:'e2e-lansman'}).getByRole('button',{name:'⌘ GitHub’dan Aç'}).click();
 await page.waitForFunction(()=>document.querySelector('#launchFeedback')?.textContent.includes('GitHub kaynağı editöre yüklendi'));
 assert.ok((await page.locator('#codeEditor').inputValue()).includes('Düzenlenmiş Buton'),'GitHub source should be loaded back into editor');
 checkNoErrors('Launchpad source restoration');
 log('Launchpad restore','published HTML restored to live source editor');

 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#launchImportDemo').click();
 await page.waitForFunction(()=>document.querySelector('#launchSiteName')?.textContent.includes('Aurora'));
 assert.ok((await page.locator('#codeEditor').inputValue()).includes('Aurora — Design beyond ordinary'),'Demo import should replace editor with demo source');
 checkNoErrors('Launchpad example import');
 log('Launchpad example','Aurora design copied to editor and preview');
 

 await page.locator('#launchRepo').fill('portfolio-host');
 await page.locator('#launchSlug').fill('markam');
 await page.locator('#launchConnect').click();
 await page.waitForFunction(()=>document.querySelector('#launchAuthChip')?.textContent.includes('ramiz28615 bağlı'));
 assert.ok((await page.locator('#launchLinkPreview').innerText()).includes('ramiz28615.github.io/portfolio-host/sites/markam/'));
 await page.waitForFunction(()=>document.querySelector('#launchFeedback')?.textContent.includes('Pages ayarı API izni nedeniyle doğrulanamadı'));
 checkNoErrors('GitHub Pages limited token');
 log('Launchpad permissions','Contents-only token works without Pages: read permission');

 await page.locator('#launchTokenForget').click();
 assert.equal(await page.locator('#launchToken').inputValue(),'');
 const deploymentMeta=await page.evaluate(()=>localStorage.getItem('dimensia-published-sites-v1')||'');
 assert.ok(deploymentMeta.includes('e2e-lansman'),'Published site metadata was not stored');
 assert.ok(!deploymentMeta.includes('github_pat_'),'Sensitive GitHub access token was persisted');
 checkNoErrors('Launchpad token security');
 log('Launchpad security','token not persisted, session forget works');


 // New Architect and Code Lab: browser source, visual style, diagram and sandboxed JS.
 for(const id of ['architectStudio','dimensiaCodeLab','dimensiaAIAgent','archOwnScan','labRun','agentPlan'])await page.locator('#'+id).waitFor();
 await page.locator('#archOwnScan').click();
 await page.waitForFunction(()=>document.getElementById('archNotice')?.textContent.includes('1 sayfa analiz'));
 await page.locator('[data-tab="flow"]').click();
 assert.ok(await page.locator('#archContent svg').count(),'Architecture diagram should show nodes/flows');
 await page.locator('[data-tab="components"]').click();
 assert.ok((await page.locator('#archContent').innerText()).includes('Butonlar'));
 await page.locator('[data-tab="design"]').click();
 await page.locator('#archFont').fill('17');
 await page.locator('#archApplyDesign').click();
 assert.ok((await page.locator('#codeEditor').inputValue()).includes('data-dimensia-architect'),'Design changes must modify editable HTML');
 await page.locator('[data-tab="source"]').click();
 assert.ok(await page.locator('#archCode').count(),'HTML sources should be exposed as editable text');
 checkNoErrors('Architect');
 log('Architect','HTML/DOM analysis, visual flow, style editor and source explorer passed');

 // Simulate a public CORS-permitted URL when local Node analysis is unavailable.
 await page.route('http://127.0.0.1:31876/api/architect?**',r=>r.fulfill({status:404,contentType:'application/json',body:'{"error":"No API"}'}));
 await page.route('https://allowed-example.test/**',r=>r.fulfill({
  status:200,headers:{'access-control-allow-origin':'*','content-type':'text/html; charset=utf-8'},
  body:'<!doctype html><html><head><title>Remote E2E</title><style>h1{color:#123abc;font-size:24px}</style></head><body><h1>İzinli Sayfa</h1><button>İşlem</button></body></html>'
 }));
 await page.locator('#archConsent').check();
 await page.locator('#archURL').fill('https://allowed-example.test/');
 await page.locator('#archURLScan').click();
 await page.waitForFunction(()=>document.querySelector('#archNotice')?.textContent.includes('Tarayıcı CORS analizi'),{timeout:10000});
 assert.ok((await page.locator('#archStats').innerText()).includes('Buton'));
 checkNoErrors('Browser-only URL import');
 log('Architect no Node','public CORS HTML analyzed without Node server');

 // Code Lab JavaScript executes in sandbox, no execution of Rust/Bash/React Native in browser.
 await page.locator('#labMenu [data-lang="javascript"]').click();
 await page.locator('#labEditor').fill('console.log("Dimensia browser sandbox verification");');
 await page.locator('#labRun').click();
 await page.waitForFunction(()=>document.getElementById('labOutput')?.textContent.includes('Dimensia browser sandbox verification'),{timeout:5000});
 await page.locator('#labStop').click();
 await page.locator('#labMenu [data-lang="reactnative"]').click();
 assert.ok((await page.locator('#labRuntime').innerText()).includes('Expo'),'React Native must explain native toolchain');
 checkNoErrors('Code Lab runtime');
 log('Code Lab','sandbox JS and React Native scaffold controls passed');

 // Agent local plan must function without API; mocked API then exercises real plan/build/quality.
 await page.locator('#agentPrompt').fill('Çalışan menü, etkileşimli kartlar ve mobil destek sunan modern bir web sitesi oluştur.');
 await page.locator('#agentPlan').click();
 console.log('[AI PLAN STATUS]',await page.locator('#agentStatus').innerText(),'PANEL:',(await page.locator('#agentPanel').innerText()).slice(0,450));
 await page.waitForFunction(()=>document.getElementById('agentPanel')?.textContent.includes('İhtiyaç analizi'),{timeout:5000});
 await page.route('https://openrouter.ai/api/v1/chat/completions',async route=>{
  const request=route.request().postDataJSON();
  const system=request.messages?.[0]?.content||'';
  const content=system.includes('lead software architect')?
    '{"steps":[{"title":"AI mock plan","detail":"Responsive HTML CSS JS application"},{"title":"Build","detail":"Working buttons and navigation"}]}':
    '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI Smoke</title><style>body{background:#182c2b;color:#eeffee;font:16px system-ui}button{padding:10px}</style></head><body><main><h1>AI Generated E2E</h1><button id="aiExample" type="button">Test Eylemi</button></main><script>document.querySelector("#aiExample").onclick=()=>console.log("AI clicked");</scr'+'ipt></body></html>';
  await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({choices:[{message:{content}}]})});
 });
 await page.locator('[data-nav="settings"]').click();
 await page.locator('#orKey').fill('sk-or-test-for-e2e-placeholder-not-a-real-key-12345');
 await page.locator('[data-nav="studio"]').click();
 await page.locator('#agentPlan').click();
 await page.waitForFunction(()=>document.getElementById('agentPanel')?.textContent.includes('AI mock plan'),{timeout:10000});
 await page.locator('#agentBuild').click();
 await page.frameLocator('#siteFrame').locator('#aiExample').waitFor({timeout:12000});
 assert.ok((await page.locator('#codeEditor').inputValue()).includes('AI Generated E2E'));
 await page.locator('#agentReview').click();
 assert.ok((await page.locator('#agentPanel').innerText()).includes('Temel kontroller'));
 await page.locator('[data-ai-tab="versions"]').click();
 assert.ok((await page.locator('#agentPanel').innerText()).includes('v2'),'Agent should preserve original and new HTML versions');
 checkNoErrors('AI Agent workflow');
 log('AI Agent','local fallback plan, mocked OpenRouter plan/build, review and undo history passed');
 await page.locator('[data-nav="settings"]').click();
 await page.locator('#orForget').click();
 assert.equal(await page.locator('#orKey').inputValue(),'');
 const dataKeys=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))));
 assert.ok(!dataKeys.includes('sk-or-test-for-e2e-placeholder'),'OpenRouter key must not be persisted');
 await page.locator('[data-nav="studio"]').click();

 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.scrollTo(0,0));
 const scroll=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(scroll.scroll<=scroll.inner+2,'Mobile horizontal overflow: '+JSON.stringify(scroll));
 checkNoErrors('Mobile');
 log('Mobile','no horizontal overflow');


 // Deployed site example: real page HTML, prices, accordion and mobile navigation.
 const demo=await browser.newPage({viewport:{width:1365,height:900},reducedMotion:'reduce'});
 const demoErrors=[];
 demo.on('pageerror',e=>demoErrors.push(String(e.stack||e)));
 const demoResponse=await demo.goto(base+'/sites/aurora-demo/',{waitUntil:'domcontentloaded'});
 assert.equal(demoResponse.status(),200,'Example site must be served through the same static route as Pages');
 await demo.locator('h1').waitFor();
 assert.ok((await demo.locator('h1').innerText()).includes('bir dünya olsun'));
 assert.equal(await demo.locator('.feature').count(),6);
 assert.equal(await demo.locator('.plan').count(),3);
 await demo.locator('[data-period="yearly"]').click();
 assert.ok((await demo.locator('.plan.highlight .price').innerText()).includes('₺149'));
 await demo.locator('[data-period="monthly"]').click();
 assert.ok((await demo.locator('.plan.highlight .price').innerText()).includes('₺199'));
 await demo.locator('#faq details').first().locator('summary').click();
 assert.ok(await demo.locator('#faq details').first().getAttribute('open')!==null);
 assert.deepEqual(demoErrors,[],'Example site browser errors on desktop');
 log('Aurora example desktop','original demo loads, pricing toggle and FAQ work');
 await demo.setViewportSize({width:390,height:844});
 await demo.locator('#menuBtn').click();
 assert.equal(await demo.locator('#menuBtn').getAttribute('aria-expanded'),'true');
 await demo.locator('#navLinks a').first().click();
 assert.equal(await demo.locator('#menuBtn').getAttribute('aria-expanded'),'false');
 const demoOverflow=await demo.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(demoOverflow.scroll<=demoOverflow.inner+2,'Example mobile overflow '+JSON.stringify(demoOverflow));
 assert.deepEqual(demoErrors,[],'Example site browser errors on mobile');
 log('Aurora example mobile','responsive menu and no horizontal overflow');
 await demo.close();

 await page.close();
 console.log('PASS: full browser smoke suite');
}catch(e){
 console.error('FAIL: browser smoke suite: '+(e.stack||e));
 process.exitCode=1;
}finally{
 await browser?.close();
 child.kill('SIGTERM');
}
