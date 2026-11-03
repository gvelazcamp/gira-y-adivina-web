const RUEDA_CONFIG={
  pistasIniciales:3,extrasPorPista:3,maxColumnas:10,segundosBase:5,segundosPorLetra:1,puntosPorLetra:10,puntosExtraPorLetra:5,bonoBase:100,puntosSegundo:3,giroMs:750,ticMs:100,
  niveles:{1:{letras:6,palabras:6,min:3,max:5,margen:1.6},2:{letras:6,palabras:8,min:3,max:6,margen:1.4},3:{letras:7,palabras:9,min:3,max:7,margen:1.25},4:{letras:7,palabras:10,min:3,max:7,margen:1.1}},
  avanzado:{letras:7,palabrasBase:10,palabrasMax:12,min:4,max:7,margenInicial:1,margenPaso:.05,margenPiso:.75}
};
const RuedaDeLetras=(()=>{
  const CLAVE="gya_rueda_de_letras",azar=n=>Math.floor(Math.random()*n);
  /* Dibujos en assets/rueda-letras/ (hoja de ChatGPT recortada). */
  const ARTE=n=>"assets/rueda-letras/"+n+".webp",ico=n=>'<img class="rl-ico" src="'+ARTE(n)+'" alt="" draggable="false">';
  let datos=cargar(),raiz=null,nivel=1,puntos=0,ronda=null,letras=[],hechas=new Set(),extrasEncontradas=new Set(),encontradasRonda=[],camino=[],arrastrando=false,jugando=false,girando=false,centros=[],usadasSesion=new Set(),duelo=false;
  let reveladas=new Set(),puntosRonda=0;
  let tiempoMs=0,duracionMs=0,ultimo=0,intervalo=null,giroTimer=null,errores=0,inicio=0,ocultoDesde=0,token=0;
  let audioMusica=null;
  function iniciarMusicaJuego(){
    try{
      if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
      if(!audioMusica){audioMusica=new Audio("assets/audio/rueda-de-letras-musica.mp3");audioMusica.loop=true;audioMusica.volume=.28;}
      if(audioMusica.paused)audioMusica.play().catch(()=>{});
    }catch(e){}
  }
  function detenerMusicaJuego(){try{if(audioMusica&&!audioMusica.paused)audioMusica.pause();}catch(e){}}
  function cargar(){try{const d=JSON.parse(localStorage.getItem(CLAVE)||"null");if(d)return{mejor:Number(d.mejor)||0,nivelMax:Number(d.nivelMax)||1,completadas:Number(d.completadas)||0,tiempos:Array.isArray(d.tiempos)?d.tiempos:[],coleccion:[...new Set((Array.isArray(d.coleccion)?d.coleccion:[]).filter(w=>typeof w==="string"&&/^[A-Z]{3,7}$/.test(w)))],pistas:Number.isFinite(Number(d.pistas))?Number(d.pistas):RUEDA_CONFIG.pistasIniciales,extrasPista:Number(d.extrasPista)||0};}catch(e){}return{mejor:0,nivelMax:1,completadas:0,tiempos:[],coleccion:[],pistas:RUEDA_CONFIG.pistasIniciales,extrasPista:0};}
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}}
  function mejorPuntaje(){return datos.mejor;}
  function configNivel(n){if(RUEDA_CONFIG.niveles[n])return RUEDA_CONFIG.niveles[n];const a=RUEDA_CONFIG.avanzado,p=n-5;return{letras:a.letras,palabras:Math.min(a.palabrasMax,a.palabrasBase+Math.floor(Math.max(0,p)/2)),min:a.min,max:a.max,margen:Math.max(a.margenPiso,a.margenInicial-p*a.margenPaso)};}
  function mezclar(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=azar(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
  function elegir(n){
    const c=configNivel(n),alcanza=d=>d.palabras.filter(w=>w!==d.base&&w.length>=c.min&&w.length<=c.max).length>=c.palabras-1;
    /* Solo ruedas con suficientes palabras comunes para el nivel. */
    let fuentes=RUEDA_DATOS.filter(d=>d.base.length===c.letras&&alcanza(d));if(!fuentes.length)fuentes=RUEDA_DATOS.filter(d=>d.base.length===c.letras);
    const noVistas=Vistas.filtrar("rueda",fuentes,d=>d.base);
    const sinRepetirSesion=noVistas.filter(d=>!usadasSesion.has(d.base));
    const origen=sinRepetirSesion.length?sinRepetirSesion:noVistas;
    const fuente=origen[azar(origen.length)];Vistas.marcar("rueda",fuente.base);
    const candidatas=fuente.palabras.filter(w=>w!==fuente.base&&w.length>=c.min&&w.length<=c.max);
    
    usadasSesion.add(fuente.base);
    /* Como Words of Wonders: las ocultas van en un crucigrama, así cada
       palabra encontrada destapa letras de las otras. */
    /* Niveles pares (2, 4, 6…): como en Colmena, una letra va en el medio
       de la rueda y todas las palabras la tienen que llevar. Se elige la
       letra que más palabras comunes tiene. */
    let centro=null,lista=candidatas;
    if(n%2===0){const cuenta={};for(const l of new Set(fuente.base))cuenta[l]=candidatas.filter(w=>w.includes(l)).length;
      centro=Object.keys(cuenta).sort((a,b)=>cuenta[b]-cuenta[a])[0];lista=candidatas.filter(w=>w.includes(centro));}
    const cruz=armarCruz(fuente.base,lista,c.palabras);
    return{base:fuente.base,ciudad:fuente.ciudad,tema:fuente.tema||"",centro,palabras:cruz.puestas.map(p=>p.w),todas:centro?fuente.palabras.filter(w=>w.includes(centro)):fuente.palabras,cruz};
  }
  function armarCruz(base,candidatas,max){
    const k=(r,c)=>r+","+c;let mejor=null;
    for(let intento=0;intento<60;intento++){
      const celdas=new Map(),puestas=[];let r0=0,r1=0,c0=0,c1=base.length-1;
      const poner=(w,r,c,h)=>{for(let i=0;i<w.length;i++){const rr=h?r:r+i,cc=h?c+i:c;celdas.set(k(rr,cc),w[i]);r0=Math.min(r0,rr);r1=Math.max(r1,rr);c0=Math.min(c0,cc);c1=Math.max(c1,cc);}puestas.push({w,r,c,h});};
      const cruces=(w,r,c,h)=>{
        if(celdas.has(h?k(r,c-1):k(r-1,c))||celdas.has(h?k(r,c+w.length):k(r+w.length,c)))return -1;
        let n=0;for(let i=0;i<w.length;i++){const rr=h?r:r+i,cc=h?c+i:c,x=celdas.get(k(rr,cc));
          if(x!==undefined){if(x!==w[i])return -1;n++;}
          else if(celdas.has(h?k(rr-1,cc):k(rr,cc-1))||celdas.has(h?k(rr+1,cc):k(rr,cc+1)))return -1;}
        return n;};
      poner(base,0,0,true);
      for(const w of mezclar(candidatas)){
        if(puestas.length>=max)break;
        let elegida=null;
        for(const p of puestas)for(let i=0;i<p.w.length;i++)for(let j=0;j<w.length;j++){
          if(p.w[i]!==w[j])continue;
          const h=!p.h,r=p.h?p.r-j:p.r+i,c=p.h?p.c+i:p.c-j;
          if(cruces(w,r,c,h)<1)continue;
          const nr0=Math.min(r0,r),nr1=Math.max(r1,h?r:r+w.length-1),nc0=Math.min(c0,c),nc1=Math.max(c1,h?c+w.length-1:c);
          if(nc1-nc0+1>RUEDA_CONFIG.maxColumnas||nr1-nr0+1>RUEDA_CONFIG.maxColumnas)continue;
          const area=(nr1-nr0+1)*(nc1-nc0+1)+Math.random();
          if(!elegida||area<elegida.area)elegida={r,c,h,area};
        }
        if(elegida)poner(w,elegida.r,elegida.c,elegida.h);
      }
      const puntaje=puestas.length*1000-(r1-r0+1)*(c1-c0+1);
      if(!mejor||puntaje>mejor.puntaje)mejor={puntaje,filas:r1-r0+1,cols:c1-c0+1,puestas:puestas.map(p=>({w:p.w,r:p.r-r0,c:p.c-c0,h:p.h}))};
      if(puestas.length>=max&&intento>15)break;
    }
    return{filas:mejor.filas,cols:mejor.cols,puestas:mejor.puestas};
  }
  function celdasDe(p){const out=[];for(let i=0;i<p.w.length;i++)out.push({k:(p.h?p.r:p.r+i)+","+(p.h?p.c+i:p.c),l:p.w[i]});return out;}
  function visible(clave){return reveladas.has(clave)||ronda.cruz.puestas.some(p=>hechas.has(p.w)&&celdasDe(p).some(x=>x.k===clave));}
  function grilla(nuevas){
    const g=raiz.querySelector("#rlGrilla");if(!g||!ronda)return;const {filas,cols,puestas}=ronda.cruz;
    const ancho=Math.min(raiz.querySelector(".rl-game").clientWidth||340,440)-12,tam=Math.max(20,Math.min(38,Math.floor(ancho/cols)-3));
    g.style.gridTemplateColumns=`repeat(${cols},${tam}px)`;g.style.gridTemplateRows=`repeat(${filas},${tam}px)`;g.style.fontSize=Math.round(tam*.56)+"px";
    g.replaceChildren();const vistas=new Set();
    for(const p of puestas)for(const x of celdasDe(p)){if(vistas.has(x.k))continue;vistas.add(x.k);const [r,c]=x.k.split(",").map(Number);
      const d=document.createElement("div"),ver=visible(x.k);d.className="rl-celda"+(ver?" ver":"")+(nuevas&&nuevas.has(x.k)?" nueva":"");d.style.gridRow=r+1;d.style.gridColumn=c+1;d.textContent=ver?x.l:"";g.appendChild(d);}
    const b=raiz.querySelector("#rlPista");if(b){b.innerHTML=ico("pista")+"Pista ("+datos.pistas+")";b.disabled=!jugando||datos.pistas<=0;}
    const f=raiz.querySelector("#rlFaltan");if(f)f.textContent=(ronda.palabras.length-hechas.size)+" por encontrar · "+(RUEDA_CONFIG.extrasPorPista-datos.extrasPista)+" extra más = 💡";
  }
  /* Una palabra destapada entera por pistas también cuenta como encontrada (sin puntos). */
  function revisarCompletas(){for(const p of ronda.cruz.puestas)if(!hechas.has(p.w)&&celdasDe(p).every(x=>visible(x.k))){hechas.add(p.w);if(duelo)Duelo.enviarProgreso({hechas:hechas.size,total:ronda.palabras.length});}}
  function usarPista(){
    if(!jugando||datos.pistas<=0)return;
    const ocultas=[];for(const p of ronda.cruz.puestas)if(!hechas.has(p.w))for(const x of celdasDe(p))if(!visible(x.k)&&!ocultas.includes(x.k))ocultas.push(x.k);
    if(!ocultas.length)return;
    const clave=ocultas[azar(ocultas.length)];reveladas.add(clave);datos.pistas--;guardar();
    revisarCompletas();grilla(new Set([clave]));mensaje("💡 Te mostré una letra");feedback();
    if(hechas.size===ronda.palabras.length)terminar(true);
  }
  function tiempoRonda(palabras,n){const c=configNivel(n),largo=palabras.reduce((s,w)=>s+w.length,0)/palabras.length;return Math.round(palabras.length*(RUEDA_CONFIG.segundosBase+RUEDA_CONFIG.segundosPorLetra*largo)*c.margen*1000);}
  function sonido(){try{if(typeof sonarGiroExt==="function")sonarGiroExt();}catch(e){}}
  function feedback(){try{if(typeof vibrar==="function")vibrar(20);}catch(e){}}
  function pantalla(){raiz.innerHTML=`<div class="rl-game"><button type="button" class="ext-volver" id="rlVolver">⟵ Extensiones</button><h2 class="rl-logo-h"><img class="rl-logo" src="${ARTE("logo")}" alt="Rueda de Letras" draggable="false"></h2><p class="rl-sub" id="rlTema">Completá el crucigrama. Cada palabra destapa letras de las otras.</p><div class="rl-hud"><div><small>Nivel</small><b id="rlNivel"></b></div><div><small>Puntos</small><b id="rlPuntos"></b></div><div><small>Mejor</small><b id="rlMejor"></b></div><div class="rl-reloj"><small>Tiempo</small><b id="rlTiempo"></b></div></div><div class="sf-bar rl-reloj"><i id="rlBarra"></i></div><div class="rl-rango" id="rlRango"></div><div class="rl-grilla" id="rlGrilla"></div><div class="rl-faltan" id="rlFaltan"></div><details class="rl-cajon" id="rlCajon"><summary><span class="rl-cajon-icono" aria-hidden="true">${ico("cajon")}</span><span class="rl-cajon-titulo"><b>Mi cajón · <span id="rlColeccionCount">0</span> <span id="rlColeccionUnidad">palabras</span></b><small id="rlUltimaGuardada">Las palabras que encuentres caen acá</small></span><span class="rl-cajon-ver">Ver</span></summary><div class="rl-cajon-cuerpo"><p>De esta rueda: <span id="rlRondaCount">0</span> · <span id="rlExtrasCount">0</span> extra</p><div class="rl-cajon-lista" id="rlRondaLista">Todavía no encontraste ninguna.</div><p>Guardadas para próximas partidas</p><div class="rl-cajon-lista" id="rlColeccionLista">Tu cajón está vacío.</div></div></details><div class="rl-actual" id="rlActual" aria-live="polite">Deslizá por la rueda</div><div class="rl-rueda" id="rlRueda"><svg class="rl-lineas" id="rlLineas" aria-hidden="true"></svg></div><div class="rl-acciones"><button id="rlGirar" type="button">${ico("girar")}Girar</button><button id="rlPista" type="button">💡 Pista</button></div><div class="sf-panel-capa" id="rlPanel"></div></div>`;raiz.querySelector("#rlGirar").onclick=girar;raiz.querySelector("#rlPista").onclick=usarPista;raiz.querySelector("#rlVolver").onclick=()=>Extensiones.abrirLobby();}
  function panel(titulo,mensaje,accion,funcion,extra,dibujo){const p=raiz.querySelector("#rlPanel");p.innerHTML='<div class="sf-panel">'+(dibujo?'<img class="rl-panel-dibujo" src="'+ARTE(dibujo)+'" alt="" draggable="false">':"")+'<h3></h3><p></p><div class="sf-acciones"><button class="sf-principal" type="button"></button></div></div>';p.querySelector("h3").textContent=titulo;p.querySelector("p").textContent=mensaje;p.querySelector("button").textContent=accion;p.querySelector("button").onclick=funcion;if(extra){const b=document.createElement("button");b.type="button";b.textContent=extra[0];b.onclick=extra[1];p.querySelector(".sf-acciones").appendChild(b);}p.hidden=false;}
  function hud(){if(!raiz)return;raiz.querySelector("#rlNivel").textContent=nivel;raiz.querySelector("#rlPuntos").textContent=puntos;raiz.querySelector("#rlMejor").textContent=Math.max(datos.mejor,puntos);raiz.querySelector("#rlTiempo").textContent=Math.ceil(Math.max(0,tiempoMs)/1000);raiz.querySelector("#rlBarra").style.width=Math.max(0,tiempoMs/duracionMs*100)+"%";pintarRango();}
  /* Rangos por puntos dentro de cada rueda (como los niveles de Colmena). */
  const RANGOS=["Arrancando","Va bien","Picante","Crack","Maestro"];
  function pintarRango(){const el=raiz&&raiz.querySelector("#rlRango");if(!el||!ronda)return;
    const max=ronda.palabras.reduce((s,w)=>s+w.length*RUEDA_CONFIG.puntosPorLetra,0)+(ronda.palabras.includes(ronda.base)?RUEDA_CONFIG.bonoBase:0);
    const f=max?puntosRonda/max:0,completa=hechas.size===ronda.palabras.length,k=completa?4:Math.min(3,Math.floor(f*4));
    el.innerHTML='<b>'+ico("r"+(k+1))+RANGOS[k]+'</b><span>'+RANGOS.map((r,i)=>'<i class="'+(i<=k?"ok":"")+'"></i>').join("")+'</span><small>'+puntosRonda+' pts</small>';}
  function pistas(){grilla();return;const p=raiz.querySelector("#rlPistas");p.replaceChildren();ronda.palabras.forEach(w=>{const d=document.createElement("div");d.className="rl-pista"+(hechas.has(w)?" hecho":"");d.textContent=hechas.has(w)?w:"• ".repeat(w.length).trim();d.setAttribute("aria-label",hechas.has(w)?w:`Palabra de ${w.length} letras`);p.appendChild(d);});}
  function mostrarCajon(ultima=""){
    raiz.querySelector("#rlColeccionCount").textContent=datos.coleccion.length;
    raiz.querySelector("#rlColeccionUnidad").textContent=datos.coleccion.length===1?"palabra":"palabras";
    raiz.querySelector("#rlRondaCount").textContent=encontradasRonda.length;
    raiz.querySelector("#rlExtrasCount").textContent=extrasEncontradas.size;
    const dibujar=(id,palabras,vacio)=>{const lista=raiz.querySelector(id);lista.replaceChildren();if(!palabras.length){lista.textContent=vacio;return;}for(const w of palabras){const chip=document.createElement("span");chip.className="rl-palabra"+(extrasEncontradas.has(w)?" extra":"")+(w===ultima?" caer":"");chip.textContent=w;lista.appendChild(chip);}};
    dibujar("#rlRondaLista",encontradasRonda,"Todavía no encontraste ninguna.");
    dibujar("#rlColeccionLista",[...datos.coleccion].reverse(),"Tu cajón está vacío.");
    const etiqueta=raiz.querySelector("#rlUltimaGuardada");
    etiqueta.textContent=ultima?ultima+" cayó al cajón":"Las palabras que encuentres caen acá";
    etiqueta.classList.remove("caer");if(ultima){void etiqueta.offsetWidth;etiqueta.classList.add("caer");}
  }
  function guardarEnCajon(w){encontradasRonda.push(w);if(!datos.coleccion.includes(w)){datos.coleccion.push(w);guardar();}mostrarCajon(w);}
  function mensaje(texto){raiz.querySelector("#rlActual").textContent=texto;}
  function actualizarCentros(){const r=raiz.querySelector("#rlRueda"),box=r.getBoundingClientRect();centros=[...r.querySelectorAll(".rl-letra")].map(el=>{const b=el.getBoundingClientRect();return{x:b.left+b.width/2-box.left,y:b.top+b.height/2-box.top,r:b.width/2};});}
  function letraMasCercana(e){const r=raiz.querySelector("#rlRueda"),box=r.getBoundingClientRect(),px=e.clientX-box.left,py=e.clientY-box.top;let mejor=-1,mejorDist=Infinity;for(let i=0;i<centros.length;i++){const dx=px-centros[i].x,dy=py-centros[i].y,d=dx*dx+dy*dy;if(d<mejorDist){mejorDist=d;mejor=i;}}/* Solo cuenta si el dedo está ENCIMA de la letra (no "la más cercana"):
     así se puede cruzar el centro de la rueda, de R a O, sin agarrar las del medio. */const radioMax=mejor>=0?(centros[mejor].r||box.width*.1)*.95:0;return mejor>=0&&Math.sqrt(mejorDist)<=radioMax?mejor:-1;}
  function rueda(){const r=raiz.querySelector("#rlRueda");r.querySelectorAll(".rl-letra").forEach(x=>x.remove());const conCentro=!!(ronda&&ronda.centro),nAfuera=conCentro?letras.length-1:letras.length;letras.forEach((l,i)=>{const b=document.createElement("button");b.type="button";b.className="rl-letra"+(conCentro&&i===letras.length-1?" rl-centro":"");b.dataset.i=i;b.textContent=l;if(conCentro&&i===letras.length-1){b.style.left="50%";b.style.top="50%";}else{const ang=(i/nAfuera)*Math.PI*2-Math.PI/2;b.style.left=(50+38*Math.cos(ang))+"%";b.style.top=(50+38*Math.sin(ang))+"%";}b.onpointerdown=e=>{if(!jugando||girando)return;e.preventDefault();actualizarCentros();arrastrando=true;camino=[i];b.setPointerCapture(e.pointerId);pintar();};r.appendChild(b);});actualizarCentros();r.onpointermove=e=>{if(!arrastrando)return;const i=letraMasCercana(e);if(i<0)return;if(i===camino.at(-2))camino.pop();else if(!camino.includes(i))camino.push(i);pintar();};r.onpointerup=e=>{if(!arrastrando)return;arrastrando=false;entregar();};r.onpointercancel=()=>{arrastrando=false;camino=[];pintar();};}
  function pintar(){if(!raiz)return;raiz.querySelector("#rlActual").textContent=camino.length?camino.map(i=>letras[i]).join(""):"Deslizá por la rueda";raiz.querySelectorAll(".rl-letra").forEach((b,i)=>b.classList.toggle("sel",camino.includes(i)));const r=raiz.querySelector("#rlRueda"),svg=raiz.querySelector("#rlLineas"),box=r.getBoundingClientRect();svg.setAttribute("viewBox",`0 0 ${box.width} ${box.height}`);const points=camino.map(i=>centros[i]?`${centros[i].x},${centros[i].y}`:"").join(" ");svg.innerHTML=points?`<polyline points="${points}" fill="none" stroke="#37D6C0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`:"";}
  function entregar(){
    const w=camino.map(i=>letras[i]).join("");camino=[];pintar();
    if(!jugando||w.length<3)return;
    if(ronda.centro&&!w.includes(ronda.centro)){mensaje("Tiene que llevar la "+ronda.centro+" del medio");const r=raiz.querySelector("#rlRueda");r.classList.remove("error");void r.offsetWidth;r.classList.add("error");return;}
    if(hechas.has(w)||extrasEncontradas.has(w)){mensaje(w+" ya encontrada");return;}
    if(ronda.palabras.includes(w)){
      hechas.add(w);
      const ganados=w.length*RUEDA_CONFIG.puntosPorLetra+(w===ronda.base?RUEDA_CONFIG.bonoBase:0);
      puntos+=ganados;puntosRonda+=ganados;guardarEnCajon(w);revisarCompletas();grilla(new Set(celdasDe(ronda.cruz.puestas.find(p=>p.w===w)).map(x=>x.k)));hud();feedback();mensaje(w+" · +"+ganados+" puntos");
      if(typeof objSumar==="function")objSumar("ruedaPalabras",1);
      if(typeof logroDesbloquear==="function"){logroDesbloquear("ruedaPrimera");if(w===ronda.base&&performance.now()-inicio<10000)logroDesbloquear("ruedaBaseRapida");}
      if(duelo)Duelo.enviarProgreso({hechas:hechas.size,total:ronda.palabras.length});
      if(hechas.size===ronda.palabras.length)terminar(true);
    }else if(RUEDA_DICCIONARIO.has(w)||(ronda.todas||[]).includes(w)){
      extrasEncontradas.add(w);
      const ganados=w.length*RUEDA_CONFIG.puntosExtraPorLetra;
      puntos+=ganados;puntosRonda+=ganados;guardarEnCajon(w);
      /* Como en Words of Wonders: las palabras extra llenan el cajón y cada 3 dan una pista. */
      datos.extrasPista++;let premio="";if(datos.extrasPista>=RUEDA_CONFIG.extrasPorPista){datos.extrasPista=0;datos.pistas++;premio=" · ¡+1 💡!";}guardar();
      grilla();hud();feedback();mensaje(w+" extra · +"+ganados+" puntos"+premio);
    }else{
      errores++;mensaje("Esa palabra no está en el diccionario");
      const r=raiz.querySelector("#rlRueda");r.classList.remove("error");void r.offsetWidth;r.classList.add("error");
    }
  }
  function girar(){if(!jugando||arrastrando||girando)return;girando=true;const r=raiz.querySelector("#rlRueda");r.classList.add("spin");sonido();const t=++token;giroTimer=setTimeout(()=>{if(t!==token)return;letras=ronda&&ronda.centro?[...mezclar(letras.slice(0,-1)),letras.at(-1)]:mezclar(letras);rueda();r.classList.remove("spin");girando=false;giroTimer=null;},RUEDA_CONFIG.giroMs);}
  function tic(){if(!jugando||document.hidden)return;const ahora=performance.now();tiempoMs=Math.max(0,tiempoMs-(ahora-ultimo));ultimo=ahora;hud();if(!tiempoMs)terminar(false);}
  function visibilidad(){if(document.hidden){detenerMusicaJuego();ocultoDesde=performance.now();}else{iniciarMusicaJuego();if(jugando){ultimo=performance.now();ocultoDesde=0;}}}
  function comenzar(){if(window.Fichas&&!Fichas.usar("rueda-de-letras",comenzar))return;duelo=false;token++;ronda=elegir(nivel);arrancarRonda();}
  function arrancarRonda(){
    clearInterval(intervalo);clearTimeout(giroTimer);
    if(ronda.centro){const resto=[...ronda.base];resto.splice(resto.indexOf(ronda.centro),1);letras=[...mezclar(resto),ronda.centro];}else letras=mezclar([...ronda.base]);
    puntosRonda=0;{const t=raiz.querySelector("#rlTema");if(t)t.textContent=(ronda.tema?"Tema: "+ronda.tema:"Completá el crucigrama")+(ronda.centro?" · Todas llevan la "+ronda.centro+" del medio":"");}
    hechas=new Set();reveladas=new Set();extrasEncontradas=new Set();encontradasRonda=[];camino=[];arrastrando=false;girando=false;errores=0;duracionMs=tiempoRonda(ronda.palabras,nivel);tiempoMs=duracionMs;jugando=true;inicio=ultimo=performance.now();raiz.querySelector("#rlPanel").hidden=true;raiz.querySelector("#rlRueda").classList.remove("spin","error");raiz.querySelector("#rlCajon").open=false;mensaje("Deslizá por la rueda");pistas();mostrarCajon();rueda();hud();raiz.querySelectorAll(".rl-reloj").forEach(x=>x.hidden=!duelo);raiz.querySelector(".rl-hud").classList.toggle("sin-reloj",!duelo);if(duelo)intervalo=setInterval(tic,RUEDA_CONFIG.ticMs);if(typeof objSumar==="function")objSumar("ruedaRonda",1);
    if(duelo){
      Duelo.mostrarBadge();Duelo.actualizarBadge("0/"+ronda.palabras.length);
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge(p.hechas+"/"+p.total));
    }
  }
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("Rueda de Letras","rueda",{onListo:(soyHost)=>{
      duelo=true;token++;
      if(soyHost){ronda=elegir(nivel);Duelo.enviarRonda({ronda,nivel});arrancarRonda();}
      else Duelo.onRondaRecibida(datos=>{ronda=datos.ronda;nivel=datos.nivel;arrancarRonda();});
    }});
  }
  function terminar(gano){if(!jugando)return;jugando=false;clearInterval(intervalo);intervalo=null;if(gano){if(duelo)puntos+=Math.ceil(tiempoMs/1000)*RUEDA_CONFIG.puntosSegundo;datos.completadas++;datos.nivelMax=Math.max(datos.nivelMax,nivel+1);if(errores===0&&typeof logroDesbloquear==="function")logroDesbloquear("ruedaPerfecta");}datos.mejor=Math.max(datos.mejor,puntos);datos.tiempos.push({nivel,base:ronda.base,segundos:Math.round((duracionMs-tiempoMs)/1000),ganada:gano});datos.tiempos=datos.tiempos.slice(-60);guardar();hud();
    if(duelo){
      Duelo.enviarFinal({valor:puntos});
      Duelo.mostrarResultado({valor:puntos},{etiqueta:"puntos de la ronda",onVolver:()=>{duelo=false;abrir(raiz);}});
      return;
    }
    panel(gano?"¡Rueda completada!":"Se acabó el tiempo",`${hechas.size}/${ronda.palabras.length} ocultas · ${extrasEncontradas.size} extra · ${puntos} puntos${gano?"":" · Faltaban: "+ronda.palabras.filter(w=>!hechas.has(w)).join(", ")}`,gano?"Siguiente rueda":"Volver a intentar",()=>{if(gano)nivel++;else{nivel=1;puntos=0;}comenzar();},null,gano?"completada":"tiempo");}
  function abrir(contenedor){salir();datos=cargar();usadasSesion=new Set();raiz=contenedor;pantalla();panel("Rueda de Letras","Arrastrá entre letras para formar palabras y completar el crucigrama. Sin apuro: no hay reloj. ¿Trabado? Usá 💡 Pista. Las palabras extra caen en tu cajón y cada 3 te ganan una pista.","Empezar",()=>{nivel=1;puntos=0;comenzar();},["Jugar con un amigo 👥",iniciarDuelo],"personaje");document.addEventListener("visibilitychange",visibilidad);iniciarMusicaJuego();}
  function salir(){jugando=false;clearInterval(intervalo);clearTimeout(giroTimer);intervalo=null;giroTimer=null;token++;document.removeEventListener("visibilitychange",visibilidad);detenerMusicaJuego();if(typeof Duelo!=="undefined")Duelo.salir();duelo=false;raiz=null;}
  return{abrir,salir,mejorPuntaje,configNivel,tiempoRonda,elegir};
})();
window.RuedaDeLetras=RuedaDeLetras;
