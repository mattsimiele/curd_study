// Account changes are immutable events. Retries reuse IDs; concurrent devices do not overwrite snapshots.
export const emptyProgress=()=>({done:[],xp:0,days:[],notes:[],missed:[],best:{},lastLesson:null,tier:'ccp'});
export function progressDelta(before,after){
 const added=k=>(after[k]||[]).filter(v=>!(before[k]||[]).includes(v));
 const removed=k=>(before[k]||[]).filter(v=>!(after[k]||[]).includes(v));
 const best=Object.fromEntries(Object.entries(after.best||{}).filter(([k,v])=>v>(before.best?.[k]||0)));
 const notes=(after.notes||[]).filter(n=>!before.notes?.some(old=>old.id===n.id&&JSON.stringify(old)===JSON.stringify(n)));
 const deletedNotes=(before.notes||[]).filter(n=>!after.notes?.some(next=>next.id===n.id)).map(n=>n.id);
 return {done:added('done'),days:added('days'),xp:Math.max(0,(after.xp||0)-(before.xp||0)),best,notes,deletedNotes,missed:added('missed'),resolved:removed('missed'),...(after.tier!==before.tier?{tier:after.tier}:{}),...(after.lastLesson!==before.lastLesson?{lastLesson:after.lastLesson}:{})};
}
export const hasChanges=d=>d.xp>0||['done','days','notes','deletedNotes','missed','resolved'].some(k=>d[k]?.length)||Object.keys(d.best||{}).length>0||'tier' in d||'lastLesson' in d;
export function reduceEvents(events){
 const state=emptyProgress(),seen=new Set(),notes=new Map(),deleted=new Set();
 // The backend sequence defines conflict order. Unsent local events follow confirmed events.
 for(const event of events){if(seen.has(event.id))continue;seen.add(event.id);const d=event.payload||{};
 for(const k of ['done','days'])state[k]=[...new Set([...state[k],...(d[k]||[])])];
 state.xp+=Math.max(0,Number(d.xp)||0);
 for(const [k,v] of Object.entries(d.best||{}))state.best[k]=Math.max(state.best[k]||0,Number(v)||0);
 for(const id of d.deletedNotes||[]){deleted.add(id);notes.delete(id);}
 for(const n of d.notes||[])if(n?.id&&!deleted.has(n.id))notes.set(n.id,n);
 state.missed=[...new Set([...state.missed,...(d.missed||[])])].filter(k=>!(d.resolved||[]).includes(k));
 if(['foundation','ccp','cheese'].includes(d.tier))state.tier=d.tier;
 if('lastLesson' in d)state.lastLesson=d.lastLesson;
 }
 state.notes=[...notes.values()];return state;
}
