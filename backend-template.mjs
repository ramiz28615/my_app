/* Dimensia Architect — self-contained LOCAL full-stack starter, no external dependencies.
   WARNING: development only; never expose publicly without authentication, HTTPS,
   abuse limits, CSRF protection and a real database/migration strategy. */
import http from 'node:http';
import {readFile,writeFile,rename} from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

const SITE_HTML=/*DIMENSIA_HTML*/ "<!doctype html><html><head><title>Dimensia</title></head><body><h1>Local project</h1></body></html>";
const CONFIG=/*DIMENSIA_CONFIG*/ {"collection":"items","fields":[{"name":"title","type":"text"},{"name":"done","type":"boolean"}],"routes":[{"method":"GET","path":"/api/hello","response":{"message":"Merhaba"}}]};
const HOST='127.0.0.1';
const PORT=Number(process.env.PORT||5050);
const DB_FILE=path.resolve(process.cwd(),'data-'+CONFIG.collection+'.json');
const MAX_ITEMS=1500;
let queue=Promise.resolve();
function send(res,status,data){
 const text=typeof data==='string'?data:JSON.stringify(data);
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(text);
}
function error(res,status,message){send(res,status,{error:message})}
function sanitizeRow(data,partial=false){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('JSON nesnesi gönderin.');
 const output={};
 for(const field of CONFIG.fields){
  const key=field.name,raw=data[key];
  if(raw===undefined){if(!partial&&field.required)throw Error(key+' alanı zorunlu.');continue}
  if(field.type==='number'){
   if(typeof raw!=='number'||!Number.isFinite(raw))throw Error(key+' sayısal olmalı.');
   output[key]=raw;
  }else if(field.type==='boolean'){
   if(typeof raw!=='boolean')throw Error(key+' boolean olmalı.');
   output[key]=raw;
  }else{
   if(typeof raw!=='string'||raw.length>1200)throw Error(key+' en fazla 1200 karakterlik metin olmalı.');
   output[key]=raw;
  }
 }
 return output;
}
async function loadRows(){
 try{
  const parsed=JSON.parse(await readFile(DB_FILE,'utf8'));
  if(!Array.isArray(parsed))throw Error('Database array corrupted');
  return parsed.slice(0,MAX_ITEMS);
 }catch(e){if(e.code==='ENOENT')return[];throw e}
}
async function saveRows(rows){
 const tmp=DB_FILE+'.tmp';
 await writeFile(tmp,JSON.stringify(rows,null,2),'utf8');
 await rename(tmp,DB_FILE);
}
async function readJSON(req){
 let size=0,parts=[];
 for await(const chunk of req){
  size+=chunk.length;
  if(size>65536)throw Error('İstek en fazla 64 KB olabilir.');
  parts.push(chunk);
 }
 try{return JSON.parse(Buffer.concat(parts).toString('utf8')||'{}')}
 catch{throw Error('Geçersiz JSON gövdesi.')}
}
const paths=new Map(CONFIG.routes.map(x=>[x.method+' '+x.path,x]));
const collection='/api/'+CONFIG.collection;
const allowedOrigin='http://'+HOST+':'+PORT;
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,allowedOrigin);
  const method=req.method||'GET';
  if(!['GET','HEAD','POST','PUT','PATCH','DELETE'].includes(method))return error(res,405,'Method not allowed.');
  if(['POST','PUT','PATCH','DELETE'].includes(method)){
   const origin=req.headers.origin;
   if(origin&&origin!==allowedOrigin)return error(res,403,'Only local same-origin requests allowed.');
  }
  if(url.pathname==='/api/health'&&method==='GET')return send(res,200,{ok:true,service:'dimensia-local',collection:CONFIG.collection});
  const custom=paths.get(method+' '+url.pathname);
  if(custom)return send(res,200,custom.response);
  if(url.pathname===collection){
   if(method==='GET')return send(res,200,{items:await loadRows()});
   if(method==='POST'){
    const body=await readJSON(req),row=sanitizeRow(body);
    queue=queue.catch(()=>{}).then(async()=>{
     const items=await loadRows();
     if(items.length>=MAX_ITEMS)throw Error('Database limit reached');
     const created={id:crypto.randomUUID(),...row,createdAt:new Date().toISOString()};
     items.push(created);await saveRows(items);return created;
    });
    return send(res,201,{item:await queue});
   }
   return error(res,405,'Method not allowed.');
  }
  if(url.pathname.startsWith(collection+'/')){
   const id=url.pathname.slice(collection.length+1);
   if(!/^[0-9a-f-]{36}$/i.test(id))return error(res,400,'Invalid item ID.');
   if(method==='GET'){
    const row=(await loadRows()).find(x=>x.id===id);
    return row?send(res,200,{item:row}):error(res,404,'Not found');
   }
   if(['PATCH','PUT','DELETE'].includes(method)){
    const data=method==='DELETE'?null:sanitizeRow(await readJSON(req),method==='PATCH');
    queue=queue.catch(()=>{}).then(async()=>{
     const items=await loadRows(),idx=items.findIndex(x=>x.id===id);
     if(idx<0)return null;
     const changed=method==='DELETE'?items.splice(idx,1)[0]:Object.assign(items[idx],data);
     await saveRows(items);return changed;
    });
    const row=await queue;
    return row?send(res,200,{item:row}):error(res,404,'Not found');
   }
   return error(res,405,'Method not allowed.');
  }
  if(url.pathname==='/'||url.pathname==='/index.html'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
   return res.end(method==='HEAD'?'':SITE_HTML);
  }
  return error(res,404,'Not found');
 }catch(e){
  return error(res,400,String(e.message||'Bad request').slice(0,180));
 }
});
server.listen(PORT,HOST,()=>console.log('Dimensia Full-stack LOCAL: '+allowedOrigin+' · API: '+collection));
