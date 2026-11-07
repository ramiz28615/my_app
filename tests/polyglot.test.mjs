import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,rmSync,mkdirSync} from 'node:fs';

const ROOT=new URL('../',import.meta.url).pathname;
const ID='rtest1234567890';
const jobs=['javascript','python','rust','bash','perl','web','reactnative'];
test('Polyglot GitHub-hosted runner produces truthful status/output for all seven jobs',()=>{
 for(const language of jobs){
  const result=spawnSync('node',['scripts/run-polyglot.mjs',language],{
   cwd:ROOT,encoding:'utf8',timeout:25000,
   env:{...process.env,DIMENSIA_RUN_ID:ID}
  });
  assert.equal(result.status,0,'Runner should finish and save status, even when code fails: '+language+'\n'+result.stderr);
  const report=JSON.parse(readFileSync(ROOT+'polyglot-output/'+language+'.json','utf8'));
  assert.equal(report.requestId,ID);
  assert.equal(report.language,language);
  assert.equal(report.status,'passed',language+' sample failed: '+JSON.stringify(report,null,2));
  assert.ok(typeof report.stdout==='string');
  assert.ok(Number.isFinite(report.durationMs));
  if(['javascript','python','rust','bash','perl'].includes(language)){
   assert.ok(report.stdout.includes('Merhaba Dimensia'),'Missing actual runtime output for '+language);
   assert.equal(report.steps.at(-1).exitCode,0);
  }
 }
});
test('Python/Rust/Perl/Bash cloud report includes no secret authorization environment',()=>{
 const runner=readFileSync(ROOT+'scripts/run-polyglot.mjs','utf8');
 assert.ok(runner.includes('env:safeEnv'),'Child process environment must be restricted');
 assert.ok(!runner.includes('GITHUB_TOKEN:'),'No token injected to child runners');
 assert.ok(!runner.includes('OPENROUTER_API_KEY:'),'No OpenRouter key injected');
 const workflow=readFileSync(ROOT+'.github/workflows/polyglot-execute.yml','utf8');
 assert.ok(workflow.includes('persist-credentials: false'));
 assert.ok(workflow.includes('contents: read'));
 assert.ok(workflow.includes('contents: write'));
 assert.ok(workflow.includes('workflow_dispatch:'));
 assert.ok(workflow.includes('matrix:'));
});
test('Cloud collector creates valid report with seven per-language statuses',async()=>{
 const {cpSync,mkdirSync,rmSync}=await import('node:fs');
 mkdirSync(ROOT+'polyglot-uploads',{recursive:true});
 for(const language of jobs){
  cpSync(ROOT+'polyglot-output/'+language+'.json',ROOT+'polyglot-uploads/'+language+'.json');
 }
 const result=spawnSync('node',['scripts/publish-polyglot.mjs'],{
  cwd:ROOT,encoding:'utf8',timeout:18000,env:{...process.env,DIMENSIA_RUN_ID:ID}
 });
 assert.equal(result.status,0,'Collector should produce report: '+result.stderr);
 const report=JSON.parse(readFileSync(ROOT+'code-lab/reports/'+ID+'.json','utf8'));
 assert.equal(report.requestId,ID);
 assert.equal(report.schema,'dimensia-polyglot-v1');
 assert.equal(report.total,7);
 assert.equal(report.passed,7);
 assert.equal(report.failed,0);
 for(const language of jobs)assert.equal(report.jobs[language].status,'passed');
 rmSync(ROOT+'polyglot-output',{recursive:true,force:true});
 rmSync(ROOT+'polyglot-uploads',{recursive:true,force:true});
 rmSync(ROOT+'code-lab/reports/'+ID+'.json',{force:true});
});
