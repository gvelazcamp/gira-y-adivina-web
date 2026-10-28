/* Prueba aislada: locución en el piloto de Giro, solo perfil Gonzalo.
   Ejecutar: node tests/giro-rosco-bocas.cjs */
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const src=fs.readFileSync(path.join(root,"giro-rosco-piloto.js"),"utf8");
const css=fs.readFileSync(path.join(root,"giro-rosco-piloto.css"),"utf8");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
new Function(src);new Function(sw);
assert(index.includes("rosco-rioplatense.js?v=29"));
assert(sw.includes('"./giro-rosco-piloto.js?v=4"'));
assert(sw.includes('"./giro-rosco-piloto.css?v=3"'));
assert(css.includes("grp-labios")&&css.includes("42.48%"));
assert(!src.includes("new Audio("),"no se agregó música");
assert(!src.includes("grp-atril"),"no crear atril duplicado");
const tipos=[
  "Giro_boca_01_cerrada.png","Giro_boca_02_abierta.png","Giro_boca_03_vocal_o.png",
  "Giro_boca_04_dientes.png","Giro_boca_05_o_pequena.png",
  "Giro_boca_06_lengua.png","Giro_boca_07_risa.png"
];
for(const n of tipos)assert(src.includes(n),n);
function elemento(tag){
  const listeners={},clases=new Set();
  return{tag,children:[],dataset:{},attributes:{},isConnected:true,
    classList:{add:k=>clases.add(k),remove:k=>clases.delete(k),contains:k=>clases.has(k)},
    append(...ns){this.children.push(...ns);},appendChild(n){this.children.push(n);return n;},
    setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,cb){listeners[k]=cb;},
    remove(){this.removed=true;},focus(){},querySelectorAll(){return[];},dispatch(k){listeners[k]?.();}
  };
}
function buscar(n,cls){
  if(n.className===cls)return n;
  for(const c of n.children||[]){const r=buscar(c,cls);if(r)return r;}return null;
}
function ejecutar(gonzalo=true,fallanArchivos=false){
  const timers=new Map();let next=0,cancelados=0,vozActual=null;
  const body=elemento("body");
  const document={body,hidden:false,activeElement:elemento("button"),
    createElement:elemento,addEventListener(){},removeEventListener(){}};
  const window={speechSynthesis:{
    cancel(){cancelados++;},
    getVoices(){return[{lang:"es-UY"}]},
    speak(u){vozActual=u;}
  }};
  class ImageMock{set src(v){this._src=v;queueMicrotask(()=>{fallanArchivos?this.onerror?.(new Error("404")):this.onload?.();});}get src(){return this._src;}}
  function SpeechSynthesisUtteranceMock(t){this.text=t;}
  vm.runInNewContext(src,{document,window,Image:ImageMock,esGonzalo:()=>gonzalo,
    SpeechSynthesisUtterance:SpeechSynthesisUtteranceMock,matchMedia:()=>({matches:true}),
    requestAnimationFrame:cb=>cb(),
    setInterval(cb){let id=++next;timers.set(id,cb);return id;},
    clearInterval(id){timers.delete(id);}
  },{filename:"giro-rosco-piloto.js"});
  return{api:window.GiroRoscoPiloto,body,timers,voz:()=>vozActual,cancelados:()=>cancelados};
}
(async()=>{
  const a=ejecutar(true,false);
  assert(a.api.mostrarInicio());
  const overlay=a.body.children[0],btn=buscar(overlay,"grp-boton grp-voz");
  const boca=buscar(overlay,"grp-labios"),actor=buscar(overlay,"grp-actor");
  assert(btn&&boca&&actor,"controles de voz, boca y personaje");
  btn.dispatch("click");
  assert(a.voz(),"speech synthesis inicia a solicitud");
  a.voz().onstart();
  for(let i=0;i<12;i++)await Promise.resolve();
  assert(actor.classList.contains("grp-speaking"),"boca activa");
  const previa=boca.src;a.voz().onboundary({charIndex:16});
  assert(boca.src.includes("/bocas-v2/"),"boca de la nueva carpeta");
  a.voz().onend();
  assert(!actor.classList.contains("grp-speaking"),"boca detenida al finalizar voz");
  a.api.cerrar();
  assert.equal(overlay.removed,true);
  assert.equal(a.timers.size,0,"sin intervalos después de cerrar");
  const sin=ejecutar(false);
  assert.equal(sin.api.mostrarInicio(),false,"otros perfiles sin presentación");
  const rotos=ejecutar(true,true);
  rotos.api.mostrarInicio();
  buscar(rotos.body,"grp-boton grp-voz").dispatch("click");rotos.voz().onstart();
  for(let i=0;i<12;i++)await Promise.resolve();
  assert(!buscar(rotos.body,"grp-actor").classList.contains("grp-speaking"),"sin sprites => rostro normal");
  rotos.api.cerrar();
  console.log("PASS Giro labios: voz, frames, cierre, perfil y fallback sin PNG");
})().catch(e=>{console.error(e);process.exitCode=1;});
