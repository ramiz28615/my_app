/* Dimensia Native / Expo APK Studio 8.3.
 * Expo source stays on-device until explicitly exported. Android builds run interactively in Colab.
 */
(()=>{
'use strict';
const chat=document.getElementById('dhConversation'),hub=window.DimensiaChatHub;
if(!chat||!hub)return;
const $=id=>document.getElementById(id);
const KEY='dimensia-native-chat-projects-v1',LIMIT=260000;
const NOTEBOOK='https://colab.research.google.com/github/ramiz28615/my_app/blob/main/notebooks/dimensia_apk_builder.ipynb';
const SENSITIVE=/(?:sk-or-v1-[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{17,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})/i;
const APP="import React, { useState } from 'react';\nimport { SafeAreaView, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <SafeAreaView style={styles.screen}>\n      <ScrollView contentContainerStyle={styles.content}>\n        <Text style={styles.eyebrow}>DIMENSIA AI</Text>\n        <Text style={styles.title}>Merhaba Android!</Text>\n        <Text style={styles.description}>React Native projen burada. Kodu sohbetten değiştirebilir, ZIP indirip Colab'da APK derleyebilirsin.</Text>\n        <View style={styles.card}>\n          <Text style={styles.number}>{count}</Text>\n          <Pressable accessibilityRole=\"button\" style={styles.button} onPress={() => setCount(count + 1)}>\n            <Text style={styles.buttonText}>Sayacı artır</Text>\n          </Pressable>\n        </View>\n      </ScrollView>\n    </SafeAreaView>\n  );\n}\nconst styles = StyleSheet.create({\n  screen: { flex: 1, backgroundColor: '#101828' },\n  content: { flexGrow: 1, justifyContent: 'center', padding: 26 },\n  eyebrow: { color: '#79D6C3', fontWeight: 'bold', letterSpacing: 4, marginBottom: 12 },\n  title: { color: '#F9FAFB', fontSize: 32, fontWeight: 'bold', marginBottom: 15 },\n  description: { color: '#D0D5DD', fontSize: 16, lineHeight: 25, marginBottom: 30 },\n  card: { backgroundColor: '#1D2939', borderRadius: 19, padding: 24, alignItems: 'center' },\n  number: { color: '#FFFFFF', fontSize: 56, marginBottom: 15 },\n  button: { backgroundColor: '#73CCBC', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center' },\n  buttonText: { color: '#101828', fontWeight: 'bold' }\n});";
const cleanName=x=>String(x||'Dimensia Mobil').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,64)||'Dimensia Mobil';
const bytes=x=>new TextEncoder().encode(x).length;
function hash(text){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function defaults(chatId,name){
 const h=hash(chatId),pkg={name:'dimensia-mobile-'+h,version:'1.0.0',private:true,
  main:'node_modules/expo/AppEntry.js',scripts:{start:'expo start',android:'expo run:android'},
  dependencies:{expo:'~54.0.0',react:'19.1.0','react-native':'0.81.5'},
  devDependencies:{'babel-preset-expo':'~54.0.0'}};
 const config={expo:{name:cleanName(name),slug:'dimensia-'+h,version:'1.0.0',orientation:'portrait',
  userInterfaceStyle:'automatic',android:{package:'com.dimensia.app'+h}}};
 return{name:cleanName(name),entry:'App.js',updatedAt:Date.now(),files:{
  'App.js':APP,'app.json':JSON.stringify(config,null,2)+'\n',
  'package.json':JSON.stringify(pkg,null,2)+'\n',
  'babel.config.js':"module.exports = function(api) { api.cache(true); return {presets:['babel-preset-expo']}; };\n",
  'eas.json':JSON.stringify({build:{preview:{distribution:'internal',android:{buildType:'apk'}}}},null,2)+'\n',
  'README.md':'# Dimensia Android\n\nExpo SDK 54 React Native uygulaması.\n\nAPK için ZIP indir, Colab not defterine yükle, tüm hücreleri çalıştır.\n'
 }};
}
let projects={};
try{
 const data=JSON.parse(localStorage.getItem(KEY)||'{}');
 if(data&&typeof data==='object'&&!Array.isArray(data)){
  for(const [id,p] of Object.entries(data)){
   if(!/^dh-[\w-]{1,85}$/.test(id)||!p?.files||typeof p.files!=='object')continue;
   const base=defaults(id,p.name),allowed=['App.js','App.tsx','app.json','package.json','babel.config.js','eas.json','tsconfig.json','README.md'];
   const entry=p.entry==='App.tsx'?'App.tsx':'App.js';
   if(entry==='App.tsx'){delete base.files['App.js'];base.files['App.tsx']=APP}
   for(const [file,content] of Object.entries(p.files))
    if(allowed.includes(file)&&typeof content==='string'&&bytes(content)<LIMIT)base.files[file]=content;
   projects[id]={...base,entry,name:cleanName(p.name),updatedAt:Number(p.updatedAt)||0};
  }
 }
}catch{}
function ensure(id){
 if(!/^dh-[\w-]{1,85}$/.test(String(id||'')))throw Error('Önce bir sohbet aç.');
 return projects[id]||(projects[id]=defaults(id,'Dimensia Mobil'));
}
function status(message,error=false){const el=$('drnStatus');el.textContent=String(message).slice(0,500);el.classList.toggle('error',error)}
function persist(){
 try{
  const list=Object.entries(projects).sort((a,b)=>b[1].updatedAt-a[1].updatedAt).slice(0,24);
  const raw=JSON.stringify(Object.fromEntries(list));
  if(raw.length>2300000)throw Error('Tarayıcı depolama sınırı.');
  localStorage.setItem(KEY,raw);return true;
 }catch(e){status('Yerel kayıt yapılamadı: '+e.message,true);return false}
}
const panel=document.createElement('section');panel.id='drnPanel';panel.className='drn-panel';panel.hidden=true;
panel.setAttribute('aria-label','React Native Android APK proje stüdyosu');
panel.innerHTML='<header class="drn-head"><div><strong>📱 React Native · Android APK Stüdyo</strong>'+
 '<small>Expo SDK 54 · Sohbete bağlı mobil proje · Google Colab</small></div>'+
 '<button type="button" id="drnClose" class="drn-btn" aria-label="Mobil stüdyoyu kapat">✕</button></header>'+
 '<div class="drn-project"><div><span>AKTİF SOHBETİN MOBİL PROJESİ</span><strong id="drnProjectName">Dimensia Mobil</strong></div>'+
 '<button class="drn-btn" type="button" id="drnRename">✎ Adlandır</button></div>'+
 '<div id="drnTabs" class="drn-tabs" role="tablist" aria-label="React Native proje dosyaları"></div>'+
 '<div class="drn-editor-bar"><span id="drnFileName">App.js</span><span id="drnCount">0 karakter</span></div>'+
 '<textarea id="drnEditor" spellcheck="false" autocorrect="off" autocomplete="off" autocapitalize="off" wrap="off" aria-label="React Native kaynak dosyasını düzenle"></textarea>'+
 '<div class="drn-toolbar"><button type="button" class="drn-btn drn-primary" id="drnToChat">✧ AI ile uygulama oluştur</button>'+
 '<button type="button" class="drn-btn" id="drnCheck">✓ Dosyaları kontrol et</button>'+
 '<button type="button" class="drn-btn" id="drnType">⇆ JS / TSX</button>'+
 '<button type="button" class="drn-btn" id="drnExample">↶ Örnek uyg.</button></div>'+
 '<div class="drn-flow"><strong>APK DERLEME — 3 ADIM</strong>'+
 '<button class="drn-btn drn-primary" type="button" id="drnExport">① ZIP projeyi indir</button>'+
 '<button class="drn-btn" type="button" id="drnColab">② Google Colab’ı aç</button>'+
 '<p>③ Colab’da ZIP dosyasını yükle → Hücreleri çalıştır → APK indir.</p></div>'+
 '<div id="drnStatus" class="drn-status" role="status" aria-live="polite">Kodunu düzenle ve ZIP indir.</div>'+
 '<p class="drn-help">APK bu sitede derlenmez; ücretsiz Colab oturumu garanti edilmez. Sonuç test amaçlı debug APK’dir. API anahtarlarını koda ekleme.</p>';
chat.querySelector('.dh-composer-wrap')?.before(panel);
const quick=document.createElement('button');quick.id='drnQuick';quick.type='button';
quick.className='dh-tool';quick.textContent='📱 APK Stüdyo';quick.title='React Native ve Colab APK stüdyosunu aç';
chat.querySelector('.dh-tools')?.insertBefore(quick,$('dhRunQuick'));
const editor=$('drnEditor');
let openedFor='',selected='App.js',loading=false;
const activeId=()=>hub.getState().active,active=()=>ensure(activeId());
function saveEditor(){
 if(loading||!openedFor)return;
 const p=projects[openedFor];if(!p)return;
 if(bytes(editor.value)>LIMIT){status('Dosya 260 KB sınırını aşıyor; kaydedilmedi.',true);return}
 p.files[selected]=editor.value;p.updatedAt=Date.now();persist();
}
function tabs(){
 const root=$('drnTabs');root.replaceChildren();
 for(const name of Object.keys(active().files)){
  const b=document.createElement('button');b.type='button';b.dataset.drnFile=name;
  b.textContent=name;b.classList.toggle('active',selected===name);
  b.setAttribute('aria-selected',String(selected===name));
  b.onclick=()=>choose(name);root.append(b);
 }
}
function choose(name){
 if(!Object.hasOwn(active().files,name))return;
 saveEditor();selected=name;loading=true;editor.value=active().files[name];
 $('drnFileName').textContent=name;$('drnCount').textContent=editor.value.length+' karakter';loading=false;tabs();
}
function activate(id,{skipSave=false}={}){
 if(!id)return;if(!skipSave)saveEditor();
 const p=ensure(id);openedFor=id;selected=p.entry;loading=true;
 $('drnProjectName').textContent=p.name;editor.value=p.files[selected]||'';
 $('drnFileName').textContent=selected;$('drnCount').textContent=editor.value.length+' karakter';
 loading=false;tabs();
}
function open(){
 let id=activeId();
 if(!id){hub.newChat();hub.setMode('native');id=activeId()}
 if(!id)return status('Sohbet başlatılamadı.',true);
 if(id!==openedFor)activate(id);
 panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function validate(p){
 const f=p.files;
 if(!f[p.entry]||!/\bexport\s+default\b/.test(f[p.entry]))throw Error(p.entry+' içinde export default App bulunmalı.');
 let cfg,pkg,eas;
 try{cfg=JSON.parse(f['app.json'])}catch{throw Error('app.json geçerli JSON değil.')}
 try{pkg=JSON.parse(f['package.json'])}catch{throw Error('package.json geçerli JSON değil.')}
 try{eas=JSON.parse(f['eas.json'])}catch{throw Error('eas.json geçerli JSON değil.')}
 if(!/^[a-z0-9][a-z0-9-]{0,100}$/i.test(cfg.expo?.slug||''))throw Error('app.json expo.slug geçersiz.');
 if(!/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){2,}$/i.test(cfg.expo?.android?.package||''))throw Error('Android package adı geçersiz.');
 if(!pkg.dependencies?.expo||!pkg.dependencies?.react||!pkg.dependencies?.['react-native'])throw Error('package.json Expo, React, React Native bağımlılıklarını içermeli.');
 if(eas.build?.preview?.android?.buildType!=='apk')throw Error('eas.json build.preview.android.buildType apk olmalı.');
 let total=0;
 for(const [name,source] of Object.entries(f)){
  if(SENSITIVE.test(source))throw Error(name+' içinde olası API anahtarı var.');
  if(bytes(source)>LIMIT)throw Error(name+' 260 KB sınırını aşıyor.');
  total+=bytes(source);
 }
 if(total>900000)throw Error('Proje toplam 900 KB sınırını aşıyor.');
 return total;
}
function crc32(data){
 let c=0xffffffff;
 for(const b of data){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}
 return(c^0xffffffff)>>>0;
}
function makeZIP(files){
 const te=new TextEncoder(),pieces=[],central=[];let offset=0;
 const u16=(view,n,pos)=>view.setUint16(pos,n,true),u32=(view,n,pos)=>view.setUint32(pos,n>>>0,true);
 const add=x=>{pieces.push(x);offset+=x.length};
 for(const [name,source] of Object.entries(files)){
  if(!/^[\w.-]+$/.test(name))throw Error('Geçersiz ZIP dosya adı.');
  const file=te.encode(name),data=te.encode(source),crc=crc32(data),pos=offset;
  const header=new Uint8Array(30+file.length),view=new DataView(header.buffer);
  u32(view,0x04034b50,0);u16(view,20,4);u16(view,0x0800,6);
  u32(view,crc,14);u32(view,data.length,18);u32(view,data.length,22);u16(view,file.length,26);
  header.set(file,30);add(header);add(data);central.push({file,data,crc,pos});
 }
 const start=offset;
 for(const x of central){
  const header=new Uint8Array(46+x.file.length),v=new DataView(header.buffer);
  u32(v,0x02014b50,0);u16(v,20,4);u16(v,20,6);u16(v,0x0800,8);
  u32(v,x.crc,16);u32(v,x.data.length,20);u32(v,x.data.length,24);
  u16(v,x.file.length,28);u32(v,x.pos,42);header.set(x.file,46);add(header);
 }
 const tail=new Uint8Array(22),v=new DataView(tail.buffer);
 u32(v,0x06054b50,0);u16(v,central.length,8);u16(v,central.length,10);
 u32(v,offset-start,12);u32(v,start,16);add(tail);
 return new Blob(pieces,{type:'application/zip'});
}
function exportZIP(){
 saveEditor();const p=active();
 try{
  const size=validate(p),name=JSON.parse(p.files['app.json']).expo.slug;
  const blob=makeZIP(p.files),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name+'.zip';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
  status('✓ '+Math.round(size/1024)+' KB / '+Object.keys(p.files).length+' dosya ZIP indirildi. Şimdi Colab’ı aç.');
 }catch(e){status('ZIP hazırlanamadı: '+e.message,true)}
}
function capture(text,id){
 const re=/(?:^|\n)\x60{3}(jsx|tsx|react-native|reactnative|app\.js|app\.tsx)\s*\r?\n([\s\S]*?)\r?\n?\x60{3}(?=\r?\n|$)/gi;
 let m,last;
 while((m=re.exec(String(text||''))))last={entry:/tsx/i.test(m[1])?'App.tsx':'App.js',source:m[2]};
 if(!last)return false;
 if(!/\bexport\s+default\b/.test(last.source)||bytes(last.source)>LIMIT||SENSITIVE.test(last.source)){
  status('AI yanıtı tam App dosyası içermiyor veya güvenlik/uzunluk kontrolünden geçmedi.',true);return false;
 }
 saveEditor();const p=ensure(id);delete p.files[p.entry];p.entry=last.entry;p.files[p.entry]=last.source;
 if(last.entry==='App.tsx'){
  p.files['tsconfig.json']=JSON.stringify({extends:'expo/tsconfig.base',compilerOptions:{strict:true}},null,2)+'\n';
  const pkg=JSON.parse(p.files['package.json']);
  pkg.devDependencies={...pkg.devDependencies,typescript:'~5.9.2','@types/react':'~19.1.0'};
  p.files['package.json']=JSON.stringify(pkg,null,2)+'\n';
 }else delete p.files['tsconfig.json'];
 p.updatedAt=Date.now();persist();
 if(id===activeId()){activate(id,{skipSave:true});status('✓ AI '+last.entry+' dosyasını projene uyguladı. ZIP ve Colab ile APK derleyebilirsin.')}
 return true;
}
editor.addEventListener('input',()=>{if(loading)return;saveEditor();$('drnCount').textContent=editor.value.length+' karakter'});
editor.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();editor.setRangeText('  ',editor.selectionStart,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input',{bubbles:true}))}});
$('drnClose').onclick=()=>panel.hidden=true;
$('drnRename').onclick=()=>{
 const p=active(),name=prompt('Uygulama adı:',p.name);if(name===null)return;
 p.name=cleanName(name);$('drnProjectName').textContent=p.name;
 try{const cfg=JSON.parse(p.files['app.json']);cfg.expo.name=p.name;p.files['app.json']=JSON.stringify(cfg,null,2)+'\n'}catch{}
 p.updatedAt=Date.now();persist();if(selected==='app.json'){loading=true;editor.value=p.files['app.json'];loading=false;}
};
$('drnCheck').onclick=()=>{saveEditor();try{status('✓ '+Math.round(validate(active())/1024)+' KB proje yapısı kontrol edildi. Gerçek derlemeyi Colab/Gradle yapar.')}catch(e){status('Hata: '+e.message,true)}};
$('drnType').onclick=()=>{
 saveEditor();const p=active(),old=p.entry,next=old==='App.js'?'App.tsx':'App.js';
 p.files[next]=p.files[old];delete p.files[old];p.entry=next;
 const pkg=JSON.parse(p.files['package.json']);
 if(next==='App.tsx'){
  p.files['tsconfig.json']=JSON.stringify({extends:'expo/tsconfig.base',compilerOptions:{strict:true}},null,2)+'\n';
  pkg.devDependencies={...pkg.devDependencies,typescript:'~5.9.2','@types/react':'~19.1.0'};
 }else{
  delete p.files['tsconfig.json'];
  if(pkg.devDependencies){delete pkg.devDependencies.typescript;delete pkg.devDependencies['@types/react']}
 }
 p.files['package.json']=JSON.stringify(pkg,null,2)+'\n';p.updatedAt=Date.now();persist();activate(activeId(),{skipSave:true});
};
$('drnExample').onclick=()=>{
 if(!confirm('Aktif App dosyasının yerine örnek React Native uygulaması yüklensin mi?'))return;
 const p=active();p.files[p.entry]=APP;p.updatedAt=Date.now();persist();activate(activeId(),{skipSave:true});
};
$('drnExport').onclick=exportZIP;
$('drnColab').onclick=()=>{window.open(NOTEBOOK,'_blank','noopener,noreferrer');status('Colab açıldı. ZIP dosyanı yükleyip hücreleri çalıştır.')};
$('drnToChat').onclick=()=>{
 hub.setMode('native');panel.hidden=true;
 const input=$('dhInput');input.value=input.value||'React Native Expo Android uygulaması için eksiksiz, çalışan App.js kodunu oluştur.';input.focus();
};
quick.onclick=()=>{hub.setMode('native');open()};
document.addEventListener('dimensia:chat-activated',e=>{if(e.detail?.chatId){ensure(e.detail.chatId);if(!panel.hidden)activate(e.detail.chatId)}});
document.addEventListener('dimensia:chat-titled',e=>{
 const p=projects[e.detail?.chatId];if(!p)return;
 if(p.name==='Dimensia Mobil'){p.name=cleanName(e.detail.title);p.updatedAt=Date.now();persist();if(e.detail.chatId===activeId())$('drnProjectName').textContent=p.name}
});
document.addEventListener('dimensia:chat-assistant-native',e=>{if(e.detail?.chatId)capture(e.detail.text,e.detail.chatId)});
if(activeId())activate(activeId());
window.DimensiaNativeStudio={
 open,capture,makeZIP,exportZIP,
 getFiles:(id)=>({...ensure(id||activeId()).files}),
 getState:()=>({chatId:activeId(),projectName:active().name,entry:active().entry,visible:!panel.hidden}),
 updateFile:(name,content)=>{
  const p=active();if(!Object.hasOwn(p.files,name)||typeof content!=='string'||bytes(content)>LIMIT||SENSITIVE.test(content))throw Error('Dosya geçersiz.');
  saveEditor();p.files[name]=content;p.updatedAt=Date.now();persist();if(selected===name){loading=true;editor.value=content;loading=false;}
 },
 colabUrl:NOTEBOOK
};
})();