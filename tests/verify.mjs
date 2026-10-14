import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
// Compile every inline script; no DOM or browser is simulated by this check.
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
 if(match[1].includes('src='))continue;
 new AsyncFunction(match[2]);
}
for(const file of ['assets/scene.js','assets/immersive.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'));
// Page-load resources must stay local or embedded. External navigation links are allowed.
const markup=html.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/g,'$1</script>');
for(const tag of markup.matchAll(/<(?:script|img|link)\b[^>]*>/g)){
 const ref=tag[0].match(/(?:src|href)="([^"]+)"/);
 if(!ref)continue;
 assert.ok(!/^https?:|^\/\//.test(ref[1]),'Remote runtime resource: '+ref[1]);
 if(!ref[1].startsWith('data:'))assert.ok(fs.existsSync(path.join(root,ref[1])),'Missing resource: '+ref[1]);
}
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const start=html.indexOf('const __m = {};');
const stop=html.indexOf('// ---- web/js/app.js');
assert.ok(start>0&&stop>start);
const modules=await new AsyncFunction(html.slice(start,stop)+'\nreturn __m;')();
const service=modules['web/js/journeyService.js'];
const {createState}=modules['web/js/state.js'];
const {DEMO_JOURNEY}=modules['shared/taxonomy.js'];
const storage=modules['web/js/storage.js'];
assert.equal(service.engineMode(),'geo');
assert.equal(await service.detectServer(),null);
const journeys=[DEMO_JOURNEY,{origin:'Hyderabad',destination:'Goa',tripDays:2,travelerType:'Friends',interests:['Food','Adventure']},{origin:'Chennai',destination:'Ooty',tripDays:3,travelerType:'Family',interests:['Nature']}];
for(const journey of journeys){
 const plan=await service.planJourney(journey);
 assert.ok(plan.route.distanceKm>0);assert.ok(plan.route.durationMin>0);
 assert.ok(plan.route.geometry.length>1);assert.ok(plan.phases.length>0);
 const state={...createState(),...journey,originalDays:journey.tripDays,plan,journeyId:'test-'+plan.id};
 const before=service.tripImpact(plan,state);
 const choices=plan.places.filter(p=>p.openNow!==false).slice(0,2);
 assert.equal(choices.length,2,'Need two candidate stops');
 state.selectedStops=choices.map(p=>p.id);
 const after=service.tripImpact(plan,state);
 assert.ok(after.extraDistanceKm>=before.extraDistanceKm);
 assert.ok(after.extraTravelMinutes>=before.extraTravelMinutes);
 assert.ok(after.totalVisitMinutes>0);
 state.tripDays=1;
 const over=service.tripImpact(plan,state);
 assert.ok(over.exceedsPlannedDuration||over.requiredDays<=1);
 state.tripDays=Math.max(1,over.requiredDays);
 assert.equal(service.tripImpact(plan,state).exceedsPlannedDuration,false);
 const originalPlaceCount=plan.places.length;
 state.skippedPlaces=[choices[0].id];state.selectedStops=[choices[1].id];
 assert.ok(service.tripImpact(plan,state).totalVisitMinutes<after.totalVisitMinutes);
 assert.equal(plan.places.length,originalPlaceCount);
 assert.equal(storage.saveCurrentJourney(state),true);
 assert.deepEqual(storage.loadCurrentJourney().selectedStops,state.selectedStops);
 storage.saveJourney(state);
 assert.ok(storage.loadJourneys().some(j=>j.journeyId===state.journeyId));
 console.log(`PASS: ${journey.origin} → ${journey.destination}; ${plan.phases.length} phases, ${plan.places.length} discoveries; totals, extend, removal, storage.`);
}
assert.ok([...memory.keys()].every(k=>k.startsWith('route-plus-3d-')),'Storage must not collide with the old preview');
await assert.rejects(()=>service.planJourney({...DEMO_JOURNEY,origin:'NoSuchTown123'}));
const css=fs.readFileSync(path.join(root,'assets/immersive.css'),'utf8');
assert.ok(css.includes('@media(max-width:700px)'));
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
assert.equal(css.split('{').length,css.split('}').length);
assert.ok(!html.includes('<meta name="route-plus-3d-api"'));
assert.ok(html.includes("requested === 'sample' ? 'sample' : 'geo'"));
console.log('PASS: script syntax, local resources, isolated storage, unsupported city, mobile/reduced-motion rules, static-only provider guard. Browser rendering is NOT verified.');
