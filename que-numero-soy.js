/* ¿Qué número soy?: preguntas por voz con un solo celular o en la tele.
   Quien adivina da vuelta el celular: solo los demás ven la respuesta. */
const QueNumeroSoy=(()=>{
  const CLAVE='gya_que_numero_soy',PID='numero-local';
  let raiz=null,controles=null,pantalla=null,motor=null,micro=null,tic=null,cuenta=null,medidas=null,toque=null,toqueToken='',ultimoToque=0,pendiente=false,bloqueado=false,herramientasAbiertas=false,rondas=0,nombres=[];
  function cargar(){
    let d={};try{d=JSON.parse(localStorage.getItem(CLAVE))||{};}catch(e){}
    rondas=Number(d.rondas)||0;nombres=Array.isArray(d.nombres)?d.nombres.filter(n=>typeof n==='string'&&n.trim()).slice(0,8):[];
    if(!nombres.length){let n='';try{n=window.gyaPerfil?.()?.nombre||localStorage.getItem('gya_nombre')||'';}catch(e){}nombres=[n||'Jugador 1'];}
  }
  function guardar(){try{const d=JSON.parse(localStorage.getItem(CLAVE))||{};localStorage.setItem(CLAVE,JSON.stringify({...d,rondas,nombres}));}catch(e){}}
  const tono=(f,d,t='sine')=>{try{window.bip?.(f,d,t,.06);}catch(e){}};
  const sonido={ok(){tono(880,.14);try{window.vibrar?.(60);}catch(e){}},mal(){tono(170,.22,'triangle');try{window.vibrar?.([40,30,40]);}catch(e){}},tiempo(){tono(220,.5);try{window.vibrar?.([100,60,100]);}catch(e){}},turno(){tono(550,.08);}};
  function limpiarToque(){clearTimeout(toque);toque=null;toqueToken='';ultimoToque=0;}
  function fijar(valor){if(valor===bloqueado)return;bloqueado=valor;if(valor)PantallaFija.activar({orientacion:'landscape'});else PantallaFija.desactivar();}
  function ajustarNumero(){const n=pantalla?.querySelector('.nv-answer');if(n)n.style.fontSize=Math.min(pantalla.clientWidth*1.5/n.textContent.length,pantalla.clientHeight*.82)+'px';}
  function tocar(e){
    if(e.target.closest('details,button,summary')||!motor||pendiente)return;
    const c=motor.cel();if(c.fase!=='playing')return;
    const ahora=performance.now();
    if(toque&&toqueToken===c.token&&ahora-ultimoToque<320){limpiarToque();enviar('nv_paso',{token:c.token});return;}
    limpiarToque();toqueToken=c.token;ultimoToque=ahora;toque=setTimeout(()=>{limpiarToque();if(raiz)enviar('nv_ok',{token:c.token});},320);
  }
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
  function pausar(){limpiarToque();if(pendiente)cancelarCuenta();else if(motor)motor.accion({a:'nv_pausa',pid:PID});}
  function pintar(){
    if(!raiz||!motor||pendiente)return;
    const c=motor.cel(),jugando=['reading','arming','playing'].includes(c.fase);
    if(c.fase!=='playing'||(toqueToken&&toqueToken!==c.token))limpiarToque();
    pantalla.hidden=!jugando;controles.hidden=jugando;fijar(jugando);
    if(jugando){
      motor.pintar(pantalla);
      ajustarNumero();
      const acciones=document.createElement('details');acciones.className='nv-local-actions';acciones.open=herramientasAbiertas;
      acciones.innerHTML=`<summary aria-label="Controles de la partida">⋯</summary><div class="nv-local-actions-panel"><button type="button" data-qns-pass ${c.fase!=='playing'?'disabled':''}>Paso</button><button type="button" data-qns-ok ${c.fase!=='playing'?'disabled':''}>Lo dijo bien</button><button type="button" data-qns-pause>Ⅱ Pausar</button></div>`;
      pantalla.append(acciones);acciones.querySelector('summary').onclick=()=>{herramientasAbiertas=!acciones.open;};
      acciones.querySelector('[data-qns-pass]').onclick=()=>{herramientasAbiertas=false;enviar('nv_paso',{token:c.token});};acciones.querySelector('[data-qns-ok]').onclick=()=>{herramientasAbiertas=false;enviar('nv_ok',{token:c.token});};acciones.querySelector('[data-qns-pause]').onclick=()=>{herramientasAbiertas=false;pausar();};
    }
    micro.pintar(c,'<div class="nv-local-brand"><img src="assets/que-numero-soy/logo.webp" alt="¿Qué número soy?"><p>Adiviná el número · Preguntas por voz</p></div>',true);
    if(c.fase==='config'&&!controles.querySelector('[data-qns-tv]')){
      const b=document.createElement('button');b.type='button';b.className='tl-boton';b.dataset.qnsTv='';b.textContent='📺 Jugar en la tele';b.onclick=()=>window.Tele?.compartirPantalla();controles.querySelector('.nv-phone').append(b);
      const invitar=document.createElement('button');invitar.type='button';invitar.className='tl-boton';invitar.textContent='💬 Invitar por WhatsApp';invitar.onclick=()=>PantallaFija.invitar('que-numero-soy','¿Qué número soy?');controles.querySelector('.nv-phone').append(invitar);
    }
  }
  function iniciar(){
    clearTimeout(cuenta);clearInterval(tic);limpiarToque();pendiente=false;herramientasAbiertas=false;micro?.salir();motor?.fin();fijar(false);
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
    pantalla.addEventListener('click',tocar);pantalla.addEventListener('dblclick',e=>{if(!e.target.closest('details,button,summary'))e.preventDefault();});
    if(window.ResizeObserver){medidas=new ResizeObserver(ajustarNumero);medidas.observe(pantalla);}window.addEventListener('resize',ajustarNumero);
    if(!window.NumeroVoz){controles.textContent='No se pudo cargar el juego. Volvé a abrirlo.';return;}
    iniciar();document.addEventListener('keydown',teclado,true);document.addEventListener('visibilitychange',ocultar);window.addEventListener('pagehide',salir);
    PantallaFija.bienvenida(contenedor,{logo:'assets/que-numero-soy/logo.webp',alt:'¿Qué número soy?',items:[['📱','<b>Celular horizontal y dado vuelta</b>: los demás ven solo el número gigante.'],['🎙','Elegí <b>jugar con micrófono</b> y aceptá el permiso. La pregunta solo se escucha: respondé o decí «paso».'],['👆','Con micrófono o sin él: <b>un toque es acierto; dos toques rápidos, pasar</b>.'],['⏱','Cada jugador tiene <b>30 segundos</b>. Gana quien suma más aciertos.']]});
  }
  function salir(){
    clearTimeout(cuenta);clearInterval(tic);limpiarToque();cuenta=tic=null;pendiente=false;micro?.salir();motor?.fin();micro=motor=null;
    medidas?.disconnect();medidas=null;window.removeEventListener('resize',ajustarNumero);
    document.removeEventListener('keydown',teclado,true);document.removeEventListener('visibilitychange',ocultar);window.removeEventListener('pagehide',salir);
    if(raiz){fijar(false);PantallaFija.salir();raiz.remove();}raiz=controles=pantalla=null;
  }
  return{abrir,salir,tecla:(k,e)=>{if(bloqueado&&e)teclado(e);},bloqueado:()=>bloqueado,rondasJugadas:()=>{cargar();return rondas;}};
})();
window.QueNumeroSoy=QueNumeroSoy;
