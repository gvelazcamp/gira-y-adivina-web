/* Regresión de la presentación de Giro: solo Rosco/Gonzalo, sin música.
   Ejecutar desde la raíz: node tests/giro-rosco-piloto.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const src=fs.readFileSync(path.join(root,"giro-rosco-piloto.js"),"utf8");
const rosco=fs.readFileSync(path.join(root,"rosco-rioplatense.js"),"utf8");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
new Function(src);new Function(rosco);new Function(sw);
assert(index.includes('rosco-rioplatense.js?v=28'));
assert(sw.includes('"./giro-rosco-piloto.js?v=3"'));
assert(sw.includes('"./giro-rosco-piloto.css?v=2"'));
assert(rosco.includes('cargarEscenaGiroG(raiz);'));
assert(rosco.includes('window.GIRO_ROSCO_PILOTO!==false'));
assert(rosco.includes('window.GiroRoscoPiloto.mostrarFinal({aciertos,total:items.length,puntos})'));
for(const rel of [
  "estudios/Giro_estudio_rosco_16x9.png",
  "elementos/Giro_atril_oficial.png",
  "efectos/Giro_efecto_destellos_transparente.png",
  "efectos/Giro_efecto_confeti_transparente.png",
  "opcionales/espera/Giro_espera_neutral.png",
  "opcionales/espera/Giro_espera_respirando.png",
  "opcionales/espera/Giro_espera_escuchando.png",
  "opcionales/transiciones/Giro_transicion_saludando.png",
  "opcionales/transiciones/Giro_transicion_senalando.png",
  "opcionales/gestos/Giro_gesto_presenta_extension.png",
  "Giro_festejando.png","Giro_confundido.png"
])assert(fs.existsSync(path.join(root,"presentacion-y-locucion-extensiones/Giro",rel)),rel);
function el(tag){
  return {
    tag,children:[],dataset:{},attributes:{},
    classList:{add(){},remove(){},contains(){return false;}},
    append(...nodes){this.children.push(...nodes);},
    appendChild(node){this.children.push(node);return node;},
    setAttribute(k,v){this.attributes[k]=v;},
    addEventListener(){},
    remove(){this.removed=true;},
    focus(){},
    querySelectorAll(){return[];}
  };
}
function comprobar(nombre,permitido,flag){
  const body=el("body");
  const document={
    body,hidden:false,activeElement:el("button"),
    createElement:el,addEventListener(){},removeEventListener(){}
  };
  const window={};
  if(flag===false)window.GIRO_ROSCO_PILOTO=false;
  const contexto={
    window,document,SpeechSynthesisUtterance:function(){},
    esGonzalo:()=>permitido,
    matchMedia:()=>({matches:true}),
    requestAnimationFrame:cb=>cb(),
    setInterval:()=>1,clearInterval:()=>{}
  };
  vm.runInNewContext(src,contexto,{filename:"giro-rosco-piloto.js"});
  const api=window.GiroRoscoPiloto;
  assert(api,"Módulo expuesto");
  if(!permitido||flag===false){
    assert.equal(api.mostrarInicio(),false,nombre+" no puede abrir la escena");
    assert.equal(api.mostrarFinal({}),false,nombre+" no puede abrir el cierre");
    assert.equal(body.children.length,0);
    return;
  }
  assert.equal(api.mostrarInicio(),true);
  assert.equal(body.children.length,1);
  assert.equal(body.children[0].dataset.tipo,"inicio");
  api.cerrar();assert.equal(body.children[0].removed,true);
  assert.equal(api.mostrarFinal({aciertos:12,total:12,puntos:1200}),true);
  assert.equal(body.children[1].dataset.tipo,"final");
  api.cerrar();assert.equal(body.children[1].removed,true);
}
comprobar("Gonzalo",true,true);
comprobar("Otro perfil",false,true);
comprobar("Gonzalo con bandera apagada",true,false);
console.log("PASS: Giro Rosco sin música; Gonzalo, cierre, limpieza, flags y rutas");
