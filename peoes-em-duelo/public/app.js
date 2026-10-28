/* Rooms, rounds, bets and scoring. The host's phone moves the game forward; everyone renders from the shared room. */
const me={pid:ss.get('pd_pid')||uid(),code:ss.get('pd_code')||null};ss.set('pd_pid',me.pid);
let room=null,unsub=null,active=null,uiTimers=[],busy='',lastLive=0,myBet=null,myVote=null;
const gById=id=>GAMES.find(g=>g.id===id)||GAMES[0];
const P=id=>room&&room.players&&room.players[id];
const isHost=()=>room&&room.host===me.pid;
const playKey=()=>`${room.st.round}_${room.st.rep||0}`;
const ref=p=>`rooms/${me.code}${p?'/'+p:''}`;
const players=()=>Object.entries(room.players||{}).map(([id,p])=>({id,...p}));
const clearUi=()=>{uiTimers.forEach(clearInterval);uiTimers=[]};
const alOf=id=>Object.values(room.al||{}).find(a=>a.a===id||a.b===id);

/* ---------- home ---------- */
function home(err){
  clearUi();
  const name=ls.get('pd_name')||'';
  app.innerHTML=`<div class="hero">
    <div class="pawnrow">${COLORS.slice(0,5).map((c,i)=>`<span style="--d:${i*.12}s">${pawn(c,50)}</span>`).join('')}</div>
    <h1 class="logo">PEÕES<br><em>EM DUELO</em></h1>
    <p class="tag">Duelos, apostas e goles. Cada um no seu telemóvel, 3 a 10 jogadores, ${GAMES.length} mini-jogos.</p></div>
    ${err?`<p class="note" style="color:var(--bad)">${esc(err)}</p>`:''}
    <input class="field" id="nm" maxlength="12" placeholder="O teu nome" value="${esc(name)}" autocomplete="off" aria-label="O teu nome">
    <button class="btn" id="mk">Criar sala</button>
    <div class="row"><input class="field code" id="cd" maxlength="4" placeholder="CÓDIGO" autocomplete="off" aria-label="Código da sala"><button class="btn ghost" id="jn" style="flex:.7">Entrar</button></div>
    ${Store.local?'<p class="note">Modo de teste: o Firebase ainda não está configurado, por isso o jogo só liga separadores deste browser.</p>':''}`;
  const nm=()=>{const v=$('#nm').value.trim();if(!v){$('#nm').focus();return null}ls.set('pd_name',v);return v};
  $('#mk').onclick=async()=>{const n=nm();if(!n)return;const L='ABCDEFGHJKLMNPQRSTUVWXYZ';let code;
    do{code=Array.from({length:4},()=>L[R(0,L.length-1)]).join('')}while(await Store.get('rooms/'+code));
    await Store.set('rooms/'+code,{host:me.pid,created:Date.now(),cfg:{total:12},st:{phase:'lobby',round:0},
      players:{[me.pid]:{name:n,color:COLORS[0],pts:0,sips:0,wins:0,duels:0,j:Date.now()}}});
    enter(code)};
  $('#jn').onclick=async()=>{const n=nm();if(!n)return;const code=$('#cd').value.trim().toUpperCase();if(code.length!==4)return home('O código tem 4 letras.');
    const r=await Store.get('rooms/'+code);if(!r)return home('Não encontrei essa sala.');
    if(!(r.players&&r.players[me.pid])){const used=Object.values(r.players||{}).map(p=>p.color);if(Object.keys(r.players||{}).length>=10)return home('A sala está cheia.');
      await Store.set(`rooms/${code}/players/${me.pid}`,{name:n,color:COLORS.find(c=>!used.includes(c))||COLORS[0],pts:0,sips:0,wins:0,duels:0,j:Date.now()})}
    enter(code)};
}
function enter(code){me.code=code;ss.set('pd_code',code);unsub&&unsub();unsub=Store.on('rooms/'+code,r=>{room=r;if(!r||!r.players||!r.players[me.pid]){leave('Saíste da sala ou ela já não existe.');return}render();if(isHost())hostTick()})}
function leave(msg){unsub&&unsub();unsub=null;room=null;me.code=null;ss.set('pd_code',null);if(active){active.kill();active=null}home(msg)}

/* ---------- shared bits ---------- */
const head=()=>`<header class="bar"><span class="eyebrow">Sala ${me.code}${room.st.round?` · Ronda ${room.st.round} de ${room.cfg.total}`:''}</span><button class="link" id="leave">Sair</button></header>`;
const strip=()=>`<div class="strip">${players().sort((a,b)=>b.pts-a.pts||a.sips-b.sips).map(p=>`<span class="chip">${pawn(p.color,16)}${esc(p.name)} <b>${p.pts} pts · ${p.sips}🍺</b>${alOf(p.id)?'🤝':''}</span>`).join('')}</div>`;
const duo=()=>[P(room.st.a),P(room.st.b)];
const vsBlock=(s=64)=>{const [A,B]=duo();return `<div class="vs"><div class="vp">${pawn(A.color,s)}<b>${esc(A.name)}</b></div><span class="vsx">VS</span><div class="vp">${pawn(B.color,s)}<b>${esc(B.name)}</b></div></div>`};
const whereTxt=g=>g.kind==='phone'?WHERE.phone+esc(P(room.st.a).name):WHERE[g.kind];
const bind=()=>{const l=$('#leave');if(l)l.onclick=()=>{if(isHost()&&players().length>1&&!confirmLeave())return;leave()}};
let leaveArmed=0;function confirmLeave(){if(Date.now()-leaveArmed<3000)return true;leaveArmed=Date.now();const l=$('#leave');if(l)l.textContent='Toca outra vez para sair';return false}
const amDuelist=()=>me.pid===room.st.a||me.pid===room.st.b;
const specs=()=>players().filter(p=>p.id!==room.st.a&&p.id!==room.st.b);

/* ---------- main render ---------- */
function render(){
  const st=room.st||{};
  if(active&&(st.phase!=='play'||active.key!==playKey())){active.kill();active=null}
  if(active)return;
  clearUi();
  ({lobby:vLobby,alliance:vAlliance,intro:vIntro,bet:vBet,play:vPlay,tie:vTie,result:vResult,final:vFinal}[st.phase]||vLobby)();
  bind();
}
function vLobby(){
  const ps=players(),mine=P(me.pid),used=ps.filter(p=>p.id!==me.pid).map(p=>p.color);
  app.innerHTML=`${head()}<p class="sub" style="text-align:center">Código da sala</p><div class="roomcode">${me.code}</div>
  <p class="sub" style="text-align:center">Os outros abrem o mesmo link e entram com este código.</p>
  <h2>Jogadores <small>${ps.length}/10</small></h2>
  <ul class="plist">${ps.map(p=>`<li>${pawn(p.color,26)}<span>${esc(p.name)}</span>${p.id===room.host?'<small>ANFITRIÃO</small>':''}</li>`).join('')}</ul>
  <h2>A tua cor</h2><div class="colors">${COLORS.map(c=>`<button style="--c:${c}" data-c="${c}" class="${mine.color===c?'on':''}" ${used.includes(c)?'disabled':''} aria-label="Cor"></button>`).join('')}</div>
  ${isHost()?`<h2>Rondas</h2><div class="seg">${[8,12,16,24].map(n=>`<button class="${room.cfg.total===n?'on':''}" data-r="${n}">${n}</button>`).join('')}</div>
    <button class="btn" id="start" ${ps.length<3?'disabled':''}>${ps.length<3?'Faltam jogadores (mínimo 3)':'Começar'}</button>`
  :`<div class="wait"><span class="dotsload">À espera que o anfitrião comece</span></div>`}`;
  app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>Store.set(ref(`players/${me.pid}/color`),b.dataset.c));
  app.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>Store.set(ref('cfg/total'),+b.dataset.r));
  const s=$('#start');if(s)s.onclick=()=>hostNext(true);
}
function vAlliance(){
  const al=room.st.newAl;const x=P(al.a),y=P(al.b);
  app.innerHTML=`${head()}<div class="event"><span class="eyebrow">Evento especial</span><h1 class="logo sm">ALIANÇA!</h1>
  <div class="vs">${pawn(x.color,64)}<span class="vsx">🤝</span>${pawn(y.color,64)}</div>
  <p class="lead"><b>${esc(x.name)}</b> e <b>${esc(y.name)}</b> ficam aliados durante 3 rondas.</p><p class="sub">Quando um bebe, o outro bebe o mesmo.</p>
  ${isHost()?'<button class="btn" id="ok" style="width:100%">Continuar</button>':''}</div>`;
  const ok=$('#ok');if(ok)ok.onclick=()=>Store.update(ref('st'),{phase:'intro'});
}
function vIntro(){
  const g=gById(room.st.game);
  app.innerHTML=`${head()}${vsBlock()}
  <div class="card game"><span class="eyebrow ink">Mini-jogo</span><h3><span class="gi">${g.icon}</span>${g.name}</h3><p>${g.rules}</p><span class="where">📍 ${whereTxt(g)}</span></div>
  ${isHost()?`<div class="row"><button class="btn ghost" id="swap">Outro jogo</button><button class="btn" id="tobet">Abrir apostas</button></div>`:`<div class="wait"><span class="dotsload">O anfitrião vai abrir as apostas</span></div>`}
  ${strip()}`;
  const sw=$('#swap');if(sw){sw.onclick=()=>{const g2=pickGame();Store.update(ref(),{'st/game':g2,'st/seed':R(1,1e9),recent:[...(room.recent||[]),g2].slice(-16)})};
    $('#tobet').onclick=()=>{myBet=null;Store.update(ref('st'),{phase:'bet'})}}
}
function vBet(){
  const [A,B]=duo(),r=room.st.round,bets=(room.bets&&room.bets[r])||{},sp=specs();
  const list=`<ul class="betlist">${sp.map(p=>{const b=bets[p.id];return `<li>${pawn(p.color,20)}<b>${esc(p.name)}</b>${b?`<span class="ok">apostou ✓</span>`:'<span class="sub dotsload">a pensar</span>'}</li>`}).join('')}</ul>`;
  let body;
  if(amDuelist())body=`<p class="lead">Estás no duelo. Os outros estão a apostar em quem ganha.</p>${list}`;
  else if(bets[me.pid]){const b=bets[me.pid];body=`<div class="card"><span class="eyebrow ink">A tua aposta</span><h3 style="font-size:24px;margin-top:6px">${esc([A,B][b.on].name)} · ${b.amt} ${b.amt>1?'goles':'gole'}</h3><p>Se acertares, distribuis os goles e ganhas 1 ponto. Se falhares, bebes tu.</p></div>${list}`}
  else{if(!myBet||myBet.r!==r)myBet={r,on:null,amt:1};
    body=`<p class="sub">Quem ganha? Se acertares, distribuis os goles e ganhas 1 ponto. Se falhares, bebes tu.</p>
    <div class="bsel">${[A,B].map((d,i)=>`<button class="bp ${myBet.on===i?'on':''}" data-on="${i}" style="--pc:${d.color}">${pawn(d.color,44)}<b>${esc(d.name)}</b></button>`).join('')}</div>
    <div class="step"><button id="m" ${myBet.amt<=1?'disabled':''} aria-label="Menos">−</button><span>${myBet.amt}🍺</span><button id="p" ${myBet.amt>=3?'disabled':''} aria-label="Mais">+</button></div>
    <button class="btn" id="cf" ${myBet.on==null?'disabled':''}>Apostar</button>${list}`}
  app.innerHTML=`${head()}${vsBlock(48)}<h2>Apostas</h2>${body}${isHost()?`<button class="btn ghost" id="lock">🔒 Fechar apostas e jogar</button>`:''}`;
  app.querySelectorAll('.bp').forEach(b=>b.onclick=()=>{myBet.on=+b.dataset.on;vBet();bind()});
  const m=$('#m');if(m){m.onclick=()=>{myBet.amt--;vBet();bind()};$('#p').onclick=()=>{myBet.amt++;vBet();bind()};$('#cf').onclick=()=>Store.set(ref(`bets/${r}/${me.pid}`),myBet)}
  const l=$('#lock');if(l)l.onclick=()=>startPlay();
}
function startPlay(rep){const u={'st/phase':'play','st/tStart':null};if(rep!=null){u['st/rep']=rep;u['st/seed']=R(1,1e9)}Store.update(ref(),u)}

/* ---------- playing ---------- */
function vPlay(){
  const g=gById(room.st.game),key=playKey(),[A,B]=duo();
  if(g.kind==='solo'){
    if(amDuelist()){const mine=room.res&&room.res[key]&&room.res[key][me.pid];
      if(mine&&mine.done)return vWatch(g,key);
      active={key,kill:()=>{}};
      const api=runSolo(g,room.st.seed,{
        live:v=>{const now=Date.now();if(now-lastLive>700){lastLive=now;Store.update(ref(`res/${key}/${me.pid}`),{live:v})}},
        done:v=>Store.set(ref(`res/${key}/${me.pid}`),{live:v,score:v,done:true,started:true})});
      active.kill=api.kill;
      Store.update(ref(`res/${key}/${me.pid}`),{started:true});return}
    return vWatch(g,key);
  }
  if(g.kind==='phone'){
    if(me.pid===room.st.a){active={key,kill:()=>{}};const ctx=runPhone(g,A,B,w=>Store.set(ref(`win/${key}`),w));active.kill=ctx.kill;return}
    app.innerHTML=`${head()}${vsBlock()}<div class="card game"><h3><span class="gi">${g.icon}</span>${g.name}</h3><p>${g.rules}</p><span class="where">📍 ${whereTxt(g)}</span></div><div class="wait"><span class="dotsload">A jogar no telemóvel de ${esc(A.name)}</span></div>${hostManual()}`;
    bindManual();return}
  vRef(g,key);
}
function vWatch(g,key){
  const res=(room.res&&room.res[key])||{};
  const row=p=>{const r=res[p.id]||{};const val=g.hideLive?(r.done?'✓':'…'):fmtScore(g,r.live);return `<div class="wrow">${pawn(p.color,34)}<div><b>${esc(p.name)}</b><small>${r.done?'Terminou':r.started?'A jogar':'Ainda não começou'}</small></div><span class="ws">${r.live==null&&!r.done?'—':val}</span></div>`};
  const [A,B]=duo();
  app.innerHTML=`${head()}<div class="card game"><span class="eyebrow ink">${whereTxt(g)}</span><h3><span class="gi">${g.icon}</span>${g.name}</h3><p>${g.rules}</p></div>
  <h2>Ao vivo</h2><div class="watch">${row(A)}${row(B)}</div><p class="sub">${g.better==='low'?'Ganha o resultado mais baixo.':g.cmp?'':'Ganha o resultado mais alto.'}</p>${hostManual()}${strip()}`;
  bindManual();
}
function vRef(g,key){
  const st=room.st,[A,B]=duo(),votes=(room.votes&&room.votes[key])||{},sp=specs();
  const text=g.text?g.text(st.seed):g.rules;
  let secret='';
  if(g.secret&&amDuelist()){const w=shuf(g.secret,rng(st.seed));const mine=w[me.pid===st.a?0:1];
    secret=`<button class="secret" id="sec"><span>Carrega e segura para veres a tua palavra</span></button>`;
    setTimeout(()=>{const b=$('#sec');if(!b)return;const sp_=b.querySelector('span'),o=sp_.textContent;const show=()=>{b.classList.add('show');sp_.textContent=mine},hide=()=>{b.classList.remove('show');sp_.textContent=o};
      b.addEventListener('pointerdown',e=>{e.preventDefault();show()});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,hide))})}
  const timer=g.timer?`<div class="timer"><span id="tv">${g.timer}s</span>${isHost()?`<button class="btn ghost sm" id="ts">${st.tStart?'Recomeçar':'Iniciar'}</button>`:''}</div>`:'';
  const tally=[0,0];Object.values(votes).forEach(v=>tally[v]++);
  const voteUI=amDuelist()?`<p class="sub" style="text-align:center">O público está a votar em quem ganhou.</p>`
    :`<h3 class="who">Quem ganhou?</h3><div class="row">${[A,B].map((p,i)=>`<button class="pick ${votes[me.pid]===i?'on':''}" data-v="${i}">${pawn(p.color,46)}<b>${esc(p.name)}</b><small>${tally[i]} ${tally[i]===1?'voto':'votos'}</small></button>`).join('')}</div>`;
  app.innerHTML=`${head()}${vsBlock(48)}<div class="card rules"><span class="eyebrow ink">${g.icon} ${g.name}</span><p style="margin-top:6px">${text}</p></div>${secret}${timer}${voteUI}
  <p class="sub" style="text-align:center">${Object.keys(votes).length} de ${sp.length} votos</p>
  ${isHost()?`<button class="btn ghost" id="close">Fechar votação</button>`:''}`;
  app.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>Store.set(ref(`votes/${key}/${me.pid}`),+b.dataset.v));
  const ts=$('#ts');if(ts)ts.onclick=()=>Store.update(ref('st'),{tStart:Date.now()});
  const cl=$('#close');if(cl)cl.onclick=()=>closeVotes(true);
  if(g.timer){const upd=()=>{const tv=$('#tv');if(!tv)return;const s=room.st.tStart;const left=s?Math.max(0,Math.ceil(g.timer-(Date.now()-s)/1000)):g.timer;
    tv.textContent=s&&left===0?'Tempo!':left+'s';tv.classList.toggle('zero',!!s&&left===0)};upd();uiTimers.push(setInterval(upd,250))}
  if(g.secret&&amDuelist())active={key,kill:()=>{}};
}
const hostManual=()=>isHost()?`<details class="note"><summary>Problemas? Decidir à mão</summary><div class="row" style="margin-top:10px">${duo().map((p,i)=>`<button class="btn ghost sm" data-mw="${i}">${esc(p.name)} ganhou</button>`).join('')}</div></details>`:'';
const bindManual=()=>app.querySelectorAll('[data-mw]').forEach(b=>b.onclick=()=>finish(+b.dataset.mw));
function vTie(){
  const g=gById(room.st.game);
  app.innerHTML=`${head()}<div class="event"><span class="eyebrow">${g.icon} ${g.name}</span><h1 class="logo sm">EMPATE!</h1><p class="lead">Ninguém ganhou.</p>
  ${isHost()?`<button class="btn" id="re" style="width:100%">Repetir o duelo</button><div class="row" style="width:100%">${duo().map((p,i)=>`<button class="btn ghost sm" data-mw="${i}">${esc(p.name)} ganha</button>`).join('')}</div>`:'<div class="wait"><span class="dotsload">O anfitrião decide</span></div>'}</div>`;
  const re=$('#re');if(re)re.onclick=()=>startPlay((room.st.rep||0)+1);bindManual();
}
function vResult(){
  const L=room.last||{},g=gById(room.st.game),W=P(L.wid);
  const rows=(L.lines||[]).map(l=>{const p=P(l.id);if(!p)return'';const parts=[];if(l.pts)parts.push(`<span class="v up">+${l.pts} pts</span>`);if(l.sips)parts.push(`<span class="v down">bebe ${l.sips}</span>`);if(l.give)parts.push(`<span class="v up">distribui ${l.give}</span>`);
    return `<li>${pawn(p.color,22)}<b>${esc(p.name)}${l.id===L.wid?' 🏆':''}</b>${parts.join(' · ')||'<span class="v zero">safo</span>'}</li>`}).join('');
  const last=room.st.round>=room.cfg.total;
  app.innerHTML=`${head()}<div class="winner">${pawn(W.color,72)}<span class="eyebrow">${g.icon} ${g.name}</span><h1>${esc(W.name)} ganhou!</h1>${L.scores?`<p class="sub">${L.scores}</p>`:''}</div>
  <ul class="deltas">${rows}</ul>${(L.notes||[]).map(n=>`<p class="sub">${n}</p>`).join('')}
  ${isHost()?`<button class="btn" id="nx">${last?'Ver resultados finais':'Próxima ronda'}</button>`:'<div class="wait"><span class="dotsload">O anfitrião vai continuar</span></div>'}${strip()}`;
  const nx=$('#nx');if(nx)nx.onclick=()=>hostNext();
}
function vFinal(){
  const ps=players();const byPts=[...ps].sort((a,b)=>b.pts-a.pts||b.wins-a.wins),bySips=[...ps].sort((a,b)=>b.sips-a.sips);
  const pod=[byPts[1],byPts[0],byPts[2]].map((p,i)=>p?`<div class="pod">${pawn(p.color,i===1?60:46)}<b>${esc(p.name)}</b><small>${p.pts} pts</small><div class="blk" style="height:${[70,100,50][i]}px">${[2,1,3][i]}</div></div>`:'').join('');
  app.innerHTML=`${head()}<h1 class="logo sm" style="text-align:center">PÓDIO</h1><div class="podium">${pod}</div>
  <h2>Pontos</h2><ul class="deltas">${byPts.map((p,i)=>`<li><span class="v zero">${i+1}</span>${pawn(p.color,22)}<b>${esc(p.name)}</b><span class="v">${p.pts} pts · ${p.wins}🏆</span></li>`).join('')}</ul>
  <h2>Goles bebidos</h2><ul class="deltas">${bySips.map((p,i)=>`<li><span class="v zero">${i+1}</span>${pawn(p.color,22)}<b>${esc(p.name)}</b><span class="v down">${p.sips} 🍺</span></li>`).join('')}</ul>
  ${isHost()?'<button class="btn" id="again">Nova partida com os mesmos jogadores</button>':''}`;
  const ag=$('#again');if(ag)ag.onclick=()=>{const pl={};ps.forEach(p=>{const {id,...rest}=p;pl[id]={...rest,pts:0,sips:0,wins:0,duels:0}});
    Store.update(ref(),{players:pl,st:{phase:'lobby',round:0},bets:null,res:null,votes:null,win:null,last:null,al:null,recent:null})};
}

/* ---------- host logic ---------- */
function pickGame(){const rec=room.recent||[];let pool=GAMES.filter(g=>!rec.includes(g.id)&&g.id!==room.st.game);if(!pool.length)pool=GAMES;
  /* keep a healthy mix: mostly own-phone games */
  const roll=Math.random(),want=roll<.62?'solo':roll<.82?'ref':'phone';const sub=pool.filter(g=>g.kind===want);return pick(sub.length?sub:pool).id}
function hostNext(first){
  busy='';const ps=players();const round=(first?0:room.st.round)+1;
  if(!first&&round>room.cfg.total)return Store.update(ref('st'),{phase:'final'});
  const sorted=shuf(ps).sort((a,b)=>a.duels-b.duels);const a=sorted[0];const prev=[room.st.a,room.st.b];
  const b=sorted.slice(1).find(p=>!(prev.includes(p.id)&&prev.includes(a.id)))||sorted[1];const [x,y]=Math.random()<.5?[a,b]:[b,a];
  const game=pickGame();const st={round,a:x.id,b:y.id,game,seed:R(1,1e9),rep:0,phase:'intro'};
  const free=shuf(ps.filter(p=>!alOf(p.id)));
  if(round%4===0&&ps.length>=4&&free.length>=2){const al={a:free[0].id,b:free[1].id,left:3};st.phase='alliance';st.newAl=al;
    return Store.update(ref(),{st,['al/'+uid()]:al,recent:[...(room.recent||[]),game].slice(-16)})}
  Store.update(ref(),{st,recent:[...(room.recent||[]),game].slice(-16)});
}
function hostTick(){
  const st=room.st;if(st.phase!=='play')return;const g=gById(st.game),key=playKey();
  if(g.kind==='solo'){const r=(room.res&&room.res[key])||{};const ra=r[st.a],rb=r[st.b];
    if(ra&&rb&&ra.done&&rb.done){const w=cmpScores(g,ra.score,rb.score);if(w<0)return once('tie'+key,()=>Store.update(ref('st'),{phase:'tie'}));
      return finish(w,`${esc(P(st.a).name)}: ${fmtScore(g,ra.score)} · ${esc(P(st.b).name)}: ${fmtScore(g,rb.score)}`)}}
  if(g.kind==='phone'){const w=room.win&&room.win[key];if(w===0||w===1)return finish(w)}
  if(g.kind==='ref')closeVotes(false);
}
function closeVotes(force){
  const key=playKey(),votes=(room.votes&&room.votes[key])||{},sp=specs();const t=[0,0];Object.values(votes).forEach(v=>t[v]++);
  if(!force&&Object.keys(votes).length<sp.length)return;
  if(t[0]===t[1])return force?once('tie'+key,()=>Store.update(ref('st'),{phase:'tie'})):undefined;
  finish(t[0]>t[1]?0:1);
}
function once(k,f){if(busy===k)return;busy=k;f()}
function finish(w,scores){
  const st=room.st,key='fin'+st.round;if(busy===key)return;busy=key;
  const ids=[st.a,st.b],wid=ids[w],lid=ids[1-w];
  const pl=JSON.parse(JSON.stringify(room.players));const d={};Object.keys(pl).forEach(id=>d[id]={id,pts:0,sips:0,give:0});
  d[wid].pts+=3;d[lid].sips+=2;pl[wid].wins++;pl[wid].duels++;pl[lid].duels++;
  const bets=(room.bets&&room.bets[st.round])||{};
  for(const [id,b] of Object.entries(bets)){if(!d[id])continue;if(ids[b.on]===wid){d[id].pts+=1;d[id].give+=b.amt}else d[id].sips+=b.amt}
  const notes=[];const al=JSON.parse(JSON.stringify(room.al||{}));
  for(const [k,x] of Object.entries(al)){if(!d[x.a]||!d[x.b]){delete al[k];continue}const t=d[x.a].sips+d[x.b].sips;
    if(t&&d[x.a].sips!==d[x.b].sips)notes.push(`🤝 ${esc(pl[x.a].name)} e ${esc(pl[x.b].name)} bebem juntos.`);if(t){d[x.a].sips=t;d[x.b].sips=t}
    x.left--;if(x.left<=0)delete al[k]}
  Object.values(d).forEach(x=>{pl[x.id].pts+=x.pts;pl[x.id].sips+=x.sips});
  const lines=Object.values(d).sort((x,y)=>(y.pts-x.pts)||(x.sips-y.sips));
  Store.update(ref(),{players:pl,al:Object.keys(al).length?al:null,last:{wid,lines,notes,scores:scores||null},'st/phase':'result'});
}

/* boot: with Firebase, sign in with a simple name + password first */
function boot(){if(me.code){Store.get('rooms/'+me.code).then(r=>r&&r.players&&r.players[me.pid]?enter(me.code):home())}else home()}
function login(err){
  const last=ls.get('pd_user')||'';
  app.innerHTML=`<div class="hero"><div class="pawnrow">${COLORS.slice(0,5).map((c,i)=>`<span style="--d:${i*.12}s">${pawn(c,50)}</span>`).join('')}</div>
  <h1 class="logo">PEÕES<br><em>EM DUELO</em></h1><p class="tag">Entra com o teu nome de utilizador. Se for a primeira vez, a conta é criada na hora.</p></div>
  ${err?`<p class="note" style="color:var(--bad)">${esc(err)}</p>`:''}
  <form id="lf" style="display:flex;flex-direction:column;gap:12px">
  <input class="field" id="lu" maxlength="20" placeholder="Nome de utilizador" autocomplete="username" autocapitalize="none" value="${esc(last)}" aria-label="Nome de utilizador">
  <input class="field" id="lp" type="password" minlength="6" placeholder="Palavra-passe (mínimo 6)" autocomplete="current-password" aria-label="Palavra-passe">
  <button class="btn" id="lb">Entrar</button></form>`;
  $('#lf').onsubmit=async e=>{e.preventDefault();
    const user=$('#lu').value.trim().toLowerCase().replace(/[^a-z0-9._-]/g,''),pw=$('#lp').value;
    if(user.length<2)return login('O nome de utilizador precisa de pelo menos 2 letras ou números.');
    if(pw.length<6)return login('A palavra-passe precisa de pelo menos 6 caracteres.');
    $('#lb').disabled=true;$('#lb').textContent='A entrar…';ls.set('pd_user',user);
    const email=user+'@peoes-em-duelo.app';
    try{await Store.auth.signInWithEmailAndPassword(email,pw)}
    catch(e1){
      if(!['auth/invalid-credential','auth/user-not-found','auth/invalid-login-credentials'].includes(e1.code))return login('Não deu para entrar ('+e1.code+').');
      try{await Store.auth.createUserWithEmailAndPassword(email,pw);if(!ls.get('pd_name'))ls.set('pd_name',user.slice(0,12))}
      catch(e2){login(e2.code==='auth/email-already-in-use'?'Palavra-passe errada para esse nome.':'Não deu para criar a conta ('+e2.code+').')}}};
}
if(Store.fs){app.innerHTML='<div class="wait"><span class="dotsload">A carregar</span></div>';
  Store.auth.onAuthStateChanged(u=>{if(!u)return login();if(me.pid!==u.uid){me.pid=u.uid;ss.set('pd_pid',u.uid)}
    if(!unsub)boot()})}
else boot();
