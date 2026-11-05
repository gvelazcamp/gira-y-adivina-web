const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function environment(){
  let now=0,id=0;const timers=new Map(),spoken=[],sounds=[],seen=new Set(),listeners=new Map();
  const c={console,performance:{now:()=>now},setTimeout(fn,ms){timers.set(++id,{fn,at:now+ms});return id;},clearTimeout(k){timers.delete(k);},document:{hidden:false,addEventListener(k,fn){listeners.set(k,fn);},removeEventListener(k){listeners.delete(k);}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},speechSynthesis:{speak(u){spoken.push(u);},cancel(){}},sonidoPermitido:()=>true,Vistas:{filtrar(_,a,key){const free=a.filter(q=>!seen.has(key(q)));if(free.length)return free;seen.clear();return a;},marcar(_,key){seen.add(key);}}};c.window=c;vm.createContext(c);
  for(const f of ['numero-voz-datos.js','numero-voz.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
  const T={mando:'g',jug:[{pid:'g',n:'Gonzalo'},{pid:'v',n:'Vale'}]};let updates=0,podium;
  const engine=c.NumeroVoz.crearTele(T,()=>updates++,{SND:new Proxy({},{get:(_,k)=>()=>sounds.push(k)}),podioTele:p=>podium=p});
  function advance(ms){const target=now+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=target;engine.tic(ms);}
  const act=(a,extra={},pid='g')=>engine.accion({a,pid,token:engine.cel().token,...extra});
  const endVoice=()=>spoken.at(-1).onend?.();
  const answer=()=>c.NUMERO_VOZ_DATOS.find(q=>q.pregunta===engine.cel().pregunta).respuesta;
  return{c,T,engine,act,advance,spoken,sounds,endVoice,answer,listeners,get podium(){return podium;}};
}
{
  const {c,engine}=environment(),parse=c.NumeroVoz.numero;
  for(const [text,n] of [['1939',1939],['mil novecientos treinta y nueve',1939],['En el año mil novecientos treinta y nueve',1939],['1.939',1939],['1,939',1939],['1939.',1939],['Creo que es veintiún',21],['dos mil veintiséis',2026],['diez mil ochenta',10080],['cero',0],['cien',100],['ciento uno',101],['quinientos',500],['setecientos',700],['novecientos noventa y nueve',999]])assert.equal(parse(text),n,text);
  for(const text of ['no es 1939','1938 o 1939','hola','treinta dos','mil mil','1.23','dos gatos','más o menos cien'])assert.equal(parse(text),null,text);
  assert(c.NUMERO_VOZ_DATOS.length>=50);assert.equal(new Set(c.NUMERO_VOZ_DATOS.map(q=>q.id)).size,c.NUMERO_VOZ_DATOS.length);for(const q of c.NUMERO_VOZ_DATOS)assert(Number.isInteger(q.respuesta));engine.fin();
}
{
  const e=environment(),{engine,act,advance,endVoice,spoken}=e;
  act('nv_config',{nombres:['Gonzalo','Vale']},'v');assert.equal(engine.cel().fase,'config');
  act('nv_config',{nombres:['Gonzalo','Vale']});assert.equal(engine.cel().fase,'ready');
  act('nv_empezar');advance(350);assert.match(spoken[0].text,/Segunda Guerra/);assert(!spoken[0].text.includes('1939'));
  const tv={};engine.pintar(tv);assert(tv.innerHTML.includes('1939'));assert(!tv.innerHTML.includes(engine.cel().pregunta),'question is audio-only');assert(!tv.innerHTML.includes('nv-question'));assert(!tv.innerHTML.includes('nv-clock'));assert(!JSON.stringify(engine.cel()).includes('1939'),'answer stays off all controller payloads');
  advance(1500);assert.equal(engine.cel().resta,30,'first reading does not steal the turn');endVoice();assert.equal(engine.cel().fase,'arming');act('nv_listo');
  act('nv_resp',{alts:['mil novecientos treinta y ocho']});assert.equal(engine.cel().jug[0].pts,0);assert.equal(engine.cel().fase,'playing');assert(e.sounds.includes('mal'),'wrong spoken answers have error feedback');
  act('nv_resp',{alts:['1939']},'v');assert.equal(engine.cel().jug[0].pts,0,'other player cannot answer');
  const old=engine.cel().token;act('nv_resp',{alts:['mil novecientos treinta y nueve']});assert.equal(engine.cel().jug[0].pts,1);
  act('nv_resp',{alts:['1939'],token:old});assert.equal(engine.cel().jug[0].pts,1,'duplicates rejected');
  advance(2000);assert.equal(engine.cel().resta,28,'next question does not reset the clock');endVoice();
  act('nv_paso');advance(400);endVoice();assert.equal(engine.cel().jug[0].pts,1,'pass adds no points');act('nv_ok',{},'v');assert.equal(engine.cel().jug[0].pts,2,'spectator correction');
  advance(400);const late=spoken.at(-1).onend;advance(27601);assert.equal(engine.cel().fase,'turnEnd');late?.();assert.equal(engine.cel().fase,'turnEnd','late speech callback cannot restart turn');
  act('nv_resp',{alts:['1939']});assert.equal(engine.cel().jug[0].pts,2,'deadline is authoritative');
  act('nv_siguiente');assert.equal(engine.cel().quien,'Vale');assert.equal(engine.cel().resta,30);act('nv_empezar',{},'v');advance(400);endVoice();act('nv_listo',{},'v');
  act('nv_resp',{alts:[String(e.answer())]},'v');assert.equal(engine.cel().jug[1].pts,1);advance(30001);assert.equal(engine.cel().fase,'turnEnd');act('nv_siguiente');assert.equal(engine.cel().fase,'final');assert.equal(e.podium.filas[0].n,'Gonzalo');
  engine.fin();assert.equal(e.listeners.size,0);
}
{
  const e=environment(),{engine,act,advance,endVoice}=e;act('nv_config',{nombres:['Gonzalo']});act('nv_empezar',{manual:true});advance(400);endVoice();advance(5000);assert.equal(engine.cel().resta,25);
  act('nv_pausa');advance(60000);assert.equal(engine.cel().resta,25,'pause preserves remaining time');act('nv_reanudar',{manual:true});advance(400);endVoice();advance(24601);assert.equal(engine.cel().fase,'turnEnd');engine.fin();
}
console.log('PASS number voice core: Spanish integers, no answer leakage, voice text, 30-second turn, score/pass/correction, stale/late messages, two-player ranking, pause and cleanup');
