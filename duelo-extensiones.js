/* Duelo: 1 vs 1 en vivo para las extensiones (Rosco, Silabario, etc.), reutilizando
   el mismo mqtt/BROKERS que ya usa Girá y Adiviná para la sala host/guest, pero con
   su propio canal y su propio cliente para no pisar una partida de la rueda principal.
   Cada juego solo necesita: abrir el lobby, mandar la ronda (el host) o recibirla
   (el guest), avisar el progreso propio y mandar el resultado final. El badge flotante
   y la pantalla de resultado final las dibuja este archivo, iguales para cualquier juego. */
/* Vistas: historial persistente (localStorage, por juego) de palabras/preguntas
   que ya salieron, para que entrando otro día no se repitan hasta haber visto
   todo el banco; cuando se agota, ese grupo vuelve a empezar. */
const Vistas={
  clave:j=>"gya_vistas_"+j,
  cargar(j){try{const a=JSON.parse(localStorage.getItem(this.clave(j)));return new Set(Array.isArray(a)?a:[]);}catch(e){return new Set();}},
  guardar(j,s){try{localStorage.setItem(this.clave(j),JSON.stringify([...s]));}catch(e){}},
  /* Junta en una sola memoria las que antes se guardaban por categoría (j_xxx). */
  unir(j){try{const s=this.cargar(j);let hubo=false;for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith(this.clave(j)+"_")){try{(JSON.parse(localStorage.getItem(k))||[]).forEach(x=>s.add(String(x)));}catch(e){}localStorage.removeItem(k);hubo=true;}}if(hubo)this.guardar(j,s);}catch(e){}},
  marcar(j,ids){const s=this.cargar(j);[].concat(ids).forEach(x=>s.add(String(x)));this.guardar(j,s);},
  filtrar(j,lista,id){
    const s=this.cargar(j),libres=lista.filter(x=>!s.has(String(id(x))));
    if(libres.length)return libres;
    lista.forEach(x=>s.delete(String(id(x))));this.guardar(j,s);return lista;
  }
};
window.Vistas=Vistas;
/* Sonido de error común a todas las extensiones (buzzer). Respeta el
   botón de sonido del juego, igual que bip(). */
const sonidoErrorExt=(()=>{let a=null;return function(){
  try{if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
    if(!a){a=new Audio("assets/audio/error-extensiones.mp3");a.volume=.5;}
    a.currentTime=0;a.play().catch(()=>{});}catch(e){}
};})();
window.sonidoErrorExt=sonidoErrorExt;
/* MultiBroker: conexión a TODOS los servidores MQTT públicos a la vez.
   Antes se probaba uno por uno y cada celular se quedaba con el primero que
   le andaba: si un servidor fallaba solo para uno, quedaban en servidores
   distintos y no se encontraban. Ahora se publica y se escucha en todos los
   que conecten, así se encuentran siempre (también con un celular que tenga
   la versión vieja, que usa uno solo). Los mensajes repetidos (mismo texto
   por dos servidores en menos de 1,5 s) se descartan.
   Misma firma que conectar(): conectar(alConectar, alFallar, asignar). */
window.GYA_VERSION_SALAS="v4 (multi+supabase)";
const MultiBroker=(()=>{
  const LISTA=["wss://broker.emqx.io:8084/mqtt","wss://broker.hivemq.com:8884/mqtt","wss://test.mosquitto.org:8081/mqtt","wss://mqtt.eclipseprojects.io:443/mqtt"];
  function cargarLib(cb){
    if(typeof mqtt!=="undefined"){cb(true);return;}
    const urls=["lib/mqtt.min.js?v=5.10.1","https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js"];
    const probar=k=>{if(typeof mqtt!=="undefined"){cb(true);return;}if(k>=urls.length){cb(false);return;}
      const sc=document.createElement("script");sc.src=urls[k];sc.onload=()=>cb(typeof mqtt!=="undefined");sc.onerror=()=>probar(k+1);document.head.appendChild(sc);};
    probar(0);
  }
  /* Canal extra por Supabase Realtime (el mismo servidor del Ranking, por el
     puerto 443): si los servidores MQTT públicos no responden desde una red,
     los mensajes igual pasan por acá. Un canal por tema; lo que se manda
     antes de que el canal esté listo queda en cola. */
  function clienteSupabase(alListo){
    let supa=null;try{supa=typeof obtenerSupa==="function"?obtenerSupa():null;}catch(e){}
    if(!supa||typeof supa.channel!=="function")return null;
    const canales=new Map(),oyentes=[];let conectado=false;
    const avisarListo=()=>{if(!conectado){conectado=true;if(alListo)alListo();}};
    const canal=t=>{
      if(canales.has(t))return canales.get(t);
      const ch=supa.channel("gya-"+t.replace(/[^A-Za-z0-9_-]/g,"-"),{config:{broadcast:{self:false}}});
      const st={ch,listo:false,oir:false,cola:[]};
      ch.on("broadcast",{event:"m"},msg=>{const m=msg&&msg.payload&&msg.payload.m;if(st.oir&&typeof m==="string")oyentes.forEach(f=>f(t,m));});
      ch.subscribe(estado=>{if(estado==="SUBSCRIBED"){st.listo=true;avisarListo();st.cola.splice(0).forEach(m=>{try{ch.send({type:"broadcast",event:"m",payload:{m}});}catch(e){}});}});
      canales.set(t,st);return st;
    };
    /* Canal de prueba para saber si Supabase responde desde esta red. */
    canal("gya-ping");
    return{
      get connected(){return conectado;},
      subscribe(t){canal(t).oir=true;},
      unsubscribe(t){const st=canales.get(t);if(st)st.oir=false;},
      publish(t,m){const st=canal(t);m=String(m);if(st.listo){try{st.ch.send({type:"broadcast",event:"m",payload:{m}});}catch(e){}}else st.cola.push(m);},
      on(ev,f){if(ev==="message")oyentes.push(f);},
      end(){canales.forEach(st=>{try{supa.removeChannel(st.ch);}catch(e){}});canales.clear();}
    };
  }
  function conectar(alConectar,alFallar,asignar){
    const clis=[],subs=new Set(),oyentes=[],vistos=new Map();let sb=null;
    /* Diagnóstico para el mensaje de error: estado de cada servidor. */
    const NOMBRES=["emqx","hivemq","mosquitto","eclipse"],est={emqx:"…",hivemq:"…",mosquitto:"…",eclipse:"…",supabase:"…"};
    const detalle=()=>Object.entries(est).map(([k,v])=>k+" "+v).join(" · ")+" · "+window.GYA_VERSION_SALAS;
    let listo=false,fallo=false,cerrado=false,caidos=0,timer=0;
    const w={
      get connected(){return clis.some(c=>c.connected)||!!(sb&&sb.connected);},
      subscribe(t){subs.add(t);clis.forEach(c=>{if(c.connected)try{c.subscribe(t);}catch(e){}});if(sb)sb.subscribe(t);},
      unsubscribe(t){subs.delete(t);clis.forEach(c=>{try{c.unsubscribe(t);}catch(e){}});if(sb)sb.unsubscribe(t);},
      publish(t,m){clis.forEach(c=>{if(c.connected)try{c.publish(t,m);}catch(e){}});if(sb)sb.publish(t,m);},
      on(ev,f){if(ev==="message")oyentes.push(f);return w;},
      end(){cerrado=true;clearTimeout(timer);clis.forEach(c=>{try{c.end(true);}catch(e){}});if(sb)try{sb.end();}catch(e){}}
    };
    const fallar=motivo=>{if(listo||fallo)return;fallo=true;window.gyaFalloConexion=motivo+" — "+detalle();w.end();if(alFallar)alFallar();};
    const recibir=(t,pl)=>{
      const txt=String(pl),clave=t+"|"+txt,ahora=Date.now();
      const antes=vistos.get(clave);if(antes&&ahora-antes<1500)return;
      vistos.set(clave,ahora);if(vistos.size>300){for(const [k,v] of vistos)if(ahora-v>5000)vistos.delete(k);}
      oyentes.forEach(f=>{try{f(t,pl);}catch(e){}});
    };
    const yaConectado=()=>{if(!listo&&!fallo&&!cerrado){listo=true;clearTimeout(timer);alConectar();}};
    if(asignar)asignar(w);
    sb=clienteSupabase(()=>{est.supabase="✓";yaConectado();});
    if(!sb)est.supabase=typeof window.supabase==="undefined"?"sin librería":"✗";
    if(sb)sb.on("message",recibir);
    cargarLib(ok=>{
      if(cerrado)return;
      if(!ok){NOMBRES.forEach(n=>est[n]="sin librería");if(!sb)fallar("sin librería");return;}
      LISTA.forEach((url,ix)=>{
        let c,primera=true;const nom=NOMBRES[ix];
        try{c=mqtt.connect(url,{clientId:"gyx"+Math.random().toString(16).slice(2),connectTimeout:8000,reconnectPeriod:3000,clean:true});}catch(e){est[nom]="error: "+String(e&&e.message||e).slice(0,40);caidos++;return;}
        clis.push(c);
        c.on("connect",()=>{
          if(cerrado){try{c.end(true);}catch(e){}return;}
          est[nom]="✓";subs.forEach(t=>{try{c.subscribe(t);}catch(e){}});
          yaConectado();
        });
        c.on("message",recibir);
        c.on("error",e=>{if(est[nom]!=="✓")est[nom]="✗ "+String(e&&e.message||"").slice(0,30);});
        c.on("close",()=>{if(est[nom]==="…")est[nom]="✗";if(primera&&!listo){primera=false;caidos++;if(caidos>=LISTA.length&&!sb)fallar("los servidores no responden");}});
      });
    });
    timer=setTimeout(()=>fallar("los servidores no responden"),15000);
  }
  return{conectar};
})();
window.MultiBroker=MultiBroker;
const Duelo=(()=>{
  const CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let cliente=null,juego=null,sala=null,soyHost=false,rival=null,activo=false;
  /* Invitación por link: ?duelo=<juego>&sala=XXXX&de=<nombre> abre ese juego
     con el código cargado. En Palabra Secreta entra directamente a la sala. */
  const DUELO_EXT={ahorcado:"ahorcado-rioplatense",cien:"cien-rioplatenses",frases:"frases-en-giro",memoria:"memoria-en-giro",rosco:"rosco-rioplatense",rueda:"rueda-de-letras",silabario:"silabario-rioplatense",sopa:"sopa-fugaz",palabra:"palabra-secreta","palabra-colaborativa":"palabra-secreta",moon:"moon-tap",puzzle:"puzzle",linea:"linea-tiempo","sopa-colab":"sopa-fugaz","cruzadas-colab":"palabras-cruzadas","linea-colab":"linea-tiempo"};
  let invitacion=null;
  try{
    const q=new URLSearchParams(location.search),j=q.get("duelo"),s=(q.get("sala")||"").toUpperCase();
    if(DUELO_EXT[j]&&/^[A-HJ-NP-Z2-9]{4}$/.test(s))invitacion={juego:j,sala:s,de:(q.get("de")||"").replace(/[^\p{L}\p{N} ]/gu,"").trim().slice(0,14),host:q.get("anfitrion")==="1"};
  }catch(e){}
  function linkInvitacion(){
    let base="";try{base=location.origin+location.pathname;}catch(e){}
    return base+"?duelo="+juego+"&sala="+sala+"&de="+encodeURIComponent((perfil&&perfil.nombre)||"");
  }
  function limpiarUrl(){try{history.replaceState(null,"",location.pathname);}catch(e){}}
  function abrirInvitacion(){
    if(!invitacion||typeof Extensiones==="undefined")return;
    Extensiones.abrirJuego(DUELO_EXT[invitacion.juego]);
    let n=0;const t=setInterval(()=>{
      const b=invitacion?.juego==="palabra-colaborativa"?document.querySelector("#psColaborativo"):/-colab$/.test(invitacion?.juego||"")?[...document.querySelectorAll("button[data-equipo]")].find(x=>x.offsetParent):[...document.querySelectorAll("#extContenido button")].find(x=>/con un amigo|👥/i.test(x.textContent)&&x.offsetParent);
      if(b){clearInterval(t);b.click();}else if(++n>24)clearInterval(t);
    },250);
  }
  /* Revancha en la misma sala: al terminar, si los dos tocan "Revancha"
     se vuelve a llamar al onListo del juego (misma conexión, sin invitar
     de nuevo) y arranca otra partida. "Salir" avisa al otro ("chau"). */
  let onListoJuego=null,revancha={yo:false,rival:false},rivalSeFue=false,repintar=null,rondaPendiente=null;
  function chequearRevancha(){
    if(!(revancha.yo&&revancha.rival)||!onListoJuego)return;
    revancha={yo:false,rival:false};finalRival=null;cbFinal=null;cbRonda=null;cbProgreso=null;repintar=null;
    cerrarCapa();activo=true;
    onListoJuego(soyHost,rival);
  }
  let cbChau=null,cbRivalListo=null,cbRonda=null,cbProgreso=null,cbFinal=null,finalRival=null,holaTimer=null,capa=null;
  function codigoNuevo(){return Array.from({length:4},()=>CHARS[Math.floor(Math.random()*CHARS.length)]).join("");}
  function temaOut(){return "gyaduelo/"+juego+"/"+sala+"/"+(soyHost?"host":"guest");}
  function temaIn(){return "gyaduelo/"+juego+"/"+sala+"/"+(soyHost?"guest":"host");}
  function mandar(msg){try{cliente&&cliente.connected&&cliente.publish(temaOut(),JSON.stringify(msg));}catch(e){}}
  function conectarSala(listo,fallo,asignar){
    if(juego==="palabra-colaborativa"&&window.SalaPalabra)return SalaPalabra.conectar(sala,soyHost,listo,fallo,asignar);
    return MultiBroker.conectar(listo,fallo,asignar);
  }
  /* Salas fijas del colaborativo de Palabra Secreta (como el Puzzle): el código queda guardado y sirve siempre. */
  const SALAS_PS="gya_palabra_salas";
  function salasFijas(){try{const l=JSON.parse(localStorage.getItem(SALAS_PS)||"[]");return Array.isArray(l)?l.filter(x=>x&&/^[A-HJ-NP-Z2-9]{4}$/.test(x.codigo)):[];}catch(e){return[];}}
  /* Salas guardadas de cada juego (6/11/2026, Gonzalo: "Juan me invita a Sopa Fugaz y nos queda esa sala"):
     se recuerda el código, con quién y el rol de cada uno. Quien creó la sala la vuelve a abrir como
     anfitrión; el invitado entra como invitado y puede avisarle por WhatsApp (link con anfitrion=1). */
  const SALAS_DL="gya_salas_duelo";
  function salasTodas(){try{const l=JSON.parse(localStorage.getItem(SALAS_DL)||"[]");return Array.isArray(l)?l.filter(x=>x&&typeof x.juego==="string"&&/^[A-HJ-NP-Z2-9]{4}$/.test(x.codigo)&&(x.rol==="host"||x.rol==="guest")):[];}catch(e){return[];}}
  function salasDe(j){return salasTodas().filter(x=>x.juego===j);}
  function guardarSalaDuelo(cod,r){
    const nueva={juego,codigo:cod,rol:soyHost?"host":"guest",con:String(r&&r.nombre||"").slice(0,30),t:Date.now()};
    const otras=salasTodas().filter(x=>!(x.juego===juego&&x.codigo===cod)&&!(x.juego===juego&&nueva.con&&x.con===nueva.con));
    const deJuego=[nueva].concat(otras.filter(x=>x.juego===juego)),mias=deJuego.slice(0,4);
    deJuego.slice(4).forEach(x=>{try{localStorage.removeItem(claveEstado(x.juego,x.codigo));}catch(e){}});
    try{localStorage.setItem(SALAS_DL,JSON.stringify(mias.concat(otras.filter(x=>x.juego!==juego)).slice(0,40)));}catch(e){}
  }
  /* Cada juego en equipo guarda su partida en curso con esta clave: así, si alguien cierra la app,
     al volver a la sala sigue la misma partida (como el Puzzle). */
  const claveEstado=(j,cod)=>"gya_equipo_"+j+"_"+cod;
  const hayEstado=(j,cod)=>{try{return !!localStorage.getItem(claveEstado(j,cod));}catch(e){return false;}};
  function salasDueloHtml(j){
    const l=salasDe(j);if(!l.length)return "";
    const esc=t=>String(t).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
    return '<div id="dlFijas" class="dl-fijas"><p>Tus salas</p>'+l.map(x=>'<button type="button" data-sala-dl="'+x.codigo+'" data-rol="'+x.rol+'" data-con="'+esc(x.con)+'">'+(hayEstado(j,x.codigo)?'▶ Seguir partida':'🔁')+' '+(x.con?'con <b>'+esc(x.con)+'</b>':'Sala <b>'+x.codigo+'</b>')+' <small>'+x.codigo+'</small></button>').join("")+'</div>';
  }
  /* Latido: cada 3 s se avisa "sigo acá"; si el compañero no da señales en 10 s el globito lo muestra desconectado. */
  let latidoTimer=null,ultimoRival=0;
  function arrancarLatido(){clearInterval(latidoTimer);ultimoRival=Date.now();latidoTimer=setInterval(()=>{mandar({tipo:"latido"});pintarConexion();},3000);}
  function rivalConectado(){return !!rival&&Date.now()-ultimoRival<10000;}
  function pintarConexion(){if(!badgeEl)return;const off=!!rival&&!rivalSeFue&&Date.now()-ultimoRival>10000;badgeEl.classList.toggle("dl-off",off);}
  function recordarSala(cod,r){
    arrancarLatido();
    if(juego!=="palabra-colaborativa"){guardarSalaDuelo(cod,r);return;}
    const l=salasFijas().filter(x=>x.codigo!==cod);l.unshift({codigo:cod,con:String(r&&r.nombre||"").slice(0,30),t:Date.now()});
    try{localStorage.setItem(SALAS_PS,JSON.stringify(l.slice(0,6)));}catch(e){}
  }
  function salasFijasHtml(){
    const l=salasFijas().slice(0,4);if(!l.length)return "";
    const esc=t=>String(t).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
    return '<div id="dlFijas" class="dl-fijas"><p>Tus salas</p>'+l.map(x=>'<button type="button" data-sala-fija="'+x.codigo+'">🔁 <b>'+x.codigo+'</b>'+(x.con?' · con '+esc(x.con):'')+'</button>').join("")+'</div>';
  }
  function avatarHtml(av,frame){
    return '<span class="dl-avatar"><img src="assets/avatars/'+(av||"avatar-01")+'.webp" alt="">'+
      (frame?'<img class="dl-marco" src="assets/frames/frame-'+frame+'.png" alt="">':"")+'</span>';
  }
  function recibir(t,pl){
    if(t!==temaIn())return;
    let m;try{m=JSON.parse(pl.toString());}catch(e){return;}
    ultimoRival=Date.now();if(badgeEl&&badgeEl.classList.contains("dl-off"))pintarConexion();
    /* El anfitrión volvió a abrir la sala y el compañero sigue en la partida: le pide que se presente. */
    if(m.tipo!=="hola"&&soyHost&&cbRivalListo&&Date.now()-(recibir.pidio||0)>1500){recibir.pidio=Date.now();mandar({tipo:"hola",pedir:1,nombre:(perfil&&perfil.nombre)||"Jugador",avatar:(perfil&&perfil.avatar)||null,frame:(typeof frameEquipado!=="undefined"?frameEquipado:null)});}
    if(m.tipo==="hola"&&m.pedir&&!soyHost&&!cbRivalListo)mandar({tipo:"hola",nombre:(perfil&&perfil.nombre)||"Jugador",avatar:(perfil&&perfil.avatar)||null,frame:(typeof frameEquipado!=="undefined"?frameEquipado:null)});
    if(m.tipo==="hola"){
      rival={nombre:m.nombre,avatar:m.avatar,frame:m.frame};
      if(soyHost)mandar({tipo:"hola",nombre:(perfil&&perfil.nombre)||"Jugador",avatar:(perfil&&perfil.avatar)||null,frame:(typeof frameEquipado!=="undefined"?frameEquipado:null)});
      if(!soyHost&&holaTimer){clearInterval(holaTimer);holaTimer=null;}
      if(cbRivalListo){const f=cbRivalListo;cbRivalListo=null;f(rival);}
    }else if(m.tipo==="ronda"){if(cbRonda)cbRonda(m.datos);else rondaPendiente=m.datos;}
    else if(m.tipo==="revancha"){revancha.rival=true;rivalSeFue=false;if(repintar)repintar();chequearRevancha();}
    else if(m.tipo==="chau"){rivalSeFue=true;revancha.rival=false;if(repintar)repintar();if(cbChau)cbChau();}
    else if(m.tipo==="progreso"&&(m.datos?.tipo==="dl-chat"||m.datos?.tipo==="dl-chat-ok")){recibirChat(m.datos);}
    else if(m.tipo==="progreso"&&cbProgreso){cbProgreso(m.datos);}
    else if(m.tipo==="final"){finalRival=m.datos;if(cbFinal)cbFinal(m.datos);}
  }
  function cerrarCliente(){
    clearInterval(latidoTimer);latidoTimer=null;
    if(holaTimer){clearInterval(holaTimer);holaTimer=null;}
    if(cliente){try{cliente.end(true);}catch(e){}cliente=null;}
  }
  function activaCapa(){
    if(capa)return capa;
    capa=document.createElement("div");capa.className="dl-capa";document.body.appendChild(capa);
    return capa;
  }
  function cerrarCapa(){if(capa){capa.remove();capa=null;}}
  /* --- Lobby: elegir crear o unirse, mostrar código, esperar rival --- */
  let nombreActual="";
  function mostrarLobby(nombreJuego,idJuego,{onListo,onCancelar,detalle,sub,frase,titulo="Jugar con un amigo"}){
    nombreActual=nombreJuego;onListoJuego=onListo||null;revancha={yo:false,rival:false};rivalSeFue=false;rondaPendiente=null;
    juego=idJuego;activo=false;rival=null;finalRival=null;
    const entradaDirecta=idJuego==="palabra"||idJuego==="palabra-colaborativa"||idJuego==="linea"||/-colab$/.test(idJuego);
    let uniendose=false,yaDecidido=false;
    const c=activaCapa();
    c.innerHTML='<div class="dl-tarjeta"><h3>'+titulo+'</h3><p class="dl-sub">'+(sub||nombreJuego+' · 1 vs 1')+'</p>'+(detalle?'<p class="dl-detalle">'+detalle+'</p>':'')+
      (idJuego==="palabra-colaborativa"?salasFijasHtml():salasDueloHtml(idJuego))+'<div id="dlElegir" class="dl-fila"><button type="button" id="dlCrear" class="dl-principal">Crear sala</button><button type="button" id="dlUnirse">Unirme con código</button></div>'+
      '<div id="dlCodigoZona" hidden><button type="button" id="dlWpp" class="dl-wpp">📲 Invitar por WhatsApp</button><p>o pasale este código:</p><div class="dl-codigo" id="dlCodigo"></div>'+
      '<div class="dl-fila"><button type="button" id="dlCopiar">Copiar invitación</button></div></div>'+
      '<button type="button" id="dlAvisar" class="dl-wpp" hidden>📲 Avisarle por WhatsApp</button>'+
      '<div id="dlEntrarZona" hidden><label class="dl-sr" for="dlInput">Código</label><input id="dlInput" maxlength="4" placeholder="CÓDIGO" autocomplete="off" autocapitalize="characters"><button type="button" id="dlEntrar" class="dl-principal">Unirme</button></div>'+
      '<p id="dlEstado" class="dl-estado" role="status"></p>'+
      '<button type="button" id="dlCancelar" class="dl-cerrar">Cancelar</button></div>';
    const estado=t=>{c.querySelector("#dlEstado").textContent=t;};
    const salirLobby=()=>{cerrarCliente();cerrarCapa();if(onCancelar)onCancelar();};
    c.querySelector("#dlCancelar").onclick=salirLobby;
    const crearSala=cod=>{
      soyHost=true;sala=cod;c.querySelector("#dlFijas")?.remove();c.querySelector("#dlElegir").hidden=true;c.querySelector("#dlCodigoZona").hidden=false;
      c.querySelector("#dlCodigo").textContent=sala;estado("Conectando…");
      c.querySelector("#dlWpp").disabled=true;c.querySelector("#dlCopiar").disabled=true;
      conectarSala(()=>{
        cliente.subscribe(temaIn());cliente.on("message",recibir);estado("Sala lista. Esperando al otro jugador…");
        c.querySelector("#dlWpp").disabled=false;c.querySelector("#dlCopiar").disabled=false;
        cbRivalListo=r=>{estado("");cerrarCapa();recordarSala(sala,r);if(onListo)onListo(true,r);};
      },()=>estado("No se pudo conectar ("+(window.gyaFalloConexion||"sin respuesta")+"). Probá con otra red (datos del celular)."),cl=>{cliente=cl;});
      const quien=(perfil&&perfil.nombre)||"Un amigo";
      const texto="¡"+quien+" "+(frase||"te desafía a")+" "+nombreJuego+" en Girá y Adiviná! 👥 "+(entradaDirecta?"Tocá el link para entrar directamente a la sala: ":"Tocá el link y apretá UNIRME: ")+linkInvitacion()+" (código "+sala+")";
      c.querySelector("#dlWpp").onclick=()=>window.open("https://wa.me/?text="+encodeURIComponent(texto),"_blank");
      c.querySelector("#dlCopiar").onclick=async()=>{
        try{await navigator.clipboard.writeText(texto);}catch(e){}
        const b=c.querySelector("#dlCopiar");b.textContent="¡Copiada!";setTimeout(()=>b.textContent="Copiar invitación",1500);
      };
    };
    c.querySelector("#dlCrear").onclick=()=>crearSala(codigoNuevo());
    c.querySelector("#dlUnirse").onclick=()=>{
      c.querySelector("#dlElegir").hidden=true;c.querySelector("#dlEntrarZona").hidden=false;c.querySelector("#dlInput").focus();
    };
    const entrar=()=>{
      if(uniendose)return;
      const cod=c.querySelector("#dlInput").value.trim().toUpperCase();
      if(!/^[A-HJ-NP-Z2-9]{4}$/.test(cod)){estado("El código tiene 4 letras o números. Revisalo y probá otra vez.");return;}
      uniendose=true;c.querySelector("#dlEntrar").disabled=true;
      if(idJuego==="palabra-colaborativa"&&window.SalaPalabra&&!yaDecidido){
        estado("Buscando la sala "+cod+"…");c.querySelector("#dlFijas")?.remove();
        SalaPalabra.hostActivo(cod).then(hay=>{
          if(!capa)return;
          if(hay!==false){yaDecidido=true;uniendose=false;entrar();}
          else{uniendose=false;c.querySelector("#dlElegir").hidden=true;c.querySelector("#dlEntrarZona").hidden=true;crearSala(cod);estado("Abriste la sala "+cod+" con tu partida actual. Esperando a tu compañero…");}
        });
        return;
      }
      yaDecidido=false;
      soyHost=false;sala=cod;estado("Conectando…");
      conectarSala(()=>{
        cliente.subscribe(temaIn());cliente.on("message",recibir);estado("Buscando la sala "+sala+"…");
        cbRivalListo=r=>{estado("");cerrarCapa();recordarSala(sala,r);if(onListo)onListo(false,r);};
        const hola=()=>mandar({tipo:"hola",nombre:(perfil&&perfil.nombre)||"Jugador",avatar:(perfil&&perfil.avatar)||null,frame:(typeof frameEquipado!=="undefined"?frameEquipado:null)});
        hola();holaTimer=setInterval(hola,2000);
      },()=>{
        uniendose=false;c.querySelector("#dlEntrar").disabled=false;c.querySelector("#dlEntrarZona").hidden=false;
        c.querySelector("#dlEntrar").textContent="Reintentar conexión";
        estado("No se pudo conectar ("+(window.gyaFalloConexion||"sin respuesta")+"). Probá de nuevo o con otra red (datos del celular).");
      },cl=>{cliente=cl;});
    };
    c.querySelector("#dlEntrar").onclick=entrar;
    c.querySelectorAll("[data-sala-fija]").forEach(b=>b.onclick=()=>{c.querySelector("#dlInput").value=b.dataset.salaFija;c.querySelector("#dlElegir").hidden=true;entrar();});
    c.querySelectorAll("[data-sala-dl]").forEach(b=>b.onclick=()=>{
      const cod=b.dataset.salaDl,con=b.dataset.con||"tu compañero";
      if(b.dataset.rol==="host"){crearSala(cod);return;}
      c.querySelector("#dlFijas")?.remove();c.querySelector("#dlElegir").hidden=true;c.querySelector("#dlInput").value=cod;entrar();
      const av=c.querySelector("#dlAvisar");av.hidden=false;
      av.onclick=()=>{let base="";try{base=location.origin+location.pathname;}catch(e){}
        const texto="¡"+(((perfil&&perfil.nombre)||"Tu amigo"))+" te espera en su sala de "+nombreJuego+" en Girá y Adiviná! 👥 Tocá el link para entrar: "+base+"?duelo="+juego+"&sala="+cod+"&anfitrion=1";
        window.open("https://wa.me/?text="+encodeURIComponent(texto),"_blank");};
      setTimeout(()=>{if(capa&&!activo&&cbRivalListo)estado("Esperando a "+con+"… Avisale que entre a la sala.");},2500);
    });
    c.querySelector("#dlInput").onkeydown=e=>{if(e.key==="Enter")entrar();};
    if(invitacion&&invitacion.juego===idJuego){
      const inv=invitacion;invitacion=null;limpiarUrl();
      c.querySelector("#dlFijas")?.remove();
      if(inv.host){crearSala(inv.sala);return;}
      c.querySelector("#dlElegir").hidden=true;c.querySelector("#dlEntrarZona").hidden=false;
      c.querySelector("#dlInput").value=inv.sala;
      if(entradaDirecta){
        c.querySelector("#dlEntrarZona").hidden=true;c.querySelector("#dlInput").readOnly=true;
        entrar();
      }else estado((inv.de?inv.de+" te invitó":"Te invitaron")+" a la sala "+inv.sala+". Tocá UNIRME.");
    }
  }
  /* --- Durante la partida: progreso propio/rival y badge flotante --- */
  function enviarRonda(datos){mandar({tipo:"ronda",datos});}
  function onRondaRecibida(cb){cbRonda=cb;if(rondaPendiente){const d=rondaPendiente;rondaPendiente=null;cb(d);}}
  function enviarProgreso(datos){mandar({tipo:"progreso",datos});}
  function onProgresoRival(cb){cbProgreso=cb;}
  let badgeEl=null;
  function mostrarBadge(){
    if(badgeEl)return badgeEl;
    badgeEl=document.createElement("div");badgeEl.className="dl-badge";
    badgeEl.innerHTML=avatarHtml(rival&&rival.avatar,rival&&rival.frame)+'<span><small>'+((rival&&rival.nombre)||"Rival")+'</small><b id="dlBadgeValor">0</b></span>';
    /* En las extensiones el globito va DENTRO de la barra de arriba (en lugar del título), así no tapa
       nada del juego ni la ✕. Fuera de las extensiones queda flotando como antes. */
    const cab=document.querySelector("#extShell:not([hidden]) .ext-header");
    if(cab){const x=cab.querySelector("#extCerrar");cab.insertBefore(badgeEl,x);badgeEl.classList.add("dl-badge-fila");cab.classList.add("dl-con-globito");}
    else document.body.appendChild(badgeEl);
    activo=true;return badgeEl;
  }
  function actualizarBadge(texto){if(badgeEl)badgeEl.querySelector("#dlBadgeValor").textContent=texto;}
  function quitarBadge(){if(badgeEl){badgeEl.remove();badgeEl=null;}document.querySelectorAll(".dl-con-globito").forEach(x=>x.classList.remove("dl-con-globito"));}
  /* --- Final: mandar mi resultado y mostrar la comparación --- */
  function enviarFinal(datos){mandar({tipo:"final",datos});}
  function mostrarResultado(miResultado,{etiqueta="aciertos",onVolver,extra}={}){
    quitarBadge();
    const c=activaCapa();
    const pintar=()=>{
      const gano=finalRival?(miResultado.valor>finalRival.valor?"vos":miResultado.valor<finalRival.valor?"rival":"empate"):null;
      c.innerHTML='<div class="dl-tarjeta dl-resultado"><h3>'+(finalRival?(gano==="empate"?"¡Empataron!":gano==="vos"?"¡Ganaste!":"Ganó "+(rival&&rival.nombre||"tu rival")):"Esperando a tu rival…")+'</h3>'+
        '<div class="dl-vs">'+
        '<div class="dl-vsjugador'+(gano==="vos"?" dl-gano":"")+'">'+avatarHtml(perfil&&perfil.avatar,typeof frameEquipado!=="undefined"?frameEquipado:null)+'<small>Vos</small><b>'+miResultado.valor+'</b></div>'+
        '<span class="dl-vsversus">VS</span>'+
        '<div class="dl-vsjugador'+(gano==="rival"?" dl-gano":"")+'">'+avatarHtml(rival&&rival.avatar,rival&&rival.frame)+'<small>'+((rival&&rival.nombre)||"Rival")+'</small><b>'+(finalRival?finalRival.valor:"…")+'</b></div>'+
        '</div><p class="dl-sub">'+etiqueta+(finalRival?"":" · todavía está jugando")+'</p>'+
        (extra?'<div class="dl-extra">'+extra(finalRival)+'</div>':'')+
        (finalRival&&!rivalSeFue?(revancha.rival&&!revancha.yo?'<p class="dl-revancha-aviso">🔥 '+((rival&&rival.nombre)||"Tu rival")+' quiere la revancha</p>':'')+
          (revancha.yo?'<p class="dl-revancha-aviso">⏳ Esperando que '+((rival&&rival.nombre)||"tu rival")+' acepte la revancha…</p>':'<button type="button" id="dlRevancha" class="dl-principal dl-revancha">🔄 '+(revancha.rival?"¡Dale, revancha!":"Revancha")+'</button>'):'')+
        (rivalSeFue?'<p class="dl-revancha-aviso">'+((rival&&rival.nombre)||"Tu rival")+' salió de la sala.</p>':'')+
        (finalRival?'<button type="button" id="dlCompartir" class="dl-wpp">📲 Compartir por WhatsApp</button>':'')+
        '<button type="button" id="dlVolver" class="dl-salir">Salir</button></div>';
      const rev=c.querySelector("#dlRevancha");
      if(rev)rev.onclick=()=>{revancha.yo=true;mandar({tipo:"revancha"});pintar();chequearRevancha();};
      const comp=c.querySelector("#dlCompartir");
      if(comp)comp.onclick=()=>{
        let base="";try{base=location.origin+location.pathname;}catch(e){}
        const rn=(rival&&rival.nombre)||"mi rival";
        const frase=gano==="vos"?"¡Le gané a "+rn:gano==="rival"?"¡"+rn+" me ganó":"¡Empaté con "+rn;
        const texto=frase+" en "+nombreActual+"! Yo "+miResultado.valor+" · "+rn+" "+finalRival.valor+" ("+etiqueta+"). ¿Te animás? Jugá gratis en Girá y Adiviná: "+base;
        try{window.open("https://wa.me/?text="+encodeURIComponent(texto),"_blank");}catch(e){}
      };
      c.querySelector("#dlVolver").onclick=()=>{mandar({tipo:"chau"});repintar=null;onListoJuego=null;setTimeout(cerrarCliente,150);cerrarCapa();activo=false;if(onVolver)onVolver();};
    };
    repintar=pintar;
    pintar();
    if(!finalRival)cbFinal=()=>pintar();
  }
  /* --- Chat de los juegos en equipo (6/11/2026, Gonzalo: "así no hay discusiones o pueden hablar") ---
     Va por el mismo canal ("progreso" con tipo dl-chat), cada mensaje se reenvía hasta que el otro confirma,
     y la conversación queda guardada por sala. Propuestas: un mensaje con prop muestra al otro una tarjeta
     "Juan propone CARTA · ✅ / ❌" y la respuesta llega al juego por onVoto. */
  let chat=null;
  const FRASES_CHAT=["¡Dale! 👍","Esa no 😅","Esperá ⏳","¡Bien ahí! 🙌","¿Probamos otra? 🤔","Me voy, seguimos después 👋"];
  const escChat=t=>String(t).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
  const miNombreChat=()=>String((perfil&&perfil.nombre)||"Yo").slice(0,20);
  const claveChat=()=>"gya_chat_"+juego+"_"+sala;
  function activarChat(){
    if(!juego||!sala)return;
    if(!chat){let msgs=[];try{msgs=JSON.parse(localStorage.getItem(claveChat())||"[]");if(!Array.isArray(msgs))msgs=[];}catch(e){msgs=[];}
      chat={msgs:msgs.slice(-40),pend:new Map(),vistos:new Set(msgs.map(x=>x.id)),votadas:new Set(msgs.filter(x=>x.voto).map(x=>x.voto.id)),sinLeer:0,cbVoto:null};
      chat.timer=setInterval(()=>{chat&&chat.pend.forEach((v,id)=>{if(++v.n>15)chat.pend.delete(id);else mandar({tipo:"progreso",datos:v.m});});},2000);}
    const b=mostrarBadge();
    if(!b.querySelector(".dl-chat-btn")){const x=document.createElement("button");x.type="button";x.className="dl-chat-btn";x.setAttribute("aria-label","Abrir el chat");x.innerHTML='💬<i hidden></i>';b.prepend(x);b.classList.add("dl-con-chat");b.onclick=abrirChat;}
    pintarSinLeer();
  }
  function guardarChat(){try{localStorage.setItem(claveChat(),JSON.stringify(chat.msgs.slice(-40)));}catch(e){}}
  function pintarSinLeer(){const i=badgeEl&&badgeEl.querySelector(".dl-chat-btn i");if(!i||!chat)return;i.hidden=!chat.sinLeer;i.textContent=chat.sinLeer>9?"9+":String(chat.sinLeer);}
  function enviarChat(texto,extra){
    if(!chat)return;texto=String(texto||"").trim().slice(0,200);if(!texto&&!extra)return;
    const m={tipo:"dl-chat",id:Math.random().toString(36).slice(2,10),de:miNombreChat(),t:texto,ts:Date.now(),...(extra||{})};
    chat.vistos.add(m.id);chat.msgs.push({...m,yo:true});chat.msgs=chat.msgs.slice(-40);guardarChat();
    chat.pend.set(m.id,{m,n:0});mandar({tipo:"progreso",datos:m});pintarChat();
  }
  function recibirChat(d){
    if(!chat||!d)return;
    if(d.tipo==="dl-chat-ok"){chat.pend.delete(d.id);return;}
    if(typeof d.id!=="string")return;
    mandar({tipo:"progreso",datos:{tipo:"dl-chat-ok",id:d.id}});
    if(chat.vistos.has(d.id))return;chat.vistos.add(d.id);
    const m={id:d.id,de:String(d.de||"Compañero").slice(0,20),t:String(d.t||"").slice(0,200),ts:Number(d.ts)||Date.now()};
    if(d.prop&&typeof d.prop.palabra==="string")m.prop={palabra:d.prop.palabra.slice(0,12),id:d.id};
    if(d.voto&&typeof d.voto.palabra==="string")m.voto={palabra:d.voto.palabra.slice(0,12),si:!!d.voto.si,id:String(d.voto.id||"")};
    chat.msgs.push(m);chat.msgs=chat.msgs.slice(-40);guardarChat();
    if(m.voto&&chat.cbVoto)try{chat.cbVoto(m.voto.palabra,m.voto.si,m.de);}catch(e){}
    if(m.prop)mostrarPropuesta(m);
    if(document.querySelector(".dl-chat"))pintarChat();
    else if(!m.prop){chat.sinLeer++;pintarSinLeer();vistaPrevia(m);}
  }
  function vistaPrevia(m){
    document.querySelector(".dl-chat-previa")?.remove();
    const v=document.createElement("button");v.type="button";v.className="dl-chat-previa";
    v.innerHTML='<b>'+escChat(m.de)+':</b> '+escChat(m.voto?(m.voto.si?"✅ ":"❌ ")+m.t:m.t);v.onclick=()=>{v.remove();abrirChat();};
    document.body.appendChild(v);setTimeout(()=>v.remove(),4000);
  }
  function votar(m,si){
    if(!chat||chat.votadas.has(m.prop.id))return;chat.votadas.add(m.prop.id);
    document.querySelector(".dl-propuesta")?.remove();
    enviarChat(si?"✅ ¡Dale con "+m.prop.palabra+"!":"❌ "+m.prop.palabra+" no, probemos otra",{voto:{palabra:m.prop.palabra,si,id:m.prop.id}});
  }
  function mostrarPropuesta(m){
    document.querySelector(".dl-propuesta")?.remove();
    const c=document.createElement("div");c.className="dl-propuesta";c.setAttribute("role","alertdialog");
    c.innerHTML='<p>💡 <b>'+escChat(m.de)+'</b> propone</p><div class="dl-prop-palabra">'+escChat(m.prop.palabra)+'</div><p class="dl-prop-preg">¿Le damos?</p><div class="dl-fila"><button type="button" class="dl-principal" data-v="1">✅ Sí</button><button type="button" data-v="0">❌ No</button></div><button type="button" class="dl-prop-chat">💬 Hablarlo en el chat</button>';
    c.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>votar(m,b.dataset.v==="1"));
    c.querySelector(".dl-prop-chat").onclick=()=>{c.remove();abrirChat();};
    document.body.appendChild(c);
  }
  function proponer(palabra){enviarChat("💡 Propongo "+palabra,{prop:{palabra:String(palabra).slice(0,12)}});}
  function abrirChat(){
    if(!chat)return;document.querySelector(".dl-chat-previa")?.remove();
    let p=document.querySelector(".dl-chat");
    if(!p){p=document.createElement("div");p.className="dl-chat";p.setAttribute("role","dialog");p.setAttribute("aria-label","Chat");
      p.innerHTML='<div class="dl-chat-cab"><b>💬 Chat con '+escChat((rival&&rival.nombre)||"tu compañero")+'</b><button type="button" class="dl-chat-x" aria-label="Cerrar el chat">✕</button></div><div class="dl-chat-lista"></div>'+
        '<div class="dl-chat-frases">'+FRASES_CHAT.map(f=>'<button type="button">'+escChat(f)+'</button>').join("")+'</div>'+
        '<form class="dl-chat-form"><input type="text" maxlength="200" placeholder="Escribí un mensaje…" aria-label="Mensaje" autocomplete="off"><button type="submit" class="dl-principal">Enviar</button></form>';
      document.body.appendChild(p);
      p.querySelector(".dl-chat-x").onclick=()=>p.remove();
      p.querySelectorAll(".dl-chat-frases button").forEach(b=>b.onclick=()=>enviarChat(b.textContent));
      const inp=p.querySelector("input");inp.addEventListener("keydown",e=>e.stopPropagation());
      p.querySelector("form").onsubmit=e=>{e.preventDefault();enviarChat(inp.value);inp.value="";};
    }
    chat.sinLeer=0;pintarSinLeer();pintarChat();
  }
  function pintarChat(){
    const p=document.querySelector(".dl-chat");if(!p||!chat)return;
    const l=p.querySelector(".dl-chat-lista");
    l.innerHTML=chat.msgs.length?chat.msgs.map(m=>'<div class="dl-msg'+(m.yo?" yo":"")+'">'+(m.yo?"":'<small>'+escChat(m.de)+'</small>')+'<span>'+escChat(m.t)+'</span>'+
      (m.prop&&!m.yo&&!chat.votadas.has(m.prop.id)?'<div class="dl-fila"><button type="button" class="dl-principal" data-si="'+escChat(m.id)+'">✅ Sí</button><button type="button" data-no="'+escChat(m.id)+'">❌ No</button></div>':'')+'</div>').join(""):'<p class="dl-chat-vacio">Todavía no hay mensajes. ¡Saludá! 👋</p>';
    l.querySelectorAll("[data-si],[data-no]").forEach(b=>b.onclick=()=>{const id=b.dataset.si||b.dataset.no,m=chat.msgs.find(x=>x.id===id);if(m)votar(m,!!b.dataset.si);pintarChat();});
    l.scrollTop=l.scrollHeight;
  }
  function cerrarChat(){if(chat){clearInterval(chat.timer);chat=null;}document.querySelectorAll(".dl-chat,.dl-propuesta,.dl-chat-previa").forEach(x=>x.remove());}
  function estaActivo(){return activo;}
  function soyAnfitrion(){return soyHost;}
  function salaActual(){return sala;}
  function leerPartida(){try{return JSON.parse(localStorage.getItem(claveEstado(juego,sala))||"null");}catch(e){return null;}}
  function guardarPartida(d){if(!juego||!sala)return;try{if(d==null)localStorage.removeItem(claveEstado(juego,sala));else localStorage.setItem(claveEstado(juego,sala),JSON.stringify(d));}catch(e){}}
  function rivalActual(){return rival;}
  function salir(){cerrarChat();cbChau=null;if(cliente&&cliente.connected)mandar({tipo:"chau"});repintar=null;onListoJuego=null;rondaPendiente=null;cerrarCliente();cerrarCapa();quitarBadge();activo=false;rival=null;finalRival=null;cbRivalListo=null;cbRonda=null;cbProgreso=null;cbFinal=null;}
  /* Invitación desde «Mis amigos» (09/11): abre el juego y entra directo a la sala elegida, como anfitrión o invitado. */
  function invitarCon(j,cod,host,de){if(!DUELO_EXT[j]||!/^[A-HJ-NP-Z2-9]{4}$/.test(cod))return false;invitacion={juego:j,sala:cod,de:String(de||"").slice(0,14),host:!!host};abrirInvitacion();return true;}
  return{invitarCon,abrirInvitacion,hayInvitacion:()=>!!invitacion,invitacionPara:j=>!!(invitacion&&invitacion.juego===j),onRivalSeFue:cb=>{cbChau=cb;},mostrarLobby,enviarRonda,onRondaRecibida,enviarProgreso,onProgresoRival,rivalConectado,soyAnfitrion,salaActual,activarChat,enviarChat,proponer,onVoto:cb=>{if(chat)chat.cbVoto=cb;},abrirChat,leerPartida,guardarPartida,mostrarBadge,actualizarBadge,enviarFinal,mostrarResultado,estaActivo,rivalActual,salir};
})();
window.Duelo=Duelo;
