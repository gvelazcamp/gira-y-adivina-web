const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'palabras-cruzadas-datos.js'),'utf8'),ctx);
const puzzles=ctx.window.PALABRAS_CRUZADAS_DATOS;
const norm=s=>s.toUpperCase().replace(/Ñ/g,'!').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/!/g,'Ñ').replace(/[^A-ZÑ]/g,'');
const cells=p=>{const out=new Map();p.palabras.forEach((w,i)=>{[...norm(w.respuesta)].forEach((l,n)=>{const f=w.fila+(w.direccion==='V'?n:0),c=w.columna+(w.direccion==='H'?n:0),k=f+','+c;if(out.has(k)){assert.equal(out.get(k).letra,l,'crossing letters agree');assert(!out.get(k).dirs.includes(w.direccion),'parallel overlap');}else out.set(k,{f,c,letra:l,dirs:[],palabras:[]});out.get(k).dirs.push(w.direccion);out.get(k).palabras.push(i);});});return out;};
const keys=w=>[...norm(w.respuesta)].map((_,n)=>(w.fila+(w.direccion==='V'?n:0))+','+(w.columna+(w.direccion==='H'?n:0)));
assert.equal(puzzles.length,12);const allAnswers=new Set();
for(const p of puzzles){
 assert.equal(p.palabras.length,p.id==='pc-1'?10:p.nivel>=11?55:54);assert(p.filas<=36&&p.columnas<=36);
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
assert.equal(allAnswers.size,606);
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
  async function selectClue(i,puzzle=puzzles[0]){
   await page.locator('#pcPistasBoton').click();
   await page.locator(puzzle.palabras[i].direccion==='H'?'#pcTabHorizontal':'#pcTabVertical').click();
   for(let n=0;n<puzzle.palabras.length&&!await clue(i).count();n++)await page.locator('#pcPistasSiguiente').click();
   await clue(i).click();assert(await page.locator('#pcPistas').isHidden());
  }
  async function typeWord(w){
   const locked=await page.locator('.pc-correcta,.pc-revelada').evaluateAll(nodes=>nodes.map(e=>e.dataset.casilla));
   const answer=norm(w.respuesta);await page.keyboard.type(keys(w).flatMap((k,i)=>locked.includes(k)?[]:[answer[i]]).join(''));
  }
  await page.goto(base);await loaded();await page.evaluate(()=>Extensiones.abrirLobby());
  assert.equal(await page.getByRole('button',{name:/Palabras Cruzadas/}).count(),1);
  await page.getByRole('button',{name:/Palabras Cruzadas/}).click();
  assert.equal(await page.locator('#extTitulo').textContent(),'Palabras Cruzadas');
  await page.waitForFunction(()=>document.querySelector('.pc-logo').naturalWidth>0);
  assert.equal((await state()).actual,'pc-1');
  assert(await page.locator('#pcAyuda').isVisible(),'first visit explains the game proactively');
  assert.equal(await page.locator('.pc-demo span').count(),6);
  await page.locator('#pcAyuda .pc-entendido').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('gya_palabras_cruzadas')).guiaVista===true);
  assert.equal(await page.locator('.pc-leyenda>span').count(),6);
  assert(await page.locator('.pc-instruccion').isVisible());
  const first=puzzles[0],board=cells(first),w0=first.palabras[0],k0=keys(w0)[0];
  const blank=page.locator('.pc-activa>span');assert.equal(await blank.textContent(),'');
  assert(['none','normal','""'].includes(await blank.evaluate(el=>getComputedStyle(el,'::after').content)),'empty cell has no line or letter-like marker');
  assert.notEqual(await page.locator('.pc-activa').evaluate(el=>getComputedStyle(el).backgroundColor),await page.locator('.pc-seleccionada:not(.pc-activa)').first().evaluate(el=>getComputedStyle(el).backgroundColor),'active cell uses a distinct background');
  await page.keyboard.type('X');assert.equal(await value(k0),'X');
  await page.locator('#pcComprobar').click();assert.equal(await page.locator('.pc-error').count(),1);
  await page.keyboard.press('Backspace');assert.equal(await value(k0),'');
  await selectClue(0);await typeWord(w0);
  assert(await clue(0).evaluate(el=>el.classList.contains('pc-lista')));
  // Every green in a solved word is fixed, through either keyboard and either delete key.
  const solvedLetters=(await state()).letras;
  for(const k of keys(w0)){
   await page.locator('.pc-celda[data-casilla="'+k+'"]').click();
   await page.keyboard.type('X');await page.keyboard.press('Backspace');await page.keyboard.press('Delete');
   await page.getByRole('button',{name:'Letra Z',exact:true}).click();await page.getByRole('button',{name:'Borrar letra',exact:true}).click();
   assert.deepEqual((await state()).letras,solvedLetters,'green '+k+' cannot be overwritten or erased');
  }
  const cross=[...board].find(([,c])=>c.palabras.length===2&&c.palabras.includes(0))[0];
  const crossButton=page.locator('.pc-celda[data-casilla="'+cross+'"]');
  await crossButton.click();const dir=await page.locator('#pcDireccion').textContent();assert(await page.locator('#pcCambiarDireccion').isVisible());await page.locator('#pcCambiarDireccion').click();assert.notEqual(await page.locator('#pcDireccion').textContent(),dir,'explicit button changes direction at a crossing');
  const crossedLetters=(await state()).letras;await page.keyboard.type('Z');await page.keyboard.press('Backspace');assert.deepEqual((await state()).letras,crossedLetters,'a solved crossing stays green and fixed from the unfinished direction');
  const i=first.palabras.findIndex((w,n)=>n!==0&&keys(w).some(k=>!(keys(w0).includes(k))));
  await selectClue(i);const ki=keys(first.palabras[i])[0],letter=norm(first.palabras[i].respuesta)[0];
  await page.getByRole('button',{name:'Letra '+letter,exact:true}).click();assert.equal(await value(ki),letter);
  await page.keyboard.press('Backspace');await selectClue(i);await page.locator('#pcRevelar').click();
  assert.equal((await state()).ayudas.length,1);assert.match(await page.locator('#pcRevelar').textContent(),/2/);
  const hint=(await state()).ayudas[0],hintValue=await value(hint);
  assert.notEqual(await page.locator('.pc-activa').getAttribute('data-casilla'),hint,'help moves to the next editable cell');
  await page.locator('.pc-celda[data-casilla="'+hint+'"]').click();
  assert.match(await page.locator('#pcPosicion').textContent(),/ayuda fija/i);
  await page.keyboard.type(hintValue==='X'?'Y':'X');assert.equal(await value(hint),hintValue,'hint is protected');
  await selectClue(i);await typeWord(first.palabras[i]);
  assert(await clue(i).evaluate(el=>el.classList.contains('pc-lista')));
  const before=await state();await page.reload();await loaded();await page.evaluate(()=>Extensiones.abrirJuego('palabras-cruzadas'));
  assert.deepEqual((await state()).letras,before.letras);assert.deepEqual((await state()).ayudas,before.ayudas);assert(await page.locator('#pcAyuda').isHidden(),'guide is shown once, and remains available on demand');
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
  for(let help=0;help<2;help++){
   const s=await state(),pending=first.palabras.findIndex(w=>keys(w).some(k=>s.letras[k]!==board.get(k).letra));
   await selectClue(pending);await page.locator('#pcRevelar').click();
  }
  assert.equal((await state()).ayudas.length,3);assert(await page.locator('#pcRevelar').isDisabled(),'three-letter help limit');
  for(let n=0;n<first.palabras.length;n++){
   const w=first.palabras[n],s=await state();if(keys(w).every(k=>s.letras[k]===board.get(k).letra))continue;
   await selectClue(n);await typeWord(w);
  }
  assert(await page.locator('#pcFinal').isVisible());assert.equal(await page.locator('dialog:modal').count(),1);
  assert.equal((await state()).total,1);
  await page.keyboard.press('Escape');assert(await page.locator('#pcFinal').isHidden());assert(await page.locator('#pcSiguiente').isVisible());
  await page.locator('#pcVerResultado').click();await page.locator('#pcFinal .pc-cerrar').click();assert.equal((await state()).total,1);
  await page.locator('#pcSiguiente').click();assert.equal((await state()).actual,'pc-2');assert.deepEqual((await state()).letras,{});assert.deepEqual((await state()).ayudas,[]);assert.equal((await state()).total,1);
  // Ñ y respuesta con acento: el tablero conserva Ñ y omite solamente las tildes.
  const withEnye=puzzles.find(p=>p.palabras.some(w=>w.respuesta==='MUÑECO')),enyeIndex=withEnye.palabras.findIndex(w=>w.respuesta==='MUÑECO');
  await page.evaluate(({id,index})=>{const d=JSON.parse(localStorage.getItem('gya_palabras_cruzadas'));d.actual=id;d.seleccion=index;d.letras={};d.ayudas=[];localStorage.setItem('gya_palabras_cruzadas',JSON.stringify(d));},{id:withEnye.id,index:enyeIndex});
  await page.reload();await loaded();await page.evaluate(()=>Extensiones.abrirJuego('palabras-cruzadas'));await selectClue(enyeIndex,withEnye);
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
  await page.locator('#pcAyudaBoton').click();await page.evaluate(()=>Extensiones.cerrar());assert.equal(await page.locator('dialog[open]').count(),0);assert(!(await page.locator('#extShell').evaluate(el=>el.classList.contains('pc-abierta'))));
  const oldContext=await browser.newContext({locale:'es-UY',viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),oldPage=await oldContext.newPage();
  oldPage.on('pageerror',e=>errors.push(e.message));
  await oldPage.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
  assert.equal(norm(w0.respuesta),'GUARDA');
  const oldLetters=Object.fromEntries(keys(w0).slice(0,5).map((k,i)=>[k,'GRAND'[i]]));
  await oldPage.addInitScript(({letras,firstKey})=>{
   localStorage.setItem('gya_nombre','Prueba anterior');localStorage.setItem('gya_avatar','avatar-02');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');
   if(!localStorage.getItem('gya_palabras_cruzadas'))localStorage.setItem('gya_palabras_cruzadas',JSON.stringify({version:1,actual:'pc-1',letras,ayudas:[firstKey],resueltos:[],total:0,seleccion:0}));
  },{letras:oldLetters,firstKey:k0});
  await oldPage.goto(base);await oldPage.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelector('#setup').style.display='none';Extensiones.abrirJuego('palabras-cruzadas');});
  assert(await oldPage.locator('#pcAyuda').isVisible(),'old players also receive the new explanation once');
  if(process.env.GUIDE_SCREENSHOT_PATH)await oldPage.screenshot({path:process.env.GUIDE_SCREENSHOT_PATH,fullPage:true});
  await oldPage.locator('#pcAyuda .pc-entendido').click();
  assert.deepEqual(await oldPage.evaluate(()=>JSON.parse(localStorage.getItem('gya_palabras_cruzadas')).letras),oldLetters,'no progress is lost');
  await oldPage.locator('#pcComprobar').click();
  assert.equal(await oldPage.locator('.pc-error').count(),2);assert.equal(await oldPage.locator('.pc-correcta').count(),3,'checked good letters are explicitly green, even with the word unfinished');
  assert.match(await oldPage.locator('#pcMensaje').textContent(),/3 correctas.*2 incorrectas/);
  assert.match(await oldPage.locator('#pcPosicion').textContent(),/2 de 6/);
  await oldPage.evaluate(()=>document.querySelector('#logroToast')?.classList.remove('ver'));
  if(process.env.ERROR_SCREENSHOT_PATH)await oldPage.screenshot({path:process.env.ERROR_SCREENSHOT_PATH,fullPage:true});
  await oldPage.reload();await oldPage.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelector('#setup').style.display='none';Extensiones.abrirJuego('palabras-cruzadas');});
  assert(await oldPage.locator('#pcAyuda').isHidden());assert.equal(await oldPage.locator('.pc-error').count(),2,'review survives closing and reopening');
  const reviewedLetters=await oldPage.evaluate(()=>JSON.parse(localStorage.getItem('gya_palabras_cruzadas')).letras);
  for(const k of keys(w0).filter((_,i)=>[2,4].includes(i))){
   await oldPage.locator('.pc-celda[data-casilla="'+k+'"]').click();
   assert.match(await oldPage.locator('#pcPosicion').textContent(),/correcta y fija/);
   await oldPage.keyboard.type('X');await oldPage.keyboard.press('Backspace');await oldPage.keyboard.press('Delete');
   await oldPage.getByRole('button',{name:'Letra Z',exact:true}).click();await oldPage.getByRole('button',{name:'Borrar letra',exact:true}).click();
   assert.deepEqual(await oldPage.evaluate(()=>JSON.parse(localStorage.getItem('gya_palabras_cruzadas')).letras),reviewedLetters,'checked green in an unfinished word stays fixed after reload');
  }
  const wrong=keys(w0)[1];await oldPage.locator('.pc-celda[data-casilla="'+wrong+'"]').click();await oldPage.getByRole('button',{name:'Letra U',exact:true}).click();
  await oldPage.locator('#pcComprobar').click();assert.equal(await oldPage.locator('.pc-error').count(),1);assert.equal(await oldPage.locator('.pc-correcta').count(),4);
  await oldPage.evaluate(()=>Extensiones.cerrar());await oldContext.close();
  assert.deepEqual(errors,[]);
  console.log('PASS: 12 valid connected crosswords/606 unique answers (50 additions distributed across every board), real lobby entry, physical/on-screen keyboards, cross direction, proactive guide, persistent legend, individual red/green checks, fixed greens through both keyboards and deletion after reload, empty colorful selection without a caret, hints, old-save upgrade and verified states after reload, native dialogs, responsive grid, win/next from board, Ñ, individual progress unchanged and cleanup.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
