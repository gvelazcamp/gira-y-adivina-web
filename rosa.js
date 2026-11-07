/* Doña Rosa (07/11/2026, Gonzalo): página de llegada para quien viene del anuncio de Instagram/Facebook.
   La serie «El almacén de Doña Rosa» (promo/serie-dona-rosa/) termina con «Jugá a Palabra Secreta en
   girayadivina.com»; el que entra desde el anuncio sigue la historia: ve el almacén y la libreta con los
   intentos del último capítulo y tiene los intentos que quedan para abrir el candado. Después se le ofrece
   seguir jugando a Palabra Secreta: crea su perfil (nombre y avatar) y entra directo a esa extensión.
   - Se muestra si el link trae la marca de Meta (fbclid), utm_source de Instagram/Facebook o ?rosa=1,
     y la persona todavía no jugó este capítulo. El que entra normal ve el inicio de siempre.
   - Cada paso se cuenta en Supabase (gya_ranking, grupo "embudo_rosa"; una fila por visitante) y Gonzalo
     lo ve en 👥 Usuarios.
   - Al publicar un capítulo nuevo se actualiza CAPITULO (clave, intentos con sus nombres y textos). */
(function(){
  const CAPITULO={id:1,clave:"TERMO",
    intentos:[["Pepito","MATES"],["Marta","PERRO"],["Juanchi","VERDE"]],
    titulo:"La libreta del fiado",
    pedido:"¡Ayudame a abrir la libreta! 🔒",
    gano:"¡La abriste! Ahora Doña Rosa puede cobrar el fiado y el almacén no cierra.",
    perdio:"Doña Rosa todavía no la puede abrir 😢 Mirá cómo sigue en el próximo capítulo."};
  const GRUPO="embudo_rosa",K_VISTO="gya_rosa_cap"+CAPITULO.id,K_ID="gya_rosa_visitante",K_PASOS="gya_rosa_pasos",K_IR="gya_rosa_ir";
  const ls={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}},del:k=>{try{localStorage.removeItem(k);}catch(e){}}};
  const q=(()=>{try{return new URLSearchParams(location.search);}catch(e){return new URLSearchParams();}})();
  const fuente=q.get("rosa")==="1"?"link":q.get("fbclid")?"meta":/^(ig|instagram|fb|facebook)$/i.test(q.get("utm_source")||"")?"utm":"";
  const tienePerfil=()=>{try{return !!(typeof perfil!=="undefined"&&perfil&&perfil.nombre);}catch(e){return false;}};

  /* --- Embudo: llegó, jugó, la sacó / no, quiere seguir, se registró, entró a Palabra Secreta --- */
  function visitante(){let id=ls.get(K_ID);if(!id){id="v"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);ls.set(K_ID,id);}return id;}
  function pasos(){try{return JSON.parse(ls.get(K_PASOS)||"{}")||{};}catch(e){return {};}}
  async function paso(nombre){
    const p=pasos();if(p[nombre])return;p[nombre]=Date.now();p.cap=CAPITULO.id;p.origen=p.origen||fuente||"?";ls.set(K_PASOS,JSON.stringify(p));
    try{const sb=typeof obtenerSupa==="function"?obtenerSupa():null;if(!sb)return;
      await sb.from("gya_ranking").upsert({grupo:GRUPO,apodo:visitante(),monedas_totales:0,ciudades_ganadas:0,mejor_racha:0,logros:0,estado_juego:p,actualizado_en:new Date().toISOString()},{onConflict:"grupo,apodo"});}catch(e){}
  }
  /* Resumen para Gonzalo (👥 Usuarios). */
  async function resumen(){
    const sb=typeof obtenerSupa==="function"?obtenerSupa():null;if(!sb)return null;
    try{const r=await sb.from("gya_ranking").select("estado_juego").eq("grupo",GRUPO).limit(5000);if(r.error)return null;
      const c={llego:0,jugo:0,gano:0,perdio:0,quiere:0,registro:0,palabra:0};
      c.anuncio={llego:0,jugo:0};for(const f of r.data||[]){const e=f.estado_juego||{};for(const k in c)if(e[k])c[k]++;if(e.origen==="meta"||e.origen==="utm"){if(e.llego)c.anuncio.llego++;if(e.jugo)c.anuncio.jugo++;}}
      return c;}catch(e){return null;}
  }

  /* --- Pantalla --- */
  const ARTE=n=>"assets/palabra-secreta/"+n+".webp";
  function evaluar(w,s){const r=Array(5).fill("gris"),resto=[...s];for(let i=0;i<5;i++)if(w[i]===s[i]){r[i]="verde";resto[i]=null;}
    for(let i=0;i<5;i++)if(r[i]==="gris"){const k=resto.indexOf(w[i]);if(k>=0){r[i]="amarilla";resto[k]=null;}}return r;}
  const valida=w=>{try{return (typeof PALABRA_VALIDAS!=="undefined"&&PALABRA_VALIDAS.has(w))||(typeof PALABRA_SECRETAS!=="undefined"&&PALABRA_SECRETAS.includes(w));}catch(e){return true;}};
  let capa=null,mios=[],borrador="",fin=null;
  function estilos(){
    if(document.getElementById("rosaEstilos"))return;
    const st=document.createElement("style");st.id="rosaEstilos";st.textContent=`
#rosaCapa{position:fixed;inset:0;z-index:2147482000;background:#24384a;color:#FCEFD2;font-family:Outfit,system-ui,sans-serif;overflow-y:auto;padding:max(10px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom))}
#rosaCapa *{box-sizing:border-box}
.ro-cab{display:flex;align-items:center;justify-content:space-between;gap:8px;max-width:440px;margin:0 auto}
.ro-cab b{font:900 1.05rem "Archivo Black",Outfit,sans-serif;letter-spacing:.5px}.ro-cab small{display:block;font:800 .7rem Outfit;color:#9fb6c4;letter-spacing:1.5px;text-transform:uppercase}
.ro-x{border:0;background:#ffffff1a;color:#FCEFD2;border-radius:99px;padding:7px 12px;font:800 .78rem Outfit;cursor:pointer;white-space:nowrap}
.ro-esc{position:relative;max-width:440px;height:150px;margin:8px auto 0;border-radius:16px;overflow:hidden;background:linear-gradient(#bfe3d0 0,#cfe9d8 60%,#d8cdb6 60%,#d8cdb6 78%,#6b6b6b 78%)}
.ro-edif{position:absolute;left:50%;transform:translateX(-50%);top:18px;width:250px;height:86px;background:#F3D9A4;border:4px solid #7a4a2a;border-bottom:0}
.ro-cartel{position:absolute;left:50%;transform:translateX(-50%);top:6px;background:#2d5d7a;color:#FCEFD2;font:900 .72rem "Archivo Black",sans-serif;padding:3px 10px;border-radius:6px;border:2px solid #f3e3c0;white-space:nowrap;z-index:2}
.ro-toldo{position:absolute;left:50%;transform:translateX(-50%);top:34px;width:230px;height:18px;background:repeating-linear-gradient(90deg,#d6403a 0 20px,#f6efe2 20px 40px)}
.ro-puerta{position:absolute;left:50%;transform:translateX(-50%);top:56px;width:44px;height:48px;background:#5b3a26}
.ro-aviso{position:absolute;left:50%;top:62px;transform:translateX(-50%) rotate(-6deg);background:#fff7e0;border:2px solid #c43;color:#c43;font:900 .5rem/1.05 Outfit;padding:2px 3px;text-align:center;z-index:2;white-space:nowrap}
.ro-aviso.ok{border-color:#1a8a5a;color:#1a8a5a}
.ro-rosa{position:absolute;left:calc(50% + 70px);top:58px;width:34px;height:56px}
.ro-rosa i{position:absolute;display:block;border-radius:50%}
.ro-globo{position:absolute;left:8px;bottom:8px;max-width:150px;background:#fff;color:#5b3a26;border-radius:14px;padding:6px 9px;font:800 .72rem/1.15 Outfit;box-shadow:0 4px 12px #0004}
.ro-lib{position:relative;max-width:440px;margin:10px auto 0;background:#FFF8E6 repeating-linear-gradient(#FFF8E6 0 38px,#cfe0ee 38px 39px);border-left:8px solid #b4532f;border-radius:6px 14px 14px 6px;padding:8px 10px 10px;color:#2A1A3C}
.ro-lib h4{margin:0;text-align:center;font:900 .95rem "Archivo Black",sans-serif;color:#7a2a1a;letter-spacing:1px}
.ro-cand{position:absolute;right:8px;top:4px;font-size:1.5rem}
.ro-tab{display:grid;gap:5px;margin-top:6px}
.ro-fila{display:grid;grid-template-columns:62px repeat(5,1fr);gap:5px;align-items:center}
.ro-fila .n{font:900 .72rem "Archivo Black",sans-serif;color:#2d5d7a;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ro-fila.vos .n{color:#b4532f}
.ro-c{aspect-ratio:1;max-height:48px;background:url(${ARTE("casilla")}) center/100% 100%;display:grid;place-items:center;font:900 1.25rem "Archivo Black",sans-serif;color:#fff}
.ro-c.verde{background-image:url(${ARTE("verde")})}.ro-c.amarilla{background-image:url(${ARTE("amarilla")});color:#3A2400}.ro-c.gris{background-image:url(${ARTE("gris")})}
.ro-c.act{outline:3px solid #F5B301;outline-offset:-3px;border-radius:10px}
.ro-msj{min-height:1.3em;max-width:440px;margin:8px auto 0;text-align:center;font:800 .88rem Outfit;color:#F5C451}
.ro-tec{max-width:440px;margin:6px auto 0;display:grid;gap:5px}
.ro-tec div{display:flex;gap:4px;justify-content:center}
.ro-tec button{flex:1;min-width:0;max-width:40px;height:44px;border:0;border-radius:8px;background:#3d5a6e;color:#fff;font:900 1rem Outfit;cursor:pointer}
.ro-tec button.ancho{max-width:none;flex:1.6;font-size:.82rem}
.ro-tec button.env{background:#E5197C}
.ro-panel{max-width:440px;margin:10px auto 0;background:#1b2e3c;border:2px solid #F5C451;border-radius:18px;padding:14px;text-align:center}
.ro-panel h3{margin:0 0 6px;font:900 1.2rem "Archivo Black",sans-serif;color:#F5C451}
.ro-panel p{margin:0 0 10px;font:700 .92rem/1.3 Outfit;color:#E4D8EB}
.ro-si{display:block;width:100%;border:0;border-radius:14px;padding:14px;background:linear-gradient(#ff4fa3,#E5197C);color:#fff;font:900 1.05rem Outfit;cursor:pointer;box-shadow:0 4px 0 #8E0F4C}
.ro-no{margin-top:8px;border:0;background:none;color:#9fb6c4;font:800 .85rem Outfit;text-decoration:underline;cursor:pointer}
`;
    document.head.appendChild(st);
  }
  function rosaHtml(){return '<div class="ro-rosa"><i style="left:9px;top:-6px;width:12px;height:11px;background:#c9c9cf"></i><i style="left:5px;top:0;width:24px;height:22px;background:#c9c9cf"></i><i style="left:7px;top:5px;width:20px;height:20px;background:#f1c6a0"></i><i style="left:3px;top:24px;width:28px;height:30px;border-radius:9px 9px 4px 4px;background:#7b4fa3"></i><i style="left:9px;top:30px;width:16px;height:24px;border-radius:4px;background:#fff3dc"></i></div>';}
  function pintar(){
    if(!capa)return;
    const todas=CAPITULO.intentos.map(([n,w])=>({n,w,c:evaluar(w,CAPITULO.clave)})).concat(mios.map(w=>({n:"Vos",w,c:evaluar(w,CAPITULO.clave),vos:1})));
    const libres=CAPITULO.intentos.length+3-todas.length,abierto=fin==="gano";
    let filas="";
    todas.forEach(f=>{filas+='<div class="ro-fila'+(f.vos?" vos":"")+'"><span class="n">'+f.n+'</span>'+[...f.w].map((l,i)=>'<span class="ro-c '+f.c[i]+'">'+l+'</span>').join("")+'</div>';});
    for(let k=0;k<libres;k++){const act=k===0&&!fin;filas+='<div class="ro-fila vos"><span class="n">'+(act?"Vos ✍️":"Vos")+'</span>'+[0,1,2,3,4].map(i=>'<span class="ro-c'+(act&&i===borrador.length?" act":"")+'">'+(act?(borrador[i]||""):"")+'</span>').join("")+'</div>';}
    const tecla=t=>'<button type="button" data-t="'+t+'">'+t+'</button>';
    const tec=fin?"":'<div class="ro-tec"><div>'+[..."QWERTYUIOP"].map(tecla).join("")+'</div><div>'+[..."ASDFGHJKLÑ"].map(tecla).join("")+'</div><div><button type="button" class="ancho" data-t="⌫">⌫ Borrar</button>'+[..."ZXCVBNM"].map(tecla).join("")+'<button type="button" class="ancho env" data-t="OK">Probar</button></div></div>';
    const panel=fin?'<div class="ro-panel"><h3>'+(abierto?"🎉 ¡Salvaste a Doña Rosa!":"¡Casi!")+'</h3><p>'+(abierto?CAPITULO.gano:CAPITULO.perdio)+'</p><p>¿Querés seguir jugando a <b>Palabra Secreta</b>? Una palabra nueva cada vez, gratis.</p><button type="button" class="ro-si" id="roSi">🔤 ¡Sí, quiero jugar!</button><button type="button" class="ro-no" id="roNo">Ahora no</button></div>':"";
    capa.innerHTML='<div class="ro-cab"><div><small>'+CAPITULO.titulo+'</small><b>EL ALMACÉN DE DOÑA ROSA</b></div><button type="button" class="ro-x" id="roSaltar">Saltar ✕</button></div>'+
      '<div class="ro-esc"><div class="ro-edif"></div><div class="ro-cartel">ALMACÉN ROSA</div><div class="ro-toldo"></div><div class="ro-puerta"></div><div class="ro-aviso'+(abierto?" ok":"")+'">'+(abierto?"¡ABIERTO!":"CIERRA<br>PRONTO")+'</div>'+rosaHtml()+'<div class="ro-globo">'+(abierto?"¡Gracias, vecino! 💜":fin?"Ay… ¿cuál era? 😢":CAPITULO.pedido)+'</div></div>'+
      '<div class="ro-lib"><span class="ro-cand">'+(abierto?"🔓":"🔒")+'</span><h4>LIBRETA DEL FIADO</h4><div class="ro-tab">'+filas+'</div></div>'+
      '<p class="ro-msj" id="roMsj">'+(fin?"":"Tenés "+libres+" intento"+(libres===1?"":"s")+". Clave de 5 letras.")+'</p>'+tec+panel;
    capa.querySelector("#roSaltar").onclick=()=>cerrar(false);
    capa.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>tecla_(b.dataset.t));
    const si=capa.querySelector("#roSi");if(si){si.onclick=()=>cerrar(true);si.focus({preventScroll:true});}
    const no=capa.querySelector("#roNo");if(no)no.onclick=()=>cerrar(false);
  }
  function mensaje(t){const m=capa&&capa.querySelector("#roMsj");if(m)m.textContent=t;}
  function tecla_(t){
    if(fin||!capa)return;
    if(t==="⌫"){borrador=borrador.slice(0,-1);pintar();return;}
    if(t==="OK"){
      if(borrador.length<5){mensaje("Faltan letras: la clave tiene 5.");return;}
      if(!valida(borrador)){mensaje("Esa palabra no está en el diccionario.");return;}
      if(!mios.length)paso("jugo");
      mios.push(borrador);borrador="";
      if(mios[mios.length-1]===CAPITULO.clave){fin="gano";paso("gano");}
      else if(mios.length>=3){fin="perdio";paso("perdio");}
      ls.set(K_VISTO,fin||"jugando");pintar();
      if(fin==="gano"){try{if(typeof sonarSFX==="function")sonarSFX("aplausos");}catch(e){}}
      return;
    }
    if(/^[A-ZÑ]$/.test(t)&&borrador.length<5){borrador+=t;pintar();}
  }
  function teclado(e){
    if(!capa||fin||e.ctrlKey||e.metaKey||e.altKey)return;
    const k=e.key;
    if(k==="Backspace"){e.preventDefault();tecla_("⌫");}
    else if(k==="Enter"){e.preventDefault();tecla_("OK");}
    else if(/^[a-zñA-ZÑ]$/.test(k)){e.preventDefault();tecla_(k.toUpperCase());}
  }
  function cerrar(quiere){
    if(!capa)return;
    document.removeEventListener("keydown",teclado,true);
    capa.remove();capa=null;ls.set(K_VISTO,fin||"salteado");
    try{history.replaceState(null,"",location.pathname);}catch(e){}
    if(quiere){paso("quiere");
      /* Sin perfil: en vez del tutorial de la rueda, directo a elegir nombre y avatar. */
      if(!tienePerfil()){ls.set("gya_rosa_sinperfil","1");document.getElementById("capaBienvenida")?.classList.remove("ver");try{if(typeof abrirPerfil==="function")abrirPerfil(()=>irAPalabra());}catch(e){}}
      ls.set(K_IR,"palabra-secreta");irAPalabra();}
  }
  /* Después de crear el perfil (nombre y avatar) entra directo a Palabra Secreta. */
  function irAPalabra(){
    if(ls.get(K_IR)!=="palabra-secreta")return;
    let n=0;const t=setInterval(()=>{
      if(++n>1200){clearInterval(t);return;}
      if(!tienePerfil()||!window.Extensiones||document.readyState!=="complete")return;
      clearInterval(t);ls.del(K_IR);
      if(ls.get("gya_rosa_sinperfil")){ls.del("gya_rosa_sinperfil");paso("registro");}
      setTimeout(()=>{try{Extensiones.abrirJuego("palabra-secreta");paso("palabra");}catch(e){}},400);
    },500);
  }
  function mostrar(){
    estilos();capa=document.createElement("div");capa.id="rosaCapa";capa.setAttribute("role","dialog");capa.setAttribute("aria-label","El almacén de Doña Rosa");
    document.body.appendChild(capa);pintar();document.addEventListener("keydown",teclado,true);paso("llego");
  }
  function arrancar(){
    irAPalabra();
    if(!fuente)return;
    const visto=ls.get(K_VISTO);if(visto&&fuente!=="link")return;
    mostrar();
  }
  window.DonaRosa={resumen,mostrar:()=>{if(!capa){mios=[];borrador="";fin=null;mostrar();}}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrancar);else arrancar();
})();
