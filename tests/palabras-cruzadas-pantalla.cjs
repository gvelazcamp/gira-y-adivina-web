const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
 try{
  const context=await browser.newContext({locale:'es-UY',viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
  await page.addInitScript(()=>{localStorage.setItem('gya_nombre','Pantalla');localStorage.setItem('gya_avatar','avatar-02');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');});
  await page.goto(base);await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelector('#setup').style.display='none';window.__pcBanco=PALABRAS_CRUZADAS_DATOS;Extensiones.abrirJuego('palabras-cruzadas');});
  await page.locator('#pcAyuda .pc-entendido').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('gya_palabras_cruzadas')).guiaVista===true);
  const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  async function fits(label,dialog=false){
   await settle();const issues=await page.evaluate(({dialog})=>{
    const problems=[],height=visualViewport.height,width=visualViewport.width;
    const selectors=dialog?['dialog[open]',...Array.from(document.querySelectorAll('dialog[open] button,dialog[open] p,dialog[open] .pc-pista')).filter(e=>e.getClientRects().length).map((e,i)=>{e.dataset.fit=i;return '[data-fit="'+i+'"]';})]:['#extShell','.pc-juego','.pc-panel-tablero','#pcGrilla','#pcPista','#pcComprobar','#pcRevelar','#pcTeclado','.pc-teclas:first-child button:first-child','.pc-teclas:last-child button:last-child','#pcPistasBoton','.pc-leyenda'];
    for(const selector of selectors){const e=document.querySelector(selector);if(!e||!e.getClientRects().length)continue;const b=e.getBoundingClientRect();if(b.x<-.5||b.y<-.5||b.right>width+.5||b.bottom>height+.5)problems.push(selector+' outside viewport '+JSON.stringify(b.toJSON()));if(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)problems.push(selector+' overflows '+e.scrollWidth+'x'+e.scrollHeight+' / '+e.clientWidth+'x'+e.clientHeight);}
    document.querySelectorAll('[data-fit]').forEach(e=>delete e.dataset.fit);return problems;
   },{dialog});assert.deepEqual(issues,[],label);
  }
  const sizes=[{width:390,height:844},{width:360,height:640},{width:320,height:568},{width:844,height:390},{width:700,height:320},{width:1280,height:900}];
  for(const size of sizes){
   await page.setViewportSize(size);
   for(let n=0;n<12;n++){
    await page.evaluate(n=>{PalabrasCruzadas.salir();window.PALABRAS_CRUZADAS_DATOS=[window.__pcBanco[n]];PalabrasCruzadas.abrir(document.querySelector('#extContenido'));},n);
    // Exercise every clue, including the longest descriptions and crossing controls.
    for(let clue=0;clue<6;clue++){await page.locator('#pcProxima').evaluate(b=>b.click());await fits(JSON.stringify(size)+' board '+(n+1)+' clue '+clue);}
    await page.locator('#pcComprobar').click();await fits('feedback '+JSON.stringify(size)+' board '+(n+1));
    await page.locator('#pcPistasBoton').click();
    for(const direction of ['#pcTabHorizontal','#pcTabVertical']){
     await page.locator(direction).click();let seen=0;
     while(true){await fits('clues '+JSON.stringify(size)+' board '+(n+1),true);seen+=await page.locator('dialog[open] .pc-pista').count();if(await page.locator('#pcPistasSiguiente').isDisabled())break;await page.locator('#pcPistasSiguiente').click();}
     const expected=await page.evaluate(d=>PALABRAS_CRUZADAS_DATOS[0].palabras.filter(w=>w.direccion===d).length,direction==='#pcTabHorizontal'?'H':'V');assert.equal(seen,expected,'all clues accessible through pages');
    }
    await page.keyboard.press('Escape');
   }
   // A checked green remains selectable for its clue, with a fixed-letter message.
   const checked=await page.evaluate(()=>{
    const k=document.querySelector('.pc-activa').dataset.casilla,[f,c]=k.split(',').map(Number);
    const word=PALABRAS_CRUZADAS_DATOS[0].palabras.find(w=>{const n=w.direccion==='V'?f-w.fila:c-w.columna;return n>=0&&n<w.respuesta.length&&(w.direccion==='V'?c===w.columna:f===w.fila);});
    const n=word.direccion==='V'?f-word.fila:c-word.columna;
    const answer=word.respuesta.toUpperCase().replace(/Ñ/g,'!').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/!/g,'Ñ').replace(/[^A-ZÑ]/g,'');
    PalabrasCruzadas.tecla(answer[n]);document.querySelector('#pcComprobar').click();return k;
   });
   await page.locator('.pc-celda[data-casilla="'+checked+'"]').click();await page.keyboard.press('Delete');
   await fits('fixed green feedback '+JSON.stringify(size));
   if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH.replace('.png','-'+size.width+'x'+size.height+'.png')});
   console.log('Fit verified:',size.width+'x'+size.height);
   await page.locator('#pcAyudaBoton').click();
   for(let step=0;step<3;step++){await fits('help step '+step+' '+JSON.stringify(size),true);if(step<2)await page.locator('#pcGuiaSiguiente').click();}
   await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{PalabrasCruzadas.salir();window.PALABRAS_CRUZADAS_DATOS=window.__pcBanco;PalabrasCruzadas.abrir(document.querySelector('#extContenido'));});await settle();
  if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});
  assert.deepEqual(errors,[]);console.log('PASS: all 12 boards, 6 clues each, feedback, paginated clues and all guide pages fit without scroll at six portrait/landscape/desktop sizes.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
