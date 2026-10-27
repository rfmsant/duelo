/* Solo duels: each duelist plays on their own phone with the same seed; best score wins */
const pk=(a,r)=>a[Math.floor(r()*a.length)];
const Ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));
function fmtScore(g,v){if(v==null)return'—';
  switch(g.unit){case's':return v.toFixed(3).replace('.',',')+' s';case'%':return v.toFixed(1).replace('.',',')+'%';
  case'ms':return Math.round(v)+' ms';case'off':return v?'falhou por '+v:'perfeito';case'rps':return['✊','✋','✌️'][v]||'—';
  default:return Math.round(v)+' pts'}}
function cmpScores(g,a,b){if(g.cmp)return g.cmp(a,b);if(a===b)return -1;return(g.better==='low'?a<b:a>b)?0:1}

function runSolo(g,seed,cb){
  app.innerHTML=`<div class="solo"><div class="sh"><span class="nm">${g.icon} ${esc(g.name)}</span><span class="sv" id="sv"></span><span class="tv" id="tv"></span></div><div class="sb" id="sb"></div></div>`;
  const el=$('#sb');let fin=false,rafId=0;const ids=[];
  const stop=()=>{fin=true;ids.forEach(i=>{clearTimeout(i);clearInterval(i)});cancelAnimationFrame(rafId)};
  const api={el,g,rnd:rng(seed),
    t(f,ms){const i=setTimeout(()=>{if(!fin)f()},ms);ids.push(i);return i},
    iv(f,ms){const i=setInterval(()=>{if(!fin)f()},ms);ids.push(i);return i},
    loop(f){let last=performance.now();const step=now=>{if(fin)return;const dt=Math.min(.04,(now-last)/1000);last=now;if(f(dt,now)!==false)rafId=requestAnimationFrame(step)};rafId=requestAnimationFrame(step)},
    show(v){const s=$('#sv');if(s)s.textContent=fmtScore(g,v);cb.live&&cb.live(v)},
    tv(t){const s=$('#tv');if(s)s.textContent=t},
    timer(sec,end){let left=sec;api.tv(left+'s');api.iv(()=>{left--;api.tv(Math.max(0,left)+'s');if(left<=0)end()},1000)},
    canvas(){const cv=document.createElement('canvas');el.appendChild(cv);const dpr=Math.min(2,devicePixelRatio||1);const r=el.getBoundingClientRect();
      cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);const c=cv.getContext('2d');c.scale(dpr,dpr);return{cv,c,W:r.width,H:r.height}},
    done(v){if(fin)return;stop();v=Math.round(v*1000)/1000;
      el.insertAdjacentHTML('beforeend',`<div class="overlay"><span class="eyebrow">O teu resultado</span><div class="huge">${fmtScore(g,v)}</div><p class="hint">À espera do adversário<span class="dotsload"></span></p></div>`);
      cb.done(v)},
    kill:stop};
  el.innerHTML=`<div class="overlay"><div class="huge">${g.icon}</div><h2>${esc(g.name)}</h2><p class="hint">${g.rules}</p><button class="btn" id="go">Começar</button></div>`;
  $('#go').onclick=()=>{let n=3;const cd=()=>el.innerHTML=`<div class="cd">${n}</div>`;cd();
    const i=setInterval(()=>{if(fin)return clearInterval(i);n--;if(n>0)cd();else{clearInterval(i);el.innerHTML='';g.play(api)}},650);ids.push(i)};
  return api;
}

/* timed answer runs (same questions for both thanks to the seed) */
function quizRun(a,gen,secs=30){
  let sc=0;a.show(0);
  const next=()=>{const q=gen(a.rnd);const idx=q.opts.map((o,i)=>i);const order=q.fixed?idx:shuf(idx,a.rnd);
    a.el.innerHTML=`<div class="q">${q.q}</div><div class="opts ${q.cls||''}" style="grid-template-columns:repeat(${q.cols||2},1fr)">${order.map(i=>`<button class="opt" data-i="${i}">${q.opts[i]}</button>`).join('')}</div>`;
    let lock=false;
    a.el.querySelectorAll('.opt').forEach(o=>on(o,()=>{if(lock)return;lock=true;const ok=+o.dataset.i===q.ans;o.classList.add(ok?'ok':'bad');
      sc=Math.max(0,sc+(ok?1:-1));a.show(sc);a.t(next,ok?220:450)}))};
  a.timer(secs,()=>a.done(sc));next();
}
const CL=[['VERMELHO','#FF5D73'],['AZUL','#4D8BFF'],['VERDE','#2EE59D'],['AMARELO','#FFD23F'],['ROXO','#B98CFF'],['LARANJA','#FF9F43']];
const ODD=[['🙂','🙃'],['😺','😸'],['🍏','🍎'],['⭐','🌟'],['🌕','🌝'],['🐻','🐼'],['🔵','🟣'],['🍋','🍊'],['🌲','🌳'],['🐭','🐹'],['😐','😑'],['💙','💜']];
const QZ=[
['Qual é o rio mais longo da Península Ibérica?','Tejo','Douro','Guadiana','Ebro'],['Em que ano foi o 25 de Abril?','1974','1975','1968','1980'],
['Qual é a capital da Austrália?','Camberra','Sydney','Melbourne','Perth'],['Quantos ossos tem o corpo humano adulto?','206','186','226','312'],
['Que planeta é conhecido como o planeta vermelho?','Marte','Vénus','Júpiter','Mercúrio'],['Quem pintou a Mona Lisa?','Leonardo da Vinci','Miguel Ângelo','Rafael','Botticelli'],
['Qual é o símbolo químico do ouro?','Au','Ag','Go','Or'],['Quantos jogadores tem uma equipa de futebol em campo?','11','10','9','12'],
['Em que cidade fica a Torre de Belém?','Lisboa','Porto','Coimbra','Belmonte'],['Qual é o maior oceano?','Pacífico','Atlântico','Índico','Ártico'],
['Quem escreveu «Os Lusíadas»?','Luís de Camões','Fernando Pessoa','Eça de Queirós','Gil Vicente'],['Quantos lados tem um hexágono?','6','5','7','8'],
['Qual é o animal terrestre mais rápido?','Chita','Leão','Antílope','Lebre'],['Em que ano Portugal ganhou o Euro?','2016','2004','2012','2021'],
['Qual é a montanha mais alta de Portugal?','Pico','Torre (Serra da Estrela)','Marão','Gerês'],['Quantos minutos tem um dia?','1440','1240','1600','1360'],
['Qual é a capital do Canadá?','Otava','Toronto','Montreal','Vancouver'],['Que gás absorvem as plantas na fotossíntese?','Dióxido de carbono','Oxigénio','Azoto','Hélio'],
['Quem foi o primeiro rei de Portugal?','D. Afonso Henriques','D. Dinis','D. Sancho I','D. João I'],['Qual é a moeda do Japão?','Iene','Yuan','Won','Rupia'],
['Qual é o maior planeta do Sistema Solar?','Júpiter','Saturno','Neptuno','Terra'],['Em que país ficam as pirâmides de Gizé?','Egito','México','Sudão','Peru'],
['Qual é a maior ilha dos Açores?','São Miguel','Terceira','Pico','Faial'],['Qual é o gás mais abundante no ar?','Azoto','Oxigénio','Árgon','Dióxido de carbono'],
['Quantas cordas tem uma guitarra portuguesa?','12','6','8','10'],['Quem chegou à Índia por mar em 1498?','Vasco da Gama','Pedro Álvares Cabral','Bartolomeu Dias','Fernão de Magalhães'],
['Que país tem mais habitantes?','Índia','China','EUA','Indonésia'],['Quantos dias tem um ano bissexto?','366','365','364','367'],
['Que aparelho mede os sismos?','Sismógrafo','Barómetro','Higrómetro','Anemómetro'],['Que língua tem mais falantes nativos?','Mandarim','Inglês','Espanhol','Hindi'],
['Que cidade é conhecida como a cidade dos estudantes?','Coimbra','Braga','Évora','Aveiro'],['Quantos segundos tem uma hora?','3600','360','6000','1800'],
['Qual é o osso mais comprido do corpo?','Fémur','Úmero','Tíbia','Rádio'],['Em que ano caiu o Muro de Berlim?','1989','1991','1985','1979'],
['Que metal é líquido à temperatura ambiente?','Mercúrio','Chumbo','Estanho','Sódio'],['Qual é a capital da Turquia?','Ancara','Istambul','Esmirna','Antália']];

const S_=(id,icon,name,better,unit,rules,play,extra={})=>Object.assign({id,icon,name,kind:'solo',better,unit,rules,play},extra);
const SOLO=[
/* ---- precision ---- */
S_('jelly','🍮','Corte 50/50','high','%','Toca para cortar a gelatina ao meio. Quanto mais perto de 50/50, melhor. São 3 cortes.',a=>{
  const {c,W,H}=a.canvas();const r=a.rnd;let cutN=0,sum=0,x=0,dir=1,state='move',pts,cols,total,minX,maxX,res=null,tShow=0;
  const cy=H*.5,base=Math.min(W,H)*.27;
  const mk=()=>{const n=10;pts=[];for(let i=0;i<n;i++){const ang=i/n*Math.PI*2,rr=base*(.62+r()*.55);pts.push([W/2+Math.cos(ang)*rr*(1+r()*.35),cy+Math.sin(ang)*rr*.9])}
    const oc=document.createElement('canvas');oc.width=Math.ceil(W);oc.height=Math.ceil(H);const o=oc.getContext('2d');shape(o);o.fillStyle='#000';o.fill();
    const d=o.getImageData(0,0,oc.width,oc.height).data;cols=new Array(oc.width).fill(0);total=0;minX=1e9;maxX=0;
    for(let y=0;y<oc.height;y++)for(let xx=0;xx<oc.width;xx++)if(d[(y*oc.width+xx)*4+3]>128){cols[xx]++;total++;if(xx<minX)minX=xx;if(xx>maxX)maxX=xx}
    x=minX;dir=1;state='move'};
  const shape=o=>{o.beginPath();const n=pts.length,mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];let m=mid(pts[n-1],pts[0]);o.moveTo(m[0],m[1]);
    for(let i=0;i<n;i++){const m2=mid(pts[i],pts[(i+1)%n]);o.quadraticCurveTo(pts[i][0],pts[i][1],m2[0],m2[1])}o.closePath()};
  mk();
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='move')return;let left=0;for(let i=0;i<Math.round(x);i++)left+=cols[i]||0;
    const L=left/total*100;const sc=Math.max(0,100-Math.abs(L-50)*2);res={L,sc,cx:x};sum+=sc;cutN++;a.show(sum/cutN);state='show';tShow=0});
  a.loop(dt=>{const sp=(maxX-minX)*(.9+cutN*.35);
    if(state==='move'){x+=dir*sp*dt;if(x>maxX){x=maxX;dir=-1}if(x<minX){x=minX;dir=1}}else{tShow+=dt;if(tShow>1.4){if(cutN>=3){a.done(sum/3);return false}mk()}}
    c.clearRect(0,0,W,H);
    const draw=(clipX0,clipX1,dx,col)=>{c.save();c.beginPath();c.rect(clipX0,0,clipX1-clipX0,H);c.clip();c.translate(dx,0);shape(c);
      const gr=c.createLinearGradient(0,cy-base,0,cy+base);gr.addColorStop(0,col[0]);gr.addColorStop(1,col[1]);c.fillStyle=gr;c.fill();c.restore()};
    if(state==='move'){draw(0,W,0,['#ff8fb3','#ff4f8b']);c.strokeStyle='#fff';c.lineWidth=3;c.setLineDash([8,6]);c.beginPath();c.moveTo(x,cy-base*1.6);c.lineTo(x,cy+base*1.6);c.stroke();c.setLineDash([])}
    else{const off=Math.min(1,tShow*4)*14;draw(0,res.cx,-off,['#ffe066','#ffb800']);draw(res.cx,W,off,['#7cf5d8','#1ccfa5']);
      c.fillStyle='#fff';c.font='800 28px Bricolage Grotesque, sans-serif';c.textAlign='center';
      c.fillText(`${res.L.toFixed(1).replace('.',',')}% / ${(100-res.L).toFixed(1).replace('.',',')}%`,W/2,cy+base*1.55)}
    c.fillStyle='rgba(255,255,255,.7)';c.font='600 15px Rubik, sans-serif';c.textAlign='center';c.fillText(`Corte ${Math.min(cutN+1,3)} de 3`,W/2,30)})}),
S_('center','🎯','No Centro','high','pts','A agulha anda de um lado para o outro. Toca para a parar no verde. 6 tentativas, cada vez mais rápidas.',a=>{
  a.el.innerHTML=`<div style="width:min(340px,90%);position:relative;height:70px"><div style="position:absolute;inset:20px 0;border-radius:12px;background:linear-gradient(90deg,#ff5d73 0 18%,#ff9f43 18% 34%,#ffd23f 34% 45%,#2ee59d 45% 55%,#ffd23f 55% 66%,#ff9f43 66% 82%,#ff5d73 82%)"></div><div id="nd" style="position:absolute;top:0;bottom:0;width:6px;margin-left:-3px;background:#fff;border-radius:3px;box-shadow:0 0 0 2px #22103f"></div></div><div class="big" id="pt">&nbsp;</div><p class="hint" id="ht">Tentativa 1 de 6</p>`;
  const nd=$('#nd');let p=a.rnd(),dir=1,tries=0,sum=0,paused=false;a.show(0);
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(paused)return;paused=true;const d=Math.abs(p-.5);const s=Math.max(0,Math.round(100-d*220));sum+=s;tries++;a.show(sum);
    $('#pt').textContent=s>=90?`${s} perfeito!`:s;$('#ht').textContent=tries<6?`Tentativa ${tries+1} de 6`:'Fim';
    a.t(()=>{if(tries>=6)return a.done(sum);paused=false;p=a.rnd()},700)});
  a.loop(dt=>{if(!paused){p+=dir*dt*(.8+tries*.28);if(p>1){p=1;dir=-1}if(p<0){p=0;dir=1}}nd.style.left=p*100+'%'})}),
S_('ontime','⏱️','Na Hora Certa','low','s','Para o cronómetro exatamente no tempo pedido. 3 tentativas; soma-se o erro de cada uma.',a=>{
  let tries=0,err=0,t0=0,running=false,target=0;
  a.el.innerHTML=`<p class="hint" id="tg"></p><div class="huge" id="clk">0,000</div><button class="bigbtn" id="b">PARA</button><p class="hint" id="rs">&nbsp;</p>`;
  const go=()=>{target=Ri(a.rnd,20,60)/10;$('#tg').innerHTML=`Para aos <b style="color:var(--lime);font-size:22px">${target.toFixed(1).replace('.',',')} s</b> · tentativa ${tries+1} de 3`;t0=performance.now();running=true};
  on($('#b'),()=>{if(!running)return;running=false;const s=(performance.now()-t0)/1000;const e=Math.abs(s-target);err+=e;tries++;a.show(err);
    $('#clk').textContent=s.toFixed(3).replace('.',',');$('#rs').textContent=`Erro: ${e.toFixed(3).replace('.',',')} s`;a.t(()=>tries>=3?a.done(err):go(),1100)});
  a.loop(()=>{if(running)$('#clk').textContent=((performance.now()-t0)/1000).toFixed(3).replace('.',',')});go()}),
S_('timesup','⌛','Tempo Esgotado','low','s','O relógio desaparece ao fim de 2 segundos. Toca quando achares que passaram exatamente 8 segundos.',a=>{
  const T=8,t0=performance.now();let st=false;
  a.el.innerHTML=`<div class="huge" id="clk">0,0</div><button class="bigbtn" id="b">AGORA</button><p class="hint">Conta de cabeça até ${T} segundos</p>`;
  a.loop(()=>{const s=(performance.now()-t0)/1000;$('#clk').textContent=s<2?s.toFixed(1).replace('.',','):'?,?';if(s>T*2.5){a.done(T*1.5);return false}});
  on($('#b'),()=>{if(st)return;st=true;const s=(performance.now()-t0)/1000;$('#clk').textContent=s.toFixed(3).replace('.',',');a.t(()=>a.done(Math.abs(s-T)),900)})}),
S_('stack','🧱','Torre de Blocos','high','pts','Toca para largar o bloco em cima da torre. O que ficar de fora é cortado. Quanto mais alta a torre, melhor.',a=>{
  const {c,W,H}=a.canvas();const bh=28;let blocks=[{x:W*.2,w:W*.6}],cur={x:0,w:W*.6},dir=1,sc=0,cam=0,falling=null,over=false;const hue0=Math.floor(a.rnd()*360);
  const col=i=>`hsl(${(hue0+i*14)%360} 85% 60%)`;a.show(0);
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(over)return;const top=blocks[blocks.length-1];const l=Math.max(cur.x,top.x),r=Math.min(cur.x+cur.w,top.x+top.w);
    if(r-l<=2){over=true;falling={...cur,y:0,vy:0};a.t(()=>a.done(sc),900);return}
    blocks.push({x:l,w:r-l});sc++;a.show(sc);cur={x:dir>0?-0:W-(r-l),w:r-l};cur.x=dir>0?0:W-cur.w;dir=-dir});
  a.loop(dt=>{const sp=W*(.45+sc*.04);if(!over){cur.x+=dir*sp*dt*-1*-1;if(cur.x+cur.w>W){cur.x=W-cur.w;dir=-1}if(cur.x<0){cur.x=0;dir=1}}
    const want=Math.max(0,blocks.length*bh-H*.45);cam+=(want-cam)*Math.min(1,dt*6);
    c.clearRect(0,0,W,H);const base=H-40+cam;
    blocks.forEach((b,i)=>{c.fillStyle=col(i);c.fillRect(b.x,base-(i+1)*bh,b.w,bh-2)});
    if(!over){c.fillStyle=col(blocks.length);c.fillRect(cur.x,base-(blocks.length+1)*bh,cur.w,bh-2)}
    else if(falling){falling.vy+=1600*dt;falling.y+=falling.vy*dt;c.fillStyle=col(blocks.length);c.fillRect(falling.x,base-(blocks.length+1)*bh+falling.y,falling.w,bh-2)}})}),
S_('knife','🔪','Atira a Faca','high','pts','Toca para atirar a faca ao tronco que gira. Se bateres noutra faca, acabou.',a=>{
  const {c,W,H}=a.canvas();const r=a.rnd;const cx=W/2,cy=H*.34,RAD=Math.min(W,H)*.17;let th=0,spd=2,stage=0,stuck=[],sc=0,fly=null,over=false,tt=0,left=7;
  const newStage=()=>{stuck=[];const n=Ri(r,1,3);for(let i=0;i<n;i++)stuck.push(r()*Math.PI*2);spd=2+stage*.5;left=7};newStage();a.show(0);
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(fly||over)return;fly={y:H-70}});
  a.loop(dt=>{tt+=dt;const s=spd*(1+.6*Math.sin(tt*(1+stage*.3)+stage));th+=s*dt*(stage%2?-1:1);
    if(fly&&!over){fly.y-=2600*dt;if(fly.y<=cy+RAD){const rel=((Math.PI/2-th)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
      const hit=stuck.some(k=>{let d=Math.abs(k-rel)%(Math.PI*2);d=Math.min(d,Math.PI*2-d);return d<.2});
      if(hit){over=true;fly.dead=1;a.t(()=>a.done(sc),900)}else{stuck.push(rel);sc++;left--;a.show(sc);fly=null;if(left<=0){stage++;a.t(newStage,250)}}}}
    c.clearRect(0,0,W,H);
    c.save();c.translate(cx,cy);c.rotate(th);
    stuck.forEach(k=>{c.save();c.rotate(k);c.fillStyle='#d9dde8';c.fillRect(RAD-6,-3,46,6);c.fillStyle='#8a4b2a';c.fillRect(RAD+40,-5,26,10);c.restore()});
    c.beginPath();c.arc(0,0,RAD,0,Math.PI*2);c.fillStyle='#b5713f';c.fill();c.lineWidth=6;c.strokeStyle='#7a4523';c.stroke();
    c.beginPath();c.arc(0,0,RAD*.6,0,Math.PI*2);c.strokeStyle='#9a5a30';c.lineWidth=3;c.stroke();c.restore();
    const ky=fly?fly.y:H-70;if(!over||fly){c.fillStyle='#d9dde8';c.fillRect(cx-3,ky,6,46);c.fillStyle='#8a4b2a';c.fillRect(cx-5,ky+42,10,26)}
    c.fillStyle='rgba(255,255,255,.7)';c.font='600 15px Rubik,sans-serif';c.textAlign='center';c.fillText(`Faltam ${left} facas · nível ${stage+1}`,W/2,H-12)})}),
/* ---- speed ---- */
S_('speedtap','🟡','Toque Rápido','high','pts','Toca no botão o máximo de vezes em 10 segundos.',a=>{
  a.el.innerHTML=`<button class="bigbtn" id="b">TOCA!</button>`;let n=0;a.show(0);on($('#b'),()=>{n++;a.show(n)});a.timer(10,()=>a.done(n))}),
S_('react','⚡','Reflexos','low','ms','Quando ficar verde, toca o mais depressa possível. 5 vezes; conta a média. Tocar antes do tempo dá 1 segundo de castigo.',a=>{
  a.el.innerHTML=`<button id="pad" style="position:absolute;inset:16px;border:0;border-radius:28px;font:800 34px var(--display);color:#22103f"></button>`;const pad=$('#pad');
  let n=0,tot=0,st='wait',t0=0,tid=0;
  const arm=()=>{st='wait';pad.style.background='#ff5d73';pad.textContent='Espera…';tid=a.t(()=>{st='go';t0=performance.now();pad.style.background='#c6ff3d';pad.textContent='TOCA!'},1100+a.rnd()*2600)};
  on(pad,()=>{if(st==='res')return;let ms;if(st==='wait'){clearTimeout(tid);ms=1000;pad.textContent='Cedo demais! +1000 ms'}else{ms=performance.now()-t0;pad.textContent=Math.round(ms)+' ms'}
    st='res';pad.style.background='#38d9e8';n++;tot+=ms;a.show(tot/n);a.t(()=>n>=5?a.done(tot/5):arm(),900)});arm()}),
S_('colorreflex','🟩','Reflexo de Cor','high','pts','A caixa muda de cor. Toca só quando estiver VERDE. Tocar noutra cor tira um ponto. 25 segundos.',a=>{
  a.el.innerHTML=`<p class="hint">Toca só no <b style="color:#2ee59d">VERDE</b></p><button class="cbox" id="cb" style="border:0"></button>`;const cb=$('#cb');const C=['#2ee59d','#ff5d73','#ffd23f','#4d8bff','#ff9f43','#b98cff'];
  let cur=1,sc=0,used=false;a.show(0);
  const next=()=>{cur=a.rnd()<.32?0:1+Math.floor(a.rnd()*5);used=false;cb.style.background=C[cur];a.t(next,450+a.rnd()*500)};
  on(cb,()=>{if(used)return;used=true;sc=Math.max(0,sc+(cur===0?1:-1));a.show(sc);cb.animate([{transform:'scale(.92)'},{transform:'scale(1)'}],150)});
  next();a.timer(25,()=>a.done(sc))}),
S_('count','🔢','1-2-3','low','s','Toca nos números de 1 a 20 por ordem, o mais rápido possível. Cada engano custa 1 segundo.',a=>{
  const nums=shuf([...Array(20).keys()].map(i=>i+1),a.rnd);let nx=1,pen=0;const t0=performance.now();
  a.el.innerHTML=`<div class="g4" style="grid-template-columns:repeat(4,1fr)">${nums.map(n=>`<button data-n="${n}">${n}</button>`).join('')}</div>`;
  a.loop(()=>a.tv(((performance.now()-t0)/1000+pen).toFixed(1)+'s'));
  a.el.querySelectorAll('button').forEach(b=>on(b,()=>{if(+b.dataset.n===nx){b.classList.add('done');nx++;if(nx>20)a.done((performance.now()-t0)/1000+pen)}
    else{pen+=1;b.classList.add('miss');a.t(()=>b.classList.remove('miss'),250)}}))}),
S_('targets','🎯','Tiro ao Alvo','high','pts','Acerta no máximo de alvos em 20 segundos. Cada vez ficam mais pequenos e rápidos.',a=>{
  let sc=0,el0=performance.now();a.show(0);const R0=a.el.getBoundingClientRect();
  const spawn=()=>{const age=(performance.now()-el0)/1000;const s=Math.max(38,80-age*2.2);const b=document.createElement('button');b.className='tg';
    b.style.width=b.style.height=s+'px';b.style.left=a.rnd()*(R0.width-s)+'px';b.style.top=a.rnd()*(R0.height-s)+'px';a.el.appendChild(b);
    const kill=a.t(()=>b.remove(),Math.max(650,1300-age*30));on(b,()=>{clearTimeout(kill);b.remove();sc++;a.show(sc)})};
  a.iv(spawn,520);spawn();a.timer(20,()=>a.done(sc))}),
S_('swipe','👉','Desliza!','high','pts','Desliza o dedo na direção da seta. Se a seta for VERMELHA, desliza para o lado oposto. 25 segundos.',a=>{
  const D=['↑','→','↓','←'],V=[[0,-1],[1,0],[0,1],[-1,0]];let cur,red,sc=0,sx,sy;a.show(0);
  const next=()=>{cur=Math.floor(a.rnd()*4);red=a.rnd()<.35;a.el.innerHTML=`<div class="arrow" style="color:${red?'#ff5d73':'#2ee59d'}">${D[cur]}</div><p class="hint">${red?'Vermelha: ao contrário!':'Desliza para lá'}</p>`};
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();sx=e.clientX;sy=e.clientY});
  a.el.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.hypot(dx,dy)<30)return;
    const dirI=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);const want=red?(cur+2)%4:cur;sc=Math.max(0,sc+(dirI===want?1:-1));a.show(sc);
    a.el.style.background=dirI===want?'rgba(46,229,157,.15)':'rgba(255,93,115,.2)';a.t(()=>a.el.style.background='',150);next()});
  next();a.timer(25,()=>a.done(sc))}),
S_('piano','🎹','Piano','high','pts','Toca só nas teclas pretas da fila de baixo, por ordem. Uma tecla branca e acabou. 20 segundos.',a=>{
  const rows=[];const add=()=>rows.push(Math.floor(a.rnd()*4));for(let i=0;i<5;i++)add();let sc=0,over=false;a.show(0);
  const draw=()=>{a.el.innerHTML=`<div class="piano">${rows.slice(0,5).map((k,ri)=>`<div class="pr">${[0,1,2,3].map(i=>`<button data-r="${ri}" data-i="${i}" class="${i===k?'k':''}"></button>`).join('')}</div>`).join('')}</div>`;
    a.el.querySelectorAll('button').forEach(b=>on(b,()=>{if(over)return;if(+b.dataset.r!==0)return;
      if(+b.dataset.i===rows[0]){rows.shift();add();sc++;a.show(sc);draw()}else{over=true;b.classList.add('miss');a.t(()=>a.done(sc),700)}}))};
  draw();a.timer(20,()=>{over=true;a.done(sc)})}),
/* ---- memory ---- */
S_('memnum','🧠','Memória de Números','high','pts','Decora o número e escreve-o. Cada vez tem mais um algarismo. Um erro e acabou.',a=>{
  let L=3,sc=0;a.show(0);
  const round=()=>{const num=Array.from({length:L},()=>Math.floor(a.rnd()*10)).join('');
    a.el.innerHTML=`<p class="hint">Decora</p><div class="huge" style="letter-spacing:.08em">${num}</div>`;
    a.t(()=>{let e='';a.el.innerHTML=`<p class="hint">Escreve o número (${L} algarismos)</p><div class="entry" id="en">&nbsp;</div><div class="keypad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-k="${n}">${n}</button>`).join('')}<button class="k2" data-k="del">⌫</button><button data-k="0">0</button><button class="k2" data-k="ok">OK</button></div>`;
      a.el.querySelectorAll('[data-k]').forEach(b=>on(b,()=>{const k=b.dataset.k;if(k==='del')e=e.slice(0,-1);else if(k!=='ok'&&e.length<L)e+=k;$('#en').textContent=e||' ';
        if(k==='ok'||e.length===L){if(e===num){sc=L;a.show(sc);L++;a.t(round,350)}else{$('#en').innerHTML=`<span style="color:var(--bad)">${e}</span> → ${num}`;a.t(()=>a.done(sc),1400)}}}))},900+L*350)};
  round()}),
S_('colormem','🎨','Memória de Cor','high','%','Decora a cor e depois recria-a com as barras. São 3 cores; conta a média da semelhança.',a=>{
  let n=0,sum=0;a.show(0);
  const hsl2rgb=(h,s,l)=>{s/=100;l/=100;const k=i=>(i+h/30)%12,f=i=>l-s*Math.min(l,1-l)*Math.max(-1,Math.min(k(i)-3,9-k(i),1));return[f(0)*255,f(8)*255,f(4)*255]};
  const round=()=>{const T=[Math.floor(a.rnd()*360),40+Math.floor(a.rnd()*55),30+Math.floor(a.rnd()*45)];
    a.el.innerHTML=`<p class="hint">Decora esta cor (${n+1} de 3)</p><div class="swatch" style="background:hsl(${T[0]} ${T[1]}% ${T[2]}%)"></div>`;
    a.t(()=>{let h=180,s=50,l=50;
      a.el.innerHTML=`<p class="hint">Recria a cor</p><div class="swatch" id="sw"></div><div class="sliders"><input type="range" id="h" min="0" max="359" value="180" aria-label="Tom"><input type="range" id="s" min="0" max="100" value="50" aria-label="Saturação"><input type="range" id="l" min="0" max="100" value="50" aria-label="Luz"></div><button class="btn" id="ok">Confirmar</button>`;
      const upd=()=>{h=+$('#h').value;s=+$('#s').value;l=+$('#l').value;$('#sw').style.background=`hsl(${h} ${s}% ${l}%)`;
        $('#h').style.background='linear-gradient(90deg,'+[0,60,120,180,240,300,360].map(x=>`hsl(${x} ${s}% ${l}%)`).join(',')+')';
        $('#s').style.background=`linear-gradient(90deg,hsl(${h} 0% ${l}%),hsl(${h} 100% ${l}%))`;$('#l').style.background=`linear-gradient(90deg,#000,hsl(${h} ${s}% 50%),#fff)`};
      ['h','s','l'].forEach(id=>$('#'+id).addEventListener('input',upd));upd();
      $('#ok').onclick=()=>{const p=hsl2rgb(...T),q=hsl2rgb(h,s,l);const d=Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);const acc=Math.max(0,100-d/2.2);sum+=acc;n++;a.show(sum/n);
        a.el.innerHTML=`<div class="row" style="width:min(300px,100%)"><div class="swatch" style="background:hsl(${T[0]} ${T[1]}% ${T[2]}%)"></div><div class="swatch" style="background:hsl(${h} ${s}% ${l}%)"></div></div><div class="big">${acc.toFixed(1).replace('.',',')}%</div>`;
        a.t(()=>n>=3?a.done(sum/3):round(),1300)}},2600)};
  round()}),
S_('grid','🟨','Grelha','high','pts','Decora os quadrados que acendem e toca neles. Cada nível tem mais quadrados. Um erro e acabou.',a=>{
  let lvl=0;a.show(0);
  const round=()=>{const n=Math.min(10,3+lvl);const lit=new Set(shuf([...Array(16).keys()],a.rnd).slice(0,n));let found=0,can=false;
    a.el.innerHTML=`<p class="hint">Nível ${lvl+1} · ${n} quadrados</p><div class="g4">${[...Array(16).keys()].map(i=>`<button data-i="${i}" class="${lit.has(i)?'lit':''}"></button>`).join('')}</div>`;
    a.t(()=>{a.el.querySelectorAll('.lit').forEach(b=>b.classList.remove('lit'));can=true},1100+n*120);
    a.el.querySelectorAll('[data-i]').forEach(b=>on(b,()=>{if(!can||b.classList.contains('hit'))return;
      if(lit.has(+b.dataset.i)){b.classList.add('hit');found++;if(found===n){can=false;lvl++;a.show(lvl);a.t(round,450)}}
      else{can=false;b.classList.add('miss');a.el.querySelectorAll('[data-i]').forEach(x=>{if(lit.has(+x.dataset.i)&&!x.classList.contains('hit'))x.classList.add('lit')});a.t(()=>a.done(lvl),1200)}}))};
  round()}),
S_('cups','🥤','Bola e Copos','high','pts','Segue o copo que tem a bola. Cada nível baralha mais depressa. Um erro e acabou.',a=>{
  let lvl=0;a.show(0);
  a.el.innerHTML=`<p class="hint" id="ch">Olha bem para a bola</p><div class="cups" id="cw"><div class="ball" id="ball"></div>${[0,1,2].map(i=>`<button class="cup" data-c="${i}" aria-label="Copo ${i+1}"><i></i></button>`).join('')}</div>`;
  const cups=[...a.el.querySelectorAll('.cup')],ball=$('#ball');const X=[5,35,65];let slot=[0,1,2],ballCup=0,can=false;
  const place=dur=>cups.forEach((c,i)=>{c.style.transitionDuration=dur+'ms';c.style.left=X[slot[i]]+'%'});
  const round=()=>{ballCup=Math.floor(a.rnd()*3);place(0);ball.style.transitionDuration='0ms';ball.style.left=(X[slot[ballCup]]+15)+'%';ball.style.opacity=1;
    cups[ballCup].classList.add('up');$('#ch').textContent=`Nível ${lvl+1} · olha bem para a bola`;
    a.t(()=>{cups[ballCup].classList.remove('up');a.t(()=>{ball.style.opacity=0;const swaps=3+lvl*2,dur=Math.max(170,420-lvl*40);let k=0;
      const sw=()=>{if(k++>=swaps){can=true;$('#ch').textContent='Onde está a bola?';return}let i=Math.floor(a.rnd()*3),j=(i+1+Math.floor(a.rnd()*2))%3;[slot[i],slot[j]]=[slot[j],slot[i]];place(dur);a.t(sw,dur+30)};sw()},350)},1000)};
  cups.forEach((c,i)=>on(c,()=>{if(!can)return;can=false;ball.style.left=(X[slot[ballCup]]+15)+'%';ball.style.opacity=1;cups[ballCup].classList.add('up');if(i!==ballCup)c.classList.add('up');
    if(i===ballCup){lvl++;a.show(lvl);$('#ch').textContent='Boa!';a.t(()=>{cups.forEach(x=>x.classList.remove('up'));a.t(round,350)},800)}else{$('#ch').textContent='Errado!';a.t(()=>a.done(lvl),1100)}}));
  round()}),
/* ---- arcade ---- */
S_('flap','🐤','Flap','high','pts','Toca para voar. Passa entre os pilares sem bater.',a=>{
  const {c,W,H}=a.canvas();let y=H/2,vy=0,pipes=[],sc=0,dist=0,over=false;const gap=Math.max(150,H*.26),x0=W*.28;a.show(0);
  const add=px=>pipes.push({x:px,gy:H*.18+a.rnd()*(H*.64-gap),pass:false});add(W+40);add(W+40+W*.62);
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(!over)vy=-480});
  a.loop(dt=>{if(!over){vy+=1300*dt;y+=vy*dt;const sp=170+sc*4;pipes.forEach(p=>p.x-=sp*dt);
      if(pipes[0].x<-70){pipes.shift();add(pipes[pipes.length-1].x+W*.62)}
      pipes.forEach(p=>{if(!p.pass&&p.x+60<x0){p.pass=true;sc++;a.show(sc)}if(x0+14>p.x&&x0-14<p.x+60&&(y-14<p.gy||y+14>p.gy+gap))over=true});
      if(y>H-14||y<0)over=true;if(over)a.t(()=>a.done(sc),800)}
    c.clearRect(0,0,W,H);pipes.forEach(p=>{c.fillStyle='#ffb020';c.fillRect(p.x,0,60,p.gy);c.fillRect(p.x,p.gy+gap,60,H);c.fillStyle='#e08a00';c.fillRect(p.x+44,0,16,p.gy);c.fillRect(p.x+44,p.gy+gap,16,H)});
    c.beginPath();c.arc(x0,y,14,0,Math.PI*2);c.fillStyle='#fff';c.fill()})}),
S_('snake','🐍','Cobra','high','pts','Desliza para mudar de direção e come as maçãs. Não batas nas paredes nem em ti. 60 segundos.',a=>{
  const {c,W,H}=a.canvas();const N=14,cs=Math.floor(Math.min(W-20,H-20)/N),ox=(W-cs*N)/2,oy=(H-cs*N)/2;
  let sn=[[5,7],[4,7],[3,7]],d=[1,0],nd=[1,0],food,sc=0,acc=0,over=false,sx,sy;a.show(0);
  const place=()=>{do{food=[Math.floor(a.rnd()*N),Math.floor(a.rnd()*N)]}while(sn.some(s=>s[0]===food[0]&&s[1]===food[1]))};place();
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();sx=e.clientX;sy=e.clientY});
  a.el.addEventListener('pointermove',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.hypot(dx,dy)<22)return;
    const v=Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)];if(v[0]!==-d[0]||v[1]!==-d[1])nd=v;sx=e.clientX;sy=e.clientY});
  a.el.addEventListener('pointerup',()=>sx=null);
  a.loop(dt=>{if(!over){acc+=dt;const step=Math.max(.075,.16-sc*.005);while(acc>step){acc-=step;d=nd;const h=[sn[0][0]+d[0],sn[0][1]+d[1]];
      if(h[0]<0||h[1]<0||h[0]>=N||h[1]>=N||sn.some(s=>s[0]===h[0]&&s[1]===h[1])){over=true;a.t(()=>a.done(sc),800);break}
      sn.unshift(h);if(h[0]===food[0]&&h[1]===food[1]){sc++;a.show(sc);place()}else sn.pop()}}
    c.clearRect(0,0,W,H);c.fillStyle='#22103f';c.fillRect(ox,oy,cs*N,cs*N);
    c.fillStyle='#ffd23f';c.beginPath();c.arc(ox+food[0]*cs+cs/2,oy+food[1]*cs+cs/2,cs*.38,0,Math.PI*2);c.fill();
    sn.forEach((s,i)=>{c.fillStyle=i?'#38d9e8':'#7cf5ff';c.fillRect(ox+s[0]*cs+1,oy+s[1]*cs+1,cs-2,cs-2)})});
  a.timer(60,()=>{over=true;a.done(sc)})}),
S_('zig','〰️','Zigue-Zague','high','pts','A bola anda sozinha. Toca para mudar de direção e não saias da pista.',a=>{
  const {c,W,H}=a.canvas();const w=46,m=w;let nodes=[[W/2,0]],dirN=1;
  const ext=()=>{while(nodes[nodes.length-1][1]<by+H*2){const [x,y]=nodes[nodes.length-1];let L=50+a.rnd()*150;const room=dirN>0?W-m-x:x-m;L=Math.max(30,Math.min(L,room));nodes.push([x+dirN*L,y+L]);dirN=-dirN}};
  let bx=W/2,by=0,bd=1,sp=150,over=false,fall=0;ext();a.show(0);
  const px=yy=>{for(let i=1;i<nodes.length;i++)if(nodes[i][1]>=yy){const [x0,y0]=nodes[i-1],[x1,y1]=nodes[i];return x0+(x1-x0)*(yy-y0)/(y1-y0)}return W/2};
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(!over)bd=-bd});
  a.loop(dt=>{if(!over){sp+=dt*4;bx+=bd*sp*dt;by+=sp*dt;ext();if(Math.abs(bx-px(by))>w/2){over=true;a.t(()=>a.done(Math.floor(by/20)),900)}a.show(Math.floor(by/20))}else fall+=dt;
    c.clearRect(0,0,W,H);const sy=yy=>H*.72-(yy-by);c.lineCap='round';c.lineJoin='round';
    c.strokeStyle='#e0a800';c.lineWidth=w+8;c.beginPath();nodes.forEach((n,i)=>i?c.lineTo(n[0],sy(n[1])+6):c.moveTo(n[0],sy(n[1])+6));c.stroke();
    c.strokeStyle='#ffd23f';c.lineWidth=w;c.beginPath();nodes.forEach((n,i)=>i?c.lineTo(n[0],sy(n[1])):c.moveTo(n[0],sy(n[1])));c.stroke();
    c.beginPath();c.arc(bx,H*.72+fall*300,11*(1-Math.min(.7,fall)),0,Math.PI*2);c.fillStyle='#ff5d73';c.fill()})}),
S_('chop','🎋','Ninja Corta-Bambu','high','pts','Toca do lado esquerdo ou direito para cortar o bambu. Foge dos ramos e não deixes a barra de tempo acabar.',a=>{
  const {c,W,H}=a.canvas();const segH=64,tw=64,cx=W/2;let br=[0,0],side=-1,sc=0,time=1,over=false,hit=0;
  const nb=()=>{const last=br[br.length-1];br.push(last!==0?0:(a.rnd()<.6?(a.rnd()<.5?-1:1):0))};while(br.length<12)nb();a.show(0);
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(over)return;const r=a.el.getBoundingClientRect();side=e.clientX-r.left<r.width/2?-1:1;
    if(br[0]===side){over=true;}else{br.shift();nb();sc++;hit=.12;time=Math.min(1,time+.06);a.show(sc);if(br[0]===side)over=true}
    if(over)a.t(()=>a.done(sc),900)});
  a.loop(dt=>{if(!over){time-=dt*(.22+sc*.004);if(time<=0){over=true;a.t(()=>a.done(sc),700)}}hit=Math.max(0,hit-dt);
    c.clearRect(0,0,W,H);const base=H-70;
    for(let i=0;i<br.length;i++){const y=base-(i+1)*segH;if(y<-segH)break;c.fillStyle=i%2?'#7bbf3a':'#8fd14a';c.fillRect(cx-tw/2,y,tw,segH-3);
      if(br[i]){c.fillStyle='#5d9a2a';const bx=br[i]<0?cx-tw/2-90:cx+tw/2;c.fillRect(bx,y+segH*.35,90,14)}}
    c.fillStyle='#5a3a1e';c.fillRect(cx-tw/2-10,base,tw+20,12);
    const nx=cx+side*(tw/2+34);c.fillStyle=over?'#ff5d73':'#22103f';c.beginPath();c.arc(nx,base-28,20,0,Math.PI*2);c.fill();c.fillStyle='#ff5d73';c.fillRect(nx-20,base-34,40,7);
    if(hit){c.fillStyle='#fff';c.fillRect(cx+side*tw/2-(side>0?0:30),base-40,30,4)}
    c.fillStyle='#22103f';c.fillRect(W*.2,18,W*.6,12);c.fillStyle=time>.3?'#c6ff3d':'#ff5d73';c.fillRect(W*.2,18,W*.6*Math.max(0,time),12)})}),
S_('keepup','⚪','Não Deixes Cair','high','pts','Toca na bola para a manter no ar. Se tocar no chão, acabou.',a=>{
  const {c,W,H}=a.canvas();const r=32;let x=W/2,y=H*.3,vx=(a.rnd()-.5)*60,vy=0,sc=0,over=false;a.show(0);
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(over)return;const b=a.el.getBoundingClientRect();const tx=e.clientX-b.left,ty=e.clientY-b.top;
    if(Math.hypot(tx-x,ty-y)<r*1.7){vy=-Math.min(820,620+sc*8);vx+=(x-tx)*7;sc++;a.show(sc)}});
  a.loop(dt=>{if(!over){vy+=(1250+sc*15)*dt;x+=vx*dt;y+=vy*dt;if(x<r){x=r;vx=Math.abs(vx)}if(x>W-r){x=W-r;vx=-Math.abs(vx)}if(y<r){y=r;vy=Math.abs(vy)}
      if(y>H-r){y=H-r;over=true;a.t(()=>a.done(sc),700)}}
    c.clearRect(0,0,W,H);c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(x,H-6,r*(.4+y/H*.6),6,0,0,Math.PI*2);c.fill();
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle='#fff';c.fill()})}),
/* ---- quick-answer runs ---- */
S_('mat','➗','Contas Rápidas','high','pts','Responde ao máximo de contas em 30 segundos. Cada erro tira um ponto.',a=>quizRun(a,r=>{const op=pk(['+','−','×'],r);let x,y,v;
  if(op==='×'){x=Ri(r,3,12);y=Ri(r,3,12);v=x*y}else if(op==='+'){x=Ri(r,12,89);y=Ri(r,12,89);v=x+y}else{x=Ri(r,30,99);y=Ri(r,5,x-5);v=x-y}
  const s=new Set([v]);while(s.size<4){const z=v+pk([-10,-3,-2,-1,1,2,3,10],r);if(z>=0)s.add(z)}return{q:`<div class="big">${x} ${op} ${y}</div>`,opts:[...s],ans:0}})),
S_('cor','🖌️','Cor Certa','high','pts','Toca na cor da TINTA, não no que a palavra diz. 30 segundos.',a=>quizRun(a,r=>{const [w,ink]=shuf(CL,r);
  return{q:`<div class="hint">Cor da tinta?</div><div class="big" style="color:${ink[1]}">${w[0]}</div>`,opts:[ink,w,...shuf(CL.filter(x=>x!==ink&&x!==w),r).slice(0,2)].map(x=>x[0]),ans:0}})),
S_('pontos','⚫','Conta os Pontos','high','pts','Conta os pontos e toca no número certo. 30 segundos.',a=>quizRun(a,r=>{const n=Ri(r,7,16);const cells=shuf([...Array(24).keys()],r).slice(0,n);
  const dots=cells.map(q=>`<i style="left:${(q%6)*16+Ri(r,2,7)}%;top:${Math.floor(q/6)*24+Ri(r,4,10)}%"></i>`).join('');const s=new Set([n]);while(s.size<4)s.add(n+pk([-2,-1,1,2],r));
  return{q:`<div class="dots">${dots}</div>`,opts:[...s],ans:0,cols:4}})),
S_('intruso','👀','O Intruso','high','pts','Encontra o emoji diferente. 30 segundos.',a=>quizRun(a,r=>{const [x,y]=pk(ODD,r);const k=Ri(r,0,15);return{q:'',opts:Array.from({length:16},(_,i)=>i===k?y:x),ans:k,cols:4,cls:'e',fixed:true}})),
S_('maior','📈','O Maior','high','pts','Toca no maior número. 30 segundos.',a=>quizRun(a,r=>{const s=new Set();while(s.size<6)s.add(Ri(r,40,99));const o=[...s];return{q:'<div class="hint">Toca no MAIOR</div>',opts:o,ans:o.indexOf(Math.max(...o)),cols:3,fixed:true}})),
S_('quiz','❓','Quiz Relâmpago','high','pts','Cultura geral: o máximo de respostas certas em 40 segundos. Cada erro tira um ponto.',a=>{const order=shuf(QZ,a.rnd);let i=0;
  quizRun(a,r=>{const it=order[i++%order.length];return{q:`<div class="qq">${it[0]}</div>`,opts:it.slice(1),ans:0}},40)}),
/* ---- classics from version 1 ---- */
S_('faroeste','🤠','Duelo no Faroeste','low','s','Dispara só quando aparecer «FOGO!». Há palavras parecidas para te enganar. 3 duelos; soma-se o tempo. Disparar antes do tempo dá 2 segundos de castigo.',a=>{
  let n=0,tot=0,go=false,t0=0,shot=false;
  a.el.innerHTML=`<button id="pad" style="position:absolute;inset:16px;border:0;border-radius:28px;background:#3c2175;font:800 40px var(--display);color:#fff"></button>`;const pad=$('#pad');
  const round=()=>{go=false;shot=false;const seq=['Preparar…','Apontar…',...shuf(['FOGÃO!','FOCA!','FOGUETE!','FORA!','FIGO!','FOGE!'],a.rnd).slice(0,Ri(a.rnd,0,3)),'FOGO!'];let t=0;
    seq.forEach((w,i)=>{a.t(()=>{if(shot)return;pad.textContent=w;if(i===seq.length-1){go=true;t0=performance.now()}},t);t+=900+a.rnd()*700})};
  on(pad,()=>{if(shot)return;shot=true;const v=go?(performance.now()-t0)/1000:2;pad.textContent=go?v.toFixed(3).replace('.',',')+' s':'Cedo demais! +2 s';n++;tot+=v;a.show(tot);a.t(()=>n>=3?a.done(tot):round(),1100)});
  round()}),
S_('cega','🙈','Contagem às Cegas','low','off','Toca exatamente 25 vezes em 8 segundos, sem ver o contador.',a=>{let n=0;
  a.el.innerHTML=`<button class="bigbtn" id="b">?</button><p class="hint">Conta de cabeça até 25</p>`;on($('#b'),()=>n++);a.timer(8,()=>a.done(Math.abs(n-25)))}),
S_('dados','🎲','Dados','high','pts','Lança três dados. A soma mais alta ganha. Sorte pura.',a=>{
  a.el.innerHTML=`<div class="die" id="d">🎲</div><button class="btn" id="b">Lançar</button>`;
  $('#b').onclick=()=>{$('#b').disabled=true;const v=[R(1,6),R(1,6),R(1,6)];let k=0;const i=a.iv(()=>{$('#d').textContent=[0,0,0].map(()=>'⚀⚁⚂⚃⚄⚅'[R(0,5)]).join('');if(++k>12){clearInterval(i);
    $('#d').textContent=v.map(x=>'⚀⚁⚂⚃⚄⚅'[x-1]).join('');const s=v[0]+v[1]+v[2];a.show(s);a.t(()=>a.done(s),900)}},80)}}),
S_('ppt','✊','Pedra, Papel, Tesoura','high','rps','Escolhe em segredo no teu telemóvel. Empate repete-se.',a=>{
  a.el.innerHTML=`<p class="hint">Escolhe em segredo</p><div class="opts e" style="grid-template-columns:repeat(3,1fr)">${['✊','✋','✌️'].map((x,i)=>`<button class="opt" data-i="${i}" style="font-size:44px">${x}</button>`).join('')}</div>`;
  a.el.querySelectorAll('.opt').forEach(o=>on(o,()=>a.done(+o.dataset.i)))},
  {cmp:(x,y)=>x===y?-1:((x-y+3)%3===1?0:1),hideLive:true}),
];
