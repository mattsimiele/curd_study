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
const passwordDevice=await make(new Storage(),'password-device');
let authArgs,savedPassword;
passwordDevice.a.client.auth.signInWithPassword=async args=>{authArgs=args;return {data:{user:{id:'one',email:'one@example.test'}}}};
await passwordDevice.a.signInPassword('one@example.test','test-only-password');
assert.equal(passwordDevice.state.xp,35);
assert.deepEqual(authArgs,{email:'one@example.test',password:'test-only-password'});
passwordDevice.a.client.auth.updateUser=async args=>{savedPassword=args;return {error:null}};
await assert.rejects(()=>passwordDevice.a.setPassword('short','short'),/8 characters/);
await assert.rejects(()=>passwordDevice.a.setPassword('long-password','different'),/match/);
assert.equal(savedPassword,undefined);
await passwordDevice.a.setPassword('long-password','long-password');
assert.deepEqual(savedPassword,{password:'long-password'});
assert.equal(passwordDevice.a.user.id,'one','setting password preserves account identity');
assert.ok(!JSON.stringify([...passwordDevice.a.storage.map]).includes('long-password'),'password never stored by app');
passwordDevice.a.client.auth.signInWithPassword=async()=>({error:new Error('invalid credentials')});
await assert.rejects(()=>passwordDevice.a.signInPassword('one@example.test','wrong'),/invalid credentials/);
console.log('PASS: password sign-in restores progress, password validation, account identity and credential storage');
globalThis.location={href:'https://mattsimiele.github.io/curd_study/'};
let signupArgs,resetArgs;
passwordDevice.a.client.auth.signUp=async args=>{signupArgs=args;return {data:{user:{id:'pending'},session:null}}};
await assert.rejects(()=>passwordDevice.a.signUp('new@example.test','short','short'),/8 characters/);
assert.equal(await passwordDevice.a.signUp('new@example.test','new-password','new-password'),false);
assert.equal(signupArgs.password,'new-password');assert.equal(signupArgs.options.emailRedirectTo,location.href);
passwordDevice.a.client.auth.resetPasswordForEmail=async(...args)=>{resetArgs=args;return {error:null}};
await passwordDevice.a.resetPassword('one@example.test');assert.equal(resetArgs[0],'one@example.test');
passwordDevice.a.client.auth.resetPasswordForEmail=async()=>({error:Object.assign(new Error('email rate limit exceeded'),{code:'over_email_send_rate_limit'})});
await assert.rejects(()=>passwordDevice.a.resetPassword('one@example.test'),e=>e.code==='over_email_send_rate_limit');
let emailSent=false;passwordDevice.a.client.auth.signInWithOtp=async()=>{emailSent=true;throw new Error('email limit')};
passwordDevice.a.client.auth.signInWithPassword=async()=>({data:{user:{id:'one'}}});
await passwordDevice.a.signInPassword('one@example.test','existing-password');assert.equal(emailSent,false,'password login must never send email');
console.log('PASS: signup confirmation, reset routing, preserved email-limit errors, password login bypasses email sending');
