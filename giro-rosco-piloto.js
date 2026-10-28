/* Prueba de presentación de Giro para El Rosco — solo perfil Gonzalo.
   Overlay aislado: no altera el motor del Rosco ni las salas. Sin música. */
(function(){
  "use strict";
  const BASE="presentacion-y-locucion-extensiones/Giro/";
  const ESCENA=BASE+"estudios/Giro_estudio_rosco_16x9.png";
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
  // Bocass v2: solo labios y mentón, sin ojos ni nariz.
  const BOCAS=["Giro_boca_01_cerrada.png","Giro_boca_02_abierta.png",
    "Giro_boca_03_vocal_o.png","Giro_boca_04_dientes.png",
    "Giro_boca_05_o_pequena.png","Giro_boca_06_lengua.png",
    "Giro_boca_07_risa.png"].map(n=>BASE+"bocas-v2/"+n);
  let capa=null, intervalo=null, frase=null, activa=false, salirDeCapa=null, anteriorFoco=null;
  let bocaTimer=null, imagenLabios=null, actorHablando=null, labiosValidos=null, vozSecuencia=0;
  const comprobarLabios=()=>{
    if(labiosValidos)return labiosValidos;
    labiosValidos=Promise.all(BOCAS.map(ruta=>new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve();img.onerror=reject;img.src=ruta;
    }))).then(()=>true).catch(()=>false);
    return labiosValidos;
  };
  const fonemaAIndice=(texto,paso)=>{
    const t=String(texto||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
    if(!t.trim())return 0;
    const letra=t[paso%t.length];
    if(/[OU]/.test(letra))return 2;
    if(/[AE]/.test(letra))return 1;
    if(/[IMPB]/.test(letra))return 4;
    if(/[FV]/.test(letra))return 3;
    if(/[LRDNT]/.test(letra))return 5;
    return (paso%4===0)?6:1;
  };
  function detenerLabios(){
    clearInterval(bocaTimer);bocaTimer=null;
    if(actorHablando)actorHablando.classList.remove("grp-speaking");
    if(imagenLabios)imagenLabios.src=BOCAS[0];
  }
  function iniciarLabios(u,texto,token){
    if(!actorHablando||!imagenLabios)return;
    comprobarLabios().then(ok=>{
      if(!ok||token!==vozSecuencia||frase!==u||!activa||!actorHablando)return;
      actorHablando.classList.add("grp-speaking");
      let paso=0,fraccion=texto;
      const cambiar=()=>{
        if(!activa||frase!==u){detenerLabios();return;}
        imagenLabios.src=BOCAS[fonemaAIndice(fraccion,paso++)];
      };
      cambiar();
      clearInterval(bocaTimer);
      bocaTimer=setInterval(cambiar,145);
    });
  }
  const habilitado=()=>typeof esGonzalo==="function"&&esGonzalo()&&window.GIRO_ROSCO_PILOTO!==false;
  function cancelarVoz(){
    ++vozSecuencia;
    detenerLabios();
    if(frase&&"speechSynthesis" in window){
      try{window.speechSynthesis.cancel();}catch(e){}
    }
    frase=null;
  }
  function limpiar(){
    clearInterval(intervalo);intervalo=null;cancelarVoz();
    if(capa){capa.remove();capa=null;}
    imagenLabios=null;actorHablando=null;
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
      const token=vozSecuencia;
      u.onstart=()=>{if(frase===u)iniciarLabios(u,texto,token);};
      u.onboundary=e=>{
        if(frase!==u||!imagenLabios||!actorHablando?.classList.contains("grp-speaking"))return;
        const inicio=Number(e.charIndex)||0;
        const tramo=texto.slice(inicio,inicio+10);
        imagenLabios.src=BOCAS[fonemaAIndice(tramo,inicio)];
      };
      const fin=()=>{if(frase!==u)return;detenerLabios();frase=null;};
      u.onend=fin;u.onerror=fin;
      frase=u;window.speechSynthesis.speak(u);
    }catch(e){detenerLabios();frase=null;}
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
    host.classList.add("grp-visible");
    // Dos capas reutilizables: se mezclan con opacidad, sin saltos de src.
    const actor=document.createElement("div");actor.className="grp-actor";
    const hostSiguiente=document.createElement("img");
    hostSiguiente.className="grp-giro";hostSiguiente.alt="";
    hostSiguiente.setAttribute("aria-hidden","true");
    actor.append(host,hostSiguiente);
    // Pose frontal fija mientras la voz del navegador está activa.
    // La boca está calibrada sobre Giro_espera_neutral.png (1024×1536).
    const hablando=document.createElement("div");hablando.className="grp-hablando";
    const rostro=document.createElement("div");rostro.className="grp-hablando-rostro";
    const base=document.createElement("img");base.className="grp-hablando-base";
    base.src=IMAGENES.neutral;base.alt="";base.setAttribute("aria-hidden","true");
    const labios=document.createElement("img");labios.className="grp-labios";
    labios.alt="";labios.setAttribute("aria-hidden","true");
    rostro.append(base,labios);hablando.append(rostro);actor.appendChild(hablando);
    imagenLabios=labios;actorHablando=actor;
    const rotulo=document.createElement("div");rotulo.className="grp-rotulo";rotulo.textContent="GIRÁ Y ADIVINÁ · EL ROSCO";
    const efecto=document.createElement("img");efecto.className="grp-efecto";
    efecto.src=BASE+"efectos/"+(tipo==="final"?"Giro_efecto_confeti_transparente.png":"Giro_efecto_destellos_transparente.png");
    efecto.alt="";efecto.setAttribute("aria-hidden","true");
    // El estudio del Rosco ya tiene atril integrado: no superponer otro.
    stage.append(fondo,halo,actor,efecto,rotulo);
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
    // Movimiento suave: respiración CSS y fundido entre PNG aprobados.
    // Los recortes de parpadeo tienen un encuadre distinto al cuerpo entero:
    // no se mezclan aquí para evitar un salto visual.
    if(tipo==="inicio"&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
      const ciclos=["saludo","neutral","respira","neutral","escucha","neutral","presenta","neutral","señala","neutral"];
      let i=0,visible=host,oculto=hostSiguiente,gesto="saludo",cargando=false;
      const transicionar=nombre=>{
        if(cargando||nombre===gesto||!IMAGENES[nombre]||capa!==overlay||!activa)return;
        cargando=true;
        const destino=oculto;
        let atendido=false;
        const listo=()=>{
          if(atendido)return;atendido=true;
          if(capa!==overlay||!activa){cargando=false;return;}
          // Dos cuadros: asegura la transición también con archivos cacheados.
          requestAnimationFrame(()=>{
            if(capa!==overlay||!activa){cargando=false;return;}
            requestAnimationFrame(()=>{
              if(capa!==overlay||!activa){cargando=false;return;}
              destino.classList.add("grp-visible");
              visible.classList.remove("grp-visible");
              const anterior=visible;visible=destino;oculto=anterior;
              gesto=nombre;cargando=false;
            });
          });
        };
        const error=()=>{atendido=true;cargando=false;};
        destino.onload=listo;destino.onerror=error;
        destino.src=IMAGENES[nombre];
        if(typeof destino.decode==="function"){
          try{destino.decode().then(listo).catch(()=>{if(!atendido&&destino.complete&&destino.naturalWidth>0)listo();else error();});}
          catch(e){if(destino.complete&&destino.naturalWidth>0)listo();else error();}
        }else if(destino.complete&&destino.naturalWidth>0)listo();
      };
      intervalo=setInterval(()=>{
        if(capa!==overlay||document.hidden||cargando)return;
        i=(i+1)%ciclos.length;transicionar(ciclos[i]);
      },2600);
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