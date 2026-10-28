/* Giro — etapa 3: planos cinematográficos solo para Gonzalo.
   Ejecutar desde la raíz: node tests/giro-rosco-cine.cjs */
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
assert(!/grp-labios|bocas-v2|fonemaAIndice|iniciarLabios/.test(src+css),"sin boca");
assert(!src.includes("new Audio("),"sin música");
assert(!src.includes("grp-atril"),"sin atril adicional");
assert(src.includes('const ESCENA=BASE+"estudios/Giro_estudio_rosco_16x9.png"'),"estudio original");
assert(css.includes(".grp-cine-plano")&&css.includes("@keyframes grp-salida"),"transiciones CSS");
assert(index.includes("extensiones.js?v=88"),"selector Vale conservado");
assert(index.includes("puedeModoTVExtensiones()"),"selector Vale autorizado");
assert(rosco.includes("window.GiroRoscoPiloto.mostrarInicio()"),"acceso original");
assert(rosco.includes("window.GiroRoscoPiloto.mostrarFinal({aciertos,total:items.length,puntos})"),"resultados originales");
for(const p of ["Giro_presentacion_plano_general_16x9.png",
                "Giro_presentacion_plano_medio_16x9.png",
                "Giro_presentacion_primer_plano_16x9.png"]){
  assert(src.includes(p),"referencia de plano "+p);
  assert(fs.existsSync(path.join(root,"presentacion-y-locucion-extensiones/Giro/escenas",p)),
    "archivo aprobado: "+p);
}
function nodo(tag){
  const clases=new Set(),eventos={};
  return{tag,children:[],className:"",dataset:{},attributes:{},isConnected:true,
    classList:{add:c=>clases.add(c),remove:c=>clases.delete(c),contains:c=>clases.has(c),
      toggle(c,forzar){const valor=forzar===undefined?!clases.has(c):!!forzar;
        if(valor)clases.add(c);else clases.delete(c);return valor;}},
    append(...xs){this.children.push(...xs);},appendChild(x){this.children.push(x);return x;},
    setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){eventos[k]=fn;},
    disparar(k){eventos[k]?.();},focus(){},remove(){this.removed=true;},
    querySelectorAll(){return[];},decode(){return Promise.resolve()}
  };
}
function encontrar(n,clase){
  if(n.className===clase)return n;
  for(const c of n.children||[]){const r=encontrar(c,clase);if(r)return r;}
  return null;
}
function entorno(gonzalo,reducido=false){
  const body=nodo("body"),intervalos=new Map(),demoras=new Map();let seq=0,voz=null;
  const document={body,hidden:false,activeElement:nodo("button"),createElement:nodo,
    addEventListener(){},removeEventListener(){}};
  const window={speechSynthesis:{cancel(){},getVoices(){return[{lang:"es-UY"}]},speak(u){voz=u;}}};
  vm.runInNewContext(src,{window,document,esGonzalo:()=>gonzalo,
    matchMedia:()=>({matches:reducido}),SpeechSynthesisUtterance:function(texto){this.text=texto;},
    setInterval:fn=>{const id=++seq;intervalos.set(id,fn);return id;},
    clearInterval:id=>intervalos.delete(id),
    setTimeout:fn=>{const id=++seq;demoras.set(id,fn);return id;},
    clearTimeout:id=>demoras.delete(id),requestAnimationFrame:fn=>fn()
  },{filename:"giro-rosco-piloto.js"});
  return{api:window.GiroRoscoPiloto,body,document,intervalos,demoras,voz:()=>voz,
    avanzarTiempo(){for(const fn of [...intervalos.values()])fn();},
    terminarSalida(){for(const fn of [...demoras.values()])fn();}};
}
(async()=>{
  const otro=entorno(false);
  assert.equal(otro.api.mostrarInicio(),false,"otro perfil no abre");
  assert.equal(otro.body.children.length,0);
  const g=entorno(true);
  assert.equal(g.api.mostrarInicio(),true);
  const capa=g.body.children[0],cine=encontrar(capa,"grp-cine"),
    escenario=encontrar(capa,"grp-escenario"),voz=encontrar(capa,"grp-boton grp-voz"),
    entrar=encontrar(capa,"grp-boton grp-accion");
  assert(cine&&escenario&&voz&&entrar);
  assert.equal(cine.children.length,3,"tres planos oficiales");
  assert(cine.children[0].classList.contains("grp-cine-visible"),"general inicial");
  assert(!encontrar(capa,"grp-atril"),"sin segundo atril");
  assert.equal(g.intervalos.size,1,"un solo ciclo");
  g.avanzarTiempo();
  assert(cine.children[1].classList.contains("grp-cine-visible"),"plano medio");
  g.avanzarTiempo();
  assert(cine.children[2].classList.contains("grp-cine-visible"),"primer plano");
  g.avanzarTiempo();
  assert(cine.classList.contains("grp-cine-fuera"),"regresa al estudio original");
  voz.disparar("click");
  assert(g.voz()?.text.includes("Rosco"),"voz sigue disponible");
  assert(cine.children[0].classList.contains("grp-cine-visible"),"repite planos con locución");
  assert.equal(g.intervalos.size,1,"sin duplicar intervalo");
  entrar.disparar("click");
  assert(capa.classList.contains("grp-saliendo"),"transición de salida");
  assert.equal(g.demoras.size,1,"solo una salida");
  g.terminarSalida();
  assert(capa.removed,"overlay retirado");
  assert.equal(g.intervalos.size,0,"intervalos limpiados");
  const reducido=entorno(true,true);
  assert.equal(reducido.api.mostrarInicio(),true);
  assert(encontrar(reducido.body,"grp-cine").classList.contains("grp-cine-fuera"),
    "movimiento reducido respeta preferencia");
  assert.equal(reducido.intervalos.size,0);
  reducido.api.cerrar();
  console.log("PASS: planos, voz, salida, timers, usuario Gonzalo y selector Vale");
})().catch(e=>{console.error(e);process.exitCode=1;});
