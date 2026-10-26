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
     con el lobby en "Unirme" y el código ya cargado. */
  const DUELO_EXT={ahorcado:"ahorcado-rioplatense",cien:"cien-rioplatenses",frases:"frases-en-giro",memoria:"memoria-en-giro",rosco:"rosco-rioplatense",rueda:"rueda-de-letras",silabario:"silabario-rioplatense",sopa:"sopa-fugaz",palabra:"palabra-secreta",moon:"moon-tap",puzzle:"puzzle"};
  let invitacion=null;
  try{
    const q=new URLSearchParams(location.search),j=q.get("duelo"),s=(q.get("sala")||"").toUpperCase();
    if(DUELO_EXT[j]&&/^[A-HJ-NP-Z2-9]{4}$/.test(s))invitacion={juego:j,sala:s,de:(q.get("de")||"").replace(/[^\p{L}\p{N} ]/gu,"").trim().slice(0,14)};
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
      const b=[...document.querySelectorAll("#extContenido button")].find(x=>/con un amigo|👥/i.test(x.textContent)&&x.offsetParent);
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
  function avatarHtml(av,frame){
    return '<span class="dl-avatar"><img src="assets/avatars/'+(av||"avatar-01")+'.webp" alt="">'+
      (frame?'<img class="dl-marco" src="assets/frames/frame-'+frame+'.png" alt="">':"")+'</span>';
  }
  function recibir(t,pl){
    if(t!==temaIn())return;
    let m;try{m=JSON.parse(pl.toString());}catch(e){return;}
    if(m.tipo==="hola"){
      rival={nombre:m.nombre,avatar:m.avatar,frame:m.frame};
      if(soyHost)mandar({tipo:"hola",nombre:(perfil&&perfil.nombre)||"Jugador",avatar:(perfil&&perfil.avatar)||null,frame:(typeof frameEquipado!=="undefined"?frameEquipado:null)});
      if(!soyHost&&holaTimer){clearInterval(holaTimer);holaTimer=null;}
      if(cbRivalListo){const f=cbRivalListo;cbRivalListo=null;f(rival);}
    }else if(m.tipo==="ronda"){if(cbRonda)cbRonda(m.datos);else rondaPendiente=m.datos;}
    else if(m.tipo==="revancha"){revancha.rival=true;rivalSeFue=false;if(repintar)repintar();chequearRevancha();}
    else if(m.tipo==="chau"){rivalSeFue=true;revancha.rival=false;if(repintar)repintar();if(cbChau)cbChau();}
    else if(m.tipo==="progreso"&&cbProgreso){cbProgreso(m.datos);}
    else if(m.tipo==="final"){finalRival=m.datos;if(cbFinal)cbFinal(m.datos);}
  }
  function cerrarCliente(){
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
  function mostrarLobby(nombreJuego,idJuego,{onListo,onCancelar,detalle,sub,frase}){
    nombreActual=nombreJuego;onListoJuego=onListo||null;revancha={yo:false,rival:false};rivalSeFue=false;rondaPendiente=null;
    juego=idJuego;activo=false;rival=null;finalRival=null;
    const c=activaCapa();
    c.innerHTML='<div class="dl-tarjeta"><h3>Jugar con un amigo</h3><p class="dl-sub">'+(sub||nombreJuego+' · 1 vs 1')+'</p>'+(detalle?'<p class="dl-detalle">'+detalle+'</p>':'')+
      '<div id="dlElegir" class="dl-fila"><button type="button" id="dlCrear" class="dl-principal">Crear sala</button><button type="button" id="dlUnirse">Unirme con código</button></div>'+
      '<div id="dlCodigoZona" hidden><button type="button" id="dlWpp" class="dl-wpp">📲 Invitar por WhatsApp</button><p>o pasale este código:</p><div class="dl-codigo" id="dlCodigo"></div>'+
      '<div class="dl-fila"><button type="button" id="dlCopiar">Copiar invitación</button></div></div>'+
      '<div id="dlEntrarZona" hidden><label class="dl-sr" for="dlInput">Código</label><input id="dlInput" maxlength="4" placeholder="CÓDIGO" autocomplete="off" autocapitalize="characters"><button type="button" id="dlEntrar" class="dl-principal">Unirme</button></div>'+
      '<p id="dlEstado" class="dl-estado" role="status"></p>'+
      '<button type="button" id="dlCancelar" class="dl-cerrar">Cancelar</button></div>';
    const estado=t=>{c.querySelector("#dlEstado").textContent=t;};
    const salirLobby=()=>{cerrarCliente();cerrarCapa();if(onCancelar)onCancelar();};
    c.querySelector("#dlCancelar").onclick=salirLobby;
    c.querySelector("#dlCrear").onclick=()=>{
      soyHost=true;sala=codigoNuevo();c.querySelector("#dlElegir").hidden=true;c.querySelector("#dlCodigoZona").hidden=false;
      c.querySelector("#dlCodigo").textContent=sala;estado("Conectando…");
      MultiBroker.conectar(()=>{
        cliente.subscribe(temaIn());cliente.on("message",recibir);estado("Sala lista. Esperando al otro jugador…");
        cbRivalListo=r=>{estado("");cerrarCapa();if(onListo)onListo(true,r);};
      },()=>estado("No se pudo conectar ("+(window.gyaFalloConexion||"sin respuesta")+"). Probá con otra red (datos del celular)."),cl=>{cliente=cl;});
      const quien=(perfil&&perfil.nombre)||"Un amigo";
      const texto="¡"+quien+" "+(frase||"te desafía a")+" "+nombreJuego+" en Girá y Adiviná! 👥 Tocá el link y apretá UNIRME: "+linkInvitacion()+" (código "+sala+")";
      c.querySelector("#dlWpp").onclick=()=>window.open("https://wa.me/?text="+encodeURIComponent(texto),"_blank");
      c.querySelector("#dlCopiar").onclick=async()=>{
        try{await navigator.clipboard.writeText(texto);}catch(e){}
        const b=c.querySelector("#dlCopiar");b.textContent="¡Copiada!";setTimeout(()=>b.textContent="Copiar invitación",1500);
      };
    };
    c.querySelector("#dlUnirse").onclick=()=>{
      c.querySelector("#dlElegir").hidden=true;c.querySelector("#dlEntrarZona").hidden=false;c.querySelector("#dlInput").focus();
    };
    const entrar=()=>{
      const cod=c.querySelector("#dlInput").value.trim().toUpperCase();
      if(cod.length<4){estado("El código tiene 4 caracteres.");return;}
      soyHost=false;sala=cod;estado("Conectando…");
      MultiBroker.conectar(()=>{
        cliente.subscribe(temaIn());cliente.on("message",recibir);estado("Buscando la sala "+sala+"…");
        cbRivalListo=r=>{estado("");cerrarCapa();if(onListo)onListo(false,r);};
        const hola=()=>mandar({tipo:"hola",nombre:(perfil&&perfil.nombre)||"Jugador",avatar:(perfil&&perfil.avatar)||null,frame:(typeof frameEquipado!=="undefined"?frameEquipado:null)});
        hola();holaTimer=setInterval(hola,2000);
      },()=>estado("No se pudo conectar ("+(window.gyaFalloConexion||"sin respuesta")+"). Probá con otra red (datos del celular)."),cl=>{cliente=cl;});
    };
    c.querySelector("#dlEntrar").onclick=entrar;
    c.querySelector("#dlInput").onkeydown=e=>{if(e.key==="Enter")entrar();};
    if(invitacion&&invitacion.juego===idJuego){
      const inv=invitacion;invitacion=null;limpiarUrl();
      c.querySelector("#dlElegir").hidden=true;c.querySelector("#dlEntrarZona").hidden=false;
      c.querySelector("#dlInput").value=inv.sala;
      estado((inv.de?inv.de+" te invitó":"Te invitaron")+" a la sala "+inv.sala+". Tocá UNIRME.");
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
    document.body.appendChild(badgeEl);activo=true;return badgeEl;
  }
  function actualizarBadge(texto){if(badgeEl)badgeEl.querySelector("#dlBadgeValor").textContent=texto;}
  function quitarBadge(){if(badgeEl){badgeEl.remove();badgeEl=null;}}
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
  function estaActivo(){return activo;}
  function rivalActual(){return rival;}
  function salir(){cbChau=null;if(cliente&&cliente.connected)mandar({tipo:"chau"});repintar=null;onListoJuego=null;rondaPendiente=null;cerrarCliente();cerrarCapa();quitarBadge();activo=false;rival=null;finalRival=null;cbRivalListo=null;cbRonda=null;cbProgreso=null;cbFinal=null;}
  return{abrirInvitacion,hayInvitacion:()=>!!invitacion,invitacionPara:j=>!!(invitacion&&invitacion.juego===j),onRivalSeFue:cb=>{cbChau=cb;},mostrarLobby,enviarRonda,onRondaRecibida,enviarProgreso,onProgresoRival,mostrarBadge,actualizarBadge,enviarFinal,mostrarResultado,estaActivo,rivalActual,salir};
})();
window.Duelo=Duelo;
