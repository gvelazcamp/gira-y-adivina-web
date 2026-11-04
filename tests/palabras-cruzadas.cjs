const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'palabras-cruzadas-datos.js'),'utf8'),ctx);
const puzzles=ctx.window.PALABRAS_CRUZADAS_DATOS;
const norm=s=>s.toUpperCase().replace(/Ñ/g,'!').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/!/g,'Ñ').replace(/[^A-ZÑ]/g,'');
const cells=p=>{const out=new Map();p.palabras.forEach((w,i)=>{[...norm(w.respuesta)].forEach((l,n)=>{const f=w.fila+(w.direccion==='V'?n:0),c=w.columna+(w.direccion==='H'?n:0),k=f+','+c;if(out.has(k)){assert.equal(out.get(k).letra,l,'crossing letters agree');assert(!out.get(k).dirs.includes(w.direccion),'parallel overlap');}else out.set(k,{f,c,letra:l,dirs:[],palabras:[]});out.get(k).dirs.push(w.direccion);out.get(k).palabras.push(i);});});return out;};
const keys=w=>[...norm(w.respuesta)].map((_,n)=>(w.fila+(w.direccion==='V'?n:0))+','+(w.columna+(w.direccion==='H'?n:0)));
assert.equal(puzzles.length,12);const allAnswers=new Set();
for(const p of puzzles){
 assert.equal(p.palabras.length,6);assert(p.filas<=11&&p.columnas<=11);
 const board=cells(p);
 for(const w of p.palabras){assert(w.pista);const answer=norm(w.respuesta);assert(!allAnswers.has(answer));allAnswers.add(answer);for(const k of keys(w)){const c=board.get(k);assert(c.f>=0&&c.f<p.filas&&c.c>=0&&c.c<p.columnas);}}
 const connected=new Set([0]);let change=true;while(change){change=false;for(const c of board.values())if(c.palabras.some(i=>connected.has(i)))for(const i of c.palabras)if(!connected.has(i)){connected.add(i);change=true;}}
 assert.equal(connected.size,p.palabras.length,'all clues belong to one connected crossword');
 // Every horizontal/vertical run of 2+ cells has exactly one full clue.
 for(const dir of ['H','V'])for(const c of board.values()){
  const prev=(c.f-(dir==='V'?1:0))+','+(c.c-(dir==='H'?1:0));if(board.has(prev))continue;
  const run=[];let f=c.f,col=c.c;while(board.has(f+','+col)){run.push(f+','+col);if(dir==='H')col++;else f++;}
  if(run.length>1)assert.equal(p.palabras.filter(w=>w.direccion===dir&&keys(w).join('|')===run.join('|')).length,1,'unclued or duplicate run');
 }
}
assert.equal(allAnswers.size,72);
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
 try{
  const context=await browser.newContext({locale:'es-UY',viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
  await page.addInitScript(()=>{localStorage.setItem('gya_nombre','Prueba crucigrama');localStorage.setItem('gya_avatar','avatar-02');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');localStorage.setItem('gya_palabra_secreta',JSON.stringify({nivel:9,partidaNivel:null,ganadas:14}));});
  async function loaded(){await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelector('#setup').style.display='none';window.__pcCharges=0;Fichas.usar=()=>{window.__pcCharges++;return true;};});}
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gya_palabras_cruzadas')));
  const value=k=>page.locator('.pc-celda[data-casilla="'+k+'"]>span').textContent();
  const clue=i=>page.locator('.pc-pista[data-palabra="'+i+'"]');
  await page.goto(base);await loaded();await page.evaluate(()=>Extensiones.abrirLobby());
  assert.equal(await page.getByRole('button',{name:/Palabras Cruzadas/}).count(),1);
  await page.getByRole('button',{name:/Palabras Cruzadas/}).click();
  assert.equal(await page.locator('#extTitulo').textContent(),'Palabras Cruzadas');
  await page.waitForFunction(()=>document.querySelector('.pc-logo').naturalWidth>0);
  assert.equal((await state()).actual,'pc-1');
  const first=puzzles[0],board=cells(first),w0=first.palabras[0],k0=keys(w0)[0];
  await page.keyboard.type('X');assert.equal(await value(k0),'X');
  await page.locator('#pcComprobar').click();assert.equal(await page.locator('.pc-error').count(),1);
  await page.keyboard.press('Backspace');assert.equal(await value(k0),'');
  await clue(0).click();await page.keyboard.type(norm(w0.respuesta).toLowerCase());
  assert(await clue(0).evaluate(el=>el.classList.contains('pc-lista')));
  const cross=[...board].find(([,c])=>c.palabras.length===2&&c.palabras.includes(0))[0];
  const crossButton=page.locator('.pc-celda[data-casilla="'+cross+'"]');
  await crossButton.click();const dir=await page.locator('#pcDireccion').textContent();await crossButton.click();assert.notEqual(await page.locator('#pcDireccion').textContent(),dir,'tap crossing toggles direction');
  const i=first.palabras.findIndex((w,n)=>n!==0&&keys(w).some(k=>!(keys(w0).includes(k))));
  await clue(i).click();const ki=keys(first.palabras[i])[0],letter=norm(first.palabras[i].respuesta)[0];
  await page.getByRole('button',{name:'Letra '+letter,exact:true}).click();assert.equal(await value(ki),letter);
  await page.keyboard.press('Backspace');await clue(i).click();await page.locator('#pcRevelar').click();
  assert.equal((await state()).ayudas.length,1);assert.match(await page.locator('#pcRevelar').textContent(),/2/);
  const hint=(await state()).ayudas[0],hintValue=await value(hint);
  await page.keyboard.type(hintValue==='X'?'Y':'X');assert.equal(await value(hint),hintValue,'hint is protected');
  await clue(i).click();await page.keyboard.type(norm(first.palabras[i].respuesta));
  assert(await clue(i).evaluate(el=>el.classList.contains('pc-lista')));
  const before=await state();await page.reload();await loaded();await page.evaluate(()=>Extensiones.abrirJuego('palabras-cruzadas'));
  assert.deepEqual((await state()).letras,before.letras);assert.deepEqual((await state()).ayudas,before.ayudas);
  await page.locator('#pcAyudaBoton').click();assert(await page.locator('#pcAyuda').isVisible());
  const letters=(await state()).letras;await page.keyboard.type('ABC');assert.deepEqual((await state()).letras,letters);
  await page.keyboard.press('Escape');assert(await page.locator('#pcAyuda').isHidden());assert(await page.locator('#extShell').isVisible());
  for(const size of [{width:360,height:640},{width:390,height:844},{width:844,height:390},{width:1280,height:900}]){
   await page.setViewportSize(size);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
   const grid=await page.locator('#pcGrilla').boundingBox();assert(grid.x>=0&&grid.x+grid.width<=size.width,'grid fits screen');
  }
  await page.setViewportSize({width:390,height:844});
  if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});
  await page.locator('#pcRevelar').click();await page.locator('#pcRevelar').click();
  assert.equal((await state()).ayudas.length,3);assert(await page.locator('#pcRevelar').isDisabled(),'three-letter help limit');
  for(let n=0;n<first.palabras.length;n++){
   const w=first.palabras[n],s=await state();if(keys(w).every(k=>s.letras[k]===board.get(k).letra))continue;
   await clue(n).click();await page.keyboard.type(norm(w.respuesta));
  }
  assert(await page.locator('#pcFinal').isVisible());assert.equal(await page.locator('dialog:modal').count(),1);
  assert.equal((await state()).total,1);
  await page.keyboard.press('Escape');assert(await page.locator('#pcFinal').isHidden());assert(await page.locator('#pcSiguiente').isVisible());
  await page.locator('#pcVerResultado').click();await page.locator('#pcFinal .pc-cerrar').click();assert.equal((await state()).total,1);
  await page.locator('#pcSiguiente').click();assert.equal((await state()).actual,'pc-2');assert.deepEqual((await state()).letras,{});assert.deepEqual((await state()).ayudas,[]);assert.equal((await state()).total,1);
  // Ñ y respuesta con acento: el tablero conserva Ñ y omite solamente las tildes.
  const withEnye=puzzles.find(p=>p.palabras.some(w=>w.respuesta==='MUÑECO')),enyeIndex=withEnye.palabras.findIndex(w=>w.respuesta==='MUÑECO');
  await page.evaluate(({id,index})=>{const d=JSON.parse(localStorage.getItem('gya_palabras_cruzadas'));d.actual=id;d.seleccion=index;d.letras={};d.ayudas=[];localStorage.setItem('gya_palabras_cruzadas',JSON.stringify(d));},{id:withEnye.id,index:enyeIndex});
  await page.reload();await loaded();await page.evaluate(()=>Extensiones.abrirJuego('palabras-cruzadas'));await clue(enyeIndex).click();
  for(const l of 'MUÑECO')await page.getByRole('button',{name:'Letra '+l,exact:true}).click();
  assert(await clue(enyeIndex).evaluate(el=>el.classList.contains('pc-lista')));
  assert(Object.values((await state()).letras).includes('Ñ'));
  // Una colección terminada permite empezar de nuevo sin perder el contador acumulado.
  const last=puzzles.at(-1),finished=Object.fromEntries([...cells(last)].map(([k,c])=>[k,c.letra]));
  await page.evaluate(({id,letras,ids})=>{const d=JSON.parse(localStorage.getItem('gya_palabras_cruzadas'));d.actual=id;d.letras=letras;d.ayudas=[];d.resueltos=ids;d.total=12;localStorage.setItem('gya_palabras_cruzadas',JSON.stringify(d));},{id:last.id,letras:finished,ids:puzzles.map(p=>p.id)});
  await page.reload();await loaded();await page.evaluate(()=>Extensiones.abrirJuego('palabras-cruzadas'));
  assert.equal(await page.locator('#pcSiguiente').textContent(),'Volver a empezar');await page.locator('#pcSiguiente').click();
  assert.equal((await state()).actual,'pc-1');assert.equal((await state()).total,12);assert.deepEqual((await state()).resueltos,[]);
  assert.equal(await page.evaluate(()=>window.__pcCharges),0);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('gya_palabra_secreta'))),{nivel:9,partidaNivel:null,ganadas:14});
  await page.locator('#pcAyudaBoton').click();await page.evaluate(()=>Extensiones.cerrar());assert.equal(await page.locator('dialog[open]').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: 12 valid connected crosswords/72 unique answers, real lobby entry, physical/on-screen keyboards, cross direction, errors/hints, saved game, native dialogs, responsive grid, win/next from board, Ñ, individual progress unchanged and cleanup.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
