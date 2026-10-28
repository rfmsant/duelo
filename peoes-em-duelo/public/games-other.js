/* Games played on one duelist's phone, and real-life games judged by the others */
//CA=['Marcas de carros','Países da Europa','Frutas','Animais com quatro patas','Clubes de futebol portugueses','Coisas que há numa cozinha','Capitais do mundo','Profissões','Cantores portugueses','Desportos','Coisas amarelas','Marcas de roupa','Doces portugueses','Cidades portuguesas','Partes do corpo','Instrumentos musicais','Coisas para levar para a praia','Bebidas','Séries de televisão','Coisas que há numa casa de banho'];
//RH=['pão','amor','cão','janela','canção','limão','sol','festa','mar','coração','gato','bola','vida','noite','carro','café','flor','pé'];
const LETTERS='ABCDFGLMPRST'.split('');
const WORDS=['Astronauta','Pizza','Girafa','Bicicleta','Dentista','Surfista','Elevador','Vampiro','Pescador','Pinguim','Bombeiro','Guarda-chuva','Selfie','Ginásio','Polvo','Avião','Árvore de Natal','Robô','Castelo','Tubarão'];
//TW=['O rato roeu a rolha da garrafa do rei da Rússia','Três pratos de trigo para três tigres tristes','O tempo perguntou ao tempo quanto tempo o tempo tem','Num ninho de mafagafos há sete mafagafinhos','A aranha arranha a rã, a rã arranha a aranha','O peito do pé do Pedro é preto'];

/* engine for one-phone duels (from version 1) */
function runPhone(g,A,B,cb){
  let fin=false;const ids=[];const stop=()=>{fin=true;ids.forEach(i=>{clearTimeout(i);clearInterval(i)})};
  const ctx={g,A,B,
    t:(f,ms)=>{const i=setTimeout(()=>{if(!fin)f()},ms);ids.push(i);return i},
    iv:(f,ms)=>{const i=setInterval(()=>{if(!fin)f()},ms);ids.push(i);return i},
    end:w=>{if(fin)return;stop();cb(w)},after:w=>ctx.t(()=>ctx.end(w),1300),kill:stop};
  g.play(ctx);return ctx;
}
function pSplit(ctx){const {A,B,g}=ctx;
  app.innerHTML=`<div class="stage"><div class="half top" style="--pc:${A.color}"><div class="hh">${pawn(A.color,24)}<b>${esc(A.name)}</b></div><div class="hb" id="hA"></div></div>
  <div class="mid"><span>${g.icon} ${g.name}</span></div>
  <div class="half bot" style="--pc:${B.color}"><div class="hh">${pawn(B.color,24)}<b>${esc(B.name)}</b></div><div class="hb" id="hB"></div></div></div>`;
  return[$('#hA'),$('#hB')]}
function pFull(ctx,html){app.innerHTML=`<div class="full"><div class="fh"><span class="eyebrow">${ctx.g.icon} ${ctx.g.name}</span></div><div class="fb" id="fb">${html}</div></div>`;return $('#fb')}
function pCount(ctx,els,cb){[3,2,1].forEach((n,i)=>ctx.t(()=>els.forEach(e=>e.innerHTML=`<div class="cd">${n}</div>`),i*700));ctx.t(cb,2100)}
function turnGame(ctx,prompt){
  const P=[ctx.A,ctx.B];let cur=R(0,1),left=5,live=false;const SEC=5;
  pFull(ctx,`<div class="card tprompt">${prompt}</div><div id="tz"></div>`);const tz=$('#tz');
  const draw=()=>{const p=P[cur];
    tz.innerHTML=`<button class="turnbtn" id="tb" style="--pc:${p.color}">${pawn(p.color,52)}<b>${esc(p.name)}</b><span class="tl">${(live?left:5).toFixed(1)}</span><small>${live?'Responde e toca para passar a vez':'Começa tu. Toca para arrancar'}</small></button><div class="tbar"><i style="width:${live?left/SEC*100:100}%"></i></div>`;
    on($('#tb'),tap)};
  const tap=()=>{if(!live){live=true;left=SEC;draw();return}cur=1-cur;left=SEC;draw()};
  ctx.iv(()=>{if(!live)return;left-=.1;
    if(left<=0){live=false;tz.innerHTML=`<div class="big" style="text-align:center">${esc(P[cur].name)} ficou sem tempo!</div>`;ctx.after(1-cur)}
    else{const tl=tz.querySelector('.tl'),bi=tz.querySelector('.tbar i');if(tl){tl.textContent=left.toFixed(1);bi.style.width=left/SEC*100+'%'}}},100);
  draw();
}
const P_=(id,icon,name,rules,play)=>({id,icon,name,kind:'phone',rules,play});
const PHONE=[
P_('cabo','🪢','Cabo de Guerra','Os dois à volta do mesmo telemóvel, um de cada lado. Toquem o mais depressa possível na vossa metade para puxar a corda.',ctx=>{
  const els=pSplit(ctx);let pos=0,live=false;const L=20;
  const draw=()=>els.forEach((e,p)=>{const mine=p===0?-pos:pos;e.innerHTML=`<div class="rope" style="--pc:${[ctx.A,ctx.B][p].color}"><i style="width:${50+mine/L*50}%"></i></div><div class="hint">Puxa! Toca sem parar</div>`});
  pCount(ctx,els,()=>{live=true;draw()});
  els.forEach((e,p)=>on(e.parentElement,()=>{if(!live)return;pos+=p===0?-1:1;draw();if(Math.abs(pos)>=L){live=false;ctx.after(pos<0?0:1)}}))}),
P_('moeda','🪙','Cara ou Coroa','Um dos dois escolhe cara ou coroa. A moeda decide. Sorte pura.',ctx=>{
  const c=R(0,1),P=[ctx.A,ctx.B][c];
  const fb=pFull(ctx,`<div class="center"><p class="lead">${esc(P.name)}, escolhe:</p><div class="row" style="width:100%"><button class="btn" data-c="0">Cara</button><button class="btn" data-c="1">Coroa</button></div><div class="coin" id="coin">?</div><p class="lead" id="cr"></p></div>`);
  fb.querySelectorAll('[data-c]').forEach(bt=>bt.onclick=()=>{const call=+bt.dataset.c;fb.querySelectorAll('[data-c]').forEach(x=>x.disabled=true);const res=R(0,1),coin=$('#coin');coin.classList.add('flip');
    ctx.t(()=>{coin.classList.remove('flip');coin.textContent=res?'👑':'🙂';$('#cr').textContent=`Saiu ${res?'coroa':'cara'}!`;ctx.after(call===res?c:1-c)},1500)})}),
P_('adivinha','🔍','Número Secreto','O telemóvel pensa num número de 1 a 100. À vez, cada um tenta adivinhar e recebe a pista «mais alto» ou «mais baixo». Quem acertar ganha.',ctx=>{
  const P=[ctx.A,ctx.B];const n=R(1,100);let lo=1,hi=100,cur=R(0,1),over=false;
  const fb=pFull(ctx,`<p class="lead" id="gl"></p><div class="ngrid">${Array.from({length:100},(_,i)=>`<button data-n="${i+1}">${i+1}</button>`).join('')}</div>`);
  const gl=$('#gl'),btns=[...fb.querySelectorAll('.ngrid button')];
  const draw=m=>{btns.forEach(b=>{const v=+b.dataset.n;b.disabled=v<lo||v>hi});gl.innerHTML=`${m}<br>Vez de <b style="color:${P[cur].color}">${esc(P[cur].name)}</b> · entre ${lo} e ${hi}`};
  btns.forEach(b=>b.onclick=()=>{if(over)return;const v=+b.dataset.n;
    if(v===n){over=true;b.classList.add('ok');gl.innerHTML=`Era o ${n}! <b>${esc(P[cur].name)}</b> acertou.`;ctx.after(cur);return}
    if(v<n)lo=v+1;else hi=v-1;cur=1-cur;draw(`${v}? Mais ${v<n?'alto ⬆':'baixo ⬇'}`)});
  draw('Adivinhem o número secreto.')}),
P_('letra','🔤','Letra Inicial','À vez, digam palavras começadas pela letra sorteada. Cinco segundos por jogada, sem repetir.',ctx=>turnGame(ctx,`Palavras começadas por ${pick(LETTERS)}`)),
];
const F_=(id,icon,name,rules,o={})=>Object.assign({id,icon,name,kind:'ref',rules},o);
const REF=[
F_('flamingo','🦩','Flamingo','De pé, só num pé e de olhos fechados. Quem pousar o pé ou abrir os olhos primeiro perde.'),
F_('desenho','✏️','Desenho Cego','Cada um vê a sua palavra no telemóvel e desenha-a num papel de olhos fechados. O desenho que o público adivinhar primeiro ganha.',{timer:30,secret:WORDS}),
];
const GAMES=[...SOLO,...PHONE,...REF];
const WHERE={solo:'Cada um no seu telemóvel',phone:'No telemóvel de ',ref:'Na vida real · o público vota'};
