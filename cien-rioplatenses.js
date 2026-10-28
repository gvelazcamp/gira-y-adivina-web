/* 100 Rioplatenses Dicen: edición de práctica con paneles originales. */
const CIEN_CONFIG={rondas:3,multiplicadores:[1,2,3],maxErrores:3,giroMs:2400,vueltas:3,seleccionMs:750,ticMs:50};
const CienRioplatenses=(()=>{
  const CLAVE="gya_cien_rioplatenses",norm=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  /* Adem\u00e1s de los alias cargados a mano, aceptamos singular/plural autom\u00e1ticamente
     (p.ej. "disfraz" vale como "disfraces") probando las formas t\u00edpicas del espa\u00f1ol
     en vez de una sola regla fija, porque "panes" y "llaves" singularizan distinto. */
  function formasSingulares(s){
    const f=new Set([s]);
    if(s.length>4&&s.endsWith("CES"))f.add(s.slice(0,-3)+"Z");
    if(s.length>3&&s.endsWith("ES")){f.add(s.slice(0,-2));f.add(s.slice(0,-1));}
    else if(s.length>2&&s.endsWith("S"))f.add(s.slice(0,-1));
    return f;
  }
  function mismaPalabra(a,b){const fa=formasSingulares(a);for(const x of formasSingulares(b))if(fa.has(x))return true;return false;}
  let datos=cargar(),raiz=null,shell=null,fase="inicio",ronda=0,puntos=0,errores=0,pregunta=null,encontradas=[];
  let usadasPartida=[],resumen=[],angulo=0,espera=0,ultimo=0,tacMs=0,intervalo=null,categoriaActual=null;
  let duelo=false,preguntasDuelo=null;
  let audioMusica=null;
  /* Dibujos en assets/cien/ (hoja de ChatGPT recortada): logo, panel, cruz, íconos de los 12 temas y la conductora. */
  const ARTE=n=>"assets/cien/"+n+".webp",icoTema=c=>'<img class="cr-ico-tema" src="'+ARTE("c_"+c.id)+'" alt="" draggable="false">';
  function iniciarMusicaJuego(){
    try{
      if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
      if(!audioMusica){audioMusica=new Audio("assets/audio/cien-rioplatenses-musica.mp3");audioMusica.loop=true;audioMusica.volume=.28;}
      if(audioMusica.paused)audioMusica.play().catch(()=>{});
    }catch(e){}
  }
  function detenerMusicaJuego(){try{if(audioMusica&&!audioMusica.paused)audioMusica.pause();}catch(e){}}
  const $=s=>raiz?.querySelector(s);
  function cargar(){
    try{const d=JSON.parse(localStorage.getItem(CLAVE)||"null");if(d&&typeof d==="object")return{
      mejor:Number.isFinite(d.mejor)&&d.mejor>=0?d.mejor:0,
      usadas:Array.isArray(d.usadas)?d.usadas.filter(id=>CIEN_PREGUNTAS.some(p=>p.id===id)):[]
    };}catch(e){}
    let anterior=0;try{anterior=Number(localStorage.getItem("gya_100rio_best"))||0;}catch(e){}
    return{mejor:Math.max(0,anterior),usadas:[]};
  }
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}}
  function disponibles(){return CIEN_PREGUNTAS.filter(p=>!datos.usadas.includes(p.id)&&!usadasPartida.includes(p.id));}
  function prepararBanco(){if(!disponibles().length){datos.usadas=[...usadasPartida];guardar();}}
  function elegirPregunta(){
    prepararBanco();const pool=disponibles();
    const categorias=CIEN_CATEGORIAS.filter(c=>pool.some(p=>p.categoria===c.id));
    const categoria=categorias[Math.floor(Math.random()*categorias.length)];
    if(!categoria)return null;
    const opciones=pool.filter(p=>p.categoria===categoria.id);return opciones[Math.floor(Math.random()*opciones.length)];
  }
  function dibujarRuleta(){
    const disco=$("#crDisco"),svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("viewBox","0 0 400 400");svg.setAttribute("aria-hidden","true");disco.replaceChildren(svg);
    const n=CIEN_CATEGORIAS.length,punto=a=>[200+194*Math.sin(a),200-194*Math.cos(a)];
    CIEN_CATEGORIAS.forEach((c,i)=>{
      const inicio=i*2*Math.PI/n,fin=(i+1)*2*Math.PI/n,[x1,y1]=punto(inicio),[x2,y2]=punto(fin);
      const path=document.createElementNS(svg.namespaceURI,"path");path.setAttribute("d",`M200 200 L${x1} ${y1} A194 194 0 0 1 ${x2} ${y2} Z`);
      path.setAttribute("fill",c.color);path.setAttribute("stroke","#FFE8AA88");path.setAttribute("stroke-width","1.2");path.dataset.categoria=c.id;svg.appendChild(path);
      const label=document.createElement("div"),interior=document.createElement("span"),icono=document.createElement("i"),nombre=document.createElement("b"),a=(inicio+fin)/2;
      label.className="cr-gajo";label.dataset.categoria=c.id;label.style.left=(50+35*Math.sin(a))+"%";label.style.top=(50-35*Math.cos(a))+"%";
      label.setAttribute("aria-label",c.nombre);icono.innerHTML=icoTema(c);nombre.textContent=c.corto;interior.append(icono,nombre);label.appendChild(interior);disco.appendChild(label);
    });
    const luces=$("#crLuces");luces.replaceChildren();
    for(let i=0;i<36;i++){const b=document.createElement("i"),a=i*Math.PI/18;b.style.left=(50+48*Math.sin(a))+"%";b.style.top=(50-48*Math.cos(a))+"%";b.style.animationDelay=(i%3)*.18+"s";luces.appendChild(b);}
    marcarDisponibles();
  }
  function marcarDisponibles(){
    const cats=new Set(disponibles().map(p=>p.categoria));
    raiz.querySelectorAll("[data-categoria]").forEach(el=>{el.classList.toggle("agotada",!cats.has(el.dataset.categoria));el.classList.remove("elegida");});
  }
  function mostrarMensaje(texto,tipo=""){const el=$("#crMensaje");el.textContent=texto;el.className="cr-mensaje "+tipo;}
  function hud(){
    raiz.dataset.fase=fase;$("#crRonda").textContent=(ronda||1)+" / "+CIEN_CONFIG.rondas;
    $("#crPuntos").textContent=puntos;$("#crMejor").textContent=datos.mejor;
    $("#crMultiplicador").textContent="×"+CIEN_CONFIG.multiplicadores[Math.max(0,ronda-1)];
    const fallos=$("#crFallos");fallos.setAttribute("aria-label",errores+" de "+CIEN_CONFIG.maxErrores+" errores");
    [...fallos.children].forEach((el,i)=>el.classList.toggle("usado",i<errores));
    $("#crEnviar").disabled=fase!=="responder";$("#crRendirse").disabled=fase!=="responder";
  }
  function enfocar(){if(!raiz||document.hidden)return;$("#crEntrada").focus({preventScroll:true});ajustarPantalla();}
  function ajustarPantalla(){
    if(!raiz||!shell)return;
    if(document.activeElement===$("#crEntrada"))$("#crForm").scrollIntoView({block:"nearest"});
  }
  function iniciar(){if(!duelo&&window.Fichas&&!Fichas.usar("cien-rioplatenses",iniciar))return;ronda=0;puntos=0;usadasPartida=[];resumen=[];$("#crFinal").hidden=true;girar();}
  function elegirPreguntaParaDuelo(yaElegidas){
    const pool=CIEN_PREGUNTAS.filter(p=>!yaElegidas.includes(p.id));
    const categorias=CIEN_CATEGORIAS.filter(c=>pool.some(p=>p.categoria===c.id));
    const categoria=categorias[Math.floor(Math.random()*categorias.length)];
    const opciones=pool.filter(p=>p.categoria===categoria.id);
    return opciones[Math.floor(Math.random()*opciones.length)];
  }
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("100 Rioplatenses Dicen","cien",{onListo:(soyHost)=>{
      duelo=true;Duelo.mostrarBadge();Duelo.actualizarBadge("0");
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge(String(p.puntos)));
      if(soyHost){
        const ids=[];
        for(let i=0;i<CIEN_CONFIG.rondas;i++)ids.push(elegirPreguntaParaDuelo(ids).id);
        preguntasDuelo=ids;Duelo.enviarRonda({ids});iniciar();
      }else Duelo.onRondaRecibida(datos=>{preguntasDuelo=datos.ids;iniciar();});
    }});
  }
  function girar(){
    if(!raiz||fase==="giro"||fase==="seleccion"||ronda>=CIEN_CONFIG.rondas)return;
    pregunta=duelo?CIEN_PREGUNTAS.find(p=>p.id===preguntasDuelo[ronda]):elegirPregunta();if(!pregunta)return;
    if(!duelo)marcarDisponibles();categoriaActual=CIEN_CATEGORIAS.find(c=>c.id===pregunta.categoria);
    ronda++;errores=0;encontradas=pregunta.respuestas.map(()=>false);fase="giro";
    usadasPartida.push(pregunta.id);datos.usadas.push(pregunta.id);guardar();
    $("#crEscenaRuleta").hidden=false;$("#crEscenaPanel").hidden=true;$("#crIntro").hidden=true;$("#crSiguiente").hidden=true;
    $("#crForm").hidden=false;$("#crRendirse").hidden=true;$("#crEntrada").value="";$("#crEntrada").placeholder="Prepará tu respuesta…";
    $("#crRuletaTitulo").textContent="¡Que gire la suerte!";$("#crSeleccion").textContent="Eligiendo el tema de la ronda "+ronda;
    $("#crSeleccion").classList.remove("lista");$("#crRuleta").classList.add("girando");mostrarMensaje("");
    const reducido=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const indice=CIEN_CATEGORIAS.indexOf(categoriaActual),centro=(indice+.5)*360/CIEN_CATEGORIAS.length;
    angulo+=(reducido?0:CIEN_CONFIG.vueltas*360)+((-centro-angulo)%360+360)%360;
    espera=reducido?0:CIEN_CONFIG.giroMs;tacMs=0;
    $("#crDisco").style.setProperty("--cr-duracion",espera+"ms");$("#crDisco").style.transform="rotate("+angulo+"deg)";
    raiz.querySelectorAll(".cr-gajo>span").forEach(el=>el.style.transform="rotate("+(-angulo)+"deg)");
    ultimo=performance.now();hud();enfocar();if(reducido)seleccionar();
  }
  function seleccionar(){
    fase="seleccion";espera=matchMedia("(prefers-reduced-motion: reduce)").matches?0:CIEN_CONFIG.seleccionMs;
    $("#crRuleta").classList.remove("girando");$("#crRuletaTitulo").textContent="El tema de esta ronda es…";
    $("#crSeleccion").textContent=categoriaActual.icono+" "+categoriaActual.nombre+" · puntos ×"+CIEN_CONFIG.multiplicadores[ronda-1];
    $("#crSeleccion").classList.add("lista");
    raiz.querySelectorAll('[data-categoria="'+categoriaActual.id+'"]').forEach(el=>el.classList.add("elegida"));
    hud();if(espera===0)mostrarPanel();
  }
  function mostrarPanel(){
    fase="responder";$("#crEscenaRuleta").hidden=true;$("#crEscenaPanel").hidden=false;$("#crRendirse").hidden=false;
    $("#crCategoria").innerHTML=icoTema(categoriaActual);$("#crCategoria").append(" "+categoriaActual.nombre);
    $("#crPregunta").textContent=pregunta.pregunta;$("#crEntrada").placeholder="Tu respuesta…";
    if(typeof hablar==="function")hablar(pregunta.pregunta,audioMusica);
    const tablero=$("#crTablero");tablero.replaceChildren();
    pregunta.respuestas.forEach((r,i)=>{
      const fila=document.createElement("div"),num=document.createElement("b"),txt=document.createElement("span"),pts=document.createElement("em");
      fila.className="cr-respuesta";fila.id="crRespuesta"+i;num.textContent=i+1;txt.textContent="RESPUESTA OCULTA";pts.textContent="?";
      fila.append(num,txt,pts);tablero.appendChild(fila);
    });
    mostrarMensaje("Buscá las 6 respuestas. Tenés 3 oportunidades de fallar.");hud();enfocar();
  }
  function revelar(i,pendiente=false){
    const fila=$("#crRespuesta"+i),r=pregunta.respuestas[i];fila.classList.add(pendiente?"pendiente":"acierto");
    fila.querySelector("span").textContent=r.texto;fila.querySelector("em").textContent=r.puntos*CIEN_CONFIG.multiplicadores[ronda-1];
    fila.setAttribute("aria-label",r.texto+", "+(pendiente?"sin encontrar":"encontrada")+", "+r.puntos+" puntos base");
  }
  function enviar(){
    if(!raiz||fase!=="responder"||document.hidden)return;
    const valor=norm($("#crEntrada").value);if(!valor){mostrarMensaje("Escribí una respuesta para probar.");enfocar();return;}
    $("#crEntrada").value="";
    const i=pregunta.respuestas.findIndex(r=>[r.texto,...r.alias].some(a=>{const an=norm(a);return an===valor||mismaPalabra(an,valor);}));
    if(i>=0&&encontradas[i]){mostrarMensaje("¡Esa ya está! Probá con otra.","repetida");enfocar();return;}
    if(i>=0){
      encontradas[i]=true;const valor=pregunta.respuestas[i].puntos*CIEN_CONFIG.multiplicadores[ronda-1];puntos+=valor;revelar(i);
      mostrarMensaje("✓ ¡Está en el panel! +"+valor+" puntos","acierto");
      if(typeof bip==="function"){bip(740,.16,"sine",.06);bip(1110,.23,"triangle",.035);}
      if(typeof sonarSFX==="function")sonarSFX("aplausos");
      if(typeof vibrar==="function")vibrar(25);
      if(typeof logroDesbloquear==="function")logroDesbloquear("cienPrimera");
    }else{
      errores++;mostrarMensaje("✕ Esa respuesta no está en este panel.","error");
      sonidoErrorExt();if(typeof vibrar==="function")vibrar([40,30,40]);
    }
    hud();if(encontradas.every(Boolean)||errores>=CIEN_CONFIG.maxErrores)cerrarRonda();else enfocar();
  }
  function cerrarRonda(){
    if(fase!=="responder")return;fase="rondaTerminada";$("#crEntrada").blur();$("#crForm").hidden=true;$("#crRendirse").hidden=true;
    pregunta.respuestas.forEach((r,i)=>{if(!encontradas[i])revelar(i,true);});
    const completas=encontradas.filter(Boolean).length;
    resumen.push({categoria:categoriaActual.nombre,aciertos:completas,errores,puntos:pregunta.respuestas.reduce((s,r,i)=>s+(encontradas[i]?r.puntos*CIEN_CONFIG.multiplicadores[ronda-1]:0),0)});
    if(typeof objSumar==="function")objSumar("cienRonda",1);
    if(completas===pregunta.respuestas.length&&errores===0&&typeof logroDesbloquear==="function")logroDesbloquear("cienPanel");
    mostrarMensaje(completas===pregunta.respuestas.length?"¡Panel completo! Las encontraste todas.":"Encontraste "+completas+" de "+pregunta.respuestas.length+". Las restantes quedan a la vista.");
    const siguiente=$("#crSiguiente");siguiente.hidden=false;
    siguiente.textContent=ronda<CIEN_CONFIG.rondas?"Girar la ruleta · puntos ×"+CIEN_CONFIG.multiplicadores[ronda]:"Ver mi resultado";
    siguiente.onclick=ronda<CIEN_CONFIG.rondas?girar:terminar;
    if(ronda===CIEN_CONFIG.rondas){datos.mejor=Math.max(datos.mejor,puntos);guardar();}
    if(duelo)Duelo.enviarProgreso({puntos});
    hud();siguiente.focus({preventScroll:true});ajustarPantalla();
  }
  function terminar(){
    if(fase!=="rondaTerminada")return;fase="fin";
    if(resumen.every(r=>r.aciertos===6&&r.errores===0)&&typeof logroDesbloquear==="function")logroDesbloquear("cienPerfecta");
    if(duelo){
      Duelo.enviarFinal({valor:puntos});
      Duelo.mostrarResultado({valor:puntos},{etiqueta:"puntos de la partida",onVolver:()=>{duelo=false;abrir(raiz.parentElement);}});
      return;
    }
    $("#crEscenaPanel").hidden=true;$("#crSiguiente").hidden=true;$("#crFinal").hidden=false;mostrarMensaje("");
    $("#crFinalDibujo").src=ARTE(puntos>=datos.mejor&&puntos>0?"record":resumen.some(r=>r.aciertos>=4)?"gano":"perdio");
    $("#crResultadoPuntos").textContent=puntos;$("#crResultadoMarca").textContent="Tu mejor marca: "+datos.mejor+" puntos";
    const lista=$("#crResumen");lista.replaceChildren();
    resumen.forEach((r,i)=>{const p=document.createElement("p"),b=document.createElement("b"),span=document.createElement("span");b.textContent="Ronda "+(i+1)+" · "+r.categoria;span.textContent=r.aciertos+"/6 · "+r.puntos+" puntos";p.append(b,span);lista.appendChild(p);});
    hud();$("#crOtra").focus({preventScroll:true});shell?.scrollTo(0,0);
  }
  function compartir(b){
    const texto="🎡 100 Rioplatenses Dicen · "+puntos+" puntos\n"+resumen.map((r,i)=>"Ronda "+(i+1)+": "+r.aciertos+"/6 · "+r.puntos+" puntos").join("\n")+"\nEdición de práctica · Girá y Adiviná\n"+location.origin+location.pathname;
    const imagen=()=>{
      const cv=document.createElement("canvas");cv.width=720;cv.height=900;const c=cv.getContext("2d");
      const fondo=c.createLinearGradient(0,0,720,900);fondo.addColorStop(0,"#482067");fondo.addColorStop(1,"#160B24");c.fillStyle=fondo;c.fillRect(0,0,720,900);c.textAlign="center";
      c.fillStyle="#F5B301";c.font="bold 120px sans-serif";c.fillText("100",360,175);c.fillStyle="#fff";c.font="bold 33px sans-serif";c.fillText("RIOPLATENSES DICEN",360,233);
      c.fillStyle="#37D6C0";c.font="bold 110px sans-serif";c.fillText(puntos,360,410);c.font="23px sans-serif";c.fillText("PUNTOS",360,451);
      resumen.forEach((r,i)=>{c.fillStyle="#fff";c.font="26px sans-serif";c.fillText("Ronda "+(i+1)+" · "+r.aciertos+"/6 · "+r.puntos+" puntos",360,560+i*66);});
      c.fillStyle="#D7C8E5";c.font="22px sans-serif";c.fillText("Edición de práctica · Girá y Adiviná",360,826);return cv;
    };
    if(typeof csCompartirImagen==="function")csCompartirImagen(imagen,"100-rioplatenses.png",texto,texto,b);
  }
  function tic(){
    const ahora=performance.now(),dt=ahora-ultimo;ultimo=ahora;
    if(!raiz||document.hidden)return;
    if(fase==="giro"){
      espera-=dt;tacMs+=dt;
      if(tacMs>90+(1-Math.max(0,espera)/CIEN_CONFIG.giroMs)*240){if(typeof tac==="function")tac();tacMs=0;}
      if(espera<=0)seleccionar();
    }else if(fase==="seleccion"){espera-=dt;if(espera<=0)mostrarPanel();}
  }
  function visibilidad(){ultimo=performance.now();if(document.hidden)detenerMusicaJuego();else iniciarMusicaJuego();}
  function abrir(contenedor){
    salir();datos=cargar();ronda=0;puntos=0;errores=0;angulo=0;fase="inicio";usadasPartida=[];prepararBanco();
    raiz=document.createElement("div");raiz.className="cr-game";
    raiz.innerHTML='<button type="button" class="ext-volver" id="crVolver">⟵ Extensiones</button><header class="cr-titulo cr-titulo-arte"><h2 class="cr-logo-h"><img class="cr-logo" src="'+ARTE("logo")+'" alt="100 Rioplatenses Dicen" draggable="false"></h2></header><div class="cr-hud"><div><small>Ronda</small><b id="crRonda"></b></div><div><small>Puntos</small><b id="crPuntos"></b></div><div><small>Mejor</small><b id="crMejor"></b></div><div class="cr-multi"><small>Multiplicador</small><b id="crMultiplicador"></b></div></div><section id="crEscenaRuleta"><h3 id="crRuletaTitulo">¿Qué tema te toca?</h3><div id="crRuleta" class="cr-ruleta"><div class="cr-aro"><div id="crDisco"></div></div><div id="crLuces" aria-hidden="true"></div><div class="cr-puntero" aria-hidden="true"></div><div class="cr-centro"><strong>100</strong><span>DICEN</span></div></div><p id="crSeleccion" class="cr-seleccion" aria-live="polite">12 temas · una nueva sorpresa en cada giro</p><div id="crIntro"><button id="crJugar" class="cr-principal" type="button">Girar y jugar <span>↻</span></button><button id="crDuelo" class="cr-rendirse" type="button">Jugar con un amigo 👥</button><p class="cr-reglas">Descubrí las 6 respuestas del panel.<br>3 rondas · 3 errores por ronda · puntos ×1, ×2 y ×3</p><button type="button" class="cr-ayuda-btn" id="crAyudaBtn">❓ Cómo se juega</button></div></section><section id="crEscenaPanel" hidden><div class="cr-panel-cabecera"><span id="crCategoria"></span><div id="crFallos" role="img"><i><img src="'+ARTE("error")+'" alt=""></i><i><img src="'+ARTE("error")+'" alt=""></i><i><img src="'+ARTE("error")+'" alt=""></i></div></div><div class="voz-fila"><h3 id="crPregunta"></h3><button type="button" class="voz-btn" id="crEscuchar" aria-label="Escuchar la pregunta">🔊</button></div><div id="crTablero" class="cr-tablero"></div></section><div id="crControles"><p id="crMensaje" class="cr-mensaje" role="status"></p><form id="crForm" autocomplete="off" hidden><label class="cr-sr" for="crEntrada">Tu respuesta para el panel</label><div class="cr-fila"><input id="crEntrada" maxlength="80" placeholder="Tu respuesta…" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" enterkeyhint="send"><button id="crEnviar" type="submit">Enviar</button></div></form><button id="crRendirse" class="cr-rendirse" type="button" hidden>Me rindo · mostrar respuestas</button><button id="crSiguiente" class="cr-principal" type="button" hidden></button></div><section id="crFinal" class="cr-final" hidden><img class="cr-final-dibujo" id="crFinalDibujo" src="'+ARTE("gano")+'" alt="" draggable="false"><small>¡LAS TRES RONDAS COMPLETAS!</small><h3>Así quedó tu partida</h3><strong id="crResultadoPuntos"></strong><span>puntos</span><p id="crResultadoMarca"></p><div id="crResumen"></div><button id="crOtra" class="cr-principal" type="button">Volver a girar ↻</button><button id="crCompartir" class="cr-rendirse" type="button">Compartir resultado</button></section><p class="cr-nota">Edición de práctica · respuestas y puntajes de juego, sin encuesta real.</p><div id="crBienvenida" class="cr-bienv"><div class="cr-bienv-caja"><button type="button" class="cr-bienv-x" id="crBienvX" aria-label="Cerrar">✕</button><img class="cr-conductora" src="'+ARTE("personaje")+'" alt="" draggable="false"><h3>¡Bienvenidos a 100&nbsp;Rioplatenses Dicen!</h3><p class="cr-bienv-intro">La ruleta elige el tema y te hago una pregunta. Tenés que adivinar las <b>6 respuestas</b> que dio la gente.</p><ul><li><span>✍️</span><em>Escribí una respuesta y mandala: si está en el panel, sumás sus puntos.</em></li><li><span>❌</span><em>Tenés <b>3 errores</b> por ronda. Al tercero se revelan las que faltan.</em></li><li><span>🔥</span><em>Son <b>3 rondas</b> y los puntos valen ×1, ×2 y ×3.</em></li><li><span>👥</span><em>También podés jugar con un amigo.</em></li></ul><button type="button" class="cr-principal" id="crBienvOk">¡A jugar!</button></div></div>';
    contenedor.appendChild(raiz);shell=raiz.closest(".ext-shell");shell?.classList.add("cr-abierta");dibujarRuleta();hud();
    $("#crVolver").onclick=()=>Extensiones.abrirLobby();
    $("#crJugar").onclick=iniciar;$("#crOtra").onclick=iniciar;$("#crCompartir").onclick=e=>compartir(e.currentTarget);
    $("#crDuelo").onclick=iniciarDuelo;
    const bienv=$("#crBienvenida"),cerrarBienv=()=>{bienv.hidden=true;};
    $("#crBienvOk").onclick=cerrarBienv;$("#crBienvX").onclick=cerrarBienv;bienv.onclick=e=>{if(e.target===bienv)cerrarBienv();};
    $("#crAyudaBtn").onclick=()=>{bienv.hidden=false;};
    $("#crEscuchar").onclick=()=>{if(pregunta&&typeof hablar==="function")hablar(pregunta.pregunta,audioMusica);};
    $("#crForm").onsubmit=e=>{e.preventDefault();enviar();};$("#crRendirse").onclick=cerrarRonda;
    $("#crEnviar").onpointerdown=e=>e.preventDefault();$("#crEntrada").onbeforeinput=e=>{if(fase!=="responder")e.preventDefault();};
    document.addEventListener("visibilitychange",visibilidad);window.visualViewport?.addEventListener("resize",ajustarPantalla);window.visualViewport?.addEventListener("scroll",ajustarPantalla);window.addEventListener("resize",ajustarPantalla);
    ultimo=performance.now();intervalo=setInterval(tic,CIEN_CONFIG.ticMs);ajustarPantalla();iniciarMusicaJuego();
  }
  function salir(){
    clearInterval(intervalo);intervalo=null;document.removeEventListener("visibilitychange",visibilidad);
    window.visualViewport?.removeEventListener("resize",ajustarPantalla);window.visualViewport?.removeEventListener("scroll",ajustarPantalla);window.removeEventListener("resize",ajustarPantalla);
    shell?.classList.remove("cr-abierta");
    raiz=null;shell=null;fase="inicio";pregunta=null;encontradas=[];
    if("speechSynthesis" in window)speechSynthesis.cancel();
    detenerMusicaJuego();
    if(typeof sincronizarMusica==="function")sincronizarMusica();
    if(typeof Duelo!=="undefined")Duelo.salir();
    duelo=false;preguntasDuelo=null;
  }
  return{abrir,salir,enviar,mejorPuntaje:()=>cargar().mejor};
})();
window.CienRioplatenses=CienRioplatenses;
