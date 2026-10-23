/* Memoria en Giro: pares contra reloj, sin gastar monedas ni vidas. */
const MEMORIA_GIRO_SIMBOLOS=["🌟","🦋","🍓","🐚","🌈","🎈","🍋","🐝","🪁","🌻","🐬","🍀","🧩","🦊","🍄","🪐","🐸","🎸","⚓","🍒"];
const MEMORIA_GIRO_NIVELES={
  1:{pares:3,columnas:3,segundos:45,vista:3.5,vistaGiro:2.5,giro:18},
  2:{pares:4,columnas:4,segundos:50,vista:3.8,vistaGiro:2.8,giro:16},
  3:{pares:6,columnas:4,segundos:65,vista:4.5,vistaGiro:3,giro:15},
  4:{pares:8,columnas:4,segundos:80,vista:5,vistaGiro:3.2,giro:14}
};
const MEMORIA_GIRO_GIROS=3;
const MemoriaEnGiro=(()=>{
  const CLAVE="gya_memoria_en_giro";
  const azar=n=>Math.floor(Math.random()*n);
  /* Dibujos en assets/memoria-giro/ (hoja de ChatGPT recortada). */
  const ARTE=n=>"assets/memoria-giro/"+n+".webp",ico=n=>'<img class="mgx-ico" src="'+ARTE(n)+'" alt="" draggable="false">';
  const ponerHtml=(el,html)=>{if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}};   /* el HUD corre 20 veces por segundo: solo se redibuja si cambió */
  let datos=cargar(),raiz=null,cartas=[],config=null,nivel=1,puntos=0,pares=0,racha=0,fallos=0,girosRestantes=MEMORIA_GIRO_GIROS;
  let fase="inicio",primera=null,segunda=null,tiempoMs=0,vistaMs=0,falloMs=0,giroMs=0,animacionMs=0,recuerdoMs=0;
  let intervalo=null,ultimoTic=0,mensaje="",duelo=false;
  let audioMusica=null;
  function iniciarMusicaJuego(){
    try{
      if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
      if(!audioMusica){audioMusica=new Audio("assets/audio/memoria-en-giro-musica.mp3");audioMusica.loop=true;audioMusica.volume=.28;}
      if(audioMusica.paused)audioMusica.play().catch(()=>{});
    }catch(e){}
  }
  function detenerMusicaJuego(){try{if(audioMusica&&!audioMusica.paused)audioMusica.pause();}catch(e){}}

  function cargar(){
    try{const d=JSON.parse(localStorage.getItem(CLAVE)||"null");if(d&&typeof d==="object")return{
      mejor:Math.max(0,Number(d.mejor)||0),nivelMax:Math.max(1,Number(d.nivelMax)||1),
      ganadas:Math.max(0,Number(d.ganadas)||0)
    };}catch(e){}
    return{mejor:0,nivelMax:1,ganadas:0};
  }
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}}
  function mejorPuntaje(){return datos.mejor;}
  function configNivel(n){
    if(MEMORIA_GIRO_NIVELES[n])return MEMORIA_GIRO_NIVELES[n];
    const paso=n-4;
    return{pares:8,columnas:4,segundos:Math.max(55,80-paso*3),vista:Math.max(3.5,5-paso*.2),vistaGiro:3.2,giro:Math.max(9,14-paso)};
  }
  function mezclar(lista){
    const copia=[...lista];for(let i=copia.length-1;i>0;i--){const j=azar(i+1);[copia[i],copia[j]]=[copia[j],copia[i]];}return copia;
  }
  function nuevasCartas(){
    const elegidos=mezclar(MEMORIA_GIRO_SIMBOLOS).slice(0,config.pares);
    cartas=mezclar(elegidos.flatMap((simbolo,par)=>[
      {id:par*2,simbolo,par,encontrada:false},{id:par*2+1,simbolo,par,encontrada:false}
    ]));
  }
  function sonar(f,d=.1,vol=.06){if(typeof bip==="function")bip(f,d,"sine",vol);}
  function sonarPar(){sonar(590,.1,.07);setTimeout(()=>{if(raiz)sonar(790,.16,.07);},100);}
  function avisar(texto){mensaje=texto;if(raiz)raiz.querySelector("#mgMensaje").textContent=texto;}
  function puedeGirar(){return girosRestantes>0&&cartas.filter(c=>!c.encontrada).length>=4;}
  function actualizarHud(){
    if(!raiz||!config)return;
    raiz.querySelector("#mgNivel").textContent=nivel;
    raiz.querySelector("#mgPares").textContent=pares+"/"+config.pares;
    raiz.querySelector("#mgPuntos").textContent=puntos;
    raiz.querySelector("#mgTiempo").textContent=Math.max(0,Math.ceil(tiempoMs/1000));
    raiz.querySelector("#mgTiempoBarra").style.width=Math.max(0,tiempoMs/(config.segundos*1000)*100)+"%";
    ponerHtml(raiz.querySelector("#mgFallas"),"Fallos: "+fallos+" · "+ico("giro")+girosRestantes+" giros con pista"+(racha>1?" · "+ico("racha")+racha+" pares seguidos":""));
    const giroTexto=raiz.querySelector("#mgGiroTexto");
    if(fase==="vista")ponerHtml(giroTexto,ico("ojo")+"Memorizá: las cartas se tapan en "+Math.max(1,Math.ceil(vistaMs/1000))+" s");
    else if(fase==="giro")ponerHtml(giroTexto,ico("giro")+"¡Giran solo las cartas pendientes!");
    else if(fase==="recuerdo")ponerHtml(giroTexto,ico("ojo")+"Nueva oportunidad: memorizá en "+Math.max(1,Math.ceil(recuerdoMs/1000))+" s");
    else if(fase==="juego"||fase==="fallo")ponerHtml(giroTexto,puedeGirar()?"Próximo giro en "+Math.max(0,Math.ceil(giroMs/1000))+" s":girosRestantes?"Queda un par: el tablero ya no gira":"Sin más giros: el tablero queda quieto");
    else ponerHtml(giroTexto,"Encontrá todos los pares");
    raiz.querySelector("#mgGiroBarra").style.width=(fase==="juego"||fase==="fallo"?puedeGirar()?Math.max(0,giroMs/(config.giro*1000)*100):0:100)+"%";
  }
  function pintarCartas(){
    if(!raiz)return;
    [...raiz.querySelectorAll("#mgTablero .mg-carta")].forEach((boton,i)=>{
      const carta=cartas[i],abierta=fase==="vista"||fase==="recuerdo"||carta.encontrada||i===primera||i===segunda;
      boton.classList.toggle("abierta",abierta);
      boton.classList.toggle("encontrada",carta.encontrada);
      boton.classList.toggle("girando",fase==="giro"&&!carta.encontrada);
      boton.disabled=fase!=="juego"||carta.encontrada||i===primera;
      boton.setAttribute("aria-label",carta.encontrada?"Pareja encontrada: "+carta.simbolo:abierta?"Carta "+(i+1)+": "+carta.simbolo:"Carta "+(i+1)+" tapada");
    });
    actualizarHud();
  }
  function dibujarTablero(){
    const tablero=raiz.querySelector("#mgTablero");tablero.replaceChildren();
    tablero.style.setProperty("--mg-columnas",config.columnas);
    cartas.forEach((carta,i)=>{
      const boton=document.createElement("button");boton.type="button";boton.className="mg-carta";
      boton.dataset.id=String(carta.id);
      const interior=document.createElement("span");interior.className="mg-carta-interior";
      const dorso=document.createElement("span");dorso.className="mg-carta-dorso";dorso.setAttribute("aria-hidden","true");
      const cara=document.createElement("span");cara.className="mg-carta-cara";cara.textContent=carta.simbolo;cara.setAttribute("aria-hidden","true");
      interior.append(dorso,cara);boton.appendChild(interior);boton.onclick=()=>elegir(i);tablero.appendChild(boton);
    });
    pintarCartas();
  }
  function panel(titulo,detalle,botonTexto,accion,alternativas,dibujo){
    const capa=raiz.querySelector("#mgPanel");capa.replaceChildren();capa.hidden=false;
    const tarjeta=document.createElement("div");tarjeta.className="mg-panel";
    if(dibujo){const im=document.createElement("img");im.className="mgx-panel-dibujo";im.src=ARTE(dibujo);im.alt="";im.draggable=false;tarjeta.appendChild(im);}
    const h=document.createElement("h3");h.textContent=titulo;
    const p=document.createElement("p");p.textContent=detalle;
    const b=document.createElement("button");b.type="button";b.className="mg-principal";b.textContent=botonTexto;b.onclick=accion;
    tarjeta.append(h,p,b);
    (Array.isArray(alternativas)?alternativas:[alternativas]).forEach(alt=>{if(!alt)return;const otro=document.createElement("button");otro.type="button";otro.textContent=alt.texto;otro.onclick=alt.accion;tarjeta.appendChild(otro);});
    capa.appendChild(tarjeta);
  }
  function comenzar(){if(window.Fichas&&!Fichas.usar("memoria-en-giro",comenzar))return;duelo=false;config=configNivel(nivel);nuevasCartas();arrancarRonda();}
  function arrancarRonda(){
    pares=0;racha=0;fallos=0;girosRestantes=MEMORIA_GIRO_GIROS;
    primera=null;segunda=null;tiempoMs=config.segundos*1000;vistaMs=config.vista*1000;
    falloMs=0;giroMs=config.giro*1000;animacionMs=0;recuerdoMs=0;fase="vista";ultimoTic=performance.now();
    raiz.querySelector("#mgPanel").hidden=true;
    raiz.closest(".ext-shell")?.scrollTo(0,0);
    avisar("Mirá bien dónde está cada símbolo. El reloj empieza cuando se tapen.");
    dibujarTablero();
    if(duelo){
      Duelo.mostrarBadge();Duelo.actualizarBadge("0/"+config.pares);
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge(p.pares+"/"+p.total));
    }
  }
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("Memoria en Giro","memoria",{onListo:(soyHost)=>{
      duelo=true;config=configNivel(nivel);
      if(soyHost){nuevasCartas();Duelo.enviarRonda({cartas,nivel});arrancarRonda();}
      else Duelo.onRondaRecibida(datos=>{nivel=datos.nivel;config=configNivel(nivel);cartas=datos.cartas;arrancarRonda();});
    }});
  }
  function terminar(gano){
    if(fase==="ganado"||fase==="perdido")return;
    const puntosPrevios=puntos;fase=gano?"ganado":"perdido";primera=null;segunda=null;
    if(gano){
      const bonus=Math.ceil(tiempoMs/1000)*4;puntos+=bonus;
      datos.mejor=Math.max(datos.mejor,puntos);datos.nivelMax=Math.max(datos.nivelMax,nivel+1);datos.ganadas++;guardar();
      if(typeof sonarSFX==="function")sonarSFX("festejo");else sonar(1000,.25);
      if(typeof vibrar==="function")vibrar([35,45,60]);
      pintarCartas();
      if(duelo){Duelo.enviarFinal({valor:puntos});Duelo.mostrarResultado({valor:puntos},{etiqueta:"puntos · encontró todos los pares",onVolver:()=>{duelo=false;abrir(raiz.parentElement);}});return;}
      nivel++;
      panel("¡Todos los pares!","+"+bonus+" puntos por el tiempo que sobró. Total: "+puntos+" · mejor marca: "+datos.mejor+". Las cartas que encontraste quedaron a salvo en los giros.","Siguiente nivel",comenzar,null,"pares");
    }else{
      puntos=0;racha=0;if(typeof vibrar==="function")vibrar(85);
      pintarCartas();
      if(duelo){Duelo.enviarFinal({valor:puntos});Duelo.mostrarResultado({valor:puntos},{etiqueta:"puntos · "+pares+" de "+config.pares+" pares",onVolver:()=>{duelo=false;abrir(raiz.parentElement);}});return;}
      panel("Se terminó el tiempo","Encontraste "+pares+" de "+config.pares+" pares. Se cortó la racha"+(puntosPrevios?" y perdiste "+puntosPrevios+" puntos de esta partida":"")+". Mejor marca: "+datos.mejor+".","Otra ronda del nivel "+nivel,comenzar,null,"tiempo");
    }
  }
  function elegir(i){
    if(fase!=="juego"||cartas[i].encontrada||i===primera)return;
    if(primera===null){primera=i;sonar(450,.06,.04);pintarCartas();return;}
    segunda=i;pintarCartas();
    if(cartas[primera].par===cartas[segunda].par){
      cartas[primera].encontrada=true;cartas[segunda].encontrada=true;
      pares++;racha++;const premio=60+racha*15;puntos+=premio;
      primera=null;segunda=null;sonarPar();
      avisar("¡Par encontrado! +"+premio+" puntos"+(racha>1?" · racha de "+racha:""));
      if(duelo)Duelo.enviarProgreso({pares,total:config.pares});
      if(pares===config.pares){terminar(true);return;}
      pintarCartas();
    }else{
      fase="fallo";fallos++;racha=0;falloMs=850;tiempoMs=Math.max(0,tiempoMs-3000);
      if(typeof vibrar==="function")vibrar(60);
      avisar("No son iguales. −3 segundos. "+(puedeGirar()?"Mirá bien antes del próximo giro.":"Probá otra pareja."));
      pintarCartas();
    }
  }
  function iniciarGiro(){
    if(!puedeGirar())return;
    fase="giro";girosRestantes--;primera=null;segunda=null;animacionMs=850;
    avisar("¡Giro! Solo se mueven las cartas pendientes. Después podrás verlas otra vez.");
    pintarCartas();sonar(500,.12,.05);
  }
  function terminarGiro(){
    const indices=cartas.map((c,i)=>c.encontrada?-1:i).filter(i=>i>=0);
    const anteriores=indices.map(i=>cartas[i]);let nuevas=mezclar(anteriores);
    if(nuevas.length>1&&nuevas.every((c,i)=>c.id===anteriores[i].id))nuevas.push(nuevas.shift());
    indices.forEach((i,j)=>{cartas[i]=nuevas[j];});
    giroMs=config.giro*1000;recuerdoMs=config.vistaGiro*1000;fase="recuerdo";
    avisar("Mirá de nuevo dónde quedaron las cartas pendientes. Te quedan "+girosRestantes+" giros con pista.");
    dibujarTablero();
  }
  function tic(){
    const ahora=performance.now(),paso=Math.max(0,ahora-ultimoTic);ultimoTic=ahora;
    if(!raiz||document.hidden)return;
    if(fase==="vista"){
      vistaMs-=paso;
      if(vistaMs<=0){vistaMs=0;fase="juego";avisar("Encontrá 2 cartas iguales. Las parejas encontradas quedan fijas.");pintarCartas();}
    }else if(fase==="juego"||fase==="fallo"){
      tiempoMs=Math.max(0,tiempoMs-paso);if(puedeGirar())giroMs-=paso;
      if(fase==="fallo"){
        falloMs-=paso;
        if(falloMs<=0){primera=null;segunda=null;fase="juego";pintarCartas();}
      }
      if(tiempoMs<=0){terminar(false);return;}
      if(fase==="juego"&&primera===null&&giroMs<=0&&puedeGirar())iniciarGiro();
    }else if(fase==="giro"){
      animacionMs-=paso;if(animacionMs<=0)terminarGiro();
    }else if(fase==="recuerdo"){
      recuerdoMs-=paso;
      if(recuerdoMs<=0){recuerdoMs=0;fase="juego";avisar("Elegí una pareja. Las cartas encontradas siguen en su lugar.");pintarCartas();}
    }
    actualizarHud();
  }
  function visibilidad(){if(document.hidden)detenerMusicaJuego();else iniciarMusicaJuego();ultimoTic=performance.now();}
  function abrir(contenedor){
    salir();datos=cargar();nivel=datos.nivelMax;puntos=0;
    raiz=document.createElement("div");raiz.className="mg-game";
    raiz.innerHTML='<button type="button" class="ext-volver" id="mgVolver">⟵ Extensiones</button><div class="mg-titulo mgx-titulo"><h2 class="mgx-logo-h"><img class="mgx-logo" src="'+ARTE("logo")+'" alt="Memoria en Giro" draggable="false"></h2><p>Recordá los símbolos y encontrá sus parejas.</p></div><div class="mg-hud"><div><small>Nivel</small><b id="mgNivel">1</b></div><div><small>Pares</small><b id="mgPares">0/3</b></div><div><small>Puntos</small><b id="mgPuntos">0</b></div><div><small>'+ico("reloj")+'Tiempo</small><b id="mgTiempo">45</b></div></div><div class="mg-bar"><i id="mgTiempoBarra"></i></div><p class="mg-fallas" id="mgFallas"></p><div class="mg-tablero" id="mgTablero" aria-label="Tablero de cartas"></div><p class="mg-mensaje" id="mgMensaje" role="status" aria-live="polite"></p><p class="mg-giro-texto" id="mgGiroTexto"></p><div class="mg-bar giro"><i id="mgGiroBarra"></i></div><div class="mg-panel-capa" id="mgPanel"></div>';
    contenedor.appendChild(raiz);raiz.querySelector("#mgVolver").onclick=()=>Extensiones.abrirLobby();ultimoTic=performance.now();intervalo=setInterval(tic,50);document.addEventListener("visibilitychange",visibilidad);iniciarMusicaJuego();
    panel("Memoria en Giro","Primero ves todas las cartas. Cuando se tapen, encontrá los pares antes de que termine el tiempo. Tenés 3 giros con pista: solo giran las cartas pendientes y luego podés verlas unos segundos más. Después el tablero queda quieto. Una pareja equivocada te quita 3 segundos. Estos corazones no gastan vidas del juego principal.","Jugar nivel "+nivel,comenzar,
      [nivel>1?{texto:"Empezar desde el nivel 1",accion:()=>{nivel=1;puntos=0;comenzar();}}:null,{texto:"Jugar con un amigo 👥",accion:iniciarDuelo}],"personaje");
  }
  function salir(){
    clearInterval(intervalo);intervalo=null;document.removeEventListener("visibilitychange",visibilidad);
    detenerMusicaJuego();
    if(typeof Duelo!=="undefined")Duelo.salir();
    duelo=false;raiz=null;cartas=[];config=null;fase="inicio";
  }
  return{abrir,salir,mejorPuntaje,configNivel};
})();
window.MemoriaEnGiro=MemoriaEnGiro;
