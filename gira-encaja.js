/* Girá y encajá: laboratorio de clasificación. Prueba solo para Gonzalo.
   Estado y récord propios; no consume fichas ni modifica vidas/monedas del juego. */
window.GiraEncaja=(()=>{
  'use strict';
  const KEY='gya_gira_encaja_record_v1';
  const CATS=[
    {nombre:'Animales',icono:'🐾',color:'#75e9f4',items:[['🐱','Gato'],['🐶','Perro'],['🦁','León'],['🐸','Rana'],['🐢','Tortuga'],['🦋','Mariposa'],['🐬','Delfín'],['🐘','Elefante'],['🐧','Pingüino'],['🦊','Zorro'],['🐰','Conejo'],['🦉','Búho']]},
    {nombre:'Plantas',icono:'🌿',color:'#a4fa87',items:[['🌵','Cactus'],['🌻','Girasol'],['🌹','Rosa'],['🌴','Palmera'],['🌷','Tulipán'],['🌳','Roble'],['🍀','Trébol'],['🌲','Pino'],['🌱','Brote'],['🌾','Trigo'],['🍃','Hoja'],['🪻','Lavanda']]},
    {nombre:'Espacio',icono:'🪐',color:'#ffd27d',items:[['🪐','Saturno'],['🌍','Tierra'],['🌙','Luna'],['☀️','Sol'],['☄️','Cometa'],['⭐','Estrella'],['🌌','Galaxia'],['🔴','Marte'],['🔵','Neptuno'],['🛰️','Satélite'],['🚀','Cohete'],['👩‍🚀','Astronauta']]},
    {nombre:'Comidas',icono:'🍎',color:'#ef9bff',items:[['🍕','Pizza'],['🍔','Hamburguesa'],['🍩','Dona'],['🍞','Pan'],['🧀','Queso'],['🍦','Helado'],['🍪','Galleta'],['🍰','Torta'],['🍝','Pasta'],['🍣','Sushi'],['🥐','Medialuna'],['🍫','Chocolate']]}
  ];
  let root=null,canvas,ctx,overlay,signal,events,observer,raf=0,last=0,state=null,feedbackUntil=0,drag=null;
  let W=480,H=700,mode='imagenes';
  const record=()=>{try{return Math.max(0,Number(localStorage.getItem(KEY))||0);}catch(e){return 0;}};
  const allowed=()=>typeof window.esGonzalo==='function'&&window.esGonzalo();
  function abrir(contenedor){
    salir();if(!allowed())return;
    events=new AbortController();signal=events.signal;
    root=document.createElement('section');root.className='ge-game';root.setAttribute('aria-label','Girá y encajá');
    root.innerHTML='<header class="ge-hud"><div class="ge-status"><small>GIRÁ Y ENCAJÁ</small><span class="ge-level">Nivel 1 · 0/8</span></div><b class="ge-score">0</b><span class="ge-lives" aria-label="3 vidas">♥♥♥</span><button class="ge-pause" aria-label="Pausar" disabled>Ⅱ</button></header><canvas class="ge-canvas" tabindex="0" aria-label="Mové con las flechas, girá con espacio y acelerá con flecha abajo"></canvas><div class="ge-controls"><button data-action="left" aria-label="Mover a la izquierda">←</button><button class="ge-rotate" data-action="rotate">↻ Girar</button><button data-action="right" aria-label="Mover a la derecha">→</button></div><div class="ge-feedback" role="status" aria-live="polite"></div><div class="ge-overlay"></div>';
    contenedor.appendChild(root);canvas=root.querySelector('canvas');ctx=canvas.getContext('2d');overlay=root.querySelector('.ge-overlay');
    observer=new ResizeObserver(resize);observer.observe(canvas);resize();
    root.querySelector('.ge-pause').addEventListener('click',pause,{signal});
    root.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action),{signal}));
    canvas.addEventListener('pointerdown',pointerDown,{signal});canvas.addEventListener('pointermove',pointerMove,{signal});
    canvas.addEventListener('pointerup',pointerUp,{signal});canvas.addEventListener('pointercancel',()=>{drag=null;},{signal});
    root.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(e.target.tagName==='BUTTON')return;
      const a={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',' ':'rotate',ArrowDown:'drop',p:'pause',Escape:'pause'}[e.key];
      if(a){e.preventDefault();e.stopPropagation();if(a==='pause')pause();else action(a);}
    },{signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&state?.running&&!state.paused)pause();},{signal});
    intro();last=0;raf=requestAnimationFrame(loop);
  }
  function resize(){
    if(!canvas)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    W=480;H=Math.max(200,W*r.height/r.width);const d=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
  }
  function panel(html){overlay.innerHTML='<div class="ge-panel">'+html+'</div>';overlay.hidden=false;}
  function intro(){
    panel('<div class="ge-mark">✧</div><h2>Girá y encajá</h2><p>Elegí la categoría, girá la ficha y hacela entrar por el huequito correcto.</p><p><b>Arrastrá</b> para mover · <b>Tocá</b> para girar.<br>También podés usar los botones de abajo.</p><div class="ge-choice"><button data-mode="imagenes" aria-pressed="true">Imágenes</button><button data-mode="palabras" aria-pressed="false">Palabras</button></div><button class="ge-primary" data-start>¡A jugar!</button><p class="ge-note">Prueba de Gonzalo · Récord: '+record()+'<br>4 categorías · 5 niveles · 3 vidas</p>');
    overlay.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;overlay.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
    overlay.querySelector('[data-start]').onclick=start;
  }
  function start(){
    state={running:true,paused:false,score:0,lives:3,level:1,done:0,total:0,streak:0,piece:null,wait:0,bag:[]};
    slots();spawn();overlay.hidden=true;root.querySelector('.ge-pause').disabled=false;hud();canvas.focus({preventScroll:true});
    feedback('Buscá su categoría y girá para encajar',2400);
  }
  function slots(){state.slots=CATS.map((c,i)=>({cat:i,vertical:(i+state.level)%2===1}));}
  function spawn(){
    if(!state.bag.length){state.bag=CATS.flatMap((cat,c)=>cat.items.map((item,i)=>({cat:c,item:i})));for(let i=state.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[state.bag[i],state.bag[j]]=[state.bag[j],state.bag[i]];}}
    const next=state.bag.pop();state.piece={...next,x:W/2,y:Math.min(65,H*.14),vertical:Math.random()<.5};
    describePiece();
  }
  function describePiece(){const p=state.piece;canvas.setAttribute('aria-label','Ficha: '+CATS[p.cat].items[p.item][1]+'. '+(p.vertical?'Vertical':'Horizontal')+'. Flechas para mover, espacio para girar, abajo para soltar.');}
  function hud(){
    root.querySelector('.ge-score').textContent=state.score;
    root.querySelector('.ge-level').textContent='Nivel '+state.level+' · '+state.done+'/8';
    const life=root.querySelector('.ge-lives');life.textContent='♥'.repeat(state.lives)+'♡'.repeat(3-state.lives);life.setAttribute('aria-label',state.lives+' vidas');
  }
  function feedback(text,ms=1200){const el=root.querySelector('.ge-feedback');el.textContent=text;el.classList.add('ge-show');feedbackUntil=performance.now()+ms;}
  function action(a){
    if(!state?.running||state.paused||!state.piece)return;const p=state.piece;
    if(a==='rotate'){p.vertical=!p.vertical;describePiece();}
    if(a==='left'||a==='right'){const lane=Math.floor((p.x-20)/110);p.x=75+Math.max(0,Math.min(3,lane+(a==='left'?-1:1)))*110;}
    if(a==='drop')p.y=gateY()+14;
  }
  function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
  function pointerDown(e){
    if(!state?.running||state.paused||!state.piece||drag)return;
    const pt=point(e);drag={id:e.pointerId,x:pt.x,last:pt.x,time:performance.now(),pieceX:state.piece.x,moved:false};canvas.setPointerCapture(e.pointerId);
  }
  function pointerMove(e){
    if(!drag||drag.id!==e.pointerId||!state?.piece)return;const pt=point(e);
    if(Math.abs(pt.x-drag.x)>8)drag.moved=true;
    state.piece.x=Math.max(60,Math.min(W-60,drag.pieceX+pt.x-drag.x));drag.last=pt.x;
  }
  function pointerUp(e){if(!drag||drag.id!==e.pointerId)return;if(!drag.moved&&performance.now()-drag.time<450)action('rotate');drag=null;}
  function pause(){
    if(!state?.running)return;state.paused=!state.paused;drag=null;
    root.querySelector('.ge-pause').textContent=state.paused?'▶':'Ⅱ';root.querySelector('.ge-pause').setAttribute('aria-label',state.paused?'Continuar':'Pausar');
    if(state.paused){panel('<div class="ge-mark">Ⅱ</div><h2>En pausa</h2><p>Tu ficha te espera.</p><button class="ge-primary" data-resume>Continuar</button>');overlay.querySelector('[data-resume]').onclick=pause;}
    else{overlay.hidden=true;canvas.focus({preventScroll:true});}
  }
  function gateY(){return H-100;}
  function resolve(){
    const p=state.piece,index=Math.max(0,Math.min(3,Math.floor((p.x-20)/110))),slot=state.slots[index];
    const aligned=Math.abs(p.x-(75+index*110))<=(p.vertical?23:12);
    const correct=slot.cat===p.cat&&slot.vertical===p.vertical&&aligned;
    if(correct){state.streak++;state.score+=100+Math.min(5,state.streak-1)*20;feedback(state.streak>=3?'¡Racha de '+state.streak+'!':'¡Bien encajado!');}
    else{state.lives--;state.streak=0;feedback(slot.cat!==p.cat?'Era de '+CATS[p.cat].nombre:slot.vertical!==p.vertical?'¡Había que girarla!':'Centrala en el huequito',1800);}
    state.piece=null;drag=null;state.total++;state.done++;state.wait=.85;
    if(!state.lives){finish(false);return;}
    if(state.done===8){if(state.level===5){finish(true);return;}state.level++;state.done=0;slots();state.wait=1.7;feedback('Nivel '+state.level+' · ¡Cambian las aberturas!',1700);}
    else if(state.level>=3&&state.done===4){state.slots.forEach(s=>s.vertical=!s.vertical);feedback('¡Las aberturas giraron!',1600);state.wait=1.6;}
    hud();
  }
  function finish(won){
    state.running=false;root.querySelector('.ge-pause').disabled=true;hud();const previous=record();
    try{if(state.score>previous)localStorage.setItem(KEY,String(state.score));}catch(e){}
    panel('<div class="ge-mark">'+(won?'✦':'↻')+'</div><h2>'+(won?'¡Laboratorio completo!':'Probemos otra vez')+'</h2><p><b>'+state.score+' puntos</b> · Nivel '+state.level+'<br>'+state.total+' fichas jugadas</p><p>'+((state.score>previous)?'¡Nuevo récord!':('Récord: '+record()))+'</p><button class="ge-primary" data-retry>Volver a jugar</button><button data-back style="margin-top:10px">Elegir modo</button>');
    overlay.querySelector('[data-retry]').onclick=start;overlay.querySelector('[data-back]').onclick=intro;
  }
  function round(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function draw(){
    ctx.clearRect(0,0,W,H);const shades=ctx.createLinearGradient(0,0,0,H);shades.addColorStop(0,'#09214314');shades.addColorStop(1,'#061b4055');ctx.fillStyle=shades;ctx.fillRect(0,0,W,H);
    const g=gateY();round(12,g-33,W-24,128,16,'#242147df','#9a8cd080');
    const entries=state?.slots||CATS.map((c,i)=>({cat:i,vertical:i%2===0}));
    entries.forEach((slot,i)=>{
      const cat=CATS[slot.cat],x=75+i*110;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='25px system-ui';ctx.fillText(cat.icono,x,g-13);
      const w=slot.vertical?43:99,h=slot.vertical?67:36,y=g+10+(67-h)/2;
      ctx.shadowColor=cat.color;ctx.shadowBlur=10;round(x-w/2,y,w,h,8,'#020c23',cat.color);ctx.shadowBlur=0;
      ctx.fillStyle='#edf6ff';ctx.font='600 11px system-ui';ctx.fillText(cat.nombre,x,H-6);
    });
    if(!state?.piece)return;const p=state.piece,cat=CATS[p.cat],item=cat.items[p.item];
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.vertical?Math.PI/2:0);ctx.shadowColor='#bd91ff';ctx.shadowBlur=20;
    round(-44,-17,88,34,7,'#fff0d8','#e1b7ff');ctx.shadowBlur=0;ctx.restore();
    ctx.save();ctx.translate(p.x,p.y);ctx.textAlign='center';ctx.textBaseline='middle';
    if(mode==='imagenes'){ctx.font='29px system-ui';ctx.fillText(item[0],0,1);}
    else{if(p.vertical)ctx.rotate(Math.PI/2);ctx.fillStyle='#30234e';ctx.font='800 '+Math.min(14,74/(item[1].length*.6))+'px system-ui';ctx.fillText(item[1],0,1);}
    ctx.restore();
    if(state.level===1){ctx.textAlign='center';ctx.font='12px system-ui';ctx.fillStyle='#d7f4ff';ctx.fillText('Arrastrá para mover · Tocá para girar',W/2,Math.max(18,g-68));}
  }
  function loop(now){
    if(!root)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    if(state?.running&&!state.paused){
      if(state.piece){state.piece.y+=Math.max(25,(gateY()-60)/(8-(state.level-1)*1.05))*dt;if(state.piece.y>=gateY()+15)resolve();}
      else{state.wait-=dt;if(state.wait<=0)spawn();}
    }
    if(feedbackUntil&&now>=feedbackUntil){root.querySelector('.ge-feedback').classList.remove('ge-show');feedbackUntil=0;}
    draw();raf=requestAnimationFrame(loop);
  }
  function salir(){cancelAnimationFrame(raf);events?.abort();observer?.disconnect();root?.remove();root=null;state=null;canvas=null;drag=null;last=0;feedbackUntil=0;mode='imagenes';}
  return{abrir,salir,mejorPuntaje:record};
})();
