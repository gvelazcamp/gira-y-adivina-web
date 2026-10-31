/* Regresión de voz del Rosco con y sin compartir pantalla.
   node tests/rosco-voz-compartir.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","rosco-rioplatense.js"),"utf8");
const a=source.indexOf("  function cancelarErrorVozG(){");
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
   normalizar:t=>t.toUpperCase().replace(/\s+/g,""),valeVoz:(q,t)=>q.palabra===t.toUpperCase().replace(/\s+/g,""),
   $:()=>input,mostrarEstadoVozG:msg=>events.push("estado:"+msg),
   mensaje:msg=>events.push("mensaje:"+msg),
   pasar:()=>events.push("paso"),enviar:()=>events.push("respuesta:"+input.value)
 };
 parse(env,{resultIndex:0,results:[{0:{transcript:words},length:1,isFinal:final}]});
 if(expected==="respuesta:ciruela"&&!final){
   assert(!events.some(e=>e.startsWith("respuesta:")),"El parcial espera a que termine la frase");
   const pendiente=[...timers.values()].find(t=>t.ms===1500);
   assert(pendiente,"El parcial sin resultado final tiene un límite");pendiente.fn();
 }
 if(expected==="")assert(!events.some(e=>e.startsWith("respuesta:")||e==="paso"),
   (sharing?"Compartiendo":"Directo")+": el eco de la pista no debe procesarse => "+events);
 else assert(events.includes(expected),(sharing?"Compartiendo":"Directo")+": "+words+" => "+events);
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
 simulate("ciruela",false,"respuesta:ciruela",sharing);
}
/* Si Android detecta voz pero no entrega texto, el intento se reinicia solo. */
assert(source.includes("function esperarResultadoVozG(r,ms=6000)"),"Un intento sin transcripción se reconecta");
assert(source.includes("esperarResultadoVozG(r,9000)"),"También se vigila desde que Android entrega audio");
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
assert(index.includes("rosco-rioplatense.js?v=83"));
assert(index.includes("rosco-rioplatense-datos.js?v=7"));
assert(sw.includes("rosco-rioplatense.js?v=83")&&sw.includes("rosco-rioplatense-datos.js?v=7")&&sw.includes("gya-cache-v626"));
console.log("PASS: voz y Pasapalabra, con y sin pantalla compartida, respuestas parciales, retorno y caché");
