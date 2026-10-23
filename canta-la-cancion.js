/* Canta la Canción (karaoke): aparece una palabra y el jugador de turno
   canta un pedacito de una canción que la tenga hasta que se acaba el
   tiempo (o toca "Terminé"). Después el jurado (los demás) vota 👍/👎:
   mayoría (empate vale) suma 1 punto. Se graba el canto (MediaRecorder)
   para que el jurado lo escuche de nuevo antes de votar; si sale mudo (se mide
   el volumen) no se ofrece. Mientras se canta no
   hay sonidos (cortan el micrófono en Android): el tic-tac va con vibración.
   Se juegan N vueltas y gana el que suma más. Pantalla fija (PantallaFija). Datos en gya_canta. */
const CantaLaCancion=(()=>{
  const CLAVE="gya_canta",TIEMPOS=[15,20,30],VUELTAS=[2,3,5];
  const ANDROID=/Android/i.test(navigator.userAgent||"");
  const GRABA=!!(window.MediaRecorder&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
  let raiz=null,est={cant:3,nombres:[]},tiempo=20,vueltas=3,partidas=0;
  let pts=[],turno=0,jugados=0,mazo=[],idx=0,palabra="",fin=0,timer=0,jugando=false,bloqueo=0,ronda=0,volMax=0,votos={},grab=null,flujo=null,audioURL="",audio=null,medidor=null;
  function cargar(){try{const d=JSON.parse(localStorage.getItem(CLAVE));if(d&&typeof d==="object"){est.cant=Math.min(12,Math.max(2,Number(d.cant)||3));est.nombres=Array.isArray(d.nombres)?d.nombres.map(String):[];if(TIEMPOS.includes(d.tiempo))tiempo=d.tiempo;if(VUELTAS.includes(d.vueltas))vueltas=d.vueltas;partidas=Number(d.partidas)||0;}}catch(e){}}
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify({cant:est.cant,nombres:est.nombres,tiempo,vueltas,partidas}));}catch(e){}}
  cargar();
  const q=id=>raiz.querySelector("#"+id);
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
  const nom=i=>PantallaFija.nombreJugador(est,i);
  const mezclar=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const sonar=(f,d,t,v)=>{if(typeof bip==="function")bip(f,d,t,v);};
  const iniciales=i=>nom(i).split(" ").map(x=>x[0]||"").join("").slice(0,2).toUpperCase();
  const COLORES=["#E5197C","#1F6FB2","#1E9B7A","#F5B301","#7B3FE4","#FF6B3D","#00A8B5","#C2185B","#5C6BC0","#43A047","#8D6E63","#EC407A"];
  const ficha=(i,extra="")=>`<span class="kar-ficha ${extra}" style="--c:${COLORES[i%COLORES.length]}"><i>${esc(iniciales(i))}</i><b>${esc(nom(i))}</b><em>${pts[i]||0}</em></span>`;

  /* Arte en assets/canta/ (hoja de ChatGPT recortada), tema karaoke. */
  const src=n=>"assets/canta/"+n+".webp";
  const img=(n,c)=>`<img class="${c}" src="${src(n)}" alt="" draggable="false">`;
  function abrir(contenedor){salir();cargar();raiz=document.createElement("section");raiz.className="kar";contenedor.appendChild(raiz);
    PantallaFija.bienvenida(contenedor,{logo:src("logo"),alt:"Canta la Canción",items:[["🎤","Sale una palabra: <b>cantá un pedacito</b> de una canción que la tenga."],["⏱️","Cantás hasta que termina el <b>tiempo</b> o tocás <b>Terminé</b>."],["👍","El <b>jurado</b> (los demás) vota si valió. Empate vale."],["🏆","Gana el que suma <b>más puntos</b>."]]});
    ["micro","fondo","jurado","arriba","abajo","parlante","vale","novale","trofeo","crono"].forEach(n=>{const i=new Image();i.src=src(n);});
    configurar();}
  function configurar(){
    parar();PantallaFija.desactivar();
    raiz.innerHTML=`<div class="mg-panel imp-panel kar-panel">${img("como","kar-como")}
      <p>Sale una palabra y tenés que <b>cantar un pedacito de una canción</b> que la tenga. Cuando termina el tiempo, <b>el jurado</b> (los demás) vota si valió.${GRABA?" Se graba lo que cantás para que el jurado lo escuche de nuevo.":""}</p>
      <div class="qs-sub">👥 Jugadores</div><div id="ctaJug"></div>
      <div class="qs-sub">${img("crono","kar-ico")} Tiempo para cantar</div>
      <div class="qns-rangos" id="ctaT">${TIEMPOS.map(t=>`<button type="button" data-v="${t}">${t} s</button>`).join("")}</div>
      <div class="qs-sub">🔁 Vueltas</div>
      <div class="qns-rangos" id="ctaV">${VUELTAS.map(t=>`<button type="button" data-v="${t}">${t} vueltas</button>`).join("")}</div>
      <button type="button" class="mg-principal" id="ctaEmpezar">🎤 Empezar</button>
      <button type="button" id="ctaWpp">💬 Invitar por WhatsApp</button></div>`;
    PantallaFija.editorJugadores(q("ctaJug"),est,{min:2,max:12,alCambiar:guardar});
    const pintar=()=>{
      raiz.querySelectorAll("#ctaT button").forEach(b=>b.classList.toggle("activo",Number(b.dataset.v)===tiempo));
      raiz.querySelectorAll("#ctaV button").forEach(b=>b.classList.toggle("activo",Number(b.dataset.v)===vueltas));
    };pintar();
    q("ctaT").onclick=e=>{const b=e.target.closest("button[data-v]");if(b){tiempo=Number(b.dataset.v);guardar();pintar();}};
    q("ctaV").onclick=e=>{const b=e.target.closest("button[data-v]");if(b){vueltas=Number(b.dataset.v);guardar();pintar();}};
    q("ctaEmpezar").onclick=empezar;
    q("ctaWpp").onclick=()=>PantallaFija.invitar("canta-la-cancion","Canta la Canción");
  }
  function empezar(){
    const todas=window.CANTA_PALABRAS||[];const libres=Vistas.filtrar("canta",todas,x=>x);
    mazo=mezclar(libres).concat(mezclar(todas.filter(x=>!libres.includes(x))));idx=0;
    pts=Array(est.cant).fill(0);turno=0;jugados=0;
    PantallaFija.activar();previa();
  }
  function pantalla(html,clase=""){raiz.innerHTML=`<div class="qns-pantalla kar-escena ${clase}"><button type="button" class="pf-salir" id="ctaSalir">✕ Salir</button>${html}</div>`;PantallaFija.confirmar(q("ctaSalir"),configurar);}
  const marcador=()=>`<div class="kar-marcador">${pts.map((_,i)=>ficha(i,i===turno?"activa":"")).join("")}</div>`;
  function previa(){
    const vuelta=Math.floor(jugados/est.cant)+1;
    pantalla(`<div class="kar-centro">
      <div class="kar-vuelta">Vuelta ${vuelta} de ${vueltas}</div>
      <div class="kar-turno" style="--c:${COLORES[turno%COLORES.length]}"><i>${esc(iniciales(turno))}</i></div>
      <div class="kar-le">Le toca cantar a</div><div class="kar-nombre">${esc(nom(turno))}</div>
      <p class="kar-ayuda">Tocá el micrófono y cantá un pedacito de una canción con la palabra. Tenés <b>${tiempo} s</b>; si terminás antes, tocá <b>Terminé</b>.</p>
      <button type="button" class="kar-mic" id="ctaListo" aria-label="Empezar a cantar">${img("micro","kar-mic-img")}</button>
      ${marcador()}</div>`);
    q("ctaListo").onclick=jugar;
  }
  function jugar(){
    palabra=mazo[idx%mazo.length];idx++;Vistas.marcar("canta",palabra);jugando=true;bloqueo=Date.now()+700;
    const C=2*Math.PI*54;
    pantalla(`<div class="kar-centro">
      <div class="kar-le">🎤 ${esc(nom(turno))} · cantá una canción con</div>
      <div class="kar-cartel"><span>${esc(palabra)}</span></div>
      <div class="kar-reloj">${img("crono","kar-crono")}<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="kar-aro"/><circle cx="60" cy="60" r="54" class="kar-avance" id="ctaAro" style="stroke-dasharray:${C};stroke-dashoffset:0"/></svg><b id="ctaReloj">${tiempo}</b></div>
      <div class="kar-eq" id="ctaEq"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="kar-oido" id="ctaOido">${GRABA?"🔴 Grabando… cantá tranquilo hasta el final":"Cantá tranquilo hasta el final"}</div>
      <button type="button" class="bb-pasar imp-gris kar-termine" id="ctaFin">✋ Terminé</button></div>`,"cantando");
    q("ctaFin").addEventListener("pointerdown",e=>{e.preventDefault();if(Date.now()>=bloqueo)terminar();});
    fin=Date.now()+tiempo*1000;
    audioURL&&URL.revokeObjectURL(audioURL);audioURL="";ronda++;
    if(GRABA){prenderMedidor();grabarAudio();}
    reloj();
  }
  /* Grabación del canto para que el jurado lo escuche de nuevo. */
  function grabarAudio(){
    audioURL&&URL.revokeObjectURL(audioURL);audioURL="";const trozos=[];
    navigator.mediaDevices.getUserMedia({audio:true}).then(st=>{
      if(!jugando){st.getTracks().forEach(t=>t.stop());return;}
      flujo=st;try{grab=new MediaRecorder(st);}catch(e){st.getTracks().forEach(t=>t.stop());flujo=null;return;}
      grab.ondataavailable=e=>{if(e.data&&e.data.size)trozos.push(e.data);};
      volMax=0;medirVolumen(st);
      const mia=ronda;
      grab.onstop=()=>{if(mia!==ronda)return;
        if(!(trozos.length&&volMax>=0.01))return;
        audioURL=URL.createObjectURL(new Blob(trozos,{type:trozos[0].type||"audio/webm"}));
        const b=raiz&&raiz.querySelector("#ctaOir");if(b)b.hidden=false;
      };
      grab.start();
    }).catch(()=>{const o=raiz&&raiz.querySelector("#ctaOido");if(o)o.textContent="🎤 Sin permiso de micrófono: el jurado decide igual";});
  }
  /* Si otra app se quedó con el micrófono la grabación sale muda: se mide el
     volumen para no ofrecer un audio vacío. */
  /* El medidor se prende en el toque del micrófono: fuera de un toque el
     celular lo deja dormido y mediría todo en silencio. */
  function prenderMedidor(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!medidor)medidor=new AC();if(medidor.state==="suspended")medidor.resume();}catch(e){}}
  function medirVolumen(st){
    try{if(!medidor||medidor.state!=="running"){volMax=1;return;}
      const fuente=medidor.createMediaStreamSource(st),an=medidor.createAnalyser();an.fftSize=1024;fuente.connect(an);
      const datos=new Float32Array(an.fftSize);
      const paso=()=>{if(!flujo){try{fuente.disconnect();}catch(e){}return;}an.getFloatTimeDomainData(datos);let m=0;for(const v of datos)m=Math.max(m,Math.abs(v));volMax=Math.max(volMax,m);setTimeout(paso,150);};paso();
    }catch(e){volMax=1;}
  }
  function pararGrabacion(){try{if(grab&&grab.state!=="inactive")grab.stop();}catch(e){}grab=null;if(flujo){flujo.getTracks().forEach(t=>t.stop());flujo=null;}}
  function reloj(){
    if(!raiz||!jugando)return;
    const quedan=Math.max(0,fin-Date.now()),r=Math.ceil(quedan/1000),el=q("ctaReloj"),aro=q("ctaAro");
    if(aro){const C=2*Math.PI*54;aro.style.strokeDashoffset=String(C*(1-quedan/(tiempo*1000)));aro.classList.toggle("urgente",r<=5);}
    if(el&&el.textContent!==String(r)){el.textContent=r;if(r<=5&&r>0&&typeof vibrar==="function")vibrar(20);}
    if(quedan<=0){terminar();return;}
    timer=setTimeout(reloj,100);
  }
  /* Fin del canto: el jurado (los demás) vota si vale. */
  function terminar(){
    if(!jugando)return;
    jugando=false;clearTimeout(timer);pararGrabacion();const eq=q("ctaEq");if(eq)eq.classList.add("quieto");
    setTimeout(()=>{sonar(523,.12);setTimeout(()=>sonar(392,.2),140);},ANDROID?150:0);
    votos={};
    const jueces=pts.map((_,i)=>i).filter(i=>i!==turno);
    pantalla(`<div class="kar-centro">
      <div class="kar-vuelta">Vuelta ${Math.floor(jugados/est.cant)+1} de ${vueltas} · canta ${turno+1} de ${est.cant}</div>
      ${img("jurado","kar-jurado-img")}<div class="kar-veredicto">¿Vale?</div>
      <div class="kar-le">${esc(nom(turno))} tenía que cantar</div><div class="kar-cartel chico"><span>${esc(palabra)}</span></div>
      <button type="button" class="kar-oir" id="ctaOir" ${audioURL?"":"hidden"}>${img("parlante","kar-ico")} Escuchar de nuevo</button>
      <div class="kar-le">Jurado: ¿era una canción con la palabra?</div>
      <div class="kar-jurado">${jueces.map(i=>`<div class="kar-juez" data-i="${i}" style="--c:${COLORES[i%COLORES.length]}"><i>${esc(iniciales(i))}</i><b>${esc(nom(i))}</b><button type="button" data-v="1" aria-label="Vale">${img("arriba","kar-voto")}</button><button type="button" data-v="0" aria-label="No vale">${img("abajo","kar-voto")}</button></div>`).join("")}</div>
      <p class="kar-ayuda">Cada uno del jurado toca 👍 o 👎. Cuando votan todos, sigue el juego (gana la mayoría; empate vale).</p>
      ${marcador()}</div>`);
    q("ctaOir").onclick=()=>{if(!audioURL)return;if(audio){audio.pause();}audio=new Audio(audioURL);audio.play().catch(()=>{});};
    raiz.querySelectorAll(".kar-juez button").forEach(b=>b.onclick=()=>{
      const j=b.closest(".kar-juez"),i=Number(j.dataset.i);votos[i]=b.dataset.v==="1";
      j.querySelectorAll("button").forEach(x=>x.classList.toggle("activo",x===b));
      if(Object.keys(votos).length===jueces.length)setTimeout(()=>{if(raiz&&raiz.querySelector(".kar-jurado"))veredicto();},450);
    });
  }
  function veredicto(){
    if(audio){audio.pause();audio=null;}
    const v=Object.values(votos),si=v.filter(Boolean).length,ok=si>=v.length-si;
    if(ok){sonar(660,.15,"sine",.07);sonar(990,.25,"triangle",.05);if(typeof vibrar==="function")vibrar(40);pts[turno]++;}
    else{if(typeof sonidoErrorExt==="function")sonidoErrorExt();if(typeof vibrar==="function")vibrar([60,40,60]);}
    jugados++;
    const ultimo=jugados>=est.cant*vueltas;
    pantalla(`<div class="kar-centro">
      ${img(ok?"vale":"novale","kar-resultado")}<div class="kar-veredicto ${ok?"bien":"mal"}">${ok?"¡Vale!":"No vale"}</div>
      <div class="kar-le">El jurado votó ${si} 👍 · ${v.length-si} 👎</div><div class="kar-cartel chico"><span>${esc(palabra)}</span></div>
      <p class="kar-ayuda"><b>${esc(nom(turno))}</b> ${ok?"suma 1 punto.":"no suma."}</p>
      ${marcador()}
      <button type="button" class="bb-pasar" id="ctaSig">${ultimo?"🏆 Ver ganador":"Siguiente ➜"}</button></div>`,ok?"festeja":"");
    q("ctaSig").onclick=()=>{if(ultimo){ganador();return;}turno=(turno+1)%est.cant;previa();};
  }
  function ganador(){
    partidas++;guardar();
    const orden=pts.map((p,i)=>[i,p]).sort((a,b)=>b[1]-a[1]);
    const top=orden[0][1],ganan=orden.filter(o=>o[1]===top).map(o=>nom(o[0]));
    [523,659,784,1047].forEach((f,i)=>setTimeout(()=>sonar(f,.22,"triangle",.05),i*140));
    pantalla(`<div class="kar-centro">
      ${img("trofeo","kar-resultado")}<div class="kar-veredicto bien">${ganan.length>1?"¡Empate!":"¡Ganó!"}</div>
      <div class="kar-nombre">${esc(ganan.join(" y "))}</div>
      <ol class="kar-podio">${orden.map(([i,p],k)=>`<li style="--c:${COLORES[i%COLORES.length]}"><span>${k+1}</span><i>${esc(iniciales(i))}</i><b>${esc(nom(i))}</b><em>${p} ${p===1?"punto":"puntos"}</em></li>`).join("")}</ol>
      <button type="button" class="bb-pasar" id="ctaRevancha">🔄 Revancha</button>
      <button type="button" class="bb-pasar imp-gris" id="ctaCambiar">⚙️ Cambiar jugadores</button></div>`,"festeja");
    q("ctaRevancha").onclick=empezar;q("ctaCambiar").onclick=configurar;
  }
  function parar(){jugando=false;clearTimeout(timer);pararGrabacion();if(audio){audio.pause();audio=null;}}
  function salir(){parar();if(raiz)PantallaFija.salir();if(raiz)raiz.remove();raiz=null;}
  return{abrir,salir,partidasJugadas:()=>{cargar();return partidas;}};
})();
window.CantaLaCancion=CantaLaCancion;
