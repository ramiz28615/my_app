/* Dimensia Android APK build preparation — trusted workflow, untrusted mobile source.
 * Input is ONLY App.js/App.tsx and whitelisted app metadata (no package scripts, secrets, paths).
 */
import fs from 'node:fs';
import path from 'node:path';

export function prepareNativeBuild(env=process.env,dir='native-apk-workdir'){
 const id=String(env.DIMENSIA_BUILD_ID||'');
 const encoded=String(env.DIMENSIA_APP_B64||'');
 const language=String(env.DIMENSIA_LANGUAGE||'jsx');
 const appName=String(env.DIMENSIA_APP_NAME||'Dimensia Mobil').trim();
 const androidPackage=String(env.DIMENSIA_ANDROID_PACKAGE||'');
 if(!/^a[a-z0-9]{10,32}$/.test(id))throw Error('Invalid build identifier');
 if(!['jsx','tsx'].includes(language))throw Error('Invalid source language');
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)||encoded.length>57000||!encoded.length)
  throw Error('Invalid or oversized app source (limit 40 KB encoded payload)');
 const bytes=Buffer.from(encoded,'base64');
 if(bytes.length>40000||bytes.length<32||bytes.toString('base64')!==encoded)
  throw Error('Source payload corrupted or exceeds 40 KB');
 const code=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 if(!/\bexport\s+default\b/.test(code))throw Error('React Native App must export default component');
 if(!appName||appName.length>60||/[<>\x00-\x1f]/.test(appName))throw Error('Invalid app display name');
 if(!/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){2,}$/.test(androidPackage)||androidPackage.length>120)
  throw Error('Invalid Android package identifier');
 if(/(?:sk-or-v1-[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{17,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})/.test(code))
  throw Error('App source appears to contain credentials');
 const root=path.resolve(dir);
 if(fs.existsSync(root))fs.rmSync(root,{recursive:true,force:true});
 fs.mkdirSync(root,{recursive:true});
 const pkg={
  name:'dimensia-apk-build',version:'1.0.0',private:true,main:'node_modules/expo/AppEntry.js',
  scripts:{start:'expo start',android:'expo run:android'},
  dependencies:{expo:'~54.0.0',react:'19.1.0','react-native':'0.81.5'},
  devDependencies:{'babel-preset-expo':'~54.0.0',...(language==='tsx'?{typescript:'~5.9.2','@types/react':'~19.1.0'}:{})}
 };
 const app={expo:{name:appName,slug:'dimensia-apk-'+id,version:'1.0.0',
  orientation:'portrait',userInterfaceStyle:'automatic',android:{package:androidPackage}}};
 const write=(name,content)=>fs.writeFileSync(path.join(root,name),content,{flag:'wx',mode:0o644});
 write('package.json',JSON.stringify(pkg,null,2)+'\n');
 write('app.json',JSON.stringify(app,null,2)+'\n');
 write('babel.config.js',"module.exports = function(api) {api.cache(true);return {presets:['babel-preset-expo']};};\n");
 write(language==='tsx'?'App.tsx':'App.js',code+'\n');
 if(language==='tsx')write('tsconfig.json',JSON.stringify({extends:'expo/tsconfig.base',compilerOptions:{strict:true}},null,2)+'\n');
 return {id,dir:root,sourceBytes:bytes.length,name:appName,androidPackage,language};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 try{const result=prepareNativeBuild();process.stdout.write('Prepared trusted Expo project: '+JSON.stringify(result)+'\n');}
 catch(error){process.stderr.write('APK preparation rejected: '+error.message+'\n');process.exitCode=1;}
}
