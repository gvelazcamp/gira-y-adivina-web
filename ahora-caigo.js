/* Primera etapa: escenario y sorteo, visible solo para el perfil Gonzalo.
   Reutiliza las poses de atril y el atril oficial; no modifica el progreso. */
window.AhoraCaigo=(()=>{
  "use strict";
  const BASE="presentacion-y-locucion-extensiones/Giro/";
  const AVATARES=[...Array.from({length:22},(_,i)=>i+1),33,...Array.from({length:13},(_,i)=>42+i)]
    .map(n=>"avatar-"+String(n).padStart(2,"0"));
  const POSICIONES=[[9,88,15],[16,75,14],[24,63,13],[32,54,12],[40,47,11],
    [60,47,11],[68,54,12],[76,63,13],[84,75,14],[91,88,15]];
  let raiz=null,timer=null;
  function salir(){
    clearTimeout(timer);timer=null;
    raiz?.closest(".ext-shell")?.classList.remove("ac-abierta");
    raiz=null;
  }
  function figura(avatar,nombre,numero,pos){
    const caja=document.createElement("div");caja.className="ac-participante"+(numero===0?" ac-principal":"");
    caja.style.cssText="--x:"+pos[0]+"%;--y:"+pos[1]+"%;--ancho:"+pos[2]+"%;z-index:"+Math.round(pos[1]);
    caja.setAttribute("aria-label",numero===0?nombre+", participante principal":"Participante "+numero);
    const piso=document.createElement("span");piso.className="ac-plataforma";
    const persona=document.createElement("img");persona.className="ac-avatar";persona.alt="";persona.draggable=false;
    persona.src="assets/atril/"+avatar+".webp";
    persona.onerror=()=>{persona.onerror=null;persona.src="assets/atril/avatar-01.webp";};
    const atril=document.createElement("img");atril.className="ac-atril";atril.alt="";atril.draggable=false;
    atril.src=BASE+"elementos/Giro_atril_oficial_chico.webp";
    const etiqueta=document.createElement("span");etiqueta.className="ac-nombre";
    etiqueta.textContent=numero===0?nombre:String(numero);
    caja.append(piso,persona,atril,etiqueta);return caja;
  }
  function abrir(contenedor){
    salir();
    if(typeof esGonzalo!=="function"||!esGonzalo())return;
    raiz=document.createElement("section");raiz.className="ac-juego";
    raiz.innerHTML='<header class="ac-cabecera"><span>PRUEBA · ESCENARIO</span><h2>Ahora Caigo</h2><p>Vos en el centro. Diez rivales alrededor.</p></header><div class="ac-escenario" role="group" aria-label="Escenario con once participantes"><div class="ac-ronda" aria-hidden="true"></div></div><div class="ac-controles"><p class="ac-estado" role="status" aria-live="polite">Sorteá con quién te vas a enfrentar.</p><button class="ac-sortear" type="button">Sortear rival</button><small>Primero armamos el escenario y el sorteo. Las preguntas y las caídas vienen después.</small></div>';
    contenedor.appendChild(raiz);raiz.closest(".ext-shell")?.classList.add("ac-abierta");
    let avatar="avatar-01",nombre="Gonzalo";
    try{avatar=localStorage.getItem("gya_avatar")||avatar;nombre=perfil.nombre||nombre;}catch(e){}
    if(!AVATARES.includes(avatar))avatar="avatar-01";
    const escenario=raiz.querySelector(".ac-escenario");
    const rivales=AVATARES.filter(a=>a!==avatar).slice(0,10).map((a,i)=>figura(a,"",i+1,POSICIONES[i]));
    escenario.append(...rivales,figura(avatar,nombre,0,[50,94,21]));
    const boton=raiz.querySelector(".ac-sortear"),estado=raiz.querySelector(".ac-estado");
    boton.onclick=()=>{
      if(timer!==null)return;
      const actual=raiz,destino=Math.floor(Math.random()*rivales.length);
      /* Todos tienen la misma probabilidad; la animación solo recorre los atriles. */
      const pasos=30+destino;let paso=0;
      boton.disabled=true;estado.textContent="Buscando rival…";
      rivales.forEach(r=>r.classList.remove("ac-elegido","ac-iluminado"));
      const avanzar=()=>{
        if(raiz!==actual||!actual.isConnected){timer=null;return;}
        rivales.forEach(r=>r.classList.remove("ac-iluminado"));
        rivales[paso%10].classList.add("ac-iluminado");
        if(paso===pasos){
          timer=null;rivales[destino].classList.add("ac-elegido");
          estado.textContent="¡Tu rival es el participante "+(destino+1)+"!";
          boton.disabled=false;boton.textContent="Volver a sortear";return;
        }
        paso++;timer=setTimeout(avanzar,45+Math.pow(paso/pasos,4)*210);
      };
      avanzar();
    };
  }
  return{abrir,salir};
})();
