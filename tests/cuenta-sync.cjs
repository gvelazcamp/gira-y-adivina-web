const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=`<!doctype html><html><head><meta charset="utf-8"></head><body><div id="setup"><div class="setup-topbar"></div></div><section id="pantPerfil"><button id="perfilCerrar">Cerrar</button></section><div id="capaMas" class="ver"><button id="bCuenta"><span class="btn-txt">Guardar mi progreso</span></button></div><script>
const SUPA_URL='https://mock.supabase.co',SUPA_KEY='public-test-key';
function capturarEstadoJuego(){const d={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('gya_')||k.startsWith('larueda_'))d[k]=localStorage.getItem(k);}return{localStorage:d};}
function obtenerSupa(){return window.__client;}
</script><script src="cuenta.js"></script></body></html>`;
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://local').pathname;if(name==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}if(name==='/cuenta.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(root,'cuenta.js')));return;}res.writeHead(404);res.end();});
const mock=(seed,profile,extra={})=>({seed,profile,...extra});
async function device(browser,base,options){
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 await page.addInitScript(({seed,profile,raceData,failUpdate})=>{
   if(profile&&!localStorage.getItem('gya_nombre')){localStorage.setItem('gya_nombre',profile);localStorage.setItem('gya_avatar','avatar-01');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('larueda_mundo','["durazno"]');}
   window.__cloud=structuredClone(seed);let primeraLectura=true;window.__failUpdate=!!failUpdate;
   window.fetch=async()=>({ok:true,json:async()=>({external:{google:true}})});
   window.__client={auth:{getUser:async()=>({data:{user:{id:'same-google-user',email:'jugador@example.com'}}}),signInWithOAuth:async()=>({error:null}),signOut:async()=>({error:null})},from:()=>{
     let op='',payload=null,filters=[];
     const q={select(){return this;},eq(k,v){filters.push([k,v]);return this;},limit(){return Promise.resolve({data:[],error:null});},insert(v){op='insert';payload=v;return this;},update(v){op='update';payload=v;return this;},maybeSingle(){
       if(op==='update'){if(window.__failUpdate&&window.__cloud){window.__cloud.revision++;return Promise.resolve({data:null,error:null});}if(window.__cloud&&filters.every(([k,v])=>window.__cloud[k]===v)){window.__cloud={...window.__cloud,...payload};return Promise.resolve({data:{revision:window.__cloud.revision},error:null});}return Promise.resolve({data:null,error:null});}
       if(raceData&&primeraLectura){primeraLectura=false;return Promise.resolve({data:null,error:null});}
       return Promise.resolve({data:window.__cloud?{...window.__cloud}:null,error:null});
     },single(){if(op==='insert'&&raceData){window.__cloud=structuredClone(raceData);return Promise.resolve({data:null,error:{code:'23505',message:'duplicate key value violates unique constraint "gya_cuentas_pkey"'}});}
       if(op==='insert'&&!window.__cloud){window.__cloud={...payload};return Promise.resolve({data:{revision:1},error:null});}return Promise.resolve({data:null,error:{message:'duplicate'}});}};return q;
   }};
 },options);
 await page.goto(base);await page.waitForFunction(()=>typeof document.getElementById('bCuenta')?.onclick==='function'&&!!document.getElementById('cuentaCapa'));
 return{context,page};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
   const a=await device(browser,base,mock(null,'Meg'));
   await a.page.waitForFunction(()=>window.__cloud?.estado_juego?.localStorage?.gya_nombre==='Meg');
   assert.equal(await a.page.evaluate(()=>localStorage.getItem('gya_cuenta_usuario')),'same-google-user');
   assert.equal(await a.page.locator('#cuentaInicio,#cuentaPerfil').count(),0,'account shortcut removed from home/profile');
   assert.equal(await a.page.locator('#bCuenta .btn-txt').textContent(),'Partida vinculada','account status belongs to settings only');
   await a.page.evaluate(()=>localStorage.setItem('gya_logro_prueba','ganado'));
   await a.page.evaluate(()=>GyaCuenta.revisar());
   const cloud=await a.page.evaluate(()=>window.__cloud);assert.equal(cloud.revision,2);assert.equal(cloud.estado_juego.localStorage.gya_logro_prueba,'ganado');
   const b=await device(browser,base,mock(cloud,null));
   await b.page.waitForFunction(()=>localStorage.getItem('gya_nombre')==='Meg'&&localStorage.getItem('gya_logro_prueba')==='ganado');
   assert.equal(await b.page.evaluate(()=>localStorage.getItem('gya_cuenta_usuario')),'same-google-user');
   const c=await device(browser,base,mock(cloud,'Meg 2'));
   await c.page.waitForTimeout(400);
   assert(await c.page.locator('#cuentaCapa').isHidden(),'conflicts must not interrupt a game');
   await c.page.locator('#bCuenta').click();
   await c.page.locator('#cuentaCapa:not([hidden])').waitFor();
   assert.match(await c.page.locator('#cuentaTexto').textContent(),/Meg 2/);
   assert.match(await c.page.locator('#cuentaTexto').textContent(),/Meg/);
   assert.equal(await c.page.evaluate(()=>localStorage.getItem('gya_nombre')),'Meg 2','no automatic merge by similar name');
   await c.page.locator('#cuentaOpciones button').filter({hasText:'Decidir después'}).click();
   await c.page.waitForTimeout(3000);assert(await c.page.locator('#cuentaCapa').isHidden(),'deferring should not reopen the choice automatically');
   await c.page.locator('#bCuenta').click();await c.page.locator('#cuentaCapa:not([hidden])').waitFor();
   await c.page.locator('#cuentaOpciones button').filter({hasText:'Continuar la partida de mi cuenta'}).click();
   await c.page.waitForFunction(()=>localStorage.getItem('gya_nombre')==='Meg');
   assert(await c.page.evaluate(()=>!!localStorage.getItem('gya_cuenta_respaldo_local')),'keeps backup before replacing local progress');
   const d=await browser.newContext({serviceWorkers:'block'}),off=await d.newPage();
   await off.addInitScript(()=>{window.__googleEnabled=false;window.fetch=async()=>({ok:true,json:async()=>({external:{google:window.__googleEnabled}})});window.__client={auth:{getUser:async()=>({data:{user:null}})},from:()=>({select(){return this;},limit(){return Promise.resolve({data:[],error:null});}})};});
   await off.goto(base);await off.waitForFunction(()=>typeof document.getElementById('bCuenta')?.onclick==='function');
   assert.equal(await off.locator('#cuentaInicio,#cuentaPerfil').count(),0,'no account banner if Google is unavailable');
   await off.locator('#bCuenta').click();
   await off.locator('#cuentaCapa:not([hidden])').waitFor();
   assert.match(await off.locator('#cuentaTitulo').textContent(),/Inicio de sesión no disponible/);
   await off.evaluate(()=>{window.__googleEnabled=true;});
   await off.locator('#cuentaOpciones button').filter({hasText:'Reintentar'}).click();
   await off.waitForFunction(()=>document.querySelector('#bCuenta .btn-txt')?.textContent==='Guardar mi progreso');
   assert.match(await off.locator('#cuentaTitulo').textContent(),/Guardar mi progreso/);
   assert(!await off.locator('#capaMas').evaluate(e=>e.classList.contains('ver')),'account button closes settings before opening login');
   // Una cuenta creada en otro dispositivo justo después del SELECT
   // debe sincronizarse, no intentar insertar repetidamente el mismo UUID.
   const partidaIgual={usuario_id:'same-google-user',revision:1,estado_juego:{
     version:1,localStorage:{larueda_mundo:'["durazno"]',gya_pais:'uruguay',gya_nombre:'Race',gya_avatar:'avatar-01'}}};
   const e=await device(browser,base,mock(null,'Race',{raceData:partidaIgual}));
   await e.page.waitForFunction(()=>localStorage.getItem('gya_cuenta_usuario')==='same-google-user');
   assert(await e.page.locator('#cuentaCapa').isHidden(),'same save with reordered jsonb keys links without error');

   const partidaAjena={usuario_id:'same-google-user',revision:1,estado_juego:{
     version:1,localStorage:{gya_nombre:'Otra',gya_avatar:'avatar-01',gya_pais:'uruguay',larueda_mundo:'["durazno"]'}}};
   const f=await device(browser,base,mock(null,'Local',{raceData:partidaAjena}));
   await f.page.waitForTimeout(400);
   assert(await f.page.locator('#cuentaCapa').isHidden(),'insert race must never open a popup');
   await f.page.locator('#bCuenta').click();
   await f.page.locator('#cuentaCapa:not([hidden])').waitFor();
   assert.match(await f.page.locator('#cuentaTitulo').textContent(),/Elegí tu partida/);
   assert.equal(await f.page.evaluate(()=>localStorage.getItem('gya_nombre')),'Local','never replace local progress in a race');
   assert.equal(await f.page.evaluate(()=>window.__cloud.estado_juego.localStorage.gya_nombre),'Otra','never overwrite cloud progress in a race');
   // El error reportado por Gonzalo: carrera entre revisiones durante UPDATE.
   // Se reintenta y, si la otra sesión sigue ganando, NO se abre ningún aviso.
   const g=await device(browser,base,mock(null,'SinPopup',{failUpdate:true}));
   await g.page.waitForFunction(()=>localStorage.getItem('gya_cuenta_usuario')==='same-google-user');
   await g.page.evaluate(async()=>{
     localStorage.setItem('gya_puntos_prueba','1234');
     await GyaCuenta.revisar();
   });
   assert(await g.page.locator('#cuentaCapa').isHidden(),'sync failure must NOT display No se pudo guardar');
   assert.equal(await g.page.evaluate(()=>localStorage.getItem('gya_puntos_prueba')),'1234','sync failures keep local game progress');
   assert.notEqual(await g.page.evaluate(()=>window.__cloud.estado_juego.localStorage.gya_puntos_prueba),'1234','sync failure never overwrites remote');
   await g.page.locator('#bCuenta').click();
   assert.match(await g.page.locator('#cuentaTexto').textContent(),/La sincronización con Google está pendiente/);
   await Promise.all([a.context.close(),b.context.close(),c.context.close(),d.close(),e.context.close(),f.context.close(),g.context.close()]);
   console.log('Cuenta y progreso entre dispositivos: OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
