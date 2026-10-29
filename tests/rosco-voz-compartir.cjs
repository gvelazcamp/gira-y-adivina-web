/* Regresión de voz del Rosco con y sin compartir pantalla.
   node tests/rosco-voz-compartir.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","rosco-rioplatense.js"),"utf8");
const a=source.indexOf("  function procesarResultadoVozG(e){");
const b=source.indexOf("  function arrancarEscuchaG(){",a);
assert(a>=0&&b>a,"La función real de voz existe");
const fragment=source.slice(a,b);
const parse=new Function("env","e","with(env){"+fragment+"return procesarResultadoVozG(e)}");
function simulate(words,final,expected,sharing){
 const events=[],input={value:""},timers=new Map();let nextTimer=0;
 const env={
   vozG:true,vozLeyendoG:false,fase:"resolver",actual:0,vozSilenciosG:0,
   cancelarPaseVozG(){},vozGeneracionG:0,vozPaseTimerG:null,vozErrorTimerG:null,vozErrorPendienteG:null,
   setTimeout(fn,ms){const id=++nextTimer;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},
   items:[{palabra:"MANZANA",definicion:"Fruta de un árbol que puede ser roja o verde"}],
   normalizar:t=>t.toUpperCase().replace(/\s+/g,""),vale:(q,t)=>q.palabra===t,
   $:()=>input,mostrarEstadoVozG:msg=>events.push("estado:"+msg),
   mensaje:msg=>events.push("mensaje:"+msg),
   pasar:()=>events.push("paso"),enviar:()=>events.push("respuesta:"+input.value)
 };
 env.cancelarErrorVozG=()=>{env.clearTimeout(env.vozErrorTimerG);env.vozErrorTimerG=null;env.vozErrorPendienteG=null;};
 parse(env,{resultIndex:0,results:[{0:{transcript:words},length:1,isFinal:final}]});
 if(expected==="respuesta:ciruela"){
   assert(!events.some(e=>e.startsWith("respuesta:")),"Una transcripción errónea tiene plazo de corrección");
   const pendiente=[...timers.values()].find(t=>t.ms===3000);
   assert(pendiente,"El error final se confirma tras un plazo breve");pendiente.fn();
 }
 if(expected===""){
   assert(!events.some(e=>e.startsWith("respuesta:")||e==="paso"),
     (sharing?"Compartiendo":"Directo")+": el eco de la pista no debe procesarse => "+events);
 }else assert(events.includes(expected),(sharing?"Compartiendo":"Directo")+": "+words+" => "+events);
}
/* Si Android oyó mal una palabra, repetirla antes del plazo evita el error. */
{
 const events=[],input={value:""},timers=new Map();let nextTimer=0;
 const env={
   vozG:true,vozLeyendoG:false,fase:"resolver",actual:0,vozSilenciosG:0,
   cancelarPaseVozG(){},vozGeneracionG:0,vozPaseTimerG:null,vozErrorTimerG:null,vozErrorPendienteG:null,
   setTimeout(fn,ms){const id=++nextTimer;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},
   items:[{palabra:"UNTAR",definicion:"Pasar manteca por la tostada"}],
   normalizar:t=>t.toUpperCase().replace(/\s+/g,""),vale:(q,t)=>q.palabra===t,
   $:()=>input,mostrarEstadoVozG:msg=>events.push("estado:"+msg),
   pasar:()=>events.push("paso"),enviar:()=>events.push("respuesta:"+input.value)
 };
 env.cancelarErrorVozG=()=>{env.clearTimeout(env.vozErrorTimerG);env.vozErrorTimerG=null;env.vozErrorPendienteG=null;};
 const result=(transcript,isFinal)=>parse(env,{resultIndex:0,results:[{0:{transcript},length:1,isFinal}]});
 result("un tal",true);
 assert.equal(events.filter(x=>x.startsWith("respuesta:")).length,0);
 result("untar",false);
 assert(events.includes("respuesta:UNTAR"));
 assert.equal(timers.size,0,"La corrección cancela el error pendiente");
 env.items[0]={palabra:"YUYO",definicion:"Nombre popular para una hierba que crece silvestre"};
 input.value="";env.actual=1;env.items[1]=env.items[0];
 result("huyo",true);result("yuyo",true);
 assert(events.includes("respuesta:YUYO"));
 assert.equal(timers.size,0);
}
for(const sharing of [false,true]){
 simulate("manzana",false,"respuesta:MANZANA",sharing);
 simulate("manzana",true,"respuesta:MANZANA",sharing);
 simulate("es manzana",true,"respuesta:MANZANA",sharing);
 simulate("la manzana",true,"respuesta:MANZANA",sharing);
 simulate("la respuesta es manzana",false,"respuesta:MANZANA",sharing);
 simulate("creo que es manzana",true,"respuesta:MANZANA",sharing);
 simulate("Fruta de un árbol",true,"",sharing);
 simulate("Fruta",true,"",sharing);
 simulate("pasapalabra",true,"paso",sharing);
 simulate("pasa palabra",true,"paso",sharing);
 simulate("pasapalabra",false,"estado:Oí «Pasapalabra» · confirmando…",sharing);
 simulate("ciruela",true,"respuesta:ciruela",sharing);
 simulate("ciruela",false,"estado:Oí «ciruela» · seguí hablando",sharing);
}
/* Si Android detecta voz pero no entrega texto, el intento se reinicia solo. */
const inicioWatchdog=source.indexOf("  function esperarResultadoVozG(r){");
const finWatchdog=source.indexOf("  function leerPistaG(){",inicioWatchdog);
assert(inicioWatchdog>=0&&finWatchdog>inicioWatchdog);
const tareas=new Map(),instancias=[],estados=[];
let proximaTarea=0;
const envWatchdog={
 pruebaG:true,vozG:true,vozLeyendoG:false,fase:"resolver",escuchando:false,
 reconocimiento:null,vozResultadoTimerG:null,vozTimerG:null,vozSilenciosG:0,vozErrorPendienteG:null,
 document:{hidden:false},performance:{now:()=>0},
 setTimeout(fn,ms){const id=++proximaTarea;tareas.set(id,{fn,ms});return id;},
 clearTimeout(id){tareas.delete(id);},
 detenerMusicaJuego(){},mostrarEstadoVozG(texto){estados.push(texto);},
 procesarResultadoVozG(){},cancelarErrorVozG(){},pararVozG(){throw Error("no debe apagar Hablar");},mensaje(){},
 window:{SpeechRecognition:class{
   start(){instancias.push(this);}
   abort(){this.onend?.();}
 }}
};
const iniciarWatchdog=new Function("env","with(env){"+source.slice(inicioWatchdog,finWatchdog)+"return arrancarEscuchaG}")(envWatchdog);
iniciarWatchdog();
assert.equal(instancias.length,1);
instancias[0].onspeechstart();
const sinTexto=[...tareas.values()].find(t=>t.ms===6000);
assert(sinTexto,"el intento sin transcripción tiene límite");
sinTexto.fn();
assert(estados.some(x=>x.includes("reconectando micrófono")));
const reabrir=[...tareas.values()].find(t=>t.ms>=350&&t.ms<=700);
assert(reabrir,"se reabre después de abortar el intento trabado");
reabrir.fn();
assert.equal(instancias.length,2,"Hablar sigue activo sin tocar el botón de nuevo");
for(const name of ["siguiente","enviar","pasar"]){
 const i=source.indexOf("  function "+name+"(){");
 assert(i>=0&&source.slice(i,i+230).includes("if(!(pruebaG&&vozG))detenerVoz();"),name+" mantiene la escucha entre letras");
}
const activation=source.slice(source.indexOf("  function alternarVozG(){"),source.indexOf("  /* El modo Hablar funciona",source.indexOf("  function alternarVozG(){")));
assert(!/\b(?:navigator\.mediaDevices\.)?getUserMedia\s*\(/.test(activation),"No bloquear Web Speech con una segunda captura");
assert(activation.includes("leerPistaG();"),"La pista abre el micrófono al terminar de hablar");
assert(source.includes("r.interimResults=true;r.maxAlternatives=5;"),"Interim igual que Duelo");
assert(source.includes('vozTimerG=setTimeout(arrancarEscuchaG,450);'),"Reconectar tras recuperar visibilidad");
assert(source.includes("Micrófono en pausa · se reanuda al volver."),"Modo voz activo al duplicar pantalla");
const index=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const sw=fs.readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
assert(index.includes("rosco-rioplatense.js?v=65"));
assert(sw.includes("rosco-rioplatense.js?v=65")&&sw.includes("gya-cache-v561"));
console.log("PASS: voz y Pasapalabra, con y sin pantalla compartida, respuestas parciales, retorno y caché");
