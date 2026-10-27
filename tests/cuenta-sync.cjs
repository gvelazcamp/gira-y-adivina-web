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
const mock=(seed,profile)=>({seed,profile});
async function device(browser,base,options){
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 await page.addInitScript(({seed,profile})=>{
   if(profile&&!localStorage.getItem('gya_nombre')){localStorage.setItem('gya_nombre',profile);localStorage.setItem('gya_avatar','avatar-01');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('larueda_mundo','["durazno"]');}
   window.__cloud=structuredClone(seed);
   window.fetch=async()=>({ok:true,json:async()=>({external:{google:true}})});
   window.__client={auth:{getUser:async()=>({data:{user:{id:'same-google-user',email:'jugador@example.com'}}}),signInWithOAuth:async()=>({error:null}),signOut:async()=>({error:null})},from:()=>{
     let op='',payload=null,filters=[];
     const q={select(){return this;},eq(k,v){filters.push([k,v]);return this;},limit(){return Promise.resolve({data:[],error:null});},insert(v){op='insert';payload=v;return this;},update(v){op='update';payload=v;return this;},maybeSingle(){
       if(op==='update'){if(window.__cloud&&filters.every(([k,v])=>window.__cloud[k]===v)){window.__cloud={...window.__cloud,...payload};return Promise.resolve({data:{revision:window.__cloud.revision},error:null});}return Promise.resolve({data:null,error:null});}
       return Promise.resolve({data:window.__cloud?{...window.__cloud}:null,error:null});
     },single(){if(op==='insert'&&!window.__cloud){window.__cloud={...payload};return Promise.resolve({data:{revision:1},error:null});}return Promise.resolve({data:null,error:{message:'duplicate'}});}};return q;
   }};
 },options);
 await page.goto(base);await page.locator('#cuentaInicio:not([hidden])').waitFor();
 return{context,page};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
   const a=await device(browser,base,mock(null,'Meg'));
   await a.page.waitForFunction(()=>window.__cloud?.estado_juego?.localStorage?.gya_nombre==='Meg');
   assert.equal(await a.page.evaluate(()=>localStorage.getItem('gya_cuenta_usuario')),'same-google-user');
   await a.page.evaluate(()=>localStorage.setItem('gya_logro_prueba','ganado'));
   await a.page.evaluate(()=>GyaCuenta.revisar());
   const cloud=await a.page.evaluate(()=>window.__cloud);assert.equal(cloud.revision,2);assert.equal(cloud.estado_juego.localStorage.gya_logro_prueba,'ganado');
   const b=await device(browser,base,mock(cloud,null));
   await b.page.waitForFunction(()=>localStorage.getItem('gya_nombre')==='Meg'&&localStorage.getItem('gya_logro_prueba')==='ganado');
   assert.equal(await b.page.evaluate(()=>localStorage.getItem('gya_cuenta_usuario')),'same-google-user');
   const c=await device(browser,base,mock(cloud,'Meg 2'));
   await c.page.locator('#cuentaCapa:not([hidden])').waitFor();
   assert.match(await c.page.locator('#cuentaTexto').textContent(),/Meg 2/);
   assert.match(await c.page.locator('#cuentaTexto').textContent(),/Meg/);
   assert.equal(await c.page.evaluate(()=>localStorage.getItem('gya_nombre')),'Meg 2','no automatic merge by similar name');
   await c.page.locator('#cuentaOpciones button').filter({hasText:'Decidir después'}).click();
   await c.page.waitForTimeout(3000);assert(await c.page.locator('#cuentaCapa').isHidden(),'deferring should not reopen the choice automatically');
   await c.page.locator('#cuentaInicio').click();await c.page.locator('#cuentaCapa:not([hidden])').waitFor();
   await c.page.locator('#cuentaOpciones button').filter({hasText:'Continuar la partida de mi cuenta'}).click();
   await c.page.waitForFunction(()=>localStorage.getItem('gya_nombre')==='Meg');
   assert(await c.page.evaluate(()=>!!localStorage.getItem('gya_cuenta_respaldo_local')),'keeps backup before replacing local progress');
   const d=await browser.newContext({serviceWorkers:'block'}),off=await d.newPage();
   await off.addInitScript(()=>{window.__googleEnabled=false;window.fetch=async()=>({ok:true,json:async()=>({external:{google:window.__googleEnabled}})});window.__client={auth:{getUser:async()=>({data:{user:null}})},from:()=>({select(){return this;},limit(){return Promise.resolve({data:[],error:null});}})};});
   await off.goto(base);await off.waitForFunction(()=>document.querySelector('#cuentaInicio')?.hidden===true);
   assert(await off.locator('#cuentaInicio').isHidden(),'Google disabled keeps the unfinished feature hidden');
   await off.locator('#bCuenta').click();
   await off.locator('#cuentaCapa:not([hidden])').waitFor();
   assert.match(await off.locator('#cuentaTitulo').textContent(),/Inicio de sesión no disponible/);
   await off.evaluate(()=>{window.__googleEnabled=true;});
   await off.locator('#cuentaOpciones button').filter({hasText:'Reintentar'}).click();
   await off.locator('#cuentaInicio:not([hidden])').waitFor();
   assert.match(await off.locator('#cuentaTitulo').textContent(),/Guardar mi progreso/);
   assert(!await off.locator('#capaMas').evaluate(e=>e.classList.contains('ver')),'account button closes settings before opening login');
   await Promise.all([a.context.close(),b.context.close(),c.context.close(),d.close()]);
   console.log('Cuenta y progreso entre dispositivos: OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
