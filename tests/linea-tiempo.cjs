/* Línea del tiempo: arrastrar la carta al "¿va acá?" y duelo 1 vs 1 (MultiBroker simulado). */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
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
   await page.goto(base);await page.waitForFunction(()=>window.LineaTiempo&&window.Duelo&&window.MultiBroker);
   await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');const s=document.querySelector('#setup');if(s)s.style.display='none';
    window.__charges=0;Fichas.usar=()=>{window.__charges++;return true;};
    MultiBroker.conectar=(ready,fail,assign)=>{const cl={connected:true,subs:new Set(),handlers:[],closed:false,subscribe(t){this.subs.add(t);},unsubscribe(t){this.subs.delete(t);},publish(t,m){if(!this.closed)window.__publish(t,String(m));},on(ev,fn){if(ev==='message')this.handlers.push(fn);return cl;},end(){this.closed=true;this.connected=false;}};
     window.__deliver=(t,m)=>{if(!cl.closed&&cl.subs.has(t))for(const fn of cl.handlers)fn(t,m);};assign(cl);setTimeout(ready,0);};});
   return page;
  }
  const a=await player('Gonzalo'),b=await player('Vale');
  const abrir=async p=>{await p.evaluate(()=>Extensiones.abrirJuego('linea-tiempo'));await p.locator('.pf-bienv-ok').click();};
  // Solo: arrastrar la carta al hueco correcto.
  await abrir(a);await a.locator('[data-tema="futbol"]').click();
  assert.equal(await a.evaluate(()=>window.__charges),1);
  const correcto=p=>p.evaluate(()=>{const t=document.querySelector('.lt-nueva b').textContent,h=LINEA_TIEMPO_DATOS.temas.flatMap(x=>x.hechos).find(h=>h[1]===t);const ys=[...document.querySelectorAll('.lt-linea .lt-carta .lt-a')].map(x=>+x.textContent);let pos=ys.findIndex(y=>y>h[0]);return pos<0?ys.length:pos;});
  const arrastrar=async(p,pos)=>{const c=await p.locator('.lt-nueva').boundingBox(),h=p.locator(`.lt-hueco[data-pos="${pos}"]`);await h.scrollIntoViewIfNeeded();const hb=await h.boundingBox();
   await p.mouse.move(c.x+c.width/2,c.y+c.height/2);await p.mouse.down();await p.mouse.move(c.x+c.width/2,c.y-20,{steps:4});await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2,{steps:8});
   assert(await h.evaluate(e=>e.classList.contains('lt-hueco-on')),'el hueco se ilumina al pasar la carta');await p.mouse.up();};
  await arrastrar(a,await correcto(a));
  assert.equal(await a.locator('.lt-ok').count(),1,'carta arrastrada al lugar correcto queda verde');
  assert.equal(await a.locator('.lt-fantasma').count(),0);
  await a.locator('.lt-siguiente').click();
  // soltar fuera de la línea no ubica la carta
  const c=await a.locator('.lt-nueva').boundingBox();await a.mouse.move(c.x+20,c.y+20);await a.mouse.down();await a.mouse.move(c.x+40,c.y+60,{steps:3});await a.mouse.up();
  assert.equal(await a.locator('.lt-nueva').count(),1,'soltar abajo no cuenta');
  // Duelo: Gonzalo crea sala, Vale entra por el link directo.
  await a.evaluate(()=>Extensiones.abrirJuego('linea-tiempo'));await a.locator('.pf-bienv-ok').click();
  await a.locator('.lt-duelo-btn').click();await a.locator('#dlCrear').click();
  await a.waitForFunction(()=>document.querySelector('#dlEstado').textContent.includes('Sala lista'));
  const code=await a.locator('#dlCodigo').textContent();
  await b.goto(base+'/?duelo=linea&sala='+code);await b.waitForFunction(()=>window.Duelo&&window.MultiBroker);
  await b.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');const s=document.querySelector('#setup');if(s)s.style.display='none';
   window.__charges=0;Fichas.usar=()=>{window.__charges++;return true;};
   MultiBroker.conectar=(ready,fail,assign)=>{const cl={connected:true,subs:new Set(),handlers:[],closed:false,subscribe(t){this.subs.add(t);},unsubscribe(t){this.subs.delete(t);},publish(t,m){if(!this.closed)window.__publish(t,String(m));},on(ev,fn){if(ev==='message')this.handlers.push(fn);return cl;},end(){this.closed=true;this.connected=false;}};
    window.__deliver=(t,m)=>{if(!cl.closed&&cl.subs.has(t))for(const fn of cl.handlers)fn(t,m);};assign(cl);setTimeout(ready,0);};
   Duelo.abrirInvitacion();});
  await a.waitForSelector('.lt-nueva');await b.waitForSelector('.lt-nueva');
  assert.equal(await a.locator('.lt-nueva b').textContent(),await b.locator('.lt-nueva b').textContent(),'los dos ven la misma carta');
  assert.equal(await b.evaluate(()=>window.__charges),0,'el duelo no gasta fichas');
  for(let i=0;i<10;i++){
   await a.locator(`.lt-hueco[data-pos="${await correcto(a)}"]`).click();await a.locator('.lt-siguiente').click();
   const pos=await correcto(b),n=await b.locator('.lt-hueco').count();await b.locator(`.lt-hueco[data-pos="${i<2?(pos===0?n-1:0):pos}"]`).click();if(await b.locator('.lt-siguiente').count())await b.locator('.lt-siguiente').click();
   if(await b.locator('.dl-resultado').count())break;
  }
  await a.waitForSelector('.dl-resultado');await b.waitForSelector('.dl-resultado');
  await a.waitForFunction(()=>/Ganaste/.test(document.querySelector('.dl-resultado h3').textContent));
  await b.waitForFunction(()=>/Ganó/.test(document.querySelector('.dl-resultado h3').textContent));
  if(process.env.SHOT){await a.screenshot({path:process.env.SHOT+'-a.png'});}
  assert.deepEqual(errors,[]);
  console.log('PASS: arrastrar al ¿va acá? con hueco iluminado, soltar afuera no cuenta, duelo por link directo con las mismas cartas, sin fichas, y gana el de más puntos.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
