/* ¿Qué número soy?: preguntas por voz con un solo celular o en la tele.
   Quien adivina da vuelta el celular: solo los demás ven la respuesta. */
const QueNumeroSoy=(()=>{
  const CLAVE='gya_que_numero_soy',PID='numero-local';
  let raiz=null,controles=null,pantalla=null,motor=null,micro=null,tic=null,cuenta=null,pendiente=false,bloqueado=false,rondas=0,nombres=[];
  function cargar(){
    let d={};try{d=JSON.parse(localStorage.getItem(CLAVE))||{};}catch(e){}
    rondas=Number(d.rondas)||0;nombres=Array.isArray(d.nombres)?d.nombres.filter(n=>typeof n==='string'&&n.trim()).slice(0,8):[];
    if(!nombres.length){let n='';try{n=window.gyaPerfil?.()?.nombre||localStorage.getItem('gya_nombre')||'';}catch(e){}nombres=[n||'Jugador 1'];}
  }
  function guardar(){try{const d=JSON.parse(localStorage.getItem(CLAVE))||{};localStorage.setItem(CLAVE,JSON.stringify({...d,rondas,nombres}));}catch(e){}}
  const sonido={ok(){try{window.vibrar?.(60);}catch(e){}},tiempo(){try{window.vibrar?.([100,60,100]);}catch(e){}},turno(){}};
  function fijar(valor){if(valor===bloqueado)return;bloqueado=valor;if(valor)PantallaFija.activar();else PantallaFija.desactivar();}
  function enviar(a,extra={}){
    if(!motor)return;
    if(a==='menu'){iniciar();return;}
    if(a==='nv_config'&&Array.isArray(extra.nombres)){nombres=extra.nombres.map(n=>String(n).trim()).filter(Boolean).slice(0,8);guardar();}
    const m={...extra,a,pid:PID};
    if(a==='nv_empezar'||a==='nv_reanudar'){preparar(m);return;}
    motor.accion(m);
  }
  function preparar(m){
    if(pendiente||!['ready','paused'].includes(motor.cel().fase))return;
    pendiente=true;micro.parar();controles.hidden=true;pantalla.hidden=false;fijar(true);
    let n=3;
    const dibujar=()=>{
      pantalla.innerHTML=`<div class="nv-local-count"><p>Da vuelta el celular</p><b>${n}</b><p>Los demás verán el número.<br>Vos escuchás la pregunta y respondés.</p><button type="button" class="tl-boton" data-qns-cancel>Cancelar</button></div>`;
      pantalla.querySelector('[data-qns-cancel]').onclick=cancelarCuenta;
    };
    const paso=()=>{if(!raiz||!pendiente)return;if(--n>0){dibujar();cuenta=setTimeout(paso,1000);}else{cuenta=null;pendiente=false;motor.accion(m);}};
    dibujar();cuenta=setTimeout(paso,1000);
  }
  function cancelarCuenta(){clearTimeout(cuenta);cuenta=null;pendiente=false;fijar(false);pintar();}
  function pausar(){if(pendiente)cancelarCuenta();else if(motor)motor.accion({a:'nv_pausa',pid:PID});}
  function pintar(){
    if(!raiz||!motor||pendiente)return;
    const c=motor.cel(),jugando=['reading','arming','playing'].includes(c.fase);
    pantalla.hidden=!jugando;controles.hidden=jugando;fijar(jugando);
    if(jugando){
      motor.pintar(pantalla);
      const puntos=c.jug[c.turno]?.pts||0;pantalla.querySelector('.nv-tv header span').textContent=c.quien+' · '+puntos+(puntos===1?' acierto':' aciertos');
      const numero=pantalla.querySelector('.nv-answer');numero.style.setProperty('--nv-size',`min(${Math.min(52,140/numero.textContent.length)}vw,40vh)`);
      pantalla.querySelector('.nv-notice').textContent=c.fase==='reading'?'Escuchá la pregunta':c.fase==='arming'?'Preparando micrófono':c.aviso;
      const acciones=document.createElement('div');acciones.className='nv-local-actions';
      acciones.innerHTML=`<button type="button" data-qns-pass ${c.fase!=='playing'?'disabled':''}>Paso</button><button type="button" data-qns-ok ${c.fase!=='playing'?'disabled':''}>Lo dijo bien</button><button type="button" data-qns-pause>Ⅱ Pausar</button>`;
      pantalla.append(acciones);acciones.querySelector('[data-qns-pass]').onclick=()=>enviar('nv_paso',{token:c.token});acciones.querySelector('[data-qns-ok]').onclick=()=>enviar('nv_ok',{token:c.token});acciones.querySelector('[data-qns-pause]').onclick=pausar;
    }
    micro.pintar(c,'<div class="nv-local-brand"><img src="assets/que-numero-soy/logo.webp" alt="¿Qué número soy?"><p>Adiviná el número · Preguntas por voz</p></div>',true);
    if(c.fase==='config'&&!controles.querySelector('[data-qns-tv]')){
      const b=document.createElement('button');b.type='button';b.className='tl-boton';b.dataset.qnsTv='';b.textContent='📺 Jugar en la tele';b.onclick=()=>window.Tele?.compartirPantalla();controles.querySelector('.nv-phone').append(b);
      const invitar=document.createElement('button');invitar.type='button';invitar.className='tl-boton';invitar.textContent='💬 Invitar por WhatsApp';invitar.onclick=()=>PantallaFija.invitar('que-numero-soy','¿Qué número soy?');controles.querySelector('.nv-phone').append(invitar);
    }
  }
  function iniciar(){
    clearTimeout(cuenta);clearInterval(tic);pendiente=false;micro?.salir();motor?.fin();fijar(false);
    const T={mando:PID,jug:nombres.map(n=>({pid:PID,n}))};
    motor=NumeroVoz.crearTele(T,pintar,{SND:sonido,local:true,podioTele(){rondas++;guardar();}});
    micro=NumeroVoz.crearCel(controles,PID,enviar,{local:true});pintar();
    let antes=performance.now();tic=setInterval(()=>{const ahora=performance.now();motor?.tic(ahora-antes);antes=ahora;},200);
  }
  const teclado=e=>{if(!bloqueado||e.key==='Tab')return;e.stopImmediatePropagation();e.preventDefault();if(e.key==='Escape')pausar();};
  const ocultar=()=>{if(document.hidden&&pendiente)cancelarCuenta();};
  function abrir(contenedor){
    salir();cargar();raiz=document.createElement('section');raiz.className='nv-local';
    raiz.innerHTML='<div class="nv-local-controls"></div><div class="nv-local-play" id="qnsPantalla" hidden></div>';contenedor.append(raiz);
    controles=raiz.querySelector('.nv-local-controls');pantalla=raiz.querySelector('.nv-local-play');
    if(!window.NumeroVoz){controles.textContent='No se pudo cargar el juego. Volvé a abrirlo.';return;}
    iniciar();document.addEventListener('keydown',teclado,true);document.addEventListener('visibilitychange',ocultar);window.addEventListener('pagehide',salir);
    PantallaFija.bienvenida(contenedor,{logo:'assets/que-numero-soy/logo.webp',alt:'¿Qué número soy?',items:[['📱','<b>Da vuelta el celular</b>: los demás ven el número y vos no.'],['🎙','La voz lee <b>solo la pregunta</b>. Vos respondés hablando.'],['⏱','Tenés <b>30 segundos</b> para acertar la mayor cantidad. Decí «paso» para otra pregunta.'],['🏆','Pasen el celular al siguiente jugador. Gana quien suma más aciertos.']]});
  }
  function salir(){
    clearTimeout(cuenta);clearInterval(tic);cuenta=tic=null;pendiente=false;micro?.salir();motor?.fin();micro=motor=null;
    document.removeEventListener('keydown',teclado,true);document.removeEventListener('visibilitychange',ocultar);window.removeEventListener('pagehide',salir);
    if(raiz){fijar(false);PantallaFija.salir();raiz.remove();}raiz=controles=pantalla=null;
  }
  return{abrir,salir,tecla:(k,e)=>{if(bloqueado&&e)teclado(e);},bloqueado:()=>bloqueado,rondasJugadas:()=>{cargar();return rondas;}};
})();
window.QueNumeroSoy=QueNumeroSoy;
