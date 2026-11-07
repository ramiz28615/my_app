import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const port=31087;
let child;
async function setup(){
 child=spawn(process.execPath,['server.mjs'],{
  cwd:process.cwd(),
  env:{...process.env,PORT:String(port),HOST:'127.0.0.1'},
  stdio:['ignore','pipe','pipe']
 });
 await new Promise((resolve,reject)=>{
  let done=false;
  const timer=setTimeout(()=>{if(!done)reject(Error('server timeout'))},5000);
  child.stdout.once('data',()=>{if(!done){done=true;clearTimeout(timer);resolve()}});
  child.once('error',reject);
  child.once('exit',code=>{if(!done){clearTimeout(timer);reject(Error('server exited '+code))}});
 });
}
await setup();
const base='http://127.0.0.1:'+port;
test.after(()=>child.kill('SIGTERM'));
test('Main page, CSS and JS are served',async()=>{
 for(const item of ['/','/studio-enhancements.css','/studio-reference.js','/studio-devtools.js','/studio-re.css','/studio-re-engineer.js','/studio-flow.js','/studio-launchpad.js','/studio-launchpad.css','/studio-mobile-fix.css','/studio-mobile-fix.js','/studio-architect.js','/studio-architect.css','/studio-code-lab.js','/studio-ai-agent.js']){
  const response=await fetch(base+item);
  assert.equal(response.status,200,item);
  assert.ok((await response.text()).length>100,item);
 }
});
test('API status reports URL analysis capability',async()=>{
 const res=await fetch(base+'/api/status');
 const data=await res.json();
 assert.equal(res.status,200);assert.equal(data.urlImport,true);
});
test('Rejects private localhost targets (SSRF)',async()=>{
 const res=await fetch(base+'/api/inspect?url='+encodeURIComponent('http://127.0.0.1:80/admin'));
 assert.equal(res.status,422);
 const data=await res.json();assert.ok(data.error);
});
test('Rejects invalid schemes',async()=>{
 const res=await fetch(base+'/api/inspect?url='+encodeURIComponent('file:///etc/passwd'));
 assert.equal(res.status,422);
});
test('Public repository site includes module references',async()=>{
 const source=await readFile('index.html','utf8');
 assert.ok(source.includes('studio-reference.js'));
 assert.ok(source.includes('studio-devtools.js'));
 assert.ok(source.includes('studio-enhancements.css'));
 assert.ok(source.includes('studio-re.css'));
 assert.ok(source.includes('studio-re-engineer.js'));
 assert.ok(source.includes('studio-flow.js'));
 assert.ok(source.includes('studio-launchpad.js'));
 assert.ok(source.includes('studio-launchpad.css'));
 assert.ok(source.includes('studio-mobile-fix.css'));
 assert.ok(source.includes('studio-mobile-fix.js'));
 assert.match(source,/studio-mobile-fix\.js\?v=5\.2\.1/);
 assert.match(source,/studio-launchpad\.js\?v=4\.1\.1/)
 assert.ok(source.includes('DimensiaDevTools.instrument'));
});

test('Source endpoint requires valid kind and public URL',async()=>{
 const badKind=await fetch(base+'/api/source?kind=php&url=https%3A%2F%2Fexample.com');
 assert.equal(badKind.status,400);
 const block=await fetch(base+'/api/source?kind=html&url='+encodeURIComponent('http://127.0.0.1:'+port+'/index.html'));
 assert.equal(block.status,422);
});
test('Source endpoint blocks local and metadata hostnames',async()=>{
 const urls=['http://localhost/private','http://169.254.169.254/latest/meta-data/','http://10.0.0.1','http://[::1]/private'];
 for(const u of urls){
  const response=await fetch(base+'/api/source?kind=js&url='+encodeURIComponent(u));
  assert.equal(response.status,422,u);
 }
});
test('Source editor and RE features are present in delivered asset',async()=>{
 const [js,css]=await Promise.all([
  fetch(base+'/studio-re-engineer.js').then(x=>x.text()),
  fetch(base+'/studio-re.css').then(x=>x.text())
 ]);
 for(const marker of ['Görsel Editör','Kaynak Kodları','Sürüm','AI Revizyon','data-retab','reOwnership','sourceFiles']){
   assert.ok(js.includes(marker),'Missing: '+marker);
 }
 assert.ok(css.includes('.re-workspace'));
});

test('Flow recorder captures preview-only interactions without form values',async()=>{
 const js=await fetch(base+'/studio-flow.js').then(r=>r.text());
 for(const phrase of ['DIMENSIA_FLOW_BRIDGE','DIMENSIA_FLOW_CONTROL','flowRecord','flowReplay','flowExport','Form gönderme','Yalnızca tıklama']){
  assert.ok(js.includes(phrase),'Missing flow feature: '+phrase);
 }
 assert.equal(js.includes('input.value'),false,'Flow recorder must not store typed form values.');
});

test('Regression: runtime modules must be loaded AFTER the main inline app script',async()=>{
 const src=await readFile('index.html','utf8');
 const mainStart=src.indexOf('const $=(id)=>document.getElementById(id)');
 assert.ok(mainStart>0,'App runtime marker missing');
 const inlineEnd=src.indexOf('</script>',mainStart);
 assert.ok(inlineEnd>mainStart,'App script must close');
 for(const module of ['studio-devtools.js','studio-reference.js','studio-re-engineer.js','studio-flow.js','studio-launchpad.js','studio-architect.js','studio-code-lab.js','studio-ai-agent.js','studio-mobile-fix.js']){
  const importPos=src.indexOf('src="./'+module);
  assert.ok(importPos>inlineEnd,module+' incorrectly injected inside an inline <script> block');
 }
 const edit=src.slice(src.indexOf("codeEditor').addEventListener('input'"),src.indexOf('function setWidth'));
 assert.ok(edit.includes('DimensiaDevTools'),'Code-editor updates must keep preview inspector instrumentation');
});

test('Launchpad publishing UI and credentials safety',async()=>{
 const content=await readFile('studio-launchpad.js','utf8');
 for(const label of ['launchToken','launchConnect','launchPublish','launchCheck','launchPreviewFrame','launchSites','launchConfirm','api.github.com','toBase64','sites/','window.DimensiaLaunchpad']){
  assert.ok(content.includes(label),'Missing Launchpad feature '+label);
 }
 assert.ok(content.includes('input type')===false||content.includes('type="password"'));
 assert.ok(!/localStorage\.setItem\([^,]*,\s*accessToken/.test(content),'Token must not be placed in localStorage.');
 assert.ok(content.includes('github_pat_'),'Secret scanner must detect GitHub tokens in generated HTML.');
 assert.ok(content.includes('accessToken='),'Token state must be session-scoped.');
});


test('Mobile recovery and CORS fallback assets serve correct safe UI',async()=>{
 const [mobileCSS,mobileJS,architect]=await Promise.all([
  fetch(base+'/studio-mobile-fix.css').then(r=>r.text()),
  fetch(base+'/studio-mobile-fix.js').then(r=>r.text()),
  fetch(base+'/studio-architect.js').then(r=>r.text())
 ]);
 assert.ok(mobileCSS.includes('.topbar .top-actions{display:none!important;}'),'Mobile topbar overflow correction must be present.');
 assert.ok(mobileJS.includes('dimensia-mobile-override'),'Manual responsive override must be available.');
 for(const phrase of ['archFallback','showFallback','Tarayıcı','GitHub Bulut Tarama','HTML Dosyası Yükle','HTML Yapıştır']){
  assert.ok(architect.includes(phrase),'Missing URL fallback option: '+phrase);
 }
});

test('OpenRouter API diagnostics separate key verification, model completion and no-backend GitHub Pages',async()=>{
 const [html,reference]=await Promise.all([readFile('index.html','utf8'),readFile('studio-reference.js','utf8')]);
 for(const marker of ['id="orCheck"','id="orReplyTest"','id="orRefresh"','/api/v1/key','/api/v1/chat/completions','/api/v1/models']){
  assert.ok(reference.includes(marker),'Missing OpenRouter diagnostic feature: '+marker);
 }
 assert.ok(reference.includes('reasoning_tokens'),'Empty completion should explain reasoning-token exhaustion');
 assert.ok(reference.includes('Math.max(512'),'Small model test must allow enough completion tokens');
 assert.ok(reference.includes("pricing.prompt")&&reference.includes("pricing.completion"),'Only zero-priced model variants should be listed');
 assert.ok(html.includes('OpenRouter bağlantı durumu'),'Legacy backend status card should be corrected');
 assert.ok(!html.includes('API sunucusuna ulaşılamıyor. Yerel şablon motoru'),'Legacy Node warning must not claim OpenRouter is offline');
 assert.ok(!/sk-or-v1-[a-f0-9]{40,}/i.test(reference),'No actual-looking OpenRouter API keys in public source.');
});


test('Chat-first homepage remains separate from legacy Studio without storing any API key',async()=>{
 const [html,chat,css]=await Promise.all([
  readFile('index.html','utf8'),
  readFile('studio-chat.js','utf8'),
  readFile('studio-chat.css','utf8')
 ]);
 assert.ok(html.includes('studio-chat.js?v=6.0.2')&&html.includes('studio-chat.css?v=6.0.2'));
 assert.ok(html.includes('id="page-home"')&&html.includes('id="page-studio"'),'Legacy sections must stay');
 for(const id of ['dimensiaChatHub','dhConversation','dhInput','dhSend','dhNewSide','dhHistory','dhModeBuild','dhPreview','dhSave','dhPublish']){
  assert.ok(chat.includes(id),'Missing chat feature '+id);
 }
 assert.ok(chat.includes('window.DimensiaOpenRouter.ask'),'Chat must use the established provider');
 assert.ok(chat.includes('sandbox="allow-scripts allow-forms"'),'Generated HTML must use sandboxed preview');
 assert.ok(css.includes('body.dh-home-active .main-content'),'Chat should replace homepage styling only');
 assert.ok(css.includes('.dh-shell [hidden]'),'Hidden state must be respected');
 assert.ok(!/sk-or-v1-[a-z0-9]{40,}/i.test(chat),'Never embed user API key in chat UI');
});


test('Inline web IDE is linked, sandboxed and validates HTML before live execution',async()=>{
 const [html,js,css]=await Promise.all([
  readFile('index.html','utf8'),
  readFile('studio-chat-editor.js','utf8'),
  readFile('studio-chat-editor.css','utf8')
 ]);
 assert.ok(html.includes('studio-chat-editor.js?v=6.1.0'));
 assert.ok(html.includes('studio-chat-editor.css?v=6.1.0'));
 for(const id of ['dcePanel','dceRun','dceSource','dceUndo','dceRedo','dceConsole','dceAuto','dceDownload','dhRunPreview']){
  assert.ok(js.includes(id),'Missing inline web IDE control: '+id);
 }
 assert.ok(js.includes('updateArtifact(complete)'),'Editor must commit source through ChatHub');
 assert.ok(js.includes('renderLogs()'),'Editor must show execution logs');
 assert.ok(js.includes('sandboxed preview iframe'),'Source runtime must stay sandboxed');
 assert.ok(css.includes('.dh-artifact.editor-open .dh-artifact-window'));
 assert.ok(js.includes('channel!==')&&js.includes('DIMENSIA_PREVIEW_V1'),'Only trusted preview window debug messages may be logged');
 assert.ok(!/sk-or-v1-[A-Za-z0-9_-]{40,}/.test(js),'Never embed OpenRouter API secrets in editor source');
});
