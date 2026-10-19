import {sourceLibrary} from '../dist/advanced.js';
import assert from 'node:assert/strict';
import {modules,lessonCount} from '../dist/content.js';
import {kind,isCorrect,canCheck,createSession,checkAttempt,advance,migrate,nextLesson,shuffleQuestion,inTier} from '../dist/learning.js';
assert.equal(lessonCount,45);
let questions=0,types=new Set();
for(const m of modules){assert.equal(m.lessons.length,5);assert(m.sources.length);for(const l of m.lessons){assert(l.read&&l.title);assert.equal(l.questions.length,l.level==='ccp'?6:3);for(const q of l.questions){questions++;types.add(kind(q));assert(q[0]&&q[3]);assert(new Set(q[1]).size===q[1].length);const indices=Array.isArray(q[2])?q[2]:[q[2]];assert(indices.every(i=>Number.isInteger(i)&&i>=0&&i<q[1].length));assert.equal(isCorrect(q,q[2]),true);if(kind(q)==='order'){assert.equal(indices.length,q[1].length);assert.equal(canCheck(q,[]),false);assert.equal(isCorrect(q,[...q[2]].reverse()),false);}if(kind(q)==='multi'){assert.equal(isCorrect(q,[...q[2]].reverse()),true);assert.equal(isCorrect(q,[]),false);}}}}
assert.equal(questions,189);assert.deepEqual([...types].sort(),['choice','multi','order']);
const data=modules[0].lessons[0].questions[0];const s=createSession([{key:'0-0-0',data}]);s.selected=(s.questions[s.step].data[2]+1)%data[1].length;assert.equal(checkAttempt(s),false);assert.equal(s.questions.length,2);assert.equal(advance(s),false);s.selected=(s.questions[s.step].data[2]+1)%data[1].length;checkAttempt(s);assert.equal(advance(s),false);s.selected=s.questions[s.step].data[2];assert.equal(checkAttempt(s),true);assert.equal(advance(s),true);assert.equal(s.correct,0);assert.equal(s.resolved.length,1);
const old={done:['0-0','1-0','7-0'],xp:65,days:['2026-10-19'],notes:[{cheese:'My Cheddar'}],missed:['0-0-1']};const migrated=migrate(old,modules);for(const key of Object.keys(old))assert.deepEqual(migrated[key],old[key]);assert.equal(nextLesson(modules,migrated.done),'0-1');assert.equal(nextLesson(modules,modules.flatMap((m,mi)=>m.lessons.map((l,li)=>`${mi}-${li}`))),null);assert.deepEqual(migrate({done:['999-0'],missed:['1-99-0'],xp:-3},modules).done,[]);


for(const m of modules)for(const l of m.lessons){if(l.level==='ccp'){assert.equal(l.sections.length,3);assert.equal(l.objectives.length,2);assert(l.references.length);for(const q of l.questions)assert(q[5].why);}for(const q of l.questions){const before=JSON.stringify(q);const shuffled=shuffleQuestion(q,()=>0);assert.equal(JSON.stringify(q),before);assert(isCorrect(shuffled,shuffled[2]));const text=(x)=>(Array.isArray(x[2])?x[2]:[x[2]]).map(i=>x[1][i]);assert.deepEqual(text(shuffled),text(q));}}
assert.equal(nextLesson(modules,[],'ccp'),'0-3');assert.equal(nextLesson(modules,['0-3'],'ccp'),'0-4');assert.equal(nextLesson(modules,['0-0','0-1','0-2'],'foundation'),'1-0');
const legacy=modules.flatMap((m,mi)=>m.lessons.slice(0,3).map((l,li)=>`${mi}-${li}`));assert.deepEqual(migrate({done:legacy},modules).done,legacy);assert.equal(nextLesson(modules,legacy,'ccp'),'0-3');assert.equal(nextLesson(modules,legacy,'foundation'),null);
console.log('PASS: 45 lessons, 189 exercises, 18 sourced applied lessons, shuffle answer mapping, tier navigation and all 27 legacy completion IDs.');

for(const m of modules)for(const l of m.lessons)for(const r of l.references||[])assert(sourceLibrary[r.source],r.source);
