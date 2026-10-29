/* Regresión: el BOT termina de hablar antes de avanzar.
   La solución queda visible tras el acierto o PASO.
   node tests/duelo-bot-respuesta-completa.cjs */
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"duelo-conocimiento-modos.js"),"utf8");
const html=fs.readFileSync(path.join(root,"duelo-conocimiento.html"),"utf8");
const ext=fs.readFileSync(path.join(root,"extensiones.js"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
new Function(source);new Function(ext);new Function(sw);
assert(html.includes('duelo-conocimiento-modos.js?v=9'));
assert(ext.includes('duelo-conocimiento.html?v=10'));
assert(index.includes('extensiones.js?v=91'));
assert(sw.includes('gya-cache-v509'));
assert(sw.includes('duelo-conocimiento-modos.js?v=9'));
assert(sw.includes('duelo-conocimiento.html?v=10'));
const start=source.indexOf("function avanzarDespuesDeRespuestaBot(");
const end=source.indexOf("const baseFinish=finish;",start);
assert(start>=0&&end>start,"Localizar adaptador existente de respuestas");
const script=source.slice(start,end);
function create(mode="bot",jugador=1){
 const timers=new Map(),clears=[],feedback={textContent:"",className:""};
 let nextId=0,resolveNarration=null,answerCount=0,passCount=0,questions=0,micStops=0;
 const context={
   mode,active:jugador,phase:"playing",question:{answered:false,answer:"Uruguay"},
   players:[{name:"Vale",score:0,errors:0},{name:"BOT",score:0,errors:0}],
   botHandle:0,transitionTimeout:0,turn:1,
   $dc(id){if(id==="feedback")return feedback;return{textContent:"",className:""}},
   setMicLabel(){},
   getCorrectAnswer(q){return q.answer;},
   clearTimeout(id){clears.push(id);timers.delete(id)},
   setTimeout(fn,ms){const id=++nextId;timers.set(id,{fn,ms});return id},
   nextQuestion(){questions++},
   stopMic(){micStops++},
   speak(text,maxMs){assert(text.includes("Uruguay"));assert(maxMs>=10000);return new Promise(res=>{resolveNarration=res})},
   sendOnline(){},
   applyAnswer(){},
   rightAnswer(){
     answerCount++;context.question.answered=true;context.phase="transition";
     context.players[context.active].score++;
     context.transitionTimeout=context.setTimeout(()=>{context.active=1-context.active;context.turn++;context.nextQuestion()},2800);
   },
   passTurn(){
     passCount++;context.question.answered=true;context.phase="transition";
     context.players[context.active].errors++;
     context.transitionTimeout=context.setTimeout(()=>{context.active=1-context.active;context.turn++;context.nextQuestion()},1900);
   }
 };
 // Functions from vm are run against the supplied context, not the test module.
 vm.runInNewContext(script,context,{filename:"duelo-conocimiento-modos.js"});
 return {context,timers,feedback,answerCount:()=>answerCount,passCount:()=>passCount,
   questions:()=>questions,completeSpeech:()=>resolveNarration?.(),
   advance(){
     assert.equal(timers.size,1,"Solo un temporizador");
     const next=[...timers.values()][0];timers.clear();next.fn();return next.ms;
   }
 };
}
(async()=>{
 const b=create("bot",1);
 b.context.rightAnswer("BOT");
 assert.equal(b.answerCount(),1,"Puntaje original mantenido");
 assert.equal(b.context.players[1].score,1,"Un solo punto original");
 assert.equal(b.timers.size,0,"Se cancela avance prematuro");
 assert(b.feedback.textContent.includes("Uruguay"),"Respuesta visible mientras se habla");
 b.completeSpeech();await Promise.resolve();await Promise.resolve();
 assert.equal(b.advance(),3500,"3500ms DESPUÉS de terminar voz");
 assert.equal(b.questions(),1);
 assert.equal(b.context.active,0,"Siguiente turno jugador");
 const p=create("bot",0);
 p.context.passTurn();
 assert.equal(p.passCount(),1,"Una sola penalización");
 assert.equal(p.context.players[0].errors,1,"Penalización original conservada");
 assert(p.feedback.textContent.includes("Respuesta correcta: Uruguay"),"Solución de PASO visible");
 assert.equal(p.advance(),4500,"Lectura de solución 4.5s al pasar");
 assert.equal(p.context.active,1);
 const local=create("local",0);
 local.context.rightAnswer("Vale");
 assert.equal(local.advance(),2800,"Otro modo usa su temporizador original");
 const botNoAudio=create("bot",1);
 botNoAudio.context.rightAnswer("BOT");
 botNoAudio.context.phase="finished";
 botNoAudio.completeSpeech();await Promise.resolve();
 assert.equal(botNoAudio.timers.size,0,"No avanzar después de salir/finalizar");
 console.log("PASS: voz completa, solución visible, PASO 4.5s, penalización intacta y modo local intacto");
})().catch(error=>{console.error(error);process.exitCode=1});
