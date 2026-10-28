/* Solo duels: each duelist plays on their own phone with the same seed; best score wins */
const pk=(a,r)=>a[Math.floor(r()*a.length)];
const Ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));
function fmtScore(g,v){if(v==null)return'—';
  switch(g.unit){case's':return v.toFixed(3).replace('.',',')+' s';case'%':return v.toFixed(1).replace('.',',')+'%';
  case'ms':return Math.round(v)+' ms';case'off':return v?'falhou por '+v:'perfeito';case'rps':return['✊','✋','✌️'][v]||'—';
  default:return Math.round(v)+' pts'}}
function cmpScores(g,a,b){if(g.cmp)return g.cmp(a,b);if(a===b)return -1;return(g.better==='low'?a<b:a>b)?0:1}

function runSolo(g,seed,cb){
  const pl=cb.players||[];
  app.innerHTML=`<div class="solo" style="--gg:${gradOf(g.id)}"><div class="sh">${pl.length?pl.map((p,i)=>`<div class="who">${bub(p,52,i===0?'TU':'')}<span class="pill" id="${i===0?'sv':'ov'}">—</span></div>`).join(''):`<span class="nm">${g.icon} ${esc(g.name)}</span><span class="pill" id="sv"></span>`}</div><div class="tv" id="tv"></div><div class="sb" id="sb"></div></div>`;
  const el=$('#sb');let fin=false,rafId=0;const ids=[];
  const stop=()=>{fin=true;ids.forEach(i=>{clearTimeout(i);clearInterval(i)});cancelAnimationFrame(rafId)};
  const api={el,g,rnd:rng(seed),
    t(f,ms){const i=setTimeout(()=>{if(!fin)f()},ms);ids.push(i);return i},
    iv(f,ms){const i=setInterval(()=>{if(!fin)f()},ms);ids.push(i);return i},
    loop(f){let last=performance.now();const step=now=>{if(fin)return;const dt=Math.min(.04,(now-last)/1000);last=now;if(f(dt,now)!==false)rafId=requestAnimationFrame(step)};rafId=requestAnimationFrame(step)},
    show(v){const s=$('#sv');if(s)s.textContent=fmtScore(g,v);if(!g.noTick&&g.better==='high'&&v>(api._lv??0))sfx('ok');api._lv=v;cb.live&&cb.live(v)},
    tv(t){const s=$('#tv');if(s)s.textContent=t},
    timer(sec,end){let left=sec;api.tv(left+'s');api.iv(()=>{left--;api.tv(Math.max(0,left)+'s');if(left<=0)end()},1000)},
    canvas(){const cv=document.createElement('canvas');el.appendChild(cv);const dpr=Math.min(2,devicePixelRatio||1);const r=el.getBoundingClientRect();
      cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);const c=cv.getContext('2d');c.scale(dpr,dpr);return{cv,c,W:r.width,H:r.height}},
    done(v){if(fin)return;stop();sfx('done');v=Math.round(v*1000)/1000;
      el.insertAdjacentHTML('beforeend',`<div class="overlay"><div class="gocard"><span>FIM DE JOGO</span><b>${fmtScore(g,v).toUpperCase()}</b></div><p class="hint">À espera do adversário<span class="dotsload"></span></p></div>`);
      cb.done(v)},
    kill:stop};
  el.innerHTML=`<div class="overlay intro"><div class="art">${g.icon}</div><h2>${esc(g.name)}</h2><p>${g.rules}</p><span class="pill">${g.cmp?'Escolha secreta':g.better==='low'?'⬇ Ganha o resultado mais baixo':'⬆ Ganha o resultado mais alto'}</span><button class="btn big" id="go">Começar</button></div>`;
  $('#go').onclick=()=>{let n=3;const cd=()=>{el.innerHTML=`<div class="cd">${n}</div>`;sfx('count')};cd();
    const i=setInterval(()=>{if(fin)return clearInterval(i);n--;if(n>0)cd();else{clearInterval(i);el.innerHTML='';sfx('go');g.play(api)}},650);ids.push(i)};
  return api;
}

/* timed answer runs (same questions for both thanks to the seed) */
function quizRun(a,gen,secs=20){
  let sc=0;a.show(0);
  const next=()=>{const q=gen(a.rnd);const idx=q.opts.map((o,i)=>i);const order=q.fixed?idx:shuf(idx,a.rnd);
    a.el.innerHTML=`<div class="q">${q.q}</div><div class="opts ${q.cls||''}" style="grid-template-columns:repeat(${q.cols||2},1fr)">${order.map(i=>`<button class="opt" data-i="${i}">${q.opts[i]}</button>`).join('')}</div>`;
    let lock=false;
    a.el.querySelectorAll('.opt').forEach(o=>on(o,()=>{if(lock)return;lock=true;const ok=+o.dataset.i===q.ans;o.classList.add(ok?'ok':'bad');
      if(!ok)sfx('bad');sc=Math.max(0,sc+(ok?1:-1));a.show(sc);a.t(next,ok?220:450)}))};
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

/* Three.js scene on the game screen (transparent, so the game colour shows through) */
function three3(a){if(!window.THREE)return null;const r=a.el.getBoundingClientRect();const W=r.width,H=r.height;
  const ren=new THREE.WebGLRenderer({antialias:true,alpha:true});ren.setPixelRatio(Math.min(2,devicePixelRatio||1));ren.setSize(W,H);ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;
  ren.domElement.className='three';a.el.appendChild(ren.domElement);const scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff,0x9aa0c0,.85));const dl=new THREE.DirectionalLight(0xffffff,.85);dl.position.set(5,10,6);dl.castShadow=true;dl.shadow.mapSize.set(1024,1024);
  Object.assign(dl.shadow.camera,{left:-8,right:8,top:8,bottom:-8});scene.add(dl);scene.add(dl.target);return{ren,scene,dl,W,H}}
const NOTICK=['faixa','zig','jelly','colormem','ritmo','center'];
const S_=(id,icon,name,better,unit,rules,play,extra={})=>Object.assign({id,icon,name,kind:'solo',better,unit,rules,play,noTick:NOTICK.includes(id)},extra);
const SOLO=[
/* ---- precision ---- */
S_('jelly','🍮','Corte 50/50','high','%','Toca para cortar a gelatina ao meio. Quanto mais perto de 50/50, melhor. São 2 cortes.',a=>{
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
    if(state==='move'){x+=dir*sp*dt;if(x>maxX){x=maxX;dir=-1}if(x<minX){x=minX;dir=1}}else{tShow+=dt;if(tShow>1.4){if(cutN>=2){a.done(sum/2);return false}mk()}}
    c.clearRect(0,0,W,H);
    const draw=(clipX0,clipX1,dx,col)=>{c.save();c.beginPath();c.rect(clipX0,0,clipX1-clipX0,H);c.clip();c.translate(dx,0);shape(c);
      c.fillStyle=col[0];c.fill();c.restore()};
    if(state==='move'){draw(0,W,0,['#ff2d55']);c.strokeStyle='#fff';c.lineWidth=3;c.setLineDash([8,6]);c.beginPath();c.moveTo(x,cy-base*1.6);c.lineTo(x,cy+base*1.6);c.stroke();c.setLineDash([])}
    else{const off=Math.min(1,tShow*4)*14;draw(0,res.cx,-off,['#ffcc00']);draw(res.cx,W,off,['#00c7be']);
      c.fillStyle='#fff';c.font='800 28px Bricolage Grotesque, sans-serif';c.textAlign='center';
      c.fillText(`${res.L.toFixed(1).replace('.',',')}% / ${(100-res.L).toFixed(1).replace('.',',')}%`,W/2,cy+base*1.55)}
    c.fillStyle='rgba(255,255,255,.7)';c.font='600 15px Rubik, sans-serif';c.textAlign='center';c.fillText(`Corte ${Math.min(cutN+1,2)} de 2`,W/2,30)})}),
S_('center','🎯','No Centro','high','pts','A agulha anda de um lado para o outro. Toca para a parar no verde. 4 tentativas, cada vez mais rápidas.',a=>{
  a.el.innerHTML=`<div style="width:min(340px,90%);position:relative;height:70px"><div style="position:absolute;inset:20px 0;border-radius:12px;overflow:hidden;display:flex"><i style="flex:18;background:#ff375f"></i><i style="flex:16;background:#ff9500"></i><i style="flex:11;background:#ffcc00"></i><i style="flex:10;background:#34c759"></i><i style="flex:11;background:#ffcc00"></i><i style="flex:16;background:#ff9500"></i><i style="flex:18;background:#ff375f"></i></div><div id="nd" style="position:absolute;top:0;bottom:0;width:6px;margin-left:-3px;background:#fff;border-radius:3px;box-shadow:0 0 0 2px #22103f"></div></div><div class="big" id="pt">&nbsp;</div><p class="hint" id="ht">Tentativa 1 de 4</p>`;
  const nd=$('#nd');let p=a.rnd(),dir=1,tries=0,sum=0,paused=false;a.show(0);
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(paused)return;paused=true;const d=Math.abs(p-.5);const s=Math.max(0,Math.round(100-d*220));sum+=s;tries++;a.show(sum);
    $('#pt').textContent=s>=90?`${s} perfeito!`:s;$('#ht').textContent=tries<4?`Tentativa ${tries+1} de 4`:'Fim';
    a.t(()=>{if(tries>=4)return a.done(sum);paused=false;p=a.rnd()},700)});
  a.loop(dt=>{if(!paused){p+=dir*dt*(.8+tries*.28);if(p>1){p=1;dir=-1}if(p<0){p=0;dir=1}}nd.style.left=p*100+'%'})}),
S_('ontime','⏱️','Na Hora Certa','low','s','Para o cronómetro exatamente no tempo pedido. 2 tentativas; soma-se o erro de cada uma.',a=>{
  let tries=0,err=0,t0=0,running=false,target=0;
  a.el.innerHTML=`<p class="hint" id="tg"></p><div class="huge" id="clk">0,000</div><button class="bigbtn" id="b">PARA</button><p class="hint" id="rs">&nbsp;</p>`;
  const go=()=>{target=Ri(a.rnd,20,60)/10;$('#tg').innerHTML=`Para aos <b style="color:var(--lime);font-size:22px">${target.toFixed(1).replace('.',',')} s</b> · tentativa ${tries+1} de 2`;t0=performance.now();running=true};
  on($('#b'),()=>{if(!running)return;running=false;const s=(performance.now()-t0)/1000;const e=Math.abs(s-target);err+=e;tries++;a.show(err);
    $('#clk').textContent=s.toFixed(3).replace('.',',');$('#rs').textContent=`Erro: ${e.toFixed(3).replace('.',',')} s`;a.t(()=>tries>=2?a.done(err):go(),1100)});
  a.loop(()=>{if(running)$('#clk').textContent=((performance.now()-t0)/1000).toFixed(3).replace('.',',')});go()}),
S_('timesup','⌛','Tempo Esgotado','low','s','O relógio desaparece ao fim de 2 segundos. Toca quando achares que passaram exatamente 8 segundos.',a=>{
  const T=8,t0=performance.now();let st=false;
  a.el.innerHTML=`<div class="huge" id="clk">0,0</div><button class="bigbtn" id="b">AGORA</button><p class="hint">Conta de cabeça até ${T} segundos</p>`;
  a.loop(()=>{const s=(performance.now()-t0)/1000;$('#clk').textContent=s<2?s.toFixed(1).replace('.',','):'?,?';if(s>T*2.5){a.done(T*1.5);return false}});
  on($('#b'),()=>{if(st)return;st=true;const s=(performance.now()-t0)/1000;$('#clk').textContent=s.toFixed(3).replace('.',',');a.t(()=>a.done(Math.abs(s-T)),900)})}),
S_('stack','🧱','Torre de Blocos','high','pts','Toca para largar o bloco em cima da torre. O que ficar de fora cai. Acerta em cheio para não perderes tamanho.',a=>{
  const T=three3(a);if(!T)return a.done(0);const {scene,ren,W,H}=T;const asp=W/H,dd=7.2;const cam=new THREE.OrthographicCamera(-dd*asp,dd*asp,dd,-dd,.1,100);
  T.dl.position.set(6,14,4);const BH=.5,hue0=a.rnd();
  const mk=(w,d,x,y,z,i,h)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h||BH,d),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL((hue0+i*.035)%1,.72,.62),roughness:.45}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);return m};
  mk(3,3,0,-3,0,0,6);const stack=[{w:3,d:3,x:0,z:0}];mk(3,3,0,0,0,0);
  let axis='x',cur=null,dir=1,sc=0,over=false,debris=[],camY=0;
  const spawn=()=>{const top=stack[stack.length-1];axis=stack.length%2?'x':'z';const p={w:top.w,d:top.d,x:top.x,z:top.z};p[axis]=-4.5;cur={...p,m:mk(p.w,p.d,p.x,stack.length*BH,p.z,stack.length)};dir=1};
  spawn();a.show(0);
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(over)return;const top=stack[stack.length-1];const size=axis==='x'?'w':'d';let delta=cur[axis]-top[axis];
    if(top[size]-Math.abs(delta)<=0){over=true;debris.push({m:cur.m,v:0});a.t(()=>a.done(sc),1100);return}
    if(Math.abs(delta)<.1)delta=0;const nw=top[size]-Math.abs(delta),center=top[axis]+delta/2,y=cur.m.position.y;
    if(delta){const cs=Math.abs(delta),dims={w:cur.w,d:cur.d},pos={x:cur.x,z:cur.z};dims[size]=cs;pos[axis]=center+Math.sign(delta)*(nw/2+cs/2);debris.push({m:mk(dims.w,dims.d,pos.x,y,pos.z,stack.length),v:0})}
    scene.remove(cur.m);const dims={w:cur.w,d:cur.d},pos={x:cur.x,z:cur.z};dims[size]=nw;pos[axis]=center;mk(dims.w,dims.d,pos.x,y,pos.z,stack.length);stack.push({...dims,...pos});sc++;a.show(sc);spawn()});
  a.loop(dt=>{if(!over){cur[axis]+=dir*dt*(2.4+sc*.1);if(cur[axis]>4.5){cur[axis]=4.5;dir=-1}if(cur[axis]<-4.5){cur[axis]=-4.5;dir=1}cur.m.position[axis]=cur[axis]}
    debris.forEach(o=>{o.v+=dt*14;o.m.position.y-=o.v*dt;o.m.rotation.x+=dt*.6});
    camY+=(stack.length*BH-camY)*Math.min(1,dt*4);cam.position.set(8,9.5+camY,8);cam.lookAt(0,camY+1.5,0);T.dl.position.y=14+camY;T.dl.target.position.set(0,camY,0);T.dl.target.updateMatrixWorld();ren.render(scene,cam)})}),
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
S_('react','⚡','Reflexos','low','ms','Quando ficar verde, toca o mais depressa possível. 3 vezes; conta a média. Tocar antes do tempo dá 1 segundo de castigo.',a=>{
  a.el.innerHTML=`<button id="pad" style="position:absolute;inset:16px;border:0;border-radius:28px;font:800 34px var(--display);color:#22103f"></button>`;const pad=$('#pad');
  let n=0,tot=0,st='wait',t0=0,tid=0;
  const arm=()=>{st='wait';pad.style.background='#ff5d73';pad.textContent='Espera…';tid=a.t(()=>{st='go';t0=performance.now();pad.style.background='#c6ff3d';pad.textContent='TOCA!'},1100+a.rnd()*2600)};
  on(pad,()=>{if(st==='res')return;let ms;if(st==='wait'){clearTimeout(tid);ms=1000;pad.textContent='Cedo demais! +1000 ms'}else{ms=performance.now()-t0;pad.textContent=Math.round(ms)+' ms'}
    st='res';pad.style.background='#38d9e8';n++;tot+=ms;a.show(tot/n);a.t(()=>n>=3?a.done(tot/3):arm(),900)});arm()}),
S_('colorreflex','🟩','Reflexo de Cor','high','pts','A caixa muda de cor. Toca só quando estiver VERDE. Tocar noutra cor tira um ponto. 15 segundos.',a=>{
  a.el.innerHTML=`<p class="hint">Toca só no <b style="color:#2ee59d">VERDE</b></p><button class="cbox" id="cb" style="border:0"></button>`;const cb=$('#cb');const C=['#2ee59d','#ff5d73','#ffd23f','#4d8bff','#ff9f43','#b98cff'];
  let cur=1,sc=0,used=false;a.show(0);
  const next=()=>{cur=a.rnd()<.32?0:1+Math.floor(a.rnd()*5);used=false;cb.style.background=C[cur];a.t(next,450+a.rnd()*500)};
  on(cb,()=>{if(used)return;used=true;sc=Math.max(0,sc+(cur===0?1:-1));a.show(sc);cb.animate([{transform:'scale(.92)'},{transform:'scale(1)'}],150)});
  next();a.timer(15,()=>a.done(sc))}),
S_('count','🔢','1-2-3','low','s','Toca nos números de 1 a 20 por ordem, o mais rápido possível. Cada engano custa 1 segundo.',a=>{
  const nums=shuf([...Array(20).keys()].map(i=>i+1),a.rnd);let nx=1,pen=0;const t0=performance.now();
  a.el.innerHTML=`<div class="g4" style="grid-template-columns:repeat(4,1fr)">${nums.map(n=>`<button data-n="${n}">${n}</button>`).join('')}</div>`;
  a.loop(()=>a.tv(((performance.now()-t0)/1000+pen).toFixed(1)+'s'));
  a.el.querySelectorAll('button').forEach(b=>on(b,()=>{if(+b.dataset.n===nx){b.classList.add('done');nx++;if(nx>20)a.done((performance.now()-t0)/1000+pen)}
    else{pen+=1;b.classList.add('miss');a.t(()=>b.classList.remove('miss'),250)}}))}),
S_('targets','🎯','Tiro ao Alvo','high','pts','Acerta no máximo de alvos em 15 segundos. Cada vez ficam mais pequenos e rápidos.',a=>{
  let sc=0,el0=performance.now();a.show(0);const R0=a.el.getBoundingClientRect();
  const spawn=()=>{const age=(performance.now()-el0)/1000;const s=Math.max(38,80-age*2.2);const b=document.createElement('button');b.className='tg';
    b.style.width=b.style.height=s+'px';b.style.left=a.rnd()*(R0.width-s)+'px';b.style.top=a.rnd()*(R0.height-s)+'px';a.el.appendChild(b);
    const kill=a.t(()=>b.remove(),Math.max(650,1300-age*30));on(b,()=>{clearTimeout(kill);b.remove();sc++;a.show(sc)})};
  a.iv(spawn,480);spawn();a.timer(15,()=>a.done(sc))}),
S_('swipe','👉','Desliza!','high','pts','Desliza o dedo na direção da seta. Se a seta for VERMELHA, desliza para o lado oposto. 15 segundos.',a=>{
  const D=['↑','→','↓','←'],V=[[0,-1],[1,0],[0,1],[-1,0]];let cur,red,sc=0,sx,sy;a.show(0);
  const next=()=>{cur=Math.floor(a.rnd()*4);red=a.rnd()<.35;a.el.innerHTML=`<div class="arrow" style="color:${red?'#ff5d73':'#2ee59d'}">${D[cur]}</div><p class="hint">${red?'Vermelha: ao contrário!':'Desliza para lá'}</p>`};
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();sx=e.clientX;sy=e.clientY});
  a.el.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.hypot(dx,dy)<30)return;
    const dirI=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);const want=red?(cur+2)%4:cur;sc=Math.max(0,sc+(dirI===want?1:-1));a.show(sc);
    a.el.style.background=dirI===want?'rgba(46,229,157,.15)':'rgba(255,93,115,.2)';a.t(()=>a.el.style.background='',150);next()});
  next();a.timer(15,()=>a.done(sc))}),
S_('piano','🎹','Piano','high','pts','Toca só nas teclas pretas da fila de baixo, por ordem. Uma tecla branca e acabou. 15 segundos.',a=>{
  const rows=[];const add=()=>rows.push(Math.floor(a.rnd()*4));for(let i=0;i<5;i++)add();let sc=0,over=false;a.show(0);
  const draw=()=>{a.el.innerHTML=`<div class="piano">${rows.slice(0,5).map((k,ri)=>`<div class="pr">${[0,1,2,3].map(i=>`<button data-r="${ri}" data-i="${i}" class="${i===k?'k':''}"></button>`).join('')}</div>`).join('')}</div>`;
    a.el.querySelectorAll('button').forEach(b=>on(b,()=>{if(over)return;if(+b.dataset.r!==0)return;
      if(+b.dataset.i===rows[0]){rows.shift();add();sc++;a.show(sc);draw()}else{over=true;b.classList.add('miss');a.t(()=>a.done(sc),700)}}))};
  draw();a.timer(15,()=>{over=true;a.done(sc)})}),
/* ---- memory ---- */
S_('memnum','🧠','Memória de Números','high','pts','Decora o número e escreve-o. Cada vez tem mais um algarismo. Um erro e acabou.',a=>{
  let L=3,sc=0;a.show(0);
  const round=()=>{const num=Array.from({length:L},()=>Math.floor(a.rnd()*10)).join('');
    a.el.innerHTML=`<p class="hint">Decora</p><div class="huge" style="letter-spacing:.08em">${num}</div>`;
    a.t(()=>{let e='';a.el.innerHTML=`<p class="hint">Escreve o número (${L} algarismos)</p><div class="entry" id="en">&nbsp;</div><div class="keypad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-k="${n}">${n}</button>`).join('')}<button class="k2" data-k="del">⌫</button><button data-k="0">0</button><button class="k2" data-k="ok">OK</button></div>`;
      a.el.querySelectorAll('[data-k]').forEach(b=>on(b,()=>{const k=b.dataset.k;if(k==='del')e=e.slice(0,-1);else if(k!=='ok'&&e.length<L)e+=k;$('#en').textContent=e||' ';
        if(k==='ok'||e.length===L){if(e===num){sc=L;a.show(sc);L++;a.t(round,350)}else{$('#en').innerHTML=`<span style="color:var(--bad)">${e}</span> → ${num}`;a.t(()=>a.done(sc),1400)}}}))},900+L*350)};
  round()}),
S_('colormem','🎨','Memória de Cor','high','%','Decora a cor e depois recria-a com as barras. São 2 cores; conta a média da semelhança.',a=>{
  let n=0,sum=0;a.show(0);
  const hsl2rgb=(h,s,l)=>{s/=100;l/=100;const k=i=>(i+h/30)%12,f=i=>l-s*Math.min(l,1-l)*Math.max(-1,Math.min(k(i)-3,9-k(i),1));return[f(0)*255,f(8)*255,f(4)*255]};
  const round=()=>{const T=[Math.floor(a.rnd()*360),40+Math.floor(a.rnd()*55),30+Math.floor(a.rnd()*45)];
    a.el.innerHTML=`<p class="hint">Decora esta cor (${n+1} de 2)</p><div class="swatch" style="background:hsl(${T[0]} ${T[1]}% ${T[2]}%)"></div>`;
    a.t(()=>{let h=180,s=50,l=50;
      a.el.innerHTML=`<p class="hint">Recria a cor</p><div class="swatch" id="sw"></div><div class="sliders"><input type="range" id="h" min="0" max="359" value="180" aria-label="Tom"><input type="range" id="s" min="0" max="100" value="50" aria-label="Saturação"><input type="range" id="l" min="0" max="100" value="50" aria-label="Luz"></div><button class="btn" id="ok">Confirmar</button>`;
      const upd=()=>{h=+$('#h').value;s=+$('#s').value;l=+$('#l').value;$('#sw').style.background=`hsl(${h} ${s}% ${l}%)`;
        const bands=A=>'linear-gradient(90deg,'+A.map((c,i)=>`${c} ${i/A.length*100}% ${(i+1)/A.length*100}%`).join(',')+')';$('#h').style.background=bands([...Array(12).keys()].map(i=>`hsl(${i*30} ${s}% ${l}%)`));
        $('#s').style.background=bands([...Array(8).keys()].map(i=>`hsl(${h} ${i*100/7}% ${l}%)`));$('#l').style.background=bands([...Array(8).keys()].map(i=>`hsl(${h} ${s}% ${i*100/7}%)`))};
      ['h','s','l'].forEach(id=>$('#'+id).addEventListener('input',upd));upd();
      $('#ok').onclick=()=>{const p=hsl2rgb(...T),q=hsl2rgb(h,s,l);const d=Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);const acc=Math.max(0,100-d/2.2);sum+=acc;n++;a.show(sum/n);
        a.el.innerHTML=`<div class="row" style="width:min(300px,100%)"><div class="swatch" style="background:hsl(${T[0]} ${T[1]}% ${T[2]}%)"></div><div class="swatch" style="background:hsl(${h} ${s}% ${l}%)"></div></div><div class="big">${acc.toFixed(1).replace('.',',')}%</div>`;
        a.t(()=>n>=2?a.done(sum/2):round(),1300)}},2600)};
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
S_('cups','🥤','Bola e Copos','high','pts','Segue o copo que tem a bola. Cada nível baralha mais depressa e, a partir do nível 3, a bola pode saltar para outro copo. Um erro e acabou.',a=>{
  let lvl=0;a.show(0);
  a.el.innerHTML=`<p class="hint" id="ch">Olha bem para a bola</p><div class="cups"><div class="tbl"></div><div class="ball" id="ball"></div>${[0,1,2].map(i=>`<button class="cup" data-c="${i}" aria-label="Copo ${i+1}"><span class="cw"><span class="cb"></span><span class="ct"></span><span class="cr"></span></span></button>`).join('')}</div>`;
  const cups=[...a.el.querySelectorAll('.cup')],ball=$('#ball'),ch=$('#ch');
  const SL=[{x:17,y:0,s:.8,z:2},{x:50,y:34,s:1.08,z:6},{x:83,y:0,s:.8,z:2}];
  let slot=[0,1,2],ballCup=0,can=false;
  const put=(el,sl,dur,isBall)=>{const q=SL[sl];el.style.transitionDuration=dur+'ms';el.style.left=q.x+'%';el.style.transform=`translate(-50%,${q.y}px) scale(${q.s})`;el.style.zIndex=isBall?q.z-1:q.z};
  const place=dur=>{cups.forEach((c,i)=>put(c,slot[i],dur));put(ball,slot[ballCup],dur,true)};
  const lift=(ids,cls,on_)=>ids.forEach(i=>cups[i].classList.toggle(cls,on_));
  const jump=(next)=>{const from=ballCup;let to=(from+1+Math.floor(a.rnd()*2))%3;
    lift([from,to],'peek',true);ball.style.opacity=1;place(0);
    a.t(()=>{const A=SL[slot[from]],B=SL[slot[to]];ball.style.zIndex=9;
      ball.animate([{left:A.x+'%',transform:`translate(-50%,${A.y}px) scale(${A.s})`},{left:(A.x+B.x)/2+'%',transform:`translate(-50%,${(A.y+B.y)/2-46}px) scale(${(A.s+B.s)/2})`},{left:B.x+'%',transform:`translate(-50%,${B.y}px) scale(${B.s})`}],{duration:520,easing:'ease-in-out'});
      ballCup=to;put(ball,slot[to],0,true);
      a.t(()=>{lift([from,to],'peek',false);a.t(()=>{ball.style.opacity=0;next()},320)},560)},330)};
  const round=()=>{ballCup=Math.floor(a.rnd()*3);ball.style.opacity=1;place(0);lift([0,1,2],'up',false);cups[ballCup].classList.add('up');ch.textContent=`Nível ${lvl+1} · olha bem para a bola`;
    a.t(()=>{cups[ballCup].classList.remove('up');a.t(()=>{ball.style.opacity=0;const n=3+lvl*2,dur=Math.max(170,430-lvl*38);
      const jumps=lvl>=2?new Set([Math.floor(a.rnd()*n)].concat(lvl>=5?[Math.floor(a.rnd()*n)]:[])):new Set();let k=0;
      const step=()=>{if(k>=n){can=true;ch.textContent='Onde está a bola?';return}const cur=k++;
        if(jumps.has(cur)){jumps.delete(cur);return jump(step)}
        const i=Math.floor(a.rnd()*3),j=(i+1+Math.floor(a.rnd()*2))%3;const ci=slot.indexOf(i),cj=slot.indexOf(j);[slot[ci],slot[cj]]=[slot[cj],slot[ci]];place(dur);a.t(step,dur+40)};
      step()},380)},1100)};
  cups.forEach((c,i)=>on(c,()=>{if(!can)return;can=false;ball.style.opacity=1;place(0);cups[ballCup].classList.add('up');if(i!==ballCup)c.classList.add('up');
    if(i===ballCup){lvl++;a.show(lvl);ch.textContent='Boa!';a.t(round,1100)}else{ch.textContent='Errado!';a.t(()=>a.done(lvl),1200)}}));
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
S_('snake','🐍','Cobra','high','pts','Desliza para mudar de direção e come as maçãs. Não batas nas paredes nem em ti. 35 segundos.',a=>{
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
    c.clearRect(0,0,W,H);c.fillStyle='rgba(0,0,0,.22)';c.fillRect(ox,oy,cs*N,cs*N);
    c.fillStyle='#ffd23f';c.beginPath();c.arc(ox+food[0]*cs+cs/2,oy+food[1]*cs+cs/2,cs*.38,0,Math.PI*2);c.fill();
    sn.forEach((s,i)=>{c.fillStyle=i?'#38d9e8':'#7cf5ff';c.fillRect(ox+s[0]*cs+1,oy+s[1]*cs+1,cs-2,cs-2)})});
  a.timer(35,()=>{over=true;a.done(sc)})}),
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
S_('chop','🎋','Ninja Corta-Bambu','high','pts','Toca na metade ESQUERDA ou DIREITA do ecrã: o ninja salta para esse lado e corta. Foge dos ramos verdes e não deixes a barra de tempo acabar.',a=>{
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
    const nx=cx+side*(tw/2+34);c.fillStyle=over?'#ff5d73':'rgba(0,0,0,.22)';c.beginPath();c.arc(nx,base-28,20,0,Math.PI*2);c.fill();c.fillStyle='#ff5d73';c.fillRect(nx-20,base-34,40,7);
    if(hit){c.fillStyle='#fff';c.fillRect(cx+side*tw/2-(side>0?0:30),base-40,30,4)}
    c.save();c.globalAlpha=sc<4?.9:.28;c.fillStyle='rgba(255,255,255,.06)';c.fillRect(0,H-150,W/2-6,150);c.fillRect(W/2+6,H-150,W/2-6,150);
    c.fillStyle='#fff';c.font='800 22px Bricolage Grotesque,sans-serif';c.textAlign='center';c.fillText('◀ TOCA',W*.22,H-22);c.fillText('TOCA ▶',W*.78,H-22);c.restore();
    c.fillStyle='rgba(0,0,0,.22)';c.fillRect(W*.2,18,W*.6,12);c.fillStyle=time>.3?'#c6ff3d':'#ff5d73';c.fillRect(W*.2,18,W*.6*Math.max(0,time),12)})}),
S_('keepup','⚪','Não Deixes Cair','high','pts','Toca na bola para a manter no ar. Se tocar no chão, acabou.',a=>{
  const {c,W,H}=a.canvas();const r=32;let x=W/2,y=H*.3,vx=(a.rnd()-.5)*60,vy=0,sc=0,over=false;a.show(0);
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(over)return;const b=a.el.getBoundingClientRect();const tx=e.clientX-b.left,ty=e.clientY-b.top;
    if(Math.hypot(tx-x,ty-y)<r*1.7){vy=-Math.min(820,620+sc*8);vx+=(x-tx)*7;sc++;a.show(sc)}});
  a.loop(dt=>{if(!over){vy+=(1250+sc*15)*dt;x+=vx*dt;y+=vy*dt;if(x<r){x=r;vx=Math.abs(vx)}if(x>W-r){x=W-r;vx=-Math.abs(vx)}if(y<r){y=r;vy=Math.abs(vy)}
      if(y>H-r){y=H-r;over=true;a.t(()=>a.done(sc),700)}}
    c.clearRect(0,0,W,H);c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(x,H-6,r*(.4+y/H*.6),6,0,0,Math.PI*2);c.fill();
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle='#fff';c.fill()})}),
/* ---- added: lane, rhythm, basket, sum10, true/false, pairs ---- */
S_('faixa','🚗','Faixa Rápida','high','pts','Toca na metade ESQUERDA ou DIREITA do ecrã para mudar de faixa e fugir aos carros. Fica cada vez mais rápido.',a=>{
  const T=three3(a);if(!T)return a.done(0);const {scene,ren,W,H}=T;const cam=new THREE.PerspectiveCamera(62,W/H,.1,220);cam.position.set(0,5.2,10.5);cam.lookAt(0,0,-9);
  T.dl.position.set(-6,14,8);T.dl.shadow.camera.left=-10;T.dl.shadow.camera.right=10;T.dl.shadow.camera.top=12;T.dl.shadow.camera.bottom=-12;
  const std=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6},o));
  const road=new THREE.Mesh(new THREE.PlaneGeometry(7.6,400),std(0x3a3a3c));road.rotation.x=-Math.PI/2;road.position.z=-150;road.receiveShadow=true;scene.add(road);
  [-1,1].forEach(s=>{const g=new THREE.Mesh(new THREE.PlaneGeometry(60,400),std(0x34c759));g.rotation.x=-Math.PI/2;g.position.set(s*33.8,-.01,-150);g.receiveShadow=true;scene.add(g);
    const e=new THREE.Mesh(new THREE.BoxGeometry(.2,.05,400),std(0xffffff));e.position.set(s*3.6,.02,-150);scene.add(e)});
  const marks=[];for(let i=0;i<40;i++)[-1.2,1.2].forEach(x=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.14,.03,2),std(0xffffff));m.position.set(x,.02,-i*6);scene.add(m);marks.push(m)});
  const trees=[];for(let i=0;i<24;i++){const t=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(.15,.2,1,8),std(0x8b5a2b));tr.position.y=.5;t.add(tr);
    const cn=new THREE.Mesh(new THREE.ConeGeometry(.9,2.2,10),std(new THREE.Color().setHSL(.33+Math.random()*.06,.6,.38)));cn.position.y=2;cn.castShadow=true;t.add(cn);
    t.position.set((i%2?1:-1)*(5+Math.random()*6),0,-i*8);scene.add(t);trees.push(t)}
  const car=col=>{const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(1.35,.5,2.3),std(col,{roughness:.3,metalness:.2}));b.position.y=.5;b.castShadow=true;g.add(b);
    const c=new THREE.Mesh(new THREE.BoxGeometry(1.05,.42,1.15),std(0xdfefff,{roughness:.1,metalness:.4}));c.position.set(0,.95,.05);c.castShadow=true;g.add(c);
    [[-.68,.75],[.68,.75],[-.68,-.75],[.68,-.75]].forEach(([x,z])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.22,16),std(0x1c1c1e));w.rotation.z=Math.PI/2;w.position.set(x,.27,z);g.add(w)});scene.add(g);return g};
  const me_=car(0x30d158);let lane=0,cars=[],dist=0,sp=16,over=false,acc=0;a.show(0);
  const hint=document.createElement('div');hint.style.cssText='position:absolute;bottom:16px;left:16px;right:16px;display:flex;justify-content:space-between;font:800 20px var(--display);color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.3);z-index:3;pointer-events:none;transition:opacity .4s';hint.innerHTML='<span>◀ TOCA</span><span>TOCA ▶</span>';a.el.appendChild(hint);
  const COL=[0xff375f,0x0a84ff,0xffd60a,0xbf5af2,0xff9f0a,0xffffff];
  const spawn=()=>{const free=Math.floor(a.rnd()*3);for(let i=0;i<3;i++)if(i!==free&&a.rnd()<.55){const g=car(pk(COL,a.rnd));g.position.set((i-1)*2.4,0,-120);g.rotation.y=Math.PI;cars.push(g)}};
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(over)return;const r=a.el.getBoundingClientRect();lane=Math.max(-1,Math.min(1,lane+(e.clientX-r.left<r.width/2?-1:1)))});
  a.loop(dt=>{if(!over){sp+=dt*.6;const s=sp*dt;dist+=s;acc+=s;if(acc>16){acc=0;spawn()}
      cars.forEach(g=>g.position.z+=s*1.6);cars=cars.filter(g=>{if(g.position.z>12){scene.remove(g);return false}return true});
      marks.forEach(m=>{m.position.z+=s;if(m.position.z>8)m.position.z-=240});trees.forEach(t=>{t.position.z+=s;if(t.position.z>10)t.position.z-=192});
      const tx=lane*2.4;me_.position.x+=(tx-me_.position.x)*Math.min(1,dt*10);me_.rotation.y=(tx-me_.position.x)*-.12;
      if(cars.some(g=>Math.abs(g.position.x-me_.position.x)<1.25&&Math.abs(g.position.z)<2.2)){over=true;me_.rotation.y=.6;a.t(()=>a.done(Math.floor(dist/4)),900)}
      a.show(Math.floor(dist/4));if(dist>300)hint.style.opacity=.25}
    ren.render(scene,cam)})}),
S_('ritmo','🥁','Ritmo','high','%','O anel encolhe até ao círculo: toca no momento exato em que encaixa. São 10 batidas; conta a precisão média.',a=>{
  a.el.innerHTML=`<div id="rp" style="position:relative;width:220px;height:220px"><div style="position:absolute;inset:60px;border-radius:50%;background:#ffd23f;box-shadow:0 0 0 8px rgba(255,210,63,.25)"></div><div id="rr" style="position:absolute;inset:60px;border-radius:50%;border:6px solid #fff;opacity:0"></div></div><div class="big" id="rf">&nbsp;</div><p class="hint">Toca em qualquer sítio do ecrã</p>`;
  const N=10,ivl=600,lead=1300,t0=performance.now()+lead;const beats=Array.from({length:N},(_,k)=>t0+k*ivl);const got=new Array(N).fill(null);let ac=null;
  try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
  const beep=(at)=>{if(!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;g.gain.value=.0001;o.connect(g);g.connect(ac.destination);const t=ac.currentTime+Math.max(0,(at-performance.now())/1000);
    g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.09);o.start(t);o.stop(t+.1)};
  beats.forEach(b=>beep(b));
  const avg=()=>{const v=got.map(x=>x==null?0:x);return v.reduce((s,x)=>s+x,0)/N};
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();const now=performance.now();let bi=-1,bd=1e9;beats.forEach((b,i)=>{if(got[i]==null&&Math.abs(now-b)<bd){bd=Math.abs(now-b);bi=i}});
    if(bi<0||bd>300)return;const sc=Math.max(0,100-bd/2.2);got[bi]=sc;$('#rf').textContent=sc>90?'Perfeito!':sc>70?'Boa':sc>40?'Quase':'Fora';a.show(avg())});
  a.loop(()=>{const now=performance.now();const nx=beats.findIndex((b,i)=>got[i]==null&&b>now-300);const rr=$('#rr');
    if(nx<0){if(now>beats[N-1]+400){a.done(avg());return false}rr.style.opacity=0;return}
    const p=(beats[nx]-now)/ivl;rr.style.opacity=p<1.05&&p>-.3?1:0;rr.style.transform=`scale(${1+Math.max(-.2,p)*1.6})`;
    beats.forEach((b,i)=>{if(got[i]==null&&now>b+300)got[i]=0})})}),
S_('basket','🏀','Basquetebol','high','pts','Arrasta o dedo para cima para lançar: para o lado aponta, o comprimento dá força. O cesto mexe-se. O máximo de cestos em 20 segundos.',a=>{
  const T=three3(a);if(!T)return a.done(0);const {scene,ren,W,H}=T;const cam=new THREE.PerspectiveCamera(55,W/H,.1,100);cam.position.set(0,1.8,3.4);cam.lookAt(0,2.5,-5);
  const std=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.55},o));
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),std(0xd9a066));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const line=new THREE.Mesh(new THREE.RingGeometry(2.6,2.7,48,1,0,Math.PI),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));line.rotation.x=-Math.PI/2;line.rotation.z=Math.PI;line.position.set(0,.01,-4.75);scene.add(line);
  
  const hoop=new THREE.Group();scene.add(hoop);
  const board=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.1,.06),std(0xffffff,{roughness:.2}));board.position.set(0,3.55,-5.3);board.castShadow=true;hoop.add(board);
  const sq=new THREE.Mesh(new THREE.BoxGeometry(.6,.45,.07),std(0xff375f));sq.position.set(0,3.35,-5.29);hoop.add(sq);const sq2=new THREE.Mesh(new THREE.BoxGeometry(.5,.35,.075),std(0xffffff,{roughness:.2}));sq2.position.set(0,3.35,-5.285);hoop.add(sq2);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.45,.035,12,40),std(0xff6a00,{metalness:.3}));rim.rotation.x=Math.PI/2;rim.position.set(0,3.05,-4.75);rim.castShadow=true;hoop.add(rim);
  const net=new THREE.Mesh(new THREE.CylinderGeometry(.45,.28,.5,16,4,true),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.8}));net.position.set(0,2.8,-4.75);hoop.add(net);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,3.6,12),std(0x8e8e93,{metalness:.5}));pole.position.set(0,1.8,-5.6);pole.castShadow=true;hoop.add(pole);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.24,32,16),std(0xff7a1a,{roughness:.7}));ball.castShadow=true;scene.add(ball);
  const seam=new THREE.Mesh(new THREE.TorusGeometry(.242,.008,6,40),new THREE.MeshBasicMaterial({color:0x5a2300}));ball.add(seam);const seam2=seam.clone();seam2.rotation.y=Math.PI/2;ball.add(seam2);
  const fx=document.createElement('div');fx.style.cssText='position:absolute;left:0;right:0;top:38%;text-align:center;font:800 44px var(--display);color:#fff;text-shadow:0 6px 20px rgba(0,0,0,.3);opacity:0;transition:opacity .2s;pointer-events:none;z-index:3';fx.textContent='CESTO!';a.el.appendChild(fx);
  const hint=document.createElement('div');hint.className='hint';hint.style.cssText='position:absolute;bottom:18px;left:0;right:0;z-index:3;pointer-events:none';hint.textContent='Arrasta para cima ↑';a.el.appendChild(hint);
  const P0=new THREE.Vector3(0,1.25,1.0);let p=P0.clone(),v=new THREE.Vector3(),live=false,hx=0,hd=1,sc=0,sx,sy,age=0,bounces=0,scored=false;ball.position.copy(p);a.show(0);
  a.el.addEventListener('pointerdown',e=>{e.preventDefault();if(live)return;sx=e.clientX;sy=e.clientY});
  a.el.addEventListener('pointerup',e=>{if(live||sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(dy>-30)return;
    const vy0=7,disc=vy0*vy0-2*9.8*(3.05-P0.y),tc=(vy0+Math.sqrt(disc))/9.8;const pw=-dy/(H*.38);const f=pw<.7?pw/.7*.88:pw>1.45?pw/1.45*1.1:1;
    const tx=(dx/(W/2))*2.6;v.set(tx/tc,vy0,(-4.75-P0.z)/tc*f);p.copy(P0);live=true;age=0;bounces=0;scored=false;hint.style.opacity=0});
  a.loop(dt=>{hx+=hd*(1.1+sc*.12)*dt;if(hx>2.1){hx=2.1;hd=-1}if(hx<-2.1){hx=-2.1;hd=1}hoop.position.x=hx;
    if(live){age+=dt;const py=p.y;v.y-=9.8*dt;p.addScaledVector(v,dt);ball.rotation.x-=dt*8;
      if(v.y<0&&py>=3.05&&p.y<3.05){const ddx=p.x-hx,ddz=p.z+4.75,dist=Math.hypot(ddx,ddz);
        if(dist<.33&&!scored){scored=true;sc++;a.show(sc);fx.style.opacity=1;setTimeout(()=>fx.style.opacity=0,700);v.x*=.3;v.z*=.3;net.scale.y=.75;setTimeout(()=>net.scale.y=1,250)}
        else if(dist<.65){v.y=Math.abs(v.y)*.45;v.x+=ddx*3;v.z+=ddz*3}}
      if(p.z<-5.2&&p.z>-5.45&&Math.abs(p.x-hx)<.9&&p.y>3&&p.y<4.1){v.z=Math.abs(v.z)*.5;p.z=-5.2}
      if(p.y<.24){p.y=.24;v.y=-v.y*.55;v.x*=.8;v.z*=.8;bounces++}
      if(bounces>2||age>3.2||Math.abs(p.x)>6){live=false;p.copy(P0);hint.style.opacity=.9}}
    ball.position.copy(p);ren.render(scene,cam)});
  a.timer(20,()=>a.done(sc))}),
S_('soma10','🔟','Soma 10','high','pts','Toca em dois números que somem 10. Os pares certos dão ponto e são trocados por novos; um par errado tira um ponto. 20 segundos.',a=>{
  let g=Array.from({length:16},()=>Ri(a.rnd,1,9)),sel=null,sc=0;a.show(0);
  const fix=()=>{const has=g.some((x,i)=>g.some((y,j)=>i!==j&&x+y===10));if(!has){const i=Ri(a.rnd,0,15);let j=(i+1+Ri(a.rnd,0,14))%16;g[j]=10-g[i]}};fix();
  const draw=()=>{a.el.innerHTML=`<p class="hint">Faz 10 com dois números</p><div class="g4">${g.map((n,i)=>`<button data-i="${i}" class="${sel===i?'lit':''}">${n}</button>`).join('')}</div>`;
    a.el.querySelectorAll('[data-i]').forEach(b=>on(b,()=>{const i=+b.dataset.i;if(sel==null){sel=i;draw();return}if(sel===i){sel=null;draw();return}
      if(g[sel]+g[i]===10){sc++;g[sel]=Ri(a.rnd,1,9);g[i]=Ri(a.rnd,1,9);fix()}else{sc=Math.max(0,sc-1);b.classList.add('miss')}sel=null;a.show(sc);a.t(draw,g[0]!=null?120:0)}))};
  draw();a.timer(20,()=>a.done(sc))}),
S_('vf','✅','Certo ou Errado','high','pts','Aparece uma conta já resolvida. Diz se o resultado está certo ou errado. 20 segundos; cada erro tira um ponto.',a=>quizRun(a,r=>{const op=pk(['+','−','×'],r);let x,y,v;
  if(op==='×'){x=Ri(r,3,12);y=Ri(r,3,12);v=x*y}else if(op==='+'){x=Ri(r,12,89);y=Ri(r,12,89);v=x+y}else{x=Ri(r,30,99);y=Ri(r,5,x-5);v=x-y}
  const ok=r()<.5;const shown=ok?v:v+pk([-10,-2,-1,1,2,10],r);return{q:`<div class="big">${x} ${op} ${y} = ${shown}</div>`,opts:['✓ Certo','✗ Errado'],ans:ok?0:1,fixed:true}})),
S_('pares','🃏','Jogo dos Pares','low','s','Vira as cartas duas a duas e encontra os 8 pares. Ganha quem terminar mais depressa.',a=>{
  const E=shuf(['🍕','🚀','🐙','🎸','🌵','🍩','⚽','🦊'],a.rnd);const deck=shuf([...E,...E],a.rnd);const open=[],done=new Set();let lock=false;const t0=performance.now();
  a.el.innerHTML=`<div class="g4">${deck.map((e,i)=>`<button data-i="${i}"></button>`).join('')}</div>`;const bs=[...a.el.querySelectorAll('[data-i]')];
  a.loop(()=>a.tv(((performance.now()-t0)/1000).toFixed(1)+'s'));
  bs.forEach((b,i)=>on(b,()=>{if(lock||done.has(i)||open.includes(i))return;b.textContent=deck[i];b.classList.add('lit');open.push(i);
    if(open.length===2){const [x,y]=open;if(deck[x]===deck[y]){done.add(x);done.add(y);bs[x].classList.replace('lit','hit');bs[y].classList.replace('lit','hit');open.length=0;
        if(done.size===16)a.done((performance.now()-t0)/1000)}
      else{lock=true;a.t(()=>{[x,y].forEach(k=>{bs[k].textContent='';bs[k].classList.remove('lit')});open.length=0;lock=false},650)}}}))}),
/* ---- quick-answer runs ---- */
S_('mat','➗','Contas Rápidas','high','pts','Responde ao máximo de contas em 20 segundos. Cada erro tira um ponto.',a=>quizRun(a,r=>{const op=pk(['+','−','×'],r);let x,y,v;
  if(op==='×'){x=Ri(r,3,12);y=Ri(r,3,12);v=x*y}else if(op==='+'){x=Ri(r,12,89);y=Ri(r,12,89);v=x+y}else{x=Ri(r,30,99);y=Ri(r,5,x-5);v=x-y}
  const s=new Set([v]);while(s.size<4){const z=v+pk([-10,-3,-2,-1,1,2,3,10],r);if(z>=0)s.add(z)}return{q:`<div class="big">${x} ${op} ${y}</div>`,opts:[...s],ans:0}})),
S_('cor','🖌️','Cor Certa','high','pts','Toca na cor da TINTA, não no que a palavra diz. 20 segundos.',a=>quizRun(a,r=>{const [w,ink]=shuf(CL,r);
  return{q:`<div class="hint">Cor da tinta?</div><div class="big" style="color:${ink[1]}">${w[0]}</div>`,opts:[ink,w,...shuf(CL.filter(x=>x!==ink&&x!==w),r).slice(0,2)].map(x=>x[0]),ans:0}})),
S_('pontos','⚫','Conta os Pontos','high','pts','Conta os pontos e toca no número certo. 20 segundos.',a=>quizRun(a,r=>{const n=Ri(r,7,16);const cells=shuf([...Array(24).keys()],r).slice(0,n);
  const dots=cells.map(q=>`<i style="left:${(q%6)*16+Ri(r,2,7)}%;top:${Math.floor(q/6)*24+Ri(r,4,10)}%"></i>`).join('');const s=new Set([n]);while(s.size<4)s.add(n+pk([-2,-1,1,2],r));
  return{q:`<div class="dots">${dots}</div>`,opts:[...s],ans:0,cols:4}})),
S_('intruso','👀','O Intruso','high','pts','Encontra o emoji diferente. 20 segundos.',a=>quizRun(a,r=>{const [x,y]=pk(ODD,r);const k=Ri(r,0,15);return{q:'',opts:Array.from({length:16},(_,i)=>i===k?y:x),ans:k,cols:4,cls:'e',fixed:true}})),
S_('maior','📈','O Maior','high','pts','Toca no maior número. 20 segundos.',a=>quizRun(a,r=>{const s=new Set();while(s.size<6)s.add(Ri(r,40,99));const o=[...s];return{q:'<div class="hint">Toca no MAIOR</div>',opts:o,ans:o.indexOf(Math.max(...o)),cols:3,fixed:true}})),
S_('quiz','❓','Quiz Relâmpago','high','pts','Cultura geral: o máximo de respostas certas em 25 segundos. Cada erro tira um ponto.',a=>{const order=shuf(QZ,a.rnd);let i=0;
  quizRun(a,r=>{const it=order[i++%order.length];return{q:`<div class="qq">${it[0]}</div>`,opts:it.slice(1),ans:0}},25)}),
/* ---- classics from version 1 ---- */
S_('faroeste','🤠','Duelo no Faroeste','low','s','Dispara só quando aparecer «FOGO!». Há palavras parecidas para te enganar. 2 duelos; soma-se o tempo. Disparar antes do tempo dá 2 segundos de castigo.',a=>{
  let n=0,tot=0,go=false,t0=0,shot=false;
  a.el.innerHTML=`<button id="pad" style="position:absolute;inset:16px;border:0;border-radius:28px;background:rgba(255,255,255,.22);font:800 40px var(--display);color:#fff"></button>`;const pad=$('#pad');
  const round=()=>{go=false;shot=false;const seq=['Preparar…','Apontar…',...shuf(['FOGÃO!','FOCA!','FOGUETE!','FORA!','FIGO!','FOGE!'],a.rnd).slice(0,Ri(a.rnd,0,3)),'FOGO!'];let t=0;
    seq.forEach((w,i)=>{a.t(()=>{if(shot)return;pad.textContent=w;if(i===seq.length-1){go=true;t0=performance.now()}},t);t+=900+a.rnd()*700})};
  on(pad,()=>{if(shot)return;shot=true;const v=go?(performance.now()-t0)/1000:2;pad.textContent=go?v.toFixed(3).replace('.',',')+' s':'Cedo demais! +2 s';n++;tot+=v;a.show(tot);a.t(()=>n>=2?a.done(tot):round(),1100)});
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
