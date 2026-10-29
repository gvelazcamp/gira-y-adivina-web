/* Duelo de Conocimiento: agrega BOT, voz y sala online sin alterar otros juegos. */
(()=>{
"use strict";
const $dc=id=>document.getElementById(id);
const originalStart=start, originalNextQuestion=nextQuestion, originalRightAnswer=rightAnswer, originalFinish=finish, originalReset=resetToConfig;
let mode="bot", botHandle=0, botError=30, online=null, mic=null, micWanted=false, micRunning=false, micBlocked=false, micToken=0, micStartupTimer=0, micAudioTimer=0, lastSpeech="",lastSpeechAt=0, remoteState=0, lastRevealTurn=-1;
const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const uniqueId=()=>Math.random().toString(36).slice(2,10);
const nameSafe=s=>String(s||"Jugador").trim().slice(0,14).replace(/[<>]/g,"");
const roomCode=()=>Array.from({length:4},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join("");
const place=$dc("setup-form");
const modeBox=document.createElement("div");
modeBox.className="dc-extra";
modeBox.innerHTML='<span class="dc-section-label">¿Contra quién jugás?</span><div class="dc-mode-choices"><button type="button" data-mode="bot" aria-pressed="true">🤖 <b>Rival virtual</b></button><button type="button" data-mode="local" aria-pressed="false">👥 <b>Mismo celular</b></button><button type="button" data-mode="online" aria-pressed="false">🌐 <b>Con un amigo</b></button></div><select id="dc-mode" aria-label="Modo de juego" hidden><option value="bot">Contra un BOT</option><option value="local">Dos jugadores aquí</option><option value="online">Online con un amigo</option></select><div id="dc-bot-fields"><details class="dc-bot-details"><summary>⚙ Ajustar dificultad del rival <span id="dc-bot-percent">30%</span></summary><label class="dc-field" for="dc-bot-error">Probabilidad de error<input id="dc-bot-error" type="range" min="10" max="70" step="5" value="30"/></label></details></div><div id="dc-online-fields" hidden><div class="dc-row"><label class="dc-field">Sala online<select id="dc-room-choice"><option value="create">Crear sala</option><option value="join">Unirme a una sala</option></select></label><label class="dc-field">Código de 4 caracteres<input id="dc-room-code" placeholder="ABCD" maxlength="4" autocomplete="off" autocapitalize="characters"/></label></div><small>Cada participante usa su propio celular.</small></div><div id="dc-room-status" role="status"></div>';
place.querySelector("#dc-mode-slot").append(modeBox);
const answerBox=document.createElement("div");
answerBox.className="dc-answer-choice";
answerBox.innerHTML='<span class="dc-section-label">Responder</span><div class="dc-answer-buttons"><button type="button" data-answer="voice" aria-pressed="true">🎙 Voz</button><button type="button" data-answer="text" aria-pressed="false">⌨️ Escribir</button></div><select id="dc-answer" aria-label="Cómo responder" hidden><option value="voice">Con el micrófono</option><option value="text">Escribiendo</option></select>';
place.querySelector("#dc-answer-slot").append(answerBox);
const css=document.createElement("style");
css.textContent=".dc-extra{border:1px solid #7353a3;border-radius:18px;padding:14px;margin:12px 0;background:#170e2b}.dc-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dc-field{display:block;text-align:left;font-weight:850;color:#fce9c3;font-size:12px;margin-bottom:8px}.dc-field select,.dc-field input:not([type=range]){width:100%;margin-top:6px;padding:11px;border-radius:10px;border:1px solid #8967ba;color:#fff;background:#2a1848}.dc-field input[type=range]{width:100%;accent-color:#ffca37;display:block;margin-top:14px}#dc-room-status{margin-top:6px;color:#38e8d7;font-size:13px;font-weight:750;overflow-wrap:anywhere}#dc-room-status button{border:1px solid #ffc633;border-radius:12px;background:#ffc633;color:#24133c;padding:9px 15px;margin-top:8px;font-weight:900}#dc-voice{margin:8px auto 4px;display:block;background:#ffc633;color:#231137;border:0;border-radius:14px;padding:11px 16px;font-weight:950;box-shadow:0 4px #ac6a07}#dc-voice.ok{background:#32d5ba}#dc-text-option{font-size:11px;background:none;color:#d6caed;border:0;text-decoration:underline;margin:8px auto;display:block}.dc-hidden{display:none!important}@media(max-width:480px){.dc-row{grid-template-columns:1fr}.dc-extra{padding:11px}}";
document.head.append(css);
const voiceBtn=document.createElement("button");voiceBtn.id="dc-voice";voiceBtn.type="button";voiceBtn.textContent="🎙 ACTIVAR MICRÓFONO";
const textBtn=document.createElement("button");textBtn.id="dc-text-option";textBtn.type="button";textBtn.textContent="⌨️ Responder escribiendo";
$dc("answer-form").before(voiceBtn);$dc("answer-form").after(textBtn);
const modeSel=$dc("dc-mode"),answerSel=$dc("dc-answer"),roomChoice=$dc("dc-room-choice"),roomInput=$dc("dc-room-code");
function syncSetup(){
 mode=modeSel.value;
 modeBox.querySelectorAll("[data-mode]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.mode===mode)));
 $dc("dc-bot-fields").hidden=mode!=="bot";$dc("dc-online-fields").hidden=mode!=="online";
 $dc("input1").disabled=mode==="bot"||mode==="online";
 $dc("input1").value=mode==="bot"?"Sofía":mode==="online"?"Amigo":($dc("input1").dataset.local||"Sofía");
 $dc("dc-rival-label").textContent=mode==="bot"?"Rival virtual":mode==="online"?"Rival online":"Jugador 2";
 roomInput.disabled=roomChoice.value==="create";
 if(mode==="online"){place.querySelector(".primary[type=submit]").textContent=roomChoice.value==="create"?"▶ CREAR SALA":"▶ UNIRME A SALA";}
 else place.querySelector(".primary[type=submit]").textContent="▶ EMPEZAR DUELO";
 $dc("dc-room-status").textContent="";
}
modeSel.addEventListener("change",syncSetup);
modeBox.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{modeSel.value=b.dataset.mode;syncSetup();});
$dc("input1").addEventListener("input",()=>{if(modeSel.value==="local")$dc("input1").dataset.local=$dc("input1").value;});
roomChoice.addEventListener("change",syncSetup);
$dc("dc-bot-error").addEventListener("input",()=>{$dc("dc-bot-percent").textContent=$dc("dc-bot-error").value+"%"});
answerSel.addEventListener("change",syncAnswer);
answerBox.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>{answerSel.value=b.dataset.answer;syncAnswer();});
function syncAnswer(){
 const voice=answerSel.value==="voice";
 answerBox.querySelectorAll("[data-answer]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.answer===answerSel.value)));
 voiceBtn.classList.toggle("dc-hidden",!voice);$dc("answer-form").classList.toggle("dc-hidden",voice);
 textBtn.textContent=voice?"⌨️ Responder escribiendo":"🎙 Probar micrófono";
 $dc("mic-panel").setAttribute("aria-label",voice?"Responder hablando":"Responder escribiendo");
 if(!voice)stopMic();else if((phase==="playing"&&canAnswer())||phase==="selecting")startMic();
}
textBtn.onclick=()=>{answerSel.value=answerSel.value==="voice"?"text":"voice";micBlocked=false;syncAnswer();if(answerSel.value==="text"&&phase==="playing"&&canAnswer())$dc("answer-input").focus()};
const micErrorText={ "not-allowed":"Permiso rechazado. Tocá el icono del candado en Chrome y permití el micrófono.", "service-not-allowed":"Chrome no permite reconocimiento de voz en este dispositivo.", "audio-capture":"No se detecta un micrófono. Revisá los permisos del teléfono.", "network":"El reconocimiento necesita conexión a internet." };
function micNote(s){voiceBtn.textContent=s}
function micFallback(message){
 clearTimeout(micStartupTimer);
 answerSel.value="text";syncAnswer();
 if(mode==="bot"&&phase==="waiting-mic"&&active===0)beginTimedTurn(false);
 $dc("feedback").className="feedback fail";$dc("feedback").textContent=message+" Podés responder escribiendo.";
 if(phase==="playing"&&canAnswer())$dc("answer-input").focus();
}
async function startMic(){
 if(answerSel.value!=="voice"||micWanted||micBlocked||phase==="announcing"||(phase==="playing"&&!canAnswer()))return;
 if(!window.SpeechRecognition&&!window.webkitSpeechRecognition){micFallback("Este navegador no tiene reconocimiento de voz.");return;}
 if(!window.isSecureContext){micFallback("El micrófono necesita HTTPS.");return;}
 const token=++micToken;
 micWanted=true;micBlocked=false;
 micNote("🎙 CONECTANDO AUDIO...");
 try{
   if(!micWanted||token!==micToken)return;
   if(!mic){const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition;mic=new Ctor();const instance=mic;mic.lang="es-UY";mic.continuous=true;mic.interimResults=true;mic.maxAlternatives=5;
     mic.onstart=()=>{if(mic!==instance||token!==micToken)return;micRunning=true;micNote("🎙 CONECTANDO AUDIO...");clearTimeout(micAudioTimer);micAudioTimer=setTimeout(()=>{if(mic===instance&&token===micToken&&phase==="waiting-mic"&&canAnswer())beginTimedTurn(false)},1800);};
     mic.onaudiostart=()=>{if(mic!==instance||token!==micToken)return;micRunning=true;clearTimeout(micAudioTimer);voiceBtn.classList.add("ok");micNote("🎙 ESCUCHANDO");if(mode==="bot"&&phase==="waiting-mic"&&active===0)beginTimedTurn(false);if(phase==="playing"&&canAnswer())setMicLabel("TE ESCUCHAMOS",`Respondé, ${players[active].name}`,true);};
     mic.onresult=e=>{if(mic!==instance||token!==micToken||!micWanted||!question||!canAnswer())return;
       if(mode==="bot"&&phase==="waiting-mic"&&active===0){micRunning=true;clearTimeout(micAudioTimer);beginTimedTurn(false)}
       if(phase!=="playing")return;
       let wrongFlag="";
       for(let i=e.resultIndex;i<e.results.length;i++){const result=e.results[i];for(let j=0;j<result.length;j++){
         const candidate=String(result[j].transcript||"").trim();
         if(!candidate)continue;
         if(result.isFinal&&normalize(candidate)==="paso"){passTurn();return;}
         if(result.isFinal&&!wrongFlag&&((question.category==="banderas"&&(countriesSpoken(candidate).length||normalize(candidate).includes("inglaterra")))||(isImageQuestion(question)&&openAnswer(candidate,question.category))))wrongFlag=candidate;
         if(!isRightAnswer(candidate,question))continue;
         const key=candidate.toLocaleLowerCase('es-UY'),now=Date.now();if(key===lastSpeech&&now-lastSpeechAt<1500)return;
         lastSpeech=key;lastSpeechAt=now;applyAnswer(candidate);return;
       }
       const heard=String(result[0]?.transcript||"").trim();
       if(heard){setMicLabel("TE ESCUCHAMOS","Oí: «"+heard+"»",true);if(result.isFinal&&!wrongFlag){$dc("feedback").className="feedback fail";$dc("feedback").textContent=question.category==="banderas"?"No entendí un país. Repetí tu respuesta.":openAnswerHint(heard,question)||"No es correcto. Probá otra vez.";playTone(210,.08,'triangle');}}
       }
       if(wrongFlag)passTurn(wrongFlag);
     };
     mic.onerror=e=>{if(mic!==instance||token!==micToken)return;micRunning=false;clearTimeout(micAudioTimer);let err=e.error||"";if(["not-allowed","service-not-allowed","audio-capture","network"].includes(err)){micBlocked=true;micWanted=false;micFallback(micErrorText[err]||"Micrófono no disponible.");}else micNote("🎙 Micrófono interrumpido. Reintentar.");};
     mic.onend=()=>{if(mic!==instance||token!==micToken)return;micRunning=false;clearTimeout(micAudioTimer);voiceBtn.classList.remove("ok");if(mode==="bot"&&phase==="playing"&&active===0&&answerSel.value==="voice"&&question&&!question.answered){phase="waiting-mic";pauseClock();updatePlayers();setMicLabel("RECONECTANDO MICRÓFONO","Tu reloj está pausado.",false);const pending=question;micStartupTimer=setTimeout(()=>{if(mode==="bot"&&phase==="waiting-mic"&&question===pending)micFallback("No se pudo reconectar el micrófono.")},8000)}if(micWanted&&!micBlocked)setTimeout(()=>{if(mic===instance&&token===micToken&&micWanted&&!micRunning&&canAnswer()){try{mic.start()}catch(e){}}},450);};
   }
   if(!micRunning)try{mic.start()}catch(e){micFallback("No se pudo iniciar el micrófono.");}
 }catch(e){if(token!==micToken)return;micWanted=false;micBlocked=true;micFallback("Permiso de micrófono no habilitado.");}
}
voiceBtn.onclick=()=>{if(micRunning){stopMic();return;}micBlocked=false;micWanted=false;startMic()};
function stopMic(){++micToken;clearTimeout(micStartupTimer);clearTimeout(micAudioTimer);micWanted=false;micRunning=false;voiceBtn.classList.remove("ok");const previous=mic;mic=null;if(previous){try{previous.abort()}catch(e){}}micNote("🎙 ACTIVAR MICRÓFONO")}
function canAnswer(){
 if(mode==="bot")return active===0;
 if(mode==="online"&&online)return active===(online.host?0:1);
 return true;
}
window.dueloPuedeResponder=canAnswer;
/* El reconocimiento de voz puede devolver "treinta y dos" en vez de "32". */
const numberWords={cero:0,un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,veintiuno:21,veintiun:21,veintidos:22,veintitres:23,veinticuatro:24,veinticinco:25,veintiseis:26,veintisiete:27,veintiocho:28,veintinueve:29,treinta:30,cuarenta:40,cincuenta:50,sesenta:60,setenta:70,ochenta:80,noventa:90,cien:100,ciento:100,doscientos:200,trescientos:300,cuatrocientos:400,quinientos:500,seiscientos:600,setecientos:700,ochocientos:800,novecientos:900,mil:1000};
function spokenNumber(text){
 let raw=String(text||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/−/g,"-").replace(/[^a-z0-9ñ -]/g," ").replace(/\s+/g," ").trim().replace(/^(la respuesta es|el resultado es|es|son|igual a)\s+/g,"").trim();
 if(/^-?\d+$/.test(raw))return Number(raw);
 let negative=false;if(raw.startsWith("menos ")){negative=true;raw=raw.slice(6)}
 let result=0,current=0,valid=false;
 for(const word of raw.split(/\s+/)){
   if(word==="y")continue;
   if(!Object.prototype.hasOwnProperty.call(numberWords,word))return null;
   valid=true;const val=numberWords[word];
   if(val===1000){result+=Math.max(current,1)*1000;current=0;}
   else if(val>=100)current+=val;
   else current+=val;
 }
 return valid?(negative?-1:1)*(result+current):null;
}
const baseIsRightAnswer=isRightAnswer;
isRightAnswer=function(v,q){
 if(q&&q.category==="matematica"){const n=spokenNumber(v);return n!==null&&n===Number(q.answer)}
 return baseIsRightAnswer(v,q);
};
function applyAnswer(value){
 if(phase!=="playing"||!question||!canAnswer())return;
 if(!isRightAnswer(value,question)){if(question.category==="banderas"||isImageQuestion(question))passTurn(value);else $dc("feedback").textContent=openAnswerHint(value,question)||"No es correcto. Seguí intentando.";return;}
 if(mode==="online"&&online&&!online.host){sendOnline("guess",{guess:value});$dc("feedback").textContent="Respuesta enviada. Esperando validación...";return;}
 rightAnswer(value);
}
const originalForm=$dc("answer-form");
originalForm.addEventListener("submit",e=>{
 if(mode==="online"&&online&&!online.host&&phase==="playing"){e.stopImmediatePropagation();e.preventDefault();const v=$dc("answer-input").value.trim();if(normalize(v)==="paso")passTurn();else if(v)applyAnswer(v);}
},true);
function botTurn(retries=0){
 clearTimeout(botHandle);
 if(mode!=="bot"||phase!=="playing"||active!==1||!question)return;
 const currentQuestion=question;
 const speed=retries?1400+Math.floor(Math.random()*700):2700+Math.floor(Math.random()*1000);
 botHandle=setTimeout(()=>{
   if(mode!=="bot"||phase!=="playing"||active!==1||question!==currentQuestion)return;
   if(!retries&&Math.random()*100<botError){if(question.category==="banderas"){const wrongCode=allCodes.find(code=>code!==question.code);passTurn(COUNTRY_NAMES[wrongCode]);}else if(isImageQuestion(question)){const wrong=IMAGE_ITEMS[question.category].find(item=>item.answer!==question.answer)?.answer;passTurn(wrong);}else{$dc("feedback").className="feedback fail";$dc("feedback").textContent=players[1].name+" se equivocó. Su reloj sigue corriendo.";botTurn(1);}}
   else if(isImageQuestion(question))rightAnswer(question.answer);
   else rightAnswer("BOT");
 },speed);
}
function turnCue(bot){
 playTone(bot?440:740,.12,'sine',.055);
 setTimeout(()=>{if(phase==="playing"&&active===(bot?1:0))playTone(bot?330:940,.16,'sine',.055)},130);
}
const baseNext=nextQuestion;
window.dueloPreparaTurno=()=>mode==="bot";
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function cancelNarration(){try{window.speechSynthesis?.cancel()}catch(e){}}
function speak(text,maxMs=5500){
 if(!soundOn||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return Promise.resolve();
 return new Promise(resolve=>{
   let done=false;const complete=()=>{if(done)return;done=true;clearTimeout(timeout);resolve()};
   const timeout=setTimeout(()=>{cancelNarration();complete()},maxMs);
   try{const utterance=new SpeechSynthesisUtterance(text);utterance.lang="es-UY";utterance.rate=.9;utterance.onend=complete;utterance.onerror=complete;window.speechSynthesis.speak(utterance)}catch(e){complete()}
 });
}
function questionForVoice(q){
 if(q.category==="matematica")return `¿Cuánto da ${String(q.math||"").replace(/[×*]/g," por ").replace(/[÷/]/g," dividido ").replace(/\+/g," más ").replace(/[−-]/g," menos ")}?`;
 return q.label;
}
function beginTimedTurn(bot){
 if(mode!=="bot"||!question||question.answered||!['announcing','waiting-mic'].includes(phase))return;
 clearTimeout(micStartupTimer);phase="playing";voiceBtn.disabled=bot;
 $dc("answer-input").disabled=bot;$dc("answer-submit").disabled=bot;
 $dc("feedback").textContent=bot?players[1].name+" está pensando…":"¡Respondé ahora, "+players[0].name+"!";
 setMicLabel(bot?upper(players[1].name)+" ESTÁ PENSANDO":"TE TOCA RESPONDER",bot?"Esperá su respuesta; tu reloj está pausado.":"Ahora corre tu reloj.",!bot&&micRunning);
 prevTick=performance.now();pauseClock();raf=requestAnimationFrame(tick);updatePlayers();
 if(bot){micNote("🎙 PAUSADO · TURNO DE "+upper(players[1].name));botTurn();}
 else if($dc("answer-form").offsetParent!==null)$dc("answer-input").focus();
}
nextQuestion=async function(){
 if(mode==="online"&&online&&!online.host)return;
 await baseNext();
 if(phase!=="playing"&&phase!=="announcing")return;
 if(mode==="bot"){
   const bot=active===1,name=players[active].name;
   $dc("turn-stats").textContent="TURNO "+turn+" · "+upper(name);
   $dc("feedback").className="feedback";
   $dc("feedback").textContent="Escuchá la pregunta; el reloj está pausado.";
   voiceBtn.disabled=true;
   stopMic();
   setMicLabel("PREGUNTA PARA "+upper(name),"El reloj empieza después de escucharla.",false);
   turnCue(bot);
   const currentQuestion=question,serial=questionGeneration;
   cancelNarration();
   await Promise.all([wait(2400),speak(`Turno de ${name}. ${questionForVoice(currentQuestion)}`)]);
   if(mode!=="bot"||phase!=="announcing"||question!==currentQuestion||serial!==questionGeneration)return;
   if(bot||answerSel.value==="text")beginTimedTurn(bot);
   else{
     phase="waiting-mic";updatePlayers();
     setMicLabel("ACTIVANDO MICRÓFONO",`El reloj de ${name} sigue pausado.`,false);
     micStartupTimer=setTimeout(()=>{if(mode==="bot"&&phase==="waiting-mic"&&question===currentQuestion)micFallback("El micrófono tardó demasiado en activarse.")},8000);
     startMic();
   }
   return;
 }
 if(mode==="online"&&online&&online.host)sendSnapshot();
 if(mode!=="bot"&&answerSel.value==="voice"&&canAnswer()&&!micWanted&&!micBlocked)startMic();
};
/* El HTML base programa un avance fijo de 2.8 s al acertar y de 1.9 s
   al pasar. Solo en modo BOT reemplazamos esos dos temporizadores:
   la locución debe terminar y luego la solución debe poder leerse.
   No modificamos puntos, tiempo de respuesta ni penalizaciones. */
function avanzarDespuesDeRespuestaBot(preguntaActual,jugadorActual,espera){
 clearTimeout(transitionTimeout);
 transitionTimeout=setTimeout(()=>{
   if(mode!=="bot"||phase!=="transition"||question!==preguntaActual||active!==jugadorActual)return;
   active=1-active;turn++;nextQuestion();
 },espera);
}
const baseRight=rightAnswer;
rightAnswer=function(value){
 clearTimeout(botHandle);if(mode==="online"&&online&&!online.host){applyAnswer(value);return;}
 const eraBot=mode==="bot"&&active===1&&phase==="playing"&&question&&!question.answered;
 const preguntaActual=question,jugadorActual=active;
 baseRight(value);
 if(eraBot&&phase==="transition"&&question===preguntaActual){
   clearTimeout(transitionTimeout);transitionTimeout=0;
   const solucion=getCorrectAnswer(preguntaActual);
   $dc("feedback").className="feedback success";
   $dc("feedback").textContent=`✓ ${players[1].name} respondió: ${solucion}`;
   setMicLabel("RESPUESTA DEL BOT",solucion+" · La siguiente pregunta empieza después de escuchar la respuesta.",false);
   // No cortar una frase por un cronómetro fijo. El tiempo de lectura
   // empieza después del fin de voz (o después del límite de seguridad).
   speak(`${players[1].name} responde: ${solucion}.`,30000).then(()=>{
     if(mode!=="bot"||phase!=="transition"||question!==preguntaActual||active!==jugadorActual)return;
     avanzarDespuesDeRespuestaBot(preguntaActual,jugadorActual,3500);
   });
 }
 if(mode==="bot"&&active===0&&phase==="transition")stopMic();
 if(mode==="online"&&online&&online.host)sendSnapshot();
};
const basePass=passTurn;
function revealPhrase(q){const answer=getCorrectAnswer(q);return q.category==="banderas"?`La bandera era ${answer}.`:q.category==="ciudades"?`La ciudad era ${answer}.`:q.category==="videojuegos"?`El videojuego era ${answer}.`:`La respuesta correcta era: ${answer}.`}
passTurn=function(wrongValue=''){
 const preguntaActual=question,jugadorActual=active;
 const revelar=preguntaActual?.category==="banderas"||isImageQuestion(preguntaActual);
 const solucion=preguntaActual?getCorrectAnswer(preguntaActual):'';
 if(mode==="online"&&online&&!online.host){
   sendOnline("pass",{wrong:wrongValue});
   $dc("feedback").className="feedback fail";$dc("feedback").textContent=`✕ ${wrongValue?'RESPUESTA ERRÓNEA':'PASAPALABRA'} · Era ${solucion}. Sigue ${players[0].name}.`;
   stopMic();if(revelar){lastRevealTurn=turn;speak(revealPhrase(preguntaActual),2800)}return;
 }
 const mostrarSolucion=mode==="bot"&&phase==="playing"&&preguntaActual&&!preguntaActual.answered;
 if(mode==="bot"||revelar)stopMic();
 basePass(wrongValue);
 if(mostrarSolucion&&phase==="transition"&&question===preguntaActual){
   clearTimeout(transitionTimeout);transitionTimeout=0;
   const frase=revealPhrase(preguntaActual);
   $dc("feedback").className="feedback fail";
   $dc("feedback").textContent=`✕ ${wrongValue?'RESPUESTA ERRÓNEA':'PASAPALABRA'} · Era ${solucion}. Sigue ${players[1-active].name}.`;
   setMicLabel(wrongValue?"RESPUESTA ERRÓNEA":"PASAPALABRA",frase+" La siguiente pregunta aparece en unos segundos.",false);
   speak(frase,30000).then(()=>{
     if(mode!=="bot"||phase!=="transition"||question!==preguntaActual||active!==jugadorActual)return;
     avanzarDespuesDeRespuestaBot(preguntaActual,jugadorActual,4500);
   });
 }else if(revelar&&phase==="transition")speak(revealPhrase(preguntaActual),2800);
 if(mode==="online"&&online&&online.host)sendSnapshot();
};
const baseFinish=finish;
finish=function(winner,reason){
 clearTimeout(botHandle);cancelNarration();baseFinish(winner,reason);
 if(mode==="online"&&online&&online.host){
   const resultado=decidirResultadoDuelo();
   sendOnline("finish",{winner:resultado.winner,reason:resultado.reason,players:players.map(p=>({name:p.name,ms:p.ms,score:p.score,errors:p.errors||0})),history:roundHistory});
 }
};
function sincronizarPantallaDuelo(jugando,solicitarTV=false){
 try{
   if(window.parent===window)return;
   window.parent.DueloConocimiento?.pantalla?.(jugando);
   if(jugando&&solicitarTV)window.parent.Extensiones?.prepararDueloTV?.();
 }catch(e){}
}
const baseReset=resetToConfig;
resetToConfig=function(){
 clearTimeout(botHandle);cancelNarration();stopMic();stopOnline();lastRevealTurn=-1;
 baseReset();sincronizarPantallaDuelo(false);
 voiceBtn.disabled=false;$dc("input0").value="";syncSetup();syncAnswer();
};
function codeValid(c){return /^[A-HJ-NP-Z2-9]{4}$/.test(c)}
function sendOnline(type,data){
 if(!online)return;
 const msg=JSON.stringify({type,data,from:online.id,code:online.code,id:uniqueId(),time:Date.now()});
 online.clients.forEach(c=>{if(c.connected)try{c.publish(online.topic,msg)}catch(e){}});
}
function sendSnapshot(){
 if(!online||!online.host||phase==="setup")return;
 sendOnline("state",{phase,active,turn,players:players.map(p=>({name:p.name,ms:p.ms,score:p.score,errors:p.errors||0})),question,selectionStarted,feedback:$dc("feedback").textContent,usedOpenAnswers:[...usedOpenAnswers],history:roundHistory});
}
function onlineStatus(text){
 $dc("dc-room-status").textContent=text;
}
function onOnlineMsg(message){
 if(!online||message.from===online.id||message.code!==online.code)return;
 if(online.seen.has(message.id))return;
 online.seen.add(message.id);if(online.seen.size>200)online.seen.clear();
 if(message.type==="join"&&online.host){
   if(online.started){sendOnline("welcome",{hostName:players[0].name,guestName:players[1].name,seconds:settings.seconds,categories:settings.categories});sendSnapshot();return;}
   online.guestId=message.from;const guest=nameSafe(message.data.name);
   $dc("input1").disabled=false;$dc("input1").value=guest;
   sendOnline("welcome",{hostName:nameSafe($dc("input0").value),guestName:guest,seconds:Number($dc("time-select").value),categories:[...document.querySelectorAll('input[name=category]:checked')].map(x=>x.value)});
   online.started=true;onlineStatus("¡Se unió "+guest+"! Comienza el duelo.");
   originalStart();if(answerSel.value==="voice")startMic();
   return;
 }
 if(message.type==="welcome"&&!online.host){
   online.started=true;const d=message.data;
   $dc("input0").value=d.hostName;$dc("input1").disabled=false;$dc("input1").value=d.guestName;
   players=[{name:d.hostName,ms:d.seconds*1000,score:0,errors:0},{name:d.guestName,ms:d.seconds*1000,score:0,errors:0}];roundHistory=[];
   active=0;turn=1;phase="loading";question=null;
   $dc("setup-overlay").classList.add("hidden");$dc("roulette-overlay").classList.remove("hidden");$dc("roulette-name0").textContent=upper(d.hostName);$dc("roulette-name1").textContent=upper(d.guestName);
   $dc("roulette-caption").textContent="Esperando que empiece el desafío...";
   initAnimation();updatePlayers();
   if(answerSel.value==="voice")startMic();
   return;
 }
 if(message.type==="state"&&!online.host){
   if(!online.started)return;
   const d=message.data;players=d.players.map(p=>({name:p.name,ms:p.ms,score:p.score,errors:p.errors||0}));roundHistory=Array.isArray(d.history)?d.history:[];usedOpenAnswers.clear();(d.usedOpenAnswers||[]).forEach(answer=>usedOpenAnswers.add(answer));
   active=d.active;turn=d.turn;if(d.phase==="finished")return;
   phase=d.phase;
   const olderKey=question&&JSON.stringify([question.category,question.code,question.math,question.answer,question.person&&question.person.name]);
   const nextKey=d.question&&JSON.stringify([d.question.category,d.question.code,d.question.math,d.question.answer,d.question.person&&d.question.person.name]);
   question=d.question;
   $dc("roulette-overlay").classList.add("hidden");
   if(question&&olderKey!==nextKey){
     showVisual(question);
     $dc("question-title").textContent=question.label;
     $dc("question-number").textContent="RONDA "+turn+" · Turno de "+players[active].name;
     $dc("answer-input").value="";
   }
   $dc("answer-input").disabled=!(phase==="playing"&&active===1);
   $dc("answer-submit").disabled=!(phase==="playing"&&active===1);
   if(phase==="transition"&&d.feedback){$dc("feedback").className=d.feedback.startsWith('✓')?'feedback success':'feedback fail';$dc("feedback").textContent=d.feedback;if((question?.category==="banderas"||isImageQuestion(question))&&d.feedback.includes("Era ")){const answer=getCorrectAnswer(question),paso=d.feedback.includes('PASAPALABRA');setMicLabel(`${paso?'PASAPALABRA':'RESPUESTA ERRÓNEA'} · ERA ${upper(answer)}`,`Sigue ${players[1-active].name}`,false);if(lastRevealTurn!==turn){lastRevealTurn=turn;speak(revealPhrase(question),2800)}}}
   if(phase==="playing"){$dc("feedback").textContent=active===1?"¡Es tu turno!":"Esperá el turno de "+players[0].name;
    setMicLabel(active===1?"TE TOCA RESPONDER":"RIVAL JUGANDO",active===1?"Respondé por voz o escribiendo":"Tu reloj está pausado",active===1&&micRunning);}
   updatePlayers();return;
 }
 if(message.type==="guess"&&online.host&&phase==="playing"&&active===1&&question){
   if(isRightAnswer(message.data.guess,question))rightAnswer(message.data.guess);
   else if(question.category==="banderas"||isImageQuestion(question))passTurn(message.data.guess);
   else sendOnline("wrong",{feedback:openAnswerHint(message.data.guess,question)});
   return;
 }
 if(message.type==="pass"&&online.host&&phase==="playing"&&active===1&&question){passTurn(message.data?.wrong||"");return;}
 if(message.type==="wrong"&&!online.host){$dc("feedback").textContent=message.data.feedback||"No es correcto. Tu tiempo sigue corriendo.";return;}
 if(message.type==="finish"&&!online.host){
   if(!online.started)return;
   players=message.data.players.map(p=>({name:p.name,ms:p.ms,score:p.score,errors:p.errors||0}));roundHistory=Array.isArray(message.data.history)?message.data.history:roundHistory;
   baseFinish(message.data.winner,message.data.reason);return;
 }
}
function stopOnline(){
 if(!online)return;
 if(online.helloTimer)clearInterval(online.helloTimer);
 if(online.syncTimer)clearInterval(online.syncTimer);
 online.clients.forEach(c=>{try{c.end(true)}catch(e){}});
 online=null;
}
function connectOnline(host,code){
 stopOnline();
 online={id:uniqueId(),code,host,topic:"gyaduelo/conocimiento/"+code,clients:[],seen:new Set(),started:false};
 onlineStatus("Conectando a la sala "+code+"...");
 if(typeof mqtt==="undefined"){onlineStatus("No se cargó la conexión online. Revisá internet.");return;}
 let ready=false,timeout=setTimeout(()=>{if(!ready)onlineStatus("No hay conexión con las salas. Probá desde otra red.");},13000);
 const brokers=["wss://broker.emqx.io:8084/mqtt","wss://broker.hivemq.com:8884/mqtt","wss://test.mosquitto.org:8081/mqtt"];
 brokers.forEach(url=>{
   let c;try{c=mqtt.connect(url,{clientId:"gyadc"+uniqueId(),connectTimeout:7500,reconnectPeriod:4000,clean:true})}catch(e){return;}
   online.clients.push(c);
   c.on("connect",()=>{c.subscribe(online.topic);if(!ready){ready=true;clearTimeout(timeout);
     if(host){onlineStatus("SALA "+code+" LISTA — Esperando al otro jugador...");
       const status=$dc("dc-room-status"),button=document.createElement("button");button.type="button";button.textContent="COPIAR INVITACIÓN";
       button.onclick=()=>{navigator.clipboard.writeText(location.origin+location.pathname+"?sala="+code).then(()=>{button.textContent="ENLACE COPIADO"}).catch(()=>{button.textContent="Código: "+code})};status.append(document.createElement("br"),button);
     }else {onlineStatus("Buscando sala "+code+"...");
       const sayJoin=()=>{if(online&&!online.started)sendOnline("join",{name:nameSafe($dc("input0").value)})};sayJoin();online.helloTimer=setInterval(sayJoin,1600);
     }
   }});
   c.on("message",(topic,data)=>{if(!online||topic!==online.topic)return;let m;try{m=JSON.parse(String(data))}catch(e){return;}onOnlineMsg(m)});
 });
 if(host)online.syncTimer=setInterval(()=>{if(online&&online.started&&online.host)sendSnapshot()},350);
}
start=function(){
 botError=Number($dc("dc-bot-error").value);
 if(!$dc("input0").value.trim()){$dc("setup-voice-error").textContent="Escribí tu nombre para jugar.";$dc("input0").focus();return;}
 const selectedCategories=[...document.querySelectorAll('input[name=category]:checked')].map(input=>input.value);
 if(!selectedCategories.length){$dc("setup-voice-error").textContent="Elegí al menos una categoría.";return;}
 if(selectedCategories.every(category=>IMAGE_ITEMS[category]&&imageRemaining(category)===0)){$dc("setup-voice-error").textContent="Ya viste todas las imágenes nuevas de esas categorías en este celular. Elegí otra categoría.";return;}
 $dc("setup-voice-error").textContent="";
 mode=modeSel.value;
 // Solo una partida contra el BOT gasta ficha; jugar con otra persona es libre.
 // El contador y el cartel viven en la pantalla de Extensiones, fuera de este iframe.
 if(mode==="bot"&&window.parent!==window&&window.parent.Fichas&&
    !window.parent.Fichas.usar("duelo-conocimiento",()=>{if(document.contains(place))start();}))return;
 clearTimeout(botHandle);stopOnline();lastRevealTurn=-1;
 if(mode==="bot"){$dc("input1").disabled=false;$dc("input1").value="Sofía";}
 if(mode==="online"){
   if(roomChoice.value==="join"){const c=roomInput.value.trim().toUpperCase();if(!codeValid(c)){onlineStatus("Ingresá un código válido de 4 caracteres.");return;}connectOnline(false,c);}
   else connectOnline(true,roomCode());
   return;
 }
 originalStart();
 /* Se ejecuta dentro del toque Empezar, para que Android permita TV.
    En cualquier otro caso basta girar el celular físicamente. */
 if(!$dc("setup-overlay").classList.contains("hidden"))return;
 sincronizarPantallaDuelo(true,true);
 if(answerSel.value==="voice"&&mode!=="bot")startMic();
};
try{
 const c=new URLSearchParams(location.search).get("sala");
 if(c&&codeValid(c.toUpperCase())){modeSel.value="online";roomChoice.value="join";roomInput.value=c.toUpperCase();}
}catch(e){}
/* Los botones registrados por el HTML original conservaban sus callbacks anteriores.
   Reasignarlos aquí garantiza que una salida cierre la sala y el micrófono. */
["new-btn","configure-again"].forEach(id=>{
 const b=$dc(id);b.removeEventListener("click",baseReset);b.addEventListener("click",()=>resetToConfig());
});
$dc("rematch-btn").removeEventListener("click",originalStart);
$dc("rematch-btn").addEventListener("click",()=>{
 if(mode==="online"){resetToConfig();$dc("dc-room-status").textContent="Para la revancha, vuelvan a crear o unirse a una sala.";}
 else start();
});
/* La sala online también puede empezar por un mensaje remoto: actualizar
   solo el tamaño, sin solicitar fullscreen fuera de un toque del usuario. */
new MutationObserver(()=>{
 sincronizarPantallaDuelo($dc("setup-overlay").classList.contains("hidden"));
}).observe($dc("setup-overlay"),{attributes:true,attributeFilter:["class"]});
syncSetup();syncAnswer();
})();
