/* Dimensia Chat Code Runner 8.0.2
 * GitHub-hosted Ubuntu worker only; code is executed in a temporary directory.
 * Job has read-only repo permission, no checkout credentials and no forwarded secrets.
 * This is NOT a hardened untrusted-code sandbox (runner has filesystem/network access).
 */
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const lang=String(process.argv[2]||'');
const id=String(process.env.DIMENSIA_RUN_ID||'');
const languages={
 python:{file:'main.py',name:'Python 3',steps:[['Python syntax','python3',['-I','-m','py_compile','main.py']],['Python execute','python3',['-I','-B','main.py']]]},
 bash:{file:'main.sh',name:'Bash',steps:[['Bash syntax','bash',['-n','main.sh']],['Bash execute','bash',['--noprofile','--norc','main.sh']]]},
 perl:{file:'main.pl',name:'Perl 5',steps:[['Perl syntax','perl',['-c','main.pl']],['Perl execute','perl',['main.pl']]]},
 php:{file:'main.php',name:'PHP 8.3',steps:[['PHP syntax','php',['-l','main.php']],['PHP execute','php',['-d','allow_url_fopen=0','main.php']]]},
 javascript:{file:'main.js',name:'JavaScript / Node.js',steps:[['JavaScript syntax','node',['--check','main.js']],['Node.js execute','node',['main.js']]]},
 rust:{file:'main.rs',name:'Rust',steps:[['Rust compile','rustc',['--edition=2021','-C','opt-level=0','-o','chat_app','main.rs']],['Rust execute','./chat_app',[]]]}
};
if(!/^r[a-z0-9]{9,35}$/.test(id)||!Object.hasOwn(languages,lang))throw Error('Unsupported run ID or language');
const safe=text=>String(text??'').replace(/sk-or-v1-[a-z0-9_-]{18,}/gi,'[REDACTED-OPENROUTER]')
 .replace(/github_pat_[a-z0-9_]{18,}/gi,'[REDACTED-GITHUB]')
 .replace(/gh[pousr]_[a-z0-9]{20,}/gi,'[REDACTED-GITHUB]')
 .replace(/AKIA[A-Z0-9]{16}/g,'[REDACTED-AWS]').slice(0,9000);
const start=Date.now(),runner=languages[lang];
let output={schema:'dimensia-chat-language-v1',requestId:id,language:lang,label:runner.name,
 status:'failed',exitCode:-1,stdout:'',stderr:'',durationMs:0,steps:[]};
let folder='';
const outDir=join(process.cwd(),'chat-run-output');
try{
 let encoded=process.env.DIMENSIA_CHAT_PAYLOAD_B64;
 if(encoded===undefined){
  const eventPath=process.env.GITHUB_EVENT_PATH;
  if(!eventPath)throw Error('Missing GitHub event payload');
  const event=JSON.parse(readFileSync(eventPath,'utf8'));
  encoded=event.inputs?.sources_b64;
 }
 if(typeof encoded!=='string'||encoded.length>58000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw Error('Invalid or oversized encoded source payload');
 const bytes=Buffer.from(encoded,'base64');
 if(bytes.length>38000)throw Error('Decoded chat sources exceed 38 KB');
 const body=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 const payload=JSON.parse(body);
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Expected a language-to-source JSON object');
 let text=payload[lang];
 if(text===undefined||text===null||text===''){
  output.status='skipped';output.exitCode=0;
  output.stdout='No '+runner.name+' code included in this chat request.';
 }else{
  if(typeof text!=='string'||Buffer.byteLength(text,'utf8')>10000)throw Error('Source must be plain text smaller than 10 KB');
  if(/(?:sk-or-v1-[a-z0-9_-]{18,}|github_pat_[a-z0-9_]{18,}|gh[pousr]_[a-z0-9]{20,}|AKIA[A-Z0-9]{16})/i.test(text))
   throw Error('Possible secret detected: source was not executed');
  if(lang==='php'&&!/<\?(?:php|=|\s)/i.test(text))text='<?php\n'+text;
  folder=mkdtempSync(join(tmpdir(),'dimensia-chat-run-'));
  writeFileSync(join(folder,runner.file),text,{mode:0o600});
  const safeEnv={
   PATH:process.env.PATH||'/usr/local/bin:/usr/bin:/bin',HOME:folder,TMPDIR:folder,
   LANG:'C.UTF-8',LC_ALL:'C.UTF-8',PYTHONNOUSERSITE:'1',PYTHONDONTWRITEBYTECODE:'1',
   COMPOSER_DISABLE_XDEBUG_WARN:'1',
   ...(lang==='rust'?{RUSTUP_HOME:process.env.RUSTUP_HOME||join(process.env.HOME||'/home/runner','.rustup')}:{}),
  };
  output.status='passed';
  for(const [label,command,args] of runner.steps){
   const t=Date.now();
   const result=spawnSync(command,args,{
    cwd:folder,env:safeEnv,encoding:'utf8',timeout:20000,
    maxBuffer:120000,killSignal:'SIGKILL',windowsHide:true
   });
   const code=result.status??-1,ok=!result.error&&code===0;
   const stdout=safe(result.stdout),stderr=safe(result.stderr);
   output.stdout=(output.stdout+(stdout?'# '+label+'\n'+stdout+'\n':'')).slice(0,9000);
   output.stderr=(output.stderr+(stderr?'# '+label+'\n'+stderr+'\n':'')).slice(0,9000);
   output.steps.push({name:label,status:ok?'passed':'failed',exitCode:code,durationMs:Date.now()-t});
   output.exitCode=code;
   if(!ok){
    output.status='failed';
    output.stderr=safe(output.stderr+'\n'+(result.error?.message||'Exited with code '+code));
    break;
   }
  }
 }
}catch(error){
 output.status='failed';output.exitCode=-1;
 output.stderr=safe(output.stderr+'\nRunner error: '+(error?.message||error));
}finally{
 if(folder)rmSync(folder,{recursive:true,force:true});
 output.durationMs=Date.now()-start;
 mkdirSync(outDir,{recursive:true});
 writeFileSync(join(outDir,lang+'.json'),JSON.stringify(output,null,2)+'\n');
 console.log('Dimensia Chat '+lang+': '+output.status+' ('+output.durationMs+' ms), see artifact for details');
}
