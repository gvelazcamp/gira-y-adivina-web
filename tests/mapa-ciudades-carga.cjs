/* Regresión de carga de ciudades de "Jugar ahora".
   node tests/mapa-ciudades-carga.cjs */
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const base=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(base,"index.html"),"utf8");
const sw=fs.readFileSync(path.join(base,"sw.js"),"utf8");
const inicio=html.indexOf("function verMundo(){");
const fin=html.indexOf('/* ---- Expansión Uruguay',inicio);
assert(inicio>=0&&fin>inicio,"Encontrar el cargador del mapa");
const mapa=html.slice(inicio,fin);
assert(mapa.includes('Math.abs(i-actInicial)<=1'),"Cargar inmediatamente la ciudad actual y las vecinas");
assert(mapa.includes('r.dataset.fondo=fondoCiudad(d)'),"Conservar la ruta real del fondo");
assert(!mapa.includes('if(d.bg)r.style.backgroundImage="url('),"No iniciar todos los fondos al entrar");
assert(mapa.includes('v.dataset.poster=fondoCiudad(d)'),"Diferir los poster de video");
assert(mapa.includes('if(!v.poster)v.poster=v.dataset.poster'),"Asignar el poster al acercarse");
assert(mapa.includes('mapaDibujosListos.length=0'),"Limitar predecodificación al mapa actual");
assert((mapa.match(/precargarVideosMapa\(\)/g)||[]).length===1,"No ejecutar la descarga masiva de videos");
assert(sw.includes('const CACHE_ASSETS = "gya-assets-v1"'),"Preservar las imágenes ya guardadas");
assert(sw.includes('const CACHE_NAME = "gya-cache-v522"'),"Actualización disponible en PWA");
const open=mapa.indexOf('if("IntersectionObserver" in window){');
const close=mapa.indexOf("  /* Los videos de fondo de cada región",open);
assert(open>=0&&close>open,"Observador de imágenes cerca del área visible");
const code=mapa.slice(open,close);
let obs;
class FakeObserver{
 constructor(cb,options){this.cb=cb;this.options=options;this.stopped=0;obs=this;}
 observe(node){this.node=node;}
 unobserve(node){this.stopped++;assert.equal(node,this.node);}
 disconnect(){}
}
const region={dataset:{fondo:"assets/worlds/prueba.webp"},style:{backgroundImage:""}};
const m={querySelectorAll:()=>[region]};
new Function("window","m","mapaImagenObs","IntersectionObserver",
  code+"\nreturn mapaImagenObs")({IntersectionObserver:FakeObserver},m,null,FakeObserver);
assert.equal(region.style.backgroundImage,"","No descargar una ciudad alejada");
obs.cb([{target:region,isIntersecting:false}]);
assert.equal(region.style.backgroundImage,"","Mantener alejada sin descarga");
obs.cb([{target:region,isIntersecting:true}]);
assert.equal(region.style.backgroundImage,"url('assets/worlds/prueba.webp')","Cargar antes de llegar");
assert.equal(obs.stopped,1,"No repetir la carga de la ciudad");
const defs=html.slice(html.indexOf("const MUNDO_URUGUAY=["),html.indexOf("let mapaPaisForzado="));
const ciudades=[...defs.matchAll(/\{id:"([^"]+)"[^{}\n]*?bg:"([^"]+)"(?:,video:"([^"]+)")?/g)];
assert(ciudades.length>=40,"Mantener Uruguay y Argentina");
for(const match of ciudades){
 const files=[match[2],match[3],match[3]?.replace(/-loop\.mp4$/,"-loop-poster.webp")].filter(Boolean);
 for(const asset of files)assert(fs.existsSync(path.join(base,asset)),match[1]+": falta "+asset);
}
console.log("PASS mapa: "+ciudades.length+" ciudades, fondos diferidos, videos bajo demanda, caché conservada");
