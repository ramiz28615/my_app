import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareNativeBuild} from '../scripts/prepare-native-apk.mjs';

const id='a0123456789abcd';
const validCode='import React from "react";\nexport default function App(){return null;}\n';
function input(overrides={}){
 return{DIMENSIA_BUILD_ID:id,DIMENSIA_APP_B64:Buffer.from(validCode).toString('base64'),
  DIMENSIA_LANGUAGE:'jsx',DIMENSIA_APP_NAME:'Test Uygulaması',
  DIMENSIA_ANDROID_PACKAGE:'com.dimensia.testapp',...overrides};
}
test('Native APK builder prepares trusted pinned Expo files without arbitrary package scripts',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dim-apk-'));
 try{
  const output=prepareNativeBuild(input(),path.join(dir,'project'));
  assert.equal(output.language,'jsx');
  const js=fs.readFileSync(path.join(output.dir,'App.js'),'utf8');
  assert.ok(js.includes('export default function App'));
  const pkg=JSON.parse(fs.readFileSync(path.join(output.dir,'package.json'),'utf8'));
  assert.equal(pkg.dependencies.expo,'~54.0.0');
  assert.equal(pkg.dependencies.react,'19.1.0');
  assert.equal(pkg.scripts.build,undefined);
  const app=JSON.parse(fs.readFileSync(path.join(output.dir,'app.json'),'utf8'));
  assert.equal(app.expo.android.package,'com.dimensia.testapp');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('Native APK builder supports TSX app template',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dim-apk-'));
 try{
  const output=prepareNativeBuild(input({DIMENSIA_LANGUAGE:'tsx'}),path.join(dir,'project'));
  assert.ok(fs.existsSync(path.join(output.dir,'App.tsx')));
  assert.ok(fs.existsSync(path.join(output.dir,'tsconfig.json')));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('Native APK builder rejects wrong package, invalid input and leaked secrets',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dim-apk-'));
 try{
  assert.throws(()=>prepareNativeBuild(input({DIMENSIA_ANDROID_PACKAGE:'com.bad;rm -rf /'}),path.join(dir,'a')),/package/);
  assert.throws(()=>prepareNativeBuild(input({DIMENSIA_APP_B64:'notbase64!'}),path.join(dir,'b')),/payload/);
  assert.throws(()=>prepareNativeBuild(input({DIMENSIA_APP_B64:Buffer.from(validCode+'\nconst key="github_pat_abcdefghijklmnopqrstuvwxyz123456";').toString('base64')}),path.join(dir,'c')),/credentials/);
  assert.throws(()=>prepareNativeBuild(input({DIMENSIA_APP_B64:Buffer.from('const a=123;').toString('base64')}),path.join(dir,'d')),/export default/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
