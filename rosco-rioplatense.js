/* El Rosco: práctica gratuita. Usa el audio, logros y objetivos de la app. */
const ROSCO_CONFIG={
  letras:"ABCDEFGHIJKLMNOPQRSTUVYZ",segundosPorLetra:6,puntosAcierto:100,bonoSegundo:2,
  giroMs:1500,vueltas:3,pausaMs:1000,ticMs:50,proporcionAvance:.7,
  margenMinimo:.75,descensoMargen:.05,
  niveles:{1:{letras:12,margen:1.6},2:{letras:16,margen:1.4},3:{letras:20,margen:1.2},4:{letras:24,margen:1}}
};
const RoscoRioplatense=(()=>{
  const CLAVE="gya_rosco_rioplatense";
  let datos=cargar(),raiz=null,shell=null,items=[],estados=[],respuestas=[],actual=-1,destino=-1,angulo=0;
  let nivel=1,config=null,fase="inicio",tiempo=0,espera=0,ultimo=0,intervalo=null,ultimoTac=0,duelo=false,usadasSesion=new Set();
  let audioMusica=null,reconocimiento=null,escuchando=false,altoLibre=0;
  /* Voz/teclado de prueba en Gonzalo y Vale (Vale solo en modo TV). */
  let pruebaG=false,vozG=false,vozLeyendoG=false,vozTimerG=null,vozMensajeG="",vozPistaG=null,vozSilenciosG=0,vozStreamG=null,vozGeneracionG=0;
  let vozConsultadaG=false,avisoVozG=null;
  function cerrarConsultaVozG(){if(avisoVozG){avisoVozG.remove();avisoVozG=null;}}
  /* Una única decisión en la partida: Sí activa voz sin tocar de nuevo Hablar;
     No mantiene exactamente el manejo previo con teclado. */
  function mostrarConsultaVozG(){
    if(!pruebaG||vozConsultadaG||avisoVozG||!horizontalG()||!window.GyaTV?.activo?.("ext"))return false;
    vozConsultadaG=true;vozLeyendoG=true;ultimo=performance.now();
    const capa=document.createElement("div");capa.className="rr-voz-consulta";
    capa.setAttribute("role","dialog");capa.setAttribute("aria-modal","true");
    capa.setAttribute("aria-label","Activar respuestas por voz");
    capa.innerHTML='<div class="rr-voz-consulta-caja"><h3>¿Querés jugar con el micrófono?</h3><p>Respondé hablando o decí «Pasapalabra», sin tocar Enviar.</p><div class="rr-voz-consulta-acciones"><button type="button" data-voz="no">No, escribir</button><button type="button" data-voz="si">Sí, activar voz</button></div></div>';
    capa.addEventListener("click",e=>{
      const boton=e.target.closest("button[data-voz]");if(!boton)return;
      const activar=boton.dataset.voz==="si";
      cerrarConsultaVozG();vozLeyendoG=false;ultimo=performance.now();
      if(!raiz||fase!=="resolver"||document.hidden)return;
      if(activar){alternarVozG();if(vozG)leerPistaG();}
      else if(typeof hablar==="function")hablar(items[actual].definicion,audioMusica);
    });
    raiz.appendChild(capa);avisoVozG=capa;
    capa.querySelector('[data-voz="si"]').focus({preventScroll:true});
    return true;
  }
  /* Dibujos en assets/rosco/ (hoja de ChatGPT recortada). */
  const ARTE=n=>"assets/rosco/"+n+".webp",ico=n=>'<img class="rr-ico" src="'+ARTE(n)+'" alt="" draggable="false">';
  function iniciarMusicaJuego(){
    /* En el piloto de Giro no reproducir la música del Rosco para Gonzalo. */
    if(pruebaG&&window.GIRO_ROSCO_PILOTO!==false)return;
    try{
      if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
      if(!audioMusica){audioMusica=new Audio("assets/audio/rosco-rioplatense-musica.mp3");audioMusica.loop=true;audioMusica.volume=.28;}
      if(audioMusica.paused)audioMusica.play().catch(()=>{});
    }catch(e){}
  }
  function detenerMusicaJuego(){try{if(audioMusica&&!audioMusica.paused)audioMusica.pause();}catch(e){}}
  const $=s=>raiz?.querySelector(s);
  const normalizar=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/\s+/g,"");
  /* Vale la palabra, sus alternativas, y también la palabra con un complemento corto "de/del…"
     (ej. "pronóstico del tiempo" para PRONOSTICO): reclamos de jugadores, 22/10/2026. */
  function vale(d,valor){
    const opciones=[d.palabra,...(d.alternativas||[])].map(normalizar);
    if(opciones.includes(valor))return true;
    const base=normalizar(d.palabra),resto=valor.startsWith(base)?valor.slice(base.length):"";
    return resto.length>0&&resto.length<=12&&/^(DEL?|DELA|DELOS|DELAS)[A-Z]{3,}$/.test(resto);
  }
  const numero=(v,base=0)=>Number.isFinite(v)&&v>=0?v:base;
  function cargar(){
    try{const d=JSON.parse(localStorage.getItem(CLAVE));if(d&&typeof d==="object")return{
      mejor:numero(d.mejor),nivelMax:Math.max(1,Math.floor(numero(d.nivelMax,1))),
      ultimas:d.ultimas&&typeof d.ultimas==="object"?d.ultimas:{}
    };}catch(e){}
    return{mejor:0,nivelMax:1,ultimas:{}};
  }
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}}
  function configNivel(n){
    const c=ROSCO_CONFIG.niveles[n]||{letras:24,margen:Math.max(ROSCO_CONFIG.margenMinimo,1-(n-4)*ROSCO_CONFIG.descensoMargen)};
    return{...c,segundos:Math.round(c.letras*ROSCO_CONFIG.segundosPorLetra*c.margen)};
  }
  function mezclar(lista){const a=[...lista];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function armarRonda(){
    const letras=mezclar([...ROSCO_CONFIG.letras]).slice(0,config.letras).sort();
    /* Nunca se repite una palabra entre partidas: primero salen todas las que
       todavía no viste de esa letra (de cualquier nivel, prefiriendo el tuyo);
       recién cuando se agotan todas, esa letra vuelve a empezar. */
    const vistas=Vistas.cargar("rosco");
    const elegidas=letras.map(letra=>{
      const banco=ROSCO_DATOS.filter(d=>d.letra===letra);
      let libres=banco.filter(d=>!vistas.has(d.palabra)&&!usadasSesion.has(d.palabra));
      if(!libres.length){banco.forEach(d=>vistas.delete(d.palabra));libres=banco.filter(d=>d.palabra!==datos.ultimas[letra]);if(!libres.length)libres=banco;}
      const preferidas=libres.filter(d=>nivel<3?d.nivel<=2:d.nivel>=2);
      const elegida=mezclar(preferidas.length?preferidas:libres)[0];
      datos.ultimas[letra]=elegida.palabra;usadasSesion.add(elegida.palabra);vistas.add(elegida.palabra);return elegida;
    });
    Vistas.guardar("rosco",vistas);
    return elegidas;
  }
  function pendientes(){return estados.map((s,i)=>s==="pendiente"?i:-1).filter(i=>i>=0);}
  function conteo(s){return estados.filter(x=>x===s).length;}
  function hud(){
    $("#rrNivel").textContent=nivel;$("#rrAciertos").textContent=conteo("acierto")+"/"+items.length;
    $("#rrErrores").textContent=conteo("error");$("#rrTiempo").textContent=Math.max(0,Math.ceil(tiempo/1000));
    $("#rrBarra").style.width=Math.max(0,tiempo/(config.segundos*1000)*100)+"%";
    $("#rrEnviar").disabled=fase!=="resolver";$("#rrPasar").disabled=fase!=="resolver";
    const micro=$("#rrVoz");if(micro)micro.disabled=fase!=="resolver";
    raiz.dataset.fase=fase;
    raiz.querySelectorAll(".rr-letra").forEach((el,i)=>{
      el.className="rr-letra "+estados[i]+(i===actual?" actual":"");
      el.setAttribute("aria-label",items[i].letra+": "+(i===actual?"actual, ":"")+estados[i]);
    });
  }
  function mensaje(texto,tipo=""){const el=$("#rrMensaje");el.textContent=texto;el.className="rr-mensaje "+tipo;}
  function sonido(acierto){
    if(typeof bip!=="function")return;
    // Acorde luminoso para acertar; al fallar solo vibra.
    if(acierto){bip(660,.2,"sine",.065);bip(990,.3,"triangle",.04);}
    if(typeof vibrar==="function")vibrar(acierto?25:[45,40,45]);
  }

  function horizontalG(){
    return pruebaG&&matchMedia("(orientation: landscape) and (min-width:700px) and (max-width:1024px) and (max-height:600px)").matches;
  }
  function mostrarEstadoVozG(texto){
    vozMensajeG=texto;
    const estado=$("#rrEstadoVozG"),boton=$("#rrVoz");
    if(estado)estado.textContent=texto;
    if(boton&&pruebaG){boton.classList.toggle("rr-grabando",vozG);boton.setAttribute("aria-pressed",String(vozG));const span=boton.querySelector("span");if(span)span.textContent=vozG?"Apagar":"Hablar";}
  }
  function actualizarEntradaG(){
    if(!raiz||!pruebaG)return;
    const campo=$("#rrEntrada"),propio=horizontalG();
    campo.readOnly=propio||vozG;campo.inputMode=propio||vozG?"none":"text";
    if((propio||vozG)&&document.activeElement===campo)campo.blur();
    raiz.classList.toggle("rr-con-teclado",propio&&!vozG);
    raiz.classList.toggle("rr-con-voz",vozG);
    if(!vozG)mostrarEstadoVozG(propio?"Escribí a la derecha o activá Hablar.":"Modo escritura.");
  }
  function tecladoG(){
    const panel=$("#rrTecladoG");if(!panel)return;
    panel.replaceChildren();
    for(const letras of ["QWERTYUIOP","ASDFGHJKLÑ","ZXCVBNM"]){
      const fila=document.createElement("div");fila.className="rr-teclas-fila";
      for(const letra of letras){
        const b=document.createElement("button");b.type="button";b.className="rr-tecla-g";b.textContent=letra;
        b.onclick=()=>{if(fase!=="resolver"||vozG)return;const input=$("#rrEntrada");input.value=(input.value+letra).slice(0,60);};fila.appendChild(b);
      }
      panel.appendChild(fila);
    }
    const fila=document.createElement("div");fila.className="rr-teclas-fila";
    for(const [t,f] of [["⌫ Borrar",()=>{$("#rrEntrada").value=$("#rrEntrada").value.slice(0,-1);}],["Limpiar",()=>{$("#rrEntrada").value="";}]]){
      const b=document.createElement("button");b.type="button";b.className="rr-tecla-g rr-tecla-accion";b.textContent=t;b.onclick=()=>{if(fase==="resolver"&&!vozG)f();};fila.appendChild(b);
    }
    panel.appendChild(fila);
  }
  function liberarMicrofonoG(){
    const stream=vozStreamG;vozStreamG=null;
    if(stream)for(const track of stream.getTracks())try{track.stop();}catch(e){}
  }
  function pararVozG(){
    ++vozGeneracionG;
    vozG=false;vozLeyendoG=false;vozSilenciosG=0;clearTimeout(vozTimerG);vozTimerG=null;
    if(vozPistaG){try{speechSynthesis.cancel();}catch(e){}vozPistaG=null;}
    detenerVoz();liberarMicrofonoG();actualizarEntradaG();
    mostrarEstadoVozG("Micrófono apagado.");
  }
  function arrancarEscuchaG(){
    if(!pruebaG||!vozG||vozLeyendoG||fase!=="resolver"||document.hidden||escuchando)return;
    const Recon=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recon){pararVozG();mensaje("El navegador no permite reconocer voz. Probá abrir girayadivina.com desde Chrome.");return;}
    const r=new Recon();reconocimiento=r;escuchando=true;
    r.lang="es-UY";r.continuous=true;r.interimResults=false;r.maxAlternatives=4;
    /* El navegador puede terminar sesiones continuas por inactividad.
       La captura permanece abierta mientras el modo voz esté activo. */
    let inicioIntento=performance.now();
    detenerMusicaJuego();
    mostrarEstadoVozG("Escuchando · Decí la palabra o Pasapalabra");
    r.onresult=e=>{
      if(!vozG||reconocimiento!==r||fase!=="resolver"||actual<0)return;
      const resultado=e.results?.[e.resultIndex]||e.results?.[e.results.length-1];
      if(!resultado||!resultado.isFinal)return;
      const opciones=Array.from(resultado).map(x=>String(x.transcript||"").trim().replace(/[¿¡!?,.;:]+$/g,"")).filter(Boolean);
      if(!opciones.length)return;
      const pasa=opciones.some(t=>["PASAPALABRA","PASAR","PASO"].includes(normalizar(t)));
      if(pasa){vozSilenciosG=0;pasar();return;}
      vozSilenciosG=0;
      const reconocida=opciones.find(t=>vale(items[actual],normalizar(t)))||opciones[0];
      $("#rrEntrada").value=reconocida.slice(0,60);
      enviar();
    };
    r.onerror=e=>{
      if(reconocimiento!==r)return;
      const error=String(e.error||"");
      if(["not-allowed","service-not-allowed","audio-capture","language-not-supported"].includes(error)){
        pararVozG();mensaje("No se pudo usar el micrófono ("+error+"). Revisá el permiso de Chrome o de la app.");return;
      }
      if(error==="network")mostrarEstadoVozG("El reconocimiento necesita conexión. Reintentando…");
      if(error==="no-speech")mostrarEstadoVozG("Sin respuesta · Mantengo activo el modo voz.");
    };
    r.onend=()=>{
      if(reconocimiento!==r)return;
      reconocimiento=null;escuchando=false;
      if(vozG&&!vozLeyendoG&&fase==="resolver"&&!document.hidden){
        /* El reintento anterior escalaba hasta 5 s después de estar en silencio.
           Reabrir rápido tras una sesión normal; frenar un bucle de errores
           inmediatos para evitar avisos repetidos del micrófono de Android. */
        const duro=performance.now()-inicioIntento;
        vozSilenciosG=duro<1200?Math.min(vozSilenciosG+1,3):0;
        const pausa=vozSilenciosG?650+vozSilenciosG*350:300;
        clearTimeout(vozTimerG);vozTimerG=setTimeout(arrancarEscuchaG,pausa);
      }
    };
    try{r.start();inicioIntento=performance.now();}catch(err){reconocimiento=null;escuchando=false;pararVozG();mensaje("No se pudo iniciar el micrófono. Revisá los permisos del juego.");}
  }
  function leerPistaG(){
    if(!pruebaG||!vozG||fase!=="resolver"||actual<0)return;
    detenerVoz();detenerMusicaJuego();vozLeyendoG=true;
    mostrarEstadoVozG("Leyendo la pista…");
    try{
      if(!("speechSynthesis" in window))throw Error("Sin lectura de voz");
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(items[actual].definicion);
      u.lang="es-UY";u.rate=.97;vozPistaG=u;
      const terminar=()=>{
        if(vozPistaG!==u)return;vozPistaG=null;vozLeyendoG=false;
        ultimo=performance.now();
        if(vozG&&fase==="resolver")arrancarEscuchaG();
      };
      u.onend=terminar;u.onerror=terminar;
      speechSynthesis.speak(u);
      clearTimeout(vozTimerG);
      vozTimerG=setTimeout(()=>{if(vozPistaG===u){try{speechSynthesis.cancel();}catch(e){}terminar();}},10000);
    }catch(err){vozPistaG=null;vozLeyendoG=false;arrancarEscuchaG();}
  }
  function alternarVozG(){
    if(!pruebaG)return;
    if(vozG){pararVozG();return;}
    if(fase!=="resolver")return;
    if(!window.SpeechRecognition&&!window.webkitSpeechRecognition){
      mostrarEstadoVozG("Este navegador no admite respuestas habladas.");
      mensaje("Para probar voz usá Chrome en Android.");
      return;
    }
    vozG=true;vozSilenciosG=0;const sesion=++vozGeneracionG;
    actualizarEntradaG();mostrarEstadoVozG("Solicitando micrófono…");
    /* Una sola autorización al tocar Hablar y captura mantenida durante el modo.
       Chrome puede reiniciar el reconocimiento sin soltar el micrófono físico. */
    if(navigator.mediaDevices?.getUserMedia){
      navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})
        .then(stream=>{
          if(!vozG||sesion!==vozGeneracionG||document.hidden||!raiz){
            for(const t of stream.getTracks())t.stop();return;
          }
          vozStreamG=stream;arrancarEscuchaG();
        })
        .catch(error=>{
          if(!vozG||sesion!==vozGeneracionG)return;
          if(error?.name==="NotAllowedError"||error?.name==="PermissionDeniedError"){
            pararVozG();mensaje("Permití el micrófono en Chrome o en la app para responder hablando.");return;
          }
          /* Web Speech puede funcionar sin getUserMedia en ciertos navegadores. */
          arrancarEscuchaG();
        });
    }else arrancarEscuchaG();
  }
  /* El modo Hablar funciona tanto vertical como horizontal.
     Girar el teléfono no debe apagar una captura de audio activa. */
  function cambioOrientacionG(){
    if(!pruebaG||!raiz)return;
    actualizarEntradaG();
    ajustarPantalla();
  }
  // Al girar el celular, el teclado se abre solo cuando se toca el campo.
  const esRoscoHorizontal=()=>horizontalG()||matchMedia("(orientation: landscape) and (max-width:1024px) and (max-height:600px)").matches;
  function enfocar(){
    if(!raiz||document.hidden)return;
    /* En voz no abrir el teclado Android: la palabra entra por el micrófono. */
    if((pruebaG&&vozG)||esRoscoHorizontal())$("#rrEntrada").blur();
    else $("#rrEntrada").focus({preventScroll:true});
    ajustarPantalla();
  }
  function detenerVoz(){
    const r=reconocimiento;reconocimiento=null;escuchando=false;
    const boton=$("#rrVoz");
    if(boton){boton.classList.remove("rr-grabando");boton.setAttribute("aria-pressed","false");}
    if(r){r.onend=null;r.onerror=null;r.onresult=null;try{r.abort();}catch(e){}}
    if(raiz&&fase!=="fin"&&!(pruebaG&&vozG))iniciarMusicaJuego();
  }
  function responderPorVoz(){
    if(pruebaG){alternarVozG();return;}
    if(!raiz||fase!=="resolver")return;
    if(escuchando){detenerVoz();return;}
    const Recon=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recon){mensaje("Este navegador no admite respuestas por voz. Podés escribir la palabra.");return;}
    try{
      const r=new Recon();reconocimiento=r;escuchando=true;
      r.lang="es-UY";r.continuous=false;r.interimResults=false;r.maxAlternatives=3;
      const boton=$("#rrVoz");boton.classList.add("rr-grabando");boton.setAttribute("aria-pressed","true");
      // Evitar que la voz de la pista o la música entren por el micrófono.
      try{window.speechSynthesis?.cancel();}catch(e){}
      detenerMusicaJuego();
      $("#rrEntrada").blur();ajustarPantalla();
      mensaje("Escuchando… decí tu respuesta.");
      const limpiar=()=>{
        if(reconocimiento!==r)return;
        reconocimiento=null;escuchando=false;
        boton.classList.remove("rr-grabando");boton.setAttribute("aria-pressed","false");
        if(raiz&&fase!=="fin")iniciarMusicaJuego();
      };
      r.onresult=e=>{
        if(reconocimiento!==r||fase!=="resolver"||actual<0)return;
        const palabras=Array.from(e.results?.[0]||[]).map(a=>String(a.transcript||"").trim()).filter(Boolean);
        const reconocida=palabras[0]||"";
        if(!reconocida){mensaje("No entendí la respuesta. Tocá el micrófono y repetila.");return;}
        // No marcar una respuesta incorrecta si Android transcribió otra palabra.
        // La palabra queda lista: basta tocar «Enviar», sin abrir teclado.
        $("#rrEntrada").value=reconocida.slice(0,60);
        mensaje('Escuché «'+reconocida.slice(0,45)+'». Tocá Enviar para confirmarla.');
      };
      r.onerror=e=>{
        if(reconocimiento!==r)return;
        const nombre=String(e.error||"");
        if(nombre==="not-allowed"||nombre==="service-not-allowed")mensaje("Permití el micrófono en el navegador para responder hablando.");
        else if(nombre==="no-speech")mensaje("No escuché ninguna palabra. Probá otra vez.");
        else if(nombre==="language-not-supported")mensaje("El idioma del micrófono no está disponible en este dispositivo.");
        else if(nombre!=="aborted")mensaje("No se pudo usar el micrófono. Podés responder escribiendo.");
      };
      r.onend=limpiar;
      r.start();
    }catch(e){detenerVoz();mensaje("No se pudo iniciar el micrófono. Revisá los permisos del navegador.");}
  }
  /* Que el teclado nunca tape donde se escribe (Android e iPhone), sin cambiar cómo se ve el juego:
     la ventana del Rosco ocupa exactamente la parte de la pantalla que queda ARRIBA del teclado
     (visualViewport) y, si el campo queda abajo, se corre solo un poquito hasta que se vea. */
  function ajustarPantalla(){
    if(!raiz||!shell)return;
    if(pruebaG)actualizarEntradaG();
    const vv=window.visualViewport,alto=Math.round(vv?vv.height:innerHeight),arriba=vv?Math.max(0,Math.round(vv.offsetTop)):0;
    const enfocado=document.activeElement===$("#rrEntrada");
    if(!enfocado)altoLibre=Math.max(altoLibre,alto);
    const teclado=enfocado&&esRoscoHorizontal()&&(altoLibre-alto>90||innerHeight-alto>90);
    shell.classList.toggle("rr-teclado-abierto",teclado);
    shell.style.height=alto+"px";shell.style.top=arriba+"px";shell.style.bottom="auto";
    shell.style.setProperty("--rr-viewport-alto",alto+"px");
    if(teclado){shell.scrollTop=0;return;}
    if(enfocado){
      const sb=shell.getBoundingClientRect(),fb=$("#rrForm").getBoundingClientRect();
      if(fb.bottom>sb.bottom-10)shell.scrollTop+=fb.bottom-(sb.bottom-10);
    }
  }
  function siguiente(){
    detenerVoz();
    const p=pendientes();if(!p.length){terminar();return;}
    const opciones=p.length>1?p.filter(i=>i!==actual):p;
    destino=opciones[Math.floor(Math.random()*opciones.length)];actual=-1;fase="giro";
    $("#rrGrande").textContent="✦";$("#rrRegla").textContent="La rueda está girando";
    $("#rrDefinicion").textContent="El reloj está en pausa. Prepará tu próxima respuesta.";mensaje("");
    const reducido=matchMedia("(prefers-reduced-motion: reduce)").matches;
    espera=reducido?0:ROSCO_CONFIG.giroMs;
    const ajuste=((-destino*360/items.length-angulo)%360+360)%360;
    angulo+=(reducido?0:ROSCO_CONFIG.vueltas*360)+ajuste;
    $("#rrDisco").style.setProperty("--rr-giro-ms",espera+"ms");
    $("#rrDisco").style.transform="rotate("+angulo+"deg)";
    raiz.querySelectorAll(".rr-letra span").forEach(el=>el.style.transform="rotate("+(-angulo)+"deg)");
    ultimoTac=0;hud();if(reducido)detenerGiro();
  }
  function detenerGiro(){
    actual=destino;fase="resolver";const d=items[actual];
    $("#rrGrande").textContent=d.letra;$("#rrRegla").textContent=(d.contiene?"Contiene la ":"Empieza con ")+d.letra;
    $("#rrDefinicion").textContent=d.definicion;hud();enfocar();
    if(mostrarConsultaVozG())return;
    if(pruebaG&&vozG)leerPistaG();
    else if(typeof hablar==="function")hablar(d.definicion,audioMusica);
  }
  function iniciar(){if(window.Fichas&&!Fichas.usar("rosco-rioplatense",iniciar))return;duelo=false;config=configNivel(nivel);items=armarRonda();guardar();arrancarRonda();}
  function arrancarRonda(){
    estados=items.map(()=>"pendiente");respuestas=items.map(()=>"");
    actual=-1;destino=-1;angulo=0;tiempo=config.segundos*1000;ultimo=performance.now();
    $("#rrPanel").hidden=true;$("#rrEntrada").value="";$("#rrJuego").hidden=false;requestAnimationFrame(ajustarPantalla);
    const disco=$("#rrDisco");disco.replaceChildren();disco.style.transition="none";disco.style.transform="rotate(0deg)";
    items.forEach((d,i)=>{
      const el=document.createElement("div"),span=document.createElement("span"),a=i*2*Math.PI/items.length;
      el.className="rr-letra";el.style.left=(50+42*Math.sin(a))+"%";el.style.top=(50-42*Math.cos(a))+"%";
      span.textContent=d.letra;el.appendChild(span);disco.appendChild(el);
    });
    void disco.offsetWidth;disco.style.transition="";enfocar();siguiente();
    if(duelo){
      Duelo.mostrarBadge();Duelo.actualizarBadge("0/"+items.length);
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge(p.aciertos+"/"+p.total));
    }
  }
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("El Rosco","rosco",{onListo:(soyHost)=>{
      duelo=true;
      if(soyHost){config=configNivel(nivel);items=armarRonda();guardar();Duelo.enviarRonda({items,config});arrancarRonda();}
      else Duelo.onRondaRecibida(datos=>{config=datos.config;items=datos.items;arrancarRonda();});
    }});
  }
  function enviar(){
    if(!raiz||fase!=="resolver"||document.hidden)return;
    detenerVoz();
    tic();if(fase!=="resolver")return;
    const crudo=$("#rrEntrada").value.trim().slice(0,30);
    const valor=normalizar($("#rrEntrada").value);if(!valor){mensaje("Escribí una palabra o tocá Pasapalabra.");enfocar();return;}
    const d=items[actual],ok=vale(d,valor);
    estados[actual]=ok?"acierto":"error";respuestas[actual]=crudo;fase="respuesta";espera=ROSCO_CONFIG.pausaMs;
    $("#rrEntrada").value="";sonido(ok);mensaje(ok?"¡Bien! +100 puntos · "+d.palabra:"Era "+d.palabra,ok?"acierto":"error");
    if(typeof objSumar==="function")objSumar("roscoLetras",1);
    if(ok&&typeof logroDesbloquear==="function")logroDesbloquear("roscoPrimera");
    hud();enfocar();
    if(duelo)Duelo.enviarProgreso({aciertos:conteo("acierto"),total:items.length});
  }
  function pasar(){
    if(!raiz||fase!=="resolver"||document.hidden)return;
    detenerVoz();
    tic();if(fase!=="resolver")return;
    $("#rrEntrada").value="";enfocar();siguiente();
  }
  function panel(titulo,detalle,acciones,dibujo){
    const capa=$("#rrPanel");capa.hidden=false;capa.replaceChildren();
    const tarjeta=document.createElement("div");tarjeta.className="rr-panel";
    if(dibujo){const im=document.createElement("img");im.className="rr-panel-dibujo";im.src=ARTE(dibujo);im.alt="";im.draggable=false;tarjeta.appendChild(im);}
    const h=document.createElement("h3"),p=document.createElement("p");h.textContent=titulo;p.textContent=detalle;tarjeta.append(h,p);
    acciones.forEach(([texto,accion],i)=>{const b=document.createElement("button");b.type="button";b.textContent=texto;b.className=i===0?"rr-principal":"";b.onclick=()=>accion(b);tarjeta.appendChild(b);});
    capa.appendChild(tarjeta);
  }
  /* Resumen final: por letra, la palabra correcta, lo que escribiste vos y
     (en duelo) lo que escribió el rival. ✓ acertó · ✕ erró · — no respondió. */
  const escH=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function marcaDe(d,txt){if(!txt)return["nada","—"];const ok=vale(d,normalizar(txt));return[ok?"ok":"mal",escH(txt.toLowerCase())+(ok?" ✓":" ✕")];}
  function tablaRespuestas(mias,rival,nombreRival){
    const yo=(typeof perfil!=="undefined"&&perfil&&perfil.nombre)||"Vos";
    return'<div class="rr-resumen">'+items.map((d,i)=>{
      const[c1,t1]=marcaDe(d,mias[i]);
      let fila='<div class="rr-res-fila"><b>'+d.letra+'</b><span class="rr-res-palabra">'+escH(d.palabra.toLowerCase())+'</span><span class="rr-res-'+c1+'"><small>'+escH(yo)+'</small>'+t1+'</span>';
      if(rival){const[c2,t2]=marcaDe(d,Array.isArray(rival)?rival[i]:"");fila+='<span class="rr-res-'+c2+'"><small>'+escH(nombreRival||"Rival")+'</small>'+t2+'</span>';}
      return fila+'</div>';
    }).join("")+'</div>';
  }
  function terminar(){
    if(fase==="fin")return;
    if(pruebaG)pararVozG();else detenerVoz();fase="fin";actual=-1;$("#rrEntrada").blur();
    const aciertos=conteo("acierto"),errores=conteo("error"),faltan=pendientes().length;
    const bonus=faltan===0&&aciertos>0?Math.max(0,Math.ceil(tiempo/1000))*ROSCO_CONFIG.bonoSegundo:0;
    const puntos=aciertos*ROSCO_CONFIG.puntosAcierto+bonus;
    if(duelo){
      datos.mejor=Math.max(datos.mejor,puntos);guardar();hud();
      const mias=[...respuestas];
      Duelo.enviarFinal({valor:aciertos,respuestas:mias});
      Duelo.mostrarResultado({valor:aciertos},{etiqueta:"aciertos sobre "+items.length,extra:fr=>tablaRespuestas(mias,fr&&Array.isArray(fr.respuestas)?fr.respuestas.map(x=>String(x||"").slice(0,30)):null,(Duelo.rivalActual()||{}).nombre),onVolver:()=>{duelo=false;abrir(raiz.parentElement);}});
      return;
    }
    const avanzar=faltan===0&&aciertos>=Math.ceil(items.length*ROSCO_CONFIG.proporcionAvance);
    datos.mejor=Math.max(datos.mejor,puntos);if(avanzar)datos.nivelMax=Math.max(datos.nivelMax,nivel+1);guardar();
    if(aciertos===items.length&&typeof logroDesbloquear==="function"){
      logroDesbloquear("roscoPerfecto");if(tiempo>30000)logroDesbloquear("roscoVeloz");
    }
    hud();
    const acciones=[];
    if(avanzar)acciones.push(["Siguiente nivel",()=>{nivel++;iniciar();}]);
    acciones.push(["Otra ronda · nivel "+nivel,iniciar]);
    acciones.push(["Compartir resultado",b=>compartir(b,puntos,aciertos,errores,faltan)]);
    panel(faltan?"¡Se terminó el tiempo!":errores?"Rosco terminado":"¡Rosco perfecto!",
      aciertos+" aciertos · "+errores+" errores · "+faltan+" sin responder. "+puntos+" puntos"+(bonus?" ("+bonus+" por tiempo)":"")+". Récord: "+datos.mejor+"."+(avanzar?" ¡Desbloqueaste el nivel "+(nivel+1)+"!":" Acertá al menos "+Math.ceil(items.length*ROSCO_CONFIG.proporcionAvance)+" y terminá la vuelta para avanzar."),acciones,faltan?"tiempo":errores?"terminado":"perfecto");
    const revision=document.createElement("div");revision.innerHTML=tablaRespuestas(respuestas,null);
    $(".rr-panel").insertBefore(revision,$(".rr-panel button"));$(".rr-principal").focus({preventScroll:true});
    if(pruebaG&&typeof window.GiroRoscoPiloto?.mostrarFinal==="function"){
      window.GiroRoscoPiloto.mostrarFinal({aciertos,total:items.length,puntos});
    }
  }
  function compartir(b,puntos,aciertos,errores,faltan){
    const texto="🎡 El Rosco · nivel "+nivel+" · "+puntos+" puntos\n✓ "+aciertos+" · ✕ "+errores+" · pendientes "+faltan+"\nGirá y Adiviná: "+location.origin+location.pathname;
    const imagen=()=>{
      const cv=document.createElement("canvas");cv.width=720;cv.height=900;const c=cv.getContext("2d");
      c.fillStyle="#160B24";c.fillRect(0,0,720,900);c.textAlign="center";c.fillStyle="#F5B301";c.font="bold 44px sans-serif";c.fillText("EL ROSCO",360,85);
      c.fillStyle="#F6EFE2";c.font="24px sans-serif";c.fillText("Girá y Adiviná · Nivel "+nivel,360,130);
      items.forEach((d,i)=>{const a=i*2*Math.PI/items.length,x=360+225*Math.sin(a),y=405-225*Math.cos(a);c.beginPath();c.arc(x,y,24,0,2*Math.PI);c.fillStyle=estados[i]==="acierto"?"#37D6C0":estados[i]==="error"?"#FF7E8B":"#D7C8E5";c.fill();c.fillStyle="#160B24";c.font="bold 23px sans-serif";c.fillText(d.letra,x,y+8);});
      c.fillStyle="#F5B301";c.font="bold 60px sans-serif";c.fillText(puntos,360,414);c.font="22px sans-serif";c.fillText("PUNTOS",360,455);
      c.fillStyle="#F6EFE2";c.font="26px sans-serif";c.fillText(aciertos+" aciertos · "+errores+" errores",360,735);c.fillText(faltan+" sin responder",360,780);c.font="20px sans-serif";c.fillText("¿Te animás a completar la vuelta?",360,850);return cv;
    };
    if(typeof csCompartirImagen==="function")csCompartirImagen(imagen,"el-rosco.png",texto,texto,b);
  }
  function tic(){
    const ahora=performance.now(),dt=Math.max(0,ahora-ultimo);ultimo=ahora;
    if(!raiz||document.hidden||fase==="inicio"||fase==="fin")return;
    if((fase==="resolver"||fase==="respuesta")&&!vozLeyendoG){
      tiempo=Math.max(0,tiempo-dt);if(tiempo===0){terminar();return;}
    }
    if(fase==="giro"){
      espera-=dt;ultimoTac+=dt;
      if(ultimoTac>110+(1-Math.max(0,espera)/ROSCO_CONFIG.giroMs)*230){if(typeof tac==="function")tac();ultimoTac=0;}
      if(espera<=0)detenerGiro();
    }else if(fase==="respuesta"){espera-=dt;if(espera<=0)siguiente();}
    hud();
  }
  function visibilidad(){if(document.hidden){detenerMusicaJuego();if(pruebaG&&vozG)pararVozG();else if(pruebaG)detenerVoz();}else iniciarMusicaJuego();ultimo=performance.now();}
  /* El módulo del estudio se carga solamente si el Rosco lo abre Gonzalo.
     Sin depender de él para iniciar ni terminar una partida normal. */
  function cargarEscenaGiroG(referencia){
    if(!pruebaG||!(typeof esGonzalo==="function"&&esGonzalo())||window.GIRO_ROSCO_PILOTO===false)return;
    const activar=()=>{
      if(raiz===referencia&&raiz.isConnected&&fase==="inicio"&&typeof window.GiroRoscoPiloto?.mostrarInicio==="function"){
        window.GiroRoscoPiloto.mostrarInicio();
      }
    };
    if(window.GiroRoscoPiloto){activar();return;}
    if(!document.querySelector('link[data-giro-rosco]')){
      const estilo=document.createElement("link");estilo.rel="stylesheet";estilo.href="giro-rosco-piloto.css?v=6";
      estilo.dataset.giroRosco="1";document.head.appendChild(estilo);
    }
    let script=document.querySelector('script[data-giro-rosco]');
    if(!script){
      script=document.createElement("script");script.src="giro-rosco-piloto.js?v=7";script.async=true;
      script.dataset.giroRosco="1";script.addEventListener("load",activar,{once:true});
      document.head.appendChild(script);
    }else script.addEventListener("load",activar,{once:true});
  }
  function abrir(contenedor){
    salir();datos=cargar();nivel=datos.nivelMax;config=configNivel(nivel);fase="inicio";usadasSesion=new Set();
    raiz=document.createElement("div");raiz.className="rr-game";raiz.dataset.fase="inicio";altoLibre=0;
    const valeEnTV=String((typeof perfil!=="undefined"&&perfil?.nombre)||"").trim().toLowerCase()==="vale"&&!!window.GyaTV?.activo?.("ext");
    pruebaG=(typeof esGonzalo==="function"&&esGonzalo())||valeEnTV;
    vozG=false;vozConsultadaG=false;cerrarConsultaVozG();
    if(pruebaG)raiz.classList.add("rr-gonzalo");
    raiz.innerHTML='<button type="button" class="ext-volver" id="rrVolver">⟵ Extensiones</button><div class="rr-titulo rr-titulo-arte"><h2 class="rr-logo-h"><img class="rr-logo" src="'+ARTE("logo")+'" alt="El Rosco" draggable="false"></h2><p>Una vuelta, muchas palabras nuestras.</p></div><div id="rrJuego" hidden><div class="sf-hud"><div><small>Nivel</small><b id="rrNivel"></b></div><div><small>'+ico("aciertos")+'Aciertos</small><b id="rrAciertos"></b></div><div><small>'+ico("errores")+'Errores</small><b id="rrErrores"></b></div><div><small>'+ico("reloj")+'Tiempo</small><b id="rrTiempo"></b></div></div><div class="sf-bar"><i id="rrBarra"></i></div><div class="rr-rueda"><div id="rrDisco"></div><b id="rrGrande"></b></div><div class="rr-pista" role="status" aria-live="polite"><div class="voz-fila"><span class="rr-pista-ico">'+ico("pista")+'</span><small id="rrRegla"></small><button type="button" class="voz-btn rr-escuchar" id="rrEscuchar" aria-label="Escuchar la pista">'+ico("escuchar")+'</button></div><p id="rrDefinicion"></p></div><p id="rrMensaje" class="rr-mensaje" role="status"></p><form id="rrForm" autocomplete="off"><label class="rr-sr" for="rrEntrada">Tu respuesta</label><div class="rr-fila"><input id="rrEntrada" placeholder="Tu palabra" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="send" maxlength="60"><button id="rrEnviar" type="submit">Enviar</button><button id="rrPasar" type="button">'+ico("pasapalabra")+'<span>Pasapalabra</span></button><button id="rrVoz" type="button" class="rr-microfono" aria-label="Responder hablando" aria-pressed="false" title="Responder por voz">🎙<span>Hablar</span></button></div></form></div><div id="rrPanel" class="rr-panel-capa"></div>';
    contenedor.appendChild(raiz);shell=raiz.closest(".ext-shell");shell?.classList.add("rr-abierta");
    if(pruebaG){
      const teclado=document.createElement("div");teclado.id="rrTecladoG";teclado.className="rr-teclado-g";teclado.setAttribute("aria-label","Teclado propio del Rosco");
      $("#rrJuego").appendChild(teclado);tecladoG();
      const estado=document.createElement("p");estado.id="rrEstadoVozG";estado.className="rr-estado-voz-g";$("#rrJuego").appendChild(estado);
      actualizarEntradaG();
    }
    $("#rrVolver").onclick=()=>Extensiones.abrirLobby();
    $("#rrForm").onsubmit=e=>{e.preventDefault();enviar();};$("#rrPasar").onclick=pasar;$("#rrVoz").onclick=responderPorVoz;
    $("#rrEscuchar").onclick=()=>{if(actual>=0&&typeof hablar==="function")hablar(items[actual].definicion,audioMusica);};
    for(const b of raiz.querySelectorAll("#rrForm button"))b.onpointerdown=e=>e.preventDefault();
    $("#rrEntrada").onbeforeinput=e=>{if(fase!=="resolver")e.preventDefault();};
    $("#rrEntrada").addEventListener("focus",()=>setTimeout(ajustarPantalla,350));$("#rrEntrada").addEventListener("blur",()=>setTimeout(ajustarPantalla,350));
    window.visualViewport?.addEventListener("resize",ajustarPantalla);window.visualViewport?.addEventListener("scroll",ajustarPantalla);window.addEventListener("resize",ajustarPantalla);
    if(pruebaG)window.addEventListener("orientationchange",cambioOrientacionG);
    document.addEventListener("visibilitychange",visibilidad);ultimo=performance.now();intervalo=setInterval(tic,ROSCO_CONFIG.ticMs);iniciarMusicaJuego();
    const acciones=[["Jugar nivel "+nivel,iniciar]];if(nivel>1)acciones.push(["Practicar desde el nivel 1",()=>{nivel=1;iniciar();}]);
    acciones.push(["Jugar con un amigo 👥",iniciarDuelo]);
    panel("El Rosco Rioplatense",config.letras+" letras y "+config.segundos+" segundos. Leé cada pista y escribí la palabra: tenés un intento por letra. Pasapalabra la deja para después. El reloj se pausa al girar. Acertá al menos "+Math.ceil(config.letras*ROSCO_CONFIG.proporcionAvance)+" y respondé todas para avanzar. Jugás gratis, sin gastar vidas ni monedas. Mejor: "+datos.mejor+" puntos.",acciones,"personaje");ajustarPantalla();
    cargarEscenaGiroG(raiz);
  }
  function salir(){
    cerrarConsultaVozG();vozConsultadaG=false;
    if(window.GiroRoscoPiloto)window.GiroRoscoPiloto.cerrar();
    if(pruebaG)pararVozG();
    detenerVoz();clearInterval(intervalo);intervalo=null;document.removeEventListener("visibilitychange",visibilidad);
    window.visualViewport?.removeEventListener("resize",ajustarPantalla);window.visualViewport?.removeEventListener("scroll",ajustarPantalla);window.removeEventListener("resize",ajustarPantalla);
    window.removeEventListener("orientationchange",cambioOrientacionG);
    if(shell){shell.style.height="";shell.style.top="";shell.style.bottom="";shell.style.removeProperty("--rr-viewport-alto");}
    shell?.classList.remove("rr-abierta","rr-teclado-abierto");altoLibre=0;pruebaG=false;vozG=false;
    if("speechSynthesis" in window)speechSynthesis.cancel();
    if(typeof sincronizarMusica==="function")sincronizarMusica();
    detenerMusicaJuego();
    if(typeof Duelo!=="undefined")Duelo.salir();
    duelo=false;raiz=null;shell=null;fase="inicio";items=[];estados=[];
  }
  return{abrir,salir,enviar,configNivel,mejorPuntaje:()=>cargar().mejor};
})();
window.RoscoRioplatense=RoscoRioplatense;
