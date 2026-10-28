/* Lectura en voz alta de las pistas/preguntas, compartida entre los
   juegos de palabras. Usa la voz nativa del celular (Web Speech API):
   no hay backend ni archivos de audio que mantener.

   Elegir "la voz masculina" no es 100% controlable: la Web Speech API no
   expone el género como dato, así que hay dos intentos (por nombre
   explícito tipo "Jorge"/"Diego", típico de voces de escritorio; y por el
   sufijo -B/-D de las voces de red de Google —Standard/Wavenet/Neural2—
   que en Android suele ser el motor detrás de Chrome, donde -A/-C son
   femeninas y -B/-D masculinas) y, además, se baja bastante el tono para
   que suene más grave de entrada, pase lo que pase con la voz que el
   celular tenga disponible. Si ningún celular del grupo tiene una voz
   realmente masculina instalada, no hay forma de forzarla desde acá. */
function obtenerVozMasculina(){
  if(!("speechSynthesis" in window))return null;
  const voces=speechSynthesis.getVoices();if(!voces.length)return null;
  const es=voces.filter(v=>/^es/i.test(v.lang));
  const pool=es.length?es:voces;
  const porNombre=pool.find(v=>/\b(male|hombre|var[oó]n|jorge|diego|carlos|pablo|juan|miguel|enrique|pedro|andr[eé]s|[aá]lvaro|ra[uú]l)\b/i.test(v.name));
  if(porNombre)return porNombre;
  const esSufijoMasculino=v=>/-(?:Standard|Wavenet|Neural2)-[BD]$/i.test(v.name)||/-(?:Standard|Wavenet|Neural2)-[BD]$/i.test(v.voiceURI||"");
  return pool.find(esSufijoMasculino)||null;
}
/* Si no se dejó elegir una voz masculina real, igual bajamos el tono para
   que no quede una voz aguda — no cambia el género percibido del todo,
   pero suena más grave que la voz por defecto del celular. */
let hablarToken=0;
/* audioExtra (opcional): la música propia del juego que llama a hablar(),
   además de la música de la rueda principal. Cada extensión con su propia
   pista de fondo (Sopa Fugaz, Rueda de Letras, etc.) la pasa acá para que
   también se pause mientras lee y se reanude cuando termina. */
function hablar(texto,audioExtra){
  try{
    if(!("speechSynthesis" in window)||!texto)return;
    const t=++hablarToken;
    /* cancel() dispara el onend/onerror de la lectura anterior (si había
       una en curso) de forma asincrónica, un instante después de este
       punto. Si esa lectura vieja reanudara la música sin más, taparía
       la nueva que estamos por empezar. Por eso cada lectura guarda su
       propio número de turno y solo reanuda la música si sigue siendo
       la más reciente cuando termina. */
    speechSynthesis.cancel();
    if(typeof detenerMusica==="function")detenerMusica();
    if(audioExtra&&!audioExtra.paused)audioExtra.pause();
    const u=new SpeechSynthesisUtterance(texto);
    u.lang="es-UY";u.rate=.97;
    const voz=obtenerVozMasculina();
    u.pitch=voz?.75:.6;
    if(voz)u.voice=voz;
    const reanudarMusica=()=>{
      if(t!==hablarToken)return;
      if(typeof sincronizarMusica==="function")sincronizarMusica();
      if(audioExtra&&typeof sonidoPermitido==="function"&&sonidoPermitido())audioExtra.play().catch(()=>{});
    };
    u.onend=reanudarMusica;u.onerror=reanudarMusica;
    speechSynthesis.speak(u);
  }catch(e){}
}
window.hablar=hablar;

/* Duelo de Conocimiento se abre aislado en su HTML; esto evita tocar
   el estado de la ruleta y permite solicitar permiso de micrófono. */
const DueloConocimiento={
  iframe:null,
  abrir(contenedor){
    this.salir();
    const frame=document.createElement("iframe");
    frame.src="duelo-conocimiento.html";
    frame.title="Duelo de Conocimiento";
    frame.allow="microphone; autoplay";
    frame.setAttribute("allowfullscreen","");
    frame.style.cssText="display:block;width:100%;height:calc(100dvh - 82px);min-height:680px;border:0;background:#10081e;border-radius:16px";
    contenedor.appendChild(frame);
    this.iframe=frame;
  },
  salir(){if(this.iframe){this.iframe.remove();this.iframe=null;}}
};
window.DueloConocimiento=DueloConocimiento;

/* Catálogo de minijuegos. Cada entrada habilitada aporta su función abrir. */
const EXTENSIONES=[
  {id:"tutti-frutti",nombre:"Tutti Frutti",descripcion:"Cada uno con su celular: letra al azar y ¡BASTA!",icono:"logo-tutti-frutti.svg",estado:"disponible",abrir:contenedor=>TuttiFrutti.abrir(contenedor),record:()=>TuttiFrutti.partidasJugadas()+" partidas"},
  {id:"puzzle",nombre:"Puzzle",descripcion:"Armá rompecabezas de dibujos y ciudades",icono:"assets/puzzle-arte/icono.webp",estado:"disponible",abrir:contenedor=>Puzzle.abrir(contenedor),record:()=>Puzzle.armados()+" armados"},
  {id:"palabra-secreta",nombre:"Palabra Secreta",descripcion:"Adiviná palabras y subí de nivel: cada vez tenés menos intentos",icono:"logo-palabra-secreta.svg",estado:PALABRA_HABILITADA?"disponible":"proximamente",abrir:contenedor=>PalabraSecreta.abrir(contenedor),record:()=>"Nivel "+PalabraSecreta.nivelActual()},
  {id:"frases-en-giro",nombre:"Frases en Giro",descripcion:"Ordená frases entre giros y señuelos",icono:"logo-frases-en-giro.svg",estado:"disponible",abrir:contenedor=>FrasesEnGiro.abrir(contenedor),record:()=>FrasesEnGiro.mejorPuntaje()+" puntos"},
  {id:"memoria-en-giro",nombre:"Memoria en Giro",descripcion:"Encontrá los pares antes de que giren",icono:"logo-memoria-en-giro.svg",estado:"disponible",abrir:contenedor=>MemoriaEnGiro.abrir(contenedor),record:()=>MemoriaEnGiro.mejorPuntaje()+" puntos"},
  {id:"rosco-rioplatense",nombre:"El Rosco",descripcion:"Girá, leé la pista y descubrí la palabra",icono:"logo-rosco-rioplatense.svg",estado:ROSCO_HABILITADO?"disponible":"proximamente",abrir:contenedor=>RoscoRioplatense.abrir(contenedor),record:()=>RoscoRioplatense.mejorPuntaje()+" puntos"},
  {id:"silabario-rioplatense",nombre:"Silabario Rioplatense",descripcion:"Armá la respuesta con las sílabas del tablero que gira",icono:"logo-silabario-rioplatense.svg",estado:"disponible",abrir:contenedor=>SilabarioRioplatense.abrir(contenedor),record:()=>SilabarioRioplatense.mejorPuntaje()+" puntos"},
  {id:"cien-rioplatenses",nombre:"100 Rioplatenses Dicen",descripcion:"Girá por un tema y descubrí el panel",icono:"logo-cien-rioplatenses.svg",estado:CIEN_HABILITADO?"disponible":"proximamente",abrir:contenedor=>CienRioplatenses.abrir(contenedor),record:()=>CienRioplatenses.mejorPuntaje()+" puntos"},
  {id:"ahorcado-rioplatense",nombre:"Ahorcado Rioplatense",descripcion:"La ruleta elige la categoría, adiviná la palabra",icono:"logo-ahorcado-rioplatense.svg",estado:AHORCADO_HABILITADO?"disponible":"proximamente",abrir:contenedor=>AhorcadoRioplatense.abrir(contenedor),record:()=>AhorcadoRioplatense.mejorPuntaje()+" puntos"},
  {id:"contra-reloj-rioplatense",grupo:"previa",soloGonzalo:true,/* oculto para todos menos Gonzalo hasta que esté listo (17/10/2026) */nombre:"Contra Reloj",descripcion:"Describí 5 palabras antes de que termine el tiempo · 4+ jugadores",icono:"logo-contra-reloj-rioplatense.svg",estado:"disponible",insignia:"👥 4+",abrir:contenedor=>ContraRelojRioplatense.abrir(contenedor),record:()=>ContraRelojRioplatense.mejorPuntaje()+" puntos"},
  {id:"tele",grupo:"previa",soloUsuarios:["andres","romina","gonzalo","vale"],nombre:"Juegos en la tele",descripcion:"La tele muestra el juego y respondés desde el celular",icono:"assets/social/tv-familia-icono.webp",estado:"disponible",insignia:"📺 Prueba",abrir:contenedor=>Tele.abrir(contenedor),record:()=>"Rosco · Ahorcado · Puzzle"},
  {id:"impostor",grupo:"previa",nombre:"Impostor",descripcion:"Todos tienen la misma palabra… menos uno",icono:"logo-impostor.svg",estado:"disponible",insignia:"👥 3+",abrir:contenedor=>Impostor.abrir(contenedor),record:()=>Impostor.partidasJugadas()+" rondas"},
  {id:"mimica",grupo:"previa",nombre:"Mímica rioplatense",descripcion:"Actuá sin hablar, tu equipo adivina",icono:"assets/mimica/icono.webp",estado:"disponible",insignia:"👥 4+",abrir:contenedor=>Mimica.abrir(contenedor),record:()=>Mimica.partidasJugadas()+" partidas"},
  {id:"canta-la-cancion",grupo:"previa",nombre:"Canta la Canción",descripcion:"Cantá una canción con la palabra antes de que se acabe el tiempo",icono:"assets/canta/icono.webp",estado:"disponible",abrir:contenedor=>CantaLaCancion.abrir(contenedor),record:()=>CantaLaCancion.partidasJugadas()+" partidas"},
  {id:"sopa-fugaz",nombre:"Sopa Fugaz",descripcion:"Sopa de letras gigante: tableros con forma y contra reloj",icono:"logo-sopa-fugaz.svg",estado:"disponible",abrir:contenedor=>SopaFugaz.abrir(contenedor),record:()=>SopaFugaz.mejorPuntaje()+" puntos"},
  {id:"quien-soy",grupo:"previa",nombre:"¿Quién soy?",descripcion:"Celular en la frente: adiviná la palabra",icono:"assets/quien-soy/icono.webp",estado:"disponible",abrir:contenedor=>QuienSoy.abrir(contenedor),record:()=>QuienSoy.mejorPuntaje()+" aciertos"},
  {id:"bomba",grupo:"previa",nombre:"Bomba",descripcion:"Decí una palabra y pasala antes de que explote",icono:"assets/bomba/icono.webp",estado:"disponible",abrir:contenedor=>Bomba.abrir(contenedor),record:()=>Bomba.rondasJugadas()+" rondas"},
  {id:"que-numero-soy",grupo:"previa",nombre:"¿Qué número soy?",descripcion:"Número gigante en pantalla completa, sin que se apague",icono:"assets/que-numero-soy/icono.webp",estado:"disponible",abrir:contenedor=>QueNumeroSoy.abrir(contenedor),record:()=>QueNumeroSoy.rondasJugadas()+" rondas"},
  {id:"rueda-de-letras",nombre:"Rueda de Letras",descripcion:"Completá el crucigrama uniendo letras",icono:"logo-rueda-de-letras.svg",estado:RUEDA_HABILITADA?"disponible":"proximamente",abrir:contenedor=>RuedaDeLetras.abrir(contenedor),record:()=>RuedaDeLetras.mejorPuntaje()+" puntos"},
  {id:"duelo-conocimiento",nombre:"Duelo de Conocimiento",descripcion:"Banderas, matemática, famosos y fútbol · Contra BOT u online con micrófono",icono:"logo-duelo-conocimiento.webp",estado:"disponible",abrir:contenedor=>DueloConocimiento.abrir(contenedor),record:()=>"BOT · Online · Voz"},
  /* Mahjong Rioplatense (mahjong-rioplatense.html) a propósito oculto del lobby:
     la pantalla de inicio no estaba lista para mostrarse a los jugadores.
     Sigue publicada y accesible por URL directa para que Gonzalo la pruebe;
     sumar de nuevo esta entrada cuando el inicio esté arreglado. */
];
function extensionVisible(ext){
  if(ext.soloUsuarios){let n="";try{n=(perfil&&perfil.nombre||"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}catch(e){}return ext.soloUsuarios.includes(n);}
  if(!ext.soloGonzalo)return true;
  return typeof esGonzalo==="function"&&esGonzalo();
}
window.EXTENSIONES=EXTENSIONES;
/* Fichas ⚡ de las extensiones. Los testers que ayudaron con el juego pueden
   jugar libremente a estas extensiones, sin consumir ni ver fichas. Cada juego
   tiene sus propias fichas: 3, se repone 1 cada 30 min. Se gasta 1 al empezar
   una partida/nivel en solitario (los duelos con amigos no gastan). En Palabra
   Secreta se cobra al primer intento de cada palabra. Sin fichas:
   esperar, recargar ese juego con monedas o probar otro juego. Las vidas del
   juego principal no se tocan. */
const Fichas=(()=>{
  const MAX=3,MS=30*60*1000,CLAVE="gya_fichas_ext",PRECIO=400;
  const JUEGOS=["palabra-secreta","sopa-fugaz","rueda-de-letras","frases-en-giro","memoria-en-giro","rosco-rioplatense","silabario-rioplatense","cien-rioplatenses","ahorcado-rioplatense","moon-tap","tutti-frutti","puzzle"];
  const TESTERS_LIBRES=new Set(["andres","flor","grace","juan e","mari","romina","ruben","vale"]);
  const activo=()=>{
    try{
      const nombre=String(perfil&&perfil.nombre||"").trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
      return !TESTERS_LIBRES.has(nombre);
    }catch(e){return true;}
  };
  // Gonzalo conserva el indicador de tres rayitos, pero no gasta fichas ni espera recargas.
  const creador=()=>{try{return typeof recursosInfinitosGonzalo==="function"&&recursosInfinitosGonzalo();}catch(e){return false;}};
  /* Con el Pase de extensiones (suscripción de Google Play, en index.html) no se gastan fichas. */
  const conPase=()=>{try{return typeof window.paseExtActivo==="function"&&window.paseExtActivo();}catch(e){return false;}};
  const cobra=id=>activo()&&JUEGOS.includes(id)&&!conPase();
  let datos={};try{datos=JSON.parse(localStorage.getItem(CLAVE))||{};}catch(e){datos={};}
  const guardar=()=>{try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}};
  /* Fichas de un juego, reponiendo las que correspondan por el tiempo pasado. */
  function de(id){
    const d=datos[id]||(datos[id]={n:MAX,prox:0});const ahora=Date.now();let cambio=false;
    while(d.n<MAX&&d.prox&&ahora>=d.prox){d.n++;d.prox=d.n<MAX?d.prox+MS:0;cambio=true;}
    if(d.n>=MAX&&d.prox){d.prox=0;cambio=true;}
    if(cambio)guardar();return d;
  }
  const falta=id=>{const d=de(id);return d.n<MAX&&d.prox?Math.max(0,d.prox-Date.now()):0;};
  const reloj=ms=>{const t=Math.ceil(ms/1000),m=Math.floor(t/60),s=t%60;return m+":"+String(s).padStart(2,"0");};
  const nombre=id=>{const e=EXTENSIONES.find(x=>x.id===id);return e?e.nombre:id;};
  /* Tutti Frutti: 1 ficha por partida contra la máquina (3 rondas = 1 partida; con amigos no gasta).
     Puzzle: 1 ficha por cada puzzle nuevo que empezás solo (seguir uno guardado o armar con un amigo no gasta). */
  function usar(id,reintentar){
    if(!cobra(id)||creador())return true;
    const d=de(id);
    if(d.n>0){d.n--;if(!d.prox)d.prox=Date.now()+MS;guardar();pintarChip();
      const ch=document.getElementById("extFichas");if(ch){ch.classList.remove("gasto");void ch.offsetWidth;ch.classList.add("gasto");}
      return true;}
    sinFichas(id,reintentar);return false;
  }
  function recargar(id){
    let monedas=0,infinitas=false;try{monedas=meta.monedas;infinitas=recursosInfinitosGonzalo();}catch(e){}
    if(!infinitas&&monedas<PRECIO){if(typeof mostrarToast==="function")mostrarToast("🪙","Te faltan monedas: necesitás "+PRECIO+".","Recargar");return false;}
    try{gastarMonedas(PRECIO);}catch(e){}
    datos[id]={n:MAX,prox:0};guardar();pintarChip();return true;
  }
  /* Cartel "te quedaste sin fichas" con cuenta regresiva. */
  let timerCartel=0;
  function sinFichas(id,reintentar){
    document.querySelectorAll(".fx-capa").forEach(x=>x.remove());clearInterval(timerCartel);
    const otro=JUEGOS.filter(x=>x!==id&&EXTENSIONES.some(e=>e.id===x&&e.estado==="disponible")).map(x=>[x,de(x).n]).sort((a,b)=>b[1]-a[1])[0];
    const c=document.createElement("div");c.className="fx-capa";
    c.innerHTML='<div class="fx-caja"><div class="fx-rayo">⚡</div><h3>¡Te quedaste sin fichas!</h3>'+
      '<p>En <b>'+nombre(id)+'</b> usaste tus '+MAX+' fichas.</p><div class="fx-reloj">La próxima vuelve en <b id="fxReloj"></b></div>'+
      '<button type="button" class="fx-principal" id="fxRecargar">⚡ Recargar '+MAX+' fichas · 🪙 '+PRECIO+'</button>'+
      (typeof window.paseExtDisponible==="function"&&window.paseExtDisponible()?'<button type="button" class="fx-otro" id="fxPase">🔓 <b>Pase de extensiones</b>: jugá todo sin fichas</button>':"")+
      (otro&&otro[1]>0?'<button type="button" class="fx-otro" id="fxOtro">🎮 Probá <b>'+nombre(otro[0])+'</b> · tiene '+"⚡".repeat(otro[1])+'</button>':"")+
      '<button type="button" class="fx-volver" id="fxVolver">Esperar</button></div>';
    (document.getElementById("extShell")||document.body).appendChild(c);
    const tic=()=>{const ms=falta(id),el=c.querySelector("#fxReloj");if(el)el.textContent=reloj(ms);if(de(id).n>0){cerrarC();if(typeof reintentar==="function")reintentar();}};
    const cerrarC=()=>{clearInterval(timerCartel);c.remove();};
    tic();timerCartel=setInterval(tic,1000);
    c.querySelector("#fxRecargar").onclick=()=>{if(recargar(id)){cerrarC();if(typeof reintentar==="function")reintentar();}};
    const ps=c.querySelector("#fxPase");if(ps)ps.onclick=()=>{cerrarC();window.abrirPaseExt();};
    const o=c.querySelector("#fxOtro");if(o)o.onclick=()=>{cerrarC();Extensiones.abrirJuego(otro[0]);};
    c.querySelector("#fxVolver").onclick=cerrarC;
    c.onclick=e=>{if(e.target===c)cerrarC();};
  }
  /* Chip "⚡ 2/3" arriba, al lado del nombre del juego. */
  let vistaActual="",timerChip=0;
  function pintarChip(){
    const ch=document.getElementById("extFichas");if(!ch)return;
    if(!cobra(vistaActual)){ch.hidden=true;return;}
    if(creador()){ch.hidden=false;ch.innerHTML='<span>⚡⚡⚡</span>';return;}
    const d=de(vistaActual),ms=falta(vistaActual);ch.hidden=false;
    ch.innerHTML='<span>'+"⚡".repeat(d.n)+'<i>'+"⚡".repeat(MAX-d.n)+'</i></span>'+(ms?'<small>+1 en '+reloj(ms)+'</small>':"");
  }
  function enJuego(id){vistaActual=id||"";clearInterval(timerChip);pintarChip();if(cobra(vistaActual)&&!creador())timerChip=setInterval(pintarChip,1000);}
  /* Texto para la tarjeta del juego en la lista de Extensiones. */
  function etiqueta(id){if(!cobra(id))return"";if(creador())return"⚡⚡⚡";const d=de(id),ms=falta(id);return d.n>0?"⚡".repeat(d.n)+(d.n<MAX?' · +1 en '+reloj(ms):""):"⚡ 0 · vuelve en "+reloj(ms);}
  return{usar,enJuego,etiqueta,cobra,de,libre:()=>!activo()};
})();
window.Fichas=Fichas;
const Extensiones=(()=>{
  let shell=null,contenido=null,vista="";
  let modoTVElegido=false,versionModo=0;
  /* Por defecto cada extensión responde al giro físico. El botón TV solo
     existe para Gonzalo y puede solicitar landscape si la app no rota sola. */
  const modoGonzalo=()=>typeof esGonzalo==="function"&&esGonzalo();
  function pintarTV(){
    const boton=shell?.querySelector("#extTV");if(!boton)return;
    boton.hidden=!modoGonzalo()||vista==="lobby";
    boton.setAttribute("aria-pressed",String(Boolean(window.GyaTV?.activo("ext"))));
  }
  function salirTV(){window.GyaTV?.soltar("ext");pintarTV();}
  function pintarSelectorModo(){
    const selector=contenido?.querySelector(".ext-selector-modo");if(!selector)return;
    selector.querySelectorAll("button[data-modo]").forEach(b=>
      b.setAttribute("aria-pressed",String((b.dataset.modo==="tv")===modoTVElegido)));
  }
  async function seleccionarModo(modo){
    if(!modoGonzalo())return;
    const version=++versionModo;
    if(modo==="celular"){
      modoTVElegido=false;salirTV();pintarSelectorModo();return;
    }
    if(modo!=="tv")return;
    modoTVElegido=true;pintarSelectorModo();
    /* Al elegir TV en Más juegos todavía no giramos: el menú sigue
       vertical. El giro se solicita cuando Gonzalo toca un juego. */
    if(vista==="lobby"){salirTV();pintarSelectorModo();return;}
    if(!window.GyaTV?.activo("ext"))await window.GyaTV?.alternar("ext");
    if(version!==versionModo)return;
    if(!window.GyaTV?.activo("ext"))modoTVElegido=false;
    pintarSelectorModo();pintarTV();
  }
  function ajustarTeclado(){
    if(!shell||shell.hidden||shell.classList.contains("rr-abierta"))return;
    const campo=document.activeElement;
    const escribiendo=shell.contains(campo)&&campo.matches("input:not([type=checkbox]):not([type=radio]),textarea");
    if(!escribiendo){shell.classList.remove("ext-teclado-abierto");shell.style.top="";shell.style.height="";shell.style.bottom="";return;}
    const vv=window.visualViewport;
    shell.classList.toggle("ext-teclado-abierto",!!vv&&innerHeight-vv.height>90);
    shell.style.top=Math.max(0,Math.round(vv?.offsetTop||0))+"px";
    shell.style.height=Math.round(vv?.height||innerHeight)+"px";
    shell.style.bottom="auto";
    requestAnimationFrame(()=>{
      if(shell.hidden||document.activeElement!==campo)return;
      const visible=shell.getBoundingClientRect(),objetivo=(campo.closest("form")||campo.parentElement||campo).getBoundingClientRect();
      if(objetivo.bottom>visible.bottom-10)shell.scrollTop+=objetivo.bottom-(visible.bottom-10);
      else if(objetivo.top<visible.top+8)shell.scrollTop-=visible.top+8-objetivo.top;
    });
  }
  function asegurar(){
    if(shell)return;
    shell=document.createElement("section");shell.id="extShell";shell.className="ext-shell";shell.hidden=true;
    shell.innerHTML='<div class="ext-wrap"><header class="ext-header"><button class="ext-atras" id="extAtras" type="button" aria-label="Volver">‹</button><strong id="extTitulo">Extensiones</strong><span class="ext-fichas" id="extFichas" hidden></span><button class="ext-tv-mini" id="extTV" type="button" aria-label="Modo TV, horizontal opcional" title="Modo TV" aria-pressed="false" hidden>TV</button><button class="ext-cerrar" id="extCerrar" type="button" aria-label="Cerrar">✕</button></header><div id="extContenido"></div></div>';
    document.body.appendChild(shell);
    contenido=shell.querySelector("#extContenido");
    /* Todas las ventanitas de inicio/fin de los juegos llevan un "Volver"
       al final, por si alguien entró sin querer. */
    const TARJETAS=".sf-panel,.fg-panel,.mg-panel,.rr-panel,.crr-grupo-card";
    new MutationObserver(()=>{
      contenido.querySelectorAll(TARJETAS).forEach(t=>{
        if(t.querySelector(":scope>.ext-panel-volver"))return;
        const b=document.createElement("button");b.type="button";b.className="ext-panel-volver";b.textContent="⟵ Volver a Extensiones";
        b.onclick=()=>abrirLobby();t.appendChild(b);
      });
    }).observe(contenido,{childList:true,subtree:true});
    shell.querySelector("#extAtras").onclick=()=>vista==="lobby"?cerrar():abrirLobby();
    shell.querySelector("#extCerrar").onclick=cerrar;
    shell.querySelector("#extTV").onclick=()=>seleccionarModo(modoTVElegido?"celular":"tv");
    shell.addEventListener("focusin",()=>{ajustarTeclado();setTimeout(ajustarTeclado,350);});
    shell.addEventListener("focusout",()=>setTimeout(ajustarTeclado,150));
    window.visualViewport?.addEventListener("resize",ajustarTeclado);
    window.visualViewport?.addEventListener("scroll",ajustarTeclado);
    window.addEventListener("resize",ajustarTeclado);
    document.addEventListener("keydown",e=>{
      if(shell.hidden)return;
      /* Juegos de previa en pantalla fija: Escape no saca del juego. */
      /* Solo Escape se bloquea: las demás teclas tienen que escribir (en iPhone,
         frenar todas dejaba sin escribir ni borrar en el Tutti Frutti). */
      if(window.PantallaFija&&PantallaFija.activo()&&e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();return;}
      if(vista==="tutti-frutti"&&e.key==="Enter"&&!e.isComposing&&e.target.id==="tfInput"&&window.TuttiFrutti){e.preventDefault();TuttiFrutti.enter();}
      if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();vista==="lobby"?cerrar():abrirLobby();return;}
      if(vista==="palabra-secreta"&&window.PalabraSecreta){if(e.key!=="Tab")e.preventDefault();PalabraSecreta.tecla(e.key);}
      if(vista==="ahorcado-rioplatense"&&window.AhorcadoRioplatense)AhorcadoRioplatense.tecla(e.key,e);
      if(vista==="moon-tap"&&window.MoonTap)MoonTap.tecla(e.key,e);
      if(vista==="rosco-rioplatense"&&e.key==="Enter"&&!e.isComposing&&e.target.id==="rrEntrada"){e.preventDefault();RoscoRioplatense.enviar();}
      if(vista==="cien-rioplatenses"&&e.key==="Enter"&&!e.isComposing&&e.target.id==="crEntrada"){e.preventDefault();CienRioplatenses.enviar();}
      if(e.key!=="Tab")e.stopImmediatePropagation();
    },true);
  }
  function mostrar(){asegurar();shell.hidden=false;document.body.classList.add("ext-abierta");if(typeof detenerMusica==="function")detenerMusica();}
  /* Los logos del lobby se bajan y se decodifican apenas carga el juego y se guardan acá
     (si nadie los guarda, el navegador los descarta y al entrar a Extensiones tarda en dibujarlos). */
  const iconosListos=[];
  function precargarIconos(){
    if(iconosListos.length)return;
    EXTENSIONES.forEach(x=>{if(!x.icono)return;const im=new Image();im.src=x.icono;iconosListos.push(im);if(im.decode)im.decode().catch(()=>{});});
    /* Y los dibujos de los popups de cada juego (personajes y logos grandes del cartel de inicio),
       un ratito después, para que al entrar a un juego el popup salga completo de arranque. */
    setTimeout(()=>{ARTE_POPUPS.forEach(u=>{const im=new Image();im.src=u;iconosListos.push(im);if(im.decode)im.decode().catch(()=>{});});},1500);
  }
  const ARTE_POPUPS=["ahorcado","cien","frases-giro","memoria-giro","palabra-secreta","rosco","rueda-letras","silabario"].map(c=>"assets/"+c+"/personaje.webp")
    .concat(["ahorcado","bomba","canta","cien","frases-giro","impostor","memoria-giro","mimica","palabra-secreta","puzzle-arte","que-numero-soy","quien-soy","rosco","rueda-letras","silabario","sopa","tutti"].map(c=>"assets/"+c+"/logo.webp"))
    .concat(["assets/tutti/como.webp","assets/tutti/ficha.webp"]);
  addEventListener("load",()=>setTimeout(precargarIconos,1200));
  function abrirLobby(){
    precargarIconos();
    if(!EXTENSIONES_HABILITADAS)return;
    salirJuego();
    vista="lobby";salirTV();mostrar();pintarTV();Fichas.enJuego("");
    shell.querySelector("#extTitulo").textContent="Jugá más juegos de Girá y Adiviná";
    const selector=modoGonzalo()?'<div class="ext-selector-modo" role="group" aria-label="Modo de pantalla"><span>Pantallas</span><button type="button" data-modo="celular" aria-pressed="true">📱 Celular</button><button type="button" data-modo="tv" aria-pressed="false">📺 TV</button></div>':"";
    /* Mantener la portada pegada al título. El selector de Gonzalo comparte
       fila con «Más juegos» y no genera una fila adicional sobre la portada. */
    const tituloJuegos=selector?'<div class="ext-seccion-barra"><h3 class="ext-seccion">🎮 Más juegos</h3>'+selector+'</div>':'<h3 class="ext-seccion">🎮 Más juegos</h3>';
    contenido.innerHTML='<div class="ext-hero"><span>✦ MÁS JUEGOS, MÁS DESAFÍOS</span><h2>Extensiones</h2><p>Elegí un juego del universo Girá y Adiviná. Jugá gratis, sin gastar vidas ni monedas.</p></div>'+tituloJuegos+'<div class="ext-lista" id="extListaResto"></div><h3 class="ext-seccion">🎉 Juegos de previa</h3><div class="ext-lista" id="extListaPrevia"></div>';
    if(selector){
      const barra=contenido.querySelector(".ext-selector-modo");
      barra.onclick=ev=>{const boton=ev.target.closest("button[data-modo]");if(boton)seleccionarModo(boton.dataset.modo);};
      pintarSelectorModo();
    }
    /* "Juegos de previa": los de juntarse en grupo (grupo:"previa") van en su propia sección. */
    const previa=contenido.querySelector("#extListaPrevia"),resto=contenido.querySelector("#extListaResto");
    EXTENSIONES.filter(extensionVisible).forEach(ext=>{
      const lista=ext.grupo==="previa"?previa:resto;
      const b=document.createElement("button");b.type="button";b.className="ext-tarjeta";
      b.disabled=ext.estado!=="disponible";
      const img=document.createElement("img");img.src=ext.icono;img.alt="";img.decoding="sync";
      const txt=document.createElement("span");txt.className="ext-tarjeta-texto";
      const nombre=document.createElement("b");nombre.textContent=ext.nombre;
      const desc=document.createElement("small");desc.textContent=ext.descripcion;
      const record=document.createElement("em");record.textContent=ext.id==="duelo-conocimiento"?"BOT · Online · Voz":ext.estado==="disponible"?"Mejor: "+ext.record():"Próximamente";
      txt.append(nombre,desc,record);b.append(img,txt);
      if(Fichas.cobra(ext.id)){const f=document.createElement("span");f.className="ext-fichas-tarjeta";f.textContent=Fichas.etiqueta(ext.id);b.appendChild(f);}
      if(ext.insignia){const ins=document.createElement("span");ins.className="ext-insignia";ins.textContent=ext.insignia;b.appendChild(ins);}
      if(!b.disabled)b.onclick=()=>abrirJuego(ext.id);
      lista.appendChild(b);
    });
    shell.scrollTop=0;
  }
  function abrirJuego(id){
    if(!EXTENSIONES_HABILITADAS)return;
    const ext=EXTENSIONES.find(x=>x.id===id&&x.estado==="disponible"&&extensionVisible(x));if(!ext)return;
    mostrar();vista=id;contenido.replaceChildren();Fichas.enJuego(id);pintarTV();
    /* Pedir orientación horizontal solo al entrar al juego y solo cuando
       Gonzalo eligió TV, nunca al seleccionar el modo en el menú. */
    if(modoGonzalo()&&modoTVElegido&&!window.GyaTV?.activo("ext"))
      void window.GyaTV?.alternar("ext").then(()=>pintarTV());
    shell.querySelector("#extTitulo").textContent=ext.nombre;
    if(typeof window.anotarUltimoJuego==="function")window.anotarUltimoJuego(ext.nombre);
    ext.abrir(contenido);shell.scrollTop=0;
  }
  function salirJuego(){for(const juego of [window.SopaFugaz,window.RuedaDeLetras,window.PalabraSecreta,window.FrasesEnGiro,window.MemoriaEnGiro,window.RoscoRioplatense,window.SilabarioRioplatense,window.CienRioplatenses,window.AhorcadoRioplatense,window.ContraRelojRioplatense,window.MoonTap,window.DueloConocimiento,window.Puzzle,window.QueNumeroSoy,window.QuienSoy,window.Bomba,window.Impostor,window.Mimica,window.CantaLaCancion,window.TuttiFrutti])if(juego)juego.salir();}
  function cerrar(){if(!shell)return;salirJuego();Fichas.enJuego("");vista="lobby";modoTVElegido=false;versionModo++;salirTV();shell.hidden=true;shell.classList.remove("ext-teclado-abierto");shell.style.top="";shell.style.height="";shell.style.bottom="";document.body.classList.remove("ext-abierta");vista="";if(typeof sincronizarMusica==="function")sincronizarMusica();}
  return{abrirLobby,abrirJuego,cerrar};
})();
window.Extensiones=Extensiones;
const botonExtensiones=document.getElementById("bExtensiones");
if(EXTENSIONES_HABILITADAS&&botonExtensiones){botonExtensiones.hidden=false;botonExtensiones.onclick=Extensiones.abrirLobby;}
/* Link de invitación de Contra Reloj (?sala=XXXX): abre el juego directo
   para que el invitado solo ponga su nombre y entre. */
/* Lo mismo para los duelos 1 vs 1 (?duelo=<juego>&sala=XXXX). Si el
   invitado todavía no tiene perfil, se espera a que lo cree. */
try{
  const q=new URLSearchParams(location.search),hayDuelo=!!q.get("duelo"),haySala=/^[A-Za-z0-9]{4}$/.test(q.get("sala")||"");
  /* Invitación simple a un juego (?ext=<id>), sin sala. */
  /* Sala de Tutti Frutti (?tutti=XXXX&de=<nombre>). */
  const salaTutti=(q.get("tutti")||"").toUpperCase(),hayTutti=/^[A-HJ-NP-Z2-9]{4}$/.test(salaTutti),deTutti=(q.get("de")||"").replace(/[^\p{L}\p{N} ]/gu,"").trim().slice(0,14);
  /* Sala del Puzzle en pareja (?puzzle=XXXXX&de=<nombre>). */
  const salaPuzzle=(q.get("puzzle")||"").toUpperCase(),hayPuzzle=/^[A-HJ-NP-Z2-9]{5}$/.test(salaPuzzle);
  const extDirecta=!haySala&&/^[a-z-]{3,40}$/.test(q.get("ext")||"")?q.get("ext"):"";
  if(EXTENSIONES_HABILITADAS&&(haySala||extDirecta||hayTutti||hayPuzzle)){
    let intentos=0;
    const t=setInterval(()=>{
      if(++intentos>80){clearInterval(t);return;}
      if(document.readyState!=="complete"||typeof perfil==="undefined"||!perfil||!perfil.nombre)return;
      clearInterval(t);
      setTimeout(()=>{try{if(hayPuzzle){try{history.replaceState(null,"",location.pathname);}catch(e){}window.gyaPuzzleInvitacion=salaPuzzle;Extensiones.abrirJuego("puzzle");}else if(hayTutti){try{history.replaceState(null,"",location.pathname);}catch(e){}if(window.TuttiFrutti)TuttiFrutti.abrirInvitacion(salaTutti,deTutti);}else if(extDirecta){try{history.replaceState(null,"",location.pathname);}catch(e){}Extensiones.abrirJuego(extDirecta);}else if(hayDuelo){if(window.Duelo)Duelo.abrirInvitacion();}else Extensiones.abrirJuego("contra-reloj-rioplatense");}catch(e){}},1200);
    },1500);
  }
}catch(e){}
