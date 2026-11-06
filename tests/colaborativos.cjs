/* Modos en equipo (Línea del tiempo, Sopa Fugaz y Palabras Cruzadas): dos jugadores con MultiBroker simulado. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
const falso=()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');const s=document.querySelector('#setup');if(s)s.style.display='none';
 window.__charges=0;Fichas.usar=()=>{window.__charges++;return true;};
 MultiBroker.conectar=(ready,fail,assign)=>{const cl={connected:true,subs:new Set(),handlers:[],closed:false,subscribe(t){this.subs.add(t);},unsubscribe(t){this.subs.delete(t);},publish(t,m){if(!this.closed)window.__publish(t,String(m));},on(ev,fn){if(ev==='message')this.handlers.push(fn);return cl;},end(){this.closed=true;this.connected=false;}};
  window.__deliver=(t,m)=>{if(!cl.closed&&cl.subs.has(t))for(const fn of cl.handlers)fn(t,m);};assign(cl);setTimeout(ready,0);};};
const norm=s=>s.toUpperCase().replace(/Ñ/g,'!').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/!/g,'Ñ').replace(/[^A-ZÑ]/g,'');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined});
 let peers=[];const errors=[];
 async function player(name){
  const ctx=await browser.newContext({locale:'es-UY',viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await ctx.newPage();
  peers.push(page);page.on('pageerror',e=>errors.push(name+': '+e.message));
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
  await page.exposeFunction('__publish',async(t,m)=>{for(const o of peers)if(o!==page&&!o.isClosed())await o.evaluate(([t,m])=>window.__deliver?.(t,m),[t,m]);});
  await page.addInitScript(n=>{localStorage.setItem('gya_nombre',n);localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_avatar','avatar-02');localStorage.setItem('gya_bienvenida_vista','1');},name);
  return page;
 }
 async function sala(juego,abrir){
  for(const p of peers)await p.context().close();peers=[];
  const a=await player('Gonzalo'),b=await player('Vale');
  await a.goto(base);await a.waitForFunction(()=>window.Duelo&&window.Extensiones);await a.evaluate(falso);
  await abrir(a);
  await a.locator('#dlCrear').click();await a.waitForFunction(()=>document.querySelector('#dlEstado').textContent.includes('Sala lista'));
  const code=await a.locator('#dlCodigo').textContent();
  await b.goto(base+'/?duelo='+juego+'&sala='+code);await b.waitForFunction(()=>window.Duelo&&window.MultiBroker);await b.evaluate(falso);await b.evaluate(()=>Duelo.abrirInvitacion());
  return [a,b];
 }
 try{
  /* ---------- Línea del tiempo en equipo ---------- */
  let [a,b]=await sala('linea-colab',async a=>{await a.evaluate(()=>Extensiones.abrirJuego('linea-tiempo'));await a.locator('.pf-bienv-ok').click();await a.locator('.lt-equipo-btn').click();});
  await a.waitForSelector('.lt-nueva');await b.waitForSelector('.lt-nueva');
  const cartas=p=>p.evaluate(()=>LineaTiempo._estado().cartas.map(c=>c.titulo).sort().join('|'));
  assert.equal(await cartas(a),await cartas(b),'las mismas cartas');
  const destino=p=>p.evaluate(()=>{const e=LineaTiempo._estado(),h=e.pila[0];return e.orden.findIndex(o=>o.anio===h.anio);});
  const llenos=p=>p.locator('.lt-lleno').count();
  for(let k=0;k<7;k++){const p=k%2?b:a,o=k%2?a:b;
   const d=await destino(p);await p.locator(`.lt-slot[data-i="${d}"]`).click();
   await o.waitForFunction(n=>document.querySelectorAll('.lt-lleno').length===n,k+1);
   assert.equal(await llenos(p),k+1);
  }
  assert.equal(await a.evaluate(()=>LineaTiempo._estado().lugares.map(c=>c.titulo).join('|')),await b.evaluate(()=>LineaTiempo._estado().lugares.map(c=>c.titulo).join('|')),'la misma línea en los dos');
  // el compañero devuelve una y la vuelve a poner
  await b.locator('.lt-slot[data-i="3"] .lt-carta').click();await a.waitForFunction(()=>document.querySelectorAll('.lt-lleno').length===6);
  await b.locator('.lt-slot[data-i="3"]').click();await a.waitForFunction(()=>document.querySelectorAll('.lt-lleno').length===7);
  await b.locator('[data-acc="listo"]').click();
  await a.waitForSelector('.lt-cartel');await b.waitForSelector('.lt-cartel');
  assert.match(await a.locator('.lt-cartel').textContent(),/PERFECTA/);assert.match(await b.locator('.lt-cartel').textContent(),/PERFECTA/);
  assert(await b.locator('.lt-siguiente[disabled]').count(),'el invitado espera');
  await a.screenshot({path:process.env.S?process.env.S+'/linea-equipo-a.png':'/dev/null'}).catch(()=>{});
  const antes=await cartas(b);await a.locator('[data-acc="eq-otra"]').click();
  await b.waitForFunction(t=>!document.querySelector('.lt-cartel')&&LineaTiempo._estado().cartas.map(c=>c.titulo).sort().join('|')!==t,antes);
  assert.equal(await cartas(a),await cartas(b),'otra línea juntos');
  assert.equal(await a.evaluate(()=>window.__charges)+await b.evaluate(()=>window.__charges),0,'en equipo no gasta fichas');
  console.log('PASS Línea del tiempo en equipo');

  /* ---------- Sopa Fugaz en equipo ---------- */
  [a,b]=await sala('sopa-colab',async a=>{await a.evaluate(()=>Extensiones.abrirJuego('sopa-fugaz'));await a.locator('.sf-modo-equipo').click();});
  await a.waitForSelector('.sf-celda');await b.waitForSelector('.sf-celda');
  await b.waitForFunction(()=>SopaFugaz._ronda().objetivos.length>0);
  const ronda=p=>p.evaluate(()=>SopaFugaz._ronda());
  const ra=await ronda(a),rb=await ronda(b);
  assert.deepEqual(rb.objetivos,ra.objetivos,'la misma sopa');
  assert.equal((await a.locator('.sf-celda').allTextContents()).join(''),(await b.locator('.sf-celda').allTextContents()).join(''),'el mismo tablero');
  async function arrastrar(page,ks){const boxes=await page.locator('.sf-celda').evaluateAll((els,ks)=>ks.map(k=>{const r=els[k].getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};}),ks);
   await page.mouse.move(boxes[0].x,boxes[0].y);await page.mouse.down();for(const x of boxes.slice(1))await page.mouse.move(x.x,x.y,{steps:2});await page.mouse.up();}
  for(const [i,w] of ra.objetivos.entries()){const p=i%2?b:a,o=i%2?a:b;
   await arrastrar(p,ra.ubicadas[w]);
   await o.waitForFunction(w=>SopaFugaz._ronda().halladas.includes(w),w);
   if(i===0)await b.screenshot({path:process.env.S?process.env.S+'/sopa-equipo-b.png':'/dev/null'}).catch(()=>{});
  }
  await a.waitForFunction(()=>/juntos/.test(document.querySelector('.sf-panel h3')?.textContent||''));
  await b.waitForFunction(()=>/juntos/.test(document.querySelector('.sf-panel h3')?.textContent||''));
  const mias=await a.evaluate(()=>SopaFugaz._ronda().equipo.mias)+await b.evaluate(()=>SopaFugaz._ronda().equipo.mias);
  assert.equal(mias,ra.objetivos.length,'cada palabra la encontró uno solo');
  await b.screenshot({path:process.env.S?process.env.S+'/sopa-equipo-fin.png':'/dev/null'}).catch(()=>{});
  console.log('PASS Sopa Fugaz en equipo');

  /* ---------- Palabras Cruzadas en equipo ---------- */
  [a,b]=await sala('cruzadas-colab',async a=>{await a.evaluate(()=>Extensiones.abrirJuego('palabras-cruzadas'));await a.waitForTimeout(500);for(const s of ['#pcAyuda .pc-entendido','.pf-bienv-ok']){const ok=a.locator(s);if(await ok.isVisible())await ok.click();}await a.locator('#pcEquipoBoton').click();});
  await b.waitForSelector('.pc-celda');
  const ok=b.locator('#pcAyuda .pc-entendido');if(await ok.isVisible().catch(()=>false))await ok.click();
  const pz=await a.evaluate(()=>{const d=JSON.parse(localStorage.getItem('gya_palabras_cruzadas'));return PALABRAS_CRUZADAS_DATOS.find(p=>p.id===d.actual);});
  const keys=w=>[...norm(w.respuesta)].map((_,n)=>(w.fila+(w.direccion==='V'?n:0))+','+(w.columna+(w.direccion==='H'?n:0)));
  const valor=(p,k)=>p.locator('.pc-celda[data-casilla="'+k+'"]>span').textContent();
  for(const [i,p,o] of [[0,a,b],[1,b,a]]){const w=pz.palabras[i],ks=keys(w),r=norm(w.respuesta);
   for(const [n,k] of ks.entries()){if((await valor(p,k))===r[n])continue;await p.locator('.pc-celda[data-casilla="'+k+'"]').click();await p.keyboard.type(r[n]);}
   await o.waitForFunction(([ks,r])=>ks.every((k,n)=>document.querySelector('.pc-celda[data-casilla="'+k+'"]>span').textContent===r[n]),[ks,r]);
  }
  const host=await a.evaluate(()=>JSON.parse(localStorage.getItem('gya_palabras_cruzadas')).letras);
  for(const k of keys(pz.palabras[1]))assert(host[k],'el anfitrión guarda lo que puso el compañero');
  await b.screenshot({path:process.env.S?process.env.S+'/cruzadas-equipo-b.png':'/dev/null'}).catch(()=>{});
  // el invitado sale y recupera su propio crucigrama
  await b.locator('#pcEquipoBoton').click();
  assert.match(await b.locator('#pcEquipoBoton').textContent(),/^🤝$/);
  console.log('PASS Palabras Cruzadas en equipo');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
