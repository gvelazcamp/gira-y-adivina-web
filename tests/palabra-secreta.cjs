const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 const file=path.join(root,pathname==='/'?'index.html':pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
async function open(page,base){
 await page.goto(base);
 await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.querySelectorAll('.capa.ver').forEach(e=>e.classList.remove('ver'));const host=document.createElement('div');host.id='psTestHost';document.body.append(host);PalabraSecreta.abrir(host);});
 await page.locator('#psAyudaPanel button').click();
}
async function guess(page,word){await page.evaluate(w=>{for(const letter of w)PalabraSecreta.tecla(letter);PalabraSecreta.tecla('Enter');},word);}
async function state(page){return page.evaluate(()=>({data:JSON.parse(localStorage.getItem('gya_palabra_secreta')),seen:JSON.parse(localStorage.getItem('gya_vistas_palabra'))||[],rows:document.querySelectorAll('#psTablero .ps-fila').length,label:document.querySelector('#psReto').textContent}));}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
  const context=await browser.newContext({viewport:{width:360,height:780},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:''}));
  await page.addInitScript(()=>{localStorage.setItem('gya_bienvenida_vista','1');localStorage.setItem('gya_nombre','Prueba');if(!localStorage.getItem('gya_palabra_secreta'))localStorage.setItem('gya_palabra_secreta',JSON.stringify({diaria:{dia:1,objetivo:'ASADO'},ganadas:3,jugadas:4,distribucion:[1,0,0,0,0,0]}));});
  await open(page,base);
  await page.evaluate(()=>{window.psCharges=0;Fichas.usar=()=>{window.psCharges++;return true;};});
  let s=await state(page);assert.equal(s.data.nivel,1);assert.equal(s.rows,6);assert.match(s.label,/Nivel 1 · 6 intentos/);assert.notEqual(s.data.partidaNivel.objetivo,'ASADO');assert(s.seen.includes('ASADO'));
  const first=s.data.partidaNivel.objetivo;
  const miss=await page.evaluate(secret=>PALABRA_SECRETAS.find(w=>w!==secret),first);
  await guess(page,miss);s=await state(page);assert.equal(s.data.partidaNivel.intentos.length,1);assert.equal(await page.evaluate(()=>window.psCharges),1);
  await page.reload();await page.evaluate(()=>{document.querySelector('#splash')?.remove();const host=document.createElement('div');host.id='psTestHost';document.body.append(host);PalabraSecreta.abrir(host);window.psCharges=0;Fichas.usar=()=>{window.psCharges++;return true;};});await page.locator('#psAyudaPanel button').click();
  s=await state(page);assert.equal(s.data.partidaNivel.objetivo,first);assert.equal(s.data.partidaNivel.intentos.length,1);
  await guess(page,first);s=await state(page);assert.equal(s.data.nivel,2);assert.equal(s.data.ganadas,4);assert.equal(s.data.distribucion[1],1);assert.equal(await page.evaluate(()=>window.psCharges),0,'reload must not charge same word again');
  assert.match(await page.locator('#psFinal').textContent(),/Pasaste al nivel 2/);
  assert.match(await page.evaluate(()=>PalabraSecreta.textoCompartir()),/nivel 1: la saqué en 2\/6/);
  await page.locator('#psFinal button').filter({hasText:'Jugar nivel 2'}).click();s=await state(page);assert.equal(s.rows,5);assert.match(s.label,/Nivel 2 · 5 intentos/);assert.notEqual(s.data.partidaNivel.objetivo,first);
  const second=s.data.partidaNivel.objetivo;await guess(page,second);s=await state(page);assert.equal(s.data.nivel,3);await page.locator('#psFinal button').filter({hasText:'Jugar nivel 3'}).click();s=await state(page);assert.equal(s.rows,4);assert.match(s.label,/primera palabra que pensás/);
  const third=s.data.partidaNivel.objetivo;await guess(page,third);await page.locator('#psFinal button').filter({hasText:'Jugar nivel 4'}).click();s=await state(page);assert.equal(s.rows,3);assert.equal(s.data.nivel,4);const fourth=s.data.partidaNivel.objetivo;
  assert.equal(new Set([first,second,third,fourth]).size,4,'no target repeats across levels');
  const wrong=await page.evaluate(secret=>PALABRA_SECRETAS.find(w=>w!==secret),fourth);
  for(let i=0;i<3;i++)await guess(page,wrong);
  s=await state(page);assert(s.data.partidaNivel.terminada);assert.equal(s.data.nivel,4,'loss keeps current level');
  await page.locator('#psFinal button').filter({hasText:'Otra palabra del nivel 4'}).click();s=await state(page);assert.equal(s.rows,3);assert.notEqual(s.data.partidaNivel.objetivo,fourth);assert.equal(s.data.nivel,4);
  const solo=s.data.partidaNivel.objetivo;
  await page.evaluate(()=>{Duelo.mostrarLobby=(_nombre,_juego,opts)=>opts.onListo(true);Duelo.onProgresoRival=()=>{};Duelo.enviarRonda=()=>{};Duelo.mostrarBadge=()=>{};Duelo.actualizarBadge=()=>{};document.querySelector('#psDuelo').click();});
  s=await state(page);assert.equal(s.rows,6,'duel keeps six attempts');assert.match(s.label,/Duelo · 6 intentos/);assert.equal(s.data.partidaNivel.objetivo,solo,'duel does not replace solo level');
  assert.equal(errors.length,0,errors.join('\n'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile page should fit viewport');
  await context.close();console.log('Palabra Secreta levels: OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
