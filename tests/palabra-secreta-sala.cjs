const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../palabra-secreta-sala.js'),'utf8');
const rows=new Map(),clients=[];
const clone=x=>JSON.parse(JSON.stringify(x));
const storage={failSave:false,gate:null,writeWaiting:false};
function api(){return{from(){return{
 select(){const filters={};return{eq(k,v){filters[k]=v;return this;},async limit(){const row=rows.get(filters.apodo);return{data:row?[clone(row)]:[]};}};},
 async upsert(row){if(storage.gate){storage.writeWaiting=true;await storage.gate;}if(storage.failSave)return{error:{message:'fallo simulado'}};rows.set(row.apodo,clone(row));return{};}
};}};}
function runtime(){const c={crypto,document:{hidden:false},setTimeout,clearTimeout,setInterval,clearInterval,obtenerSupa:api,MultiBroker:{conectar(_ok,fail,assign){assign({connected:false,subscribe(){},unsubscribe(){},on(){},end(){}});fail();}}};c.window=c;vm.runInNewContext(source,c);return c;}
async function until(f){const start=Date.now();while(!f()){if(Date.now()-start>5000)throw new Error('timeout');await new Promise(r=>setTimeout(r,10));}}
function connect(rt,code,host){let client;const promise=new Promise((resolve,reject)=>{rt.SalaPalabra.conectar(code,host,()=>resolve(client),()=>reject(new Error(rt.gyaFalloConexion)),w=>{client=w;clients.push(w);});});return{promise,get client(){return client;}};}
(async()=>{
 try{
  const a=runtime(),b=runtime();
  const host=await connect(a,'Q7J5',true).promise;
  assert(rows.has('Q7J5-host'),'ready requires a saved server record');
  const guest=await connect(b,'Q7J5',false).promise;
  const receivedA=[],receivedB=[];
  const topic=l=>'gyaduelo/palabra-colaborativa/Q7J5/'+l;
  host.subscribe(topic('guest'));host.on('message',(_t,m)=>receivedA.push(JSON.parse(m)));
  guest.subscribe(topic('host'));guest.on('message',(_t,m)=>receivedB.push(JSON.parse(m)));
  host.publish(topic('host'),JSON.stringify({tipo:'ronda',datos:{respuesta:'ASADO',revision:1}}));
  guest.publish(topic('guest'),JSON.stringify({tipo:'progreso',datos:{seq:1,texto:'ASADO'}}));
  await until(()=>receivedA.length===1&&receivedB.length===1);
  assert.equal(receivedA[0].datos.texto,'ASADO');assert.equal(receivedB[0].datos.respuesta,'ASADO');
  await assert.rejects(connect(runtime(),'Q7J5',true).promise,/ya abrió/);
  await assert.rejects(connect(runtime(),'B9K4',false).promise,/no está en la sala/);
  storage.failSave=true;
  await assert.rejects(connect(runtime(),'K4T7',true).promise,/guardar/);
  assert(!rows.has('K4T7-host'),'a failed save must not announce a room');
  storage.failSave=false;
  // Terminar durante una creación pendiente también deja la sala cerrada.
  let release;storage.gate=new Promise(r=>release=r);
  const pending=connect(runtime(),'M8Z3',true);await until(()=>storage.writeWaiting);pending.client.end();release();storage.gate=null;
  await until(()=>rows.get('M8Z3-host')?.estado_juego.cerrada);
  host.publish(topic('host'),JSON.stringify({tipo:'chau'}));host.end();guest.end();
  await until(()=>rows.get('Q7J5-host')?.estado_juego.cerrada&&rows.get('Q7J5-guest')?.estado_juego.cerrada);
  await assert.rejects(connect(runtime(),'Q7J5',false).promise,/no está en la sala/);
  // Sala fija: cerrada o abandonada, el mismo código se vuelve a abrir (con la partida de quien entra).
  assert.equal(await runtime().SalaPalabra.hostActivo('Q7J5'),false);
  const again=await connect(runtime(),'Q7J5',true).promise;
  assert.equal(await runtime().SalaPalabra.hostActivo('Q7J5'),true);
  const g2=await connect(runtime(),'Q7J5',false).promise;g2.end();again.end();
  await until(()=>rows.get('Q7J5-host')?.estado_juego.cerrada);
  const viejo=rows.get('Q7J5-host');viejo.estado_juego.cerrada=false;viejo.estado_juego.actualizado=Date.now()-60000;
  assert.equal(await runtime().SalaPalabra.hostActivo('Q7J5'),false);
  const tercera=await connect(runtime(),'Q7J5',true).promise;tercera.end();
  console.log('PASS: sala persistida antes de ready, mensajes bidireccionales sin conexión en vivo, código ocupado/inexistente, fallo de guardado, cancelación y cierre persistido.');
 }finally{for(const c of clients)c.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
