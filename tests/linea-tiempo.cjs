/* Línea del tiempo: niveles con la línea vacía, arrastrar de la pila a los lugares, mover/devolver, comprobar y duelo 1 vs 1 (MultiBroker simulado). */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
const falso=()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');const s=document.querySelector('#setup');if(s)s.style.display='none';
 window.__charges=0;Fichas.usar=()=>{window.__charges++;return true;};
 MultiBroker.conectar=(ready,fail,assign)=>{const cl={connected:true,subs:new Set(),handlers:[],closed:false,subscribe(t){this.subs.add(t);},unsubscribe(t){this.subs.delete(t);},publish(t,m){if(!this.closed)window.__publish(t,String(m));},on(ev,fn){if(ev==='message')this.handlers.push(fn);return cl;},end(){this.closed=true;this.connected=false;}};
  window.__deliver=(t,m)=>{if(!cl.closed&&cl.subs.has(t))for(const fn of cl.handlers)fn(t,m);};assign(cl);setTimeout(ready,0);};};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined});
 const peers=[],errors=[];
 try{
  async function player(name){
   const ctx=await browser.newContext({locale:'es-UY',viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await ctx.newPage();
   peers.push(page);page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
   await page.exposeFunction('__publish',async(t,m)=>{for(const o of peers)if(o!==page&&!o.isClosed())await o.evaluate(([t,m])=>window.__deliver?.(t,m),[t,m]);});
   await page.addInitScript(n=>{localStorage.setItem('gya_nombre',n);localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_avatar','avatar-02');localStorage.setItem('gya_bienvenida_vista','1');},name);
   return page;
  }
  const a=await player('Gonzalo'),b=await player('Vale');
  await a.goto(base);await a.waitForFunction(()=>window.LineaTiempo&&window.Duelo);await a.evaluate(falso);
  await a.evaluate(()=>Extensiones.abrirJuego('linea-tiempo'));await a.locator('.pf-bienv-ok').click();
  await a.locator('[data-tema="futbol"]').click();
  assert.equal(await a.evaluate(()=>window.__charges),1);
  assert.equal(await a.locator('.lt-slot.lt-hueco').count(),5,'nivel 1: cinco lugares vacíos');
  // lugar correcto de la carta de arriba de la pila
  const destinoDe=(p,titulo)=>p.evaluate(t=>{const e=LineaTiempo._estado();const h=e.cartas.find(c=>c.titulo===t);return e.orden.findIndex(o=>o.anio===h.anio);},titulo);
  const arrastrar=async(p,desde,hasta)=>{const c=await desde.boundingBox(),h=p.locator(`.lt-slot[data-i="${hasta}"]`);const hb=await h.boundingBox();
   await p.mouse.move(c.x+c.width/2,c.y+c.height/2);await p.mouse.down();await p.mouse.move(c.x+c.width/2,c.y-15,{steps:3});await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2,{steps:8});
   assert(await h.evaluate(e=>e.classList.contains('lt-hueco-on')),'el lugar se ilumina');await p.mouse.up();};
  // primera carta a un lugar equivocado, después se mueve
  let t=await a.locator('.lt-nueva .lt-t').evaluate(e=>e.firstChild.textContent);let d=await destinoDe(a,t);const mal=(d+1)%5;
  await arrastrar(a,a.locator('.lt-nueva'),mal);
  assert.equal(await a.locator('.lt-lleno').count(),1);
  // tocar la carta puesta la devuelve a la pila
  await a.locator(`.lt-slot[data-i="${mal}"] .lt-carta`).click();assert.equal(await a.locator('.lt-lleno').count(),0,'tocar una carta puesta la devuelve');
  for(let k=0;k<5;k++){t=await a.locator('.lt-nueva .lt-t').evaluate(e=>e.firstChild.textContent);d=await destinoDe(a,t);
   if(k===0){await arrastrar(a,a.locator('.lt-nueva'),(d+1)%5);await arrastrar(a,a.locator(`.lt-slot[data-i="${(d+1)%5}"] .lt-carta`),d);}// mover de lugar
   else await arrastrar(a,a.locator('.lt-nueva'),d);}
  await a.locator('[data-acc="listo"]').click();
  assert.match(await a.locator('.lt-cartel').textContent(),/PERFECTA/);
  assert.equal(await a.locator('.lt-ok').count(),5);
  assert.equal(await a.evaluate(()=>localStorage.getItem('gya_linea_tiempo_nivel')),'2');
  await a.locator('[data-acc="sig"]').click();assert.equal(await a.locator('.lt-slot.lt-hueco').count(),6,'nivel 2: seis lugares');
  // Duelo
  await a.evaluate(()=>Extensiones.abrirJuego('linea-tiempo'));await a.locator('.pf-bienv-ok').click();
  await a.locator('.lt-duelo-btn').click();await a.locator('#dlCrear').click();
  await a.waitForFunction(()=>document.querySelector('#dlEstado').textContent.includes('Sala lista'));
  const code=await a.locator('#dlCodigo').textContent();
  await b.goto(base+'/?duelo=linea&sala='+code);await b.waitForFunction(()=>window.Duelo&&window.MultiBroker);await b.evaluate(falso);await b.evaluate(()=>Duelo.abrirInvitacion());
  await a.waitForSelector('.lt-nueva');await b.waitForSelector('.lt-nueva');
  const ids=p=>p.evaluate(()=>LineaTiempo._estado().cartas.map(c=>c.titulo).sort().join('|'));
  assert.equal(await ids(a),await ids(b),'las mismas cartas');
  assert.equal(await b.locator('.lt-slot.lt-hueco').count(),7);
  // a: todo bien tocando lugares; b: todo al primer lugar libre (casi seguro con errores)
  for(let k=0;k<7;k++){t=await a.locator('.lt-nueva .lt-t').evaluate(e=>e.firstChild.textContent);await a.locator(`.lt-slot[data-i="${await destinoDe(a,t)}"]`).click();}
  await a.locator('[data-acc="listo"]').click();
  await b.evaluate(()=>{const e=LineaTiempo._estado();e.pila.sort((x,y)=>y.anio-x.anio);});
  for(let k=0;k<7;k++)await b.locator('.lt-slot.lt-hueco').first().click();
  await b.locator('[data-acc="listo"]').click();
  await a.waitForSelector('.dl-resultado');await b.waitForSelector('.dl-resultado');
  await a.waitForFunction(()=>/Ganaste/.test(document.querySelector('.dl-resultado h3').textContent));
  await b.waitForFunction(()=>/Ganó/.test(document.querySelector('.dl-resultado h3').textContent));
  assert.equal(await b.evaluate(()=>window.__charges),0,'el duelo no gasta fichas');
  assert.deepEqual(errors,[]);
  console.log('PASS: nivel con todos los lugares vacíos, arrastrar desde la pila con lugar iluminado, mover y devolver cartas, comprobar, subir de nivel, y duelo con las mismas cartas donde gana el que más acierta.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
