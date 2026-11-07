import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const runner=join(root,'scripts/run-chat-code.mjs');
const collector=join(root,'scripts/collect-chat-code.mjs');
const id='rchatunittest1234';
const example={
 python:'print("HELLO_PYTHON")\nprint(sum([1,2,3,4,5]))\n',
 bash:'#!/usr/bin/env bash\nset -eu\nprintf "HELLO_BASH\\n"\nprintf "%s\\n" "$((1+2+3+4+5))"\n',
 perl:'use strict;\nuse warnings;\nprint "HELLO_PERL\\n";\nprint (1+2+3+4+5), "\\n";\n',
 php:'<?php\necho "HELLO_PHP\\n";\necho (1+2+3+4+5)."\\n";\n'
};
const binaries={python:'python3',bash:'bash',perl:'perl',php:'php'};
function supports(language){return spawnSync(binaries[language],['--version'],{encoding:'utf8',timeout:4000}).status===0}
function execute(language,payload,directory){
 const encoded=Buffer.from(JSON.stringify(payload),'utf8').toString('base64');
 const job=spawnSync(process.execPath,[runner,language],{
  cwd:directory,env:{...process.env,DIMENSIA_RUN_ID:id,DIMENSIA_CHAT_PAYLOAD_B64:encoded},
  encoding:'utf8',timeout:45000
 });
 assert.equal(job.status,0,'Runner must write a result, not crash: '+job.stderr);
 const report=JSON.parse(readFileSync(join(directory,'chat-run-output',language+'.json'),'utf8'));
 assert.equal(report.requestId,id);
 assert.equal(report.language,language);
 assert.equal(report.schema,'dimensia-chat-language-v1');
 return report;
}

test('Chat runner executes Python, Bash, Perl and PHP source and returns actual stdout',()=>{
 const dir=mkdtempSync(join(tmpdir(),'dim-chat-langs-'));
 try{
  for(const language of Object.keys(example)){
   if(!supports(language))continue;
   const job=execute(language,example,dir);
   assert.equal(job.status,'passed',language+': '+job.stderr);
   assert.equal(job.exitCode,0);
   assert.ok(job.stdout.includes('HELLO_'+language.toUpperCase()),'Expected actual interpreter stdout: '+language);
   assert.ok(job.stdout.includes('15'),'Expected calculated value: '+language);
   assert.equal(job.steps.length,2);
  }
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('A syntax error is a failed result, not fabricated success',()=>{
 const dir=mkdtempSync(join(tmpdir(),'dim-chat-error-'));
 try{
  if(supports('python')){
   const item=execute('python',{python:'def broken(:\n    pass'},dir);
   assert.equal(item.status,'failed');
   assert.equal(item.steps.length,1);
   assert.ok(/SyntaxError|invalid syntax/.test(item.stderr));
  }
  if(supports('php')){
   const item=execute('php',{php:'<?php\nif (;\n'},dir);
   assert.equal(item.status,'failed');
   assert.ok(/Parse error|syntax error/i.test(item.stderr));
  }
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('Missing snippets are skipped; redacted keys are never executed',()=>{
 const dir=mkdtempSync(join(tmpdir(),'dim-chat-safety-'));
 try{
  const omitted=execute('bash',{python:'print(1)'},dir);
  assert.equal(omitted.status,'skipped');
  if(supports('python')){
   const bad=execute('python',{python:'print("'+('ghp_'+'A'.repeat(26))+'")'},dir);
   assert.equal(bad.status,'failed');
   assert.equal(bad.exitCode,-1);
   assert.ok(!bad.stderr.includes('ghp_'+'A'.repeat(26)));
  }
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('Collector returns one result per interpreter without interpreting user source',()=>{
 const dir=mkdtempSync(join(tmpdir(),'dim-chat-collector-'));
 try{
  mkdirSync(join(dir,'chat-reports-upload'),{recursive:true});
  for(const language of Object.keys(example)){
   const item={
    schema:'dimensia-chat-language-v1',requestId:id,language,
    status:language==='php'?'failed':'passed',label:language,
    exitCode:language==='php'?1:0,
    stdout:language+'_RESULT',stderr:language==='php'?'PHP parse error':'',
    durationMs:25,steps:[{name:'compile',status:'passed',exitCode:0,durationMs:5}]
   };
   writeFileSync(join(dir,'chat-reports-upload',language+'.json'),JSON.stringify(item));
  }
  const processResult=spawnSync(process.execPath,[collector],{cwd:dir,env:{...process.env,DIMENSIA_RUN_ID:id},encoding:'utf8'});
  assert.equal(processResult.status,0,processResult.stderr);
  const doc=JSON.parse(readFileSync(join(dir,'code-lab/chat-reports',id+'.json'),'utf8'));
  assert.equal(doc.schema,'dimensia-chat-run-v1');
  assert.equal(doc.requestId,id);
  assert.equal(doc.passed,3);
  assert.equal(doc.failed,1);
  assert.equal(doc.skipped,0);
  assert.match(doc.results.php.stderr,/parse error/);
  assert.match(doc.results.perl.stdout,/perl_RESULT/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('Public chat execution workflow never grants write permission to untrusted code',()=>{
 const workflow=readFileSync(join(root,'.github/workflows/chat-code-execute.yml'),'utf8');
 assert.ok(workflow.includes('language: [python, bash, perl, php]'));
 assert.match(workflow,/execute:[\s\S]*?permissions:/i); // top-level read-only applies to execute
 assert.ok(workflow.includes('permissions:\n  contents: read'));
 assert.ok(workflow.includes('persist-credentials: false'));
 assert.ok(workflow.includes('publish:'));
 assert.ok(workflow.includes('contents: write'));
 assert.ok(workflow.includes('scripts/collect-chat-code.mjs'));
});
