/* Dimensia polyglot result collector.
 * Executed in a DIFFERENT GitHub Actions job from the user's code.
 * Only fixed JSON keys from uploaded artifacts are allowed; no artifact is executed.
 * Reports are committed to a PUBLIC repo; do not print or submit credentials.
 */
import {mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
const id=process.env.DIMENSIA_RUN_ID||'';
if(!/^r[a-z0-9]{9,35}$/.test(id))throw Error('Invalid result ID');
const languages=['web','javascript','python','rust','bash','perl','reactnative'];
const redact=s=>String(s??'').replace(/sk-or-v1-[a-z0-9_-]{18,}/gi,'[REDACTED-OPENROUTER]')
 .replace(/github_pat_[a-z0-9_]{18,}/gi,'[REDACTED-GITHUB]')
 .replace(/gh[pousr]_[a-z0-9]{20,}/gi,'[REDACTED-GITHUB]')
 .replace(/AKIA[A-Z0-9]{16}/g,'[REDACTED-AWS]').slice(0,8000);
const results={};
for(const lang of languages){
 try{
  const body=await readFile('polyglot-uploads/'+lang+'.json','utf8');
  if(body.length>120000)throw Error('Report too large');
  const p=JSON.parse(body);
  if(p.requestId!==id||p.language!==lang)throw Error('Mismatched report');
  results[lang]={
   status:p.status==='passed'?'passed':'failed',
   label:redact(p.label).slice(0,90),
   durationMs:Math.max(0,Math.min(180000,Number(p.durationMs)||0)),
   steps:Array.isArray(p.steps)?p.steps.slice(0,8).map(x=>({
    step:redact(x.step).slice(0,100),status:x.status==='passed'?'passed':'failed',
    exitCode:Math.max(-1,Math.min(255,Number(x.exitCode)||0)),
    ms:Math.max(0,Math.min(180000,Number(x.ms)||0))
   })):[],
   stdout:redact(p.stdout),stderr:redact(p.stderr),
   contract:(()=>{
     const raw=p.contract||{};
     const status=['matched','mismatch','not-reported','not-run','invalid'].includes(raw.status)?raw.status:'not-reported';
     const pair=x=>x&&Number.isSafeInteger(x.count)&&Number.isSafeInteger(x.sum)
       ?{count:x.count,sum:x.sum}:null;
     return{status,expected:pair(raw.expected),actual:pair(raw.actual),...(raw.detail?{detail:redact(raw.detail).slice(0,140)}:{})};
   })()
  };
 }catch(e){results[lang]={status:'missing',label:lang,durationMs:0,steps:[],stdout:'',
   stderr:'GitHub Actions job did not publish a readable report: '+redact(e.message).slice(0,180)}}
}
const succeeded=languages.filter(x=>results[x].status==='passed').length;
const matched=languages.filter(x=>results[x].contract?.status==='matched').length;
const mismatch=languages.filter(x=>results[x].contract?.status==='mismatch').length;
const unreported=languages.filter(x=>results[x].contract?.status==='not-reported').length;
const summary={
 schema:'dimensia-polyglot-v1',requestId:id,generatedAt:new Date().toISOString(),
 public:true,notice:'Reports and source code are public GitHub repository content. Never include credentials.',
 jobs:results,
 total:languages.length,passed:succeeded,failed:languages.length-succeeded,
 sharedContract:{matched,mismatch,unreported,expected:results.python?.contract?.expected||null}
};
await mkdir('code-lab/reports',{recursive:true});
await writeFile('code-lab/reports/'+id+'.json',JSON.stringify(summary,null,2)+'\n','utf8');
console.log('Report created: '+id+' · passed '+succeeded+'/'+languages.length);
