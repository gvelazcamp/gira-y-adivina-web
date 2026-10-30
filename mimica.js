/* Mímica rioplatense: dos equipos sobre un escenario. Las frases salen mezcladas e
   intercaladas (una fácil, una media, una difícil…) y cada una vale 1 punto (31/10/2026); el que actúa la hace sin hablar y su equipo adivina; el reloj corre todo el turno. Gana el primero que llega a
   la meta (al cerrar la vuelta, así los dos jugaron lo mismo).
   Pantalla fija (PantallaFija). Datos en gya_mimica. */
/* Frase de mímica acortada: sin "un, una, el, la, los, las, al" (ni "a" en el medio). Compartida con la tele (tele.js). */
window.mimicaCortas=lista=>{const ART=new Set(["UN","UNA","UNOS","UNAS","EL","LA","LOS","LAS","AL"]);
  /* Las películas y series (el principio de MIMICA_MEDIA, hasta los deportes) quedan con su nombre completo: «El Padrino». */
  const media=window.MIMICA_MEDIA||[],corte=media.indexOf("SALTO CON GARROCHA"),titulos=new Set(media.slice(0,corte>0?corte:32));
  return [...new Set((lista||[]).map(t=>{t=String(t).trim();return titulos.has(t)?t:t.split(/\s+/).filter((w,i)=>!ART.has(w)&&!(i>0&&w==="A")).join(" ");}))].filter(t=>t&&t.split(" ").length<=3);};
/* Mazo mezclado e intercalado: una fácil, una media, una difícil… (sin elegir dificultad). Lo usa también la tele. */
window.mimicaMazo=()=>{const mez=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const ms=[window.MIMICA_FRASES,window.MIMICA_MEDIA,window.MIMICA_DIFICIL].map(l=>{const todas=window.mimicaCortas(l),libres=Vistas.filtrar("mimica",todas,x=>x);return mez(libres).concat(mez(todas.filter(x=>!libres.includes(x))));});
  const out=[],n=Math.max(...ms.map(m=>m.length));for(let i=0;i<n;i++)ms.forEach(m=>{if(i<m.length)out.push(m[i]);});return out;};
const Mimica=(()=>{
  const CLAVE="gya_mimica",TIEMPOS=[45,60],METAS=[5,10,15];
  const COLORES=["#FF4D6D","#3D8BFF"],POR_DEF=["Rojos","Azules"];
  let raiz=null,equipos=["",""],tiempo=60,meta=10,partidas=0;
  let pts=[0,0],turno=0,turnos=0,mazo=[],idx=0,hechas=[],fin=0,timer=0,jugando=false,bloqueo=0,actual=null;
  function cargar(){try{const d=JSON.parse(localStorage.getItem(CLAVE));if(d&&typeof d==="object"){if(Array.isArray(d.equipos))equipos=[String(d.equipos[0]||""),String(d.equipos[1]||"")];if(TIEMPOS.includes(d.tiempo))tiempo=d.tiempo;if(METAS.includes(d.meta))meta=d.meta;else meta=10;partidas=Number(d.partidas)||0;}}catch(e){}}
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify({equipos,tiempo,meta,partidas}));}catch(e){}}
  cargar();
  const q=id=>raiz.querySelector("#"+id);
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
  const nom=i=>(equipos[i]||"").trim()||POR_DEF[i];
  const mezclar=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const sonar=(f,d,t,v)=>{if(typeof bip==="function")bip(f,d,t,v);};
  const vib=n=>{if(typeof vibrar==="function")vibrar(n);};
  /* Arte en assets/mimica/ (hoja de ChatGPT recortada), tema teatro. */
  const src=n=>"assets/mimica/"+n+".webp";
  const img=(n,c)=>`<img class="${c}" src="${src(n)}" alt="" draggable="false">`;
  function abrir(contenedor){salir();cargar();raiz=document.createElement("section");raiz.className="mim";contenedor.appendChild(raiz);
    PantallaFija.bienvenida(contenedor,{logo:src("logo"),alt:"Mímica rioplatense",items:[["👥","Dos equipos: uno <b>actúa sin hablar</b> y su equipo adivina."],["🃏","Salen frases cortas mezcladas: cada una que adivinan vale <b>1 punto</b>."],["✔️","Si adivinan sale otra; si se traban, <b>Pasar</b> (no suma)."],["🏆","Gana el primer equipo que llega a los <b>puntos elegidos</b>."]]});
    ["fondo","foco","accion","aplausos","pasar","telon","trofeo"].forEach(n=>{const i=new Image();i.src=src(n);});
    configurar();}
  function configurar(){
    parar();PantallaFija.desactivar();
    raiz.innerHTML=`<div class="mim-escena"><div class="mim-telon"></div>
      <div class="mim-cartel">${img("como","mim-como-img")}<p>Actuá <b>sin hablar</b>. Tu equipo adivina.</p></div>
      <div class="mg-panel mim-caja"><div class="qs-sub">👥 Equipos</div>
      <div class="mim-equipos">${[0,1].map(i=>`<label class="mim-eq" style="--c:${COLORES[i]}"><i></i><input id="mimE${i}" maxlength="14" placeholder="${POR_DEF[i]}" value="${esc(equipos[i])}"></label>`).join("")}</div>
      <div class="qs-sub">⏱️ Tiempo por turno</div>
      <div class="qns-rangos imp-dos" id="mimT">${TIEMPOS.map(t=>`<button type="button" data-v="${t}">${t} s</button>`).join("")}</div>
      <div class="qs-sub">🏆 Gana el que llega a</div>
      <div class="qns-rangos" id="mimM">${METAS.map(m=>`<button type="button" data-v="${m}">${m} pts</button>`).join("")}</div>
      <button type="button" class="mg-principal" id="mimEmpezar">🎭 Abrir el telón</button>
      <div class="mim-dos"><button type="button" id="mimComo">❓ Cómo se juega</button><button type="button" id="mimWpp">💬 Invitar</button></div>
      <div class="mim-como" id="mimComoTxt" hidden><ol><li>Pasale el celular al que actúa; su equipo no mira.</li><li>Le sale una frase corta al azar: si la adivinan, suma 1 punto.</li><li>La actúa sin hablar ni señalar cosas. Si adivinan, ✔ y sale otra.</li><li>Si se traba, <b>Pasar</b> (no suma) y sale otra.</li><li>Cuando suena el tiempo, le toca al otro equipo.</li></ol></div></div></div>`;
    const pintar=()=>{raiz.querySelectorAll("#mimT button").forEach(b=>b.classList.toggle("activo",Number(b.dataset.v)===tiempo));raiz.querySelectorAll("#mimM button").forEach(b=>b.classList.toggle("activo",Number(b.dataset.v)===meta));};pintar();
    [0,1].forEach(i=>q("mimE"+i).oninput=e=>{equipos[i]=e.target.value;guardar();});
    q("mimT").onclick=e=>{const b=e.target.closest("button[data-v]");if(b){tiempo=Number(b.dataset.v);guardar();pintar();}};
    q("mimM").onclick=e=>{const b=e.target.closest("button[data-v]");if(b){meta=Number(b.dataset.v);guardar();pintar();}};
    q("mimComo").onclick=()=>{const c=q("mimComoTxt");c.hidden=!c.hidden;};
    q("mimEmpezar").onclick=empezar;
    q("mimWpp").onclick=()=>PantallaFija.invitar("mimica","Mímica rioplatense");
  }
  function empezar(){
    /* Frases cortas y sin artículos ("CEBAR MATE", "TENDER ROPA"), hasta 3 palabras: igual que en la tele (Gonzalo, 31/10/2026). */
    mazo=window.mimicaMazo();
    idx=0;pts=[0,0];turno=0;turnos=0;PantallaFija.activar();previa();
  }
  function pantalla(html,clase){raiz.innerHTML=`<div class="qns-pantalla imp-juego mim-escena ${clase||""}" style="--c:${COLORES[turno]}"><button type="button" class="pf-salir" id="mimSalir">✕ Salir</button>${html}</div>`;PantallaFija.confirmar(q("mimSalir"),configurar);}
  const marcador=()=>`<div class="mim-marcador">${[0,1].map(i=>`<div class="${i===turno?"activo":""}" style="--c:${COLORES[i]}"><span>${esc(nom(i))}</span><b>${pts[i]}</b><i style="width:${Math.min(100,pts[i]/meta*100)}%"></i></div>`).join("")}</div>`;
  const anillo=()=>`<div class="mim-reloj"><svg viewBox="0 0 120 120"><circle class="kar-aro" cx="60" cy="60" r="52"/><circle class="kar-avance" id="mimAro" cx="60" cy="60" r="52" stroke-dasharray="326.7" stroke-dashoffset="0"/></svg><b id="mimReloj">${Math.max(0,Math.ceil((fin-Date.now())/1000))}</b></div>`;
  function previa(){
    pantalla(`<div class="mim-telon"></div><div class="imp-centro">${marcador()}
      <div class="mim-foco">${img("foco","mim-foco-img")}<div class="imp-quien">Sube al escenario</div><div class="imp-nombre mim-eqnom">${esc(nom(turno))}</div></div>
      <p class="imp-ayuda">Pasale el celular al que actúa. Que su equipo <b>no mire</b> la pantalla.<br>Tienen <b>${tiempo} segundos</b>.</p>
      <button type="button" class="bb-pasar mim-listo" id="mimVer">${img("accion","mim-btn-img")}¡Acción!</button></div>`,"mim-previa");
    q("mimVer").onclick=()=>{hechas=[];jugando=true;fin=Date.now()+tiempo*1000;elegir();reloj();};
  }
  function elegir(){mostrar();}
  function mostrar(){
    if(!mazo.length)return;
    actual={t:mazo[idx%mazo.length]};idx++;
    const t=actual.t,tam=t.length>30?"min(7.5vw,1.9rem)":t.length>20?"min(8.5vw,2.2rem)":t.length>12?"min(10vw,2.7rem)":"min(13vw,3.3rem)";
    pantalla(`<div class="mim-tope">${anillo()}<div><small>${esc(nom(turno))}</small><b>+${hechas.filter(h=>h.ok).length}</b></div></div>
      <div class="imp-centro mim-centro"><div class="mim-carta-abierta n0">
      <div class="mim-frase" style="font-size:${tam}">${esc(t)}</div><small>Sin hablar · sin señalar cosas</small></div>
      <div class="mim-btns"><button type="button" class="bb-pasar imp-gris" id="mimPasar">${img("pasar","mim-btn-img")}Pasar</button><button type="button" class="bb-pasar mim-ok" id="mimOk">${img("aplausos","mim-btn-img")}¡Adivinaron! +1</button></div></div>`,"mim-jugando");
    q("mimPasar").addEventListener("pointerdown",e=>{e.preventDefault();responder(false);});
    q("mimOk").addEventListener("pointerdown",e=>{e.preventDefault();responder(true);});
    pintarReloj();
  }
  function responder(ok){
    if(!jugando||!actual||Date.now()<bloqueo)return;bloqueo=Date.now()+400;
    const p=1;hechas.push({t:actual.t,pts:p,ok});Vistas.marcar("mimica",actual.t);
    if(ok){pts[turno]+=p;sonar(660,.15,"sine",.06);sonar(990,.22,"triangle",.04);vib(30);}else vib(15);
    elegir();
  }
  function pintarReloj(){
    if(!raiz)return;const quedan=Math.max(0,(fin-Date.now())/1000),r=Math.ceil(quedan),el=q("mimReloj"),aro=q("mimAro");
    if(el){el.textContent=r;if(r<=5&&r>0&&el.dataset.u!==String(r)){el.dataset.u=String(r);if(!pintarReloj.u||pintarReloj.u!==r){pintarReloj.u=r;sonar(880,.07);}}}
    if(aro){aro.style.strokeDashoffset=String(326.7*(1-quedan/tiempo));aro.classList.toggle("urgente",quedan<=10);}
  }
  function reloj(){
    if(!raiz||!jugando)return;pintarReloj();
    if(fin-Date.now()<=0){finTurno();return;}
    timer=setTimeout(reloj,150);
  }
  function finTurno(){
    jugando=false;clearTimeout(timer);turnos++;pintarReloj.u=0;
    sonar(523,.12);setTimeout(()=>sonar(392,.25),140);vib(200);
    const n=hechas.filter(h=>h.ok).length;
    const gano=turnos%2===0&&(pts[0]>=meta||pts[1]>=meta)&&pts[0]!==pts[1]?(pts[0]>pts[1]?0:1):-1;
    if(gano>=0){ganador(gano);return;}
    pantalla(`<div class="mg-panel imp-panel imp-fin mim-resumen">${img("telon","mim-final-img")}<h3>¡Se cierra el telón!</h3><p><b>${esc(nom(turno))}</b> sumó <b>${n}</b> ${n===1?"punto":"puntos"}.</p>
      ${hechas.length?`<ul class="mim-lista">${hechas.map(h=>`<li class="${h.ok?"ok":"no"}">${esc(h.t)}<em>${h.ok?"+1":"pasó"}</em></li>`).join("")}</ul>`:`<p class="imp-ayuda">No llegaron a adivinar ninguna.</p>`}
      ${marcador()}<p class="imp-ayuda">Gana el primero que llega a ${meta} puntos.</p>
      <button type="button" class="mg-principal" id="mimSig">▶ Le toca a ${esc(nom(1-turno))}</button></div>`);
    q("mimSig").onclick=()=>{turno=1-turno;previa();};
  }
  function ganador(g){
    partidas++;guardar();turno=g;
    [523,659,784,1047].forEach((f,i)=>setTimeout(()=>sonar(f,.22,"triangle",.05),i*140));
    pantalla(`<div class="mg-panel imp-panel imp-fin">${img("trofeo","mim-final-img")}<h3>¡Ganaron los ${esc(nom(g))}!</h3><p class="imp-ayuda">Aplausos de pie 👏</p>
      <ol class="kar-podio">${[g,1-g].map((i,k)=>`<li><span>${k+1}</span><i style="--c:${COLORES[i]}">${esc(nom(i)[0].toUpperCase())}</i><b>${esc(nom(i))}</b><em>${pts[i]} pts</em></li>`).join("")}</ol>
      <button type="button" class="mg-principal" id="mimRevancha">🔄 Revancha</button><button type="button" id="mimCambiar">⚙️ Cambiar equipos</button></div>`);
    q("mimRevancha").onclick=empezar;q("mimCambiar").onclick=configurar;
  }
  function parar(){jugando=false;clearTimeout(timer);}
  function salir(){parar();if(raiz)PantallaFija.salir();if(raiz)raiz.remove();raiz=null;}
  return{abrir,salir,partidasJugadas:()=>{cargar();return partidas;}};
})();
window.Mimica=Mimica;
