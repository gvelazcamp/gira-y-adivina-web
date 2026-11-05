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
    terminarArrastre();clearInterval(reloj);reloj=null;document.querySelectorAll(".pf-bienv,.lt-compartir-capa").forEach(x=>x.remove());
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
      pie='<div class="lt-cartel '+(r.todo?"":"lt-cartel-mal")+'" role="status"><b>'+(r.todo?"¡PERFECTA!":r.aciertos+" de "+n)+'</b><span>'+r.puntos+' pts · '+tiempo(r.s)+'</span></div>'+sig+'<button type="button" class="lt-compartir" data-acc="compartir">📲 Compartir mi línea</button>'+(e.duelo?"":'<button type="button" class="lt-temas-btn" data-acc="temas">Elegir tema</button>');
    }else if(e.pila.length){
      pie='<div class="lt-pila"><div class="lt-nueva" aria-label="Acontecimiento para ubicar: arrastralo a un ¿va acá?">'+cartaHtml(e.pila[0])+'</div><span class="lt-quedan">'+(e.pila.length>1?"+"+(e.pila.length-1):"última")+'</span></div><p class="lt-ayuda-txt">Arrastrá cada acontecimiento a su lugar</p>';
    }else pie='<button type="button" class="lt-siguiente lt-listo" data-acc="listo">¡Listo! Ver cómo me fue</button><p class="lt-ayuda-txt">Podés mover las cartas antes de confirmar</p>';
    raiz.innerHTML=cab+'<div class="lt-linea lt-linea-niveles">'+slots+'</div><div class="lt-pie">'+pie+'</div>';
    raiz.querySelector(".lt-ayuda").onclick=como;
    raiz.querySelectorAll(".lt-hueco").forEach(b=>b.onclick=()=>{if(e.pila.length)poner("pila",Number(b.dataset.i));});
    raiz.querySelectorAll(".lt-lleno").forEach(s=>{if(!r)s.querySelector(".lt-carta").addEventListener("pointerdown",ev=>empezarArrastre(ev,Number(s.dataset.i)));});
    const nueva=raiz.querySelector(".lt-nueva");if(nueva)nueva.addEventListener("pointerdown",ev=>empezarArrastre(ev,"pila"));
    raiz.querySelectorAll("[data-acc]").forEach(b=>b.onclick=()=>{const a=b.dataset.acc;
      if(a==="compartir")popupCompartir();else if(a==="listo")comprobar();else if(a==="sig")jugarNivel(e.nivel+1);else if(a==="otra")jugarNivel(e.nivel);else if(a==="temas")elegirTema();});
    if(r&&e.duelo&&!e.finEnviado){e.finEnviado=true;setTimeout(()=>{if(estado===e&&raiz)finDuelo();},1400);}
  }

  /* --- Compartir: foto 1080×1350 con el logo, la línea armada (verdes/rojas con año) y el puntaje. --- */
  const imagen=src=>new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src;});
  function recortar(g,t,max){if(g.measureText(t).width<=max)return t;while(t.length>1&&g.measureText(t+"…").width>max)t=t.slice(0,-1);return t+"…";}
  function redondo(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r);}
  async function armarFoto(e){
    try{await Promise.all(['800 40px "Archivo Black"','700 30px Outfit','600 24px Outfit'].map(f=>document.fonts?.load(f)));}catch(err){}
    const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
    const fondo=g.createLinearGradient(0,0,0,H);fondo.addColorStop(0,"#4a2a7a");fondo.addColorStop(.45,"#2A1A3C");fondo.addColorStop(1,"#160B24");g.fillStyle=fondo;g.fillRect(0,0,W,H);
    const logo=await imagen("assets/linea-tiempo/logo.webp");
    if(logo){const lw=560,lh=lw*logo.height/logo.width;g.drawImage(logo,(W-lw)/2,36,lw,lh);}
    const r=e.resultado,n=e.lugares.length;g.textAlign="center";g.textBaseline="middle";
    g.fillStyle="#37D6C0";g.font='800 40px "Archivo Black",sans-serif';
    g.fillText(r.todo?"¡LÍNEA PERFECTA!":r.aciertos+" DE "+n+" BIEN UBICADAS",W/2,350);
    g.fillStyle="#F6EFE2";g.font="600 30px Outfit,sans-serif";
    g.fillText((e.duelo?"Duelo":"Nivel "+e.nivel)+" · "+r.puntos+" puntos · ⏱ "+tiempo(r.s),W/2,402);
    const top=450,bottom=H-180,y0b=top+28,paso=Math.min(100,(bottom-y0b-40)/n),alto=paso,gap=Math.round(paso*.16),xL=150,x0=190,x1=W-90;
    g.fillStyle="#F5B301";g.font='800 22px "Archivo Black",sans-serif';g.textAlign="left";g.fillText("⬆ MÁS ANTIGUO",x0,top);
    const y0=top+28;g.fillStyle="#F5B301";g.fillRect(xL-4,y0-6,8,n*paso+6);
    e.lugares.forEach((h,i)=>{
      const y=y0+i*paso,ok=r.bien[i];
      g.fillStyle=ok?"#16816b":"#842541";redondo(g,x0,y,x1-x0,alto-gap,18);g.fill();
      g.fillStyle=ok?"#37D6C0":"#E5197C";g.beginPath();g.arc(xL,y+(alto-gap)/2,13,0,7);g.fill();
      const mid=y+(alto-gap)/2;g.textAlign="left";g.font=Math.round(alto*.42)+"px sans-serif";g.fillStyle="#fff";g.fillText(h.emoji,x0+20,mid+2);
      g.font="700 "+Math.round(Math.min(34,alto*.36))+"px Outfit,sans-serif";g.fillText(recortar(g,h.titulo,x1-x0-250),x0+20+alto*.62,mid+2);
      g.textAlign="right";g.font='800 '+Math.round(Math.min(40,alto*.42))+'px "Archivo Black",sans-serif';g.fillStyle="#FFE08A";g.fillText(String(h.anio),x1-22,mid+2);
    });
    g.textAlign="left";g.fillStyle="#F5B301";g.font='800 22px "Archivo Black",sans-serif';g.fillText("⬇ MÁS NUEVO",x0,y0+n*paso+20);
    g.textAlign="center";g.fillStyle="#F5B301";g.font='800 46px "Archivo Black",sans-serif';g.fillText("¿Me ganás?",W/2,H-110);
    g.fillStyle="#E4D8EB";g.font="600 28px Outfit,sans-serif";g.fillText("Girá y Adiviná · Línea del tiempo",W/2,H-58);
    return new Promise(ok=>c.toBlob(ok,"image/png"));
  }
  async function popupCompartir(){
    const e=estado;if(!e?.resultado)return;
    document.querySelector(".lt-compartir-capa")?.remove();
    const capa=document.createElement("div");capa.className="lt-compartir-capa";
    capa.innerHTML='<div class="lt-compartir-caja"><button type="button" class="lt-compartir-x" aria-label="Cerrar">✕</button><h3>Compartí tu línea</h3><div class="lt-compartir-foto"><span>Armando la foto…</span></div><button type="button" class="lt-compartir-ok" disabled>📲 Compartir</button></div>';
    (raiz.closest("#extContenido")||document.body).appendChild(capa);
    const cerrar=()=>capa.remove();capa.querySelector(".lt-compartir-x").onclick=cerrar;capa.addEventListener("click",ev=>{if(ev.target===capa)cerrar();});
    const foto=await armarFoto(e);if(!capa.isConnected)return;
    const ok=capa.querySelector(".lt-compartir-ok"),zona=capa.querySelector(".lt-compartir-foto");
    if(!foto){zona.textContent="No se pudo crear la foto.";return;}
    const url=URL.createObjectURL(foto);zona.innerHTML='<img alt="Mi línea del tiempo">';zona.querySelector("img").src=url;ok.disabled=false;
    const r=e.resultado,texto="🕰️ Línea del tiempo: "+(r.todo?"¡línea perfecta!":r.aciertos+" de "+e.lugares.length+" bien")+" · "+r.puntos+" pts en "+tiempo(r.s)+". ¿Me ganás? Jugá en Girá y Adiviná 👉 "+(location.origin||"https://girayadivina.com");
    ok.onclick=async()=>{
      const archivo=typeof File==="function"?new File([foto],"linea-del-tiempo.png",{type:"image/png"}):null;
      if(archivo&&typeof navigator.share==="function"){try{if(!navigator.canShare||navigator.canShare({files:[archivo]})){await navigator.share({files:[archivo],text:texto});return;}}catch(err){if(err?.name==="AbortError")return;}}
      const a=document.createElement("a");a.href=url;a.download="linea-del-tiempo.png";document.body.appendChild(a);a.click();a.remove();ok.textContent="Foto guardada · subila donde quieras";
    };
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
