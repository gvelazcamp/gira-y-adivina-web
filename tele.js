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
  let codCel=(P.get("telecel")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  let esCel=!!codCel&&!esTele;
  const CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const yo=(()=>{try{let id=sessionStorage.getItem("gya_tele_pid");if(!id){id="t"+Math.random().toString(36).slice(2,10);sessionStorage.setItem("gya_tele_pid",id);}return id;}catch(e){return"t"+Math.random().toString(36).slice(2,10);}})();
  const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const limpio=(s,max)=>String(s||"").replace(/[<>&"'\u0000-\u001F]/g,"").trim().slice(0,max);
  const mezclar=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const sinTilde=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
  const sonar=(f,d,t,g)=>{try{if(typeof bip==="function")bip(f,d,t,g);}catch(e){}};
  const sfx=id=>{try{if(typeof sonarSFX==="function")sonarSFX(id);}catch(e){}};
  /* Sonidos iguales en todos los juegos de la tele (30/10/2026): acierto, error, cuenta regresiva,
     arranque, tiempo que se acaba y turno/palabra/ronda nueva. */
  const SND={
    ok(){sonar(720,.12,"triangle",.08);setTimeout(()=>sonar(980,.2,"sine",.08),110);},
    mal(){sonar(170,.3,"sawtooth",.05);},
    tic(){sonar(520,.06,"sine",.04);},
    arranca(){sonar(880,.18,"triangle",.07);},
    tiempo(){sonar(330,.18,"square",.05);setTimeout(()=>sonar(220,.5,"square",.05),190);},
    turno(){sonar(660,.1,"sine",.05);setTimeout(()=>sonar(880,.16,"triangle",.06),100);}
  };
  /* Últimos 5 segundos del reloj: un tic por segundo. */
  const ticFinal=(antes,ahora)=>{const a=Math.ceil(antes/1000),b=Math.ceil(ahora/1000);if(b!==a&&b>0&&b<=5)SND.tic();};
  /* Cierre con podio para todos los juegos (30/10/2026), como el del Rosco: estudio, Giro festejando, ganador,
     podio (1.º al medio), papelitos, aplausos y la voz de Giro. Se cierra solo a los 10 s, tocando o con OK. */
  let podio=null;
  function cerrarPodio(){if(!podio)return;const p=podio;podio=null;clearTimeout(p.t);document.removeEventListener("keydown",p.k,true);p.el.classList.add("tl-podio-sale");setTimeout(()=>p.el.remove(),500);}
  function podioTele(o){
    cerrarPodio();const GB="presentacion-y-locucion-extensiones/Giro/";
    const filas=(o.filas||[]).slice(0,8),top=filas.slice(0,3),orden=[top[1],top[0],top[2]];
    const el=document.createElement("div");el.className="tl-podio";el.setAttribute("role","dialog");el.setAttribute("aria-label",o.titulo||"Resultado");
    const cols=["#F5B301","#E5197C","#37D6C0","#7B3FE4","#2F9BFF","#FF7A1A","#fff"];let conf="";
    for(let i=0;i<110;i++)conf+=`<i style="left:${Math.random()*100}%;background:${cols[i%cols.length]};animation-delay:${(Math.random()*2.6).toFixed(2)}s;animation-duration:${(2.8+Math.random()*2.4).toFixed(2)}s;--g:${Math.round(Math.random()*720-360)}deg"></i>`;
    el.innerHTML=`<img class="tl-podio-fondo" src="${GB}estudios/Giro_estudio_principal_16x9.webp" alt="">
      <img class="tl-podio-giro" src="${GB}Giro_festejando_cuerpo.webp" alt="">
      <div class="tl-podio-caja"><p class="tl-podio-juego">${esc(o.juego||"")}</p><h1>${esc(o.titulo||"")}</h1>${o.sub?`<p class="tl-podio-sub">${esc(o.sub)}</p>`:""}
        ${o.equipo?`<div class="tl-podio-equipo">${filas[0]&&filas[0].av&&fotoFestejo(filas[0].av)?`<span>${esc(filas[0].n)}</span><img class="tl-podio-av" src="${fotoFestejo(filas[0].av)}" alt="" onerror="this.remove()"><div class="tl-podio-base"></div><b>${esc(filas[0].pts)}</b>`:`<b>${esc(filas[0]?filas[0].pts:"")}</b><span>${esc(filas[0]?filas[0].n:"")}</span>`}</div>`:
        `<div class="tl-podio-gradas">${orden.map((f,k)=>f?`<div class="tl-podio-col tl-podio-p${k===1?1:k===0?2:3}"><span class="tl-podio-nom">${k===1?"👑 ":""}${esc(f.n)}</span><span class="tl-podio-pts">${esc(f.pts)}</span>${f.av&&fotoFestejo(f.av)?`<img class="tl-podio-av" src="${fotoFestejo(f.av)}" alt="" onerror="this.remove()">`:""}<div class="tl-podio-escalon">${k===1?1:k===0?2:3}</div></div>`:"<div></div>").join("")}</div>
        ${filas.length>3?`<p class="tl-podio-resto">${filas.slice(3).map((f,i)=>`${i+4}. ${esc(f.n)} · ${esc(f.pts)}`).join(" &nbsp; ")}</p>`:""}`}</div>
      <div class="tl-podio-conf">${conf}</div>`;
    document.body.appendChild(el);
    sfx("aplausos");setTimeout(()=>sfx("festejo"),400);
    try{const a=new Audio(GB+"voz/reacciones/giro-acierto-"+(1+Math.floor(Math.random()*4))+".mp3");setTimeout(()=>a.play().catch(()=>{}),900);}catch(e){}
    const k=e=>{if(e.key==="Enter"||e.key==="Escape"||e.key===" "){e.preventDefault();e.stopPropagation();cerrarPodio();}};
    el.addEventListener("click",cerrarPodio);document.addEventListener("keydown",k,true);
    podio={el,k,t:setTimeout(cerrarPodio,10000)};
  }
  const nombreDe=(T,pid)=>{const j=T.jug.find(x=>x.pid===pid);return j?j.n:"Jugador";};
  /* Cada uno juega con su avatar (30/10/2026): atril (assets/atril/<avatar>.webp, los 35 gratis + el de Gonzalo)
     y festejo (assets/festejos, mapa RTV_AVATAR_FESTEJO de index.html). Si no hay, queda el personaje genérico. */
  const ATRIL_AV=new Set([...Array.from({length:22},(_,i)=>"avatar-"+String(i+1).padStart(2,"0")),"avatar-33",...Array.from({length:13},(_,i)=>"avatar-"+(42+i))]);
  const avDe=(T,pid)=>{const j=T.jug.find(x=>x.pid===pid);return j&&j.av||"";};
  const fotoAtril=av=>ATRIL_AV.has(av)?"assets/atril/"+av+".webp":"";
  const fotoFestejo=av=>{try{if(typeof RTV_AVATAR_FESTEJO!=="undefined"&&RTV_AVATAR_FESTEJO[av])return "assets/festejos/"+RTV_AVATAR_FESTEJO[av]+".webp";}catch(e){}return fotoAtril(av);};
  const JUEGOS=[
    {id:"rosco",nombre:"El Rosco",icono:"assets/rosco/logo.webp",desc:"Juega uno, los demás miran",ok:true},
    {id:"silabario",nombre:"Silabario",icono:"logo-silabario-rioplatense.svg",desc:"Armá la palabra con las sílabas",ok:true},
    {id:"frases",nombre:"Frases en Giro",icono:"logo-frases-en-giro.svg",desc:"Ordená la frase antes que nadie",ok:true},
    {id:"ahorcado",nombre:"Ahorcado",icono:"assets/ahorcado/logo.webp",desc:"El celular es el teclado",ok:true},
    {id:"cien",nombre:"100 Rioplatenses",icono:"assets/cien/logo.webp",desc:"Un celular, juega el grupo",ok:true},
    {id:"ruleta",nombre:"La Ruleta",icono:"assets/logo.webp",desc:"Cada uno con su celular",ok:true},
    {id:"tutti",nombre:"Tutti Frutti",icono:"assets/tutti/logo.webp",desc:"Todos juegan desde su celular",ok:true},
    {id:"sopa",nombre:"Sopa Fugaz",icono:"logo-sopa-fugaz.svg",desc:"Encontrá las palabras antes que los demás",ok:true},
    /* El Puzzle no andaba bien en la tele (31/10/2026): se cambió por Sopa Fugaz. Su código (juegoPuzzle) queda por si vuelve. */
    {id:"duelo",nombre:"Duelo de Conocimiento",icono:"logo-duelo-conocimiento.webp",desc:"Respondé hablando al celular",ok:true},
    {id:"quien",nombre:"¿Quién soy?",icono:"assets/quien-soy/icono.webp",desc:"La tele muestra quién sos: adiviná de espaldas",ok:true},
    {id:"mimica",nombre:"Mímica",icono:"assets/mimica/icono.webp",desc:"Uno de espaldas adivina, los demás actúan",ok:true},
    {id:"numero",nombre:"¿Qué número soy?",icono:"assets/que-numero-soy/icono.webp",desc:"La tele muestra el número: adiviná de espaldas",ok:true}
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
    try{if(typeof detenerMusica==="function")detenerMusica();}catch(e){}
    try{if(typeof cortarSFX==="function")cortarSFX();}catch(e){}
    ["tutChequearBienvenida","ptChequearAutoPopup","mostrarPromptIOS","pdChequearAutoPopup"].forEach(f=>{try{if(typeof window[f]==="function")window[f]=()=>{};}catch(e){}});
  }
  /* Pantalla siempre encendida (31/10/2026, Gonzalo: "se nos apaga por inactividad jugando por audio"): en la tele
     y en los celulares de la sala se pide el Wake Lock y se vuelve a pedir cada vez que la app vuelve a primer plano. */
  let wakeTele=null,wakeOn=false;
  async function pedirWakeTele(){try{if(wakeOn&&"wakeLock" in navigator&&!wakeTele&&document.visibilityState==="visible"){wakeTele=await navigator.wakeLock.request("screen");wakeTele.addEventListener("release",()=>{wakeTele=null;});}}catch(e){wakeTele=null;}}
  function despierta(){wakeOn=true;pedirWakeTele();}
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")pedirWakeTele();});
  ["pointerdown","keydown"].forEach(ev=>document.addEventListener(ev,()=>{if(wakeOn&&!wakeTele)pedirWakeTele();},{passive:true}));

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
  /* ---------- Botón 📺 de la pantalla de inicio (prueba, solo Gonzalo, 31/10/2026) ----------
     Como el ícono de transmitir de YouTube: si hay una tele con Chromecast/Google TV en el wifi,
     se elige y la tele abre la sala sola (Presentation API de Chrome) y este celular queda
     conectado sin escribir código. Si no, muestra las otras dos formas: girayadivina.com/tele con
     código, o duplicar la pantalla del celular. */
  /* Menú del 📺: las 3 formas de jugar en la tele. Al elegir una, un popup la explica con su
     dibujo (assets/tele/), los pasos y el botón para hacerla. */
  const FORMAS_TELE=[
    {id:"transmitir",tag:"⭐ LA MÁS FÁCIL",titulo:"📡 Transmitir",para:"Teles con Play Store, Google TV o Chromecast (como la Panavox).",
      pasos:["Tele y celular en el <b>mismo wifi</b>.","Tocá <b>«Buscar teles»</b> y elegí tu tele.","La tele abre la sala sola y tu celular queda de control."],
      pie:"✔ Sin navegador · sin código · 1 celular alcanza",boton:"📡 Buscar teles"},
    {id:"codigo",tag:"🔢 CON CÓDIGO",titulo:"🌐 Navegador de la tele",para:"Teles con navegador (Samsung, LG, cualquiera con internet).",
      pasos:["En la tele entrá a <b>girayadivina.com/tele</b>.","Tocá <b>«Esta pantalla es la tele»</b>: sale un código.","En el celular poné tu nombre y ese <b>código</b>.","No hace falta el mismo wifi."],
      pie:"✔ Anda en casi todas · hay que escribir el código",boton:"🔢 Poner el código"},
    {id:"celular-tele",tag:"📱 PLAN B",titulo:"📱➜📺 Un celular de tele",para:"Teles sin navegador ni Chromecast: un celular hace de tele y se emite.",
      pasos:["En el celular que va a ser la tele tocá <b>«Este celular es la tele»</b>.","Ese celular hace <b>«Emitir»</b> (o Smart View) a la tele y queda acostado al lado.","Los demás se unen desde su celular con el <b>código</b>."],
      pie:"✔ Cualquier tele que acepte emitir · hacen falta 2 celulares",boton:"📱 Este celular es la tele"}
  ];
  function compartirPantalla(){
    document.querySelector(".tl-cast-capa")?.remove();
    const capa=document.createElement("div");capa.className="tl-cast-capa";document.body.appendChild(capa);
    const cerrar=()=>capa.remove();capa.addEventListener("click",e=>{if(e.target===capa)cerrar();});
    const menu=()=>{
      capa.innerHTML=`<div class="tl-cast-caja" role="dialog" aria-label="Jugar en la tele"><button type="button" class="tl-cast-x" aria-label="Cerrar">✕</button>
        <h2>📺 Jugar en la tele</h2><p class="tl-cast-sub">Elegí según la tele que tengas</p>
        ${FORMAS_TELE.map((f,i)=>`<button type="button" class="tl-cast-forma${i===0?" tl-cast-uno":""}" data-f="${f.id}"><img src="assets/tele/${f.id}.webp" alt=""><span><small>${f.tag}</small><b>${f.titulo}</b><em>${f.para}</em></span></button>`).join("")}</div>`;
      capa.querySelector(".tl-cast-x").onclick=cerrar;
      capa.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>detalle(FORMAS_TELE.find(f=>f.id===b.dataset.f)));
    };
    const detalle=f=>{
      const hayCast=typeof window.PresentationRequest==="function";
      capa.innerHTML=`<div class="tl-cast-caja" role="dialog" aria-label="${f.titulo}"><button type="button" class="tl-cast-x" aria-label="Cerrar">✕</button>
        <span class="tl-cast-tag">${f.tag}</span><h2>${f.titulo}</h2><p class="tl-cast-sub">${f.para}</p>
        <img class="tl-cast-dibujo" src="assets/tele/${f.id}.webp" alt="">
        <ol class="tl-cast-pasos">${f.pasos.map(p=>`<li>${p}</li>`).join("")}</ol><p class="tl-cast-pie">${f.pie}</p>
        <button type="button" class="tl-cast-btn" id="tlCastIr" ${f.id==="transmitir"&&!hayCast?"disabled":""}>${f.id==="transmitir"&&!hayCast?"Este celular no lo permite":f.boton}</button>
        <p class="tl-cast-estado" id="tlCastEstado">${f.id==="transmitir"&&!hayCast?"Abrí girayadivina.com en Chrome y probá de nuevo.":""}</p>
        <button type="button" class="tl-cast-btn tl-cast-sec" id="tlCastVolver">⟵ Ver las otras formas</button></div>`;
      capa.querySelector(".tl-cast-x").onclick=cerrar;capa.querySelector("#tlCastVolver").onclick=menu;
      const estado=t=>{const el=capa.querySelector("#tlCastEstado");if(el)el.textContent=t;};
      const ir=capa.querySelector("#tlCastIr");
      if(f.id==="codigo"){ir.onclick=()=>{location.href="tele/";};return;}
      if(f.id==="celular-tele"){ir.onclick=()=>{location.href="index.html?tele=1";};return;}
      if(!hayCast)return;
      try{new PresentationRequest([location.href]).getAvailability().then(a=>{const pinta=()=>estado(a.value?"✅ Hay una tele disponible en tu wifi":"No veo teles con Chromecast en tu wifi (igual podés buscar).");pinta();a.onchange=pinta;}).catch(()=>{});}catch(e){}
      ir.onclick=()=>{estado("Buscando teles…");transmitirDirecto(n=>{
        if(n==="ok"){estado("¡Conectado! La tele está abriendo la sala…");setTimeout(cerrar,800);}
        else if(n==="NotAllowedError"||n==="AbortError")estado("");
        else if(n==="NotFoundError")estado("No encontré teles con Chromecast en tu wifi. Probá con el código o con un celular de tele.");
        else estado("No se pudo transmitir ("+n+"). Probá con el código.");});};
    };
    menu();
  }
  function transmitirDirecto(aviso){
    if(typeof window.PresentationRequest!=="function"){aviso&&aviso("NotSupportedError");return;}
    let nombre="";try{nombre=limpio((typeof perfil!=="undefined"&&perfil&&perfil.nombre)||localStorage.getItem("gya_tele_nombre")||"",14);}catch(e){}
    const cod=Array.from({length:5},()=>CHARS[Math.floor(Math.random()*CHARS.length)]).join("");
    let pedido;try{pedido=new PresentationRequest([new URL("index.html?tele=1&cod="+cod,location.href).href]);}catch(e){aviso&&aviso("NotSupportedError");return;}
    pedido.start().then(conexion=>{
      window.gyaConexionTele=conexion;try{localStorage.setItem("gya_tele_vinculada",cod);}catch(e){}
      aviso&&aviso("ok");setTimeout(()=>unirseTele(cod,nombre),800);
    }).catch(err=>{aviso&&aviso((err&&err.name)||"error");});
  }
  /* Entra a la sala de la tele desde este celular sin recargar (así no se corta la transmisión). */
  function unirseTele(cod,nombre){
    if(esCel)return;codCel=cod;esCel=true;
    silenciarApp();document.documentElement.classList.add("tele-modo");
    iniciarCel(nombre);
  }
  /* Celular: entrar a la Ruleta (Sala TV) con el código que mandó la tele, con su nombre, sin tocar nada. */
  let yendoRuleta=false;
  function irRuleta(sala,nombre){if(yendoRuleta)return;yendoRuleta=true;
    const u=new URL("index.html",location.href);u.searchParams.set("tv",sala);u.searchParams.set("tvname",nombre||"");u.searchParams.set("tvauto","1");location.href=u.href;}
  /* Tele en la Ruleta (index.html?tvhost=1&avisar=<código de Juegos en la tele>): apenas la Sala TV tiene
     código, se lo avisa a los celulares que estaban en la sala de la tele (durante 90 s). */
  function avisarRuleta(codTele){
    if(!/^[A-Z0-9]{5}$/.test(codTele))return;let n=0;
    const t=setInterval(()=>{let s="",ok=false;try{s=typeof sala==="string"?sala:"";ok=typeof modo!=="undefined"&&modo==="tvhost";}catch(e){}
      if(++n>60){clearInterval(t);return;}if(!ok||!/^[0-9A-Z]{4,6}$/.test(s))return;clearInterval(t);
      conectar(codTele,()=>{let k=0;const env=()=>{red&&red.mandar({t:"ruleta_sala",cod:codTele,sala:s});if(++k>=45){clearInterval(rep);setTimeout(()=>{try{red.cerrar();}catch(e){}},500);}};const rep=setInterval(env,2000);env();},()=>{},()=>{});
    },1000);
  }
  function prepararBotonCast(){
    const b=document.getElementById("btnTeleCast");if(!b)return;
    /* Gonzalo (31/10/2026): el 📺 abre el menú con las 3 formas (transmitir, código, celular de tele).
       Desde el 30/10/2026 lo ven todos (antes solo Gonzalo). */
    b.hidden=false;b.onclick=compartirPantalla;
  }
  window.Tele={abrir,salir,compartirPantalla,_podio:podioTele};
  if(!esTele&&!esCel&&P.get("tvhost")==="1"&&P.get("avisar"))avisarRuleta(String(P.get("avisar")).toUpperCase());
  if(!esTele&&!esCel){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",prepararBotonCast);else prepararBotonCast();return;}
  silenciarApp();
  document.documentElement.classList.add("tele-modo");

  /* =====================================================================
     TELE (anfitrión): tiene el estado y lo manda a los celulares.
     ===================================================================== */
  /* QR para unirse desde el celular (30/10/2026): lleva a girayadivina.com/tele/?codigo=XXXXX con el código ya puesto.
     Usa lib/qrcode-generator.js (MIT, guardado en el repo); se carga solo en la tele y, si falla, queda el código escrito. */
  let qrLib=null,qrCache={};
  function cargarQR(alListo){
    if(window.qrcode){qrLib=window.qrcode;return;}if(qrLib==="cargando")return;qrLib="cargando";
    const sc=document.createElement("script");sc.src="lib/qrcode-generator.js?v=1";sc.onload=()=>{qrLib=window.qrcode||null;alListo&&alListo();};sc.onerror=()=>{qrLib=null;};document.head.appendChild(sc);
  }
  function qrSala(cod){
    if(qrCache[cod])return qrCache[cod];
    if(typeof qrLib!=="function")return "";
    try{const url=new URL("tele/?codigo="+cod,location.href).href;const q=qrLib(0,"M");q.addData(url);q.make();
      qrCache[cod]=q.createSvgTag({cellSize:4,margin:3,scalable:true});}catch(e){return "";}
    return qrCache[cod];
  }
  function iniciarTele(){
    despierta();
    let cod="";
    const pedido=(P.get("cod")||"").toUpperCase();if(pedido.length===5&&[...pedido].every(c=>CHARS.includes(c))){cod=pedido;try{localStorage.setItem("gya_tele_codigo",cod);}catch(e){}}
    if(!cod)try{const guardado=localStorage.getItem("gya_tele_codigo")||"";if(guardado.length===5&&[...guardado].every(c=>CHARS.includes(c)))cod=guardado;}catch(e){}
    if(!cod){cod=Array.from({length:5},()=>CHARS[Math.floor(Math.random()*CHARS.length)]).join("");try{localStorage.setItem("gya_tele_codigo",cod);}catch(e){}}
    const T={cod,fase:"menu",jug:[],mando:null,juego:null,g:null,sel:0};
    const raiz=document.createElement("div");raiz.id="teleTV";raiz.className="tl-tv";document.body.appendChild(raiz);
    let timerJuego=null,ultimoTic=0;
    const mandar=m=>{if(red)red.mandar(m);};
    function estadoCel(){
      if(T.fase==="menu")return{pantalla:"menu",juegos:JUEGOS.map(j=>({id:j.id,nombre:j.nombre,ok:j.ok,icono:j.icono,desc:j.desc}))};
      if(T.fase==="ruleta")return{pantalla:"ruleta"};
      if(T.fase==="intro")return{pantalla:"intro",nombre:(JUEGOS.find(j=>j.id===T.juego)||{}).nombre||""};
      if(T.fase==="rosco_modo")return{pantalla:"rosco_modo",jug:T.jug.map(j=>({pid:j.pid,n:j.n}))};
      if(!T.g)return{pantalla:"menu"};
      return T.g.cel();
    }
    T.avisarVistas=(para,l)=>{const f=()=>mandar({t:"vistas",cod,para,j:"rosco",l});f();setTimeout(f,2500);setTimeout(f,7000);};
    function difundir(){mandar({t:"estado",cod,fase:T.fase,juego:T.juego,jug:T.jug.map(j=>({pid:j.pid,n:j.n})),mando:T.mando,cel:estadoCel()});}
    function recibir(m){
      if(m.t==="hola"){
        const n=limpio(m.n,14)||"Jugador";let j=T.jug.find(x=>x.pid===m.pid),cambio=false;
        if(!j){if(T.jug.length>=8)return;j={pid:m.pid,n};T.jug.push(j);sonar(880,.12,"triangle",.06);cambio=true;}
        if(j.n!==n){j.n=n;cambio=true;}if(m.pj==="hombre"||m.pj==="mujer")j.pj=m.pj;if(/^avatar-\d{2}$/.test(m.av||""))j.av=m.av;if(Array.isArray(m.vr))j.vr=new Set(m.vr.slice(-3000).map(String));j.visto=Date.now();if(!T.mando||!T.jug.some(x=>x.pid===T.mando)){T.mando=m.pid;cambio=true;}
        if(cambio){pintar();difundir();}return;
      }
      const j=T.jug.find(x=>x.pid===m.pid);if(!j)return;j.visto=Date.now();
      if(m.t==="chau"){T.jug=T.jug.filter(x=>x.pid!==m.pid);if(T.mando===m.pid)T.mando=T.jug[0]?T.jug[0].pid:null;pintar();difundir();return;}
      if(m.t==="tomar"){if(T.juego==="tutti"&&T.g&&!T.g.participa(m.pid))return;T.mando=m.pid;pintar();difundir();return;}
      if(m.t!=="accion")return;
      if(m.pid!==T.mando&&!(T.fase==="juego"&&((T.juego==="tutti"&&m.a!=="menu"&&m.a!=="otra"&&m.a!=="siguiente")||(T.juego==="duelo"&&/^dc_(voz|listo|pasar|texto)$/.test(m.a))||(T.juego==="quien"&&(m.a==="qs_ok"||m.a==="qs_paso"))||(T.juego==="mimica"&&(m.a==="mm_ok"||m.a==="mm_paso"))||(T.juego==="sopa"&&m.a==="sp_marca")||((T.juego==="silabario"||T.juego==="frases")&&(m.a==="or_resp"||m.a==="or_arma"))||(T.juego==="rosco"&&["responder","pasar","dc_voz"].includes(m.a))||(T.juego==="puzzle"&&["pz_bajar","pz_mover","pz_soltar","pz_girar","pz_acercar","pz_alejar","pz_encuadrar","pz_guia","pz_imagen"].includes(m.a)))))return;
      if(m.a==="elegir"&&T.fase==="menu"){elegir(String(m.juego||""));return;}
      if(m.a==="rosco_modo"&&T.fase==="rosco_modo"){const r=String(m.rival||"");
        T.roscoModo=m.modo==="dos"&&T.jug.some(j=>j.pid===r&&r!==T.mando)?{dos:true,rival:r}:null;T.roscoListo=true;elegir("rosco");return;}
      if(m.a==="menu"){volverMenu();return;}
      if(m.a==="intro_seguir"&&T.fase==="intro"){try{window.GiroRoscoPiloto.avanzar();}catch(e){}return;}
      if(T.g&&T.fase==="juego")T.g.accion(m);
    }
    function elegir(id,revancha){
      const j=JUEGOS.find(x=>x.id===id);if(!j||!j.ok)return;
      if(id==="tutti"&&T.jug.length<2){avisoTele("Tutti Frutti necesita al menos 2 celulares para revisar las respuestas");return;}
      despierta();
      /* Todos los juegos arrancan con el programa: apertura y Giro presentando (el Rosco tiene su propio show). */
      /* Rosco con 2 o más celulares: el que tiene el control elige "solo" o "de a dos" (y contra quién). */
      if(id==="rosco"&&!revancha&&T.jug.length>=2&&!T.roscoListo){T.roscoModo=null;T.fase="rosco_modo";T.juego="rosco";pintar();difundir();return;}
      T.roscoListo=false;
      if(id==="rosco"){if(!revancha){giroAperturaVista=false;if(T.jug.length<2)T.roscoModo=null;}arrancar(id);return;}
      if(!revancha&&GIRO_INTROS[id]){introTele(id,j,()=>arrancar(id));return;}
      arrancar(id);
    }
    function introTele(id,j,despues){
      cerrarPodio();clearInterval(timerJuego);if(T.g&&T.g.fin)T.g.fin();T.g=null;T.fase="intro";T.juego=id;pintar();difundir();
      const sigue=()=>T.fase==="intro"&&T.juego===id;
      cargarGiro(ok=>{
        if(!sigue())return;const G=window.GiroRoscoPiloto;
        if(!ok||!G||!G.habilitado()||!G.presentarJuego){despues();return;}
        giroListo().then(()=>{
          if(!sigue())return;
          const t=GIRO_INTROS[id];
          if(!G.presentarJuego({...t,rotulo:"GIRÁ Y ADIVINÁ · "+j.nombre.toUpperCase(),audio:GIRO_B+"voz/tele/giro-intro-"+id+".mp3",despues:()=>{if(sigue())despues();}})){despues();return;}
          /* Si nadie toca «Siguiente», Giro termina de presentar y arranca solo. */
          let prev="",acc=0;timerJuego=setInterval(()=>{if(!sigue()){clearInterval(timerJuego);return;}const e=G.etapa();if(e!==prev){prev=e;acc=0;}else acc+=500;if(e==="giro"&&acc>16000){acc=-1e9;G.avanzar();}},500);
        });
      });
    }
    function arrancar(id){
      /* La Ruleta es el juego principal (Sala TV): la tele la abre y, cuando tiene el código, se lo pasa a los
         celulares de esta sala, que entran solos (31/10/2026: "que no haya que poner otro código"). */
      if(id==="ruleta"){T.fase="ruleta";T.juego="ruleta";pintar();difundir();setTimeout(()=>{location.href="index.html?tvhost=1&avisar="+cod+(P.get("telered")==="local"?"&telered=local":"");},1500);return;}
      T.fase="juego";T.juego=id;T.g=(id==="silabario"||id==="frases"?(T,a)=>juegoOrdenar(T,a,id):id==="mimica"?juegoMimica:id==="numero"?juegoNumero:id==="quien"?juegoQuien:id==="duelo"?juegoDuelo:id==="puzzle"?juegoPuzzle:id==="sopa"?juegoSopa:id==="tutti"?juegoTutti:id==="rosco"?juegoRosco:id==="ahorcado"?juegoAhorcado:juegoCien)(T,actualizar);
      ultimoTic=performance.now();clearInterval(timerJuego);
      timerJuego=setInterval(()=>{const a=performance.now(),dt=a-ultimoTic;ultimoTic=a;if(T.g&&T.g.tic)T.g.tic(dt);},200);
      actualizar();
    }
    function volverMenu(){cerrarPodio();T.roscoModo=null;T.roscoListo=false;clearInterval(timerJuego);if(T.g&&T.g.fin)T.g.fin();T.fase="menu";T.juego=null;T.g=null;
      try{if(window.GiroRoscoPiloto&&document.querySelector(".grp-apertura,.grp-overlay"))window.GiroRoscoPiloto.cerrar();}catch(e){}pintar();difundir();}
    function actualizar(){pintar();difundir();}
    T.volverMenu=volverMenu;T.otra=()=>elegir(T.juego,true);
    function nombreMando(){const j=T.jug.find(x=>x.pid===T.mando);return j?j.n:"";}
    function pintar(){
      if(T.fase==="juego"&&T.g){raiz.className="tl-tv tl-juego-"+T.juego;T.g.pintar(raiz,nombreMando());return;}
      raiz.className="tl-tv";
      if(T.fase==="rosco_modo"){raiz.innerHTML=`<div class="tl-centro"><img class="tl-logo" src="assets/rosco/logo.webp" alt="" onerror="this.src='assets/logo.webp'"><h1>¿Rosco solo o de a dos?</h1><p class="tl-ayuda">🎮 ${esc(nombreMando())} elige desde su celular</p></div>`;return;}
      if(T.fase==="intro"){raiz.innerHTML=`<div class="tl-centro tl-rosco tl-estudio"><img class="tl-logo" src="assets/logo.webp" alt=""><h1>Preparando el estudio…</h1></div>`;return;}
      if(T.fase==="ruleta"){raiz.innerHTML=`<div class="tl-centro"><img class="tl-logo" src="assets/logo.webp" alt=""><h1>Abriendo la Ruleta…</h1><p>Los celulares de esta sala entran solos en unos segundos 📱</p></div>`;return;}
      const qr=qrSala(cod);if(!qr)cargarQR(pintar);
      const jug=T.jug.length?T.jug.map(j=>`<li class="${j.pid===T.mando?"tl-mando":""}">${j.pid===T.mando?"🎮 ":""}${esc(j.n)}</li>`).join(""):"<li class='tl-vacio'>Esperando celulares…</li>";
      raiz.innerHTML=`<div class="tl-menu">
        <section class="tl-sala"><img class="tl-logo" src="assets/logo.webp" alt="Girá y Adiviná">
          ${qr?`<div class="tl-qr" role="img" aria-label="Código QR para unirse">${qr}</div><p class="tl-paso tl-qr-txt">📷 Escaneá con la cámara del celular</p><p class="tl-paso">o entrá a <b class="tl-url-chica">girayadivina.com/tele</b> con el código</p>`:`<p class="tl-paso">En el celular entrá a</p><p class="tl-url">girayadivina.com/tele</p>
          <p class="tl-paso">y poné el código</p>`}<div class="tl-codigo">${cod}</div>
          <ul class="tl-jugadores">${jug}</ul>
          ${T.mando?`<p class="tl-ayuda">🎮 ${esc(nombreMando())} elige el juego desde su celular (o con el control remoto).</p>`:""}
          ${navigator.userActivation&&!navigator.userActivation.hasBeenActive?`<p class="tl-ayuda tl-sonido">🔊 Para que suene la música y la voz de Giro: tocá la tele o apretá OK en el control una vez.</p>`:""}</section>
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
    const showGiro=()=>!!document.querySelector(".grp-apertura,.grp-overlay");
    window.gyaTVBack=()=>{if(showGiro()){try{window.GiroRoscoPiloto.avanzar();}catch(e){}return true;}if(T.fase!=="juego")return false;volverMenu();return true;};
    /* Control remoto: flechas mueven entre botones, Enter elige (lo hace el navegador). */
    document.addEventListener("keydown",e=>{
      if(e.key==="Backspace"||e.key==="Escape"){if(showGiro())return;if(T.fase==="juego"){e.preventDefault();volverMenu();}return;}
      const direction={ArrowRight:"right",ArrowDown:"down",ArrowLeft:"left",ArrowUp:"up"}[e.key];
      if(direction){e.preventDefault();window.gyaTVRemote(direction);}
    });
    pintar();
    setTimeout(()=>{precargarGiro();precargarAhorcado();},1500);
    /* El navegador no deja sonar música hasta el primer toque: al tocar, se saca el aviso. */
    ["pointerdown","keydown"].forEach(ev=>document.addEventListener(ev,()=>{if(T.fase==="menu")setTimeout(pintar,50);},{once:true}));
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
    function nueva(){ronda++;letra=elegirLetra();restante=duracion*1000;fase="jugando";if(ronda>1)SND.turno();ganador=null;respuestas={};recibidas={};progreso={};marcas={};extra={};anuladas={};pendientes={};resueltas={};resolucionProgramada=false;}
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
      if(ronda>=RONDAS){fase="fin";
        const f=jugadores.map(j=>({n:j.n,av:avDe(T,j.pid),g:ganadas[j.pid],t:totales[j.pid]})).sort((a,b)=>b.g-a.g||b.t-a.t);
        const emp=f.length>1&&f[0].g===f[1].g&&f[0].t===f[1].t;
        podioTele({juego:"TUTTI FRUTTI",titulo:emp?"¡EMPATE!":"¡GANÓ "+String(f[0]?f[0].n:"").toUpperCase()+"!",sub:emp?"Nadie se sacó ventaja":"El mejor de "+RONDAS+" rondas",
          filas:f.map(x=>({n:x.n,av:x.av,pts:x.g+(x.g===1?" ronda":" rondas")+" · "+x.t+" pts"}))});
      }else nueva();actualizar();}
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
    function tic(dt){if(fase!=="jugando")return;const antes=restante;restante=Math.max(0,restante-dt);ticFinal(antes,restante);
      const el=document.querySelector("#tlTuttiReloj");if(el){el.textContent=String(Math.ceil(restante/1000));el.classList.toggle("tl-urgente",restante<=10000);}
      if(restante<=0){SND.tiempo();cortar(null,null);}}
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

  /* ---------- ¿Qué número soy?: la tele muestra el número; el que juega, de espaldas ---------- */
  function juegoNumero(T,actualizar){
    const RANGOS=[10,50,100];
    let max=100,numero=0,fase="config",cuenta=0,oculto=false;
    try{const d=JSON.parse(localStorage.getItem("gya_que_numero_soy"))||{};if(RANGOS.includes(d.max))max=d.max;}catch(e){}
    function nuevo(){let n;do{n=1+Math.floor(Math.random()*max);}while(n===numero&&max>1);numero=n;fase="cuenta";cuenta=3000;oculto=false;SND.turno();actualizar();}
    function accion(m){
      if(m.pid!==T.mando)return;
      if(m.a==="qn_rango"&&RANGOS.includes(Number(m.max))){max=Number(m.max);try{const d=JSON.parse(localStorage.getItem("gya_que_numero_soy"))||{};d.max=max;localStorage.setItem("gya_que_numero_soy",JSON.stringify(d));}catch(e){}actualizar();return;}
      if(m.a==="qn_nuevo"){nuevo();return;}
      if(m.a==="qn_ocultar"&&fase==="numero"){oculto=!oculto;actualizar();}
    }
    function tic(dt){if(fase!=="cuenta")return;const antes=Math.ceil(cuenta/1000);cuenta-=dt;const ahora=Math.ceil(cuenta/1000);
      if(cuenta<=0){fase="numero";SND.arranca();actualizar();return;}
      if(ahora!==antes){SND.tic();const el=document.querySelector("#tlQnCuenta");if(el)el.textContent=ahora;}}
    function pintar(raiz,quien){
      if(fase==="config"){raiz.innerHTML=`<div class="tl-centro tl-qn"><img class="tl-qn-logo" src="assets/que-numero-soy/logo.webp" alt="¿Qué número soy?"><h1>¿Qué número soy?</h1>
        <p>El que juega se pone <b>de espaldas a la tele</b>. Los demás ven el número y le dan pistas.</p><p>Números del <b>1 al ${max}</b> · ${quien?esc(quien)+" elige desde el celular":""}</p></div>`;return;}
      if(fase==="cuenta"){raiz.innerHTML=`<div class="tl-centro tl-qn"><h1>¡De espaldas a la tele! 🙈</h1><div class="tl-qn-cuenta" id="tlQnCuenta">${Math.max(1,Math.ceil(cuenta/1000))}</div></div>`;return;}
      raiz.innerHTML=`<div class="tl-qn-escena"><div class="tl-qn-bola">${oculto?"<span class='tl-qn-oculto'>?</span>":`<span>${numero}</span>`}</div><p class="tl-qn-pie">Del 1 al ${max}${oculto?" · número oculto":""}</p></div>`;
    }
    function cel(){return{pantalla:"numero",fase,max,oculto,rangos:RANGOS};}
    return{accion,tic,pintar,cel,fin(){}};
  }

  /* ---------- ¿Quién soy?: la tele muestra quién sos; el que adivina, de espaldas ---------- */
  function juegoQuien(T,actualizar){
    const TIEMPOS=[30,40,50,60];
    const cats=()=>window.QUIEN_SOY_CATEGORIAS||[];
    let cat="famosos",tiempo=40,quien=T.mando,fase="config",palabras=[],idx=0,resultados=[],restante=0,cuenta=0;
    try{const d=JSON.parse(localStorage.getItem("gya_quien_soy"))||{};if(TIEMPOS.includes(d.tiempo))tiempo=d.tiempo;}catch(e){}
    const nombreCat=id=>id==="mezcla"?"🎲 Mezcla":((c=>c?c.emoji+" "+c.nombre:id)(cats().find(c=>c.id===id)));
    const nombreDe=pid=>(T.jug.find(j=>j.pid===pid)||{}).n||"Alguien";
    function armar(){
      const lista=cat==="mezcla"?cats().flatMap(c=>c.palabras):((cats().find(c=>c.id===cat)||cats()[0]||{palabras:[]}).palabras);
      try{Vistas.unir("quien_soy");}catch(e){}
      const libres=Vistas.filtrar("quien_soy",lista,x=>x);
      return mezclar(libres).concat(mezclar(lista.filter(x=>!libres.includes(x))));
    }
    function empezar(){palabras=armar();if(!palabras.length)return;idx=0;resultados=[];restante=tiempo*1000;cuenta=3000;fase="cuenta";actualizar();}
    function marcar(ok){if(fase!=="jugando"||idx>=palabras.length)return;
      resultados.push({w:palabras[idx],ok});try{Vistas.marcar("quien_soy",palabras[idx]);}catch(e){}idx++;
      if(ok)SND.ok();else SND.mal();
      if(idx>=palabras.length){terminar();return;}actualizar();}
    function terminar(){fase="fin";const ok=resultados.filter(r=>r.ok).length;
      try{const r=JSON.parse(localStorage.getItem("gya_tele_records")||"{}");if(ok>(r.quien||0)){r.quien=ok;localStorage.setItem("gya_tele_records",JSON.stringify(r));}}catch(e){}
      const nq=nombreDe(T,quien);
      if(ok>0)podioTele({juego:"¿QUIÉN SOY?",titulo:"¡"+String(nq).toUpperCase()+" ADIVINÓ "+ok+"!",sub:ok>=5?"¡Una máquina!":"Buen intento",equipo:true,filas:[{n:nq,av:avDe(T,quien),pts:ok+(ok===1?" acierto":" aciertos")}]});
      else sfx("abucheo");actualizar();}
    function accion(m){
      if((m.a==="qs_ok"||m.a==="qs_paso")&&fase==="jugando"&&Number(m.i)===idx){marcar(m.a==="qs_ok");return;}
      if(m.pid!==T.mando)return;
      if(m.a==="qs_cat"&&fase==="config"){const v=String(m.cat||"");if(v==="mezcla"||cats().some(c=>c.id===v)){cat=v;actualizar();}return;}
      if(m.a==="qs_tiempo"&&fase==="config"&&TIEMPOS.includes(Number(m.seg))){tiempo=Number(m.seg);actualizar();return;}
      if(m.a==="qs_quien"&&fase==="config"&&T.jug.some(j=>j.pid===m.quien)){quien=m.quien;actualizar();return;}
      if(m.a==="qs_empezar"&&fase==="config"){empezar();return;}
      if(m.a==="qs_terminar"&&fase==="jugando"){terminar();return;}
      if(m.a==="qs_config"&&fase==="fin"){fase="config";actualizar();}
    }
    function tic(dt){
      if(fase==="cuenta"){const antes=Math.ceil(cuenta/1000);cuenta-=dt;if(cuenta<=0){fase="jugando";SND.arranca();actualizar();return;}
        if(Math.ceil(cuenta/1000)!==antes){SND.tic();const el=document.querySelector("#tlQsCuenta");if(el)el.textContent=Math.ceil(cuenta/1000);}return;}
      if(fase!=="jugando")return;const antesR=restante;restante=Math.max(0,restante-dt);ticFinal(antesR,restante);
      const el=document.querySelector("#tlQsReloj");if(el){el.textContent=Math.ceil(restante/1000);el.classList.toggle("tl-urgente",restante<=10000);}
      if(restante<=0){SND.tiempo();terminar();}
    }
    function pintar(raiz){
      const ok=resultados.filter(r=>r.ok).length,pasos=resultados.length-ok;
      if(fase==="config"){raiz.innerHTML=`<div class="tl-centro tl-qs"><img class="tl-qs-logo" src="assets/quien-soy/logo.webp" alt="¿Quién soy?">
        <p><b>${esc(nombreDe(quien))}</b> se pone <b>de espaldas a la tele</b>. Los demás le dan pistas sin decir la palabra.</p>
        <p>${esc(nombreCat(cat))} · ${tiempo} segundos</p><p class="tl-ayuda">🎮 Se elige y se empieza desde el celular. En el celular: ✔ Acertó · ⏭ Pasó.</p></div>`;return;}
      if(fase==="cuenta"){raiz.innerHTML=`<div class="tl-centro tl-qs"><h1>${esc(nombreDe(quien))}, ¡de espaldas! 🙈</h1><div class="tl-qn-cuenta" id="tlQsCuenta">${Math.max(1,Math.ceil(cuenta/1000))}</div></div>`;return;}
      if(fase==="jugando"){raiz.innerHTML=`<div class="tl-qs-juego"><header><span>${esc(nombreCat(cat))}</span><span>Adivina <b>${esc(nombreDe(quien))}</b></span><span class="tl-qs-reloj" id="tlQsReloj">${Math.ceil(restante/1000)}</span></header>
        <div class="tl-qs-palabra">${esc(palabras[idx]||"")}</div><footer><span class="tl-ok">✔ ${ok}</span><span class="tl-paso">⏭ ${pasos}</span></footer></div>`;return;}
      raiz.innerHTML=`<div class="tl-centro tl-fin"><img class="tl-qs-trofeo" src="assets/quien-soy/trofeo.webp" alt=""><h1>${esc(nombreDe(quien))}: ${ok} acierto${ok===1?"":"s"}</h1>
        <div class="tl-palabras">${resultados.map(r=>`<span class="tl-${r.ok?"ok":"mal"}">${r.ok?"✔":"⏭"} ${esc(r.w)}</span>`).join("")||"<span>Ninguna palabra</span>"}</div>
        <p class="tl-ayuda">Desde el celular: otra ronda o volver al menú.</p></div>`;
    }
    function cel(){return{pantalla:"quien",fase,cat,tiempo,quien,cats:cats().map(c=>({id:c.id,n:c.emoji+" "+c.nombre})).concat([{id:"mezcla",n:"🎲 Mezcla"}]),tiempos:TIEMPOS,
      jug:T.jug.map(j=>({pid:j.pid,n:j.n})),i:idx,ok:resultados.filter(r=>r.ok).length,pasos:resultados.filter(r=>!r.ok).length};}
    return{accion,tic,pintar,cel,fin(){}};
  }

  /* ---------- Duelo de Conocimiento: la tele muestra el duelo; se responde hablando al celular ---------- */
  function juegoDuelo(T,actualizar){
    const CATS=[["banderas","🏳️ Banderas"],["matematica","🔢 Matemática"],["famosos","⭐ Famosos"],["futbol","⚽ Futbolistas"],["ciudades","🏙️ Ciudades"],["videojuegos","🎮 Videojuegos"]];
    let fase="config",modo="bot",rival=null,cats=["banderas","matematica","famosos","futbol"],seg=60,pids=[T.mando,null],iframe=null,est={},estClave="",poll=null,muerto=false;
    const api=()=>{try{return iframe&&iframe.contentWindow&&iframe.contentWindow.dueloTV;}catch(e){return null;}};
    const nombreDe=pid=>(T.jug.find(j=>j.pid===pid)||{}).n||"Jugador";
    function empezar(){
      if(modo==="local"&&(!rival||rival===T.mando||!T.jug.some(j=>j.pid===rival)))return;
      const a=api();if(!a)return;
      pids=[T.mando,modo==="local"?rival:null];fase="juego";actualizar();
      try{a.configurar({modo,nombres:[nombreDe(pids[0]),modo==="local"?nombreDe(pids[1]):"Sofía"],categorias:cats,segundos:seg});}catch(e){}
    }
    function leer(){if(muerto)return;const a=api();if(!a)return;let s={};try{s=a.estado();}catch(e){return;}
      const c=JSON.stringify(s);if(c!==estClave){estClave=c;est=s;actualizar();}}
    poll=setInterval(leer,400);
    const limpiarVoz=l=>Array.isArray(l)?l.slice(0,5).map(r=>({alts:(Array.isArray(r&&r.alts)?r.alts:[]).slice(0,5).map(x=>String(x||"").slice(0,80)),isFinal:!!(r&&r.isFinal)})):[];
    const escucha=()=>fase==="juego"&&est.escucha?pids[est.active]||null:null;
    function accion(m){
      const a=api();
      if(m.a==="dc_voz"){if(m.pid===escucha()&&a)try{a.voz(limpiarVoz(m.l));}catch(e){}return;}
      if(m.a==="dc_listo"){if(m.pid===escucha()&&a)try{a.listo();}catch(e){}return;}
      if(m.a==="dc_pasar"||m.a==="dc_texto"){if(fase==="juego"&&m.pid===pids[est.active]&&a)try{m.a==="dc_pasar"?a.pasar():a.texto(limpio(m.txt,60));}catch(e){}return;}
      if(m.pid!==T.mando)return;
      if(fase==="config"){
        if(m.a==="dc_modo"&&(m.modo==="bot"||m.modo==="local")){modo=m.modo;actualizar();return;}
        if(m.a==="dc_rival"&&T.jug.some(j=>j.pid===m.rival&&j.pid!==T.mando)){rival=m.rival;actualizar();return;}
        if(m.a==="dc_cat"&&CATS.some(c=>c[0]===m.cat)){cats=cats.includes(m.cat)?(cats.length>1?cats.filter(c=>c!==m.cat):cats):cats.concat([m.cat]);actualizar();return;}
        if(m.a==="dc_seg"&&[40,60,90].includes(Number(m.seg))){seg=Number(m.seg);actualizar();return;}
        if(m.a==="dc_empezar"){empezar();return;}
      }
      if(m.a==="dc_revancha"&&fase==="juego"&&est.phase==="finished"&&a){try{a.revancha();}catch(e){}return;}
      if(m.a==="dc_config"&&fase==="juego"){fase="config";if(iframe)iframe.src=iframe.src;est={};estClave="";actualizar();}
    }
    function pintar(raiz){
      if(!iframe||!raiz.contains(iframe)){
        raiz.innerHTML=`<div class="tl-duelo"><iframe id="tlDcFrame" src="duelo-conocimiento.html?tv=1&amp;v=28" title="Duelo de Conocimiento" allow="autoplay"></iframe><div id="tlDcConfig" class="tl-dc-config"></div></div>`;
        iframe=raiz.querySelector("#tlDcFrame");
      }
      const conf=raiz.querySelector("#tlDcConfig");conf.hidden=fase!=="config";
      if(fase==="config")conf.innerHTML=`<img class="tl-dc-logo" src="logo-duelo-conocimiento.webp" alt="Duelo de Conocimiento">
        <h1>Duelo de Conocimiento</h1><p>Se responde <b>hablando al celular</b>. La tele muestra la pregunta.</p>
        <div class="tl-dc-vs"><b>${esc(nombreDe(T.mando))}</b><span>VS</span><b>${modo==="bot"?"🤖 Sofía (bot)":rival?esc(nombreDe(rival)):"¿quién?"}</b></div>
        <p>${cats.map(c=>(CATS.find(x=>x[0]===c)||[c,c])[1]).join(" · ")} · ${seg} s cada uno</p>
        <p class="tl-ayuda">🎮 Se configura y se empieza desde el celular con el control.</p>`;
    }
    function cel(){return{pantalla:"duelo",fase,modo,rival,cats,seg,catsTodas:CATS,jug:T.jug.map(j=>({pid:j.pid,n:j.n})),pids,escucha:escucha(),
      st:{phase:est.phase||"",active:est.active,nombres:est.nombres||[],aciertos:est.aciertos||[],errores:est.errores||[],pregunta:est.pregunta||"",resultado:est.resultado||""}};}
    function fin(){muerto=true;clearInterval(poll);try{iframe&&iframe.contentWindow&&iframe.contentWindow.speechSynthesis&&iframe.contentWindow.speechSynthesis.cancel();}catch(e){}}
    return{accion,pintar,cel,fin};
  }

  /* ---------- Mímica en la tele (concurso): uno de espaldas adivina, los demás hacen
     la mímica de la frase que muestra la tele. Gana el que adivina más en su tiempo. ---------- */
  function juegoMimica(T,actualizar){
    const NIV=[["facil","🙂 Fácil",()=>window.MIMICA_FRASES||[]],["media","🎬 Media",()=>window.MIMICA_MEDIA||[]],["dificil","🔥 Difícil",()=>window.MIMICA_DIFICIL||[]],["mezcla","🎲 Mezcla",null]];
    const TIEMPOS=[45,60,90],GB="presentacion-y-locucion-extensiones/Giro/";
    let nivel="mezcla",tiempo=60,fase="config",orden=[],turno=0,restante=0,cuenta=0,mazo=[],idx=0,hechas=[],marcador={},muerto=false;
    const nombreDe=pid=>(T.jug.find(j=>j.pid===pid)||{}).n||"Jugador";
    /* Frases cortas, mezcladas e intercaladas (fácil, media, difícil…): window.mimicaMazo en mimica.js. */
    function armarMazo(){
      if(typeof window.mimicaMazo==="function")return window.mimicaMazo();
      const lista=NIV.slice(0,3).flatMap(n=>n[2]()).filter(t=>String(t).trim().split(/\s+/).length<=3);
      return mezclar(Vistas.filtrar("mimica",lista,x=>x));
    }
    function empezar(){orden=T.jug.map(j=>j.pid);if(orden.length<2)return;marcador={};orden.forEach(p=>marcador[p]=0);turno=0;mazo=armarMazo();idx=0;prepararTurno();}
    function prepararTurno(){hechas=[];restante=tiempo*1000;cuenta=4000;fase="cuenta";actualizar();}
    function marcar(ok){if(fase!=="jugando"||!mazo.length)return;const t=mazo[idx%mazo.length];hechas.push({t,ok});try{Vistas.marcar("mimica",t);}catch(e){}idx++;
      if(ok){marcador[orden[turno]]++;SND.ok();}else SND.mal();actualizar();}
    function finTurno(){fase="resumen";sfx("aplausos");actualizar();}
    function siguiente(){turno++;if(turno>=orden.length){fase="fin";
        const mejor=Math.max(0,...Object.values(marcador));try{const r=JSON.parse(localStorage.getItem("gya_tele_records")||"{}");if(mejor>(r.mimica||0)){r.mimica=mejor;localStorage.setItem("gya_tele_records",JSON.stringify(r));}}catch(e){}
        const f=orden.map(pid=>({n:nombreDe(T,pid),av:avDe(T,pid),v:marcador[pid]||0})).sort((a,b)=>b.v-a.v);const emp=f.length>1&&f[0].v===f[1].v;
        podioTele({juego:"MÍMICA",titulo:emp?"¡EMPATE!":"¡GANÓ "+String(f[0].n).toUpperCase()+"!",sub:"El que más adivinó en su turno",filas:f.map(x=>({n:x.n,av:x.av,pts:x.v+(x.v===1?" acierto":" aciertos")}))});
        actualizar();return;}
      SND.turno();prepararTurno();}
    function accion(m){
      if((m.a==="mm_ok"||m.a==="mm_paso")&&fase==="jugando"&&Number(m.i)===idx&&m.pid!==orden[turno]){marcar(m.a==="mm_ok");return;}
      if(m.pid!==T.mando)return;
      if(fase==="config"){
        if(m.a==="mm_tiempo"&&TIEMPOS.includes(Number(m.seg))){tiempo=Number(m.seg);actualizar();return;}
        if(m.a==="mm_empezar"){empezar();return;}return;}
      if(m.a==="mm_terminar"&&fase==="jugando"){restante=0;finTurno();return;}
      if(m.a==="mm_siguiente"&&fase==="resumen"){siguiente();return;}
      if(m.a==="mm_config"&&fase==="fin"){fase="config";actualizar();}
    }
    function tic(dt){
      if(fase==="cuenta"){const antes=Math.ceil(cuenta/1000);cuenta-=dt;if(cuenta<=0){fase="jugando";SND.arranca();actualizar();return;}
        const ahora=Math.ceil(cuenta/1000);if(ahora!==antes&&ahora<=3){SND.tic();const el=document.querySelector("#tlMmCuenta");if(el)el.textContent=ahora;}return;}
      if(fase!=="jugando")return;const antesR=restante;restante=Math.max(0,restante-dt);ticFinal(antesR,restante);
      const el=document.querySelector("#tlMmReloj");if(el){el.textContent=Math.ceil(restante/1000);el.parentElement.style.setProperty("--p",(restante/(tiempo*1000)*100)+"%");el.parentElement.classList.toggle("tl-urgente",restante<=10000);}
      if(restante<=0){SND.tiempo();finTurno();}
    }
    /* La frase nunca se corta a mitad de palabra: si una palabra es larga, la letra se achica. */
    const tamFrase=f=>{const largo=Math.max(1,...String(f).split(/\s+/).map(w=>w.length));return Math.min(6.4,56/(largo*.78)).toFixed(2);};
    const giro=pose=>`<div class="tl-mm-giro"><img class="tl-mm-pose" src="${GB}${pose}.png" alt="Giro"><img class="tl-mm-atril" src="${GB}elementos/Giro_atril_oficial_chico.webp" alt=""></div>`;
    const tabla=()=>`<div class="tl-mm-tabla">${orden.map((p,i)=>`<div class="${i===turno&&fase!=="fin"?"tl-mm-ahora":""}"><span>${esc(nombreDe(p))}</span><b>${i<turno||(i===turno&&fase!=="cuenta")?marcador[p]:"–"}</b></div>`).join("")}</div>`;
    function pintar(raiz){
      if(fase==="config"){raiz.innerHTML=`<div class="tl-mm tl-mm-telon"><div class="tl-mm-oscuro"></div><div class="tl-mm-card"><img class="tl-mm-logo" src="assets/mimica/logo.webp" alt="Mímica">
        <p>Uno se pone <b>de espaldas a la tele</b> y los demás le hacen <b>mímica</b> de la frase, sin hablar.<br>Gana el que <b>adivina más frases en ${tiempo} segundos</b>.</p>
        <p class="tl-mm-chico">Frases cortas mezcladas · ${T.jug.length} jugadores · 🎮 se empieza desde el celular</p></div>${giro("Giro_saludando")}</div>`;return;}
      if(fase==="cuenta"){raiz.innerHTML=`<div class="tl-mm tl-mm-telon"><div class="tl-mm-oscuro"></div><div class="tl-mm-haz"></div>
        <div class="tl-mm-card"><small>🙈 LE TOCA ADIVINAR A</small><div class="tl-mm-nombre">${esc(nombreDe(orden[turno]))}</div><span class="tl-mm-pill">¡DE ESPALDAS A LA TELE!</span>
        <p>Los demás: hagan la mímica de la frase, ¡sin hablar!</p></div><div class="tl-mm-cuenta" id="tlMmCuenta">${Math.min(3,Math.max(1,Math.ceil(cuenta/1000)))}</div>${giro("Giro_senalando_derecha")}${tabla()}</div>`;return;}
      if(fase==="jugando"){const ok=hechas.filter(h=>h.ok).length;raiz.innerHTML=`<div class="tl-mm tl-mm-fondo">
        <div class="tl-mm-top"><span>🙈 Adivina <b>${esc(nombreDe(orden[turno]))}</b></span><span class="tl-mm-ok">✔ ${ok}</span></div>
        <div class="tl-mm-frase" style="font-size:calc(var(--u)*${tamFrase(mazo[idx%mazo.length]||"")})">${esc(mazo[idx%mazo.length]||"")}</div>
        <div class="tl-mm-reloj${restante<=10000?" tl-urgente":""}" style="--p:${restante/(tiempo*1000)*100}%"><span id="tlMmReloj">${Math.ceil(restante/1000)}</span></div>
        <p class="tl-mm-ayuda">🤫 ¡Sin hablar! · En el celular: ✔ Adivinó · ⏭ Pasar</p>${giro("Giro_suspenso")}${tabla()}</div>`;return;}
      if(fase==="resumen"){const ok=hechas.filter(h=>h.ok).length;raiz.innerHTML=`<div class="tl-mm tl-mm-fondo"><div class="tl-mm-res">
        <img src="assets/mimica/aplausos.webp" alt=""><h1>¡Tiempo! ${esc(nombreDe(orden[turno]))} adivinó ${ok}</h1>
        <div class="tl-mm-lista">${hechas.map(h=>`<span class="${h.ok?"tl-ok":"tl-paso"}">${h.ok?"✔":"⏭"} ${esc(h.t)}</span>`).join("")||"<span>Ninguna frase</span>"}</div>
        <p>${turno+1<orden.length?`Ahora adivina <b>${esc(nombreDe(orden[turno+1]))}</b> · 🎮 «Siguiente» en el celular`:"🎮 «Ver ganador» en el celular"}</p></div>${giro("Giro_festejando")}${tabla()}</div>`;return;}
      const rank=[...orden].sort((a,b)=>marcador[b]-marcador[a]),top=marcador[rank[0]]||0,ganan=rank.filter(p=>marcador[p]===top);
      raiz.innerHTML=`<div class="tl-mm tl-mm-telon"><div class="tl-mm-oscuro"></div><div class="tl-mm-final"><img src="assets/mimica/trofeo.webp" alt="">
        <h1>${ganan.length>1?"¡Empate! "+ganan.map(nombreDe).map(esc).join(" y "):"¡Ganó "+esc(nombreDe(ganan[0]))+"!"}</h1><p>${top} frase${top===1?"":"s"} en ${tiempo} segundos</p>
        <div class="tl-mm-podio">${rank.map((p,i)=>`<div><span>${["🥇","🥈","🥉"][i]||i+1+"."} ${esc(nombreDe(p))}</span><b>${marcador[p]}</b></div>`).join("")}</div></div>${giro("Giro_festejando")}</div>`;
    }
    function cel(){return{pantalla:"mimica",fase,nivel,tiempo,niveles:NIV.map(n=>[n[0],n[1]]),tiempos:TIEMPOS,adivina:orden[turno]||null,nombreAdivina:orden[turno]?nombreDe(orden[turno]):"",
      i:idx,ok:hechas.filter(h=>h.ok).length,pasos:hechas.filter(h=>!h.ok).length,ultimo:turno+1>=orden.length,jugadores:T.jug.length};}
    return{accion,tic,pintar,cel,fin(){muerto=true;}};
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
      if(m.a==="estado"){estado={n:Number(m.n)||0,pct:Number(m.pct)||0,tiempo:Number(m.tiempo)||0,ganado:!!m.ganado};if(estado.ganado&&fase!=="fin"){fase="fin";dueno=null;guardado=false;
        const s=Math.round(estado.tiempo>1000?estado.tiempo/1000:estado.tiempo);podioTele({juego:"PUZZLE",titulo:"¡PUZZLE COMPLETO!",sub:"Lo armaron entre todos",equipo:true,filas:[{n:"Todo el grupo",pts:s>0?Math.floor(s/60)+":"+String(s%60).padStart(2,"0"):"🧩"}]});}actualizar();return;}
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
  /* Show de Giro (giro-rosco-piloto.js, el mismo del Rosco del celular): se carga al elegir el Rosco. */
  function cargarGiro(cb){
    if(window.GiroRoscoPiloto){cb(true);return;}
    if(!document.querySelector('link[data-giro-rosco]')){const l=document.createElement("link");l.rel="stylesheet";l.href="giro-rosco-piloto.css?v=22";l.dataset.giroRosco="1";document.head.appendChild(l);}
    let sc=document.querySelector('script[data-giro-rosco]');
    if(!sc){sc=document.createElement("script");sc.src="giro-rosco-piloto.js?v=40";sc.async=true;sc.dataset.giroRosco="1";document.head.appendChild(sc);}
    let listo=false;const fin=ok=>{if(listo)return;listo=true;cb(ok&&!!window.GiroRoscoPiloto);};
    sc.addEventListener("load",()=>fin(true),{once:true});sc.addEventListener("error",()=>fin(false),{once:true});setTimeout(()=>fin(!!window.GiroRoscoPiloto),8000);
  }
  let giroAperturaVista=false;
  /* Presentación de cada juego en la tele (apertura del programa + Giro en su atril).
     El audio va en voz/tele/giro-intro-<id>.mp3; mientras no esté grabado, Giro lo dice con la voz de la tele. */
  const GIRO_INTROS={
    silabario:{titulo:"¡Silabario Rioplatense!",descripcion:"Lean la pista y armen la palabra con las sílabas desde el celular.",
      locucion:"¡Bienvenidos al Silabario Rioplatense! En la tele sale una pista y unas sílabas mezcladas. Cada uno arma la palabra desde su celular. ¡El más rápido se lleva más puntos!"},
    frases:{titulo:"¡Frases en Giro!",descripcion:"Ordenen las palabras de la frase antes que los demás.",
      locucion:"¡Bienvenidos a Frases en Giro! Las palabras de la frase están todas mezcladas y hay alguna de más. Ordénenla desde el celular. ¡El primero que la arma gana más puntos!"},
    ahorcado:{titulo:"¡Bienvenidos al Ahorcado!",descripcion:"Adivinen la palabra letra por letra antes de que se complete el muñeco.",
      locucion:"¡Bienvenidos al Ahorcado Rioplatense! Elijan las letras desde el celular y descubran la palabra antes de que se complete el muñeco. ¡Cuidado con las letras que no están!"},
    cien:{titulo:"¡100 Rioplatenses Dicen!",descripcion:"Encuentren las respuestas más populares de la encuesta.",
      locucion:"¡Bienvenidos a 100 Rioplatenses Dicen! Preguntamos a cien rioplatenses y ustedes tienen que encontrar las respuestas más populares. Tres errores y se termina la ronda. ¡Vamos!"},
    ruleta:{titulo:"¡La Ruleta!",descripcion:"Giren la ruleta y adivinen el panel.",
      locucion:"¡Bienvenidos a La Ruleta! Giren, compren vocales y adivinen el panel antes que los demás. ¡Que la suerte esté de su lado!"},
    tutti:{titulo:"¡Tutti Frutti!",descripcion:"Sale una letra y todos completan las categorías.",
      locucion:"¡Bienvenidos al Tutti Frutti! Sale una letra y cada uno completa las categorías desde su celular. El primero que termina grita ¡basta! ¿Están listos?"},
    sopa:{titulo:"¡Sopa Fugaz!",descripcion:"Encuentren las palabras en la sopa antes que los demás. ¡Ojo que las letras se mudan!",
      locucion:"¡Bienvenidos a Sopa Fugaz! En la tele hay una sopa de letras. Desde el celular tocan la primera y la última letra de cada palabra. Cada tanto las letras se mudan de lugar. ¡El que encuentra más, gana!"},
    puzzle:{titulo:"¡El Puzzle!",descripcion:"Armen el mismo rompecabezas entre todos.",
      locucion:"¡Bienvenidos al Puzzle! Elijan una imagen y ármenla entre todos moviendo las piezas desde el celular. ¡Trabajo en equipo!"},
    duelo:{titulo:"¡Duelo de Conocimiento!",descripcion:"Respondan hablando al celular. El reloj corre.",
      locucion:"¡Bienvenidos al Duelo de Conocimiento! Banderas, cuentas, famosos y mucho más. Respondan hablando al celular antes de que se termine el reloj. ¡Que gane el que más sabe!"},
    quien:{titulo:"¡¿Quién soy?!",descripcion:"Uno de espaldas a la tele; los demás le dan pistas.",
      locucion:"¡Bienvenidos a Quién soy! Uno se pone de espaldas a la tele y los demás le dan pistas sin decir la palabra. ¡A adivinar antes de que se termine el tiempo!"},
    numero:{titulo:"¡¿Qué número soy?!",descripcion:"El que juega, de espaldas: los demás le dan pistas del número.",
      locucion:"¡Bienvenidos a Qué número soy! El que juega se pone de espaldas a la tele y los demás le dan pistas para que adivine su número. ¿Más alto o más bajo?"},
    mimica:{titulo:"¡Mímica!",descripcion:"Uno de espaldas adivina; los demás actúan sin hablar. Gana el que adivina más.",
      locucion:"¡Bienvenidos a Mímica! Uno se pone de espaldas a la tele y los demás actúan la frase sin hablar. Gana el que adivine más frases en su tiempo. ¡Silencio y a actuar!"}
  };
  /* La tele precarga el show de Giro mientras está en el menú: así el Rosco no
     arranca con la pantalla en negro esperando las imágenes. */
  const GIRO_B="presentacion-y-locucion-extensiones/Giro/";
  const GIRO_IMGS=["estudios/Giro_estudio_principal_16x9.webp","efectos/Giro_efecto_haces_de_luz_transparente.webp","efectos/Giro_efecto_destellos_transparente.png",
    "escenas/Giro_presentacion_plano_general_16x9.webp","estudios/Giro_estudio_rosco_un_atril_16x9.webp","estudios/Giro_estudio_rosco_juego_fondo.webp",
    "participantes/participante_hombre.webp","participantes/participante_mujer.webp","elementos/Giro_atril_oficial_chico.webp",
    "Giro_festejando.png","Giro_festejando_cuerpo.webp","Giro_confundido.png","Giro_suspenso.png","Giro_sorprendido.png","Giro_tarjetas.png",
    "escenas/Giro_cierre_victoria_16x9.webp","escenas/Giro_cierre_derrota_revancha_16x9.webp"].map(x=>GIRO_B+x).concat(["assets/logo.webp"]);
  const giroCargadas=[];
  function precargarGiro(){
    if(giroCargadas.length)return;
    GIRO_IMGS.forEach(src=>{const i=new Image();i.decoding="async";i.src=src;giroCargadas.push(i);});
    try{const v=document.createElement("video");v.preload="auto";v.muted=true;v.src=GIRO_B+"video/giro-apertura-tele."+(v.canPlayType('video/mp4; codecs="avc1.64001F"')?"mp4":"webm")+"?v=5";giroCargadas.push(v);}catch(e){}
    ["voz/giro-participantes-musica.mp3","voz/giro-rosco-inicio.mp3"].forEach(a=>{try{const au=new Audio();au.preload="auto";au.src=GIRO_B+a;giroCargadas.push(au);}catch(e){}});
    cargarGiro(()=>{});
  }
  /* Antes de mostrar la apertura, esperar (máximo 6 s) a que estén las imágenes. */
  function giroListo(){
    precargarGiro();
    const imgs=giroCargadas.filter(x=>x instanceof HTMLImageElement);
    return Promise.race([Promise.all(imgs.map(i=>i.complete?Promise.resolve():new Promise(ok=>{i.addEventListener("load",ok,{once:true});i.addEventListener("error",ok,{once:true});}))),new Promise(ok=>setTimeout(ok,6000))]);
  }
  function juegoRosco(T,actualizar){
    const CANT=20,SEGUNDOS=160,LETRAS="ABCDEFGHIJLMNOPQRSTUVYZ";
    const norm=s=>sinTilde(s).replace(/\s+/g,"");
    /* Singular o plural cuenta igual (31/10/2026, Gonzalo: "uñas" por UÑA, "departamentos" por DEPARTAMENTO):
       +S, +ES y Z→CES (lápiz/lápices), en las dos direcciones. */
    const mismoNumero=(a,b)=>{if(a===b)return true;const[c,l]=a.length<b.length?[a,b]:[b,a];if(c.length<3)return false;
      return l===c+"S"||l===c+"ES"||(c.endsWith("Z")&&l===c.slice(0,-1)+"CES");};
    function vale(d,valor){
      const ops=[d.palabra,...(d.alternativas||[])].map(norm);if(ops.some(o=>mismoNumero(o,valor)))return true;
      const base=norm(d.palabra),resto=valor.startsWith(base)?valor.slice(base.length):"";
      return resto.length>0&&resto.length<=12&&/^(DEL?|DELA|DELOS|DELAS)[A-Z]{3,}$/.test(resto);
    }
    /* Voz: el reconocimiento a veces oye casi lo mismo ("uva" → "Cuba", 31/10/2026). Se acepta si suena casi igual:
       1 letra de diferencia (2 si la palabra es larga), comparando cómo suena (b/v, s/z/c, h muda, etc.). */
    const distancia=(a,b)=>{const m=a.length,n=b.length;let pr=Array.from({length:n+1},(_,j)=>j);
      for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(pr[j]+1,c[j-1]+1,pr[j-1]+(a[i-1]===b[j-1]?0:1));pr=c;}return pr[n];};
    const casiIgual=(a,b)=>{if(!a||!b)return false;const l=Math.max(a.length,b.length);if(Math.min(a.length,b.length)<3)return a===b;
    /* Palabras cortas: solo una letra de más al principio o al final ("uva"/"cuba"); así "pato" no vale por GATO. */
    if(l<=5){const[c,g]=a.length<b.length?[a,b]:[b,a];return a===b||(g.length===c.length+1&&(g.slice(1)===c||g.slice(0,-1)===c));}
    return distancia(a,b)<=(l>=8?2:1);};
    const sonido=s=>norm(s).replace(/[^A-Z]/g,"").replace(/CH/g,"@").replace(/LL/g,"Y").replace(/GU(?=[EI])/g,"#").replace(/QU(?=[EI])/g,"K")
      .replace(/G(?=[EI])/g,"J").replace(/C(?=[EI])/g,"S").replace(/C/g,"K").replace(/Z/g,"S").replace(/V/g,"B").replace(/H/g,"").replace(/@/g,"CH").replace(/#/g,"G");
    const suenaIgual=(d,t)=>{const s=sonido(t);return s.length>=3&&[d.palabra,...(d.alternativas||[])].some(x=>{const o=sonido(x);return o===s||casiIgual(o,s);});};
    /* Misma memoria que el Rosco del celular: primero las que nunca salieron. */
    /* Y por persona (31/10/2026): el celular le pasa a la tele las palabras que esa persona ya vio (su memoria del Rosco,
       que también va en su respaldo) y la tele le devuelve las de este rosco para que no le vuelvan a salir. */
    function armar(pid){
      const banco=typeof ROSCO_DATOS!=="undefined"?ROSCO_DATOS:[],vistas=Vistas.cargar("rosco");
      const jj=T.jug.find(x=>x.pid===pid)||{},suyas=jj.vr instanceof Set?jj.vr:(jj.vr=new Set());
      const letras=mezclar([...LETRAS].filter(l=>banco.some(d=>d.letra===l))).slice(0,CANT).sort();
      const items=letras.map(l=>{const b=banco.filter(d=>d.letra===l);let libres=b.filter(d=>!vistas.has(d.palabra)&&!suyas.has(d.palabra));
        if(!libres.length)libres=b.filter(d=>!suyas.has(d.palabra));
        if(!libres.length){b.forEach(d=>{vistas.delete(d.palabra);suyas.delete(d.palabra);});libres=b;}
        const pref=libres.filter(d=>d.nivel<=2);const d=mezclar(pref.length?pref:libres)[0];vistas.add(d.palabra);suyas.add(d.palabra);return d;});
      Vistas.guardar("rosco",vistas);try{T.avisarVistas&&T.avisarVistas(pid,items.map(d=>d.palabra));}catch(e){}return items;
    }
    /* Rosco de a dos (31/10/2026): cada uno con su rosco, su reloj y su puntaje; juega uno por vez y el turno
       pasa al otro cuando erra, pasa, completa o se le acaba el tiempo (como el programa). Solo: un jugador. */
    const DOS=!!(T.roscoModo&&T.roscoModo.dos&&T.jug.some(j=>j.pid===T.roscoModo.rival));
    const P=(DOS?[T.mando,T.roscoModo.rival]:[T.mando]).map(pid=>{const it=armar(pid);return{pid,items:it,est:it.map(()=>"pendiente"),resp:it.map(()=>""),actual:0,tiempo:SEGUNDOS*1000,fin:false,ang:0};});
    let turno=0;const J=()=>P[turno];
    let items=P[0].items,est=P[0].est,resp=P[0].resp,actual=0,tiempo=SEGUNDOS*1000;
    const guardarJ=()=>{const j=J();j.actual=actual;j.tiempo=tiempo;j.ang=angPrevio;};
    const cargarJ=()=>{const j=J();items=j.items;est=j.est;resp=j.resp;actual=j.actual;tiempo=j.tiempo;angPrevio=j.ang;};
    const nombrePid=pid=>{const j=T.jug.find(x=>x.pid===pid);return j?j.n:"Jugador";};
    let aviso=null;
    let fase="show",ultimo=null,cambio=0,angPrevio=0,muerto=false,etapaPrev="",etapaT=0;
    let vozBloqueada=true,vozRonda=0,vozBloqueoId=0,vozRespaldo=null,vozReanudar=null;
    const G=()=>window.GiroRoscoPiloto;
    const jugador=()=>T.jug.find(j=>j.pid===J().pid)||{};
    const aJugar=()=>{if(muerto||fase!=="show")return;fase="jugando";const id=++vozBloqueoId;
      actualizar();vozReanudar=setTimeout(()=>reanudarVoz(id),600);};
    /* Apertura con música → Giro presenta → participante en su atril → partida en el estudio. En la revancha, sin la apertura. */
    cargarGiro(ok=>{
      if(muerto)return;
      if(!ok||!G().habilitado()){aJugar();return;}
      giroListo().then(()=>arrancarShow());
    });
    function arrancarShow(){
      if(muerto)return;
      const presentar=()=>{if(muerto)return;
        if(DOS){const a=T.jug.find(j=>j.pid===P[0].pid)||{},b=T.jug.find(j=>j.pid===P[1].pid)||{};
          if(!G().presentarDuelo(b.n||"Rival",aJugar,{nombre:a.n||"Jugador",personaje:a.pj||"",foto:fotoAtril(a.av||""),personajeRival:b.pj||"",fotoRival:fotoAtril(b.av||""),letras:CANT}))aJugar();return;}
        if(!G().presentarSolo(aJugar,{nombre:jugador().n||"Jugador",personaje:jugador().pj||"",foto:fotoAtril(jugador().av||"")}))aJugar();};
      if(giroAperturaVista){presentar();return;}
      giroAperturaVista=true;if(!G().mostrarInicio(presentar))aJugar();
    }
    const reaccionar=(tipo,fin)=>{try{const aro=document.querySelector("#teleTV .tl-aro");if(aro&&G())G().reaccion(tipo,aro,fin);else fin?.();}catch(e){fin?.();}};
    function reanudarVoz(id){
      if(muerto||fase!=="jugando"||id!==vozBloqueoId)return;
      clearTimeout(vozRespaldo);clearTimeout(vozReanudar);vozRespaldo=vozReanudar=null;
      vozBloqueada=false;vozDesde=Date.now();actualizar();
    }
    function pausarPorGiro(tipo){
      vozBloqueada=true;const id=++vozBloqueoId;clearTimeout(vozRespaldo);clearTimeout(vozReanudar);
      actualizar();
      const fin=()=>{if(muerto||id!==vozBloqueoId)return;clearTimeout(vozRespaldo);
        vozReanudar=setTimeout(()=>reanudarVoz(id),600);};
      /* Si el navegador no avisa que terminó el audio, la partida se recupera. */
      vozRespaldo=setTimeout(fin,4200);
      reaccionar(tipo,fin);
    }
    const pend=()=>est.map((s,i)=>s==="pendiente"?i:-1).filter(i=>i>=0);
    function avanzar(){const p=pend();if(!p.length){finJugador();return;}actual=p.find(i=>i>actual)??p[0];}
    /* De a dos: cambia de turno si al otro le queda rosco. */
    function cambiarTurno(){if(!DOS)return false;const otro=P[1-turno];if(otro.fin)return false;
      guardarJ();turno=1-turno;cargarJ();aviso={txt:"🔄 Le toca a "+nombrePid(J().pid),t:Date.now()};return true;}
    function finJugador(){J().fin=true;if(DOS&&cambiarTurno())return;terminar();}
    function terminar(){if(fase==="fin"||fase==="cierre")return;guardarJ();
      if(DOS){fase="fin";const res=P.map(j=>({n:nombrePid(j.pid),av:avDe(T,j.pid),ok:j.est.filter(s=>s==="ok").length,mal:j.est.filter(s=>s==="mal").length,t:j.tiempo}))
          .sort((a,b)=>b.ok-a.ok||a.mal-b.mal||b.t-a.t);const emp=res[0].ok===res[1].ok&&res[0].mal===res[1].mal;
        podioTele({juego:"EL ROSCO DE A DOS",titulo:emp?"¡EMPATE!":"¡GANÓ "+String(res[0].n).toUpperCase()+"!",sub:"Más aciertos (y si empatan, menos errores)",
          filas:res.map(x=>({n:x.n,av:x.av,pts:x.ok+" ✓ · "+x.mal+" ✘"}))});
        actualizar();return;}
      const ok=est.filter(s=>s==="ok").length,mal=est.filter(s=>s==="mal").length;
      try{const r=JSON.parse(localStorage.getItem("gya_tele_records")||"{}");if(ok>(r.rosco||0)){r.rosco=ok;localStorage.setItem("gya_tele_records",JSON.stringify(r));}}catch(e){}
      sfx(ok>=items.length/2?"aplausos":"abucheo");
      /* Cierre en el estudio (escena de ganador o de revancha con la voz de Giro); después, el resultado. */
      if(G()&&G().habilitado()&&G().mostrarFinal({aciertos:ok,errores:mal,total:items.length,puntos:ok*10,estudio:true},()=>{if(!muerto&&fase==="cierre"){fase="fin";actualizar();}})){fase="cierre";actualizar();return;}
      fase="fin";actualizar();}
    function accion(m){
      if(m.a==="rs_seguir"){if(G()&&(fase==="show"||fase==="cierre"))G().avanzar();return;}
      if(fase==="show"||fase==="cierre")return;
      if(fase==="fin"){if(m.a==="otra")T.otra();return;}
      if(vozBloqueada)return;
      if(["pasar","responder","dc_voz"].includes(m.a)&&m.pid!==J().pid)return;
      if(m.a==="pasar"){pasarLetra();return;}
      if(m.a==="responder"){const txt=limpio(m.txt,40);if(txt)responder(txt);return;}
      if(m.a==="dc_voz"){vozCelular(m.l,m.turno);return;}
    }
    function pasarLetra(){vozDesde=Date.now()+1200;vozBloqueada=true;vozRonda++;ultimo={i:actual,tipo:"paso"};cambio=Date.now();SND.turno();avanzar();if(fase==="jugando"){cambiarTurno();pausarPorGiro("pasar");}else actualizar();}
    function responder(txt,porVoz){
      const d=items[actual],ok=vale(d,norm(txt))||!!porVoz;vozDesde=Date.now()+1200;vozBloqueada=true;vozRonda++;
      est[actual]=ok?"ok":"mal";resp[actual]=txt;ultimo={i:actual,tipo:ok?"ok":"mal",palabra:d.palabra,dijo:txt};cambio=Date.now();
      if(ok)SND.ok();else SND.mal();
      avanzar();if(fase==="jugando"){if(!ok)cambiarTurno();pausarPorGiro(ok?"acierto":"error");}else actualizar();
    }
    /* Los aciertos y Pasar entran al instante; una respuesta final equivocada
       cuenta como error. Mientras habla Giro el celular deja de escuchar. */
    let vozDesde=0;
    const INTRO=/^(?:(?:(?:la|mi)\s+)?(?:respuesta|palabra)\s+(?:es|ser[ií]a)|(?:yo\s+)?(?:creo|pienso)\s+que\s+es|(?:yo\s+)?digo|se\s+llama|(?:es|ser[ií]a))\s+/i;
    /* Respaldo por si el altavoz de la tele llega al celular con retraso. */
    const ecoGiro=new Set(["Correcto","Muy bien","Eso es","Excelente","Uy no era esa","Uh casi","No no no","Qué lástima","Pasamos","Seguimos con otra","Se termina el tiempo","Rápido rápido"]
      .map(t=>sinTilde(t).replace(/[^A-Z]/g,"")));
    function vozCelular(lista,turno){
      if(fase!=="jugando"||vozBloqueada||Date.now()<vozDesde||turno!==undefined&&turno!==vozRonda||!Array.isArray(lista))return;
      for(const res of lista.slice(0,5)){
        const alts=(Array.isArray(res&&res.alts)?res.alts:[]).slice(0,5).map(x=>limpio(String(x||"").replace(/[¿¡!?,.;:]+$/g,""),60)).filter(Boolean);if(!alts.length)continue;
        const oi=document.querySelector("#tlOi");if(oi)oi.textContent="🎙 Oí: «"+alts[0]+"»";
        if(alts.some(t=>["PASAPALABRA","PASAR","PASO","PASA"].includes(sinTilde(t).replace(/[^A-Z]/g,"")))){if(res.isFinal||sinTilde(alts[0]).replace(/[^A-Z]/g,"")==="PASAR"){pasarLetra();return;}continue;}
        const d=items[actual],cands=alts.flatMap(t=>{const a=t.replace(INTRO,"");return[t,a,a.replace(/^(?:el|la|los|las|un|una)\s+/i,"")];});
        const buena=cands.find(t=>vale(d,norm(t)));if(buena){responder(buena);return;}
        const parecida=cands.find(t=>suenaIgual(d,t));if(parecida){responder(parecida,true);return;}
        if(alts.every(t=>ecoGiro.has(sinTilde(t).replace(/[^A-Z]/g,"")))){
          if(oi)oi.textContent="🔇 Giro habló; no cuenta como respuesta";
          continue;
        }
        if(res.isFinal){responder(alts[0]);return;}
      }
    }
    /* Si nadie toca "Siguiente" en el celular, el show avanza solo. */
    const ESPERA={giro:14000,participantes:12000,cierre:11000};
    function tic(dt){
      if(fase==="show"||fase==="cierre"){const e=G()&&G().etapa?G().etapa():"";if(e!==etapaPrev){etapaPrev=e;etapaT=0;}else etapaT+=dt;
        if(ESPERA[e]&&etapaT>ESPERA[e]){etapaT=-1e9;G().avanzar();}return;}
      if(fase!=="jugando"||vozBloqueada)return;const antesR=tiempo;tiempo-=dt;ticFinal(antesR,Math.max(0,tiempo));if(tiempo<=0){tiempo=0;SND.tiempo();reaccionar("tiempo");
        if(DOS){J().fin=true;guardarJ();if(cambiarTurno()){vozRonda++;pausarPorGiro("pasar");return;}}terminar();return;}
      const r=T.g&&document.querySelector("#tlReloj");if(r)r.textContent=reloj(tiempo);}
    const reloj=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");};
    const regla=d=>(norm(d.palabra)[0]===d.letra?"Empieza con la ":"Contiene la ")+d.letra;
    /* Marcador de a dos (31/10/2026): ranking en vivo como en el Tutti Frutti. */
    const cuenta=(j,e)=>j.est.filter(s=>s===e).length;
    function tablaDos(){const f=P.map((j,k)=>({j,k,ok:cuenta(j,"ok"),mal:cuenta(j,"mal"),q:cuenta(j,"pendiente")})).sort((a,b)=>b.ok-a.ok||a.mal-b.mal);
      return{f,emp:f[0].ok===f[1].ok&&f[0].mal===f[1].mal};}
    function marcadorDos(){const{f,emp}=tablaDos();
      return`<div class="tl-rd-rank"><div class="tl-rd-rank-cab"><span>🏆 MARCADOR</span><em>${emp?"¡Van empatados!":"Va ganando "+esc(nombrePid(f[0].j.pid))}</em></div>${f.map((x,pos)=>{const av=avDe(T,x.j.pid);
        return`<div class="tl-rd-fila${x.k===turno?" tl-rd-activo":""}${x.j.fin?" tl-rd-listo":""}"><span class="tl-rd-pos">${emp?"=":pos+1+"º"}</span><img src="assets/avatars/${av||"avatar-01"}.webp" alt="" onerror="this.style.visibility='hidden'"><b>${x.k===turno?"🎙 ":""}${esc(nombrePid(x.j.pid))}</b><span class="tl-ok">✓ ${x.ok}</span><span class="tl-mal">✘ ${x.mal}</span><small>${x.j.fin?"terminó":x.q+" letras"}</small><span class="tl-rd-reloj" ${x.k===turno?'id="tlReloj"':""}>${reloj(x.k===turno?tiempo:x.j.tiempo)}</span></div>`;}).join("")}</div>`;}
    function pintar(raiz,quien){
      const n=items.length,ok=est.filter(s=>s==="ok").length,mal=est.filter(s=>s==="mal").length;
      if(fase==="show"&&!document.querySelector(".grp-apertura,.grp-overlay")){
        raiz.innerHTML=`<div class="tl-centro tl-rosco tl-estudio"><img class="tl-logo" src="assets/logo.webp" alt=""><h1>Preparando el estudio…</h1></div>`;return;}
      if(DOS&&fase==="fin"){
        raiz.innerHTML=`<div class="tl-centro tl-fin"><h1>El Rosco de a dos</h1><div class="tl-rd-fin">${P.map(j=>{const o=j.est.filter(s=>s==="ok").length,m=j.est.filter(s=>s==="mal").length;
          return`<div class="tl-rd-card"><b>${esc(nombrePid(j.pid))}</b><span class="tl-ok">✓ ${o} aciertos</span><span class="tl-mal">✘ ${m} errores</span><span>⏱ ${reloj(SEGUNDOS*1000-j.tiempo)}</span></div>`;}).join("")}</div>
          <p class="tl-ayuda">${quien?esc(quien)+": desde el celular podés jugar otra vez o volver al menú.":""}</p></div>`;return;}
      if(fase==="fin"||fase==="cierre"){
        raiz.innerHTML=`<div class="tl-centro tl-fin"><h1>${ok>=n*.7?"¡Tremendo rosco! 🎉":ok>=n/2?"¡Muy bien! 👏":"¡Se terminó!"}</h1>
          <div class="tl-res"><span class="tl-ok">✓ ${ok} aciertos</span><span class="tl-mal">✘ ${mal} errores</span><span>⏱ ${reloj(SEGUNDOS*1000-tiempo)}</span></div>
          <div class="tl-planilla">${items.map((d,i)=>`<div class="tl-pl-fila tl-pl-${est[i]}"><b>${d.letra}</b><span>${esc(d.palabra)}</span><small>${est[i]==="ok"?"✓ acertó":est[i]==="mal"?"✘ dijo «"+esc(resp[i])+"»":"⏭ sin responder"}</small></div>`).join("")}</div>
          <p class="tl-ayuda">${quien?esc(quien)+": desde el celular podés jugar otra vez o volver al menú.":""}</p></div>`;return;}
      const d=items[actual],paso=360/n;let ang=-actual*paso;while(ang-angPrevio>180)ang-=360;while(angPrevio-ang>180)ang+=360;
      const letras=items.map((x,i)=>`<div class="tl-rl tl-${est[i]}${i===actual?" tl-actual":""}" style="--p:${i*paso}deg">${x.letra}</div>`).join("");
      const flash=ultimo&&Date.now()-cambio<1800?(ultimo.tipo==="ok"?`<div class="tl-flash tl-ok">✓ ¡Bien! «${esc(ultimo.palabra)}»</div>`:ultimo.tipo==="mal"?`<div class="tl-flash tl-mal">✘ Dijo «${esc(ultimo.dijo||"")}» · Era ${esc(ultimo.palabra)}</div>`:`<div class="tl-flash tl-paso">Pasó ⏭</div>`):"";
      raiz.innerHTML=`<div class="tl-rosco tl-estudio">
        <div class="tl-aro"><div class="tl-giro" style="--a:${angPrevio}deg">${letras}</div>
          <div class="tl-medio"><div class="tl-letra">${d.letra}</div><div class="tl-regla">${regla(d)}</div></div></div>
        <aside class="tl-panel">${DOS?marcadorDos():""}
          <p class="tl-quien">🎮 Juega ${esc(DOS?nombrePid(J().pid):(quien||"…"))}</p>${aviso&&Date.now()-aviso.t<2600?`<div class="tl-flash tl-paso tl-rd-aviso">${esc(aviso.txt)}</div>`:""}
          <div class="tl-def">${esc(d.definicion)}</div>
          ${DOS?"":`<div class="tl-hud"><span class="tl-ok">✓ ${ok}</span><span class="tl-mal">✘ ${mal}</span><span id="tlReloj">${reloj(tiempo)}</span></div>`}
          <p class="tl-oi" id="tlOi">🎙 Respondé hablando al celular o escribiendo · «Pasar» para pasar</p>${flash}</aside></div>`;
      /* El rosco gira hasta poner adelante la letra del turno. */
      const g=raiz.querySelector(".tl-giro");requestAnimationFrame(()=>requestAnimationFrame(()=>{if(g)g.style.setProperty("--a",ang+"deg");}));angPrevio=ang;
    }
    return{accion,tic,pintar,fin(){muerto=true;clearTimeout(vozRespaldo);clearTimeout(vozReanudar);try{if(G())G().cerrar();}catch(e){}},cel(){
      if(fase==="show"||fase==="cierre")return{pantalla:"rosco_show",fase};
      if(fase==="fin")return{pantalla:"fin",juego:"rosco",resumen:DOS?P.map(j=>nombrePid(j.pid)+": "+j.est.filter(s=>s==="ok").length+" ✓").join(" · "):est.filter(s=>s==="ok").length+" aciertos"};
      return{pantalla:"rosco",letra:items[actual].letra,regla:regla(items[actual]),escucha:fase==="jugando"&&!vozBloqueada?J().pid:null,puede:!vozBloqueada,turno:vozRonda,i:actual+(DOS?turno*100:0),
        dos:DOS,activo:J().pid,nombreActivo:nombrePid(J().pid),marcador:DOS?tablaDos().f.map(x=>({n:nombrePid(x.j.pid),ok:x.ok,mal:x.mal,juega:x.k===turno})):null};}};
  }

  /* ---------- Ahorcado: la partida como en el celular; el celular es el teclado ---------- */
  /* La tele también deja precargados los dibujos del Ahorcado (casilla con letra incluida). */
  const AHORCADO_IMGS=["casilla","casilla_ok","horca","vida","vida_perdida","gano","perdio"].map(n=>"assets/ahorcado/"+n+".webp");let ahorcadoCargadas=[];
  function precargarAhorcado(){if(ahorcadoCargadas.length)return;ahorcadoCargadas=AHORCADO_IMGS.map(src=>{const i=new Image();i.src=src;try{i.decode().catch(()=>{});}catch(e){}return i;});}
  function juegoAhorcado(T,actualizar){
    precargarAhorcado();
    const C=typeof AHORCADO_CONFIG!=="undefined"?AHORCADO_CONFIG:{palabras:5,vidas:6,ptsPalabra:150,ptsVida:20};
    const LET=typeof AHORCADO_LETRAS!=="undefined"?AHORCADO_LETRAS:"ABCDEFGHIJKLMNOPQRSTUVYZ";
    const CATS=typeof AHORCADO_CATEGORIAS!=="undefined"?AHORCADO_CATEGORIAS:[];
    let n=0,puntos=0,pal=null,usadas=new Set(),errores=0,fase="giro",ganadas=0,timer=null;
    function elegir(){
      const todas=AHORCADO_DATOS,libres=Vistas.filtrar("ahorcado",todas,d=>d.palabra);
      const cats=[...new Set(libres.map(d=>d.categoria))],cat=cats[Math.floor(Math.random()*cats.length)];
      const ops=libres.filter(d=>d.categoria===cat),d=ops[Math.floor(Math.random()*ops.length)];Vistas.marcar("ahorcado",d.palabra);return d;
    }
    function nueva(){n++;pal=elegir();usadas=new Set();errores=0;fase="giro";SND.turno();actualizar();clearTimeout(timer);timer=setTimeout(()=>{fase="jugando";actualizar();},1800);}
    const completa=()=>[...pal.palabra].every(c=>usadas.has(c));
    function cerrarPalabra(gano){fase="entre";if(gano){ganadas++;puntos+=C.ptsPalabra+C.ptsVida*(C.vidas-errores);sfx("aplausos");}else sfx("abucheo");actualizar();
      clearTimeout(timer);timer=setTimeout(()=>{if(n>=C.palabras){fase="fin";try{const r=JSON.parse(localStorage.getItem("gya_tele_records")||"{}");if(puntos>(r.ahorcado||0)){r.ahorcado=puntos;localStorage.setItem("gya_tele_records",JSON.stringify(r));}}catch(e){}
        podioTele({juego:"AHORCADO",titulo:ganadas>=Math.ceil(C.palabras*.6)?"¡LO LOGRARON!":"¡SE TERMINÓ!",sub:ganadas+" de "+C.palabras+" palabras adivinadas",equipo:true,filas:[{n:"Todo el grupo",pts:puntos+" puntos"}]});
        actualizar();}else nueva();},3000);}
    function accion(m){
      if(fase==="fin"){if(m.a==="otra")T.otra();return;}
      if(m.a!=="letra"||fase!=="jugando")return;const l=String(m.l||"");if(!LET.includes(l)||usadas.has(l))return;usadas.add(l);
      if(pal.palabra.includes(l)){SND.ok();if(completa()){cerrarPalabra(true);return;}}
      else{errores++;SND.mal();if(errores>=C.vidas){cerrarPalabra(false);return;}}
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
  /* Silabario y Frases en Giro en la tele (30/10/2026): la tele muestra la pista y las piezas mezcladas
     (sílabas o palabras, con alguna trampa de más); cada uno arma la respuesta tocando las piezas en su celular.
     El primero que la arma suma 10, después 8, 6, 5, 4 y 3. Al final de las rondas, podio. */
  /* ---------- Sopa Fugaz (31/10/2026, reemplaza al Puzzle en el menú de la tele) ----------
     La sopa se ve en la tele y cada uno marca desde su celular tocando la primera y la última letra.
     Gana el que encuentra más palabras (100 c/u). Como en el celular se elige Clásica (letras quietas)
     o Giratoria: cada 14 s la grilla gira y las palabras que faltan cambian de lugar (las encontradas no vuelven). */
  function juegoSopa(T,actualizar){
    const N=10,RONDAS=4,PAL=6,MUDA=14000,PTS=100,GB="presentacion-y-locucion-extensiones/Giro/";
    const DIRS=[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
    const COL=["#F5B301","#37D6C0","#E5197C","#9B6BFF","#2ED18A","#FF8A3D","#3DA5FF","#FFFFFF"];
    const jugadores=T.jug.map(j=>({pid:j.pid,n:j.n})),puntos={},color={};
    jugadores.forEach((j,i)=>{puntos[j.pid]=0;color[j.pid]=COL[i%COL.length];});
    const lim=w=>String(w||"").toUpperCase().replace(/[^A-ZÑ]/g,"");
    const temas=mezclar((typeof SOPA_DATOS!=="undefined"&&SOPA_DATOS.categorias||[]).map(c=>({nombre:c.nombre,
      palabras:[...new Set((c.palabras||[]).map(lim))].filter(w=>w.length>=4&&w.length<=N)})).filter(c=>c.palabras.length>=PAL)).slice(0,RONDAS);
    let ronda=0,tema=null,objetivos=[],halladas={},ubic={},grid=[],gen=0,prev=null,cambioGen=0,restante=0,proxMuda=MUDA,fase="config",timer=null,muerto=false,ult={},mudo=false,giratoria=true;
    function armarGrilla(){
      const faltan=mezclar(objetivos.filter(w=>!halladas[w])).sort((a,b)=>b.length-a.length);
      for(let intento=0;intento<80;intento++){
        const g=Array(N*N).fill(""),pos={};let bien=true;
        for(const w of faltan){let puesto=false;
          for(let k=0;k<400&&!puesto;k++){
            const[dr,dc]=DIRS[Math.floor(Math.random()*8)],r0=Math.floor(Math.random()*N),c0=Math.floor(Math.random()*N),L=[...w].length;
            const rf=r0+dr*(L-1),cf=c0+dc*(L-1);if(rf<0||rf>=N||cf<0||cf>=N)continue;
            const cel=Array.from({length:L},(_,i)=>(r0+dr*i)*N+c0+dc*i),le=[...w];
            if(cel.some((x,i)=>g[x]&&g[x]!==le[i]))continue;
            cel.forEach((x,i)=>g[x]=le[i]);pos[w]=cel;puesto=true;}
          if(!puesto){bien=false;break;}}
        if(!bien)continue;
        /* Relleno con letras de las mismas palabras: así hay señuelos. */
        const letras=[...(objetivos.join("")+"AEIOUSRNLTCMDP")];
        for(let i=0;i<g.length;i++)if(!g[i])g[i]=letras[Math.floor(Math.random()*letras.length)];
        ubic=pos;return g;}
      return null;
    }
    function nueva(){
      ronda++;tema=temas[ronda-1];if(!tema){terminar();return;}
      let pool=tema.palabras;try{pool=Vistas.filtrar("sopa_tele",pool,x=>x);}catch(e){}
      objetivos=mezclar(pool).slice(0,PAL);
      if(objetivos.length<PAL)objetivos=objetivos.concat(mezclar(tema.palabras.filter(w=>!objetivos.includes(w))).slice(0,PAL-objetivos.length));
      halladas={};ult={};prev=null;let g=armarGrilla();if(!g){objetivos=objetivos.slice(0,4);g=armarGrilla();}
      try{Vistas.marcar("sopa_tele",objetivos);}catch(e){}
      grid=g||Array(N*N).fill("A");gen++;cambioGen=Date.now();mudo=false;
      restante=Math.round(objetivos.reduce((s,w)=>s+7+1.3*w.length,0)*(giratoria?1:.87)*1000);proxMuda=MUDA;fase="jugando";
      if(ronda>1)SND.turno();actualizar();
    }
    function mudar(){
      const g=armarGrilla();if(!g)return;
      prev={g:grid,gen};grid=g;gen++;cambioGen=Date.now();mudo=true;
      Object.values(halladas).forEach(h=>h.cel=null);SND.turno();actualizar();
    }
    function revelar(){if(fase!=="jugando")return;fase="revela";actualizar();clearTimeout(timer);
      timer=setTimeout(()=>{if(muerto)return;if(ronda>=temas.length)terminar();else nueva();},5500);}
    function terminar(){fase="fin";clearTimeout(timer);
      const f=jugadores.map(j=>({n:nombreDe(T,j.pid),av:avDe(T,j.pid),v:puntos[j.pid]||0})).sort((a,b)=>b.v-a.v);const emp=f.length>1&&f[0].v===f[1].v;
      podioTele({juego:"SOPA FUGAZ",titulo:f.length<2?"¡"+String(f[0]?f[0].n:"").toUpperCase()+" SUMÓ "+(f[0]?f[0].v:0)+"!":emp?"¡EMPATE!":"¡GANÓ "+String(f[0].n).toUpperCase()+"!",
        sub:"100 puntos por cada palabra encontrada",equipo:f.length<2,filas:f.map(x=>({n:x.n,av:x.av,pts:x.v+" pts"}))});
      actualizar();}
    function marcar(m){
      if(fase!=="jugando")return;const pid=m.pid;
      if(!(pid in puntos)){puntos[pid]=0;color[pid]=COL[Object.keys(color).length%COL.length];jugadores.push({pid,n:nombreDe(T,pid)});}
      /* La marca vale contra la grilla que tenía en pantalla (hasta 3 s después de una mudanza). */
      let g=null;if(m.g===gen)g=grid;else if(prev&&m.g===prev.gen&&Date.now()-cambioGen<3000)g=prev.g;
      if(!g){ult[pid]={ok:false,t:Date.now(),txt:"Se mudaron las letras, probá de nuevo"};actualizar();return;}
      const a=Number(m.x),b=Number(m.y);if(!(a>=0&&a<N*N&&b>=0&&b<N*N)||a===b)return;
      const r1=Math.floor(a/N),c1=a%N,r2=Math.floor(b/N),c2=b%N,dr=Math.sign(r2-r1),dc=Math.sign(c2-c1),L=Math.max(Math.abs(r2-r1),Math.abs(c2-c1))+1;
      if(!(r1===r2||c1===c2||Math.abs(r2-r1)===Math.abs(c2-c1))){ult[pid]={ok:false,t:Date.now(),txt:"Tiene que ser en línea recta"};SND.mal();actualizar();return;}
      const cel=Array.from({length:L},(_,i)=>(r1+dr*i)*N+c1+dc*i),s=cel.map(k=>g[k]).join(""),rev=[...s].reverse().join("");
      const w=objetivos.find(x=>!halladas[x]&&(x===s||x===rev));
      if(!w){const ya=objetivos.find(x=>halladas[x]&&(x===s||x===rev));
        ult[pid]={ok:false,t:Date.now(),txt:ya?"«"+ya+"» ya la encontró "+nombreDe(T,halladas[ya].pid):"«"+s+"» no está en la lista"};SND.mal();actualizar();return;}
      halladas[w]={pid,cel:g===grid?cel:null};puntos[pid]+=PTS;ult[pid]={ok:true,t:Date.now(),txt:"¡"+w+"! +"+PTS};SND.ok();
      if(objetivos.every(x=>halladas[x]))revelar();else actualizar();
    }
    function accion(m){
      if(m.a==="otra"&&fase==="fin"&&m.pid===T.mando){T.otra();return;}
      /* Como en el celular: Clásica (letras quietas) o Giratoria (las letras se mudan). */
      if(m.a==="sp_modo"&&fase==="config"&&m.pid===T.mando){giratoria=m.modo!=="clasica";nueva();return;}
      if(m.a==="sp_marca"){marcar(m);return;}
      if(m.a==="sp_saltar"&&m.pid===T.mando&&fase==="jugando"){revelar();return;}
    }
    function tic(dt){if(fase!=="jugando")return;const a=restante;restante=Math.max(0,restante-dt);ticFinal(a,restante);
      if(restante<=0){SND.tiempo();revelar();return;}
      if(giratoria){proxMuda-=dt;if(proxMuda<=0){proxMuda=MUDA;mudar();return;}}
      const r=document.querySelector("#tlSpReloj");if(r){const s=Math.ceil(restante/1000);r.textContent=s;r.classList.toggle("tl-urgente",s<=10);}
      const b=document.querySelector("#tlSpMuda");if(b)b.style.width=(100*proxMuda/MUDA).toFixed(1)+"%";}
    function pintar(raiz){
      if(fase==="config"){raiz.innerHTML=`<div class="tl-sp"><img class="tl-or-fondo" src="${GB}estudios/Giro_estudio_principal_16x9.webp" alt="">
        <div class="tl-sp-modos"><h1>🔎 Sopa Fugaz</h1><p>${esc(nombreDe(T,T.mando))} elige el modo desde su celular</p>
          <div><div class="tl-sp-modo"><b>🧩 Clásica</b><span>Las letras quedan quietas</span></div><div class="tl-sp-modo"><b>🌀 Giratoria</b><span>Cada 14 s la sopa gira y las letras se mudan</span></div></div></div></div>`;return;}
      if(!tema){raiz.innerHTML=`<div class="tl-centro"><h1>Preparando…</h1></div>`;return;}
      const rev=fase==="revela",marca={};
      Object.entries(halladas).forEach(([w,h])=>(h.cel||[]).forEach(k=>marca[k]=color[h.pid]));
      if(rev)objetivos.filter(w=>!halladas[w]).forEach(w=>(ubic[w]||[]).forEach(k=>{if(!marca[k])marca[k]="falta";}));
      /* Si se repinta durante el giro, sigue desde donde iba (no vuelve a empezar). */
      const giro=Date.now()-cambioGen,gira=mudo&&giro<1100;
      const celdas=grid.map((l,k)=>{const c=marca[k];return`<span class="${c==="falta"?"tl-sp-falta":c?"tl-sp-h":""}"${c&&c!=="falta"?` style="--c:${c}"`:""}>${esc(l)}</span>`;}).join("");
      const ranking=[...jugadores].sort((a,b)=>puntos[b.pid]-puntos[a.pid]).map(j=>`<span style="--c:${color[j.pid]}"><i></i>${esc(nombreDe(T,j.pid))} <b>${puntos[j.pid]}</b></span>`).join("");
      raiz.innerHTML=`<div class="tl-sp"><img class="tl-or-fondo" src="${GB}estudios/Giro_estudio_principal_16x9.webp" alt="">
        <div class="tl-or-top"><span>🔎 SOPA FUGAZ${giratoria?" 🌀":""}</span><span>RONDA ${ronda}/${temas.length}</span><span class="tl-or-reloj" id="tlSpReloj">${Math.ceil(restante/1000)}</span></div>
        <div class="tl-sp-cuerpo">
          <div class="tl-sp-tablero${gira?" tl-sp-gira":""}" style="--n:${N}${gira?";animation-delay:-"+giro+"ms":""}">${celdas}</div>
          <aside class="tl-sp-panel"><small>TEMA</small><div class="tl-sp-tema">${esc(tema.nombre)}</div>
            ${rev?`<div class="tl-sp-fin">${objetivos.every(w=>halladas[w])?"🎉 ¡Encontraron todas!":"⏱ ¡Tiempo! En rojo, las que faltaron"}</div>`:!giratoria?"":`<div class="tl-sp-muda"><i id="tlSpMuda" style="width:${(100*proxMuda/MUDA).toFixed(1)}%"></i><em>🌀 Las letras se mudan</em></div>`}
            <div class="tl-sp-lista">${objetivos.map(w=>{const h=halladas[w];return h?`<span class="tl-sp-ok" style="--c:${color[h.pid]}">${esc(w)}<small>${esc(nombreDe(T,h.pid))}</small></span>`:`<span class="${rev?"tl-sp-falto":""}">${esc(w)}</span>`;}).join("")}</div>
            <div class="tl-sp-rank">${ranking}</div></aside></div>
        <p class="tl-or-ayuda">${rev?"⏳ Ya viene la siguiente…":"📱 En tu celular: tocá la primera y la última letra de la palabra"}</p></div>`;
      if(gira){const t=raiz.querySelector(".tl-sp-tablero");setTimeout(()=>{if(t)t.classList.remove("tl-sp-gira");},Math.max(0,1150-giro));}
    }
    function cel(){
      if(fase==="fin")return{pantalla:"fin",juego:"sopa",resumen:"Mirá el podio en la tele 🏆"};
      if(fase==="config")return{pantalla:"sopa",fase,quien:nombreDe(T,T.mando)};
      const h=[];Object.values(halladas).forEach(x=>(x.cel||[]).forEach(k=>h.push(k)));
      return{pantalla:"sopa",fase,ronda,tema:tema?tema.nombre:"",n:N,g:gen,grid:grid.join(""),h,pal:objetivos.map(w=>[w,halladas[w]?nombreDe(T,halladas[w].pid):""]),pts:puntos,ult};
    }
    return{accion,tic,pintar,cel,fin(){muerto=true;clearTimeout(timer);}};
  }
  function juegoOrdenar(T,actualizar,id){
    const SIL=id==="silabario";
    const CFG=SIL?{nombre:"SILABARIO",icono:"🔤",rondas:8,seg:40,unir:"",niveles:[3,3,2],etiqueta:"ARMÁ LA PALABRA"}
                 :{nombre:"FRASES EN GIRO",icono:"💬",rondas:6,seg:60,unir:" ",niveles:[2,2,2],etiqueta:"ORDENÁ LA FRASE"};
    const PTS=[10,8,6,5,4,3,3,3];
    let ronda=0,item=null,fichas=[],restante=0,fase="jugando",timer=null,muerto=false;
    let resueltos={},lugar=0,fallos={},puntos={},items=[],armado={};
    const jugadores=T.jug.map(j=>({pid:j.pid,n:j.n}));jugadores.forEach(j=>puntos[j.pid]=0);
    function base(){
      if(SIL){const d=typeof SILABARIO_DATOS!=="undefined"?SILABARIO_DATOS:[];
        return d.map(x=>Array.isArray(x)?{pista:x[0],piezas:x[1],nivel:x[3]||1}:{pista:x.pista,piezas:x.silabas||[],nivel:x.nivel||1}).filter(x=>x.piezas.length);}
      const d=typeof FRASES_EN_GIRO_DATOS!=="undefined"?FRASES_EN_GIRO_DATOS:[];
      return d.map(x=>({pista:x.pista,piezas:String(x.texto).split(/\s+/),trampas:x.trampas||[],nivel:x.nivel||1}));
    }
    function armar(){
      const todos=base();const clave=x=>x.piezas.join(" ");
      let libres=todos;try{libres=Vistas.filtrar(SIL?"silabario_tele":"frases_tele",todos,clave);}catch(e){}
      const out=[];CFG.niveles.forEach((k,i)=>{let nv=mezclar(libres.filter(x=>x.nivel===i+1));if(nv.length<k)nv=nv.concat(mezclar(todos.filter(x=>x.nivel===i+1&&!nv.includes(x))));out.push(...nv.slice(0,k));});
      return out.length?out:mezclar(todos).slice(0,CFG.rondas);
    }
    function trampas(it){
      if(!SIL)return (it.trampas||[]).slice(0,2);
      const todas=[...new Set(base().flatMap(x=>x.piezas))].filter(x=>!it.piezas.includes(x));
      /* En la tele el tablero es compartido: sumamos opciones cada dos rondas.
         Las pistas también pasan de nivel 1 a 3 durante la partida. */
      /* Como en el celular: tablero lleno de 6×5 sílabas (las de la palabra + de relleno). */
      return mezclar(todas).slice(0,Math.max(0,30-it.piezas.length));
    }
    function nueva(){
      ronda++;item=items[ronda-1];if(!item){terminar();return;}
      fichas=mezclar([...item.piezas,...trampas(item)]);resueltos={};lugar=0;fallos={};armado={};restante=CFG.seg*1000;fase="jugando";
      try{Vistas.marcar(SIL?"silabario_tele":"frases_tele",item.piezas.join(" "));}catch(e){}
      if(ronda>1)SND.turno();actualizar();
    }
    function revelar(){if(fase!=="jugando")return;fase="revela";actualizar();clearTimeout(timer);
      timer=setTimeout(()=>{if(muerto)return;if(ronda>=items.length)terminar();else nueva();},4200);}
    function terminar(){fase="fin";clearTimeout(timer);
      const f=jugadores.map(j=>({n:j.n,av:avDe(T,j.pid),v:puntos[j.pid]||0})).sort((a,b)=>b.v-a.v);const emp=f.length>1&&f[0].v===f[1].v;
      podioTele({juego:CFG.nombre,titulo:f.length<2?"¡"+String(f[0]?f[0].n:"").toUpperCase()+" SUMÓ "+(f[0]?f[0].v:0)+"!":emp?"¡EMPATE!":"¡GANÓ "+String(f[0].n).toUpperCase()+"!",
        sub:"El más rápido en armar"+(SIL?" las palabras":" las frases"),equipo:f.length<2,filas:f.map(x=>({n:x.n,av:x.av,pts:x.v+" pts"}))});
      actualizar();}
    function accion(m){
      if(m.a==="otra"&&fase==="fin"&&m.pid===T.mando){T.otra();return;}
      if(m.a==="or_saltar"&&fase==="jugando"&&m.pid===T.mando){revelar();return;}
      /* Lo que cada uno va tocando en el celular aparece en la tele al instante (31/10/2026). */
      if(m.a==="or_arma"){if(fase!=="jugando"||Number(m.r)!==ronda||resueltos[m.pid]||!(m.pid in puntos))return;
        const o=(Array.isArray(m.orden)?m.orden.map(Number):[]).slice(0,item.piezas.length);
        if(new Set(o).size!==o.length||o.some(i=>!(i>=0&&i<fichas.length)))return;armado[m.pid]=o;actualizar();return;}
      if(m.a!=="or_resp"||fase!=="jugando"||Number(m.r)!==ronda||resueltos[m.pid]||!(m.pid in puntos))return;
      const o=Array.isArray(m.orden)?m.orden.map(Number):[];
      if(o.length!==item.piezas.length||new Set(o).size!==o.length||o.some(i=>!(i>=0&&i<fichas.length)))return;
      const bien=o.every((i,k)=>sinTilde(fichas[i])===sinTilde(item.piezas[k]));
      if(bien){resueltos[m.pid]=++lugar;puntos[m.pid]+=PTS[Math.min(lugar-1,PTS.length-1)];SND.ok();
        if(jugadores.every(j=>resueltos[j.pid])){actualizar();setTimeout(revelar,900);return;}}
      else{fallos[m.pid]=(fallos[m.pid]||0)+1;armado[m.pid]=[];SND.mal();}
      actualizar();
    }
    function tic(dt){if(fase!=="jugando")return;const a=restante;restante=Math.max(0,restante-dt);ticFinal(a,restante);
      const el=document.querySelector("#tlOrReloj");if(el){el.textContent=Math.ceil(restante/1000);el.classList.toggle("tl-urgente",restante<=10000);}
      if(restante<=0){SND.tiempo();revelar();}}
    function pintar(raiz){
      const GB="presentacion-y-locucion-extensiones/Giro/";
      if(!item){raiz.innerHTML=`<div class="tl-centro"><h1>Preparando…</h1></div>`;return;}
      const rev=fase!=="jugando";
      /* Uno solo: lo que toca se arma en los casilleros grandes. Varios: cada uno ve su armado debajo de su nombre. */
      const solo=jugadores.length===1,mio=solo?(armado[jugadores[0].pid]||[]):[],usadas=new Set(mio);
      const jug=jugadores.map(j=>{const a=armado[j.pid]||[];
        return`<span class="${resueltos[j.pid]?"tl-or-ok":""}">${resueltos[j.pid]?resueltos[j.pid]+"º ✓ ":""}${esc(j.n)} · <b>${puntos[j.pid]}</b>${!solo&&!rev&&!resueltos[j.pid]&&a.length?`<em class="tl-or-mini">${a.map(i=>esc(fichas[i])).join(SIL?"·":" ")}</em>`:""}</span>`;}).join("");
      raiz.innerHTML=`<div class="tl-or${SIL?" tl-or-sil":" tl-or-fra"}"><img class="tl-or-fondo" src="${GB}estudios/Giro_estudio_principal_16x9.webp" alt="">
        <div class="tl-or-top"><span>${CFG.icono} ${CFG.nombre}</span><span>RONDA ${ronda}/${items.length}</span><span class="tl-or-reloj" id="tlOrReloj">${Math.ceil(restante/1000)}</span></div>
        <div class="tl-or-card"><small>${CFG.etiqueta}</small><p class="tl-or-pista">${esc(item.pista)}</p>
          <div class="tl-or-slots">${item.piezas.map((x,k)=>rev?`<span class="tl-or-vista">${esc(x)}</span>`:mio[k]!=null?`<span class="tl-or-puesta">${esc(fichas[mio[k]])}</span>`:`<span></span>`).join("")}</div>
          ${rev?"":`<div class="tl-or-fichas">${fichas.map((x,i)=>`<span class="${usadas.has(i)?"tl-or-usada":""}">${esc(x)}</span>`).join("")}</div>`}</div>
        <div class="tl-or-jug">${jug}</div>
        <p class="tl-or-ayuda">${rev?"⏳ Ya viene la siguiente…":"📱 Armalo tocando las piezas en tu celular · ¡ojo que hay de más!"}</p></div>`;
    }
    function cel(){
      if(fase==="fin")return{pantalla:"fin",juego:id,resumen:"Mirá el podio en la tele 🏆"};
      return{pantalla:"ordenar",juego:id,fase,ronda,pista:item?item.pista:"",fichas,n:item?item.piezas.length:0,unir:CFG.unir,
        resueltos:Object.keys(resueltos),mal:fallos,respuesta:fase==="revela"&&item?item.piezas.join(CFG.unir):""};
    }
    items=armar().slice(0,CFG.rondas);setTimeout(()=>{if(!muerto)nueva();},50);
    return{accion,tic,pintar,cel,fin(){muerto=true;clearTimeout(timer);}};
  }
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
    let ronda=0,puntos=0,preg=null,abiertas=new Set(),errores=0,fase="jugando",ya=[],timer=null,ultimo=null,cambio=0,recien=-1,pose="tarjetas",muerto=false;
    /* El mismo programa que el Rosco: estudio de fondo y Giro en su atril que lee la
       pregunta (voz de la tele, la más grave que tenga) y reacciona con sus frases grabadas. */
    const GB="presentacion-y-locucion-extensiones/Giro/";
    let audioGiro=null;
    function hablar(t){try{if(!window.speechSynthesis||muerto)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="es-UY";u.rate=.95;
      const vm=typeof obtenerVozMasculina==="function"?obtenerVozMasculina():null;if(vm){u.voice=vm;u.pitch=.9;}else u.pitch=.75;speechSynthesis.speak(u);}catch(e){}}
    const ultimaFrase={};
    function fraseGiro(tipo){const ops=[1,2,3,4].map(n=>tipo+"-"+n).filter(f=>f!==ultimaFrase[tipo]);const f=ops[Math.floor(Math.random()*ops.length)];ultimaFrase[tipo]=f;
      try{if(audioGiro)audioGiro.pause();try{speechSynthesis.cancel();}catch(e){}audioGiro=new Audio(GB+"voz/reacciones/giro-"+f+".mp3");audioGiro.play().catch(()=>{});}catch(e){}}
    function nueva(){preg=elegir(ya);ya.push(preg.id);abiertas=new Set();errores=0;fase="jugando";recien=-1;pose="tarjetas";actualizar();
      setTimeout(()=>{if(!muerto&&fase==="jugando")hablar(`Ronda ${ronda+1}${MULT[ronda]>1?", vale por "+MULT[ronda]:""}. ${preg.pregunta}`);},600);}
    function cerrar(){fase="entre";pose=abiertas.size===preg.respuestas.length?"festejando":"sorprendido";recien=-1;preg.respuestas.forEach((_,i)=>abiertas.add(i));actualizar();clearTimeout(timer);
      timer=setTimeout(()=>{ronda++;if(ronda>=MULT.length){fase="fin";try{const r=JSON.parse(localStorage.getItem("gya_tele_records")||"{}");if(puntos>(r.cien||0)){r.cien=puntos;localStorage.setItem("gya_tele_records",JSON.stringify(r));}}catch(e){}
        podioTele({juego:"100 RIOPLATENSES",titulo:"¡LO LOGRARON!",sub:"Lo que dijo la gente, en "+MULT.length+" rondas",equipo:true,filas:[{n:"Todo el grupo",pts:puntos+" puntos"}]});
        actualizar();}else{SND.turno();nueva();}},4500);}
    function accion(m){
      if(fase==="fin"){if(m.a==="otra")T.otra();return;}
      if(m.a!=="responder"||fase!=="jugando")return;const v=norm(limpio(m.txt,40));if(!v)return;
      const i=preg.respuestas.findIndex(r=>[r.texto,...r.alias].some(a=>{const an=norm(a);return an&&(an===v||misma(an,v));}));
      cambio=Date.now();
      if(i>=0&&!abiertas.has(i)){abiertas.add(i);recien=i;pose="festejando";puntos+=preg.respuestas[i].puntos*MULT[ronda];ultimo={tipo:"ok",i};SND.ok();
        hablar(`¡Está! ${preg.respuestas[i].texto}. ${preg.respuestas[i].puntos} puntos.`);
        if(abiertas.size===preg.respuestas.length){sfx("aplausos");cerrar();return;}}
      else if(i>=0){ultimo={tipo:"repe",txt:preg.respuestas[i].texto};recien=-1;sonar(420,.1,"sine",.05);hablar(preg.respuestas[i].texto+" ya está en el tablero.");}
      else{errores++;recien=-1;pose="confundido";ultimo={tipo:"mal",txt:limpio(m.txt,24)};SND.mal();fraseGiro("error");if(errores>=ERRORES){cerrar();return;}}
      actualizar();
    }
    function pintar(raiz,quien){
      if(fase==="fin"){let r={};try{r=JSON.parse(localStorage.getItem("gya_tele_records")||"{}");}catch(e){}
        raiz.innerHTML=`<div class="tl-centro tl-fin"><h1>¡${puntos} puntos! 🎉</h1><p class="tl-ayuda">Récord del grupo en esta tele: ${r.cien||puntos} puntos</p><p class="tl-ayuda">${quien?esc(quien)+": desde el celular podés jugar otra vez o volver al menú.":""}</p></div>`;return;}
      const cat=(typeof CIEN_CATEGORIAS!=="undefined"?CIEN_CATEGORIAS:[]).find(c=>c.id===preg.categoria)||{icono:"💬",nombre:""};
      const panel=preg.respuestas.map((r,i)=>abiertas.has(i)?`<div class="tl-resp tl-abierta${i===recien?" tl-recien":""}"><span class="tl-resp-n">${i+1}</span><b>${esc(r.texto)}</b><em>${r.puntos}</em></div>`:`<div class="tl-resp"><span class="tl-resp-n">${i+1}</span></div>`).join("");
      const flash=ultimo&&Date.now()-cambio<1600?(ultimo.tipo==="mal"?`<div class="tl-equis-grande">✘<small>«${esc(ultimo.txt)}» no está</small></div>`:ultimo.tipo==="repe"?`<div class="tl-flash tl-paso">${esc(ultimo.txt)} ya está</div>`:""):"";
      raiz.innerHTML=`<div class="tl-cien tl-cien-estudio">
        <div class="tl-cien-giro"><img class="tl-cien-pose" src="${GB}Giro_${pose}.png" alt="Giro"><img class="tl-cien-atril" src="${GB}elementos/Giro_atril_oficial_chico.webp" alt=""></div>
        <div class="tl-cien-centro"><div class="tl-cien-top"><span>${cat.icono} ${esc(cat.nombre)}</span><span>RONDA ${ronda+1}/3 · VALE x${MULT[ronda]}</span><span class="tl-cien-pts">⭐ ${puntos}</span></div>
        <h1 class="tl-pregunta">${esc(preg.pregunta)}</h1><div class="tl-tablero">${panel}</div>
        <div class="tl-equis">${[0,1,2].map(i=>`<span class="${i<errores?"tl-on":""}">✘</span>`).join("")}</div>
        <p class="tl-ayuda">🎮 ${esc(quien||"…")} escribe lo que dice el grupo</p></div>${flash}</div>`;
    }
    nueva();
    return{accion,pintar,fin(){muerto=true;clearTimeout(timer);try{speechSynthesis.cancel();}catch(e){}try{if(audioGiro)audioGiro.pause();}catch(e){}},cel(){return fase==="fin"?{pantalla:"fin",juego:"cien",resumen:puntos+" puntos"}:{pantalla:"cien",puede:fase==="jugando",pregunta:preg.pregunta};}};
  }

  /* =====================================================================
     CELULAR: solo manda lo que toca el jugador y muestra lo que le toca.
     ===================================================================== */
  function iniciarCel(nombreDirecto){
    despierta();
    const raiz=document.createElement("div");raiz.id="teleCel";raiz.className="tl-cel";document.body.appendChild(raiz);
    let nombre=limpio(P.get("n")||"",14);try{if(!nombre)nombre=limpio(localStorage.getItem("gya_tele_nombre")||localStorage.getItem("gya_nombre")||"",14);}catch(e){}
    let ultimo=null,conectado=false,visto=0,hola=null,pantallaPintada="",holaN=0;
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
      conectar(codCel,()=>{conectado=true;const h=()=>{let pj="";try{pj=localStorage.getItem("gya_giro_personaje")||"";}catch(e){}let av="";try{av=localStorage.getItem("gya_avatar")||localStorage.getItem("gya_tele_avatar")||"";}catch(e){}let vr;if(holaN++%6===0)try{vr=[...Vistas.cargar("rosco")].slice(-3000);}catch(e){}mandar({t:"hola",n:nombre,pj,av,vr});};h();hola=setInterval(h,4000);
        setTimeout(()=>{if(!ultimo)raiz.innerHTML=`<div class="tl-cel-caja"><h2>No encuentro la tele 🤔</h2><p>Revisá que el código <b>${codCel}</b> sea el que muestra la tele y que la tele siga abierta.</p><button type="button" class="tl-boton" onclick="location.reload()">Probar de nuevo</button><a class="tl-boton tl-chico" href="tele/?cambiar=1">Usar otra tele</a></div>`;},12000);},
        ()=>{raiz.innerHTML=`<div class="tl-cel-caja"><h2>Sin conexión</h2><p>No se pudo conectar (${esc(window.gyaFalloConexion||"sin respuesta")}). Probá con datos del celular.</p><button type="button" class="tl-boton" onclick="location.reload()">Reintentar</button></div>`;},
        m=>{if(m.t==="ruleta_sala"&&m.cod===codCel&&/^[0-9A-Z]{4,6}$/.test(String(m.sala||""))){irRuleta(String(m.sala),nombre);return;}
          if(m.t==="vistas"&&m.cod===codCel&&m.para===yo&&m.j==="rosco"&&Array.isArray(m.l)){try{Vistas.marcar("rosco",m.l.slice(0,40).map(String));}catch(e){}return;}
          if(m.t==="estado"&&m.cod===codCel){ultimo=m;visto=Date.now();try{localStorage.setItem("gya_tele_vinculada",codCel);}catch(e){}pintar();}});
      window.addEventListener("pagehide",()=>{try{mandar({t:"chau"});}catch(e){}});
    }
    const accion=(a,extra={})=>{mandar({...extra,t:"accion",a});try{if(typeof vibrar==="function")vibrar(25);}catch(e){}};
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

    /* Control native tvOS Ruleta: uses the current gya/tele room, preserving old Ruleta web. */
    function pintarRuletaNativa(c,cab,soyMando,miPid){
      const turno=c.jug?.[c.turno],miTurno=turno?.pid===miPid;
      const velocidad=c.fase==="tossup",bonus=c.fase==="bonus_resolver",fin=c.fase==="fin";
      const blocked=(velocidad&&(c.bloqueados||[]).includes(miPid))||
        (bonus&&(c.bonusListos||[]).includes(miPid));
      const puedeResponder=(velocidad||bonus)?!blocked:
        miTurno&&["girar","consonante","vocal"].includes(c.fase);
      const key="ruleta-nativa-"+JSON.stringify([
        c.fase,c.turno,c.usadas,c.jug,c.r,c.valor,c.cons,c.hayVoc,c.premio,soyMando,blocked
      ]);
      if(pantallaPintada!==key){
        pantallaPintada=key;
        const teclado=["consonante","vocal"].includes(c.fase)&&miTurno?
          [..."ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"].filter(l=>
            c.fase==="vocal"?"AEIOU".includes(l):!"AEIOU".includes(l)).map(l=>
            '<button type="button" data-ruleta-letra="'+l+'" '+((c.usadas||[]).includes(l)?"disabled":"")+'>'+l+'</button>').join(""):"";
        const marcador=(c.jug||[]).map(j=>
          '<div style="display:flex;justify-content:space-between;gap:8px;margin:7px 0"><span>'+
          esc(j.n)+(j.pid===turno?.pid?" 🎯":"")+'</span><b>$'+(j.tot||0)+' · Ronda $'+(j.ronda||0)+'</b></div>').join("");
        raiz.innerHTML=cab+'<div class="tl-cel-caja"><h2>'+
          (velocidad?"⚡ Prueba de Velocidad":bonus?"⭐ Ronda Bonus":fin?"🏆 Resultado final":"🎡 La Ruleta")+
          '</h2><p>Ronda '+(c.r||0)+'/3 · '+esc(c.cat||"")+'</p>'+
          '<p id="tlRvEstado"></p><p id="tlRvTimer"></p><div>'+marcador+'</div>'+
          (miTurno&&c.fase==="girar"?
          '<button type="button" class="tl-boton tl-oro" id="tlRvGirar" '+(c.cons===0?"disabled":"")+'>Girar la ruleta</button>'+
          '<button type="button" class="tl-boton" id="tlRvVocal" '+((turno?.ronda||0)<250||!c.hayVoc?"disabled":"")+'>Comprar vocal · $250</button>':"")+
          (teclado?'<h3>Elegí una '+(c.fase==="vocal"?"vocal":"consonante")+'</h3><div class="tl-cel-teclado">'+teclado+'</div>':"")+
          (puedeResponder?'<label>¿Sabés la frase?<input id="tlRvTexto" maxlength="90" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Escribí la frase completa"></label>'+
          '<button type="button" class="tl-boton tl-oro" id="tlRvResolver">Resolver frase</button>':"")+
          (fin&&soyMando?'<button type="button" class="tl-boton tl-oro" id="tlRvOtra">Jugar otra vez</button>':"")+
          (soyMando?'<button type="button" class="tl-boton tl-chico" id="tlRvMenu">Volver al menú</button>':"")+
          '</div>';
        const girar=raiz.querySelector("#tlRvGirar"),vocal=raiz.querySelector("#tlRvVocal");
        if(girar)girar.onclick=()=>{girar.disabled=true;accion("girar");};
        if(vocal)vocal.onclick=()=>{vocal.disabled=true;accion("comprar_vocal");};
        raiz.querySelectorAll("[data-ruleta-letra]").forEach(b=>b.onclick=()=>{
          b.disabled=true;accion("letra",{l:b.dataset.ruletaLetra});
        });
        const input=raiz.querySelector("#tlRvTexto"),resolver=raiz.querySelector("#tlRvResolver");
        if(input&&resolver){
          const enviar=()=>{const txt=limpio(input.value,90);if(!txt)return;
            resolver.disabled=true;accion("resolver",{txt});input.value="";};
          resolver.onclick=enviar;
          input.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();enviar();}};
        }
        const otra=raiz.querySelector("#tlRvOtra");
        if(otra)otra.onclick=()=>accion("otra");
        const menu=raiz.querySelector("#tlRvMenu");
        if(menu)menu.onclick=()=>{
          if(confirm("¿Volver al menú? Se termina la partida de La Ruleta."))accion("menu");
        };
      }
      const estado=raiz.querySelector("#tlRvEstado"),reloj=raiz.querySelector("#tlRvTimer");
      if(estado)estado.textContent=c.mensaje||
        (fin?"Partida terminada":miTurno?"Es tu turno":"Esperando a "+(turno?.n||"otro jugador"));
      if(reloj)reloj.textContent=fin?"":(
        (velocidad||bonus||miTurno)&&Number.isFinite(Number(c.seg))?"⏱ "+c.seg+" s":"");
    }

    /* ---------- Duelo en la tele: este celular es el micrófono del jugador ---------- */
    let dcRec=null,dcOyendo=false,dcDebe=false,dcLetra=-1,dcTurno=-1,dcParcial=null,dcParcialT=null,dcUltimo="",dcEnvio=0,dcPermiso=(()=>{try{return localStorage.getItem("gya_tele_mic")==="1";}catch(e){return false;}})();
    function dcVoz(debe){
      dcDebe=debe;
      if(!debe){dcOyendo=false;clearTimeout(dcParcialT);dcParcial=null;dcUltimo="";if(dcRec){const r=dcRec;dcRec=null;try{r.abort();}catch(e){}}return;}
      if(dcRec||!dcPermiso)return;
      const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Ctor)return;
      const r=new Ctor();dcRec=r;r.lang="es-UY";r.continuous=true;r.interimResults=true;r.maxAlternatives=5;
      r.onaudiostart=()=>{if(dcRec!==r)return;dcOyendo=true;mandar({t:"accion",a:"dc_listo"});const el=raiz.querySelector("#tlDcMic");if(el)el.textContent="🎙 Te escucho · respondé";};
      r.onresult=e=>{if(dcRec!==r)return;const l=[];let hayFinal=false;
        for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i];l.push({alts:Array.from(x).map(a=>String(a.transcript||"")),isFinal:!!x.isFinal});if(x.isFinal)hayFinal=true;}
        const txt=(l[l.length-1]?.alts[0]||"").trim();const el=raiz.querySelector("#tlDcOi");if(el&&txt)el.textContent="Oí: «"+txt+"»";
        /* Android a veces deja la frase "a medio escribir" y nunca la cierra: si queda quieta 1,5 s, se manda como final. */
        clearTimeout(dcParcialT);dcParcial=null;
        if(!hayFinal&&txt){dcParcial=txt;dcParcialT=setTimeout(()=>{if(dcRec===r&&dcParcial===txt){dcParcial=null;mandar({t:"accion",a:"dc_voz",turno:dcTurno,l:[{alts:[txt],isFinal:true}]});}},1500);}
        const ahora=Date.now();if(!hayFinal&&(txt===dcUltimo||ahora-dcEnvio<250))return;dcUltimo=txt;dcEnvio=ahora;
        mandar({t:"accion",a:"dc_voz",turno:dcTurno,l});};
      r.onerror=e=>{if(dcRec!==r)return;if(["not-allowed","service-not-allowed"].includes(e.error)){dcPermiso=false;try{localStorage.removeItem("gya_tele_mic");}catch(x){}pantallaPintada="";}};
      r.onend=()=>{if(dcRec!==r)return;dcRec=null;dcOyendo=false;
        clearTimeout(dcParcialT);if(dcParcial&&dcDebe){mandar({t:"accion",a:"dc_voz",turno:dcTurno,l:[{alts:[dcParcial],isFinal:true}]});}dcParcial=null;if(dcDebe)setTimeout(()=>{if(dcDebe&&!dcRec)dcVoz(true);},300);};
      try{r.start();}catch(e){dcRec=null;}
    }
    function pintarDuelo(c,cab,soyMando){
      const nombre=pid=>(c.jug.find(j=>j.pid===pid)||{}).n||"Jugador";
      if(c.fase==="config"){
        dcVoz(false);
        if(!soyMando){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>⚔️ Duelo de Conocimiento</h2><p>${esc(nombre(c.jug.find(j=>j.pid!==yo)?.pid))} está armando el duelo. Si te elige de rival, vas a responder hablando a este celular.</p>${dcPermiso?"":`<button type="button" class="tl-boton tl-oro" id="tlDcPermiso">🎙 Activar micrófono</button>`}</div>`;
          raiz.querySelector("#tlDcPermiso")?.addEventListener("click",pedirPermisoDc);return;}
        const otros=c.jug.filter(j=>j.pid!==yo);
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>⚔️ Duelo de Conocimiento</h2>
          <div class="tl-dc-opciones"><button type="button" data-modo="bot" class="${c.modo==="bot"?"tl-pz-activo":""}">🤖 Contra el bot</button><button type="button" data-modo="local" class="${c.modo==="local"?"tl-pz-activo":""}">👥 Contra otro celular</button></div>
          ${c.modo==="local"?(otros.length?`<p>¿Contra quién?</p><div class="tl-dc-opciones">${otros.map(j=>`<button type="button" data-rival="${esc(j.pid)}" class="${c.rival===j.pid?"tl-pz-activo":""}">${esc(j.n)}</button>`).join("")}</div>`:"<p>⚠️ Falta que otro celular entre a la sala.</p>"):""}
          <p>Categorías</p><div class="tl-dc-opciones">${c.catsTodas.map(([id,n])=>`<button type="button" data-cat="${id}" class="${c.cats.includes(id)?"tl-pz-activo":""}">${n}</button>`).join("")}</div>
          <p>Tiempo de cada uno</p><div class="tl-dc-opciones">${[40,60,90].map(s=>`<button type="button" data-seg="${s}" class="${c.seg===s?"tl-pz-activo":""}">${s} s</button>`).join("")}</div>
          ${dcPermiso?"":`<button type="button" class="tl-boton" id="tlDcPermiso">🎙 Activar micrófono</button>`}
          <button type="button" class="tl-boton tl-oro" id="tlDcEmpezar" ${c.modo==="local"&&!c.rival?"disabled":""}>▶ Empezar duelo</button>
          <button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button></div>`;
        raiz.querySelectorAll("[data-modo]").forEach(b=>b.onclick=()=>accion("dc_modo",{modo:b.dataset.modo}));
        raiz.querySelectorAll("[data-rival]").forEach(b=>b.onclick=()=>accion("dc_rival",{rival:b.dataset.rival}));
        raiz.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>accion("dc_cat",{cat:b.dataset.cat}));
        raiz.querySelectorAll("[data-seg]").forEach(b=>b.onclick=()=>accion("dc_seg",{seg:Number(b.dataset.seg)}));
        raiz.querySelector("#tlDcPermiso")?.addEventListener("click",pedirPermisoDc);
        raiz.querySelector("#tlDcEmpezar").onclick=()=>{if(!dcPermiso)pedirPermisoDc();accion("dc_empezar");};
        raiz.querySelector("#tlMenu").onclick=()=>accion("menu");return;
      }
      const st=c.st||{},juego=c.pids.includes(yo),miTurno=c.pids[st.active]===yo,escucho=c.escucha===yo;
      dcVoz(escucho);
      const marcador=(st.nombres||[]).map((n,i)=>`<div class="${st.active===i?"tl-dc-activo":""}"><b>${esc(n)}</b><span>✔ ${st.aciertos?.[i]||0} · ✘ ${st.errores?.[i]||0}</span></div>`).join("");
      if(st.phase==="finished"){
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🏁 ${esc(st.resultado||"¡Terminó el duelo!")}</h2><div class="tl-dc-marcador">${marcador}</div>
          ${soyMando?`<button type="button" class="tl-boton tl-oro" id="tlDcRevancha">🔄 Revancha</button><button type="button" class="tl-boton" id="tlDcConf">⚙️ Cambiar duelo</button><button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button>`:"<p>Mirá la tele 📺</p>"}</div>`;
        if(soyMando){raiz.querySelector("#tlDcRevancha").onclick=()=>accion("dc_revancha");raiz.querySelector("#tlDcConf").onclick=()=>accion("dc_config");raiz.querySelector("#tlMenu").onclick=()=>{if(confirm("¿Volver al menú?"))accion("menu");};}
        return;
      }
      raiz.innerHTML=cab+`<div class="tl-cel-caja tl-dc-cel"><div class="tl-dc-marcador">${marcador}</div>
        ${!juego?"<h2>Mirá la tele 📺</h2>":miTurno?`<h2>${escucho?"🎙 ¡Te toca!":"Preparando tu turno…"}</h2>
          ${dcPermiso?`<div class="tl-dc-mic${escucho?" tl-dc-on":""}" id="tlDcMic">${escucho?(dcOyendo?"🎙 Te escucho · respondé":"🎙 Activando micrófono…"):"🎙 Esperá…"}</div><p class="tl-dc-oi" id="tlDcOi">Decí tu respuesta en voz alta</p>`:`<button type="button" class="tl-boton tl-oro" id="tlDcPermiso">🎙 Activar micrófono</button>`}
          <button type="button" class="tl-boton" id="tlDcPasar">⏭ Paso</button>
          <div class="tl-dc-texto"><input id="tlTexto" autocomplete="off" placeholder="o escribí la respuesta"><button type="button" class="tl-boton" id="tlDcEnviar">Enviar</button></div>`
          :`<h2>Turno de ${esc((st.nombres||[])[st.active]||"")}</h2><p>Esperá tu turno mirando la tele 📺</p>`}
        ${soyMando?`<button type="button" class="tl-boton tl-chico" id="tlDcConf">⚙️ Terminar y cambiar duelo</button>`:""}</div>`;
      raiz.querySelector("#tlDcPermiso")?.addEventListener("click",pedirPermisoDc);
      const pasar=raiz.querySelector("#tlDcPasar");if(pasar)pasar.onclick=()=>accion("dc_pasar");
      const env=raiz.querySelector("#tlDcEnviar");if(env){const t=raiz.querySelector("#tlTexto");const enviar=()=>{const v=t.value.trim();if(v){accion("dc_texto",{txt:v});t.value="";}};env.onclick=enviar;t.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();enviar();}};}
      raiz.querySelector("#tlDcConf")?.addEventListener("click",()=>{if(confirm("¿Terminar este duelo?"))accion("dc_config");});
    }
    function pedirPermisoDc(){
      const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!Ctor){alert("Este celular no tiene reconocimiento de voz: respondé escribiendo.");return;}
      /* Primer arranque dentro del toque, para que el celular pida el permiso. */
      try{const r=new Ctor();r.lang="es-UY";r.onstart=()=>{dcPermiso=true;try{localStorage.setItem("gya_tele_mic","1");}catch(e){}try{r.abort();}catch(e){}pantallaPintada="";pintar();};
        r.onerror=e=>{if(["not-allowed","service-not-allowed"].includes(e.error))alert("El celular no dio permiso al micrófono. Habilitalo en los permisos del navegador.");};r.start();}catch(e){}
    }
    /* Silabario / Frases en Giro: cada uno arma la respuesta tocando las piezas. */
    let orClave="",orSel=[],orMalVisto=0,orAviso="";
    /* Sopa Fugaz en el celular: la misma grilla que la tele; se toca la primera y la última letra. */
    let spSel=null,spGen=-1,spUltT=0,spUltVisto=0;
    function pintarSopa(c,cab,soyMando){
      if(c.g!==spGen){spGen=c.g;spSel=null;}
      const u=(c.ult||{})[yo];if(u&&u.t!==spUltT){spUltT=u.t;spUltVisto=Date.now();}
      const aviso=u&&Date.now()-spUltVisto<3500?`<p class="tl-sp-aviso${u.ok?" tl-sp-bien":""}">${u.ok?"✅ ":"❌ "}${esc(u.txt)}</p>`:"";
      const menu=soyMando?`<button type="button" class="tl-boton tl-chico" id="tlSpSaltar">⏭ Terminar esta ronda</button><button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button>`:"";
      const enlazar=()=>{raiz.querySelector("#tlSpSaltar")?.addEventListener("click",()=>{if(confirm("¿Terminar esta ronda?"))accion("sp_saltar");});const b=raiz.querySelector("#tlMenu");if(b)b.onclick=()=>{if(confirm("¿Volver al menú?"))accion("menu");};};
      if(c.fase==="config"){
        if(!soyMando){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🔎 Sopa Fugaz</h2><p>${esc(c.quien||"El que tiene el control")} está eligiendo el modo.</p></div>`;return;}
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🔎 Sopa Fugaz</h2><p>¿Cómo la juegan?</p>
          <button type="button" class="tl-boton tl-oro" data-modo="clasica">🧩 Clásica<br><small>Las letras quedan quietas</small></button>
          <button type="button" class="tl-boton tl-oro" data-modo="giratoria">🌀 Giratoria<br><small>La sopa gira y las letras se mudan</small></button><button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button></div>`;
        raiz.querySelectorAll("[data-modo]").forEach(b=>b.onclick=()=>accion("sp_modo",{modo:b.dataset.modo}));enlazar();return;}
      const mios=(c.pts||{})[yo]||0;
      if(c.fase==="revela"){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>⏱ ¡Terminó la ronda!</h2><p>Mirá la tele 📺 · ya viene la siguiente.</p><p>Tus puntos: <b>${mios}</b></p>${menu}</div>`;enlazar();return;}
      const h=new Set(c.h||[]),ayuda=()=>spSel==null?"Tocá la primera letra de una palabra":"Ahora tocá la última letra";
      raiz.innerHTML=cab+`<div class="tl-cel-caja tl-sp-cel"><div class="tl-sp-cel-cab"><b>🔎 ${esc(c.tema)}</b><span>⭐ ${mios}</span></div>
        <div class="tl-sp-cel-lista">${(c.pal||[]).map(([w,q])=>`<span class="${q?"tl-sp-tachada":""}">${esc(w)}</span>`).join("")}</div>
        <div class="tl-sp-cel-grilla" style="grid-template-columns:repeat(${c.n},1fr)">${[...c.grid].map((l,i)=>`<button type="button" data-k="${i}" class="${h.has(i)?"tl-sp-hall":""}${spSel===i?" tl-sp-sel":""}">${esc(l)}</button>`).join("")}</div>
        <p class="tl-sp-cel-ayuda">${ayuda()}</p>${aviso}${menu}</div>`;
      if(aviso)setTimeout(()=>{const e=raiz.querySelector(".tl-sp-aviso");if(e&&Date.now()-spUltVisto>=3400)e.remove();},3600);
      raiz.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=Number(b.dataset.k);
        if(spSel==null)spSel=k;else if(spSel===k)spSel=null;else{accion("sp_marca",{g:c.g,x:spSel,y:k});spSel=null;}
        raiz.querySelectorAll(".tl-sp-sel").forEach(x=>x.classList.remove("tl-sp-sel"));if(spSel!=null)b.classList.add("tl-sp-sel");
        const ay=raiz.querySelector(".tl-sp-cel-ayuda");if(ay)ay.textContent=ayuda();});
      enlazar();
    }
    function pintarOrdenar(c,cab,soyMando){
      const k=c.juego+"-"+c.ronda;if(k!==orClave){orClave=k;orSel=[];orMalVisto=(c.mal||{})[yo]||0;orAviso="";}
      const malAhora=(c.mal||{})[yo]||0;if(malAhora>orMalVisto){orMalVisto=malAhora;orSel=[];orAviso="❌ No era así, probá de nuevo";}
      const menu=soyMando?`<button type="button" class="tl-boton tl-chico" id="tlOrSaltar">⏭ Saltar esta</button><button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button>`:"";
      const enlazar=()=>{raiz.querySelector("#tlOrSaltar")?.addEventListener("click",()=>accion("or_saltar"));const b=raiz.querySelector("#tlMenu");if(b)b.onclick=()=>{if(confirm("¿Volver al menú?"))accion("menu");};};
      if(c.fase==="revela"){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>${(c.resueltos||[]).includes(yo)?"✅ ¡Bien!":"⏱ ¡Tiempo!"}</h2><p>Era:</p><p class="tl-or-cel-resp">${esc(c.respuesta)}</p>${menu}</div>`;enlazar();return;}
      if((c.resueltos||[]).includes(yo)){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>✅ ¡Lo armaste!</h2><p>Mirá la tele 📺 mientras los demás terminan.</p>${menu}</div>`;enlazar();return;}
      const armado=orSel.map(i=>c.fichas[i]).join(c.unir);
      raiz.innerHTML=cab+`<div class="tl-cel-caja tl-or-cel${c.juego==="silabario"?" tl-or-cel-sil":""}"><p class="tl-or-cel-pista">${esc(c.pista)}</p>
        <div class="tl-or-cel-armado">${armado?esc(armado):"<span>Tocá las piezas en orden</span>"}</div>
        ${orAviso?`<p class="tl-or-cel-aviso">${orAviso}</p>`:""}
        <div class="tl-or-cel-fichas">${c.fichas.map((f,i)=>`<button type="button" data-f="${i}" ${orSel.includes(i)?"disabled":""}>${esc(f)}</button>`).join("")}</div>
        <button type="button" class="tl-boton tl-chico" id="tlOrBorrar" ${orSel.length?"":"disabled"}>⌫ Borrar</button>${menu}</div>`;
      raiz.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.f);if(orSel.includes(i))return;orSel.push(i);orAviso="";
        try{if(typeof vibrar==="function")vibrar(15);}catch(e){}
        if(orSel.length>=c.n){accion("or_resp",{r:c.ronda,orden:orSel.slice()});orAviso="⏳ Revisando…";}else accion("or_arma",{r:c.ronda,orden:orSel.slice()});
        pintarOrdenar(c,cab,soyMando);});
      raiz.querySelector("#tlOrBorrar").onclick=()=>{orSel.pop();orAviso="";accion("or_arma",{r:c.ronda,orden:orSel.slice()});pintarOrdenar(c,cab,soyMando);};
      enlazar();
    }
    function pintarMimica(c,cab,soyMando){
      const menu=`<button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button>`;
      const enlazarMenu=()=>{const b=raiz.querySelector("#tlMenu");if(b)b.onclick=()=>{if(confirm("¿Volver al menú?"))accion("menu");};};
      if(c.fase==="jugando"||c.fase==="cuenta"){
        if(c.adivina===yo){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🙈 ¡Te toca adivinar!</h2><p>Ponete <b>de espaldas a la tele</b> y no la mires.<br>Decí en voz alta lo que te parece que hacen.</p><p class="tl-cel-letra">✔ ${c.ok}</p></div>`;return;}
        raiz.innerHTML=cab+`<div class="tl-cel-caja tl-qs-cel"><p>Adivina <b>${esc(c.nombreAdivina)}</b> · ✔ ${c.ok} · ⏭ ${c.pasos}</p>
          <button type="button" class="tl-qs-btn tl-qs-ok" id="tlMmOk" ${c.fase!=="jugando"?"disabled":""}>✔ ¡ADIVINÓ!</button>
          <button type="button" class="tl-qs-btn tl-qs-paso" id="tlMmPaso" ${c.fase!=="jugando"?"disabled":""}>⏭ PASAR</button>
          ${soyMando?`<button type="button" class="tl-boton tl-chico" id="tlMmFin">⏹ Terminar este turno</button>`:""}</div>`;
        raiz.querySelector("#tlMmOk").onclick=()=>accion("mm_ok",{i:c.i});raiz.querySelector("#tlMmPaso").onclick=()=>accion("mm_paso",{i:c.i});
        raiz.querySelector("#tlMmFin")?.addEventListener("click",()=>accion("mm_terminar"));return;}
      if(!soyMando){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🎭 Mímica</h2><p>Mirá la tele 📺</p><button type="button" class="tl-boton" id="tlTomar">Tomar el control</button></div>`;raiz.querySelector("#tlTomar").onclick=()=>mandar({t:"tomar"});return;}
      if(c.fase==="resumen"){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>⏱ ¡Tiempo!</h2><p>${esc(c.nombreAdivina)} adivinó ${c.ok}</p><button type="button" class="tl-boton tl-oro" id="tlMmSig">${c.ultimo?"🏆 Ver ganador":"▶ Siguiente"}</button>${menu}</div>`;
        raiz.querySelector("#tlMmSig").onclick=()=>accion("mm_siguiente");enlazarMenu();return;}
      if(c.fase==="fin"){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🏆 ¡Terminó!</h2><button type="button" class="tl-boton tl-oro" id="tlMmOtra">🔄 Jugar otra vez</button>${menu}</div>`;
        raiz.querySelector("#tlMmOtra").onclick=()=>accion("mm_config");enlazarMenu();return;}
      raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🎭 Mímica</h2><p>Juegan todos los de la sala (${c.jugadores}). Cada uno, de espaldas a la tele; gana el que adivina más.</p>
        <p>Tiempo de cada uno</p><div class="tl-dc-opciones">${c.tiempos.map(t=>`<button type="button" data-t="${t}" class="${c.tiempo===t?"tl-pz-activo":""}">${t} s</button>`).join("")}</div>
        <button type="button" class="tl-boton tl-oro" id="tlMmEmpezar" ${c.jugadores<2?"disabled":""}>▶ Empezar</button>${c.jugadores<2?"<p>Hacen falta al menos 2 celulares en la sala.</p>":""}${menu}</div>`;
      raiz.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>accion("mm_tiempo",{seg:Number(b.dataset.t)}));
      raiz.querySelector("#tlMmEmpezar").onclick=()=>accion("mm_empezar");enlazarMenu();
    }
    /* ---------- ¿Qué número soy? / ¿Quién soy? ---------- */
    function pintarNumero(c,cab){
      raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🔢 ¿Qué número soy?</h2><p>El que juega, <b>de espaldas a la tele</b>.</p>
        <div class="tl-dc-opciones">${c.rangos.map(r=>`<button type="button" data-max="${r}" class="${c.max===r?"tl-pz-activo":""}">1 a ${r}</button>`).join("")}</div>
        <button type="button" class="tl-boton tl-oro" id="tlQnNuevo">${c.fase==="config"?"▶ Mostrar número":"🔄 Otro número"}</button>
        ${c.fase==="numero"?`<button type="button" class="tl-boton" id="tlQnOcultar">${c.oculto?"👁 Mostrar el número":"🙈 Ocultar el número"}</button>`:""}
        <button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button></div>`;
      raiz.querySelectorAll("[data-max]").forEach(b=>b.onclick=()=>accion("qn_rango",{max:Number(b.dataset.max)}));
      raiz.querySelector("#tlQnNuevo").onclick=()=>accion("qn_nuevo");
      raiz.querySelector("#tlQnOcultar")?.addEventListener("click",()=>accion("qn_ocultar"));
      raiz.querySelector("#tlMenu").onclick=()=>accion("menu");
    }
    function pintarQuien(c,cab,soyMando){
      if(c.fase==="jugando"||c.fase==="cuenta"){
        raiz.innerHTML=cab+`<div class="tl-cel-caja tl-qs-cel"><p>✔ ${c.ok} · ⏭ ${c.pasos}</p>
          <button type="button" class="tl-qs-btn tl-qs-ok" id="tlQsOk" ${c.fase!=="jugando"?"disabled":""}>✔ ¡ACERTÓ!</button>
          <button type="button" class="tl-qs-btn tl-qs-paso" id="tlQsPaso" ${c.fase!=="jugando"?"disabled":""}>⏭ PASÓ</button>
          ${soyMando?`<button type="button" class="tl-boton tl-chico" id="tlQsFin">⏹ Terminar ronda</button>`:""}</div>`;
        raiz.querySelector("#tlQsOk").onclick=()=>accion("qs_ok",{i:c.i});raiz.querySelector("#tlQsPaso").onclick=()=>accion("qs_paso",{i:c.i});
        raiz.querySelector("#tlQsFin")?.addEventListener("click",()=>accion("qs_terminar"));return;
      }
      if(!soyMando){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🌟 ¿Quién soy?</h2><p>${c.fase==="fin"?"¡Terminó la ronda! Mirá la tele 📺":"Esperando que arranque la ronda. Cuando empiece, desde acá marcan ✔ Acertó o ⏭ Pasó."}</p><button type="button" class="tl-boton" id="tlTomar">Tomar el control</button></div>`;
        raiz.querySelector("#tlTomar").onclick=()=>mandar({t:"tomar"});return;}
      if(c.fase==="fin"){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🏁 ${c.ok} acierto${c.ok===1?"":"s"}</h2><button type="button" class="tl-boton tl-oro" id="tlQsOtra">🔄 Otra ronda</button><button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button></div>`;
        raiz.querySelector("#tlQsOtra").onclick=()=>accion("qs_config");raiz.querySelector("#tlMenu").onclick=()=>accion("menu");return;}
      raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🌟 ¿Quién soy?</h2>
        <p>¿Quién adivina? (se pone de espaldas a la tele)</p><div class="tl-dc-opciones">${c.jug.map(j=>`<button type="button" data-quien="${esc(j.pid)}" class="${c.quien===j.pid?"tl-pz-activo":""}">${esc(j.n)}</button>`).join("")}</div>
        <p>Categoría</p><div class="tl-dc-opciones">${c.cats.map(x=>`<button type="button" data-cat="${esc(x.id)}" class="${c.cat===x.id?"tl-pz-activo":""}">${esc(x.n)}</button>`).join("")}</div>
        <p>Tiempo</p><div class="tl-dc-opciones">${c.tiempos.map(t=>`<button type="button" data-t="${t}" class="${c.tiempo===t?"tl-pz-activo":""}">${t} s</button>`).join("")}</div>
        <button type="button" class="tl-boton tl-oro" id="tlQsEmpezar">▶ Empezar</button><button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button></div>`;
      raiz.querySelectorAll("[data-quien]").forEach(b=>b.onclick=()=>accion("qs_quien",{quien:b.dataset.quien}));
      raiz.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>accion("qs_cat",{cat:b.dataset.cat}));
      raiz.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>accion("qs_tiempo",{seg:Number(b.dataset.t)}));
      raiz.querySelector("#tlQsEmpezar").onclick=()=>accion("qs_empezar");raiz.querySelector("#tlMenu").onclick=()=>accion("menu");
    }

    function pintar(){
      const m=ultimo;if(!m)return;const soyMando=m.mando===yo,c=m.cel||{},clave=JSON.stringify([soyMando,c,m.jug.length]);
      if(c.pantalla!=="tutti"&&c.pantalla!=="puzzle"&&c.pantalla!=="ruleta_nativa"&&clave===pantallaPintada)return;
      const escribiendo=document.activeElement&&document.activeElement.id==="tlTexto"?document.activeElement.value:"";
      if(c.pantalla!=="tutti"&&c.pantalla!=="puzzle"&&c.pantalla!=="ruleta_nativa")pantallaPintada=clave;
      const cab=`<div class="tl-cel-cab">📺 Sala ${esc(m.cod)} · ${esc(nombre)}${soyMando?" · 🎮":""}</div>`;
      if(!m.jug.some(j=>j.pid===yo)){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>Entrando…</h2></div>`;return;}
      if(c.pantalla==="ruleta_nativa"){pintarRuletaNativa(c,cab,soyMando,yo);return;}
      if(c.pantalla==="ruleta"){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🎡 La Ruleta</h2><p>La Ruleta tiene su propia entrada. Cuando la tele muestre el código nuevo, tocá acá y ponelo:</p><a class="tl-boton tl-oro" href="tv.html">Entrar a la Ruleta</a></div>`;return;}
      if(c.pantalla==="tutti"){pintarTutti(c,cab,soyMando);return;}
      if(c.pantalla==="puzzle"){pintarPuzzle(c,cab,soyMando);return;}
      if(c.pantalla!=="duelo"&&c.pantalla!=="rosco")dcVoz(false);
      if(c.pantalla==="rosco"){const debe=c.escucha===yo;
        if(dcRec&&(dcLetra!==c.i||dcTurno!==c.turno))dcVoz(false);
        dcLetra=c.i;dcTurno=c.turno;dcVoz(debe);}
      if(c.pantalla==="duelo"){pintarDuelo(c,cab,soyMando);return;}
      if(c.pantalla==="quien"){pintarQuien(c,cab,soyMando);return;}
      if(c.pantalla==="mimica"){pintarMimica(c,cab,soyMando);return;}
      if(c.pantalla==="ordenar"){pintarOrdenar(c,cab,soyMando);return;}
      if(c.pantalla==="sopa"){pintarSopa(c,cab,soyMando);return;}
      if(c.pantalla==="numero"&&soyMando){pintarNumero(c,cab);return;}
      if(!soyMando&&!(c.pantalla==="rosco"&&c.dos)){
        const mando=(m.jug.find(j=>j.pid===m.mando)||{}).n||"otro";
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>Mirá la tele 📺</h2><p>El control lo tiene <b>${esc(mando)}</b>. Ayudalo con las respuestas 😉</p><button type="button" class="tl-boton" id="tlTomar">Tomar el control</button></div>`;
        raiz.querySelector("#tlTomar").onclick=()=>mandar({t:"tomar"});return;}
      if(c.pantalla==="menu"){
        /* Tarjetas con el dibujo de cada juego (las mismas de la tele), en dos columnas. */
        raiz.innerHTML=cab+`<div class="tl-cel-menu"><h2>¿A qué juegan?</h2><p>Tocá un juego y se abre en la tele 📺</p>
          <div class="tl-cel-jug">${m.jug.map(j=>`<span class="${j.pid===m.mando?"tl-mando":""}">${j.pid===m.mando?"🎮 ":""}${esc(j.n)}</span>`).join("")}</div>
          <div class="tl-cel-tarjetas">${(c.juegos||[]).map(j=>`<button type="button" class="tl-cel-tarjeta${j.ok?"":" tl-pronto"}" data-j="${esc(j.id)}" ${j.ok?"":"disabled"}><img src="${esc(j.icono||"")}" alt="" onerror="this.style.visibility='hidden'"><b>${esc(j.nombre)}</b><small>${esc(j.ok?(j.desc||""):"Pronto")}</small></button>`).join("")}</div></div>`;
        raiz.querySelectorAll("[data-j]").forEach(b=>b.onclick=()=>accion("elegir",{juego:b.dataset.j}));return;}
      const menu=`<button type="button" class="tl-boton tl-chico" id="tlMenu">⟵ Menú de juegos</button>`;
      if(c.pantalla==="intro"){
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🎬 Giro presenta ${esc(c.nombre)}</h2><p>Mirá la tele 📺 · podés esperar o pasar al juego.</p><button type="button" class="tl-boton tl-oro" id="tlSeguir">⏭ Siguiente</button>${menu}</div>`;
        raiz.querySelector("#tlSeguir").onclick=()=>accion("intro_seguir");raiz.querySelector("#tlMenu").onclick=()=>accion("menu");return;}
      if(c.pantalla==="rosco_show"){
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🎬 ${c.fase==="cierre"?"Giro cierra el programa":"Giro presenta el Rosco"}</h2><p>Mirá la tele 📺 · podés esperar o pasar a lo siguiente.</p><button type="button" class="tl-boton tl-oro" id="tlSeguir">⏭ Siguiente</button>${menu}</div>`;
        raiz.querySelector("#tlSeguir").onclick=()=>accion("rs_seguir");raiz.querySelector("#tlMenu").onclick=()=>{if(confirm("¿Volver al menú?"))accion("menu");};return;}
      if(c.pantalla==="fin"){
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>¡Terminó! 🎉</h2><p>${esc(c.resumen||"")}</p><button type="button" class="tl-boton tl-oro" id="tlOtra">Jugar otra vez</button>${menu}</div>`;
        raiz.querySelector("#tlOtra").onclick=()=>accion("otra");raiz.querySelector("#tlMenu").onclick=()=>accion("menu");return;}
      if(c.pantalla==="rosco_modo"){
        if(!soyMando){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🔤 El Rosco</h2><p>${esc((m.jug.find(j=>j.pid===m.mando)||{}).n||"El que tiene el control")} está eligiendo si juega solo o de a dos.</p></div>`;return;}
        const otros=(c.jug||[]).filter(j=>j.pid!==yo);
        raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🔤 El Rosco</h2><p>¿Cómo lo juegan?</p>
          <button type="button" class="tl-boton tl-oro" id="tlRsSolo">👤 Solo yo</button><p>De a dos, cada uno con su rosco:</p>
          <div class="tl-dc-opciones">${otros.map(j=>`<button type="button" data-rival="${esc(j.pid)}">⚔️ Contra ${esc(j.n)}</button>`).join("")}</div>${menu}</div>`;
        raiz.querySelector("#tlRsSolo").onclick=()=>accion("rosco_modo",{modo:"solo"});
        raiz.querySelectorAll("[data-rival]").forEach(b=>b.onclick=()=>accion("rosco_modo",{modo:"dos",rival:b.dataset.rival}));
        raiz.querySelector("#tlMenu").onclick=()=>accion("menu");return;}
      const marcadorCel=c=>c.dos&&Array.isArray(c.marcador)?`<div class="tl-rd-cel">${c.marcador.map((x,i)=>`<div class="${x.juega?"tl-rd-cel-juega":""}"><span>${i+1}º</span><b>${x.juega?"🎙 ":""}${esc(x.n)}</b><em>✓ ${x.ok} · ✘ ${x.mal}</em></div>`).join("")}</div>`:"";
      if(c.pantalla==="rosco"&&c.dos&&c.activo!==yo){
        raiz.innerHTML=cab+`<div class="tl-cel-caja">${marcadorCel(c)}<h2>🔤 Le toca a ${esc(c.nombreActivo||"")}</h2><p>Mirá la tele 📺 · cuando erre o pase, te toca a vos.</p>${soyMando?menu:""}</div>`;
        raiz.querySelector("#tlMenu")?.addEventListener("click",()=>{if(confirm("¿Volver al menú? Se termina este juego."))accion("menu");});return;}
      if(c.pantalla==="rosco"||c.pantalla==="cien"){
        const rosco=c.pantalla==="rosco";
        raiz.innerHTML=cab+`<div class="tl-cel-caja">${rosco?`${marcadorCel(c)}<div class="tl-cel-letra">${esc(c.letra)}</div><p>${esc(c.regla||"")}</p>
          ${dcPermiso?`<div class="tl-dc-mic${c.escucha===yo?" tl-dc-on":""}" id="tlDcMic">${c.puede===false?"🔇 Giro está hablando · esperá":dcOyendo?"🎙 Te escucho · decí la palabra o «Pasar»":"🎙 Activando micrófono…"}</div><p class="tl-dc-oi" id="tlDcOi"></p>`:`<button type="button" class="tl-boton tl-oro" id="tlDcPermiso">🎙 Responder hablando</button>`}`:`<p class="tl-cel-preg">${esc(c.pregunta||"")}</p>`}
          <input id="tlTexto" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${rosco?"Tu respuesta":"Lo que dice el grupo"}" ${c.puede===false?"disabled":""}>
          <button type="button" class="tl-boton tl-oro" id="tlEnviar" ${c.puede===false?"disabled":""}>Enviar</button>
          ${rosco?`<button type="button" class="tl-boton" id="tlPasar" ${c.puede===false?"disabled":""}>⏭ Pasar</button>`:""}${menu}</div>`;
        const t=raiz.querySelector("#tlTexto");if(escribiendo)t.value=escribiendo;
        const enviar=()=>{const v=t.value.trim();if(!v)return;accion("responder",{txt:v});t.value="";t.focus();};
        raiz.querySelector("#tlEnviar").onclick=enviar;t.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();enviar();}};
        if(rosco){raiz.querySelector("#tlPasar").onclick=()=>{accion("pasar");t.value="";};raiz.querySelector("#tlDcPermiso")?.addEventListener("click",pedirPermisoDc);}
        raiz.querySelector("#tlMenu").onclick=()=>{if(confirm("¿Volver al menú? Se termina este juego."))accion("menu");};
        if(c.puede!==false&&!(rosco&&dcPermiso))t.focus();return;}
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
    if(nombreDirecto){nombre=limpio(nombreDirecto,14);try{localStorage.setItem("gya_tele_nombre",nombre);}catch(e){}entrar();}
    else if(nombre&&P.get("n"))entrar();else pedirNombre();
  }

  const arrancar=()=>{if(esTele)iniciarTele();else iniciarCel();};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrancar);else arrancar();
})();
