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
 await page.locator('#dimensiaChatHub').waitFor({timeout:12000});
 assert.ok(await page.locator('#dhWelcome').isVisible(),'Chat-first homepage should be visible');
 assert.equal(await page.locator('#homeDimensionCards .dim-card').count(),6,'Legacy dimension lab data remains intact');
 assert.ok((await page.locator('[data-nav="home"]').innerText()).includes('AI Sohbet'));
 checkNoErrors('Chat homepage');
 log('Homepage','Chat-first UI, suggestion cards and preserved 2D-7D data rendered');

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
 assert.ok((await page.locator('#aiModeBadge').innerText()).includes('API ANAHTARI GİRİLDİ'));
 assert.ok((await page.locator('#apiStatusText').innerText()).includes('henüz doğrulanmadı'));
 await page.route('https://openrouter.ai/api/v1/key',r=>r.fulfill({
  status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},
  body:JSON.stringify({data:{is_free_tier:true,limit_remaining:0}})
 }));
 await page.locator('#orCheck').click();
 await page.waitForFunction(()=>document.querySelector('#orStatus')?.textContent.includes('API anahtarı OpenRouter tarafından doğrulandı'));
 assert.ok((await page.locator('#apiStatusText').innerText()).includes('OpenRouter API anahtarı doğrulandı'));
 assert.equal(await page.evaluate(()=>window.DimensiaOpenRouter.getStatus().authentication),'valid');
 let outputRequests=0;
 await page.route('https://openrouter.ai/api/v1/chat/completions',async route=>{
   outputRequests++;
   const payload=route.request().postDataJSON();
   assert.ok(payload.max_tokens>=512,'Connection model test must provide enough tokens');
   assert.equal(payload.model,'openrouter/free');
   const response=outputRequests===1?
     {model:'free-reasoner:free',choices:[{finish_reason:'length',message:{content:''}}],usage:{completion_tokens:900,completion_tokens_details:{reasoning_tokens:899}}}:
     {model:'mock/free:free',choices:[{finish_reason:'stop',message:{content:'TAMAM'}}],usage:{completion_tokens:9}};
   await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(response)});
 });
 await page.locator('#orReplyTest').click();
 await page.waitForFunction(()=>document.querySelector('#orStatus')?.textContent.includes('model testi başarısız'));
 assert.equal(await page.evaluate(()=>window.DimensiaOpenRouter.getStatus().model),'empty');
 assert.ok((await page.locator('#orStatus').innerText()).includes('Düşünme tokenleri'));
 assert.equal(await page.evaluate(()=>window.DimensiaOpenRouter.getStatus().authentication),'valid');
 await page.locator('#orReplyTest').click();
 await page.waitForFunction(()=>document.querySelector('#orStatus')?.textContent.includes('model yanıtı başarılı'));
 assert.equal(await page.evaluate(()=>window.DimensiaOpenRouter.getStatus().model),'ok');
 await page.route('https://openrouter.ai/api/v1/models?**',r=>r.fulfill({
  status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},
  body:JSON.stringify({data:[
   {id:'example/fast-code:free',name:'Fast Code Free',architecture:{output_modalities:['text']},pricing:{prompt:'0',completion:'0'}},
   {id:'example/paid-model',name:'Paid Code',architecture:{output_modalities:['text']},pricing:{prompt:'0.000001',completion:'0.000001'}}
  ]})
 }));
 await page.locator('#orRefresh').click();
 await page.waitForFunction(()=>document.querySelector('#orModelHelp')?.textContent.includes('1 adet'));
 assert.ok(await page.locator('#orModel option[value="example/fast-code:free"]').count());
 assert.equal(await page.locator('#orModel option[value="example/paid-model"]').count(),0,'Paid models must not be listed');
 await page.locator('#orModel').selectOption('custom');
 await page.locator('#orCustomModel').fill('invalid');
 assert.equal(await page.evaluate(()=>window.DimensiaOpenRouter.getStatus().selectedModel),'openrouter/free');
 await page.locator('#orModel').selectOption('openrouter/free');
 checkNoErrors('OpenRouter auth/inference');
 log('OpenRouter auth','key verification, empty reasoning output, recovery and free-only model catalogue passed');
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

 // Repair a failed Perl job with OpenRouter mock and explicit, review-first approval.
 await page.locator('#polyResultGrid [data-result="perl"]').click();
 assert.ok((await page.locator('#polyOutput').innerText()).includes('Shared contract mismatch'));
 await page.locator('#orKey').fill('sk-or-'+'v1-'+'fake'.repeat(12));
 await page.route('https://openrouter.ai/api/v1/chat/completions',async route=>{
  const proposed='#!/usr/bin/env perl\nuse strict;\nuse warnings;\nprint "DIMENSIA_RESULT:{\\"count\\":5,\\"sum\\":15}\\n";\n';
  await route.fulfill({status:200,contentType:'application/json',
   headers:{'access-control-allow-origin':'*'},
   body:JSON.stringify({model:'mock/fix:free',choices:[{finish_reason:'stop',message:{content:proposed}}]})});
 });
 const beforeFix=await page.evaluate(()=>window.DimensiaPolyglot.getFiles().perl);
 await page.locator('#polyFix').click();
 await page.locator('#polyFixReview:not([hidden])').waitFor({timeout:13000});
 assert.equal(await page.evaluate(()=>window.DimensiaPolyglot.getFiles().perl),beforeFix,'AI cannot apply code before user approval');
 assert.ok((await page.locator('#polyFixCode').inputValue()).includes('DIMENSIA_RESULT'));
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#polyApplyFix').click();
 assert.ok((await page.evaluate(()=>window.DimensiaPolyglot.getFiles().perl)).includes('DIMENSIA_RESULT'));
 assert.equal(cloudUploads.length,9,'AI code repair cannot silently upload to public GitHub');
 assert.equal(await page.locator('#polyFixReview:not([hidden])').count(),0);
 await page.locator('#orForget').click();
 await page.unroute('https://openrouter.ai/api/v1/chat/completions');
 checkNoErrors('Polyglot repair');
 log('Polyglot repair','failed language diagnostics, AI suggestion review, explicit apply and zero silent uploads passed');

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

 // Cross-origin blocked URL: show actionable alternatives instead of a fake Node requirement.
 await page.route('https://blocked-example.test/**',route=>route.abort('failed'));
 await page.locator('#archURL').fill('https://blocked-example.test/');
 await page.locator('#archURLScan').click();
 await page.locator('#archFallback:not([hidden])').waitFor({timeout:12000});
 assert.equal(await page.locator('.arch-fallback-options button').count(),4);
 assert.ok((await page.locator('#archNotice').innerText()).includes('CORS'),'CORS error must be explained');
 assert.ok(!(await page.locator('#archNotice').innerText()).includes('Node kurulu değil'),'Do not instruct Node installation for browser CORS');
 await page.locator('.arch-fallback-options button').nth(2).click();
 await page.waitForFunction(()=>document.querySelector('#archNotice')?.textContent.includes('sayfa analiz edildi'));
 assert.equal(await page.locator('#archFallback:not([hidden])').count(),0,'Successful own-site analysis should hide fallback');
 checkNoErrors('CORS fallback');
 log('Architect fallback','blocked remote URL provides four working no-Node alternatives');


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

 // Polyglot multi-file workspace (real execution covered in tests/polyglot.test.mjs).
 await page.locator('#dimensiaPolyglot').waitFor({timeout:12000});
 assert.equal(await page.locator('#polyFiles .poly-file').count(),9,'Polyglot workspace must expose nine editable project files');
 assert.ok((await page.locator('#polyEditor').inputValue()).includes('print('),'Python source must not be wiped on initial loading');
 await page.locator('#polyFiles button[data-language="perl"]').click();
 assert.ok((await page.locator('#polyEditor').inputValue()).includes('use strict'),'Perl source example should be editable');
 await page.locator('#polyEditor').fill('use strict;\nuse warnings;\nprint "Perl E2E source saved!\\n";');
 await page.locator('#polyFiles button[data-language="python"]').click();
 assert.ok((await page.locator('#polyEditor').inputValue()).includes('print('),'Python source should survive language switching');
 await page.locator('#polyFiles button[data-language="perl"]').click();
 assert.ok((await page.locator('#polyEditor').inputValue()).includes('Perl E2E'),'Perl edits must survive switching');
 assert.ok(await page.locator('#polyResultGrid button').count()===7,'Cloud runner displays seven job statuses');
 await page.locator('#polyFiles button[data-language="javascript"]').click();
 await page.locator('#polyEditor').fill('console.log("POLYGLOT_JAVASCRIPT_E2E")');
 await page.locator('#polyPreview').click();
 await page.waitForFunction(()=>document.querySelector('#codeEditor')?.value.includes('POLYGLOT_JAVASCRIPT_E2E'),{timeout:12000});
 assert.ok((await page.locator('#codeEditor').inputValue()).includes('data-polyglot'),'Web preview must merge separate CSS/JS sources');
 assert.equal((await page.locator('#polyRunText').innerText()).includes('önizleme'),true);
 assert.equal(await page.locator('#polyConsent').isChecked(),false,'Public source uploads require explicit consent');
 await page.locator('#polyCloud').click();
 await page.waitForFunction(()=>document.querySelector('#polyRunText')?.textContent.includes('onayla'));
 assert.equal(await page.evaluate(()=>window.DimensiaPolyglot.getState().busy),false);
 checkNoErrors('Polyglot frontend');
 log('Polyglot frontend','Python Perl JS editing, file state, merged HTML preview and consent safety passed');

 // Shared nine-file input and explicit local browser-only draft.
 await page.locator('#polyFiles button[data-language="shared"]').click();
 await page.locator('#polyEditor').fill('2 4 6');
 assert.equal(await page.evaluate(()=>window.DimensiaPolyglot.getFiles().shared),'2 4 6');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#polyDraftSave').click();
 await page.waitForFunction(()=>!!localStorage.getItem('dimensia-polyglot-local-draft-v1'),{timeout:5000});
 await page.locator('#polyEditor').fill('1 1 1');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#polyDraftOpen').click();
 assert.equal(await page.locator('#polyEditor').inputValue(),'2 4 6');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#polyDraftDelete').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('dimensia-polyglot-local-draft-v1')),null);
 checkNoErrors('Polyglot shared input and local draft');
 log('Polyglot local draft','nine-file shared input and browser-only save restore delete passed');

 const originalPolyFiles=await page.evaluate(()=>window.DimensiaPolyglot.getFiles());
 assert.ok(originalPolyFiles.javascript.includes('POLYGLOT_JAVASCRIPT_E2E'));
 await page.locator('#polyFiles button[data-language="python"]').click();
 await page.locator('#polyEditor').fill('print("TEMPORARY CODE BEFORE RESTORE")');
 const snapshot={schema:'dimensia-multilang-project-v1',files:{
  ...originalPolyFiles,
  python:'print("RESTORED_PYTHON_E2E")',
  perl:'use strict;\nprint "RESTORED_PERL_E2E\\n";'
 }};
 delete snapshot.files.shared; // Backwards compatible with old eight-file backups.
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#polyRestoreFile').setInputFiles({
  name:'dimensia-demo.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(snapshot),'utf8')
 });
 await page.waitForFunction(()=>document.querySelector('#polyRunText')?.textContent.includes('Proje yedeği yüklendi'),{timeout:7000});
 const restored=await page.evaluate(()=>window.DimensiaPolyglot.getFiles());
 assert.ok(restored.python.includes('RESTORED_PYTHON_E2E'),'Backup restores Python');
 assert.ok(restored.perl.includes('RESTORED_PERL_E2E'),'Backup restores Perl');
 assert.ok((await page.locator('#labMenu [data-lang="python"]').count())===1);
 await page.locator('#labMenu [data-lang="python"]').click();
 assert.ok((await page.locator('#labEditor').inputValue()).includes('RESTORED_PYTHON_E2E'),'Polyglot backup must sync legacy Code Lab');
 await page.locator('#labEditor').fill('print("CODE_LAB_SYNC_E2E")');
 assert.ok((await page.locator('#polyEditor').inputValue()).includes('CODE_LAB_SYNC_E2E'),'Legacy Code Lab edits must sync unified workspace');
 checkNoErrors('Polyglot backup and sync');
 log('Polyglot backup','nine-file JSON import and bidirectional Code Lab synchronization passed');


 // Browser-to-GitHub integration: mock public source uploads, workflow_dispatch,
 // and a real-format report without exposing any user token.
 let cloudDispatch=null;
 const cloudUploads=[];
 await page.route('https://api.github.com/repos/ramiz28615/my_app/**',async route=>{
  const req=route.request(),url=new URL(req.url()),verb=req.method();
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,PUT,POST,OPTIONS',
   'Access-Control-Allow-Headers':'Authorization,Content-Type,Accept,X-GitHub-Api-Version'};
  const reply=(status,obj)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(obj)});
  if(verb==='OPTIONS')return route.fulfill({status:204,headers});
  if(url.pathname==='/repos/ramiz28615/my_app/actions/workflows/polyglot-execute.yml/dispatches'&&verb==='POST'){
   cloudDispatch=req.postDataJSON();
   return route.fulfill({status:204,headers});
  }
  if(url.pathname.startsWith('/repos/ramiz28615/my_app/contents/code-lab/')){
   if(url.pathname.includes('/reports/')&&verb==='GET'){
    if(!cloudDispatch)return reply(404,{message:'Not Found'});
    const id=cloudDispatch.inputs.run_id;
    const jobs=Object.fromEntries(['web','javascript','python','rust','bash','perl','reactnative'].map(lang=>[lang,{
     status:lang==='perl'?'failed':'passed',label:lang,durationMs:42,steps:[{step:'Run '+lang,status:lang==='perl'?'failed':'passed',exitCode:lang==='perl'?1:0,ms:42}],
     stdout:'Merhaba Dimensia '+lang,stderr:lang==='perl'?'Shared contract mismatch: expected 15, got 10':'',
     contract:['javascript','python','rust','bash','perl'].includes(lang)?{status:lang==='perl'?'mismatch':'matched',expected:{count:5,sum:15},actual:{count:5,sum:lang==='perl'?10:15}}:undefined
    }]));
    const report={schema:'dimensia-polyglot-v1',requestId:id,total:7,passed:6,failed:1,jobs,sharedContract:{matched:4,mismatch:1,unreported:0,expected:{count:5,sum:15}}};
    return reply(200,{encoding:'base64',content:Buffer.from(JSON.stringify(report)).toString('base64'),sha:'mock-report'});
   }
   if(verb==='GET')return reply(404,{message:'Not Found'});
   if(verb==='PUT'){
    cloudUploads.push({path:url.pathname,auth:req.headers().authorization,payload:req.postDataJSON()});
    return reply(201,{commit:{sha:'cloud-commit-'+cloudUploads.length},content:{sha:'code-blob-'+cloudUploads.length}});
   }
  }
  return route.fallback();
 });
 await page.locator('#launchRepo').fill('my_app');
 await page.locator('#launchToken').fill('github_pat_E2E_cloud_mock_token_abcdefgh1234567890');
 await page.locator('#launchConnect').click();
 await page.waitForFunction(()=>document.querySelector('#launchAuthChip')?.textContent.includes('ramiz28615 bağlı'));
 await page.locator('#polyConsent').check();
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#polyCloud').click();
 await page.waitForFunction(()=>window.DimensiaPolyglot.getState().reportReady,{timeout:30000});
 assert.equal(cloudUploads.length,9,'Cloud runner must upload all nine editable project files');
 assert.ok(cloudUploads.some(x=>x.path.endsWith('/perl/main.pl')),'Perl file should be uploaded');
 assert.ok(cloudUploads.some(x=>x.path.endsWith('/shared/numbers.txt')),'Shared input must be uploaded');
 assert.equal(cloudDispatch.ref,'main');
 assert.match(cloudDispatch.inputs.run_id,/^r[a-z0-9]{9,35}$/);
 assert.equal(await page.evaluate(()=>window.DimensiaPolyglot.getState().results.perl.status),'failed');
 assert.ok((await page.locator('#polyContract').innerText()).includes('farklı 1/5'),'Contract mismatch must be visible');
 await page.locator('#polyResultGrid [data-result="rust"]').click();
 assert.ok((await page.locator('#polyOutput').innerText()).includes('Merhaba Dimensia rust'),'Per-language stdout should appear');
 assert.equal(await page.locator('#polyReportDownload').isDisabled(),false,'Report download should be enabled');
 assert.ok(!JSON.stringify(await page.evaluate(()=>Object.values(localStorage).join(' '))).includes('github_pat_'),'Cloud token must not persist');
 await page.locator('#launchTokenForget').click();
 checkNoErrors('Polyglot Cloud API');
 log('Polyglot cloud','9 GitHub file uploads, workflow_dispatch, seven real-format results and stdout drill-down passed');



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

 // New conversation-first homepage: mock real AI transport, test chat, code build,
 // local persistence, device preview, saved project and conversation history.
 await page.route('https://openrouter.ai/api/v1/chat/completions',async route=>{
  const request=route.request().postDataJSON();
  const system=String(request.messages?.[0]?.content||'');
  const content=system.includes('senior frontend product engineer')?
   '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dimensia Chat Build</title><style>body{background:#121c2a;color:white;font-family:system-ui}</style></head><body><h1>Conversation Site E2E</h1><button type="button" onclick="this.textContent=\'Clicked\'">Try</button></body></html>':
   'Merhaba! ChatLLM tarzı Dimensia sohbet yanıtı hazır.';
  await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({model:'mock/fast-free:free',choices:[{finish_reason:'stop',message:{content}}]})});
 });
 await page.locator('[data-nav="home"]').click();
 assert.ok(await page.locator('#dhWelcome').isVisible());
 assert.equal(await page.locator('#dhSuggestions .dh-suggestion').count(),4);
 await page.locator('#dhNew').click();
 await page.locator('#dhInput').fill('Merhaba, kısa bir yazılım önerisi ver.');
 await page.locator('#dhSend').click();
 await page.waitForFunction(()=>document.querySelector('#dhThread')?.textContent.includes('Dimensia sohbet yanıtı hazır'),{timeout:12000});
 assert.ok((await page.locator('#dhHistory').innerText()).includes('Merhaba'));
 assert.equal(await page.evaluate(()=>window.DimensiaChatHub.getChats()[0].count),2);
 checkNoErrors('Conversation chat');
 log('Conversation chat','OpenRouter response rendered, local chat history and New Chat worked');

 await page.locator('#dhModeBuild').click();
 await page.locator('#dhInput').fill('Bir premium tanıtım sitesi oluştur.');
 await page.locator('#dhSend').click();
 await page.waitForFunction(()=>document.querySelector('#dhArtifact')?.hidden===false,{timeout:15000});
 assert.ok((await page.locator('#dhPreview').getAttribute('srcdoc')).includes('Conversation Site E2E'));
 await page.locator('#dhMobile').click();
 assert.equal(await page.locator('#dhFrameWrap').getAttribute('data-preview'),'mobile');
 // Inline HTML/CSS/JS workspace: edit source, run sandbox, inspect JS logs, undo/redo.
 await page.locator('#dhEdit').click();
 assert.ok(await page.locator('#dcePanel').isVisible(),'Inline editor must open within chat');
 assert.equal(await page.evaluate(()=>window.DimensiaChatEditor.getState().opened),true);
 await page.locator('[data-dce-tab="css"]').click();
 await page.locator('#dceSource').fill('body {background: rgb(20, 40, 60); color: white; font-family: system-ui;}');
 await page.locator('#dceRun').click();
 await page.waitForFunction(()=>document.querySelector('#codeEditor')?.value.includes('rgb(20, 40, 60)'),{timeout:10000});
 const bg=await page.frameLocator('#dhPreview').locator('body').evaluate(x=>getComputedStyle(x).backgroundColor);
 assert.equal(bg,'rgb(20, 40, 60)','CSS edits must execute in sandboxed preview');
 await page.locator('[data-dce-tab="js"]').click();
 await page.locator('#dceSource').fill('console.log("DIMENSIA_EDITOR_E2E");document.querySelector("button").addEventListener("click",function(){this.dataset.test="yes"});');
 await page.locator('#dceRun').click();
 await page.waitForFunction(()=>document.querySelector('#dceConsole')?.textContent.includes('DIMENSIA_EDITOR_E2E'),{timeout:12000});
 await page.frameLocator('#dhPreview').locator('button').click();
 assert.equal(await page.frameLocator('#dhPreview').locator('button').getAttribute('data-test'),'yes','Generated JavaScript must execute inside preview');
 assert.ok((await page.locator('#codeEditor').inputValue()).includes('DIMENSIA_EDITOR_E2E'),'Studio full-source editor must sync');
 assert.equal(await page.evaluate(()=>window.DimensiaChatEditor.getState().versions),3,'One original, one CSS and one JS source version');
 await page.locator('#dceUndo').click();
 assert.ok(!(await page.locator('#codeEditor').inputValue()).includes('DIMENSIA_EDITOR_E2E'),'Undo must restore previous source');
 await page.locator('#dceRedo').click();
 assert.ok((await page.locator('#codeEditor').inputValue()).includes('DIMENSIA_EDITOR_E2E'),'Redo must restore JS source');
 await page.locator('#dceClose').click();
 assert.ok(await page.locator('#dcePanel').isHidden(),'Editor must collapse without losing preview');
 await page.locator('#dhRunPreview').click();
 await page.frameLocator('#dhPreview').locator('h1').waitFor();
 checkNoErrors('Chat inline code editor');
 log('Chat editor','HTML CSS JS edit, sandbox run, JS runtime logs, source sync, undo and redo passed');
 await page.setViewportSize({width:390,height:844});
 await page.locator('#dhEdit').evaluate(button=>button.click());
 assert.ok(await page.locator('#dcePanel').isVisible(),'Editor should open on phone');
 const mobileEditor=await page.evaluate(()=>{
  const e=document.querySelector('#dcePanel').getBoundingClientRect(),
   preview=document.querySelector('#dhFrameWrap').getBoundingClientRect();
  return{
   outer:document.documentElement.scrollWidth,viewport:innerWidth,
   editorWidth:Math.round(e.width),editorX:Math.round(e.left),
   previewWidth:Math.round(preview.width),previewX:Math.round(preview.left),
   editorOpen:window.DimensiaChatEditor?.getState().opened
  };
 });
 console.log('[EDITOR MOBILE]',JSON.stringify(mobileEditor));
 assert.ok(mobileEditor.editorOpen&&mobileEditor.editorWidth>240,'Mobile source editor should be usable');
 assert.ok(mobileEditor.outer<=mobileEditor.viewport+2,'Mobile editor causes horizontal overflow: '+JSON.stringify(mobileEditor));
 assert.ok(mobileEditor.editorWidth<=mobileEditor.viewport+2&&mobileEditor.previewWidth<=mobileEditor.viewport+2,'Editor and preview must fit phone');
 await page.locator('#dhEdit').evaluate(button=>button.click());
 await page.setViewportSize({width:1440,height:950});
 log('Chat editor mobile','mobile source editor and preview fit 390px screen');
 await page.locator('#dhSave').click();
 const projectSnapshot=await page.evaluate(()=>localStorage.getItem('dimensia-projects-v1')||'');
 assert.ok(projectSnapshot.includes('Conversation Site E2E'),'Saved project must persist generated source');
 assert.ok((await page.locator('#dhHistory').innerText()).includes('Merhaba'));
 await page.locator('#dhNew').click();
 assert.ok(await page.locator('#dhWelcome').isVisible());
 assert.equal(await page.evaluate(()=>window.DimensiaChatHub.getChats().length),2);
 assert.equal(await page.evaluate(()=>document.body.classList.contains('dh-home-active')),true);
 checkNoErrors('Conversation build and history');
 log('Conversation build','complete HTML build, isolated preview, mobile, project save and history passed');

 await page.locator('[data-nav="settings"]').click();
 await page.locator('#orForget').click();
 assert.equal(await page.locator('#orKey').inputValue(),'');
 const dataKeys=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))));
 assert.ok(!dataKeys.includes('sk-or-test-for-e2e-placeholder'),'OpenRouter key must not be persisted');
 await page.locator('[data-nav="studio"]').click();

 assert.equal(await page.locator('#dimMobileToggle').count(),1,'Accessible manual mobile toggle should be present');
 await page.locator('#dimMobileToggle').click();
 assert.ok(await page.evaluate(()=>document.documentElement.classList.contains('dim-handset')),'Manual phone mode must force responsive layout');
 await page.locator('#openMenu').click();
 assert.ok(await page.locator('#sidebar').evaluate(el=>el.classList.contains('open')),'Mobile menu should open');
 await page.locator('#sidebarScrim').click({position:{x:350,y:100}});
 assert.equal(await page.locator('#sidebar').evaluate(el=>el.classList.contains('open')),false);
 await page.locator('#dimMobileToggle').click();
 assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dim-handset')),false);
 checkNoErrors('Mobile toggle');
 log('Mobile toggle','manual phone layout and navigation open/close passed');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.scrollTo(0,0));
 const offenders=await page.evaluate(()=>{
  const width=window.innerWidth;
  return [...document.querySelectorAll('body *')].map(e=>({el:e.tagName.toLowerCase()+'.'+String(e.className||'').slice(0,70),width:Math.round(e.getBoundingClientRect().width),left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right)})).filter(x=>x.right>width+3&&x.width>0).sort((a,b)=>b.right-a.right).slice(0,18);
 });
 console.log('[MOBILE OFFENDERS]',JSON.stringify(offenders));
 const scroll=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(scroll.scroll<=scroll.inner+2,'Mobile horizontal overflow: '+JSON.stringify(scroll));
 checkNoErrors('Mobile');
 log('Mobile','no horizontal overflow');

 await page.locator('[data-nav="home"]').evaluate(el=>el.click());
 const chatGeometry=await page.evaluate(()=>{
  const root=document.querySelector('#dimensiaChatHub');
  const box=document.querySelector('.dh-composer').getBoundingClientRect();
  return{visible:!!root&&getComputedStyle(root).display!=='none',
   bottom:Math.round(box.bottom),top:Math.round(box.top),
   width:Math.round(box.width),viewport:innerHeight,
   overflow:document.documentElement.scrollWidth-innerWidth,
   root:document.querySelector('#dimensiaChatHub').getBoundingClientRect().toJSON(),
   main:document.querySelector('#dhMain').getBoundingClientRect().toJSON(),
   scroll:document.querySelector('#dhScroll').getBoundingClientRect().toJSON(),
   composerWrap:document.querySelector('.dh-composer-wrap').getBoundingClientRect().toJSON(),
   hidden:document.querySelector('#dhWelcome').hidden};
 });
 console.log('[CHAT MOBILE]',JSON.stringify(chatGeometry));
 assert.ok(chatGeometry.visible,'Chat-first homepage must be visible on mobile');
 assert.ok(chatGeometry.bottom<=chatGeometry.viewport+6,'Chat composer should stay inside phone viewport: '+JSON.stringify(chatGeometry));
 assert.ok(chatGeometry.top>=20,'Chat composer cannot cover the page header');
 assert.ok(chatGeometry.overflow<=2,'Chat UI should not overflow horizontal viewport');
 assert.ok(await page.locator('#dhSend').isVisible());
 log('Chat mobile','mobile 390px composer visible, controls usable, no horizontal overflow');
 await page.locator('[data-nav="studio"]').evaluate(el=>el.click());
 await page.locator('#navPolyglot').evaluate(el=>el.click());
 const polyGeometry=await page.evaluate(()=>{
  const root=document.querySelector('#dimensiaPolyglot').getBoundingClientRect();
  const input=document.querySelector('#polyEditor').getBoundingClientRect();
  const out=document.querySelector('#polyResultGrid').getBoundingClientRect();
  return{viewport:innerWidth,scroll:document.documentElement.scrollWidth,
   workspaceWidth:Math.round(root.width),editorWidth:Math.round(input.width),
   resultWidth:Math.round(out.width),editorVisible:input.height>180}
 });
 console.log('[POLYGLOT MOBILE]',JSON.stringify(polyGeometry));
 assert.ok(polyGeometry.editorVisible,'Polyglot code editor must be visible on phone');
 assert.ok(polyGeometry.scroll<=polyGeometry.viewport+2,'Polyglot workspace horizontal overflow: '+JSON.stringify(polyGeometry));
 assert.ok(polyGeometry.workspaceWidth<=polyGeometry.viewport+2);
 assert.ok(polyGeometry.editorWidth<=polyGeometry.viewport+2);
 log('Polyglot mobile','390px code editing, source file tabs and output cards remain within phone viewport');


 // Android custom tab may report a wider layout viewport than physical screen.
 // This handset emulation verifies that responsive rescue works in desktop-site mode.
 const android=await browser.newContext({
   viewport:{width:980,height:845},screen:{width:393,height:845},
   isMobile:true,hasTouch:true,reducedMotion:'reduce',
   userAgent:'Mozilla/5.0 (Linux; Android 13; Redmi Note 10 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
 });
 const mobile=await android.newPage();
 const mobileErrors=[];
 mobile.on('pageerror',e=>mobileErrors.push(String(e.stack||e)));
 await mobile.goto(base+'/',{waitUntil:'domcontentloaded'});
 await mobile.locator('#dimMobileToggle').waitFor({timeout:12000});
 const metrics=await mobile.evaluate(()=>({
   forced:window.DimensiaMobile?.forced(),inner:innerWidth,screen:screen.width,
   columns:getComputedStyle(document.querySelector('.studio-workspace')).gridTemplateColumns,
   sidebar:getComputedStyle(document.querySelector('#sidebar')).position
 }));
 console.log('[ANDROID SCREEN]',JSON.stringify(metrics));
 assert.ok(metrics.forced,'Android desktop-site mode must activate mobile rescue for 393px physical display');
 assert.equal(metrics.sidebar,'fixed');
 await mobile.locator('[data-nav="studio"]').evaluate(node=>node.click());
 assert.ok(await mobile.locator('#architectStudio').isVisible());
 assert.deepEqual(mobileErrors,[],'Android desktop-site emulation caused page errors');
 log('Android custom tab','physical screen-aware responsive rescue enabled');
 await android.close();



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
