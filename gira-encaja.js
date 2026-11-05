/* Girá y encajá: laboratorio de clasificación. Prueba para Gonzalo y Vale.
   Estado y récord propios; no consume fichas ni modifica vidas/monedas del juego. */
window.GiraEncaja=(()=>{
  'use strict';
  const KEY='gya_gira_encaja_record_v1';
  const PER_LEVEL=9;
  const RELEASE_SECONDS=1.2;
  const CATS=[
    {nombre:'Animales',icono:'🐾',color:'#75e9f4',items:[['🐱','Gato'],['🐶','Perro'],['🦁','León'],['🐸','Rana'],['🐢','Tortuga'],['🦋','Mariposa'],['🐬','Delfín'],['🐘','Elefante'],['🐧','Pingüino'],['🦊','Zorro'],['🐰','Conejo'],['🦉','Búho']]},
    {nombre:'Plantas',icono:'🌿',color:'#a4fa87',items:[['🌵','Cactus'],['🌻','Girasol'],['🌹','Rosa'],['🌴','Palmera'],['🌷','Tulipán'],['🌳','Roble'],['🍀','Trébol'],['🌲','Pino'],['🌱','Brote'],['🌾','Trigo'],['🍃','Hoja'],['🪻','Lavanda']]},
    {nombre:'Espacio',icono:'🪐',color:'#ffd27d',items:[['🪐','Saturno'],['🌍','Tierra'],['🌙','Luna'],['☀️','Sol'],['☄️','Cometa'],['⭐','Estrella'],['🌌','Galaxia'],['🔴','Marte'],['🔵','Neptuno'],['🛰️','Satélite'],['🚀','Cohete'],['👩‍🚀','Astronauta']]},
    {nombre:'Comidas',icono:'🍎',color:'#ef9bff',items:[['🍕','Pizza'],['🍔','Hamburguesa'],['🍩','Dona'],['🍞','Pan'],['🧀','Queso'],['🍦','Helado'],['🍪','Galleta'],['🍰','Torta'],['🍝','Pasta'],['🍣','Sushi'],['🥐','Medialuna'],['🍫','Chocolate']]}
  ];
  let root=null,canvas,ctx,overlay,signal,events,observer,raf=0,last=0,state=null,feedbackUntil=0,drag=null;
  let W=480,H=700,mode='imagenes';
  const record=()=>{try{return Math.max(0,Number(localStorage.getItem(KEY))||0);}catch(e){return 0;}};
  const allowed=()=>{const ext=window.EXTENSIONES?.find(e=>e.id==='gira-encaja');return !!ext&&typeof window.extensionVisible==='function'&&window.extensionVisible(ext);};
  function abrir(contenedor){
    salir();if(!allowed())return;
    events=new AbortController();signal=events.signal;
    root=document.createElement('section');root.className='ge-game';root.setAttribute('aria-label','Girá y encajá');
    root.innerHTML='<header class="ge-hud"><div class="ge-status"><small>GIRÁ Y ENCAJÁ</small><span class="ge-level">Nivel 1 · 0/'+PER_LEVEL+'</span></div><b class="ge-score">0</b><span class="ge-lives" aria-label="3 vidas">♥♥♥</span><button class="ge-pause" aria-label="Pausar" disabled>Ⅱ</button></header><canvas class="ge-canvas" tabindex="0" aria-label="Mové con las flechas, girá con espacio, C cambia de ficha y abajo suelta la seleccionada"></canvas><div class="ge-controls"><button data-action="left" aria-label="Mover a la izquierda">←</button><button class="ge-rotate" data-action="rotate">↻ Girar</button><button data-action="right" aria-label="Mover a la derecha">→</button><button data-action="next" aria-label="Seleccionar otra ficha" title="Cambiar de ficha">⇄</button></div><div class="ge-feedback" role="status" aria-live="polite"></div><div class="ge-overlay"></div>';
    contenedor.appendChild(root);canvas=root.querySelector('canvas');ctx=canvas.getContext('2d');overlay=root.querySelector('.ge-overlay');
    observer=new ResizeObserver(resize);observer.observe(canvas);resize();
    root.querySelector('.ge-pause').addEventListener('click',pause,{signal});
    root.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action),{signal}));
    canvas.addEventListener('pointerdown',pointerDown,{signal});canvas.addEventListener('pointermove',pointerMove,{signal});
    canvas.addEventListener('pointerup',pointerUp,{signal});canvas.addEventListener('pointercancel',()=>{drag=null;},{signal});
    root.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(e.target.tagName==='BUTTON')return;
      const a={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',' ':'rotate',ArrowDown:'drop',c:'next',C:'next',p:'pause',Escape:'pause'}[e.key];
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
    panel('<div class="ge-mark">✧</div><h2>Girá y encajá</h2><p>Las fichas salen de a una, con un pequeño espacio entre ellas. Llevá cada una a su categoría y girala para que entre.</p><p><b>Arrastrá una ficha</b> para moverla · <b>Tocala</b> para girarla.<br>El botón ⇄ cambia la ficha seleccionada.</p><div class="ge-choice"><button data-mode="imagenes" aria-pressed="true">Imágenes</button><button data-mode="palabras" aria-pressed="false">Palabras</button></div><button class="ge-primary" data-start>¡A jugar!</button><p class="ge-note">Versión de prueba · Récord: '+record()+'<br>4 categorías · 5 niveles · 3 vidas</p>');
    overlay.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;overlay.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
    overlay.querySelector('[data-start]').onclick=start;
  }
  function start(){
    state={running:true,paused:false,score:0,lives:3,level:1,done:0,total:0,streak:0,pieces:[],pending:[],releaseIn:0,selected:0,nextId:0,wait:0,bag:[]};
    slots();spawn();overlay.hidden=true;root.querySelector('.ge-pause').disabled=false;hud();canvas.focus({preventScroll:true});
    feedback('De a una, con tiempo para acomodarlas',1800);
  }
  function slots(){state.slots=CATS.map((c,i)=>({cat:i,vertical:(i+state.level)%2===1}));}
  function spawn(){
    if(!state.bag.length){state.bag=CATS.flatMap((cat,c)=>cat.items.map((item,i)=>({cat:c,item:i})));for(let i=state.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[state.bag[i],state.bag[j]]=[state.bag[j],state.bag[i]];}}
    const used=new Set();
    for(let i=0;i<3;i++){
      const different=state.bag.findLastIndex(p=>!used.has(p.cat));
      const next=state.bag.splice(different<0?state.bag.length-1:different,1)[0];used.add(next.cat);
      state.pending.push({...next,id:++state.nextId,x:W/2+(i-1)*100,vertical:Math.random()<.5});
    }
    releasePiece();
  }
  function spawnY(){return Math.min(52,H*.12);}
  function releasePiece(){
    const p=state.pending.shift();if(!p)return;
    p.y=spawnY();state.pieces.push(p);state.releaseIn=RELEASE_SECONDS;
    if(!selectedPiece())state.selected=p.id;
    describePiece();
  }
  function selectedPiece(){return state?.pieces.find(p=>p.id===state.selected);}
  function describePiece(){const p=selectedPiece();canvas.setAttribute('aria-label',p?'Ficha: '+CATS[p.cat].items[p.item][1]+'. '+(p.vertical?'Vertical':'Horizontal')+'. '+state.pieces.length+' en caída. Flechas para mover, espacio para girar, C para cambiar de ficha, abajo para soltar.':'Esperando la próxima ficha.');}
  function hud(){
    root.querySelector('.ge-score').textContent=state.score;
    root.querySelector('.ge-level').textContent='Nivel '+state.level+' · '+state.done+'/'+PER_LEVEL;
    const life=root.querySelector('.ge-lives');life.textContent='♥'.repeat(state.lives)+'♡'.repeat(3-state.lives);life.setAttribute('aria-label',state.lives+' vidas');
  }
  function feedback(text,ms=1200){const el=root.querySelector('.ge-feedback');el.textContent=text;el.classList.add('ge-show');feedbackUntil=performance.now()+ms;}
  function action(a){
    if(!state?.running||state.paused)return;const p=selectedPiece();if(!p)return;
    if(a==='next'){const index=state.pieces.indexOf(p);state.selected=state.pieces[(index+1)%state.pieces.length].id;describePiece();return;}
    if(a==='rotate'){p.vertical=!p.vertical;describePiece();}
    if(a==='left'||a==='right'){const lane=Math.floor((p.x-20)/110);p.x=75+Math.max(0,Math.min(3,lane+(a==='left'?-1:1)))*110;}
    if(a==='drop')p.y=gateY()+15;
  }
  function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
  function pointerDown(e){
    if(!state?.running||state.paused||drag)return;
    const pt=point(e),p=state.pieces.filter(p=>Math.abs(p.x-pt.x)<(p.vertical?17:44)+14&&Math.abs(p.y-pt.y)<(p.vertical?44:17)+14).sort((a,b)=>Math.hypot(a.x-pt.x,a.y-pt.y)-Math.hypot(b.x-pt.x,b.y-pt.y))[0];
    if(!p)return;state.selected=p.id;describePiece();
    drag={id:e.pointerId,pieceId:p.id,x:pt.x,time:performance.now(),pieceX:p.x,moved:false};canvas.setPointerCapture(e.pointerId);
  }
  function pointerMove(e){
    if(!drag||drag.id!==e.pointerId)return;const p=state?.pieces.find(p=>p.id===drag.pieceId);if(!p)return;const pt=point(e);
    if(Math.abs(pt.x-drag.x)>8)drag.moved=true;
    p.x=Math.max(60,Math.min(W-60,drag.pieceX+pt.x-drag.x));
  }
  function pointerUp(e){if(!drag||drag.id!==e.pointerId)return;if(!drag.moved&&performance.now()-drag.time<450)action('rotate');drag=null;}
  function pause(){
    if(!state?.running)return;state.paused=!state.paused;drag=null;
    root.querySelector('.ge-pause').textContent=state.paused?'▶':'Ⅱ';root.querySelector('.ge-pause').setAttribute('aria-label',state.paused?'Continuar':'Pausar');
    if(state.paused){panel('<div class="ge-mark">Ⅱ</div><h2>En pausa</h2><p>Tus fichas te esperan.</p><button class="ge-primary" data-resume>Continuar</button>');overlay.querySelector('[data-resume]').onclick=pause;}
    else{overlay.hidden=true;canvas.focus({preventScroll:true});}
  }
  function gateY(){return H-100;}
  function resolve(p){
    if(!state.running||!state.pieces.includes(p))return;
    const index=Math.max(0,Math.min(3,Math.floor((p.x-20)/110))),slot=state.slots[index];
    const aligned=Math.abs(p.x-(75+index*110))<=(p.vertical?23:12);
    const correct=slot.cat===p.cat&&slot.vertical===p.vertical&&aligned;
    if(correct){state.streak++;state.score+=100+Math.min(5,state.streak-1)*20;feedback(state.streak>=3?'¡Racha de '+state.streak+'!':'¡Bien encajado!');}
    else{state.lives--;state.streak=0;feedback(slot.cat!==p.cat?'Era de '+CATS[p.cat].nombre:slot.vertical!==p.vertical?'¡Había que girarla!':'Centrala en el huequito',1800);}
    state.pieces=state.pieces.filter(other=>other!==p);if(drag?.pieceId===p.id)drag=null;
    if(state.selected===p.id)state.selected=state.pieces[0]?.id||0;
    state.total++;state.done++;describePiece();
    if(!state.lives){finish(false);return;}
    if(!state.pieces.length&&!state.pending.length){
      state.wait=.55;
      if(state.done===PER_LEVEL){if(state.level===5){finish(true);return;}state.level++;state.done=0;slots();state.wait=1.2;feedback('Nivel '+state.level+' · ¡Cambian las aberturas!',1200);}
      else if(state.level>=3&&state.done===6){state.slots.forEach(s=>s.vertical=!s.vertical);feedback('¡Las aberturas giraron!',1200);state.wait=1.2;}
    }
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
    if(!state?.pieces.length)return;
    const pieces=[...state.pieces].sort((a,b)=>(a.id===state.selected)-(b.id===state.selected));
    pieces.forEach(p=>drawPiece(p));
    if(state.level===1){ctx.textAlign='center';ctx.font='12px system-ui';ctx.fillStyle='#d7f4ff';ctx.fillText('Tocá una ficha para girarla · Arrastrala para moverla',W/2,Math.max(18,g-68));}
  }
  function drawPiece(p){
    const cat=CATS[p.cat],item=cat.items[p.item],selected=p.id===state.selected;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.vertical?Math.PI/2:0);ctx.shadowColor='#bd91ff';ctx.shadowBlur=20;
    round(-44,-17,88,34,7,'#fff0d8',selected?'#ffe094':'#e1b7ff');ctx.shadowBlur=0;
    if(selected){ctx.strokeStyle='#ffe094';ctx.lineWidth=2;ctx.strokeRect(-48,-21,96,42);}ctx.restore();
    ctx.save();ctx.translate(p.x,p.y);ctx.textAlign='center';ctx.textBaseline='middle';
    if(mode==='imagenes'){ctx.font='29px system-ui';ctx.fillText(item[0],0,1);}
    else{if(p.vertical)ctx.rotate(Math.PI/2);ctx.fillStyle='#30234e';ctx.font='800 '+Math.min(14,74/(item[1].length*.6))+'px system-ui';ctx.fillText(item[1],0,1);}
    ctx.restore();
  }
  function loop(now){
    if(!root)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    if(state?.running&&!state.paused){
      if(state.pending.length){state.releaseIn-=dt;if(state.releaseIn<=0)releasePiece();}
      if(state.pieces.length){const speed=(gateY()+15-spawnY())/(9-(state.level-1)*.9);for(const p of [...state.pieces]){if(!state.running)break;p.y+=speed*dt;if(p.y>=gateY()+15)resolve(p);}}
      else if(!state.pending.length){state.wait-=dt;if(state.wait<=0)spawn();}
    }
    if(feedbackUntil&&now>=feedbackUntil){root.querySelector('.ge-feedback').classList.remove('ge-show');feedbackUntil=0;}
    draw();raf=requestAnimationFrame(loop);
  }
  function salir(){cancelAnimationFrame(raf);events?.abort();observer?.disconnect();root?.remove();root=null;state=null;canvas=null;drag=null;last=0;feedbackUntil=0;mode='imagenes';}
  return{abrir,salir,mejorPuntaje:record};
})();
