/* Palabra Secreta: sala guardada, como en el Puzzle. MultiBroker acelera los
   mensajes; la lectura del servidor conserva un camino entre los dos jugadores
   aunque no compartan un servidor de conexión en vivo. Cada lado escribe su
   propia fila, sin sobrescribir el estado ni las acciones del otro. */
window.SalaPalabra=(()=>{
  const GRUPO="palabra_sala",VIGENCIA=24*60*60*1000,ACTIVO=45000,LATIDO=8000;
  /* La sala es fija: el código sirve siempre. Hay anfitrión activo si su fila se guardó hace menos de ACTIVO (late cada LATIDO). null = no se pudo leer. */
  async function hostActivo(codigo){
    try{const sb=typeof obtenerSupa==="function"?obtenerSupa():null;if(!sb)return null;
      const r=await sb.from("gya_ranking").select("estado_juego").eq("grupo",GRUPO).eq("apodo",codigo+"-host").limit(1);
      if(r.error)return null;const d=r.data?.[0]?.estado_juego;return !!(d&&d.v===1&&!d.cerrada&&Number.isFinite(d.actualizado)&&Date.now()-d.actualizado<ACTIVO);}catch(e){return null;}
  }
  function conectar(codigo,host,alListo,alFallar,asignar){
    const lado=host?"host":"guest",otro=host?"guest":"host";
    const id=crypto.randomUUID(),tema=l=>"gyaduelo/palabra-colaborativa/"+codigo+"/"+l;
    const subs=new Set(),oyentes=[],vistos=new Map(),mensajes={};
    let sb=null,red=null,sesion=null,preparado=false,cerrado=false,fallado=false;
    let tLatido=null,secuencia=0,tGuardar=null,tLeer=null,guardando=false,leyendo=false,sucio=false,cierreEnviado=false;
    try{sb=typeof obtenerSupa==="function"?obtenerSupa():null;}catch(e){}
    const emitir=(t,m)=>{if(!cerrado&&subs.has(t))for(const f of oyentes)try{f(t,m);}catch(e){}};
    const apodo=l=>codigo+"-"+l;
    const leer=async l=>{
      const r=await sb.from("gya_ranking").select("estado_juego").eq("grupo",GRUPO).eq("apodo",apodo(l)).limit(1);
      if(r.error)throw new Error("No se pudo leer la sala en el servidor.");
      return r.data?.[0]?.estado_juego||null;
    };
    const escribir=async estado=>{
      const r=await sb.from("gya_ranking").upsert({grupo:GRUPO,apodo:apodo(lado),monedas_totales:0,ciudades_ganadas:0,mejor_racha:0,logros:0,
        estado_juego:estado,actualizado_en:new Date().toISOString()},{onConflict:"grupo,apodo"});
      if(r.error)throw new Error("No se pudo guardar la sala en el servidor.");
    };
    const estado=()=>({v:1,sesion,id,codigo,actualizado:Date.now(),cerrada:cerrado,mensajes:JSON.parse(JSON.stringify(mensajes))});
    const agendarGuardado=(ms=180)=>{clearTimeout(tGuardar);if(!cerrado)tGuardar=setTimeout(guardar,ms);};
    async function guardar(){
      if(!preparado||guardando||!sucio||(cerrado&&cierreEnviado))return;
      guardando=true;sucio=false;const d=estado();if(cerrado)cierreEnviado=true;
      let fallo=false;try{await escribir(d);}catch(e){fallo=true;sucio=true;}
      finally{
        guardando=false;
        if(sucio){if(cerrado&&!cierreEnviado)void guardar();else if(!cerrado)agendarGuardado(fallo?2000:0);}
      }
    }
    async function recibirGuardado(){
      if(cerrado||leyendo)return;leyendo=true;
      try{
        const d=await leer(otro);
        if(cerrado||!d||d.sesion!==sesion||!d.mensajes||typeof d.mensajes!=="object")return;
        const lista=Object.entries(d.mensajes).filter(([tipo,x])=>["hola","ronda","progreso","chau","revancha","final"].includes(tipo)&&x&&Number.isSafeInteger(x.n)&&typeof x.msg==="string"&&x.msg.length<40000).sort((a,b)=>a[1].n-b[1].n);
        for(const [tipo,x] of lista){
          const marca=d.id+":"+x.n;if(vistos.get(tipo)===marca)continue;
          vistos.set(tipo,marca);emitir(tema(otro),x.msg);
        }
      }catch(e){/* La próxima lectura recupera los mensajes pendientes. */}
      finally{leyendo=false;if(!cerrado)tLeer=setTimeout(recibirGuardado,document.hidden?3000:900);}
    }
    const w={
      get connected(){return preparado&&!cerrado;},
      subscribe(t){subs.add(t);if(red)red.subscribe(t);},
      unsubscribe(t){subs.delete(t);if(red)red.unsubscribe(t);},
      on(ev,f){if(ev==="message")oyentes.push(f);return w;},
      publish(t,msg){
        if(cerrado||t!==tema(lado))return;
        let m;try{m=JSON.parse(String(msg));}catch(e){return;}
        if(!["hola","ronda","progreso","chau","revancha","final"].includes(m?.tipo))return;
        const txt=JSON.stringify(m);if(txt.length>=40000)return;
        mensajes[m.tipo]={n:++secuencia,msg:txt};sucio=true;
        if(red?.connected)try{red.publish(t,txt);}catch(e){}
        agendarGuardado(m.tipo==="hola"||m.tipo==="chau"||m.datos?.accion==="enviar"?0:180);
      },
      end(){
        if(cerrado)return;cerrado=true;clearTimeout(tGuardar);clearTimeout(tLeer);clearInterval(tLatido);
        if(red)try{red.end(true);}catch(e){}
        if(preparado){sucio=true;void guardar();}
      }
    };
    if(asignar)asignar(w);
    const fallar=e=>{
      if(cerrado||fallado)return;fallado=true;
      window.gyaFalloConexion=e.message||"No se pudo abrir la sala guardada.";
      w.end();if(alFallar)alFallar();
    };
    (async()=>{
      if(!sb)throw new Error("No se pudo acceder al servidor de salas. Recargá el juego.");
      if(!/^[A-HJ-NP-Z2-9]{4}$/.test(codigo))throw new Error("El código de sala no es válido.");
      const anfitrion=await leer("host");if(cerrado)return;
      const vigente=anfitrion?.v===1&&!anfitrion.cerrada&&Number.isFinite(anfitrion.actualizado)&&Date.now()-anfitrion.actualizado<VIGENCIA;
      const activo=vigente&&Date.now()-anfitrion.actualizado<ACTIVO;
      if(host){
        if(activo)throw new Error("Tu compañero ya abrió esta sala. Tocala de nuevo para entrar.");
        sesion=id;
      }else{
        if(!activo||typeof anfitrion.sesion!=="string")throw new Error("Tu compañero no está en la sala ahora. Tocá la sala de nuevo para abrirla con tu partida.");
        sesion=anfitrion.sesion;
      }
      await escribir(estado());
      if(host&&!cerrado){await new Promise(r=>setTimeout(r,700));const yo=await leer("host");if(!cerrado&&yo?.sesion!==sesion)throw new Error("Tu compañero abrió la sala al mismo tiempo. Tocala de nuevo para entrar.");}
      preparado=true;
      if(cerrado){sucio=true;void guardar();return;}
      tLatido=setInterval(()=>{if(!cerrado){sucio=true;void guardar();}},LATIDO);
      if(alListo)alListo();
      void recibirGuardado();
      // El respaldo guardado funciona solo; MultiBroker mantiene la edición en vivo.
      if(!cerrado&&typeof MultiBroker!=="undefined")MultiBroker.conectar(()=>{
        if(cerrado){red?.end(true);return;}
        subs.forEach(t=>red.subscribe(t));red.on("message",emitir);
      },()=>{},cl=>{red=cl;});
    })().catch(fallar);
    return w;
  }
  return{conectar,hostActivo};
})();
