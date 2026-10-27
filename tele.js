/* Juegos en la tele (SALA_TV_PLAN.md, Gonzalo 26/10/2026).
   La tele (index.html?tele=1) muestra el juego en grande y es la que manda;
   los celulares (index.html?telecel=CÓDIGO) solo responden. Conexión: la de
   los duelos (MultiBroker: 4 servidores MQTT + Supabase), tema gya/tele/<código>.
   Es aparte de la Sala TV de la Ruleta (sala-tv.js, ?tvhost=1): no la toca.
   Juegos: Tutti Frutti (todos responden), Rosco (juega uno, los demás miran),
   Ahorcado (el celular es el teclado), 100 Rioplatenses (juega el grupo). Las palabras salen
   de los mismos bancos y la misma memoria que en el celular: no se repiten. */
(()=>{
  "use strict";
  const P=new URLSearchParams(location.search);
  const esTele=P.get("tele")==="1";
  const codCel=(P.get("telecel")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  const esCel=!!codCel&&!esTele;
  const CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const yo=(()=>{try{let id=sessionStorage.getItem("gya_tele_pid");if(!id){id="t"+Math.random().toString(36).slice(2,10);sessionStorage.setItem("gya_tele_pid",id);}return id;}catch(e){return"t"+Math.random().toString(36).slice(2,10);}})();
  const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const limpio=(s,max)=>String(s||"").replace(/[<>&"'\u0000-\u001F]/g,"").trim().slice(0,max);
  const mezclar=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const sinTilde=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
  const sonar=(f,d,t,g)=>{try{if(typeof bip==="function")bip(f,d,t,g);}catch(e){}};
  const sfx=id=>{try{if(typeof sonarSFX==="function")sonarSFX(id);}catch(e){}};
  const JUEGOS=[
    {id:"rosco",nombre:"El Rosco",icono:"assets/rosco/logo.webp",desc:"Juega uno, los demás miran",ok:true},
    {id:"ahorcado",nombre:"Ahorcado",icono:"assets/ahorcado/logo.webp",desc:"El celular es el teclado",ok:true},
    {id:"cien",nombre:"100 Rioplatenses",icono:"assets/cien/logo.webp",desc:"Un celular, juega el grupo",ok:true},
    {id:"ruleta",nombre:"La Ruleta",icono:"assets/logo.webp",desc:"Cada uno con su celular",ok:true},
    {id:"tutti",nombre:"Tutti Frutti",icono:"assets/tutti/logo.webp",desc:"Todos juegan desde su celular",ok:true},
    {id:"puzzle",nombre:"Puzzle",icono:"assets/puzzle-arte/icono.webp",desc:"Armen el mismo puzzle desde sus celulares",ok:true}
  ];

  /* ---------- Conexión ---------- */
  let red=null,seq=0;
  function conectar(cod,alListo,alFallar,alMensaje){
    const tema="gya/tele/"+cod;
    /* ?telered=local: entre pestañas del mismo navegador (pruebas). */
    if(P.get("telered")==="local"&&"BroadcastChannel" in window){
      const bc=new BroadcastChannel(tema);bc.onmessage=e=>{const m=e.data;if(m&&m.pid!==yo)alMensaje(m);};
      red={mandar:m=>{m.pid=yo;m.s=++seq;bc.postMessage(m);},cerrar:()=>bc.close()};setTimeout(alListo,30);return;
    }
    let cli=null;
    red={mandar:m=>{m.pid=yo;m.s=++seq;try{if(cli)cli.publish(tema,JSON.stringify(m));}catch(e){}},cerrar:()=>{try{if(cli)cli.end(true);}catch(e){}}};
    if(typeof MultiBroker==="undefined"){alFallar&&alFallar();return;}
    MultiBroker.conectar(()=>{
      cli.subscribe(tema);
      cli.on("message",(t,pl)=>{if(t!==tema)return;let m;try{m=JSON.parse(String(pl));}catch(e){return;}if(!m||typeof m!=="object"||m.pid===yo)return;alMensaje(m);});
      alListo();
    },alFallar,c=>{cli=c;});
  }
  /* En la tele y en el celular de la tele no salen los carteles del juego normal. */
  function silenciarApp(){
    ["tutChequearBienvenida","ptChequearAutoPopup","mostrarPromptIOS","pdChequearAutoPopup"].forEach(f=>{try{if(typeof window[f]==="function")window[f]=()=>{};}catch(e){}});
  }
  function despierta(){try{if(navigator.wakeLock)navigator.wakeLock.request("screen").catch(()=>{});}catch(e){}}

  /* ---------- Entrada desde Extensiones ---------- */
  function abrir(contenedor){
    contenedor.innerHTML=`<div class="tl-entrada"><button type="button" class="ext-volver" id="tlVolver">⟵ Extensiones</button>
      <h2>📺 Juegos en la tele</h2><p>La tele muestra el juego en grande y se responde desde el celular.</p>
      <button type="button" class="tl-boton tl-oro" id="tlSoyCelular">📱 Crear sala o entrar desde el celular</button>
      <button type="button" class="tl-boton tl-oro" id="tlSoyTele">📺 Esta pantalla es la tele</button>
      <small>En la tele también podés entrar a girayadivina.com y tocar «Sala TV / Familia».</small></div>`;
    contenedor.querySelector("#tlVolver").onclick=()=>{try{Extensiones.abrirLobby();}catch(e){}};
    contenedor.querySelector("#tlSoyCelular").onclick=()=>{location.href="tele/";};
    contenedor.querySelector("#tlSoyTele").onclick=()=>{location.href="index.html?tele=1";};
  }
  function salir(){}
  window.Tele={abrir,salir};
  if(!esTele&&!esCel)return;
  silenciarApp();
  document.documentElement.classList.add("tele-modo");

  /* =====================================================================
     TELE (anfitrión): tiene el estado y lo manda a los celulares.
     ===================================================================== */
  function iniciarTele(){
    let cod="";
    try{const guardado=localStorage.getItem("gya_tele_codigo")||"";if(guardado.length===5&&[...guardado].every(c=>CHARS.includes(c)))cod=guardado;}catch(e){}
    if(!cod){cod=Array.from({length:5},()=>CHARS[Math.floor(Math.random()*CHARS.length)]).join("");try{localStorage.setItem("gya_tele_codigo",cod);}catch(e){}}
    const T={cod,fase:"menu",jug:[],mando:null,juego:null,g:null,sel:0};
    const raiz=document.createElement("div");raiz.id="teleTV";raiz.className="tl-tv";document.body.appendChild(raiz);
    let timerJuego=null,ultimoTic=0;
    const mandar=m=>{if(red)red.mandar(m);};
    function estadoCel(){
      if(T.fase==="menu")return{pantalla:"menu",juegos:JUEGOS.map(j=>({id:j.id,nombre:j.nombre,ok:j.ok}))};
      if(T.fase==="ruleta")return{pantalla:"ruleta"};
      if(!T.g)return{pantalla:"menu"};
      return T.g.cel();
    }
    function difundir(){mandar({t:"estado",cod,fase:T.fase,juego:T.juego,jug:T.jug.map(j=>({pid:j.pid,n:j.n})),mando:T.mando,cel:estadoCel()});}
    function recibir(m){
      if(m.t==="hola"){
        const n=limpio(m.n,14)||"Jugador";let j=T.jug.find(x=>x.pid===m.pid),cambio=false;
        if(!j){if(T.jug.length>=8)return;j={pid:m.pid,n};T.jug.push(j);sonar(880,.12,"triangle",.06);cambio=true;}
        if(j.n!==n){j.n=n;cambio=true;}j.visto=Date.now();if(!T.mando||!T.jug.some(x=>x.pid===T.mando)){T.mando=m.pid;cambio=true;}
        if(cambio){pintar();difundir();}return;
      }
      const j=T.jug.find(x=>x.pid===m.pid);if(!j)return;j.visto=Date.now();
      if(m.t==="chau"){T.jug=T.jug.filter(x=>x.pid!==m.pid);if(T.mando===m.pid)T.mando=T.jug[0]?T.jug[0].pid:null;pintar();difundir();return;}
      if(m.t==="tomar"){if(T.juego==="tutti"&&T.g&&!T.g.participa(m.pid))return;T.mando=m.pid;pintar();difundir();return;}
      if(m.t!=="accion")return;
      if(m.pid!==T.mando&&!(T.fase==="juego"&&((T.juego==="tutti"&&m.a!=="menu"&&m.a!=="otra"&&m.a!=="siguiente")||(T.juego==="puzzle"&&["pz_bajar","pz_mover","pz_soltar","pz_girar","pz_acercar","pz_alejar","pz_encuadrar","pz_guia","pz_imagen"].includes(m.a)))))return;
      if(m.a==="elegir"&&T.fase==="menu"){elegir(String(m.juego||""));return;}
      if(m.a==="menu"){volverMenu();return;}
      if(T.g&&T.fase==="juego")T.g.accion(m);
    }
    function elegir(id){
      const j=JUEGOS.find(x=>x.id===id);if(!j||!j.ok)return;
      if(id==="tutti"&&T.jug.length<2){avisoTele("Tutti Frutti necesita al menos 2 celulares para revisar las respuestas");return;}
      despierta();
      if(id==="ruleta"){T.fase="ruleta";T.juego="ruleta";pintar();difundir();setTimeout(()=>{location.href="index.html?tvhost=1";},1500);return;}
      T.fase="juego";T.juego=id;T.g=(id==="puzzle"?juegoPuzzle:id==="tutti"?juegoTutti:id==="rosco"?juegoRosco:id==="ahorcado"?juegoAhorcado:juegoCien)(T,actualizar);
      ultimoTic=performance.now();clearInterval(timerJuego);
      timerJuego=setInterval(()=>{const a=performance.now(),dt=a-ultimoTic;ultimoTic=a;if(T.g&&T.g.tic)T.g.tic(dt);},200);
      actualizar();
    }
    function volverMenu(){clearInterval(timerJuego);if(T.g&&T.g.fin)T.g.fin();T.fase="menu";T.juego=null;T.g=null;pintar();difundir();}
    function actualizar(){pintar();difundir();}
    T.volverMenu=volverMenu;T.otra=()=>elegir(T.juego);
    function nombreMando(){const j=T.jug.find(x=>x.pid===T.mando);return j?j.n:"";}
    function pintar(){
      if(T.fase==="juego"&&T.g){raiz.className="tl-tv tl-juego-"+T.juego;T.g.pintar(raiz,nombreMando());return;}
      raiz.className="tl-tv";
      if(T.fase==="ruleta"){raiz.innerHTML=`<div class="tl-centro"><img class="tl-logo" src="assets/logo.webp" alt=""><h1>Abriendo la Ruleta…</h1><p>En los celulares: entrá a <b>girayadivina.com/tv.html</b> y poné el código nuevo que va a aparecer en la tele.</p></div>`;return;}
      const jug=T.jug.length?T.jug.map(j=>`<li class="${j.pid===T.mando?"tl-mando":""}">${j.pid===T.mando?"🎮 ":""}${esc(j.n)}</li>`).join(""):"<li class='tl-vacio'>Esperando celulares…</li>";
      raiz.innerHTML=`<div class="tl-menu">
        <section class="tl-sala"><img class="tl-logo" src="assets/logo.webp" alt="Girá y Adiviná">
          <p class="tl-paso">En el celular entrá a</p><p class="tl-url">girayadivina.com/tele</p>
          <p class="tl-paso">y poné el código</p><div class="tl-codigo">${cod}</div>
          <ul class="tl-jugadores">${jug}</ul>
          ${T.mando?`<p class="tl-ayuda">🎮 ${esc(nombreMando())} elige el juego desde su celular (o con el control remoto).</p>`:""}</section>
        <section class="tl-juegos">${JUEGOS.map((j,i)=>`<button type="button" class="tl-tarjeta${j.ok?"":" tl-pronto"}" data-j="${j.id}" ${j.ok?"":"disabled"}><img src="${j.icono}" alt="" onerror="this.style.visibility='hidden'"><b>${esc(j.nombre)}</b><small>${esc(j.desc)}</small></button>`).join("")}</section></div>`;
      raiz.querySelectorAll(".tl-tarjeta").forEach(b=>b.onclick=()=>{if(!T.jug.length){avisoTele("Primero uní un celular con el código 📱");return;}elegir(b.dataset.j);});
      const prim=raiz.querySelector(".tl-tarjeta:not([disabled])");if(prim&&!raiz.contains(document.activeElement))prim.focus({preventScroll:true});
    }
    function avisoTele(t){let a=raiz.querySelector(".tl-aviso");if(!a){a=document.createElement("div");a.className="tl-aviso";raiz.appendChild(a);}a.textContent=t;a.classList.add("tl-ver");clearTimeout(avisoTele.t);avisoTele.t=setTimeout(()=>a.classList.remove("tl-ver"),2600);}
    window.gyaTVRemote=direction=>{
      const bs=[...raiz.querySelectorAll("button:not([disabled])")];if(!bs.length)return;
      const i=bs.indexOf(document.activeElement);
      if(direction==="select"){bs[i>=0?i:0].click();return;}
      const paso=direction==="right"||direction==="down"?1:direction==="left"||direction==="up"?-1:0;
      if(paso)bs[(i<0?0:i+paso+bs.length)%bs.length].focus();
    };
    window.gyaTVBack=()=>{if(T.fase!=="juego")return false;volverMenu();return true;};
    /* Control remoto: flechas mueven entre botones, Enter elige (lo hace el navegador). */
    document.addEventListener("keydown",e=>{
      if(e.key==="Backspace"||e.key==="Escape"){if(T.fase==="juego"){e.preventDefault();volverMenu();}return;}
      const direction={ArrowRight:"right",ArrowDown:"down",ArrowLeft:"left",ArrowUp:"up"}[e.key];
      if(direction){e.preventDefault();window.gyaTVRemote(direction);}
    });
    pintar();
    conectar(cod,()=>{difundir();setInterval(difundir,2500);},()=>{avisoTele("No se pudo conectar. Revisá el internet de la tele y recargá.");},recibir);
  }

  /* ---------- Tutti Frutti: todos responden; la tele revela palabras al terminar la letra ---------- */
  function juegoTutti(T,actualizar){
    const BASE=["Nombre","Apellido","País o ciudad","Comida","Animal","Cosa"];
    const LETRAS="ABCDEFGHIJLMNOPRSTUV".split(""),RONDAS=3;
    let config={};try{config=JSON.parse(localStorage.getItem("gya_tutti")||"{}")||{};}catch(e){}
    const elegidas=Array.isArray(config.cats)?config.cats.filter(c=>["Nombre","Apellido","País o ciudad","Comida","Animal","Color","Marca","Fruta o verdura","Cosa","Profesión","Famoso","Película o serie"].includes(c)).slice(0,12):[];
    const cats=elegidas.length>=3?elegidas:BASE.slice();
    const duracion=[60,90,120].includes(config.tiempo)?config.tiempo:90;
    const jugadores=T.jug.map(j=>({pid:j.pid,n:j.n})),ids=new Set(jugadores.map(j=>j.pid));
    const totales=Object.fromEntries(jugadores.map(j=>[j.pid,0])),ganadas=Object.fromEntries(jugadores.map(j=>[j.pid,0]));
    const historial=[];
    let ronda=0,letra="",restante=0,fase="jugando",ganador=null,muerto=false,timer=null,corteEn=0,resolucionProgramada=false;
    let respuestas={},recibidas={},progreso={},marcas={},extra={},anuladas={},pendientes={},resueltas={};
    const clave=(pid,i)=>pid+"|"+i;
    const puntos=()=>{
      const out=Object.fromEntries(jugadores.map(j=>[j.pid,cats.map(()=>0)]));
      cats.forEach((cat,i)=>{
        const validos=jugadores.filter(j=>{const k=clave(j.pid,i);return !anuladas[k]&&(respuestas[j.pid]||[])[i]&&(marcas[j.pid]?.[i]||extra[k]>0);});
        validos.forEach(j=>{const iguales=validos.filter(o=>o.pid!==j.pid&&sinTilde((respuestas[o.pid]||[])[i]).trim()===sinTilde((respuestas[j.pid]||[])[i]).trim()).length;
          const k=clave(j.pid,i);out[j.pid][i]=!marcas[j.pid]?.[i]&&extra[k]!=null?extra[k]:validos.length===1?20:iguales?5:10;});
      });return out;
    };
    const suma=a=>a.reduce((n,x)=>n+x,0);
    function elegirLetra(){
      let usadas=[];try{usadas=JSON.parse(localStorage.getItem("gya_tf_letras_usadas")||"[]");}catch(e){}
      if(!Array.isArray(usadas))usadas=[];
      let libres=LETRAS.filter(l=>!usadas.includes(l));if(!libres.length){usadas=[];libres=LETRAS.slice();}
      const l=libres[Math.floor(Math.random()*libres.length)];usadas.push(l);
      try{localStorage.setItem("gya_tf_letras_usadas",JSON.stringify(usadas));}catch(e){}return l;
    }
    function nueva(){ronda++;letra=elegirLetra();restante=duracion*1000;fase="jugando";ganador=null;respuestas={};recibidas={};progreso={};marcas={};extra={};anuladas={};pendientes={};resueltas={};resolucionProgramada=false;}
    const limpiar=r=>cats.map((_,i)=>{const v=limpio(Array.isArray(r)?r[i]:"",30);return v.length>=2&&sinTilde(v)[0]===letra?v:"";});
    function cortar(pid,r){if(fase!=="jugando")return;ganador=pid;fase="cortada";corteEn=Date.now();if(pid){respuestas[pid]=limpiar(r);recibidas[pid]=true;progreso[pid]=true;
        try{if(typeof sonidoErrorExt==="function")sonidoErrorExt();}catch(e){}}
      clearTimeout(timer);timer=setTimeout(resolver,4200);actualizar();siEstanTodos();}
    function siEstanTodos(){if(fase!=="cortada"||resolucionProgramada||!jugadores.every(j=>recibidas[j.pid]))return;
      resolucionProgramada=true;clearTimeout(timer);timer=setTimeout(resolver,Math.max(0,1700-(Date.now()-corteEn)));}
    async function resolver(){if(muerto||fase!=="cortada")return;fase="validando";actualizar();const actual=ronda;
      const filas=await Promise.all(jugadores.map(async j=>{const r=respuestas[j.pid]||[];
        const m=await Promise.all(cats.map(async(c,i)=>{if(!r[i])return false;try{return(await TuttiFrutti._revisar(c,r[i]))!==false;}catch(e){return true;}}));return[j.pid,m];}));
      if(muerto||actual!==ronda||fase!=="validando")return;marcas=Object.fromEntries(filas);fase="resultado";actualizar();}
    function cerrarRonda(){const pr=puntos(),sumas=Object.fromEntries(jugadores.map(j=>[j.pid,suma(pr[j.pid])]));
      historial.push({letra,puntos:sumas});const max=Math.max(...Object.values(sumas));
      jugadores.forEach(j=>{totales[j.pid]+=sumas[j.pid];if(max>0&&sumas[j.pid]===max)ganadas[j.pid]++;});
      if(ronda>=RONDAS){fase="fin";sfx("aplausos");}else nueva();actualizar();}
    function accion(m){
      if(m.a==="otra"&&fase==="fin"&&m.pid===T.mando){T.otra();return;}
      if(m.a==="siguiente"&&fase==="resultado"&&m.pid===T.mando&&!Object.keys(pendientes).length){cerrarRonda();return;}
      if(!ids.has(m.pid)||Number(m.r)!==ronda)return;
      if(m.a==="progreso"&&fase==="jugando"){const v=!!m.completo;if(progreso[m.pid]!==v){progreso[m.pid]=v;actualizar();}return;}
      if(m.a==="basta"&&fase==="jugando"){const r=limpiar(m.respuestas);if(r.every(Boolean))cortar(m.pid,r);return;}
      if(m.a==="respuesta"&&fase==="cortada"&&!recibidas[m.pid]){respuestas[m.pid]=limpiar(m.respuestas);recibidas[m.pid]=true;actualizar();siEstanTodos();return;}
      if(fase!=="resultado")return;
      const i=Number(m.i),a=String(m.aid||""),k=clave(a,i);
      if(m.a==="apelar"&&a===m.pid&&Number.isInteger(i)&&i>=0&&i<cats.length&&(respuestas[a]||[])[i]&&!marcas[a]?.[i]&&!anuladas[k]&&!pendientes["apelar:"+k]&&!resueltas["apelar:"+k]){
        pendientes["apelar:"+k]={tipo:"apelar",solicita:m.pid,a,i};actualizar();return;}
      if(m.a==="anular"&&a!==m.pid&&ids.has(a)&&Number.isInteger(i)&&i>=0&&i<cats.length&&puntos()[a][i]>0&&!pendientes["anular:"+k]&&!resueltas["anular:"+k]){
        pendientes["anular:"+k]={tipo:"anular",solicita:m.pid,a,i};actualizar();return;}
      if(m.a==="devolver"&&m.pid===T.mando&&anuladas[k]){delete anuladas[k];delete resueltas["anular:"+k];actualizar();return;}
      if(m.a!=="decidir")return;
      const id=String(m.id||""),p=pendientes[id];if(!p||p.solicita===m.pid)return;
      if(p.tipo==="apelar"){
        const valor=Number(m.p);if(![0,5,10,20].includes(valor))return;extra[clave(p.a,p.i)]=valor;
        if(valor>0&&window.TuttiFrutti?._aprobarPalabra)TuttiFrutti._aprobarPalabra(cats[p.i],(respuestas[p.a]||[])[p.i]);
      }else{if(m.v!==true&&m.v!==false)return;if(m.v)anuladas[clave(p.a,p.i)]=true;}
      delete pendientes[id];resueltas[id]=true;actualizar();
    }
    function tic(dt){if(fase!=="jugando")return;restante=Math.max(0,restante-dt);
      const el=document.querySelector("#tlTuttiReloj");if(el){el.textContent=String(Math.ceil(restante/1000));el.classList.toggle("tl-urgente",restante<=10000);}
      if(restante<=0)cortar(null,null);}
    function pintar(raiz){
      if(fase==="jugando"){
        raiz.innerHTML=`<div class="tl-tutti"><header><img src="assets/tutti/logo.webp" alt=""><h1>RONDA ${ronda} DE ${RONDAS}</h1></header>
          <div class="tl-tutti-centro"><p>LETRA</p><strong>${letra}</strong><div id="tlTuttiReloj" class="tl-tutti-reloj${restante<=10000?" tl-urgente":""}">${Math.ceil(restante/1000)}</div></div>
          <ul class="tl-tutti-jug">${jugadores.map(j=>`<li class="${progreso[j.pid]?"tl-listo":""}">${esc(j.n)} <b>${progreso[j.pid]?"✓":"·"}</b></li>`).join("")}</ul></div>`;return;}
      if(fase==="cortada"||fase==="validando"){
        raiz.innerHTML=`<div class="tl-centro tl-tutti-espera"><h1>${fase==="cortada"?(ganador?"¡BASTA!":"¡TIEMPO!"):"Revisando respuestas…"}</h1>
          <p>${fase==="cortada"?(ganador?esc((jugadores.find(j=>j.pid===ganador)||{}).n||"Alguien")+" terminó primero":"Terminó el tiempo de la letra "+letra):"Los jugadores revisan desde sus celulares"}</p></div>`;return;}
      if(fase==="resultado"){
        const pr=puntos(),pend=Object.values(pendientes);
        raiz.innerHTML=`<div class="tl-tutti-resultado"><header><h1>🍓 LETRA ${letra} · RONDA ${ronda}/${RONDAS}</h1>
          <p>Respuestas y puntajes · apelaciones desde los celulares${pend.length?` · ⏳ ${pend.length} pendiente${pend.length===1?"":"s"}`:""}</p></header>
          <div class="tl-tf-board${cats.length>8||jugadores.length>5?" tl-tf-board-densa":""}" style="--tf-jug:${jugadores.length};--tf-cats:${cats.length}">
            <div class="tl-tf-board-esquina">CATEGORÍA</div>${jugadores.map(j=>`<div class="tl-tf-board-nombre">${esc(j.n)}${j.pid===ganador?" 🏁":""}</div>`).join("")}
            ${cats.map((cat,i)=>`<div class="tl-tf-board-cat">${esc(cat)}</div>${jugadores.map(j=>{const v=(respuestas[j.pid]||[])[i]||"",k=clave(j.pid,i),p=pr[j.pid][i],solicitud=pend.find(x=>x.a===j.pid&&x.i===i);
              const estado=anuladas[k]?"🚫 Anulada":solicitud?"⏳ En revisión":v&&!marcas[j.pid]?.[i]&&extra[k]==null?"⚠️ Dudosa":"";
              return`<div class="tl-tf-board-celda${anuladas[k]?" tl-tf-board-anulada":solicitud?" tl-tf-board-pendiente":v&&!marcas[j.pid]?.[i]&&extra[k]==null?" tl-tf-board-dudosa":""}"><span>${esc(v)||"—"}</span><small>+${p}${estado?` · ${estado}`:""}</small></div>`;}).join("")}`).join("")}
            <div class="tl-tf-board-total">TOTAL LETRA</div>${jugadores.map(j=>`<div class="tl-tf-board-suma">+${suma(pr[j.pid])}<small>Acumulado: ${totales[j.pid]+suma(pr[j.pid])}</small></div>`).join("")}</div>
          <footer>Los puntos se actualizan al resolver apelaciones y anulaciones. 🎮 Siguiente letra desde el celular con el control.</footer></div>`;return;}
      const orden=[...jugadores].sort((a,b)=>ganadas[b.pid]-ganadas[a.pid]||totales[b.pid]-totales[a.pid]);
      raiz.innerHTML=`<div class="tl-tutti-final"><h1>🏆 TUTTI FRUTTI · RESULTADO FINAL</h1>
        <div class="tl-tutti-tabla"><div class="tl-tutti-fila tl-tutti-final-cab"><span>JUGADOR</span>${historial.map(h=>`<span>LETRA ${h.letra}</span>`).join("")}<span>TOTAL</span><span>RONDAS</span></div>
        ${orden.map((j,i)=>`<div class="tl-tutti-fila"><span>${["🥇","🥈","🥉"][i]||""} ${esc(j.n)}</span>${historial.map(h=>`<b>+${h.puntos[j.pid]||0}</b>`).join("")}<b>${totales[j.pid]}</b><b>${ganadas[j.pid]}</b></div>`).join("")}</div>
        <p>En el celular con el control: jugar otra vez o volver al menú.</p></div>`;
    }
    function cel(){const comun={pantalla:"tutti",fase,r:ronda,letra,cats,jug:jugadores,ganador,resta:Math.ceil(restante),recibidas};
      if(fase==="jugando"||fase==="cortada"||fase==="validando")return comun;
      if(fase==="fin")return{...comun,totales,ganadas,historial};
      return{...comun,respuestas,marcas,extra,anuladas,pendientes,resueltas,puntos:puntos(),totales,ganadas};}
    nueva();return{accion,tic,pintar,cel,participa:pid=>ids.has(pid),fin(){muerto=true;clearTimeout(timer);}};
  }

  /* ---------- Puzzle: el motor original dibuja en la tele; teléfonos = controles ---------- */
  function juegoPuzzle(T,actualizar){
    const nombres={dibujo:"Dibujos",aventura:"Aventuras",heroe:"Héroes",ciudad:"Ciudades",gigante:"Gigantes"};
    const cantidades=[12,25,49,70,100,150,300,500,1000];
    let fase="config",catalogo={},cat="dibujo",indice=0,n=25,rot=true,guardado=false,listo=false,iframe=null,muerto=false,errorTexto="";
    let estado={n:0,pct:0,tiempo:0,ganado:false},dueno=null,duenoEn=0,ultimo={x:.5,y:.5};
    const secuencias={};
    const lista=()=>Array.isArray(catalogo[cat])?catalogo[cat]:[];
    const imagen=()=>lista()[indice]||"";
    const mini=()=>cat==="ciudad"?"assets/worlds/"+imagen()+".webp":"assets/puzzle/mini/"+imagen()+".webp";
    const nombreDueno=()=>dueno?(T.jug.find(j=>j.pid===dueno)||{}).n||"Alguien":"";
    const enviarFrame=(a,d={})=>{if(listo&&iframe?.contentWindow)iframe.contentWindow.postMessage({t:"gya-tv-puzzle",a,...d},location.origin);};
    function mensaje(e){if(muerto||!iframe||e.source!==iframe.contentWindow||e.origin!==location.origin||e.data?.t!=="gya-tv-puzzle")return;
      const m=e.data;
      if(m.a==="listo"){catalogo=m.catalogo||{};guardado=!!m.guardado;listo=true;indice=0;actualizar();return;}
      if(m.a==="estado"){estado={n:Number(m.n)||0,pct:Number(m.pct)||0,tiempo:Number(m.tiempo)||0,ganado:!!m.ganado};if(estado.ganado){fase="fin";dueno=null;guardado=false;}actualizar();return;}
      if(m.a==="error"){fase="config";errorTexto=String(m.texto||"No se pudo abrir el puzzle");actualizar();}
    }
    window.addEventListener("message",mensaje);
    function elegirCategoria(v){if(!Object.hasOwn(nombres,v)||!Array.isArray(catalogo[v]))return;cat=v;indice=0;
      if(cat==="gigante"&&n<500)n=500;else if(cat==="aventura"&&n<49)n=49;else if(cat!=="gigante"&&n>=500)n=cat==="aventura"?49:25;actualizar();}
    function elegirImagen(d){const a=lista();if(!a.length)return;indice=(indice+d+a.length)%a.length;actualizar();}
    function elegirPiezas(v){if(!cantidades.includes(v))return;if(cat==="gigante"&&v<500)return;if(cat==="aventura"&&v<49)return;if(cat!=="gigante"&&v>=500)return;n=v;actualizar();}
    function empezar(continuar){if(!listo)return;if(!continuar&&!imagen())return;
      dueno=null;fase="cargando";errorTexto="";estado={n:0,pct:0,tiempo:0,ganado:false};actualizar();
      enviarFrame(continuar?"continuar":"iniciar",continuar?{}:{cat,slug:imagen(),n,rot});
      /* El motor envía estado cuando terminó de crear las piezas. */
    }
    function accion(m){if(muerto)return;const s=Number(m.s)||0;if(s&&s<=(secuencias[m.pid]||0))return;if(s)secuencias[m.pid]=s;
      if(m.a==="pz_categoria"&&m.pid===T.mando&&fase==="config"){elegirCategoria(String(m.cat||""));return;}
      if(m.a==="pz_imagen_elegir"&&m.pid===T.mando&&fase==="config"){elegirImagen(Number(m.delta)||0);return;}
      if(m.a==="pz_piezas"&&m.pid===T.mando&&fase==="config"){elegirPiezas(Number(m.n));return;}
      if(m.a==="pz_rotacion"&&m.pid===T.mando&&fase==="config"){rot=!!m.rot;actualizar();return;}
      if(m.a==="pz_inicio"&&m.pid===T.mando&&fase==="config"){empezar(false);return;}
      if(m.a==="pz_continuar"&&m.pid===T.mando&&fase==="config"&&guardado){empezar(true);return;}
      if(m.a==="pz_config"&&m.pid===T.mando&&(fase==="juego"||fase==="fin")){if(dueno)enviarFrame("soltar",ultimo);if(fase==="juego"){enviarFrame("pausar");guardado=true;}dueno=null;fase="config";actualizar();return;}
      if(fase!=="juego")return;
      const x=Number(m.x),y=Number(m.y);if(!Number.isFinite(x)||!Number.isFinite(y))return;
      const p={x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))};
      if(m.a==="pz_bajar"){if(dueno)return;dueno=m.pid;duenoEn=Date.now();ultimo=p;enviarFrame("bajar",p);actualizar();return;}
      if(m.a==="pz_mover"){if(dueno!==m.pid)return;duenoEn=Date.now();ultimo=p;enviarFrame("mover",p);return;}
      if(m.a==="pz_soltar"){if(dueno!==m.pid)return;ultimo=p;enviarFrame("mover",p);enviarFrame("soltar",p);dueno=null;actualizar();return;}
      if(dueno&&dueno!==m.pid)return;
      const operaciones={pz_girar:"girar",pz_acercar:"acercar",pz_alejar:"alejar",pz_encuadrar:"encuadrar",pz_guia:"guia",pz_imagen:"imagen"};
      if(operaciones[m.a]){ultimo=p;enviarFrame(operaciones[m.a],p);}
    }
    function tic(){if(dueno&&Date.now()-duenoEn>5000){enviarFrame("soltar",ultimo);dueno=null;actualizar();}}
    function pintar(raiz){
      if(!iframe||!raiz.contains(iframe)){
        raiz.innerHTML=`<div class="tl-puzzle"><iframe id="tlPzFrame" src="puzzle.html?tvpuzzle=1&amp;v=50" title="Tablero del Puzzle"></iframe>
          <div id="tlPzConfig" class="tl-pz-config"></div><div id="tlPzHud" class="tl-pz-hud" hidden></div></div>`;
        iframe=raiz.querySelector("#tlPzFrame");
      }
      const config=raiz.querySelector("#tlPzConfig"),hud=raiz.querySelector("#tlPzHud");
      config.hidden=fase!=="config";hud.hidden=fase==="config";
      if(fase==="config"){
        const a=lista();config.innerHTML=`<h1>🧩 Puzzle en la tele</h1><p>Elegí el dibujo con el celular que tiene el control. Después todos pueden mover piezas.</p>
          <div class="tl-pz-categorias">${Object.entries(nombres).map(([k,v])=>`<button type="button" data-pz-cat="${k}" class="${cat===k?"tl-pz-activo":""}">${v}</button>`).join("")}</div>
          <div class="tl-pz-seleccion"><button type="button" id="tlPzAnt">‹</button>${imagen()?`<img src="${mini()}" alt="Puzzle seleccionado">`:"<div class='tl-pz-espera'>Cargando catálogo…</div>"}<button type="button" id="tlPzSig">›</button></div>
          <p>${imagen()?esc(imagen().replace(/-/g," ")):"Esperá un momento"} · ${n} piezas ${rot?"· con giro":"· sin giro"}</p>
          <button type="button" class="tl-pz-empezar" id="tlPzStart" ${!listo?"disabled":""}>▶ Empezar puzzle</button>
          ${guardado?'<button type="button" class="tl-pz-continuar" id="tlPzResume">↪ Continuar el puzzle guardado</button>':""}
          <small id="tlPzError">${esc(errorTexto||(!listo?"Cargando el Puzzle…":""))}</small>`;
        config.querySelectorAll("[data-pz-cat]").forEach(b=>b.onclick=()=>elegirCategoria(b.dataset.pzCat));
        config.querySelector("#tlPzAnt").onclick=()=>elegirImagen(-1);config.querySelector("#tlPzSig").onclick=()=>elegirImagen(1);
        config.querySelector("#tlPzStart").onclick=()=>empezar(false);config.querySelector("#tlPzResume")?.addEventListener("click",()=>empezar(true));
      }else{
        if(fase==="cargando"&&estado.n>0)fase="juego";
        hud.innerHTML= fase==="cargando"?"🧩 Armando piezas…":fase==="fin"?"🏆 ¡Puzzle completo!":`🧩 ${estado.pct}% armado${dueno?" · "+esc(nombreDueno())+" mueve una pieza":" · Todos pueden jugar"}`;
      }
    }
    function cel(){return{pantalla:"puzzle",fase,cat,lista:lista(),indice,n,rot,guardado,listo,estado,dueno,nombreDueno:nombreDueno(),jug:T.jug.map(j=>({pid:j.pid,n:j.n}))};}
    function fin(){if(dueno)enviarFrame("soltar",ultimo);if(fase==="juego")enviarFrame("pausar");try{iframe?.contentWindow?.dispatchEvent(new Event("pagehide"));}catch(e){}muerto=true;window.removeEventListener("message",mensaje);}
    return{accion,tic,pintar,cel,fin};
  }

  /* ---------- Rosco: juega uno, los demás miran ---------- */
  function juegoRosco(T,actualizar){
    const CANT=20,SEGUNDOS=160,LETRAS="ABCDEFGHIJLMNOPQRSTUVYZ";
    const norm=s=>sinTilde(s).replace(/\s+/g,"");
    function vale(d,valor){
      const ops=[d.palabra,...(d.alternativas||[])].map(norm);if(ops.includes(valor))return true;
      const base=norm(d.palabra),resto=valor.startsWith(base)?valor.slice(base.length):"";
      return resto.length>0&&resto.length<=12&&/^(DEL?|DELA|DELOS|DELAS)[A-Z]{3,}$/.test(resto);
    }
    /* Misma memoria que el Rosco del celular: primero las que nunca salieron. */
    function armar(){
      const banco=typeof ROSCO_DATOS!=="undefined"?ROSCO_DATOS:[],vistas=Vistas.cargar("rosco");
      const letras=mezclar([...LETRAS].filter(l=>banco.some(d=>d.letra===l))).slice(0,CANT).sort();
      const items=letras.map(l=>{const b=banco.filter(d=>d.letra===l);let libres=b.filter(d=>!vistas.has(d.palabra));if(!libres.length){b.forEach(d=>vistas.delete(d.palabra));libres=b;}
        const pref=libres.filter(d=>d.nivel<=2);const d=mezclar(pref.length?pref:libres)[0];vistas.add(d.palabra);return d;});
      Vistas.guardar("rosco",vistas);return items;
    }
    const items=armar(),est=items.map(()=>"pendiente"),resp=items.map(()=>"");
    let actual=0,tiempo=SEGUNDOS*1000,fase="jugando",ultimo=null,cambio=0,angPrevio=0;
    const pend=()=>est.map((s,i)=>s==="pendiente"?i:-1).filter(i=>i>=0);
    function avanzar(){const p=pend();if(!p.length){terminar();return;}actual=p.find(i=>i>actual)??p[0];}
    function terminar(){if(fase==="fin")return;fase="fin";const ok=est.filter(s=>s==="ok").length;
      try{const r=JSON.parse(localStorage.getItem("gya_tele_records")||"{}");if(ok>(r.rosco||0)){r.rosco=ok;localStorage.setItem("gya_tele_records",JSON.stringify(r));}}catch(e){}
      sfx(ok>=items.length/2?"aplausos":"abucheo");actualizar();}
    function accion(m){
      if(fase==="fin"){if(m.a==="otra")T.otra();return;}
      if(m.a==="pasar"){ultimo={i:actual,tipo:"paso"};cambio=Date.now();sonar(520,.08,"sine",.05);avanzar();actualizar();return;}
      if(m.a==="responder"){const txt=limpio(m.txt,40);if(!txt)return;const d=items[actual],ok=vale(d,norm(txt));
        est[actual]=ok?"ok":"mal";resp[actual]=txt;ultimo={i:actual,tipo:ok?"ok":"mal",palabra:d.palabra};cambio=Date.now();
        if(ok){sonar(720,.13,"triangle",.08);setTimeout(()=>sonar(980,.2,"sine",.09),120);}else sonar(180,.3,"sawtooth",.05);
        avanzar();actualizar();}
    }
    function tic(dt){if(fase!=="jugando")return;tiempo-=dt;if(tiempo<=0){tiempo=0;terminar();return;}
      const r=T.g&&document.querySelector("#tlReloj");if(r)r.textContent=reloj(tiempo);}
    const reloj=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");};
    const regla=d=>(norm(d.palabra)[0]===d.letra?"Empieza con la ":"Contiene la ")+d.letra;
    function pintar(raiz,quien){
      const n=items.length,ok=est.filter(s=>s==="ok").length,mal=est.filter(s=>s==="mal").length;
      if(fase==="fin"){
        raiz.innerHTML=`<div class="tl-centro tl-fin"><h1>${ok>=n*.7?"¡Tremendo rosco! 🎉":ok>=n/2?"¡Muy bien! 👏":"¡Se terminó!"}</h1>
          <div class="tl-res"><span class="tl-ok">✓ ${ok} aciertos</span><span class="tl-mal">✘ ${mal} errores</span><span>⏱ ${reloj(SEGUNDOS*1000-tiempo)}</span></div>
          <div class="tl-palabras">${items.map((d,i)=>`<span class="tl-${est[i]}"><b>${d.letra}</b> ${esc(d.palabra.toLowerCase())}</span>`).join("")}</div>
          <p class="tl-ayuda">${quien?esc(quien)+": desde el celular podés jugar otra vez o volver al menú.":""}</p></div>`;return;}
      const d=items[actual],paso=360/n;let ang=-actual*paso;while(ang-angPrevio>180)ang-=360;while(angPrevio-ang>180)ang+=360;
      const letras=items.map((x,i)=>`<div class="tl-rl tl-${est[i]}${i===actual?" tl-actual":""}" style="--p:${i*paso}deg">${x.letra}</div>`).join("");
      const flash=ultimo&&Date.now()-cambio<1800?(ultimo.tipo==="ok"?`<div class="tl-flash tl-ok">¡Bien! ✓</div>`:ultimo.tipo==="mal"?`<div class="tl-flash tl-mal">Era ${esc(ultimo.palabra)}</div>`:`<div class="tl-flash tl-paso">Pasó ⏭</div>`):"";
      raiz.innerHTML=`<div class="tl-rosco">
        <div class="tl-aro"><div class="tl-giro" style="--a:${angPrevio}deg">${letras}</div>
          <div class="tl-medio"><div class="tl-letra">${d.letra}</div><div class="tl-regla">${regla(d)}</div></div></div>
        <aside class="tl-panel"><p class="tl-quien">🎮 Juega ${esc(quien||"…")}</p>
          <div class="tl-def">${esc(d.definicion)}</div>
          <div class="tl-hud"><span class="tl-ok">✓ ${ok}</span><span class="tl-mal">✘ ${mal}</span><span id="tlReloj">${reloj(tiempo)}</span></div>${flash}</aside></div>`;
      /* El rosco gira hasta poner adelante la letra del turno. */
      const g=raiz.querySelector(".tl-giro");requestAnimationFrame(()=>requestAnimationFrame(()=>{if(g)g.style.setProperty("--a",ang+"deg");}));angPrevio=ang;
    }
    return{accion,tic,pintar,fin(){},cel(){return fase==="fin"?{pantalla:"fin",juego:"rosco",resumen:est.filter(s=>s==="ok").length+" aciertos"}:{pantalla:"rosco",letra:items[actual].letra,regla:regla(items[actual])};}};
  }

  /* ---------- Ahorcado: la partida como en el celular; el celular es el teclado ---------- */
  function juegoAhorcado(T,actualizar){
    const C=typeof AHORCADO_CONFIG!=="undefined"?AHORCADO_CONFIG:{palabras:5,vidas:6,ptsPalabra:150,ptsVida:20};
    const LET=typeof AHORCADO_LETRAS!=="undefined"?AHORCADO_LETRAS:"ABCDEFGHIJKLMNOPQRSTUVYZ";
    const CATS=typeof AHORCADO_CATEGORIAS!=="undefined"?AHORCADO_CATEGORIAS:[];
    let n=0,puntos=0,pal=null,usadas=new Set(),errores=0,fase="giro",ganadas=0,timer=null;
    function elegir(){
      const todas=AHORCADO_DATOS,libres=Vistas.filtrar("ahorcado",todas,d=>d.palabra);
      const cats=[...new Set(libres.map(d=>d.categoria))],cat=cats[Math.floor(Math.random()*cats.length)];
      const ops=libres.filter(d=>d.categoria===cat),d=ops[Math.floor(Math.random()*ops.length)];Vistas.marcar("ahorcado",d.palabra);return d;
    }
    function nueva(){n++;pal=elegir();usadas=new Set();errores=0;fase="giro";sonar(400,.5,"triangle",.04);actualizar();clearTimeout(timer);timer=setTimeout(()=>{fase="jugando";actualizar();},1800);}
    const completa=()=>[...pal.palabra].every(c=>usadas.has(c));
    function cerrarPalabra(gano){fase="entre";if(gano){ganadas++;puntos+=C.ptsPalabra+C.ptsVida*(C.vidas-errores);sfx("aplausos");}else sfx("abucheo");actualizar();
      clearTimeout(timer);timer=setTimeout(()=>{if(n>=C.palabras){fase="fin";try{const r=JSON.parse(localStorage.getItem("gya_tele_records")||"{}");if(puntos>(r.ahorcado||0)){r.ahorcado=puntos;localStorage.setItem("gya_tele_records",JSON.stringify(r));}}catch(e){}actualizar();}else nueva();},3000);}
    function accion(m){
      if(fase==="fin"){if(m.a==="otra")T.otra();return;}
      if(m.a!=="letra"||fase!=="jugando")return;const l=String(m.l||"");if(!LET.includes(l)||usadas.has(l))return;usadas.add(l);
      if(pal.palabra.includes(l)){sonar(720,.1,"triangle",.07);if(completa()){cerrarPalabra(true);return;}}
      else{errores++;sonar(170,.25,"sawtooth",.05);if(errores>=C.vidas){cerrarPalabra(false);return;}}
      actualizar();
    }
    function munieco(){const partes=['<circle cx="245" cy="98" r="22"/>','<path d="M245 120V185"/>','<path d="M245 138L210 168"/>','<path d="M245 138L280 168"/>','<path d="M245 185L215 235"/>','<path d="M245 185L275 235"/>'];
      return'<div class="tl-horca"><img src="assets/ahorcado/horca.webp" alt="" draggable="false"><svg viewBox="0 0 315 309" aria-hidden="true"><path d="M245 50V76" stroke="#C99A5B" stroke-width="7" stroke-linecap="round"/><g stroke="#F5B301" stroke-width="9" stroke-linecap="round" fill="none">'+partes.slice(0,errores).join("")+'</g></svg></div>';}
    function pintar(raiz,quien){
      if(fase==="fin"){raiz.innerHTML=`<div class="tl-centro tl-fin"><h1>${ganadas>=4?"¡Impresionante! 🎉":ganadas>=2?"¡Bien jugado! 👏":"¡Se terminó!"}</h1><div class="tl-res"><span class="tl-ok">✓ ${ganadas} de ${C.palabras} palabras</span><span>⭐ ${puntos} puntos</span></div><p class="tl-ayuda">${quien?esc(quien)+": desde el celular podés jugar otra vez o volver al menú.":""}</p></div>`;return;}
      const cat=CATS.find(c=>c.id===pal.categoria)||{nombre:pal.categoria,emoji:"❓",color:"#7B3FE4"};
      if(fase==="giro"){raiz.innerHTML=`<div class="tl-centro"><div class="tl-ruleta-cat">${CATS.map((c,i)=>`<span style="--c:${c.color};--i:${i}">${c.emoji}</span>`).join("")}</div><h1>Palabra ${n} de ${C.palabras}</h1><p class="tl-ayuda">Girando la categoría…</p></div>`;return;}
      const revelar=fase==="entre";
      const casillas=[...pal.palabra].map(c=>`<span class="tl-casilla${!usadas.has(c)&&revelar?" tl-falto":""}">${usadas.has(c)||revelar?c:""}</span>`).join("");
      const teclas=[...LET].map(l=>`<span class="${usadas.has(l)?(pal.palabra.includes(l)?"tl-si":"tl-no"):""}">${l}</span>`).join("");
      raiz.innerHTML=`<div class="tl-ahorcado"><div class="tl-izq">${munieco()}<p class="tl-vidas">${"❤️".repeat(C.vidas-errores)}${"🖤".repeat(errores)}</p></div>
        <div class="tl-der"><div class="tl-cat" style="--c:${cat.color}">${cat.emoji} ${esc(cat.nombre)} · ${pal.palabra.length} letras</div>
          <div class="tl-palabra">${casillas}</div><div class="tl-teclas">${teclas}</div>
          <div class="tl-hud"><span>Palabra ${n}/${C.palabras}</span><span>⭐ ${puntos}</span><span>🎮 ${esc(quien||"…")}</span></div>
          ${revelar?`<div class="tl-flash ${completa()?"tl-ok":"tl-mal"}">${completa()?"¡La sacaron! ✓":"Era "+esc(pal.palabra)}</div>`:""}</div></div>`;
    }
    nueva();
    return{accion,pintar,fin(){clearTimeout(timer);},cel(){return fase==="fin"?{pantalla:"fin",juego:"ahorcado",resumen:puntos+" puntos"}:{pantalla:"ahorcado",usadas:[...usadas],puede:fase==="jugando",letras:LET};}};
  }

  /* ---------- 100 Rioplatenses: un celular, juega el grupo ---------- */
  function juegoCien(T,actualizar){
    const MULT=[1,2,3],ERRORES=3;
    const norm=s=>sinTilde(s).replace(/[^A-Z0-9]/g,"");
    const sing=s=>{const f=new Set([s]);if(s.length>4&&s.endsWith("CES"))f.add(s.slice(0,-3)+"Z");if(s.length>3&&s.endsWith("ES")){f.add(s.slice(0,-2));f.add(s.slice(0,-1));}else if(s.length>2&&s.endsWith("S"))f.add(s.slice(0,-1));return f;};
    const misma=(a,b)=>{const fa=sing(a);for(const x of sing(b))if(fa.has(x))return true;return false;};
    /* Misma memoria que el 100 Rioplatenses del celular (gya_cien_rioplatenses.usadas). */
    function elegir(ya){
      let d={};try{d=JSON.parse(localStorage.getItem("gya_cien_rioplatenses")||"{}")||{};}catch(e){}
      let usadas=Array.isArray(d.usadas)?d.usadas:[];let libres=CIEN_PREGUNTAS.filter(p=>!usadas.includes(p.id)&&!ya.includes(p.id));
      if(!libres.length){usadas=[...ya];libres=CIEN_PREGUNTAS.filter(p=>!ya.includes(p.id));}
      const p=libres[Math.floor(Math.random()*libres.length)];usadas.push(p.id);d.usadas=usadas;try{localStorage.setItem("gya_cien_rioplatenses",JSON.stringify(d));}catch(e){}return p;
    }
    let ronda=0,puntos=0,preg=null,abiertas=new Set(),errores=0,fase="jugando",ya=[],timer=null,ultimo=null,cambio=0;
    function nueva(){preg=elegir(ya);ya.push(preg.id);abiertas=new Set();errores=0;fase="jugando";actualizar();}
    function cerrar(){fase="entre";preg.respuestas.forEach((_,i)=>abiertas.add(i));actualizar();clearTimeout(timer);
      timer=setTimeout(()=>{ronda++;if(ronda>=MULT.length){fase="fin";try{const r=JSON.parse(localStorage.getItem("gya_tele_records")||"{}");if(puntos>(r.cien||0)){r.cien=puntos;localStorage.setItem("gya_tele_records",JSON.stringify(r));}}catch(e){}sfx("aplausos");actualizar();}else nueva();},4500);}
    function accion(m){
      if(fase==="fin"){if(m.a==="otra")T.otra();return;}
      if(m.a!=="responder"||fase!=="jugando")return;const v=norm(limpio(m.txt,40));if(!v)return;
      const i=preg.respuestas.findIndex(r=>[r.texto,...r.alias].some(a=>{const an=norm(a);return an&&(an===v||misma(an,v));}));
      cambio=Date.now();
      if(i>=0&&!abiertas.has(i)){abiertas.add(i);puntos+=preg.respuestas[i].puntos*MULT[ronda];ultimo={tipo:"ok",i};sonar(660,.15,"sine",.08);setTimeout(()=>sonar(990,.22,"triangle",.06),140);
        if(abiertas.size===preg.respuestas.length){sfx("aplausos");cerrar();return;}}
      else if(i>=0){ultimo={tipo:"repe",txt:preg.respuestas[i].texto};sonar(420,.1,"sine",.05);}
      else{errores++;ultimo={tipo:"mal",txt:limpio(m.txt,24)};sonar(150,.4,"square",.06);if(errores>=ERRORES){cerrar();return;}}
      actualizar();
    }
    function pintar(raiz,quien){
      if(fase==="fin"){let r={};try{r=JSON.parse(localStorage.getItem("gya_tele_records")||"{}");}catch(e){}
        raiz.innerHTML=`<div class="tl-centro tl-fin"><h1>¡${puntos} puntos! 🎉</h1><p class="tl-ayuda">Récord del grupo en esta tele: ${r.cien||puntos} puntos</p><p class="tl-ayuda">${quien?esc(quien)+": desde el celular podés jugar otra vez o volver al menú.":""}</p></div>`;return;}
      const cat=(typeof CIEN_CATEGORIAS!=="undefined"?CIEN_CATEGORIAS:[]).find(c=>c.id===preg.categoria)||{icono:"💬",nombre:""};
      const panel=preg.respuestas.map((r,i)=>abiertas.has(i)?`<div class="tl-resp tl-abierta"><b>${esc(r.texto)}</b><em>${r.puntos}</em></div>`:`<div class="tl-resp"><b>${i+1}</b></div>`).join("");
      const flash=ultimo&&Date.now()-cambio<1600?(ultimo.tipo==="mal"?`<div class="tl-equis-grande">✘</div>`:ultimo.tipo==="repe"?`<div class="tl-flash tl-paso">${esc(ultimo.txt)} ya está</div>`:""):"";
      raiz.innerHTML=`<div class="tl-cien"><div class="tl-cien-top"><span>${cat.icono} ${esc(cat.nombre)}</span><span>Ronda ${ronda+1}/3 · vale x${MULT[ronda]}</span><span>⭐ ${puntos}</span></div>
        <h1 class="tl-pregunta">${esc(preg.pregunta)}</h1><div class="tl-tablero">${panel}</div>
        <div class="tl-equis">${[0,1,2].map(i=>`<span class="${i<errores?"tl-on":""}">✘</span>`).join("")}</div>
        <p class="tl-ayuda">🎮 ${esc(quien||"…")} escribe lo que dice el grupo</p>${flash}</div>`;
    }
    nueva();
    return{accion,pintar,fin(){clearTimeout(timer);},cel(){return fase==="fin"?{pantalla:"fin",juego:"cien",resumen:puntos+" puntos"}:{pantalla:"cien",puede:fase==="jugando",pregunta:preg.pregunta};}};
  }

  /* =====================================================================
     CELULAR: solo manda lo que toca el jugador y muestra lo que le toca.
     ===================================================================== */
  function iniciarCel(){
    const raiz=document.createElement("div");raiz.id="teleCel";raiz.className="tl-cel";document.body.appendChild(raiz);
    let nombre=limpio(P.get("n")||"",14);try{if(!nombre)nombre=limpio(localStorage.getItem("gya_tele_nombre")||localStorage.getItem("gya_nombre")||"",14);}catch(e){}
    let ultimo=null,conectado=false,visto=0,hola=null,pantallaPintada="";
    let tfRonda=0,tfCategoria=0,tfRespuestas=[],tfInicioReloj=0,tfSegundos=0,tfEnvio=0,tfCompleto=null;
    let pzUltimo={x:.5,y:.5};
    const mandar=m=>{if(red)red.mandar(m);};
    function pedirNombre(){
      raiz.innerHTML=`<div class="tl-cel-caja"><h2>📺 Sala de la tele</h2><p>Código <b>${codCel}</b></p><label>Tu nombre<input id="tlNombre" maxlength="14" value="${esc(nombre)}" placeholder="¿Cómo te llamás?"></label><button type="button" class="tl-boton tl-oro" id="tlEntrar">Entrar</button></div>`;
      const i=raiz.querySelector("#tlNombre");i.focus();
      raiz.querySelector("#tlEntrar").onclick=()=>{nombre=limpio(i.value,14);if(!nombre){i.focus();return;}try{localStorage.setItem("gya_tele_nombre",nombre);}catch(e){}entrar();};
    }
    function entrar(){
      raiz.innerHTML=`<div class="tl-cel-caja"><h2>Conectando con la tele…</h2><p>Código <b>${codCel}</b></p></div>`;
      conectar(codCel,()=>{conectado=true;const h=()=>mandar({t:"hola",n:nombre});h();hola=setInterval(h,4000);
        setTimeout(()=>{if(!ultimo)raiz.innerHTML=`<div class="tl-cel-caja"><h2>No encuentro la tele 🤔</h2><p>Revisá que el código <b>${codCel}</b> sea el que muestra la tele y que la tele siga abierta.</p><button type="button" class="tl-boton" onclick="location.reload()">Probar de nuevo</button><a class="tl-boton tl-chico" href="tele/?cambiar=1">Usar otra tele</a></div>`;},12000);},
        ()=>{raiz.innerHTML=`<div class="tl-cel-caja"><h2>Sin conexión</h2><p>No se pudo conectar (${esc(window.gyaFalloConexion||"sin respuesta")}). Probá con datos del celular.</p><button type="button" class="tl-boton" onclick="location.reload()">Reintentar</button></div>`;},
        m=>{if(m.t==="estado"&&m.cod===codCel){ultimo=m;visto=Date.now();try{localStorage.setItem("gya_tele_vinculada",codCel);}catch(e){}pintar();}});
      window.addEventListener("pagehide",()=>{try{mandar({t:"chau"});}catch(e){}});
    }
    const accion=(a,extra={})=>{mandar({t:"accion",a,...extra});try{if(typeof vibrar==="function")vibrar(25);}catch(e){}};
    function pintarPuzzle(c,cab,soyMando){
      const menu=soyMando?'<button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button>':"";
      const enlazarMenu=()=>{const b=raiz.querySelector("#tlMenu");if(b)b.onclick=()=>{if(confirm("¿Volver al menú? El puzzle queda guardado en la tele."))accion("menu");};};
      if(c.fase==="config"){
        const clave="pz-config-"+JSON.stringify([soyMando,c.cat,c.indice,c.n,c.rot,c.guardado,c.listo,c.lista]);
        if(pantallaPintada===clave)return;pantallaPintada=clave;
        if(!soyMando){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🧩 Eligiendo Puzzle</h2><p>El celular con el control elige la imagen. Después todos podrán mover piezas.</p><button type="button" class="tl-boton" id="tlTomar">Tomar el control</button></div>`;raiz.querySelector("#tlTomar").onclick=()=>mandar({t:"tomar"});return;}
        const slug=c.lista?.[c.indice]||"",src=c.cat==="ciudad"?"assets/worlds/"+slug+".webp":"assets/puzzle/mini/"+slug+".webp";
        const cats={dibujo:"Dibujos",aventura:"Aventuras",heroe:"Héroes",ciudad:"Ciudades",gigante:"Gigantes"};
        const nums=c.cat==="gigante"?[500,1000]:c.cat==="aventura"?[49,70,100,150,300]:[12,25,49,70,100,150,300];
        raiz.innerHTML=cab+`<div class="tl-cel-caja tl-pz-config-cel"><h2>🧩 Elegí el Puzzle</h2>
          <div class="tl-pz-cel-cats">${Object.entries(cats).map(([k,v])=>`<button type="button" data-cat="${k}" class="${k===c.cat?"tl-pz-activo":""}">${v}</button>`).join("")}</div>
          ${slug?`<div class="tl-pz-cel-foto"><button type="button" id="tlPzPrev">‹</button><img src="${src}" alt="${esc(slug.replace(/-/g," "))}"><button type="button" id="tlPzNext">›</button></div><p>${esc(slug.replace(/-/g," "))} · ${c.indice+1}/${c.lista.length}</p>`:"<p>Cargando dibujos…</p>"}
          <div class="tl-pz-cel-nums">${nums.map(v=>`<button type="button" data-n="${v}" class="${v===c.n?"tl-pz-activo":""}">${v} piezas</button>`).join("")}</div>
          <button type="button" class="tl-boton tl-chico" id="tlPzRot">${c.rot?"🔄 Con giros · tocar para quitar":"Sin giros · tocar para activar"}</button>
          <button type="button" class="tl-boton tl-oro" id="tlPzStart" ${!slug||!c.listo?"disabled":""}>▶ Empezar</button>
          ${c.guardado?'<button type="button" class="tl-boton" id="tlPzResume">↪ Continuar el guardado</button>':""}${menu}</div>`;
        raiz.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>accion("pz_categoria",{cat:b.dataset.cat}));
        raiz.querySelectorAll("[data-n]").forEach(b=>b.onclick=()=>accion("pz_piezas",{n:Number(b.dataset.n)}));
        const prev=raiz.querySelector("#tlPzPrev"),next=raiz.querySelector("#tlPzNext");if(prev)prev.onclick=()=>accion("pz_imagen_elegir",{delta:-1});if(next)next.onclick=()=>accion("pz_imagen_elegir",{delta:1});
        raiz.querySelector("#tlPzRot").onclick=()=>accion("pz_rotacion",{rot:!c.rot});
        raiz.querySelector("#tlPzStart").onclick=()=>accion("pz_inicio");raiz.querySelector("#tlPzResume")?.addEventListener("click",()=>accion("pz_continuar"));enlazarMenu();return;
      }
      if(c.fase==="cargando"){
        if(pantallaPintada==="pz-cargando")return;pantallaPintada="pz-cargando";
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🧩 Armando piezas…</h2><p>El tablero va a aparecer en la tele.</p>${menu}</div>`;enlazarMenu();return;
      }
      if(c.fase==="fin"){
        if(pantallaPintada==="pz-fin-"+soyMando)return;pantallaPintada="pz-fin-"+soyMando;
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🏆 ¡Puzzle completo!</h2><p>${c.estado.n} piezas · ${Math.floor(c.estado.tiempo/60000)} min ${Math.floor(c.estado.tiempo%60000/1000)} s</p>${soyMando?'<button type="button" class="tl-boton tl-oro" id="tlPzOtro">Elegir otro Puzzle</button>':""}${menu}</div>`;
        raiz.querySelector("#tlPzOtro")?.addEventListener("click",()=>accion("pz_config"));enlazarMenu();return;
      }
      if(pantallaPintada!=="pz-juego"){
        pantallaPintada="pz-juego";
        raiz.innerHTML=cab+`<div class="tl-cel-caja tl-pz-control"><h2>🧩 Mirá la tele</h2><p id="tlPzEstado">Mové las piezas con el dedo acá abajo.</p>
          <div id="tlPzPad" class="tl-pz-pad" role="application" aria-label="Control táctil del puzzle"><span id="tlPzDot"></span><em>Arrastrá una pieza mirando la tele</em></div>
          <div class="tl-pz-cel-herr"><button type="button" data-op="pz_girar">🔄 Girar</button><button type="button" data-op="pz_acercar">＋ Zoom</button><button type="button" data-op="pz_alejar">－ Zoom</button><button type="button" data-op="pz_encuadrar">⤢ Ver todo</button><button type="button" data-op="pz_guia">👁 Guía</button><button type="button" data-op="pz_imagen">🖼️ Imagen</button></div>
          ${soyMando?'<button type="button" class="tl-boton tl-chico" id="tlPzOtro">Elegir otro Puzzle</button>':""}${menu}</div>`;
        const pad=raiz.querySelector("#tlPzPad"),dot=raiz.querySelector("#tlPzDot");let dedo=null,ultimoEnvio=0;
        const punto=e=>{const r=pad.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};};
        const gesto=(a,p)=>{pzUltimo=p;dot.style.left=p.x*100+"%";dot.style.top=p.y*100+"%";mandar({t:"accion",a,...p});};
        pad.onpointerdown=e=>{if(dedo!==null||ultimo?.cel?.dueno&&ultimo.cel.dueno!==yo)return;e.preventDefault();dedo=e.pointerId;try{pad.setPointerCapture(dedo);}catch(_){}gesto("pz_bajar",punto(e));};
        pad.onpointermove=e=>{if(dedo!==e.pointerId)return;e.preventDefault();const p=punto(e);dot.style.left=p.x*100+"%";dot.style.top=p.y*100+"%";pzUltimo=p;if(performance.now()-ultimoEnvio>55){ultimoEnvio=performance.now();gesto("pz_mover",p);}};
        const soltar=e=>{if(dedo!==e.pointerId)return;e.preventDefault();dedo=null;gesto("pz_soltar",punto(e));};pad.onpointerup=soltar;pad.onpointercancel=soltar;
        raiz.querySelectorAll("[data-op]").forEach(b=>b.onclick=()=>accion(b.dataset.op,pzUltimo));
        raiz.querySelector("#tlPzOtro")?.addEventListener("click",()=>{if(confirm("¿Elegir otro Puzzle? El actual queda guardado en la tele."))accion("pz_config");});enlazarMenu();
      }
      const estado=raiz.querySelector("#tlPzEstado");if(estado)estado.textContent=`${c.estado.pct}% armado · ${c.estado.n} piezas${c.dueno&&c.dueno!==yo?" · "+c.nombreDueno+" mueve una pieza":""}`;
    }
    function pintarTutti(c,cab,soyMando){
      const ronda=c.r||0,cats=c.cats||[],jug=c.jug||[],mis=jug.find(j=>j.pid===yo);
      if(!mis){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>Esperá a la próxima partida</h2></div>`;return;}
      const clave="gya_tele_tf_"+codCel+"_"+ronda;
      if(tfRonda!==ronda){tfRonda=ronda;tfCategoria=0;tfCompleto=null;tfEnvio=0;
        try{const v=JSON.parse(sessionStorage.getItem(clave)||"[]");tfRespuestas=Array.isArray(v)?v.slice(0,cats.length):[];}catch(e){tfRespuestas=[];}
        pantallaPintada="";}
      const guardar=()=>{try{sessionStorage.setItem(clave,JSON.stringify(tfRespuestas));}catch(e){}};
      const completas=()=>cats.length>0&&cats.every((_,i)=>{const v=(tfRespuestas[i]||"").trim();return v.length>=2&&sinTilde(v)[0]===c.letra;});
      const mandarProgreso=()=>{const v=completas();if(v!==tfCompleto){tfCompleto=v;accion("progreso",{r:ronda,completo:v});}};
      const enviar=()=>{tfEnvio=Date.now();accion("respuesta",{r:ronda,respuestas:tfRespuestas});};
      const menu=soyMando?'<button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button>':"";
      const enlazarMenu=()=>{const b=raiz.querySelector("#tlMenu");if(b)b.onclick=()=>{if(confirm("¿Terminar la partida y volver al menú?"))accion("menu");};};
      if(c.fase==="jugando"){
        /* El reloj llega cada 2,5 s; no se reconstruye el formulario con el teclado abierto. */
        if(pantallaPintada!=="tf-juego-"+ronda){
          pantallaPintada="tf-juego-"+ronda;
          raiz.innerHTML=cab+`<div class="tl-cel-caja tl-tf-juego"><div class="tl-tf-cab"><span>Ronda ${ronda}/3 · Letra <b>${esc(c.letra)}</b></span><strong id="tlTfReloj"></strong></div>
            <div class="tl-tf-cats">${cats.map((cat,i)=>`<button type="button" data-cat="${i}" class="${tfRespuestas[i]?"tl-tf-hecha":""}">${esc(cat)} ${tfRespuestas[i]?"✓":""}</button>`).join("")}</div>
            <label id="tlTfLabel">${esc(cats[tfCategoria]||"")}<input id="tlTfPalabra" maxlength="30" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Con ${esc(c.letra)}"></label>
            <div class="tl-tf-navega"><button type="button" class="tl-boton" id="tlTfAnterior">← Anterior</button><button type="button" class="tl-boton tl-oro" id="tlTfSiguiente">Siguiente →</button></div>
            <button type="button" class="tl-boton tl-tf-basta" id="tlTfBasta" disabled>¡BASTA! · Enviar todo</button><p id="tlTfAyuda">Completá todas las categorías para cantar basta.</p>${menu}</div>`;
          const input=raiz.querySelector("#tlTfPalabra");
          const actualizarCampo=()=>{const botones=raiz.querySelectorAll("[data-cat]");botones.forEach((b,i)=>{b.classList.toggle("tl-tf-activa",i===tfCategoria);b.classList.toggle("tl-tf-hecha",!!tfRespuestas[i]);b.textContent=cats[i]+(tfRespuestas[i]?" ✓":"");});
            raiz.querySelector("#tlTfLabel").firstChild.textContent=cats[tfCategoria]||"";input.value=tfRespuestas[tfCategoria]||"";input.placeholder="Con "+c.letra;raiz.querySelector("#tlTfBasta").disabled=!completas();};
          const salvar=()=>{tfRespuestas[tfCategoria]=limpio(input.value,30);guardar();mandarProgreso();const b=raiz.querySelector(`[data-cat="${tfCategoria}"]`);if(b){b.classList.toggle("tl-tf-hecha",!!tfRespuestas[tfCategoria]);b.textContent=cats[tfCategoria]+(tfRespuestas[tfCategoria]?" ✓":"");}raiz.querySelector("#tlTfBasta").disabled=!completas();};
          input.oninput=salvar;input.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();salvar();tfCategoria=Math.min(cats.length-1,tfCategoria+1);actualizarCampo();input.focus();}};
          raiz.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{salvar();tfCategoria=Number(b.dataset.cat);actualizarCampo();input.focus();});
          raiz.querySelector("#tlTfAnterior").onclick=()=>{salvar();tfCategoria=Math.max(0,tfCategoria-1);actualizarCampo();input.focus();};
          raiz.querySelector("#tlTfSiguiente").onclick=()=>{salvar();tfCategoria=Math.min(cats.length-1,tfCategoria+1);actualizarCampo();input.focus();};
          raiz.querySelector("#tlTfBasta").onclick=()=>{salvar();if(!completas())return;accion("basta",{r:ronda,respuestas:tfRespuestas});raiz.querySelector("#tlTfBasta").disabled=true;raiz.querySelector("#tlTfAyuda").textContent="¡BASTA! Esperando a los demás…";setTimeout(()=>{const b=raiz.querySelector("#tlTfBasta");if(b)b.disabled=false;},1800);};
          actualizarCampo();enlazarMenu();mandarProgreso();
        }
        tfInicioReloj=Date.now();tfSegundos=c.resta||0;
        const reloj=raiz.querySelector("#tlTfReloj");if(reloj)reloj.textContent=Math.ceil(tfSegundos/1000)+" s";
        return;
      }
      if(c.fase==="cortada"||c.fase==="validando"){
        if(c.fase==="cortada"&&!c.recibidas?.[yo]&&Date.now()-tfEnvio>1200)enviar();
        const id="tf-espera-"+ronda+"-"+c.fase;if(pantallaPintada===id)return;pantallaPintada=id;
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>${c.fase==="cortada"?"¡BASTA!":"Revisando respuestas…"}</h2><p>${c.fase==="cortada"?"Se enviaron las palabras. Esperá los puntajes.":"La revisión se abre en todos los celulares."}</p>${menu}</div>`;enlazarMenu();return;
      }
      const clavePantalla=JSON.stringify([c.fase,c.puntos,c.pendientes,c.anuladas,c.extra,c.totales,c.historial,soyMando]);if(pantallaPintada===clavePantalla)return;pantallaPintada=clavePantalla;
      if(c.fase==="fin"){
        const orden=[...jug].sort((a,b)=>(c.ganadas[b.pid]||0)-(c.ganadas[a.pid]||0)||(c.totales[b.pid]||0)-(c.totales[a.pid]||0));
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🏆 Resultado final</h2>${orden.map((j,i)=>`<p>${["🥇","🥈","🥉"][i]||""} <b>${esc(j.n)}</b> · ${c.totales[j.pid]||0} puntos · ${c.ganadas[j.pid]||0} rondas</p>`).join("")}${soyMando?`<button type="button" class="tl-boton tl-oro" id="tlTfOtra">Jugar otra vez</button>${menu}`:""}</div>`;
        const otra=raiz.querySelector("#tlTfOtra");if(otra)otra.onclick=()=>accion("otra");enlazarMenu();return;
      }
      const pendientes=Object.entries(c.pendientes||{}),puntos=c.puntos||{};
      raiz.innerHTML=cab+`<div class="tl-cel-caja tl-tf-result"><h2>Letra ${esc(c.letra)} · ronda ${ronda}/3</h2><p>Revisá las palabras y los puntos. La tele solo muestra los totales.</p>
        <div class="tl-tf-total">${jug.map(j=>`<span>${esc(j.n)} <b>+${(puntos[j.pid]||[]).reduce((x,y)=>x+y,0)}</b></span>`).join("")}</div>
        ${cats.map((cat,i)=>`<section class="tl-tf-revision"><h3>${esc(cat)}</h3>${jug.map(j=>{const v=c.respuestas?.[j.pid]?.[i]||"",p=puntos[j.pid]?.[i]||0,k=j.pid+"|"+i,pend=pendientes.some(([,o])=>o.a===j.pid&&o.i===i);
          return`<div class="tl-tf-palabra"><span><b>${esc(j.n)}</b>: ${esc(v)||"—"}${c.anuladas?.[k]?" · anulada":""}</span><strong>${p}</strong>${v&&!pend&&j.pid===yo&&!c.marcas?.[j.pid]?.[i]&&!c.resueltas?.["apelar:"+k]?`<button data-apelar="${i}" type="button">Apelar</button>`:""}${p>0&&!pend&&j.pid!==yo&&!c.resueltas?.["anular:"+k]?`<button data-anular="${esc(j.pid)}|${i}" type="button">Anular</button>`:""}</div>`;}).join("")}</section>`).join("")}
        ${pendientes.filter(([,p])=>p.solicita!==yo).map(([id,p])=>`<div class="tl-tf-voto"><p>${p.tipo==="apelar"?"Apelación":"Pedido de anulación"}: <b>${esc((jug.find(j=>j.pid===p.a)||{}).n)}</b> · ${esc(c.cats[p.i])} · ${esc(c.respuestas?.[p.a]?.[p.i]||"")}</p>
          ${p.tipo==="apelar"?[0,5,10,20].map(n=>`<button data-decidir="${esc(id)}" data-p="${n}" type="button">${n} puntos</button>`).join(""):`<button data-decidir="${esc(id)}" data-v="1" type="button">Sí, anular</button><button data-decidir="${esc(id)}" data-v="0" type="button">Mantener</button>`}</div>`).join("")}
        ${pendientes.some(([,p])=>p.solicita===yo)?"<p>Esperando que otro jugador decida tu apelación.</p>":""}
        ${soyMando?`<button type="button" class="tl-boton tl-oro" id="tlTfSiguienteRonda" ${pendientes.length?"disabled":""}>${ronda===3?"Ver resultado final":"Siguiente letra →"}</button>${menu}`:""}</div>`;
      raiz.querySelectorAll("[data-apelar]").forEach(b=>b.onclick=()=>accion("apelar",{r:ronda,aid:yo,i:Number(b.dataset.apelar)}));
      raiz.querySelectorAll("[data-anular]").forEach(b=>b.onclick=()=>{const [aid,i]=b.dataset.anular.split("|");accion("anular",{r:ronda,aid,i:Number(i)});});
      raiz.querySelectorAll("[data-decidir]").forEach(b=>b.onclick=()=>accion("decidir",{r:ronda,id:b.dataset.decidir,...(b.dataset.p!==undefined?{p:Number(b.dataset.p)}:{v:b.dataset.v==="1"})}));
      const sig=raiz.querySelector("#tlTfSiguienteRonda");if(sig)sig.onclick=()=>accion("siguiente",{r:ronda});enlazarMenu();
    }
    function pintar(){
      const m=ultimo;if(!m)return;const soyMando=m.mando===yo,c=m.cel||{},clave=JSON.stringify([soyMando,c,m.jug.length]);
      if(c.pantalla!=="tutti"&&c.pantalla!=="puzzle"&&clave===pantallaPintada)return;
      const escribiendo=document.activeElement&&document.activeElement.id==="tlTexto"?document.activeElement.value:"";
      if(c.pantalla!=="tutti"&&c.pantalla!=="puzzle")pantallaPintada=clave;
      const cab=`<div class="tl-cel-cab">📺 Sala ${esc(m.cod)} · ${esc(nombre)}${soyMando?" · 🎮":""}</div>`;
      if(!m.jug.some(j=>j.pid===yo)){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>Entrando…</h2></div>`;return;}
      if(c.pantalla==="ruleta"){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🎡 La Ruleta</h2><p>La Ruleta tiene su propia entrada. Cuando la tele muestre el código nuevo, tocá acá y ponelo:</p><a class="tl-boton tl-oro" href="tv.html">Entrar a la Ruleta</a></div>`;return;}
      if(c.pantalla==="tutti"){pintarTutti(c,cab,soyMando);return;}
      if(c.pantalla==="puzzle"){pintarPuzzle(c,cab,soyMando);return;}
      if(!soyMando){
        const mando=(m.jug.find(j=>j.pid===m.mando)||{}).n||"otro";
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>Mirá la tele 📺</h2><p>El control lo tiene <b>${esc(mando)}</b>. Ayudalo con las respuestas 😉</p><button type="button" class="tl-boton" id="tlTomar">Tomar el control</button></div>`;
        raiz.querySelector("#tlTomar").onclick=()=>mandar({t:"tomar"});return;}
      if(c.pantalla==="menu"){
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>¿A qué juegan?</h2><div class="tl-cel-juegos">${(c.juegos||[]).map(j=>`<button type="button" class="tl-boton${j.ok?"":" tl-pronto"}" data-j="${esc(j.id)}" ${j.ok?"":"disabled"}>${esc(j.nombre)}${j.ok?"":" · pronto"}</button>`).join("")}</div></div>`;
        raiz.querySelectorAll("[data-j]").forEach(b=>b.onclick=()=>accion("elegir",{juego:b.dataset.j}));return;}
      const menu=`<button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button>`;
      if(c.pantalla==="fin"){
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>¡Terminó! 🎉</h2><p>${esc(c.resumen||"")}</p><button type="button" class="tl-boton tl-oro" id="tlOtra">Jugar otra vez</button>${menu}</div>`;
        raiz.querySelector("#tlOtra").onclick=()=>accion("otra");raiz.querySelector("#tlMenu").onclick=()=>accion("menu");return;}
      if(c.pantalla==="rosco"||c.pantalla==="cien"){
        const rosco=c.pantalla==="rosco";
        raiz.innerHTML=cab+`<div class="tl-cel-caja">${rosco?`<div class="tl-cel-letra">${esc(c.letra)}</div><p>${esc(c.regla||"")}</p>`:`<p class="tl-cel-preg">${esc(c.pregunta||"")}</p>`}
          <input id="tlTexto" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${rosco?"Tu respuesta":"Lo que dice el grupo"}" ${!rosco&&!c.puede?"disabled":""}>
          <button type="button" class="tl-boton tl-oro" id="tlEnviar" ${!rosco&&!c.puede?"disabled":""}>Enviar</button>
          ${rosco?`<button type="button" class="tl-boton" id="tlPasar">⏭ Pasar</button>`:""}${menu}</div>`;
        const t=raiz.querySelector("#tlTexto");if(escribiendo)t.value=escribiendo;
        const enviar=()=>{const v=t.value.trim();if(!v)return;accion("responder",{txt:v});t.value="";t.focus();};
        raiz.querySelector("#tlEnviar").onclick=enviar;t.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();enviar();}};
        if(rosco)raiz.querySelector("#tlPasar").onclick=()=>{accion("pasar");t.value="";t.focus();};
        raiz.querySelector("#tlMenu").onclick=()=>{if(confirm("¿Volver al menú? Se termina este juego."))accion("menu");};
        if(c.puede!==false)t.focus();return;}
      if(c.pantalla==="ahorcado"){
        const us=new Set(c.usadas||[]);
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>${c.puede?"Elegí una letra":"Mirá la tele…"}</h2><div class="tl-cel-teclado">${[...(c.letras||"")].map(l=>`<button type="button" data-l="${l}" ${us.has(l)||!c.puede?"disabled":""}>${l}</button>`).join("")}</div>${menu}</div>`;
        raiz.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{b.disabled=true;accion("letra",{l:b.dataset.l});});
        raiz.querySelector("#tlMenu").onclick=()=>{if(confirm("¿Volver al menú? Se termina este juego."))accion("menu");};return;}
      raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>Mirá la tele 📺</h2></div>`;
    }
    /* Si la tele deja de contestar, avisar. */
    setInterval(()=>{const el=raiz.querySelector("#tlTfReloj");if(el){const ms=Math.max(0,tfSegundos-(Date.now()-tfInicioReloj));el.textContent=Math.ceil(ms/1000)+" s";el.classList.toggle("tl-urgente",ms<=10000);}},250);
    setInterval(()=>{if(conectado&&ultimo&&Date.now()-visto>12000){pantallaPintada="";raiz.innerHTML=`<div class="tl-cel-caja"><h2>La tele no responde 📺</h2><p>Revisá que la tele siga abierta y con internet.</p></div>`;}},4000);
    if(nombre&&P.get("n"))entrar();else pedirNombre();
  }

  const arrancar=()=>{if(esTele)iniciarTele();else iniciarCel();};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrancar);else arrancar();
})();
