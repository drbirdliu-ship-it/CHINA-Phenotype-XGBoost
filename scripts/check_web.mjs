// Functional checks without a graphical browser; no patient data required.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(fs.readFileSync(path.join(root,'model_config.json'))).model_version;
const examples = JSON.parse(fs.readFileSync(path.join(root,'examples/predictors.json')));
const results = {};
for (const variant of ['model11','model9']) {
  const directory = path.join(root,'docs',variant);
  const { predict, FEATURES, METRICS } = await import(pathToFileURL(path.join(directory,'engine.mjs')).href);
  const example = examples[variant];
  for (const sex of [0,1]) {
    const result = predict({...example, SEX:sex});
    assert(Math.abs(result.probabilities.reduce((a,b)=>a+b)-1)<1e-6);
    assert.equal(result.predicted_code, result.probabilities.indexOf(Math.max(...result.probabilities))+1);
  }
  for (const invalid of [{Age:17},{Age:NaN},{SEX:2},{SEX:null},{Glucose:Infinity},{Albumin:-1}]) {
    assert.throws(()=>predict({...example,...invalid}));
  }
  assert.throws(()=>predict({}));
  assert(predict({...example,Age:85}).outside_observed_range.includes('Age'));
  if (variant==='model11') assert.throws(()=>predict({...example,LVEF:101}));
  else { assert(!FEATURES.includes('LVEF')); assert(!FEATURES.includes('LVEDD')); }
  const html=fs.readFileSync(path.join(directory,'index.html'),'utf8');
  assert(html.includes(`data-model-version="${version}"`));
  assert(html.includes('Male (0)') && html.includes('Female (1)'));
  const featureIds=[...html.matchAll(/<(?:input|select) id="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(featureIds.sort(),[...FEATURES].sort());
  for(const match of html.matchAll(/(?:src|href)="\.\/([^"?#]+)[^"]*"/g)) assert(fs.existsSync(path.join(directory,match[1])));
  // Minimal DOM adapter exercises the actual application event handlers.
  const elements=new Map();
  function element(id) {
    if(!elements.has(id)) {
      const classes=new Set(); const handlers={}; let value='';
      const node={textContent:'',hidden:false,disabled:false,style:{},
        classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},
        setAttribute(){},removeAttribute(){},scrollIntoView(){},
        querySelector:selector=>element(id+selector),
        addEventListener:(name,fn)=>{handlers[name]=fn;},
        fire:name=>handlers[name]?.({preventDefault(){}})};
      Object.defineProperty(node,'value',{get:()=>value,set:x=>{value=String(x);}});
      elements.set(id,node);
    }
    return elements.get(id);
  }
  const cards=[0,1,2,3].map(i=>element('card'+i));
  globalThis.document={documentElement:{dataset:{modelVersion:version}},getElementById:element,querySelectorAll:()=>cards};
  globalThis.window={addEventListener(){},matchMedia:()=>({matches:false})};
  Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});
  await import(pathToFileURL(path.join(directory,'app.mjs')).href);
  assert.equal(element('calculate').disabled,false);
  element('example').fire('click');
  element('predictor-form').fire('submit');
  assert.equal(element('result-symbol').textContent,predict(example).predicted_symbol);
  assert.equal(element('result-status').textContent,'Calculated');
  element('Age').value=60; element('predictor-form').fire('input');
  assert.equal(element('result-symbol').textContent,'—');
  element('SEX').value=''; element('predictor-form').fire('submit');
  assert.equal(element('error').hidden,false);
  element('predictor-form').fire('reset');
  assert.equal(element('result-status').textContent,'Awaiting calculation');
  assert.equal(element('accuracy-value').textContent,(METRICS.test_accuracy*100).toFixed(1));

  // Simulate migration from the actual legacy cache names and offline retrieval.
  const handlers={}; const scope=`https://example.test/${variant}/`;
  const oldKey=variant==='model11'?'china-phenotype-v2-sex-labels':'china-phenotype-nine-v1';
  const otherKey=variant==='model11'?'china-release-model9-v1':'china-release-model11-v1';
  const cachesMap=new Map([[oldKey,new Map([['stale','old model']])],[otherKey,new Map()]]);
  const keyOf=value=>new URL(typeof value==='string'?value:value.url,scope).href;
  let navigations=0;
  const context={URL,Response,console,fetch:async()=>new Response('current network content'),
    caches:{keys:async()=>[...cachesMap.keys()],delete:async key=>cachesMap.delete(key),open:async key=>{
      if(!cachesMap.has(key))cachesMap.set(key,new Map());const entries=cachesMap.get(key);
      return {addAll:async assets=>{for(const asset of assets){assert(fs.existsSync(path.join(directory,asset.split('?')[0])));entries.set(keyOf(asset),new Response('current cached '+asset));}},
        match:async request=>entries.get(keyOf(request))?.clone(),put:async(request,response)=>entries.set(keyOf(request),response)};
    }},
    self:{registration:{scope},location:{origin:'https://example.test'},addEventListener:(name,fn)=>{handlers[name]=fn;},skipWaiting:async()=>{},
      clients:{claim:async()=>{},matchAll:async()=>[{url:scope,navigate:async()=>{navigations++;}}]}}};
  vm.runInNewContext(fs.readFileSync(path.join(directory,'sw.js'),'utf8'),context);
  let promise;
  handlers.install({waitUntil:value=>{promise=value;}}); await promise;
  handlers.activate({waitUntil:value=>{promise=value;}}); await promise;
  assert(!cachesMap.has(oldKey));assert(cachesMap.has(otherKey));assert.equal(navigations,1);
  const get=async(url,mode='cors')=>{handlers.fetch({request:{url,method:'GET',mode},respondWith:value=>{promise=value;}});return await promise;};
  assert.equal(await (await get(scope+'model.mjs?v='+version)).text(),'current network content');
  context.fetch=async()=>{throw new Error('offline');};
  assert.equal(await (await get(scope+'model.mjs?v='+version)).text(),'current network content');
  assert((await (await get(scope,'navigate')).text()).includes('current cached'));
  assert.equal((await get(scope+'model.mjs?v=withdrawn')).status,503);
  results[variant]={input_validation:'passed',ui_events:'passed',relative_assets:'passed',legacy_cache_migration:'passed',network_first_and_offline_current_version:'passed'};
}
console.log(JSON.stringify({model_version:version,checks:results,graphical_browser_test:'Not performed; functional tests use a DOM adapter and service-worker simulation.'},null,2));
