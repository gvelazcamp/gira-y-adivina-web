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
  /* Android (motor de Google) a veces marca el género en el nombre: "…#male_1-local". */
  const porMarca=pool.find(v=>/#male/i.test(v.name+" "+(v.voiceURI||"")));
  if(porMarca)return porMarca;
  /* Nombres de hombre de Windows/Edge (Mateo de Uruguay, Tomás de Argentina…) y de iPhone (Eddy, Reed, Rocko, Grandpa). */
  const porNombre=pool.find(v=>/\b(male|hombre|var[oó]n|jorge|diego|carlos|pablo|juan|miguel|enrique|pedro|andr[eé]s|[aá]lvaro|ra[uú]l|mateo|tom[aá]s|gonzalo|alonso|gerardo|sergio|emilio|lorenzo|federico|eddy|reed|rocko|grandpa|monte)\b/i.test(v.name));
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
    if(typeof avisarVozGonzalo==="function")avisarVozGonzalo(voz);
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
/* Solo Gonzalo (prueba de voz de hombre en El Rosco): una vez por apertura le
   avisa qué voz eligió el juego, para saber qué ofrece su celular. */
let vozAvisadaGonzalo=false;
function avisarVozGonzalo(voz){
  return; /* Retirado: Giro usa grabaciones; el aviso amarillo "Prueba de voz" ya no hace falta. */
  if(vozAvisadaGonzalo||typeof esGonzalo!=="function"||!esGonzalo()||typeof mostrarToast!=="function")return;
  vozAvisadaGonzalo=true;
  mostrarToast("🔊",voz?"Voz de hombre: "+voz.name:"Este celular no le ofrece al juego una voz de hombre: se usa la común, más grave.","Prueba de voz");
}
window.avisarVozGonzalo=avisarVozGonzalo;

/* Duelo de Conocimiento se abre aislado en su HTML; esto evita tocar
   el estado de la ruleta y permite solicitar permiso de micrófono. */
const DueloConocimiento={
  iframe:null,
  marco:null,
  pantalla(jugando){
    /* Solo Duelo, en partida: la pantalla horizontal aprovecha toda el área.
       La configuración previa conserva el espacio para el teclado nativo. */
    this.marco?.closest(".ext-shell")?.classList.toggle("dc-partida-horizontal",Boolean(jugando));
  },
  abrir(contenedor){
    this.salir();
    if(!document.getElementById("dc-carga-estilo")){
      const estilo=document.createElement("style");estilo.id="dc-carga-estilo";
      estilo.textContent=".dc-marco{position:relative;width:100%;height:calc(100dvh - 82px);min-height:min(680px,calc(100dvh - 82px));border-radius:16px;overflow:hidden;background:radial-gradient(circle at 50% 38%,#38205e,#160b27 72%)}.dc-marco iframe{display:block;width:100%;height:100%;border:0;background:#160b27;opacity:0;transition:opacity .25s}.dc-marco iframe.dc-listo{opacity:1}.dc-cargando{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;padding:24px;text-align:center;color:#fff5dc;font:800 17px system-ui,sans-serif}.dc-cargando img{width:min(45vw,165px);max-height:30vh;object-fit:contain;filter:drop-shadow(0 12px 24px #0008)}.dc-cargando small{font-size:13px;font-weight:600;color:#d7c6ed}.dc-cargando i{display:block;width:110px;height:5px;border-radius:8px;background:linear-gradient(90deg,#ffcb41,#38dac7);animation:dc-carga-pulso 1.2s ease-in-out infinite alternate}.dc-cargando button{border:1px solid #ffcd45;border-radius:10px;padding:9px 16px;background:#f7bd35;color:#241339;font-weight:900}@keyframes dc-carga-pulso{from{opacity:.35;transform:scaleX(.55)}to{opacity:1;transform:scaleX(1)}}";
      document.head.appendChild(estilo);
    }
    const marco=document.createElement("div");marco.className="dc-marco";
    const carga=document.createElement("div");carga.className="dc-cargando";carga.setAttribute("role","status");
    carga.innerHTML='<img src="logo-duelo-conocimiento.webp" alt=""><b>Preparando Duelo de Conocimiento…</b><i aria-hidden="true"></i><small>En un momento empieza el desafío</small><button type="button" hidden>Reintentar</button>';
    const frame=document.createElement("iframe");
    const invitacion=new URLSearchParams(location.search).get("duelo_conocimiento");
    frame.src="duelo-conocimiento.html?v=26"+(/^[A-HJ-NP-Z2-9]{4}$/i.test(invitacion||"")?"&sala="+invitacion.toUpperCase():"");
    frame.title="Duelo de Conocimiento";
    frame.allow="microphone; autoplay";
    frame.setAttribute("allowfullscreen","");
    const lento=setTimeout(()=>{if(this.iframe===frame&&carga.isConnected){carga.querySelector("small").textContent="Está tardando más de lo habitual";carga.querySelector("button").hidden=false}},8500);
    carga.querySelector("button").onclick=()=>{carga.querySelector("button").hidden=true;carga.querySelector("small").textContent="Volviendo a cargar…";frame.src=frame.src};
    frame.onload=async()=>{
      try{
        const doc=frame.contentDocument;
        if(!doc?.querySelector("#setup-overlay")){carga.querySelector("small").textContent="No se pudo abrir el Duelo";carga.querySelector("button").hidden=false;return}
        const imagenes=[...doc.querySelectorAll("#char0,#char1,#host-img,#flag-img,.dc-setup-hero img")];
        await Promise.race([Promise.all(imagenes.map(im=>im.decode?im.decode().catch(()=>{}):Promise.resolve())),new Promise(r=>setTimeout(r,6000))]);
        if(frame.contentDocument!==doc)return;
      }catch(e){}
      if(this.iframe!==frame)return;
      clearTimeout(lento);frame.classList.add("dc-listo");carga.remove();
    };
    marco.append(frame,carga);contenedor.appendChild(marco);
    this.iframe=frame;
    this.marco=marco;
  },
  salir(){
    this.pantalla(false);
    if(this.marco){this.marco.remove();this.marco=null;this.iframe=null;}
  }
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
  const JUEGOS=["palabra-secreta","sopa-fugaz","rueda-de-letras","frases-en-giro","memoria-en-giro","rosco-rioplatense","silabario-rioplatense","cien-rioplatenses","ahorcado-rioplatense","moon-tap","tutti-frutti","puzzle","duelo-conocimiento"];
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
  let avisoTV=null,focoAntesAvisoTV=null;
  /* El selector Celular/TV de Extensiones está disponible para todos.
     El modo TV sigue siendo opcional y el menú mantiene su orientación. */
  const modoTVDisponible=()=>typeof puedeModoTVExtensiones==="function"&&puedeModoTVExtensiones();
  function pintarTV(){
    const boton=shell?.querySelector("#extTV");if(!boton)return;
    shell.classList.toggle("ext-tv-activo",Boolean(window.GyaTV?.activo("ext")));
    boton.hidden=!modoTVDisponible()||vista==="lobby";
    boton.setAttribute("aria-pressed",String(Boolean(window.GyaTV?.activo("ext"))));
  }
  function salirTV(){window.GyaTV?.soltar("ext");pintarTV();}
  function pintarSelectorModo(){
    const selector=contenido?.querySelector(".ext-selector-modo");if(!selector)return;
    selector.querySelectorAll("button[data-modo]").forEach(b=>
      b.setAttribute("aria-pressed",String((b.dataset.modo==="tv")===modoTVElegido)));
  }
  async function seleccionarModo(modo){
    if(!modoTVDisponible())return;
    const version=++versionModo;
    if(modo==="celular"){
      modoTVElegido=false;salirTV();pintarSelectorModo();return;
    }
    if(modo!=="tv")return;
    modoTVElegido=true;pintarSelectorModo();
    /* Al elegir TV en Más juegos todavía no giramos: el menú sigue
       vertical. El giro se solicita al abrir un juego si se eligió TV. */
    if(vista==="lobby"){salirTV();pintarSelectorModo();return;}
    if(!window.GyaTV?.activo("ext"))await window.GyaTV?.alternar("ext");
    if(version!==versionModo)return;
    if(!window.GyaTV?.activo("ext"))modoTVElegido=false;
    pintarSelectorModo();pintarTV();
  }
  function cerrarAvisoTV(){
    if(!avisoTV)return;
    avisoTV.remove();avisoTV=null;
    if(focoAntesAvisoTV?.isConnected&&!shell?.hidden)focoAntesAvisoTV.focus({preventScroll:true});
    focoAntesAvisoTV=null;
  }
  function mostrarAvisoTV(){
    if(avisoTV||!shell||shell.hidden)return;
    focoAntesAvisoTV=document.activeElement;
    const capa=document.createElement("div");capa.className="ext-tv-aviso";
    capa.setAttribute("role","dialog");capa.setAttribute("aria-modal","true");capa.setAttribute("aria-labelledby","extTvAvisoTitulo");
    capa.innerHTML='<div class="ext-tv-aviso-caja"><div class="ext-tv-aviso-icono" aria-hidden="true">📺</div><h3 id="extTvAvisoTitulo">Jugá en modo TV</h3><p>Los juegos se adaptan al formato horizontal para aprovechar mejor la pantalla.</p><p>En los juegos que permiten hablar, te recomendamos activar el micrófono. Si preferís escribir, podés usar el teclado adaptado del juego.</p><small>El modo horizontal se activa al abrir un juego.</small><div class="ext-tv-aviso-acciones"><button type="button" data-tv="no">Ahora no</button><button type="button" data-tv="si">Usar modo TV</button></div></div>';
    capa.onclick=e=>{const boton=e.target.closest("button[data-tv]");if(!boton&&e.target!==capa)return;const activar=boton?.dataset.tv==="si";cerrarAvisoTV();if(activar)void seleccionarModo("tv");};
    shell.appendChild(capa);avisoTV=capa;
    capa.querySelector('[data-tv="si"]').focus({preventScroll:true});
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
      if(e.key==="Escape"&&avisoTV){e.preventDefault();e.stopImmediatePropagation();cerrarAvisoTV();return;}
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
  /* Conservar las imágenes de portada y bienvenida decodificadas para que al abrir
     Extensiones o un popup no haya que esperar otra descarga. */
  const iconosListos=new Map();
  function precargarIconos(){
    for(const u of [...EXTENSIONES.map(x=>x.icono),...ARTE_POPUPS]){
      if(!u||iconosListos.has(u))continue;
      const im=new Image();im.decoding="async";im.src=u;iconosListos.set(u,im);
      if(im.decode)im.decode().catch(()=>{});
    }
  }
  const ARTE_POPUPS=["ahorcado","cien","frases-giro","memoria-giro","palabra-secreta","rosco","rueda-letras","silabario"].map(c=>"assets/"+c+"/personaje.webp")
    .concat(["ahorcado","bomba","canta","cien","frases-giro","impostor","memoria-giro","mimica","palabra-secreta","puzzle-arte","que-numero-soy","quien-soy","rosco","rueda-letras","silabario","sopa","tutti"].map(c=>"assets/"+c+"/logo.webp"))
    .concat(["bomba","canta","mimica","puzzle-arte","que-numero-soy","quien-soy","tutti"].map(c=>"assets/"+c+"/como.webp"))
    .concat(["assets/tutti/ficha.webp","assets/sopa/mascota.webp","assets/avatars/avatar-01.webp","assets/avatars/avatar-02.webp"]);
  if(document.readyState==="complete")precargarIconos();
  else addEventListener("load",precargarIconos,{once:true});
  function abrirLobby(){
    precargarIconos();
    if(!EXTENSIONES_HABILITADAS)return;
    cerrarAvisoTV();
    salirJuego();
    vista="lobby";salirTV();mostrar();pintarTV();Fichas.enJuego("");
    shell.querySelector("#extTitulo").textContent="Jugá más juegos de Girá y Adiviná";
    const selector=modoTVDisponible()?'<div class="ext-selector-modo" role="group" aria-label="Modo de pantalla"><span>Pantallas</span><button type="button" data-modo="celular" aria-pressed="true">📱 Celular</button><button type="button" data-modo="tv" aria-pressed="false">📺 TV</button></div>':"";
    /* Mantener la portada pegada al título. El selector de todos los perfiles comparte
       fila con «Más juegos» y no genera una fila adicional sobre la portada. */
    const tituloJuegos=selector?'<div class="ext-seccion-barra"><h3 class="ext-seccion">🎮 Más juegos</h3>'+selector+'</div>':'<h3 class="ext-seccion">🎮 Más juegos</h3>';
    contenido.innerHTML='<div class="ext-hero"><span>✦ MÁS JUEGOS, MÁS DESAFÍOS</span><h2>Extensiones</h2><p>Elegí un juego del universo Girá y Adiviná. Jugá gratis, sin gastar vidas ni monedas.</p></div>'+tituloJuegos+'<div class="ext-lista" id="extListaResto"></div><h3 class="ext-seccion">🎉 Juegos de previa</h3><div class="ext-lista" id="extListaPrevia"></div>';
    if(selector){
      const barra=contenido.querySelector(".ext-selector-modo");
      barra.onclick=ev=>{const boton=ev.target.closest("button[data-modo]");if(!boton)return;if(boton.dataset.modo==="tv")mostrarAvisoTV();else void seleccionarModo("celular");};
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
  function prepararDueloTV(){
    /* Girar únicamente después de configurar los nombres y pulsar Empezar,
       nunca mientras el teclado de la configuración está en pantalla. */
    if(vista!=="duelo-conocimiento"||!modoTVDisponible()||!modoTVElegido||window.GyaTV?.activo("ext"))return;
    void window.GyaTV?.alternar("ext").then(()=>pintarTV());
  }
  function abrirJuego(id){
    if(!EXTENSIONES_HABILITADAS)return;
    const ext=EXTENSIONES.find(x=>x.id===id&&x.estado==="disponible"&&extensionVisible(x));if(!ext)return;
    mostrar();vista=id;contenido.replaceChildren();Fichas.enJuego(id);pintarTV();
    /* Pedir orientación horizontal solo al entrar al juego y solo cuando
       el usuario eligió TV, nunca al seleccionar el modo en el menú. */
    if(id!=="duelo-conocimiento"&&modoTVDisponible()&&modoTVElegido&&!window.GyaTV?.activo("ext"))
      void window.GyaTV?.alternar("ext").then(()=>pintarTV());
    shell.querySelector("#extTitulo").textContent=ext.nombre;
    if(typeof window.anotarUltimoJuego==="function")window.anotarUltimoJuego(ext.nombre);
    ext.abrir(contenido);shell.scrollTop=0;
  }
  function salirJuego(){for(const juego of [window.SopaFugaz,window.RuedaDeLetras,window.PalabraSecreta,window.FrasesEnGiro,window.MemoriaEnGiro,window.RoscoRioplatense,window.SilabarioRioplatense,window.CienRioplatenses,window.AhorcadoRioplatense,window.ContraRelojRioplatense,window.MoonTap,window.DueloConocimiento,window.Puzzle,window.QueNumeroSoy,window.QuienSoy,window.Bomba,window.Impostor,window.Mimica,window.CantaLaCancion,window.TuttiFrutti])if(juego)juego.salir();}
  function cerrar(){if(!shell)return;cerrarAvisoTV();salirJuego();Fichas.enJuego("");vista="lobby";modoTVElegido=false;versionModo++;salirTV();shell.hidden=true;shell.classList.remove("ext-teclado-abierto");shell.style.top="";shell.style.height="";shell.style.bottom="";document.body.classList.remove("ext-abierta");vista="";if(typeof sincronizarMusica==="function")sincronizarMusica();}
  return{abrirLobby,abrirJuego,cerrar,prepararDueloTV};
})();
window.Extensiones=Extensiones;
const botonExtensiones=document.getElementById("bExtensiones");
if(botonExtensiones){
  botonExtensiones.hidden=!EXTENSIONES_HABILITADAS;
  if(EXTENSIONES_HABILITADAS){botonExtensiones.onclick=Extensiones.abrirLobby;if(botonExtensiones.dataset.pendiente){delete botonExtensiones.dataset.pendiente;Extensiones.abrirLobby();}}
}
/* Link de invitación de Contra Reloj (?sala=XXXX): abre el juego directo
   para que el invitado solo ponga su nombre y entre. */
/* Lo mismo para los duelos 1 vs 1 (?duelo=<juego>&sala=XXXX). Si el
   invitado todavía no tiene perfil, se espera a que lo cree. */
try{
  const q=new URLSearchParams(location.search),hayDuelo=!!q.get("duelo"),haySala=/^[A-Za-z0-9]{4}$/.test(q.get("sala")||""),salaDuelo=(q.get("duelo_conocimiento")||"").toUpperCase(),haySalaDuelo=/^[A-HJ-NP-Z2-9]{4}$/.test(salaDuelo);
  /* Invitación simple a un juego (?ext=<id>), sin sala. */
  /* Sala de Tutti Frutti (?tutti=XXXX&de=<nombre>). */
  const salaTutti=(q.get("tutti")||"").toUpperCase(),hayTutti=/^[A-HJ-NP-Z2-9]{4}$/.test(salaTutti),deTutti=(q.get("de")||"").replace(/[^\p{L}\p{N} ]/gu,"").trim().slice(0,14);
  /* Sala del Puzzle en pareja (?puzzle=XXXXX&de=<nombre>). */
  const salaPuzzle=(q.get("puzzle")||"").toUpperCase(),hayPuzzle=/^[A-HJ-NP-Z2-9]{5}$/.test(salaPuzzle);
  const extDirecta=!haySala&&/^[a-z-]{3,40}$/.test(q.get("ext")||"")?q.get("ext"):"";
  if(EXTENSIONES_HABILITADAS&&(haySala||extDirecta||hayTutti||hayPuzzle||haySalaDuelo)){
    let intentos=0;
    const t=setInterval(()=>{
      if(++intentos>80){clearInterval(t);return;}
      if(document.readyState!=="complete"||typeof perfil==="undefined"||!perfil||!perfil.nombre)return;
      clearInterval(t);
      setTimeout(()=>{try{if(haySalaDuelo){Extensiones.abrirJuego("duelo-conocimiento");}else if(hayPuzzle){try{history.replaceState(null,"",location.pathname);}catch(e){}window.gyaPuzzleInvitacion=salaPuzzle;Extensiones.abrirJuego("puzzle");}else if(hayTutti){try{history.replaceState(null,"",location.pathname);}catch(e){}if(window.TuttiFrutti)TuttiFrutti.abrirInvitacion(salaTutti,deTutti);}else if(extDirecta){try{history.replaceState(null,"",location.pathname);}catch(e){}Extensiones.abrirJuego(extDirecta);}else if(hayDuelo){if(window.Duelo)Duelo.abrirInvitacion();}else Extensiones.abrirJuego("contra-reloj-rioplatense");}catch(e){}},1200);
    },1500);
  }
}catch(e){}
