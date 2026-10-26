/* Impostor: se pasan el celular y cada uno ve su palabra en secreto;
   todos tienen la misma menos el impostor. En ronda, cada uno dice una
   palabra relacionada; después votan. Si atrapan al impostor, él tiene
   una última chance: adivinar la palabra. Puntos por ronda: civiles +1 si
   atrapan al impostor (y no adivina); impostor +2 si se salva o adivina.
   Pantalla completa sin apagarse (PantallaFija). Datos en gya_impostor;
   Vistas evita repetir palabras entre días. */
const Impostor=(()=>{
  const CLAVE="gya_impostor",MIN=3,MAX=12;
  let raiz=null,cant=4,nombres=[],cantImp=1,catId="mezcla",partidas=0;
  let ronda=null,puntos={};
  function cargar(){try{const d=JSON.parse(localStorage.getItem(CLAVE));if(d&&typeof d==="object"){cant=Math.min(MAX,Math.max(MIN,Number(d.cant)||4));nombres=Array.isArray(d.nombres)?d.nombres.map(String):[];cantImp=d.cantImp===2?2:1;catId=d.catId||"mezcla";partidas=Number(d.partidas)||0;}}catch(e){}}
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify({cant,nombres,cantImp,catId,partidas}));}catch(e){}}
  cargar();
  const q=id=>raiz.querySelector("#"+id);
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
  const cats=()=>window.IMPOSTOR_CATEGORIAS||[];
  const nombre=i=>(nombres[i]||"").trim()||"Jugador "+(i+1);
  function sonar(f,d,t,v){if(typeof bip==="function")bip(f,d,t,v);}
  /* Dibujos en assets/impostor/ (hoja hecha con ChatGPT, recortada en 9). */
  const ARTE=["logo","pasar","carta_dorso","carta_palabra","carta_impostor","ronda","votar","atrapado","gano_impostor"];
  const src=n=>"assets/impostor/"+n+".webp";
  /* Tarjetas de categorías (assets/impostor/cat_<id>.webp, 22/10/2026): nombre corto en la franja de abajo. */
  const CORTO={lugares:"Lugares",comidas:"Comidas",deportes:"Deportes",transporte:"Transportes",ropa:"Ropa",situaciones:"Momentos"};
  const tarjeta=(id,nom)=>`<button type="button" class="imp-tarjeta${id===catId?" ultima":""}" data-cat="${id}" style="background-image:url(${src("cat_"+id)})"><span>${esc(nom)}</span></button>`;
  const img=n=>`<img class="imp-arte imp-a-${n}" src="${src(n)}" alt="" draggable="false">`;

  function abrir(contenedor){
    salir();cargar();puntos={};
    ARTE.forEach(n=>{const i=new Image();i.src=src(n);});   /* precarga: las dos cartas aparecen igual de rápido y nadie sospecha */
    raiz=document.createElement("section");raiz.className="imp";
    contenedor.appendChild(raiz);
    PantallaFija.bienvenida(contenedor,{logo:src("logo"),alt:"Impostor",items:[["🃏","Pasen el celular: cada uno ve su <b>carta en secreto</b>."],["🕵️","Todos tienen la <b>misma palabra</b> menos el impostor, que solo ve la categoría."],["🗣️","Por turnos, cada uno dice una palabra <b>relacionada</b> sin regalarla."],["🗳️","Al final <b>votan</b> quién es el impostor."]]});configurar();
  }
  function configurar(){
    PantallaFija.desactivar();ronda=null;
    raiz.innerHTML=`<div class="mg-panel imp-panel">
      <p>Todos ven la misma palabra menos el impostor. Cada uno dice una palabra relacionada y votan quién es.</p>
      <div class="qs-sub">👥 Jugadores</div>
      <div class="imp-cant"><button type="button" id="impMenos">−</button><b id="impCant">${cant}</b><button type="button" id="impMas">+</button></div>
      <div class="imp-nombres" id="impNombres"></div>
      <div class="qs-sub">🕵️ Impostores</div>
      <div class="qns-rangos imp-dos" id="impImp"><button type="button" data-n="1">1 impostor</button><button type="button" data-n="2">2 impostores</button></div>
      <div class="qs-sub">🗂️ Tocá una categoría para repartir las palabras</div>
      <div class="imp-tarjetas" id="impCats">${cats().map(c=>tarjeta(c.id,CORTO[c.id]||c.nombre)).join("")}${tarjeta("mezcla","Mezcla")}</div>
      <button type="button" id="impWpp">💬 Invitar por WhatsApp</button>
    </div>`;
    const pintar=()=>{
      q("impCant").textContent=cant;
      if(cant<6&&cantImp===2)cantImp=1;
      raiz.querySelectorAll("#impImp button").forEach(b=>{b.classList.toggle("activo",Number(b.dataset.n)===cantImp);b.disabled=Number(b.dataset.n)===2&&cant<6;});
      const cont=q("impNombres"),previos=[...cont.querySelectorAll("input")].map(i=>i.value);
      previos.forEach((v,i)=>nombres[i]=v);
      cont.innerHTML="";
      for(let i=0;i<cant;i++){const inp=document.createElement("input");inp.type="text";inp.maxLength=14;inp.placeholder="Jugador "+(i+1);inp.value=nombres[i]||"";inp.oninput=()=>{nombres[i]=inp.value;guardar();};cont.appendChild(inp);}
    };
    pintar();
    q("impMenos").onclick=()=>{if(cant>MIN){cant--;guardar();pintar();}};
    q("impMas").onclick=()=>{if(cant<MAX){cant++;guardar();pintar();}};
    q("impImp").onclick=e=>{const b=e.target.closest("button[data-n]");if(!b||b.disabled)return;cantImp=Number(b.dataset.n);guardar();pintar();};
    q("impCats").onclick=e=>{const b=e.target.closest("button[data-cat]");if(!b)return;catId=b.dataset.cat;guardar();nuevaRonda();};
    q("impWpp").onclick=()=>PantallaFija.invitar("impostor","Impostor");
  }
  function elegirPalabra(){
    const todas=cats().flatMap(c=>c.palabras.map(w=>({w,cat:c})));
    const lista=catId==="mezcla"?todas:todas.filter(x=>x.cat.id===catId);
    /* Una sola memoria para todas las categorías (antes "mezcla" y cada categoría
       llevaban la cuenta por separado y una palabra podía volver a salir). */
    Vistas.unir("impostor");
    const libres=Vistas.filtrar("impostor",lista,x=>x.w);
    const p=libres[Math.floor(Math.random()*libres.length)];
    Vistas.marcar("impostor",p.w);return p;
  }
  function nuevaRonda(){
    const p=elegirPalabra(),idx=[...Array(cant).keys()];
    for(let i=idx.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}
    ronda={palabra:p.w,cat:p.cat,impostores:idx.slice(0,cantImp),turno:0,empieza:Math.floor(Math.random()*cant)};
    for(let i=0;i<cant;i++)if(!(nombre(i) in puntos))puntos[nombre(i)]=0;
    PantallaFija.activar();
    pase();
  }
  function pantallaJuego(html){
    raiz.innerHTML=`<div class="qns-pantalla imp-juego"><button type="button" class="pf-salir" id="impSalir">✕ Salir</button>${html}</div>`;
    PantallaFija.confirmar(q("impSalir"),configurar);
  }
  /* Reparto: "Pasale el celular a X" → ver palabra → ocultar y pasar. */
  function pase(){
    const i=ronda.turno;
    pantallaJuego(`<div class="imp-centro">${img("pasar")}<small>${i+1} de ${cant}</small><div class="imp-quien">📱 Pasale el celular a</div><div class="imp-nombre">${esc(nombre(i))}</div>
      <p class="imp-ayuda">Que nadie más mire la pantalla</p><button type="button" class="bb-pasar" id="impVer">👁 Ver mi palabra</button></div>`);
    q("impVer").onclick=ver;
  }
  function ver(){
    const i=ronda.turno,esImp=ronda.impostores.includes(i),ultimo=i===cant-1;
    /* La carta se da vuelta igual para todos (misma animación y tiempo): solo cambia el frente. */
    pantallaJuego(`<div class="imp-centro"><div class="imp-flip"><div class="imp-flip-in">
      <div class="imp-cara imp-dorso"><img src="${src("carta_dorso")}" alt="" draggable="false"></div>
      ${esImp
      ?`<div class="imp-cara imp-fr-imp"><img src="${src("carta_impostor")}" alt="" draggable="false"><div class="imp-en-carta"><div class="imp-rol">SOS EL IMPOSTOR</div><div class="imp-pista">Categoría: ${ronda.cat.emoji} ${esc(ronda.cat.nombre)}</div></div></div></div></div>
      <p class="imp-ayuda">Disimulá: escuchá a los demás y decí algo que encaje.</p>`
      :`<div class="imp-cara imp-fr-civil"><img src="${src("carta_palabra")}" alt="" draggable="false"><div class="imp-en-carta"><small>Tu palabra es</small><div class="imp-palabra">${esc(ronda.palabra)}</div></div></div></div></div>
      <p class="imp-ayuda">No la digas: decí algo relacionado.</p>`}
      <button type="button" class="bb-pasar" id="impListo">${ultimo?"Ya la vi · Empezar ➜":"Ya la vi · Ocultar y pasar ➜"}</button></div>`);
    /* Igual para todos (sin sonido): que nadie se dé cuenta de quién es el impostor. */
    if(typeof vibrar==="function")vibrar(20);
    q("impListo").onclick=()=>{ronda.turno++;if(ronda.turno<cant)pase();else charla();};
  }
  function charla(){
    pantallaJuego(`<div class="imp-centro">${img("ronda")}<div class="imp-quien">🗣️ Empieza</div><div class="imp-nombre">${esc(nombre(ronda.empieza))}</div>
      <p class="imp-ayuda">En ronda, cada uno dice <b>una palabra</b> relacionada con la suya. Pueden dar 2 o 3 vueltas.<br>${cantImp===2?"Hay <b>2 impostores</b>":"Hay <b>1 impostor</b>"} entre ustedes 👀</p>
      <button type="button" class="bb-pasar" id="impVotar">🗳️ Ir a votar</button></div>`);
    q("impVotar").onclick=votar;
  }
  function votar(){
    pantallaJuego(`<div class="imp-centro">${img("votar")}<div class="imp-quien">🗳️ ¿Quién es el impostor?</div><p class="imp-ayuda">Pónganse de acuerdo y toquen al más votado</p>
      <div class="imp-votos">${[...Array(cant).keys()].map(i=>`<button type="button" data-i="${i}">${esc(nombre(i))}</button>`).join("")}</div></div>`);
    raiz.querySelector(".imp-votos").onclick=e=>{const b=e.target.closest("button[data-i]");if(b)resultadoVoto(Number(b.dataset.i));};
  }
  function resultadoVoto(i){
    const atrapado=ronda.impostores.includes(i);
    if(!atrapado){fin(false,i);return;}
    sonar(660,.15,"sine",.06);sonar(990,.25,"triangle",.04);
    pantallaJuego(`<div class="imp-centro">${img("atrapado")}<div class="imp-carta"><div class="imp-rol imp-ok">🎯 ¡Atraparon a ${esc(nombre(i))}!</div>
      <p>Última chance: el impostor dice en voz alta cuál cree que es la palabra.</p></div>
      <div class="imp-dos-btn"><button type="button" class="bb-pasar" id="impNo">❌ No adivinó</button><button type="button" class="bb-pasar imp-gris" id="impSi">✔ Adivinó</button></div></div>`);
    q("impNo").onclick=()=>fin(true,i);q("impSi").onclick=()=>fin(false,i,true);
  }
  function fin(ganaronCiviles,votado,adivino){
    const imps=ronda.impostores.map(nombre);
    if(ganaronCiviles){for(let i=0;i<cant;i++)if(!ronda.impostores.includes(i))puntos[nombre(i)]=(puntos[nombre(i)]||0)+1;}
    else imps.forEach(n=>puntos[n]=(puntos[n]||0)+2);
    partidas++;guardar();
    if(ganaronCiviles){sonar(523,.15);setTimeout(()=>sonar(659,.15),140);setTimeout(()=>sonar(784,.3),280);}
    else{sonar(330,.2,"sawtooth",.04);setTimeout(()=>sonar(220,.35,"sawtooth",.04),180);}
    const titulo=ganaronCiviles?"🎉 ¡Ganaron los jugadores!":adivino?"😈 ¡El impostor adivinó la palabra!":"😈 ¡Ganó el impostor!";
    const tabla=Object.entries(puntos).sort((a,b)=>b[1]-a[1]).map(([n,p])=>`<li><span>${esc(n)}</span><b>${p}</b></li>`).join("");
    pantallaJuego(`<div class="mg-panel imp-panel imp-fin">${img(ganaronCiviles?"atrapado":"gano_impostor")}<h3>${titulo}</h3>
      <p>${imps.length>1?"Los impostores eran":"El impostor era"} <b>${esc(imps.join(" y "))}</b>.<br>La palabra era <b>${esc(ronda.palabra)}</b>.${!ganaronCiviles&&!adivino?`<br>Votaron a ${esc(nombre(votado))}.`:""}</p>
      <div class="qs-sub">🏆 Puntos</div><ul class="imp-tabla">${tabla}</ul>
      <button type="button" class="mg-principal" id="impOtra">🔄 Otra ronda</button>
      <button type="button" id="impCambiar">👥 Cambiar jugadores</button></div>`);
    q("impOtra").onclick=nuevaRonda;q("impCambiar").onclick=configurar;
  }
  function salir(){if(raiz)PantallaFija.salir();if(raiz)raiz.remove();raiz=null;ronda=null;}
  return{abrir,salir,partidasJugadas:()=>{cargar();return partidas;}};
})();
window.Impostor=Impostor;
