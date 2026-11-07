/* Dimensia Code Lab 5.0 — editable project source + honest runtime boundaries.
   Browser JS uses sandbox iframe. Python uses optional Pyodide in a separate Worker.
   Rust/Bash/React Native need their native toolchains or GitHub Actions. */
(()=>{
'use strict';
const anchor=document.getElementById('architectStudio'),studio=document.getElementById('page-studio');
if(!anchor||!studio)return;
const TEMPLATES={
 html:{
  name:'HTML',file:'index.html',mode:'HTML/CSS/JS · izole canlı önizleme',runnable:'preview',
  content:'<!doctype html>\n<html lang="tr">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <title>Yeni projem</title>\n  <style>body{font-family:system-ui;background:#15232b;color:#e8eee9;padding:40px}button{background:#5d9e91;color:#fff;padding:12px 20px;border:0;border-radius:9px}</style>\n</head>\n<body>\n  <h1>Dimensia ile üretildi</h1>\n  <button id="hello">Merhaba!</button>\n  <script>document.querySelector("#hello").onclick=()=>alert("Çalışıyor!");</scr'+'ipt>\n</body>\n</html>\n'
 },
 css:{
  name:'CSS',file:'style.css',mode:'CSS stil dosyası · site önizlemesine uygula',runnable:'css',
  content:'/* Dimensia hafif tasarım sistemi */\n:root {\n  --bg: #17242d;\n  --text: #e8f2ee;\n  --accent: #74b8a6;\n  --radius: 12px;\n}\nbody{background:var(--bg);color:var(--text);font-family:system-ui;}\nbutton{background:var(--accent);border-radius:var(--radius);}\n'
 },
 javascript:{
  name:'JavaScript',file:'main.js',mode:'JS · sandbox iframe içinde çalıştır',runnable:'js',
  content:'// JavaScript: tarayıcıda izole ortam\nconst project = { name: "Dimensia Studio", version: 5 };\nconsole.log("Merhaba", project.name);\nconsole.log("Dört işlem:", 2 + 3 * 4);\n'
 },
 python:{
  name:'Python',file:'main.py',mode:'Python / Pyodide WebAssembly · ilk çalışmada internet gerekir',runnable:'python',
  content:'# Python: tarayıcıda isteğe bağlı Pyodide çalışma motoru\nprint("Merhaba Dimensia!")\nnumbers = [1, 2, 3, 4, 5]\nprint("Toplam:", sum(numbers))\n'
 },
 perl:{
  name:'Perl',file:'main.pl',mode:'Perl · GitHub Actions bulut çalıştırıcısında çalışır',runnable:'cloud',
  content:'#!/usr/bin/env perl\nuse strict;\nuse warnings;\nuse feature "say";\nmy @numbers=(1,2,3,4,5);\nmy $sum=0;\n$sum += $_ for @numbers;\nsay "Merhaba Dimensia Perl!";\nsay "Toplam: $sum";\n'
 },
 rust:{
  name:'Rust',file:'main.rs',mode:'Rust · rustc veya GitHub Actions gerekiyor',runnable:'cloud',
  content:'// Rust: yerel rustc ya da GitHub Actions ile derlenir\nfn main() {\n    println!("Merhaba Dimensia!");\n    let numbers = [1, 2, 3, 4, 5];\n    let total: i32 = numbers.iter().sum();\n    println!("Toplam: {}", total);\n}\n'
 },
 bash:{
  name:'Bash / SH',file:'main.sh',mode:'POSIX sh · shell veya GitHub Actions gerekiyor',runnable:'cloud',
  content:'#!/bin/sh\n# POSIX uyumlu örnek - çalıştırmadan önce incele\nset -eu\nprintf "%s\\n" "Merhaba Dimensia!"\nprintf "Tarih: %s\\n" "$(date +%Y-%m-%d)"\n'
 },
 reactnative:{
  name:'React Native',file:'App.js',mode:'React Native / Expo · mobil derleme ayrı altyapı gerektirir',runnable:'cloud',
  content:'import React, { useState } from "react";\nimport { SafeAreaView, Text, Pressable, StyleSheet } from "react-native";\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <SafeAreaView style={styles.screen}>\n      <Text style={styles.title}>Dimensia Mobile</Text>\n      <Text style={styles.subtitle}>Buton sayacı: {count}</Text>\n      <Pressable style={styles.button} onPress={() => setCount(count + 1)}>\n        <Text style={styles.buttonText}>Dokun</Text>\n      </Pressable>\n    </SafeAreaView>\n  );\n}\nconst styles = StyleSheet.create({\n  screen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#17262b" },\n  title: { color: "#f0f5ee", fontSize: 27, fontWeight: "700", marginBottom: 12 },\n  subtitle: { color: "#b5cecb", fontSize: 17, marginBottom: 20 },\n  button: { backgroundColor: "#54988c", padding: 15, borderRadius: 12 },\n  buttonText: { color: "white", fontSize: 16 }\n});\n'
 }
};
const files=Object.fromEntries(Object.entries(TEMPLATES).map(([key,value])=>[key,value.content]));
let lang='javascript',worker=null,runner=null,running=false;
const shell=document.createElement('section');shell.className='code-lab';shell.id='dimensiaCodeLab';
shell.innerHTML=
 '<div class="lab-head"><div><div class="lab-eyebrow">DIMENSIA / POLYGLOT CODE LAB</div><h2>Tek stüdyo. Çoklu yazılım dilleri.</h2>'+
 '<p>HTML · CSS · JavaScript · Python · Rust · Perl · Bash/SH · React Native kaynak kodlarını düzenle ve indir. Desteklenenleri güvenli çalışma alanında test et; diğerlerini GitHub Actions üzerinde doğrula.</p></div>'+
 '<span class="lab-capability" id="labCapability">İzole tarayıcı çalıştırma</span></div>'+
 '<div class="lab-main"><div class="lab-side" id="labMenu"></div><div class="lab-workspace">'+
 '<div class="lab-current"><div><strong id="labFileName">main.js</strong><small id="labRuntime">JavaScript</small></div>'+
 '<span class="lab-lang" id="labLanguage">DÜZENLENEBİLİR KAYNAK</span></div>'+
 '<textarea id="labEditor" spellcheck="false" class="lab-editor" aria-label="Kod editörü" autocomplete="off"></textarea>'+
 '<div class="lab-actions"><button type="button" class="lab-btn primary" id="labRun">▶ Çalıştır / Önizle</button>'+
 '<button type="button" class="lab-btn" id="labDownload">↓ Dosya indir</button>'+
 '<button type="button" class="lab-btn" id="labSaveGitHub">↗ GitHub’a Kaydet</button>'+
 '<button type="button" class="lab-btn" id="labPolyglot">⚡ Tüm Dilleri Çalıştır</button>'+
 '<button type="button" class="lab-btn" id="labRestore">↻ Örnek Kod</button>'+
 '<button type="button" class="lab-btn" id="labStop">■ Durdur</button></div>'+
 '<p class="lab-note" id="labNote">JavaScript çalıştırma izole iframe ile yapılır. Rust, Bash ve React Native burada native olarak çalıştırılmaz; kaynakları GitHub Actions veya uygun yerel araçlarla test edebilirsin.</p>'+
 '<div class="lab-output" id="labOutput" role="log" aria-live="polite">Çıktı burada gösterilecek.</div></div></div>'+
 '<div class="lab-status" id="labStatus">Çalışma alanı hazır. Kodlar sayfa oturumu boyunca bellekte tutulur; indirerek kalıcı kaydet.</div>';
 anchor.after(shell);
const $=id=>document.getElementById(id);
const setStatus=(s,err=false)=>{const x=$('labStatus');x.textContent=s;x.classList.toggle('error',!!err)};
const output=s=>{$('labOutput').textContent=String(s).slice(0,18000)};
const addOutput=s=>{const x=$('labOutput');x.textContent=(x.textContent===''?'':x.textContent+'\n')+String(s).slice(0,1400);x.scrollTop=x.scrollHeight};
function saveCurrent(){files[lang]=$('labEditor').value}
function load(kind){
 saveCurrent();lang=kind;const def=TEMPLATES[kind];
 $('labEditor').value=files[lang];$('labFileName').textContent=def.file;
 $('labRuntime').textContent=def.mode;
 $('labCapability').textContent=def.runnable==='js'?'İzole JS çalıştırma':def.runnable==='python'?'İsteğe bağlı Python WASM':def.runnable==='preview'?'HTML canlı önizleme':def.runnable==='css'?'CSS kaynak editörü':'Native / GitHub Actions';
 $('labRun').textContent=def.runnable==='cloud'?'⌘ GitHub Testlerini Aç':def.runnable==='css'?'◐ CSS Dosyasını Uygula':'▶ Çalıştır / Önizle';
 document.querySelectorAll('#labMenu button').forEach(b=>b.classList.toggle('active',b.dataset.lang===kind));
 $('labLanguage').textContent=def.name.toUpperCase();
 output('Seçilen dil: '+def.name+'\n'+def.mode);
 setStatus(kind==='python'?'Python ilk kez çalıştırıldığında Pyodide CDN üzerinden indirilir; Android cihazda bellek kullanımı yüksek olabilir.':kind==='reactnative'?'React Native/Expo uygulaması GitHub Pages içinde APK olarak çalıştırılamaz. Expo veya EAS Build gerektirir.':'Dosya seçildi: '+def.file);
}
for(const [key,t] of Object.entries(TEMPLATES)){
 const b=document.createElement('button');b.type='button';b.dataset.lang=key;b.textContent='⌘ '+t.name;
 b.onclick=()=>load(key);$('labMenu').append(b);
}
function stop(){
 if(worker){worker.terminate();worker=null}
 if(runner){runner.remove();runner=null}
 running=false;$('labRun').disabled=false;
}
$('labStop').onclick=()=>{stop();setStatus('Çalışan kod ortamı kapatıldı.')};
async function jsRun(code){
 stop();running=true;$('labRun').disabled=true;
 const fid='run'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 runner=document.createElement('iframe');
 runner.sandbox='allow-scripts';runner.title='İzole JavaScript çalışma alanı';
 runner.style.cssText='width:100%;height:115px;border:1px solid #45566b;border-radius:9px;background:white';
 const handler=e=>{
  if(e.source!==runner?.contentWindow||e.data?.channel!==fid)return;
  if(e.data.type==='output')addOutput(e.data.text);
  if(e.data.type==='error')addOutput('HATA: '+e.data.text);
 };
 window.addEventListener('message',handler);
 const prefix="const emit=(type,text)=>parent.postMessage({channel:"+JSON.stringify(fid)+",type,text:String(text).slice(0,1600)},'*');"+
 "console.log=(...x)=>emit('output',x.map(v=>typeof v==='object'?JSON.stringify(v):String(v)).join(' '));"+
 "console.error=(...x)=>emit('error',x.join(' '));"+
 "window.onerror=(_,__,___,____,e)=>emit('error',e?.message||_);";
 runner.srcdoc='<!doctype html><html><head><meta charset="utf-8"></head><body><script>'+
   prefix+'\n'+code.replace(/<\/script/gi,'<\\/script')+'\n</scr'+'ipt></body></html>';
 const content=$('labOutput');content.after(runner);
 output('JavaScript izolasyon içinde çalışıyor…');
 setTimeout(()=>{
  window.removeEventListener('message',handler);
  if(runner){runner.remove();runner=null}
  running=false;$('labRun').disabled=false;
 },4500);
}
async function pythonRun(code){
 stop();running=true;$('labRun').disabled=true;output('Python (Pyodide) indiriliyor ve başlatılıyor…');setStatus('Pyodide ilk çalışmada internet ve yüksek RAM gerektirebilir.');
 const loader='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
 const script="self.onmessage=async(e)=>{try{importScripts("+JSON.stringify(loader+'pyodide.js')+");"+
 "const py=await loadPyodide({indexURL:"+JSON.stringify(loader)+"});"+
 "py.setStdout({batched:(s)=>self.postMessage({kind:'print',text:s})});"+
 "py.setStderr({batched:(s)=>self.postMessage({kind:'print',text:s})});"+
 "const x=await py.runPythonAsync(e.data.source);self.postMessage({kind:'finish',text:x===undefined?'Tamamlandı':String(x)});"+
 "}catch(err){self.postMessage({kind:'error',text:String(err.message||err)})}}";
 const objectURL=URL.createObjectURL(new Blob([script],{type:'application/javascript'}));
 worker=new Worker(objectURL);URL.revokeObjectURL(objectURL);
 const localWorker=worker;
 const watchdog=setTimeout(()=>{
  if(worker===localWorker){stop();addOutput('Python sınırı: 40 saniye. İşlem durduruldu.');setStatus('Python zaman aşımı veya CDN bağlantı sorunu.',true)}
 },40000);
 worker.onmessage=e=>{
  if(e.data.kind==='print')addOutput(e.data.text);
  if(e.data.kind==='finish'||e.data.kind==='error'){
   addOutput(e.data.kind==='error'?'HATA: '+e.data.text:e.data.text);
   const failed=e.data.kind==='error';clearTimeout(watchdog);stop();setStatus(failed?'Python çalıştırılırken hata oldu.':'Python kodu Pyodide üzerinde çalıştırıldı.',failed);
  }
 };
 worker.onerror=e=>{clearTimeout(watchdog);stop();addOutput('Python Worker hatası: '+(e.message||'CDN engellenmiş olabilir'));setStatus('Pyodide yüklenemedi.',true)};
 worker.postMessage({source:code});
}
$('labRun').onclick=async()=>{
 const code=$('labEditor').value,mode=TEMPLATES[lang].runnable;saveCurrent();
 if(mode==='js')return jsRun(code);
 if(mode==='python')return pythonRun(code);
 if(mode==='preview'){if(!/<html[\s>]/i.test(code))return setStatus('Önizleme için tam HTML dokümanı gerekli.',true);showHTML(code,'Code Lab HTML');setStatus('HTML stüdyo önizlemesine aktarıldı.');return}
 if(mode==='css'){
  if(!state.siteHtml)return setStatus('Önce HTML projesi oluştur.',true);
  const doc=new DOMParser().parseFromString(state.siteHtml,'text/html');
  const old=doc.querySelector('style[data-code-lab]');old?.remove();
  const style=doc.createElement('style');style.dataset.codeLab='true';style.textContent=code;doc.head.append(style);
  showHTML('<!doctype html>\n'+doc.documentElement.outerHTML,state.siteName||'Yeni Site');
  setStatus('CSS kodu kendi projenin HTML kaynağına eklendi.');return;
 }
 const full=window.DimensiaPolyglot;
 if(full?.show){full.show(lang);setStatus('Bulut kod çalıştırıcısı açıldı: dosyaları GitHub’a yüklemek ve bütün dilleri test etmek için kendi tokenini bağla.');return}
 const url='https://github.com/ramiz28615/my_app/actions/workflows/polyglot-execute.yml';
 window.open(url,'_blank','noopener,noreferrer');
 setStatus('Bulut çalışma alanı henüz yüklenemedi. GitHub Actions üzerinden çalıştırabilirsin.');
};
$('labDownload').onclick=()=>{
 saveCurrent();const code=files[lang],url=URL.createObjectURL(new Blob([code],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=TEMPLATES[lang].file;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 setStatus('Dosya indirildi: '+TEMPLATES[lang].file);
};
$('labRestore').onclick=()=>{
 if(!confirm(TEMPLATES[lang].file+' dosyasındaki oturum değişiklikleri sıfırlansın mı?'))return;
 files[lang]=TEMPLATES[lang].content;$('labEditor').value=files[lang];setStatus('Şablon başlangıç sürümüne döndü.');
};
$('labSaveGitHub').onclick=async()=>{
 const fn=window.DimensiaLaunchpad?.saveCodeLabFile;
 if(typeof fn!=='function'){setStatus('GitHub yazma bağlantısı yok. Launchpad’e GitHub Contents: write tokeni gir.',true);return}
 saveCurrent();const button=$('labSaveGitHub');button.disabled=true;button.textContent='Kaydediliyor…';
 try{
  const result=await fn(lang,TEMPLATES[lang].file,files[lang]);
  setStatus('GitHub’a kaydedildi: '+result.path+' · GitHub Actions üzerinde dosya kontrolü çalışabilir.');
 }catch(e){setStatus(e.message||'GitHub’a kaydetme hatası.',true)}
 finally{button.disabled=false;button.textContent='↗ GitHub’a Kaydet'}
};
$('labPolyglot').onclick=()=>{
 const full=window.DimensiaPolyglot;
 if(!full?.show)return setStatus('Bulut çalışma alanı henüz yüklenemedi.',true);
 saveCurrent();full.show(lang);
};
load('javascript');
window.DimensiaCodeLab={
 list:()=>Object.keys(TEMPLATES),
 getFiles:()=>{saveCurrent();return{...files}},
 setFile:(language,source)=>{
  if(!Object.hasOwn(TEMPLATES,language)||typeof source!=='string'||source.length>100000)throw Error('Dil veya kaynak boyutu geçersiz.');
  files[language]=source;if(lang===language){$('labEditor').value=source;output('Kaynak eşitlendi: '+TEMPLATES[language].file)}
 },
 select:(language)=>{if(Object.hasOwn(TEMPLATES,language))load(language)}
};
})();