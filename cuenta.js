/* Cuenta opcional: vincula la partida local a una identidad de Google.
   La tabla gya_cuentas tiene RLS por auth.uid(); nunca se une por nombre. */
const Cuenta=(()=>{
  const TABLA="gya_cuentas",ID="gya_cuenta_usuario",REV="gya_cuenta_revision",FIRMA="gya_cuenta_firma";
  const EXCLUIR=new Set(["gya_origen_app","gya_bienvenida_vista","gya_social_ocultos"]);
  let usuario=null,revision=0,firma="",ocupado=false,panelAbierto=false,pospuesto=false,habilitado=false,btnAjustes=null,inicioPendiente=null,temporizadorActivo=false;
  let pendienteConflicto=null,errorSync=null,reintentarEn=0,fallosSeguidos=0,ultimoIntento=0;
  const cliente=()=>typeof obtenerSupa==="function"?obtenerSupa():null;
  const puedeGuardar=k=>!EXCLUIR.has(k)&&!k.startsWith("gya_cuenta_")&&!k.startsWith("gya_tele_")&&!k.startsWith("gya_admin_")&&!k.startsWith("gya_backup_");
  function partidaLocal(){
    const original=capturarEstadoJuego().localStorage,datos={};
    Object.keys(original).sort().forEach(k=>{if(puedeGuardar(k))datos[k]=original[k];});
    return{version:1,localStorage:datos};
  }
  function huella(p){
    // jsonb puede devolver las claves en otro orden al del localStorage.
    // Ordenarlas mantiene la firma anterior y evita falsos conflictos.
    const datos=p?.localStorage||{};
    const ordenado=Object.fromEntries(Object.keys(datos).sort().map(k=>[k,datos[k]]));
    const t=JSON.stringify(ordenado);let a=2166136261,b=0x9e3779b9;
    for(let i=0;i<t.length;i++){const c=t.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b+c,2246822519);}
    return t.length.toString(36)+":"+(a>>>0).toString(36)+":"+(b>>>0).toString(36);
  }
  const tienePerfil=p=>!!(p?.localStorage?.gya_nombre&&p?.localStorage?.gya_avatar&&["uruguay","argentina"].includes(p.localStorage.gya_pais));
  const nombre=p=>p?.localStorage?.gya_nombre||"Sin perfil";
  function marcar(p,r,publicar=true){const primera=localStorage.getItem(ID)!==usuario.id;revision=r;firma=huella(p);localStorage.setItem(ID,usuario.id);localStorage.setItem(REV,String(r));localStorage.setItem(FIRMA,firma);pendienteConflicto=null;errorSync=null;pospuesto=false;fallosSeguidos=0;reintentarEn=0;pintar();if(primera&&publicar){if(typeof empujarUsuario==="function")empujarUsuario();if(typeof empujarRanking==="function")empujarRanking();}}
  function pintar(){
    if(btnAjustes){
      const etiqueta=btnAjustes.querySelector(".btn-txt");
      if(etiqueta)etiqueta.textContent=usuario?"Partida vinculada":"Guardar mi progreso";
    }
  }
  function interfaz(){
    btnAjustes=document.getElementById("bCuenta");
    if(btnAjustes)btnAjustes.onclick=abrirDesdeAjustes;
    const capa=document.createElement("div");capa.id="cuentaCapa";capa.className="cuenta-capa";capa.hidden=true;
    capa.innerHTML='<div class="cuenta-caja" role="dialog" aria-modal="true" aria-labelledby="cuentaTitulo"><button type="button" class="cuenta-x" id="cuentaCerrar" aria-label="Cerrar">✕</button><h2 id="cuentaTitulo">Guardá tu partida</h2><p id="cuentaTexto"></p><div id="cuentaOpciones"></div></div>';
    document.body.append(capa);capa.querySelector("#cuentaCerrar").onclick=cerrar;capa.onclick=e=>{if(e.target===capa)cerrar();};pintar();
  }
  function cerrar(){document.getElementById("cuentaCapa").hidden=true;panelAbierto=false;}
  function mostrar(titulo,texto,acciones){
    const capa=document.getElementById("cuentaCapa");if(!capa)return;
    capa.querySelector("#cuentaTitulo").textContent=titulo;capa.querySelector("#cuentaTexto").textContent=texto;
    const cont=capa.querySelector("#cuentaOpciones");cont.replaceChildren();
    acciones.forEach(a=>{const b=document.createElement("button");b.type="button";b.className=a.principal?"cuenta-principal":"cuenta-secundario";b.textContent=a.texto;b.onclick=a.accion;cont.append(b);});
    capa.hidden=false;panelAbierto=true;
  }
  function abrir(){
    if(usuario&&pendienteConflicto){conflicto(pendienteConflicto.local,pendienteConflicto.nube,true);return;}
    if(usuario){
      mostrar("Partida vinculada",errorSync
        ?"Tu avance sigue en este dispositivo. La sincronización con Google está pendiente; podés seguir jugando normalmente."
        :`Tu progreso se guarda con ${usuario.email||"tu cuenta de Google"}. En otro dispositivo elegí esta misma cuenta.`,[
        {texto:"Seguir jugando",principal:true,accion:cerrar},
        ...(errorSync?[{texto:"Revisar sincronización",accion:()=>{cerrar();pospuesto=false;reintentarEn=0;revisar();}}]:[]),
        {texto:"Cerrar sesión en este dispositivo",accion:salir}
      ]);return;}
    mostrar("Guardar mi progreso","Continuá tu partida en la app y en girayadivina.com con la misma cuenta de Google. Es opcional: podés seguir jugando sin vincularla.",[
      {texto:"Continuar con Google",principal:true,accion:entrar},
      {texto:"Ahora no",accion:cerrar}
    ]);
  }
  async function abrirDesdeAjustes(){
    document.getElementById("capaMas")?.classList.remove("ver");
    if(!habilitado)await iniciar();
    if(!habilitado){
      mostrar("Inicio de sesión no disponible","No se pudo comprobar la conexión con Google. Tu partida sigue guardada en este dispositivo.",[
        {texto:"Reintentar",principal:true,accion:()=>{cerrar();abrirDesdeAjustes();}},
        {texto:"Cerrar",accion:cerrar}
      ]);
      return;
    }
    if(!panelAbierto)abrir();
  }
  async function entrar(){
    const supa=cliente();if(!supa)return;
    try{
      const r=await supa.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});
      if(r.error)throw r.error;
    }catch(e){mostrar("No se pudo conectar",String(e.message||"Probá de nuevo con internet."),[{texto:"Cerrar",principal:true,accion:cerrar}]);}
  }
  async function salir(){
    try{await cliente().auth.signOut();usuario=null;revision=0;firma="";localStorage.removeItem(ID);localStorage.removeItem(REV);localStorage.removeItem(FIRMA);cerrar();pintar();}
    catch(e){mostrar("No se pudo cerrar sesión","Probá de nuevo con internet.",[{texto:"Cerrar",principal:true,accion:cerrar}]);}
  }
  async function leer(){
    const r=await cliente().from(TABLA).select("estado_juego,revision,actualizado_en").eq("usuario_id",usuario.id).maybeSingle();
    if(r.error)throw r.error;return r.data||null;
  }
  async function subir(p,esperada){
    let r;
    if(esperada){r=await cliente().from(TABLA).update({estado_juego:p,revision:esperada+1,actualizado_en:new Date().toISOString()}).eq("usuario_id",usuario.id).eq("revision",esperada).select("revision").maybeSingle();}
    else r=await cliente().from(TABLA).insert({usuario_id:usuario.id,estado_juego:p,revision:1}).select("revision").single();
    // Dos dispositivos pueden ver la tabla vacía a la vez e intentar crear
    // la misma fila. Si otro ganó la carrera, NO sobrescribir su partida:
    // volver a leer y reconciliar como dos partidas existentes.
    if(r.error){
      if(!esperada&&String(r.error.code)==="23505")return false;
      throw r.error;
    }
    if(!r.data)return false;
    marcar(p,Number(r.data.revision));return true;
  }
  function respaldo(etiqueta,p){localStorage.setItem("gya_cuenta_respaldo_"+etiqueta,JSON.stringify(p));}
  function bajar(p,r){
    if(!p||!p.localStorage||!tienePerfil(p))throw Error("La partida guardada está incompleta.");
    const antes=partidaLocal();respaldo("local",antes);
    try{
      Object.keys(antes.localStorage).forEach(k=>{if(!(k in p.localStorage))localStorage.removeItem(k);});
      Object.entries(p.localStorage).forEach(([k,v])=>{if(puedeGuardar(k)&&typeof v==="string")localStorage.setItem(k,v);});
      marcar(p,r,false);
      location.reload();
    }catch(e){Object.entries(antes.localStorage).forEach(([k,v])=>localStorage.setItem(k,v));throw e;}
  }
  function conflicto(local,nube,desdeAjustes=false){
    // No interrumpir ninguna partida: ofrecer una elección únicamente
    // cuando el usuario entra por el engranaje.
    pendienteConflicto={local,nube};ocupado=false;pospuesto=true;
    if(!desdeAjustes)return;
    mostrar("Elegí tu partida",`En este dispositivo: ${nombre(partidaLocal())}. En tu cuenta: ${nombre(nube.estado_juego)}. Ambas partidas están conservadas; elegí cuál querés seguir usando.`,[
      {texto:"Continuar la partida de mi cuenta",principal:true,accion:async()=>{
        try{
          const actual=await leer();
          if(!actual)throw Error("No se encontró la partida de tu cuenta.");
          bajar(actual.estado_juego,actual.revision);
        }catch(e){fallo(e);cerrar();}
      }},
      {texto:"Guardar la partida de este dispositivo",accion:async()=>{
        try{
          ocupado=true;
          // Tomar el progreso ACTUAL al confirmar, no una copia vieja.
          const localActual=partidaLocal(),remotaActual=await leer();
          if(remotaActual)respaldo("nube",remotaActual.estado_juego);
          const ok=await subir(localActual,remotaActual?.revision||0);
          if(!ok){ocupado=false;pendienteConflicto=null;pospuesto=false;await revisar();}
          ocupado=false;cerrar();
        }catch(e){fallo(e);cerrar();}
      }},
      {texto:"Decidir después",accion:cerrar}
    ]);
  }
  function fallo(e){
    // Un problema de red o una carrera entre dispositivos NUNCA debe
    // mostrar un popup sobre los juegos. La copia local queda intacta.
    ocupado=false;errorSync=String(e?.message||"Sincronización pendiente").slice(0,200);
    fallosSeguidos=Math.min(5,fallosSeguidos+1);
    reintentarEn=Date.now()+Math.min(300000,15000*2**(fallosSeguidos-1));
    try{console.warn("[GyaCuenta] Sincronización diferida:",errorSync);}catch(_){}
  }
  async function revisar(){
    if(!usuario||ocupado||pendienteConflicto)return;
    ocupado=true;ultimoIntento=Date.now();
    try{
      // Reconciliación optimista. Si otro dispositivo creó o actualizó
      // la fila entre SELECT e INSERT/UPDATE, leer la nueva revisión una vez.
      // Nunca usar upsert: pisaría silenciosamente la partida remota.
      for(let intento=0;intento<3;intento++){
        const nube=await leer(),local=partidaLocal(),fLocal=huella(local);
        if(!nube){
          if(tienePerfil(local)){
            const creada=await subir(local,0);
            if(!creada){
              if(intento<2)continue;
              throw Error("La cuenta ya tiene una partida en la nube, pero no se pudo leer. Comprobá tu sesión y probá otra vez.");
            }
          }
          ocupado=false;return;
        }
        const fNube=huella(nube.estado_juego),vinculada=localStorage.getItem(ID)===usuario.id,base=vinculada?localStorage.getItem(FIRMA)||"":"";
        if(fLocal===fNube){marcar(local,nube.revision);ocupado=false;return;}
        if(!tienePerfil(local)){bajar(nube.estado_juego,nube.revision);return;}
        if(vinculada&&fLocal===base){conflicto(local,nube);return;}
        if(vinculada&&fNube===base){
          const guardada=await subir(local,nube.revision);
          if(!guardada){
            if(intento<2)continue;
            // Una nueva revisión ganó esta carrera. Reintentar después,
            // sin popup ni sobrescritura de ninguna de las dos copias.
            fallo(Error("La revisión remota cambió durante el guardado."));return;
          }
          ocupado=false;return;
        }
        ocupado=false;conflicto(local,nube);return;
      }
    }catch(e){fallo(e);}
  }
  async function tic(){
    if(!usuario||ocupado||panelAbierto||pospuesto||pendienteConflicto||!navigator.onLine||Date.now()<reintentarEn||Date.now()-ultimoIntento<8000)return;
    const actual=partidaLocal();if(!tienePerfil(actual)||huella(actual)===firma)return;
    await revisar();
  }
  async function disponible(){
    const supa=cliente();if(!supa)return false;
    try{
      const [config,tabla]=await Promise.all([
        fetch(SUPA_URL+"/auth/v1/settings",{headers:{apikey:SUPA_KEY}}).then(r=>r.ok?r.json():null),
        supa.from(TABLA).select("usuario_id").limit(1)
      ]);
      return config?.external?.google===true&&!tabla.error;
    }catch(e){return false;}
  }
  function iniciar(){
    if(inicioPendiente)return inicioPendiente;
    inicioPendiente=(async()=>{
      if(!document.getElementById("cuentaCapa"))interfaz();
      habilitado=await disponible();pintar();if(!habilitado)return;
      try{const r=await cliente().auth.getUser();usuario=r.data?.user||null;if(usuario){pintar();await revisar();}}
      catch(e){fallo(e);}
      if(!temporizadorActivo){
        temporizadorActivo=true;
        setInterval(tic,2500);
        window.addEventListener("online",tic);
        document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")tic();});
      }
    })().finally(()=>{inicioPendiente=null;});
    return inicioPendiente;
  }
  window.addEventListener("load",iniciar);
  return{partidaLocal,huella,iniciar,disponible,revisar};
})();
window.GyaCuenta=Cuenta;
