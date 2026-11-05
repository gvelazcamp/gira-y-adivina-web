/* Línea del tiempo (prueba Gonzalo y Vale): ubicar cada hecho en su lugar de la línea.
   La carta se arrastra hasta un "¿va acá?" (o se toca el hueco). Duelo 1 vs 1 en sala: mismas cartas, gana más puntos. */
(function(){
  const KEY="gya_linea_tiempo_record",POR_RONDA=10,VIDAS=3;
  let raiz=null,estado=null,tema="mezcla",arrastre=null;
  const D=()=>window.LINEA_TIEMPO_DATOS.temas;
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const mezclar=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function record(){try{return Number(localStorage.getItem(KEY))||0;}catch(e){return 0;}}
  function guardarRecord(p){try{if(p>record())localStorage.setItem(KEY,String(p));}catch(e){}}
  function temaInfo(){return tema==="mezcla"?{nombre:"Mezcla",emoji:"🎲"}:D().find(t=>t.id===tema);}
  const aHecho=(h,emoji)=>({anio:h[0],titulo:h[1],detalle:h[2],emoji:h[3]||emoji});
  /* Lista fija de todos los hechos: el duelo manda solo los números de carta. */
  function todos(){return D().flatMap(t=>t.hechos.map(h=>aHecho(h,t.emoji)));}
  function hechos(){return tema==="mezcla"?todos():D().find(t=>t.id===tema).hechos.map(h=>aHecho(h));}

  function como(){PantallaFija.bienvenida(raiz.closest("#extContenido")||document.body,{logo:"assets/linea-tiempo/logo.webp",alt:"Línea del tiempo",dibujo:"assets/linea-tiempo/como.webp",sinFija:true,items:[
    ["🃏","Sale una <b>carta</b> con un hecho de Uruguay, Argentina o el mundo."],
    ["👆","<b>Arrastrala</b> hasta el «¿va acá?» donde creés que va (o tocá el hueco)."],
    ["✅","Si acertás, muestra el año y suma más con cada <b>racha</b> 🔥."],
    ["👥","Jugá <b>contra un amigo</b>: mismas cartas, gana el que hace más puntos."]]});}

  function abrir(contenedor){
    salir();
    raiz=document.createElement("section");raiz.className="lt";contenedor.appendChild(raiz);
    elegirTema();como();
  }
  function salir(){
    terminarArrastre();document.querySelectorAll(".pf-bienv").forEach(x=>x.remove());
    if(estado?.duelo&&typeof Duelo!=="undefined")Duelo.salir();
    if(raiz){raiz.remove();raiz=null;}estado=null;
  }

  function elegirTema(){
    estado=null;
    const opciones=[{id:"mezcla",nombre:"Mezcla",emoji:"🎲",n:D().reduce((a,t)=>a+t.hechos.length,0)}].concat(D().map(t=>({id:t.id,nombre:t.nombre,emoji:t.emoji,n:t.hechos.length})));
    raiz.innerHTML='<div class="lt-hud"><span>Récord <b>'+record()+'</b></span><button type="button" class="lt-ayuda" aria-label="Cómo se juega">❓</button></div>'+
      '<button type="button" class="lt-duelo-btn">👥 Jugar con un amigo</button>'+
      '<p class="lt-tema-titulo">Elegí un tema</p><div class="lt-temas">'+opciones.map(o=>'<button type="button" data-tema="'+o.id+'"><span>'+o.emoji+'</span><b>'+esc(o.nombre)+'</b><small>'+o.n+' hechos</small></button>').join("")+'</div>';
    raiz.querySelector(".lt-ayuda").onclick=como;
    raiz.querySelector(".lt-duelo-btn").onclick=iniciarDuelo;
    raiz.querySelectorAll("[data-tema]").forEach(b=>b.onclick=()=>{tema=b.dataset.tema;empezar();});
  }

  function empezar(){
    if(window.Fichas&&!Fichas.usar("linea-tiempo",empezar))return;
    const mazo=mezclar(hechos());arrancar(mazo.slice(0,POR_RONDA+1),false);
  }
  function arrancar(cartas,duelo){
    raiz?.querySelector(".lt-final")?.remove();
    estado={linea:[cartas[0]],mazo:cartas.slice(1),actual:null,puntos:0,racha:0,vidas:VIDAS,hechas:0,resultado:null,duelo,total:cartas.length-1};
    siguiente();
  }
  function siguiente(){
    if(!estado)return;
    if(!estado.mazo.length||estado.vidas<=0)return fin();
    estado.actual=estado.mazo.shift();estado.resultado=null;pintar();
  }
  function ubicar(pos){
    if(!estado||estado.resultado||!estado.actual)return;
    const L=estado.linea,c=estado.actual;
    const antes=pos>0?L[pos-1].anio:-Infinity,despues=pos<L.length?L[pos].anio:Infinity;
    const bien=c.anio>=antes&&c.anio<=despues;
    let lugar=pos;
    if(!bien){lugar=L.findIndex(x=>x.anio>c.anio);if(lugar<0)lugar=L.length;}
    L.splice(lugar,0,c);estado.hechas++;
    if(bien){estado.racha++;const p=10+10*estado.racha;estado.puntos+=p;estado.resultado={bien:true,lugar,texto:"+"+p+(estado.racha>1?" · racha x"+estado.racha:"")};}
    else{estado.racha=0;estado.vidas--;estado.resultado={bien:false,lugar,texto:"Era "+c.anio};}
    if(estado.duelo)try{Duelo.enviarProgreso({puntos:estado.puntos,hechas:estado.hechas});}catch(e){}
    pintar();
  }

  function hud(){const v="♥".repeat(estado.vidas)+"♡".repeat(VIDAS-estado.vidas);
    return '<div class="lt-hud"><span>Puntos <b>'+estado.puntos+'</b></span><span>Racha <b>'+estado.racha+'🔥</b></span><span class="lt-vidas" aria-label="'+estado.vidas+' vidas">'+v+'</span><button type="button" class="lt-ayuda" aria-label="Cómo se juega">❓</button></div>';}
  function carta(h,clase){return '<div class="lt-carta '+(clase||"")+'"><span class="lt-e">'+h.emoji+'</span><span class="lt-t">'+esc(h.titulo)+'<small>'+esc(h.detalle)+'</small></span><span class="lt-a">'+h.anio+'</span></div>';}
  function pintar(){
    const t=estado.duelo?{nombre:"Duelo",emoji:"👥"}:temaInfo(),r=estado.resultado,L=estado.linea;
    let linea="";
    L.forEach((h,i)=>{
      if(!r)linea+='<button type="button" class="lt-hueco" data-pos="'+i+'">¿va acá?</button>';
      linea+=carta(h,r&&r.lugar===i?(r.bien?"lt-ok":"lt-mal"):"");
    });
    if(!r)linea+='<button type="button" class="lt-hueco" data-pos="'+L.length+'">¿va acá?</button>';
    const num=Math.min(estado.hechas+(r?0:1),estado.total);
    raiz.innerHTML=hud()+'<div class="lt-tema">'+t.emoji+" "+esc(t.nombre).toUpperCase()+" · CARTA "+num+" DE "+estado.total+'</div>'+
      '<div class="lt-linea">'+linea+'</div>'+
      '<div class="lt-pie">'+(r?
        '<div class="lt-cartel '+(r.bien?"":"lt-cartel-mal")+'" role="status"><b>'+(r.bien?"¡BIEN!":"¡UY!")+'</b><span>'+r.texto+'</span></div><button type="button" class="lt-siguiente">'+(estado.mazo.length&&estado.vidas>0?"Siguiente carta ➜":"Ver resultado ➜")+'</button>':
        '<div class="lt-nueva" aria-label="Carta para ubicar: arrastrala hasta un ¿va acá?"><span class="lt-e">'+estado.actual.emoji+'</span><span><b>'+esc(estado.actual.titulo)+'</b><small>'+esc(estado.actual.detalle)+' · ¿En qué año fue?</small></span><span class="lt-q">?</span></div><p class="lt-ayuda-txt">Arrastrá la carta hasta su «¿va acá?»</p>')+'</div>';
    raiz.querySelector(".lt-ayuda").onclick=como;
    raiz.querySelectorAll(".lt-hueco").forEach(b=>b.onclick=()=>ubicar(Number(b.dataset.pos)));
    const sig=raiz.querySelector(".lt-siguiente");if(sig)sig.onclick=siguiente;
    const nueva=raiz.querySelector(".lt-nueva");if(nueva)nueva.addEventListener("pointerdown",empezarArrastre);
    const marco=raiz.querySelector(".lt-linea"),foco=raiz.querySelector(".lt-ok,.lt-mal");
    if(foco)marco.scrollTop=Math.max(0,foco.offsetTop-marco.clientHeight/2+foco.offsetHeight/2);
  }

  /* --- Arrastrar la carta: un fantasma sigue el dedo y se ilumina el hueco más cercano. --- */
  function huecoCercano(y){
    let mejor=null,dist=Infinity;
    raiz.querySelectorAll(".lt-hueco").forEach(h=>{const r=h.getBoundingClientRect(),m=r.top+r.height/2,d=Math.abs(m-y);if(d<dist){dist=d;mejor=h;}});
    return mejor;
  }
  function marcar(a){
    const m=raiz?.querySelector(".lt-linea");if(!m)return;const r=m.getBoundingClientRect();
    const h=a.movio&&a.y<r.bottom+40?huecoCercano(a.y):null;
    if(h!==a.hueco){a.hueco?.classList.remove("lt-hueco-on");a.hueco=h;h?.classList.add("lt-hueco-on");}
  }
  function empezarArrastre(e){
    if(!estado||estado.resultado||arrastre)return;
    const carta=e.currentTarget,r=carta.getBoundingClientRect();
    const fantasma=carta.cloneNode(true);fantasma.classList.add("lt-fantasma");
    fantasma.style.width=r.width+"px";fantasma.style.left=r.left+"px";fantasma.style.top=r.top+"px";
    document.body.appendChild(fantasma);carta.classList.add("lt-levantada");
    arrastre={id:e.pointerId,carta,fantasma,dx:e.clientX-r.left,dy:e.clientY-r.top,y:e.clientY,hueco:null,movio:false,x0:e.clientX,y0:e.clientY,timer:null};
    try{carta.setPointerCapture(e.pointerId);}catch(err){}
    carta.addEventListener("pointermove",moverArrastre);carta.addEventListener("pointerup",soltarArrastre);carta.addEventListener("pointercancel",terminarArrastre);
    arrastre.timer=setInterval(autoScroll,30);
  }
  function moverArrastre(e){
    const a=arrastre;if(!a||e.pointerId!==a.id)return;
    if(Math.abs(e.clientX-a.x0)+Math.abs(e.clientY-a.y0)>6)a.movio=true;
    a.y=e.clientY;a.fantasma.style.left=(e.clientX-a.dx)+"px";a.fantasma.style.top=(e.clientY-a.dy)+"px";
    marcar(a);
  }
  function autoScroll(){
    const a=arrastre;if(!a||!raiz||!a.movio)return;const m=raiz.querySelector(".lt-linea");if(!m)return;const r=m.getBoundingClientRect();
    if(a.y<r.top+40)m.scrollTop-=10;else if(a.y>r.bottom-40&&a.y<r.bottom+60)m.scrollTop+=10;
    marcar(a);
  }
  function soltarArrastre(e){
    const a=arrastre;if(!a||e.pointerId!==a.id)return;
    const pos=a.movio&&a.hueco?Number(a.hueco.dataset.pos):null;
    terminarArrastre();if(pos!==null)ubicar(pos);
  }
  function terminarArrastre(){
    const a=arrastre;if(!a)return;arrastre=null;clearInterval(a.timer);
    a.fantasma.remove();a.carta.classList.remove("lt-levantada");a.hueco?.classList.remove("lt-hueco-on");
    a.carta.removeEventListener("pointermove",moverArrastre);a.carta.removeEventListener("pointerup",soltarArrastre);a.carta.removeEventListener("pointercancel",terminarArrastre);
  }

  /* --- Duelo 1 vs 1: el anfitrión elige 11 cartas de la mezcla y las manda; los dos juegan las mismas. --- */
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("Línea del tiempo","linea",{detalle:"Los dos ubican <b>las mismas cartas</b>, cada uno en su celular. Gana el que hace <b>más puntos</b> poniendo bien la línea.",onListo:soyHost=>{
      if(!raiz)return;
      const lista=todos();
      const jugar=ids=>{if(!raiz)return;document.querySelectorAll(".pf-bienv").forEach(x=>x.remove());Duelo.mostrarBadge();Duelo.actualizarBadge("0 pts");arrancar(ids.map(i=>lista[i]),true);};
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge((Number(p?.puntos)||0)+" pts"));
      if(soyHost){const ids=mezclar(lista.map((_,i)=>i)).slice(0,POR_RONDA+1);Duelo.enviarRonda({lt:1,ids});jugar(ids);}
      else Duelo.onRondaRecibida(d=>{if(d&&Array.isArray(d.ids)&&d.ids.length===POR_RONDA+1&&d.ids.every(i=>Number.isInteger(i)&&i>=0&&i<lista.length))jugar(d.ids);});
    }});
  }

  function fin(){
    const p=estado.puntos,antes=record();
    if(estado.duelo){
      Duelo.enviarFinal({valor:p});
      setTimeout(()=>Duelo.mostrarResultado({valor:p},{etiqueta:"puntos por ubicar bien la línea",onVolver:()=>{if(raiz)elegirTema();}}),600);
      return;
    }
    guardarRecord(p);
    const completa=estado.vidas>0;
    const capa=document.createElement("div");capa.className="lt-final";
    capa.innerHTML='<div class="lt-final-caja"><span class="lt-final-icono">'+(completa?"🏆":"⏳")+'</span><h3>'+(completa?"¡Línea completa!":"Se terminaron las vidas")+'</h3><p><b>'+p+' puntos</b> · '+(estado.hechas-(VIDAS-estado.vidas))+' de '+estado.hechas+' bien ubicadas</p><p>'+(p>antes?"¡Nuevo récord! 🎉":"Récord: "+record())+'</p><button type="button" class="lt-otra">Jugar otra vez</button><button type="button" class="lt-temas-btn">Elegir tema</button></div>';
    raiz.appendChild(capa);
    capa.querySelector(".lt-otra").onclick=empezar;capa.querySelector(".lt-temas-btn").onclick=elegirTema;
  }
  window.LineaTiempo={abrir,salir,record};
})();
