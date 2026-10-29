/* La reacción nunca deja visible el atril mientras espera la pose de Giro. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const src=fs.readFileSync(path.join(__dirname,"..","giro-rosco-piloto.js"),"utf8");
const rosco=fs.readFileSync(path.join(__dirname,"..","rosco-rioplatense.js"),"utf8");
const imagenes=new Map();
const rueda={isConnected:true,children:[],querySelector(selector){
  return selector===".grp-reac"?this.children.at(-1)||null:null;
},appendChild(el){this.children.push(el);el.parent=this;}};
function crear(tag){
  const el={tag,children:[],setAttribute(){},append(...nodes){this.children.push(...nodes);},
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}};
  if(tag==="img")Object.defineProperty(el,"src",{set(value){this.url=value;imagenes.set(value,this);},get(){return this.url;}});
  return el;
}
class AudioFalso{play(){return Promise.resolve();}pause(){}}
const window={};
const perfil={nombre:"Gonzalo"};
vm.runInNewContext(src,{window,perfil,document:{createElement:crear,querySelector:()=>rueda},
  Audio:AudioFalso,setTimeout:()=>1,clearTimeout(){}});
const api=window.GiroRoscoPiloto;
for(const nombre of ["Gonzalo","Vale","Grace"]){perfil.nombre=nombre;assert.equal(api.habilitado(),true,nombre);}
perfil.nombre="Otro";assert.equal(api.habilitado(),false);
assert(rosco.includes("pruebaG=perfilGiro()"),"los tres perfiles deben activar el show en el Rosco");
perfil.nombre="Gonzalo";
const cargar=(fragmento,evento="onload")=>{
  const img=[...imagenes.values()].find(im=>im.url.includes(fragmento));
  assert(img,`Falta ${fragmento}`);img[evento]();
};
const esperar=()=>new Promise(resolve=>setImmediate(resolve));

(async()=>{
  api.reaccion("acierto");
  assert.equal(rueda.children.length,0,"no mostrar el atril antes de cargar Giro");
  cargar("Giro_atril_oficial_chico.webp");
  await esperar();
  assert.equal(rueda.children.length,0,"el atril solo debe seguir oculto");
  cargar("Giro_festejando.png");
  await esperar();
  assert.equal(rueda.children.length,1);
  assert.deepEqual(rueda.children[0].children.map(im=>im.className),["grp-reac-giro","grp-reac-atril"]);

  api.reaccion("error");
  assert.equal(rueda.children.length,0,"la reacción anterior se retira");
  cargar("Giro_confundido.png","onerror");
  await esperar();
  assert.equal(rueda.children.length,0,"si Giro falla, tampoco aparece el atril");
  console.log("PASS: Vale, Grace y Gonzalo habilitados; Giro y atril juntos, sin atril vacío");
})().catch(error=>{console.error(error);process.exitCode=1;});
