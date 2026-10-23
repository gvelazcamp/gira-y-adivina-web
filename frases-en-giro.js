/* Frases en Giro: extensión local, independiente de las monedas y vidas. */
const FRASES_GIRO_CONFIG={
  primerNivel:1,intentos:3,penalidadErrorMs:10000,puntosBase:100,puntosPorSegundo:3,
  puntosPorRacha:20,giroAnimacionMs:650,ticMs:50,recientesMax:24,
  niveles:{
    1:{grupo:1,segundos:65,giro:18,senuelos:0},
    2:{grupo:1,segundos:60,giro:15,senuelos:1},
    3:{grupo:2,segundos:70,giro:14,senuelos:1},
    4:{grupo:2,segundos:65,giro:12,senuelos:2},
    5:{grupo:3,segundos:75,giro:11,senuelos:2}
  }
};
const FrasesEnGiro=(()=>{
  const CLAVE="gya_frases_en_giro";
  const azar=n=>Math.floor(Math.random()*n);
  let datos=cargar(),raiz=null,frase=null,fichas=[],ordenBanco=[],espacios=[];
  let nivel=1,puntos=0,racha=0,errores=0,tiempoMs=0,duracionMs=0,giroMs=0,proximoGiro=0;
  let jugando=false,girando=false,intervalo=null,giroTimer=null,ultimoTic=0,ocultoDesde=0,token=0,duelo=false;
  let audioMusica=null;
  function iniciarMusicaJuego(){
    try{
      if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
      if(!audioMusica){audioMusica=new Audio("assets/audio/frases-en-giro-musica.mp3");audioMusica.loop=true;audioMusica.volume=.28;}
      if(audioMusica.paused)audioMusica.play().catch(()=>{});
    }catch(e){}
  }
  function detenerMusicaJuego(){try{if(audioMusica&&!audioMusica.paused)audioMusica.pause();}catch(e){}}

  function cargar(){
    try{const d=JSON.parse(localStorage.getItem(CLAVE)||"null");if(d&&typeof d==="object")return{
      mejor:Math.max(0,Number(d.mejor)||0),nivelMax:Math.max(1,Number(d.nivelMax)||1),
      ganadas:Math.max(0,Number(d.ganadas)||0),recientes:Array.isArray(d.recientes)?d.recientes.filter(Number.isInteger).slice(-FRASES_GIRO_CONFIG.recientesMax):[]
    };}catch(e){}
    return{mejor:0,nivelMax:1,ganadas:0,recientes:[]};
  }
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}}
  function mejorPuntaje(){return datos.mejor;}
  function configNivel(n){
    if(FRASES_GIRO_CONFIG.niveles[n])return FRASES_GIRO_CONFIG.niveles[n];
    const paso=n-5;
    return{grupo:3,segundos:Math.max(60,75-paso*2),giro:Math.max(8,11-paso*.5),senuelos:Math.min(3,2+Math.floor(paso/2))};
  }
  function mezclar(lista){
    const a=[...lista];for(let i=a.length-1;i>0;i--){const j=azar(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;
  }
  function elegir(n){
    const grupo=configNivel(n).grupo;
    const posibles=Vistas.filtrar("frases",FRASES_EN_GIRO_DATOS.map((d,id)=>({...d,id})).filter(d=>d.nivel===grupo),d=>d.texto);
    const recientes=new Set(datos.recientes.slice(-Math.min(8,posibles.length-1)));
    const libres=posibles.filter(d=>!recientes.has(d.id));
    const elegida=(libres.length?libres:posibles)[azar((libres.length?libres:posibles).length)];
    Vistas.marcar("frases",elegida.texto);return elegida;
  }
  /* Dibujos en assets/frases-giro/ (hoja de ChatGPT recortada). */
  const ARTE=n=>"assets/frases-giro/"+n+".webp",ico=n=>'<img class="fg-ico" src="'+ARTE(n)+'" alt="" draggable="false">';
  function sonido(f=750){if(typeof bip==="function")bip(f,.075,"sine",.05);}
  function sonidoAcierto(){
    if(typeof bip==="function"){
      bip(720,.13,"triangle",.08);
      setTimeout(()=>{if(raiz)bip(980,.22,"sine",.09);},120);
    }
    if(typeof sonarSFX==="function")sonarSFX("festejo");
  }
  function hud(){
    if(!raiz)return;
    raiz.querySelector("#fgNivel").textContent=nivel;
    raiz.querySelector("#fgPuntos").textContent=puntos;
    const intentosRestantes=FRASES_GIRO_CONFIG.intentos-errores;
    raiz.querySelector("#fgIntentos").textContent=intentosRestantes;
    raiz.querySelector("#fgIntentos").classList.toggle("peligro",intentosRestantes===1);
    raiz.querySelector("#fgTiempo").textContent=Math.max(0,Math.ceil(tiempoMs/1000));
    raiz.querySelector("#fgTiempoBarra").style.width=Math.max(0,tiempoMs/duracionMs*100)+"%";
    raiz.querySelector("#fgGiroBarra").style.width=girando?"0%":Math.max(0,(proximoGiro-performance.now())/giroMs*100)+"%";
    raiz.querySelector("#fgGiroTexto").textContent=girando?"¡Las palabras giran!":"Próximo giro en "+Math.max(0,Math.ceil((proximoGiro-performance.now())/1000))+" s";
    {const el=raiz.querySelector("#fgRacha");if(el.dataset.r!==String(racha)){el.dataset.r=racha;/* hud corre 20 veces por segundo: solo se redibuja si cambió */
      if(racha>1)el.innerHTML=ico("racha")+"Racha de "+racha+" frases";else el.textContent="Armá la frase antes de que se acabe el tiempo";}}
  }
  function avisar(texto,fallo=false){
    if(!raiz)return;
    const mensaje=raiz.querySelector("#fgMensaje");mensaje.textContent=texto;mensaje.classList.toggle("fallo",fallo);
  }
  function ficha(id){return fichas.find(f=>f.id===id);}
  function dibujarEspacios(){
    const zona=raiz.querySelector("#fgEspacios");zona.replaceChildren();
    espacios.forEach((id,i)=>{
      const b=document.createElement("button");b.type="button";b.className="fg-espacio"+(id===null?" vacio":" lleno");
      b.textContent=id===null?String(i+1):ficha(id).palabra;
      b.setAttribute("aria-label",id===null?"Lugar "+(i+1)+" vacío":"Lugar "+(i+1)+": "+ficha(id).palabra+". Tocar para quitar");
      b.disabled=!jugando||girando||id===null;
      b.onclick=()=>{espacios[i]=null;avisar("Elegí la palabra que va en el lugar "+(i+1)+".");dibujar();};
      zona.appendChild(b);
    });
  }
  function dibujarBanco(){
    const zona=raiz.querySelector("#fgBanco");zona.replaceChildren();
    const seleccionadas=new Set(espacios.filter(id=>id!==null));
    ordenBanco.filter(id=>!seleccionadas.has(id)).forEach(id=>{
      const b=document.createElement("button");b.type="button";b.className="fg-ficha";
      b.textContent=ficha(id).palabra;
      b.disabled=!jugando||girando;
      b.onclick=()=>{
        const lugar=espacios.indexOf(null);if(lugar<0)return;
        espacios[lugar]=id;avisar(espacios.includes(null)?"Tocá una ficha para sumarla. Tocá una colocada para cambiarla.":"Frase completa. ¿La comprobamos?");
        sonido(590);dibujar();
      };
      zona.appendChild(b);
    });
  }
  function dibujar(){
    if(!raiz)return;
    dibujarEspacios();dibujarBanco();
    raiz.querySelector("#fgComprobar").disabled=!jugando||girando||espacios.includes(null);
    raiz.querySelector("#fgVaciar").disabled=!jugando||girando||espacios.every(id=>id===null);
    hud();
  }
  function panel(titulo,detalle,principal,accion,secundarios,dibujo){
    const capa=raiz.querySelector("#fgPanel");capa.replaceChildren();capa.hidden=false;
    const tarjeta=document.createElement("div");tarjeta.className="fg-panel";
    if(dibujo){const im=document.createElement("img");im.className="fg-panel-dibujo";im.src=ARTE(dibujo);im.alt="";im.draggable=false;tarjeta.appendChild(im);}
    const h=document.createElement("h3");h.textContent=titulo;
    const p=document.createElement("p");p.textContent=detalle;
    const acciones=document.createElement("div");acciones.className="fg-panel-acciones";
    const b=document.createElement("button");b.type="button";b.className="fg-principal";b.textContent=principal;b.onclick=accion;acciones.appendChild(b);
    (Array.isArray(secundarios)?secundarios:[secundarios]).forEach(sec=>{if(!sec)return;const otro=document.createElement("button");otro.type="button";otro.textContent=sec.texto;otro.onclick=sec.accion;acciones.appendChild(otro);});
    tarjeta.append(h,p,acciones);capa.appendChild(tarjeta);
  }
  function prepararFichas(c){
    const palabras=frase.texto.split(" ");
    fichas=palabras.map((palabra,id)=>({id,palabra}));
    frase.trampas.slice(0,c.senuelos).forEach(palabra=>fichas.push({id:fichas.length,palabra}));
    ordenBanco=mezclar(fichas.map(f=>f.id));
    if(ordenBanco.every((id,i)=>id===i)&&ordenBanco.length>1)ordenBanco.push(ordenBanco.shift());
    espacios=Array(palabras.length).fill(null);
  }
  function comenzar(){
    if(window.Fichas&&!Fichas.usar("frases-en-giro",comenzar))return;
    duelo=false;token++;clearTimeout(giroTimer);
    frase=elegir(nivel);datos.recientes.push(frase.id);datos.recientes=datos.recientes.slice(-FRASES_GIRO_CONFIG.recientesMax);guardar();
    arrancarRonda();
  }
  function arrancarRonda(){
    const c=configNivel(nivel);
    prepararFichas(c);errores=0;girando=false;duracionMs=c.segundos*1000;tiempoMs=duracionMs;giroMs=c.giro*1000;
    ultimoTic=performance.now();proximoGiro=ultimoTic+giroMs;ocultoDesde=0;jugando=true;
    raiz.querySelector("#fgPista").innerHTML=ico("pista")+"Escena: ";raiz.querySelector("#fgPista").append(frase.pista);
    raiz.querySelector("#fgPanel").hidden=true;
    raiz.querySelector("#fgBanco").classList.remove("gira");
    raiz.closest(".ext-shell")?.scrollTo(0,0);
    avisar(c.senuelos?"Ojo: hay "+c.senuelos+" palabra"+(c.senuelos===1?" señuelo.":"s señuelo."):"Tocá las palabras en orden. Podés quitar cualquiera.");
    dibujar();
  }
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("Frases en Giro","frases",{onListo:(soyHost)=>{
      duelo=true;token++;clearTimeout(giroTimer);
      if(soyHost){frase=elegir(nivel);Duelo.enviarRonda({frase,nivel});arrancarRonda();}
      else Duelo.onRondaRecibida(datos=>{frase=datos.frase;nivel=datos.nivel;arrancarRonda();});
    }});
  }
  function terminar(gano,motivo){
    if(!jugando)return;
    jugando=false;girando=false;token++;clearTimeout(giroTimer);raiz.querySelector("#fgBanco").classList.remove("gira");
    const puntosPerdidos=gano?0:puntos;
    if(gano){
      racha++;puntos+=FRASES_GIRO_CONFIG.puntosBase+Math.ceil(tiempoMs/1000)*FRASES_GIRO_CONFIG.puntosPorSegundo+racha*FRASES_GIRO_CONFIG.puntosPorRacha;
      datos.ganadas++;datos.nivelMax=Math.max(datos.nivelMax,nivel+1);
      sonidoAcierto();
      if(typeof vibrar==="function")vibrar([30,40,55]);
    }else{racha=0;puntos=0;sonidoErrorExt();if(typeof vibrar==="function")vibrar(85);}
    datos.mejor=Math.max(datos.mejor,puntos);guardar();dibujar();
    if(duelo){
      Duelo.enviarFinal({valor:puntos});
      Duelo.mostrarResultado({valor:puntos},{etiqueta:gano?"puntos · ganó la frase":"puntos · no llegó a armarla",onVolver:()=>{duelo=false;abrir(raiz.parentElement);}});
      return;
    }
    if(gano){nivel++;panel("¡Frase armada!","“"+frase.texto+"” · "+puntos+" puntos · mejor: "+datos.mejor,"Siguiente nivel",comenzar,null,"armada");}
    else panel("Perdiste esta frase",(motivo==="intentos"?"Agotaste los 3 intentos.":"Se terminó el tiempo.")+" La frase era: “"+frase.texto+"”. Se cortó tu racha"+(puntosPerdidos?" y perdiste "+puntosPerdidos+" puntos de esta partida":"")+". Mejor marca: "+datos.mejor+".","Otra frase del nivel "+nivel,comenzar,null,"perdio");
  }
  function comprobar(){
    if(!jugando||girando||espacios.includes(null))return;
    const correctas=frase.texto.split(" ");
    const elegidas=espacios.map(id=>ficha(id).palabra);
    if(elegidas.every((palabra,i)=>palabra===correctas[i])){terminar(true);return;}
    const enSuLugar=elegidas.filter((palabra,i)=>palabra===correctas[i]).length;
    errores++;tiempoMs=Math.max(0,tiempoMs-FRASES_GIRO_CONFIG.penalidadErrorMs);
    sonidoErrorExt();if(typeof vibrar==="function")vibrar(50);
    if(errores>=FRASES_GIRO_CONFIG.intentos||tiempoMs<=0){terminar(false,errores>=FRASES_GIRO_CONFIG.intentos?"intentos":"tiempo");return;}
    espacios.fill(null);ordenBanco=mezclar(ordenBanco);
    avisar("❌ "+enSuLugar+" de "+correctas.length+" palabras estaban en su lugar. Perdiste un intento y 10 segundos. Rearmá la frase: te quedan "+(FRASES_GIRO_CONFIG.intentos-errores)+" intentos.",true);
    dibujar();
  }
  function girar(){
    if(!jugando||girando)return;
    girando=true;dibujar();
    const t=++token,zona=raiz.querySelector("#fgBanco");zona.classList.add("gira");
    giroTimer=setTimeout(()=>{
      if(t!==token||!jugando)return;
      const elegidas=new Set(espacios.filter(id=>id!==null));
      const activas=ordenBanco.filter(id=>!elegidas.has(id));
      const nuevas=mezclar(activas);
      if(nuevas.length>1&&nuevas.every((id,i)=>id===activas[i]))nuevas.push(nuevas.shift());
      ordenBanco=[...nuevas,...ordenBanco.filter(id=>elegidas.has(id))];
      dibujarBanco();
      giroTimer=setTimeout(()=>{
        if(t!==token||!jugando)return;
        zona.classList.remove("gira");girando=false;proximoGiro=performance.now()+giroMs;dibujar();
      },FRASES_GIRO_CONFIG.giroAnimacionMs/2);
    },FRASES_GIRO_CONFIG.giroAnimacionMs/2);
  }
  function tic(){
    const ahora=performance.now();
    if(!jugando){ultimoTic=ahora;return;}
    if(document.hidden){if(!ocultoDesde)ocultoDesde=ahora;ultimoTic=ahora;return;}
    tiempoMs-=Math.max(0,ahora-ultimoTic);ultimoTic=ahora;
    if(tiempoMs<=0){tiempoMs=0;terminar(false,"tiempo");return;}
    if(!girando&&ahora>=proximoGiro)girar();
    hud();
  }
  function visibilidad(){
    if(document.hidden){detenerMusicaJuego();if(jugando&&!ocultoDesde)ocultoDesde=performance.now();return;}
    iniciarMusicaJuego();
    if(ocultoDesde){proximoGiro+=performance.now()-ocultoDesde;ultimoTic=performance.now();ocultoDesde=0;}
  }
  function abrir(contenedor){
    salir();datos=cargar();nivel=datos.nivelMax;puntos=0;racha=0;
    raiz=document.createElement("div");raiz.className="fg-game";
    raiz.innerHTML='<button type="button" class="ext-volver" id="fgVolver">⟵ Extensiones</button><h2 class="fg-logo-h"><img class="fg-logo" src="'+ARTE("logo")+'" alt="Frases en Giro" draggable="false"></h2><p class="fg-sub">Ordená palabras, esquivá señuelos y ganale al reloj.</p><div class="fg-hud"><div><small>Nivel</small><b id="fgNivel">1</b></div><div><small>Puntos</small><b id="fgPuntos">0</b></div><div><small>'+ico("intentos")+'Intentos</small><b id="fgIntentos">3</b></div><div><small>'+ico("reloj")+'Tiempo</small><b id="fgTiempo">0</b></div></div><div class="fg-bar"><i id="fgTiempoBarra"></i></div><div class="fg-escena" id="fgPista"></div><p class="fg-racha" id="fgRacha"></p><div class="fg-espacios" id="fgEspacios" aria-label="Frase en construcción"></div><p class="fg-etiqueta">Palabras disponibles</p><div class="fg-banco-caja"><div class="fg-banco" id="fgBanco" aria-label="Palabras para elegir"></div><img class="fg-remolino" src="'+ARTE("giro")+'" alt="" draggable="false"></div><p class="fg-mensaje" id="fgMensaje" role="status" aria-live="polite"></p><div class="fg-acciones"><button type="button" id="fgComprobar">'+ico("comprobar")+'Comprobar frase</button><button type="button" id="fgVaciar">Vaciar</button></div><p class="fg-giro-texto" id="fgGiroTexto"></p><div class="fg-bar giro"><i id="fgGiroBarra"></i></div><div class="fg-panel-capa" id="fgPanel"></div>';
    contenedor.appendChild(raiz);
    raiz.querySelector("#fgVolver").onclick=()=>Extensiones.abrirLobby();
    raiz.querySelector("#fgComprobar").onclick=comprobar;
    raiz.querySelector("#fgVaciar").onclick=()=>{espacios.fill(null);avisar("Empezá de nuevo: tocá las palabras en orden.");dibujar();};
    intervalo=setInterval(tic,FRASES_GIRO_CONFIG.ticMs);document.addEventListener("visibilitychange",visibilidad);iniciarMusicaJuego();
    panel("Frases en Giro","Armá frases disparatadas tocando las palabras en orden. Cada giro mezcla las fichas libres; lo que ya colocaste queda seguro. Desde el nivel 2 aparecen palabras señuelo. Tenés 3 intentos: cada error te quita 10 segundos y te obliga a rearmar la frase. Si perdés, se corta la racha y los puntos de esta partida.","Jugar nivel "+nivel,comenzar,
      [nivel>1?{texto:"Empezar desde el nivel 1",accion:()=>{nivel=1;puntos=0;comenzar();}}:null,{texto:"Jugar con un amigo 👥",accion:iniciarDuelo}],"personaje");
  }
  function salir(){
    jugando=false;girando=false;token++;clearInterval(intervalo);clearTimeout(giroTimer);intervalo=null;giroTimer=null;
    document.removeEventListener("visibilitychange",visibilidad);
    detenerMusicaJuego();
    if(typeof Duelo!=="undefined")Duelo.salir();
    duelo=false;raiz=null;frase=null;fichas=[];ordenBanco=[];espacios=[];
  }
  return{abrir,salir,mejorPuntaje,configNivel,elegir};
})();
window.FrasesEnGiro=FrasesEnGiro;
