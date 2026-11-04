/* Prueba optativa contra el servidor real: crea una sala propia de diagnóstico
   y la deja cerrada al terminar. GYA_TEST_SALA_REAL=1 node tests/palabra-secreta-sala-real.cjs
   TEST_HTTP_PROXY permite usar el proxy del entorno sin cambiar la aplicación. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
if(process.env.GYA_TEST_SALA_REAL!=='1'){console.log('SKIP: requiere GYA_TEST_SALA_REAL=1 (usa el servidor real).');process.exit(0);}
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const url=source.match(/const SUPA_URL="([^"]+)"/)[1],key=source.match(/const SUPA_KEY="([^"]+)"/)[1];
const fixture=`<!doctype html><html><head><meta charset="utf-8"></head><body><div id="extContenido"></div>
<script src="lib/supabase.min.js"></script><script>
const perfil={nombre:'Diagnóstico de sala',avatar:'avatar-02'};
const sb=supabase.createClient(${JSON.stringify(url)},${JSON.stringify(key)});function obtenerSupa(){return sb;}
window.__sb=sb;window.Fichas={usar:()=>true};window.Extensiones={abrirJuego:()=>PalabraSecreta.abrir(document.querySelector('#extContenido')),abrirLobby:()=>PalabraSecreta.salir()};
</script><script src="palabra-secreta-sala.js"></script><script src="duelo-extensiones.js"></script>
<script src="palabra-secreta-datos.js"></script><script src="palabra-secreta.js"></script><script>
MultiBroker.conectar=(_ok,fail,assign)=>{assign({connected:false,subscribe(){},unsubscribe(){},on(){},publish(){},end(){}});fail();};
</script></body></html>`;
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 if(pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(fixture);}
 const file=path.join(root,pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const proxy=process.env.TEST_HTTP_PROXY?{server:process.env.TEST_HTTP_PROXY,bypass:'127.0.0.1,localhost'}:undefined;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium',proxy});
 const pages=[],errors=[];let codigo=null,sockets=0;
 try{
  const seed=(objetivo,nivel,max)=>({nivel,partidaNivel:{objetivo,nivel,max,repeticiones:0,intentos:[],terminada:false,gano:false,cobrada:true},ganadas:5,jugadas:7,ayudaVista:true});
  for(const saved of [seed('ASADO',2,5),seed('YERBA',4,3)]){
   if(saved.nivel===2)saved.partidaNivel.intentos=[{palabra:'TERMO',colores:['ausente','ausente','ausente','ausente','exacta']}];
   const ctx=await browser.newContext({locale:'es-UY',reducedMotion:'reduce'}),page=await ctx.newPage();pages.push(page);
   page.on('pageerror',e=>errors.push(e.message));page.on('websocket',()=>sockets++);
   await ctx.addInitScript(d=>localStorage.setItem('gya_palabra_secreta',JSON.stringify(d)),saved);
  }
  const [host,guest]=pages;
  await host.goto(base);await host.evaluate(()=>PalabraSecreta.abrir(document.querySelector('#extContenido')));
  await host.locator('#psAyudaPanel .sf-principal').click();await host.evaluate(()=>PalabraSecreta.tecla('A'));
  await host.locator('#psColaborativo').click();await host.locator('#dlCrear').click();
  await host.waitForFunction(()=>document.querySelector('#dlEstado').textContent.includes('Sala lista'),{},{timeout:30000});
  codigo=await host.locator('#dlCodigo').textContent();
  await guest.goto(base+'/?duelo=palabra-colaborativa&sala='+codigo);await guest.evaluate(()=>Duelo.abrirInvitacion());
  await guest.waitForFunction(()=>document.querySelector('#psEquipoEstado')?.textContent.includes('tiene el teclado'),{},{timeout:30000});
  assert.equal(await guest.locator('#psTablero').textContent(),await host.locator('#psTablero').textContent());
  assert.equal(await guest.locator('#psTablero .ps-fila').count(),5);
  await guest.locator('#psTomarTeclado').click();
  await guest.waitForFunction(()=>document.querySelector('#psEquipoEstado').textContent.includes('Vos tenés'));
  await guest.evaluate(()=>{for(const l of 'SADO')PalabraSecreta.tecla(l);PalabraSecreta.tecla('Enter');});
  await Promise.all(pages.map(p=>p.waitForFunction(()=>document.querySelector('#psFinal').textContent.includes('entre los dos'),{},{timeout:30000})));
  assert.equal(await host.evaluate(()=>JSON.parse(localStorage.getItem('gya_palabra_secreta')).nivel),3);
  assert.equal(await guest.evaluate(()=>JSON.parse(localStorage.getItem('gya_palabra_secreta')).partidaNivel.objetivo),'YERBA');
  assert.equal(sockets,0,'la prueba no debe usar WebSocket');assert.deepEqual(errors,[]);
  await Promise.all(pages.map(p=>p.evaluate(()=>PalabraSecreta.salir())));
  await host.waitForFunction(async c=>{
   const r=await __sb.from('gya_ranking').select('estado_juego').eq('grupo','palabra_sala').in('apodo',[c+'-host',c+'-guest']);
   return !r.error&&r.data.length===2&&r.data.every(x=>x.estado_juego.cerrada);
  },codigo,{timeout:15000,polling:1000});
  console.log('PASS REAL: dos jugadores se unen, comparten el tablero empezado, toman el teclado, resuelven, conservan el guardado individual y cierran su sala en el servidor, sin WebSocket ni MQTT.');
 }finally{
  for(const p of pages)try{await p.evaluate(()=>window.PalabraSecreta?.salir());}catch(e){}
  await browser.close();server.close();
 }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
