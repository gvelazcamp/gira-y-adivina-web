/* Giro — apertura corregida: Giro y atril siempre juntos y quietos.
   Ejecutar: node tests/giro-rosco-cine.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const src=fs.readFileSync(path.join(root,"giro-rosco-piloto.js"),"utf8");
const css=fs.readFileSync(path.join(root,"giro-rosco-piloto.css"),"utf8");
const rosco=fs.readFileSync(path.join(root,"rosco-rioplatense.js"),"utf8");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
new Function(src);new Function(rosco);new Function(sw);
assert(src.includes('const PLANO_ESTABLE=BASE+"escenas/Giro_presentacion_plano_general_16x9.png"'));
assert(fs.existsSync(path.join(root,"presentacion-y-locucion-extensiones/Giro/escenas/Giro_presentacion_plano_general_16x9.png")));
assert(!src.includes("Giro_presentacion_plano_medio_16x9.png"),"no cambiar ilustración");
assert(!src.includes("Giro_presentacion_primer_plano_16x9.png"),"no cambiar ilustración");
assert(!/grp-labios|bocas-v2|iniciarLabios/.test(src+css),"sin boca");
assert(!src.includes("new Audio("),"sin música");
assert(!src.includes("grp-atril"),"sin segundo atril");
assert(css.includes('.grp-escenario-estable[data-plano="medio"] .grp-plano-estable{transform:scale(1.025)}'));
assert(css.includes('.grp-escenario-estable[data-plano="cercano"] .grp-plano-estable{transform:scale(1.045)}'));
assert(index.includes("extensiones.js?v=88")&&index.includes("puedeModoTVExtensiones()"),"Vale conserva TV");
assert(index.includes("rosco-rioplatense.js?v=32"));
assert(sw.includes("gya-cache-v501"));
assert(rosco.includes("window.GiroRoscoPiloto.mostrarInicio()"));
assert(rosco.includes("window.GiroRoscoPiloto.mostrarFinal({aciertos,total:items.length,puntos})"));

function el(tag){
  const handlers={},classes=new Set();
  return{tag,children:[],className:"",dataset:{},attributes:{},isConnected:true,
    classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
    append(...xs){this.children.push(...xs);},
    appendChild(x){this.children.push(x);return x;},
    setAttribute(k,v){this.attributes[k]=v;},
    addEventListener(k,fn){handlers[k]=fn;},
    click(){handlers.click?.();},focus(){},remove(){this.removed=true;},
    querySelectorAll(){return [];}
  };
}
function find(n,cls){
  if(n.className===cls)return n;
  for(const child of n.children||[]){const x=find(child,cls);if(x)return x;}
  return null;
}
function testEnvironment(user,reduced=false){
  const body=el("body"),intervals=new Map(),timeouts=new Map();
  let next=0,voice=null;
  const document={body,hidden:false,activeElement:el("button"),createElement:el,addEventListener(){},removeEventListener(){}};
  const window={speechSynthesis:{cancel(){},getVoices(){return[{lang:"es-UY"}]},speak(u){voice=u;}}};
  vm.runInNewContext(src,{window,document,esGonzalo:()=>user,
    matchMedia:()=>({matches:reduced}),
    setInterval:cb=>{const id=++next;intervals.set(id,cb);return id;},
    clearInterval:id=>intervals.delete(id),
    setTimeout:cb=>{const id=++next;timeouts.set(id,cb);return id;},
    clearTimeout:id=>timeouts.delete(id),
    SpeechSynthesisUtterance:function(t){this.text=t;}
  },{filename:"giro-rosco-piloto.js"});
  return{body,document,intervals,timeouts,api:window.GiroRoscoPiloto,voice:()=>voice,
    tick(){for(const f of [...intervals.values()])f();},
    finish(){for(const f of [...timeouts.values()])f();}};
}
const other=testEnvironment(false);
assert.equal(other.api.mostrarInicio(),false);
assert.equal(other.body.children.length,0);
const g=testEnvironment(true);
assert.equal(g.api.mostrarInicio(),true);
const overlay=g.body.children[0],stage=find(overlay,"grp-escenario"),photo=find(overlay,"grp-plano-estable");
assert(stage&&photo,"solo un escenario oficial");
assert(photo.src.endsWith("Giro_presentacion_plano_general_16x9.png"));
assert(!find(overlay,"grp-actor"),"no personaje añadido en la apertura");
assert(!find(overlay,"grp-atril"),"no atril duplicado");
assert.equal(stage.dataset.plano,"general");
assert.equal(g.intervals.size,1);
g.tick();assert.equal(stage.dataset.plano,"medio");
g.tick();assert.equal(stage.dataset.plano,"cercano");
g.tick();assert.equal(stage.dataset.plano,"general");
assert.equal(g.intervals.size,0,"la cámara se detiene, no repite");
find(overlay,"grp-boton grp-voz").click();
assert(g.voice()?.text.includes("Rosco"),"conserva locución");
assert.equal(g.intervals.size,1,"un solo temporizador");
g.document.hidden=true;
const last=stage.dataset.plano;g.tick();
assert.equal(stage.dataset.plano,last,"no avanzar con pestaña oculta");
find(overlay,"grp-boton grp-accion").click();
assert.equal(g.timeouts.size,1);
g.finish();assert(overlay.removed);
assert.equal(g.intervals.size,0);
const reduced=testEnvironment(true,true);
assert.equal(reduced.api.mostrarInicio(),true);
assert.equal(reduced.intervals.size,0,"respeta reducción de movimiento");
reduced.api.cerrar();
console.log("PASS: Giro y atril unidos; zoom leve único, voz, Vale, usuario Gonzalo, sin boca/música");
