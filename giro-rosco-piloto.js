/* Prueba de presentación de Giro para El Rosco — solo perfil Gonzalo.
   Overlay aislado: no altera el motor del Rosco ni las salas. Sin música. */
(function(){
  "use strict";
  const BASE="presentacion-y-locucion-extensiones/Giro/";
  const ESCENA=BASE+"estudios/Giro_estudio_rosco_16x9.png";
  // Un único fotograma oficial: Giro y su atril ya forman parte de la misma
  // imagen. Nunca mezclar otras poses, tamaños o atriles en la apertura.
  const PLANO_ESTABLE=BASE+"escenas/Giro_presentacion_plano_general_16x9.png";
  const IMAGENES={
    neutral:BASE+"opcionales/espera/Giro_espera_neutral.png",
    respira:BASE+"opcionales/espera/Giro_espera_respirando.png",
    escucha:BASE+"opcionales/espera/Giro_espera_escuchando.png",
    saludo:BASE+"opcionales/transiciones/Giro_transicion_saludando.png",
    señala:BASE+"opcionales/transiciones/Giro_transicion_senalando.png",
    presenta:BASE+"opcionales/gestos/Giro_gesto_presenta_extension.png",
    festeja:BASE+"Giro_festejando.png",
    revancha:BASE+"Giro_confundido.png"
  };
  let capa=null, intervalo=null, frase=null, activa=false, salirDeCapa=null, anteriorFoco=null;
  let reiniciarCine=null, salidaTimer=null;
  const habilitado=()=>typeof esGonzalo==="function"&&esGonzalo()&&window.GIRO_ROSCO_PILOTO!==false;
  /* Frases grabadas con voz de hombre (ElevenLabs): suenan igual en cualquier
     celular. Las que todavía no están grabadas usan la voz del celular. */
  let grabacion=null;
  function cancelarVoz(){
    if(grabacion){try{grabacion.pause();}catch(e){}grabacion=null;}
    if(frase&&"speechSynthesis" in window){
      try{window.speechSynthesis.cancel();}catch(e){}
    }
    frase=null;
  }
  /* Apertura del programa (antes de que aparezca Giro): negro, se prenden las
     luces del estudio, entra el logo con destellos y la música del show
     (voz/giro-apertura-musica.mp3, hecha por Gonzalo en Gemini). Se puede saltar. */
  let apertura=null;
  function cortarApertura(){
    if(!apertura)return;const a=apertura;apertura=null;
    clearTimeout(a.timer);try{a.musica.pause();}catch(e){}a.capa.remove();
    document.removeEventListener("keydown",a.tecla);
  }
  function mostrarApertura(siguiente){
    cortarApertura();
    const capa=document.createElement("div");capa.className="grp-apertura";
    capa.setAttribute("role","dialog");capa.setAttribute("aria-modal","true");capa.setAttribute("aria-label","Girá y Adiviná, el programa");
    const cuadro=document.createElement("div");cuadro.className="grp-ap-cuadro";
    const img=(c,src)=>{const i=document.createElement("img");i.className=c;i.src=src;i.alt="";i.setAttribute("aria-hidden","true");i.draggable=false;return i;};
    cuadro.append(img("grp-ap-estudio",BASE+"estudios/Giro_estudio_principal_16x9.webp"),img("grp-ap-luces",BASE+"efectos/Giro_efecto_haces_de_luz_transparente.webp"),
      img("grp-ap-destellos",BASE+"efectos/Giro_efecto_destellos_transparente.png"),img("grp-ap-logo","assets/logo.webp"));
    const saltar=document.createElement("button");saltar.type="button";saltar.className="grp-ap-saltar";saltar.textContent="Saltar ⏭";
    capa.append(cuadro,saltar);document.body.appendChild(capa);
    const musica=new Audio(BASE+"voz/giro-apertura-musica.mp3");
    /* Al terminar, Giro se arma ATRÁS de la apertura y recién después la apertura
       se desvanece: así nunca se ve la pantalla del Rosco en el medio. */
    const terminar=()=>{if(!apertura||apertura.capa!==capa)return;
      const a=apertura;apertura=null;clearTimeout(a.timer);document.removeEventListener("keydown",tecla);
      siguiente();
      capa.classList.add("grp-ap-fin");
      const v0=musica.volume;let paso=0;const baja=setInterval(()=>{paso++;try{musica.volume=Math.max(0,v0*(1-paso/8));}catch(e){}if(paso>=8){clearInterval(baja);try{musica.pause();}catch(e){}}},80);
      setTimeout(()=>capa.remove(),700);};
    const tecla=e=>{if(e.key==="Escape"||e.key==="Enter"){e.preventDefault();terminar();}};
    apertura={capa,musica,tecla,timer:setTimeout(terminar,15400)};
    saltar.addEventListener("click",terminar);document.addEventListener("keydown",tecla);
    musica.addEventListener("ended",terminar);
    musica.play().catch(()=>{});
    saltar.focus({preventScroll:true});
  }
  /* Presentación de participantes, justo antes de arrancar la partida:
     - SOLO: estudio con un atril en el centro (Giro_estudio_rosco_un_atril_16x9.webp)
       y el jugador atrás.
     - DUELO (para cuando se conecte): estudio con dos atriles
       (Giro_estudio_rosco_atriles_16x9.webp), el jugador y su rival.
     Los círculos del rosco vienen vacíos en la imagen y el juego escribe las 24
     letras encima (centros medidos sobre el relleno azul de cada círculo). Los personajes van ATRÁS de los atriles: encima se repite la
     imagen del estudio recortada solo con el frente de cada atril. */
  const PERSONAJES={hombre:BASE+"participantes/participante_hombre.webp",mujer:BASE+"participantes/participante_mujer.webp"};
  const ESTUDIOS={
    solo:{img:BASE+"estudios/Giro_estudio_rosco_un_atril_16x9.webp",
      circulos:[[48.55,9.38],[51.99,10.53],[55.21,13.45],[58.02,18.11],[60.07,24.46],[61.59,31.94],[62.13,40.18],[61.71,48.50],[60.30,56.09],[58.20,62.50],[55.44,66.61],[52.15,69.50],[48.68,70.14],[45.10,69.71],[41.75,66.97],[38.84,63.70],[36.59,57.15],[35.13,49.19],[34.65,40.49],[35.24,32.04],[36.76,24.61],[38.88,18.06],[41.77,13.33],[45.04,10.38]]},
    duelo:{img:BASE+"estudios/Giro_estudio_rosco_atriles_16x9.webp",
      circulos:[[48.83,8.55],[52.34,9.59],[55.51,12.65],[58.30,16.93],[60.41,22.81],[61.91,29.60],[62.43,37.17],[61.95,44.55],[60.49,51.52],[58.40,57.49],[55.63,62.04],[52.24,65.07],[48.44,66.05],[44.58,65.07],[41.27,62.03],[38.44,57.56],[36.30,51.68],[34.84,44.71],[34.41,37.32],[35.00,29.66],[36.55,22.81],[38.77,16.89],[41.79,12.47],[45.18,9.41]]}
  };
  const LETRAS_ROSCO="ABCDEFGHIJKLMNOPQRSTUVYZ";
  let participantes=null;
  function cortarParticipantes(){
    if(!participantes)return;const p=participantes;participantes=null;
    clearTimeout(p.timer);p.capa.remove();document.removeEventListener("keydown",p.tecla);
  }
  function miNombre(){
    try{if(typeof perfil!=="undefined"&&perfil)return String(perfil.nombre||"Vos").trim().slice(0,14)||"Vos";}catch(e){}
    return "Vos";
  }
  function mostrarParticipantes(modo,rival,siguiente){
    cortarParticipantes();
    const nombre=miNombre(),est=ESTUDIOS[modo]||ESTUDIOS.solo;
    rival=String(rival||"").trim().slice(0,14);
    const capa=document.createElement("div");capa.className="grp-apertura grp-part grp-part-"+(modo==="duelo"?"duelo":"solo");
    capa.setAttribute("role","dialog");capa.setAttribute("aria-modal","true");capa.setAttribute("aria-label","Presentación de los participantes");
    const cuadro=document.createElement("div");cuadro.className="grp-ap-cuadro";
    const fondo=document.createElement("img");fondo.className="grp-ap-estudio grp-part-fondo";fondo.src=est.img;fondo.alt="";
    cuadro.appendChild(fondo);
    est.circulos.forEach(([x,y],i)=>{const l=document.createElement("b");l.className="grp-part-letra";l.textContent=LETRAS_ROSCO[i];
      l.style.left=x+"%";l.style.top=y+"%";l.style.animationDelay=(.3+i*.06)+"s";cuadro.appendChild(l);});
    const jugador=(lado,foto,texto,demora)=>{
      const f=document.createElement("img");f.className="grp-part-persona grp-part-"+lado;f.src=foto;f.alt="";f.style.animationDelay=demora+"s";
      f.addEventListener("error",()=>f.remove(),{once:true});
      const frente=document.createElement("img");frente.className="grp-part-frente grp-part-"+lado;frente.src=fondo.src;frente.alt="";frente.setAttribute("aria-hidden","true");
      const n=document.createElement("div");n.className="grp-part-nombre grp-part-"+lado;n.style.animationDelay=(demora+.25)+"s";
      const t=document.createElement("span");t.textContent=texto;t.style.setProperty("--k",Math.min(2.2,13/Math.max(1,texto.length)));n.appendChild(t);cuadro.append(f,frente,n);
    };
    const dice=document.createElement("p");
    if(modo==="duelo"){
      jugador("izq",PERSONAJES.hombre,nombre,1.9);
      jugador("der",PERSONAJES.mujer,rival||"Rival",2.7);
      dice.textContent="🎙 Giro: ¡Hoy se enfrentan "+nombre+" y "+(rival||"su rival")+"! 24 letras, una vuelta. ¿Quién gana?";
    }else{
      jugador("centro",PERSONAJES.hombre,nombre,1.9);
      dice.textContent="🎙 Giro: ¡Hoy juega "+nombre+"! 24 letras, una vuelta. ¿Podrá completar el Rosco?";
    }
    const cartel=document.createElement("div");cartel.className="grp-part-cartel";
    const ir=document.createElement("button");ir.type="button";ir.className="grp-boton grp-accion";ir.textContent="¡A jugar!";
    cartel.append(dice,ir);cuadro.appendChild(cartel);
    capa.appendChild(cuadro);document.body.appendChild(capa);
    const terminar=()=>{if(!participantes||participantes.capa!==capa)return;capa.classList.add("grp-ap-fin");
      clearTimeout(participantes.timer);participantes.timer=setTimeout(()=>{cortarParticipantes();if(typeof siguiente==="function")siguiente();},650);};
    const tecla=e=>{if(e.key==="Escape"||e.key==="Enter"){e.preventDefault();terminar();}};
    participantes={capa,tecla,timer:null};
    ir.addEventListener("click",terminar);document.addEventListener("keydown",tecla);
    ir.focus({preventScroll:true});
    return true;
  }
  /* Modo estudio durante la partida: la rueda del Rosco es el rosco del estudio
     (Giro_rosco_juego_rueda.webp, recorte de Giro_estudio_rosco_juego_16x9.webp)
     y cada letra va en su círculo. Posiciones en % del recorte. */
  const RUEDA_JUEGO=[[50.12,11.16],[59.01,12.49],[67.22,16.12],[74.48,21.74],[79.89,29.39],[83.71,38.44],[85.17,48.45],[83.89,58.47],[80.35,67.68],[74.79,75.47],[67.43,81.61],[59.01,85.45],[50.14,87.32],[41.09,85.96],[32.68,82.32],[25.27,76.76],[19.42,68.86],[15.65,59.24],[14.39,48.82],[15.91,38.48],[19.86,29.42],[25.34,21.64],[32.73,15.99],[41.11,12.45]];
  function posLetra(letra){const i=LETRAS_ROSCO.indexOf(String(letra||"").toUpperCase());return i>=0?RUEDA_JUEGO[i]:null;}
  /* Reacciones de Giro durante la partida en el estudio: aparece desde abajo del
     rosco con una pose y dice una frase grabada (voz/reacciones/, 12 frases
     cortadas de una grabación de Gonzalo en ElevenLabs). No repite la misma
     frase dos veces seguidas. */
  const REACCIONES={
    acierto:{poses:["Giro_festejando.png"],frases:["acierto-1","acierto-2","acierto-3","acierto-4"]},
    error:{poses:["Giro_confundido.png"],frases:["error-1","error-2","error-3","error-4"]},
    pasar:{poses:["Giro_suspenso.png"],frases:["pasar-1","pasar-2"]},
    tiempo:{poses:["Giro_sorprendido.png"],frases:["tiempo-1","tiempo-2"]}
  };
  const ultimaFrase={};let reacAudio=null,reacTimer=null;
  function reaccion(tipo){
    const r=REACCIONES[tipo];if(!r||!habilitado())return;
    const rueda=document.querySelector(".rr-game.rr-estudio .rr-rueda");if(!rueda)return;
    let opciones=r.frases.filter(f=>f!==ultimaFrase[tipo]);if(!opciones.length)opciones=r.frases;
    const frase=opciones[Math.floor(Math.random()*opciones.length)];ultimaFrase[tipo]=frase;
    rueda.querySelector(".grp-reac")?.remove();clearTimeout(reacTimer);
    /* Giro siempre detrás de su atril (el oficial de "GIRÁ Y ADIVINÁ"), como en la presentación. */
    const caja=document.createElement("div");caja.className="grp-reac grp-reac-"+tipo;caja.setAttribute("aria-hidden","true");
    const giro=document.createElement("img");giro.className="grp-reac-giro";giro.alt="";giro.draggable=false;
    giro.src=BASE+r.poses[Math.floor(Math.random()*r.poses.length)];
    const atril=document.createElement("img");atril.className="grp-reac-atril";atril.alt="";atril.draggable=false;
    atril.src=BASE+"elementos/Giro_atril_oficial_chico.webp";
    caja.append(giro,atril);rueda.appendChild(caja);
    reacTimer=setTimeout(()=>caja.remove(),1700);
    try{if(reacAudio)reacAudio.pause();reacAudio=new Audio(BASE+"voz/reacciones/giro-"+frase+".mp3");reacAudio.play().catch(()=>{});}catch(e){}
  }
  /* Las llama el Rosco al tocar Jugar (solo) — siguiente() arranca la partida. */
  function presentarSolo(siguiente){if(!habilitado())return false;return mostrarParticipantes("solo","",siguiente);}
  function presentarDuelo(rival,siguiente){if(!habilitado())return false;return mostrarParticipantes("duelo",rival,siguiente);}
  function limpiar(){
    cortarApertura();cortarCierre();
    cortarParticipantes();
    clearInterval(intervalo);intervalo=null;
    if(salidaTimer!==null){clearTimeout(salidaTimer);salidaTimer=null;}
    reiniciarCine=null;
    cancelarVoz();
    if(capa){capa.remove();capa=null;}
    document.removeEventListener("keydown",teclado);
    activa=false;
    const destino=anteriorFoco;anteriorFoco=null;
    if(destino&&destino.isConnected&&typeof destino.focus==="function")destino.focus({preventScroll:true});
  }
  function teclado(e){
    if(!activa)return;
    if(e.key==="Escape"){e.preventDefault();cerrar();}
    if(e.key==="Tab"&&capa){
      const botones=[...capa.querySelectorAll("button:not([disabled])")];
      if(!botones.length)return;
      const primero=botones[0],ultimo=botones[botones.length-1];
      if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}
      else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}
    }
  }
  function cerrar(){
    const siguiente=salirDeCapa;salirDeCapa=null;
    limpiar();
    if(typeof siguiente==="function")siguiente();
  }
  function hablar(texto,audio,sinRespaldo){
    if(!activa)return;
    if(audio){
      cancelarVoz();
      const a=new Audio(audio);grabacion=a;
      const fallo=()=>{if(grabacion!==a)return;grabacion=null;if(!sinRespaldo)hablar(texto);};
      a.onended=()=>{if(grabacion===a)grabacion=null;};a.onerror=fallo;
      a.play().catch(fallo);return;
    }
    if(!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance!=="function")return;
    cancelarVoz();
    try{
      const u=new SpeechSynthesisUtterance(texto);
      u.lang="es-UY";u.rate=.92;u.pitch=1.04;u.volume=1;
      const voces=window.speechSynthesis.getVoices();
      /* Giro es hombre: primero una voz de hombre; si el celular no tiene, la común más grave. */
      const vm=typeof obtenerVozMasculina==="function"?obtenerVozMasculina():null;
      if(vm){u.voice=vm;u.pitch=.9;}else{u.pitch=.75;u.voice=voces.find(v=>v.lang.toLowerCase()==="es-uy")||
        voces.find(v=>v.lang.toLowerCase().startsWith("es-"))||null;}
      if(typeof avisarVozGonzalo==="function")avisarVozGonzalo(vm);
      u.onend=()=>{if(frase===u)frase=null;};
      u.onerror=()=>{if(frase===u)frase=null;};
      frase=u;window.speechSynthesis.speak(u);
    }catch(e){frase=null;}
  }
  function presentar({tipo,titulo,descripcion,locucion,audio,imagen,continuar}){
    if(!habilitado())return false;
    limpiar();activa=true;anteriorFoco=document.activeElement;
    salirDeCapa=continuar||null;
    const overlay=document.createElement("div");overlay.className="grp-overlay";overlay.dataset.tipo=tipo;
    overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",titulo);
    // Construir con DOM, sin HTML dinámico ni texto de usuarios.
    const cont=document.createElement("section");cont.className="grp-contenido";
    const stage=document.createElement("div");stage.className="grp-escenario";
    const rotulo=document.createElement("div");rotulo.className="grp-rotulo";rotulo.textContent="GIRÁ Y ADIVINÁ · EL ROSCO";
    const efecto=document.createElement("img");efecto.className="grp-efecto";
    efecto.src=BASE+"efectos/"+(tipo==="final"?"Giro_efecto_confeti_transparente.png":"Giro_efecto_destellos_transparente.png");
    efecto.alt="";efecto.setAttribute("aria-hidden","true");
    if(tipo==="inicio"){
      // El atril y Giro comparten siempre la misma escala y el mismo encuadre.
      // Los planos son un leve movimiento de cámara sobre la imagen completa.
      stage.classList.add("grp-escenario-estable");
      stage.dataset.plano="general";
      const escenaCompleta=document.createElement("img");
      escenaCompleta.className="grp-plano-estable";escenaCompleta.src=PLANO_ESTABLE;
      escenaCompleta.alt="Giro detrás del atril en el estudio del programa";
      stage.append(escenaCompleta,efecto,rotulo);
    }else{
      // El cierre conserva exactamente la escena y el personaje preexistentes.
      const fondo=document.createElement("img");fondo.className="grp-fondo";fondo.src=ESCENA;fondo.alt="";
      const halo=document.createElement("div");halo.className="grp-halo";halo.setAttribute("aria-hidden","true");
      const host=document.createElement("img");host.className="grp-giro";host.src=IMAGENES[imagen]||IMAGENES.neutral;
      host.alt="Giro, conductor de Girá y Adiviná";
      host.classList.add("grp-visible");
      const actor=document.createElement("div");actor.className="grp-actor";
      const hostSiguiente=document.createElement("img");hostSiguiente.className="grp-giro";hostSiguiente.alt="";
      hostSiguiente.setAttribute("aria-hidden","true");
      actor.append(host,hostSiguiente);
      stage.append(fondo,halo,actor,efecto,rotulo);
    }
    const panel=document.createElement("div");panel.className="grp-panel";
    const etiqueta=document.createElement("p");etiqueta.className="grp-etiqueta";etiqueta.textContent="PRESENTACIÓN DE PRUEBA · GONZALO";
    const h=document.createElement("h2");h.textContent=titulo;
    const p=document.createElement("p");p.className="grp-descripcion";p.textContent=descripcion;
    const acciones=document.createElement("div");acciones.className="grp-acciones";
    const voz=document.createElement("button");voz.type="button";voz.className="grp-boton grp-voz";voz.textContent="🔊 Repetir";
    voz.addEventListener("click",()=>{
      // Una acción directa del usuario permite iniciar la voz en Android.
      // Reiniciamos los planos para que acompañen la presentación hablada.
      if(tipo==="inicio"&&reiniciarCine)reiniciarCine();
      hablar(locucion,audio);
    });
    const avanzar=document.createElement("button");avanzar.type="button";avanzar.className="grp-boton grp-accion";
    avanzar.textContent=tipo==="final"?"Ver resultados":"Ir al Rosco";
    avanzar.addEventListener("click",()=>{
      if(!activa||capa!==overlay||salidaTimer!==null)return;
      // Fundido hacia el panel original del Rosco; no inicia ni cambia la partida.
      avanzar.disabled=true;
      overlay.classList.add("grp-saliendo");
      salidaTimer=setTimeout(cerrar,460);
    });
    acciones.append(voz,avanzar);
    const aviso=document.createElement("small");aviso.className="grp-aviso";aviso.textContent="Prueba · Solo perfil Gonzalo";
    panel.append(etiqueta,h,p,acciones,aviso);
    cont.append(stage,panel);overlay.appendChild(cont);document.body.appendChild(overlay);
    capa=overlay;document.addEventListener("keydown",teclado);
    avanzar.focus({preventScroll:true});
    /* Giro habla solo apenas aparece (la grabación); el botón es para repetir. */
    if(audio)setTimeout(()=>{if(capa===overlay&&activa)hablar(locucion,audio,true);},350);
    if(tipo==="inicio"){
      const reducido=matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pasos=["general","medio","cercano","general"];
      let paso=0;
      reiniciarCine=()=>{
        if(capa!==overlay||!activa)return;
        clearInterval(intervalo);intervalo=null;
        paso=0;stage.dataset.plano="general";
        if(reducido)return;
        // Cuatro posiciones, una sola pasada. No repetir indefinidamente.
        intervalo=setInterval(()=>{
          if(capa!==overlay||!activa||document.hidden)return;
          paso++;
          stage.dataset.plano=pasos[paso];
          if(paso===pasos.length-1){
            clearInterval(intervalo);intervalo=null;
          }
        },3000);
      };
      reiniciarCine();
    }
    return true;
  }
  function mostrarInicio(){
    if(!habilitado())return false;
    mostrarApertura(presentarGiro);return true;
  }
  function presentarGiro(){
    return presentar({
      tipo:"inicio",
      titulo:"¡Bienvenidos al Rosco!",
      descripcion:"Giro presenta el desafío. Una letra, muchas categorías. Respondé las pistas, usá Pasar cuando lo necesites y completá la vuelta.",
      locucion:"¡Bienvenidos a Girá y Adiviná Rioplatense! Soy Giro. Hoy jugamos al Rosco. Una letra, muchas categorías. ¿Estás preparado? ¡Arrancamos!",
      audio:BASE+"voz/giro-rosco-inicio.mp3",
      imagen:"saludo"
    });
  }
  /* Cierre en el estudio: escena a pantalla completa de victoria (la mitad o
     más de aciertos) o de revancha, con el resultado escrito en la pantalla de
     la escena y la frase grabada de Giro. "Ver resultados" muestra el panel
     original del Rosco, que queda debajo. */
  let cierre=null;
  function cortarCierre(){if(!cierre)return;const c=cierre;cierre=null;c.capa.remove();document.removeEventListener("keydown",c.tecla);try{c.voz.pause();}catch(e){}}
  function mostrarCierre(ok,errores,total,puntos){
    cortarCierre();
    const perfecto=total>0&&ok===total,gano=total>0&&ok>=total/2;
    const capa=document.createElement("div");capa.className="grp-apertura grp-cierre grp-cierre-"+(gano?"victoria":"revancha");
    capa.setAttribute("role","dialog");capa.setAttribute("aria-modal","true");capa.setAttribute("aria-label",gano?"¡Ganador!":"¡Revancha!");
    const cuadro=document.createElement("div");cuadro.className="grp-ap-cuadro";
    const fondo=document.createElement("img");fondo.className="grp-ap-estudio grp-cierre-fondo";fondo.alt="";
    fondo.src=BASE+"escenas/"+(gano?"Giro_cierre_victoria_16x9.webp":"Giro_cierre_derrota_revancha_16x9.webp");
    const caja=document.createElement("div");caja.className="grp-cierre-caja";caja.textContent=ok+" / "+total;
    const detalle=document.createElement("div");detalle.className="grp-cierre-detalle";
    detalle.textContent=(perfecto?"¡Rosco perfecto! · ":"")+"aciertos · "+errores+" errores · "+puntos+" puntos";
    const cartel=document.createElement("div");cartel.className="grp-part-cartel grp-cierre-cartel";
    const dice=document.createElement("p");
    dice.textContent="🎙 Giro: "+(perfecto?"¡Espectacular! ¡Completaste el Rosco sin errores!":gano?"¡Muy buena partida! ¡Vamos por más!":"¡No pasa nada! Una nueva vuelta nos espera. ¡Vamos por la revancha!");
    const ir=document.createElement("button");ir.type="button";ir.className="grp-boton grp-accion";ir.textContent="Ver resultados";
    cartel.append(dice,ir);cuadro.append(fondo,caja,detalle,cartel);capa.appendChild(cuadro);document.body.appendChild(capa);
    const voz=new Audio(BASE+"voz/"+(perfecto?"giro-rosco-perfecto.mp3":gano?"giro-rosco-buena.mp3":"giro-rosco-revancha.mp3"));
    setTimeout(()=>{if(cierre&&cierre.capa===capa)voz.play().catch(()=>{});},500);
    const terminar=()=>{if(!cierre||cierre.capa!==capa)return;capa.classList.add("grp-ap-fin");setTimeout(cortarCierre,650);};
    const tecla=e=>{if(e.key==="Escape"||e.key==="Enter"){e.preventDefault();terminar();}};
    cierre={capa,tecla,voz};ir.addEventListener("click",terminar);document.addEventListener("keydown",tecla);
    ir.focus({preventScroll:true});return true;
  }
  function mostrarFinal(resultado){
    if(resultado&&resultado.estudio&&habilitado())return mostrarCierre(Number(resultado.aciertos)||0,Number(resultado.errores)||0,Number(resultado.total)||0,Number(resultado.puntos)||0);
    const ok=Number(resultado&&resultado.aciertos)||0;
    const total=Number(resultado&&resultado.total)||0;
    const puntos=Number(resultado&&resultado.puntos)||0;
    const perfecto=total>0&&ok===total;
    const titulo=perfecto?"¡Rosco perfecto!":ok?"¡Terminaste el Rosco!":"¡Vamos por la revancha!";
    return presentar({
      tipo:"final",titulo,
      descripcion:ok+" de "+total+" aciertos · "+puntos+" puntos. El detalle y las opciones para continuar están en el resultado original del Rosco.",
      locucion:perfecto?"¡Espectacular! ¡Completaste el Rosco sin errores!":ok?"¡Muy buena partida! Lograste "+ok+" aciertos. ¡Vamos por más!":"¡No pasa nada! Una nueva vuelta nos espera. ¡Vamos por la revancha!",
      audio:perfecto?BASE+"voz/giro-rosco-perfecto.mp3":ok?BASE+"voz/giro-rosco-buena.mp3":BASE+"voz/giro-rosco-revancha.mp3",
      imagen:perfecto?"festeja":ok?"presenta":"revancha"
    });
  }
  window.GiroRoscoPiloto={mostrarInicio,mostrarFinal,presentarSolo,presentarDuelo,posLetra,reaccion,cerrar,habilitado};
})();