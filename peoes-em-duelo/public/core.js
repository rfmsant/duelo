/* utilities shared by every file */
const COLORS=['#FF5D73','#38D9E8','#C6FF3D','#FFD23F','#A77BFF','#FF9F43','#FF7AD9','#4D8BFF','#2EE59D','#F2F2F2'];
const $=s=>document.querySelector(s);
const app=$('#app');
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuf=(a,rnd=Math.random)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const on=(el,f)=>el.addEventListener('pointerdown',e=>{e.preventDefault();f(e)});
const uid=()=>Math.random().toString(36).slice(2,10);
const ss={get:k=>{try{return JSON.parse(sessionStorage.getItem(k))}catch(e){return null}},set:(k,v)=>{try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const ls={get:k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
/* seeded random: same seed → same level for both duelists */
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* pawn: flat shading (no gradients) */
function pawn(c,s=48){return `<svg width="${s}" height="${Math.round(s*1.25)}" viewBox="0 0 40 50" aria-hidden="true" class="pawn"><ellipse cx="20" cy="46.8" rx="15" ry="3" fill="rgba(0,0,0,.15)"/><path d="M13 44 L15.6 24 H24.4 L27 44 Z" fill="${c}"/><rect x="10" y="40.5" width="20" height="5.5" rx="2.75" fill="${c}"/><path d="M20 24 H24.4 L27 44 H20 Z" fill="rgba(0,0,0,.13)"/><rect x="20" y="40.5" width="10" height="5.5" rx="2.75" fill="rgba(0,0,0,.13)"/><path d="M16.5 26 L15 38" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="20" cy="24" rx="8.5" ry="2.6" fill="${c}"/><ellipse cx="20" cy="23.6" rx="8.5" ry="2.2" fill="#fff" opacity=".45"/><circle cx="20" cy="14" r="8.6" fill="${c}"/><path d="M20 5.4 A8.6 8.6 0 0 1 20 22.6 A6.2 8.6 0 0 0 20 5.4Z" fill="rgba(0,0,0,.12)"/><circle cx="16.8" cy="10.8" r="2.6" fill="#fff" opacity=".7"/></svg>`}
/* each game gets its own solid colour (game screen background and tile) */
const GRADS=['#ff2d55','#007aff','#34c759','#ff9500','#af52de','#5856d6','#00c7be','#ff3b30','#30b0c7','#a2845e','#ff6b35','#0a84ff'];
const gradOf=id=>{let h=0;for(const ch of id)h=(h*31+ch.charCodeAt(0))>>>0;return GRADS[h%GRADS.length]};

/* Store: Firebase Realtime Database, or a local stand-in that syncs browser tabs (for testing) */
const Store=(()=>{
  const cfg=window.FIREBASE_CONFIG||{};
  if(cfg.projectId&&window.firebase&&firebase.firestore&&!/[?&]local/.test(location.search)){
    firebase.initializeApp(cfg);const fs=firebase.firestore();const FV=firebase.firestore.FieldValue;
    const split=p=>{const s=p.split('/').filter(Boolean);return{doc:fs.collection('rooms').doc('D-'+s[1]),field:s.slice(2).join('.')}};
    const at=(o,f)=>{const v=f?f.split('.').reduce((x,k)=>x==null?undefined:x[k],o):o;return v===undefined?null:v};
    const cv=v=>v===null||v===undefined?FV.delete():v;
    const fail=e=>{toast('Erro do servidor: '+(e.code||e.message));throw e};
    return{local:false,fs:true,auth:firebase.auth(),
      on(p,cb){const {doc,field}=split(p);return doc.onSnapshot(s=>cb(s.exists?at(s.data(),field):null),fail)},
      set(p,v){const {doc,field}=split(p);return(field?doc.update({[field]:cv(v)}):v==null?doc.delete():doc.set(v)).catch(fail)},
      update(p,v){const {doc,field}=split(p);const u={};for(const k in v)u[(field?field+'.':'')+k.split('/').join('.')]=cv(v[k]);return doc.update(u).catch(fail)},
      get(p){const {doc,field}=split(p);return doc.get().then(s=>s.exists?at(s.data(),field):null).catch(fail)}};
  }
  const KEY='pd_local_db';let data=ls.get(KEY)||{};const subs=new Set();
  const bc='BroadcastChannel' in window?new BroadcastChannel('pd_local'):null;
  const clone=v=>v===undefined?null:JSON.parse(JSON.stringify(v));
  const parts=p=>p.split('/').filter(Boolean);
  const getAt=p=>parts(p).reduce((o,k)=>o==null?undefined:o[k],data);
  const setAt=(p,v)=>{const ks=parts(p);let o=data;ks.slice(0,-1).forEach(k=>{if(typeof o[k]!=='object'||o[k]===null)o[k]={};o=o[k]});
    if(v===null||v===undefined)delete o[ks[ks.length-1]];else o[ks[ks.length-1]]=clone(v)};
  const emit=()=>subs.forEach(s=>s.cb(clone(getAt(s.p))));
  const commit=()=>{ls.set(KEY,data);bc&&bc.postMessage(1);setTimeout(emit,0)};
  if(bc)bc.onmessage=()=>{data=ls.get(KEY)||{};emit()};
  addEventListener('storage',e=>{if(e.key===KEY){data=ls.get(KEY)||{};emit()}});
  return{local:true,
    on(p,cb){const s={p,cb};subs.add(s);setTimeout(()=>cb(clone(getAt(p))),0);return()=>subs.delete(s)},
    set(p,v){data=ls.get(KEY)||{};setAt(p,v);commit();return Promise.resolve()},
    update(p,v){data=ls.get(KEY)||{};for(const k in v)setAt(p+'/'+k,v[k]);commit();return Promise.resolve()},
    get:p=>Promise.resolve(clone(getAt(p))),
    tx(p,fn){data=ls.get(KEY)||{};const v=fn(clone(getAt(p)));if(v!==undefined){setAt(p,v);commit()}return Promise.resolve()}};
})();
function toast(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.style.cssText='position:fixed;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);z-index:50;background:#ff5d73;color:#fff;border-radius:12px;padding:12px 14px;font:500 14px Rubik,sans-serif;text-align:center';document.body.appendChild(t)}t.textContent=m;t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>t.hidden=true,6000)}

/* sound (Web Audio, no files) and vibration (Android only) */
let AC=null,muted=!!ls.get('pd_mute');
addEventListener('pointerdown',()=>{try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();else if(AC.state==='suspended')AC.resume()}catch(e){}},{capture:true});
function tone(f,d,type='sine',v=.16,at=0){if(!AC)return;try{const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+at;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
function vib(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}
function sfx(n){if(muted)return;({
  tap:()=>{tone(660,.05,'triangle',.1);vib(8)},
  ok:()=>{tone(880,.07);tone(1320,.09,'sine',.12,.06);vib(12)},
  bad:()=>{tone(196,.2,'square',.07);vib([40,30,40])},
  count:()=>tone(523,.09,'sine',.14),
  go:()=>{tone(1047,.16,'sine',.16);vib(30)},
  done:()=>{tone(659,.1);tone(880,.14,'sine',.16,.1)},
  win:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.15,'triangle',.16,i*.11));vib([60,40,120])},
  event:()=>{[392,523,659].forEach((f,i)=>tone(f,.12,'triangle',.12,i*.1));vib(50)}}[n]||(()=>{}))()}

/* avatar bubble: pawn inside a tinted circle with a coloured ring (Playus-style avatars) */
function bub(p,size=56,badge=''){return `<span class="bub" style="--pc:${p.color};--bs:${size}px">${badge?`<em>${badge}</em>`:''}${pawn(p.color,Math.round(size*.62))}</span>`}
