/* Dimensia Cloud Execution Engine 7.0 — runs ONLY in an isolated GitHub-hosted runner.
 * Untrusted code receives no GitHub token, no repository secrets and a restricted env.
 * Do not run this service on a multi-tenant server without stronger sandboxing.
 */
import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';

const lang=process.argv[2]||'';
const id=process.env.DIMENSIA_RUN_ID||'';
if(!/^r[a-z0-9]{9,35}$/.test(id))throw Error('Invalid run ID');
const runners={
 javascript:{name:'JavaScript · Node 22',file:'code-lab/javascript/main.js',steps:[
  ['Node syntax','node',['--check','code-lab/javascript/main.js']],
  ['Run JavaScript','node',['code-lab/javascript/main.js']]
 ]},
 python:{name:'Python 3',file:'code-lab/python/main.py',steps:[
  ['Python compile','python3',['-m','py_compile','code-lab/python/main.py']],
  ['Run Python','python3',['-I','code-lab/python/main.py']]
 ]},
 rust:{name:'Rust',file:'code-lab/rust/main.rs',steps:[
  ['Rust compile','rustc',['--edition=2021','code-lab/rust/main.rs','-o','/tmp/dimensia-'+id]],
  ['Run Rust','/tmp/dimensia-'+id,[]]
 ]},
 bash:{name:'Bash',file:'code-lab/bash/main.sh',steps:[
  ['Bash syntax','bash',['-n','code-lab/bash/main.sh']],
  ['Run Bash','bash',['code-lab/bash/main.sh']]
 ]},
 perl:{name:'Perl',file:'code-lab/perl/main.pl',steps:[
  ['Perl compile','perl',['-c','code-lab/perl/main.pl']],
  ['Run Perl','perl',['code-lab/perl/main.pl']]
 ]},
 web:{name:'HTML / CSS · Statik kontrol',file:'code-lab/html/index.html',steps:[]},
 reactnative:{name:'React Native · Proje kontrolü',file:'code-lab/reactnative/App.js',steps:[]}
};
if(!Object.hasOwn(runners,lang))throw Error('Not a supported language');
const job=runners[lang];
const root=process.cwd(),started=Date.now(),outputDir=join(root,'polyglot-output');
const sanitize=text=>String(text||'').replace(/sk-or-v1-[a-z0-9_-]{18,}/gi,'[REDACTED-OPENROUTER]')
 .replace(/github_pat_[a-z0-9_]{18,}/gi,'[REDACTED-GITHUB]')
 .replace(/gh[pousr]_[a-z0-9]{20,}/gi,'[REDACTED-GITHUB]')
 .replace(/AKIA[A-Z0-9]{16}/g,'[REDACTED-AWS]')
 .slice(0,12000);
const safeEnv={
 PATH:process.env.PATH||'/usr/bin:/bin',
 HOME:'/tmp',TMPDIR:'/tmp',LANG:'C.UTF-8',
 CI:'true',RUST_BACKTRACE:'1',
 PYTHONDONTWRITEBYTECODE:'1'
};
let status='passed',out='',err='',completed=[];
const step=(label,cmd,args)=>{
 const t=Date.now();
 const r=spawnSync(cmd,args,{
  cwd:root,env:safeEnv,timeout:45000,killSignal:'SIGKILL',
  encoding:'utf8',maxBuffer:180000,windowsHide:true
 });
 const message=sanitize(r.stdout),failure=sanitize(r.stderr);
 out=(out+(out?'\n':'')+'# '+label+'\n'+message).slice(0,15000);
 err=(err+(err?'\n':'')+(failure?'# '+label+'\n'+failure:'')).slice(0,15000);
 const ok=!r.error&&r.status===0;
 completed.push({step:label,status:ok?'passed':'failed',exitCode:r.status??-1,ms:Date.now()-t});
 if(!ok){status='failed';err=(err+'\n'+sanitize(r.error?.message||'Command failed with '+r.status)).slice(0,15000)}
 return ok;
};
try{
 const resolved=resolve(root,job.file);
 if(!resolved.startsWith(root+'/'))throw Error('Source path escapes working tree');
 const bytes=statSync(resolved).size;
 if(bytes>100000)throw Error('Source file exceeds 100 KB');
 if(lang==='web'){
  const html=readFileSync(resolved,'utf8');
  const css=readFileSync('code-lab/css/style.css','utf8');
  const valid=/<!doctype html/i.test(html)&&/<html\b/i.test(html)&&/<body\b/i.test(html)&&/<\/html>/i.test(html);
  status=valid?'passed':'failed';
  out='HTML/CSS files inspected (no browser JS execution in Actions)\nHTML size: '+bytes+' bytes\nCSS size: '+Buffer.byteLength(css)+' bytes\nHTML5 structure: '+(valid?'OK':'FAIL');
  completed=[{step:'HTML5/CSS presence',status:valid?'passed':'failed',exitCode:valid?0:1,ms:Date.now()-started}];
 }else if(lang==='reactnative'){
  const source=readFileSync(resolved,'utf8'),pkg=JSON.parse(readFileSync('code-lab/reactnative/package.json','utf8'));
  const valid=source.includes('export default')&&!!pkg.dependencies?.expo&&!!pkg.dependencies?.['react-native'];
  status=valid?'passed':'failed';
  out='React Native / Expo scaffold: '+(valid?'OK':'FAIL')+'\nNo APK compiled; use Expo/EAS Build for native packaging.';
  completed=[{step:'Expo scaffold check',status:valid?'passed':'failed',exitCode:valid?0:1,ms:Date.now()-started}];
 }else{
  for(const [label,cmd,args] of job.steps)if(!step(label,cmd,args))break;
 }
}catch(e){status='failed';err=(err+'\n'+sanitize(e?.message||e)).slice(0,15000)}
const report={requestId:id,language:lang,label:job.name,
 status,startedAt:new Date(started).toISOString(),durationMs:Date.now()-started,
 steps:completed,stdout:sanitize(out),stderr:sanitize(err)};
mkdirSync(outputDir,{recursive:true});
writeFileSync(join(outputDir,lang+'.json'),JSON.stringify(report,null,2)+'\n');
console.log('Dimensia '+lang+': '+status+' · '+report.durationMs+'ms (full details in artifact)');
