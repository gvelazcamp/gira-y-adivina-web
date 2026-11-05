/* Auditoría de palabras y pistas entre extensiones.
   Uso:  node tests/auditar-palabras.cjs        (muestra el informe)
         node tests/auditar-palabras.cjs --md   (además escribe AUDITORIA_PALABRAS.md)
   Correrlo SIEMPRE después de agregar palabras. Sale con código 1 si hay errores.

   Reglas (errores):
   1. Una respuesta no puede estar en dos juegos de respuesta única:
      Ahora Caigo, Palabras Cruzadas, Ahorcado, Contra Reloj, Impostor, Mímica, Quién soy, Rosco, Silabario, Sopa Fugaz.
   2. Una pista/definición/pregunta/frase no puede repetirse entre juegos
      (incluye 100 Rioplatenses y Frases en Giro).
   3. Dentro de un juego de respuesta única no se repite una respuesta,
      ni entre niveles ni entre categorías.

   Avisos (no bloquean, por cómo son esos juegos):
   - 100 Rioplatenses: las respuestas son "lo que diría la gente" (Yerba,
     Termo, Agua…); si se sacan, la encuesta deja de tener sentido.
   - Canta la Canción: palabras comunes que tienen que aparecer en una canción.
   - Palabra Secreta y Rueda de Letras: usan diccionario de palabras
     comunes (5 letras / anagramas), es normal que compartan. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const ctx={};ctx.window=ctx;vm.createContext(ctx);
for(const f of["numero-voz-datos.js","gira-encaja-preguntas.js","palabras-cruzadas-datos.js","ahora-caigo-datos.js","ahorcado-rioplatense-datos.js","canta-la-cancion-datos.js","cien-rioplatenses-datos.js","contra-reloj-rioplatense-datos.js","frases-en-giro-datos.js","impostor-datos.js","mimica-datos.js","palabra-secreta-datos.js","quien-soy-datos.js","rosco-rioplatense-datos.js","rueda-de-letras-datos.js","silabario-rioplatense-datos.js","sopa-fugaz-datos.js"])
  vm.runInContext(fs.readFileSync(path.join(root,f),"utf8").replace(/^(const|let) /gm,"var "),ctx);

const norm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/[^A-Z0-9Ñ]+/g," ").trim();
const junto=s=>norm(s).replace(/ /g,"");
const unicas={},avisos={},pistas={};
const add=(obj,juego,item)=>{(obj[juego]=obj[juego]||[]).push(item);};

ctx.PALABRAS_CRUZADAS_DATOS.forEach(d=>d.palabras.forEach(p=>{add(unicas,"Palabras Cruzadas",{r:p.respuesta,nivel:1,donde:d.id});add(pistas,"Palabras Cruzadas",{p:p.pista,donde:d.id+" "+p.respuesta});}));
ctx.AHORA_CAIGO_DATOS.forEach(d=>{add(unicas,"Ahora Caigo",{r:d.respuesta,nivel:1,donde:d.id});add(pistas,"Ahora Caigo",{p:d.pregunta,donde:d.id});});
ctx.AHORCADO_DATOS.forEach(d=>add(unicas,"Ahorcado",{r:d.palabra,nivel:1,donde:d.categoria}));
ctx.CONTRA_RELOJ_TARJETAS.forEach((t,i)=>t.forEach(w=>add(unicas,"Contra Reloj",{r:w,nivel:1,donde:"tarjeta "+(i+1)})));
ctx.MIMICA_FRASES.concat(ctx.MIMICA_MEDIA||[],ctx.MIMICA_DIFICIL||[]).forEach(w=>add(unicas,"Mímica",{r:w,nivel:1,donde:"frase"}));
ctx.IMPOSTOR_CATEGORIAS.forEach(c=>c.palabras.forEach(w=>add(unicas,"Impostor",{r:w,nivel:1,donde:c.nombre})));
ctx.QUIEN_SOY_CATEGORIAS.forEach(c=>c.palabras.forEach(w=>add(unicas,"Quién soy",{r:w,nivel:1,donde:c.nombre})));
ctx.ROSCO_DATOS.forEach(d=>{add(unicas,"Rosco",{r:d.palabra,nivel:d.nivel,donde:"letra "+d.letra+" nivel "+d.nivel});add(pistas,"Rosco",{p:d.definicion,donde:d.palabra});});
ctx.SILABARIO_DATOS.forEach(d=>{add(unicas,"Silabario",{r:d.respuesta,nivel:d.nivel,donde:d.categoria+" nivel "+d.nivel});add(pistas,"Silabario",{p:d.pista,donde:d.respuesta});});
[["inicial",ctx.SOPA_DATOS.inicial],...ctx.SOPA_DATOS.categorias.map(c=>[c.nombre,c])].forEach(([n,c])=>c.palabras.forEach(w=>add(unicas,"Sopa Fugaz",{r:w,nivel:1,donde:n})));
ctx.NUMERO_VOZ_DATOS.forEach(q=>add(pistas,"Qué número soy (voz)",{p:q.pregunta,donde:q.id}));
ctx.GIRA_ENCAJA_PREGUNTAS.forEach(q=>add(pistas,"Girá y encajá (preguntas)",{p:q.pregunta,donde:q.id}));
ctx.CIEN_PREGUNTAS.forEach(q=>{add(pistas,"100 Rioplatenses",{p:q.pregunta,donde:q.id});q.respuestas.forEach(a=>add(avisos,"100 Rioplatenses",{r:a.texto}));});
ctx.FRASES_EN_GIRO_DATOS.forEach(d=>{add(pistas,"Frases en Giro",{p:d.texto,donde:"nivel "+d.nivel});add(pistas,"Frases en Giro (pista)",{p:d.pista,donde:"nivel "+d.nivel});});
ctx.CANTA_PALABRAS.forEach(w=>add(avisos,"Canta la Canción",{r:w}));
ctx.PALABRA_SECRETAS.forEach(w=>add(avisos,"Palabra Secreta",{r:w}));
ctx.RUEDA_DATOS.forEach(d=>d.palabras.forEach(w=>add(avisos,"Rueda de Letras",{r:w})));

let errores=0;const out=[];
const titulo=t=>out.push("\n## "+t+"\n");

titulo("1. Respuestas repetidas entre juegos");
const mapa=new Map();
for(const[j,lista]of Object.entries(unicas))for(const x of lista){const k=junto(x.r);if(!mapa.has(k))mapa.set(k,new Map());const m=mapa.get(k);if(!m.has(j))m.set(j,[]);m.get(j).push(x);}
const cruzadas=[...mapa].filter(([,m])=>m.size>1).sort((a,b)=>a[0].localeCompare(b[0]));
if(!cruzadas.length)out.push("Sin repeticiones. ✅");
for(const[k,m]of cruzadas){errores++;out.push("- **"+k+"** → "+[...m].map(([j,l])=>j+" ("+l.map(x=>x.donde).join(", ")+")").join(" · "));}

titulo("2. Pistas, preguntas o frases repetidas");
const mp=new Map();
for(const[j,lista]of Object.entries(pistas))for(const x of lista){const k=norm(x.p);if(!mp.has(k))mp.set(k,[]);mp.get(k).push({j,...x});}
const pc=[...mp].filter(([,l])=>l.length>1);
if(!pc.length)out.push("Sin repeticiones. ✅");
for(const[,l]of pc){errores++;out.push("- \""+l[0].p+"\" → "+l.map(x=>x.j+" ("+x.donde+")").join(" · "));}

titulo("3. Repetidas dentro del mismo juego (niveles / categorías)");
let hubo=false;
for(const[j,lista]of Object.entries(unicas)){
  const m=new Map();for(const x of lista){const k=junto(x.r);if(!m.has(k))m.set(k,[]);m.get(k).push(x);}
  for(const[k,l]of m)if(l.length>1){hubo=true;errores++;out.push("- "+j+": **"+k+"** ×"+l.length+" → "+l.map(x=>x.donde).join(", "));}
}
if(!hubo)out.push("Sin repeticiones. ✅");

titulo("Avisos (no bloquean)");
for(const[j,lista]of Object.entries(avisos)){
  const s=[...new Set(lista.map(x=>junto(x.r)))].filter(k=>mapa.has(k)).sort();
  out.push("- "+j+" comparte "+s.length+" con juegos de respuesta única"+(s.length?": "+s.map(k=>k+" ["+[...mapa.get(k).keys()].join("/")+"]").join(", "):" ✅"));
}

const resumen="# Auditoría de palabras entre extensiones\n\nErrores: **"+errores+"**"+(errores?" ❌":" ✅")+"\n";
console.log(resumen+out.join("\n"));
if(process.argv.includes("--md"))fs.writeFileSync(path.join(root,"AUDITORIA_PALABRAS.md"),resumen+"\nGenerado con `node tests/auditar-palabras.cjs --md`. Reglas al principio de ese archivo.\n"+out.join("\n")+"\n");
process.exitCode=errores?1:0;
