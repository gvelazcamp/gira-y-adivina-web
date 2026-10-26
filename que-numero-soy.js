/* ¿Qué número soy?: el celular muestra un número gigante en pantalla
   completa (se lo ponen en la frente o lo muestran al grupo). Mientras
   dura la ronda (PantallaFija) la pantalla no se apaga, los toques no
   hacen nada y el botón "atrás" no saca del juego: para terminar hay que
   tocar ✕ Salir y confirmar. Récord en gya_que_numero_soy. */
const QueNumeroSoy=(()=>{
  const CLAVE="gya_que_numero_soy",RANGOS=[10,50,100];
  let raiz=null,capa=null,max=100,numero=0,rondas=0,cuenta=0,bloqueado=false;
  function cargar(){try{const d=JSON.parse(localStorage.getItem(CLAVE));if(d&&typeof d==="object"){if(RANGOS.includes(d.max))max=d.max;rondas=Number(d.rondas)||0;}}catch(e){}}
  function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify({max,rondas}));}catch(e){}}
  cargar();
  const q=id=>raiz.querySelector("#"+id);
  /* Arte en assets/que-numero-soy/ (hoja de ChatGPT recortada): tema bingo, el número va dentro de una bolilla. */
  const src=n=>"assets/que-numero-soy/"+n+".webp";
  const ARTE_RANGO={10:"facil",50:"medio",100:"dificil"};

  /* Pantalla completa, sin apagarse y sin "atrás": PantallaFija (pantalla-fija.js). */
  function frenar(e){if(!bloqueado||e.target.closest(".pf-salir"))return;if(e.cancelable)e.preventDefault();e.stopPropagation();}

  function abrir(contenedor){
    salir();cargar();
    raiz=document.createElement("section");raiz.className="qns";
    raiz.innerHTML=`<div class="mg-panel qns-panel"><img class="qn-como" src="${src("como")}" alt="" draggable="false">
      <p>El celular muestra un número gigante. Ponételo en la frente: los demás te dan pistas y vos adiviná tu número.</p>
      <p class="qns-nota qn-nota"><img src="${src("candado")}" alt="" draggable="false"><span>Mientras juegan la pantalla no se apaga y los toques no hacen nada. Para terminar tocá <b>✕ Salir</b>.</span></p>
      <div class="qns-rangos qn-rangos" id="qnsRangos">${RANGOS.map(r=>`<button type="button" data-max="${r}"><img src="${src(ARTE_RANGO[r])}" alt="" draggable="false"><span>1 a ${r}</span></button>`).join("")}</div>
      <button type="button" class="mg-principal" id="qnsEmpezar">▶ Empezar</button>
      <button type="button" id="qnsWpp">💬 Invitar por WhatsApp</button>
    </div>
    <div class="qns-pantalla qn-escena" id="qnsPantalla" hidden>
      <div class="qn-bola"><div class="qns-num" id="qnsNum"></div></div>
      <button type="button" class="pf-salir" id="qnsSalir">✕ Salir</button>
      <div class="qns-pie" id="qnsPie"></div>
    </div>
    <div class="qns-pantalla qns-fin" id="qnsFin" hidden>
      <div class="mg-panel qns-panel"><img class="qn-revela" src="${src("revela")}" alt="" draggable="false"><h3>Tu número era</h3><div class="qn-bola qn-bola-chica"><div class="qns-num" id="qnsEra"></div></div>
        <button type="button" class="mg-principal" id="qnsOtro">🔄 Otro número</button>
        <button type="button" id="qnsTerminar">Terminar</button>
      </div>
    </div>`;
    contenedor.appendChild(raiz);
    PantallaFija.bienvenida(contenedor,{logo:src("logo"),alt:"¿Qué número soy?",items:[["📱","El celular muestra un <b>número gigante</b>: ponételo en la frente sin mirar."],["🗣️","Los demás te dan <b>pistas</b> y vos adivinás tu número."],["🎯","Elegí si el número va de <b>1 a 10</b>, <b>1 a 50</b> o <b>1 a 100</b>."],["🔒","Mientras juegan la pantalla no se apaga. Para terminar tocá <b>✕ Salir</b>."]]});
    ["bolilla","fondo","revela"].forEach(n=>{const i=new Image();i.src=src(n);});
    pintarRangos();
    q("qnsRangos").onclick=e=>{const b=e.target.closest("button[data-max]");if(!b)return;max=Number(b.dataset.max);guardar();pintarRangos();};
    q("qnsEmpezar").onclick=empezar;
    q("qnsOtro").onclick=empezar;
    q("qnsTerminar").onclick=terminar;
    q("qnsWpp").onclick=()=>PantallaFija.invitar("que-numero-soy","¿Qué número soy?");
    capa=q("qnsPantalla");
    PantallaFija.confirmar(q("qnsSalir"),desbloquear);
    ["touchstart","touchmove","touchend","contextmenu","dblclick","wheel"].forEach(t=>capa.addEventListener(t,frenar,{passive:false}));
  }
  function pintarRangos(){raiz.querySelectorAll("#qnsRangos button").forEach(b=>b.classList.toggle("activo",Number(b.dataset.max)===max));}
  function empezar(){
    if(!raiz)return;
    /* Ningún número se repite en ese rango hasta que salieron todos. */
    const todos=Array.from({length:max},(_,i)=>i+1),libres=Vistas.filtrar("qns_"+max,todos,x=>x);
    numero=libres[Math.floor(Math.random()*libres.length)];Vistas.marcar("qns_"+max,numero);
    bloqueado=true;
    PantallaFija.activar();
    q("qnsFin").hidden=true;capa.hidden=false;document.body.classList.add("qns-bloqueado");
    /* Cuenta regresiva para que llegue a ponérselo en la frente sin verlo. */
    let n=3;const num=q("qnsNum"),pie=q("qnsPie");
    num.classList.add("qns-cuenta");num.classList.remove("tres");pie.textContent="Ponete el celular en la frente";pie.hidden=false;
    const paso=()=>{
      if(!raiz||!bloqueado)return;
      if(n>0){num.textContent=n;n--;cuenta=setTimeout(paso,1000);return;}
      num.classList.remove("qns-cuenta");num.textContent=numero;num.classList.toggle("tres",numero>99);
      pie.hidden=true;
      if(typeof vibrar==="function")vibrar(40);
    };
    clearTimeout(cuenta);paso();
  }
  function desbloquear(){
    clearTimeout(cuenta);
    bloqueado=false;capa.hidden=true;document.body.classList.remove("qns-bloqueado");
    rondas++;guardar();
    q("qnsEra").textContent=numero;q("qnsEra").classList.toggle("tres",numero>99);q("qnsFin").hidden=false;
    if(typeof vibrar==="function")vibrar([30,40,30]);
    /* La pantalla sigue prendida hasta que tocan "Terminar". */
  }
  function terminar(){bloqueado=false;PantallaFija.desactivar();if(raiz){q("qnsFin").hidden=true;capa.hidden=true;}document.body.classList.remove("qns-bloqueado");}
  function salir(){
    clearTimeout(cuenta);
    if(bloqueado||raiz)PantallaFija.salir();bloqueado=false;document.body.classList.remove("qns-bloqueado");
    if(raiz)raiz.remove();raiz=null;capa=null;
  }
  return{abrir,salir,tecla:(k,e)=>{if(bloqueado&&e){e.preventDefault();}},bloqueado:()=>bloqueado,rondasJugadas:()=>{cargar();return rondas;}};
})();
window.QueNumeroSoy=QueNumeroSoy;
