/* Tutti Frutti (Basta):
   - Sala (cada uno con su celular, MQTT "gyatutti/<SALA>", el anfitrión
     manda): a todos les sale la misma letra; completan las categorías una
     por una (tiene que empezar con la letra) y el primero que completa todo
     canta BASTA y gana la ronda. Después se ven las respuestas de todos.
     Invitación: ?tutti=<SALA>&de=<nombre>.
   - Música (assets/audio/tutti-frutti-musica.mp3, Denis Pavlov Music en
     Pixabay) mientras se completan las categorías; se corta con el BASTA.
   Pantalla fija (PantallaFija). Datos en gya_tutti. */
const TuttiFrutti=(()=>{
  const CLAVE="gya_tutti",TIEMPOS=[60,90,120];
  /* Nombre que se MUESTRA de cada categoría (por dentro sigue siendo
     "Animal" y "Famoso", así no se rompen partidas con celulares viejos). */
  const ETIQ={"Animal":"Animal / especie","Famoso":"Famoso / banda"};
  const etiq=c=>ETIQ[c]||c;
  /* Dibujos en assets/tutti/ (hoja de ChatGPT recortada): logo, ficha de la letra, ¡BASTA!, trofeo y un ícono por categoría. */
  const ARTE=n=>"assets/tutti/"+n+".webp";
  const ICONO={"Nombre":"c_nombre","Apellido":"c_apellido","País o ciudad":"c_pais","Comida":"c_comida","Animal":"c_animal","Color":"c_color","Marca":"c_marca","Fruta o verdura":"c_fruta","Cosa":"c_cosa","Profesión":"c_profesion","Famoso":"c_famoso","Película o serie":"c_pelicula"};
  /* Tarjetas ilustradas para elegir categorías (assets/tutti/k_<id>.webp). */
  const tarjeta=c=>ICONO[c]?ARTE("k_"+ICONO[c].slice(2)):"";
  const CATEGORIAS=["Nombre","Apellido","País o ciudad","Comida","Animal","Color","Marca","Fruta o verdura","Cosa","Profesión","Famoso","Película o serie"];
  const LETRAS="ABCDEFGHIJLMNOPRSTUV".split("");
  let bienvPendiente=false;
  let raiz=null,est={cant:3,nombres:[]},tiempo=90,cats=["Nombre","Apellido","País o ciudad","Comida","Animal","Cosa"],partidas=0;
  let total=[],ronda=[],usadas=[],letra="",fin=0,timer=0,jugando=false,basta=false;
  function cargar(){try{const d=JSON.parse(localStorage.getItem(CLAVE));if(d&&typeof d==="object"){est.cant=Math.min(12,Math.max(1,Number(d.cant)||3));est.nombres=Array.isArray(d.nombres)?d.nombres.map(String):[];if(TIEMPOS.includes(d.tiempo))tiempo=d.tiempo;if(Array.isArray(d.cats)&&d.cats.length)cats=d.cats.filter(c=>CATEGORIAS.includes(c));partidas=Number(d.partidas)||0;}}catch(e){}}
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify({cant:est.cant,nombres:est.nombres,tiempo,cats,partidas}));}catch(e){}}
  cargar();
  const q=id=>raiz.querySelector("#"+id);
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
  const nom=i=>PantallaFija.nombreJugador(est,i);
  function abrir(contenedor){salir();cargar();cargarAprobadas();["ficha","basta","trofeo","como"].forEach(n=>{const i=new Image();i.src=ARTE(n);});raiz=document.createElement("section");raiz.className="tf";contenedor.appendChild(raiz);bienvPendiente=true;configurar();}
  /* Nombre corto en la tarjeta (entra en una línea aunque la tarjeta sea chica). */
  const CORTO={"País o ciudad":"País / ciudad","Animal":"Animal","Fruta o verdura":"Fruta/verdura","Famoso":"Famoso","Película o serie":"Peli / serie"};
  const ajustesHtml=(extra="")=>`<div class="tf-cab"><div class="qs-sub">🗂️ Categorías · <b id="tfCuenta"></b></div>${extra}</div>
      <div class="tf-tarjetas" id="tfCats">${CATEGORIAS.map(c=>`<button type="button" class="tf-tarjeta" data-c="${esc(c)}" style="background-image:url(${tarjeta(c)})" aria-label="${esc(etiq(c))}"><i>✓</i><span>${esc(CORTO[c]||etiq(c))}</span></button>`).join("")}</div>
      <div class="tf-tiempo"><div class="qs-sub">⏱️ Tiempo</div><div class="qns-rangos" id="tfT">${TIEMPOS.map(t=>`<button type="button" data-v="${t}">${t} s</button>`).join("")}</div></div>`;
  function ajustesEventos(){
    const pintar=()=>{raiz.querySelectorAll("#tfT button").forEach(b=>b.classList.toggle("activo",Number(b.dataset.v)===tiempo));raiz.querySelectorAll("#tfCats button").forEach(b=>b.classList.toggle("tf-on",cats.includes(b.dataset.c)));const n=q("tfCuenta");if(n)n.textContent=cats.length+" de "+CATEGORIAS.length;};pintar();
    const avisar=()=>{if(on&&on.host){on.cats=cats.slice();on.tiempo=tiempo;difundirSala();}};
    q("tfT").onclick=e=>{const b=e.target.closest("button[data-v]");if(b){tiempo=Number(b.dataset.v);guardar();pintar();avisar();}};
    q("tfCats").onclick=e=>{const b=e.target.closest("button[data-c]");if(!b)return;const c=b.dataset.c;if(cats.includes(c)){if(cats.length>3)cats=cats.filter(x=>x!==c);}else cats=CATEGORIAS.filter(x=>x===c||cats.includes(x));guardar();pintar();avisar();};
  }
  /* Música mientras se escribe (respeta el botón de música del juego). */
  let audioMusica=null;
  function iniciarMusica(){
    try{if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
      if(!audioMusica){audioMusica=new Audio("assets/audio/tutti-frutti-musica.mp3");audioMusica.loop=true;audioMusica.volume=.28;}
      if(audioMusica.paused)audioMusica.play().catch(()=>{});}catch(e){}
  }
  function detenerMusica(){try{if(audioMusica)audioMusica.pause();}catch(e){}}
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){detenerMusica();if(micActivo){pararMicrofono();micAviso="Micrófono pausado. Tocá Activar micrófono para reanudar.";}}
    else if(raiz&&on&&on.fase==="jugando"&&on.fin){
      iniciarMusica();const msg=q("tfMsg");if(msg&&micAviso){msg.textContent=micAviso;micAviso="";}
    }
    salidaJuego();
  });
  /* Salir de la app en plena ronda (por ej. a buscar en internet): se avisa a
     todos con un aviso chico. A la 3ª salida en la misma ronda, ese jugador
     pierde los puntos de la ronda. Contra bots no cuenta. El aviso se manda al
     salir y se repite al volver (por si el celu cortó la conexión al salir). */
  const SALIDAS_MAX=3;
  const salidasDe=pid=>(on&&on.salidas&&on.salidas[pid])||0;
  const penalizado=pid=>salidasDe(pid)>=SALIDAS_MAX;
  function salidaJuego(){
    if(!raiz||!on||on.bots)return;
    on.salidas=on.salidas||{};
    if(document.hidden){
      if(on.fase!=="jugando"||on.basta)return;
      on.salidas[on.pid]=salidasDe(on.pid)+1;on.salidaPend=on.n;
      mandar({t:"salio",n:on.n,c:salidasDe(on.pid)});
      return;
    }
    /* Al volver: al salir de la app el celu suele cortar la conexión y ese
       aviso se pierde, así que se manda de nuevo varias veces (aunque la
       ronda ya haya terminado); los demás no lo cuentan dos veces. */
    if(on.salidaPend!==on.n)return;
    on.salidaPend=null;const mio=on,n=on.n,c=salidasDe(on.pid);
    [0,1500,4000,8000,15000].forEach(ms=>on.timers.push(setTimeout(()=>{if(on===mio&&on.n===n)mandar({t:"salio",n,c});},ms)));
  }
  function configurar(){
    detenerMusica();parar();cerrarSala();PantallaFija.desactivar();
    raiz.innerHTML=`<div class="mg-panel imp-panel tf-config">
      ${ajustesHtml(`<button type="button" class="tf-ayuda-btn" id="tfAyudaBtn">❓ Cómo se juega</button>`)}
      <div id="tfZona"><button type="button" class="mg-principal" id="tfBots">🌐 Jugar online</button>
      <div class="tf-unirse"><button type="button" class="mg-principal tf-sec" id="tfCrear">📱 Crear sala</button><input id="tfCodigo" maxlength="4" placeholder="CÓDIGO" autocomplete="off" autocapitalize="characters"><button type="button" id="tfUnirse">🔑 Unirme</button></div>
      <p class="imp-ayuda" id="tfEstado" role="status"></p></div></div>
      <div class="tf-bienv" id="tfBienvenida" hidden><div class="tf-bienv-caja mg-panel"><button type="button" class="tf-bienv-x" id="tfBienvX" aria-label="Cerrar">✕</button>
        <img class="tf-bienv-logo" src="${ARTE("logo")}" alt="Tutti Frutti" draggable="false">
        <div class="tf-bienv-dibujo"><img src="${ARTE("como")}" alt="" draggable="false"><b>${LETRAS[Math.floor(Math.random()*LETRAS.length)]}</b></div>
        <ul><li><span>🔤</span><em>Sale una <b>letra</b> y todos completan las categorías con palabras que empiecen con esa letra.</em></li>
        <li><span>📣</span><em>El primero que completa todo canta <b>¡BASTA!</b> y se corta la ronda para todos.</em></li>
        <li><span>⭐</span><em>Puntos: <b>10</b> si tu palabra es única, <b>5</b> si alguien puso la misma y <b>20</b> si sos el único que completó esa categoría.</em></li>
        <li><span>🏆</span><em>Se juegan <b>3 rondas</b>: gana el que gana más rondas.</em></li></ul>
        <button type="button" class="mg-principal" id="tfBienvOk">¡A jugar!</button></div></div>`;
    ajustesEventos();
    { const bienv=q("tfBienvenida"),cerrar=()=>{bienv.hidden=true;PantallaFija.entrar({completa:false});};
      q("tfBienvOk").onclick=cerrar;q("tfBienvX").onclick=cerrar;bienv.onclick=e=>{if(e.target===bienv)cerrar();};
      q("tfAyudaBtn").onclick=()=>{bienv.hidden=false;};
      /* Sale siempre al entrar al juego (no al volver de una partida). La
         pantalla completa se pide al cerrarlo: así el aviso de Chrome
         ("Para salir de la pantalla completa…") no tapa el botón ¡A jugar!. */
      if(bienvPendiente){bienvPendiente=false;bienv.hidden=false;}else PantallaFija.entrar({completa:false}); }
    q("tfCrear").onclick=crearSala;
    q("tfBots").onclick=elegirModoOnline;
    q("tfUnirse").onclick=()=>{const c=(q("tfCodigo").value||"").toUpperCase().trim();if(/^[A-HJ-NP-Z2-9]{4}$/.test(c))unirse(c);else estado("Escribí el código de 4 letras que te pasaron.");};
  }
  function estado(t){const e=raiz&&raiz.querySelector("#tfEstado");if(e)e.textContent=t;}
  function pantalla(html){raiz.innerHTML=`<div class="qns-pantalla imp-juego"><button type="button" class="pf-salir" id="tfSalir">✕ Salir</button>${html}</div>`;PantallaFija.confirmar(q("tfSalir"),configurar);actualizarChat();ajustarVV();}
  /* En horizontal táctil usamos teclado integrado solo durante la ronda.
     En vertical (y con teclado físico en escritorio) el input es normal. */
  const tecladoHorizontal=()=>window.matchMedia("(orientation: landscape) and (min-width:600px) and (max-width:1024px) and (max-height:600px)").matches
    &&(window.matchMedia("(pointer: coarse)").matches||navigator.maxTouchPoints>0);
  let micActivo=false,micPidiendo=false,micEscuchando=false,micStream=null,micRecon=null,micReinicio=null,micToken=0,micInicioPendiente=false,micAviso="",micReiniciosCortos=0;
  function pintarMicrofono(){
    const boton=raiz&&q("tfMic");if(!boton)return;
    boton.classList.toggle("tf-mic-activo",micActivo);
    boton.setAttribute("aria-pressed",String(micActivo));
    boton.disabled=micPidiendo;
    boton.textContent=micPidiendo?"🎙️ Permiso…":!micActivo?"🎙️ Activar micrófono":q("tfRev")&&!q("tfRev").hidden?"🎙️ Decí ¡BASTA!":micEscuchando?"🎙️ Escuchando…":"🎙️ Conectando…";
  }
  function pararMicrofono(reanudarMusica=false){
    micActivo=false;micPidiendo=false;micEscuchando=false;micInicioPendiente=false;micToken++;
    clearTimeout(micReinicio);micReinicio=null;
    const r=micRecon;micRecon=null;
    if(r){r.onend=null;r.onerror=null;r.onresult=null;try{r.abort();}catch(e){}}
    if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null;}
    pintarMicrofono();
    if(reanudarMusica&&on&&on.fase==="jugando"&&!on.basta)iniciarMusica();
  }
  function escucharMicrofono(){
    if(!micActivo||!on||on.fase!=="jugando"||on.basta||!q("tfInput")||document.hidden)return;
    const Recon=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recon){pararMicrofono(true);micAviso="Este navegador no admite respuestas por voz.";const msg=q("tfMsg");if(msg)msg.textContent=micAviso;return;}
    let r;try{r=new Recon();}catch(e){pararMicrofono(true);micAviso="No pude abrir el reconocimiento de voz. Usá el teclado o tocá Activar micrófono para reintentar.";const msg=q("tfMsg");if(msg)msg.textContent=micAviso;return;}
    const token=micToken,inicio=performance.now();micRecon=r;
    r.lang="es-UY";r.continuous=true;r.interimResults=true;r.maxAlternatives=4;
    r.onstart=()=>{if(micRecon!==r||!micActivo)return;micEscuchando=true;pintarMicrofono();const msg=q("tfMsg");if(msg&&!msg.textContent)msg.textContent="Escuchando. Decí una palabra con "+on.letra+".";};
    r.onresult=e=>{
      if(!micActivo||micRecon!==r||token!==micToken||!q("tfInput"))return;
      micEscuchando=true;pintarMicrofono();
      micReiniciosCortos=0;
      for(let i=e.resultIndex||0;i<e.results.length;i++){
        const resultado=e.results[i],opciones=Array.from(resultado||[]).map(x=>String(x.transcript||"").trim().replace(/[¿¡!?,.;:]+$/g,"")).filter(Boolean);
        if(!opciones.length)continue;
        if(!resultado.isFinal){if(!q("tfEdit")?.hidden){q("tfInput").value=opciones[0].slice(0,30);q("tfMsg").textContent="Escuchando: «"+opciones[0]+"»";}continue;}
        const frase=opciones.find(v=>valida(v))||opciones[0],orden=N(frase);
        if(orden==="SIGUIENTE"){confirmarCampo();continue;}
        if(orden==="ANTERIOR"){q("tfAnt")?.click();continue;}
        if(orden==="BASTA"){q("tfBasta")?.click();continue;}
        if(q("tfEdit")?.hidden)continue;
        q("tfInput").value=frase.slice(0,30);
        if(!valida(frase)){q("tfMsg").textContent="Escuché «"+frase+"». Tiene que empezar con "+on.letra+". Probá de nuevo.";continue;}
        const categoria=on.pend?.[0];confirmarCampo();
        if(on.fase==="jugando"&&on.pend?.[0]!==categoria){
          const msg=q("tfMsg");if(msg)msg.textContent="✅ «"+frase.slice(0,30)+"» guardado. Decí la próxima palabra.";
          pintarMicrofono();
        }
      }
    };
    r.onerror=e=>{if(micRecon!==r||!micActivo)return;
      if(["not-allowed","service-not-allowed","audio-capture","language-not-supported","network"].includes(e.error)){
        pararMicrofono(true);micAviso="No pude usar el micrófono ("+e.error+"). Revisá el permiso o la conexión y tocá Activar micrófono.";
        const msg=q("tfMsg");if(msg)msg.textContent=micAviso;
      }else if(e.error==="no-speech"){const msg=q("tfMsg");if(msg)msg.textContent="No te escuché. Acercate al micrófono y repetí la palabra.";}
    };
    r.onend=()=>{if(micRecon!==r)return;micRecon=null;micEscuchando=false;pintarMicrofono();
      if(micActivo&&token===micToken&&on&&on.fase==="jugando"&&!on.basta){
        micReiniciosCortos=performance.now()-inicio<1200?Math.min(micReiniciosCortos+1,3):0;
        clearTimeout(micReinicio);micReinicio=setTimeout(escucharMicrofono,400+micReiniciosCortos*350);
      }
    };
    try{r.start();}catch(e){micRecon=null;pararMicrofono(true);micAviso="No pude iniciar el micrófono. Tocá Activar micrófono para reintentar.";const msg=q("tfMsg");if(msg)msg.textContent=micAviso;}
  }
  async function activarMicrofono(antesDelSorteo=false){
    if(micActivo||micPidiendo)return micActivo;
    if(!(window.SpeechRecognition||window.webkitSpeechRecognition)){
      micAviso="Este navegador no permite usar el micrófono. Podés escribir con el teclado.";
      const msg=q("tfMsg");if(msg)msg.textContent=micAviso;return false;
    }
    micPidiendo=true;micAviso="";micEscuchando=false;micReiniciosCortos=0;pintarMicrofono();const token=++micToken;
    try{
      let stream=null;
      if(navigator.mediaDevices?.getUserMedia){
        try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});}
        catch(e){if(e?.name==="NotAllowedError"||e?.name==="PermissionDeniedError")throw e;}
      }
      if(token!==micToken||!on||on.fase!=="jugando"||on.basta||!tecladoHorizontal()){
        if(stream)stream.getTracks().forEach(t=>t.stop());return false;
      }
      micStream=stream;micActivo=true;micPidiendo=false;micInicioPendiente=antesDelSorteo;
      detenerMusica();pintarMicrofono();
      if(!antesDelSorteo)escucharMicrofono();
      return true;
    }catch(e){
      if(token!==micToken)return false;
      micPidiendo=false;micAviso="No se pudo activar el micrófono. Permitilo en Chrome o en la app y tocá Activar micrófono.";
      pintarMicrofono();const msg=q("tfMsg");if(msg)msg.textContent=micAviso;return false;
    }
  }
  function sincronizarTeclado(){
    const pantalla=raiz?.querySelector(".qns-pantalla"),inp=raiz?.querySelector("#tfInput"),teclado=raiz?.querySelector("#tfTeclado");
    if(!pantalla||!inp||!teclado)return;
    const horizontal=tecladoHorizontal();
    pantalla.classList.toggle("tf-teclado-propio",horizontal);
    inp.readOnly=horizontal;inp.inputMode=horizontal?"none":"text";
    if(horizontal&&document.activeElement===inp)inp.blur();
    if(!horizontal&&micActivo)pararMicrofono(true);
  }
  function crearTeclado(){
    const panel=q("tfTeclado");if(!panel)return;
    panel.replaceChildren();
    for(const letras of ["QWERTYUIOP","ASDFGHJKLÑ","ZXCVBNM"]){
      const fila=document.createElement("div");fila.className="tf-teclas-fila";
      for(const letra of letras){
        const boton=document.createElement("button");boton.type="button";boton.className="tf-tecla";boton.textContent=letra;
        boton.setAttribute("aria-label","Escribir "+letra);boton.onclick=()=>editarConTeclado(letra);
        fila.appendChild(boton);
      }
      panel.appendChild(fila);
    }
    const ultima=document.createElement("div");ultima.className="tf-teclas-fila tf-teclas-acciones";
    for(const [texto,accion,clase] of [["Espacio"," ","tf-espacio"],["⌫ Borrar","borrar","tf-borrar"]]){
      const boton=document.createElement("button");boton.type="button";boton.className="tf-tecla "+clase;
      boton.textContent=texto;boton.onclick=()=>editarConTeclado(accion);ultima.appendChild(boton);
    }
    panel.appendChild(ultima);
  }
  function editarConTeclado(tecla){
    const inp=q("tfInput");if(!inp||!on||on.fase!=="jugando"||!q("tfEdit")||q("tfEdit").hidden)return;
    let val=inp.value||"";
    if(tecla==="borrar")val=val.slice(0,-1);
    else if(val.length<30)val+=tecla;
    inp.value=val;inp.dispatchEvent(new Event("input",{bubbles:true}));
    const msg=q("tfMsg");if(msg)msg.textContent="";
  }
  /* El alto visible excluye el teclado nativo, por si se usa uno en vertical.
     No se mueve el campo hacia fuera de la pantalla al girar. */
  function ajustarVV(){
    const el=raiz&&raiz.querySelector(".qns-pantalla"),vv=window.visualViewport;
    if(el&&vv){el.style.top=Math.max(0,Math.round(vv.offsetTop))+"px";el.style.height=Math.round(vv.height)+"px";el.style.bottom="auto";}
    sincronizarTeclado();
  }
  if(window.visualViewport){visualViewport.addEventListener("resize",ajustarVV);visualViewport.addEventListener("scroll",ajustarVV);}
  window.addEventListener("resize",ajustarVV);window.addEventListener("orientationchange",ajustarVV);
  function parar(){jugando=false;clearTimeout(timer);pararMicrofono();}
  function salir(){document.querySelectorAll(".tf-modos").forEach(x=>x.remove());if(typeof cerrarApelaciones==="function")cerrarApelaciones();detenerMusica();parar();cerrarSala();if(raiz)PantallaFija.salir();if(raiz)raiz.remove();raiz=null;}
  /* ===== Control de respuestas =====
     Listas propias (tutti-frutti-datos.js) para Nombre, Apellido, Lugar, Animal,
     Color, Fruta, Comida y Profesión; Wikipedia para Famoso, Marca y Película;
     diccionario por letra (assets/diccionario/es-<l>.txt) para Cosa y como
     respaldo. Nunca rechaza: marca ✓ o ⚠️ y al final se vota. */
  /* Sin tildes ni diéresis y con la ñ como n: "Rodríguez" = "Rodriguez",
     "Niño" = "Nino". Así los acentos nunca hacen perder una respuesta.
     El apóstrofo se ignora: "Greys Anatomy" = "Grey's Anatomy". */
  const NORM=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/['’´`]/g,"").replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
  /* Palabras aprobadas por Gonzalo desde el juego: cuando él les sube
     puntos con el sumador, quedan válidas para todos en las próximas
     partidas (gya_ranking grupo "tutti_aprobadas", apodo "Categoría|palabra").
     Se guardan también en el celular por si no hay internet. */
  const APROB="tutti_aprobadas";
  let aprobadas=new Set();try{aprobadas=new Set(JSON.parse(localStorage.getItem("gya_tf_aprobadas")||"[]"));}catch(e){}
  const claveAprob=(cat,v)=>cat+"|"+NORM(v);
  const aprobada=(cat,v)=>aprobadas.has(claveAprob(cat,v));
  async function cargarAprobadas(){
    try{const supa=typeof obtenerSupa==="function"?obtenerSupa():null;if(!supa)return;
      const r=await supa.from("gya_ranking").select("apodo").eq("grupo",APROB).limit(5000);
      if(r&&r.data){r.data.forEach(x=>aprobadas.add(String(x.apodo)));try{localStorage.setItem("gya_tf_aprobadas",JSON.stringify([...aprobadas]));}catch(e){}}
    }catch(e){}
  }
  async function aprobarPalabra(cat,palabra){
    const k=claveAprob(cat,palabra);if(!NORM(palabra)||aprobadas.has(k))return;
    aprobadas.add(k);try{localStorage.setItem("gya_tf_aprobadas",JSON.stringify([...aprobadas]));}catch(e){}
    try{const supa=typeof obtenerSupa==="function"?obtenerSupa():null;if(!supa)return;
      await supa.from("gya_ranking").upsert({grupo:APROB,apodo:k.slice(0,90),monedas_totales:0,ciudades_ganadas:0,mejor_racha:0,logros:0,
        estado_juego:{cat,palabra:String(palabra).trim().slice(0,40),t:new Date().toISOString()},actualizado_en:new Date().toISOString()},{onConflict:"grupo,apodo"});}catch(e){}
  }
  const CLAVE_CAT={"Nombre":"nombre","Apellido":"apellido","País o ciudad":"lugar","Animal":"animal","Color":"color","Fruta o verdura":"fruta","Comida":"comida","Profesión":"profesion","Famoso":"wiki","Película o serie":"wiki","Marca":"wiki","Cosa":"dic"};
  const sets={},dics={},cacheWiki=new Map();
  function setDe(k){if(!sets[k]){const t=(window.TUTTI_LISTAS||{})[k]||"";sets[k]=new Set(t.split(",").map(NORM).filter(Boolean));}return sets[k];}
  const variantes=v=>{const sinArt=v.replace(/^(el|la|los|las|un|una) /,"");const out=new Set([v,sinArt]);[v,sinArt].forEach(x=>{if(x.endsWith("es"))out.add(x.slice(0,-2));if(x.endsWith("s"))out.add(x.slice(0,-1));out.add(x.split(" ")[0]);});[...out].forEach(x=>{/* femenino → masculino: abogada→abogado, doctora→doctor, gata→gato */if(x.endsWith("a")){out.add(x.slice(0,-1)+"o");out.add(x.slice(0,-1));}});return[...out].filter(Boolean);};
  function cargarDic(l){
    l=NORM(l)[0];if(!l)return Promise.resolve(null);
    if(dics[l])return dics[l];
    dics[l]=fetch("assets/diccionario/es-"+l+".txt").then(r=>r.ok?r.text():"").then(t=>new Set(t.split("\n").map(NORM))).catch(()=>null);
    return dics[l];
  }
  async function enDiccionario(v){const d=await cargarDic(v);if(!d||!d.size)return null;return variantes(v).some(x=>d.has(x))||v.split(" ").every(w=>w.length<3||d.has(w));}
  async function enWikipedia(v,estricto,q){
    q=q||v;const ck=(estricto?"!":"")+q;if(cacheWiki.has(ck))return cacheWiki.get(ck);
    const pr=(async()=>{try{
      const ctrl=typeof AbortController!=="undefined"?new AbortController():null;const t=setTimeout(()=>ctrl&&ctrl.abort(),4500);
      const r=await fetch("https://es.wikipedia.org/w/api.php?action=opensearch&limit=8&namespace=0&format=json&origin=*&search="+encodeURIComponent(q),ctrl?{signal:ctrl.signal}:{});
      clearTimeout(t);const d=await r.json();const titulos=(d&&d[1])||[];
      return titulos.some(x=>{const n=NORM(x);return n===v||n.startsWith(v+" ")||(!estricto&&n.startsWith(v));});
    }catch(e){return null;}})();
    cacheWiki.set(ck,pr);return pr;
  }
  /* Wikipedia con control de tipo: además de que exista la página, el
     resumen tiene que decir qué es (persona, marca, película, animal…).
     Así "Nene" no pasa como marca, "Nuria" (nombre de pila) no pasa como
     famoso y "Nuca" no pasa como animal. Para famosos vale el apellido solo
     ("Messi" → "Lionel Messi") pero no el nombre de pila solo. */
  const TIPOS={
    famoso:/\b(actor|actriz|cantante|cantautor|cantautora|futbolista|jugador|jugadora|politico|politica|escritor|escritora|poeta|poetisa|musico|compositor|compositora|presidente|presidenta|presentador|presentadora|conductor|conductora|periodista|modelo|deportista|tenista|boxeador|boxeadora|pintor|pintora|cientifico|cientifica|influencer|youtuber|streamer|comediante|humorista|director|directora|rapero|rapera|bailarin|bailarina|piloto|empresario|empresaria|banda|grupo musical|duo|atleta|nadador|nadadora|ciclista|basquetbolista|rey|reina|principe|princesa|militar|filosofo|filosofa|inventor|astronauta|dibujante|historietista|productor|productora|disc jockey|dj|murguista|payador)\b/,
    marca:/\b(empresa|marca|compania|fabricante|multinacional|cadena de|corporacion|tienda|supermercado|supermercados|automoviles|automotriz|bebida|refresco|cerveza|gaseosa|aerolinea|banco|red social|videojuego|videojuegos|software|consola|sitio web|plataforma|golosina|chocolate|galletitas|fabrica|comercializa|productos)\b/,
    pelicula:/\b(pelicula|serie|telenovela|film|filme|largometraje|cortometraje|animacion|animada|programa de television|programa televisivo|miniserie|anime|documental|saga|sitcom|reality|dibujos animados)\b/,
    animal:/\b(especie|especies|genero|familia|animal|animales|ave|aves|mamifero|mamiferos|pez|peces|reptil|reptiles|insecto|insectos|anfibio|anfibios|aracnido|aracnidos|molusco|moluscos|crustaceo|crustaceos|felino|felinos|canido|roedor|roedores|primate|primates|cetaceo|serpiente|serpientes|artropodo|marsupial|vertebrado|invertebrado|raza)\b/,
    comida:/\b(plato|comida|alimento|alimentos|fruta|fruto|planta|hortaliza|verdura|legumbre|postre|dulce|preparacion|receta|gastronomia|culinaria|culinario|pan|queso|salsa|sopa|guiso|embutido|carne|pescado|condimento|especia|cereal|tuberculo|golosina|torta|pastel|galleta|masa)\b/,
    fruta:/\b(fruta|fruto|frutos|planta|plantas|hortaliza|verdura|legumbre|tuberculo|especie|genero|arbol|arbusto|baya|citrico|vegetal|bulbo)\b/,
    color:/\b(color|colores|tono|tonalidad|pigmento|matiz)\b/,
    nombre:/\b(nombre (propio|de pila|masculino|femenino)|antroponimo|hipocoristico)\b/,
    lugar:/\b(ciudad|pais|localidad|municipio|capital|provincia|departamento|region|pueblo|villa|barrio|estado|isla|continente|comuna|distrito|condado|aldea|poblacion|balneario|parroquia|nacion|republica|reino|metropoli)\b/,
    profesion:/\b(profesion|oficio|ocupacion|trabajador|trabajadora|persona que|profesional|especialista|tecnico|empleo|cargo|se dedica)\b/};
  const TIPO_CAT={"Famoso":"famoso","Marca":"marca","Película o serie":"pelicula"};
  async function pedirWiki(url){
    const ctrl=typeof AbortController!=="undefined"?new AbortController():null;const t=setTimeout(()=>ctrl&&ctrl.abort(),4500);
    try{const r=await fetch(url,ctrl?{signal:ctrl.signal}:{});return await r.json();}finally{clearTimeout(t);}
  }
  const API="https://es.wikipedia.org/w/api.php?format=json&origin=*&";
  async function enWikiTipo(v,tipo,q){
    q=q||v;const ck=tipo+":"+q;if(cacheWiki.has(ck))return cacheWiki.get(ck);
    const pr=(async()=>{try{
      const o=await pedirWiki(API+"action=opensearch&limit=10&namespace=0&search="+encodeURIComponent(q));
      const sing=v.endsWith("s")?v.slice(0,-1):v;
      /* Plurales sueltos no la hacen perder: "Domingos en familia" = "Domingo en familia". */
      const sinS=t=>t.split(" ").map(w=>w.length>3?w.replace(/s$/,""):w).join(" ");
      const sirve=x=>{const n=NORM(x);return sinS(n)===sinS(v)||[v,sing].some(w=>n===w||n.startsWith(w+" ")&&/\(/.test(x)&&NORM(x.split("(")[0])===w)||(tipo==="famoso"&&n.endsWith(" "+v))||(tipo==="pelicula"&&n.startsWith(v+" "));};
      /* El título tal cual también, por si es una redirección ("Messi" → "Lionel Messi"). */
      const titulos=[...new Set([q,v].map(t=>t.replace(/(^|\s)\S/g,c=>c.toUpperCase())))].concat(((o&&o[1])||[]).filter(sirve)).slice(0,8);
      const d=await pedirWiki(API+"action=query&redirects=1&prop=extracts|description&exintro=1&explaintext=1&exchars=500&titles="+encodeURIComponent(titulos.join("|")));
      const pags=Object.values((d&&d.query&&d.query.pages)||{}).filter(p=>!("missing" in p));
      const re=TIPOS[tipo];
      return pags.some(p=>{const raw=(p.description||"")+" "+(p.extract||"");if(/puede referirse a|desambiguaci/i.test(raw)&&!re.test(NORM(p.description||"")))return (tipo==="famoso"&&v.includes(" ")||tipo==="nombre"||tipo==="lugar")&&re.test(NORM(p.extract||""));
        /* (Nombre y apellido con varias personas, ej. "Carlos Núñez": alcanza con que sean famosos.) */
        if(tipo==="famoso"&&/\bes un nombre (propio|de pila)\b/.test(NORM(raw)))return false;
        /* Personajes de ficción (dibujitos, películas, series, historietas)
           no son famosos: "Correcaminos" va en Película o serie. */
        if(tipo==="famoso"&&/\b(personaje (ficticio|de ficcion|animado|de (los )?dibujos( animados)?|de animacion|de (la |una )?(serie|pelicula|historieta|tira|comic|caricatura)|de (los )?videojuegos?|de looney tunes|de disney)|dibujos animados)\b/.test(NORM(raw)))return false;
        return re.test(NORM(raw))||(tipo==="famoso"&&/\([^)]*\b\d{3,4}\b[^)]*\)\s*(es|fue)\b/.test(raw));});
    }catch(e){return null;}})();
    cacheWiki.set(ck,pr);return pr;
  }
  /* Apellidos poco comunes: alguien en Wikipedia que lo tenga como apellido
     ("Negreiro" → "Fulano Negreiro"). */
  async function apellidoEnWiki(v,q){
    q=q||v;const ck="ap:"+q;if(cacheWiki.has(ck))return cacheWiki.get(ck);
    const pr=(async()=>{try{
      const d=await pedirWiki(API+"action=query&list=search&srlimit=30&srnamespace=0&srsearch="+encodeURIComponent('intitle:"'+q+'"'));
      return ((d&&d.query&&d.query.search)||[]).some(r=>{const w=NORM(r.title.split("(")[0]).split(" ");return w.indexOf(v)>0||w.indexOf(v+"s")>0;});
    }catch(e){return null;}})();
    cacheWiki.set(ck,pr);return pr;
  }
  /* Devuelve true (✓), false (⚠️) o null (no se pudo revisar). */
  async function revisar(cat,valor){
    const v=NORM(valor);if(!v)return null;
    const k=CLAVE_CAT[cat];
    /* Para buscar en Wikipedia se usa lo escrito con su ñ y tildes: "Nunez" no
       encuentra "Carlos Núñez" (la ñ no es una n para el buscador). */
    const q=String(valor).toLowerCase().replace(/[^\p{L}\p{N} ]+/gu," ").replace(/\s+/g," ").trim()||v;
    if(cat==="Famoso"&&COMUNES.has(v))return false;
    if(aprobada(cat,v))return true;
    if(cat==="Marca"&&marcasSet().has(v))return true;
    if(cat==="Famoso"&&famSet().has(v))return true;
    if(cat==="Película o serie"&&(pelisSet().has(v)||pelisSet().has(v.replace(/^(el|la|los|las) /,""))))return true;
    if(cat==="Cosa"&&String(window.TUTTI_COSAS||"").split(",").some(x=>NORM(x)===v))return true;
    /* Lo que usan los bots siempre es válido (si no, un bot "perdía" por una
       falla de internet al revisar, como pasó con Nestlé). */
    if(k==="wiki"||k==="dic"){const B=window.TUTTI_BOTS||{},l=cat==="Famoso"?B.famoso:cat==="Marca"?B.marca:cat==="Cosa"?B.cosa:B.pelicula;if(String(l||"").split(",").some(x=>NORM(x)===v))return true;}
    if(k==="wiki"){const w=await enWikiTipo(v,TIPO_CAT[cat],q);return w===null?enWikipedia(v,false,q):w;}
    if(k==="dic")return enDiccionario(v);
    if(k&&variantes(v).some(x=>setDe(k).has(x)))return true;
    /* Comida también acepta frutas y verduras (palta, papa, banana…). */
    if(k==="comida"&&variantes(v).some(x=>setDe("fruta").has(x)))return true;
    /* No está en la lista: antes de marcarla mal, se busca afuera.
       Nombres, apellidos y lugares → Wikipedia (título igual o que empiece
       con la palabra, ej. "Oriana", "Esquivel (apellido)", "Orlando").
       Comidas, animales, colores, frutas y profesiones → Wikipedia con tipo
       (sin internet, el diccionario). */
    /* Nombre y lugar: Wikipedia tiene que decir que es un nombre propio o un
       lugar (antes valía cualquier página: "González" pasaba como nombre). Un
       apellido de la lista no vale como nombre. */
    if(k==="nombre"&&setDe("apellido").has(v))return false;
    if(k==="nombre"||k==="lugar"){const w=await enWikiTipo(v,k,q);return w===null?true:w;}
    if(k==="apellido"){const w=await enWikipedia(v,true,q);if(w)return true;const a=await apellidoEnWiki(v,q);return a===null?w===null:a;}
    /* Animal, comida, fruta, color y profesión: Wikipedia tiene que decir
       que es eso (si no hay internet, se usa el diccionario como antes). */
    if(k){const w=await enWikiTipo(v,k,q);if(w!==null)return w;const d=await enDiccionario(v);return d===null?false:d;}
    return false;
  }
  /* Lo que está en las listas propias vale siempre, aunque el anfitrión tenga
     una versión vieja del juego (pasó con Enxuta/Columbia: las marcas las
     manda el anfitrión y si su celular no se había actualizado, salían ⚠️). */
  function enListaPropia(cat,valor){
    const v=NORM(valor),k=CLAVE_CAT[cat];if(!v)return false;
    if(aprobada(cat,v))return true;
    if(cat==="Marca"&&marcasSet().has(v))return true;
    if(cat==="Famoso"&&famSet().has(v))return true;
    if(cat==="Película o serie"&&(pelisSet().has(v)||pelisSet().has(v.replace(/^(el|la|los|las) /,""))))return true;
    if(cat==="Cosa"&&String(window.TUTTI_COSAS||"").split(",").some(x=>NORM(x)===v))return true;
    if(k==="wiki"||k==="dic"){const B=window.TUTTI_BOTS||{},l=cat==="Famoso"?B.famoso:cat==="Marca"?B.marca:cat==="Cosa"?B.cosa:B.pelicula;return String(l||"").split(",").some(x=>NORM(x)===v);}
    return !!k&&(variantes(v).some(x=>setDe(k).has(x))||(k==="comida"&&variantes(v).some(x=>setDe("fruta").has(x))));
  }
  function reforzarMarcas(){
    if(!on||!on.marcas)return;
    Object.keys(on.resps||{}).forEach(a=>{const r=on.resps[a]||[],mk=on.marcas[a]=on.marcas[a]||[];on.cats.forEach((c,i)=>{if(r[i]&&!mk[i]&&enListaPropia(c,r[i]))mk[i]=true;});});
  }
  const NOM_CAT={"Nombre":"nombre","Apellido":"apellido","País o ciudad":"país o ciudad","Animal":"animal o especie","Color":"color","Fruta o verdura":"fruta o verdura","Comida":"comida","Profesión":"profesión","Famoso":"famoso o banda","Película o serie":"película o serie","Marca":"marca","Cosa":"cosa"};

  /* ======================= SALA (cada uno con su celular) ======================= */
  const CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",MAXJ=10,RONDAS=3;
  const N=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().trim();
  let on=null;/* {cli,sala,host,pid,jug:[{pid,nombre}],ganadas:{},usadas:[],n,letra,cats,tiempo,fase,resps:{},ganador,timers} */
  const yo=()=>((typeof perfil!=="undefined"&&perfil&&perfil.nombre)||"Jugador").slice(0,14);
  function tema(){return "gyatutti/"+on.sala;}
  function mandar(m){m.pid=on.pid;try{on.cli&&on.cli.connected&&on.cli.publish(tema(),JSON.stringify(m));}catch(e){}manejar(m);}
  function nuevaSala(host,sala){
    cerrarSala();
    on={cli:null,sala,host,pid:Math.random().toString(36).slice(2,10),jug:[],ganadas:{},usadas:[],n:0,letra:"",cats:cats.slice(),tiempo,fase:"lobby",resps:{},ganador:null,basta:null,timers:[]};
    if(host)on.jug=[{pid:on.pid,nombre:yo()}];
  }
  function conectarSala(listo){
    const mio=on;if(!mio)return;
    const reintentar=v=>{const b=raiz&&raiz.querySelector("#tfReintentar");if(b)b.hidden=!v;};
    reintentar(false);estado("Conectando…");
    MultiBroker.conectar(()=>{
      if(on!==mio){try{mio.cli&&mio.cli.end(true);}catch(e){}return;}
      mio.cli.subscribe(tema());
      mio.cli.on("message",(t,pl)=>{if(on!==mio||t!==tema())return;let m;try{m=JSON.parse(pl.toString());}catch(e){return;}if(m.pid===mio.pid)return;manejar(m);});
      estado("");listo();
    },()=>{if(on!==mio)return;estado("No se pudo conectar ("+(window.gyaFalloConexion||"sin respuesta")+"). Probá con datos del celular o tocá Reintentar.");reintentar(true);},
    cl=>{if(on===mio)mio.cli=cl;else try{cl.end(true);}catch(e){}});
    mio.reconectar=()=>conectarSala(listo);
  }
  function crearSala(){
    nuevaSala(true,Array.from({length:4},()=>CHARS[Math.floor(Math.random()*CHARS.length)]).join(""));
    zonaAnfitrion();
    conectarSala(()=>{on.timers.push(setInterval(()=>{if(on&&on.host&&on.fase!=="jugando")difundirSala();},3000));difundirSala();});
  }
  function unirse(sala,de){
    nuevaSala(false,sala);
    lobby(de);
    conectarSala(()=>{const hola=()=>{if(on&&!on.jug.some(j=>j.pid===on.pid))mandar({t:"hola",nombre:yo()});};hola();on.timers.push(setInterval(hola,2000));});
  }
  function cerrarSala(){
    if(!on)return;on.reconectar=null;
    try{if(on.cli&&on.cli.connected)on.cli.publish(tema(),JSON.stringify({t:"chau",pid:on.pid}));}catch(e){}
    on.timers.forEach(t=>{clearInterval(t);clearTimeout(t);});
    const c=on.cli;on=null;if(c)setTimeout(()=>{try{c.end(true);}catch(e){}},300);
    actualizarChat();
  }
  function difundirSala(){mandar({t:"sala",jug:on.jug,ganadas:on.ganadas,rg:on.rg||{},cats:on.cats,tiempo:on.tiempo,fase:on.fase});}
  function textoInvitacion(){return "¡Juguemos Tutti Frutti en Girá y Adiviná! 🍓 Tocá para unirte: "+linkInvitacion()+" (código "+on.sala+")";}
  function copiarInvitacion(){
    const t=textoInvitacion(),ok=()=>estado("✅ Invitación copiada. Pegala en el chat.");
    try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,()=>{try{window.prompt("Copiá la invitación:",t);}catch(e){}});return;}}catch(e){}
    try{window.prompt("Copiá la invitación:",t);}catch(e){}
  }
  function linkInvitacion(){let base="";try{base=location.origin+location.pathname;}catch(e){}return base+"?tutti="+on.sala+"&de="+encodeURIComponent(yo());}
  /* Anfitrión: el código, la invitación y los que van entrando aparecen en
     la misma pantalla de las categorías (se pueden seguir cambiando). */
  function zonaAnfitrion(){
    const z=raiz&&raiz.querySelector("#tfZona");if(!z){lobby();return;}
    setTimeout(actualizarChat,0);
    z.innerHTML=`<div class="qs-sub">🔑 Código de la sala</div><div class="dl-codigo tf-cod">${on.sala}</div>
      <button type="button" id="tfWpp">📲 Invitar por WhatsApp</button>
      <button type="button" id="tfCopiar">📋 Copiar invitación</button>
      <div class="qs-sub">👥 En la sala</div><ul class="imp-tabla" id="tfJugs"></ul>
      <button type="button" class="mg-principal" id="tfArrancar">🎲 Empezar</button>
      <p class="imp-ayuda" id="tfEstado" role="status"></p><button type="button" id="tfReintentar" hidden>🔄 Reintentar</button>
      <button type="button" id="tfCancelar">✖ Cerrar la sala</button>`;
    pintarJugadores();eventosAnfitrion();
    q("tfReintentar").onclick=()=>{if(on&&on.reconectar)on.reconectar();};
    q("tfCancelar").onclick=configurar;
  }
  function eventosAnfitrion(){
    q("tfWpp").onclick=()=>{try{window.open("https://wa.me/?text="+encodeURIComponent(textoInvitacion()),"_blank");}catch(e){}};
    const cp=raiz.querySelector("#tfCopiar");if(cp)cp.onclick=copiarInvitacion;
    q("tfArrancar").onclick=()=>{if(!on.cli||!on.cli.connected){estado("Todavía conectando… esperá un segundo.");return;}if(on.jug.length<2){estado("Falta que se una al menos un jugador más.");return;}nuevaRonda();};
  }
  function lobby(de){
    if(!raiz||!on)return;
    PantallaFija.activar({completa:false});
    pantalla(`<div class="mg-panel imp-panel"><h3>🍓 Sala de Tutti Frutti</h3>
      ${on.host?`<p>Pasales el código o invitalos por WhatsApp. Cuando estén todos, tocá <b>Empezar</b>.</p>
        <div class="dl-codigo tf-cod">${on.sala}</div>
        <button type="button" id="tfWpp">📲 Invitar por WhatsApp</button><button type="button" id="tfCopiar">📋 Copiar invitación</button>`
      :`<p>${de?"Sala de <b>"+esc(de)+"</b>. ":""}Esperando que el anfitrión empiece…</p><div class="dl-codigo tf-cod">${on.sala}</div>`}
      <div class="qs-sub">👥 En la sala</div><ul class="imp-tabla" id="tfJugs"></ul>
      ${on.host?`<button type="button" class="mg-principal" id="tfArrancar">🎲 Empezar</button>`:""}
      <p class="imp-ayuda" id="tfEstado" role="status"></p><button type="button" id="tfReintentar" hidden>🔄 Reintentar</button></div>`);
    pintarJugadores();
    q("tfReintentar").onclick=()=>{if(on&&on.reconectar)on.reconectar();};
    if(on.host)eventosAnfitrion();
  }
  function pintarJugadores(){
    const ul=raiz&&raiz.querySelector("#tfJugs");if(!ul||!on)return;
    ul.innerHTML=on.jug.map(j=>`<li><span>${esc(j.nombre)}${j.pid===on.pid?" (vos)":""}</span><b>${on.ganadas[j.pid]?on.ganadas[j.pid]+" pts":""}</b></li>`).join("");
  }
  /* ===== Jugar online (contra jugadores bot, como "Jugar online" de la rueda) =====
     Se simula una sala: el jugador es el anfitrión y los bots responden con
     palabras de las listas (TUTTI_LISTAS / TUTTI_BOTS), cada uno con su
     habilidad (cuántas categorías completa) y su velocidad (cuándo canta
     BASTA). A veces se equivocan al tipear. No hay red: mandar() solo llama
     a manejar() porque on.cli es null. */
  const BOT_NOMBRES=["Fede_UY","Male98","Tomi_ARG","CamiMdeo","PatoCanario","Vale_Punta","Juli.Salto","Nacho_10","Sofi.Cba","Lucho_MVD"];
  const BOT_MAYORES=[{n:"Abuelo_Tito",g:"m"},{n:"Marta1958",g:"f"},{n:"Don_Carlos",g:"m"},{n:"Nelly.Salto",g:"f"},{n:"Raúl_Pocitos",g:"m"},{n:"Chela_MVD",g:"f"},{n:"Oscar65",g:"m"},{n:"Beba.Minas",g:"f"}];
  /* Velocidad humana por categoría (pensar + escribir en el celular):
     normal 3,5-5 s, difícil (rivales rápidos) 3-4,5 s (como estaba, Gonzalo: "el difícil está bien"), persona mayor 9-14 s
     (25/10/2026: Gonzalo completaba todo y los bots "normales" iban por la 2ª categoría).
     Las categorías y letras difíciles llevan un 25% más. "hab" es la
     probabilidad de saber una palabra para cada categoría. */
  const MODOS_BOT={
    normal:{nombre:"🙂 Normal",desc:"Rivales a velocidad normal",seg:[3.5,5],hab:[.9,.97]},
    dificil:{nombre:"⚡ Difícil",desc:"Rivales rápidos que cantan BASTA enseguida",seg:[3,4.5],hab:[.96,1]},
    mayor:{nombre:"👴 Persona mayor",desc:"Rivales tranquilos, sin apuro",seg:[9,14],hab:[.75,.9]}};
  const CATS_DIFICILES=["Famoso","Marca","Película o serie","Cosa","Profesión"],LETRAS_DIFICILES="UIJV";
  const azar=(a,b)=>a+Math.random()*(b-a);
  const avatarImg=a=>a?`<img class="tf-av" src="assets/avatars/${esc(a)}.webp" alt="">`:`<span class="tf-av">🙂</span>`;
  function elegirBots(n,modo){
    const M=MODOS_BOT[modo]||MODOS_BOT.normal;
    let pool=modo==="mayor"?BOT_MAYORES.slice():(typeof NOMBRES_ONLINE!=="undefined"?NOMBRES_ONLINE.slice():BOT_NOMBRES.map(x=>({n:x,g:Math.random()<.5?"m":"f"})));
    pool=pool.filter(p=>p.n.toLowerCase()!==yo().toLowerCase());
    const out=[];
    while(out.length<n&&pool.length){
      const p=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
      const av=p.g==="m"?(typeof AVATARES_M!=="undefined"?AVATARES_M:[]):(typeof AVATARES_F!=="undefined"?AVATARES_F:[]);
      out.push({nombre:String(p.n).slice(0,14),avatar:av.length?av[Math.floor(Math.random()*av.length)]:null,hab:azar(M.hab[0],M.hab[1]),seg:M.seg});
    }
    return out;
  }
  /* Popup de "Jugar online": elegir contra qué tipo de rivales. */
  function elegirModoOnline(){
    if(document.querySelector(".tf-modos"))return;
    const c=document.createElement("div");c.className="pf-confirmar tf-modos";
    c.innerHTML=`<div class="mg-panel pf-caja"><h3>🌐 Jugar online</h3><p class="imp-ayuda">¿Contra qué rivales querés jugar?</p>
      ${Object.entries(MODOS_BOT).map(([k,m])=>`<button type="button" class="tf-modo" data-m="${k}"><b>${m.nombre}</b><small>${m.desc}</small></button>`).join("")}
      <button type="button" data-x="1">Cancelar</button></div>`;
    c.addEventListener("click",e=>{const b=e.target.closest("button");if(!b&&e.target!==c)return;c.remove();if(b&&b.dataset.m)jugarBots(b.dataset.m);});
    document.body.appendChild(c);
  }
  function jugarBots(modo){
    if(window.Fichas&&!Fichas.usar("tutti-frutti",()=>jugarBots(modo)))return;
    nuevaSala(true,"BOTS");on.bots=true;on.modoBots=modo;
    const bots=elegirBots(2+Math.floor(Math.random()*2),modo),miAv=typeof perfil!=="undefined"&&perfil&&perfil.avatar;
    PantallaFija.activar({completa:false});
    pantalla(`<div class="imp-centro"><div class="buscando-spinner"></div><div class="imp-quien" id="tfBusca">🌐 Buscando jugadores online…</div>
      <p class="imp-ayuda">${esc((MODOS_BOT[modo]||MODOS_BOT.normal).nombre)}</p>
      <ul class="tf-online" id="tfOnline"><li>${avatarImg(miAv)}<b>${esc(yo())} (vos)</b><em>✔ listo</em></li></ul></div>`);
    let t=1200;
    bots.forEach((b,k)=>{t+=700+Math.random()*1100;on.timers.push(setTimeout(()=>{
      if(!on||!on.bots)return;const pid="bot"+k+Math.random().toString(36).slice(2,7);
      on.jug.push({pid,nombre:b.nombre,bot:b});
      const ul=raiz&&raiz.querySelector("#tfOnline");if(ul)ul.insertAdjacentHTML("beforeend",`<li class="tf-entra">${avatarImg(b.avatar)}<b>${esc(b.nombre)}</b><em>✔ listo</em></li>`);
      if(typeof bip==="function")bip(660+k*80,.08,"sine",.04);
    },t));});
    on.timers.push(setTimeout(()=>{if(!on||!on.bots)return;const e=raiz&&raiz.querySelector("#tfBusca");if(e)e.textContent="✅ ¡Sala completa! Arranca la partida…";
      on.timers.push(setTimeout(()=>{if(on&&on.bots&&on.fase==="lobby")nuevaRonda();},1400));},t+700));
  }
  function respuestaBot(cat,letra,hab){
    if(Math.random()>hab)return "";
    const k=CLAVE_CAT[cat],B=window.TUTTI_BOTS||{},L=window.TUTTI_LISTAS||{};
    /* Famoso/Marca/Película: también las listas grandes, así no ponen todos lo mismo (Puma, Pablo Picasso…). */
    const W=window,src=k==="wiki"?(cat==="Famoso"?B.famoso+","+(W.TUTTI_FAMOSOS||""):cat==="Marca"?B.marca+","+(W.TUTTI_MARCAS||""):B.pelicula+","+(W.TUTTI_PELICULAS||"")):k==="dic"?B.cosa:L[k];
    const l=String(letra).toLowerCase();
    const opc=String(src||"").split(",").map(x=>x.trim()).filter(x=>x.length>2&&NORM(x)[0]===l);
    if(!opc.length)return "";
    let w=opc[Math.floor(Math.random()*opc.length)];
    if(w===w.toLowerCase())w=w.split(" ").map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(" ");
    /* De vez en cuando, error de tipeo (como una persona apurada). */
    if(Math.random()<.05&&w.length>6){const i=1+Math.floor(Math.random()*(w.length-2));w=w.slice(0,i)+w.slice(i+1);}
    return w;
  }
  /* Cada bot "escribe" categoría por categoría: se calcula cuándo termina
     cada una (acumulado). Si completa todo antes del tiempo, canta BASTA. */
  function planBots(){
    const n=on.n,T=on.tiempo*1000,t0=Date.now(),letraDif=LETRAS_DIFICILES.includes(on.letra);
    on.botT0=t0;on.botResp={};
    on.jug.filter(j=>j.bot).forEach(j=>{
      const r=on.cats.map(c=>respuestaBot(c,on.letra,j.bot.hab));on.botResp[j.pid]=r;
      let acc=t0;j.bot.listas=r.map((w,i)=>{let d=azar(j.bot.seg[0],j.bot.seg[1])*1000;
        if(CATS_DIFICILES.includes(on.cats[i]))d*=1.25;if(letraDif)d*=1.25;if(!w)d*=.6;acc+=d;return acc;});
      j.bot.fin=acc;
      if(r.every(Boolean)&&j.bot.fin<t0+T)on.timers.push(setTimeout(()=>{if(on&&on.n===n&&on.fase==="jugando"&&!on.basta)manejar({t:"basta",n,pid:j.pid});},j.bot.fin-Date.now()));
    });
  }
  /* Al cortar la ronda, cada bot entrega solo lo que llegó a escribir. */
  function respuestasBots(){
    const n=on.n,ahora=Date.now();
    on.jug.filter(j=>j.bot).forEach(j=>{
      const r=(on.botResp&&on.botResp[j.pid])||[],listas=j.bot.listas||[];
      const parcial=r.map((w,i)=>listas[i]!=null&&listas[i]<=ahora?w:"");
      /* Al instante: con demora, si tocabas "Continuar" rápido los resultados
         salían antes de que llegaran y los bots quedaban todos en 0. */
      manejar({t:"resp",n,pid:j.pid,r:parcial});
    });
  }
  function nuevaRonda(){
    /* Las letras que ya salieron se recuerdan en el celular del anfitrión
       (no solo en la sala): así no se repiten en la revancha aunque la sala
       se haya vuelto a crear o la app se haya recargado. Recién cuando
       salieron las 20 se empieza de nuevo. */
    let guardadas=[];try{guardadas=JSON.parse(localStorage.getItem("gya_tf_letras_usadas")||"[]");}catch(e){}
    on.usadas=[...new Set([...(on.usadas||[]),...(Array.isArray(guardadas)?guardadas:[])])].filter(l=>LETRAS.includes(l));
    let libres=LETRAS.filter(l=>!on.usadas.includes(l));if(!libres.length){on.usadas=[];libres=LETRAS.slice();}
    const l=libres[Math.floor(Math.random()*libres.length)];on.usadas.push(l);
    try{localStorage.setItem("gya_tf_letras_usadas",JSON.stringify(on.usadas));}catch(e){}
    on.rj=(on.rj||0)+1;on.tot=on.tot||RONDAS;
    mandar({t:"ronda",n:on.n+1,rj:on.rj,tot:on.tot,letra:l,cats:on.cats,tiempo:on.tiempo,usadas:on.usadas.slice()});
  }
  /* Chat de la sala: los mensajes viajan por la misma sala ({t:"chat"}). */
  let chatBtn=null,chatPanel=null,noLeidos=0;
  function actualizarChat(){
    const ver=!!(on&&raiz&&!on.bots&&on.fase!=="jugando");
    if(!ver){if(chatBtn)chatBtn.hidden=true;cerrarChat();if(!on)noLeidos=0;return;}
    if(!chatBtn){chatBtn=document.createElement("button");chatBtn.type="button";chatBtn.className="tf-chat-btn";chatBtn.setAttribute("aria-label","Chat");chatBtn.innerHTML='💬<i hidden></i>';chatBtn.onclick=abrirChat;document.body.appendChild(chatBtn);}
    chatBtn.hidden=!!chatPanel;const i=chatBtn.querySelector("i");i.hidden=!noLeidos;i.textContent=noLeidos>9?"9+":noLeidos;
  }
  function abrirChat(){
    if(!on)return;noLeidos=0;
    if(!chatPanel){
      chatPanel=document.createElement("div");chatPanel.className="tf-chat";
      chatPanel.innerHTML=`<div class="tf-chat-cab"><b>💬 Chat de la sala</b><button type="button" data-x="1" aria-label="Cerrar">✕</button></div>
        <ul class="tf-chat-lista"></ul>
        <div class="tf-chat-rapidos">${["😂","👍","👎","🤔","🔥","🙏"].map(e=>`<button type="button" data-e="${e}">${e}</button>`).join("")}</div>
        <form class="tf-chat-escribir"><input maxlength="140" placeholder="Escribí algo…" autocomplete="off" enterkeyhint="send"><button type="submit">➤</button></form>`;
      chatPanel.addEventListener("click",e=>{if(e.target.closest("[data-x]")){cerrarChat();actualizarChat();return;}const r=e.target.closest("[data-e]");if(r)enviarChat(r.dataset.e);});
      chatPanel.querySelector("form").onsubmit=e=>{e.preventDefault();const inp=chatPanel.querySelector("input");enviarChat(inp.value);inp.value="";};
      ["pointerdown","touchstart","keydown"].forEach(t=>chatPanel.addEventListener(t,ev=>ev.stopPropagation()));
      document.body.appendChild(chatPanel);
    }
    pintarChat();actualizarChat();
  }
  function cerrarChat(){if(chatPanel){chatPanel.remove();chatPanel=null;}}
  function pintarChat(){
    if(!chatPanel||!on)return;const l=chatPanel.querySelector(".tf-chat-lista");
    l.innerHTML=(on.chat||[]).map(c=>c.sis?`<li class="sis">${esc(c.txt)}</li>`:`<li class="${c.pid===on.pid?"mio":""}"><small>${esc(c.nombre)}</small>${esc(c.txt)}</li>`).join("")||`<li class="sis">Escriban acá para hablar las respuestas 👇</li>`;
    l.scrollTop=l.scrollHeight;
  }
  function enviarChat(t){t=String(t||"").trim().slice(0,140);if(!t||!on)return;mandar({t:"chat",id:Math.random().toString(36).slice(2,9),nombre:yo(),txt:t});}
  function anotarChat(txt){if(!on)return;on.chat=on.chat||[];on.chat.push({sis:true,txt});if(on.chat.length>80)on.chat.shift();if(chatPanel)pintarChat();}
  function manejar(m){
    if(!on)return;
    if(m.t==="chat"){
      on.chat=on.chat||[];if(on.chat.some(x=>x.id===m.id))return;
      on.chat.push({id:m.id,pid:m.pid,nombre:String(m.nombre||"Jugador").slice(0,14),txt:String(m.txt||"").slice(0,140)});if(on.chat.length>80)on.chat.shift();
      if(chatPanel)pintarChat();else if(m.pid!==on.pid){noLeidos++;if(typeof vibrar==="function")vibrar(20);actualizarChat();}
      return;
    }
    if(m.t==="hola"&&on.host){
      if(!on.jug.some(j=>j.pid===m.pid)){if(on.jug.length>=MAXJ)return;on.jug.push({pid:m.pid,nombre:String(m.nombre||"Jugador").slice(0,14)});}
      difundirSala();pintarJugadores();
    }else if(m.t==="sala"&&!on.host){
      on.jug=Array.isArray(m.jug)?m.jug:[];on.ganadas=m.ganadas||{};on.rg=m.rg||{};on.cats=m.cats||on.cats;on.tiempo=m.tiempo||on.tiempo;pintarJugadores();
    }else if(m.t==="chau"){
      const eraHost=!on.host&&on.jug[0]&&on.jug[0].pid===m.pid,quien=(on.jug.find(j=>j.pid===m.pid)||{}).nombre;
      if(quien&&!eraHost&&typeof mostrarToast==="function")mostrarToast("🚪",quien+" salió de la partida.","Se fue "+quien);
      on.jug=on.jug.filter(j=>j.pid!==m.pid);
      if(eraHost){cerrarSala();if(raiz){configurar();estado("El anfitrión cerró la sala.");}return;}
      if(on.host)difundirSala();pintarJugadores();
    }else if(m.t==="ronda"){
      /* El mismo aviso de ronda puede llegar dos veces (llega por varios
         servidores a la vez y alguno se atrasa): si ya estamos en esa ronda
         o en una posterior, se ignora. Antes volvía a sortear la letra en
         pantalla y borraba lo que el jugador había escrito. */
      if(Number(m.n)<=Number(on.n||0)&&on.fase!=="lobby")return;
      on.n=m.n;if(Array.isArray(m.usadas))on.usadas=m.usadas.slice();on.rj=m.rj||on.rj;on.tot=m.tot||on.tot||RONDAS;on.letra=m.letra;on.cats=m.cats;on.tiempo=m.tiempo;on.fase="jugando";on.resps={};on.extra={};on.apeladas={};on.anuladas={};on.salidas={};on.avisoSalida=0;on.salidaPend=false;on.ganador=null;on.basta=null;on.mias=Array(on.cats.length).fill("");on.envie=false;
      jugarOnline();
    }else if(m.t==="basta"&&m.n===on.n){
      if(!on.basta){on.basta=m.pid;if(on.host)on.ganador=m.pid;}
      cortarRonda(m.pid);
    }else if(m.t==="resp"&&m.n===on.n){
      on.resps[m.pid]=Array.isArray(m.r)?m.r.map(x=>String(x||"").slice(0,30)):[];
      if(on.host&&on.jug.every(j=>on.resps[j.pid]))publicarResultado();
    }else if(m.t==="extra"&&m.n===on.n){
      on.extra=on.extra||{};on.extra[m.a+"|"+m.i]=Math.max(0,Math.min(20,Number(m.p)||0));pintarVotos();
      /* Con que uno solo le sume ya cuenta: a los demás se les cierra el aviso de apelación. */
      if(Number(m.p)>0){const ap=document.querySelector(`.tf-apelacion[data-k="${m.a}|${m.i}"]`);if(ap){ap.remove();if(m.pid!==on.pid&&typeof mostrarToast==="function"){const q2=(on.jug.find(j=>j.pid===m.pid)||{}).nombre||"Alguien";mostrarToast("✅",q2+" ya le sumó los puntos.");}}}
    }else if(m.t==="voto"&&m.n===on.n){
      /* Los votos para anular respuestas se retiraron. Ignorar mensajes de
         clientes con una versión anterior evita cambiar los puntos. */
      return;
    }else if(m.t==="apela"&&m.n===on.n){
      on.apeladas=on.apeladas||{};on.apeladas[m.a+"|"+m.i]=true;pintarVotos();
      const quien=(on.jug.find(j=>j.pid===m.a)||{}).nombre||"Alguien",pal=(on.resps[m.a]||[])[m.i]||"",cat=on.cats[m.i]||"";
      anotarChat("🙋 "+quien+" apela «"+pal+"» ("+cat+")");
      if(m.a!==on.pid&&on.fase==="resultado")apelacion(m.a,m.i);
    }else if(m.t==="anula"&&m.n===on.n){
      on.anuladas=on.anuladas||{};const k=m.a+"|"+m.i;if(m.v)on.anuladas[k]=true;else delete on.anuladas[k];pintarVotos();
      const quien=(on.jug.find(j=>j.pid===m.pid)||{}).nombre||"Alguien",de=(on.jug.find(j=>j.pid===m.a)||{}).nombre||"",pal=(on.resps[m.a]||[])[m.i]||"";
      const txt=(m.v?"🚫 "+quien+" anuló":"↩️ "+quien+" devolvió")+" «"+pal+"» de "+de+" ("+etiq(on.cats[m.i]||"")+")";
      anotarChat(txt);if(m.pid!==on.pid&&typeof mostrarToast==="function")mostrarToast(m.v?"🚫":"↩️",txt);
      document.querySelector(`.tf-pide-anular[data-k="${k}"]`)?.remove();
    }else if(m.t==="pideanular"&&m.n===on.n){
      /* Como Apelar al revés: el que quiere anular pregunta y los demás deciden. */
      const quien=(on.jug.find(j=>j.pid===m.pid)||{}).nombre||"Alguien",de=(on.jug.find(j=>j.pid===m.a)||{}).nombre||"",pal=(on.resps[m.a]||[])[m.i]||"";
      anotarChat("🚫 "+quien+" pide anular «"+pal+"» de "+de+" ("+etiq(on.cats[m.i]||"")+")");
      if(m.pid!==on.pid&&on.fase==="resultado")pedidoAnular(m.pid,m.a,m.i);
    }else if(m.t==="vale"&&m.n===on.n){
      const quien=(on.jug.find(j=>j.pid===m.pid)||{}).nombre||"Alguien",pal=(on.resps[m.a]||[])[m.i]||"",txt="✅ "+quien+" eligió no anular «"+pal+"».";
      anotarChat(txt);document.querySelector(`.tf-pide-anular[data-k="${m.a}|${m.i}"]`)?.remove();
      if(m.pid!==on.pid&&typeof mostrarToast==="function")mostrarToast("✅",txt);
    }else if(m.t==="salio"&&m.n===on.n){
      on.salidas=on.salidas||{};const c=Math.min(SALIDAS_MAX,Number(m.c)||0);
      if(m.pid===on.pid&&document.hidden)return;
      if(c<=(m.pid===on.pid?(on.avisoSalida||0):salidasDe(m.pid)))return;
      if(m.pid===on.pid)on.avisoSalida=c;else on.salidas[m.pid]=c;
      const quien=(on.jug.find(j=>j.pid===m.pid)||{}).nombre||"Alguien";
      if(typeof mostrarToast==="function"){
        if(m.pid===on.pid)mostrarToast(c>=SALIDAS_MAX?"🚫":"👀",c>=SALIDAS_MAX?"Saliste 3 veces: perdés los puntos de esta ronda.":"Saliste del juego. Aviso "+c+" de "+SALIDAS_MAX+": a la "+SALIDAS_MAX+"ª perdés los puntos de la ronda.","No vale salir");
        else mostrarToast(c>=SALIDAS_MAX?"🚫":"👀",c>=SALIDAS_MAX?quien+" salió 3 veces: pierde los puntos de esta ronda.":quien+": ¡no vale hacer trampa! Aviso "+c+" de "+SALIDAS_MAX+".",quien+" salió del juego");
      }
      anotarChat((c>=SALIDAS_MAX?"🚫 ":"👀 ")+quien+" salió del juego ("+c+" de "+SALIDAS_MAX+")");
      if(on.fase==="resultado")pintarVotos();
    }else if(m.t==="objecion"&&m.n===on.n){
      /* Las objeciones para quitar puntos también se retiraron. */
      return;
    }else if(m.t==="final"){
      on.ganadas=m.ganadas||on.ganadas;on.rg=m.rg||{};on.jug=m.jug||on.jug;on.tot=m.tot||on.tot;mostrarFinal();
    }else if(m.t==="resultado"&&m.n===on.n&&!on.host){
      on.resps=m.resps||{};on.ganador=m.ganador;on.ganadas=m.ganadas||on.ganadas;on.jug=m.jug||on.jug;on.marcas=m.marcas||{};reforzarMarcas();mostrarResultado();
    }
  }
  /* Ronda: animación de la letra y después una categoría por vez. */
  function jugarOnline(){
    cerrarApelaciones();
    PantallaFija.activar({completa:false});
    if(on.rj===1&&tecladoHorizontal()){
      pantalla(`<div class="tf-mic-aviso" role="dialog" aria-modal="true" aria-labelledby="tfMicTitulo"><div class="tf-mic-aviso-caja">
        <h3 id="tfMicTitulo">🎙️ Micrófono para jugar</h3>
        <p>Para una mejor jugabilidad en horizontal, recomendamos responder con el micrófono.</p>
        <p>Quedará encendido durante la ronda y se pausará al llegar a <b>¡BASTA!</b>. Podés volver a activarlo con el botón del juego.</p>
        <div class="tf-mic-aviso-botones"><button type="button" id="tfVozNo">No, escribir</button><button type="button" id="tfVozSi">Sí, usar micrófono</button></div>
        <small id="tfVozPermiso" role="status"></small>
      </div></div>`);
      q("tfVozNo").onclick=()=>{micAviso="";sortearLetra();};
      q("tfVozSi").onclick=async()=>{
        q("tfVozSi").disabled=true;q("tfVozNo").disabled=true;q("tfVozPermiso").textContent="Solicitando permiso para el micrófono…";
        await activarMicrofono(true);
        if(on&&on.fase==="jugando"&&!on.basta)sortearLetra();
      };
      return;
    }
    sortearLetra();
  }
  function sortearLetra(){
    if(!raiz||!on||on.fase!=="jugando"||on.basta)return;
    pantalla(`<div class="imp-centro"><div class="imp-quien">🎲 Ronda ${on.rj||1} de ${on.tot||RONDAS} · sorteando la letra…</div><div class="tf-ficha"><img src="${ARTE("ficha")}" alt="" draggable="false"><div class="tf-letra" id="tfLetra">?</div></div></div>`);
    let k=0;const giro=()=>{if(!raiz||!on)return;const el=q("tfLetra");if(!el)return;
      if(k<12){el.textContent=LETRAS[Math.floor(Math.random()*LETRAS.length)];if(typeof bip==="function")bip(600+k*25,.04,"square",.03);k++;setTimeout(giro,60+k*8);return;}
      el.textContent=on.letra;el.classList.add("tf-final");if(typeof bip==="function"){bip(784,.15);setTimeout(()=>bip(1047,.25),120);}setTimeout(campos,800);};
    giro();
  }
  function campos(){
    if(!raiz||!on||on.fase!=="jugando"||on.basta)return;
    on.fin=Date.now()+on.tiempo*1000;on.pend=on.cats.map((_,i)=>i);on.hist=[];
    if(on.bots)planBots();
    if(audioMusica)try{audioMusica.currentTime=0;}catch(e){}
    if(!micActivo)iniciarMusica();
    pantalla(`<div class="qs-tope"><span>🍓 Letra ${on.letra}</span><b id="tfReloj">${on.tiempo}</b><span></span></div>
      <div class="imp-centro tf-campo"><div class="tf-ficha tf-ficha-chica"><img src="${ARTE("ficha")}" alt="" draggable="false"><div class="tf-letra tf-final tf-chica">${on.letra}</div></div>
      <div class="tf-prog" id="tfProg"></div>
      <button type="button" class="tf-mic-btn" id="tfMic" aria-pressed="false">🎙️ Activar micrófono</button>
      <div id="tfEdit"><div class="imp-quien" id="tfCat"></div>
      <input id="tfInput" maxlength="30" autocomplete="off" autocapitalize="words" enterkeyhint="next" aria-label="Tu palabra">
      <p class="imp-ayuda" id="tfMsg" role="status"></p>
      <div class="mim-btns"><button type="button" class="bb-pasar imp-gris" id="tfAnt">⟵ Anterior</button><button type="button" class="bb-pasar mim-ok" id="tfSig">Siguiente ➜</button></div>
      <div id="tfTeclado" class="tf-teclado-digital" role="group" aria-label="Teclado para responder"></div></div>
      <div id="tfRev" class="tf-rev" hidden></div></div>`);
    const inp=q("tfInput");
    crearTeclado();sincronizarTeclado();pintarMicrofono();
    q("tfMic").onclick=()=>{if(micActivo)pararMicrofono(true);else activarMicrofono();};
    q("tfSig").onclick=confirmarCampo;
    inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();confirmarCampo();}});
    /* Anterior: va a la categoría de antes en el orden (vacía o completa,
       da la vuelta); lo escrito queda guardado. */
    q("tfAnt").onclick=()=>{if(!on||on.fase!=="jugando"||on.basta||!on.pend.length)return;
      guardarCampo();if(todoCompleto()){on.pend=[];revision();return;}const n=on.cats.length;irACampo((on.pend[0]-1+n)%n);};
    /* Los puntitos de arriba también llevan directo a cualquier categoría. */
    q("tfProg").onclick=e=>{const d=e.target.closest("i[data-i]");if(!d||!on||on.fase!=="jugando"||on.basta)return;if(on.pend.length)guardarCampo();irACampo(Number(d.dataset.i));};
    pintarCampo();
    if(micAviso){q("tfMsg").textContent=micAviso;micAviso="";}
    if(micActivo&&micInicioPendiente){micInicioPendiente=false;escucharMicrofono();}
    relojOnline();
  }
  function irACampo(k){on.pend=[k,...on.pend.filter(x=>x!==k)];pintarCampo();}
  /* Con todo completo no se manda BASTA solo: se muestran las respuestas
     para corregir la que sea (tocándola) y recién después ¡BASTA!. */
  function revision(){
    if(!raiz||!on)return;const ed=q("tfEdit"),rv=q("tfRev");if(!ed||!rv)return;
    ed.hidden=true;rv.hidden=false;sincronizarTeclado();pintarMicrofono();
    q("tfProg").innerHTML=on.cats.map((c,j)=>`<i class="${on.mias[j]?"ok":""}" data-i="${j}"></i>`).join("");
    rv.innerHTML='<p class="imp-ayuda">¿Todo bien? Tocá una respuesta para corregirla.</p>'+
      on.cats.map((c,j)=>`<button type="button" class="tf-rev-fila" data-i="${j}"><small>${esc(etiq(c))}</small><b>${esc(on.mias[j]||"—")}</b><span>✏️</span></button>`).join("")+
      '<button type="button" class="bb-pasar mim-ok tf-rev-basta" id="tfBasta">✋ ¡BASTA!</button>';
    rv.onclick=e=>{const f=e.target.closest(".tf-rev-fila");if(f&&on&&on.fase==="jugando"&&!on.basta){irACampo(Number(f.dataset.i));return;}
      if(e.target.closest("#tfBasta")&&on&&on.fase==="jugando"&&!on.basta)mandar({t:"basta",n:on.n});};
  }
  function pintarCampo(){
    if(!raiz||!on||!on.pend)return;if(!on.pend.length){revision();return;}const i=on.pend[0];
    {const ed=q("tfEdit"),rv=q("tfRev");if(ed)ed.hidden=false;if(rv)rv.hidden=true;}
    q("tfCat").textContent=etiq(on.cats[i]);
    const inp=q("tfInput");inp.value=on.mias[i]||"";inp.placeholder="Empieza con "+on.letra+"…";
    sincronizarTeclado();if(!inp.readOnly)try{inp.focus();}catch(e){}
    q("tfProg").innerHTML=on.cats.map((c,j)=>`<i class="${on.mias[j]?"ok":""}${j===i?" act":""}" data-i="${j}"></i>`).join("");
    q("tfMsg").textContent="";
    const a=q("tfAnt");if(a)a.disabled=on.cats.length<2;
  }
  const valida=v=>{v=String(v||"").trim();return v.length>=2&&N(v)[0]===on.letra;};
  const todoCompleto=()=>on.cats.every((c,i)=>valida(on.mias[i]));
  function guardarCampo(){const i=on.pend[0];on.mias[i]=(q("tfInput").value||"").trim().slice(0,30);}
  function confirmarCampo(){
    if(!on||on.fase!=="jugando"||on.basta)return;
    const v=(q("tfInput").value||"").trim();
    /* Vacío: "Siguiente" pasa a la categoría que sigue sin trabar (se puede
       volver después); si ya está todo completo, va a la revisión y al BASTA. */
    if(!v&&on.cats.length>1){guardarCampo();if(todoCompleto()){on.pend=[];revision();return;}irACampo((on.pend[0]+1)%on.cats.length);return;}
    if(v.length<2||N(v)[0]!==on.letra){
      q("tfMsg").textContent=v?"Tiene que empezar con "+on.letra:"Escribí una palabra con "+on.letra;
      if(v&&typeof sonidoErrorExt==="function")sonidoErrorExt();
      const inp=q("tfInput");inp.classList.remove("tf-mal");void inp.offsetWidth;inp.classList.add("tf-mal");return;
    }
    const cat=on.cats[on.pend[0]];
    guardarCampo();on.hist=(on.hist||[]).filter(x=>x!==on.pend[0]);on.hist.push(on.pend[0]);on.pend.shift();
    if(typeof bip==="function")bip(880,.06,"sine",.04);
    /* Terminó cuando todas las categorías tienen una palabra válida, aunque
       se hayan completado salteando o volviendo con Anterior. */
    if(!on.pend.length||todoCompleto()){on.pend=[];revision();return;}
    pintarCampo();
    revisar(cat,v).then(ok=>{if(ok===false&&on&&on.fase==="jugando"){const m=raiz&&raiz.querySelector("#tfMsg");if(m&&(!m.textContent||m.textContent.startsWith("✅")))m.textContent="⚠️ «"+v+"» no la encontré como "+NOM_CAT[cat]+". Al final la pueden votar.";}});
  }
  function relojOnline(){
    if(!raiz||!on||on.fase!=="jugando")return;
    const r=Math.max(0,Math.ceil((on.fin-Date.now())/1000)),el=q("tfReloj");
    if(el){el.textContent=r;if(r<=5&&r>0&&el.dataset.u!==String(r)){el.dataset.u=String(r);if(typeof bip==="function")bip(880,.07);}}
    if(r<=0){cortarRonda(null);return;}
    on.timers.push(setTimeout(relojOnline,250));
  }
  /* BASTA (o tiempo): todos mandan lo que tienen; el anfitrión junta y publica. */
  function cortarRonda(quien){
    if(!on||on.fase!=="jugando")return;
    pararMicrofono();
    detenerMusica();
    if(on.pend&&on.pend.length&&q("tfInput")){const v=(q("tfInput").value||"").trim();if(v.length>=2&&N(v)[0]===on.letra)guardarCampo();}
    on.fase="cortada";
    const nombre=(on.jug.find(j=>j.pid===quien)||{}).nombre;
    /* El aviso fuerte de ¡BASTA! suena para todos apenas se corta la ronda,
       tanto si lo cantamos nosotros como si lo hizo otro jugador. */
    if(quien&&typeof sonidoErrorExt==="function")sonidoErrorExt();
    if(quien&&typeof bip==="function"){bip(523,.14,"square",.06);setTimeout(()=>bip(392,.3,"square",.06),150);if(quien===on.pid)setTimeout(()=>[523,659,784].forEach((f,i)=>setTimeout(()=>bip(f,.16,"triangle",.05),i*110)),420);}
    if(typeof vibrar==="function")vibrar([80,50,80]);
    pantalla(`<div class="imp-centro">${quien?`<img class="tf-basta-img" src="${ARTE("basta")}" alt="¡BASTA!" draggable="false">`:`<div class="imp-rol">⏰ ¡Tiempo!</div>`}
      <p class="imp-ayuda">${quien?(quien===on.pid?"¡Completaste todo primero!":"<b>"+esc(nombre||"Alguien")+"</b> completó todo primero."):"Nadie llegó a completar todo."}</p>
      <p class="imp-ayuda">Juntando las respuestas…</p>
      ${on.host?`<button type="button" class="bb-pasar" id="tfYa">▶ Continuar</button>`:""}</div>`);
    const ya=raiz&&raiz.querySelector("#tfYa");if(ya)ya.onclick=()=>{if(on&&on.fase==="cortada")publicarResultado();};
    if(!on.envie){on.envie=true;mandar({t:"resp",n:on.n,r:on.mias});}
    if(on.bots)respuestasBots();
    if(on.host)on.timers.push(setTimeout(()=>{if(on&&on.fase==="cortada")publicarResultado();},2500));
  }
  /* Puntos por categoría: 10 si nadie más puso lo mismo, 5 si se repite,
     20 si sos el único que la completó, 0 si está vacía o no vale.
     El anfitrión revisa las respuestas (✓/⚠️) y manda las marcas a todos.
     Las dudosas se pueden apelar; una ✓ no se puede anular. */
  async function publicarResultado(){
    if(!on||!on.host||on.fase==="resultado"||on.calculando)return;
    on.calculando=true;
    const marcas={};
    await Promise.all(on.jug.map(async j=>{const r=on.resps[j.pid]||[];marcas[j.pid]=await Promise.all(on.cats.map((c,i)=>r[i]?revisar(c,r[i]).then(x=>x===null?true:x).catch(()=>true):Promise.resolve(false)));}));
    on.calculando=false;if(!on||on.fase==="resultado")return;
    on.fase="resultado";on.marcas=marcas;registrarDudas(marcas);
    mandar({t:"resultado",n:on.n,resps:on.resps,ganador:on.ganador,ganadas:on.ganadas,jug:on.jug,marcas});
    mostrarResultado();
  }
  const marca=(a,i)=>!!(on.marcas&&on.marcas[a]&&on.marcas[a][i]);
  /* Una respuesta validada mantiene sus puntos: otros jugadores no pueden
     anularla. Las dudosas se revisan mediante Apelar y el sumador. */
  function vale(a,i){return !!((on.resps[a]||[])[i])&&marca(a,i)&&!anulada(a,i);}
  /* Anular: cualquiera puede marcar una respuesta que está mal (aunque el
     juego la haya dado por buena) → vale 0 y los puntos de los demás se
     recalculan (ej.: el otro pasa a 20 si queda como único). */
  const anulada=(a,i)=>!!(on.anuladas&&on.anuladas[a+"|"+i]);
  function puntosRonda(){
    const pts={};on.jug.forEach(j=>pts[j.pid]=Array(on.cats.length).fill(0));
    on.cats.forEach((c,i)=>{
      /* Una ⚠️ a la que le sumaron puntos cuenta como respondida para los
         demás: si no, el otro seguía con 20 ("sos el único") aunque sí respondí. */
      const validos=on.jug.filter(j=>!penalizado(j.pid)&&!anulada(j.pid,i)&&(vale(j.pid,i)||extraDe(j.pid,i)>0));
      validos.forEach(j=>{
        const n=NORM(on.resps[j.pid][i]);
        const iguales=validos.filter(o=>o.pid!==j.pid&&NORM(on.resps[o.pid][i])===n).length;
        pts[j.pid][i]=validos.length===1?20:iguales?5:10;
      });
    });
    /* ⚠️ dudosas: los puntos que le pusieron a mano con el sumador (5, 10 o 20). */
    on.jug.forEach(j=>on.cats.forEach((c,i)=>{const x=extraDe(j.pid,i);if(x!=null&&(on.resps[j.pid]||[])[i]&&!marca(j.pid,i)&&!anulada(j.pid,i))pts[j.pid][i]=x;}));
    /* Salió 3 veces del juego en la ronda: todo a 0. */
    on.jug.forEach(j=>{if(penalizado(j.pid))pts[j.pid]=pts[j.pid].map(()=>0);});
    return pts;
  }
  const sumar=a=>a.reduce((x,y)=>x+y,0);
  const extraDe=(a,i)=>{const x=on.extra&&on.extra[a+"|"+i];return typeof x==="number"?x:null;};
  /* El sumador lo usan los demás (no el autor); contra bots, vos con todas. */
  /* El +/− se ve siempre, pero en partidas con amigos solo suma si el
     autor apeló esa palabra (o si el que suma es Gonzalo). Contra bots,
     vos con todas. */
  const apelada=(a,i)=>!!(on.apeladas&&on.apeladas[a+"|"+i]);
  const puedeSumar=(a,i)=>on.bots||(a!==on.pid&&(apelada(a,i)||(typeof esGonzalo==="function"&&esGonzalo())));
  /* Letras que ya salieron (no vuelven hasta que salgan las 20): se
     muestran abajo de los puntos de cada ronda y del ganador. */
  const salieronHtml=()=>{const u=(on&&on.usadas||[]).filter(l=>LETRAS.includes(l));return u.length?`<p class="tf-salieron">🔤 Ya salieron: <b>${u.join(" · ")}</b><small>No se repiten hasta que salgan las ${LETRAS.length}.</small></p>`:"";};
  /* Sumador: 0 → 5 → 10 → 20 (el 15 no se usa en el Tutti). */
  const PASOS_SUMA=[0,5,10,20];
  const pasoSuma=(actual,dir)=>{let k=PASOS_SUMA.findIndex(x=>x>=actual);if(k<0)k=PASOS_SUMA.length-1;if(dir>0&&PASOS_SUMA[k]===actual)k++;else if(dir<0)k--;return PASOS_SUMA[Math.max(0,Math.min(PASOS_SUMA.length-1,k))];};
  function asignarPuntos(a,i,p){
    mandar({t:"extra",n:on.n,a,i,p});
    const palabra=(on.resps[a]||[])[i];
    if(p>0&&palabra&&typeof esGonzalo==="function"&&esGonzalo()){
      aprobarPalabra(on.cats[i],palabra);
      if(typeof mostrarToast==="function")mostrarToast("✅","«"+palabra+"» ya vale en "+on.cats[i]+" para las próximas partidas.");
    }
  }
  function revisarMiRespuesta(i){
    if(!on||!on.bots||on.fase!=="resultado")return;
    const palabra=(on.resps[on.pid]||[])[i];if(!palabra)return;
    document.querySelector(".tf-revision-propia")?.remove();
    const c=document.createElement("div");c.className="pf-confirmar tf-revision-propia";
    c.innerHTML=`<div class="mg-panel pf-caja"><h3>🙋 Apelar mi respuesta</h3>
      <p class="tf-obj-pal"><small>${esc(etiq(on.cats[i]))}</small><b>${esc(palabra)}</b></p>
      <p class="imp-ayuda">Revisá tu respuesta y elegí cuántos puntos vale.</p>
      <div class="tf-revision-puntos">${PASOS_SUMA.map(p=>`<button type="button" data-p="${p}"${extraDe(on.pid,i)===p?' class="elegido"':""}>${p} pts</button>`).join("")}</div>
      <button type="button" data-x="1">Cancelar</button></div>`;
    c.addEventListener("click",e=>{const b=e.target.closest("button");if(e.target===c||b&&b.dataset.x){c.remove();return;}
      if(!b||b.dataset.p===undefined||!on||on.fase!=="resultado")return;
      const p=Number(b.dataset.p);if(!PASOS_SUMA.includes(p))return;c.remove();asignarPuntos(on.pid,i,p);});
    document.body.appendChild(c);
  }
  function mostrarResultado(){
    detenerMusica();
    if(!raiz||!on)return;on.fase="resultado";on.marcas=on.marcas||{};
    const g=on.ganador;
    /* Resultados en grilla (como una planilla): jugadores × categorías, cada
       casilla con la palabra y sus puntos; ⚠️ en amarillo; total en la punta.
       Si no entra a lo ancho (celular parado), va hacia abajo: categorías en
       filas y jugadores en columnas (así lo prefiere Gonzalo). */
    const C=on.cats.length,P=on.jug.length,ancho=(raiz.clientWidth||360)-36,porFilas=56+C*78+64<=ancho;
    const pos=(fila,col)=>`grid-row:${fila};grid-column:${col}`;
    let celdas=`<div class="tf-g-esq" style="${pos(1,1)}"></div>`;
    on.cats.forEach((c,i)=>{celdas+=`<div class="tf-g-cat" style="${porFilas?pos(1,i+2):pos(i+2,1)}" title="${esc(etiq(c))}"><small>${esc(etiq(c))}</small></div>`;});
    celdas+=`<div class="tf-g-cat tf-g-tot-cab" style="${porFilas?pos(1,C+2):pos(C+2,1)}">TOTAL</div>`;
    on.jug.forEach((j,k)=>{const r=on.resps[j.pid]||[];
      celdas+=`<div class="tf-g-nom${j.pid===on.pid?" tf-yo":""}" data-nom="${j.pid}" style="${porFilas?pos(k+2,1):pos(1,k+2)}"><i class="tf-g-copa">🏆</i><b>${esc(j.nombre)}</b>${j.pid===g?`<em title="Cantó BASTA">🏁</em>`:""}<em class="tf-pen" title="Salió 3 veces del juego: 0 puntos" hidden>🚫</em></div>`;
      on.cats.forEach((c,i)=>{const v=r[i]||"",ok=marca(j.pid,i),mio=j.pid===on.pid;
        celdas+=`<div class="tf-cel${v?"":" tf-vacia"}${v&&!ok?" tf-dudosa":""}" data-a="${j.pid}" data-i="${i}" style="${porFilas?pos(k+2,i+2):pos(i+2,k+2)}">
          <span class="tf-w"${v&&!ok?` data-ver="1"`:""}>${esc(v||"—")}${v&&!ok?` <i class="tf-marca mal">⚠️</i>`:""}</span><small class="tf-pts">+0</small>
          ${v&&!ok?(mio?`<button type="button" class="tf-apelar">🙋 Apelar</button>`:`<span class="tf-sum"><button type="button" data-d="-5" aria-label="Restar">−</button><b>0</b><button type="button" data-d="5" aria-label="Sumar">+</button></span>`):""}
          </div>`;});
      celdas+=`<div class="tf-g-tot" data-tot="${j.pid}" style="${porFilas?pos(k+2,C+2):pos(C+2,k+2)}">0</div>`;});
    const cols=porFilas?`minmax(64px,1.1fr) repeat(${C},minmax(70px,1fr)) minmax(54px,.8fr)`:`40px repeat(${P},minmax(${P>3?56:72}px,1fr))`;
    pantalla(`<div class="mg-panel imp-panel imp-fin tf-res"><h3 id="tfTitulo" class="tf-res-tit"></h3>
      <p class="imp-ayuda tf-res-ayuda">Letra <b>${on.letra}</b> · <b>10</b> única · <b>5</b> repetida · <b>20</b> si sos el único.<br><b class="tf-amar">⚠️ amarilla</b> = vale 0, tocala para ver por qué · <b class="tf-verde">🙋 Apelar</b> la tuya ${on.bots?"y elegí sus puntos":"para que los demás decidan"} · <b>+/−</b> sumale a la de otro.</p>
      <div class="tf-grilla-caja"><div class="tf-grilla${porFilas?"":" tf-vuelta"}${P>3?" tf-muchos":""}" id="tfGrilla" lang="es" style="grid-template-columns:${cols}">${celdas}</div></div>
      <p class="tf-res-frase" id="tfFrase"></p>
      <button type="button" class="tf-anular-btn" id="tfAnular">🚫 Anular una respuesta</button>
      <div class="qs-sub">🏆 Puntos (con esta ronda)</div><ul class="imp-tabla" id="tfTabla"></ul>
      ${salieronHtml()}
      ${on.host?((on.rj||1)>=(on.tot||RONDAS)?`<button type="button" class="mg-principal" id="tfOtra">🏆 Ver ganador de la partida</button>`:`<button type="button" class="mg-principal" id="tfOtra">🎲 Siguiente ronda (${(on.rj||1)+1} de ${on.tot||RONDAS})</button>`):`<p class="imp-ayuda">Esperando al anfitrión…</p>`}</div>`);
    raiz.querySelector("#tfGrilla").onclick=e=>{
      const f=e.target.closest(".tf-cel");if(!f||!f.dataset.a)return;const a=f.dataset.a,i=Number(f.dataset.i);
      const ap=e.target.closest(".tf-apelar");if(ap){if(on.bots){revisarMiRespuesta(i);return;}if(ap.disabled)return;ap.disabled=true;ap.textContent="🙋 Apelada";mandar({t:"apela",n:on.n,a:on.pid,i});if(typeof mostrarToast==="function")mostrarToast("🙋","Les avisamos a todos: ellos deciden si te suman puntos.","Apelaste");return;}
      const sb=e.target.closest(".tf-sum button");if(sb){if(!puedeSumar(a,i)){if(a!==on.pid&&typeof mostrarToast==="function")mostrarToast("🙋","Solo se suma si el que la escribió la apela.");return;}asignarPuntos(a,i,pasoSuma(extraDe(a,i)||0,Number(sb.dataset.d)));return;}
      if(e.target.closest("[data-ver]"))explicar(on.cats[i],(on.resps[a]||[])[i]);
    };
    q("tfAnular").onclick=elegirAnular;
    if(on.ganador===on.pid&&typeof bip==="function")[523,659,784].forEach((f,i)=>setTimeout(()=>bip(f,.2,"triangle",.05),i*130));
    pintarVotos();
    if(on.host){
      const cerrar=()=>{
        const pr=puntosRonda();on.rg=on.rg||{};
        on.jug.forEach(j=>on.ganadas[j.pid]=(on.ganadas[j.pid]||0)+sumar(pr[j.pid]));
        /* La ronda la gana el que más sumó (si empatan, se la llevan los dos). */
        const max=Math.max(...on.jug.map(j=>sumar(pr[j.pid])));
        if(max>0)on.jug.forEach(j=>{if(sumar(pr[j.pid])===max)on.rg[j.pid]=(on.rg[j.pid]||0)+1;});
        difundirSala();
      };
      q("tfOtra").onclick=e=>{if(e&&e.currentTarget){if(e.currentTarget.disabled)return;e.currentTarget.disabled=true;}cerrar();if((on.rj||1)>=(on.tot||RONDAS)){mandar({t:"final",n:on.n,ganadas:on.ganadas,rg:on.rg,jug:on.jug,tot:on.tot||RONDAS});return;}nuevaRonda();};
    }
  }
  /* Popup para anular (o devolver) cualquier respuesta escrita de la ronda. */
  function elegirAnular(){
    if(!on||on.fase!=="resultado")return;
    document.querySelector(".tf-anular")?.remove();
    const pr=puntosRonda(),filas=[];
    on.cats.forEach((c,i)=>on.jug.forEach(j=>{const v=(on.resps[j.pid]||[])[i];if(!v)return;const an=anulada(j.pid,i);if(!an&&!pr[j.pid][i])return;
      filas.push(`<button type="button" class="tf-rev-fila${an?" tf-anulada-fila":""}" data-a="${j.pid}" data-i="${i}"><small>${esc(etiq(c))} · ${esc(j.nombre)}</small><b>${esc(v)}</b><span>${an?"↩️ Devolver":"🚫 +"+pr[j.pid][i]}</span></button>`);}));
    const c=document.createElement("div");c.className="pf-confirmar tf-anular";
    c.innerHTML=`<div class="mg-panel pf-caja"><h3>🚫 Anular una respuesta</h3>
      <p class="imp-ayuda">Tocá la que está mal: ${on.bots?"pasa a 0":"los demás deciden si se anula"} y los puntos se ajustan.</p>
      <div class="tf-rev tf-anular-lista">${filas.join("")||'<p class="imp-ayuda">No hay respuestas con puntos.</p>'}</div>
      <button type="button" data-x="1">Cancelar</button></div>`;
    c.addEventListener("click",e=>{const b=e.target.closest("button");if(e.target===c||b&&b.dataset.x){c.remove();return;}
      if(!b||!b.dataset.a||!on||on.fase!=="resultado")return;c.remove();
      const a=b.dataset.a,i=Number(b.dataset.i);
      /* Devolver o jugar contra bots: directo. Con amigos, deciden los demás. */
      if(anulada(a,i)||on.bots){mandar({t:"anula",n:on.n,a,i,v:!anulada(a,i)});return;}
      mandar({t:"pideanular",n:on.n,a,i});
      if(typeof mostrarToast==="function")mostrarToast("🚫","Les preguntamos a los demás si la anulan o no.","Pediste anular");});
    document.body.appendChild(c);
  }
  function pedidoAnular(quien,a,i){
    const k=a+"|"+i;if(!on||anulada(a,i)||document.querySelector(`.tf-pide-anular[data-k="${k}"]`))return;
    const nom=(on.jug.find(j=>j.pid===quien)||{}).nombre||"Alguien",de=a===on.pid?"tu respuesta":"la de "+((on.jug.find(j=>j.pid===a)||{}).nombre||""),pal=(on.resps[a]||[])[i]||"",cat=on.cats[i]||"";
    if(typeof vibrar==="function")vibrar([40,60,40]);
    const c=document.createElement("div");c.className="pf-confirmar tf-pide-anular";c.dataset.k=k;
    c.innerHTML=`<div class="mg-panel pf-caja"><div class="bb-icono">🚫</div><h3>${esc(nom)} quiere anular ${esc(de)}</h3>
      <p class="tf-obj-pal"><small>${esc(etiq(cat))}</small><b>${esc(pal)}</b></p><p class="imp-ayuda">¿La anulamos?</p>
      <button type="button" class="mg-principal" data-r="no">🚫 Anular (pasa a 0)</button><button type="button" data-r="si">✅ No anular</button></div>`;
    c.addEventListener("click",ev=>{const r=ev.target.closest("button[data-r]");if(!r)return;c.remove();
      if(!on||on.fase!=="resultado")return;
      if(r.dataset.r==="no")mandar({t:"anula",n:on.n,a,i,v:true});else mandar({t:"vale",n:on.n,a,i});});
    document.body.appendChild(c);
  }
  /* Mini popup: por qué está mal y cuál es la forma correcta (solo informa). */
  /* Distancia "como suena" (ll=y, v=b, z/ce/ci=s, h muda, c/qu=k, ge/gi=j)
     y desempate por letras: Martiyo → Martillo, Milaneza → Milanesa. */
  const fon=t=>t.replace(/h/g,"").replace(/ll/g,"y").replace(/v/g,"b").replace(/z/g,"s").replace(/c([ei])/g,"s$1").replace(/qu/g,"k").replace(/c/g,"k").replace(/g([ei])/g,"j$1").replace(/x/g,"ks").replace(/(.)\1+/g,"$1");
  let _marcas=null,_pelis=null;const marcasSet=()=>_marcas||(_marcas=new Set(String(window.TUTTI_MARCAS||"").split(",").map(NORM).filter(Boolean)));
  /* Apellidos comunes: en Famoso no valen solos ("González" es muy fácil),
     van con nombre y apellido ("Luis Suárez"). Los raros sí ("Cavani"). */
  const COMUNES=new Set("gonzalez,rodriguez,perez,garcia,martinez,fernandez,lopez,sanchez,gomez,diaz,alvarez,romero,sosa,silva,pereira,pereyra,torres,ruiz,ramirez,flores,benitez,acosta,medina,herrera,aguirre,castro,rojas,morales,gutierrez,ortiz,nunez,cabrera,olivera,mendez,ramos,vazquez,jimenez,gimenez,hernandez,moreno,molina,martin,dominguez,cruz,castillo,romano,rocha,santos,varela,paz,leon,rios,lima,bueno,sosa,ferreira,machado,da silva,de leon,de los santos,cardozo,correa,duarte,ferrari,blanco,rivero,vega,nieto,campos,mora,fonseca,borges,otero,acevedo,araujo,barrios,cortes,moreira,montero,cabral,luna,alonso,navarro,delgado,vidal,arias,sosa,aguilar,mendoza,miranda,garrido,pacheco,caceres,ortega,lima,leal,silvera,silveira,viera,pintos,alvez,techera,perdomo,larrosa,costa,marquez,piriz,curbelo,barboza,reyes,barreto,bentancor,dos santos,fagundez,velazquez,soria,umpierrez,franco,caballero,santana,lemos,bonilla,britos,tejera,da rosa,antunez,vera,caraballo,fleitas,carballo,guerra,clavijo,rosa,almeida,quintana,pena,cuello,fuentes,muniz,farias,camejo,godoy,sena,corbo,batista,rey,aguiar,peralta,luzardo,rosas,vargas,maciel,espinosa,mesa,bermudez,camacho,figueroa,souza,leites,duran,falero,davila,de souza,furtado,cedres,toledo,villalba,colman,acuna,marrero,lorenzo,machin,estevez,rivas,rossi,ibarra,fontes,gallo,alves,conde,pirez,saravia,figueredo,valdez,ojeda,denis,ayala,ribeiro,melo,mello,guerrero,collazo,mederos,dutra,ledesma,nieves,sellanes,prieto,sierra,maldonado,villar,rosano,burgos,sequeira,da costa,amaro,amaral,alfonso,parodi,barreiro,carrasco,gil,camargo,gadea,almada,moraes,soto,de armas,maidana,trinidad,cardoso,baez,ocampo,brun,vila,aquino,menendez,escobar,lucas,marichal,montes de oca,noble,robaina,freitas,carbajal,gularte,bravo,vaz,terra,lema,soca,bianchi,saavedra,roman,avila,barcelo,severo,alonzo,texeira,carro,segovia,barrera,nogueira,villanueva,fraga,centurion,trindade,san martin,fajardo,freire,presa,andrade,zeballos,cal,macedo,casas,galvan,chaves,guillen,banchero,lemes,pastorino,pedrozo,monzon,etcheverry,albornoz,roldan,sastre,izquierdo,chagas,ferreyra,cuadrado,echeverria,zapata,marin,magallanes,bruno,trujillo,borba,mattos,meneses,pose,caetano,peraza,viana,cuadro,colombo,guedes,espino,trias,bello,arevalo,miraballes,amorin,pais,cano,barros,motta,bentos,berrutti,padilla,falcon,rivera,brum,portillo,velazco,aranda,pino,juarez,beltran,paredes,ferraro,paiva,andrada,altez,alfaro,montiel,grana,ruiz diaz,coronel,jorge,zunino,cancela,souto,aguilera,de mello,risso,garay,perera,calvo,tabeira,lago,arbelo,aparicio".split(","));
  let _fam=null;const famSet=()=>{if(!_fam){_fam=new Set();String(window.TUTTI_BANDAS||"").split(",").map(NORM).filter(Boolean).forEach(x=>{_fam.add(x);const sin=x.replace(/^(el|la|los|las) /,"");if(sin!==x&&!COMUNES.has(sin))_fam.add(sin);});String(window.TUTTI_FAMOSOS||"").split(",").map(NORM).filter(Boolean).forEach(x=>{_fam.add(x);const w=x.split(" ");if(w.length>1)[w.slice(1).join(" "),w[w.length-1]].forEach(a=>{if(!COMUNES.has(a))_fam.add(a);});});}return _fam;};
  const pelisSet=()=>_pelis||(_pelis=new Set(String(window.TUTTI_PELICULAS||"").split(",").map(NORM).filter(Boolean)));
  const lev=(a,b)=>{const m=a.length,n=b.length;if(Math.abs(m-n)>3)return 99;let prev=Array.from({length:n+1},(_,k)=>k);for(let x=1;x<=m;x++){const cur=[x];for(let y=1;y<=n;y++)cur[y]=Math.min(prev[y]+1,cur[y-1]+1,prev[y-1]+(a[x-1]===b[y-1]?0:1));prev=cur;}return prev[n];};
  const lindo=t=>t.replace(/\b\w/g,c=>c.toUpperCase());
  async function sugerir(cat,valor){
    const v=NORM(valor),k=CLAVE_CAT[cat];if(!v)return null;
    const fv=fon(v),tope=v.length<=4?1:v.length<=8?2:3;
    /* La más parecida "como suena" de una lista (null si ninguna se parece). */
    const masParecida=lista=>{let mejor=null,puntaje=1e9;for(const c0 of lista){const c=NORM(c0);if(!c||c===v||Math.abs(c.length-v.length)>tope+1)continue;const df=lev(fv,fon(c));if(df>tope)continue;const p=df*10+lev(v,c);if(p<puntaje){puntaje=p;mejor=c0;}}return mejor;};
    if(k==="wiki"){
      /* Primero las listas propias (Rebook → Reebok); después Wikipedia, pero
         solo si el título se parece de verdad a lo escrito (antes devolvía el
         primer resultado aunque no tuviera nada que ver). */
      const B=window.TUTTI_BOTS||{},propia=cat==="Marca"?[...marcasSet()].concat(String(B.marca||"").split(",")):cat==="Famoso"?String(B.famoso||"").split(",").concat(String(window.TUTTI_FAMOSOS||"").split(","),String(window.TUTTI_BANDAS||"").split(",")):String(B.pelicula||"").split(",").concat([...pelisSet()]);
      const loc=masParecida(propia);if(loc)return lindo(loc);
      try{const r=await fetch("https://es.wikipedia.org/w/api.php?action=query&list=search&srlimit=8&srinfo=suggestion&format=json&origin=*&srsearch="+encodeURIComponent(valor));const d=await r.json();
        const titulos=((d&&d.query&&d.query.search)||[]).map(x=>x.title.replace(/\s*\(.*?\)\s*$/,""));
        const sg=d&&d.query&&d.query.searchinfo&&d.query.searchinfo.suggestion;if(sg)titulos.push(sg);
        const w=masParecida(titulos);if(!w)return null;
        /* Solo si es de la categoría (antes "todo terreno" en Película sugería "Todoterreno", que es un auto). */
        const t=await enWikiTipo(NORM(w),TIPO_CAT[cat]);return t===true?lindo(w):null;}catch(e){return null;}  /* solo si Wikipedia confirma que ES de la categoría (Emanero → "Enero" no es un famoso) */
    }
    let cand=[];
    if(k&&k!=="dic")cand=[...setDe(k)].concat(k==="comida"?[...setDe("fruta")]:[]);
    else{
      /* También la letra que "suena igual": Girafa → Jirafa, Vaca/Baca, Zapato/Sapato… */
      const ALT={g:["j"],j:["g"],b:["v"],v:["b"],s:["c","z"],c:["s","z","k"],z:["s","c"],y:["l"],l:["y"],h:[v[1]||""],k:["c","q"],q:["c","k"]};
      for(const l of [v[0]].concat(ALT[v[0]]||[]).filter(Boolean)){const d=await cargarDic(l);if(d)cand=cand.concat([...d]);}
    }
    let mejor=null,puntaje=1e9;
    for(const c of cand){if(c===v||Math.abs(c.length-v.length)>tope+1)continue;const df=lev(fv,fon(c));if(df>tope)continue;const p=df*10+lev(v,c);if(p<puntaje){puntaje=p;mejor=c;if(p<=1)break;}}
    return mejor?lindo(mejor):null;
  }
  function explicar(cat,valor){
    if(!valor)return;
    const viejo=document.querySelector(".tf-pop");if(viejo)viejo.remove();
    const p=document.createElement("div");p.className="tf-pop";
    p.innerHTML=`<div class="tf-pop-caja"><div class="tf-pop-cab">⚠️ ${esc(etiq(cat))}</div><div class="tf-pop-mal">«${esc(valor)}»</div><div class="tf-pop-txt" id="tfPopTxt">Buscando la forma correcta…</div><button type="button" class="tf-pop-ok">Entendido</button></div>`;
    p.onclick=e=>{if(e.target===p||e.target.closest(".tf-pop-ok"))p.remove();};
    document.body.appendChild(p);
    /* Si la "corrección" es la misma palabra (solo cambia un tilde), no está
       mal escrita: está bien, pero no es de esa categoría (Iglú no es marca). */
    if(cat==="Famoso"&&COMUNES.has(NORM(valor))){p.querySelector("#tfPopTxt").innerHTML=`<b>${esc(valor)}</b> es un apellido muy común: en Famoso va con nombre y apellido (ej. «Luis Suárez»).<br><small>Por eso vale 0.</small>`;return;}
    sugerir(cat,valor).then(async sg=>{const t=p.querySelector("#tfPopTxt");if(!t)return;
      const nc=esc(NOM_CAT[cat]||cat);
      if(sg&&NORM(sg)!==NORM(valor)){t.innerHTML=`Lo correcto es <b>${esc(sg)}</b>.<br><small>Por eso vale 0: estaba mal escrita.</small>`;return;}
      const existe=await enDiccionario(NORM(valor)).catch(()=>null);
      t.innerHTML=existe||sg?`<b>${esc(sg||valor)}</b> está bien escrita, pero no la encontré como ${nc}.<br><small>Por eso vale 0. Quien la escribió puede apelar.</small>`:`No la encontré como ${nc} y no hay una parecida.<br><small>Por eso vale 0.</small>`;});
  }
  function cerrarApelaciones(){document.querySelectorAll(".tf-apelacion,.tf-revision-propia,.tf-pide-anular,.tf-anular").forEach(x=>x.remove());}
  /* Apelación: el autor de una palabra en amarillo pide que se la cuenten;
     a cada uno le aparece el aviso y decide si le suma (+10, como el
     sumador) o no. Si alguien la acepta, además queda aprobada para siempre. */
  function apelacion(a,i){
    if(!on||document.querySelector(`.tf-apelacion[data-k="${a}|${i}"]`))return;
    const quien=(on.jug.find(j=>j.pid===a)||{}).nombre||"Alguien",pal=(on.resps[a]||[])[i]||"",cat=on.cats[i]||"";
    if(typeof vibrar==="function")vibrar([40,60,40]);
    const c=document.createElement("div");c.className="pf-confirmar tf-apelacion";c.dataset.k=a+"|"+i;
    c.innerHTML=`<div class="mg-panel pf-caja"><div class="bb-icono">🙋</div><h3>${esc(quien)} apela su respuesta</h3>
      <p class="tf-obj-pal"><small>${esc(etiq(cat))}</small><b>${esc(pal)}</b></p><p class="imp-ayuda">El juego no la reconoció. ¿Le sumás los puntos?</p>
      <button type="button" class="mg-principal" data-r="si">✅ Sí, vale (+10)</button><button type="button" data-r="no">❌ No vale</button></div>`;
    c.addEventListener("click",ev=>{const r=ev.target.closest("button[data-r]");if(!r)return;c.remove();
      if(r.dataset.r!=="si"||!on||on.fase!=="resultado")return;
      const p=Math.max(10,extraDe(a,i)||0);mandar({t:"extra",n:on.n,a,i,p});
      /* Apelación aceptada por otra persona: la palabra queda válida para siempre. */
      if(pal){aprobarPalabra(cat,pal);if(typeof mostrarToast==="function")mostrarToast("✅","«"+pal+"» ya vale en "+cat+" para las próximas partidas.");}});
    document.body.appendChild(c);
  }
  function pintarVotos(){
    if(!raiz||!on||on.fase!=="resultado")return;
    const pr=puntosRonda();
    raiz.querySelectorAll(".tf-cel[data-a]").forEach(b=>{const a=b.dataset.a,i=Number(b.dataset.i),ok=marca(a,i),v=(on.resps[a]||[])[i];
      b.querySelector(".tf-pts").textContent="+"+(v?pr[a][i]:0);
      const ex=extraDe(a,i),sm=b.querySelector(".tf-sum b");if(sm)sm.textContent=ex||0;
      const ap=b.querySelector(".tf-apelar");if(ap&&on.bots)ap.textContent=ex==null?"🙋 Apelar":"🙋 "+ex+" pts";
      const su=b.querySelector(".tf-sum");if(su)su.classList.toggle("tf-sum-off",!puedeSumar(a,i));
      const an=!!v&&anulada(a,i),salv=!!v&&!ok&&!an&&(vale(a,i)||ex>0);
      b.classList.toggle("tf-anulada",an);b.classList.toggle("tf-salvada",salv);b.classList.toggle("tf-dudosa",!!v&&!ok&&!salv&&!an);
      const mk=b.querySelector(".tf-marca.mal");if(mk)mk.textContent=salv?"✓":"⚠️";
    });
    const sumR=pid=>sumar(pr[pid]||[]);
    raiz.querySelectorAll("[data-tot]").forEach(el=>{el.textContent=sumR(el.dataset.tot);});
    const maxR=Math.max(...on.jug.map(j=>sumR(j.pid)));
    raiz.querySelectorAll("[data-nom]").forEach(el=>{el.classList.toggle("tf-lider",maxR>0&&sumR(el.dataset.nom)===maxR);const pe=el.querySelector(".tf-pen");if(pe)pe.hidden=!penalizado(el.dataset.nom);});
    raiz.querySelectorAll("[data-tot]").forEach(el=>el.classList.toggle("tf-lider",maxR>0&&sumR(el.dataset.tot)===maxR));
    const orden=on.jug.map(j=>[j,sumR(j.pid),(on.ganadas[j.pid]||0)+sumR(j.pid)]).sort((a,b)=>b[2]-a[2]);
    const t=raiz.querySelector("#tfTitulo");
    if(t)t.textContent="RESULTADOS · "+((on.rj||1)>=(on.tot||RONDAS)?"ÚLTIMA RONDA":"RONDA "+(on.rj||1)+" DE "+(on.tot||RONDAS));
    const fr=raiz.querySelector("#tfFrase");
    if(fr){const emp=orden.length>1&&orden[0][2]===orden[1][2];let txt=emp?"Vienen empatados…":(orden[0][0].pid===on.pid?"Vas ganando…":esc(orden[0][0].nombre)+" va ganando…");
      const mias=on.resps[on.pid]||[],dud=on.cats.map((c,i)=>i).find(i=>mias[i]&&!marca(on.pid,i)&&!vale(on.pid,i)&&!(extraDe(on.pid,i)>0));
      if(dud!=null)txt+=` y tu «${esc(mias[dud])}» salió en <span class="tf-amar">amarillo</span>.`;
      fr.innerHTML=txt;}
    const tabla=raiz.querySelector("#tfTabla");
    if(tabla)tabla.innerHTML=orden.map(([j,r,tot])=>`<li><span>${esc(j.nombre)}</span><b>${tot} <small>(+${r})</small></b></li>`).join("");
  }
  /* Historial de palabras en amarillo (⚠️) para que Gonzalo las revise y las
     agreguemos a las listas: las anota el anfitrión en Supabase (gya_ranking,
     grupo "tutti_dudas", una fila por categoría+palabra con cuántas veces salió).
     Las de los bots no (sus errores de tipeo son a propósito). */
  const DUDAS="tutti_dudas";
  function registrarDudas(marcas){
    try{const supa=typeof obtenerSupa==="function"?obtenerSupa():null;if(!supa)return;
      on.jug.forEach(j=>{if(j.bot)return;const r=on.resps[j.pid]||[];(marcas[j.pid]||[]).forEach((ok,i)=>{if(r[i]&&!ok)anotarDuda(supa,on.cats[i],r[i],j.nombre);});});
    }catch(e){}
  }
  async function anotarDuda(supa,cat,w,quien){
    const pal=String(w).trim().slice(0,40),clave=(cat+"|"+NORM(pal)).slice(0,90),ahora=new Date().toISOString();
    try{
      const r=await supa.from("gya_ranking").select("estado_juego").eq("grupo",DUDAS).eq("apodo",clave).limit(1);
      const prev=(r&&r.data&&r.data[0]&&r.data[0].estado_juego)||{};
      await supa.from("gya_ranking").upsert({grupo:DUDAS,apodo:clave,monedas_totales:0,ciudades_ganadas:0,mejor_racha:0,logros:0,
        estado_juego:{cat,palabra:pal,veces:(Number(prev.veces)||0)+1,jugador:String(quien||"").slice(0,20),ultima:ahora},actualizado_en:ahora},{onConflict:"grupo,apodo"});
    }catch(e){}
  }
  /* Pantalla para Gonzalo (Pruebas): la lista, de la más nueva a la más vieja. */
  async function verDudas(){
    const viejo=document.querySelector(".tf-dudas");if(viejo)viejo.remove();
    const c=document.createElement("div");c.className="pf-confirmar tf-dudas";
    c.innerHTML=`<div class="mg-panel pf-caja"><h3>🍉 Palabras en amarillo</h3><p class="imp-ayuda">Las que el Tutti Frutti no reconoció. Pasame las que estén bien y las agrego.</p><div class="tf-dudas-lista">Cargando…</div><button type="button" class="mg-principal" data-c="1">📋 Copiar lista</button><button type="button" data-x="1">Cerrar</button></div>`;
    document.body.appendChild(c);
    let filas=[];
    c.addEventListener("click",e=>{const b=e.target.closest("button");if(e.target===c||(b&&b.dataset.x))c.remove();
      if(b&&b.dataset.c){const t=filas.map(f=>f.cat+": "+f.palabra+" ("+f.veces+")").join("\n");try{navigator.clipboard.writeText(t);if(typeof mostrarToast==="function")mostrarToast("📋","Lista copiada: pegámela en el chat.","Copiado");}catch(er){}}});
    const caja=c.querySelector(".tf-dudas-lista");
    try{const supa=typeof obtenerSupa==="function"?obtenerSupa():null;if(!supa)throw 0;
      const r=await supa.from("gya_ranking").select("estado_juego,actualizado_en").eq("grupo",DUDAS).order("actualizado_en",{ascending:false}).limit(500);
      /* Las que ya agregamos a las listas no se muestran (quedaban de partidas viejas). */
      filas=((r&&r.data)||[]).map(x=>x.estado_juego||{}).filter(x=>x.palabra&&!enListaPropia(x.cat,x.palabra));
      caja.innerHTML=filas.length?`<table><tr><th>Categoría</th><th>Palabra</th><th>Veces</th></tr>${filas.map(f=>`<tr><td>${esc(f.cat||"")}</td><td><b>${esc(f.palabra)}</b><small>${esc(f.jugador||"")} · ${esc(String(f.ultima||"").slice(0,10).split("-").reverse().join("/"))}</small></td><td>${Number(f.veces)||1}</td></tr>`).join("")}</table>`:"Todavía no hay palabras en amarillo.";
    }catch(e){caja.textContent="No se pudo cargar (¿sin internet?).";}
  }
  /* Final del mejor de 3: gana el que ganó más rondas; si empatan, el de más puntos. */
  function mostrarFinal(){
    detenerMusica();cerrarApelaciones();
    if(!raiz||!on)return;on.fase="final";
    const orden=on.jug.map(j=>[j,on.rg[j.pid]||0,on.ganadas[j.pid]||0]).sort((a,b)=>b[1]-a[1]||b[2]-a[2]);
    const top=orden[0],ganan=orden.filter(o=>o[1]===top[1]&&o[2]===top[2]).map(o=>o[0].nombre);
    if(ganan.includes(yo())||orden[0][0].pid===on.pid){if(typeof bip==="function")[523,659,784,1047].forEach((f,i)=>setTimeout(()=>bip(f,.22,"triangle",.05),i*140));}
    if(on.host){partidas++;guardar();}
    pantalla(`<div class="mg-panel imp-panel imp-fin"><img class="tf-trofeo" src="${ARTE("trofeo")}" alt="" draggable="false"><h3>${ganan.length>1?"¡Empate entre "+esc(ganan.join(" y "))+"!":"¡Ganó "+esc(ganan[0])+"!"}</h3>
      <p class="imp-ayuda">${on.tot||RONDAS} rondas: gana el que ganó más rondas (si empatan, el de más puntos).</p>
      <ol class="kar-podio">${orden.map(([j,rg,p],k)=>`<li style="--c:#E5197C"><span>${k+1}</span><i>${esc((j.nombre||"?")[0].toUpperCase())}</i><b>${esc(j.nombre)}${j.pid===on.pid?" (vos)":""}</b><em>${rg} ${rg===1?"ronda":"rondas"} · ${p} pts</em></li>`).join("")}</ol>
      ${salieronHtml()}
      ${on.host?`<button type="button" class="mg-principal" id="tfRevancha">🔄 Revancha</button>`:`<p class="imp-ayuda">Esperando que el anfitrión arranque la revancha…</p>`}</div>`);
    if(on.host)q("tfRevancha").onclick=e=>{const b=e&&e.currentTarget;if(b){if(b.disabled)return;b.disabled=true;}
      const revancha=()=>{if(!on)return;on.ganadas={};on.rg={};on.rj=0;on.tot=RONDAS;difundirSala();nuevaRonda();};
      /* contra la máquina, cada revancha es una partida nueva: gasta 1 ficha */
      if(on.bots&&window.Fichas&&!Fichas.usar("tutti-frutti",revancha)){if(b)b.disabled=false;return;}
      revancha();};
  }
  /* Link ?tutti=<SALA>&de=<nombre>: abre el juego y se une solo. */
  function abrirInvitacion(sala,de){
    if(typeof Extensiones==="undefined")return;
    Extensiones.abrirJuego("tutti-frutti");
    setTimeout(()=>{if(raiz)unirse(sala,de);},300);
  }
  return{abrir,salir,abrirInvitacion,verDudas,_revisar:(c,v)=>revisar(c,v),_aprobarPalabra:(c,v)=>aprobarPalabra(c,v),_explicar:(c,v)=>explicar(c,v),_sugerir:(c,v)=>sugerir(c,v),enter:()=>{try{confirmarCampo();}catch(e){}},partidasJugadas:()=>{cargar();return partidas;}};
})();
window.TuttiFrutti=TuttiFrutti;
