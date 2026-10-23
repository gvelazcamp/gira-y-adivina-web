/* Silabario Rioplatense: práctica gratuita. Un solo tablero tiene TODAS las
   sílabas de TODAS las respuestas de la partida, mezcladas entre sí. Vas
   pasando de pregunta en pregunta y tocás, donde estén, las sílabas que
   arman cada respuesta — las que ya se usaron quedan apagadas pero a la
   vista. El tablero se reordena entre pregunta y pregunta, y también si te
   quedás mucho rato sin responder la actual. */
const SILABARIO_CONFIG={
  segundosPorPalabra:16,puntosAcierto:100,bonoSegundo:2,
  mezclaMs:550,pausaMs:900,ticMs:50,proporcionAvance:.7,distraccionMs:14000,
  margenMinimo:.75,descensoMargen:.05,
  niveles:{1:{fichas:25,columnas:5,margen:1.6},2:{fichas:36,columnas:6,margen:1.4},3:{fichas:49,columnas:7,margen:1.2}}
};
const SilabarioRioplatense=(()=>{
  const CLAVE="gya_silabario_rioplatense";
  let datos=cargar(),raiz=null,items=[],estados=[],fichas=[],elegidas=[],actual=-1,bloqueado=false,tiempoPregunta=0,usadasSesion=new Set();
  let nivel=1,config=null,fase="inicio",tiempo=0,tiempoTotal=0,espera=0,ultimo=0,intervalo=null,duelo=false;
  let audioMusica=null;
  /* Dibujos en assets/silabario/ (hoja de ChatGPT recortada). */
  const ARTE=n=>"assets/silabario/"+n+".webp",ico=n=>'<img class="sb-ico" src="'+ARTE(n)+'" alt="" draggable="false">';
  function iniciarMusicaJuego(){
    try{
      if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
      if(!audioMusica){audioMusica=new Audio("assets/audio/silabario-rioplatense-musica.mp3");audioMusica.loop=true;audioMusica.volume=.28;}
      if(audioMusica.paused)audioMusica.play().catch(()=>{});
    }catch(e){}
  }
  function detenerMusicaJuego(){try{if(audioMusica&&!audioMusica.paused)audioMusica.pause();}catch(e){}}
  const $=s=>raiz?.querySelector(s);
  const numero=(v,base=0)=>Number.isFinite(v)&&v>=0?v:base;
  function cargar(){
    try{const d=JSON.parse(localStorage.getItem(CLAVE));if(d&&typeof d==="object")return{
      mejor:numero(d.mejor),nivelMax:Math.max(1,Math.floor(numero(d.nivelMax,1)))
    };}catch(e){}
    return{mejor:0,nivelMax:1};
  }
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}}
  function configNivel(n){
    const c=SILABARIO_CONFIG.niveles[n];
    if(c)return{...c};
    const columnas=n+4;
    return{fichas:columnas*columnas,columnas,margen:Math.max(SILABARIO_CONFIG.margenMinimo,1-(n-3)*SILABARIO_CONFIG.descensoMargen)};
  }
  function mezclar(lista){const a=[...lista];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  /* El tablero siempre tiene que quedar un cuadrado completo (5x5, 6x6...),
     nunca con la última fila a medias. Por eso elegimos palabras cuyas
     sílabas sumen EXACTO la cantidad de fichas del nivel, probando varias
     combinaciones al azar. Si ninguna cierra justo (dataset chico, puede
     pasar), se completa con alguna sílaba repetida como relleno inerte.
     Primero probamos solo con palabras que todavía no salieron en esta
     partida (para no repetir de un nivel a otro); si con esas no se puede
     cerrar el cuadrado, recién ahí se habilita el resto del banco. */
  function intentarCuadrado(pool){
    for(let intento=0;intento<80;intento++){
      const candidatas=mezclar(pool),elegidas=[];let suma=0;
      for(const palabra of candidatas){
        const n=palabra.silabas.length;
        if(suma+n<=config.fichas){elegidas.push(palabra);suma+=n;}
        if(suma===config.fichas)return elegidas;
      }
    }
    return null;
  }
  function armarRonda(){
    const preferidas=SILABARIO_DATOS.filter(d=>nivel<3?d.nivel<=2:d.nivel>=2);
    const pool=preferidas.length?preferidas:SILABARIO_DATOS;
    const noVistas=Vistas.filtrar("silabario",pool,d=>d.respuesta).filter(d=>!usadasSesion.has(d.respuesta));
    const sinRepetir=pool.filter(d=>!usadasSesion.has(d.respuesta));
    const elegidas=(noVistas.length?intentarCuadrado(noVistas):null)||(sinRepetir.length?intentarCuadrado(sinRepetir):null)||intentarCuadrado(pool)||(()=>{
      const candidatas=mezclar(pool),out=[];let suma=0;
      for(const palabra of candidatas){const n=palabra.silabas.length;if(suma+n<=config.fichas){out.push(palabra);suma+=n;}}
      return out;
    })();
    elegidas.forEach(d=>usadasSesion.add(d.respuesta));Vistas.marcar("silabario",elegidas.map(d=>d.respuesta));
    return elegidas;
  }
  function construirFichas(objetivo){
    let id=0;const todas=[];
    items.forEach((item,palabraIdx)=>item.silabas.forEach(texto=>todas.push({id:id++,texto,palabraIdx,relleno:false,el:null})));
    while(todas.length<objetivo){
      const texto=todas[Math.floor(Math.random()*todas.length)].texto;
      todas.push({id:id++,texto,palabraIdx:-1,relleno:true,el:null});
    }
    return mezclar(todas);
  }
  function pendientes(){return estados.map((s,i)=>s==="pendiente"?i:-1).filter(i=>i>=0);}
  function conteo(s){return estados.filter(x=>x===s).length;}
  function hud(){
    $("#sbNivel").textContent=nivel;$("#sbAciertos").textContent=conteo("acierto")+"/"+items.length;
    $("#sbErrores").textContent=conteo("error");$("#sbTiempo").textContent=Math.max(0,Math.ceil(tiempo/1000));
    $("#sbBarra").style.width=Math.max(0,tiempo/tiempoTotal*100)+"%";
    $("#sbBorrar").disabled=fase!=="jugando"||bloqueado||!elegidas.length;
    $("#sbPasar").disabled=fase!=="jugando"||bloqueado;
  }
  function mensaje(texto,tipo=""){const el=$("#sbMensaje");el.textContent=texto;el.className="sb-mensaje "+tipo;}
  function sonido(acierto){
    if(typeof bip!=="function")return;
    if(acierto){bip(660,.2,"sine",.065);bip(990,.3,"triangle",.04);}
    if(typeof vibrar==="function")vibrar(acierto?25:[45,40,45]);
  }
  function renderTablero(){
    const tablero=$("#sbTablero");tablero.replaceChildren();
    tablero.style.gridTemplateColumns="repeat("+config.columnas+",1fr)";
    fichas.forEach(f=>{
      const b=document.createElement("button");b.type="button";b.className="sb-ficha"+(f.relleno?" relleno":"");b.textContent=f.texto;
      b.disabled=f.relleno;
      if(!f.relleno)b.onclick=()=>tocarFicha(f);
      f.el=b;tablero.appendChild(b);
    });
  }
  function reordenar(cb){
    const tablero=$("#sbTablero"),reducido=matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reducido){fichas=mezclar(fichas);tablero.append(...fichas.map(f=>f.el));cb&&cb();return;}
    tablero.classList.add("girando");
    setTimeout(()=>{fichas=mezclar(fichas);tablero.append(...fichas.map(f=>f.el));},SILABARIO_CONFIG.mezclaMs/2);
    setTimeout(()=>{tablero.classList.remove("girando");cb&&cb();},SILABARIO_CONFIG.mezclaMs);
  }
  function renderRespuesta(item){
    const cont=$("#sbRespuesta");cont.replaceChildren();
    item.silabas.forEach((_,i)=>{
      const slot=document.createElement("span");slot.className="sb-slot"+(i<elegidas.length?" lleno":"");
      slot.textContent=i<elegidas.length?elegidas[i].texto:"";
      cont.appendChild(slot);
    });
  }
  function tocarFicha(f){
    if(fase!=="jugando"||bloqueado||f.el.disabled)return;
    f.el.disabled=true;f.el.classList.add("elegida");
    elegidas.push(f);
    renderRespuesta(items[actual]);
    if(elegidas.length===items[actual].silabas.length)verificar();
  }
  function borrar(){
    if(fase!=="jugando"||bloqueado||!elegidas.length)return;
    const ultima=elegidas.pop();
    ultima.el.disabled=false;ultima.el.classList.remove("elegida");
    renderRespuesta(items[actual]);
  }
  function verificar(){
    const item=items[actual],texto=elegidas.map(f=>f.texto).join(""),ok=texto===item.respuesta;
    estados[actual]=ok?"acierto":"error";
    elegidas.forEach(f=>f.el.classList.remove("elegida"));
    fichas.filter(f=>f.palabraIdx===actual).forEach(f=>{f.el.disabled=true;f.el.classList.add("usada");});
    elegidas.forEach(f=>{if(f.palabraIdx!==actual)f.el.disabled=false;});
    elegidas=[];
    fase="respuesta";espera=SILABARIO_CONFIG.pausaMs;
    sonido(ok);
    mensaje(ok?"¡Bien! +100 puntos · "+item.respuesta:"Era "+item.respuesta,ok?"acierto":"error");
    hud();
    if(duelo)Duelo.enviarProgreso({aciertos:conteo("acierto"),total:items.length});
  }
  function pasar(){if(fase==="jugando"&&!bloqueado)siguiente();}
  function distraer(){
    if(fase!=="jugando"||bloqueado)return;
    bloqueado=true;tiempoPregunta=0;
    elegidas.forEach(f=>{f.el.disabled=false;f.el.classList.remove("elegida");});elegidas=[];
    renderRespuesta(items[actual]);mensaje("El tablero se mezcló…");
    reordenar(()=>{bloqueado=false;hud();});
  }
  function siguiente(){
    const p=pendientes();if(!p.length){terminar();return;}
    const opciones=p.length>1?p.filter(i=>i!==actual):p;
    actual=opciones[Math.floor(Math.random()*opciones.length)];
    elegidas.forEach(f=>{f.el.disabled=false;f.el.classList.remove("elegida");});
    fase="jugando";elegidas=[];tiempoPregunta=0;bloqueado=true;mensaje("");
    $("#sbPista").textContent=items[actual].pista;
    $("#sbSilabasCant").textContent="("+items[actual].silabas.length+(items[actual].silabas.length===1?" sílaba)":" sílabas)");
    if(typeof hablar==="function")hablar(items[actual].pista,audioMusica);
    renderRespuesta(items[actual]);hud();
    reordenar(()=>{bloqueado=false;hud();});
  }
  function iniciar(){if(window.Fichas&&!Fichas.usar("silabario-rioplatense",iniciar))return;duelo=false;config=configNivel(nivel);items=armarRonda();arrancarRonda();}
  function arrancarRonda(){
    estados=items.map(()=>"pendiente");fichas=construirFichas(config.fichas);
    actual=-1;tiempoTotal=Math.round(items.length*SILABARIO_CONFIG.segundosPorPalabra*config.margen)*1000;tiempo=tiempoTotal;
    ultimo=performance.now();bloqueado=false;
    $("#sbPanel").hidden=true;$("#sbJuego").hidden=false;
    renderTablero();siguiente();
    if(duelo){
      Duelo.mostrarBadge();Duelo.actualizarBadge("0/"+items.length);
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge(p.aciertos+"/"+p.total));
    }
  }
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("Silabario Rioplatense","silabario",{onListo:(soyHost)=>{
      duelo=true;
      if(soyHost){config=configNivel(nivel);items=armarRonda();Duelo.enviarRonda({items,config});arrancarRonda();}
      else Duelo.onRondaRecibida(datos=>{config=datos.config;items=datos.items;arrancarRonda();});
    }});
  }
  function panel(titulo,detalle,acciones,dibujo){
    const p=$("#sbPanel");p.innerHTML='<div class="sf-panel">'+(dibujo?'<img class="sb-panel-dibujo" src="'+ARTE(dibujo)+'" alt="" draggable="false">':"")+'<h3></h3><p></p><div class="sf-acciones"></div></div>';
    p.querySelector("h3").textContent=titulo;p.querySelector("p").textContent=detalle;
    const cont=p.querySelector(".sf-acciones");
    acciones.forEach(([texto,accion],i)=>{const b=document.createElement("button");b.type="button";b.textContent=texto;if(i===0)b.className="sf-principal";b.onclick=()=>accion(b);cont.appendChild(b);});
    p.hidden=false;
  }
  function terminar(){
    if(fase==="fin")return;fase="fin";
    const aciertos=conteo("acierto"),errores=conteo("error"),faltan=pendientes().length;
    const bonus=faltan===0?Math.max(0,Math.ceil(tiempo/1000))*SILABARIO_CONFIG.bonoSegundo:0;
    const puntos=aciertos*SILABARIO_CONFIG.puntosAcierto+bonus;
    if(duelo){
      datos.mejor=Math.max(datos.mejor,puntos);guardar();hud();
      Duelo.enviarFinal({valor:aciertos});
      Duelo.mostrarResultado({valor:aciertos},{etiqueta:"aciertos sobre "+items.length,onVolver:()=>{duelo=false;abrir(raiz.parentElement);}});
      return;
    }
    const avanzar=faltan===0&&aciertos>=Math.ceil(items.length*SILABARIO_CONFIG.proporcionAvance);
    datos.mejor=Math.max(datos.mejor,puntos);if(avanzar)datos.nivelMax=Math.max(datos.nivelMax,nivel+1);guardar();
    hud();
    const acciones=[];
    if(avanzar)acciones.push(["Siguiente nivel",()=>{nivel++;iniciar();}]);
    acciones.push(["Otra ronda · nivel "+nivel,iniciar]);
    panel(faltan?"¡Se terminó el tiempo!":errores?"Tablero terminado":"¡Tablero perfecto!",
      aciertos+" aciertos · "+errores+" errores · "+faltan+" sin responder. "+puntos+" puntos"+(bonus?" ("+bonus+" por tiempo)":"")+". Récord: "+datos.mejor+"."+(avanzar?" ¡Desbloqueaste el nivel "+(nivel+1)+"!":" Acertá al menos "+Math.ceil(items.length*SILABARIO_CONFIG.proporcionAvance)+" y respondé todas para avanzar."),acciones,faltan?"tiempo":errores?"terminado":"perfecto");
  }
  function tic(){
    const ahora=performance.now(),dt=Math.max(0,ahora-ultimo);ultimo=ahora;
    if(!raiz||document.hidden||fase==="inicio"||fase==="fin")return;
    if(fase==="jugando"||fase==="respuesta"){
      tiempo=Math.max(0,tiempo-dt);if(tiempo===0){terminar();return;}
    }
    if(fase==="jugando"&&!bloqueado){
      tiempoPregunta+=dt;if(tiempoPregunta>=SILABARIO_CONFIG.distraccionMs)distraer();
    }else if(fase==="respuesta"){espera-=dt;if(espera<=0)siguiente();}
    hud();
  }
  function visibilidad(){if(document.hidden)detenerMusicaJuego();else iniciarMusicaJuego();ultimo=performance.now();}
  function abrir(contenedor){
    salir();datos=cargar();nivel=datos.nivelMax;config=configNivel(nivel);fase="inicio";usadasSesion=new Set();
    raiz=document.createElement("div");raiz.className="sb-game";
    raiz.innerHTML='<button type="button" class="ext-volver" id="sbVolver">⟵ Extensiones</button><div class="sb-titulo sb-titulo-arte"><h2 class="sb-logo-h"><img class="sb-logo" src="'+ARTE("logo")+'" alt="Silabario Rioplatense" draggable="false"></h2><p>Un tablero con todas las sílabas. Armá cada respuesta con las que estén.</p></div><div id="sbJuego" hidden><div class="sf-hud"><div><small>Nivel</small><b id="sbNivel"></b></div><div><small>'+ico("aciertos")+'Aciertos</small><b id="sbAciertos"></b></div><div><small>'+ico("errores")+'Errores</small><b id="sbErrores"></b></div><div><small>'+ico("reloj")+'Tiempo</small><b id="sbTiempo"></b></div></div><div class="sf-bar"><i id="sbBarra"></i></div><div class="sb-pista" role="status" aria-live="polite"><div class="voz-fila"><p id="sbPista"></p><button type="button" class="voz-btn" id="sbEscuchar" aria-label="Escuchar la pista">🔊</button></div><small id="sbSilabasCant"></small></div><div class="sb-respuesta" id="sbRespuesta"></div><p id="sbMensaje" class="sb-mensaje" role="status"></p><div class="sb-tablero-caja"><div class="sb-tablero" id="sbTablero"></div><img class="sb-mezcla" src="'+ARTE("mezcla")+'" alt="" draggable="false"></div><div class="sf-acciones"><button type="button" id="sbBorrar">⌫ Borrar</button><button type="button" id="sbPasar">Pasar ↻</button></div></div><div class="sf-panel-capa" id="sbPanel" hidden></div>';
    contenedor.appendChild(raiz);
    $("#sbVolver").onclick=()=>Extensiones.abrirLobby();
    $("#sbBorrar").onclick=borrar;$("#sbPasar").onclick=pasar;
    $("#sbEscuchar").onclick=()=>{if(actual>=0&&typeof hablar==="function")hablar(items[actual].pista,audioMusica);};
    document.addEventListener("visibilitychange",visibilidad);ultimo=performance.now();intervalo=setInterval(tic,SILABARIO_CONFIG.ticMs);iniciarMusicaJuego();
    const acciones=[["Jugar nivel "+nivel,iniciar]];if(nivel>1)acciones.push(["Practicar desde el nivel 1",()=>{nivel=1;iniciar();}]);
    acciones.push(["Jugar con un amigo 👥",iniciarDuelo]);
    panel("Silabario Rioplatense","Un tablero de "+config.columnas+"×"+config.columnas+" con todas las sílabas de las respuestas de este nivel. Tocá en orden las sílabas que arman cada respuesta, estén donde estén — las que ya usaste quedan marcadas. El tablero se reordena entre pregunta y pregunta, y también si te quedás trabado mucho rato. Si no sabés, tocá Pasar. Respondé bien la mayoría para avanzar de nivel. Jugás gratis, sin gastar vidas ni monedas. Mejor: "+datos.mejor+" puntos.",acciones,"personaje");
  }
  function salir(){
    clearInterval(intervalo);intervalo=null;document.removeEventListener("visibilitychange",visibilidad);
    if("speechSynthesis" in window)speechSynthesis.cancel();
    if(typeof sincronizarMusica==="function")sincronizarMusica();
    detenerMusicaJuego();
    if(typeof Duelo!=="undefined")Duelo.salir();
    duelo=false;raiz=null;fase="inicio";items=[];estados=[];fichas=[];elegidas=[];
  }
  return{abrir,salir,configNivel,mejorPuntaje:()=>cargar().mejor};
})();
window.SilabarioRioplatense=SilabarioRioplatense;
