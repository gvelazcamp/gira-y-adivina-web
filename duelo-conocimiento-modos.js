/* Duelo de Conocimiento: agrega BOT, voz y sala online sin alterar otros juegos. */
(()=>{
"use strict";
const $dc=id=>document.getElementById(id);
const originalStart=start, originalNextQuestion=nextQuestion, originalRightAnswer=rightAnswer, originalFinish=finish, originalReset=resetToConfig;
let mode="bot", botHandle=0, botError=30, online=null, mic=null, micWanted=false, micRunning=false, micBlocked=false, lastSpeech="",lastSpeechAt=0, remoteState=0;
const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const uniqueId=()=>Math.random().toString(36).slice(2,10);
const nameSafe=s=>String(s||"Jugador").trim().slice(0,14).replace(/[<>]/g,"");
const roomCode=()=>Array.from({length:4},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join("");
const place=$dc("setup-form");
const modeBox=document.createElement("div");
modeBox.className="dc-extra";
modeBox.innerHTML='<div class="dc-row"><label class="dc-field">Modo de juego<select id="dc-mode"><option value="bot">Contra un BOT</option><option value="local">Dos jugadores aquí</option><option value="online">Online con un amigo</option></select></label><label class="dc-field">Cómo responder<select id="dc-answer"><option value="voice">Con el micrófono</option><option value="text">Escribiendo (prueba)</option></select></label></div><div id="dc-bot-fields"><label class="dc-field">Probabilidad de error del BOT <strong id="dc-bot-percent">30%</strong><input id="dc-bot-error" type="range" min="10" max="70" step="5" value="30"/></label><small>El BOT también consume tiempo; a mayor porcentaje, más se equivoca.</small></div><div id="dc-online-fields" hidden><div class="dc-row"><label class="dc-field">Sala online<select id="dc-room-choice"><option value="create">Crear sala</option><option value="join">Unirme a una sala</option></select></label><label class="dc-field">Código de 4 caracteres<input id="dc-room-code" placeholder="ABCD" maxlength="4" autocomplete="off" autocapitalize="characters"/></label></div><small>Cada participante usa su propio celular y autoriza su propio micrófono.</small></div><div id="dc-room-status" role="status"></div>';
place.insertBefore(modeBox,place.querySelector(".category-fieldset"));
const css=document.createElement("style");
css.textContent=".dc-extra{border:1px solid #7353a3;border-radius:18px;padding:14px;margin:12px 0;background:#170e2b}.dc-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dc-field{display:block;text-align:left;font-weight:850;color:#fce9c3;font-size:12px;margin-bottom:8px}.dc-field select,.dc-field input:not([type=range]){width:100%;margin-top:6px;padding:11px;border-radius:10px;border:1px solid #8967ba;color:#fff;background:#2a1848}.dc-field input[type=range]{width:100%;accent-color:#ffca37;display:block;margin-top:14px}#dc-room-status{margin-top:6px;color:#38e8d7;font-size:13px;font-weight:750;overflow-wrap:anywhere}#dc-room-status button{border:1px solid #ffc633;border-radius:12px;background:#ffc633;color:#24133c;padding:9px 15px;margin-top:8px;font-weight:900}#dc-voice{margin:8px auto 4px;display:block;background:#ffc633;color:#231137;border:0;border-radius:14px;padding:11px 16px;font-weight:950;box-shadow:0 4px #ac6a07}#dc-voice.ok{background:#32d5ba}#dc-text-option{font-size:11px;background:none;color:#d6caed;border:0;text-decoration:underline;margin:8px auto;display:block}.dc-hidden{display:none!important}@media(max-width:480px){.dc-row{grid-template-columns:1fr}.dc-extra{padding:11px}}";
document.head.append(css);
const voiceBtn=document.createElement("button");voiceBtn.id="dc-voice";voiceBtn.type="button";voiceBtn.textContent="🎙 ACTIVAR MICRÓFONO";
const textBtn=document.createElement("button");textBtn.id="dc-text-option";textBtn.type="button";textBtn.textContent="⌨️ Responder escribiendo";
$dc("answer-form").before(voiceBtn);$dc("answer-form").after(textBtn);
const modeSel=$dc("dc-mode"),answerSel=$dc("dc-answer"),roomChoice=$dc("dc-room-choice"),roomInput=$dc("dc-room-code");
function syncSetup(){
 mode=modeSel.value;
 $dc("dc-bot-fields").hidden=mode!=="bot";$dc("dc-online-fields").hidden=mode!=="online";
 $dc("input1").disabled=mode==="bot"||mode==="online";
 $dc("input1").value=mode==="bot"?"BOT":mode==="online"?"Amigo":($dc("input1").dataset.local||"Sofía");
 roomInput.disabled=roomChoice.value==="create";
 if(mode==="online"){place.querySelector(".primary[type=submit]").textContent=roomChoice.value==="create"?"CREAR SALA ONLINE":"UNIRME A SALA";}
 else place.querySelector(".primary[type=submit]").textContent="▶ COMENZAR PARTIDA";
 $dc("dc-room-status").textContent="";
}
modeSel.addEventListener("change",syncSetup);
roomChoice.addEventListener("change",syncSetup);
$dc("dc-bot-error").addEventListener("input",()=>{$dc("dc-bot-percent").textContent=$dc("dc-bot-error").value+"%"});
answerSel.addEventListener("change",syncAnswer);
function syncAnswer(){
 const voice=answerSel.value==="voice";
 voiceBtn.classList.toggle("dc-hidden",!voice);$dc("answer-form").classList.toggle("dc-hidden",voice);
 textBtn.classList.toggle("dc-hidden",!voice);
 $dc("mic-panel").setAttribute("aria-label",voice?"Responder hablando":"Responder escribiendo");
 if(!voice)stopMic();else if(phase==="playing"||phase==="loading"||phase==="selecting")startMic();
}
textBtn.onclick=()=>{answerSel.value="text";syncAnswer();if(phase==="playing")$dc("answer-input").focus()};
const micErrorText={ "not-allowed":"Permiso rechazado. Tocá el icono del candado en Chrome y permití el micrófono.", "service-not-allowed":"Chrome no permite reconocimiento de voz en este dispositivo.", "audio-capture":"No se detecta un micrófono. Revisá los permisos del teléfono.", "network":"El reconocimiento necesita conexión a internet." };
function micNote(s){voiceBtn.textContent=s}
async function startMic(){
 if(answerSel.value!=="voice"||micWanted||micBlocked)return;
 if(!window.SpeechRecognition&&!window.webkitSpeechRecognition){micNote("Sin reconocimiento de voz en este navegador");return;}
 if(!window.isSecureContext){micNote("Necesita HTTPS para usar el micrófono");return;}
 micWanted=true;micBlocked=false;
 micNote("🎙 SOLICITANDO PERMISO...");
 try{
   if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
     const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(t=>t.stop());
   }
   if(!micWanted)return;
   if(!mic){const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition;mic=new Ctor();mic.lang="es-UY";mic.continuous=true;mic.interimResults=true;mic.maxAlternatives=3;
     mic.onstart=()=>{micRunning=true;voiceBtn.classList.add("ok");micNote("🎙 ESCUCHANDO");};
     mic.onresult=e=>{if(phase!=="playing"||!question||!canAnswer())return;
       for(let i=e.resultIndex;i<e.results.length;i++){const result=e.results[i];for(let j=0;j<result.length;j++){
         const candidate=String(result[j].transcript||"").trim();
         if(!candidate||!isRightAnswer(candidate,question))continue;
         const key=normalize(candidate),now=Date.now();if(key===lastSpeech&&now-lastSpeechAt<1500)return;
         lastSpeech=key;lastSpeechAt=now;applyAnswer(candidate);return;
       }}
     };
     mic.onerror=e=>{micRunning=false;let err=e.error||"";if(["not-allowed","service-not-allowed","audio-capture"].includes(err)){micBlocked=true;micWanted=false;}micNote(micErrorText[err]||"🎙 Micrófono interrumpido. Reintentar.");};
     mic.onend=()=>{micRunning=false;voiceBtn.classList.remove("ok");if(micWanted&&!micBlocked)setTimeout(()=>{if(micWanted&&!micRunning){try{mic.start()}catch(e){}}},450);};
   }
   if(!micRunning)try{mic.start()}catch(e){micNote("Tocá para reactivar micrófono");}
 }catch(e){micWanted=false;micBlocked=true;micNote("Permiso de micrófono no habilitado. Tocá para reintentar.");}
}
voiceBtn.onclick=()=>{if(micRunning){micWanted=false;mic.abort();micNote("🎙 ACTIVAR MICRÓFONO");return;}micBlocked=false;micWanted=false;startMic()};
function stopMic(){micWanted=false;micRunning=false;voiceBtn.classList.remove("ok");if(mic){try{mic.abort()}catch(e){}}micNote("🎙 ACTIVAR MICRÓFONO")}
function canAnswer(){
 if(mode==="bot")return active===0;
 if(mode==="online"&&online)return active===(online.host?0:1);
 return true;
}
/* El reconocimiento de voz puede devolver "treinta y dos" en vez de "32". */
const numberWords={cero:0,un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,veintiuno:21,veintiun:21,veintidos:22,veintitres:23,veinticuatro:24,veinticinco:25,veintiseis:26,veintisiete:27,veintiocho:28,veintinueve:29,treinta:30,cuarenta:40,cincuenta:50,sesenta:60,setenta:70,ochenta:80,noventa:90,cien:100,ciento:100,doscientos:200,trescientos:300,cuatrocientos:400,quinientos:500,seiscientos:600,setecientos:700,ochocientos:800,novecientos:900,mil:1000};
function spokenNumber(text){
 let raw=normalize(text).replace(/^(la respuesta es|el resultado es|es|son|igual a)\s+/g,"").trim();
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
 if(!isRightAnswer(value,question)){$dc("feedback").textContent="No es correcto. Seguí intentando.";return;}
 if(mode==="online"&&online&&!online.host){sendOnline("guess",{guess:value});$dc("feedback").textContent="Respuesta enviada. Esperando validación...";return;}
 rightAnswer(value);
}
const originalForm=$dc("answer-form");
originalForm.addEventListener("submit",e=>{
 if(mode==="online"&&online&&!online.host&&phase==="playing"){e.stopImmediatePropagation();e.preventDefault();const v=$dc("answer-input").value.trim();if(v)applyAnswer(v);}
},true);
function botTurn(){
 clearTimeout(botHandle);
 if(mode!=="bot"||phase!=="playing"||active!==1||!question)return;
 const speed=1800+Math.floor(Math.random()*2300);
 botHandle=setTimeout(()=>{
   if(mode!=="bot"||phase!=="playing"||active!==1)return;
   if(Math.random()*100<botError){$dc("feedback").className="feedback fail";$dc("feedback").textContent="El BOT se equivocó. Su reloj sigue corriendo.";botTurn();}
   else rightAnswer("BOT");
 },speed);
}
const baseNext=nextQuestion;
nextQuestion=async function(){
 if(mode==="online"&&online&&!online.host)return;
 await baseNext();
 if(phase!=="playing")return;
 if(mode==="bot"&&active===1){$dc("answer-input").disabled=true;$dc("answer-submit").disabled=true;botTurn();}
 if(mode==="online"&&online&&online.host)sendSnapshot();
 if(answerSel.value==="voice"&&canAnswer()&&!micWanted&&!micBlocked)startMic();
};
const baseRight=rightAnswer;
rightAnswer=function(value){
 clearTimeout(botHandle);if(mode==="online"&&online&&!online.host){applyAnswer(value);return;}
 baseRight(value);
 if(mode==="online"&&online&&online.host)sendSnapshot();
};
const baseFinish=finish;
finish=function(winner,reason){
 clearTimeout(botHandle);baseFinish(winner,reason);
 if(mode==="online"&&online&&online.host)sendOnline("finish",{winner,reason,players:players.map(p=>({name:p.name,ms:p.ms,score:p.score}))});
};
const baseReset=resetToConfig;
resetToConfig=function(){clearTimeout(botHandle);stopMic();stopOnline();baseReset();syncSetup();syncAnswer()};
function codeValid(c){return /^[A-HJ-NP-Z2-9]{4}$/.test(c)}
function sendOnline(type,data){
 if(!online)return;
 const msg=JSON.stringify({type,data,from:online.id,code:online.code,id:uniqueId(),time:Date.now()});
 online.clients.forEach(c=>{if(c.connected)try{c.publish(online.topic,msg)}catch(e){}});
}
function sendSnapshot(){
 if(!online||!online.host||phase==="setup")return;
 sendOnline("state",{phase,active,turn,players:players.map(p=>({name:p.name,ms:p.ms,score:p.score})),question,selectionStarted});
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
   players=[{name:d.hostName,ms:d.seconds*1000,score:0},{name:d.guestName,ms:d.seconds*1000,score:0}];
   active=0;turn=1;phase="loading";question=null;
   $dc("setup-overlay").classList.add("hidden");$dc("roulette-overlay").classList.remove("hidden");$dc("roulette-name0").textContent=upper(d.hostName);$dc("roulette-name1").textContent=upper(d.guestName);
   $dc("roulette-caption").textContent="Esperando que empiece el desafío...";
   initAnimation();updatePlayers();
   if(answerSel.value==="voice")startMic();
   return;
 }
 if(message.type==="state"&&!online.host){
   if(!online.started)return;
   const d=message.data;players=d.players.map(p=>({name:p.name,ms:p.ms,score:p.score}));
   active=d.active;turn=d.turn;if(d.phase==="finished")return;
   phase=d.phase;
   const olderKey=question&&JSON.stringify([question.category,question.code,question.math,question.person&&question.person.name]);
   const nextKey=d.question&&JSON.stringify([d.question.category,d.question.code,d.question.math,d.question.person&&d.question.person.name]);
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
   if(phase==="playing"){$dc("feedback").textContent=active===1?"¡Es tu turno!":"Esperá el turno de "+players[0].name;
    setMicLabel(active===1?"TE TOCA RESPONDER":"RIVAL JUGANDO",active===1?"Respondé por voz o escribiendo":"Tu reloj está pausado",active===1&&micRunning);}
   updatePlayers();return;
 }
 if(message.type==="guess"&&online.host&&phase==="playing"&&active===1&&question){
   if(isRightAnswer(message.data.guess,question))rightAnswer(message.data.guess);
   else sendOnline("wrong",{});
   return;
 }
 if(message.type==="wrong"&&!online.host){$dc("feedback").textContent="No es correcto. Tu tiempo sigue corriendo.";return;}
 if(message.type==="finish"&&!online.host){
   if(!online.started)return;
   players=message.data.players.map(p=>({name:p.name,ms:p.ms,score:p.score}));
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
 if(![...document.querySelectorAll('input[name=category]:checked')].length){$dc("setup-voice-error").textContent="Elegí al menos una categoría.";return;}
 mode=modeSel.value;
 // Solo una partida contra el BOT gasta ficha; jugar con otra persona es libre.
 // El contador y el cartel viven en la pantalla de Extensiones, fuera de este iframe.
 if(mode==="bot"&&window.parent!==window&&window.parent.Fichas&&
    !window.parent.Fichas.usar("duelo-conocimiento",()=>{if(document.contains(place))start();}))return;
 clearTimeout(botHandle);stopOnline();
 if(mode==="bot"){$dc("input1").disabled=false;$dc("input1").value="BOT";}
 if(mode==="online"){
   if(roomChoice.value==="join"){const c=roomInput.value.trim().toUpperCase();if(!codeValid(c)){onlineStatus("Ingresá un código válido de 4 caracteres.");return;}connectOnline(false,c);}
   else connectOnline(true,roomCode());
   return;
 }
 originalStart();
 if(answerSel.value==="voice")startMic();
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
syncSetup();syncAnswer();
})();
