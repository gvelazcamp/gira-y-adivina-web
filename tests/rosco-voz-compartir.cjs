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
 const events=[],input={value:""};
 const env={
   vozG:true,vozLeyendoG:false,fase:"resolver",actual:0,vozSilenciosG:0,
   cancelarPaseVozG(){},vozGeneracionG:0,vozPaseTimerG:null,
   setTimeout:()=>1,clearTimeout:()=>{},
   items:[{palabra:"MANZANA",definicion:"Fruta de un árbol que puede ser roja o verde"}],
   normalizar:t=>t.toUpperCase().replace(/\s+/g,""),vale:(q,t)=>q.palabra===t,
   $:()=>input,mostrarEstadoVozG:msg=>events.push("estado:"+msg),
   mensaje:msg=>events.push("mensaje:"+msg),
   pasar:()=>events.push("paso"),enviar:()=>events.push("respuesta:"+input.value)
 };
 parse(env,{resultIndex:0,results:[{0:{transcript:words},length:1,isFinal:final}]});
 if(expected===""){
   assert(!events.some(e=>e.startsWith("respuesta:")||e==="paso"),
     (sharing?"Compartiendo":"Directo")+": el eco de la pista no debe procesarse => "+events);
 }else assert(events.includes(expected),(sharing?"Compartiendo":"Directo")+": "+words+" => "+events);
}
for(const sharing of [false,true]){
 simulate("manzana",false,"respuesta:MANZANA",sharing);
 simulate("manzana",true,"respuesta:MANZANA",sharing);
 simulate("es manzana",true,"respuesta:MANZANA",sharing);
 simulate("la respuesta es manzana",false,"respuesta:MANZANA",sharing);
 simulate("creo que es manzana",true,"respuesta:MANZANA",sharing);
 simulate("Fruta de un árbol",true,"",sharing);
 simulate("pasapalabra",true,"paso",sharing);
 simulate("pasa palabra",true,"paso",sharing);
 simulate("pasapalabra",false,"estado:Oí «Pasapalabra» · confirmando…",sharing);
 simulate("ciruela",true,"estado:Oí «ciruela» · repetí o tocá Enviar",sharing);
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
 reconocimiento:null,vozResultadoTimerG:null,vozTimerG:null,vozSilenciosG:0,
 document:{hidden:false},performance:{now:()=>0},
 setTimeout(fn,ms){const id=++proximaTarea;tareas.set(id,{fn,ms});return id;},
 clearTimeout(id){tareas.delete(id);},
 detenerMusicaJuego(){},mostrarEstadoVozG(texto){estados.push(texto);},
 procesarResultadoVozG(){},pararVozG(){throw Error("no debe apagar Hablar");},mensaje(){},
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
assert(index.includes("rosco-rioplatense.js?v=61"));
assert(sw.includes("rosco-rioplatense.js?v=61")&&sw.includes("gya-cache-v557"));
console.log("PASS: voz y Pasapalabra, con y sin pantalla compartida, respuestas parciales, retorno y caché");
