/* No te caigas: duelo contra bots, visible para los perfiles de prueba Gonzalo y Vale.
   Reutiliza las poses de atril y el atril oficial; no modifica el progreso. */
window.AhoraCaigo=(()=>{
  "use strict";
  const BASE="presentacion-y-locucion-extensiones/Giro/";
  const AVATARES=[...Array.from({length:22},(_,i)=>i+1),33,...Array.from({length:13},(_,i)=>42+i)]
    .map(n=>"avatar-"+String(n).padStart(2,"0"));
  const POSICIONES=[[9,88,15],[16,75,14],[24,63,13],[32,54,12],[40,47,11],
    [60,47,11],[68,54,12],[76,63,13],[84,75,14],[91,88,15]];
  let raiz=null,timer=null,reloj=null,voz=null,quitarAjuste=null,reabriendo=false;
  let musica=null,controlMusica=null,musicaDeseada=false,iniciandoMusica=false,musicaBloqueada=false,generacionMusica=0;
  function sonidoHabilitado(){return document.visibilityState!=="hidden"&&(typeof sonidoPermitido!=="function"||sonidoPermitido());}
  function sincronizarMusicaCaigo(){
    if(!raiz||!musicaDeseada||!sonidoHabilitado()){
      try{if(musica&&(!musica.paused||iniciandoMusica))musica.pause();}catch(e){}return;
    }
    if(musicaBloqueada||iniciandoMusica)return;
    try{
      if(!musica){musica=new Audio("assets/audio/ahora-caigo-musica-v1.mp3");musica.loop=true;musica.volume=.24;}
      if(!musica.paused)return;
      iniciandoMusica=true;const generacion=generacionMusica;
      Promise.resolve(musica.play()).then(()=>{
        if(generacion===generacionMusica)iniciandoMusica=false;
        if(!raiz||!musicaDeseada||!sonidoHabilitado())musica.pause();
      }).catch(e=>{if(generacion!==generacionMusica)return;iniciandoMusica=false;if(e?.name!=="AbortError")musicaBloqueada=true;});
    }catch(e){iniciandoMusica=false;musicaBloqueada=true;}
  }
  function ambiente(encendido){
    generacionMusica++;iniciandoMusica=false;musicaDeseada=encendido;
    if(encendido)musicaBloqueada=false;else try{musica?.pause();}catch(e){}
    sincronizarMusicaCaigo();
  }
  function detenerVoz(){const r=voz;voz=null;if(r){r.onresult=r.onerror=r.onend=null;try{r.abort();}catch(e){}}}
  const pendientes=new Set();
  const normalizar=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  function despues(fn,ms){const t=setTimeout(()=>{pendientes.delete(t);fn();},ms);pendientes.add(t);return t;}
  function salir(){
    document.querySelectorAll(".pf-bienv").forEach(x=>x.remove());
    generacionMusica++;iniciandoMusica=false;musicaDeseada=false;clearInterval(controlMusica);controlMusica=null;
    document.removeEventListener("visibilitychange",sincronizarMusicaCaigo);
    try{if(musica){musica.pause();musica.currentTime=0;}}catch(e){}
    raiz?.querySelector(".ac-final")?.close();
    detenerVoz();quitarAjuste?.();quitarAjuste=null;
    clearTimeout(timer);timer=null;clearInterval(reloj);reloj=null;
    pendientes.forEach(clearTimeout);pendientes.clear();
    raiz?.closest(".ext-shell")?.classList.remove("ac-abierta","ac-preguntando");
    raiz=null;
  }
  function figura(avatar,nombre,numero,pos){
    const caja=document.createElement("div");caja.dataset.avatar=avatar;caja.className="ac-participante"+(numero===0?" ac-principal":"");
    caja.style.cssText="--x:"+pos[0]+"%;--y:"+pos[1]+"%;--ancho:"+pos[2]+"%;z-index:"+Math.round(pos[1]);
    caja.setAttribute("aria-label",numero===0?nombre+", participante principal":"Participante "+numero);
    const piso=document.createElement("span");piso.className="ac-plataforma";
    const persona=document.createElement("img");persona.className="ac-avatar";persona.alt="";persona.draggable=false;
    const deEspaldas=numero===0&&avatar==="avatar-22";
    if(deEspaldas)caja.classList.add("ac-de-espaldas");
    persona.src=deEspaldas?"assets/ahora-caigo/avatar-22-espalda.webp":"assets/atril/"+avatar+".webp";
    persona.onerror=()=>{persona.onerror=null;caja.classList.remove("ac-de-espaldas");persona.src="assets/atril/"+avatar+".webp";};
    const atril=document.createElement("img");atril.className="ac-atril";atril.alt="";atril.draggable=false;
    atril.src=BASE+"elementos/Giro_atril_oficial_chico.webp";
    const etiqueta=document.createElement("span");etiqueta.className="ac-nombre";
    etiqueta.textContent=numero===0?nombre:String(numero);
    caja.append(piso,persona,atril,etiqueta);return caja;
  }
  function abrir(contenedor){
    const anterior=raiz;salir();anterior?.remove();
    raiz=document.createElement("section");raiz.className="ac-juego";
    raiz.innerHTML=`<header class="ac-cabecera"><span>DUELO CONTRA BOTS</span><h2><img class="ac-logo" src="assets/no-te-caigas/logo-v3.webp" alt="No te caigas"></h2><p>Una pregunta para vos. Otra para tu rival.</p></header>
      <div class="ac-escenario" role="group" aria-label="Escenario con once participantes"><div class="ac-ronda" aria-hidden="true"></div></div>
      <section class="ac-duelo" aria-label="Duelo de preguntas" hidden>
        <div class="ac-marcador"><div class="ac-identidad"><img class="ac-tu-avatar" alt=""><span><small>VOS · <span class="ac-vidas">3 pases</span></small><strong class="ac-tu-nombre"></strong></span></div><span>VS</span><div class="ac-identidad"><img class="ac-rival-avatar" alt=""><span><small>RIVAL · BOT</small><strong class="ac-rival-nombre"></strong></span></div></div>
        <div class="ac-pregunta-top"><span class="ac-turno-texto" aria-live="polite"></span><button class="ac-pasar" type="button" title="Pasá esta pregunta al rival: tendrá 20 segundos" aria-label="Pasar pregunta al rival. Tendrá 20 segundos. Tenés tres pases."><span class="ac-pasar-texto">Pasar pregunta</span><small>Al rival · 20 s</small></button><div class="ac-reloj" role="timer" aria-label="Segundos restantes"><b>30</b><small>SEG</small></div></div>
        <span class="ac-categoria"></span><h3 class="ac-pregunta"></h3>
        <div class="ac-letras" aria-label="Respuesta con letras de ayuda"></div><small class="ac-cantidad"></small>
        <form class="ac-responder"><label for="acRespuesta">Tu respuesta</label><div><input id="acRespuesta" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="80" placeholder="Escribí tu respuesta…"><button type="submit">Responder ↵</button></div></form>
        <button class="ac-voz" type="button" aria-pressed="false">🎙 Responder hablando</button>
        <div class="ac-bot" hidden><span aria-hidden="true">● ● ●</span> El rival está pensando…</div>
        <p class="ac-mensaje" role="status" aria-live="polite"></p>
      </section>
      <div class="ac-controles"><p class="ac-estado" role="status" aria-live="polite">Sorteá con quién te vas a enfrentar.</p><button class="ac-sortear" type="button">Sortear rival</button><button class="ac-como-btn" type="button">❓ Cómo se juega</button><small class="ac-ayuda">30 segundos por pregunta · Tres pases para darle tu pregunta al rival con 20 segundos · Podés intentar varias respuestas mientras quede tiempo.</small></div>`;
    const final=document.createElement("dialog");final.className="ac-final";
    final.setAttribute("aria-labelledby","acFinalTitulo");final.setAttribute("aria-describedby","acFinalResumen");
    final.innerHTML='<div class="ac-final-contenido"><header class="ac-final-cabecera"><span class="ac-final-etiqueta">DUELO TERMINADO</span><h3 id="acFinalTitulo"></h3><p id="acFinalResumen"></p></header><div class="ac-final-escena"></div><div class="ac-final-detalle"><div class="ac-final-respuesta"><small>LA RESPUESTA ERA</small><strong></strong></div><div class="ac-final-cifras"><span class="ac-final-eliminados"></span><span class="ac-final-pases"></span></div><div class="ac-final-acciones"><button type="button" class="ac-final-primaria" autofocus></button><button type="button" class="ac-final-salir">Volver a Más juegos</button></div></div></div>';
    raiz.appendChild(final);
    const como=()=>PantallaFija.bienvenida(raiz.closest("#extContenido")||document.body,{logo:"assets/no-te-caigas/logo-v3.webp",alt:"No te caigas",dibujo:"assets/no-te-caigas/como.webp",sinFija:true,items:[["🎲","<b>Sorteá un rival</b> entre los 10 del estudio."],["❓","Una pregunta para vos, otra para él: <b>30 segundos</b> y letras de ayuda."],["🔁","¿No la sabés? <b>Pasásela</b>: tiene 20 segundos. Tenés 3 pases."],["🕳️","Quien falla <b>se cae por la trampilla</b>. ¡Eliminá a los 10!"]]});
    contenedor.appendChild(raiz);raiz.closest(".ext-shell")?.classList.add("ac-abierta");
    raiz.querySelector(".ac-como-btn").onclick=como;
    if(!reabriendo)como();
    reabriendo=false;
    const actual=raiz;
    let avatar="avatar-01",nombre="Gonzalo";
    try{avatar=localStorage.getItem("gya_avatar")||avatar;nombre=perfil.nombre||nombre;}catch(e){}
    if(!AVATARES.includes(avatar))avatar="avatar-01";
    const buscar=s=>actual.querySelector(s),escenario=buscar(".ac-escenario");
    const rivales=AVATARES.filter(a=>a!==avatar).slice(0,10).map((a,i)=>figura(a,"",i+1,POSICIONES[i]));
    const principal=figura(avatar,nombre,0,[50,94,21]);escenario.append(...rivales,principal);
    const boton=buscar(".ac-sortear"),estado=buscar(".ac-estado"),panel=buscar(".ac-duelo"),form=buscar(".ac-responder");
    const input=buscar("#acRespuesta"),mensaje=buscar(".ac-mensaje"),relojVista=buscar(".ac-reloj"),letras=buscar(".ac-letras");
    const pasar=buscar(".ac-pasar"),microfono=buscar(".ac-voz"),shell=actual.closest(".ext-shell");
    const Recon=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recon){microfono.disabled=true;microfono.textContent="Voz no disponible en este navegador";}
    const vivos=new Set(rivales.map((_,i)=>i)),usadas=new Set();
    let fase="listo",rival=-1,turno="yo",pregunta=null,limite=0,duracion=30000,pases=3;
    buscar(".ac-tu-nombre").textContent=nombre;
    const activo=()=>raiz===actual&&actual.isConnected;
    buscar(".ac-tu-avatar").src="assets/avatars/"+avatar+".webp";
    buscar(".ac-rival-avatar").src="assets/avatars/"+rivales[0].dataset.avatar+".webp";
    function ajustarPantalla(){
      if(!activo())return;
      final.style.setProperty("--ac-popup-alto",(window.visualViewport?.height||innerHeight)+"px");
      if(!actual.classList.contains("ac-en-duelo"))return;
      const vv=window.visualViewport,borde=vv?vv.offsetTop+vv.height:innerHeight;
      const pie=parseFloat(getComputedStyle(shell).paddingBottom)||12;
      const alto=Math.max(170,Math.floor(borde-actual.getBoundingClientRect().top-pie-2));
      actual.style.setProperty("--ac-alto",alto+"px");
      actual.classList.toggle("ac-bajo",alto<500);
      actual.classList.toggle("ac-muy-bajo",alto<350);
    }
    window.addEventListener("resize",ajustarPantalla);
    window.visualViewport?.addEventListener("resize",ajustarPantalla);
    quitarAjuste=()=>{window.removeEventListener("resize",ajustarPantalla);window.visualViewport?.removeEventListener("resize",ajustarPantalla);};
    function vistaPregunta(encendida){
      actual.classList.toggle("ac-en-duelo",encendida);
      shell.classList.toggle("ac-preguntando",encendida);
      if(encendida){shell.scrollTop=0;ajustarPantalla();}
    }
    function pararEscucha(){
      detenerVoz();microfono.classList.remove("ac-escuchando");microfono.setAttribute("aria-pressed","false");
      if(Recon)microfono.textContent="🎙 Responder hablando";
    }
    function pararReloj(){clearInterval(reloj);reloj=null;}
    function restaurarEscenario(){
      escenario.querySelectorAll(".ac-caido").forEach(el=>el.classList.add("ac-caida-terminada"));
      actual.insertBefore(escenario,panel);
    }
    function mostrarResultado({titulo,resumen,tipo="victoria",respuesta=pregunta?.respuesta||""}){
      if(!activo())return;
      pararReloj();pararEscucha();input.blur();panel.hidden=true;boton.hidden=true;boton.disabled=false;
      vistaPregunta(true);
      final.classList.toggle("ac-final-derrota",tipo==="derrota");
      final.querySelector(".ac-final-etiqueta").textContent=fase==="listo"?"DUELO TERMINADO":"FIN DE LA PARTIDA";
      final.querySelector("#acFinalTitulo").textContent=titulo;
      final.querySelector("#acFinalResumen").textContent=resumen;
      final.querySelector(".ac-final-respuesta").hidden=!respuesta;
      final.querySelector(".ac-final-respuesta strong").textContent=respuesta;
      final.querySelector(".ac-final-eliminados").textContent=(10-vivos.size)+" / 10 rivales eliminados";
      final.querySelector(".ac-final-pases").textContent=pases+(pases===1?" pase disponible":" pases disponibles");
      final.querySelector(".ac-final-escena").appendChild(escenario);
      final.querySelector(".ac-final-primaria").textContent=fase==="listo"?"Sortear próximo rival":"Volver a jugar";
      if(window.CompartirResultado){let bc=final.querySelector(".cr-boton");if(!bc){bc=CompartirResultado.boton(()=>null,"ac-compartir");final.querySelector(".ac-final-acciones").appendChild(bc);}
        const elim=10-vivos.size,res={titulo,resumen,tipo,respuesta};bc.onclick=ev=>{ev.stopPropagation();CompartirResultado.abrir({juego:"No te caigas",logo:"assets/no-te-caigas/logo-v3.webp",archivo:"no-te-caigas",
          titulo:res.tipo==="derrota"?"¡ME CAÍ!":elim>=10?"¡ELIMINÉ A LOS 10!":String(res.titulo||"").toUpperCase(),sub:res.resumen,
          cifras:[["🕳️",elim+"/10","rivales eliminados"],["🔁",pases,pases===1?"pase":"pases"],["🧍",vivos.size,"quedan"]],
          captura:{el:final.querySelector(".ac-final-escena")},
          filas:res.respuesta?[{emoji:"💬",texto:"La respuesta era: "+res.respuesta,estado:res.tipo==="derrota"?"mal":"ok"}]:[],
          texto:"🕳️ No te caigas · "+elim+" de 10 rivales eliminados."});};}
      ajustarPantalla();if(!final.open)final.showModal();ambiente(true);
    }
    final.querySelector(".ac-final-primaria").onclick=()=>{
      if(!activo())return;
      final.close();restaurarEscenario();
      if(fase==="fin"){reabriendo=true;abrir(contenedor);return;}
      boton.click();
    };
    const volverLobby=()=>{final.close();window.Extensiones?.abrirLobby();};
    final.querySelector(".ac-final-salir").onclick=volverLobby;
    final.addEventListener("cancel",e=>{e.preventDefault();volverLobby();});

    function pintarRespuesta(completa){
      letras.replaceChildren();
      letras.style.setProperty("--larga",Math.max(...pregunta.respuesta.split(" ").map(p=>p.length)));
      const caracteres=[...pregunta.respuesta],indices=caracteres.map((c,i)=>c===" "?-1:i).filter(i=>i>=0);
      // Pocas letras desde el arranque; posiciones distintas, incluso la primera oculta.
      const ayuda=new Set();const cantidad=Math.max(1,Math.floor(indices.length*.3));
      const disponibles=indices.slice();
      while(ayuda.size<cantidad){const n=Math.floor(Math.random()*disponibles.length);ayuda.add(disponibles.splice(n,1)[0]);}
      let i=0;
      pregunta.respuesta.split(" ").forEach(palabra=>{
        const grupo=document.createElement("span");grupo.className="ac-palabra";
        [...palabra].forEach(c=>{
          const casilla=document.createElement("span"),visible=completa||ayuda.has(i);
          casilla.className="ac-letra"+(visible?" ac-visible":"");casilla.textContent=visible?c:"_";
          grupo.appendChild(casilla);i++;
        });i++;letras.appendChild(grupo);
      });
      const n=indices.length;buscar(".ac-cantidad").textContent=n+" letras"+(pregunta.respuesta.includes(" ")?" · "+pregunta.respuesta.split(" ").length+" palabras":"");
    }
    function sacarPregunta(){
      const banco=window.AHORA_CAIGO_DATOS||[];
      const libres=banco.filter(q=>!usadas.has(q.id));
      if(!libres.length)return null;
      const nuevas=window.Vistas?Vistas.filtrar("ahora_caigo",libres,q=>q.id):libres;
      const q=nuevas[Math.floor(Math.random()*nuevas.length)];
      usadas.add(q.id);if(window.Vistas)Vistas.marcar("ahora_caigo",q.id);return q;
    }
    function finalizar(pierde){
      if(!activo()||fase!=="pregunta")return;
      fase="resultado";input.blur();pararReloj();pararEscucha();pasar.hidden=true;microfono.hidden=true;form.hidden=true;buscar(".ac-bot").hidden=true;
      pintarRespuesta(true);mensaje.className="ac-mensaje ac-mal";
      mensaje.textContent="Se agotaron los "+(duracion/1000)+" segundos sin acertar. La respuesta era "+pregunta.respuesta+".";
      try{window.sonidoErrorExt?.();}catch(e){}
      const caido=pierde==="yo"?principal:rivales[rival];
      caido.classList.remove("ac-turno","ac-iluminado","ac-elegido");caido.classList.add("ac-caido");
      caido.querySelector(".ac-nombre").textContent="Cayó";
      caido.setAttribute("aria-label",pierde==="yo"?nombre+" cayó":"Participante "+(rival+1)+" cayó");
      if(pierde==="yo"){
        fase="fin";estado.textContent="¡Caíste! Llegaste a eliminar "+(10-vivos.size)+" de 10 rivales.";
        mostrarResultado({titulo:"¡Caíste!",resumen:"Se agotaron los "+(duracion/1000)+" segundos. Podés volver a intentarlo.",tipo:"derrota"});
      }else{
        vivos.delete(rival);
        estado.textContent=vivos.size?"¡Ganaste el duelo! Quedan "+vivos.size+" rivales.":"¡Ganaste! Eliminaste a los diez rivales.";
        fase=vivos.size?"listo":"fin";
        mostrarResultado({titulo:vivos.size?"¡Ganaste el duelo!":"¡Ganaste la partida!",resumen:vivos.size?"El participante "+(rival+1)+" se quedó sin tiempo. Quedan "+vivos.size+" rivales.":"¡Eliminaste a los diez rivales y quedaste en pie!"});
      }
    }
    function acertar(){
      if(!activo()||fase!=="pregunta")return;
      fase="resolviendo";input.blur();pararReloj();pararEscucha();pasar.hidden=true;microfono.hidden=true;form.hidden=true;buscar(".ac-bot").hidden=true;
      pintarRespuesta(true);buscar(".ac-turno-texto").textContent="¡CORRECTO!";mensaje.className="ac-mensaje ac-bien";
      mensaje.textContent=turno==="yo"?"¡Correcto! Ahora le toca al rival.":"El rival acertó. ¡Te toca!";
      despues(()=>{if(activo()){turno=turno==="yo"?"bot":"yo";siguiente();}},1500);
    }
    function actualizarReloj(){
      if(!activo()||fase!=="pregunta")return;
      const ms=Math.max(0,limite-Date.now()),segundos=Math.ceil(ms/1000);
      relojVista.querySelector("b").textContent=segundos;
      relojVista.style.setProperty("--reloj",(ms/duracion*360)+"deg");
      relojVista.classList.toggle("ac-urgente",segundos<=5);
      if(ms<=0)finalizar(turno);
    }
    function siguiente({conservar=false,segundos=30}={}){
      if(!activo())return;
      ambiente(false);
      pararReloj();pararEscucha();if(!conservar)pregunta=sacarPregunta();
      if(!pregunta){
        fase="fin";vistaPregunta(false);pasar.hidden=true;microfono.hidden=true;form.hidden=true;buscar(".ac-bot").hidden=true;
        mensaje.className="ac-mensaje";mensaje.textContent="¡Completaste todas las preguntas de esta prueba!";
        estado.textContent="El banco de prueba terminó sin repetir preguntas.";
        mostrarResultado({titulo:"¡Prueba completada!",resumen:"Se completaron las "+usadas.size+" preguntas de esta prueba sin repetir ninguna.",respuesta:""});return;
      }
      fase="pregunta";panel.hidden=false;vistaPregunta(true);
      buscar(".ac-rival-avatar").src="assets/avatars/"+rivales[rival].dataset.avatar+".webp";
      buscar(".ac-rival-nombre").textContent="Participante "+(rival+1);
      buscar(".ac-turno-texto").textContent=turno==="yo"?"TE TOCA":"RESPONDE EL RIVAL";
      panel.classList.toggle("ac-turno-bot",turno==="bot");
      const identidades=buscar(".ac-marcador").querySelectorAll(".ac-identidad");
      identidades.forEach((el,i)=>{const juega=i===(turno==="yo"?0:1);el.classList.toggle("ac-activo",juega);el.setAttribute("aria-current",juega?"true":"false");});
      buscar(".ac-categoria").textContent=pregunta.categoria;
      buscar(".ac-pregunta").textContent=pregunta.pregunta;
      mensaje.className="ac-mensaje";mensaje.textContent=turno==="yo"?"Descubrí la respuesta antes de que se abra la trampilla.":"Mirá cómo responde tu rival.";
      input.value="";form.hidden=turno!=="yo";buscar(".ac-bot").hidden=turno!=="bot";
      input.disabled=turno!=="yo";pasar.hidden=turno!=="yo";microfono.hidden=turno!=="yo";
      if(!conservar)pintarRespuesta(false);
      rivales.forEach(r=>r.classList.remove("ac-turno"));principal.classList.remove("ac-turno");
      (turno==="yo"?principal:rivales[rival]).classList.add("ac-turno");
      estado.textContent="Duelo contra el participante "+(rival+1)+" · "+(10-vivos.size)+"/10 rivales eliminados";
      duracion=segundos*1000;limite=Date.now()+duracion;actualizarReloj();reloj=setInterval(actualizarReloj,100);
      if(turno==="bot"){
        const qActual=pregunta;
        const sabe=Math.random()<.72,demora=3500+Math.floor(Math.random()*4500);
        if(sabe)despues(()=>{
          if(activo()&&fase==="pregunta"&&turno==="bot"&&pregunta===qActual){
            if(Date.now()>=limite){finalizar("bot");return;}
            acertar();
          }
        },demora);
      }
    }
    function responder(){
      if(!activo()||fase!=="pregunta"||turno!=="yo")return;
      if(Date.now()>=limite){finalizar("yo");return;}
      const respuesta=normalizar(input.value);if(!respuesta)return;
      if([pregunta.respuesta,...(pregunta.alternativas||[])].some(r=>respuesta===normalizar(r))){acertar();return;}
      mensaje.className="ac-mensaje ac-mal";mensaje.textContent="No es esa. ¡Probá otra vez! Errar no gasta pases.";
      if(document.activeElement===input)input.select();
    }
    function usarPase(){
      if(!activo()||fase!=="pregunta"||turno!=="yo")return;
      if(Date.now()>=limite){finalizar("yo");return;}
      if(!pases){mensaje.className="ac-mensaje ac-mal";mensaje.textContent="No te quedan pases. Podés seguir intentando responder.";return;}
      pases--;buscar(".ac-vidas").textContent=pases+(pases===1?" pase":" pases");
      pasar.querySelector(".ac-pasar-texto").textContent=pases?"Pasar pregunta":"Sin pases";
      pasar.querySelector("small").textContent=pases?"Al rival · 20 s":"Ya usaste los 3";
      pasar.disabled=pases===0;
      pasar.setAttribute("aria-label",pases?"Pasar pregunta al rival. Quedan "+pases+" pases. Tendrá 20 segundos.":"Sin pases disponibles");
      turno="bot";siguiente({conservar:true,segundos:20});
      buscar(".ac-turno-texto").textContent="RESPONDE EL RIVAL";
      mensaje.className="ac-mensaje";mensaje.textContent="Usaste un pase. El rival tiene 20 segundos para esta misma pregunta.";
    }
    pasar.onclick=usarPase;
    form.onsubmit=e=>{e.preventDefault();responder();};
    microfono.onclick=()=>{
      if(!Recon||!activo()||fase!=="pregunta"||turno!=="yo")return;
      if(voz){pararEscucha();return;}
      const qActual=pregunta;
      const vigente=r=>activo()&&voz===r&&fase==="pregunta"&&turno==="yo"&&pregunta===qActual;
      try{
        const r=new Recon();voz=r;r.lang="es-UY";r.continuous=false;r.interimResults=false;r.maxAlternatives=5;
        input.blur();try{window.speechSynthesis?.cancel();}catch(e){}
        microfono.classList.add("ac-escuchando");microfono.setAttribute("aria-pressed","true");microfono.textContent="⏹ Escuchando… tocá para parar";
        mensaje.className="ac-mensaje";mensaje.textContent="Decí tu respuesta. El reloj sigue corriendo.";
        r.onresult=e=>{
          if(!vigente(r))return;
          const textos=Array.from(e.results?.[0]||[]).map(a=>String(a.transcript||"").trim()).filter(Boolean);
          const validas=[pregunta.respuesta,...(pregunta.alternativas||[])].map(normalizar);
          const texto=textos.find(t=>validas.includes(normalizar(t)))||textos[0]||"";
          pararEscucha();
          if(!texto){mensaje.textContent="No entendí la respuesta. Probá otra vez o escribila.";return;}
          if(["PASE","PASO","PASAR"].includes(normalizar(texto))&&!validas.includes(normalizar(texto))){usarPase();return;}
          input.value=texto.slice(0,80);responder();
          if(fase==="pregunta")mensaje.textContent='Escuché «'+texto.slice(0,45)+'». ¡Probá otra vez!';
        };
        r.onerror=e=>{
          if(!vigente(r))return;
          pararEscucha();mensaje.className="ac-mensaje ac-mal";
          mensaje.textContent=["not-allowed","service-not-allowed"].includes(e.error)?"Permití el micrófono para hablar, o respondé escribiendo.":e.error==="no-speech"?"No escuché tu respuesta. Probá otra vez o escribila.":"No se pudo usar el micrófono. Podés responder escribiendo.";
        };
        r.onend=()=>{if(vigente(r)){pararEscucha();mensaje.textContent="Micrófono cerrado. Podés volver a hablar o escribir.";}};
        r.start();
      }catch(e){pararEscucha();mensaje.className="ac-mensaje ac-mal";mensaje.textContent="No se pudo iniciar el micrófono. Podés responder escribiendo.";}
    };
    boton.onclick=()=>{
      if(fase==="fin"){reabriendo=true;abrir(contenedor);return;}
      if(fase!=="listo")return;
      if(vivos.size===10&&window.Fichas&&!Fichas.usar("ahora-caigo",()=>boton.click()))return;
      fase="sorteo";panel.hidden=true;vistaPregunta(false);ambiente(true);
      const opciones=[...vivos],destino=opciones[Math.floor(Math.random()*opciones.length)];
      const pasos=opciones.length*3+opciones.indexOf(destino);let paso=0;
      boton.disabled=true;estado.textContent="Buscando rival…";
      rivales.forEach(r=>r.classList.remove("ac-elegido","ac-iluminado","ac-turno"));principal.classList.remove("ac-turno");
      const avanzar=()=>{
        if(!activo()){timer=null;return;}
        rivales.forEach(r=>r.classList.remove("ac-iluminado"));
        rivales[opciones[paso%opciones.length]].classList.add("ac-iluminado");
        if(paso===pasos){
          timer=null;rival=destino;rivales[rival].classList.add("ac-elegido");
          estado.textContent="¡Tu rival es el participante "+(destino+1)+"!";
          boton.hidden=true;turno="bot";
          despues(siguiente,1000);return;
        }
        paso++;timer=setTimeout(avanzar,45+Math.pow(paso/pasos,4)*210);
      };avanzar();
    };
    ambiente(true);
    controlMusica=setInterval(sincronizarMusicaCaigo,250);
    document.addEventListener("visibilitychange",sincronizarMusicaCaigo);
  }
  return{abrir,salir};
})();
