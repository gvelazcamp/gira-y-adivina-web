/* Sopa Fugaz: juego local de práctica. La grilla, el reloj y el puntaje no
   comparten estado con las partidas de Ruleta. */
const SOPA_CONFIG={
  primerNivel:1,maxGrillaCelular:12,
  segundosBasePalabra:4,segundosPorLetra:1.2,factorMudanzas:1.15,factorTiempoExtra:1.1,grillaBase:10,
  puntosPalabra:100,puntosSegundo:5,graciaArrastreMs:2500,giroMs:1100,
  ticMs:50,registroPalabrasMax:100,intentosTablero:30,intentosColocacion:500,
  intentosInterior:350,margenInterior:1,
  niveles:{
    1:{n:10,palabras:3,min:4,max:6,margen:1.6,mudanza:9},
    2:{n:10,palabras:3,min:4,max:6,margen:1.4,mudanza:8},
    3:{n:10,palabras:4,min:5,max:8,margen:1.3,mudanza:7},
    4:{n:10,palabras:5,min:5,max:8,margen:1.15,mudanza:6},
    5:{n:11,palabras:5,min:5,max:10,margen:1.1,mudanza:5},
    6:{n:11,palabras:5,min:5,max:10,margen:1,mudanza:4.5}
  },
  avanzado:{n:12,palabrasBase:5,palabrasMax:6,min:5,max:11,margenInicial:.9,margenPaso:.05,margenPiso:.75,mudanzaInicial:4,mudanzaPaso:.5,mudanzaPiso:3.5}
};
const SopaFugaz=(()=>{
  const CLAVE="gya_sopa_fugaz";
  const dirsIniciales=[[0,1],[1,0]];
  const dirsAvanzadas=[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
  const azar=n=>Math.floor(Math.random()*n);
  /* Dibujos en assets/sopa/ (hoja de ChatGPT recortada). */
  const ARTE=n=>"assets/sopa/"+n+".webp";
  let datos=cargar(),raiz=null,gridEl=null,chipsEl=null,celdas=[],tablero=[],objetivos=[],halladas=new Set();
  let nivel=1,puntaje=0,tiempoMs=0,duracionMs=0,mudanzaMs=0,proximaMudanza=0,ultimaMarca=0;
  let jugando=false,mudando=false,arrastre=null,camino=[],intervalo=null,trasladoTimer=null,token=0,ultimoTic=0,ocultoDesde=0,categoria="",repetirConocidas=false,duelo=false;
  let audioMusica=null;
  function iniciarMusicaJuego(){
    try{
      if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
      if(!audioMusica){audioMusica=new Audio("assets/audio/sopa-fugaz-musica.mp3");audioMusica.loop=true;audioMusica.volume=.28;}
      if(audioMusica.paused)audioMusica.play().catch(()=>{});
    }catch(e){}
  }
  function detenerMusicaJuego(){try{if(audioMusica&&!audioMusica.paused)audioMusica.pause();}catch(e){}}

  function cargar(){
    try{const d=JSON.parse(localStorage.getItem(CLAVE)||"null");if(d&&typeof d==="object")return{
      mejor:Number(d.mejor)||0,palabrasTotal:Number(d.palabrasTotal)||0,nivelMax:Number(d.nivelMax)||1,
      palabras:Array.isArray(d.palabras)?d.palabras:[],
      descubiertas:[...new Set((Array.isArray(d.descubiertas)?d.descubiertas:(Array.isArray(d.palabras)?d.palabras.map(p=>p&&p.palabra):[])).filter(w=>typeof w==="string"))],
      niveles:d.niveles&&typeof d.niveles==="object"?d.niveles:{}
    };}catch(e){}
    return{mejor:0,palabrasTotal:0,nivelMax:1,palabras:[],descubiertas:[],niveles:{}};
  }
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}}
  function mejorPuntaje(){return datos.mejor;}
  function configNivel(nivelActual){
    if(SOPA_CONFIG.niveles[nivelActual])return SOPA_CONFIG.niveles[nivelActual];
    const a=SOPA_CONFIG.avanzado,pasos=nivelActual-7;
    return{n:Math.min(a.n,SOPA_CONFIG.maxGrillaCelular),palabras:Math.min(a.palabrasMax,a.palabrasBase+(pasos>0?1:0)),min:a.min,max:a.max,
      margen:Math.max(a.margenPiso,a.margenInicial-pasos*a.margenPaso),mudanza:Math.max(a.mudanzaPiso,a.mudanzaInicial-pasos*a.mudanzaPaso)};
  }
  function mezclar(lista){
    const a=[...lista];for(let i=a.length-1;i>0;i--){const j=azar(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;
  }
  function elegirPalabras(c){
    const fuente=nivel<=2?SOPA_DATOS.inicial:SOPA_DATOS.categorias[(nivel-3)%SOPA_DATOS.categorias.length];
    categoria=fuente.nombre;
    const descubiertas=new Set(datos.descubiertas);
    const elegible=w=>w.length>=c.min&&w.length<=Math.min(c.max,c.n)&&(repetirConocidas||!descubiertas.has(w));
    const preferidas=fuente.palabras.filter(elegible);
    const todas=[...new Set([SOPA_DATOS.inicial,...SOPA_DATOS.categorias].flatMap(f=>f.palabras))].filter(elegible);
    const elegidas=[];
    for(const w of [...mezclar(preferidas),...mezclar(todas)]){
      if(elegidas.includes(w))continue;
      if(elegidas.some(x=>x.includes(w)||w.includes(x)))continue;
      elegidas.push(w);if(elegidas.length===c.palabras)break;
    }
    if(elegidas.some(w=>!fuente.palabras.includes(w)))categoria="Palabras variadas";
    if(!elegidas.length)categoria="Todas encontradas";
    else if(elegidas.length<c.palabras)categoria="Últimas palabras nuevas";
    return elegidas;
  }
  function colocar(palabra,matriz,n,direcciones,preferirInterior){
    for(let intento=0;intento<SOPA_CONFIG.intentosColocacion;intento++){
      const [dr,dc]=direcciones[azar(direcciones.length)];
      const margenFila=n-(palabra.length-1)*Math.abs(dr),margenCol=n-(palabra.length-1)*Math.abs(dc);
      const fila=(dr<0?(palabra.length-1):0)+azar(margenFila);
      const col=(dc<0?(palabra.length-1):0)+azar(margenCol);
      const indices=Array.from({length:palabra.length},(_,i)=>(fila+dr*i)*n+col+dc*i);
      if(preferirInterior&&intento<SOPA_CONFIG.intentosInterior&&indices.some(k=>{
        const r=Math.floor(k/n),c=k%n,m=SOPA_CONFIG.margenInterior;
        return r<m||r>=n-m||c<m||c>=n-m;
      }))continue;
      if(indices.every((k,i)=>!matriz[k]||matriz[k]===palabra[i])){
        indices.forEach((k,i)=>matriz[k]=palabra[i]);return true;
      }
    }
    return false;
  }
  function construir(){
    const c=configNivel(nivel),n=c.n,restantes=objetivos.filter(w=>!halladas.has(w));
    const direcciones=nivel<=2?dirsIniciales:dirsAvanzadas;
    for(let intento=0;intento<SOPA_CONFIG.intentosTablero;intento++){
      const matriz=Array(n*n).fill("");
      const orden=mezclar(restantes).sort((a,b)=>b.length-a.length);
      if(!orden.every((w,i)=>colocar(w,matriz,n,nivel<=2&&restantes.length>=2&&i<2?[direcciones[i]]:direcciones,mudando)))continue;
      const relleno=("AAEEIIOOUUBCDFGLMNPRSTVZ"+objetivos.join("")).split("");
      tablero=matriz.map(letra=>letra||relleno[azar(relleno.length)]);
      dibujarTablero(n);return;
    }
    throw new Error("No se pudo armar la grilla de Sopa Fugaz");
  }
  function dibujarTablero(n){
    gridEl.style.setProperty("--sf-n",n);
    gridEl.replaceChildren();
    celdas=tablero.map((letra,k)=>{const celda=document.createElement("div");celda.className="sf-celda";celda.dataset.k=k;celda.textContent=letra;gridEl.appendChild(celda);return celda;});
  }
  function dibujarChips(){
    chipsEl.replaceChildren();objetivos.forEach(palabra=>{
      const chip=document.createElement("span");chip.className="sf-chip"+(halladas.has(palabra)?" hecho":"");chip.textContent=palabra;chipsEl.appendChild(chip);
    });
  }
  function dibujarHistorial(){
    if(!raiz)return;
    raiz.querySelector("#sfHistorialTitulo").innerHTML='<img class="sf-ico" src="'+ARTE("libro")+'" alt="">Mis palabras encontradas ('+datos.descubiertas.length+")";
    const lista=raiz.querySelector("#sfHistorialLista");lista.replaceChildren();
    if(!datos.descubiertas.length){lista.textContent="Todavía no encontraste ninguna.";return;}
    [...datos.descubiertas].reverse().forEach(w=>{const chip=document.createElement("span");chip.className="sf-historial-chip";chip.textContent=w;lista.appendChild(chip);});
  }
  function actualizarHUD(){
    if(!raiz)return;
    raiz.querySelector("#sfNivel").textContent=nivel;
    raiz.querySelector("#sfPuntos").textContent=puntaje;
    raiz.querySelector("#sfMejor").textContent=datos.mejor;
    raiz.querySelector("#sfTiempo").textContent=Math.max(0,Math.ceil(tiempoMs/1000));
    raiz.querySelector("#sfTiempoBarra").style.width=Math.max(0,tiempoMs/duracionMs*100)+"%";
  }
  function mostrarPanel(titulo,detalle,boton,accion,compartir=false,extra,dibujo){
    const panel=raiz.querySelector("#sfPanel");
    panel.innerHTML="";panel.hidden=false;
    const tarjeta=document.createElement("div");tarjeta.className="sf-panel";
    if(dibujo){const im=document.createElement("img");im.className="sf-panel-dibujo";im.src=ARTE(dibujo);im.alt="";im.draggable=false;tarjeta.appendChild(im);}
    const h=document.createElement("h3");h.textContent=titulo;
    const p=document.createElement("p");p.textContent=detalle;
    const acciones=document.createElement("div");acciones.className="sf-acciones";
    const principal=document.createElement("button");principal.className="sf-principal";principal.type="button";principal.textContent=boton;principal.onclick=accion;acciones.appendChild(principal);
    if(compartir){const b=document.createElement("button");b.type="button";b.textContent="📤 Compartir";b.onclick=()=>compartirResultado(b);acciones.appendChild(b);}
    if(extra){const b=document.createElement("button");b.type="button";b.textContent=extra.texto;b.onclick=extra.accion;
      if(extra.dibujo){b.classList.add("sf-con-dibujo");const im=document.createElement("img");im.src=ARTE(extra.dibujo);im.alt="";b.prepend(im);}
      acciones.appendChild(b);}
    tarjeta.append(h,p,acciones);panel.appendChild(tarjeta);
  }
  function guardarMejor(){if(puntaje>datos.mejor){datos.mejor=puntaje;guardar();}}
  function registrarResultado(gano){
    const clave=String(nivel),r=datos.niveles[clave]||{ganadas:0,perdidas:0,tiempoTotalMs:0};
    r[gano?"ganadas":"perdidas"]++;
    r.tiempoTotalMs+=Math.round(duracionMs-Math.max(0,tiempoMs));
    datos.niveles[clave]=r;datos.nivelMax=Math.max(datos.nivelMax,nivel);guardar();
  }
  function terminar(gano){
    if(!jugando)return;
    jugando=false;mudando=false;arrastre=null;camino=[];token++;clearTimeout(trasladoTimer);
    const faltantes=objetivos.filter(w=>!halladas.has(w));
    if(gano){
      const sobrantes=Math.ceil(tiempoMs/1000);
      puntaje+=sobrantes*SOPA_CONFIG.puntosSegundo;
      if(sobrantes>=10)logroDesbloquear("sopaRapida");
      sonarSFX("aplausos");vibrar([45,45,90]);
    }else{sonarSFX("abucheo");vibrar(90);}
    guardarMejor();registrarResultado(gano);actualizarHUD();
    if(duelo){
      Duelo.enviarFinal({valor:puntaje});
      Duelo.mostrarResultado({valor:puntaje},{etiqueta:"puntos de la ronda",onVolver:()=>{duelo=false;abrir(raiz.parentElement);}});
      return;
    }
    mostrarPanel(gano?"¡Ronda superada!":"Se acabó el tiempo",
      gano?"Llevás "+puntaje+" puntos. Te sobraron "+Math.ceil(tiempoMs/1000)+" segundos.":"Te faltaron: "+faltantes.join(", ")+". Hiciste "+puntaje+" puntos.",
      gano?"Siguiente ronda":"Jugar de nuevo",()=>{
        if(gano)nivel++;else{nivel=SOPA_CONFIG.primerNivel;puntaje=0;}
        iniciarRonda();
      },true,null,gano?"gano":"tiempo");
  }
  function iniciarRonda(){
    duelo=false;
    token++;clearTimeout(trasladoTimer);mudando=false;arrastre=null;camino=[];halladas.clear();
    const c=configNivel(nivel);
    objetivos=elegirPalabras(c);
    if(!objetivos.length){jugando=false;dibujarHistorial();mostrarPanel("¡Encontraste todas!","Ya descubriste todas las palabras disponibles para esta dificultad. Podés volver a jugarlas para practicar.","Rejugar conocidas",()=>{repetirConocidas=true;iniciarRonda();},false,null,"record");return;}
    arrancarRonda(c);
  }
  function arrancarRonda(c){
    duracionMs=Math.round(objetivos.reduce((sum,w)=>sum+SOPA_CONFIG.segundosBasePalabra+SOPA_CONFIG.segundosPorLetra*w.length,0)
      *SOPA_CONFIG.factorMudanzas*SOPA_CONFIG.factorTiempoExtra*(c.n/SOPA_CONFIG.grillaBase)*c.margen*1000);
    tiempoMs=duracionMs;mudanzaMs=c.mudanza*1000;
    construir();dibujarChips();
    raiz.querySelector("#sfCategoria").textContent=categoria;
    raiz.querySelector("#sfPanel").hidden=true;
    ultimoTic=performance.now();ultimaMarca=ultimoTic;proximaMudanza=ultimoTic+mudanzaMs;
    jugando=true;actualizarHUD();actualizarBarraMudanza(ultimoTic);
    objSumar("sopaRonda",1);
    if(duelo){
      Duelo.mostrarBadge();Duelo.actualizarBadge("0/"+objetivos.length);
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge(p.halladas+"/"+p.total));
    }
  }
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("Sopa Fugaz","sopa",{onListo:(soyHost)=>{
      duelo=true;token++;clearTimeout(trasladoTimer);mudando=false;arrastre=null;camino=[];halladas.clear();
      const c=configNivel(nivel);
      if(soyHost){
        objetivos=elegirPalabras(c);
        if(!objetivos.length){repetirConocidas=true;objetivos=elegirPalabras(c);}
        Duelo.enviarRonda({objetivos,categoria,nivel});arrancarRonda(c);
      }else Duelo.onRondaRecibida(datos=>{objetivos=datos.objetivos;categoria=datos.categoria;nivel=datos.nivel;arrancarRonda(configNivel(nivel));});
    }});
  }
  /* Destello de "palabra encontrada" en el medio de la palabra marcada. */
  function estallido(seleccion){
    const caja=raiz&&raiz.querySelector("#sfGridCaja");if(!caja||!seleccion.length)return;
    const cr=caja.getBoundingClientRect();let x=0,y=0;
    seleccion.forEach(k=>{const r=celdas[k].getBoundingClientRect();x+=r.left+r.width/2;y+=r.top+r.height/2;});
    const im=document.createElement("img");im.className="sf-estallido";im.src=ARTE("encontrada");im.alt="";
    im.style.left=(x/seleccion.length-cr.left)+"px";im.style.top=(y/seleccion.length-cr.top)+"px";
    caja.appendChild(im);setTimeout(()=>im.remove(),800);
  }
  function cancelarArrastre(){arrastre=null;camino=[];pintarCamino();}
  function mudar(ahora){
    if(!jugando||mudando)return;
    mudando=true;cancelarArrastre();
    if(typeof sonarGiroExt==="function")sonarGiroExt();gridEl.classList.add("spin");raiz.querySelector("#sfGridCaja").classList.add("mudando");
    celdas.forEach(c=>c.classList.add("gone"));
    const esteToken=token;
    trasladoTimer=setTimeout(()=>{
      if(esteToken!==token||!jugando)return;
      construir();
      trasladoTimer=setTimeout(()=>{
        if(esteToken!==token||!jugando)return;
        gridEl.classList.remove("spin");raiz.querySelector("#sfGridCaja").classList.remove("mudando");mudando=false;
        proximaMudanza=performance.now()+mudanzaMs;
      },SOPA_CONFIG.giroMs/2);
    },SOPA_CONFIG.giroMs/2);
  }
  function actualizarBarraMudanza(ahora){
    if(!raiz)return;
    raiz.querySelector("#sfMudanzaBarra").style.width=mudando?"0%":Math.max(0,(proximaMudanza-ahora)/mudanzaMs*100)+"%";
    raiz.querySelector("#sfMudanzaTexto").textContent=mudando?"¡Las letras se están mudando!":
      proximaMudanza<=ahora&&arrastre!==null?"Mudanza en espera: terminá de marcar":
      "Las letras se mudan en "+Math.max(0,Math.ceil((proximaMudanza-ahora)/1000))+" s";
  }
  function tic(){
    const ahora=performance.now();
    if(!jugando){ultimoTic=ahora;return;}
    if(document.hidden){if(!ocultoDesde)ocultoDesde=ahora;ultimoTic=ahora;return;}
    tiempoMs-=Math.max(0,ahora-ultimoTic);ultimoTic=ahora;
    if(tiempoMs<=0){tiempoMs=0;terminar(false);return;}
    actualizarHUD();actualizarBarraMudanza(ahora);
    if(!mudando&&ahora>=proximaMudanza){
      if(arrastre!==null&&ahora<proximaMudanza+SOPA_CONFIG.graciaArrastreMs)return;
      mudar(ahora);
    }
  }
  function alVolver(){
    if(document.hidden){detenerMusicaJuego();if(jugando&&!ocultoDesde)ocultoDesde=performance.now();return;}
    iniciarMusicaJuego();
    if(!ocultoDesde)return;
    const pausa=performance.now()-ocultoDesde;
    proximaMudanza+=pausa;ultimaMarca+=pausa;ultimoTic=performance.now();ocultoDesde=0;
  }
  function indiceDesdePuntero(e){
    const el=document.elementFromPoint(e.clientX,e.clientY);
    const celda=el&&el.closest(".sf-celda");
    return celda&&gridEl.contains(celda)?Number(celda.dataset.k):-1;
  }
  function pintarCamino(){
    if(!celdas.length)return;
    const marcadas=new Set(camino);
    celdas.forEach((c,i)=>c.classList.toggle("sel",marcadas.has(i)));
  }
  function extender(k){
    const n=configNivel(nivel).n,inicio=arrastre.k;
    const r0=Math.floor(inicio/n),c0=inicio%n,dr=Math.floor(k/n)-r0,dc=k%n-c0;
    if(!dr&&!dc){camino=[inicio];pintarCamino();return;}
    if(dr&&dc&&Math.abs(dr)!==Math.abs(dc))return;
    const pasos=Math.max(Math.abs(dr),Math.abs(dc)),sr=Math.sign(dr),sc=Math.sign(dc);
    camino=Array.from({length:pasos+1},(_,i)=>(r0+sr*i)*n+c0+sc*i);
    pintarCamino();
  }
  function punteroAbajo(e){
    if(!jugando||mudando)return;
    const k=indiceDesdePuntero(e);if(k<0)return;
    e.preventDefault();arrastre={id:e.pointerId,k};camino=[k];pintarCamino();
    gridEl.setPointerCapture(e.pointerId);
  }
  function punteroMueve(e){
    if(!arrastre||arrastre.id!==e.pointerId||mudando)return;
    const k=indiceDesdePuntero(e);if(k>=0)extender(k);
  }
  function punteroArriba(e){
    if(!arrastre||arrastre.id!==e.pointerId)return;
    const ultimo=indiceDesdePuntero(e);if(ultimo>=0)extender(ultimo);
    const seleccion=[...camino],letras=seleccion.map(k=>tablero[k]).join("");
    const reverso=[...letras].reverse().join("");
    const acierto=objetivos.find(w=>!halladas.has(w)&&(w===letras||(nivel>=3&&w===reverso)));
    cancelarArrastre();
    if(!jugando||mudando)return;
    if(acierto){
      halladas.add(acierto);puntaje+=SOPA_CONFIG.puntosPalabra;
      datos.palabrasTotal++;
      const ahora=performance.now();
      datos.palabras.push({nivel,palabra:acierto,ms:Math.round(ahora-ultimaMarca),fecha:new Date().toISOString()});
      if(!datos.descubiertas.includes(acierto))datos.descubiertas.push(acierto);
      if(datos.palabras.length>SOPA_CONFIG.registroPalabrasMax)datos.palabras.splice(0,datos.palabras.length-SOPA_CONFIG.registroPalabrasMax);
      ultimaMarca=ahora;guardar();
      dibujarChips();dibujarHistorial();actualizarHUD();
      seleccion.forEach(k=>celdas[k].classList.add("found"));
      estallido(seleccion);
      tac();vibrar(35);objSumar("sopaPalabras",1);
      logroDesbloquear("sopaPrimera");
      if(datos.palabrasTotal>=10)logroDesbloquear("sopaDiez");
      if(duelo)Duelo.enviarProgreso({halladas:halladas.size,total:objetivos.length});
      if(halladas.size===objetivos.length)terminar(true);
    }
  }
  function compartirResultado(boton){
    const texto="🔎 Sopa Fugaz · nivel "+nivel+" · "+puntaje+" puntos. ¡Jugá en Girá y Adiviná! "+location.origin+location.pathname;
    csCompartirImagen(generarCanvasCompartirJuego,"sopa-fugaz.png",texto,texto,boton);
  }
  function abrir(contenedor){
    salir();datos=cargar();nivel=SOPA_CONFIG.primerNivel;puntaje=0;repetirConocidas=false;raiz=document.createElement("div");raiz.className="sf-game";
    raiz.innerHTML='<button type="button" class="ext-volver" id="sfVolver">⟵ Extensiones</button><h2 class="sf-logo-h"><img class="sf-logo" src="'+ARTE("logo")+'" alt="Sopa Fugaz" draggable="false"></h2><p class="sf-sub">Categoría: <b id="sfCategoria">Sabores y lugares conocidos</b></p><div class="sf-hud"><div><small>Nivel</small><b id="sfNivel">1</b></div><div><small>Puntos</small><b id="sfPuntos">0</b></div><div><small>Mejor</small><b id="sfMejor">0</b></div><div><small><img class="sf-ico" src="'+ARTE("reloj")+'" alt="">Tiempo</small><b id="sfTiempo">0</b></div></div><div class="sf-bar"><i id="sfTiempoBarra"></i></div><div class="sf-chips" id="sfChips"></div><div class="sf-grid-caja" id="sfGridCaja"><div class="sf-grid" id="sfGrid" aria-label="Sopa de letras"></div><img class="sf-remolino" src="'+ARTE("mudanza")+'" alt="" draggable="false"></div><p class="sf-mudanza-texto" id="sfMudanzaTexto">Las letras se mudan cada pocos segundos</p><div class="sf-bar mudanza"><i id="sfMudanzaBarra"></i></div><details class="sf-historial"><summary id="sfHistorialTitulo">📖 Mis palabras encontradas (0)</summary><div class="sf-historial-lista" id="sfHistorialLista"></div></details><div class="sf-acciones"><button type="button" id="sfAyuda">¿Cómo se juega?</button></div><div class="sf-panel-capa" id="sfPanel"></div>';
    contenedor.appendChild(raiz);gridEl=raiz.querySelector("#sfGrid");chipsEl=raiz.querySelector("#sfChips");
    gridEl.addEventListener("pointerdown",punteroAbajo);
    gridEl.addEventListener("pointermove",punteroMueve);
    gridEl.addEventListener("pointerup",punteroArriba);
    gridEl.addEventListener("pointercancel",cancelarArrastre);
    raiz.querySelector("#sfVolver").onclick=()=>Extensiones.abrirLobby();
    raiz.querySelector("#sfAyuda").onclick=()=>{
      if(jugando){mostrarToast("🔎","Marcá en línea recta: horizontal o vertical; desde el nivel 3, también diagonal y al revés.");return;}
      mostrarPanel("¿Cómo se juega?","Arrastrá el dedo en línea recta sobre las letras para marcar las palabras de arriba. En niveles 1 y 2 aparecen horizontal o vertical; después también diagonal o al revés. Cada pocos segundos la sopa gira y las letras se mudan. Si estás marcando una palabra, espera hasta 2,5 segundos.","Jugar",iniciarRonda,false,null,"mascota");
    };
    intervalo=setInterval(tic,SOPA_CONFIG.ticMs);
    document.addEventListener("visibilitychange",alVolver);
    iniciarMusicaJuego();
    raiz.querySelector("#sfMejor").textContent=datos.mejor;
    dibujarHistorial();
    mostrarPanel("Sopa Fugaz","Encontrá las palabras arrastrando el dedo. Las letras giran y se mudan durante la ronda. Las que descubrís quedan en Mis palabras y no vuelven a salir mientras haya nuevas.","Jugar",iniciarRonda,false,{texto:"Jugar con un amigo",accion:iniciarDuelo,dibujo:"duelo"},"mascota");
  }
  function salir(){
    jugando=false;mudando=false;arrastre=null;token++;clearInterval(intervalo);clearTimeout(trasladoTimer);
    document.removeEventListener("visibilitychange",alVolver);
    detenerMusicaJuego();
    if(typeof Duelo!=="undefined")Duelo.salir();
    duelo=false;raiz=null;gridEl=null;chipsEl=null;celdas=[];intervalo=null;ocultoDesde=0;
  }
  return{abrir,salir,mejorPuntaje,configNivel};
})();
window.SopaFugaz=SopaFugaz;
