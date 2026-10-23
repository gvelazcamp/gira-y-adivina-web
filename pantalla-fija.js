/* PantallaFija: modo "previa" compartido por los juegos de grupo
   (¿Qué número soy?, ¿Quién soy?, Bomba). También invitar(id,nombre):
   link de WhatsApp que abre el juego directo (?ext=<id>). Mientras está activo:
   pantalla completa, la pantalla no se apaga (Screen Wake Lock, se vuelve
   a pedir al volver a la app) y el "atrás" del celular no saca del juego.
   confirmar(el,cb): el botón ✕ Salir pregunta "¿Terminar la partida?" Sí/No. */
const PantallaFija=(()=>{
  let activo=false,siempre=false,wake=null,orientacion="";
  async function pedirWake(){try{if((activo||siempre)&&"wakeLock" in navigator&&!wake&&document.visibilityState==="visible"){wake=await navigator.wakeLock.request("screen");wake.addEventListener("release",()=>{wake=null;});}}catch(e){wake=null;}}
  function soltarWake(){try{if(wake)wake.release();}catch(e){}wake=null;}
  function alVolver(){if((activo||siempre)&&document.visibilityState==="visible")pedirWake();}
  function alAtras(){if(activo)try{history.pushState({fija:1},"");}catch(e){}}
  document.addEventListener("visibilitychange",alVolver);
  window.addEventListener("popstate",alAtras);
  /* Pantalla completa apenas se abre el juego (todavía con el toque del
     usuario): así el aviso de Chrome "Para salir de la pantalla completa…"
     sale en la pantalla de inicio y no tapa el número/palabra al jugar.
     Se queda en pantalla completa entre rondas; solo sale con salir(). */
  /* Si la app ya abre en pantalla completa (app de Play configurada en modo
     "fullscreen"), no se pide de nuevo: así Chrome no muestra su aviso. */
  const yaCompleta=()=>{try{return matchMedia("(display-mode: fullscreen)").matches;}catch(e){return false;}};
  function entrar(){
    if(yaCompleta())return Promise.resolve();
    try{const el=document.documentElement;
      if(!document.fullscreenElement&&el.requestFullscreen)return el.requestFullscreen({navigationUI:"hide"}).catch(()=>{});}catch(e){}
    return Promise.resolve();
  }
  function bloquearOrientacion(o){try{if(o&&screen.orientation&&screen.orientation.lock){orientacion=o;screen.orientation.lock(o).catch(()=>{});}}catch(e){}}
  function desbloquearOrientacion(){try{if(orientacion&&screen.orientation&&screen.orientation.unlock)screen.orientation.unlock();}catch(e){}orientacion="";}
  function activar(opts={}){
    const yaEstaba=activo;activo=true;document.body.classList.add("pf-activo");
    if(!yaEstaba)try{history.pushState({fija:1},"");}catch(e){}
    /* completa:false (Tutti Frutti): sin pantalla completa, así no sale el
       aviso de Chrome "Para salir de la pantalla completa…". */
    const p=opts.completa===false?Promise.resolve():entrar();
    if(opts.orientacion)(p&&p.then?p:Promise.resolve()).then(()=>{if(activo)bloquearOrientacion(opts.orientacion);});
    pedirWake();
  }
  /* Fin de la ronda: la pantalla ya se puede apagar y "atrás" vuelve a andar,
     pero sigue en pantalla completa para la próxima ronda. */
  function desactivar(){activo=false;document.body.classList.remove("pf-activo");if(!siempre)soltarWake();desbloquearOrientacion();}
  /* Solo "no apagar la pantalla" mientras el juego está abierto (Contra Reloj),
     sin bloquear el "atrás". Se corta con salir(). */
  function prender(){siempre=true;pedirWake();}
  function salir(){
    document.querySelectorAll(".pf-bienv").forEach(x=>x.remove());
    siempre=false;desactivar();soltarWake();
    try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});}catch(e){}
  }
  /* Popup de bienvenida al entrar a un juego de previa: logo grande + cómo
     se juega + "¡A jugar!". La pantalla completa se pide al cerrarlo, así el
     aviso de Chrome no tapa nada importante. o={logo,alt,items:[[emoji,html]]} */
  function bienvenida(contenedor,o){
    document.querySelectorAll(".pf-bienv").forEach(x=>x.remove());
    const c=document.createElement("div");c.className="pf-bienv";
    c.innerHTML='<div class="pf-bienv-caja"><button type="button" class="pf-bienv-x" aria-label="Cerrar">✕</button>'+
      '<img class="pf-bienv-logo" src="'+o.logo+'" alt="'+(o.alt||"")+'" draggable="false">'+
      '<ul>'+o.items.map(([e,t])=>'<li><span>'+e+'</span><em>'+t+'</em></li>').join("")+'</ul>'+
      '<button type="button" class="pf-bienv-ok">¡A jugar!</button></div>';
    const cerrar=()=>{c.remove();entrar();};
    c.querySelector(".pf-bienv-ok").onclick=cerrar;c.querySelector(".pf-bienv-x").onclick=cerrar;
    c.addEventListener("click",e=>{if(e.target===c)cerrar();});
    (contenedor||document.body).appendChild(c);
  }
  /* Botón ✕ Salir: pregunta "¿Terminar la partida?" con Sí / No. */
  function confirmar(el,cb,texto="¿Terminar la partida?"){
    el.addEventListener("click",e=>{
      e.preventDefault();e.stopPropagation();
      if(document.querySelector(".pf-confirmar"))return;
      const c=document.createElement("div");c.className="pf-confirmar";
      c.innerHTML='<div class="mg-panel pf-caja"><h3></h3><button type="button" class="mg-principal" data-r="si">Sí, terminar</button><button type="button" data-r="no">No, seguir jugando</button></div>';
      c.querySelector("h3").textContent=texto;
      ["pointerdown","touchstart"].forEach(t=>c.addEventListener(t,ev=>ev.stopPropagation()));
      c.addEventListener("click",ev=>{ev.stopPropagation();const r=ev.target.closest("button[data-r]");if(!r&&ev.target!==c)return;c.remove();if(r&&r.dataset.r==="si")cb();});
      document.body.appendChild(c);
    });
  }
  /* Invitación por WhatsApp a un juego de previa (link ?ext=<id>). */
  function invitar(id,nombre){
    let base="";try{base=location.origin+location.pathname;}catch(e){}
    const texto="¿Jugamos a "+nombre+" en Girá y Adiviná? Entrá acá: "+base+"?ext="+id;
    try{window.open("https://wa.me/?text="+encodeURIComponent(texto),"_blank");}catch(e){}
  }
  /* Editor de jugadores compartido (− N + y un campo de nombre por jugador).
     estado={cant,nombres}; alCambiar() se llama en cada cambio. */
  function editorJugadores(cont,estado,{min=2,max=12,alCambiar=()=>{}}={}){
    cont.innerHTML='<div class="imp-cant"><button type="button" data-d="-1">−</button><b></b><button type="button" data-d="1">+</button></div><div class="imp-nombres"></div>';
    const pintar=()=>{
      cont.querySelector("b").textContent=estado.cant;
      const lista=cont.querySelector(".imp-nombres");lista.innerHTML="";
      for(let i=0;i<estado.cant;i++){const inp=document.createElement("input");inp.type="text";inp.maxLength=14;inp.placeholder="Jugador "+(i+1);inp.value=estado.nombres[i]||"";inp.oninput=()=>{estado.nombres[i]=inp.value;alCambiar();};lista.appendChild(inp);}
    };
    cont.querySelector(".imp-cant").onclick=e=>{const b=e.target.closest("button[data-d]");if(!b)return;const n=estado.cant+Number(b.dataset.d);if(n<min||n>max)return;estado.cant=n;pintar();alCambiar();};
    pintar();
  }
  const nombreJugador=(estado,i)=>(estado.nombres[i]||"").trim()||"Jugador "+(i+1);
  return{entrar,activar,desactivar,prender,salir,confirmar,invitar,bienvenida,editorJugadores,nombreJugador,activo:()=>activo};
})();
window.PantallaFija=PantallaFija;
