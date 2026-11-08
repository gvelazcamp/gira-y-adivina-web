/* Doña Rosa (07/11/2026, Gonzalo): página de llegada para quien viene del anuncio de Instagram/Facebook.
   La serie «El almacén de Doña Rosa» (promo/serie-dona-rosa/) termina con «Jugá a Palabra Secreta en
   girayadivina.com»; el que entra desde el anuncio sigue la historia: ve el almacén y la libreta con los
   intentos del último capítulo y tiene los intentos que quedan para abrir el candado. Después se le ofrece
   seguir jugando a Palabra Secreta: crea su perfil (nombre y avatar) y entra directo a esa extensión.
   - Se muestra si el link trae la marca de Meta (fbclid), utm_source de Instagram/Facebook o ?rosa=1,
     y la persona todavía no jugó este capítulo. El que entra normal ve el inicio de siempre.
   - Cada paso se cuenta en Supabase (gya_ranking, grupo "embudo_rosa"; una fila por visitante) y Gonzalo
     lo ve en 👥 Usuarios.
   - Al entrar no hay «Saltar» (pedido de Gonzalo, 08/11): arriba hay otro botón «Probar», y «Saltar e ir al juego»
     aparece chico abajo recién después del primer intento.
   - Al publicar un capítulo nuevo se actualiza CAPITULO (clave, intentos con sus nombres y textos). */
(function(){
  /* Capítulo 1 (07/11): clave TERMO, intentos Pepito MATES, Marta PERRO, Juanchi VERDE.
     Capítulo 2 (07/11): abrió el candado del almacén con TERMO; la libreta tiene polvo y hay que adivinar
     qué le debe Chelo ($ 30.000 de YERBA). */
  /* Gonzalo (08/11): el capítulo 2 se publica cuando él lo diga (cuando suba el video). Hasta entonces, capítulo 1.
     Para pasar al 2: renombrar CAPITULO_2 a CAPITULO (y este a otro nombre) y subir rosa.js?v=. */
  const CAPITULO={id:1,clave:"TERMO",
    intentos:[["Pepito","MATES"],["Marta","PERRO"],["Juanchi","VERDE"]],
    titulo:"La libreta del fiado",
    pedido:"¡Ayudame a abrir la libreta! 🔒",
    gano:"¡La abriste! Ahora Doña Rosa puede cobrar el fiado y el almacén no cierra.",
    perdio:"Doña Rosa todavía no la puede abrir 😢 Mirá cómo sigue en el próximo capítulo."};
  const CAPITULO_2={id:2,clave:"YERBA",
    intentos:[["Don Tito","PASTA"],["Nelly","TRIGO"],["Pepito","MENTA"]],
    titulo:"Capítulo 2 · La libreta del fiado",
    hoja:"PÁGINA 1 · CHELO",          // título de la libreta
    icono:"🧉",                        // arriba a la derecha de la libreta (sin icono: candado 🔒/🔓)
    sub:"Me debe $ 30.000 de…",        // renglón debajo del título
    pedido:"¿Qué me debe Chelo? El polvo no me deja leer 😩",
    ganoTitulo:"🎉 ¡Doña Rosa cobró!",
    gano:"¡Era YERBA! Chelo le paga los $ 30.000 y Doña Rosa ya paga más de la mitad de su deuda.",
    perdio:"Todavía no se sabe qué le debe Chelo 😢 Mirá cómo sigue en el próximo capítulo."};
  const GRUPO="embudo_rosa",K_VISTO="gya_rosa_cap"+CAPITULO.id,K_ID="gya_rosa_visitante",K_PASOS="gya_rosa_pasos",K_IR="gya_rosa_ir";
  const ls={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}},del:k=>{try{localStorage.removeItem(k);}catch(e){}}};
  const q=(()=>{try{return new URLSearchParams(location.search);}catch(e){return new URLSearchParams();}})();
  /* Instagram no siempre agrega fbclid al link del anuncio: también se reconoce su navegador interno
     (o que venga de instagram.com / facebook.com). El link de la bio trae ?rosa=1 y sigue contando como "link". */
  const enAppMeta=(()=>{try{return /Instagram|FBAN|FBAV|FB_IAB|FBIOS/i.test(navigator.userAgent||"")||/instagram\.com|facebook\.com/i.test(document.referrer||"");}catch(e){return false;}})();
  const fuente=q.get("rosa")==="1"?"link":q.get("fbclid")?"meta":/^(ig|instagram|fb|facebook)$/i.test(q.get("utm_source")||"")?"utm":enAppMeta?"app":"";
  const tienePerfil=()=>{try{return !!(typeof perfil!=="undefined"&&perfil&&perfil.nombre);}catch(e){return false;}};

  /* --- Embudo: llegó, jugó, la sacó / no, quiere seguir, se registró, entró a Palabra Secreta --- */
  function visitante(){let id=ls.get(K_ID);if(!id){id="v"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);ls.set(K_ID,id);}return id;}
  /* Cada capítulo empieza su propio recorrido (una fila por visitante y capítulo). */
  function pasos(){try{const p=JSON.parse(ls.get(K_PASOS)||"{}")||{};return p.cap&&p.cap!==CAPITULO.id?{}:p;}catch(e){return {};}}
  async function paso(nombre){
    const p=pasos();if(p[nombre])return;p[nombre]=Date.now();p.cap=CAPITULO.id;p.origen=p.origen||fuente||"?";await subir(p);
  }
  /* Guarda en la fila del visitante las palabras que puso y su nombre (si ya tiene perfil). */
  async function subir(p){
    try{if(tienePerfil())p.nombre=perfil.nombre;}catch(e){}
    ls.set(K_PASOS,JSON.stringify(p));
    try{const sb=typeof obtenerSupa==="function"?obtenerSupa():null;
      /* Si la conexión todavía no cargó (internet lento), se reintenta en vez de perder el paso. */
      if(!sb){if((subir.n=(subir.n||0)+1)<=20)setTimeout(()=>subir(pasos()),3000);return;}
      await sb.from("gya_ranking").upsert({grupo:GRUPO,apodo:visitante()+(CAPITULO.id>1?"_c"+CAPITULO.id:""),monedas_totales:0,ciudades_ganadas:0,mejor_racha:0,logros:0,estado_juego:p,actualizado_en:new Date().toISOString()},{onConflict:"grupo,apodo"});}catch(e){}
  }
  /* Resumen para Gonzalo (👥 Usuarios). */
  async function resumen(){
    const sb=typeof obtenerSupa==="function"?obtenerSupa():null;if(!sb)return null;
    try{const r=await sb.from("gya_ranking").select("estado_juego,actualizado_en").eq("grupo",GRUPO).limit(5000);if(r.error)return null;
      const c={llego:0,jugo:0,gano:0,perdio:0,quiere:0,registro:0,palabra:0};
      c.anuncio={llego:0,jugo:0};c.lista=[];for(const f of r.data||[]){const e=f.estado_juego||{};for(const k in c)if(e[k])c[k]++;if(e.origen==="meta"||e.origen==="utm"||e.origen==="app"){if(e.llego)c.anuncio.llego++;if(e.jugo)c.anuncio.jugo++;c.lista.push({cap:e.cap||1,nombre:e.nombre||"",palabras:e.palabras||[],fin:e.gano?"gano":e.perdio?"perdio":"",registro:!!e.registro,fecha:f.actualizado_en||""});}}
      c.lista.sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
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
.ro-x.env{background:#E5197C;color:#fff;padding:9px 18px;font-size:.9rem;box-shadow:0 3px 0 #8E0F4C}
.ro-salir{text-align:center}.ro-salir .ro-no{margin-top:4px;font-size:.78rem}
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
.ro-sub{margin:2px 0 0;text-align:center;font:800 .82rem Outfit;color:#7a2a1a}
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
/* Pantallas bajas (el navegador de Instagram ocupa parte de arriba y de abajo): que entre el teclado entero sin deslizar. */
@media (max-height:760px){.ro-esc{zoom:.72}.ro-c{max-height:40px;font-size:1.05rem}.ro-tec button{height:40px}.ro-lib{margin-top:6px;padding-top:6px}.ro-msj{margin-top:4px}}
@media (max-height:640px){.ro-esc{zoom:.55}.ro-c{max-height:34px;font-size:.95rem}.ro-tec button{height:36px}.ro-tab{gap:3px}.ro-fila{gap:4px}}
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
    const panel=fin?'<div class="ro-panel"><h3>'+(abierto?(CAPITULO.ganoTitulo||"🎉 ¡Salvaste a Doña Rosa!"):"¡Casi!")+'</h3><p>'+(abierto?CAPITULO.gano:CAPITULO.perdio)+'</p><p>¿Querés seguir jugando a <b>Palabra Secreta</b>? Una palabra nueva cada vez, gratis.</p><button type="button" class="ro-si" id="roSi">🔤 ¡Sí, quiero jugar!</button><button type="button" class="ro-no" id="roNo">Ahora no</button></div>':"";
    capa.innerHTML='<div class="ro-cab"><div><small>'+CAPITULO.titulo+'</small><b>EL ALMACÉN DE DOÑA ROSA</b></div>'+(fin?'':'<button type="button" class="ro-x env" data-t="OK">Probar</button>')+'</div>'+
      '<div class="ro-esc"><div class="ro-edif"></div><div class="ro-cartel">ALMACÉN ROSA</div><div class="ro-toldo"></div><div class="ro-puerta"></div><div class="ro-aviso'+(abierto?" ok":"")+'">'+(abierto?"¡ABIERTO!":"CIERRA<br>PRONTO")+'</div>'+rosaHtml()+'<div class="ro-globo">'+(abierto?"¡Gracias, vecino! 💜":fin?"Ay… ¿cuál era? 😢":CAPITULO.pedido)+'</div></div>'+
      '<div class="ro-lib"><span class="ro-cand">'+(CAPITULO.icono||(abierto?"🔓":"🔒"))+'</span><h4>'+(CAPITULO.hoja||"LIBRETA DEL FIADO")+'</h4>'+(CAPITULO.sub?'<p class="ro-sub">'+CAPITULO.sub+'</p>':'')+'<div class="ro-tab">'+filas+'</div></div>'+
      '<p class="ro-msj" id="roMsj">'+(fin?"":"Tenés "+libres+" intento"+(libres===1?"":"s")+". Palabra de 5 letras.")+'</p>'+tec+(!fin&&mios.length?'<div class="ro-salir"><button type="button" class="ro-no" id="roSaltar">Saltar e ir al juego</button></div>':'')+panel;
    const sal=capa.querySelector("#roSaltar");if(sal)sal.onclick=()=>cerrar(false);
    capa.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>tecla_(b.dataset.t));
    const si=capa.querySelector("#roSi");if(si){si.onclick=()=>cerrar(true);si.focus({preventScroll:true});setTimeout(()=>{try{capa&&capa.scrollTo({top:capa.scrollHeight,behavior:"smooth"});}catch(e){}},600);}
    const no=capa.querySelector("#roNo");if(no)no.onclick=()=>cerrar(false);
  }
  function mensaje(t){const m=capa&&capa.querySelector("#roMsj");if(m)m.textContent=t;}
  function tecla_(t){
    if(fin||!capa)return;
    if(t==="⌫"){borrador=borrador.slice(0,-1);pintar();return;}
    if(t==="OK"){
      if(borrador.length<5){mensaje("Faltan letras: son 5.");return;}
      if(!valida(borrador)){mensaje("Esa palabra no está en el diccionario.");return;}
      if(!mios.length)paso("jugo");
      mios.push(borrador);borrador="";{const p=pasos();p.palabras=mios.slice();subir(p);}
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
    /* Si llegó por el anuncio y después se hizo el perfil, se anota su nombre. */
    setTimeout(()=>{const p=pasos();if(p.llego&&tienePerfil()&&p.nombre!==perfil.nombre)subir(p);},4000);
    if(!fuente)return;
    const visto=ls.get(K_VISTO);if(visto&&fuente!=="link")return;
    mostrar();
  }
  window.DonaRosa={resumen,mostrar:()=>{if(!capa){mios=[];borrador="";fin=null;mostrar();}}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrancar);else arrancar();
})();
