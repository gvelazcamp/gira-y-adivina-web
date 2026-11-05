/* Modo TV de ¿Qué número soy?: la respuesta solo se dibuja en la tele. */
window.NumeroVoz=(()=>{
  'use strict';
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
  const small=['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciseis','diecisiete','dieciocho','diecinueve'];
  const tens=['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
  const hundreds=['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
  function words(n){if(n<20)return small[n];if(n<30)return n===20?'veinte':'veinti'+small[n-20];if(n<100)return tens[Math.floor(n/10)]+(n%10?' y '+small[n%10]:'');if(n===100)return'cien';return hundreds[Math.floor(n/100)]+(n%100?' '+words(n%100):'');}
  const numbers=new Map(Array.from({length:1000},(_,n)=>[words(n),n]));
  function numero(text){
    let s=norm(text).replace(/^(?:(?:creo que|yo digo|mi respuesta|el numero|el ano|en el ano|fue en|fue|son|es|en)\s+)+/,'').replace(/[!?¿¡,;:]$/,'').trim();
    s=s.replace(/\.$/,'');
    if(/^\d{1,6}$/.test(s))return Number(s);
    if(/^\d{1,3}(?:[., ]\d{3})+$/.test(s))return Number(s.replace(/[., ]/g,''));
    s=s.replace(/\.$/,'').replace(/\b(?:un|una)\b/g,'uno').replace(/\bveintiun[ao]?\b/g,'veintiuno');
    if(numbers.has(s))return numbers.get(s);
    if(s==='mil')return 1000;
    const match=s.match(/^(?:(.+) )?mil(?: (.+))?$/);
    if(!match)return null;const a=match[1]?numbers.get(match[1]):1,b=match[2]?numbers.get(match[2]):0;
    return Number.isInteger(a)&&a>0&&Number.isInteger(b)?a*1000+b:null;
  }
  function crearTele(T,update,{SND,podioTele,local=false}){
    let phase='config',players=[],turn=0,round=1,remaining=30000,deadline=0,started=false,current=null,serial=0,reading=null,timer=null,generation=0,dead=false,manual=false,notice='',last='',arming=0;
    const used=new Set(),epoch=Math.random().toString(36).slice(2),name=()=>players[turn]?.n||'',mic=()=>players[turn]?.mic||T.mando;
    const token=()=>epoch+':'+round+':'+turn+':'+serial;
    const connected=()=>T.jug.filter(j=>!j.espejo);
    function cancelRead(){generation++;clearTimeout(timer);timer=null;if(reading){reading.onend=reading.onerror=null;reading=null;try{speechSynthesis.cancel();}catch(e){}}}
    function changed(){if(!dead)update();}
    function stopTurn(){if(dead)return;cancelRead();remaining=0;deadline=0;phase='turnEnd';notice='¡Tiempo!';SND.tiempo();changed();}
    function checkClock(){if(deadline&&['reading','playing','arming'].includes(phase)){remaining=Math.max(0,deadline-performance.now());if(!remaining){stopTurn();return false;}}return true;}
    function listen(){if(dead)return;reading=null;clearTimeout(timer);timer=null;if(!started&&!manual){phase='arming';arming=0;notice='Preparando micrófono';}else{phase='playing';notice=manual?'Escuchá al jugador':'Respondé hablando';if(!started){started=true;deadline=performance.now()+remaining;}}changed();}
    function read(){
      cancelRead();phase='reading';if(started&&!deadline)deadline=performance.now()+remaining;notice='Escuchá la pregunta';changed();const gen=generation;
      timer=setTimeout(()=>{
        if(dead||gen!==generation||phase!=='reading')return;
        if(!window.speechSynthesis||!window.SpeechSynthesisUtterance||(typeof window.sonidoPermitido==='function'&&!sonidoPermitido())){notice='Leé la pregunta en voz alta';listen();return;}
        const u=new SpeechSynthesisUtterance(current.pregunta);reading=u;u.lang='es-UY';u.rate=1.08;
        try{const voice=window.obtenerVozMasculina?.();if(voice)u.voice=voice;}catch(e){}
        const done=()=>{if(!dead&&reading===u&&gen===generation)listen();};u.onend=done;u.onerror=done;
        try{speechSynthesis.speak(u);timer=setTimeout(()=>{if(reading===u){cancelRead();listen();}},14000);}catch(e){done();}
      },350);
    }
    function next(){
      const all=window.NUMERO_VOZ_DATOS||[];if(!all.length){notice='No se pudieron cargar las preguntas';phase='paused';changed();return;}
      let pool=window.Vistas?Vistas.filtrar('numero_voz_preguntas',all,q=>q.id):all;pool=pool.filter(q=>!used.has(q.id));
      if(!pool.length){used.clear();pool=all;}
      current=(!used.size&&pool.find(q=>q.id==='guerra-1939'))||pool[Math.floor(Math.random()*pool.length)];used.add(current.id);
      window.Vistas?.marcar('numero_voz_preguntas',current.id);serial++;last='';read();
    }
    function ready(){cancelRead();current=null;remaining=30000;deadline=0;started=false;manual=false;phase='ready';notice='De espaldas a la tele';changed();}
    function score(){players[turn].pts++;SND.ok();next();}
    function pause(reason){if(!['playing','reading','arming'].includes(phase)||!checkClock())return;cancelRead();deadline=0;phase='paused';notice=reason||'En pausa';changed();}
    function accion(m){
      if(dead)return;checkClock();const moderator=m.pid===T.mando,active=m.pid===mic(),spectator=T.jug.some(j=>j.pid===m.pid)&&!active;
      if(m.a==='nv_config'&&moderator&&phase==='config'){
        const names=(Array.isArray(m.nombres)?m.nombres:[]).slice(0,8).map(x=>String(x).replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,20)).filter(Boolean);
        if(!names.length)return;players=names.map((n,i)=>({n,pts:0,mic:connected().find(j=>norm(j.n)===norm(n))?.pid||T.mando}));turn=0;ready();return;
      }
      if(m.a==='nv_empezar'&&(moderator||active)&&phase==='ready'){manual=!!m.manual;next();return;}
      if(m.a==='nv_siguiente'&&moderator&&phase==='turnEnd'){
        if(++turn<players.length)ready();else{phase='final';const best=Math.max(...players.map(p=>p.pts));notice=players.filter(p=>p.pts===best).map(p=>p.n).join(' y ');changed();podioTele?.({juego:'¿Qué número soy?',titulo:players.filter(p=>p.pts===best).length>1?'¡Empate!':'¡Ganó '+notice+'!',filas:[...players].sort((a,b)=>b.pts-a.pts).map(p=>({n:p.n,pts:p.pts}))});}return;
      }
      if(m.a==='nv_revancha'&&moderator&&phase==='final'){round++;turn=0;players.forEach(p=>p.pts=0);ready();return;}
      if(m.a==='nv_pausa'&&moderator){pause('En pausa');return;}
      if(m.a==='nv_reanudar'&&moderator&&phase==='paused'){manual=!!m.manual;read();return;}
      if(m.token!==token())return;
      if(m.a==='nv_listo'&&active&&phase==='arming'){phase='playing';started=true;deadline=performance.now()+remaining;arming=0;notice='Respondé hablando';changed();return;}
      if(m.a==='nv_error'&&active){pause('No llegó el audio. Activá el micrófono o continuá marcando desde el control.');return;}
      if(phase!=='playing'||remaining<=0)return;
      if(m.a==='nv_ok'&&(moderator||spectator)){score();return;}
      if(m.a==='nv_paso'&&(active||moderator||spectator)){SND.turno();next();return;}
      if(m.a==='nv_resp'&&active){
        const alts=(Array.isArray(m.alts)?m.alts:[]).slice(0,5).map(x=>String(x).slice(0,120));last=alts[0]||'';
        if(alts.some(x=>/^(paso|pasar|pasapalabra|siguiente|no se)$/.test(norm(x).replace(/[.,!?¿¡]+$/g,'')))){SND.turno?.();next();return;}
        if(alts.some(x=>numero(x)===current.respuesta)){score();return;}
        notice='Probá otra vez';SND.mal?.();changed();
      }
    }
    function tic(dt){
      if(dead)return;
      if(started&&['playing','reading','arming'].includes(phase)){const before=Math.ceil(remaining/1000);if(!checkClock())return;if(Math.ceil(remaining/1000)!==before)changed();}
      if(phase==='arming'&&(arming+=dt)>8000)pause('No llegó el audio. Activá el micrófono o continuá desde el control.');
      if(['playing','arming','reading'].includes(phase)&&!T.jug.some(j=>j.pid===mic()))pause('Se desconectó el celular del jugador.');
    }
    function cel(){return{pantalla:'numero-voz',fase:phase,ronda:round,quien:name(),turno:turn,token:token(),resta:Math.ceil(remaining/1000),escucha:!manual&&['arming','playing'].includes(phase)?mic():null,activo:mic(),pregunta:current?.pregunta||'',jug:players.length?players.map(p=>({n:p.n,pts:p.pts})):connected().map(j=>({n:j.n,pts:0})),aviso:notice,oi:last,manual};}
    function pintar(root){
      if(['reading','arming','playing','paused'].includes(phase)&&current){
        root.innerHTML=`<section class="nv-tv nv-number-only"><div class="nv-answer" style="--nv-digits:${String(current.respuesta).length}">${current.respuesta}</div></section>`;return;
      }
      const rows=players.map((p,i)=>`<span class="${i===turn?'nv-active':''}">${escape(p.n)} <b>${p.pts}</b></span>`).join('');
      root.innerHTML=`<section class="nv-tv"><header><span>¿QUÉ NÚMERO SOY? · RONDA ${round}</span><b class="nv-clock">${Math.ceil(remaining/1000)} s</b></header><div class="nv-score">${rows}</div><div class="nv-center"><img src="assets/que-numero-soy/logo.webp" alt="¿Qué número soy?"><h1>${phase==='config'?'Preguntas por voz':phase==='ready'?'Le toca a '+escape(name()):phase==='final'?'¡Ronda terminada!':'¡Tiempo!'}</h1><p>${phase==='config'?'Cada jugador tiene 30 segundos para sumar aciertos. Configurá los nombres desde el celular.':phase==='ready'?'Ponete de espaldas a la tele. La pregunta solo se escucha.':phase==='final'?'Más aciertos: '+escape(notice):escape(name())+' consiguió '+(players[turn]?.pts||0)+' aciertos.'}</p></div></section>`;
    }
    const onHide=()=>{if(document.hidden)pause(local?'El celular quedó en pausa':'La tele quedó en pausa');};document.addEventListener('visibilitychange',onHide);
    return{accion,tic,cel,pintar,fin(){dead=true;cancelRead();document.removeEventListener('visibilitychange',onHide);}};
  }
  function crearCel(root,yo,send,{local=false}={}){
    let model=null,rec=null,retry=null,partial=null,partialTimer=null,micToken='',view='',heard='',permissionNotice='',wanted=false,permitted=false,listening=false,names=[];
    try{permitted=localStorage.getItem('gya_tele_mic')==='1';}catch(e){}
    const hasMic=()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition);
    function stop(){wanted=false;listening=false;clearTimeout(retry);clearTimeout(partialTimer);retry=partialTimer=null;partial=null;if(rec){const old=rec;rec=null;old.onend=old.onresult=old.onerror=null;try{old.abort();}catch(e){}}}
    function sendAnswer(alts,token){send('nv_resp',{token,alts});}
    function start(){
      if(!wanted||rec||!permitted||document.hidden||!hasMic())return;
      const C=window.SpeechRecognition||window.webkitSpeechRecognition,r=new C(),token=model.token;rec=r;micToken=token;r.lang='es-UY';r.continuous=true;r.interimResults=true;r.maxAlternatives=5;
      r.onaudiostart=()=>{if(rec!==r)return;listening=true;send('nv_listo',{token});const el=root.querySelector('.nv-mic-state');if(el)el.textContent='🎙 Te escucho';};
      r.onresult=e=>{
        if(rec!==r)return;
        for(let i=e.resultIndex||0;i<e.results.length;i++){
          const result=e.results[i],alts=Array.from(result).map(a=>String(a.transcript||''));heard=alts[0]||'';const el=root.querySelector('.nv-heard');if(el)el.textContent=heard?'Oí: «'+heard+'»':'';
          clearTimeout(partialTimer);partial=null;
          if(result.isFinal)sendAnswer(alts,token);
          else{partial=alts;partialTimer=setTimeout(()=>{if(rec===r&&partial===alts){partial=null;sendAnswer(alts,token);}},850);}
        }
      };
      r.onerror=e=>{if(rec!==r)return;if(['not-allowed','service-not-allowed','audio-capture','language-not-supported'].includes(e.error)){permitted=false;try{localStorage.removeItem('gya_tele_mic');}catch(x){}stop();send('nv_error',{token});view='';paint(model,'',false);}};
      r.onend=()=>{if(rec!==r)return;rec=null;listening=false;clearTimeout(partialTimer);if(partial&&wanted){sendAnswer(partial,token);partial=null;}if(wanted)retry=setTimeout(start,350);};
      try{r.start();}catch(e){rec=null;retry=setTimeout(start,700);}
    }
    function permission(done){
      const C=window.SpeechRecognition||window.webkitSpeechRecognition;if(!C)return;
      stop();const r=new C();rec=r;r.lang='es-UY';
      r.onstart=()=>{if(rec!==r)return;permitted=true;permissionNotice='';try{localStorage.setItem('gya_tele_mic','1');}catch(e){}r.onerror=r.onend=null;rec=null;try{r.abort();}catch(e){}view='';paint(model,lastCab,lastMando);if(typeof done==='function')done();};
      r.onerror=()=>{if(rec!==r)return;r.onerror=r.onend=null;rec=null;try{r.abort();}catch(e){}permitted=false;try{localStorage.removeItem('gya_tele_mic');}catch(e){}permissionNotice=local?'No se pudo activar el micrófono. Podés jugar con toques.':'No se pudo activar el micrófono. Podés marcar desde el control.';view='';paint(model,lastCab,lastMando);};try{r.start();}catch(e){r.onerror?.();}
    }
    let lastCab='',lastMando=false;
    function paint(c,cab,mando){
      if(!c)return;model=c;if(cab){lastCab=cab;lastMando=mando;}else{cab=lastCab;mando=lastMando;}
      const active=c.activo===yo,listen=c.escucha===yo;
      if(micToken!==c.token)heard='';if(!listen||micToken!==c.token){stop();}wanted=listen;
      const key=JSON.stringify([c.fase,c.token,c.aviso,c.oi,c.jug,mando,permitted,active,permissionNotice]);
      if(key!==view){view=key;
        let body='';
        if(c.fase==='config'){
          if(!names.length)names=(c.jug||[]).map(j=>j.n);
          body=mando?`<p>${local?'Da vuelta el celular para que los demás vean el número.':'Cada jugador responde de espaldas a la tele.'} Turnos de 30 segundos.</p><div class="nv-names">${names.map((n,i)=>`<label>Jugador ${i+1}<input data-nv-name="${i}" maxlength="20" value="${escape(n)}"></label>`).join('')}</div><button class="tl-boton tl-chico" data-nv-add>＋ Jugador</button><button class="tl-boton tl-oro" data-nv-config>Preparar ronda</button>`:'El control está preparando los jugadores.';
        }else if(c.fase==='ready')body=`<h2>Le toca a ${escape(c.quien)}</h2><p>${local?'Tenés tres segundos para dar vuelta el celular. Los demás ven solo el número; la pregunta solo se escucha. Un toque: acierto. Dos toques rápidos: pasar.':'De espaldas a la tele. La pregunta solo se escucha: respondé hablando al celular o decí «paso».'}</p>${permissionNotice?`<p role="status">${escape(permissionNotice)}</p>`:''}${active||mando?`${hasMic()?'<button class="tl-boton tl-oro" data-nv-start>🎙 Jugar con micrófono · 30 segundos</button>':''}<button class="tl-boton tl-chico" data-nv-manual>${local?'👆 Jugar con toques · 30 segundos':'Jugar marcando desde el control'}</button>`:''}`;
        else if(c.fase==='turnEnd')body=`<h2>¡Terminó el turno!</h2>${mando?'<button class="tl-boton tl-oro" data-nv-next>Siguiente jugador</button>':''}`;
        else if(c.fase==='final')body=`<h2>Ronda terminada</h2>${local?`<p>Más aciertos: <b>${escape(c.aviso)}</b></p>`:''}${mando?'<button class="tl-boton tl-oro" data-nv-again>Otra ronda</button>':''}`;
        else if(c.fase==='paused')body=`<h2>En pausa</h2><p>${escape(c.aviso)}</p>${active&&!permitted&&hasMic()?'<button class="tl-boton" data-nv-mic>🎙 Activar micrófono</button>':''}${mando?'<button class="tl-boton tl-oro" data-nv-resume>Continuar con micrófono</button><button class="tl-boton" data-nv-resume-manual>Continuar marcando</button>':''}`;
        else body=`<h2>${escape(c.quien)} · <span class="nv-phone-time">${c.resta}</span> s</h2><p class="nv-mic-state">${c.fase==='reading'?'La voz está leyendo…':active?(permitted?'Conectando micrófono…':'Activá el micrófono para responder'):'Escuchá al jugador'}</p><p class="nv-heard">${escape(c.oi||heard)}</p>${active?`${!permitted&&!c.manual?'<button class="tl-boton tl-oro" data-nv-mic>🎙 Activar micrófono</button>':''}<div class="nv-text"><input id="nvTexto" inputmode="numeric" placeholder="O escribí tu respuesta" aria-label="Respuesta numérica"><button class="tl-boton" data-nv-send>Responder</button></div>`:''}${c.fase==='playing'?`${active||mando?'<button class="tl-boton" data-nv-pass>Paso</button>':''}${!active||mando?'<button class="tl-boton" data-nv-ok>Lo dijo bien</button>':''}${mando?'<button class="tl-boton tl-chico" data-nv-pause>Pausar</button>':''}`:''}`;
        root.innerHTML=cab+`<section class="tl-cel-caja nv-phone"><h3>¿Qué número soy? · Ronda ${c.ronda}</h3>${body}<div class="nv-phone-scores">${(c.jug||[]).map(j=>`<span>${escape(j.n)}: <b>${j.pts}</b></span>`).join('')}</div>${mando?`<button class="tl-boton tl-chico" data-nv-menu>${local?'Volver al inicio':'Menú de juegos'}</button>`:''}</section>`;
        const on=(s,f)=>root.querySelector(s)?.addEventListener('click',f),act=(a,extra={})=>send(a,{token:c.token,...extra});
        root.querySelectorAll('[data-nv-name]').forEach(el=>el.oninput=()=>{names[Number(el.dataset.nvName)]=el.value;});
        on('[data-nv-add]',()=>{if(names.length<8){names.push('');view='';paint(c,cab,mando);}});
        on('[data-nv-config]',()=>act('nv_config',{nombres:names}));on('[data-nv-mic]',permission);
        on('[data-nv-start]',()=>{const done=()=>act('nv_empezar',{manual:false});if(active&&!permitted)permission(done);else done();});on('[data-nv-manual]',()=>act('nv_empezar',{manual:true}));
        on('[data-nv-next]',()=>act('nv_siguiente'));on('[data-nv-again]',()=>act('nv_revancha'));
        on('[data-nv-pass]',()=>act('nv_paso'));on('[data-nv-ok]',()=>act('nv_ok'));on('[data-nv-pause]',()=>act('nv_pausa'));
        on('[data-nv-resume]',()=>{const done=()=>act('nv_reanudar',{manual:!hasMic()});if(active&&hasMic()&&!permitted)permission(done);else done();});on('[data-nv-resume-manual]',()=>act('nv_reanudar',{manual:true}));on('[data-nv-menu]',()=>send('menu'));
        const submit=()=>{const el=root.querySelector('#nvTexto');if(el?.value.trim())act('nv_resp',{alts:[el.value.trim()]});};on('[data-nv-send]',submit);root.querySelector('#nvTexto')?.addEventListener('keydown',e=>{if(e.key==='Enter')submit();});
      }
      const clock=root.querySelector('.nv-phone-time');if(clock)clock.textContent=c.resta;
      start();if(wanted&&listening){const el=root.querySelector('.nv-mic-state');if(el)el.textContent='🎙 Te escucho';}
    }
    const hide=()=>{if(document.hidden){stop();if(model?.escucha===yo)send('nv_error',{token:model.token});}};document.addEventListener('visibilitychange',hide);
    const leave=()=>stop();window.addEventListener('pagehide',leave);
    return{pintar:paint,parar(){stop();view='';model=null;},salir(){stop();document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',leave);}};
  }
  return{numero,crearTele,crearCel};
})();
