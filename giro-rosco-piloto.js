/* Prueba de presentación de Giro para El Rosco — solo perfil Gonzalo.
   Overlay aislado: no altera el motor del Rosco ni las salas. Sin música. */
(function(){
  "use strict";
  const BASE="presentacion-y-locucion-extensiones/Giro/";
  const ESCENA=BASE+"estudios/Giro_estudio_rosco_16x9.png";
  const ATRIL=BASE+"elementos/Giro_atril_oficial.png";
  const IMAGENES={
    neutral:BASE+"opcionales/espera/Giro_espera_neutral.png",
    respira:BASE+"opcionales/espera/Giro_espera_respirando.png",
    escucha:BASE+"opcionales/espera/Giro_espera_escuchando.png",
    saludo:BASE+"opcionales/transiciones/Giro_transicion_saludando.png",
    señala:BASE+"opcionales/transiciones/Giro_transicion_senalando.png",
    presenta:BASE+"opcionales/gestos/Giro_gesto_presenta_extension.png",
    festeja:BASE+"Giro_festejando.png",
    revancha:BASE+"Giro_confundido.png"
  };
  let capa=null, intervalo=null, frase=null, activa=false, salirDeCapa=null, anteriorFoco=null;
  const habilitado=()=>typeof esGonzalo==="function"&&esGonzalo()&&window.GIRO_ROSCO_PILOTO!==false;
  function cancelarVoz(){
    if(frase&&"speechSynthesis" in window){
      try{window.speechSynthesis.cancel();}catch(e){}
    }
    frase=null;
  }
  function limpiar(){
    clearInterval(intervalo);intervalo=null;cancelarVoz();
    if(capa){capa.remove();capa=null;}
    document.removeEventListener("keydown",teclado);
    activa=false;
    const destino=anteriorFoco;anteriorFoco=null;
    if(destino&&destino.isConnected&&typeof destino.focus==="function")destino.focus({preventScroll:true});
  }
  function teclado(e){
    if(!activa)return;
    if(e.key==="Escape"){e.preventDefault();cerrar();}
    if(e.key==="Tab"&&capa){
      const botones=[...capa.querySelectorAll("button:not([disabled])")];
      if(!botones.length)return;
      const primero=botones[0],ultimo=botones[botones.length-1];
      if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}
      else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}
    }
  }
  function cerrar(){
    const siguiente=salirDeCapa;salirDeCapa=null;
    limpiar();
    if(typeof siguiente==="function")siguiente();
  }
  function hablar(texto){
    if(!activa||!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance!=="function")return;
    cancelarVoz();
    try{
      const u=new SpeechSynthesisUtterance(texto);
      u.lang="es-UY";u.rate=.92;u.pitch=1.04;u.volume=1;
      const voces=window.speechSynthesis.getVoices();
      u.voice=voces.find(v=>v.lang.toLowerCase()==="es-uy")||
        voces.find(v=>v.lang.toLowerCase().startsWith("es-"))||null;
      u.onend=()=>{if(frase===u)frase=null;};
      u.onerror=()=>{if(frase===u)frase=null;};
      frase=u;window.speechSynthesis.speak(u);
    }catch(e){frase=null;}
  }
  function presentar({tipo,titulo,descripcion,locucion,imagen,continuar}){
    if(!habilitado())return false;
    limpiar();activa=true;anteriorFoco=document.activeElement;
    salirDeCapa=continuar||null;
    const overlay=document.createElement("div");overlay.className="grp-overlay";overlay.dataset.tipo=tipo;
    overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",titulo);
    // Construir con DOM, sin HTML dinámico ni texto de usuarios.
    const cont=document.createElement("section");cont.className="grp-contenido";
    const stage=document.createElement("div");stage.className="grp-escenario";
    const fondo=document.createElement("img");fondo.className="grp-fondo";fondo.src=ESCENA;fondo.alt="";
    const halo=document.createElement("div");halo.className="grp-halo";halo.setAttribute("aria-hidden","true");
    const host=document.createElement("img");host.className="grp-giro";host.src=IMAGENES[imagen]||IMAGENES.neutral;
    host.alt="Giro, conductor de Girá y Adiviná";
    const atril=document.createElement("img");atril.className="grp-atril";atril.src=ATRIL;atril.alt="";
    const rotulo=document.createElement("div");rotulo.className="grp-rotulo";rotulo.textContent="GIRÁ Y ADIVINÁ · EL ROSCO";
    const efecto=document.createElement("img");efecto.className="grp-efecto";
    efecto.src=BASE+"efectos/"+(tipo==="final"?"Giro_efecto_confeti_transparente.png":"Giro_efecto_destellos_transparente.png");
    efecto.alt="";efecto.setAttribute("aria-hidden","true");
    stage.append(fondo,halo,host,atril,efecto,rotulo);
    const panel=document.createElement("div");panel.className="grp-panel";
    const etiqueta=document.createElement("p");etiqueta.className="grp-etiqueta";etiqueta.textContent="PRESENTACIÓN DE PRUEBA · GONZALO";
    const h=document.createElement("h2");h.textContent=titulo;
    const p=document.createElement("p");p.className="grp-descripcion";p.textContent=descripcion;
    const acciones=document.createElement("div");acciones.className="grp-acciones";
    const voz=document.createElement("button");voz.type="button";voz.className="grp-boton grp-voz";voz.textContent="🔊 Escuchar a Giro";
    voz.addEventListener("click",()=>hablar(locucion));
    const avanzar=document.createElement("button");avanzar.type="button";avanzar.className="grp-boton grp-accion";
    avanzar.textContent=tipo==="final"?"Ver resultados":"Ir al Rosco";
    avanzar.addEventListener("click",cerrar);
    acciones.append(voz,avanzar);
    const aviso=document.createElement("small");aviso.className="grp-aviso";aviso.textContent="Sin música · Voz opcional · Solo perfil Gonzalo";
    panel.append(etiqueta,h,p,acciones,aviso);
    cont.append(stage,panel);overlay.appendChild(cont);document.body.appendChild(overlay);
    capa=overlay;document.addEventListener("keydown",teclado);
    avanzar.focus({preventScroll:true});
    // Espera: cambios de imagen sutiles sin modificar el Rosco ni tapar sus controles.
    if(tipo==="inicio"&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
      const ciclos=["saludo","neutral","respira","escucha","neutral","presenta","señala","neutral"];
      let i=0;
      intervalo=setInterval(()=>{
        if(!capa||document.hidden)return;
        i=(i+1)%ciclos.length;host.src=IMAGENES[ciclos[i]];
      },2400);
    }
    return true;
  }
  function mostrarInicio(){
    return presentar({
      tipo:"inicio",
      titulo:"¡Bienvenidos al Rosco!",
      descripcion:"Giro presenta el desafío. Una letra, muchas categorías. Respondé las pistas, usá Pasapalabra cuando lo necesites y completá la vuelta.",
      locucion:"¡Bienvenidos a Girá y Adiviná Rioplatense! Soy Giro. Hoy jugamos al Rosco. Una letra, muchas categorías. ¿Estás preparado? ¡Arrancamos!",
      imagen:"saludo"
    });
  }
  function mostrarFinal(resultado){
    const ok=Number(resultado&&resultado.aciertos)||0;
    const total=Number(resultado&&resultado.total)||0;
    const puntos=Number(resultado&&resultado.puntos)||0;
    const perfecto=total>0&&ok===total;
    const titulo=perfecto?"¡Rosco perfecto!":ok?"¡Terminaste el Rosco!":"¡Vamos por la revancha!";
    return presentar({
      tipo:"final",titulo,
      descripcion:ok+" de "+total+" aciertos · "+puntos+" puntos. El detalle y las opciones para continuar están en el resultado original del Rosco.",
      locucion:perfecto?"¡Espectacular! ¡Completaste el Rosco sin errores!":ok?"¡Muy buena partida! Lograste "+ok+" aciertos. ¡Vamos por más!":"¡No pasa nada! Una nueva vuelta nos espera. ¡Vamos por la revancha!",
      imagen:perfecto?"festeja":ok?"presenta":"revancha"
    });
  }
  window.GiroRoscoPiloto={mostrarInicio,mostrarFinal,cerrar,habilitado};
})();