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
  let audioMusica=null;
  /* Dibujos en assets/rosco/ (hoja de ChatGPT recortada). */
  const ARTE=n=>"assets/rosco/"+n+".webp",ico=n=>'<img class="rr-ico" src="'+ARTE(n)+'" alt="" draggable="false">';
  function iniciarMusicaJuego(){
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
  function enfocar(){if(raiz&&!document.hidden){$("#rrEntrada").focus({preventScroll:true});ajustarPantalla();}}
  /* Que el teclado nunca tape donde se escribe (Android e iPhone), sin cambiar cómo se ve el juego:
     la ventana del Rosco ocupa exactamente la parte de la pantalla que queda ARRIBA del teclado
     (visualViewport) y, si el campo queda abajo, se corre solo un poquito hasta que se vea. */
  function ajustarPantalla(){
    if(!raiz||!shell)return;
    const vv=window.visualViewport,alto=Math.round(vv?vv.height:innerHeight),arriba=vv?Math.max(0,Math.round(vv.offsetTop)):0;
    shell.style.height=alto+"px";shell.style.top=arriba+"px";shell.style.bottom="auto";
    if(document.activeElement===$("#rrEntrada")){
      const sb=shell.getBoundingClientRect(),fb=$("#rrForm").getBoundingClientRect();
      if(fb.bottom>sb.bottom-10)shell.scrollTop+=fb.bottom-(sb.bottom-10);
    }
  }
  function siguiente(){
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
    if(typeof hablar==="function")hablar(d.definicion,audioMusica);
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
    if(fase==="fin")return;fase="fin";actual=-1;$("#rrEntrada").blur();
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
    if(fase==="resolver"||fase==="respuesta"){
      tiempo=Math.max(0,tiempo-dt);if(tiempo===0){terminar();return;}
    }
    if(fase==="giro"){
      espera-=dt;ultimoTac+=dt;
      if(ultimoTac>110+(1-Math.max(0,espera)/ROSCO_CONFIG.giroMs)*230){if(typeof tac==="function")tac();ultimoTac=0;}
      if(espera<=0)detenerGiro();
    }else if(fase==="respuesta"){espera-=dt;if(espera<=0)siguiente();}
    hud();
  }
  function visibilidad(){if(document.hidden)detenerMusicaJuego();else iniciarMusicaJuego();ultimo=performance.now();}
  function abrir(contenedor){
    salir();datos=cargar();nivel=datos.nivelMax;config=configNivel(nivel);fase="inicio";usadasSesion=new Set();
    raiz=document.createElement("div");raiz.className="rr-game";
    raiz.innerHTML='<button type="button" class="ext-volver" id="rrVolver">⟵ Extensiones</button><div class="rr-titulo rr-titulo-arte"><h2 class="rr-logo-h"><img class="rr-logo" src="'+ARTE("logo")+'" alt="El Rosco" draggable="false"></h2><p>Una vuelta, muchas palabras nuestras.</p></div><div id="rrJuego" hidden><div class="sf-hud"><div><small>Nivel</small><b id="rrNivel"></b></div><div><small>'+ico("aciertos")+'Aciertos</small><b id="rrAciertos"></b></div><div><small>'+ico("errores")+'Errores</small><b id="rrErrores"></b></div><div><small>'+ico("reloj")+'Tiempo</small><b id="rrTiempo"></b></div></div><div class="sf-bar"><i id="rrBarra"></i></div><div class="rr-rueda"><div id="rrDisco"></div><b id="rrGrande"></b></div><div class="rr-pista" role="status" aria-live="polite"><div class="voz-fila"><span class="rr-pista-ico">'+ico("pista")+'</span><small id="rrRegla"></small><button type="button" class="voz-btn rr-escuchar" id="rrEscuchar" aria-label="Escuchar la pista">'+ico("escuchar")+'</button></div><p id="rrDefinicion"></p></div><p id="rrMensaje" class="rr-mensaje" role="status"></p><form id="rrForm" autocomplete="off"><label class="rr-sr" for="rrEntrada">Tu respuesta</label><div class="rr-fila"><input id="rrEntrada" placeholder="Tu palabra" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="send" maxlength="60"><button id="rrEnviar" type="submit">Enviar</button><button id="rrPasar" type="button">'+ico("pasapalabra")+'<span>Pasapalabra</span></button></div></form></div><div id="rrPanel" class="rr-panel-capa"></div>';
    contenedor.appendChild(raiz);shell=raiz.closest(".ext-shell");shell?.classList.add("rr-abierta");
    $("#rrVolver").onclick=()=>Extensiones.abrirLobby();
    $("#rrForm").onsubmit=e=>{e.preventDefault();enviar();};$("#rrPasar").onclick=pasar;
    $("#rrEscuchar").onclick=()=>{if(actual>=0&&typeof hablar==="function")hablar(items[actual].definicion,audioMusica);};
    for(const b of raiz.querySelectorAll("#rrForm button"))b.onpointerdown=e=>e.preventDefault();
    $("#rrEntrada").onbeforeinput=e=>{if(fase!=="resolver")e.preventDefault();};
    $("#rrEntrada").addEventListener("focus",()=>setTimeout(ajustarPantalla,350));$("#rrEntrada").addEventListener("blur",()=>setTimeout(ajustarPantalla,350));
    window.visualViewport?.addEventListener("resize",ajustarPantalla);window.visualViewport?.addEventListener("scroll",ajustarPantalla);window.addEventListener("resize",ajustarPantalla);
    document.addEventListener("visibilitychange",visibilidad);ultimo=performance.now();intervalo=setInterval(tic,ROSCO_CONFIG.ticMs);iniciarMusicaJuego();
    const acciones=[["Jugar nivel "+nivel,iniciar]];if(nivel>1)acciones.push(["Practicar desde el nivel 1",()=>{nivel=1;iniciar();}]);
    acciones.push(["Jugar con un amigo 👥",iniciarDuelo]);
    panel("El Rosco Rioplatense",config.letras+" letras y "+config.segundos+" segundos. Leé cada pista y escribí la palabra: tenés un intento por letra. Pasapalabra la deja para después. El reloj se pausa al girar. Acertá al menos "+Math.ceil(config.letras*ROSCO_CONFIG.proporcionAvance)+" y respondé todas para avanzar. Jugás gratis, sin gastar vidas ni monedas. Mejor: "+datos.mejor+" puntos.",acciones,"personaje");ajustarPantalla();
  }
  function salir(){
    clearInterval(intervalo);intervalo=null;document.removeEventListener("visibilitychange",visibilidad);
    window.visualViewport?.removeEventListener("resize",ajustarPantalla);window.visualViewport?.removeEventListener("scroll",ajustarPantalla);window.removeEventListener("resize",ajustarPantalla);
    if(shell){shell.style.height="";shell.style.top="";shell.style.bottom="";}
    shell?.classList.remove("rr-abierta");
    if("speechSynthesis" in window)speechSynthesis.cancel();
    if(typeof sincronizarMusica==="function")sincronizarMusica();
    detenerMusicaJuego();
    if(typeof Duelo!=="undefined")Duelo.salir();
    duelo=false;raiz=null;shell=null;fase="inicio";items=[];estados=[];
  }
  return{abrir,salir,enviar,configNivel,mejorPuntaje:()=>cargar().mejor};
})();
window.RoscoRioplatense=RoscoRioplatense;
