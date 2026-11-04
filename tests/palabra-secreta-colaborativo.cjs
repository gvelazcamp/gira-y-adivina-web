const {chromium}=require('playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 const file=path.join(root,pathname==='/'?'index.html':pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
 const peers=[],packets=[],errors=[];
 try{
  async function player(name,saved){
   const context=await browser.newContext({locale:'es-UY',viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();
   peers.push(page);page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
   await page.exposeFunction('__publish',async(topic,payload)=>{
    packets.push({page,topic,payload});
    for(const other of peers)if(other!==page&&!other.isClosed())await other.evaluate(([t,m])=>window.__deliver?.(t,m),[topic,payload]);
   });
   await page.addInitScript(({name,saved})=>{
    localStorage.setItem('gya_nombre',name);localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_avatar','avatar-02');localStorage.setItem('gya_bienvenida_vista','1');
    if(!localStorage.getItem('gya_palabra_secreta'))localStorage.setItem('gya_palabra_secreta',JSON.stringify(saved));
    window.__pausedNetwork=false;
   },{name,saved});
   return page;
  }
  const seed=(word,nivel,max)=>({nivel,partidaNivel:{objetivo:word,nivel,max,repeticiones:0,dia:1,intentos:[],terminada:false,gano:false,cobrada:true},ganadas:5,jugadas:7,ayudaVista:true});
  const hostSeed=seed('ASADO',2,5);
  hostSeed.partidaNivel.intentos=[{palabra:'TERMO',colores:['ausente','ausente','ausente','ausente','exacta']}];
  const guestSeed=seed('YERBA',4,3);
  const host=await player('Anfitrión',hostSeed),guest=await player('Ayudante',guestSeed);
  async function prepare(page,url){
   await page.goto(url);await page.waitForFunction(()=>window.PalabraSecreta&&window.Duelo&&window.MultiBroker);
   await page.evaluate(()=>{
    document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');
    window.__connectionAttempts=0;window.__failNext=false;window.__charges=0;Fichas.usar=()=>{window.__charges++;return true;};
    MultiBroker.conectar=(ready,fail,assign)=>{
     window.__connectionAttempts++;
     const cl={connected:true,subs:new Set(),handlers:[],closed:false,subscribe(t){this.subs.add(t);},publish(t,m){if(!this.closed&&!window.__pausedNetwork)window.__publish(t,String(m));},on(ev,fn){if(ev==='message')this.handlers.push(fn);},end(){this.closed=true;this.connected=false;}};
     window.__deliver=(t,m)=>{if(!cl.closed&&!window.__pausedNetwork&&cl.subs.has(t))for(const fn of cl.handlers)fn(t,m);};
     assign(cl);setTimeout(()=>{if(cl.closed)return;if(window.__failNext){window.__failNext=false;cl.connected=false;fail();}else ready();},0);
    };
   });
  }
  async function open(page){await page.evaluate(()=>Extensiones.abrirJuego('palabra-secreta'));await page.locator('#psAyudaPanel .sf-principal').click();}
  const text=page=>page.locator('#psTablero').textContent();
  const attempts=page=>page.locator('#psTablero .ps-fila:has(.exacta, .presente, .ausente)').count();
  const type=(page,word)=>page.evaluate(w=>{for(const l of w)PalabraSecreta.tecla(l);},word);
  const erase=page=>page.evaluate(()=>{for(let i=0;i<7;i++)PalabraSecreta.tecla('Backspace');});
  const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gya_palabra_secreta')));
  await prepare(host,base);await open(host);await type(host,'A');
  await host.locator('#psColaborativo').click();
  assert.match(await host.locator('.dl-tarjeta h3').textContent(),/colaborativo/);
  await host.locator('#dlCrear').click();
  await host.waitForFunction(()=>document.querySelector('#dlEstado').textContent.includes('Sala lista'));
  const code=await host.locator('#dlCodigo').textContent();
  await host.evaluate(()=>{window.__invitation='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>window.__invitation=t}});});
  await host.locator('#dlCopiar').click();
  const invitation=await host.evaluate(()=>window.__invitation);
  assert.match(invitation,/duelo=palabra-colaborativa/);assert.match(invitation,/ayudarle/);assert.match(invitation,/entrar directamente/);assert(!invitation.includes('apretá UNIRME'));
  // Recorrido real del link: abre el juego y se une sin escribir ni pulsar Unirme.
  await prepare(guest,base+'/?duelo=palabra-colaborativa&sala='+code+'&de=Anfitrion');
  await guest.waitForFunction(()=>document.querySelector('#psEquipoEstado')?.textContent.includes('tiene el teclado'));
  assert.equal(await guest.locator('.dl-capa').count(),0,'the WhatsApp link joins automatically');
  assert.equal(await guest.evaluate(()=>window.__connectionAttempts),1,'only one connection per invitation');
  assert(!(await guest.locator('#bUnirse').textContent()).includes('Entrar a la sala '+code),'the invite must not configure the wheel game');
  assert.equal(await text(guest),await text(host),'including the half-written row');
  assert.equal(await attempts(guest),1);assert.equal(await guest.locator('#psTablero .ps-fila').count(),5);
  assert.deepEqual(await saved(guest),guestSeed,'joining does not overwrite the guest solo save');
  if(process.env.SCREENSHOT_PATH)await guest.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});
  await type(guest,'X');assert.equal(await text(guest),await text(host),'only the current editor can type');
  await guest.locator('#psTomarTeclado').click();
  await guest.waitForFunction(()=>document.querySelector('#psEquipoEstado').textContent.includes('Vos tenés'));
  assert(await host.locator('#psEnviar').isDisabled());
  await erase(guest);await type(guest,'ZZZZZ');await guest.locator('#psEnviar').click();
  await guest.waitForFunction(()=>document.querySelector('#psMensaje').textContent.includes('diccionario'));
  assert.equal(await attempts(host),1,'invalid words do not consume an attempt');
  await erase(guest);await type(guest,'TERMO');await guest.locator('#psEnviar').click();
  await host.waitForFunction(()=>document.querySelectorAll('#psTablero .ps-fila .exacta').length>=2);
  await guest.waitForFunction(()=>document.querySelectorAll('#psTablero .ps-fila .exacta').length>=2);
  assert.equal(await attempts(host),2);assert.equal(await text(guest),await text(host));
  const packet=packets.filter(p=>p.page===guest&&JSON.parse(p.payload)?.datos?.accion==='enviar').at(-1);
  await host.evaluate(([t,m])=>{window.__deliver(t,m);window.__deliver(t,m);},[packet.topic,packet.payload]);
  assert.equal(await attempts(host),2,'repeated delivery does not repeat the submission');
  // Si se pierde una edición, el último borrador completo se reintenta al recuperar red.
  await guest.evaluate(()=>window.__pausedNetwork=true);await type(guest,'ASADO');
  await guest.evaluate(()=>window.__pausedNetwork=false);
  await host.waitForFunction(()=>document.querySelectorAll('#psTablero .ps-fila')[2].textContent==='ASADO');
  await guest.locator('#psEnviar').click();
  await host.waitForFunction(()=>document.querySelector('#psFinal').textContent.includes('entre los dos'));
  await guest.waitForFunction(()=>document.querySelector('#psFinal').textContent.includes('entre los dos'));
  assert.equal((await saved(host)).nivel,3);assert.equal((await saved(host)).ganadas,6);
  assert.deepEqual(await saved(guest),guestSeed);assert.equal(await guest.evaluate(()=>window.__charges),0);
  assert.equal(await host.evaluate(()=>window.__charges),0,'already-paid host word is not charged twice');
  await guest.getByRole('button',{name:'Ver el tablero',exact:true}).click();
  assert.equal(await guest.locator('.ps-siguiente').count(),0,'only the host can start the next shared word');
  await host.getByRole('button',{name:'Ver el tablero',exact:true}).click();
  assert(await host.locator('.ps-siguiente').isVisible());
  await host.getByRole('button',{name:'Otra palabra juntos',exact:true}).click();
  await guest.waitForFunction(()=>document.querySelector('#psFinal').hidden);
  assert.equal(await attempts(host),0);assert.equal(await attempts(guest),0);
  assert.match(await guest.locator('#psReto').textContent(),/Nivel 3/);
  await host.evaluate(([t,m])=>window.__deliver(t,m),[packet.topic,packet.payload]);
  assert.equal(await attempts(host),0,'a packet from the previous round cannot spend a new attempt');
  // Los retos del tablero compartido conservan sus reglas, incluso para el invitado.
  await guest.locator('#psTomarTeclado').click();
  await guest.waitForFunction(()=>document.querySelector('#psEquipoEstado').textContent.includes('Vos tenés'));
  const repeat=await host.evaluate(()=>{const p=JSON.parse(localStorage.getItem('gya_palabra_secreta')).partidaNivel;return PALABRA_SECRETAS.find(w=>w!==p.objetivo);});
  await type(guest,repeat);await guest.locator('#psEnviar').click();
  await guest.waitForFunction(()=>document.querySelectorAll('#psTablero .ps-fila:has(.exacta,.presente,.ausente)').length===1);
  const different=await host.evaluate(w=>PALABRA_SECRETAS.find(x=>x!==w),repeat);
  await type(guest,different);await guest.locator('#psEnviar').click();
  await guest.waitForFunction(()=>document.querySelector('#psMensaje').textContent.includes('Tenés que repetir'));
  assert.equal(await attempts(host),1,'a helper cannot bypass the repetition challenge');
  await erase(guest);
  for(let i=2;i<=3;i++){
   await type(guest,repeat);await guest.locator('#psEnviar').click();
   await guest.waitForFunction(n=>document.querySelectorAll('#psTablero .ps-fila:has(.exacta,.presente,.ausente)').length===n,i);
  }
  assert.match(await guest.locator('#psReto').textContent(),/te quedan 3 intentos/);
  // Desconexión explícita y vuelta a las dos partidas individuales.
  await guest.locator('#psSalirEquipo').click();
  await host.waitForFunction(()=>document.querySelector('#psEquipoEstado').textContent.includes('salió'));
  assert.deepEqual(await saved(guest),guestSeed);
  assert.equal(await guest.locator('#psTablero .ps-fila').count(),3);
  await host.locator('#psSalirEquipo').click();
  assert(await host.locator('#psColaborativo').isVisible());assert(await host.locator('#psEnviar').isEnabled());
  // Cancelar y salir durante la espera no deja una sala ni bloquea el modo individual.
  await host.locator('#psColaborativo').click();await host.locator('#dlCrear').click();await host.locator('#dlCancelar').click();
  await type(host,'A');assert((await text(host)).includes('A'));
  await host.locator('#psColaborativo').click();await host.locator('#dlCrear').click();
  await host.evaluate(()=>Extensiones.cerrar());assert.equal(await host.locator('.dl-capa').count(),0);
  // El duelo competitivo sigue separado, con su título y namespace anteriores.
  await open(host);await host.locator('#psDuelo').click();
  assert.equal(await host.locator('.dl-tarjeta h3').textContent(),'Jugar con un amigo');
  await host.locator('#dlCancelar').click();
  for(const viewport of [{width:360,height:640},{width:390,height:844},{width:844,height:390}]){
   await host.setViewportSize(viewport);
   assert(await host.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
  }
  // Palabra de siete letras: el host sigue validando y cobra solo su propia partida.
  await host.evaluate(()=>{
   const d=JSON.parse(localStorage.getItem('gya_palabra_secreta'));d.nivel=8;
   d.partidaNivel={objetivo:PALABRA_SECRETAS_7[0],nivel:8,max:4,repeticiones:0,intentos:[],terminada:false,gano:false};
   localStorage.setItem('gya_palabra_secreta',JSON.stringify(d));
  });
  await prepare(host,base);await open(host);
  const longWord=(await saved(host)).partidaNivel.objetivo;
  await host.locator('#psColaborativo').click();await host.locator('#dlCrear').click();
  await host.waitForFunction(()=>document.querySelector('#dlEstado').textContent.includes('Sala lista'));
  const longCode=await host.locator('#dlCodigo').textContent();
  await guest.locator('#psColaborativo').click();await guest.locator('#dlUnirse').click();
  const boardBeforeCode=await text(guest);
  await guest.locator('#dlInput').pressSequentially(longCode.toLowerCase());
  assert.equal((await guest.locator('#dlInput').inputValue()).toUpperCase(),longCode,'native typing must reach the room field');
  await guest.locator('#dlInput').press('Backspace');
  assert.equal((await guest.locator('#dlInput').inputValue()).length,3,'Backspace must edit the room field');
  await guest.locator('#dlInput').pressSequentially(longCode.slice(-1));
  assert.equal(await text(guest),boardBeforeCode,'room keystrokes must not edit the word');
  await guest.locator('#dlInput').press('Enter');
  await guest.waitForFunction(()=>document.querySelector('#psEquipoEstado').textContent.includes('tiene el teclado'));
  assert.equal(await guest.locator('#psTablero .ps-fila').first().locator('.ps-celda').count(),7);
  await guest.locator('#psTomarTeclado').click();
  await guest.waitForFunction(()=>document.querySelector('#psEquipoEstado').textContent.includes('Vos tenés'));
  await host.evaluate(()=>{Fichas.usar=(_j,cb)=>{window.__retryFicha=cb;return false;};});
  await type(guest,longWord);await guest.locator('#psEnviar').click();
  await guest.waitForFunction(()=>document.querySelector('#psMensaje').textContent.includes('ficha'));
  assert.equal(await attempts(host),0,'insufficient energy cannot spend an attempt');
  await host.evaluate(()=>{Fichas.usar=()=>{window.__charges++;return true;};window.__retryFicha();});
  await guest.waitForFunction(()=>document.querySelector('#psFinal').textContent.includes('entre los dos'));
  assert.equal((await saved(host)).nivel,9);assert.equal(await host.evaluate(()=>window.__charges),1);
  assert.deepEqual(await saved(guest),guestSeed);assert.equal(await guest.evaluate(()=>window.__charges),0);
  // La invitación competitiva de Palabra Secreta también entra por enlace.
  await guest.locator('#psFinal').getByRole('button',{name:'Salir del colaborativo',exact:true}).click();
  await host.locator('#psFinal').getByRole('button',{name:'Salir del colaborativo',exact:true}).click();
  await open(host);
  await host.locator('#psDuelo').click();await host.locator('#dlCrear').click();
  await host.waitForFunction(()=>document.querySelector('#dlEstado').textContent.includes('Sala lista'));
  const duelCode=await host.locator('#dlCodigo').textContent();
  await prepare(guest,base+'/?duelo=palabra&sala='+duelCode);
  await guest.waitForFunction(()=>document.querySelector('#psReto')?.textContent.includes('Duelo · 6 intentos'));
  assert.equal(await guest.locator('.dl-capa').count(),0);
  assert.equal(await guest.evaluate(()=>window.__connectionAttempts),1);
  // Una falla de red ofrece reintentar con la sala ya cargada, sin pedir el código.
  await prepare(guest,base+'/?duelo=palabra-colaborativa&sala=B9C4');
  await guest.evaluate(()=>window.__failNext=true);
  await guest.getByRole('button',{name:'Reintentar conexión',exact:true}).waitFor({state:'visible'});
  assert.equal(await guest.locator('#dlInput').inputValue(),'B9C4');
  assert(await guest.locator('#dlInput').evaluate(el=>el.readOnly));
  await guest.getByRole('button',{name:'Reintentar conexión',exact:true}).click();
  await guest.waitForFunction(()=>document.querySelector('#dlEstado').textContent.includes('Buscando la sala B9C4'));
  assert.equal(await guest.evaluate(()=>window.__connectionAttempts),2);
  await guest.locator('#dlCancelar').click();
  assert.equal(await guest.locator('.dl-capa').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: collaborative invitation, existing board/draft, keyboard handover, shared guesses, invalid words, duplicate/stale delivery, retry after packet loss, host progression, guest save preserved, next round, repetition challenge, seven-letter word, departure, cancel, cleanup, native code typing/Enter, automatic cooperative/competitive links and connection retry.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
