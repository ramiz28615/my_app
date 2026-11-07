/* GitHub Actions cloud reference scanner. Runs entirely on GitHub-hosted Node,
   not on the user's device. Exports metadata only to a PUBLIC repository.
   No raw HTML/CSS/JS or form values are committed. */
import {mkdir,writeFile} from 'node:fs/promises';
import {architectScan} from '../server.mjs';

const target=process.env.TARGET_URL||'';
const id=process.env.REQUEST_ID||'';
if(!/^r[a-zA-Z0-9_-]{10,70}$/.test(id))throw Error('Invalid request id');
if(target.length>1600||!/^https?:\/\//i.test(target))throw Error('Invalid URL');
const url=new URL(target);
if(url.username||url.password)throw Error('Auth credentials forbidden');
const report=await architectScan(url.href,3,6);
for(const page of report.pages||[]){
 delete page.code;
 // Scan metadata can still contain public route names; do not include any live credentials.
 for(const form of page.forms||[]){for(const field of form.fields||[]){delete field.value}}
}
for(const asset of report.assets||[])delete asset.content;
report.kind='github-cloud-public-metadata';
report.notice='Report is public GitHub repository metadata: no original HTML/CSS/JS code was committed. Permissions/rights remain your responsibility.';
report.requestId=id;
const content=JSON.stringify(report,null,2);
if(content.length>440000)throw Error('Report exceeds 440 KB limit');
await mkdir('reports',{recursive:true});
await writeFile('reports/'+id+'.json',content+'\n','utf8');
console.log('Metadata report created: '+id+' · pages '+report.pages.length+' · assets '+report.assets.length);
