import {accountConfig} from './config.js?v=051';
import {emptyProgress,progressDelta,reduceEvents,hasChanges} from './progress.js';
const IMPORT_ID='00000000-0000-4000-8000-000000000001';
export class Accounts {
 constructor({onState,onStatus,storage=localStorage}){this.storage=storage;this.onState=onState;this.onStatus=onStatus;this.user=null;this.client=null;this.confirmed=[];this.previous=emptyProgress();this.status='Guest mode · saved on this device';this.busy=false;this.generation=0;this.configured=!!(accountConfig.url&&accountConfig.publishableKey);}
 read(key,fallback){try{return JSON.parse(this.storage.getItem(key))??fallback;}catch{return fallback;}}
 guest(){return this.read('curd-v1',emptyProgress());}
 setStatus(message){this.status=message;this.onStatus?.();}
 prefix(user=this.user){return `curd-account:${user.id}:`;}
 pending(user=this.user){if(!user)return [];const prefix=this.prefix(user)+'pending:';const result=[];for(let i=0;i<this.storage.length;i++){const key=this.storage.key(i);if(key?.startsWith(prefix)){const e=this.read(key,null);if(e)result.push(e);}}return result.sort((a,b)=>a.localTime-b.localTime||a.id.localeCompare(b.id));}
 current(){return reduceEvents([...this.confirmed,...this.pending()]);}
 publish(){const state=this.current();this.previous=structuredClone(state);this.onState(state);}
 async init(){if(!this.configured)return;try{const {createClient}=await import('./vendor/supabase.js');this.client=createClient(accountConfig.url,accountConfig.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'curd-auth-v1'}});this.client.auth.onAuthStateChange((event,s)=>{if(event==='TOKEN_REFRESHED')return;setTimeout(()=>this.activate(s?.user||null),0);});const {data,error}=await this.client.auth.getSession();if(error)throw error;await this.activate(data.session?.user||null);window.addEventListener('online',()=>this.sync());window.addEventListener('focus',()=>this.sync());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')this.sync();});window.addEventListener('storage',e=>{if(this.user&&e.key?.startsWith(this.prefix()))this.sync();});}catch{this.setStatus('Unable to connect to sign-in. Reload to retry.');}}
 async activate(user){if(this.user?.id===user?.id)return;this.generation++;this.user=user;this.busy=false;if(!user){this.confirmed=[];this.previous=emptyProgress();this.onState(this.guest());this.setStatus('Signed out · guest progress stays on this device');return;}this.confirmed=this.read(this.prefix()+'confirmed',[]);this.publish();this.setStatus('Loading your account progress…');await this.sync();}
 record(state){if(!this.user){this.storage.setItem('curd-v1',JSON.stringify(state));return;}const delta=progressDelta(this.previous,state);if(!hasChanges(delta))return;const event={id:crypto.randomUUID(),payload:delta,localTime:Date.now()};this.storage.setItem(this.prefix()+'pending:'+event.id,JSON.stringify(event));this.previous=structuredClone(state);this.setStatus('Changes saved on device · syncing…');void this.sync();}
 async sync(){if(!this.user||!this.client||this.busy)return;this.busy=true;const user=this.user,generation=this.generation;try{
 const pending=this.pending(user);
 for(let i=0;i<pending.length;i+=50){const {error}=await this.client.from('curd_progress_events').upsert(pending.slice(i,i+50).map(e=>({user_id:user.id,id:e.id,payload:e.payload})),{onConflict:'user_id,id',ignoreDuplicates:true});if(error)throw error;}
 let rows=[],offset=0;while(true){const {data,error}=await this.client.from('curd_progress_events').select('id,payload,sequence').eq('user_id',user.id).order('sequence').range(offset,offset+499);if(error)throw error;rows.push(...data);if(data.length<500)break;offset+=500;}
 if(generation!==this.generation)return;
 this.storage.setItem(this.prefix(user)+'confirmed',JSON.stringify(rows));
 const received=new Set(rows.map(e=>e.id));for(const e of pending)if(received.has(e.id))this.storage.removeItem(this.prefix(user)+'pending:'+e.id);
 this.confirmed=rows;this.publish();this.setStatus(this.pending().length?'Changes queued for sync':'All progress synced to your account');
 }catch{if(generation===this.generation)this.setStatus('Not synced yet · changes kept on this device. Retry when online.');}
 finally{if(generation===this.generation){this.busy=false;if(this.pending().length&&this.status==='Changes queued for sync')void this.sync();}}}
 async signInPassword(email,password){if(!this.client)throw new Error('Account service is not connected yet.');const {data,error}=await this.client.auth.signInWithPassword({email,password});if(error)throw error;await this.activate(data.user);}
 async setPassword(password,confirmation){if(!this.client||!this.user)throw new Error('Sign in with your email link first.');if(password.length<8)throw new Error('Use at least 8 characters.');if(password!==confirmation)throw new Error('Passwords do not match.');const {error}=await this.client.auth.updateUser({password});if(error)throw error;}
 async sendCode(email){if(!this.client)throw new Error('Account service is not connected yet.');const {error}=await this.client.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:new URL('./',location.href).href}});if(error)throw error;}
 async verify(email,token){const {data,error}=await this.client.auth.verifyOtp({email,token,type:'email'});if(error)throw error;await this.activate(data.user);}
 async verifyLink(value){
 if(!this.client)throw new Error('Account service is not connected yet.');
 let link;try{link=new URL(value.trim());}catch{throw new Error('Copy the sign-in link from your newest Curd email, then paste it here.');}
 const type=link.searchParams.get('type'),token=link.searchParams.get('token');
 if(link.origin!==new URL(accountConfig.url).origin||link.pathname!=='/auth/v1/verify'||link.username||link.password||!['magiclink','signup','email'].includes(type)||!token||!/^[a-f0-9]{32,128}$/i.test(token))throw new Error('Use the original sign-in link from your Curd email, not the page address after opening it.');
 const {data,error}=await this.client.auth.verifyOtp({token_hash:token,type});
 if(error)throw new Error('This sign-in link could not be used. Request a fresh email and copy its link without opening it.');
 await this.activate(data.user);
 }
 async signOut(){if(this.pending().length){await this.sync();if(this.pending().length)throw new Error('Your changes have not synced. Connect and retry before signing out.');}const old=this.user;const {error}=await this.client.auth.signOut({scope:'local'});if(error)throw error;await this.activate(null);if(old)this.storage.removeItem(this.prefix(old)+'confirmed');}
 canImport(){return !!this.user&&!this.confirmed.some(e=>e.id===IMPORT_ID)&&!this.pending().some(e=>e.id===IMPORT_ID)&&(this.guest().done?.length||this.guest().notes?.length||this.guest().xp>0);}
 importGuest(){if(!this.canImport())return;const guest=this.guest(),current=this.current();const delta=progressDelta(emptyProgress(),guest);delta.xp=Math.max(0,(guest.xp||0)-current.xp);const event={id:IMPORT_ID,payload:delta,localTime:Date.now()};this.storage.setItem(this.prefix()+'pending:'+event.id,JSON.stringify(event));this.publish();void this.sync();}
}
