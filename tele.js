/* Juegos en la tele (SALA_TV_PLAN.md, Gonzalo 26/10/2026).
   La tele (index.html?tele=1) muestra el juego en grande y es la que manda;
   los celulares (index.html?telecel=CÓDIGO) solo responden. Conexión: la de
   los duelos (MultiBroker: 4 servidores MQTT + Supabase), tema gya/tele/<código>.
   Es aparte de la Sala TV de la Ruleta (sala-tv.js, ?tvhost=1): no la toca.
   Juegos: Rosco (juega uno, los demás miran), Ahorcado (el celular es el
   teclado), 100 Rioplatenses (un celular, juega el grupo). Las palabras salen
   de los mismos bancos y la misma memoria que en el celular: no se repiten. */
(()=>{
  "use strict";
  const P=new URLSearchParams(location.search);
  const esTele=P.get("tele")==="1";
  const codCel=(P.get("telecel")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  const esCel=!!codCel&&!esTele;
  const CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const yo="t"+Math.random().toString(36).slice(2,10);
  const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const limpio=(s,max)=>String(s||"").replace(/[<>&"'\u0000-\u001F]/g,"").trim().slice(0,max);
  const mezclar=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const sinTilde=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase();
  const sonar=(f,d,t,g)=>{try{if(typeof bip==="function")bip(f,d,t,g);}catch(e){}};
  const sfx=id=>{try{if(typeof sonarSFX==="function")sonarSFX(id);}catch(e){}};
  const JUEGOS=[
    {id:"rosco",nombre:"El Rosco",icono:"assets/rosco/logo.webp",desc:"Juega uno, los demás miran",ok:true},
    {id:"ahorcado",nombre:"Ahorcado",icono:"assets/ahorcado/logo.webp",desc:"El celular es el teclado",ok:true},
    {id:"cien",nombre:"100 Rioplatenses",icono:"assets/cien/logo.webp",desc:"Un celular, juega el grupo",ok:true},
    {id:"ruleta",nombre:"La Ruleta",icono:"assets/logo.webp",desc:"Cada uno con su celular",ok:true},
    {id:"tutti",nombre:"Tutti Frutti",icono:"assets/tutti/logo.webp",desc:"Próximamente",ok:false},
    {id:"puzzle",nombre:"Puzzle",icono:"assets/puzzle-arte/icono.webp",desc:"Próximamente",ok:false}
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

  /* ---------- Entrada desde Extensiones (solo Gonzalo por ahora) ---------- */
  function abrir(contenedor){
    contenedor.innerHTML=`<div class="tl-entrada"><button type="button" class="ext-volver" id="tlVolver">⟵ Extensiones</button>
      <h2>📺 Juegos en la tele</h2><p>La tele muestra el juego en grande y se responde desde el celular.</p>
      <button type="button" class="tl-boton tl-oro" id="tlSoyTele">📺 Esta pantalla es la tele</button>
      <div class="tl-caja"><b>📱 Unirme con el celular</b><input id="tlCodigo" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="Código de la tele"><button type="button" class="tl-boton" id="tlUnirme">Unirme</button></div>
      <small>En la tele se puede abrir desde el navegador: girayadivina.com/index.html?tele=1</small></div>`;
    contenedor.querySelector("#tlVolver").onclick=()=>{try{Extensiones.abrirLobby();}catch(e){}};
    contenedor.querySelector("#tlSoyTele").onclick=()=>{location.href="index.html?tele=1";};
    contenedor.querySelector("#tlUnirme").onclick=()=>{const c=contenedor.querySelector("#tlCodigo").value.toUpperCase().replace(/[^A-Z0-9]/g,"");if(c.length>=4)location.href="index.html?telecel="+c;};
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
    const cod=Array.from({length:5},()=>CHARS[Math.floor(Math.random()*CHARS.length)]).join("");
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
        const n=limpio(m.n,14)||"Jugador";let j=T.jug.find(x=>x.pid===m.pid);
        if(!j){if(T.jug.length>=8)return;j={pid:m.pid,n};T.jug.push(j);sonar(880,.12,"triangle",.06);}
        j.n=n;j.visto=Date.now();if(!T.mando||!T.jug.some(x=>x.pid===T.mando))T.mando=m.pid;
        pintar();difundir();return;
      }
      const j=T.jug.find(x=>x.pid===m.pid);if(!j)return;j.visto=Date.now();
      if(m.t==="chau"){T.jug=T.jug.filter(x=>x.pid!==m.pid);if(T.mando===m.pid)T.mando=T.jug[0]?T.jug[0].pid:null;pintar();difundir();return;}
      if(m.t==="tomar"){T.mando=m.pid;pintar();difundir();return;}
      if(m.t!=="accion"||m.pid!==T.mando)return;
      if(m.a==="elegir"&&T.fase==="menu"){elegir(String(m.juego||""));return;}
      if(m.a==="menu"){volverMenu();return;}
      if(T.g&&T.fase==="juego")T.g.accion(m);
    }
    function elegir(id){
      const j=JUEGOS.find(x=>x.id===id);if(!j||!j.ok)return;
      despierta();
      if(id==="ruleta"){T.fase="ruleta";T.juego="ruleta";pintar();difundir();setTimeout(()=>{location.href="index.html?tvhost=1";},1500);return;}
      T.fase="juego";T.juego=id;T.g=(id==="rosco"?juegoRosco:id==="ahorcado"?juegoAhorcado:juegoCien)(T,actualizar);
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
    /* Control remoto: flechas mueven entre botones, Enter elige (lo hace el navegador). */
    document.addEventListener("keydown",e=>{
      const bs=[...raiz.querySelectorAll("button:not([disabled])")];if(!bs.length)return;
      const i=bs.indexOf(document.activeElement);
      if(["ArrowRight","ArrowDown"].includes(e.key)){e.preventDefault();bs[(i+1+bs.length)%bs.length].focus();}
      else if(["ArrowLeft","ArrowUp"].includes(e.key)){e.preventDefault();bs[(i-1+bs.length)%bs.length].focus();}
      else if(e.key==="Backspace"||e.key==="Escape"){if(T.fase==="juego"){e.preventDefault();volverMenu();}}
    });
    pintar();
    conectar(cod,()=>{difundir();setInterval(difundir,2500);},()=>{avisoTele("No se pudo conectar. Revisá el internet de la tele y recargá.");},recibir);
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
    function munieco(){const partes=['<circle cx="85" cy="36" r="10"/>','<path d="M85 46V80"/>','<path d="M85 54L68 68"/>','<path d="M85 54L102 68"/>','<path d="M85 80L70 102"/>','<path d="M85 80L100 102"/>'];
      return'<svg viewBox="0 0 120 130" class="tl-horca"><path d="M10 122H80M30 122V10H85V26" stroke="#F6EFE2" stroke-width="5" stroke-linecap="round" fill="none"/><g stroke="#FF6B7A" stroke-width="5" stroke-linecap="round" fill="none">'+partes.slice(0,errores).join("")+'</g></svg>';}
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
    const mandar=m=>{if(red)red.mandar(m);};
    function pedirNombre(){
      raiz.innerHTML=`<div class="tl-cel-caja"><h2>📺 Sala de la tele</h2><p>Código <b>${codCel}</b></p><label>Tu nombre<input id="tlNombre" maxlength="14" value="${esc(nombre)}" placeholder="¿Cómo te llamás?"></label><button type="button" class="tl-boton tl-oro" id="tlEntrar">Entrar</button></div>`;
      const i=raiz.querySelector("#tlNombre");i.focus();
      raiz.querySelector("#tlEntrar").onclick=()=>{nombre=limpio(i.value,14);if(!nombre){i.focus();return;}try{localStorage.setItem("gya_tele_nombre",nombre);}catch(e){}entrar();};
    }
    function entrar(){
      raiz.innerHTML=`<div class="tl-cel-caja"><h2>Conectando con la tele…</h2><p>Código <b>${codCel}</b></p></div>`;
      conectar(codCel,()=>{conectado=true;const h=()=>mandar({t:"hola",n:nombre});h();hola=setInterval(h,4000);
        setTimeout(()=>{if(!ultimo)raiz.innerHTML=`<div class="tl-cel-caja"><h2>No encuentro la tele 🤔</h2><p>Revisá que el código <b>${codCel}</b> sea el que muestra la tele y que la tele siga abierta.</p><button type="button" class="tl-boton" onclick="location.reload()">Probar de nuevo</button></div>`;},12000);},
        ()=>{raiz.innerHTML=`<div class="tl-cel-caja"><h2>Sin conexión</h2><p>No se pudo conectar (${esc(window.gyaFalloConexion||"sin respuesta")}). Probá con datos del celular.</p><button type="button" class="tl-boton" onclick="location.reload()">Reintentar</button></div>`;},
        m=>{if(m.t==="estado"&&m.cod===codCel){ultimo=m;visto=Date.now();pintar();}});
      window.addEventListener("pagehide",()=>{try{mandar({t:"chau"});}catch(e){}});
    }
    const accion=(a,extra={})=>{mandar({t:"accion",a,...extra});try{if(typeof vibrar==="function")vibrar(25);}catch(e){}};
    function pintar(){
      const m=ultimo;if(!m)return;const soyMando=m.mando===yo,c=m.cel||{},clave=JSON.stringify([soyMando,c,m.jug.length]);
      if(clave===pantallaPintada)return;
      const escribiendo=document.activeElement&&document.activeElement.id==="tlTexto"?document.activeElement.value:"";
      pantallaPintada=clave;
      const cab=`<div class="tl-cel-cab">📺 Sala ${esc(m.cod)} · ${esc(nombre)}${soyMando?" · 🎮":""}</div>`;
      if(!m.jug.some(j=>j.pid===yo)){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>Entrando…</h2></div>`;return;}
      if(c.pantalla==="ruleta"){raiz.innerHTML=cab+`<div class="tl-cel-caja"><h2>🎡 La Ruleta</h2><p>La Ruleta tiene su propia entrada. Cuando la tele muestre el código nuevo, tocá acá y ponelo:</p><a class="tl-boton tl-oro" href="tv.html">Entrar a la Ruleta</a></div>`;return;}
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
    setInterval(()=>{if(conectado&&ultimo&&Date.now()-visto>12000){pantallaPintada="";raiz.innerHTML=`<div class="tl-cel-caja"><h2>La tele no responde 📺</h2><p>Revisá que la tele siga abierta y con internet.</p></div>`;}},4000);
    if(nombre&&P.get("n"))entrar();else pedirNombre();
  }

  const arrancar=()=>{if(esTele)iniciarTele();else iniciarCel();};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrancar);else arrancar();
})();
