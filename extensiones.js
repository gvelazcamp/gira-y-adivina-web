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
/* Catálogo de minijuegos. Cada entrada habilitada aporta su función abrir. */
const EXTENSIONES=[
  {id:"sopa-fugaz",nombre:"Sopa Fugaz",descripcion:"Buscá las palabras antes de que se muden",icono:"logo-sopa-fugaz.svg",estado:"disponible",abrir:contenedor=>SopaFugaz.abrir(contenedor),record:()=>SopaFugaz.mejorPuntaje()+" puntos"},
  {id:"rueda-de-letras",nombre:"Rueda de Letras",descripcion:"Completá el crucigrama uniendo letras",icono:"logo-rueda-de-letras.svg",estado:RUEDA_HABILITADA?"disponible":"proximamente",abrir:contenedor=>RuedaDeLetras.abrir(contenedor),record:()=>RuedaDeLetras.mejorPuntaje()+" puntos"},
  {id:"palabra-secreta",nombre:"Palabra Secreta",descripcion:"Adiviná la palabra de 5 letras en 6 intentos",icono:"logo-palabra-secreta.svg",estado:PALABRA_HABILITADA?"disponible":"proximamente",abrir:contenedor=>PalabraSecreta.abrir(contenedor),record:()=>"Racha: "+PalabraSecreta.rachaActual()+" días"},
  {id:"frases-en-giro",nombre:"Frases en Giro",descripcion:"Ordená frases entre giros y señuelos",icono:"logo-frases-en-giro.svg",estado:"disponible",abrir:contenedor=>FrasesEnGiro.abrir(contenedor),record:()=>FrasesEnGiro.mejorPuntaje()+" puntos"},
  {id:"memoria-en-giro",nombre:"Memoria en Giro",descripcion:"Encontrá los pares antes de que giren",icono:"logo-memoria-en-giro.svg",estado:"disponible",abrir:contenedor=>MemoriaEnGiro.abrir(contenedor),record:()=>MemoriaEnGiro.mejorPuntaje()+" puntos"},
  {id:"rosco-rioplatense",nombre:"El Rosco",descripcion:"Girá, leé la pista y descubrí la palabra",icono:"logo-rosco-rioplatense.svg",estado:ROSCO_HABILITADO?"disponible":"proximamente",abrir:contenedor=>RoscoRioplatense.abrir(contenedor),record:()=>RoscoRioplatense.mejorPuntaje()+" puntos"},
  {id:"silabario-rioplatense",nombre:"Silabario Rioplatense",descripcion:"Armá la respuesta con las sílabas del tablero que gira",icono:"logo-silabario-rioplatense.svg",estado:"disponible",abrir:contenedor=>SilabarioRioplatense.abrir(contenedor),record:()=>SilabarioRioplatense.mejorPuntaje()+" puntos"},
  {id:"cien-rioplatenses",nombre:"100 Rioplatenses Dicen",descripcion:"Girá por un tema y descubrí el panel",icono:"logo-cien-rioplatenses.svg",estado:CIEN_HABILITADO?"disponible":"proximamente",abrir:contenedor=>CienRioplatenses.abrir(contenedor),record:()=>CienRioplatenses.mejorPuntaje()+" puntos"},
  {id:"ahorcado-rioplatense",nombre:"Ahorcado Rioplatense",descripcion:"La ruleta elige la categoría, adiviná la palabra",icono:"logo-ahorcado-rioplatense.svg",estado:AHORCADO_HABILITADO?"disponible":"proximamente",abrir:contenedor=>AhorcadoRioplatense.abrir(contenedor),record:()=>AhorcadoRioplatense.mejorPuntaje()+" puntos"},
  {id:"contra-reloj-rioplatense",grupo:"previa",soloGonzalo:true,/* oculto para todos menos Gonzalo hasta que esté listo (17/10/2026) */nombre:"Contra Reloj",descripcion:"Describí 5 palabras antes de que termine el tiempo · 4+ jugadores",icono:"logo-contra-reloj-rioplatense.svg",estado:"disponible",insignia:"👥 4+",abrir:contenedor=>ContraRelojRioplatense.abrir(contenedor),record:()=>ContraRelojRioplatense.mejorPuntaje()+" puntos"},
  {id:"impostor",grupo:"previa",nombre:"Impostor",descripcion:"Todos tienen la misma palabra… menos uno",icono:"logo-impostor.svg",estado:"disponible",insignia:"👥 3+",abrir:contenedor=>Impostor.abrir(contenedor),record:()=>Impostor.partidasJugadas()+" rondas"},
  {id:"mimica",grupo:"previa",nombre:"Mímica rioplatense",descripcion:"Actuá sin hablar, tu equipo adivina",icono:"assets/mimica/icono.webp",estado:"disponible",insignia:"👥 4+",abrir:contenedor=>Mimica.abrir(contenedor),record:()=>Mimica.partidasJugadas()+" partidas"},
  {id:"canta-la-cancion",grupo:"previa",nombre:"Canta la Canción",descripcion:"Cantá una canción con la palabra antes de que se acabe el tiempo",icono:"assets/canta/icono.webp",estado:"disponible",abrir:contenedor=>CantaLaCancion.abrir(contenedor),record:()=>CantaLaCancion.partidasJugadas()+" partidas"},
  {id:"tutti-frutti",nombre:"Tutti Frutti",descripcion:"Cada uno con su celular: letra al azar y ¡BASTA!",icono:"logo-tutti-frutti.svg",estado:"disponible",abrir:contenedor=>TuttiFrutti.abrir(contenedor),record:()=>TuttiFrutti.partidasJugadas()+" partidas"},
  {id:"quien-soy",grupo:"previa",nombre:"¿Quién soy?",descripcion:"Celular en la frente: adiviná la palabra",icono:"assets/quien-soy/icono.webp",estado:"disponible",abrir:contenedor=>QuienSoy.abrir(contenedor),record:()=>QuienSoy.mejorPuntaje()+" aciertos"},
  {id:"bomba",grupo:"previa",nombre:"Bomba",descripcion:"Decí una palabra y pasala antes de que explote",icono:"assets/bomba/icono.webp",estado:"disponible",abrir:contenedor=>Bomba.abrir(contenedor),record:()=>Bomba.rondasJugadas()+" rondas"},
  {id:"que-numero-soy",grupo:"previa",nombre:"¿Qué número soy?",descripcion:"Número gigante en pantalla completa, sin que se apague",icono:"assets/que-numero-soy/icono.webp",estado:"disponible",abrir:contenedor=>QueNumeroSoy.abrir(contenedor),record:()=>QueNumeroSoy.rondasJugadas()+" rondas"},
  {id:"puzzle",nombre:"Puzzle",descripcion:"Armá rompecabezas de dibujos y ciudades",icono:"logo-puzzle.svg",estado:"disponible",abrir:contenedor=>Puzzle.abrir(contenedor),record:()=>Puzzle.armados()+" armados"},
  {id:"moon-tap",nombre:"Moon Tap",descripcion:"Tocá justo a tiempo y pegale al punto del aro",icono:"logo-moon-tap.webp",estado:"disponible",abrir:contenedor=>MoonTap.abrir(contenedor),record:()=>MoonTap.mejorPuntaje()+" puntos"},
  /* Mahjong Rioplatense (mahjong-rioplatense.html) a propósito oculto del lobby:
     la pantalla de inicio no estaba lista para mostrarse a los jugadores.
     Sigue publicada y accesible por URL directa para que Gonzalo la pruebe;
     sumar de nuevo esta entrada cuando el inicio esté arreglado. */
];
function extensionVisible(ext){
  if(ext.soloUsuarios){let n="";try{n=(perfil&&perfil.nombre||"").trim().toLowerCase();}catch(e){}return ext.soloUsuarios.includes(n);}
  if(!ext.soloGonzalo)return true;
  return typeof esGonzalo==="function"&&esGonzalo();
}
window.EXTENSIONES=EXTENSIONES;
const Extensiones=(()=>{
  let shell=null,contenido=null,vista="";
  function asegurar(){
    if(shell)return;
    shell=document.createElement("section");shell.id="extShell";shell.className="ext-shell";shell.hidden=true;
    shell.innerHTML='<div class="ext-wrap"><header class="ext-header"><button class="ext-atras" id="extAtras" type="button" aria-label="Volver">‹</button><strong id="extTitulo">Extensiones</strong><button class="ext-cerrar" id="extCerrar" type="button" aria-label="Cerrar">✕</button></header><div id="extContenido"></div></div>';
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
  function abrirLobby(){
    if(!EXTENSIONES_HABILITADAS)return;
    salirJuego();
    mostrar();vista="lobby";
    shell.querySelector("#extTitulo").textContent="Extensiones Girá y Adiviná";
    contenido.innerHTML='<div class="ext-hero"><span>✦ MÁS JUEGOS, MÁS DESAFÍOS</span><h2>Extensiones</h2><p>Elegí un juego del universo Girá y Adiviná. Jugá gratis, sin gastar vidas ni monedas.</p></div><h3 class="ext-seccion">🎮 Más juegos</h3><div class="ext-lista" id="extListaResto"></div><h3 class="ext-seccion">🎉 Juegos de previa</h3><div class="ext-lista" id="extListaPrevia"></div>';
    /* "Juegos de previa": los de juntarse en grupo (grupo:"previa") van en su propia sección. */
    const previa=contenido.querySelector("#extListaPrevia"),resto=contenido.querySelector("#extListaResto");
    EXTENSIONES.filter(extensionVisible).forEach(ext=>{
      const lista=ext.grupo==="previa"?previa:resto;
      const b=document.createElement("button");b.type="button";b.className="ext-tarjeta";
      b.disabled=ext.estado!=="disponible";
      const img=document.createElement("img");img.src=ext.icono;img.alt="";img.loading="lazy";
      const txt=document.createElement("span");txt.className="ext-tarjeta-texto";
      const nombre=document.createElement("b");nombre.textContent=ext.nombre;
      const desc=document.createElement("small");desc.textContent=ext.descripcion;
      const record=document.createElement("em");record.textContent=ext.estado==="disponible"?"Mejor: "+ext.record():"Próximamente";
      txt.append(nombre,desc,record);b.append(img,txt);
      if(ext.insignia){const ins=document.createElement("span");ins.className="ext-insignia";ins.textContent=ext.insignia;b.appendChild(ins);}
      if(!b.disabled)b.onclick=()=>abrirJuego(ext.id);
      lista.appendChild(b);
    });
    shell.scrollTop=0;
  }
  function abrirJuego(id){
    if(!EXTENSIONES_HABILITADAS)return;
    const ext=EXTENSIONES.find(x=>x.id===id&&x.estado==="disponible"&&extensionVisible(x));if(!ext)return;
    mostrar();vista=id;contenido.replaceChildren();
    shell.querySelector("#extTitulo").textContent=ext.nombre;
    if(typeof window.anotarUltimoJuego==="function")window.anotarUltimoJuego(ext.nombre);
    ext.abrir(contenido);shell.scrollTop=0;
  }
  function salirJuego(){for(const juego of [window.SopaFugaz,window.RuedaDeLetras,window.PalabraSecreta,window.FrasesEnGiro,window.MemoriaEnGiro,window.RoscoRioplatense,window.SilabarioRioplatense,window.CienRioplatenses,window.AhorcadoRioplatense,window.ContraRelojRioplatense,window.MoonTap,window.Puzzle,window.QueNumeroSoy,window.QuienSoy,window.Bomba,window.Impostor,window.Mimica,window.CantaLaCancion,window.TuttiFrutti])if(juego)juego.salir();}
  function cerrar(){if(!shell)return;salirJuego();shell.hidden=true;document.body.classList.remove("ext-abierta");vista="";if(typeof sincronizarMusica==="function")sincronizarMusica();}
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
