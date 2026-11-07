import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runner=path.join(root,'scripts/run-polyglot.mjs');
const id='rcontract00';
const executables={javascript:'node',python:'python3',rust:'rustc',bash:'bash',perl:'perl'};
const hasExecutable=name=>spawnSync(name,['--version'],{encoding:'utf8',timeout:4000}).status===0;
const run=(lang,cwd=root)=>spawnSync(process.execPath,[runner,lang],{
 cwd,env:{...process.env,DIMENSIA_RUN_ID:id},timeout:65000,encoding:'utf8'
});
const report=(lang,cwd=root)=>JSON.parse(readFileSync(path.join(cwd,'polyglot-output',lang+'.json'),'utf8'));

test('The seven-language cloud runner emits bounded truthful results on sample files',()=>{
 for(const lang of ['web','javascript','python','rust','bash','perl','reactnative']){
  if(executables[lang]&&!hasExecutable(executables[lang]))continue;
  const result=run(lang);
  assert.equal(result.status,0,lang+' script should complete with a report: '+result.stderr);
  const data=report(lang);
  assert.equal(data.requestId,id);
  assert.equal(data.status,'passed',lang+' sample should pass: '+data.stderr);
  assert.ok(Array.isArray(data.steps));
  if(['javascript','python','rust','bash','perl'].includes(lang)){
   assert.deepEqual(data.contract,{status:'matched',expected:{count:5,sum:15},actual:{count:5,sum:15}},
    lang+' must read the same input and publish matching result');
  }
  assert.ok(data.stdout.length<=12000);
 }
});

test('An incorrect result is recorded as mismatch, not falsely passed',()=>{
 const temp=mkdtempSync(path.join(os.tmpdir(),'dimensia-polyglot-test-'));
 try{
  mkdirSync(path.join(temp,'code-lab','javascript'),{recursive:true});
  mkdirSync(path.join(temp,'code-lab','shared'),{recursive:true});
  writeFileSync(path.join(temp,'code-lab','shared','numbers.txt'),'2 4 6\n');
  writeFileSync(path.join(temp,'code-lab','javascript','main.js'),
   'console.log("DIMENSIA_RESULT:{\\"count\\":3,\\"sum\\":999}");\n');
  const result=run('javascript',temp);
  assert.equal(result.status,0,'Runner should publish a failure report even when the source is incorrect');
  const data=report('javascript',temp);
  assert.equal(data.status,'failed');
  assert.equal(data.contract.status,'mismatch');
  assert.deepEqual(data.contract.expected,{count:3,sum:12});
  assert.deepEqual(data.contract.actual,{count:3,sum:999});
  assert.match(data.stderr,/contract mismatch/i);
 }finally{rmSync(temp,{recursive:true,force:true})}
});

test('A source that does not report the optional data contract is shown honestly',()=>{
 const temp=mkdtempSync(path.join(os.tmpdir(),'dimensia-polyglot-no-contract-'));
 try{
  mkdirSync(path.join(temp,'code-lab','javascript'),{recursive:true});
  mkdirSync(path.join(temp,'code-lab','shared'),{recursive:true});
  writeFileSync(path.join(temp,'code-lab','shared','numbers.txt'),'2 4 6\n');
  writeFileSync(path.join(temp,'code-lab','javascript','main.js'),'console.log("Custom user program");\n');
  assert.equal(run('javascript',temp).status,0);
  assert.equal(report('javascript',temp).status,'passed');
  assert.equal(report('javascript',temp).contract.status,'not-reported');
 }finally{rmSync(temp,{recursive:true,force:true})}
});
