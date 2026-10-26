/* Sopa Fugaz (26/10/2026, Gonzalo). Al entrar se elige el modo:
   - Sopa clásica: tablero liso 14×14 desde el nivel 1, 8 direcciones, cápsulas
     de color, tableros con forma cada 3 niveles, palabras en escalerita desde el
     nivel 4 y palabras con dibujo (algunas mezcladas, y cada 4 niveles uno entero).
   - Sopa giratoria: la de siempre, las letras se mudan cada pocos segundos.
   Cada palabra sale una sola vez en todo el juego (Vistas "sopa"), en los dos modos. */
const SOPA_CONFIG={
  n:14,primerNivel:1,palabrasInicial:12,palabrasMax:16,subirPalabrasCada:3,
  segundosBasePalabra:6,segundosPorLetra:1.3,margenInicial:1,margenPaso:.03,margenPiso:.75,
  puntosPalabra:100,puntosSegundo:5,pistasPorRonda:3,pistaMs:2600,formaCada:3,
  escaleraDesde:4,escaleraDobleDesde:10,escaleraMaxLargo:9,dibujosDesde:2,dibujosMezcla:3,nivelDibujosCada:4,
  giratoria:{palabrasInicial:8,palabrasMax:12,mudanzaInicial:10,mudanzaPaso:.5,mudanzaPiso:5,factorTiempo:1.15,graciaArrastreMs:2500,giroMs:1100},
  ticMs:100,registroPalabrasMax:100,intentosTablero:40,intentosColocacion:900,minLargo:4
};
/* Formas (14×14, "#" = casilla). Cada una prefiere un tema que le pegue. */
const SOPA_FORMAS=[
  {id:"corazon",nombre:"Corazón",tema:"Amor y amigos",mascara:["..............","..####..####..","######..######","##############","##############","##############","##############",".############.","..##########..","...########...","....######....",".....####.....","......##......",".............."]},
  {id:"mate",nombre:"Mate",tema:"Ritual del mate",mascara:["..........#...","..........##..",".........##...","........##....","...########...","..##########..","..##########..",".############.",".############.","..##########..","..##########..","...########...","....######....","...########..."]},
  {id:"sol",nombre:"Sol de Mayo",tema:"Playa y balneario",mascara:["......##......","..#...##...#..","...#..##..#...","....######....","...########...","..##########..","##############","##############","..##########..","...########...","....######....","...#..##..#...","..#...##...#..","......##......"]},
  {id:"uruguay",nombre:"Mapa de Uruguay",tema:"Ciudades del mapa",mascara:["..##..........","..####........",".#######......",".#########....","############..","#############.","#############.",".#############",".############.","..###########.","..##########..","...#######....","....#####.....","......##......"]},
  {id:"pelota",nombre:"Pelota",tema:"Fútbol de potrero",mascara:["....######....","..##########..",".############.",".############.","##############","##############","##############","##############","##############","##############",".############.",".############.","..##########..","....######...."]},
  {id:"estrella",nombre:"Estrella",tema:"Noche y espacio",mascara:["......##......",".....####.....",".....####.....","....######....","##############",".############.","..##########..","...########...","...########...","..##########..","..####..####..",".####....####.",".###......###.",".............."]}
];
const SopaFugaz=(()=>{
  const CLAVE="gya_sopa_fugaz",VISTAS="sopa";
  const DIRS=[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
  const COLORES=["#F5B301A6","#37D6C0A6","#E5197C8C","#7B3FE48C","#2ED18AA6","#FF8A3DA6","#3DA5FF99"];
  const DIBUJOS=typeof SOPA_DIBUJOS==="object"?SOPA_DIBUJOS:{};
  const azar=n=>Math.floor(Math.random()*n);
  /* Dibujos en assets/sopa/ (hoja de ChatGPT recortada). */
  const ARTE=n=>"assets/sopa/"+n+".webp";
  let datos=cargar(),raiz=null,gridEl=null,listaEl=null,capsEl=null,celdas=[],tablero=[],mascara=null,forma=null,objetivos=[],halladas=new Map(),ubicadas={};
  let escaleras=new Set(),conDibujo=new Set(),todoDibujos=false,modo="clasica";
  let nivel=1,puntaje=0,tiempoMs=0,duracionMs=0,ultimaMarca=0,pistas=0,pistaTimer=null,pausado=false;
  let mudanzaMs=0,proximaMudanza=0,mudando=false,trasladoTimer=null;
  let jugando=false,arrastre=null,camino=[],rastro=[],intervalo=null,token=0,ultimoTic=0,ocultoDesde=0,categoria="",duelo=false;
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
  function configNivel(nivelActual,modoJuego="clasica"){
    const c=SOPA_CONFIG,p=Math.max(0,nivelActual-1),margen=Math.max(c.margenPiso,c.margenInicial-p*c.margenPaso);
    if(modoJuego==="giratoria"){const g=c.giratoria;
      return{n:c.n,palabras:Math.min(g.palabrasMax,g.palabrasInicial+Math.floor(p/c.subirPalabrasCada)),margen:margen*g.factorTiempo,forma:null,escaleras:0,dibujos:null,
        mudanza:Math.max(g.mudanzaPiso,g.mudanzaInicial-p*g.mudanzaPaso)};}
    const forma=nivelActual%c.formaCada===0?SOPA_FORMAS[(nivelActual/c.formaCada-1)%SOPA_FORMAS.length]:null;
    return{n:c.n,palabras:Math.min(c.palabrasMax,c.palabrasInicial+Math.floor(p/c.subirPalabrasCada)),margen,forma,
      escaleras:nivelActual>=c.escaleraDobleDesde?2:nivelActual>=c.escaleraDesde?1:0,
      dibujos:!forma&&nivelActual%c.nivelDibujosCada===0?"todo":nivelActual>=c.dibujosDesde?"mezcla":null,mudanza:0};
  }
  function mezclar(lista){
    const a=[...lista];for(let i=a.length-1;i>0;i--){const j=azar(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;
  }
  const temas=()=>[SOPA_DATOS.inicial,...SOPA_DATOS.categorias];
  const mascaraCuadrada=n=>Array.from({length:n},()=>"#".repeat(n));
  const dentro=(m,r,c)=>r>=0&&c>=0&&r<m.length&&c<m.length&&m[r][c]==="#";
  /* Lo más largo que entra en línea recta en la máscara. */
  function largoMaximo(m){
    const n=m.length;let max=0;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(dentro(m,r,c))for(const [dr,dc] of DIRS){let k=0;while(dentro(m,r+dr*k,c+dc*k))k++;if(k>max)max=k;}
    return max;
  }
  function casillas(m){return m.reduce((s,f)=>s+[...f].filter(x=>x==="#").length,0);}
  /* Palabras nuevas: nunca repetidas en todo el juego hasta agotar el banco. */
  function elegirPalabras(c,m){
    const todas=[...new Set(temas().flatMap(t=>t.palabras))];
    const libres=new Set(Vistas.filtrar(VISTAS,todas,w=>w));
    const largo=Math.min(largoMaximo(m),c.n),cuantas=Math.min(c.palabras,Math.floor(casillas(m)/9));
    const sirve=w=>libres.has(w)&&w.length>=SOPA_CONFIG.minLargo&&w.length<=largo;
    const elegidas=[],sumar=lista=>{for(const w of mezclar(lista.filter(sirve))){if(elegidas.length>=cuantas)break;if(elegidas.some(x=>x.includes(w)||w.includes(x)))continue;elegidas.push(w);}};
    todoDibujos=false;
    /* Nivel con dibujos: todas las palabras se muestran como dibujo. */
    if(c.dibujos==="todo"){const pool=Object.keys(DIBUJOS).filter(sirve);
      if(pool.length>=cuantas){sumar(pool);if(elegidas.length>=cuantas){todoDibujos=true;categoria="Con dibujos 🖼️";return elegidas;}elegidas.length=0;}}
    let fuente=c.forma&&temas().find(t=>t.nombre===c.forma.tema&&t.palabras.filter(sirve).length>=cuantas);
    if(!fuente){const opciones=temas().filter(t=>t.palabras.filter(sirve).length>=cuantas);fuente=opciones.length?opciones[azar(opciones.length)]:null;}
    if(fuente)sumar(fuente.palabras);
    if(elegidas.length<cuantas)sumar(todas);
    categoria=fuente&&elegidas.every(w=>fuente.palabras.includes(w))?fuente.nombre:"Palabras variadas";
    return elegidas;
  }
  function libre(matriz,m,palabra,celdasW){
    const n=m.length;
    return celdasW.every(([r,c],i)=>dentro(m,r,c)&&(!matriz[r*n+c]||matriz[r*n+c]===palabra[i]));
  }
  function escribir(matriz,m,palabra,celdasW){const n=m.length;return celdasW.map(([r,c],i)=>{const k=r*n+c;matriz[k]=palabra[i];return k;});}
  function colocar(palabra,matriz,m){
    const n=m.length;
    for(let intento=0;intento<SOPA_CONFIG.intentosColocacion;intento++){
      const [dr,dc]=DIRS[azar(DIRS.length)],r0=azar(n),c0=azar(n);
      const cw=Array.from({length:palabra.length},(_,i)=>[r0+dr*i,c0+dc*i]);
      if(libre(matriz,m,palabra,cw))return escribir(matriz,m,palabra,cw);
    }
    return null;
  }
  /* Escalerita: un paso al costado, uno para arriba o abajo (o al revés). */
  function colocarEscalera(palabra,matriz,m){
    const n=m.length;
    for(let intento=0;intento<SOPA_CONFIG.intentosColocacion;intento++){
      const h=[0,azar(2)?1:-1],v=[azar(2)?1:-1,0],[a,b]=azar(2)?[h,v]:[v,h],r0=azar(n),c0=azar(n);
      const cw=Array.from({length:palabra.length},(_,i)=>{const x=Math.ceil(i/2),y=Math.floor(i/2);return[r0+a[0]*x+b[0]*y,c0+a[1]*x+b[1]*y];});
      if(libre(matriz,m,palabra,cw))return escribir(matriz,m,palabra,cw);
    }
    return null;
  }
  /* Arma el tablero. Si en la forma no entran casi todas, va el cuadrado. */
  function construir(c,lista=objetivos,cantEscaleras=c.escaleras){
    const n=c.n;let mejor=null;
    const candidatasEsc=lista.filter(w=>w.length>=5&&w.length<=SOPA_CONFIG.escaleraMaxLargo);
    for(let intento=0;intento<SOPA_CONFIG.intentosTablero;intento++){
      const matriz=Array(n*n).fill(""),pos={},esc=new Set();
      const enEscalera=new Set(mezclar(candidatasEsc).slice(0,cantEscaleras));
      for(const w of [...enEscalera])  {const ind=colocarEscalera(w,matriz,mascara);if(ind){pos[w]=ind;esc.add(w);}}
      for(const w of [...lista].filter(w=>!pos[w]).sort((a,b)=>b.length-a.length)){const ind=colocar(w,matriz,mascara);if(ind)pos[w]=ind;}
      const k=Object.keys(pos).length;
      if(!mejor||k>mejor.k)mejor={k,matriz,pos,esc};
      if(k===lista.length)break;
    }
    if(forma&&mejor.k<lista.length*.75){forma=null;mascara=mascaraCuadrada(n);return construir(c,lista,cantEscaleras);}
    const relleno=("AAAEEEIIOOUUBCDFGLMNPRSTVZ"+objetivos.join("")).split("");
    tablero=mejor.matriz.map((letra,k)=>dentro(mascara,Math.floor(k/n),k%n)?(letra||relleno[azar(relleno.length)]):"");
    ubicadas=mejor.pos;escaleras=mejor.esc;
  }
  function dibujarTablero(n){
    const caja=raiz.querySelector("#sfTablero");caja.classList.toggle("con-forma",!!forma);
    gridEl.style.setProperty("--sf-n",n);
    gridEl.replaceChildren();
    celdas=tablero.map((letra,k)=>{
      const r=Math.floor(k/n),c=k%n,celda=document.createElement("div");celda.dataset.k=k;
      if(!letra){celda.className="sf-celda fuera";}
      else{celda.className="sf-celda";celda.textContent=letra;
        if(forma){const borde=(a,b)=>!dentro(mascara,a,b),rad=[];
          if(borde(r-1,c)&&borde(r,c-1))rad.push("border-top-left-radius:30%");if(borde(r-1,c)&&borde(r,c+1))rad.push("border-top-right-radius:30%");
          if(borde(r+1,c)&&borde(r,c-1))rad.push("border-bottom-left-radius:30%");if(borde(r+1,c)&&borde(r,c+1))rad.push("border-bottom-right-radius:30%");
          celda.style.cssText=rad.join(";");}}
      gridEl.appendChild(celda);return celda;});
    capsEl=document.createElementNS("http://www.w3.org/2000/svg","svg");capsEl.setAttribute("class","sf-caps");capsEl.setAttribute("viewBox","0 0 "+n+" "+n);capsEl.setAttribute("preserveAspectRatio","none");
    gridEl.appendChild(capsEl);pintarCapsulas();
  }
  function trazo(ind,color,n){
    const l=document.createElementNS("http://www.w3.org/2000/svg","polyline");
    l.setAttribute("points",ind.map(k=>(k%n+.5)+","+(Math.floor(k/n)+.5)).join(" "));
    l.setAttribute("fill","none");l.setAttribute("stroke",color);l.setAttribute("stroke-width",".8");l.setAttribute("stroke-linecap","round");l.setAttribute("stroke-linejoin","round");return l;
  }
  /* ¿El rastro del dedo es una escalerita (pasos que alternan costado y arriba/abajo)? */
  function esEscalera(r){
    if(!escaleras.size||r.length<3)return false;const n=SOPA_CONFIG.n,p=r.slice(1).map((k,i)=>k-r[i]);
    if(p.some(d=>Math.abs(d)!==1&&Math.abs(d)!==n))return false;
    return p.every((d,i)=>i<2||d===p[i-2])&&p[0]!==p[1]&&Math.abs(p[0])!==Math.abs(p[1]);
  }
  function pintarCapsulas(){
    if(!capsEl)return;const n=SOPA_CONFIG.n;capsEl.replaceChildren();
    if(modo!=="giratoria")[...halladas.values()].forEach((h,i)=>capsEl.appendChild(trazo(h.ind,COLORES[i%COLORES.length],n)));
    const actual=esEscalera(rastro)?rastro:camino;
    if(actual.length)capsEl.appendChild(trazo(actual,"#E5197C99",n));
  }
  function dibujarLista(){
    listaEl.replaceChildren();listaEl.classList.toggle("con-dibujos",conDibujo.size>0);
    objetivos.forEach(palabra=>{
      const s=document.createElement("span"),hecha=halladas.has(palabra);s.className="sf-palabra"+(hecha?" hecho":"");
      if(conDibujo.has(palabra)){s.classList.add("dibujo");const i=document.createElement("i");i.textContent=DIBUJOS[palabra];const t=document.createElement("small");
        t.textContent=hecha?palabra:"▢".repeat(palabra.length);s.append(i,t);s.title=palabra.length+" letras";}
      else s.textContent=palabra;
      listaEl.appendChild(s);
    });
    raiz.querySelector("#sfCuenta").textContent=halladas.size+"/"+objetivos.length;
  }
  function dibujarHistorial(){
    if(!raiz)return;
    raiz.querySelector("#sfHistorialTitulo").innerHTML='<img class="sf-ico" src="'+ARTE("libro")+'" alt="">Mis palabras encontradas ('+datos.descubiertas.length+")";
    const lista=raiz.querySelector("#sfHistorialLista");lista.replaceChildren();
    if(!datos.descubiertas.length){lista.textContent="Todavía no encontraste ninguna.";return;}
    [...datos.descubiertas].reverse().forEach(w=>{const chip=document.createElement("span");chip.className="sf-historial-chip";chip.textContent=w;lista.appendChild(chip);});
  }
  const reloj=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");};
  function actualizarHUD(){
    if(!raiz)return;
    raiz.querySelector("#sfNivel").textContent=nivel;
    raiz.querySelector("#sfPuntos").textContent=puntaje;
    raiz.querySelector("#sfMejor").textContent=datos.mejor;
    raiz.querySelector("#sfTiempo").textContent=reloj(tiempoMs);
    raiz.querySelector("#sfTiempoBarra").style.width=Math.max(0,duracionMs?tiempoMs/duracionMs*100:0)+"%";
    const b=raiz.querySelector("#sfPista");b.lastChild.textContent=" Pista ("+pistas+")";b.disabled=!jugando||pistas<=0||pausado||mudando;
    raiz.querySelector("#sfPausa").disabled=!jugando;
  }
  function actualizarMudanza(ahora){
    if(!raiz||modo!=="giratoria")return;
    raiz.querySelector("#sfMudanzaBarra").style.width=mudando?"0%":Math.max(0,(proximaMudanza-ahora)/mudanzaMs*100)+"%";
    raiz.querySelector("#sfMudanzaTexto").textContent=mudando?"¡Las letras se están mudando!":
      proximaMudanza<=ahora&&arrastre!==null?"Mudanza en espera: terminá de marcar":"Las letras se mudan en "+Math.max(0,Math.ceil((proximaMudanza-ahora)/1000))+" s";
  }
  function mostrarPanel(titulo,detalle,boton,accion,compartir=false,extras,dibujo){
    const panel=raiz.querySelector("#sfPanel");
    panel.innerHTML="";panel.hidden=false;
    const tarjeta=document.createElement("div");tarjeta.className="sf-panel";
    if(dibujo){const im=document.createElement("img");im.className="sf-panel-dibujo";im.src=ARTE(dibujo);im.alt="";im.draggable=false;tarjeta.appendChild(im);}
    const h=document.createElement("h3");h.textContent=titulo;
    const p=document.createElement("p");p.textContent=detalle;
    const acciones=document.createElement("div");acciones.className="sf-acciones";
    const principal=document.createElement("button");principal.className="sf-principal";principal.type="button";principal.textContent=boton;principal.onclick=accion;acciones.appendChild(principal);
    if(compartir){const b=document.createElement("button");b.type="button";b.textContent="📤 Compartir";b.onclick=()=>compartirResultado(b);acciones.appendChild(b);}
    [].concat(extras||[]).forEach(extra=>{const b=document.createElement("button");b.type="button";b.textContent=extra.texto;b.onclick=extra.accion;
      if(extra.clase)b.classList.add(extra.clase);
      if(extra.dibujo){b.classList.add("sf-con-dibujo");const im=document.createElement("img");im.src=ARTE(extra.dibujo);im.alt="";b.prepend(im);}
      acciones.appendChild(b);});
    tarjeta.append(h,p,acciones);panel.appendChild(tarjeta);
  }
  function guardarMejor(){if(puntaje>datos.mejor){datos.mejor=puntaje;guardar();}}
  function registrarResultado(gano){
    const clave=(modo==="giratoria"?"g":"")+nivel,r=datos.niveles[clave]||{ganadas:0,perdidas:0,tiempoTotalMs:0};
    r[gano?"ganadas":"perdidas"]++;
    r.tiempoTotalMs+=Math.round(duracionMs-Math.max(0,tiempoMs));
    datos.niveles[clave]=r;datos.nivelMax=Math.max(datos.nivelMax,nivel);guardar();
  }
  function terminar(gano){
    if(!jugando)return;
    jugando=false;pausado=false;mudando=false;arrastre=null;camino=[];rastro=[];token++;clearTimeout(pistaTimer);clearTimeout(trasladoTimer);
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
    mostrarPanel(gano?"¡Sopa completa!":"Se acabó el tiempo",
      gano?"Llevás "+puntaje+" puntos. Te sobraron "+reloj(tiempoMs)+".":"Te faltaron: "+faltantes.join(", ")+". Hiciste "+puntaje+" puntos.",
      gano?"Siguiente nivel":"Jugar de nuevo",()=>{
        if(gano)nivel++;else{nivel=SOPA_CONFIG.primerNivel;puntaje=0;}
        iniciarRonda();
      },true,{texto:"Cambiar de modo",accion:elegirModo},gano?"gano":"tiempo");
  }
  function prepararRonda(){
    token++;clearTimeout(pistaTimer);clearTimeout(trasladoTimer);pausado=false;mudando=false;arrastre=null;camino=[];rastro=[];halladas=new Map();conDibujo=new Set();todoDibujos=false;
    const caja=raiz.querySelector("#sfTablero");caja.classList.remove("pausa","mudando");gridEl.classList.remove("spin");
    const c=configNivel(nivel,modo);forma=c.forma;mascara=forma?forma.mascara:mascaraCuadrada(c.n);return c;
  }
  function elegirDibujos(c){
    const con=objetivos.filter(w=>DIBUJOS[w]);
    conDibujo=new Set(todoDibujos?con:c.dibujos==="mezcla"?mezclar(con).slice(0,SOPA_CONFIG.dibujosMezcla):[]);
  }
  function armar(c){objetivos=elegirPalabras(c,mascara);construir(c);objetivos=objetivos.filter(w=>ubicadas[w]);elegirDibujos(c);Vistas.marcar(VISTAS,objetivos);}
  function iniciarRonda(){
    if(window.Fichas&&!Fichas.usar("sopa-fugaz",iniciarRonda))return;
    duelo=false;
    const c=prepararRonda();armar(c);arrancarRonda(c);
  }
  function arrancarRonda(c){
    duracionMs=Math.round(objetivos.reduce((sum,w)=>sum+SOPA_CONFIG.segundosBasePalabra+SOPA_CONFIG.segundosPorLetra*w.length,0)*c.margen*1000);
    tiempoMs=duracionMs;pistas=SOPA_CONFIG.pistasPorRonda;mudanzaMs=c.mudanza*1000;
    dibujarTablero(c.n);dibujarLista();
    raiz.classList.toggle("giratoria",modo==="giratoria");
    raiz.querySelector("#sfCategoria").textContent=categoria;
    raiz.querySelector("#sfForma").textContent=forma?"Tablero "+forma.nombre:todoDibujos?"Nivel con dibujos: adiviná y buscá":modo==="giratoria"?"Sopa giratoria 🌀":"Tema";
    raiz.querySelector("#sfPanel").hidden=true;
    ultimoTic=performance.now();ultimaMarca=ultimoTic;proximaMudanza=ultimoTic+mudanzaMs;
    jugando=true;actualizarHUD();actualizarMudanza(ultimoTic);
    objSumar("sopaRonda",1);
    if(escaleras.size&&!datos.vioEscalera){datos.vioEscalera=true;guardar();mostrarToast("🪜","Ojo: desde ahora hay palabras en escalerita. Marcalas siguiendo el camino con el dedo.","Escalerita");}
    if(duelo){
      Duelo.mostrarBadge();Duelo.actualizarBadge("0/"+objetivos.length);
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge(p.halladas+"/"+p.total));
    }
  }
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    modo="clasica";
    Duelo.mostrarLobby("Sopa Fugaz","sopa",{onListo:(soyHost)=>{
      duelo=true;modo="clasica";
      if(soyHost){
        const c=prepararRonda();armar(c);
        Duelo.enviarRonda({objetivos,categoria,nivel,tablero,ubicadas,forma:forma&&forma.id,escaleras:[...escaleras],dibujos:[...conDibujo],todoDibujos});arrancarRonda(c);
      }else Duelo.onRondaRecibida(d=>{
        nivel=d.nivel;const c=prepararRonda();objetivos=d.objetivos;categoria=d.categoria;
        /* El tablero viene armado del anfitrión: los dos juegan exactamente la misma sopa. */
        if(Array.isArray(d.tablero)&&d.ubicadas){forma=SOPA_FORMAS.find(f=>f.id===d.forma)||null;mascara=forma?forma.mascara:mascaraCuadrada(c.n);tablero=d.tablero;ubicadas=d.ubicadas;
          escaleras=new Set(d.escaleras||[]);conDibujo=new Set(d.dibujos||[]);todoDibujos=!!d.todoDibujos;}
        else construir(c);
        arrancarRonda(c);
      });
    }});
  }
  /* Destello de "palabra encontrada" en el medio de la palabra marcada. */
  function estallido(seleccion){
    const caja=raiz&&raiz.querySelector("#sfTablero");if(!caja||!seleccion.length)return;
    const cr=caja.getBoundingClientRect();let x=0,y=0;
    seleccion.forEach(k=>{const r=celdas[k].getBoundingClientRect();x+=r.left+r.width/2;y+=r.top+r.height/2;});
    const im=document.createElement("img");im.className="sf-estallido";im.src=ARTE("encontrada");im.alt="";
    im.style.left=(x/seleccion.length-cr.left)+"px";im.style.top=(y/seleccion.length-cr.top)+"px";
    caja.appendChild(im);setTimeout(()=>im.remove(),800);
  }
  function cancelarArrastre(){arrastre=null;camino=[];rastro=[];pintarCapsulas();}
  /* Sopa giratoria: las letras se mudan (se rearma el tablero con las que faltan). */
  function mudar(){
    if(!jugando||mudando)return;
    mudando=true;cancelarArrastre();actualizarHUD();
    if(typeof sonarGiroExt==="function")sonarGiroExt();gridEl.classList.add("spin");raiz.querySelector("#sfTablero").classList.add("mudando");
    celdas.forEach(c=>c.classList.add("gone"));
    const esteToken=token,c=configNivel(nivel,modo);
    trasladoTimer=setTimeout(()=>{
      if(esteToken!==token||!jugando)return;
      construir(c,objetivos.filter(w=>!halladas.has(w)),0);dibujarTablero(c.n);celdas.forEach(x=>x.classList.add("gone"));
      requestAnimationFrame(()=>celdas.forEach(x=>x.classList.remove("gone")));
      trasladoTimer=setTimeout(()=>{
        if(esteToken!==token||!jugando)return;
        gridEl.classList.remove("spin");raiz.querySelector("#sfTablero").classList.remove("mudando");mudando=false;
        proximaMudanza=performance.now()+mudanzaMs;actualizarHUD();
      },SOPA_CONFIG.giratoria.giroMs/2);
    },SOPA_CONFIG.giratoria.giroMs/2);
  }
  function tic(){
    const ahora=performance.now();
    if(!jugando||pausado){ultimoTic=ahora;return;}
    if(document.hidden){if(!ocultoDesde)ocultoDesde=ahora;ultimoTic=ahora;return;}
    tiempoMs-=Math.max(0,ahora-ultimoTic);ultimoTic=ahora;
    if(tiempoMs<=0){tiempoMs=0;terminar(false);return;}
    actualizarHUD();
    if(modo==="giratoria"){actualizarMudanza(ahora);
      if(!mudando&&ahora>=proximaMudanza){if(arrastre!==null&&ahora<proximaMudanza+SOPA_CONFIG.giratoria.graciaArrastreMs)return;mudar();}}
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
  /* La marca se "pega" a la dirección más cercana de las 8 (la mano nunca va
     justo en diagonal); antes había que caer exacto y la marca quedaba trabada. */
  function extender(k){
    const n=SOPA_CONFIG.n,inicio=arrastre.k;
    const r0=Math.floor(inicio/n),c0=inicio%n,dr=Math.floor(k/n)-r0,dc=k%n-c0;
    if(!dr&&!dc){camino=[inicio];return;}
    const oct=Math.round(Math.atan2(dr,dc)/(Math.PI/4)),sr=Math.round(Math.sin(oct*Math.PI/4)),sc=Math.round(Math.cos(oct*Math.PI/4));
    let pasos=sr&&sc?Math.round((Math.abs(dr)+Math.abs(dc))/2):Math.abs(sr?dr:dc);
    const fuera=p=>{const r=r0+sr*p,c=c0+sc*p;return r<0||r>=n||c<0||c>=n||!tablero[r*n+c];};
    while(pasos>0&&fuera(pasos))pasos--;
    camino=Array.from({length:pasos+1},(_,i)=>(r0+sr*i)*n+c0+sc*i);
  }
  /* Rastro: las casillas por las que pasa el dedo (para las escaleritas). */
  function sumarRastro(k){
    const n=SOPA_CONFIG.n,u=rastro[rastro.length-1];if(k===u)return;
    if(rastro.length>1&&k===rastro[rastro.length-2]){rastro.pop();return;}
    let r=Math.floor(u/n),c=u%n;const r1=Math.floor(k/n),c1=k%n;
    while(r!==r1||c!==c1){if(Math.abs(r1-r)>=Math.abs(c1-c))r+=Math.sign(r1-r);else c+=Math.sign(c1-c);rastro.push(r*n+c);}
  }
  function punteroAbajo(e){
    if(!jugando||pausado||mudando)return;
    const k=indiceDesdePuntero(e);if(k<0||!tablero[k])return;
    e.preventDefault();arrastre={id:e.pointerId,k};camino=[k];rastro=[k];pintarCapsulas();
    gridEl.setPointerCapture(e.pointerId);
  }
  function punteroMueve(e){
    if(!arrastre||arrastre.id!==e.pointerId||mudando)return;
    const k=indiceDesdePuntero(e);if(k>=0){extender(k);sumarRastro(k);pintarCapsulas();}
  }
  function aciertoEscalera(){
    if(rastro.length<2)return null;const a=rastro[0],b=rastro[rastro.length-1];
    for(const w of escaleras){if(halladas.has(w))continue;const P=ubicadas[w],s=new Set(P);
      if(((a===P[0]&&b===P[P.length-1])||(a===P[P.length-1]&&b===P[0]))&&rastro.every(k=>s.has(k)))return{w,sel:P};}
    return null;
  }
  function punteroArriba(e){
    if(!arrastre||arrastre.id!==e.pointerId)return;
    const ultimo=indiceDesdePuntero(e);if(ultimo>=0){extender(ultimo);sumarRastro(ultimo);}
    let seleccion=[...camino];const letras=seleccion.map(k=>tablero[k]).join("");
    const reverso=[...letras].reverse().join("");
    let acierto=objetivos.find(w=>!halladas.has(w)&&(w===letras||w===reverso));
    if(!acierto){const esc=aciertoEscalera();if(esc){acierto=esc.w;seleccion=esc.sel;}}
    cancelarArrastre();
    if(!jugando||pausado||mudando||!acierto)return;
    halladas.set(acierto,{ind:seleccion});puntaje+=SOPA_CONFIG.puntosPalabra+(escaleras.has(acierto)?50:0);
    datos.palabrasTotal++;
    const ahora=performance.now();
    datos.palabras.push({nivel,palabra:acierto,ms:Math.round(ahora-ultimaMarca),fecha:new Date().toISOString()});
    if(!datos.descubiertas.includes(acierto))datos.descubiertas.push(acierto);
    if(datos.palabras.length>SOPA_CONFIG.registroPalabrasMax)datos.palabras.splice(0,datos.palabras.length-SOPA_CONFIG.registroPalabrasMax);
    ultimaMarca=ahora;guardar();
    dibujarLista();dibujarHistorial();actualizarHUD();pintarCapsulas();
    estallido(seleccion);
    tac();vibrar(35);objSumar("sopaPalabras",1);
    logroDesbloquear("sopaPrimera");
    if(datos.palabrasTotal>=10)logroDesbloquear("sopaDiez");
    if(duelo)Duelo.enviarProgreso({halladas:halladas.size,total:objetivos.length});
    if(halladas.size===objetivos.length)terminar(true);
  }
  /* Pista: titila la primera letra de una palabra que falta. */
  function usarPista(){
    if(!jugando||pausado||mudando||pistas<=0)return;
    const faltan=objetivos.filter(w=>!halladas.has(w)&&ubicadas[w]);if(!faltan.length)return;
    const w=faltan[azar(faltan.length)],k=ubicadas[w][0];pistas--;actualizarHUD();
    celdas.forEach(c=>c.classList.remove("pista"));celdas[k].classList.add("pista");tac();
    clearTimeout(pistaTimer);pistaTimer=setTimeout(()=>{if(celdas[k])celdas[k].classList.remove("pista");},SOPA_CONFIG.pistaMs);
  }
  function pausar(){
    if(!jugando||pausado)return;
    pausado=true;cancelarArrastre();raiz.querySelector("#sfTablero").classList.add("pausa");actualizarHUD();const desde=performance.now();
    mostrarPanel("Pausa","El reloj está parado y el tablero tapado.","Seguir",()=>{pausado=false;const ahora=performance.now();proximaMudanza+=ahora-desde;ultimoTic=ahora;raiz.querySelector("#sfTablero").classList.remove("pausa");raiz.querySelector("#sfPanel").hidden=true;actualizarHUD();},false,null,"reloj");
  }
  function compartirResultado(boton){
    const texto="🔎 Sopa Fugaz"+(modo==="giratoria"?" giratoria":"")+" · nivel "+nivel+" · "+puntaje+" puntos. ¡Jugá en Girá y Adiviná! "+location.origin+location.pathname;
    csCompartirImagen(generarCanvasCompartirJuego,"sopa-fugaz.png",texto,texto,boton);
  }
  const AYUDA={
    clasica:"Encontrá todas las palabras antes de que se acabe el reloj. Arrastrá el dedo: pueden estar horizontales, verticales, en diagonal, al revés y, desde el nivel 4, en escalerita (seguí el camino). Algunas se muestran con un dibujo: adiviná cuál es y buscala. Cada pocos niveles el tablero cambia de forma. Las palabras no se repiten nunca.",
    giratoria:"Encontrá las palabras antes de que se acabe el reloj, pero ojo: cada pocos segundos la sopa gira y las letras se mudan de lugar. Si estás marcando una palabra, la mudanza te espera un ratito."
  };
  function jugarModo(m){modo=m;nivel=SOPA_CONFIG.primerNivel;puntaje=0;iniciarRonda();}
  /* Al entrar siempre se elige el modo. */
  function elegirModo(){
    jugando=false;token++;clearTimeout(trasladoTimer);mudando=false;
    mostrarPanel("¿Cómo querés jugar?","🔎 Clásica: tablero gigante, formas, escaleritas y dibujos.\n🌀 Giratoria: las letras se mudan cada pocos segundos.","🔎 Sopa clásica",()=>jugarModo("clasica"),false,
      [{texto:"🌀 Sopa giratoria",accion:()=>jugarModo("giratoria"),clase:"sf-modo-giro"},{texto:"Jugar con un amigo",accion:iniciarDuelo,dibujo:"duelo",clase:"sf-modo-amigo"}],"mascota");
  }
  function abrir(contenedor){
    salir();datos=cargar();nivel=SOPA_CONFIG.primerNivel;puntaje=0;modo="clasica";raiz=document.createElement("div");raiz.className="sf-game";
    raiz.innerHTML='<button type="button" class="ext-volver" id="sfVolver">⟵ Extensiones</button>'
      +'<div class="sf-cabeza"><img src="'+ARTE("libro")+'" alt=""><div><small id="sfForma">Tema</small><b id="sfCategoria">Sopa de letras</b></div><span class="sf-cuenta" id="sfCuenta">0/0</span></div>'
      +'<div class="sf-hud"><div><small>Nivel</small><b id="sfNivel">1</b></div><div><small>Puntos</small><b id="sfPuntos">0</b></div><div><small>Mejor</small><b id="sfMejor">0</b></div><div><small><img class="sf-ico" src="'+ARTE("reloj")+'" alt="">Tiempo</small><b id="sfTiempo">0:00</b></div></div>'
      +'<div class="sf-bar"><i id="sfTiempoBarra"></i></div>'
      +'<div class="sf-tablero" id="sfTablero"><div class="sf-grid" id="sfGrid" aria-label="Sopa de letras"></div><img class="sf-remolino" src="'+ARTE("mudanza")+'" alt="" draggable="false"></div>'
      +'<div class="sf-mudanza"><p class="sf-mudanza-texto" id="sfMudanzaTexto"></p><div class="sf-bar mudanza"><i id="sfMudanzaBarra"></i></div></div>'
      +'<div class="sf-lista" id="sfLista"></div>'
      +'<div class="sf-acciones sf-botonera"><button type="button" id="sfPista"><img src="'+ARTE("record")+'" alt=""> Pista (3)</button><button type="button" id="sfPausa">⏸ Pausa</button><button type="button" id="sfAyuda">¿Cómo se juega?</button></div>'
      +'<details class="sf-historial"><summary id="sfHistorialTitulo">📖 Mis palabras encontradas (0)</summary><div class="sf-historial-lista" id="sfHistorialLista"></div></details><div class="sf-panel-capa" id="sfPanel"></div>';
    contenedor.appendChild(raiz);gridEl=raiz.querySelector("#sfGrid");listaEl=raiz.querySelector("#sfLista");
    gridEl.addEventListener("pointerdown",punteroAbajo);
    gridEl.addEventListener("pointermove",punteroMueve);
    gridEl.addEventListener("pointerup",punteroArriba);
    gridEl.addEventListener("pointercancel",cancelarArrastre);
    raiz.querySelector("#sfVolver").onclick=()=>Extensiones.abrirLobby();
    raiz.querySelector("#sfPista").onclick=usarPista;
    raiz.querySelector("#sfPausa").onclick=pausar;
    raiz.querySelector("#sfAyuda").onclick=()=>{
      if(jugando){mostrarToast("🔎",modo==="giratoria"?"Marcá en línea recta. Cada pocos segundos las letras se mudan.":"Marcá en línea recta (también diagonal y al revés). Las escaleritas se marcan siguiendo el camino.");return;}
      mostrarPanel("¿Cómo se juega?",AYUDA[modo],"Elegir modo",elegirModo,false,null,"mascota");
    };
    intervalo=setInterval(tic,SOPA_CONFIG.ticMs);
    document.addEventListener("visibilitychange",alVolver);
    iniciarMusicaJuego();
    actualizarHUD();
    dibujarHistorial();
    elegirModo();
  }
  function salir(){
    jugando=false;pausado=false;mudando=false;arrastre=null;token++;clearInterval(intervalo);clearTimeout(pistaTimer);clearTimeout(trasladoTimer);
    document.removeEventListener("visibilitychange",alVolver);
    detenerMusicaJuego();
    if(typeof Duelo!=="undefined")Duelo.salir();
    duelo=false;raiz=null;gridEl=null;listaEl=null;capsEl=null;celdas=[];intervalo=null;ocultoDesde=0;
  }
  return{abrir,salir,mejorPuntaje,configNivel};
})();
window.SopaFugaz=SopaFugaz;
