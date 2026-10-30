/* El Trato Sucio — versión de prueba contra bots, solo Gonzalo (30/10/2026).
   Reglas de IDEA_TRATO_SUCIO.md: situación con 4 opciones → carta secreta
   (LEAL / SABOTEADOR con misión) → primer voto → debate (los bots charlan)
   → pacto = opción más apoyada → voto final (pacto cumplido solo si votan
   todos igual) → pistas de Giro → acusación → revelación y puntos.
   Se juega en un solo celular: "Vos" contra 3–7 bots. Cada paso trae un
   cartel 📖 que explica qué está pasando, para entender la mecánica. */
const TratoSucio=(()=>{
  const CLAVE="gya_trato",RONDAS=6,MISION=2,T_DEBATE=40;
  const G="presentacion-y-locucion-extensiones/Giro/";
  const POSE={saluda:"Giro_saludando",tarjetas:"Giro_tarjetas",suspenso:"Giro_suspenso",sorprendido:"Giro_sorprendido",festeja:"Giro_festejando",confundido:"Giro_confundido",senala:"Giro_senalando_derecha"};
  const NOMBRES_BOT=["Martín","Lucía","Pedro","Ana","Sofía","José","Chela","Tito","Romi","Facu"];
  const L="ABCD";
  const SIT=[
    {id:"isla",t:"Están atrapados en una isla desierta. Solo pueden llevarse una cosa. ¿Qué eligen?",o:["Agua potable","Encendedor","Teléfono satelital","Botiquín"]},
    {id:"viaje",t:"Ganaron un viaje para dos, pero el grupo es más grande. ¿Qué hacen?",o:["Sortearlo","Dárselo a los organizadores","Que vayan los que nunca viajaron","Venderlo y hacer un asado"]},
    {id:"cita",t:"Un amigo les escribe: está en una cita desastrosa y pide rescate. ¿Qué hacen?",o:["Llamarlo con una urgencia falsa","Ir a buscarlo","Mandarle una excusa por mensaje","Que se arregle solo"]},
    {id:"asado",t:"Se quemó el asado y llegan los invitados en 10 minutos. ¿Qué hacen?",o:["Pedir pizza","Servirlo igual con mucho chimichurri","Culpar al parrillero","Hacer fideos de apuro"]},
    {id:"herencia",t:"Una tía lejana les deja una casa vieja en el campo. ¿Qué hacen con ella?",o:["Venderla","Hacerla casa de fin de semana","Alquilarla a turistas","Abrir un almacén de campo"]},
    {id:"apagon",t:"Hay un apagón en todo el barrio justo en la final del Mundial. ¿Qué hacen?",o:["Escucharlo por la radio a pilas","Ir a un bar con generador","Mirarlo en el celular con 10% de batería","Ir a la casa de un vecino con luz"]},
    {id:"billetera",t:"Encuentran una billetera con plata y documentos en la rambla. ¿Qué hacen?",o:["Llevarla a la comisaría","Buscar al dueño por redes","Dejarla donde estaba","Devolverla y pedir recompensa"]},
    {id:"perro",t:"Un perro callejero los sigue hasta la casa y no se quiere ir. ¿Qué hacen?",o:["Adoptarlo","Llevarlo a un refugio","Darle de comer y que siga","Publicarlo para buscarle familia"]},
    {id:"carnaval",t:"Les ofrecen salir en una murga en el carnaval. ¿Qué responden?",o:["Sí, de una","Solo si vamos todos","Mejor vamos a mirar","Ni loco"]},
    {id:"lotería",t:"El grupo ganó la lotería jugando juntos. ¿Qué hacen con la plata?",o:["Repartirla en partes iguales","Comprar una casa para todos","Viajar juntos por el mundo","Invertirla y no tocarla"]},
    {id:"mudanza",t:"Un amigo se muda un domingo a las 7 de la mañana y pide ayuda. ¿Qué hacen?",o:["Ir todos","Mandar un flete pago entre todos","Ir pero a las 11","Decir que están enfermos"]},
    {id:"zombis",t:"Empieza un apocalipsis zombi. ¿Dónde se esconden?",o:["En un shopping","En una isla del río","En una estancia en el campo","En el estadio Centenario"]},
    {id:"cumple",t:"Se olvidaron del cumpleaños de un amigo y es en una hora. ¿Qué hacen?",o:["Comprar una torta de supermercado","Hacer una sorpresa improvisada","Mandar un audio largo","Hacerse los que no sabían"]},
    {id:"mate",t:"Alguien del grupo le pone azúcar al mate. ¿Qué hacen?",o:["Lo echan del grupo","Lo toman igual","Hacen dos mates","Le enseñan a cebar bien"]},
    {id:"auto",t:"El auto se queda sin nafta en la ruta, de noche. ¿Qué hacen?",o:["Caminar hasta la estación","Hacer dedo","Llamar al seguro","Dormir en el auto"]},
    {id:"concierto",t:"Consiguieron una sola entrada para el recital del año. ¿Quién va?",o:["El más fan","Se sortea","El que la pague","Nadie, la venden"]},
    {id:"vecino",t:"El vecino pone cumbia a todo volumen a las 3 de la mañana. ¿Qué hacen?",o:["Golpear la puerta","Llamar a la policía","Sumarse a la fiesta","Poner música más fuerte"]},
    {id:"tesoro",t:"Encuentran un mapa del tesoro en el altillo del abuelo. ¿Qué hacen?",o:["Salir a buscarlo ya","Venderlo a un museo","Subirlo a redes","Guardarlo y olvidarse"]},
    {id:"camping",t:"En el camping se largó una tormenta y se vuela la carpa. ¿Qué hacen?",o:["Dormir en el auto","Ir a un hotel","Aguantar abajo de la lona","Pedir lugar al de al lado"]},
    {id:"examen",t:"Al grupo de estudio le llega el examen filtrado por WhatsApp. ¿Qué hacen?",o:["Lo borran sin mirarlo","Lo miran","Avisan al profesor","Lo reenvían"]},
    {id:"invitado",t:"Llega a la fiesta alguien que nadie invitó. ¿Qué hacen?",o:["Lo dejan quedarse","Le piden que se vaya","Le preguntan quién lo trajo","Lo ponen a lavar platos"]},
    {id:"playa",t:"Tienen un día libre de verano. ¿A dónde van?",o:["Punta del Este","Piriápolis","La Paloma","Quedarse en la ciudad"]},
    {id:"empresa",t:"Deciden abrir un negocio juntos. ¿De qué?",o:["Una parrilla","Un food truck","Una cervecería","Una agencia de viajes"]},
    {id:"pelicula",t:"Noche de película y nadie se pone de acuerdo. ¿Qué miran?",o:["Terror","Comedia","Acción","Un documental"]},
    {id:"mascota",t:"El grupo adopta una mascota en común. ¿Cuál?",o:["Un perro","Un gato","Un loro","Una tortuga"]}
  ];
  const FRASES={
    apoyo:["Yo voy con {o}, es lo más lógico.","{o}, sin dudas.","Para mí {o}… ¿o no?","Che, {o} nos salva.","Pensalo bien: {o}.","Yo me quedo con {o}."],
    empuje:["Yo cambiaría a {o}, de verdad.","Nadie piensa en {o} y es lo mejor.","Escuchen: {o}. Confíen en mí.","Vamos con {o}, no se compliquen."],
    sigue:["Bueno, vamos con lo que dice la mayoría: {o}.","Si la mayoría quiere {o}, listo.","Dale, {o} y no se habla más."],
    duda:["Mmm, alguien está muy apurado…","Ojo que acá hay alguien jugando sucio.","Yo no confío en nadie hoy.","¿Y si alguno ya tiene un trato?","Esto huele a traición…"]
  };
  let raiz=null,partidas=0,cant=6,explicado=true;
  let J=[],pts={},comodin={},ronda=0,R=null,timer=null,charla=null,flujo=0;
  function cargar(){try{const d=JSON.parse(localStorage.getItem(CLAVE))||{};partidas=Number(d.partidas)||0;cant=Math.min(8,Math.max(4,Number(d.cant)||6));explicado=d.explicado!==false;}catch(e){}}
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify({partidas,cant,explicado}));}catch(e){}}
  const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const mezclar=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const azar=a=>a[Math.floor(Math.random()*a.length)];
  const sonar=(f,d,t,v)=>{try{if(typeof bip==="function")bip(f,d,t,v);}catch(e){}};
  const q=id=>raiz&&raiz.querySelector("#"+id);
  const yo=()=>J[0];
  const nom=pid=>pid==="nadie"?"Nadie":(J.find(j=>j.pid===pid)||{}).n||"?";
  const op=i=>i>=0&&R?`${L[i]} · ${R.sit.o[i]}`:"—";
  const giro=(p,txt)=>`<div class="ts-giro"><img src="${G+POSE[p]}.png" alt="Giro" draggable="false"><div class="ts-burbuja">${txt}</div></div>`;
  const expl=t=>explicado?`<div class="ts-expl">📖 ${t}</div>`:"";
  const cab=()=>`<div class="ts-cab"><b>🃏 EL TRATO SUCIO</b><span>Ronda ${ronda}/${RONDAS} · ⭐ ${pts[yo().pid]||0}</span><button type="button" class="ts-ver" id="tsVer">👁 Mi carta</button></div>`;
  function pantalla(html){if(!raiz)return;raiz.innerHTML=html;const v=q("tsVer");if(v)v.onclick=verCarta;}
  function limpiarTiempos(){clearInterval(timer);clearTimeout(charla);timer=null;charla=null;flujo++;}

  function abrir(contenedor){
    salir();cargar();
    Object.values(POSE).forEach(p=>{const i=new Image();i.src=G+p+".png";});
    raiz=document.createElement("section");raiz.className="ts";contenedor.appendChild(raiz);
    inicio();
  }
  function inicio(){
    limpiarTiempos();ronda=0;R=null;
    pantalla(`<div class="ts-panel">
      ${giro("saluda","¡Bienvenidos a <b>El Trato Sucio</b>! Pactos, sospechas y traiciones. Hoy jugás vos contra los bots para aprender cómo funciona.")}
      <ol class="ts-reglas">
        <li>🗺️ Giro presenta una situación con <b>4 opciones</b>.</li>
        <li>🃏 Cada uno ve su <b>carta secreta</b>: LEAL o SABOTEADOR (con una misión).</li>
        <li>🗳️ <b>Primer voto</b> en secreto y después <b>debate</b>: la opción más apoyada es el <b>pacto</b>.</li>
        <li>🤝 El saboteador puede ofrecer un <b>trato anónimo</b> para tener un cómplice.</li>
        <li>✅ <b>Voto final</b>: el pacto se cumple solo si votan <b>todos igual</b>.</li>
        <li>🕵️ Giro da <b>pistas</b>, todos <b>acusan</b> y se revelan las cartas.</li>
      </ol>
      <div class="ts-fila"><span>👥 Jugadores (vos + bots)</span><div class="ts-cant"><button type="button" id="tsMenos">−</button><b>${cant}</b><button type="button" id="tsMas">+</button></div></div>
      <label class="ts-check"><input type="checkbox" id="tsExpl" ${explicado?"checked":""}> 📖 Explicar cada paso</label>
      <button type="button" class="ts-principal" id="tsEmpezar">▶ Empezar partida (${RONDAS} rondas)</button>
      <p class="ts-chico">Versión de prueba solo para Gonzalo · ${partidas} partida${partidas===1?"":"s"} jugada${partidas===1?"":"s"}</p></div>`);
    q("tsMenos").onclick=()=>{cant=Math.max(4,cant-1);guardar();inicio();};
    q("tsMas").onclick=()=>{cant=Math.min(8,cant+1);guardar();inicio();};
    q("tsExpl").onchange=e=>{explicado=e.target.checked;guardar();};
    q("tsEmpezar").onclick=empezar;
  }
  function empezar(){
    let mio="Vos";try{const n=(perfil&&perfil.nombre||"").trim();if(n)mio=n.slice(0,14);}catch(e){}
    J=[{pid:"yo",n:mio,bot:false}].concat(mezclar(NOMBRES_BOT).slice(0,cant-1).map((n,i)=>({pid:"b"+i,n,bot:true})));
    pts={};comodin={};J.forEach(j=>pts[j.pid]=0);ronda=0;nuevaRonda();
  }

  /* ---------- Ronda ---------- */
  function nuevaRonda(){
    limpiarTiempos();ronda++;
    let libres=SIT;try{if(window.Vistas)libres=Vistas.filtrar("trato",SIT,s=>s.id);}catch(e){}
    const sit=azar(libres);try{if(window.Vistas)Vistas.marcar("trato",sit.id);}catch(e){}
    const hay=Math.random()<0.75;
    R={sit,sabo:hay?azar(J).pid:null,obj:Math.floor(Math.random()*4),complice:null,oferta:null,ofertaMia:null,
      voto1:{},apoyo:{},final:{},traidores:[],traicionMia:false,acuSab:{},acuCom:{},chat:[],pacto:-1,volteada:false};
    R.sospechosa=R.sabo?R.obj:Math.floor(Math.random()*4);R.fav=Math.floor(Math.random()*4);
    situacion();
  }
  const rolDe=pid=>pid===R.sabo?"sabo":pid===R.complice?"complice":"leal";
  function misionTxt(){return `que <b>${esc(op(R.obj))}</b> saque <b>${MISION} votos o más</b> en el voto final, sin que te descubran`;}
  function cartaHtml(){
    const r=rolDe("yo");
    if(r==="sabo")return`<div class="ts-carta ts-sabo"><div class="ts-carta-rol">😈 SABOTEADOR</div><p>Tu misión: ${misionTxt()}.</p><p class="ts-chico">Empujá esa opción en el debate sin que se note. Podés ofrecer un trato anónimo para conseguir un cómplice.</p></div>`;
    if(r==="complice")return`<div class="ts-carta ts-comp"><div class="ts-carta-rol">🤝 CÓMPLICE</div><p>Aceptaste el trato: en el voto final votá <b>${esc(op(R.obj))}</b>. Si no los descubren, ganás +300.</p></div>`;
    return`<div class="ts-carta ts-leal"><div class="ts-carta-rol">😇 LEAL</div><p>Tu misión: que <b>todos voten lo mismo</b> y descubrir si hay un saboteador.</p><p class="ts-chico">${comodin.yo?"Ya usaste tu comodín de traición.":"Te queda el comodín «Traicionar por mi cuenta» (una vez por partida)."}</p></div>`;
  }
  function verCarta(){
    if(!R||!R.volteada)return;
    const capa=document.createElement("div");capa.className="ts-capa";capa.innerHTML=`<div class="ts-capa-caja">${cartaHtml()}<button type="button" class="ts-principal">Ocultar</button></div>`;
    capa.querySelector("button").onclick=()=>capa.remove();raiz.appendChild(capa);
  }
  function situacion(){
    pantalla(cab()+`<div class="ts-panel">${giro("tarjetas",`Ronda ${ronda}: ${esc(R.sit.t)}`)}
      <div class="ts-ops">${R.sit.o.map((o,i)=>`<div class="ts-op"><b>${L[i]}</b>${esc(o)}</div>`).join("")}</div>
      ${expl("Todos ven las mismas 4 opciones. Ahora cada uno recibe su carta secreta: puede que haya un saboteador… o que todos sean leales.")}
      <button type="button" class="ts-principal" id="tsSig">🃏 Ver mi carta</button></div>`);
    q("tsSig").onclick=carta;
  }
  function carta(){
    pantalla(cab()+`<div class="ts-panel"><h3>Tu carta secreta</h3>
      <button type="button" class="ts-dorso" id="tsDorso"><span>?</span><small>Tocá para darla vuelta</small></button>
      ${expl("En la partida real cada uno la mira en su celular y nadie sabe qué le tocó a los demás. En 3 de cada 4 rondas hay un saboteador.")}</div>`);
    q("tsDorso").onclick=()=>{R.volteada=true;sonar(rolDe("yo")==="sabo"?220:660,.18,"triangle",.06);
      pantalla(cab()+`<div class="ts-panel"><h3>Tu carta secreta</h3>${cartaHtml()}
        ${expl(rolDe("yo")==="sabo"?"Sos el saboteador: tu objetivo NO es romper el pacto sí o sí, sino que tu opción junte 2 votos. Si convencés a todos de pactar tu opción, ¡ganás sin traicionar!":"Sos leal: ganás puntos si el pacto se cumple y si acertás quién saboteó. Con el botón 👁 Mi carta la volvés a ver cuando quieras.")}
        <button type="button" class="ts-principal" id="tsSig">🗳️ Al primer voto</button></div>`);
      q("tsSig").onclick=voto1;};
  }
  function botVoto1(j){
    if(j.pid===R.sabo)return Math.random()<0.6?R.obj:Math.floor(Math.random()*4);
    return Math.random()<0.5?R.fav:Math.floor(Math.random()*4);
  }
  function voto1(){
    pantalla(cab()+`<div class="ts-panel">${giro("senala","Primer voto, <b>sin hablar</b>. ¿Qué elegís vos?")}
      <div class="ts-ops ts-elegir">${R.sit.o.map((o,i)=>`<button type="button" class="ts-op" data-o="${i}"><b>${L[i]}</b>${esc(o)}</button>`).join("")}</div>
      ${expl("Es secreto: la tele solo muestra cuántos votos sacó cada opción, nunca quién votó qué. Este voto después sirve de pista: Giro va a contar quiénes cambiaron.")}</div>`);
    raiz.querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{
      R.voto1.yo=Number(b.dataset.o);J.forEach(j=>{if(j.bot)R.voto1[j.pid]=botVoto1(j);});
      R.apoyo={...R.voto1};sonar(700,.08,"sine",.05);debate();});
  }
  const cuenta=v=>{const c=[0,0,0,0];Object.values(v).forEach(o=>{if(o>=0&&o<4)c[o]++;});return c;};
  const lider=v=>{const c=cuenta(v),m=Math.max(...c),t=c.map((n,i)=>n===m?i:-1).filter(i=>i>=0);return{i:t.length===1?t[0]:-1,empate:t,c};};
  function barras(c,marca){const tot=Math.max(1,c.reduce((a,b)=>a+b,0));
    return`<div class="ts-barras">${R.sit.o.map((o,i)=>`<div class="ts-barra${i===marca?" ts-marca":""}"><span>${L[i]} · ${esc(o)}</span><i style="--p:${Math.round(c[i]/tot*100)}%"></i><b>${c[i]}</b></div>`).join("")}</div>`;}

  /* ---------- Debate ---------- */
  function debate(){
    let resta=T_DEBATE;const mio=flujo;
    const decir=(pid,txt)=>{R.chat.push({pid,txt});if(R.chat.length>40)R.chat.shift();pintarChat();};
    function pintarChat(){const ch=q("tsChat");if(!ch)return;ch.innerHTML=R.chat.map(m=>`<p class="${m.pid==="yo"?"ts-yo":m.pid==="giro"?"ts-msj-giro":""}"><b>${esc(m.pid==="giro"?"Giro":nom(m.pid))}:</b> ${esc(m.txt)}</p>`).join("");ch.scrollTop=ch.scrollHeight;
      const b=q("tsBarras");if(b)b.innerHTML=barras(cuenta(R.apoyo),R.apoyo.yo);}
    function hablarBot(){
      if(mio!==flujo)return;
      const j=azar(J.filter(x=>x.bot)),l=lider(R.apoyo);let o;
      if(j.pid===R.sabo&&Math.random()<0.7){o=R.obj;decir(j.pid,azar(FRASES.empuje).replace("{o}",R.sit.o[o]));}
      else if(Math.random()<0.18){decir(j.pid,azar(FRASES.duda));o=R.apoyo[j.pid];}
      else if(l.i>=0&&Math.random()<0.55){o=j.pid===R.sabo?R.obj:l.i;decir(j.pid,azar(FRASES.sigue).replace("{o}",R.sit.o[o]));}
      else{o=R.apoyo[j.pid]??Math.floor(Math.random()*4);if(Math.random()<0.3)o=Math.floor(Math.random()*4);decir(j.pid,azar(FRASES.apoyo).replace("{o}",R.sit.o[o]));}
      if(o>=0)R.apoyo[j.pid]=o;pintarChat();
      /* El bot saboteador manda su oferta anónima a mitad del debate. */
      if(R.sabo&&R.sabo!=="yo"&&!R.oferta&&resta<T_DEBATE-8&&Math.random()<0.5){
        const a=azar(J.filter(x=>x.pid!==R.sabo));R.oferta={de:R.sabo,a:a.pid,estado:"pendiente"};
        if(a.pid==="yo")ofertaParaMi();else setTimeout(()=>{if(mio===flujo&&R.oferta&&R.oferta.estado==="pendiente"){R.oferta.estado=Math.random()<0.6?"si":"no";if(R.oferta.estado==="si")R.complice=a.pid;}},2500);
      }
      charla=setTimeout(hablarBot,1800+Math.random()*1800);
    }
    function ofertaParaMi(){
      const capa=document.createElement("div");capa.className="ts-capa";
      capa.innerHTML=`<div class="ts-capa-caja ts-oferta"><h3>📩 Mensaje anónimo</h3><p>«Alguien te ofrece ser su cómplice. Si en el voto final votás <b>${esc(op(R.obj))}</b> y no los descubren, ganás <b>+300</b>. ¿Aceptás?»</p>
        ${expl("No sabés quién te lo mandó: solo sabés que hay un saboteador. Si aceptás, dejás de ganar como leal y jugás para él.")}
        <div class="ts-dos"><button type="button" class="ts-principal" id="tsAcepto">🤝 Acepto</button><button type="button" id="tsRechazo">❌ Rechazo</button></div></div>`;
      raiz.appendChild(capa);sonar(520,.12,"square",.04);
      const cerrar=si=>{if(R.oferta&&R.oferta.a==="yo"){R.oferta.estado=si?"si":"no";if(si)R.complice="yo";}capa.remove();pintarPanelPropio();};
      capa.querySelector("#tsAcepto").onclick=()=>cerrar(true);capa.querySelector("#tsRechazo").onclick=()=>cerrar(false);
    }
    function pintarPanelPropio(){
      const p=q("tsPropio");if(!p)return;
      if(R.sabo==="yo"){
        if(!R.oferta)p.innerHTML=`<h4>🤝 Ofrecer trato anónimo (una vez)</h4><div class="ts-nombres">${J.filter(j=>j.pid!=="yo").map(j=>`<button type="button" data-a="${j.pid}">${esc(j.n)}</button>`).join("")}</div>`;
        else p.innerHTML=`<h4>🤝 Oferta a ${esc(nom(R.oferta.a))}</h4><p>${R.oferta.estado==="pendiente"?"⏳ Esperando respuesta…":R.oferta.estado==="si"?"✅ Aceptó: va a votar tu opción.":"❌ La rechazó (y ahora sabe que hay un saboteador)."}</p>`;
        p.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{const a=b.dataset.a;R.oferta={de:"yo",a,estado:"pendiente"};pintarPanelPropio();
          setTimeout(()=>{if(mio!==flujo||!R.oferta)return;R.oferta.estado=Math.random()<0.6?"si":"no";if(R.oferta.estado==="si")R.complice=a;pintarPanelPropio();},2200);});
      }else if(R.complice==="yo")p.innerHTML=`<h4>🤝 Sos cómplice</h4><p>En el voto final votá <b>${esc(op(R.obj))}</b>.</p>`;
      else if(R.oferta&&R.oferta.a==="yo")p.innerHTML=`<p>❌ Rechazaste la oferta: ahora sabés que <b>hay un saboteador</b>.</p>`;
      else p.innerHTML="";
    }
    pantalla(cab()+`<div class="ts-panel"><div class="ts-reloj-fila"><b>🗣️ DEBATE</b><span id="tsReloj">${resta} s</span></div>
      <div class="ts-sub">Primer voto: ${cuenta(R.voto1).map((n,i)=>`${L[i]} ${n}`).join(" · ")}</div>
      <div id="tsChat" class="ts-chat"></div>
      <div class="ts-sub">Tu apoyo ahora (podés cambiarlo):</div>
      <div class="ts-ops ts-mini">${R.sit.o.map((o,i)=>`<button type="button" class="ts-op" data-ap="${i}"><b>${L[i]}</b>${esc(o)}</button>`).join("")}</div>
      <div id="tsBarras"></div><div id="tsPropio" class="ts-propio"></div>
      ${expl("Convenzan al grupo. Al terminar, la opción más apoyada pasa a ser el PACTO. Ojo: el saboteador habla como uno más… fijate quién empuja mucho una opción.")}
      <button type="button" id="tsTerminar">⏭ Terminar debate</button></div>`);
    raiz.querySelectorAll("[data-ap]").forEach(b=>b.onclick=()=>{R.apoyo.yo=Number(b.dataset.ap);decir("yo","Yo apoyo "+R.sit.o[R.apoyo.yo]+".");marcarApoyo();});
    const marcarApoyo=()=>raiz.querySelectorAll("[data-ap]").forEach(b=>b.classList.toggle("ts-sel",Number(b.dataset.ap)===R.apoyo.yo));
    q("tsTerminar").onclick=cerrarDebate;
    decir("giro","¡Tienen "+T_DEBATE+" segundos para ponerse de acuerdo!");marcarApoyo();pintarPanelPropio();
    charla=setTimeout(hablarBot,900);
    timer=setInterval(()=>{if(mio!==flujo)return;resta--;const r=q("tsReloj");if(r){r.textContent=resta+" s";r.classList.toggle("ts-urgente",resta<=10);}if(resta<=0)cerrarDebate();},1000);
  }
  function cerrarDebate(){
    limpiarTiempos();document.querySelectorAll(".ts-capa").forEach(c=>c.remove());
    if(R.oferta&&R.oferta.estado==="pendiente")R.oferta.estado="no";
    const l=lider(R.apoyo);R.pacto=l.i>=0?l.i:azar(l.empate);
    votoFinal();
  }

  /* ---------- Voto final ---------- */
  function votoFinal(){
    const r=rolDe("yo"),puede=r==="leal"&&!comodin.yo;
    const pintar=()=>{
      pantalla(cab()+`<div class="ts-panel">${giro("suspenso",`El pacto es <b>${esc(op(R.pacto))}</b>. Voto final, secreto. ¿Cumplís o traicionás?`)}
        ${puede?`<label class="ts-check ts-traicion"><input type="checkbox" id="tsTraicion" ${R.traicionMia?"checked":""}> 😈 Traicionar por mi cuenta <small>(comodín: una vez por partida)</small></label>`:""}
        <div class="ts-ops ts-elegir">${R.sit.o.map((o,i)=>`<button type="button" class="ts-op${i===R.pacto?" ts-pacto":""}" data-o="${i}" ${R.traicionMia&&i===R.pacto?"disabled":""}><b>${L[i]}</b>${esc(o)}${i===R.pacto?" 🤝":""}</button>`).join("")}</div>
        ${expl(r==="sabo"?`Tu misión: que ${esc(op(R.obj))} junte 2 votos. ${R.complice?"Tu cómplice va a votarla.":"Sin cómplice, solo lo lograrías si el pacto es tu opción."}`:r==="complice"?`Prometiste votar ${esc(op(R.obj))}.`:"Si todos votan el pacto, cada leal gana +200. Con el comodín votás otra cosa a propósito: si nadie te descubre ganás +400, si te descubren perdés 300.")}</div>`);
      const t=q("tsTraicion");if(t)t.onchange=e=>{R.traicionMia=e.target.checked;pintar();};
      raiz.querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{R.final.yo=Number(b.dataset.o);botsFinal();sonar(600,.1,"sine",.05);pistas();});
    };pintar();
  }
  function botsFinal(){
    J.forEach(j=>{if(!j.bot)return;const r=rolDe(j.pid);
      if(r==="sabo"||r==="complice"){R.final[j.pid]=R.obj;return;}
      if(!comodin[j.pid]&&Math.random()<0.08){const otras=[0,1,2,3].filter(i=>i!==R.pacto);R.final[j.pid]=azar(otras);R.traidores.push(j.pid);comodin[j.pid]=true;return;}
      R.final[j.pid]=R.pacto;});
    if(R.traicionMia&&rolDe("yo")==="leal"&&R.final.yo!==R.pacto){R.traidores.push("yo");comodin.yo=true;}
  }

  /* ---------- Pistas ---------- */
  function pistas(){
    const c=cuenta(R.final);R.cumplido=J.every(j=>R.final[j.pid]===R.pacto);
    R.cambiaron=J.filter(j=>R.voto1[j.pid]!==R.final[j.pid]).length;R.votosSosp=c[R.sospechosa];
    pantalla(cab()+`<div class="ts-panel">${giro(R.cumplido?"festeja":"sorprendido",R.cumplido?"¡Votaron todos igual! El pacto se cumplió… ¿o alguien ganó igual?":`¡${c[R.pacto]} cumplieron y ${J.length-c[R.pacto]} no! ¡Alguien rompió el trato!`)}
      ${barras(c,R.pacto)}
      <div class="ts-pistas"><p>🔄 <b>${R.cambiaron}</b> persona${R.cambiaron===1?"":"s"} cambiaron su voto desde el primero.</p>
        <p>🕵️ Giro sospecha de <b>${esc(op(R.sospechosa))}</b>: sacó <b>${R.votosSosp}</b> voto${R.votosSosp===1?"":"s"}.</p></div>
      ${expl("Estas son las pistas para acusar. La opción sospechosa suele ser la de la misión del saboteador (aunque a veces no hay saboteador y es una pista falsa). Pensá: ¿quién la empujó en el debate?")}
      <button type="button" class="ts-principal" id="tsSig">🕵️ A la acusación</button></div>`);
    q("tsSig").onclick=acusacion;
  }

  /* ---------- Acusación ---------- */
  function sospechaBot(j){
    const pesos=J.filter(x=>x.pid!==j.pid).map(x=>{let w=1;if(R.apoyo[x.pid]===R.sospechosa||R.voto1[x.pid]===R.sospechosa)w+=2;if(R.voto1[x.pid]!==R.final[x.pid])w+=1;
      if(R.chat.some(m=>m.pid===x.pid&&FRASES.empuje.some(f=>m.txt.startsWith(f.split("{o}")[0]))))w+=2;return{pid:x.pid,w};});
    pesos.push({pid:"nadie",w:R.cumplido?3:0.5});
    const tot=pesos.reduce((a,b)=>a+b.w,0);let r=Math.random()*tot;for(const p of pesos){r-=p.w;if(r<=0)return p.pid;}return"nadie";
  }
  function acusacion(){
    let sab=null,com=null;
    const pintar=()=>{
      const lista=(sel,tipo)=>`<div class="ts-nombres">${J.filter(j=>j.pid!=="yo").map(j=>`<button type="button" class="${sel===j.pid?"ts-sel":""}" data-${tipo}="${j.pid}">${esc(j.n)}</button>`).join("")}<button type="button" class="${sel==="nadie"?"ts-sel":""}" data-${tipo}="nadie">🙅 Nadie</button></div>`;
      pantalla(cab()+`<div class="ts-panel">${giro("confundido","Hora de acusar. ¿Fue un error… o tenemos un traidor entre nosotros?")}
        <h4>😈 ¿Quién saboteó o traicionó?</h4>${lista(sab,"s")}<h4>🤝 ¿Quién fue su cómplice?</h4>${lista(com,"c")}
        ${expl("Queda descubierto el más votado (si hay empate, nadie). Acertar te da +100; acusar a un inocente, −50. «Nadie» es correcto si no hubo nadie.")}
        <button type="button" class="ts-principal" id="tsConfirmar" ${sab&&com?"":"disabled"}>✔ Confirmar acusación</button></div>`);
      raiz.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{sab=b.dataset.s;pintar();});
      raiz.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{com=b.dataset.c;pintar();});
      q("tsConfirmar").onclick=()=>{R.acuSab.yo=sab;R.acuCom.yo=com;
        J.forEach(j=>{if(!j.bot)return;R.acuSab[j.pid]=sospechaBot(j);let c=sospechaBot(j);if(c===R.acuSab[j.pid])c="nadie";R.acuCom[j.pid]=c;});revelar();};
    };pintar();
  }

  /* ---------- Revelación y puntos ---------- */
  function masVotado(v){const c={};Object.values(v).forEach(x=>c[x]=(c[x]||0)+1);let max=0,t=[];for(const k in c){if(c[k]>max){max=c[k];t=[k];}else if(c[k]===max)t.push(k);}return{pid:t.length===1?t[0]:null,c};}
  function revelar(){
    const d={},why={};J.forEach(j=>{d[j.pid]=0;why[j.pid]=[];});
    const suma=(pid,n,t)=>{d[pid]+=n;why[pid].push((n>0?"+":"")+n+" "+t);};
    const aS=masVotado(R.acuSab),aC=masVotado(R.acuCom);
    const sabDesc=!!R.sabo&&aS.pid===R.sabo,comDesc=!!R.complice&&(aC.pid===R.complice||aS.pid===R.complice);
    const mision=!!R.sabo&&cuenta(R.final)[R.sabo?R.obj:0]>=MISION;
    const leales=J.filter(j=>j.pid!==R.sabo&&j.pid!==R.complice&&!R.traidores.includes(j.pid));
    if(R.cumplido)leales.forEach(j=>suma(j.pid,200,"pacto cumplido"));
    if(R.sabo){
      if(sabDesc)leales.forEach(j=>suma(j.pid,200,"descubrieron al saboteador"));
      else if(mision){suma(R.sabo,600,"misión cumplida sin ser descubierto");if(R.complice&&!comDesc)suma(R.complice,300,"cómplice no descubierto");}
    }
    R.traidores.forEach(t=>{if(aS.pid===t)suma(t,-300,"traición propia descubierta");else suma(t,400,"traición propia sin ser descubierto");});
    const buenosS=R.sabo||R.traidores.length?[R.sabo,...R.traidores].filter(Boolean):["nadie"],buenoC=R.complice||"nadie";
    J.forEach(j=>{const s=R.acuSab[j.pid],c=R.acuCom[j.pid];
      if(s){if(buenosS.includes(s))suma(j.pid,100,"acertó al saboteador");else if(s!=="nadie")suma(j.pid,-50,"acusó a un inocente");}
      if(c){if(c===buenoC)suma(j.pid,100,"acertó al cómplice");else if(c!=="nadie")suma(j.pid,-50,"acusó a un inocente de cómplice");}});
    J.forEach(j=>pts[j.pid]+=d[j.pid]);
    const conteo=(a)=>Object.entries(a.c).sort((x,y)=>y[1]-x[1]).map(([p,n])=>`${esc(nom(p))} ${n}`).join(" · ");
    const ultima=ronda>=RONDAS,gano=d.yo>0;
    sonar(gano?784:220,.25,gano?"triangle":"sawtooth",.05);
    pantalla(cab()+`<div class="ts-panel">${giro(R.sabo?(sabDesc?"festeja":"sorprendido"):"senala",R.sabo?`¡<b>${esc(nom(R.sabo))}</b> era el SABOTEADOR! Su misión: que ${esc(op(R.obj))} juntara 2 votos → ${mision?"✅ la cumplió":"❌ no la cumplió"}.`:"¡Esta ronda <b>no había saboteador</b>! Todos eran leales.")}
      <div class="ts-revela">
        <p>🤝 Cómplice: <b>${R.complice?esc(nom(R.complice)):"no hubo"}</b>${R.oferta&&R.oferta.estado==="no"?` (le ofrecieron a ${esc(nom(R.oferta.a))} y rechazó)`:""}</p>
        ${R.traidores.length?`<p>😈 Traición por su cuenta: <b>${R.traidores.map(nom).map(esc).join(", ")}</b></p>`:""}
        <p>🗳️ Acusaron de saboteador: ${conteo(aS)} → ${aS.pid&&aS.pid!=="nadie"?`<b>${esc(nom(aS.pid))}</b> descubierto${sabDesc?" ✅":" (era inocente)"}`:"nadie descubierto"}</p>
        <p>🗳️ Acusaron de cómplice: ${conteo(aC)}</p></div>
      <table class="ts-tabla"><tr><th>Jugador</th><th>Ronda</th><th>Total</th></tr>
        ${[...J].sort((a,b)=>pts[b.pid]-pts[a.pid]).map(j=>`<tr class="${j.pid==="yo"?"ts-yo":""}"><td>${esc(j.n)}${j.pid===R.sabo?" 😈":j.pid===R.complice?" 🤝":R.traidores.includes(j.pid)?" 🗡️":""}<small>${esc(why[j.pid].join(" · "))}</small></td><td>${d[j.pid]>0?"+":""}${d[j.pid]}</td><td><b>${pts[j.pid]}</b></td></tr>`).join("")}</table>
      ${expl("Así se reparten los puntos: pacto cumplido +200 a cada leal; descubrir al saboteador +200 a cada leal; saboteador no descubierto con misión cumplida +600 (cómplice +300); acertar acusación +100, acusar inocente −50; traición propia +400 o −300.")}
      <button type="button" class="ts-principal" id="tsSig">${ultima?"🏆 Ver resultado final":"▶ Siguiente ronda"}</button></div>`);
    q("tsSig").onclick=ultima?final:nuevaRonda;
  }
  function final(){
    partidas++;guardar();
    const orden=[...J].sort((a,b)=>pts[b.pid]-pts[a.pid]),gane=orden[0].pid==="yo";
    try{if(gane&&typeof sonarSFX==="function")sonarSFX("aplausos");}catch(e){}
    pantalla(`<div class="ts-panel">${giro(gane?"festeja":"saluda",gane?"¡Ganaste la noche de traiciones! 🏆":`¡Ganó <b>${esc(orden[0].n)}</b>! Revancha cuando quieras.`)}
      <table class="ts-tabla">${orden.map((j,i)=>`<tr class="${j.pid==="yo"?"ts-yo":""}"><td>${["🥇","🥈","🥉"][i]||""} ${esc(j.n)}</td><td><b>${pts[j.pid]}</b></td></tr>`).join("")}</table>
      <button type="button" class="ts-principal" id="tsOtra">🔄 Otra partida</button><button type="button" id="tsInicio">⚙️ Cambiar jugadores</button></div>`);
    q("tsOtra").onclick=empezar;q("tsInicio").onclick=inicio;
  }
  function salir(){limpiarTiempos();if(raiz)raiz.remove();raiz=null;R=null;}
  return{abrir,salir,partidasJugadas:()=>{cargar();return partidas;}};
})();
window.TratoSucio=TratoSucio;
