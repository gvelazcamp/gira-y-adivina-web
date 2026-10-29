/* Regresión del ganador: el reloj finaliza el duelo, pero NO decide el ganador.
   Ejecutar: node tests/duelo-conocimiento-ganador.cjs */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'duelo-conocimiento.html'),'utf8');
const modos=fs.readFileSync(path.join(root,'duelo-conocimiento-modos.js'),'utf8');
const from=html.indexOf('function decidirResultadoDuelo(){');
const to=html.indexOf('function resetToConfig(){',from);
assert(from>=0&&to>from,'Localizar la lógica real del ganador');
const segment=html.slice(from,to);
assert(modos.includes('winner:resultado.winner'),'Online envía el ganador calculado');
assert(html.includes("p.errors=(p.errors||0)+1"),'Paso suma error');
function probar(a,b,esperado,motivo){
 const nodes=new Map();
 const $=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',disabled:false,classList:{add(){},remove(){}}});return nodes.get(id)};
 const context={
   players:[{name:'Gonzalo',...a},{name:'Sofía',...b}],
   phase:'playing',questionGeneration:0,question:{},transitionTimeout:0,rouletteTimer:0,
   $,upper:s=>s.toUpperCase(),fmt:ms=>(ms/1000).toFixed(1)+' s',
   pauseClock(){},stopVoice(){},updatePlayers(){},renderReview(){},clearTimeout(){},playTone(){},setTimeout(){}
 };
 vm.runInNewContext(segment,context);
 const outcome=vm.runInNewContext('decidirResultadoDuelo()',context);
 assert.equal(outcome.winner,esperado,motivo);
 vm.runInNewContext("finish(0,'Sofía se quedó sin tiempo')",context);
 const shown=$('winner-name').textContent;
 assert.equal(shown,esperado===null?'EMPATE':context.players[esperado].name.toUpperCase(),motivo+' (pantalla)');
 assert.match($('win-reason').textContent,esperado===null?/Empate/:new RegExp(context.players[esperado].name+' ganó'),motivo+' (motivo)');
 assert.equal(context.phase,'finished',motivo+' (finalización)');
}
probar({score:7,errors:5,ms:6900},{score:11,errors:0,ms:0},1,'Captura: Sofía ganó aunque agotó tiempo');
probar({score:12,errors:2,ms:0},{score:8,errors:0,ms:5300},0,'Mayor número de aciertos tiene prioridad');
probar({score:6,errors:5,ms:6900},{score:6,errors:1,ms:0},1,'En empate de aciertos mandan los errores');
probar({score:0,errors:6,ms:6900},{score:0,errors:0,ms:0},1,'Pasar sin acertar no da victoria');
probar({score:5,errors:1,ms:6900},{score:5,errors:1,ms:0},0,'Tiempo restante solo desempata');
probar({score:5,errors:1,ms:0},{score:5,errors:1,ms:0},null,'Empate real');
console.log('PASS: ganador por aciertos, errores y tiempo; PASO penaliza y no decide ganar por agotar reloj');
