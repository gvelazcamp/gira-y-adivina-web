/* Regresión del fundido y respiración de Giro en el Rosco.
   Ejecutar: node tests/giro-rosco-animaciones.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const src=fs.readFileSync(path.join(root,"giro-rosco-piloto.js"),"utf8");
const css=fs.readFileSync(path.join(root,"giro-rosco-piloto.css"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
assert(css.includes("@keyframes grp-respirar"),"respiración animada");
assert(css.includes(".grp-actor .grp-giro.grp-visible{opacity:1}"),"capas fundidas");
assert(css.includes("prefers-reduced-motion:reduce"),"accesibilidad");
assert(sw.includes('"./giro-rosco-piloto.js?v=6"'),"PWA piloto JS versionado");
assert(sw.includes('"./giro-rosco-piloto.css?v=5"'),"PWA piloto CSS versionado");
assert(!src.includes("new Audio("),"no incorporar música nueva");
assert(!src.includes("grp-atril"),"no duplicar atril");

function elemento(tag){
  const clases=new Set();
  return {
    tag,children:[],dataset:{},attributes:{},isConnected:true,
    classList:{add:x=>clases.add(x),remove:x=>clases.delete(x),contains:x=>clases.has(x),toggle:(x,force)=>{const on=force===undefined?!clases.has(x):!!force;if(on)clases.add(x);else clases.delete(x);return on;}},
    append(...nodos){this.children.push(...nodos);},
    appendChild(nodo){this.children.push(nodo);return nodo;},
    setAttribute(k,v){this.attributes[k]=v;},
    addEventListener(){},focus(){},remove(){this.removed=true;},
    querySelectorAll(){return[];},
    decode(){return Promise.resolve();}
  };
}
function entorno(gonzalo=true,reducido=false){
  const timers=[],cancelados=[];
  const body=elemento("body");
  const document={body,hidden:false,activeElement:elemento("button"),
    createElement:elemento,addEventListener(){},removeEventListener(){}};
  const window={};
  vm.runInNewContext(src,{
    document,window,esGonzalo:()=>gonzalo,
    matchMedia:()=>({matches:reducido}),
    setInterval:cb=>{timers.push(cb);return timers.length;},
    clearInterval:id=>{cancelados.push(id);},
    requestAnimationFrame:cb=>cb(),
    SpeechSynthesisUtterance:function(){}
  },{filename:"giro-rosco-piloto.js"});
  return{api:window.GiroRoscoPiloto,body,document,timers,cancelados};
}
function encontrar(nodo,clase){
  if(nodo.className===clase)return nodo;
  for(const hijo of nodo.children||[]){
    const encontrado=encontrar(hijo,clase);
    if(encontrado)return encontrado;
  }
  return null;
}
(async()=>{
  const g=entorno(true,false);
  assert.equal(g.api.mostrarInicio(),true);
  assert.equal(g.timers.length,1,"un solo temporizador");
  const stage=encontrar(g.body,"grp-escenario");
  const foto=encontrar(g.body,"grp-plano-estable");
  assert(stage&&foto,"un solo fotograma en la presentación");
  assert(!encontrar(g.body,"grp-actor"),"no superponer un segundo Giro");
  assert.equal(stage.dataset.plano,"general");
  g.timers[0]();assert.equal(stage.dataset.plano,"medio","plano medio con leve zoom");
  g.timers[0]();assert.equal(stage.dataset.plano,"cercano","primer plano sin cambiar de imagen");
  g.document.hidden=true;
  const anterior=stage.dataset.plano;g.timers[0]();
  assert.equal(stage.dataset.plano,anterior,"no cambiar plano si la pestaña está oculta");
  g.document.hidden=false;
  g.timers[0]();assert.equal(stage.dataset.plano,"general","regreso al plano general");
  const panel=g.body.children[0];
  g.api.cerrar();
  assert.equal(panel.removed,true,"cierra superposición");
  assert(g.cancelados.includes(1),"detiene temporizador");
  assert.equal(g.api.mostrarFinal({aciertos:5,total:12,puntos:500}),true);
  assert(encontrar(g.body.children.at(-1),"grp-actor"),"mantiene personaje de la pantalla de resultados");
  g.api.cerrar();
  const otro=entorno(false);
  assert.equal(otro.api.mostrarInicio(),false,"nadie salvo Gonzalo");
  assert.equal(otro.body.children.length,0,"sin interfaz en otros perfiles");
  const reducido=entorno(true,true);
  assert.equal(reducido.api.mostrarInicio(),true,"sigue mostrando la presentación");
  assert.equal(reducido.timers.length,0,"sin cambio de poses en movimiento reducido");
  reducido.api.cerrar();
  console.log("PASS: fundidos, respiración CSS, limpieza, usuario Gonzalo, movimiento reducido y sin música");
})().catch(e=>{console.error(e);process.exitCode=1;});
