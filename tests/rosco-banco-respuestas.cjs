/* Audita cada palabra real del Rosco y su camino de respuesta hablada. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"rosco-rioplatense.js"),"utf8");
const data=fs.readFileSync(path.join(root,"rosco-rioplatense-datos.js"),"utf8");
const entries=vm.runInNewContext(data+"\nROSCO_DATOS");
const from=source.indexOf("  const normalizar=s=>");
const until=source.indexOf("  const numero=",from);
const voiceFrom=source.indexOf("  function cancelarErrorVozG(){");
const voiceUntil=source.indexOf("  function arrancarEscuchaG(){",voiceFrom);
assert(from>=0&&until>from&&voiceFrom>=0&&voiceUntil>voiceFrom);
const matching=source.slice(from,until);
const {normalizar,vale,valeVoz}=new Function(matching+"return{normalizar,vale,valeVoz}")();
const process=new Function("env","event","with(env){"+matching+source.slice(voiceFrom,voiceUntil)+"return procesarResultadoVozG(event)}");
assert.equal(entries.length,521,"No se perdió ninguna palabra del banco");
const known=new Set(),aliases=new Set();
function spoken(item,transcript){
  const input={value:""};let submitted="";
  const env={
    vozG:true,vozLeyendoG:false,fase:"resolver",actual:0,items:[item],
    vozSilenciosG:0,vozGeneracionG:0,vozPaseTimerG:null,vozErrorTimerG:null,vozErrorPendienteG:null,
    cancelarPaseVozG(){},clearTimeout(){},setTimeout(){throw Error("Respuesta correcta enviada a espera de error")},
    $(){return input},mostrarEstadoVozG(){},enviar(){submitted=input.value},pasar(){throw Error("Respuesta tratada como Pasapalabra")}
  };
  process(env,{resultIndex:0,results:[{0:{transcript},length:1,isFinal:false}]});
  return submitted;
}
for(const item of entries){
  assert(/^[A-Z]$/.test(item.letra),item.palabra);
  assert(normalizar(item.palabra).startsWith(item.letra),item.palabra+" no empieza con "+item.letra);
  assert(item.definicion&&item.definicion.length>6,item.palabra+" sin pista útil");
  const key=normalizar(item.palabra);
  assert(!known.has(key),"Palabra duplicada: "+item.palabra);known.add(key);
  assert(vale(item,key),"El teclado rechaza "+item.palabra);
  assert.equal(spoken(item,item.palabra),item.palabra,"El micrófono rechaza "+item.palabra);
  for(const alt of item.alternativas){
    const alias=normalizar(alt);
    assert(vale(item,alias),item.palabra+" rechaza "+alt+" por teclado");
    assert.equal(spoken(item,alt),item.palabra,item.palabra+" rechaza "+alt+" por voz");
    assert(!aliases.has(alias),"Alias duplicado: "+alt);aliases.add(alias);
  }
}
for(const alias of aliases)assert(!known.has(alias),"Alias que es otra respuesta del banco: "+alias);
for(const item of entries)for(const other of entries){
  if(item!==other)assert(!valeVoz(item,other.palabra),item.palabra+" acepta por error "+other.palabra);
}
const byWord=new Map(entries.map(x=>[x.palabra,x]));
for(const [word,heard] of [["VACA","baca"],["ZAMBA","samba"],["LLAVE","yave"],["CHIVITO","chibito"]]){
  assert.equal(spoken(byWord.get(word),heard),word,"Transcripción homófona: "+heard);
}
assert(vale(byWord.get("YOYO"),normalizar("yo-yo")));
assert(vale(byWord.get("DULCE DE LECHE"),normalizar("dulce-de-leche")));
assert.equal(spoken(byWord.get("YUYO"),"la palabra es yuyo"),"YUYO");
assert.equal(valeVoz(byWord.get("UNTAR"),"untal"),false,"No aceptar cualquier palabra parecida");
assert.equal(valeVoz(byWord.get("YUYO"),"huyo"),false,"No aceptar cualquier palabra parecida");
console.log("PASS: "+entries.length+" palabras y "+aliases.size+" variantes del Rosco aceptadas por teclado y voz");
