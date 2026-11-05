const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'palabras-cruzadas-datos.js'),'utf8'),ctx);
const puzzles=JSON.parse(JSON.stringify(ctx.window.PALABRAS_CRUZADAS_DATOS)),originals=JSON.parse(fs.readFileSync(path.join(root,'contenido/palabras-cruzadas-originales.json'),'utf8'));
const norm=w=>w.toUpperCase().replace(/Ñ/g,'!').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/!/g,'Ñ').replace(/ /g,'');
const keys=w=>[...norm(w.respuesta)].map((_,i)=>(w.fila+(w.direccion==='V'?i:0))+','+(w.columna+(w.direccion==='H'?i:0)));
for(let i=0;i<puzzles.length;i++)assert.deepEqual(puzzles[i].palabras.slice(0,6),originals[i].palabras,'all old word positions and indices are preserved');
const previous=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/palabras-cruzadas-v2-coordenadas.json'),'utf8'));
let additions=0;
for(const p of puzzles){
 const old=previous[p.id],prefix=p.palabras.slice(0,old.cantidad).map(w=>[w.respuesta,w.fila,w.columna,w.direccion]);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(prefix)).digest('hex'),old.sha256,'all published word positions remain unchanged in '+p.id);
 const extra=p.palabras.length-old.cantidad;assert.equal(extra,p.nivel>=11?5:4);additions+=extra;
}
assert.equal(additions,50,'exactly fifty additions across all twelve boards');
const puzzle=puzzles[1],oldLetters={},answers={},oldCount=previous['pc-2'].cantidad,last=puzzle.palabras.length-1;
for(const w of puzzle.palabras)keys(w).forEach((k,i)=>answers[k]=norm(w.respuesta)[i]);
for(const w of puzzle.palabras.slice(0,oldCount))keys(w).forEach((k,i)=>oldLetters[k]=norm(w.respuesta)[i]);
const firstKey=keys(originals[1].palabras[0])[0];
const saved={version:1,actual:'pc-2',seleccion:0,letras:oldLetters,ayudas:[firstKey],revisadas:Object.keys(oldLetters),guiaVista:true,resueltos:['pc-1','pc-2'],total:2};
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium',headless:true});
 try{
  const context=await browser.newContext({locale:'es-UY',viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
  await page.addInitScript(saved=>{localStorage.setItem('gya_nombre','Tablero grande');localStorage.setItem('gya_avatar','avatar-02');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');if(!localStorage.getItem('gya_palabras_cruzadas'))localStorage.setItem('gya_palabras_cruzadas',JSON.stringify(saved));},saved);
  async function open(){await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelector('#setup').style.display='none';Extensiones.abrirJuego('palabras-cruzadas');});}
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gya_palabras_cruzadas')));
  async function select(index){
   await page.locator('#pcPistasBoton').click();await page.locator(puzzle.palabras[index].direccion==='H'?'#pcTabHorizontal':'#pcTabVertical').click();
   await page.evaluate(index=>{for(let n=0;n<100&&!document.querySelector('.pc-pista[data-palabra="'+index+'"]');n++){const b=document.querySelector('#pcPistasSiguiente');if(b.disabled)throw Error('Missing clue '+index);b.click();}},index);
   await page.locator('.pc-pista[data-palabra="'+index+'"]').click();
  }
  await page.goto(base);await open();
  assert.deepEqual((await state()).letras,oldLetters);assert.deepEqual((await state()).ayudas,[firstKey]);assert.equal((await state()).total,2);
  assert.match(await page.locator('#pcProgreso').textContent(),new RegExp(oldCount+" / "+puzzle.palabras.length));assert.match(await page.locator('#pcNivel').textContent(),/Nivel 2.*Normal/);
  const closeCount=await page.locator('#pcGrilla .pc-celda').count();
  await page.locator('#pcVistaBoton').click();assert.equal(await page.locator('#pcGrilla .pc-celda').count(),Object.keys(answers).length,'full map renders every occupied cell');assert(closeCount<Object.keys(answers).length);
  const distant=keys(puzzle.palabras.at(-1)).at(-1);
  await page.locator('.pc-celda[data-casilla="'+distant+'"]').click();assert.equal(await page.locator('#pcVistaBoton').getAttribute('aria-pressed'),'false','choosing from the map returns to a readable close view');
  assert.equal(await page.locator('.pc-activa').getAttribute('data-casilla'),distant);assert.deepEqual((await state()).letras,oldLetters,'map navigation is not an edit');
  await select(last);assert.equal((await state()).seleccion,last,'newly added clues can be selected through pagination');
  const active=await page.locator('.pc-activa').getAttribute('data-casilla');
  const windowBefore=await page.locator('#pcGrilla').evaluate(e=>({f:e.dataset.filaInicial,c:e.dataset.columnaInicial}));
  await page.keyboard.type(answers[active]==='X'?'Q':'X');
  assert.deepEqual(await page.locator('#pcGrilla').evaluate(e=>({f:e.dataset.filaInicial,c:e.dataset.columnaInicial})),windowBefore,'the grid stays still while the next cell is already in view');
  await page.locator('#pcComprobar').click();
  assert.equal(await page.locator('.pc-activa').getAttribute('data-casilla'),active,'checking a large word focuses the first incorrect cell');
  assert(await page.locator('.pc-activa').evaluate(e=>e.classList.contains('pc-error')));
  await page.keyboard.type(answers[active]);
  const before=await state();await page.reload();await open();assert.deepEqual((await state()).letras,before.letras);assert.deepEqual((await state()).ayudas,before.ayudas);assert.equal((await state()).seleccion,last);
  assert(await page.locator('.pc-activa').isVisible());assert(await page.locator('.pc-activa').evaluate(e=>e.clientWidth>=18),'close view keeps cells readable');
  if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});
  for(let index=0;index<puzzle.palabras.length;index++){
   const wordKeys=keys(puzzle.palabras[index]),s=await state();if(wordKeys.every(k=>s.letras[k]===answers[k]))continue;
   await select(index);
   await page.evaluate(({wordKeys,answers})=>{
    for(let n=0;n<wordKeys.length*2+2;n++){
     const d=JSON.parse(localStorage.getItem('gya_palabras_cruzadas'));if(wordKeys.every(k=>d.letras[k]===answers[k]))return;
     const active=document.querySelector('.pc-activa');if(!active)throw Error('No visible active cell');
     const k=active.dataset.casilla;if(!wordKeys.includes(k))throw Error('Cursor outside selected word');
     PalabrasCruzadas.tecla(answers[k]);
    }
    throw Error('Could not complete word');
   },{wordKeys,answers});
  }
  assert(await page.locator('#pcFinal').isVisible(),'the expanded board still shows its result even when its previous fifty-word version was already won');
  assert.match(await page.locator('#pcResumen').textContent(),new RegExp(puzzle.palabras.length+' palabras'));assert.match(await page.locator('#pcProgreso').textContent(),new RegExp(puzzle.palabras.length+' / '+puzzle.palabras.length));assert.equal((await state()).total,2,'the old win is not counted twice');
  await page.locator('#pcRevisar').click();await page.locator('#pcSiguiente').click();assert.equal((await state()).actual,'pc-3');assert.deepEqual((await state()).letras,{});assert.equal((await state()).total,2);assert.match(await page.locator('#pcProgreso').textContent(),new RegExp('0 / '+puzzles[2].palabras.length));
  assert.deepEqual(errors,[]);console.log('PASS: all 556 published word positions preserved, exactly 50 additions distributed, existing letters/hints/wins preserved, new clues, distant map navigation and automatic close view, focus on errors, reload, readable tiles, full expanded-board completion, no duplicate award and next large board.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
