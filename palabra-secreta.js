const PalabraSecreta=(()=>{
  const CLAVE="gya_palabra_secreta",MAX=6,COLORES={ausente:"⬛",presente:"🟨",exacta:"🟩"};
  let datos=cargar(),raiz=null,partida=null,borrador="",animando=false,token=0,duelo=false;
  let audioMusica=null;
  const horizontal=()=>matchMedia("(orientation: landscape) and (min-width:600px) and (max-width:1024px) and (max-height:600px)").matches
    &&(matchMedia("(pointer: coarse)").matches||navigator.maxTouchPoints>0);
  let avisoVisto=false,micActivo=false,micPidiendo=false,micEscuchando=false,micRecon=null,micStream=null,micTimer=null,micToken=0;

  /* Dibujos en assets/palabra-secreta/ (hoja de ChatGPT recortada). */
  const ARTE=n=>"assets/palabra-secreta/"+n+".webp",ico=n=>'<img class="ps-ico" src="'+ARTE(n)+'" alt="" draggable="false">';
  function iniciarMusicaJuego(){
    try{
      if(typeof sonidoPermitido==="function"&&!sonidoPermitido())return;
      if(!audioMusica){audioMusica=new Audio("assets/audio/palabra-secreta-musica.mp3");audioMusica.loop=true;audioMusica.volume=.28;}
      if(audioMusica.paused)audioMusica.play().catch(()=>{});
    }catch(e){}
  }
  function detenerMusicaJuego(){try{if(audioMusica&&!audioMusica.paused)audioMusica.pause();}catch(e){}}
  function alVisibilidad(){if(document.hidden)detenerMusicaJuego();else if(micActivo){if(!micRecon)escucharMicrofono();}else iniciarMusicaJuego();}
  function cargar(){try{const d=JSON.parse(localStorage.getItem(CLAVE)||"null");if(d&&typeof d==="object")return{diaria:d.diaria||null,nivel:Number.isInteger(d.nivel)&&d.nivel>0?d.nivel:1,partidaNivel:d.partidaNivel||null,racha:Number(d.racha)||0,mejorRacha:Number(d.mejorRacha)||0,ganadas:Number(d.ganadas)||0,jugadas:Number(d.jugadas)||0,distribucion:Array.isArray(d.distribucion)?d.distribucion.slice(0,6):[0,0,0,0,0,0],ultimoGanado:Number(d.ultimoGanado)||0,ayudaVista:!!d.ayudaVista};}catch(e){}return{diaria:null,nivel:1,partidaNivel:null,racha:0,mejorRacha:0,ganadas:0,jugadas:0,distribucion:[0,0,0,0,0,0],ultimoGanado:0,ayudaVista:false};}
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}}
  function indiceDia(fecha=new Date()){const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Montevideo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(fecha).map(x=>[x.type,x.value]));return Math.floor(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day))/86400000);}
  function palabraDia(dia=indiceDia()){return PALABRA_SECRETAS[dia%PALABRA_SECRETAS.length];}
  function rachaActual(){return datos.ultimoGanado>=indiceDia()-1?datos.racha:0;}
  function evaluar(intento,solucion){const r=Array(5).fill("ausente"),sobrantes={};for(let i=0;i<5;i++){if(intento[i]===solucion[i])r[i]="exacta";else sobrantes[solucion[i]]=(sobrantes[solucion[i]]||0)+1;}for(let i=0;i<5;i++)if(r[i]!=="exacta"&&sobrantes[intento[i]]>0){r[i]="presente";sobrantes[intento[i]]--;}return r;}
  function intentosPermitidos(nivel){return Math.max(3,7-Math.min(nivel,4));}
  function repeticionesDelNivel(nivel){return nivel>0&&nivel%3===0?(nivel%6===3?3:4):0;}
  function nueva(objetivo,nivel=0){const repeticiones=repeticionesDelNivel(nivel);return{objetivo,nivel,max:repeticiones?MAX:nivel?intentosPermitidos(nivel):MAX,repeticiones,dia:indiceDia(),intentos:[],terminada:false,gano:false};}
  function elegirPalabra(){const anterior=datos.partidaNivel?.objetivo||datos.diaria?.objetivo;const banco=PALABRA_SECRETAS.filter(w=>w!==anterior);const libres=Vistas.filtrar("palabra",banco,w=>w);const palabra=libres[Math.floor(Math.random()*libres.length)];Vistas.marcar("palabra",palabra);return palabra;}
  function iniciarNivel(){if(!datos.partidaNivel||datos.partidaNivel.terminada||!PALABRA_SECRETAS.includes(datos.partidaNivel.objetivo)){if(datos.diaria?.objetivo)Vistas.marcar("palabra",datos.diaria.objetivo);datos.partidaNivel=nueva(elegirPalabra(),datos.nivel);guardar();}else if(datos.partidaNivel.repeticiones===undefined){/* Una ronda empezada antes de esta regla conserva sus intentos. */datos.partidaNivel.repeticiones=datos.partidaNivel.intentos.length<=1?repeticionesDelNivel(datos.partidaNivel.nivel):0;if(datos.partidaNivel.repeticiones)datos.partidaNivel.max=MAX;guardar();}partida=datos.partidaNivel;borrador="";}
  function siguienteNivel(){iniciarNivel();tablero();mensaje("");}
  function pantalla(){
    raiz.innerHTML='<div class="ps-game"><button type="button" class="ext-volver" id="psVolver">⟵ Extensiones</button><div class="ps-top"><div><h2 class="ps-logo-h"><img class="ps-logo" src="'+ARTE("logo")+'" alt="Palabra Secreta" draggable="false"></h2><p class="ps-aviso">💡 Tocá "?" para ver cómo se juega</p></div><button type="button" id="psEstadisticas" class="ps-btn-img" aria-label="Estadísticas">'+ico("stats")+'</button><button type="button" id="psAyuda" aria-label="Cómo se juega">?</button></div><div class="ps-reto" id="psReto"></div><div class="ps-stats" id="psStats"></div><div class="ps-play"><div class="ps-tablero" id="psTablero"></div><div class="ps-entrada"><div class="ps-mensaje" id="psMensaje" aria-live="polite"></div><button type="button" class="ps-mic-btn" id="psMic" aria-pressed="false">🎙️ Activar micrófono</button><div class="ps-teclado" id="psTeclado"></div><div class="ps-acciones"><button type="button" id="psEnviar">Enviar</button><button type="button" id="psBorrar">Borrar</button></div><button type="button" class="ps-duelo" id="psDuelo">👥 Jugar con un amigo</button></div></div><div class="ps-final" id="psFinal" hidden></div><div class="sf-panel-capa" id="psAyudaPanel" hidden></div><div class="ps-mic-aviso" id="psMicAviso" role="dialog" aria-modal="true" aria-labelledby="psMicTitulo" hidden><div class="ps-mic-aviso-caja"><h3 id="psMicTitulo">🎙️ Micrófono para jugar</h3><p>En horizontal podés decir una palabra de cinco letras. Si está en el diccionario, se envía sola.</p><p>El micrófono seguirá activo durante la partida. Podés apagarlo o prenderlo con el botón del juego.</p><div class="ps-mic-aviso-botones"><button type="button" id="psVozNo">No, usar teclado</button><button type="button" id="psVozSi">Sí, usar micrófono</button></div><small id="psVozPermiso" role="status"></small></div></div></div>';
    raiz.querySelector("#psVolver").onclick=()=>Extensiones.abrirLobby();
    raiz.querySelector("#psAyuda").onclick=ayuda;
    raiz.querySelector("#psEstadisticas").onclick=mostrarEstadisticas;
    raiz.querySelector("#psEnviar").onclick=enviar;
    raiz.querySelector("#psBorrar").onclick=()=>tecla("Backspace");
    raiz.querySelector("#psDuelo").onclick=iniciarDuelo;
    raiz.querySelector("#psMic").onclick=()=>micActivo?pararMicrofono():activarMicrofono();
    raiz.querySelector("#psVozNo").onclick=()=>raiz.querySelector("#psMicAviso").hidden=true;
    raiz.querySelector("#psVozSi").onclick=async()=>{
      const si=raiz.querySelector("#psVozSi"),no=raiz.querySelector("#psVozNo");
      si.disabled=true;no.disabled=true;raiz.querySelector("#psVozPermiso").textContent="Solicitando permiso para el micrófono…";
      const ok=await activarMicrofono();
      if(!raiz)return;
      raiz.querySelector("#psMicAviso").hidden=true;
      si.disabled=false;no.disabled=false;
      if(!ok)mensaje("No se pudo activar el micrófono. Usá el teclado o tocá Activar micrófono para reintentar.");
    };
    colocarMarcadores();
  }
  function colocarMarcadores(){
    if(!raiz)return;
    const game=raiz.querySelector(".ps-game"),play=raiz.querySelector(".ps-play"),entrada=raiz.querySelector(".ps-entrada");
    const reto=raiz.querySelector("#psReto"),stats=raiz.querySelector("#psStats"),mensaje=raiz.querySelector("#psMensaje");
    if(!game||!play||!entrada||!reto||!stats||!mensaje)return;
    if(horizontal()){entrada.insertBefore(reto,mensaje);entrada.insertBefore(stats,mensaje);}
    else{game.insertBefore(reto,play);game.insertBefore(stats,play);}
  }
  function revisarHorizontal(){
    if(!raiz)return;
    colocarMarcadores();
    if(!horizontal()){if(micActivo||micPidiendo)pararMicrofono();return;}
    if(avisoVisto||!raiz.querySelector("#psAyudaPanel")?.hidden||partida?.terminada)return;
    avisoVisto=true;raiz.querySelector("#psMicAviso").hidden=false;
  }
  function pintarMicrofono(){
    const b=raiz?.querySelector("#psMic");if(!b)return;
    b.classList.toggle("ps-mic-activo",micActivo);b.disabled=micPidiendo;
    b.setAttribute("aria-pressed",String(micActivo));
    b.textContent=micPidiendo?"🎙️ Permiso…":!micActivo?"🎙️ Activar micrófono":micEscuchando?"🎙️ Escuchando…":"🎙️ Conectando…";
  }
  function pararMicrofono(){
    micActivo=false;micPidiendo=false;micEscuchando=false;micToken++;
    clearTimeout(micTimer);micTimer=null;
    const r=micRecon;micRecon=null;
    if(r){r.onend=null;r.onerror=null;r.onresult=null;try{r.abort();}catch(e){}}
    if(micStream){for(const t of micStream.getTracks())t.stop();micStream=null;}
    pintarMicrofono();
    if(raiz&&!partida?.terminada)iniciarMusicaJuego();
  }
  function escucharMicrofono(){
    if(!micActivo||!raiz||partida?.terminada||document.hidden||!horizontal())return;
    const Recon=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recon){pararMicrofono();mensaje("Este navegador no admite respuestas por voz.");return;}
    let r;try{r=new Recon();}catch(e){pararMicrofono();mensaje("No pude abrir el reconocimiento de voz.");return;}
    const sesion=micToken,inicio=performance.now();micRecon=r;
    r.lang="es-UY";r.continuous=true;r.interimResults=false;r.maxAlternatives=4;
    r.onstart=()=>{if(micRecon!==r)return;micEscuchando=true;pintarMicrofono();mensaje("Escuchando. Decí una palabra de cinco letras.");};
    r.onresult=e=>{
      if(micRecon!==r||!micActivo||partida?.terminada||animando)return;
      for(let i=e.resultIndex||0;i<e.results.length;i++){
        const resultado=e.results[i];if(!resultado?.isFinal)continue;
        const palabras=Array.from(resultado).map(x=>String(x.transcript||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z]/g,"")).filter(Boolean);
        const palabra=palabras.find(v=>v.length===5&&(PALABRA_VALIDAS.has(v)||PALABRA_SECRETAS.includes(v)))||palabras[0];
        if(!palabra)continue;
        if(palabra.length!==5){mensaje("Escuché «"+palabra+"». Decí una palabra de cinco letras.");continue;}
        if(!PALABRA_VALIDAS.has(palabra)&&!PALABRA_SECRETAS.includes(palabra)){mensaje("«"+palabra+"» no está en el diccionario. Probá otra palabra.");continue;}
        borrador=palabra;tablero();enviar();
        if(partida?.terminada)pararMicrofono();
        break;
      }
    };
    r.onerror=e=>{if(micRecon!==r)return;
      if(["not-allowed","service-not-allowed","audio-capture","network"].includes(e.error)){
        pararMicrofono();mensaje("No pude usar el micrófono ("+e.error+"). Revisá el permiso o la conexión.");
      }else if(e.error==="no-speech")mensaje("No te escuché. Repetí la palabra.");
    };
    r.onend=()=>{if(micRecon!==r)return;micRecon=null;micEscuchando=false;pintarMicrofono();
      if(micActivo&&sesion===micToken&&!partida?.terminada){
        clearTimeout(micTimer);micTimer=setTimeout(escucharMicrofono,performance.now()-inicio<1200?900:350);
      }
    };
    try{r.start();}catch(e){micRecon=null;pararMicrofono();mensaje("No pude iniciar el micrófono. Tocá Activar micrófono para reintentar.");}
  }
  async function activarMicrofono(){
    if(micActivo||micPidiendo)return micActivo;
    if(!(window.SpeechRecognition||window.webkitSpeechRecognition)){mensaje("Este navegador no admite respuestas por voz. Usá el teclado.");return false;}
    micPidiendo=true;pintarMicrofono();const sesion=++micToken;
    try{
      let stream=null;
      if(navigator.mediaDevices?.getUserMedia){
        try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});}
        catch(e){if(["NotAllowedError","PermissionDeniedError"].includes(e?.name))throw e;}
      }
      if(sesion!==micToken||!raiz||partida?.terminada||!horizontal()){if(stream)for(const t of stream.getTracks())t.stop();return false;}
      micStream=stream;micPidiendo=false;micActivo=true;detenerMusicaJuego();pintarMicrofono();escucharMicrofono();return true;
    }catch(e){if(sesion!==micToken)return false;micPidiendo=false;pintarMicrofono();mensaje("Permití el micrófono en Chrome o en la app para jugar hablando.");return false;}
  }
  function ayuda(){const p=raiz.querySelector("#psAyudaPanel");p.innerHTML='<div class="sf-panel"><img class="ps-panel-dibujo" src="'+ARTE("personaje")+'" alt="" draggable="false"><h3>¿Cómo se juega?</h3><p>Descubrí una palabra de 5 letras. Empezás en el nivel 1 con 6 intentos; al acertar subís de nivel y tenés menos intentos, hasta llegar a 3. En algunos niveles tenés un reto: escribí la primera palabra que pensás <b>3 o 4 veces</b>. Cada vez ocupa una fila; después usás las oportunidades que quedan para adivinar. Si no la sacás, probás otra palabra en el mismo nivel. Verde: letra en el lugar correcto. Amarillo: letra en otro lugar. Gris: letra que no está.</p><p><b>Ojo:</b> la palabra puede tener una letra repetida (por ejemplo, dos E). Si la escribís dos veces, cada aparición se marca por separado según corresponda.</p><div class="ps-ejemplo"><span class="exacta">A</span><span class="presente">S</span><span class="ausente">A</span><span class="ausente">D</span><span class="ausente">O</span></div><div class="sf-acciones"><button type="button" class="sf-principal">Entendido</button></div></div>';p.hidden=false;p.querySelector("button").onclick=()=>{p.hidden=true;datos.ayudaVista=true;guardar();revisarHorizontal();};}
  function mostrarEstadisticas(){const p=raiz.querySelector("#psAyudaPanel");p.innerHTML='<div class="sf-panel"><img class="ps-panel-dibujo ps-chico" src="'+ARTE("stats")+'" alt="" draggable="false"><h3>Estadísticas</h3><p id="psResumen"></p><div id="psDistribucion" class="ps-distribucion"></div><div class="sf-acciones"><button type="button" class="sf-principal">Cerrar</button></div></div>';p.querySelector("#psResumen").textContent=`Jugadas: ${datos.jugadas} · Ganadas: ${datos.ganadas} · Racha: ${rachaActual()} · Mejor: ${datos.mejorRacha}`;const d=p.querySelector("#psDistribucion");for(let i=0;i<6;i++){const fila=document.createElement("div");fila.textContent=`${i+1} intento${i?"s":""}: ${datos.distribucion[i]||0}`;d.appendChild(fila);}p.hidden=false;p.querySelector("button").onclick=()=>p.hidden=true;}
  function mensaje(txt){if(raiz)raiz.querySelector("#psMensaje").textContent=txt;}
  function estadisticas(){const s=raiz.querySelector("#psStats");s.innerHTML=`${ico("racha")}Racha: ${rachaActual()} · Mejor: ${datos.mejorRacha} · Ganadas: ${datos.ganadas}`;const r=raiz.querySelector("#psReto"),n=partida.intentos.length,reps=partida.repeticiones||0;r.textContent=duelo?"👥 Duelo · 6 intentos":reps?`Nivel ${partida.nivel} · Reto: ${n<reps?`${n?`Repetí ${partida.intentos[0].palabra}`:"Escribí la primera palabra que pensás"} ${reps-n} ${reps-n===1?"vez":"veces"} · después quedan ${partida.max-reps} intentos`:`Ahora adiviná · te quedan ${partida.max-n} intentos`}`:`Nivel ${partida.nivel} · ${partida.max} intentos`;raiz.querySelector("#psTablero").setAttribute("aria-label",`Tablero de ${partida.max} intentos`);}
  function teclado(){const t=raiz.querySelector("#psTeclado");t.replaceChildren();const estado={};for(const x of partida.intentos)for(let i=0;i<5;i++){const k=x.palabra[i],e=x.colores[i];if(!estado[k]||({ausente:0,presente:1,exacta:2})[e]>({ausente:0,presente:1,exacta:2})[estado[k]])estado[k]=e;}for(const fila of ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"]){const d=document.createElement("div");d.className="ps-teclado-fila";for(const l of fila){const b=document.createElement("button");b.type="button";b.textContent=l;b.className=estado[l]||"";b.setAttribute("aria-label","Letra "+l);b.onclick=()=>tecla(l);d.appendChild(b);}t.appendChild(d);}}
  function tablero(){const t=raiz.querySelector("#psTablero");t.replaceChildren();for(let fila=0;fila<partida.max;fila++){const d=document.createElement("div");d.className="ps-fila";const jugada=partida.intentos[fila],texto=jugada?.palabra||(fila===partida.intentos.length&&!partida.terminada?borrador:"");for(let i=0;i<5;i++){const celda=document.createElement("span");celda.className="ps-celda"+(jugada?" "+jugada.colores[i]:"");celda.textContent=texto[i]||"";d.appendChild(celda);}t.appendChild(d);}teclado();estadisticas();final();}
  function final(){const f=raiz.querySelector("#psFinal");f.replaceChildren();f.hidden=!partida.terminada;if(!partida.terminada)return;/* popup en el medio, adelante del tablero */const c=document.createElement("div");c.className="ps-final-caja";f.appendChild(c);/* al cerrarlo queda "Ver resultado" para volver a abrirlo (compartir, jugar otra) */const ocultar=()=>{f.hidden=true;const m=raiz.querySelector("#psMensaje");m.innerHTML='<button type="button" class="ps-reabrir">🏁 Ver resultado</button>';m.querySelector("button").onclick=()=>{f.hidden=false;m.textContent="";};};f.onclick=e=>{if(e.target===f&&!duelo)ocultar();};const dib=document.createElement("img");dib.className="ps-final-dibujo";dib.src=ARTE(partida.gano?"gano":"perdio");dib.alt="";dib.draggable=false;c.appendChild(dib);const p=document.createElement("p");p.textContent=partida.gano?`¡La encontraste en ${partida.intentos.length} intento${partida.intentos.length===1?"":"s"}!${duelo?"":` Pasaste al nivel ${datos.nivel}.`}`:`La palabra era ${partida.objetivo}. Seguís en el nivel ${partida.nivel}.`;c.appendChild(p);if(duelo)return;const cerrar=document.createElement("button");cerrar.type="button";cerrar.className="ps-final-x";cerrar.setAttribute("aria-label","Ver el tablero");cerrar.textContent="✕";cerrar.onclick=ocultar;c.appendChild(cerrar);const compartir=document.createElement("button");compartir.type="button";compartir.textContent="📲 Compartir por WhatsApp";compartir.onclick=compartirWhatsApp;c.appendChild(compartir);const copiar=document.createElement("button");copiar.type="button";copiar.textContent="Copiar resultado";copiar.onclick=compartirResultado;c.appendChild(copiar);const jugar=document.createElement("button");jugar.type="button";jugar.innerHTML=ico("extra")+(partida.gano?`Jugar nivel ${datos.nivel}`:`Otra palabra del nivel ${datos.nivel}`);jugar.onclick=siguienteNivel;c.appendChild(jugar);}
  function tecla(valor){if(!raiz||partida.terminada||animando)return;if(valor==="Backspace"){borrador=borrador.slice(0,-1);tablero();return;}if(valor==="Enter"){enviar();return;}const l=valor.toUpperCase();if(/^[A-Z]$/.test(l)&&borrador.length<5){borrador+=l;tablero();if(typeof tac==="function")tac();}}
  function enviar(){if(!raiz||partida.terminada||animando)return;if(borrador.length!==5){mensaje("Escribí cinco letras.");return;}if(!PALABRA_VALIDAS.has(borrador)&&!PALABRA_SECRETAS.includes(borrador)){mensaje("Esa palabra no está en el diccionario.");return;}if(!duelo&&partida.repeticiones&&partida.intentos.length>0&&partida.intentos.length<partida.repeticiones&&borrador!==partida.intentos[0].palabra){mensaje(`Tenés que repetir ${partida.intentos[0].palabra} ${partida.repeticiones-partida.intentos.length} ${partida.repeticiones-partida.intentos.length===1?"vez":"veces"} más.`);return;}/* Cada palabra gasta 1 ficha al primer intento; los duelos no gastan. */if(!duelo&&!partida.cobrada){if(window.Fichas&&!Fichas.usar("palabra-secreta",enviar))return;partida.cobrada=true;guardar();}const colores=evaluar(borrador,partida.objetivo);const jugada={palabra:borrador,colores};partida.intentos.push(jugada);borrador="";partida.gano=jugada.palabra===partida.objetivo;partida.terminada=partida.gano||partida.intentos.length>=partida.max;if(partida.terminada&&!duelo){datos.jugadas++;if(partida.gano){datos.ganadas++;datos.distribucion[partida.intentos.length-1]=(datos.distribucion[partida.intentos.length-1]||0)+1;const hoy=indiceDia();datos.racha=datos.ultimoGanado===hoy?datos.racha:datos.ultimoGanado===hoy-1?datos.racha+1:1;datos.mejorRacha=Math.max(datos.mejorRacha,datos.racha);datos.ultimoGanado=hoy;datos.nivel=partida.nivel+1;if(typeof objSumar==="function")objSumar("palabraDiaria",1);if(typeof logroDesbloquear==="function"){logroDesbloquear("palabraPrimera");if(partida.intentos.length<=2)logroDesbloquear("palabraRapida");if(datos.racha>=7)logroDesbloquear("palabraRacha");}}else datos.racha=0;}if(!duelo)guardar();if(typeof bip==="function")bip(partida.gano?900:500,.09);mensaje("");tablero();if(partida.terminada&&micActivo)pararMicrofono();if(duelo)progresoDuelo();const ultima=raiz.querySelectorAll(".ps-fila")[partida.intentos.length-1];if(!matchMedia("(prefers-reduced-motion: reduce)").matches){animando=true;ultima.querySelectorAll(".ps-celda").forEach((c,i)=>{c.style.animationDelay=i*.12+"s";c.classList.add("voltear");});const t=++token;setTimeout(()=>{if(t===token)animando=false;},850);}try{if(typeof vibrar==="function")vibrar(20);}catch(e){}}
  function textoCompartir(){/* Sin revelar la palabra: WhatsApp muestra la tarjeta del juego. */return`🟩 Palabra Secreta ${duelo?"duelo":"nivel "+partida.nivel}: ${partida.gano?"la saqué en "+partida.intentos.length+"/"+partida.max+" ✅":"no la saqué ❌"}`;}
  async function compartirResultado(){const txt=textoCompartir()+"\n¿Me ganás? 👉 "+linkJuego();try{await navigator.clipboard.writeText(txt);mensaje("Resultado copiado. ¡Compartilo!");}catch(e){const a=document.createElement("textarea");a.value=txt;document.body.appendChild(a);a.select();const ok=document.execCommand("copy");a.remove();mensaje(ok?"Resultado copiado. ¡Compartilo!":"No se pudo copiar el resultado.");}}
  /* Link corto (ps.html): WhatsApp muestra una tarjeta chica de Palabra Secreta y abre el juego directo. */
  function linkJuego(){try{return location.origin+location.pathname.replace(/[^/]*$/,"")+"ps.html?v=2";}catch(e){return"https://girayadivina.com/ps.html?v=2";}}
  function compartirWhatsApp(){try{window.open("https://wa.me/?text="+encodeURIComponent(textoCompartir()+"\n¿Me ganás? 👉 "+linkJuego()),"_blank");}catch(e){}}
  /* Duelo 1 vs 1: los dos adivinan la MISMA palabra (no la del día).
     Puntos = 7 − intentos si la encontrás (0 si no): gana quien la saca en menos intentos. */
  const ptsDuelo=()=>partida.gano?7-partida.intentos.length:0;
  function progresoDuelo(){
    Duelo.enviarProgreso({n:partida.intentos.length,gano:partida.gano});
    if(partida.terminada){
      Duelo.enviarFinal({valor:ptsDuelo()});
      setTimeout(()=>Duelo.mostrarResultado({valor:ptsDuelo()},{etiqueta:"puntos: 7 − intentos (0 si no la encontrás)",onVolver:()=>{duelo=false;if(raiz){iniciarNivel();tablero();mensaje("");}}}),900);
    }
  }
  function iniciarDuelo(){
    if(typeof Duelo==="undefined")return;
    Duelo.mostrarLobby("Palabra Secreta","palabra",{detalle:"Los dos adivinan la <b>misma palabra</b>, cada uno en su tablero. Gana el que la descubre en <b>menos intentos</b>.",onListo:soyHost=>{
      const arrancar=w=>{duelo=true;partida=nueva(w);borrador="";Duelo.mostrarBadge();Duelo.actualizarBadge("0/6");if(raiz){raiz.querySelector("#psAyudaPanel").hidden=true;tablero();mensaje("👥 Duelo: misma palabra para los dos.");}};
      Duelo.onProgresoRival(p=>Duelo.actualizarBadge((p.gano?"✓ ":"")+(Number(p.n)||0)+"/6"));
      if(soyHost){const w=elegirPalabra();Duelo.enviarRonda({palabra:w});arrancar(w);}
      else Duelo.onRondaRecibida(d=>{if(typeof d.palabra==="string"&&d.palabra.length===5)arrancar(d.palabra.toUpperCase());});
    }});
  }
  function abrir(contenedor){salir();raiz=contenedor;avisoVisto=false;iniciarNivel();pantalla();tablero();document.addEventListener("visibilitychange",alVisibilidad);window.addEventListener("resize",revisarHorizontal);iniciarMusicaJuego();ayuda();}
  function salir(){pararMicrofono();token++;animando=false;if(duelo&&typeof Duelo!=="undefined")Duelo.salir();duelo=false;document.removeEventListener("visibilitychange",alVisibilidad);window.removeEventListener("resize",revisarHorizontal);detenerMusicaJuego();raiz=null;partida=null;borrador="";}
  return{abrir,salir,tecla,indiceDia,palabraDia,evaluar,rachaActual,nivelActual:()=>datos.nivel,estadisticasGuardadas:()=>({...datos}),textoCompartir};
})();
window.PalabraSecreta=PalabraSecreta;
