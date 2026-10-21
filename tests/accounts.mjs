import assert from 'node:assert/strict';
import {Accounts} from '../dist/account.js';
import {emptyProgress} from '../dist/progress.js';
class Storage{constructor(){this.map=new Map()}get length(){return this.map.size}key(i){return [...this.map.keys()][i]}getItem(k){return this.map.get(k)??null}setItem(k,v){this.map.set(k,v)}removeItem(k){this.map.delete(k)}}
const rows=[];let offline=false;
function client(){return {auth:{signOut:async()=>({error:null})},from(){let user;return {async upsert(batch){if(offline)return {error:new Error('offline')};for(const e of batch)if(!rows.some(x=>x.id===e.id&&x.user_id===e.user_id))rows.push({...e,sequence:rows.length+1});return {error:null}},select(){return this},eq(k,v){user=v;return this},order(){return this},async range(a,b){return offline?{error:new Error('offline')}:{data:rows.filter(x=>x.user_id===user).slice(a,b+1)}}}}}
}
async function make(storage,user){let state;const a=new Accounts({storage,onState:s=>state=s,onStatus:()=>{}});a.client=client();await a.activate({id:user,email:user+'@example.test'});return {a,get state(){return state}}}
const storage=new Storage();storage.setItem('curd-v1',JSON.stringify({...emptyProgress(),xp:10,done:['0-0']}));
const one=await make(storage,'one');assert.equal(one.state.xp,0,'guest progress must not auto-import');
one.a.importGuest();await new Promise(r=>setTimeout(r,0));assert.equal(one.state.xp,10);assert.equal(one.a.canImport(),false);
offline=true;one.a.record({...one.state,xp:35,done:['0-0','1-0']});await new Promise(r=>setTimeout(r,0));assert.equal(one.a.pending().length,1);await assert.rejects(()=>one.a.signOut(),/not synced/);
offline=false;await one.a.sync();assert.equal(one.a.pending().length,0);
const phone=await make(new Storage(),'one');assert.equal(phone.state.xp,35);assert.deepEqual(phone.state.done,['0-0','1-0']);
await one.a.signOut();assert.equal(one.state.xp,10,'sign-out restores guest state, not account data');await one.a.activate({id:'two'});assert.equal(one.state.xp,0,'second account cannot inherit first account state');
assert.equal(one.a.pending().length,0);
console.log('PASS: account isolation, explicit guest import, offline queue, sign-out protection, cross-device restoration');
const login = await make(new Storage(),'new-device');
let verified;
login.a.client.auth.verifyOtp=async args=>{verified=args;return {data:{user:{id:'one'}},error:null}};
const token='a'.repeat(64);
const link=`https://hpzjdrzyydsvgqlefmuz.supabase.co/auth/v1/verify?token=${token}&type=magiclink&redirect_to=https%3A%2F%2Fmattsimiele.github.io%2Fcurd_study%2F`;
await login.a.verifyLink(link);
assert.deepEqual(verified,{token_hash:token,type:'magiclink'});
assert.equal(login.state.xp,35,'pasted link restores same account on isolated device');
for(const invalid of [link.replace('hpzjdrzyydsvgqlefmuz','other-project'),link.replace('https:','http:'),link.replace('magiclink','recovery'),link.replace('/verify','/other'),'https://mattsimiele.github.io/curd_study/#access_token=secret','not a URL']){
 verified=null;await assert.rejects(()=>login.a.verifyLink(invalid));assert.equal(verified,null,'invalid links must not reach auth');
}
login.a.client.auth.verifyOtp=async()=>({error:new Error('expired')});
await assert.rejects(()=>login.a.verifyLink(link),/fresh email/);
console.log('PASS: Home Screen link login, account restoration, invalid origins/types and expired links');
