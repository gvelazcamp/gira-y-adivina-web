/* Regresión de Celular/TV en Extensiones para Gonzalo y Vale únicamente.
   Ejecutar desde la raíz: node tests/extensiones-vale-tv.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const ext=fs.readFileSync(path.join(root,"extensiones.js"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
new Function(ext);new Function(sw);
assert(index.includes('extensiones.js?v=98'));
assert(sw.includes('"./extensiones.js?v=98"'));
assert(ext.includes('const selector=modoTVDisponible()?'),"selector protegido");
assert(ext.includes('if(!modoTVDisponible())return;'),"protección de selección");
assert(ext.includes('if(modoTVDisponible()&&modoTVElegido'),"protección al iniciar");
assert(ext.includes('boton.hidden=!modoTVDisponible()||vista==="lobby"'),"protección del botón interior");
const inicio=index.indexOf("function esGonzalo(){");
const fin=index.indexOf("function puedeVerSalaTV()",inicio);
const a=index.indexOf("const GyaTV=(()=>{");
const b=index.indexOf("window.GyaTV=GyaTV;",a)+"window.GyaTV=GyaTV;".length;
assert(inicio>=0&&fin>inicio&&a>=0&&b>a,"funciones originales presentes");
const definiciones=index.slice(inicio,fin)+index.slice(a,b);
async function probar(nombre,puedeExt,puedeRuleta){
  const botones={};
  const document={
    fullscreenElement:null,
    documentElement:{requestFullscreen:async()=>{document.fullscreenElement={};}},
    addEventListener(){},
    getElementById(id){return botones[id]||=({setAttribute(){},title:""});},
    exitFullscreen:async()=>{document.fullscreenElement=null;}
  };
  const screen={orientation:{lock:async()=>{},unlock(){}}};
  const window={};
  const contexto={
    document,screen,window,perfil:{nombre},
    matchMedia:()=>({matches:false}),
    sincronizarHorizontalRuletaPorGiro(){},
    mostrarToast(){}
  };
  vm.runInNewContext(definiciones,contexto);
  const tv=window.GyaTV;
  assert(tv);
  await tv.alternar("ext");
  assert.equal(tv.activo("ext"),puedeExt,nombre+" Extensiones TV");
  tv.soltar("ext");
  await tv.alternar("ruleta");
  assert.equal(tv.activo("ruleta"),puedeRuleta,nombre+" Ruleta TV");
  tv.soltar("ruleta");
}
(async()=>{
  await probar("Gonzalo",true,true);
  await probar("Vale",true,false);
  await probar("Romina",false,false);
  await probar("Andrés",false,false);
  console.log("PASS selector Celular/TV: Gonzalo y Vale; Ruleta exclusiva Gonzalo");
})().catch(e=>{console.error(e);process.exitCode=1;});
