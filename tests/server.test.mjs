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
 for(const item of ['/','/studio-enhancements.css','/studio-reference.js','/studio-devtools.js','/studio-re.css','/studio-re-engineer.js']){
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
