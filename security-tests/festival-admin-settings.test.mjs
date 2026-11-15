import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const settingsSource=fs.readFileSync(new URL('../admin/js/settings.js',import.meta.url),'utf8');
const helperSource=fs.readFileSync(new URL('../admin/js/india-datetime.js',import.meta.url),'utf8');
const studioSource=fs.readFileSync(new URL('../admin/js/experience-studio.js',import.meta.url),'utf8');
function makeElement(value=''){return{value,textContent:'',innerHTML:'',hidden:true,disabled:false,href:'',attributes:{},listeners:{},addEventListener(type,handler){(this.listeners[type]??=[]).push(handler)},setAttribute(name,value){this.attributes[name]=value},removeAttribute(name){delete this.attributes[name]}}}
async function harness({values={},popup=null,existingSettings={}}={}){
 const ids=['teamName','email','phone','address','logo','heroTitle','heroSubtitle','instagram','youtube','discord','facebook','festivalEnabled','festivalMode','festivalName','festivalStart','festivalEnd','festivalScheduleError','saveSettings','previewFestival','festivalPreviewStatus','festivalPreviewFallback'];
 const elements=new Map(ids.map(id=>[id,makeElement(values[id]??'')]));
 const settingsRef={get:()=>Promise.resolve({exists:false})},writes=[];let transactions=0;
 const db={collection:()=>({doc:()=>settingsRef}),runTransaction:callback=>{transactions++;return Promise.resolve(callback({get:()=>Promise.resolve({exists:true,data:()=>existingSettings}),set:(_ref,data)=>writes.push(data)}))}};
 const popupCalls=[],window={location:{href:'https://example.test/admin/settings.html',origin:'https://example.test'},FourFUIndiaDateTime:null,open:(...args)=>{popupCalls.push(args);return popup}};
 vm.runInNewContext(helperSource,{window,Date,String,Number,Object,globalThis:{}});
 const document={getElementById:id=>elements.get(id)},context={window,document,db,URL,Date,console,alert(){}};
 vm.createContext(context);vm.runInContext(settingsSource,context);await Promise.resolve();await Promise.resolve();
 return{context,elements,writes,get transactions(){return transactions},popupCalls,window};
}
async function flushWrites(){await new Promise(resolve=>setImmediate(resolve))}
test('scheduled save rejects missing, invalid, equal and reversed India-local ranges without writes',async()=>{
 const cases=[{start:'',end:'2026-11-15T10:00'},{start:'2026-11-15T09:00',end:''},{start:'2026-02-30T09:00',end:'2026-03-01T09:00'},{start:'2026-11-15T09:00',end:'2026-02-30T10:00'},{start:'2026-11-15T09:00',end:'2026-11-15T09:00'},{start:'2026-11-15T10:00',end:'2026-11-15T09:59'}];
 for(const item of cases){const h=await harness({values:{festivalEnabled:'true',festivalMode:'scheduled',festivalName:'diwali',festivalStart:item.start,festivalEnd:item.end}});h.elements.get('saveSettings').listeners.click[0]();assert.equal(h.transactions,0);assert.ok(h.elements.get('festivalScheduleError').textContent.length>0)}
});
test('manual mode does not require schedule dates',async()=>{
 const h=await harness({values:{festivalEnabled:'true',festivalMode:'manual',festivalName:'diwali',festivalStart:'',festivalEnd:''}});
 h.elements.get('saveSettings').listeners.click[0]();await flushWrites();
 assert.equal(h.transactions,1);assert.equal(h.writes[0].festival.startAt,'');assert.equal(h.writes[0].festival.endAt,'');
});
test('scheduled save converts midnight-crossing India values and preserves unknown settings',async()=>{
 const h=await harness({existingSettings:{futureTopLevel:{keep:true},festival:{futureFestivalField:'keep'}},values:{festivalEnabled:'true',festivalMode:'scheduled',festivalName:'diwali',festivalStart:'2026-11-15T23:30',festivalEnd:'2026-11-16T00:15'}});
 h.elements.get('saveSettings').listeners.click[0]();await flushWrites();
 assert.equal(h.transactions,1);assert.equal(h.writes[0].futureTopLevel.keep,true);assert.equal(h.writes[0].festival.futureFestivalField,'keep');
 assert.equal(h.writes[0].festival.startAt,'2026-11-15T18:00:00.000Z');assert.equal(h.writes[0].festival.endAt,'2026-11-15T18:45:00.000Z');
});
test('preview uses allowlisted IDs and isolates opener before navigation',async()=>{
 const popup={opener:{},location:{replace(url){this.href=url}}},h=await harness({popup,values:{festivalName:'christmas'}});
 h.elements.get('previewFestival').listeners.click[0]();assert.deepEqual(h.popupCalls,[['about:blank','_blank']]);assert.equal(popup.opener,null);
 assert.equal(popup.location.href,'https://example.test/index.html?festivalPreview=christmas');assert.match(h.elements.get('festivalPreviewStatus').textContent,/public, read-only demo/i);
});
test('popup blocking exposes a usable public preview link',async()=>{
 const h=await harness({popup:null,values:{festivalName:'holi'}});h.elements.get('previewFestival').listeners.click[0]();
 const fallback=h.elements.get('festivalPreviewFallback');assert.equal(fallback.hidden,false);assert.equal(fallback.href,'https://example.test/index.html?festivalPreview=holi');
 assert.match(h.elements.get('festivalPreviewStatus').textContent,/blocked/i);
});
test('unsupported festival preview IDs never open a URL',async()=>{
 const h=await harness({popup:null,values:{festivalName:'<img src=x onerror=alert(1)>'}});h.elements.get('previewFestival').listeners.click[0]();
 assert.equal(h.popupCalls.length,0);assert.match(h.elements.get('festivalPreviewStatus').textContent,/supported festival/i);
});
function studioValidationHarness(library,current){
 const status={textContent:''};
 const helperStart=studioSource.indexOf('function collectFestivalLibraryForSave(){');
 const helperEnd=studioSource.indexOf('\\nfunction applyFestival()',helperStart);
 assert.ok(helperStart>=0&&helperEnd>helperStart,'Studio schedule validation helper must exist');
 const helper=studioSource.slice(helperStart,helperEnd);
 const context={festivalLibrary:library,collectFestival:()=>current,indiaDateTime:window.FourFUIndiaDateTime,$:()=>status};
 try{return{result:vm.runInNewContext(helper+'\\ncollectFestivalLibraryForSave()',context),status,error:null}}
 catch(error){return{result:null,status,error}}
}
test('Experience Studio save and publish both invoke festival schedule validation',()=>{
 const saveStart=studioSource.indexOf('async function save(){'),publishStart=studioSource.indexOf('async function publish(){',saveStart),end=studioSource.indexOf('\\nfunction normaliseFestivals',publishStart);
 assert.ok(saveStart>=0&&publishStart>saveStart&&end>publishStart);
 assert.ok(studioSource.slice(saveStart,publishStart).includes('collectFestivalLibraryForSave()'));
 assert.ok(studioSource.slice(publishStart,end).includes('collectFestivalLibraryForSave()'));
});
test('Experience Studio includes the current unsaved profile and rejects invalid enabled schedules',()=>{
 const current={id:'diwali',name:'Edited Diwali',mode:'scheduled',enabled:true,startAt:'2026-11-15T18:00:00.000Z',endAt:'2026-11-15T18:45:00.000Z'};
 const h=studioValidationHarness([{id:'diwali',name:'Old Diwali',mode:'scheduled',enabled:true,startAt:current.startAt,endAt:current.endAt}],current);
 assert.equal(h.error,null);assert.equal(h.result[0].name,'Edited Diwali');
 const bad=studioValidationHarness([{id:'diwali',mode:'manual',enabled:false},{id:'holi',name:'Holi',mode:'scheduled',enabled:true,startAt:'',endAt:''}],{id:'diwali',name:'Diwali',mode:'manual',enabled:false,startAt:'',endAt:''});
 assert.match(bad.error?.message||'','Holi');assert.match(bad.status.textContent,/Holi.*Scheduled mode requires/);
});
test('Experience Studio allows manual mode without dates and disabled empty schedules',()=>{
 const current={id:'diwali',name:'Diwali',mode:'manual',enabled:true,startAt:'',endAt:''};
 const manual=studioValidationHarness([current],current);assert.equal(manual.error,null);
 const disabled={id:'holi',name:'Holi',mode:'scheduled',enabled:false,startAt:'',endAt:''};
 const inactive=studioValidationHarness([disabled],disabled);assert.equal(inactive.error,null);
});

