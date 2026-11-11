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
  /* Gonzalo (08/11): el capítulo 1 sigue para todos; el 2 se abre con el link https://girayadivina.com/?cap=2 (anuncio nuevo).
     Para pasar a todos al 2: en el script del principio de index.html poner ROSA_CAP por defecto en 2 y acá devolver CAPITULO_2. */
  const CAPITULO_1={id:1,clave:"TERMO",
    intentos:[["Pepito","MATES"],["Marta","PERRO"],["Juanchi","VERDE"]],
    titulo:"La libreta del fiado",
    pista:"Sirve para tomar mate 🧉",   // botón «💡 Pista» de la libreta (Gonzalo, 08/11)
    pedido:"¡Ayudame a abrir la libreta! 🔒",
    gano:"¡La abriste! Ahora Doña Rosa puede cobrar el fiado y el almacén no cierra.",
    perdio:"Doña Rosa todavía no la puede abrir 😢 Mirá cómo sigue en el próximo capítulo."};
  const CAPITULO_2={id:2,clave:"YERBA",
    intentos:[["Don Tito","PASTA"],["Nelly","TRIGO"],["Pepito","TERMA"]],
    titulo:"Capítulo 2 · La libreta del fiado",
    pista:"No puede faltar en el mate 🧉",
    hoja:"PÁGINA 1 · CHELO",          // título de la libreta
    icono:"🧉",                        // arriba a la derecha de la libreta (sin icono: candado 🔒/🔓)
    sub:"Chelo me debe…",        // renglón debajo del título
    pedido:"¿Qué me debe Chelo? El polvo no me deja leer 😩",
    ganoTitulo:"🎉 ¡Doña Rosa cobró!",
    gano:"¡Era YERBA! Chelo paga y Doña Rosa empieza a cubrir su deuda (entre él y otros vecinos le deben más de $ 30.000).",
    perdio:"Todavía no se sabe qué le debe Chelo 😢 Mirá cómo sigue en el próximo capítulo."};
  /* Capítulo 3 (08/11, Gonzalo): llegó el cobrador; página 2 de la libreta, ¿qué le debe Cacho? Una bebida con duda:
     con estos intentos queda _I_RA → SIDRA o BIRRA (las dos dan los mismos colores; BIRRA se agregó al diccionario
     para que escribirla no la descarte). Pista que sirve para las dos. */
  /* Capítulo 3 · La colecta (11/11, Gonzalo): el mismo tablero del video. Palabra de 7 letras: GRANOLA
     (Pepito CAMPERA, Nelly GRANJAS, Juanchi GRANITA → faltan la O y la L). La idea anterior del cobrador (SIDRA) quedó para más adelante. */
  const CAPITULO_3={id:3,clave:"GRANOLA",
    intentos:[["Pepito","CAMPERA"],["Nelly","GRANJAS"],["Juanchi","GRANITA"]],
    titulo:"Capítulo 3 · La colecta",
    pista:"Va con yogur en el desayuno 🥣",
    hoja:"DESCUENTOS",
    icono:"🏷️",
    sub:"¿Qué producto está tapado?",
    pedido:"¿Qué producto tapé? Son 7 letras 🤔",
    ganoTitulo:"🎉 ¡Lo descubriste!",
    gano:"¡Era GRANOLA! Ya tenés tu lugar en la fila de descuentos de Doña Rosa. Seguí la historia: ¿de qué país se sumarán más clientes?",
    perdio:"Todavía no se sabe qué producto está tapado 😢 Mirá cómo sigue en el próximo capítulo."};
  /* Capítulo activo: el 1 para todos; el 2 y el 3 con el link ?cap=2 / ?cap=3 (anuncio de ese capítulo). Se recuerda en el
     celular para que el juego completo (index.html) siga contando en el capítulo correcto. */
  const CAPS={1:CAPITULO_1,2:CAPITULO_2,3:CAPITULO_3};
  const CAPITULO=(()=>{let c=1;try{const qq=new URLSearchParams(location.search),qc=qq.get("cap"),ac=localStorage.getItem("gya_rosa_cap_activo");
    if(qc==="2"||qc==="3"){c=+qc;localStorage.setItem("gya_rosa_cap_activo",qc);}
    else if(qc==="1"||qq.get("rosa")==="1")localStorage.removeItem("gya_rosa_cap_activo");else if(ac==="2"||ac==="3")c=+ac;}catch(e){}return CAPS[c];})();
  const GRUPO="embudo_rosa",K_VISTO="gya_rosa_cap"+CAPITULO.id,K_ID="gya_rosa_visitante",K_PASOS="gya_rosa_pasos",K_IR="gya_rosa_ir";
  const ls={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}},del:k=>{try{localStorage.removeItem(k);}catch(e){}}};
  const q=(()=>{try{return new URLSearchParams(location.search);}catch(e){return new URLSearchParams();}})();
  /* Instagram no siempre agrega fbclid al link del anuncio: también se reconoce su navegador interno
     (o que venga de instagram.com / facebook.com). El link de la bio trae ?rosa=1 y sigue contando como "link". */
  const enAppMeta=(()=>{try{return /Instagram|FBAN|FBAV|FB_IAB|FBIOS/i.test(navigator.userAgent||"")||/instagram\.com|facebook\.com/i.test(document.referrer||"");}catch(e){return false;}})();
  const fuente=q.get("rosa")==="1"?"link":q.get("fbclid")?"meta":/^(ig|instagram|fb|facebook)$/i.test(q.get("utm_source")||"")?"utm":enAppMeta?"app":"";
  /* En rosa.html (página liviana del anuncio) no está el juego: el perfil se mira en localStorage. */
  const SOLA=!!window.ROSA_SOLA;
  const URL_PLAY="https://play.google.com/store/apps/details?id=io.github.gvelazcamp.twa&referrer=utm_source%3Ddona_rosa";
  /* Gonzalo (08/11): «Seguí jugando a Palabra Secreta en la app». Si la app está instalada se abre directo en Palabra Secreta
     (con su cuenta, sin registrarse de nuevo); si no, Android usa el respaldo y va a Google Play. */
  const URL_APP="intent://girayadivina.com/index.html?ext=palabra-secreta#Intent;scheme=https;package=io.github.gvelazcamp.twa;S.browser_fallback_url="+encodeURIComponent(URL_PLAY)+";end";
  const ANDROID=(()=>{try{return SOLA&&/Android/i.test(navigator.userAgent||"");}catch(e){return false;}})();
  /* Mientras juega a Doña Rosa, el juego completo se baja atrás (sin apurar a Doña Rosa): así al tocar
     «Seguir» abre enseguida en vez de esperar los ~11 s de carga. */
  function precargarJuego(){
    try{fetch("index.html",{credentials:"same-origin"}).then(r=>r.text()).then(html=>{
      const urls=[...html.matchAll(/<(?:script[^>]*\ssrc|link[^>]*rel="(?:stylesheet|preload)"[^>]*\shref)="([^"]+)"/g)].map(m=>m[1]).filter(u=>!/^(https?:)?\/\//.test(u)&&!/\.webp|\.png|\.jpg/.test(u));
      let i=0;const sig=()=>{const u=urls[i++];if(!u)return;fetch(u,{credentials:"same-origin"}).catch(()=>{}).finally(sig);};
      for(let k=0;k<3;k++)sig();}).catch(()=>{});}catch(e){}
  }
  const tienePerfil=()=>{try{if(SOLA)return !!localStorage.getItem("gya_nombre");return !!(typeof perfil!=="undefined"&&perfil&&perfil.nombre);}catch(e){return false;}};

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
  /* Resumen para Gonzalo (👥 Usuarios). Cap. 2 actual; Cap. 1 sigue disponible como historial.
     Cada consulta filtra el capítulo en Supabase y pagina de a 1000: la API
     puede limitar una consulta a 1000 filas aunque se pida limit(5000). */
  async function resumen(capitulo=2){
    const sb=typeof obtenerSupa==="function"?obtenerSupa():null;if(!sb)return null;
    try{
      const filas=[];
      for(let desde=0;;desde+=1000){
        const r=await sb.from("gya_ranking").select("estado_juego,actualizado_en")
          .eq("grupo",GRUPO).eq("estado_juego->>cap",String(capitulo))
          .order("apodo",{ascending:true}).range(desde,desde+999);
        if(r.error)return null;
        const lote=r.data||[];filas.push(...lote);
        if(lote.length<1000)break;
      }
      const c={llego:0,jugo:0,pista:0,gano:0,perdio:0,quiere:0,play:0,registro:0,palabra:0,ps_jugo:0,reg_ofrecido:0};
      c.anuncio={llego:0,jugo:0};c.lista=[];
      for(const f of filas){
        const e=f.estado_juego||{};
        for(const k in c)if(e[k])c[k]++;
        if(e.origen==="meta"||e.origen==="utm"||e.origen==="app"){
          if(e.llego)c.anuncio.llego++;if(e.jugo)c.anuncio.jugo++;
          c.lista.push({cap:e.cap||1,nombre:e.nombre||"",palabras:e.palabras||[],fin:e.gano?"gano":e.perdio?"perdio":"",registro:!!e.registro,fecha:f.actualizado_en||""});
        }
      }
      c.lista.sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
      return c;
    }catch(e){return null;}
  }

  /* --- Pantalla --- */
  const ARTE=n=>"assets/palabra-secreta/"+n+".webp";
  /* Largo de la palabra del capítulo (5 en los capítulos 1 y 2, 7 en el 3). */
  const LARGO=CAPITULO.clave.length;
  function evaluar(w,s){const n=s.length,r=Array(n).fill("gris"),resto=[...s];for(let i=0;i<n;i++)if(w[i]===s[i]){r[i]="verde";resto[i]=null;}
    for(let i=0;i<n;i++)if(r[i]==="gris"){const k=resto.indexOf(w[i]);if(k>=0){r[i]="amarilla";resto[k]=null;}}return r;}
  const valida=w=>{if(w.length!==5)return /^[A-ZÑ]+$/.test(w);try{return (typeof PALABRA_VALIDAS!=="undefined"&&PALABRA_VALIDAS.has(w))||(typeof PALABRA_SECRETAS!=="undefined"&&PALABRA_SECRETAS.includes(w));}catch(e){return true;}};
  let capa=null,mios=[],borrador="",fin=null,verPista=false;
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
.ro-pista{position:absolute;left:6px;top:4px;border:0;border-radius:99px;padding:5px 10px;background:#F5C451;color:#5b3a26;font:900 .78rem Outfit;cursor:pointer;box-shadow:0 2px 0 #b98a1f;z-index:2}
.ro-pista.si{background:#ffe9a8}
.ro-lib h4{padding:0 56px;white-space:nowrap}
@media (max-width:370px){.ro-lib h4{font-size:.8rem;padding:0 52px}.ro-pista{padding:4px 8px;font-size:.72rem}}
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
.ro-nota{margin:6px 0 2px!important;font:700 .78rem/1.25 Outfit!important;color:#9fb6c4!important}
.ro-si{display:block;width:100%;text-align:center;text-decoration:none;border:0;border-radius:14px;padding:14px;background:linear-gradient(#ff4fa3,#E5197C);color:#fff;font:900 1.05rem Outfit;cursor:pointer;box-shadow:0 4px 0 #8E0F4C}
.ro-no{margin-top:8px;border:0;background:none;color:#9fb6c4;font:800 .85rem Outfit;text-decoration:underline;cursor:pointer}
/* Pantallas bajas (el navegador de Instagram ocupa parte de arriba y de abajo): que entre el teclado entero sin deslizar. */
@keyframes roPopFondo{from{opacity:0}to{opacity:1}}
.ro-pop{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:16px;background:#0b0614b0;animation:roPopFondo .35s ease-out .7s both}
.ro-pop .ro-panel{width:100%;margin:0;max-height:90dvh;overflow-y:auto;box-shadow:0 20px 50px #000a;animation:roInvBote .4s ease-out .7s both}
.ro-pop.ya,.ro-pop.ya .ro-panel{animation:none}
.ro-revela{margin:8px 0 4px!important;padding:8px 10px;border-radius:12px;background:#FFF3C4;color:#5b3a26!important;font:800 1rem Outfit!important}
.ro-revela b{font-family:'Archivo Black',sans-serif;letter-spacing:2px;color:#2E9E5B}
@keyframes roInvPulso{0%,100%{box-shadow:0 0 0 0 #F5B30100}50%{box-shadow:0 0 0 5px #F5B301aa}}
@keyframes roInvBote{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
@keyframes roInvTap{0%,100%{transform:scale(1)}50%{transform:scale(.82)}}
.ro-fila.ro-inv{position:relative;border-radius:10px;animation:roInvPulso 1.1s ease-in-out infinite}
.ro-c .ro-fant{color:#8FF5B9;opacity:.8;text-shadow:0 0 6px #2E9E5B}
.ro-inv-etq{position:absolute;left:50%;top:-15px;transform:translateX(-50%);z-index:3;background:#F5B301;color:#3A2400;font:900 .68rem Outfit,sans-serif;padding:3px 9px;border-radius:99px;box-shadow:0 3px 10px #0005;white-space:nowrap;animation:roInvBote .45s ease-out}
.ro-globo.ro-inv-globo{background:#FFF3C4;animation:roInvBote .5s ease-out}
.ro-tec button.ro-inv-tecla{background:#F5B301!important;color:#3A2400!important;animation:roInvPulso 1.1s ease-in-out infinite}
.ro-mano{position:fixed;z-index:2147483647;font-size:44px;pointer-events:none;transition:left .8s ease-in-out,top .8s ease-in-out,opacity .5s;filter:drop-shadow(0 4px 6px #0007)}
.ro-mano.tap{animation:roInvTap .35s ease-in-out 2}
@media (max-height:760px){.ro-esc{zoom:.72}.ro-c{max-height:40px;font-size:1.05rem}.ro-tec button{height:40px}.ro-lib{margin-top:6px;padding-top:6px}.ro-msj{margin-top:4px}}
@media (max-height:640px){.ro-esc{zoom:.55}.ro-c{max-height:34px;font-size:.95rem}.ro-tec button{height:36px}.ro-tab{gap:3px}.ro-fila{gap:4px}}
`;
    document.head.appendChild(st);
  }
  function rosaHtml(){return '<div class="ro-rosa"><i style="left:9px;top:-6px;width:12px;height:11px;background:#c9c9cf"></i><i style="left:5px;top:0;width:24px;height:22px;background:#c9c9cf"></i><i style="left:7px;top:5px;width:20px;height:20px;background:#f1c6a0"></i><i style="left:3px;top:24px;width:28px;height:30px;border-radius:9px 9px 4px 4px;background:#7b4fa3"></i><i style="left:9px;top:30px;width:16px;height:24px;border-radius:4px;background:#fff3dc"></i></div>';}
  const FILA_ESTILO=LARGO===5?"":' style="grid-template-columns:54px repeat('+LARGO+',1fr);gap:4px;font-size:.85em"';
  /* Invitación a tocar (Gonzalo, 11/11/2026; solo la primera vez y antes de escribir): Doña Rosa dice «¡Tocá las
     letras y probá!», la fila «Vos» brilla con las letras que ya se saben en verde clarito, la tecla de la primera
     letra de la clave queda marcada y una mano 👆 toca la fila y después esa tecla. Se apaga al tocar cualquier tecla. */
  let invita=false,mano=null,popVisto=false;
  const K_INVITA="gya_rosa_invita_visto";
  const sabidas=()=>{const r=Array(LARGO).fill("");CAPITULO.intentos.forEach(([,w])=>{const c=evaluar(w,CAPITULO.clave);[...w].forEach((l,i)=>{if(c[i]==="verde")r[i]=l;});});return r;};
  function apagarInvita(){if(!invita)return;invita=false;if(mano){const m=mano;mano=null;m.style.opacity="0";setTimeout(()=>m.remove(),500);}}
  function invitar(){
    if(!capa||fin||mios.length||borrador||ls.get(K_INVITA))return;
    ls.set(K_INVITA,"1");
    setTimeout(()=>{if(!capa||fin||mios.length||borrador)return;invita=true;pintar();
      const fila=capa.querySelector(".ro-fila.ro-inv"),cel=fila&&fila.querySelector(".ro-c"),tec=capa.querySelector(".ro-inv-tecla");if(!cel||!tec)return;
      const m=document.createElement("div");m.className="ro-mano";m.textContent="👆";m.style.left=(innerWidth-70)+"px";m.style.top=(innerHeight-130)+"px";document.body.appendChild(m);mano=m;
      const ir=(el,ms)=>setTimeout(()=>{if(mano!==m||!el.isConnected)return;const r=el.getBoundingClientRect();m.classList.remove("tap");m.style.left=(r.left+r.width/2-14)+"px";m.style.top=(r.top+r.height/2-4)+"px";setTimeout(()=>{if(mano===m)m.classList.add("tap");},850);},ms);
      ir(cel,700);ir(capa.querySelector(".ro-inv-tecla"),2300);
      setTimeout(()=>{if(mano===m){mano=null;m.style.opacity="0";setTimeout(()=>m.remove(),500);}},5200);
    },600);
  }
  function pintar(){
    if(!capa)return;
    const todas=CAPITULO.intentos.map(([n,w])=>({n,w,c:evaluar(w,CAPITULO.clave)})).concat(mios.map(w=>({n:"Vos",w,c:evaluar(w,CAPITULO.clave),vos:1})));
    const libres=CAPITULO.intentos.length+3-todas.length,abierto=fin==="gano";
    let filas="";
    todas.forEach(f=>{filas+='<div class="ro-fila'+(f.vos?" vos":"")+'"'+FILA_ESTILO+'><span class="n">'+f.n+'</span>'+[...f.w].map((l,i)=>'<span class="ro-c '+f.c[i]+'">'+l+'</span>').join("")+'</div>';});
    const inv=invita&&!fin&&!mios.length&&!borrador,sab=inv?sabidas():null;
    for(let k=0;k<libres;k++){const act=k===0&&!fin;filas+='<div class="ro-fila vos'+(act&&inv?" ro-inv":"")+'"'+FILA_ESTILO+'>'+(act&&inv&&sab.some(Boolean)?'<span class="ro-inv-etq">💡 Estas letras ya las sabés</span>':'')+'<span class="n">'+(act?"Vos ✍️":"Vos")+'</span>'+[...Array(LARGO).keys()].map(i=>'<span class="ro-c'+(act&&i===borrador.length?" act":"")+'">'+(act?(borrador[i]||(inv&&sab[i]?'<b class="ro-fant">'+sab[i]+'</b>':"")):"")+'</span>').join("")+'</div>';}
    const tecla=t=>'<button type="button" data-t="'+t+'"'+(inv&&t===CAPITULO.clave[0]?' class="ro-inv-tecla"':'')+'>'+t+'</button>';
    const tec=fin?"":'<div class="ro-tec"><div>'+[..."QWERTYUIOP"].map(tecla).join("")+'</div><div>'+[..."ASDFGHJKLÑ"].map(tecla).join("")+'</div><div><button type="button" class="ancho" data-t="⌫">⌫ Borrar</button>'+[..."ZXCVBNM"].map(tecla).join("")+'<button type="button" class="ancho env" data-t="OK">Probar</button></div></div>';
    /* Android (en la página liviana): primero se ofrece seguir en la app de Google Play; el navegador queda como segunda opción. */
    const seguir=ANDROID?'<p>¿Querés seguir jugando a <b>Palabra Secreta</b>? Una palabra nueva cada vez, gratis.</p><a class="ro-si" id="roPlay" href="'+URL_APP+'">▶ Seguí jugando en la app</a><p class="ro-nota">Si ya tenés la app, se abre directo con tu partida. Si no, la bajás gratis de Google Play.</p><button type="button" class="ro-no" id="roSi">Seguir en el navegador</button>'
      :'<p>¿Querés seguir jugando a <b>Palabra Secreta</b>? Una palabra nueva cada vez, gratis.</p><button type="button" class="ro-si" id="roSi">🔤 ¡Sí, quiero jugar!</button><button type="button" class="ro-no" id="roNo">Ahora no</button>';
    const sabe=fin==="perdio"&&(tienePerfil()||!!ls.get("gya_rosa_reg_pend"));
    const revela=fin==="perdio"?(sabe?'<p class="ro-revela">🤫 La palabra era <b>'+CAPITULO.clave+'</b></p>':(!ANDROID?'<button type="button" class="ro-si" id="roRevela">🤫 ¿Querés saber la palabra? Registrate</button>':'')):'';
    /* Gonzalo (11/11): el final es un cartel en el centro (antes quedaba abajo de la libreta). Aparece a los 0,7 s
       para que se vea la última fila; si se vuelve a pintar (por ejemplo después de registrarse) ya no se anima. */
    const panel=fin?'<div class="ro-pop'+(popVisto?' ya':'')+'"><div class="ro-panel"><h3>'+(abierto?(CAPITULO.ganoTitulo||"🎉 ¡Salvaste a Doña Rosa!"):"¡Casi!")+'</h3><p>'+(abierto?CAPITULO.gano:CAPITULO.perdio)+'</p>'+revela+seguir+'</div></div>':"";
    if(fin)popVisto=true;
    capa.innerHTML='<div class="ro-cab"><div><small>'+CAPITULO.titulo+'</small><b>EL ALMACÉN DE DOÑA ROSA</b></div>'+(fin?'':'<button type="button" class="ro-x env" data-t="OK">Probar</button>')+'</div>'+
      '<div class="ro-esc"><div class="ro-edif"></div><div class="ro-cartel">ALMACÉN DOÑA ROSA</div><div class="ro-toldo"></div><div class="ro-puerta"></div><div class="ro-aviso'+(abierto?" ok":"")+'">'+(abierto?"¡ABIERTO!":"CIERRA<br>PRONTO")+'</div>'+rosaHtml()+'<div class="ro-globo'+(inv?" ro-inv-globo":"")+'">'+(abierto?"¡Gracias, vecino! 💜":fin?"Ay… ¿cuál era? 😢":inv?"¡Tocá las letras y probá! 👇":verPista&&CAPITULO.pista?"💡 "+CAPITULO.pista:CAPITULO.pedido)+'</div></div>'+
      '<div class="ro-lib">'+(!fin&&CAPITULO.pista?'<button type="button" class="ro-pista'+(verPista?' si':'')+'" id="roPista">💡 Pista</button>':'')+'<span class="ro-cand">'+(CAPITULO.icono||(abierto?"🔓":"🔒"))+'</span><h4>'+(CAPITULO.hoja||"LIBRETA DEL FIADO")+'</h4>'+(CAPITULO.sub?'<p class="ro-sub">'+CAPITULO.sub+'</p>':'')+'<div class="ro-tab">'+filas+'</div></div>'+
      '<p class="ro-msj" id="roMsj">'+(fin?"":"Tenés "+libres+" intento"+(libres===1?"":"s")+". Palabra de "+LARGO+" letras.")+'</p>'+tec+(!fin&&mios.length?'<div class="ro-salir"><button type="button" class="ro-no" id="roSaltar">Saltar e ir al juego</button></div>':'')+panel;
    const sal=capa.querySelector("#roSaltar");if(sal)sal.onclick=()=>cerrar(false);
    capa.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>tecla_(b.dataset.t));
    const si=capa.querySelector("#roSi");if(si){si.onclick=()=>cerrar(true);si.focus({preventScroll:true});}
    const no=capa.querySelector("#roNo");if(no)no.onclick=()=>cerrar(false);
    const rv=capa.querySelector("#roRevela");if(rv)rv.onclick=()=>registroRapido("perdio");
    /* Pista: la dice Doña Rosa en su globo (se cuenta en el embudo). */
    const pi=capa.querySelector("#roPista");if(pi)pi.onclick=()=>{verPista=true;paso("pista");pintar();mensaje("💡 Pista: "+CAPITULO.pista);};
    const pl=capa.querySelector("#roPlay");if(pl)pl.onclick=()=>{paso("play");ls.set(K_VISTO,fin||"play");};
  }
  function mensaje(t){const m=capa&&capa.querySelector("#roMsj");if(m)m.textContent=t;}
  function tecla_(t){
    if(fin||!capa)return;
    apagarInvita();
    if(t==="⌫"){borrador=borrador.slice(0,-1);pintar();return;}
    if(t==="OK"){
      if(borrador.length<LARGO){mensaje("Faltan letras: son "+LARGO+".");return;}
      if(!valida(borrador)){mensaje("Esa palabra no está en el diccionario.");return;}
      if(!mios.length)paso("jugo");
      mios.push(borrador);borrador="";{const p=pasos();p.palabras=mios.slice();subir(p);}
      if(mios[mios.length-1]===CAPITULO.clave){fin="gano";paso("gano");}
      else if(mios.length>=3){fin="perdio";paso("perdio");
        /* Gonzalo (11/11): al que pierde, «¿Querés saber la palabra? Registrate y te la cuento». */
        if(SOLA&&!ANDROID&&!tienePerfil()&&!ls.get("gya_rosa_reg_visto")){ls.set("gya_rosa_reg_visto","1");paso("reg_ofrecido");setTimeout(()=>registroRapido("perdio"),1200);}}
      ls.set(K_VISTO,fin||"jugando");pintar();
      if(fin==="gano"){try{if(typeof sonarSFX==="function")sonarSFX("aplausos");}catch(e){}
        /* Gonzalo (08/11): al sacar Doña Rosa ya se ofrece guardar la racha (Doña Rosa cuenta como nivel 1 de Palabra Secreta). */
        /* En Android el camino principal es la app (con su cuenta): el cartel de guardar sale recién si sigue en el navegador
           (al ganar su primera palabra en Palabra Secreta). En iPhone/compu sale acá. */
        if(SOLA&&!ANDROID&&!tienePerfil()&&!ls.get("gya_rosa_reg_visto")){ls.set("gya_rosa_reg_visto","1");paso("reg_ofrecido");setTimeout(registroRapido,1200);}}
      return;
    }
    if(/^[A-ZÑ]$/.test(t)&&borrador.length<LARGO){borrador+=t;pintar();}
  }
  function teclado(e){
    if(!capa||fin||e.ctrlKey||e.metaKey||e.altKey)return;
    const k=e.key;
    if(k==="Backspace"){e.preventDefault();tecla_("⌫");}
    else if(k==="Enter"){e.preventDefault();tecla_("OK");}
    else if(/^[a-zñA-ZÑ]$/.test(k)){e.preventDefault();tecla_(k.toUpperCase());}
  }
  function cerrar(quiere){apagarInvita();
    if(!capa)return;
    document.removeEventListener("keydown",teclado,true);
    capa.remove();capa=null;ls.set(K_VISTO,fin||"salteado");
    /* Página liviana: se pasa al juego completo (index.html) y ahí sigue (perfil y Palabra Secreta). */
    if(SOLA){if(quiere){paso("quiere");ls.set(K_IR,"palabra-secreta");if(!tienePerfil()){ls.set("gya_rosa_sinperfil","1");ls.set("gya_rosa_perfil","1");}}
      document.body.style.background="#160B24";setTimeout(()=>location.replace("index.html?norosa=1"),quiere?350:50);return;}
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
      /* Si otra espera ya lo abrió (irAPalabra se puede llamar dos veces), esta se corta: si no, al crear el perfil
         más tarde volvía a abrir Palabra Secreta encima de la partida. */
      if(++n>1200||ls.get(K_IR)!=="palabra-secreta"){clearInterval(t);return;}
      if((!tienePerfil()&&!ls.get("gya_rosa_directo"))||!window.Extensiones||document.readyState!=="complete")return;
      clearInterval(t);ls.del(K_IR);ls.del("gya_rosa_directo");
      if(ls.get("gya_rosa_sinperfil")&&tienePerfil()){ls.del("gya_rosa_sinperfil");paso("registro");}
      nivelDosPalabra();setTimeout(()=>{try{Extensiones.abrirJuego("palabra-secreta");paso("palabra");}catch(e){}},400);
    },500);
  }
  function mostrar(){
    popVisto=false;estilos();capa=document.createElement("div");capa.id="rosaCapa";capa.setAttribute("role","dialog");capa.setAttribute("aria-label","El almacén de Doña Rosa");
    document.body.appendChild(capa);pintar();document.addEventListener("keydown",teclado,true);invitar();
    /* «Llegó» se cuenta apenas se muestra (08/11: el filtro «solo si se ve» dejó el número clavado desde la noche del 07/11;
       el registro crudo de rosa.html guarda visibilityState para ver si Instagram la carga por adelantado). */
    paso("llego");
  }
  /* Lo llama el inicio del juego (tutChequearBienvenida): si viene de rosa.html con «¡Sí, quiero jugar!», en vez del
     tutorial va directo a elegir nombre y avatar (si no tiene perfil) y después a Palabra Secreta. */
  function tomarInicio(){
    /* Gonzalo (08/11): los del anuncio sin perfil se iban en «Elegí tu nombre». Ahora entran directo a Palabra Secreta
       y el nombre se pide más tarde (el registro se cuenta cuando lo crean, ver vigilarRegistro). */
    if(ls.get("gya_rosa_perfil")){ls.del("gya_rosa_perfil");document.getElementById("capaBienvenida")?.classList.remove("ver");
      ls.set("gya_rosa_directo","1");irAPalabra();return true;}
    return ls.get(K_IR)==="palabra-secreta";
  }
  /* Si vino del anuncio sin perfil y lo crea más tarde (en cualquier momento de la visita), se cuenta «se registró». */
  function vigilarRegistro(){
    if(!ls.get("gya_rosa_sinperfil"))return;
    const t=setInterval(()=>{if(!ls.get("gya_rosa_sinperfil")){clearInterval(t);return;}if(tienePerfil()){ls.del("gya_rosa_sinperfil");paso("registro");clearInterval(t);}},5000);
  }
  /* Lo llama Palabra Secreta en cada palabra que prueba: así se ve quién del anuncio jugó de verdad. */
  function jugoPalabra(){const p=pasos();if(!p.llego)return;if(!p.ps_jugo)paso("ps_jugo");}
  /* Registro rápido (Gonzalo, 08/11): al que vino del anuncio y juega Palabra Secreta sin perfil, cuando adivina su
     primera palabra se le ofrece guardar la partida: nombre, país y avatar en una sola ventana. Una sola vez. */
  function ganoPalabra(){
    try{if(SOLA||tienePerfil()||!pasos().llego||ls.get("gya_rosa_reg_visto"))return;}catch(e){return;}
    ls.set("gya_rosa_reg_visto","1");paso("reg_ofrecido");setTimeout(registroRapido,1300);
  }
  /* 100 monedas de regalo de Doña Rosa al que se registra después de ganar (Gonzalo, 11/11). Una sola vez por celular:
     en la página liviana queda pendiente y lo cobra index.html al crear el perfil. */
  function cobrarRegalo(){
    try{if(!ls.get("gya_rosa_regalo_pend")||ls.get("gya_rosa_regalo_dado")||typeof meta==="undefined"||typeof guardarMeta!=="function")return;
      ls.del("gya_rosa_regalo_pend");ls.set("gya_rosa_regalo_dado","1");meta.monedas=(Number(meta.monedas)||0)+100;guardarMeta();
      try{if(typeof refrescarMonedas==="function")refrescarMonedas();}catch(e){}
      setTimeout(()=>{try{if(typeof mostrarToast==="function")mostrarToast("🎁","Doña Rosa te regaló 🪙 100 monedas para el juego.","¡Regalo!");}catch(e){}},2800);}catch(e){}
  }
  function registroRapido(modo){
    if(tienePerfil()||document.getElementById("rosaReg"))return;
    const perdio=modo==="perdio",regalo=!perdio&&!ls.get("gya_rosa_regalo_dado");
    let nombre="",pais=null,avatar=null,todos=false;
    const lista=(typeof AVATARES!=="undefined"?AVATARES:Array.from({length:21},(_,i)=>"avatar-"+String(i+1).padStart(2,"0")).concat(["avatar-33","avatar-42","avatar-43","avatar-44","avatar-45","avatar-46","avatar-47","avatar-48","avatar-49","avatar-50","avatar-51","avatar-52","avatar-53","avatar-54"])).filter(a=>a!=="avatar-22");
    const c=document.createElement("div");c.id="rosaReg";c.setAttribute("role","dialog");
    if(!document.getElementById("rosaRegEstilos")){const st=document.createElement("style");st.id="rosaRegEstilos";st.textContent=`
#rosaReg{position:fixed;inset:0;z-index:2147482500;background:#0b0614c4;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:max(16px,env(safe-area-inset-top)) 14px 16px;font-family:Outfit,system-ui,sans-serif}
#rosaReg *{box-sizing:border-box}
.rr-caja{width:100%;max-width:420px;margin-top:4vh;background:linear-gradient(#2a1846,#1c1030);border:2px solid #F5C451;border-radius:22px;padding:18px 16px 14px;color:#FCEFD2;text-align:center;box-shadow:0 20px 50px #000a}
.rr-caja h3{margin:0;font:900 1.35rem "Archivo Black",sans-serif;color:#F5C451}
.rr-caja p{margin:6px 0 12px;font:700 .95rem/1.3 Outfit;color:#E4D8EB}
.rr-nom{width:100%;background:#ffffff12;border:1px solid #ffffff2a;border-radius:14px;padding:12px;color:#fff;font:800 1.05rem Outfit;outline:none}
.rr-nom:focus{border-color:#F5C451}
.rr-lbl{margin:12px 0 6px;text-align:left;font:800 .78rem Outfit;color:#b9a8cc;letter-spacing:.5px}
.rr-paises{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.rr-paises button{padding:10px;border-radius:12px;background:#ffffff10;border:1px solid #ffffff22;color:#FCEFD2;font:800 .92rem Outfit;cursor:pointer}
.rr-paises button.si{background:#F5C45122;border-color:#F5C451}
.rr-avs{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
.rr-avs button{padding:0;border:2px solid transparent;border-radius:50%;background:#ffffff10;cursor:pointer;aspect-ratio:1;overflow:hidden}
.rr-avs button.si{border-color:#F5C451;box-shadow:0 0 0 3px #F5C45155}
.rr-avs img{width:100%;height:100%;display:block}
.rr-mas{margin-top:6px;border:0;background:none;color:#F5C451;font:800 .82rem Outfit;cursor:pointer}
.rr-msj{min-height:1.2em;margin-top:8px;font:800 .82rem Outfit;color:#ff9a9a}
.rr-ok{display:block;width:100%;margin-top:6px;border:0;border-radius:14px;padding:13px;background:linear-gradient(#ff4fa3,#E5197C);color:#fff;font:900 1.05rem Outfit;box-shadow:0 4px 0 #8E0F4C;cursor:pointer}
.rr-ok:disabled{opacity:.45;cursor:default}
.rr-no{margin-top:9px;border:0;background:none;font:800 .85rem Outfit;color:#9fb6c4;text-decoration:underline;cursor:pointer}`;document.head.appendChild(st);}
    const pintarR=()=>{
      const avs=(todos?lista:lista.slice(0,12)).map(a=>'<button type="button" data-a="'+a+'" class="'+(a===avatar?"si":"")+'"><img src="assets/avatars/'+a+'.webp" alt=""></button>').join("");
      c.innerHTML='<div class="rr-caja"><h3>'+(perdio?"🤫 ¿Querés saber la palabra?":"🎉 ¡Muy bien!")+'</h3><p>'+(perdio?"Registrate y Doña Rosa te la cuenta. Poné tu nombre, tu país y tu avatar.":regalo?"🎁 <b>Doña Rosa te regala 🪙 100 monedas</b> para el juego si te registrás ahora. Poné tu nombre, tu país y tu avatar.":"¿Guardamos tu racha? Poné tu nombre y elegí tu avatar: así no perdés tu partida.")+'</p>'+
        '<input class="rr-nom" id="rrNom" maxlength="12" placeholder="Tu nombre" autocomplete="nickname">'+
        '<div class="rr-lbl">PAÍS</div><div class="rr-paises"><button type="button" data-p="uruguay" class="'+(pais==="uruguay"?"si":"")+'">🇺🇾 Uruguay</button><button type="button" data-p="argentina" class="'+(pais==="argentina"?"si":"")+'">🇦🇷 Argentina</button></div>'+
        '<div class="rr-lbl">AVATAR</div><div class="rr-avs">'+avs+'</div>'+(todos?'':'<button type="button" class="rr-mas" id="rrMas">Ver más avatares ▾</button>')+
        '<div class="rr-msj" id="rrMsj"></div><button type="button" class="rr-ok" id="rrOk">'+TXT_OK+'</button><button type="button" class="rr-no" id="rrNo">Ahora no, sigo jugando</button></div>';
      const inp=c.querySelector("#rrNom");inp.value=nombre;inp.oninput=()=>{nombre=inp.value;listo();};
      c.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{pais=b.dataset.p;pintarR();});
      c.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{avatar=b.dataset.a;pintarR();});
      const m=c.querySelector("#rrMas");if(m)m.onclick=()=>{todos=true;pintarR();};
      c.querySelector("#rrNo").onclick=()=>c.remove();
      c.querySelector("#rrOk").onclick=guardar;listo();
    };
    const TXT_OK=perdio?"🤫 Registrarme y ver la palabra":regalo?"🎁 Registrarme y recibir 🪙 100":"💾 Guardar mi partida";
    const listo=()=>{const b=c.querySelector("#rrOk");if(b)b.disabled=!(nombre.trim()&&pais&&avatar);};
    const msj=t=>{const e=c.querySelector("#rrMsj");if(e)e.textContent=t;};
    async function guardar(){
      const n=nombre.trim().slice(0,12);if(!n||!pais||!avatar)return;
      try{if(typeof nombrePerfilAutomatico==="function"&&nombrePerfilAutomatico(n)){msj("Elegí un nombre propio, distinto de "+n+".");return;}}catch(e){}
      const b=c.querySelector("#rrOk");b.disabled=true;b.textContent="Guardando…";
      if(SOLA&&/^jugador\s*\d*$/i.test(n)){b.textContent=TXT_OK;listo();msj("Elegí un nombre propio.");return;}
      let libre=true;try{if(typeof nombrePerfilDisponible==="function")libre=await nombrePerfilDisponible(n);
        else{const sb=typeof obtenerSupa==="function"?obtenerSupa():null;if(sb){const q=await sb.from("gya_ranking").select("apodo").in("grupo",["usuarios","global"]).ilike("apodo",String(n).replace(/[\\%_]/g,"\\$&")).limit(1);libre=!(q.data&&q.data.length);}}}catch(e){}
      if(!libre){b.textContent=TXT_OK;listo();msj("Ese nombre ya lo usa otro jugador. Probá otro, por ej. "+n+"2.");return;}
      /* En la página liviana no está el juego: se guarda pendiente y index.html crea el perfil al entrar (aplicarRegistroPendiente). */
      if(regalo)ls.set("gya_rosa_regalo_pend","1");
      if(SOLA){ls.set("gya_rosa_reg_pend",JSON.stringify({n,a:avatar,p:pais}));c.remove();
        if(perdio&&capa){pintar();const g=capa.querySelector(".ro-globo");if(g)g.textContent="Era "+CAPITULO.clave+" 🤫 ¡Gracias, "+n+"!";
          setTimeout(()=>{try{const r=capa&&capa.querySelector(".ro-revela");if(r)r.scrollIntoView({block:"center",behavior:"smooth"});}catch(e){}},200);return;}
        const g=capa&&capa.querySelector(".ro-globo");if(g)g.textContent="¡Gracias, "+n+"!"+(regalo?" 🎁 Tus 100 monedas te esperan en el juego.":" 💜");return;}
      try{guardarPerfil(n,avatar,pais,"");try{mapaPaisForzado=null;sincronizarMundoActivo();}catch(e){}}catch(e){b.textContent=TXT_OK;listo();msj("No se pudo guardar, probá de nuevo.");return;}
      c.remove();if(ls.get("gya_rosa_sinperfil")){ls.del("gya_rosa_sinperfil");}paso("registro");cobrarRegalo();if(perdio&&capa)pintar();
      try{if(typeof mostrarToast==="function")mostrarToast("✅","¡Listo, "+n+"! Tu partida quedó guardada.");}catch(e){}
    }
    pintarR();document.body.appendChild(c);
  }
  /* index.html: crea el perfil que se eligió en la página liviana (cuando ya cargó todo el juego). */
  function aplicarRegistroPendiente(){
    if(SOLA||!ls.get("gya_rosa_reg_pend"))return;
    let n=0;const t=setInterval(()=>{
      if(++n>240){clearInterval(t);return;}
      if(typeof guardarPerfil!=="function"||document.readyState!=="complete")return;
      clearInterval(t);let d=null;try{d=JSON.parse(ls.get("gya_rosa_reg_pend"));}catch(e){}ls.del("gya_rosa_reg_pend");
      if(!d||!d.n||tienePerfil())return;
      try{guardarPerfil(d.n,d.a,d.p,"");try{mapaPaisForzado=null;sincronizarMundoActivo();}catch(e){}ls.del("gya_rosa_sinperfil");paso("registro");
        if(typeof mostrarToast==="function")mostrarToast("✅","¡Listo, "+d.n+"! Tu partida quedó guardada.");cobrarRegalo();}catch(e){}
    },500);
  }
  /* Doña Rosa cuenta como el nivel 1 de Palabra Secreta: el que la sacó arranca en el nivel 2 (si no había jugado). */
  function nivelDosPalabra(){
    try{if(!pasos().gano)return;if(window.PalabraSecreta&&PalabraSecreta.empezarEnNivel){PalabraSecreta.empezarEnNivel(2);return;}const K="gya_palabra_secreta";let d={};try{d=JSON.parse(localStorage.getItem(K)||"{}")||{};}catch(e){d={};}
      if((d.nivel||1)>=2||(d.jugadas||0)>0)return;
      d.nivel=2;d.partidaNivel=null;d.ganadas=Math.max(1,d.ganadas||0);d.jugadas=Math.max(1,d.jugadas||0);d.racha=Math.max(1,d.racha||0);d.mejorRacha=Math.max(1,d.mejorRacha||0);
      localStorage.setItem(K,JSON.stringify(d));}catch(e){}
  }
  function arrancar(){
    if(SOLA){mostrar();const ya=()=>setTimeout(precargarJuego,1500);if(document.readyState==="complete")ya();else window.addEventListener("load",ya);return;}
    if(q.get("norosa")==="1"){try{q.delete("norosa");const t=q.toString();history.replaceState(null,"",location.pathname+(t?"?"+t:""));}catch(e){}}
    aplicarRegistroPendiente();irAPalabra();vigilarRegistro();
    /* Si llegó por el anuncio y después se hizo el perfil, se anota su nombre. */
    setTimeout(()=>{const p=pasos();if(p.llego&&tienePerfil()&&p.nombre!==perfil.nombre)subir(p);},4000);
    if(!fuente||location.search.indexOf("norosa")>=0)return;
    /* Normalmente el que viene del anuncio ya pasó por rosa.html (redirección al principio de index.html); esto queda por las dudas. */
    const visto=ls.get(K_VISTO);if(visto&&fuente!=="link")return;
    mostrar();
  }
  window.DonaRosa={resumen,tomarInicio,jugoPalabra,ganoPalabra,registroRapido,mostrar:()=>{if(!capa){mios=[];borrador="";fin=null;mostrar();}}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrancar);else arrancar();
})();
