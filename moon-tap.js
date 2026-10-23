/* Moon Tap (versión "Girá y Acertá · Lunar"): sobre una escena ilustrada
   de la luna, tocá en el momento justo para que la pelota llegue a la
   zona dorada del aro cuando pasa el punto. Arranca rápido y errar resta
   un acierto del nivel. 15 niveles; fondo en assets/extensiones/moon-tap/.
   Récord en gya_moon_tap. */
const MoonTap=(()=>{
  const CLAVE="gya_moon_tap";
  let raiz=null,raf=0,ro=null;
  let mejor=0,nivelMax=1;
  function cargar(){try{const d=JSON.parse(localStorage.getItem(CLAVE));if(d&&typeof d==="object"){mejor=Number(d.mejor)||0;nivelMax=Number(d.nivelMax)||1;}}catch(e){}}
  function guardarRecord(){try{localStorage.setItem(CLAVE,JSON.stringify({mejor,nivelMax}));}catch(e){}}
  cargar();
  const q=id=>raiz.querySelector("#"+id);
  function sonido(color){
    if(typeof bip!=="function")return;
    if(color==="#ffd85b"){bip(880,.16,"triangle",.05);bip(1320,.22,"sine",.035);}
    else if(color==="#67f2ac")bip(660,.16,"sine",.05);
  }
  let api={launch(){},reset(){}};
  /* Duelo 1 vs 1: cada uno tira 15 veces en su celular; se ve en vivo
     cuántos puntos y aciertos lleva el otro. Gana el de más puntos. */
  const TIROS_DUELO=15;
  let duelo=false,tiros=0,aciertos=0;
  function alTiro(acierto){
    if(!duelo)return;
    tiros++;if(acierto)aciertos++;
    const pts=api.puntos();
    Duelo.enviarProgreso({puntos:pts,aciertos,tiros});
    const pista=q("mtPista");pista.style.opacity="1";pista.textContent="👥 Duelo · tiro "+tiros+"/"+TIROS_DUELO+" · aciertos "+aciertos;
    if(tiros>=TIROS_DUELO){
      api.bloquear(true);
      Duelo.enviarFinal({valor:pts});
      setTimeout(()=>{if(!raiz)return;Duelo.mostrarResultado({valor:pts},{etiqueta:"puntos en "+TIROS_DUELO+" tiros",onVolver:()=>{duelo=false;const padre=raiz&&raiz.parentElement;if(padre)abrir(padre);}});},900);
    }
  }
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("Moon Tap","moon",{detalle:"Cada uno tira <b>15 veces</b> en su celular y ves en vivo los puntos y aciertos del otro. Gana el que suma <b>más puntos</b>.",onListo:soyHost=>{
      const arrancar=()=>{duelo=true;tiros=0;aciertos=0;Duelo.mostrarBadge();Duelo.actualizarBadge("0 pts");q("mtPanel").hidden=true;api.reset();api.bloquear(false);q("mtReiniciar").disabled=true;const pista=q("mtPista");pista.style.opacity="1";pista.textContent="👥 Duelo · 15 tiros · ¡dale!";};
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge((Number(p.puntos)||0)+" pts · "+(Number(p.aciertos)||0)+"/"+(Number(p.tiros)||0)));
      if(soyHost){Duelo.enviarRonda({tiros:TIROS_DUELO});arrancar();}else Duelo.onRondaRecibida(()=>arrancar());
    }});
  }
  function iniciarJuego(){
  const mejorEl=q('mtMejor');
const canvas=q('mtCanvas'),ctx=canvas.getContext('2d');
const levelNumEl=q('mtNivelNum'),scoreEl=q('mtPuntos'),comboEl=q('mtRacha'),hitsTextEl=q('mtAciertos'),progressBarEl=q('mtBarra'),levelTitleEl=q('mtNivelTitulo'),levelDescEl=q('mtNivelDesc'),resultEl=q('mtResultado'),levelUpEl=q('mtSubida'),levelUpTitleEl=q('mtSubidaTitulo'),levelUpDescEl=q('mtSubidaDesc'),hintEl=q('mtPista'),tapBtn=q('mtLanzar'),resetBtn=q('mtReiniciar'),stage=q('mtEscenario');
const TAU=Math.PI*2;
const BG=new Image(); BG.src='assets/extensiones/moon-tap/fondo.webp';

const LEVELS=[
{name:'Calentamiento',desc:'Arranque rápido desde el primer segundo.',hits:3,targetCount:1,fakeCount:0,speed:3.00,zoneHalfDeg:22,zoneMode:'fixed'},
{name:'Más rápido',desc:'Sube la velocidad enseguida.',hits:3,targetCount:1,fakeCount:0,speed:3.20,zoneHalfDeg:20,zoneMode:'fixed'},
{name:'Precisión',desc:'Más velocidad y zona más chica.',hits:4,targetCount:1,fakeCount:0,speed:3.35,zoneHalfDeg:14,zoneMode:'fixed'},
{name:'Zona saltarina',desc:'La zona cambia de lugar después de cada tiro.',hits:4,targetCount:1,fakeCount:0,speed:3.50,zoneHalfDeg:15,zoneMode:'jump'},
{name:'Órbita móvil',desc:'La zona de impacto también gira.',hits:4,targetCount:1,fakeCount:0,speed:3.60,zoneHalfDeg:15,zoneMode:'move',zoneSpeed:.75},
{name:'Doble objetivo',desc:'Hay 2 puntos válidos girando.',hits:5,targetCount:2,fakeCount:0,speed:3.70,zoneHalfDeg:13,zoneMode:'fixed'},
{name:'Memoria',desc:'El objetivo aparece y desaparece.',hits:5,targetCount:1,fakeCount:0,speed:3.80,zoneHalfDeg:14,zoneMode:'jump',blink:true,blinkPeriod:1.0},
{name:'Cambio de sentido',desc:'El giro invierte dirección durante la ronda.',hits:5,targetCount:1,fakeCount:1,speed:3.90,zoneHalfDeg:13,zoneMode:'fixed',reverse:true,reverseEvery:2.1},
{name:'Tres en órbita',desc:'3 objetivos válidos y zona móvil.',hits:5,targetCount:3,fakeCount:0,speed:4.00,zoneHalfDeg:11,zoneMode:'move',zoneSpeed:.95},
{name:'Caos controlado',desc:'Velocidad variable, zona móvil y objetivo intermitente.',hits:6,targetCount:1,fakeCount:2,speed:4.10,zoneHalfDeg:10,zoneMode:'move',zoneSpeed:1.0,blink:true,blinkPeriod:.9,reverse:true,reverseEvery:2.0,variableSpeed:true},
{name:'Doble móvil',desc:'2 objetivos, distractor y cambio de sentido.',hits:6,targetCount:2,fakeCount:1,speed:4.20,zoneHalfDeg:10,zoneMode:'moveReverse',zoneSpeed:1.08,reverse:true,reverseEvery:1.9,variableSpeed:true},
{name:'Fantasma',desc:'El objetivo se oculta más tiempo.',hits:6,targetCount:1,fakeCount:2,speed:4.30,zoneHalfDeg:10,zoneMode:'jump',blink:true,blinkPeriod:1.15,blinkVisible:.42,reverse:true,reverseEvery:1.8,variableSpeed:true},
{name:'Triple precisión',desc:'3 objetivos, zona diminuta y velocidad alta.',hits:7,targetCount:3,fakeCount:0,speed:4.45,zoneHalfDeg:8,zoneMode:'fixed',variableSpeed:true},
{name:'Zona fantasma',desc:'La zona desaparece por momentos.',hits:7,targetCount:2,fakeCount:1,speed:4.60,zoneHalfDeg:9,zoneMode:'move',zoneSpeed:1.20,zoneBlink:true,zoneBlinkPeriod:1.2,reverse:true,reverseEvery:1.7,variableSpeed:true},
{name:'Maestro orbital',desc:'Todo combinado y a máxima velocidad.',hits:8,targetCount:3,fakeCount:2,speed:4.80,zoneHalfDeg:8,zoneMode:'moveReverse',zoneSpeed:1.32,blink:true,blinkPeriod:.9,blinkVisible:.55,zoneBlink:true,zoneBlinkPeriod:1.05,reverse:true,reverseEvery:1.5,variableSpeed:true}
];

let W=941,H=1672,dpr=1,last=performance.now(),elapsed=0,levelIndex=0,score=0,combo=0,hitsThisLevel=0;
let targetAngles=[0],fakeAngles=[],direction=1,zoneDirection=1,zoneAngle=Math.PI/2,reverseTimer=0,zoneReverseTimer=0,shots=[],particles=[],flash=0,resultTimer=0,levelUpTimer=0,lockInput=false,swingFx=0;

function cfg(){return LEVELS[levelIndex]}
function resize(){const r=canvas.getBoundingClientRect(); dpr=Math.max(1,Math.min(2,devicePixelRatio||1)); W=r.width;H=r.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
ro=new ResizeObserver(resize);ro.observe(canvas);resize();

function geom(){return {ringX:W*.56,ringY:H*.285,ringR:W*.245,startX:W*.31,startY:H*.59}}
function norm(a){a%=TAU;return a<0?a+TAU:a} function diff(a,b){let d=Math.abs(norm(a)-norm(b));return Math.min(d,TAU-d)}
function speedNow(){const c=cfg();if(!c.variableSpeed)return c.speed;return c.speed*(.72+.34*(1+Math.sin(elapsed*2.35))/2)}
function targetVisible(){const c=cfg();if(!c.blink)return true;const p=c.blinkPeriod||1.1,v=c.blinkVisible??.62;return (elapsed%p)/p<v}
function zoneVisible(){const c=cfg();if(!c.zoneBlink)return true;const p=c.zoneBlinkPeriod||1.3;return (elapsed%p)/p<.58}
function randomZone(){const o=[Math.PI/2,Math.PI,0,Math.PI*1.5,Math.PI*.25,Math.PI*.75,Math.PI*1.25,Math.PI*1.75];let n=o[Math.floor(Math.random()*o.length)];if(diff(n,zoneAngle)<.35)n=o[(o.indexOf(n)+3)%o.length];return n}
function resetAngles(){const c=cfg();targetAngles=[];fakeAngles=[];for(let i=0;i<c.targetCount;i++)targetAngles.push(norm(i*TAU/c.targetCount+.15));for(let i=0;i<c.fakeCount;i++)fakeAngles.push(norm((i+.5)*TAU/Math.max(1,c.fakeCount)+1.05));direction=1;zoneDirection=1;reverseTimer=0;zoneReverseTimer=0;zoneAngle=c.zoneMode==='jump'?randomZone():Math.PI/2}
function hud(){const c=cfg();levelNumEl.textContent=levelIndex+1;scoreEl.textContent=score;if(score>mejor){mejor=score;guardarRecord();}if(levelIndex+1>nivelMax){nivelMax=levelIndex+1;guardarRecord();}mejorEl.textContent=mejor;comboEl.textContent=combo;hitsTextEl.textContent=`${hitsThisLevel}/${c.hits}`;progressBarEl.style.width=`${Math.min(100,hitsThisLevel/c.hits*100)}%`;levelTitleEl.textContent=`Nivel ${levelIndex+1} · ${c.name}`;levelDescEl.textContent=c.desc}
function result(t,col){resultEl.textContent=t;resultEl.style.color=col;resultEl.classList.add('show');clearTimeout(resultTimer);resultTimer=setTimeout(()=>resultEl.classList.remove('show'),650);sonido(col)}
function burst(x,y,col,n=18){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=55+Math.random()*130;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.5+Math.random()*.42,age:0,color:col})}}
function launch(){if(lockInput||shots.some(s=>!s.done))return;hintEl.style.opacity='0';swingFx=.18;const g=geom(),ex=g.ringX+Math.cos(zoneAngle)*g.ringR,ey=g.ringY+Math.sin(zoneAngle)*g.ringR;shots.push({t:0,duration:.34,sx:g.startX,sy:g.startY,ex,ey,targetZoneAngle:zoneAngle,done:false})}
function afterShot(){if(cfg().zoneMode==='jump')zoneAngle=randomZone()}
function resolve(s){const c=cfg(),z=s.targetZoneAngle;let best=Infinity;for(const a of targetAngles)best=Math.min(best,diff(a,z));const perfect=Math.max(4,c.zoneHalfDeg*.42)*Math.PI/180,good=c.zoneHalfDeg*Math.PI/180,g=geom(),ix=g.ringX+Math.cos(z)*g.ringR,iy=g.ringY+Math.sin(z)*g.ringR;if(best<=perfect){combo++;hitsThisLevel++;score+=125+combo*28+levelIndex*12;result('¡PERFECTO!','#ffd85b');burst(ix,iy,'#ffd85b',28);flash=.14;afterShot()}else if(best<=good){combo++;hitsThisLevel++;score+=65+combo*14+levelIndex*8;result('¡LE PEGASTE!','#69f2ad');burst(ix,iy,'#69f2ad',18);flash=.07;afterShot()}else{combo=0;hitsThisLevel=Math.max(0,hitsThisLevel-1);result('CERCA…','#ff6683');burst(ix,iy,'#ff6683',10);afterShot()}hud();alTiro(best<=good);if(hitsThisLevel>=c.hits)levelUp()}
function levelUp(){lockInput=true;hitsThisLevel=0;if(levelIndex<LEVELS.length-1){levelIndex++;resetAngles();hud();const c=cfg();levelUpTitleEl.textContent=`NIVEL ${levelIndex+1}`;levelUpDescEl.textContent=`${c.name}: ${c.desc}`;levelUpEl.classList.add('show');clearTimeout(levelUpTimer);levelUpTimer=setTimeout(()=>{levelUpEl.classList.remove('show');lockInput=false},1250)}else{score+=1000;combo+=3;result('¡MODO MAESTRO!','#ffd85b');lockInput=false;hud()}}
function reset(){levelIndex=0;score=0;combo=0;hitsThisLevel=0;elapsed=0;shots=[];particles=[];lockInput=false;swingFx=0;resetAngles();hud();hintEl.style.opacity='1';result('LISTO','#fff')}

function drawScene(){
 if(BG.complete)ctx.drawImage(BG,0,0,W,H); else{ctx.fillStyle='#080612';ctx.fillRect(0,0,W,H)}
 // Oscurece la pista fija de la ilustración para que manden los elementos jugables.
 const g=geom();
 ctx.save();
 ctx.strokeStyle='rgba(5,10,26,.76)';ctx.lineWidth=g.ringR*.23;ctx.beginPath();ctx.arc(g.ringX,g.ringY,g.ringR,0,TAU);ctx.stroke();
 ctx.strokeStyle='rgba(92,218,255,.32)';ctx.lineWidth=g.ringR*.15;ctx.beginPath();ctx.arc(g.ringX,g.ringY,g.ringR,0,TAU);ctx.stroke();
 ctx.strokeStyle='#69dfff';ctx.lineWidth=g.ringR*.055;ctx.beginPath();ctx.arc(g.ringX,g.ringY,g.ringR,0,TAU);ctx.stroke();
 ctx.restore();
 // Viñeta para mantener legibilidad
 const vg=ctx.createRadialGradient(W*.5,H*.46,W*.2,W*.5,H*.46,W*.8);vg.addColorStop(.55,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.28)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
}

function drawRing(){
 const g=geom(),c=cfg();
 if(zoneVisible()){const z=c.zoneHalfDeg*Math.PI/180;ctx.save();ctx.shadowColor='#ffd85b';ctx.shadowBlur=18;ctx.strokeStyle='#ffd85b';ctx.lineWidth=g.ringR*.13;ctx.beginPath();ctx.arc(g.ringX,g.ringY,g.ringR,zoneAngle-z,zoneAngle+z);ctx.stroke();ctx.restore();}
 if(targetVisible())targetAngles.forEach(a=>{const x=g.ringX+Math.cos(a)*g.ringR,y=g.ringY+Math.sin(a)*g.ringR;ctx.save();ctx.shadowColor='#ffd85b';ctx.shadowBlur=19;ctx.fillStyle='#ffd85b';ctx.beginPath();ctx.arc(x,y,Math.max(7,g.ringR*.085),0,TAU);ctx.fill();ctx.restore();ctx.fillStyle='#3d2b00';ctx.beginPath();ctx.arc(x,y,Math.max(2.2,g.ringR*.023),0,TAU);ctx.fill()});
 fakeAngles.forEach(a=>{const x=g.ringX+Math.cos(a)*g.ringR,y=g.ringY+Math.sin(a)*g.ringR;ctx.save();ctx.shadowColor='#64deff';ctx.shadowBlur=14;ctx.fillStyle='#64deff';ctx.beginPath();ctx.arc(x,y,Math.max(6,g.ringR*.075),0,TAU);ctx.fill();ctx.restore()});
 ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.88)';ctx.font=`800 ${Math.max(10,W*.029)}px system-ui`;let m='ÓRBITA FIJA';if(c.zoneMode==='jump')m='ÓRBITA SALTARINA';if(c.zoneMode==='move')m='ÓRBITA MÓVIL';if(c.zoneMode==='moveReverse')m='ÓRBITA MÓVIL + INVERSIÓN';ctx.fillText(m,g.ringX,g.ringY-g.ringR-20);
}

function drawSwingFx(){
 if(swingFx<=0)return;const p=1-swingFx/.18;const x=W*.205,y=H*.565;
 ctx.save();ctx.globalAlpha=Math.max(0,1-p);ctx.strokeStyle='#72e8ff';ctx.lineWidth=5;ctx.shadowColor='#72e8ff';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(x,y,W*.18,-1.85,-.2);ctx.stroke();
 ctx.strokeStyle='#ffe07c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+4,y-2,W*.2,-1.72,-.35);ctx.stroke();ctx.restore();
}



function drawBatCleanup(){
 // tapa visualmente el bate viejo integrado en la imagen de fondo
 const hx=W*.205, hy=H*.595;
 ctx.save();

 // parche grande siguiendo la diagonal del bate viejo
 ctx.translate(hx-W*.082, hy-H*.042);
 ctx.rotate(-2.67);

 let grad=ctx.createLinearGradient(-W*.11,0,W*.12,0);
 grad.addColorStop(0,'rgba(10,14,24,.99)');
 grad.addColorStop(.18,'rgba(28,37,57,.98)');
 grad.addColorStop(.55,'rgba(76,85,112,.96)');
 grad.addColorStop(.82,'rgba(39,49,73,.95)');
 grad.addColorStop(1,'rgba(12,16,27,.90)');
 ctx.fillStyle=grad;
 ctx.beginPath();
 ctx.roundRect(-W*.13,-W*.024,W*.245,W*.05,W*.02);
 ctx.fill();

 // segunda pieza un poco más ancha para cubrir el cabezal viejo
 let grad2=ctx.createLinearGradient(W*.02,0,W*.12,0);
 grad2.addColorStop(0,'rgba(86,97,126,.92)');
 grad2.addColorStop(.55,'rgba(46,58,85,.84)');
 grad2.addColorStop(1,'rgba(16,22,35,.70)');
 ctx.fillStyle=grad2;
 ctx.beginPath();
 ctx.ellipse(W*.08,0,W*.05,W*.028,0,0,Math.PI*2);
 ctx.fill();

 ctx.restore();

 // parche pequeño sobre la empuñadura cerca de la mano
 ctx.save();
 ctx.fillStyle='rgba(207,212,224,.95)';
 ctx.beginPath();
 ctx.ellipse(hx-W*.006,hy-W*.01,W*.02,W*.013,-.35,0,Math.PI*2);
 ctx.fill();
 ctx.restore();
}


function drawBat(){
 const active=swingFx>0;
 const p=active ? 1-swingFx/.18 : 0;
 const ease=1-Math.pow(1-p,3);
 const hx=W*.205, hy=H*.595 + (active ? Math.sin(p*Math.PI)*W*.006 : 0);
 const idleAngle=-2.55;
 const swingAngle=-1.05;
 const ang=idleAngle + (swingAngle-idleAngle)*ease;
 const len=W*.17;
 const barrelLen=W*.048;

 ctx.save();
 ctx.translate(hx,hy);
 ctx.rotate(ang);

 // glow on active swing
 if(active){
   ctx.save();
   ctx.globalAlpha=.18 + .25*(1-p);
   ctx.fillStyle='#72e8ff';
   ctx.shadowColor='#72e8ff';
   ctx.shadowBlur=18;
   ctx.beginPath();
   ctx.ellipse(len*.58,-1,len*.62,W*.032,0,0,Math.PI*2);
   ctx.fill();
   ctx.restore();
 }

 // handle
 ctx.strokeStyle='#0f1626';
 ctx.lineWidth=Math.max(5,W*.012);
 ctx.lineCap='round';
 ctx.beginPath();
 ctx.moveTo(0,0);
 ctx.lineTo(len*.22,0);
 ctx.stroke();

 // main shaft
 const shaft=ctx.createLinearGradient(0,0,len,0);
 shaft.addColorStop(0,'#6e7e98');
 shaft.addColorStop(.45,'#c8d2e8');
 shaft.addColorStop(1,'#7a8eaf');
 ctx.strokeStyle=shaft;
 ctx.lineWidth=Math.max(8,W*.017);
 ctx.beginPath();
 ctx.moveTo(len*.16,0);
 ctx.lineTo(len,0);
 ctx.stroke();

 // cyan energy line
 ctx.strokeStyle= active ? '#9df2ff' : '#63deff';
 ctx.lineWidth=Math.max(2.2,W*.0048);
 ctx.shadowColor='#63deff';
 ctx.shadowBlur=active ? 14 : 7;
 ctx.beginPath();
 ctx.moveTo(len*.24,0);
 ctx.lineTo(len*.95,0);
 ctx.stroke();

 // barrel head
 ctx.fillStyle='#d8fbff';
 ctx.beginPath();
 ctx.ellipse(len+barrelLen*.1,0,barrelLen,W*.022,0,0,Math.PI*2);
 ctx.fill();
 ctx.strokeStyle='#63deff';
 ctx.lineWidth=2;
 ctx.stroke();

 // back cap
 ctx.fillStyle='#1d263c';
 ctx.beginPath();
 ctx.arc(0,0,W*.0105,0,Math.PI*2);
 ctx.fill();

 // motion trail
 if(active){
   ctx.save();
   ctx.globalAlpha=.55*(1-p);
   ctx.strokeStyle='#ffe07c';
   ctx.lineWidth=2;
   ctx.shadowColor='#ffe07c';
   ctx.shadowBlur=10;
   ctx.beginPath();
   ctx.arc(0,0,len*.98,-2.15,-.2);
   ctx.stroke();
   ctx.restore();
 }

 ctx.restore();
}

function drawShots(dt){for(const s of shots){if(s.done)continue;s.t+=dt;const p=Math.min(1,s.t/s.duration),e=1-Math.pow(1-p,2),x=s.sx+(s.ex-s.sx)*e+Math.sin(p*Math.PI)*W*.035,y=s.sy+(s.ey-s.sy)*e-Math.sin(p*Math.PI)*H*.05;ctx.save();ctx.strokeStyle='rgba(255,216,91,.65)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.sx,s.sy);ctx.lineTo(x,y);ctx.stroke();ctx.shadowColor='#fff0a8';ctx.shadowBlur=18;ctx.fillStyle='#fff2bd';ctx.beginPath();ctx.arc(x,y,Math.max(7,W*.018),0,TAU);ctx.fill();ctx.restore();if(p>=1){s.done=true;resolve(s)}} if(shots.length>12)shots=shots.slice(-12)}
function drawParticles(dt){for(const p of particles){p.age+=dt;p.vy+=180*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=Math.max(0,1-p.age/p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,3.2,0,TAU);ctx.fill()}ctx.globalAlpha=1;particles=particles.filter(p=>p.age<p.life)}
function motion(dt){const c=cfg(),sp=speedNow();targetAngles=targetAngles.map(a=>norm(a+sp*direction*dt));fakeAngles=fakeAngles.map((a,i)=>norm(a+sp*(i%2?1.18:.78)*(i%2?direction:-direction)*dt));if(c.reverse){reverseTimer+=dt;if(reverseTimer>=(c.reverseEvery||2.5)){reverseTimer=0;direction*=-1}}if(c.zoneMode==='move'||c.zoneMode==='moveReverse')zoneAngle=norm(zoneAngle+(c.zoneSpeed||.6)*zoneDirection*dt);if(c.zoneMode==='moveReverse'){zoneReverseTimer+=dt;if(zoneReverseTimer>=1.75){zoneReverseTimer=0;zoneDirection*=-1}}}
function loop(now){const dt=Math.min(.035,(now-last)/1000||.016);last=now;elapsed+=dt;if(swingFx>0)swingFx=Math.max(0,swingFx-dt);motion(dt);drawScene();drawRing();drawBat();drawSwingFx();drawShots(dt);drawParticles(dt);if(flash>0){flash-=dt;ctx.fillStyle=`rgba(255,255,255,${Math.max(0,flash)*1.15})`;ctx.fillRect(0,0,W,H)}if(raiz)raf=requestAnimationFrame(loop)}
  tapBtn.addEventListener('click', ()=>launch());
  resetBtn.addEventListener('click', ()=>reset());
  stage.addEventListener('pointerdown', (e)=>{
    if(e.target.closest('button')) return;
    launch();
  });
  resetAngles();
  hud();
  lockInput = true;
  raf=requestAnimationFrame(loop);
  api={launch,reset:()=>{reset();},bloquear:v=>{lockInput=v;},puntos:()=>score};
  }
  function panel(titulo,detalle,acciones){
    const p=q("mtPanel");p.innerHTML='<div class="sf-panel"><h3></h3><p></p><div class="sf-acciones"></div></div>';
    p.querySelector("h3").textContent=titulo;p.querySelector("p").textContent=detalle;
    const cont=p.querySelector(".sf-acciones");
    acciones.forEach(([t,f],i)=>{const b=document.createElement("button");b.type="button";b.textContent=t;if(i===0)b.className="sf-principal";b.onclick=f;cont.appendChild(b);});
    p.hidden=false;
  }
  function jugar(){if(window.Fichas&&!Fichas.usar("moon-tap",jugar))return;q("mtPanel").hidden=true;api.reset();api.bloquear(false);}
  function abrir(contenedor){
    salir();cargar();
    raiz=document.createElement("div");raiz.className="mt-game";
    raiz.innerHTML='<button type="button" class="ext-volver" id="mtVolver">⟵ Extensiones</button>'
      +'<div class="mt-top"><div class="mt-nivel"><b id="mtNivelTitulo">Nivel 1</b><small id="mtNivelDesc"></small></div>'
      +'<div class="mt-pill">Nivel<strong id="mtNivelNum">1</strong></div><div class="mt-pill">Puntos<strong id="mtPuntos">0</strong></div><div class="mt-pill">Racha<strong id="mtRacha">0</strong></div><div class="mt-pill">Récord<strong id="mtMejor">0</strong></div></div>'
      +'<div class="mt-progreso"><span id="mtBarra"></span><em id="mtAciertos">0/4</em></div>'
      +'<section class="mt-escenario" id="mtEscenario"><canvas id="mtCanvas"></canvas><div class="mt-resultado" id="mtResultado" aria-live="polite"></div>'
      +'<div class="mt-subida" id="mtSubida"><div><small>NUEVO DESAFÍO</small><strong id="mtSubidaTitulo">NIVEL 2</strong><span id="mtSubidaDesc"></span></div></div>'
      +'<div class="mt-pista" id="mtPista">Tocá antes: la pelota tarda en llegar al aro</div></section>'
      +'<div class="mt-controles"><button id="mtLanzar" type="button">🚀 LANZAR</button><button id="mtReiniciar" type="button">Reiniciar</button></div>'
      +'<div class="sf-panel-capa" id="mtPanel" hidden></div>';
    contenedor.appendChild(raiz);
    q("mtVolver").onclick=()=>Extensiones.abrirLobby();
    iniciarJuego();
    panel("Moon Tap","Tocá la pantalla (o LANZAR) para batear. La pelota tiene que llegar a la zona dorada justo cuando pasa el punto amarillo. Los celestes son trampa y cada error te resta un acierto. 15 niveles. Récord: "+mejor+" puntos.",[["Jugar",jugar],["👥 Jugar con un amigo",iniciarDuelo]]);
  }
  function salir(){
    if(raf)cancelAnimationFrame(raf);raf=0;
    if(ro){try{ro.disconnect();}catch(e){}ro=null;}
    if(duelo&&typeof Duelo!=="undefined")Duelo.salir();duelo=false;
    api={launch(){},reset(){}};raiz=null;
  }
  function tecla(key,e){
    if(!raiz||(key!==" "&&key!=="Enter"))return;
    if(!q("mtPanel").hidden)return;
    if(e)e.preventDefault();api.launch();
  }
  return{abrir,salir,tecla,mejorPuntaje:()=>{cargar();return mejor;}};
})();
window.MoonTap=MoonTap;
