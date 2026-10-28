/* Regresión: la animación de boca de Giro está desactivada.
   Se conserva la locución y el estudio, solo para Gonzalo.
   Ejecutar: node tests/giro-rosco-bocas.cjs */
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const src=fs.readFileSync(path.join(root,"giro-rosco-piloto.js"),"utf8");
const css=fs.readFileSync(path.join(root,"giro-rosco-piloto.css"),"utf8");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
new Function(src);new Function(sw);
assert(index.includes('rosco-rioplatense.js?v=32'));
assert(sw.includes('"./giro-rosco-piloto.js?v=7"'));
assert(sw.includes('"./giro-rosco-piloto.css?v=6"'));
assert(!/bocas-v2|grp-labios|grp-speaking|iniciarLabios|fonemaAIndice/.test(src+css),
  "No deben quedar funciones ni capas de sincronización de boca");
assert(src.includes('voz.addEventListener("click",()=>{')&&src.includes('hablar(locucion);'),
  "Conservar el botón de voz");
assert(src.includes('actor.append(host,hostSiguiente)'),
  "Conservar los gestos animados");
assert(!src.includes('new Audio('),"Sin música nueva");
assert(!src.includes("grp-atril"),"Sin segundo atril");
function crear(tag){
  const eventos={};
  return{tag,children:[],dataset:{},attributes:{},isConnected:true,
    append(...n){this.children.push(...n);},appendChild(n){this.children.push(n);return n;},
    setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,cb){eventos[k]=cb;},
    click(){eventos.click?.();},focus(){},remove(){this.removed=true;},
    querySelectorAll(){return[];},classList:{add(){},remove(){},contains(){return false;}}};
}
function buscar(n,clase){
  if(n.className===clase)return n;
  for(const item of n.children||[]){const res=buscar(item,clase);if(res)return res;}
  return null;
}
function prueba(gonzalo){
  const body=crear("body");
  const document={body,hidden:false,activeElement:crear("button"),
    createElement:crear,addEventListener(){},removeEventListener(){}};
  let locucion=null,canceladas=0;
  const window={speechSynthesis:{
    getVoices(){return[{lang:"es-UY"}];},
    speak(u){locucion=u;},
    cancel(){canceladas++;}
  }};
  vm.runInNewContext(src,{window,document,esGonzalo:()=>gonzalo,
    matchMedia:()=>({matches:true}),setInterval:()=>1,clearInterval:()=>{},
    SpeechSynthesisUtterance:function(texto){this.text=texto;}
  },{filename:"giro-rosco-piloto.js"});
  const api=window.GiroRoscoPiloto;
  if(!gonzalo){
    assert.equal(api.mostrarInicio(),false);
    assert.equal(body.children.length,0);
    return;
  }
  assert.equal(api.mostrarInicio(),true);
  assert(!buscar(body,"grp-labios"),"No se crea boca");
  const voz=buscar(body,"grp-boton grp-voz");
  assert(voz,"Botón escuchar presente");
  voz.click();
  assert(locucion?.text.includes("Rosco"),"Voz activa");
  api.cerrar();
  assert(body.children[0].removed,"Se cierra la escena");
  assert(canceladas>0,"Se detiene la voz");
}
prueba(true);prueba(false);
console.log("PASS: Giro sin bocas, con voz y gestos, solo Gonzalo");
