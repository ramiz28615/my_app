/* Collect chat code runner reports in a SEPARATE write-enabled job.
 * Never execute untrusted artifact content. Whitelist fixed JSON fields only.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';

const id=String(process.env.DIMENSIA_RUN_ID||'');
if(!/^r[a-z0-9]{9,35}$/.test(id))throw Error('Invalid chat run identifier');
const languages=['python','bash','perl','php'];
const safe=text=>String(text??'').replace(/sk-or-v1-[a-z0-9_-]{18,}/gi,'[REDACTED-OPENROUTER]')
 .replace(/github_pat_[a-z0-9_]{18,}/gi,'[REDACTED-GITHUB]')
 .replace(/gh[pousr]_[a-z0-9]{20,}/gi,'[REDACTED-GITHUB]')
 .replace(/AKIA[A-Z0-9]{16}/g,'[REDACTED-AWS]').slice(0,6500);
const result={};
for(const lang of languages){
 try{
  const data=await readFile('chat-reports-upload/'+lang+'.json','utf8');
  if(data.length>45000)throw Error('Report too big');
  const item=JSON.parse(data);
  if(item.requestId!==id||item.language!==lang||item.schema!=='dimensia-chat-language-v1')throw Error('Report ID mismatch');
  result[lang]={
   status:['passed','failed','skipped'].includes(item.status)?item.status:'failed',
   label:safe(item.label).slice(0,30),
   exitCode:Number.isSafeInteger(item.exitCode)?item.exitCode:-1,
   stdout:safe(item.stdout),stderr:safe(item.stderr),
   durationMs:Math.max(0,Math.min(180000,Number(item.durationMs)||0)),
   steps:Array.isArray(item.steps)?item.steps.slice(0,4).map(x=>({
    name:safe(x.name).slice(0,40),
    status:x.status==='passed'?'passed':'failed',
    exitCode:Number.isSafeInteger(x.exitCode)?x.exitCode:-1,
    durationMs:Math.max(0,Math.min(60000,Number(x.durationMs)||0))
   })):[]
  };
 }catch(error){
  result[lang]={status:'failed',label:lang,exitCode:-1,stdout:'',
   stderr:'Cloud job did not provide a readable report: '+safe(error?.message||error).slice(0,120),
   durationMs:0,steps:[]};
 }
}
const summary={
 schema:'dimensia-chat-run-v1',requestId:id,
 createdAt:new Date().toISOString(),public:true,
 warning:'GitHub Actions inputs and code output may be visible to other people. Never run private code or credentials.',
 results:result,passed:languages.filter(x=>result[x].status==='passed').length,
 failed:languages.filter(x=>result[x].status==='failed').length,
 skipped:languages.filter(x=>result[x].status==='skipped').length
};
await mkdir('code-lab/chat-reports',{recursive:true});
await writeFile('code-lab/chat-reports/'+id+'.json',JSON.stringify(summary,null,2)+'\n');
console.log('Chat report '+id+': '+summary.passed+' passed, '+summary.failed+' failed, '+summary.skipped+' skipped');
