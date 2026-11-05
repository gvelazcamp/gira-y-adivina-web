/* Línea del tiempo (prueba Gonzalo y Vale). Cada nivel es una línea con todos los «¿va acá?» vacíos:
   se arrastra cada acontecimiento de la pila a su lugar (de más antiguo a más nuevo) y al final se comprueba.
   Puntos = 100 por acierto + bonus por rapidez. Duelo 1 vs 1: mismas cartas, gana el que más acierta y más rápido. */
(function(){
  const KEY="gya_linea_tiempo_record",KEY_NIVEL="gya_linea_tiempo_nivel",MAX_NIVEL=5,CARTAS_DUELO=7;
  let raiz=null,estado=null,tema="mezcla",arrastre=null,reloj=null;
  const D=()=>window.LINEA_TIEMPO_DATOS.temas;
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const mezclar=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const leerNum=k=>{try{return Number(localStorage.getItem(k))||0;}catch(e){return 0;}};
  const guardarNum=(k,v)=>{try{localStorage.setItem(k,String(v));}catch(e){}};
  function record(){return leerNum(KEY);}
  function nivelGuardado(){return Math.min(MAX_NIVEL,Math.max(1,leerNum(KEY_NIVEL)||1));}
  const cartasNivel=n=>4+n; // nivel 1: 5 cartas … nivel 5: 9
  function temaInfo(){return tema==="mezcla"?{nombre:"Mezcla",emoji:"🎲"}:D().find(t=>t.id===tema);}
  const aHecho=(h,emoji)=>({anio:h[0],titulo:h[1],detalle:h[2],emoji:h[3]||emoji});
  function todos(){return D().flatMap(t=>t.hechos.map(h=>aHecho(h,t.emoji)));}
  function hechos(){return tema==="mezcla"?todos():D().find(t=>t.id===tema).hechos.map(h=>aHecho(h));}
  /* Elige cartas con años distintos para que cada lugar tenga una sola respuesta. */
  function elegir(lista,n){const usados=new Set(),r=[];for(const h of mezclar(lista)){if(usados.has(h.anio))continue;usados.add(h.anio);r.push(h);if(r.length===n)break;}return r;}
  const tiempo=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");

  function como(){PantallaFija.bienvenida(raiz.closest("#extContenido")||document.body,{logo:"assets/linea-tiempo/logo.webp",alt:"Línea del tiempo",dibujo:"assets/linea-tiempo/como.webp",sinFija:true,items:[
    ["🃏","La línea está vacía: cada «¿va acá?» es un lugar, de <b>más antiguo</b> (arriba) a <b>más nuevo</b> (abajo)."],
    ["👆","<b>Arrastrá</b> cada acontecimiento de la pila a su lugar. Podés moverlos y cambiarlos."],
    ["✅","Cuando están todos, tocá <b>¡Listo!</b>: 100 puntos por acierto y bonus por rapidez."],
    ["👥","Jugá <b>contra un amigo</b>: mismas cartas, gana el que más acierta y más rápido."]]});}

  function abrir(contenedor){
    salir();
    raiz=document.createElement("section");raiz.className="lt";contenedor.appendChild(raiz);
    elegirTema();como();
  }
  function salir(){
    terminarArrastre();clearInterval(reloj);reloj=null;document.querySelectorAll(".pf-bienv").forEach(x=>x.remove());
    if(estado?.duelo&&typeof Duelo!=="undefined")Duelo.salir();
    if(raiz){raiz.remove();raiz=null;}estado=null;
  }

  function elegirTema(){
    clearInterval(reloj);reloj=null;estado=null;
    const opciones=[{id:"mezcla",nombre:"Mezcla",emoji:"🎲",n:D().reduce((a,t)=>a+t.hechos.length,0)}].concat(D().map(t=>({id:t.id,nombre:t.nombre,emoji:t.emoji,n:t.hechos.length})));
    raiz.innerHTML='<div class="lt-hud"><span>Nivel <b>'+nivelGuardado()+'</b></span><span>Récord <b>'+record()+'</b></span><button type="button" class="lt-ayuda" aria-label="Cómo se juega">❓</button></div>'+
      '<button type="button" class="lt-duelo-btn">👥 Jugar con un amigo</button>'+
      '<p class="lt-tema-titulo">Elegí un tema</p><div class="lt-temas">'+opciones.map(o=>'<button type="button" data-tema="'+o.id+'"><span>'+o.emoji+'</span><b>'+esc(o.nombre)+'</b><small>'+o.n+' hechos</small></button>').join("")+'</div>';
    raiz.querySelector(".lt-ayuda").onclick=como;
    raiz.querySelector(".lt-duelo-btn").onclick=iniciarDuelo;
    raiz.querySelectorAll("[data-tema]").forEach(b=>b.onclick=()=>{tema=b.dataset.tema;empezar();});
  }

  function empezar(){
    if(window.Fichas&&!Fichas.usar("linea-tiempo",empezar))return;
    jugarNivel(nivelGuardado());
  }
  function jugarNivel(n){arrancar(elegir(hechos(),cartasNivel(n)),{nivel:n});}
  function arrancar(cartas,{nivel=1,duelo=false}={}){
    raiz?.querySelector(".lt-final")?.remove();
    const orden=cartas.slice().sort((a,b)=>a.anio-b.anio);
    estado={nivel,duelo,cartas,orden,lugares:Array(cartas.length).fill(null),pila:mezclar(cartas),inicio:Date.now(),fin:0,resultado:null};
    clearInterval(reloj);reloj=setInterval(()=>{const t=raiz?.querySelector(".lt-reloj");if(t&&estado&&!estado.resultado)t.textContent=tiempo(segundos());},500);
    pintar();
  }
  const segundos=()=>Math.floor(((estado.fin||Date.now())-estado.inicio)/1000);

  /* --- Mover cartas: de la pila a un lugar, o de un lugar a otro (intercambian). --- */
  function poner(origen,destino){
    if(!estado||estado.resultado)return;
    const L=estado.lugares;
    if(origen==="pila"){const c=estado.pila.shift();if(!c)return;if(L[destino])estado.pila.unshift(L[destino]);L[destino]=c;}
    else if(origen!==destino){[L[origen],L[destino]]=[L[destino],L[origen]];}
    pintar();
  }
  function devolver(i){if(!estado||estado.resultado||!estado.lugares[i])return;estado.pila.unshift(estado.lugares[i]);estado.lugares[i]=null;pintar();}

  function comprobar(){
    if(!estado||estado.resultado||estado.pila.length)return;
    estado.fin=Date.now();clearInterval(reloj);reloj=null;
    const bien=estado.lugares.map((c,i)=>c.anio===estado.orden[i].anio);
    const aciertos=bien.filter(Boolean).length,s=segundos(),n=estado.lugares.length;
    const bonus=Math.max(0,Math.round((n*15-s)*2));
    const puntos=aciertos*100+(aciertos?bonus:0);
    estado.resultado={bien,aciertos,s,puntos,bonus,todo:aciertos===n};
    if(estado.duelo){try{Duelo.enviarProgreso({puntos,aciertos,s});}catch(e){}}
    else{if(puntos>record())guardarNum(KEY,puntos);if(estado.resultado.todo&&estado.nivel<MAX_NIVEL&&estado.nivel>=nivelGuardado())guardarNum(KEY_NIVEL,estado.nivel+1);}
    pintar();
  }

  function cartaHtml(h,{anio=false,clase=""}={}){return '<div class="lt-carta '+clase+'"><span class="lt-e">'+h.emoji+'</span><span class="lt-t">'+esc(h.titulo)+'<small>'+esc(h.detalle)+'</small></span>'+(anio?'<span class="lt-a">'+h.anio+'</span>':'')+'</div>';}
  function pintar(){
    const e=estado,r=e.resultado,t=e.duelo?{nombre:"Duelo",emoji:"👥"}:temaInfo(),n=e.lugares.length;
    const puestas=e.lugares.filter(Boolean).length;
    let slots='<div class="lt-borde">⬆ MÁS ANTIGUO</div>';
    e.lugares.forEach((c,i)=>{
      slots+=c?'<div class="lt-slot lt-lleno" data-i="'+i+'">'+cartaHtml(c,{anio:!!r,clase:r?(r.bien[i]?"lt-ok":"lt-mal"):"lt-movible"})+(r&&!r.bien[i]?'<small class="lt-correcto">Acá iba: '+esc(e.orden[i].titulo)+' ('+e.orden[i].anio+')</small>':'')+'</div>'
        :'<button type="button" class="lt-slot lt-hueco" data-i="'+i+'">¿va acá?</button>';
    });
    slots+='<div class="lt-borde">⬇ MÁS NUEVO</div>';
    const cab='<div class="lt-hud"><span>'+(e.duelo?"Duelo":"Nivel <b>"+e.nivel+"</b>")+'</span><span>⏱ <b class="lt-reloj">'+tiempo(segundos())+'</b></span><span>'+(r?"Bien <b>"+r.aciertos+"/"+n+"</b>":"Puestas <b>"+puestas+"/"+n+"</b>")+'</span><button type="button" class="lt-ayuda" aria-label="Cómo se juega">❓</button></div>'+
      '<div class="lt-tema">'+t.emoji+" "+esc(t.nombre).toUpperCase()+" · "+n+" ACONTECIMIENTOS</div>";
    let pie;
    if(r){
      const sig=e.duelo?"":r.todo&&e.nivel<MAX_NIVEL?'<button type="button" class="lt-siguiente" data-acc="sig">Nivel '+(e.nivel+1)+' ➜</button>':'<button type="button" class="lt-siguiente" data-acc="otra">'+(r.todo?"Jugar otra":"Probar de nuevo")+' ➜</button>';
      pie='<div class="lt-cartel '+(r.todo?"":"lt-cartel-mal")+'" role="status"><b>'+(r.todo?"¡PERFECTA!":r.aciertos+" de "+n)+'</b><span>'+r.puntos+' pts · '+tiempo(r.s)+'</span></div>'+sig+(e.duelo?"":'<button type="button" class="lt-temas-btn" data-acc="temas">Elegir tema</button>');
    }else if(e.pila.length){
      pie='<div class="lt-pila"><div class="lt-nueva" aria-label="Acontecimiento para ubicar: arrastralo a un ¿va acá?">'+cartaHtml(e.pila[0])+'</div><span class="lt-quedan">'+(e.pila.length>1?"+"+(e.pila.length-1):"última")+'</span></div><p class="lt-ayuda-txt">Arrastrá cada acontecimiento a su lugar</p>';
    }else pie='<button type="button" class="lt-siguiente lt-listo" data-acc="listo">¡Listo! Ver cómo me fue</button><p class="lt-ayuda-txt">Podés mover las cartas antes de confirmar</p>';
    raiz.innerHTML=cab+'<div class="lt-linea lt-linea-niveles">'+slots+'</div><div class="lt-pie">'+pie+'</div>';
    raiz.querySelector(".lt-ayuda").onclick=como;
    raiz.querySelectorAll(".lt-hueco").forEach(b=>b.onclick=()=>{if(e.pila.length)poner("pila",Number(b.dataset.i));});
    raiz.querySelectorAll(".lt-lleno").forEach(s=>{if(!r)s.querySelector(".lt-carta").addEventListener("pointerdown",ev=>empezarArrastre(ev,Number(s.dataset.i)));});
    const nueva=raiz.querySelector(".lt-nueva");if(nueva)nueva.addEventListener("pointerdown",ev=>empezarArrastre(ev,"pila"));
    raiz.querySelectorAll("[data-acc]").forEach(b=>b.onclick=()=>{const a=b.dataset.acc;
      if(a==="listo")comprobar();else if(a==="sig")jugarNivel(e.nivel+1);else if(a==="otra")jugarNivel(e.nivel);else if(a==="temas")elegirTema();});
    if(r&&e.duelo&&!e.finEnviado){e.finEnviado=true;setTimeout(()=>{if(estado===e&&raiz)finDuelo();},1400);}
  }

  /* --- Arrastre: un fantasma sigue el dedo y se ilumina el lugar más cercano. Tocar sin mover una carta puesta la devuelve a la pila. --- */
  function lugarCercano(x,y){
    let mejor=null,dist=Infinity;
    raiz.querySelectorAll(".lt-slot").forEach(s=>{const r=s.getBoundingClientRect();if(x<r.left-30||x>r.right+30)return;const d=Math.abs(r.top+r.height/2-y);if(d<dist&&d<r.height){dist=d;mejor=s;}});
    return mejor;
  }
  function marcar(a){const s=a.movio?lugarCercano(a.x,a.y):null;if(s!==a.lugar){a.lugar?.classList.remove("lt-hueco-on");a.lugar=s;s?.classList.add("lt-hueco-on");}}
  function empezarArrastre(ev,origen){
    if(!estado||estado.resultado||arrastre)return;
    const el=ev.currentTarget,r=el.getBoundingClientRect();
    const fantasma=el.cloneNode(true);fantasma.classList.add("lt-fantasma");
    fantasma.style.width=r.width+"px";fantasma.style.left=r.left+"px";fantasma.style.top=r.top+"px";
    document.body.appendChild(fantasma);el.classList.add("lt-levantada");
    arrastre={id:ev.pointerId,el,origen,fantasma,dx:ev.clientX-r.left,dy:ev.clientY-r.top,x:ev.clientX,y:ev.clientY,x0:ev.clientX,y0:ev.clientY,lugar:null,movio:false,timer:setInterval(autoScroll,30)};
    try{el.setPointerCapture(ev.pointerId);}catch(e){}
    el.addEventListener("pointermove",moverArrastre);el.addEventListener("pointerup",soltarArrastre);el.addEventListener("pointercancel",terminarArrastre);
  }
  function moverArrastre(ev){
    const a=arrastre;if(!a||ev.pointerId!==a.id)return;
    if(Math.abs(ev.clientX-a.x0)+Math.abs(ev.clientY-a.y0)>6)a.movio=true;
    a.x=ev.clientX;a.y=ev.clientY;a.fantasma.style.left=(ev.clientX-a.dx)+"px";a.fantasma.style.top=(ev.clientY-a.dy)+"px";marcar(a);
  }
  function autoScroll(){
    const a=arrastre;if(!a||!a.movio||!raiz)return;const m=raiz.querySelector(".lt-linea");if(!m)return;const r=m.getBoundingClientRect();
    if(a.y<r.top+36)m.scrollTop-=9;else if(a.y>r.bottom-36&&a.y<r.bottom+70)m.scrollTop+=9;marcar(a);
  }
  function soltarArrastre(ev){
    const a=arrastre;if(!a||ev.pointerId!==a.id)return;
    const destino=a.movio&&a.lugar?Number(a.lugar.dataset.i):null,origen=a.origen,toque=!a.movio;
    terminarArrastre();
    if(destino!==null)poner(origen,destino);else if(toque&&origen!=="pila")devolver(origen);
  }
  function terminarArrastre(){
    const a=arrastre;if(!a)return;arrastre=null;clearInterval(a.timer);
    a.fantasma.remove();a.el.classList.remove("lt-levantada");a.lugar?.classList.remove("lt-hueco-on");
    a.el.removeEventListener("pointermove",moverArrastre);a.el.removeEventListener("pointerup",soltarArrastre);a.el.removeEventListener("pointercancel",terminarArrastre);
  }

  /* --- Duelo 1 vs 1: el anfitrión elige las cartas y las manda; los dos arman la misma línea. --- */
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("Línea del tiempo","linea",{detalle:"Los dos arman <b>la misma línea</b>, cada uno en su celular. Gana el que <b>acierta más acontecimientos y más rápido</b>.",onListo:soyHost=>{
      if(!raiz)return;
      const lista=todos();
      const jugar=ids=>{if(!raiz)return;document.querySelectorAll(".pf-bienv").forEach(x=>x.remove());Duelo.mostrarBadge();Duelo.actualizarBadge("armando…");arrancar(ids.map(i=>lista[i]),{duelo:true});};
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge((Number(p?.aciertos)||0)+" bien · "+tiempo(Number(p?.s)||0)));
      if(soyHost){const ids=elegir(lista.map((h,i)=>({...h,i})),CARTAS_DUELO).map(h=>h.i);Duelo.enviarRonda({lt:2,ids});jugar(ids);}
      else Duelo.onRondaRecibida(d=>{if(d&&Array.isArray(d.ids)&&d.ids.length===CARTAS_DUELO&&d.ids.every(i=>Number.isInteger(i)&&i>=0&&i<lista.length))jugar(d.ids);});
    }});
  }
  function finDuelo(){
    const r=estado.resultado;Duelo.enviarFinal({valor:r.puntos});
    Duelo.mostrarResultado({valor:r.puntos},{etiqueta:"puntos: 100 por acierto + bonus por rapidez",onVolver:()=>{if(raiz)elegirTema();}});
  }
  window.LineaTiempo={abrir,salir,record,_estado:()=>estado};
})();
