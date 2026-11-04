/* Piloto de duelo contra bots, visible solo para el perfil Gonzalo.
   Reutiliza las poses de atril y el atril oficial; no modifica el progreso. */
window.AhoraCaigo=(()=>{
  "use strict";
  const BASE="presentacion-y-locucion-extensiones/Giro/";
  const AVATARES=[...Array.from({length:22},(_,i)=>i+1),33,...Array.from({length:13},(_,i)=>42+i)]
    .map(n=>"avatar-"+String(n).padStart(2,"0"));
  const POSICIONES=[[9,88,15],[16,75,14],[24,63,13],[32,54,12],[40,47,11],
    [60,47,11],[68,54,12],[76,63,13],[84,75,14],[91,88,15]];
  let raiz=null,timer=null,reloj=null;
  const pendientes=new Set();
  const normalizar=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  function despues(fn,ms){const t=setTimeout(()=>{pendientes.delete(t);fn();},ms);pendientes.add(t);return t;}
  function salir(){
    clearTimeout(timer);timer=null;clearInterval(reloj);reloj=null;
    pendientes.forEach(clearTimeout);pendientes.clear();
    raiz?.closest(".ext-shell")?.classList.remove("ac-abierta");
    raiz=null;
  }
  function figura(avatar,nombre,numero,pos){
    const caja=document.createElement("div");caja.className="ac-participante"+(numero===0?" ac-principal":"");
    caja.style.cssText="--x:"+pos[0]+"%;--y:"+pos[1]+"%;--ancho:"+pos[2]+"%;z-index:"+Math.round(pos[1]);
    caja.setAttribute("aria-label",numero===0?nombre+", participante principal":"Participante "+numero);
    const piso=document.createElement("span");piso.className="ac-plataforma";
    const persona=document.createElement("img");persona.className="ac-avatar";persona.alt="";persona.draggable=false;
    const deEspaldas=numero===0&&avatar==="avatar-22";
    if(deEspaldas)caja.classList.add("ac-de-espaldas");
    persona.src=deEspaldas?"assets/ahora-caigo/avatar-22-espalda.webp":"assets/atril/"+avatar+".webp";
    persona.onerror=()=>{persona.onerror=null;caja.classList.remove("ac-de-espaldas");persona.src="assets/atril/"+avatar+".webp";};
    const atril=document.createElement("img");atril.className="ac-atril";atril.alt="";atril.draggable=false;
    atril.src=BASE+"elementos/Giro_atril_oficial_chico.webp";
    const etiqueta=document.createElement("span");etiqueta.className="ac-nombre";
    etiqueta.textContent=numero===0?nombre:String(numero);
    caja.append(piso,persona,atril,etiqueta);return caja;
  }
  function abrir(contenedor){
    const anterior=raiz;salir();anterior?.remove();
    if(typeof esGonzalo!=="function"||!esGonzalo())return;
    raiz=document.createElement("section");raiz.className="ac-juego";
    raiz.innerHTML=`<header class="ac-cabecera"><span>PRUEBA · CONTRA BOTS</span><h2>Ahora Caigo</h2><p>Una pregunta para vos. Otra para tu rival.</p></header>
      <div class="ac-escenario" role="group" aria-label="Escenario con once participantes"><div class="ac-ronda" aria-hidden="true"></div></div>
      <section class="ac-duelo" aria-label="Duelo de preguntas" hidden>
        <div class="ac-marcador"><div><small>VOS</small><strong class="ac-tu-nombre"></strong></div><span>VS</span><div><small>RIVAL · BOT</small><strong class="ac-rival-nombre"></strong></div></div>
        <div class="ac-pregunta-top"><span class="ac-turno-texto"></span><div class="ac-reloj" role="timer" aria-label="Segundos restantes"><b>30</b><small>SEG</small></div></div>
        <span class="ac-categoria"></span><h3 class="ac-pregunta"></h3>
        <div class="ac-letras" aria-label="Respuesta con letras de ayuda"></div><small class="ac-cantidad"></small>
        <form class="ac-responder"><label for="acRespuesta">Tu respuesta</label><div><input id="acRespuesta" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="80" placeholder="Escribí tu respuesta…"><button type="submit">Responder ↵</button></div></form>
        <div class="ac-bot" hidden><span aria-hidden="true">● ● ●</span> El rival está pensando…</div>
        <p class="ac-mensaje" role="status" aria-live="polite"></p>
      </section>
      <div class="ac-controles"><p class="ac-estado" role="status" aria-live="polite">Sorteá con quién te vas a enfrentar.</p><button class="ac-sortear" type="button">Sortear rival</button><small class="ac-ayuda">30 segundos por pregunta · Podés seguir intentando hasta acertar · Quien se queda sin tiempo, cae.</small></div>`;
    contenedor.appendChild(raiz);raiz.closest(".ext-shell")?.classList.add("ac-abierta");
    const actual=raiz;
    let avatar="avatar-01",nombre="Gonzalo";
    try{avatar=localStorage.getItem("gya_avatar")||avatar;nombre=perfil.nombre||nombre;}catch(e){}
    if(!AVATARES.includes(avatar))avatar="avatar-01";
    const buscar=s=>actual.querySelector(s),escenario=buscar(".ac-escenario");
    const rivales=AVATARES.filter(a=>a!==avatar).slice(0,10).map((a,i)=>figura(a,"",i+1,POSICIONES[i]));
    const principal=figura(avatar,nombre,0,[50,94,21]);escenario.append(...rivales,principal);
    const boton=buscar(".ac-sortear"),estado=buscar(".ac-estado"),panel=buscar(".ac-duelo"),form=buscar(".ac-responder");
    const input=buscar("#acRespuesta"),mensaje=buscar(".ac-mensaje"),relojVista=buscar(".ac-reloj"),letras=buscar(".ac-letras");
    const vivos=new Set(rivales.map((_,i)=>i)),usadas=new Set();
    let fase="listo",rival=-1,turno="yo",pregunta=null,limite=0;
    buscar(".ac-tu-nombre").textContent=nombre;
    const activo=()=>raiz===actual&&actual.isConnected;
    function pararReloj(){clearInterval(reloj);reloj=null;}
    function pintarRespuesta(completa){
      letras.replaceChildren();
      letras.style.setProperty("--larga",Math.max(...pregunta.respuesta.split(" ").map(p=>p.length)));
      const caracteres=[...pregunta.respuesta],indices=caracteres.map((c,i)=>c===" "?-1:i).filter(i=>i>=0);
      // Pocas letras desde el arranque; posiciones distintas, incluso la primera oculta.
      const ayuda=new Set();const cantidad=Math.max(1,Math.floor(indices.length*.3));
      const disponibles=indices.slice();
      while(ayuda.size<cantidad){const n=Math.floor(Math.random()*disponibles.length);ayuda.add(disponibles.splice(n,1)[0]);}
      let i=0;
      pregunta.respuesta.split(" ").forEach(palabra=>{
        const grupo=document.createElement("span");grupo.className="ac-palabra";
        [...palabra].forEach(c=>{
          const casilla=document.createElement("span"),visible=completa||ayuda.has(i);
          casilla.className="ac-letra"+(visible?" ac-visible":"");casilla.textContent=visible?c:"_";
          grupo.appendChild(casilla);i++;
        });i++;letras.appendChild(grupo);
      });
      const n=indices.length;buscar(".ac-cantidad").textContent=n+" letras"+(pregunta.respuesta.includes(" ")?" · "+pregunta.respuesta.split(" ").length+" palabras":"");
    }
    function sacarPregunta(){
      const banco=window.AHORA_CAIGO_DATOS||[];
      const libres=banco.filter(q=>!usadas.has(q.id));
      if(!libres.length)return null;
      const nuevas=window.Vistas?Vistas.filtrar("ahora_caigo",libres,q=>q.id):libres;
      const q=nuevas[Math.floor(Math.random()*nuevas.length)];
      usadas.add(q.id);if(window.Vistas)Vistas.marcar("ahora_caigo",q.id);return q;
    }
    function finalizar(pierde){
      if(!activo()||fase!=="pregunta")return;
      fase="resultado";pararReloj();form.hidden=true;buscar(".ac-bot").hidden=true;
      pintarRespuesta(true);mensaje.className="ac-mensaje ac-mal";
      mensaje.textContent="Se terminó el tiempo. La respuesta era "+pregunta.respuesta+".";
      try{window.sonidoErrorExt?.();}catch(e){}
      const caido=pierde==="yo"?principal:rivales[rival];
      caido.classList.remove("ac-turno","ac-iluminado","ac-elegido");caido.classList.add("ac-caido");
      caido.querySelector(".ac-nombre").textContent="Cayó";
      caido.setAttribute("aria-label",pierde==="yo"?nombre+" cayó":"Participante "+(rival+1)+" cayó");
      if(pierde==="yo"){
        fase="fin";estado.textContent="¡Caíste! Llegaste a eliminar "+(10-vivos.size)+" de 10 rivales.";
        boton.hidden=false;boton.disabled=false;boton.textContent="Volver a jugar";
      }else{
        vivos.delete(rival);
        estado.textContent=vivos.size?"¡Ganaste el duelo! Quedan "+vivos.size+" rivales.":"¡Ganaste! Eliminaste a los diez rivales.";
        fase=vivos.size?"listo":"fin";
        boton.hidden=false;boton.disabled=false;boton.textContent=vivos.size?"Sortear próximo rival":"Volver a jugar";
      }
    }
    function acertar(){
      if(!activo()||fase!=="pregunta")return;
      fase="resolviendo";pararReloj();form.hidden=true;buscar(".ac-bot").hidden=true;
      pintarRespuesta(true);mensaje.className="ac-mensaje ac-bien";
      mensaje.textContent=turno==="yo"?"¡Correcto! Ahora le toca al rival.":"El rival acertó. ¡Te toca!";
      despues(()=>{if(activo()){turno=turno==="yo"?"bot":"yo";siguiente();}},1500);
    }
    function actualizarReloj(){
      if(!activo()||fase!=="pregunta")return;
      const ms=Math.max(0,limite-Date.now()),segundos=Math.ceil(ms/1000);
      relojVista.querySelector("b").textContent=segundos;
      relojVista.style.setProperty("--reloj",(ms/30000*360)+"deg");
      relojVista.classList.toggle("ac-urgente",segundos<=5);
      if(ms<=0)finalizar(turno);
    }
    function siguiente(){
      if(!activo())return;
      pararReloj();pregunta=sacarPregunta();
      if(!pregunta){
        fase="fin";form.hidden=true;buscar(".ac-bot").hidden=true;
        mensaje.className="ac-mensaje";mensaje.textContent="¡Completaste todas las preguntas de esta prueba!";
        estado.textContent="El banco de prueba terminó sin repetir preguntas.";
        boton.hidden=false;boton.disabled=false;boton.textContent="Volver a jugar";return;
      }
      fase="pregunta";panel.hidden=false;actual.classList.add("ac-en-duelo");
      buscar(".ac-rival-nombre").textContent="Participante "+(rival+1);
      buscar(".ac-turno-texto").textContent=turno==="yo"?"TU TURNO":"TURNO DEL RIVAL";
      panel.classList.toggle("ac-turno-bot",turno==="bot");
      buscar(".ac-categoria").textContent=pregunta.categoria;
      buscar(".ac-pregunta").textContent=pregunta.pregunta;
      mensaje.className="ac-mensaje";mensaje.textContent=turno==="yo"?"Descubrí la respuesta antes de que se abra la trampilla.":"Mirá cómo responde tu rival.";
      input.value="";form.hidden=turno!=="yo";buscar(".ac-bot").hidden=turno!=="bot";
      input.disabled=turno!=="yo";pintarRespuesta(false);
      rivales.forEach(r=>r.classList.remove("ac-turno"));principal.classList.remove("ac-turno");
      (turno==="yo"?principal:rivales[rival]).classList.add("ac-turno");
      estado.textContent="Duelo contra el participante "+(rival+1)+" · "+(10-vivos.size)+"/10 rivales eliminados";
      limite=Date.now()+30000;actualizarReloj();reloj=setInterval(actualizarReloj,100);
      if(turno==="bot"){
        const qActual=pregunta;
        const sabe=Math.random()<.72,demora=3500+Math.floor(Math.random()*4500);
        if(sabe)despues(()=>{
          if(activo()&&fase==="pregunta"&&turno==="bot"&&pregunta===qActual){
            if(Date.now()>=limite){finalizar("bot");return;}
            acertar();
          }
        },demora);
      }
    }
    form.onsubmit=e=>{
      e.preventDefault();if(!activo()||fase!=="pregunta"||turno!=="yo")return;
      if(Date.now()>=limite){finalizar("yo");return;}
      const respuesta=normalizar(input.value);if(!respuesta)return;
      if([pregunta.respuesta,...(pregunta.alternativas||[])].some(r=>respuesta===normalizar(r))){acertar();return;}
      mensaje.className="ac-mensaje ac-mal";mensaje.textContent="Todavía no. ¡Probá otra vez, queda tiempo!";
      input.select();
    };
    boton.onclick=()=>{
      if(fase==="fin"){abrir(contenedor);return;}
      if(fase!=="listo")return;
      fase="sorteo";panel.hidden=true;actual.classList.remove("ac-en-duelo");
      const opciones=[...vivos],destino=opciones[Math.floor(Math.random()*opciones.length)];
      const pasos=opciones.length*3+opciones.indexOf(destino);let paso=0;
      boton.disabled=true;estado.textContent="Buscando rival…";
      rivales.forEach(r=>r.classList.remove("ac-elegido","ac-iluminado","ac-turno"));principal.classList.remove("ac-turno");
      const avanzar=()=>{
        if(!activo()){timer=null;return;}
        rivales.forEach(r=>r.classList.remove("ac-iluminado"));
        rivales[opciones[paso%opciones.length]].classList.add("ac-iluminado");
        if(paso===pasos){
          timer=null;rival=destino;rivales[rival].classList.add("ac-elegido");
          estado.textContent="¡Tu rival es el participante "+(destino+1)+"!";
          boton.hidden=true;turno="yo";
          despues(siguiente,1000);return;
        }
        paso++;timer=setTimeout(avanzar,45+Math.pow(paso/pasos,4)*210);
      };avanzar();
    };
  }
  return{abrir,salir};
})();
