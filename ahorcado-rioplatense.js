/* Ahorcado Rioplatense: el clásico del muñeco, con una ruleta de categorías
   que gira antes de cada palabra. Partida de 5 palabras sin repetir, todas
   difíciles (sin niveles): la categoría donde frena la ruleta es la única
   pista. 6 errores = se pierde esa palabra y se dibuja el muñeco completo. */
const AHORCADO_CONFIG={palabras:5,vidas:6,ptsPalabra:150,ptsVida:20,giroMs:1800,pausaMs:900};
const AHORCADO_LETRAS="ABCDEFGHIJKLMNOPQRSTUVYZ";
const AhorcadoRioplatense=(()=>{
  const CLAVE="gya_ahorcado_rioplatense";
  const $=s=>raiz?.querySelector(s);
  let raiz=null,fase="inicio",datos=cargar(),duelo=false,palabrasDuelo=null;
  /* Duelo "por turnos": los dos juegan la MISMA palabra en el mismo tablero.
     Acertar suma puntos y sigue jugando el mismo; errar dibuja el muñeco
     (compartido) y pasa el turno. Cada letra viaja con la lista completa de
     letras jugadas, así los dos celulares quedan siempre iguales. */
  const TURNO_PTS_LETRA=10,TURNO_PTS_COMPLETAR=50;
  let turnos=false,yo="host",turnoDe="host",ptsRival=0,ordenLetras=[],colaRemota=[];
  /* Cada jugador tiene SU ahorcado chico: el que erra suma una parte en el
     suyo y pasa el turno. El que completa la palabra la gana; si a uno se le
     completa el muñeco, la palabra es para el otro. Gana quien se lleve más
     palabras de las 5 (nunca hay empate: cada palabra tiene dueño). */
  let erroresDuo={host:0,guest:0},ganadas={host:0,guest:0};
  const otro=q=>q==="host"?"guest":"host";
  function miniSVG(color){return'<svg viewBox="0 0 120 130" aria-hidden="true"><path d="M10 122H80M30 122V10H85V26" stroke="#F6EFE2" stroke-width="5" stroke-linecap="round" fill="none"/><g stroke="'+color+'" stroke-width="5" stroke-linecap="round" fill="none"><circle cx="85" cy="36" r="10"/><path d="M85 46V80"/><path d="M85 54L68 68"/><path d="M85 54L102 68"/><path d="M85 80L70 102"/><path d="M85 80L100 102"/></g></svg>';}
  function pintarMinis(){
    if(!turnos||!raiz)return;
    for(const [rol,id] of [[yo,"#ahMiniYo"],[otro(yo),"#ahMiniRival"]]){
      const box=$(id);if(!box)continue;
      [...box.querySelectorAll("g>*")].forEach((e,i)=>e.classList.toggle("on",i<erroresDuo[rol]));
      box.classList.toggle("activo",fase==="jugando"&&turnoDe===rol);
      box.classList.toggle("perdida",erroresDuo[rol]>=AHORCADO_CONFIG.vidas);
      box.querySelector("small").textContent=(rol===yo?"Vos":nombreRival())+" · 🏆"+ganadas[rol];
    }
  }
  let palabra=null,usadas=[],adivinadas=new Set(),errores=0,puntos=0,n=0,W=0,etiquetas=[],intervalo=null;
  let audioMusica=null;
  /* Dibujos en assets/ahorcado/ (hoja de ChatGPT recortada); los íconos de los temas son los de 100 Rioplatenses (assets/cien/). */
  const ARTE=n=>"assets/ahorcado/"+n+".webp",ico=n=>'<img class="ah-ico" src="'+ARTE(n)+'" alt="" draggable="false">';
  const icoTema=c=>'<img class="ah-ico-tema" src="assets/cien/c_'+c.id+'.webp" alt="" draggable="false">';
  function iniciarMusicaJuego(){
    try{
      if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
      if(!audioMusica){audioMusica=new Audio("assets/audio/ahorcado-rioplatense-musica.mp3");audioMusica.loop=true;audioMusica.volume=.28;}
      if(audioMusica.paused)audioMusica.play().catch(()=>{});
    }catch(e){}
  }
  function detenerMusicaJuego(){try{if(audioMusica&&!audioMusica.paused)audioMusica.pause();}catch(e){}}
  function visibilidad(){if(document.hidden)detenerMusicaJuego();else iniciarMusicaJuego();}
  function numero(v,base=0){return Number.isFinite(v)&&v>=0?v:base;}
  function cargar(){
    try{const d=JSON.parse(localStorage.getItem(CLAVE));if(d&&typeof d==="object")return{mejor:numero(d.mejor)};}catch(e){}
    return{mejor:0};
  }
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}}
  function mezclar(lista){const a=[...lista];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function panel(titulo,detalle,acciones,dibujo){
    const p=$("#ahPanel");p.innerHTML='<div class="sf-panel">'+(dibujo?'<img class="ah-panel-dibujo" src="'+ARTE(dibujo)+'" alt="" draggable="false">':"")+'<h3></h3><p></p><div class="sf-acciones"></div></div>';
    p.querySelector("h3").textContent=titulo;p.querySelector("p").textContent=detalle;
    const cont=p.querySelector(".sf-acciones");
    acciones.forEach(([texto,accion],i)=>{const b=document.createElement("button");b.type="button";b.textContent=texto;if(i===0)b.className="sf-principal";b.onclick=()=>accion(b);cont.appendChild(b);});
    p.hidden=false;
  }
  function posicionarRueda(){
    const wrap=$("#ahRuedaWrap");if(!wrap)return;
    const N=AHORCADO_CATEGORIAS.length,R=wrap.clientWidth*.31;
    etiquetas.forEach((d,i)=>{const a=i*360/N+180/N;d.style.transform=`translate(-50%,-50%) rotate(${a}deg) translateY(${-R}px) rotate(${-a}deg) rotate(${-W}deg)`});
    $("#ahRueda").style.transform=`rotate(${W}deg)`;
  }
  function construirRueda(){
    const N=AHORCADO_CATEGORIAS.length,rueda=$("#ahRueda");
    rueda.style.background="conic-gradient("+AHORCADO_CATEGORIAS.map((c,i)=>`${c.color} ${i*360/N}deg ${(i+1)*360/N}deg`).join(",")+")";
    rueda.replaceChildren();etiquetas=[];
    AHORCADO_CATEGORIAS.forEach(c=>{const d=document.createElement("div");d.className="ah-cat";d.innerHTML=icoTema(c)+c.nombre;rueda.appendChild(d);etiquetas.push(d);});
    posicionarRueda();
  }
  function girarA(indice,cb){
    const N=AHORCADO_CATEGORIAS.length,reducido=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const a=indice*360/N+180/N,falta=((-a-W)%360+360)%360;
    W+=reducido?falta:1080+falta;posicionarRueda();
    const partida=raiz;
    setTimeout(()=>{if(raiz===partida)cb();},reducido?30:AHORCADO_CONFIG.giroMs);
  }
  function elegirPalabra(excluir){
    const libres=Vistas.filtrar("ahorcado",AHORCADO_DATOS.filter(d=>!excluir.some(u=>u.palabra===d.palabra)),d=>d.palabra);
    const cats=[...new Set(libres.map(d=>d.categoria))];
    const catId=cats[Math.floor(Math.random()*cats.length)];
    const opciones=libres.filter(d=>d.categoria===catId);
    const elegida=opciones[Math.floor(Math.random()*opciones.length)];
    Vistas.marcar("ahorcado",elegida.palabra);return elegida;
  }
  function dibujarPalabra(revelar){
    $("#ahPalabra").innerHTML=palabra.palabra.split("").map(c=>{
      const vista=adivinadas.has(c);
      return `<div class="ah-letra${!vista&&revelar?" x":""}">${vista||revelar?c:""}</div>`;
    }).join("");
  }
  function hud(){$("#ahN").textContent=n+"/"+AHORCADO_CONFIG.palabras;$("#ahPt").textContent=puntos;$("#ahMejor").textContent=datos.mejor;}
  const nombreRival=()=>(typeof Duelo!=="undefined"&&Duelo.rivalActual()?.nombre)||"tu rival";
  function avisoTurno(){
    if(!turnos||fase!=="jugando")return;
    const mio=turnoDe===yo,f=$("#ahFeedback");
    f.textContent=mio?"🎯 ¡Tu turno! Elegí una letra":"⏳ Turno de "+nombreRival()+"…";f.style.color=mio?"#F5B301":"#CBB8DB";
    $("#ahTeclado").classList.toggle("ah-espera",!mio);
  }
  function construirTeclado(){
    $("#ahTeclado").innerHTML=AHORCADO_LETRAS.split("").map(c=>`<button type="button" data-l="${c}">${c}</button>`).join("");
  }
  function resetTeclado(){document.querySelectorAll("#ahTeclado button").forEach(b=>{b.className="";b.disabled=false;});}
  function siguientePalabra(){
    n++;errores=0;adivinadas=new Set();ordenLetras=[];fase="girando";$("#ahTeclado").classList.remove("ah-espera");
    if(turnos){turnoDe=n%2===1?"host":"guest";erroresDuo={host:0,guest:0};}$("#ahSiguiente").hidden=true;$("#ahFeedback").textContent="";
    document.querySelectorAll(".ah-figura g>*").forEach(e=>e.classList.remove("on"));$("#ahFigura").classList.remove("perdida");
    resetTeclado();$("#ahPalabra").innerHTML="";$("#ahPregunta").innerHTML="<small>Girando…</small>";hud();
    if(duelo){palabra=palabrasDuelo[n-1];}else{palabra=elegirPalabra(usadas);usadas.push(palabra);}
    const indice=AHORCADO_CATEGORIAS.findIndex(c=>c.id===palabra.categoria);
    girarA(indice,()=>{
      const cat=AHORCADO_CATEGORIAS[indice];
      $("#ahPregunta").innerHTML=`<small>Categoría</small>${icoTema(cat)} ${cat.nombre} · ${palabra.palabra.length} letras`;
      dibujarPalabra(false);fase="jugando";
      if(turnos){avisoTurno();pintarMinis();const cola=colaRemota;colaRemota=[];cola.forEach(letraRemota);}
    });
  }
  function sonido(acierto){
    if(typeof bip==="function"){
      if(acierto){bip(660,.2,"sine",.065);bip(990,.3,"triangle",.04);}
      else if(duelo)sonidoErrorExt();
    }
    if(typeof vibrar==="function")vibrar(acierto?25:[45,40,45]);
  }
  function marcarError(){
    $("#p"+errores)?.classList.add("on");errores++;
    if(errores>=AHORCADO_CONFIG.vidas)terminarPalabra(false);
  }
  function tocarLetra(L,remoto){
    if(fase!=="jugando"||adivinadas.has(L))return;
    if(turnos&&!remoto&&turnoDe!==yo){avisoTurno();return;}
    const quien=turnoDe;
    adivinadas.add(L);ordenLetras.push(L);
    if(turnos&&!remoto)Duelo.enviarProgreso({t:"letra",n,letras:ordenLetras.join("")});
    const b=$(`#ahTeclado [data-l="${L}"]`);if(b)b.disabled=true;
    if(turnos){
      const veces=palabra.palabra.split("").filter(c=>c===L).length;
      if(veces){
        const p=veces*TURNO_PTS_LETRA;if(quien===yo)puntos+=p;else ptsRival+=p;
        if(b)b.className="ok";sonido(true);dibujarPalabra(false);hud();
        if(palabra.palabra.split("").every(c=>adivinadas.has(c)))terminarPalabra(true,quien);
      }else{
        if(b)b.className="no";sonido(false);
        erroresDuo[quien]++;
        if(erroresDuo[quien]>=AHORCADO_CONFIG.vidas){pintarMinis();terminarPalabra(true,otro(quien),true);}
        else turnoDe=otro(quien);
      }
      pintarMinis();avisoTurno();return;
    }
    if(palabra.palabra.includes(L)){
      if(b)b.className="ok";sonido(true);dibujarPalabra(false);
      if(palabra.palabra.split("").every(c=>adivinadas.has(c)))terminarPalabra(true,quien);
    }else{if(b)b.className="no";sonido(false);marcarError();}
    avisoTurno();
  }
  // Letra jugada por el rival: se aplican, en orden, las que falten.
  function letraRemota(m){
    if(!turnos||!m||typeof m.letras!=="string")return;
    if(m.n!==n||fase==="girando"){if(m.n>=n)colaRemota.push(m);return;}
    for(const L of m.letras.split("")){if(fase!=="jugando")break;if(!adivinadas.has(L)&&AHORCADO_LETRAS.includes(L))tocarLetra(L,true);}
  }
  function terminarPalabra(gano,quien,porAhorcado){
    if(fase!=="jugando")return;
    fase="resultado";const f=$("#ahFeedback");$("#ahTeclado").classList.remove("ah-espera");
    if(turnos){
      ganadas[quien]++;
      if(quien===yo)puntos+=TURNO_PTS_COMPLETAR;else ptsRival+=TURNO_PTS_COMPLETAR;
      if(porAhorcado){
        dibujarPalabra(true);
        if(quien===yo){f.textContent="¡"+nombreRival()+" se ahorcó! La palabra es tuya 🎉";f.style.color="#37D6C0";}
        else{f.textContent="¡Te ahorcaste! La palabra es para "+nombreRival()+" ("+palabra.palabra+")";f.style.color="#FF9DA7";}
      }else if(quien===yo){f.textContent="¡La completaste vos! Palabra para vos 🧉";f.style.color="#37D6C0";}
      else{f.textContent="La completó "+nombreRival()+": palabra para "+nombreRival();f.style.color="#FF9DA7";}
      hud();pintarMinis();Duelo.actualizarBadge("🏆 "+ganadas[otro(yo)]);
      setTimeout(()=>{if(!raiz||!duelo)return;if(n<AHORCADO_CONFIG.palabras)siguientePalabra();else terminar();},AHORCADO_CONFIG.pausaMs+1300);
      return;
    }
    if(gano){
      const p=AHORCADO_CONFIG.ptsPalabra+AHORCADO_CONFIG.ptsVida*(AHORCADO_CONFIG.vidas-errores);
      puntos+=p;f.textContent="¡Bien! +"+p+" 🧉";f.style.color="#37D6C0";
    }else{
      $("#ahFigura").classList.add("perdida");dibujarPalabra(true);
      f.textContent="Era "+palabra.palabra;f.style.color="#FF9DA7";
    }
    hud();
    if(duelo)Duelo.enviarProgreso({puntos,n});
    if(n<AHORCADO_CONFIG.palabras)setTimeout(()=>{$("#ahSiguiente").hidden=false;},AHORCADO_CONFIG.pausaMs);
    else setTimeout(terminar,1200);
  }
  function iniciar(){if(window.Fichas&&!Fichas.usar("ahorcado-rioplatense",iniciar))return;duelo=false;turnos=false;palabrasDuelo=null;n=0;puntos=0;usadas=[];fase="girando";$("#ahPanel").hidden=true;siguientePalabra();}
  // modo: "turnos" (misma palabra, de a una letra cada uno) o "carrera"
  // (mismas palabras, cada uno en su tablero). Lo decide quien crea la sala.
  function iniciarDuelo(modo){
    if(typeof Duelo==="undefined")return;
    const etiqueta=modo==="turnos"?"Ahorcado Rioplatense (por turnos)":"Ahorcado Rioplatense (carrera)";
    Duelo.mostrarLobby(etiqueta,"ahorcado",{detalle:EXPLICA[modo==="turnos"?"turnos":"carrera"],onListo:(soyHost)=>{
      duelo=true;yo=soyHost?"host":"guest";ptsRival=0;colaRemota=[];Duelo.mostrarBadge();Duelo.actualizarBadge("0");
      Duelo.onProgresoRival(p=>{if(turnos)letraRemota(p);else Duelo.actualizarBadge(String(p.puntos));});
      const arrancar=(lista,m)=>{
        turnos=m==="turnos";erroresDuo={host:0,guest:0};ganadas={host:0,guest:0};
        $("#ahDuo").hidden=!turnos;$("#ahFigura").style.display=turnos?"none":"";if(turnos)Duelo.actualizarBadge("🏆 0");
        palabrasDuelo=lista;n=0;puntos=0;ptsRival=0;usadas=[];fase="girando";$("#ahPanel").hidden=true;siguientePalabra();};
      if(soyHost){
        const lista=[];for(let i=0;i<AHORCADO_CONFIG.palabras;i++)lista.push(elegirPalabra(lista));
        const m=modo==="turnos"?"turnos":"carrera";Duelo.enviarRonda({palabras:lista,modo:m});arrancar(lista,m);
      }else Duelo.onRondaRecibida(d=>arrancar(d.palabras,d.modo));
    }});
  }
  const EXPLICA={
    turnos:"🔄 <b>POR TURNOS</b>: los dos juegan la <b>misma palabra</b>, de a una letra. <b>Cada uno tiene su ahorcado</b>: si errás, se dibuja una parte en el tuyo y juega el otro. El que completa la palabra se la lleva; si a uno se le completa el muñeco, la palabra es para el otro. Gana el que se lleve <b>más palabras</b> de las 5.",
    carrera:"🏁 <b>CARRERA</b>: los dos reciben las <b>mismas 5 palabras</b>, pero cada uno juega en <b>su propio tablero</b> sin ver las letras del otro. Gana el que suma más puntos."
  };
  const OPCIONES_AMIGO=[["👥 Con un amigo · Por turnos",()=>iniciarDuelo("turnos")],["👥 Con un amigo · Carrera",()=>iniciarDuelo("carrera")]];
  function terminar(){
    if(duelo){
      datos.mejor=Math.max(datos.mejor,puntos);guardar();hud();
      const valor=turnos?ganadas[yo]:puntos;
      Duelo.enviarFinal({valor});
      Duelo.mostrarResultado({valor},{etiqueta:turnos?"palabras ganadas (de "+AHORCADO_CONFIG.palabras+")":"puntos de la partida",onVolver:()=>{duelo=false;turnos=false;abrir(raiz.parentElement);}});
      return;
    }
    const record=puntos>0&&puntos>datos.mejor;
    fase="fin";datos.mejor=Math.max(datos.mejor,puntos);guardar();hud();
    panel("¡Se terminó!","Puntos: "+puntos+". Mejor: "+datos.mejor+".",[["Jugar de nuevo",iniciar],...OPCIONES_AMIGO],record?"record":puntos>0?"gano":"perdio");
  }
  function quitarTildes(s){return s.normalize("NFD").split("").filter(ch=>{const n=ch.charCodeAt(0);return n<0x300||n>0x36f;}).join("");}
  function tecla(key,evento){
    if(!raiz||document.hidden||fase!=="jugando")return;
    if(evento&&(evento.ctrlKey||evento.metaKey||evento.altKey))return;
    const c=quitarTildes(key).toUpperCase();
    if(c.length===1&&AHORCADO_LETRAS.includes(c))tocarLetra(c);
  }
  /* Todos los dibujos del juego se bajan y decodifican al abrir, y quedan guardados en memoria:
     antes la casilla con letra (casilla_ok) recién se pedía con el primer acierto y, después
     de mucho rato quieto, se veía vacía/oscura un momento hasta cargar. */
  const PRECARGA=["casilla","casilla_ok","horca","personaje","pista","vida","vida_perdida","gano","perdio","record","ruleta","logo"];let precargadas=[];
  function precargar(){if(precargadas.length)return;precargadas=PRECARGA.map(n=>{const i=new Image();i.decoding="async";i.src=ARTE(n);try{i.decode().catch(()=>{});}catch(e){}return i;});}
  function abrir(contenedor){
    salir();fase="inicio";precargar();
    raiz=document.createElement("div");raiz.className="ah-game";
    raiz.innerHTML='<button type="button" class="ext-volver" id="ahVolver">⟵ Extensiones</button>'
      +'<div class="ah-titulo ah-titulo-arte"><h2 class="ah-logo-h"><img class="ah-logo" src="'+ARTE("logo")+'" alt="Ahorcado Rioplatense" draggable="false"></h2><p>La ruleta elige la categoría, vos adiviná la palabra.</p></div>'
      +'<div class="sf-hud"><div><small>Palabra</small><b id="ahN">0/'+AHORCADO_CONFIG.palabras+'</b></div><div><small>Puntos</small><b id="ahPt">0</b></div><div><small>Mejor</small><b id="ahMejor">'+datos.mejor+'</b></div></div>'
      +'<div class="ah-top"><div class="ah-rueda-wrap" id="ahRuedaWrap"><div class="ah-rueda" id="ahRueda"></div><div class="ah-hub"></div></div>'
      +'<div class="ah-figura" id="ahFigura" role="img" aria-label="Muñeco del ahorcado"><img src="'+ARTE("horca")+'" alt="" draggable="false"><svg viewBox="0 0 315 309" aria-hidden="true"><path d="M245 50V76" stroke="#C99A5B" stroke-width="7" stroke-linecap="round"/><g stroke="#F5B301" stroke-width="9" stroke-linecap="round" fill="none"><circle id="p0" cx="245" cy="98" r="22"/><path id="p1" d="M245 120V185"/><path id="p2" d="M245 138L210 168"/><path id="p3" d="M245 138L280 168"/><path id="p4" d="M245 185L215 235"/><path id="p5" d="M245 185L275 235"/></g></svg></div>'
      +'<div class="ah-duo" id="ahDuo" hidden><div class="ah-mini" id="ahMiniYo"><small>Vos</small>'+miniSVG("#F5B301")+'</div><div class="ah-mini" id="ahMiniRival"><small>Rival</small>'+miniSVG("#E5197C")+'</div></div></div>'
      +'<div class="ah-pregunta" id="ahPregunta"></div>'
      +'<div class="ah-palabra" id="ahPalabra"></div>'
      +'<div class="ah-feedback" id="ahFeedback"></div>'
      +'<div class="ah-teclado" id="ahTeclado"></div>'
      +'<button type="button" class="ah-siguiente" id="ahSiguiente" hidden>Siguiente palabra ▶</button>'
      +'<div class="sf-panel-capa" id="ahPanel" hidden></div>';
    contenedor.appendChild(raiz);
    $("#ahVolver").onclick=()=>Extensiones.abrirLobby();
    construirRueda();construirTeclado();
    $("#ahTeclado").addEventListener("click",e=>{const l=e.target?.dataset?.l;if(l)tocarLetra(l);});
    $("#ahSiguiente").addEventListener("click",siguientePalabra);
    addEventListener("resize",posicionarRueda);
    document.addEventListener("visibilitychange",visibilidad);iniciarMusicaJuego();
    hud();
    panel("Ahorcado Rioplatense","La ruleta elige la categoría y vos adiviná la palabra antes de completar el muñeco. Mejor: "+datos.mejor+" puntos.",
      [["Jugar",iniciar],...OPCIONES_AMIGO],"personaje");
  }
  function salir(){
    removeEventListener("resize",posicionarRueda);
    document.removeEventListener("visibilitychange",visibilidad);detenerMusicaJuego();
    if(typeof Duelo!=="undefined")Duelo.salir();
    duelo=false;turnos=false;colaRemota=[];palabrasDuelo=null;raiz=null;fase="inicio";
  }
  return{abrir,salir,tecla,mejorPuntaje:()=>cargar().mejor};
})();
window.AhorcadoRioplatense=AhorcadoRioplatense;
