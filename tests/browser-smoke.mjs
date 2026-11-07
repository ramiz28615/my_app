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
 await page.locator('#rePick').click();
 await button.click();
 await page.locator('#reText').waitFor({timeout:9000});
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

 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.scrollTo(0,0));
 const scroll=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(scroll.scroll<=scroll.inner+2,'Mobile horizontal overflow: '+JSON.stringify(scroll));
 checkNoErrors('Mobile');
 log('Mobile','no horizontal overflow');

 await page.close();
 console.log('PASS: full browser smoke suite');
}catch(e){
 console.error('FAIL: browser smoke suite: '+(e.stack||e));
 process.exitCode=1;
}finally{
 await browser?.close();
 child.kill('SIGTERM');
}
