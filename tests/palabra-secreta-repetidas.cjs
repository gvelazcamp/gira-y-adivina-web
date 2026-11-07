const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
 try{
  const context=await browser.newContext({locale:'es-UY',viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
  await page.addInitScript(()=>{
   localStorage.setItem('gya_nombre','Prueba repetidas');localStorage.setItem('gya_avatar','avatar-02');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');
   Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
   Object.defineProperty(navigator,'share',{configurable:true,value:async({files})=>{
    const bitmap=await createImageBitmap(files[0]),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const g=canvas.getContext('2d');g.drawImage(bitmap,0,0);
    const columns=7,gap=14,side=Math.floor((960-(columns-1)*gap)/columns),x0=(1080-(columns*side+(columns-1)*gap))/2,y=272+0*(side+gap)+side*.14;
    window.__shared={type:files[0].type,pixels:[2,3].map(col=>Array.from(g.getImageData(Math.floor(x0+col*(side+gap)+side/2),Math.floor(y),1,1).data))};
   }});
  });
  await page.goto(base);
  async function fixture(words,target='LIBRERO'){
   await page.evaluate(({words,target})=>{
    const nivel=target.length===7?14:7;
    localStorage.setItem('gya_palabra_secreta',JSON.stringify({nivel,ganadas:18,ayudaVista:true,partidaNivel:{objetivo:target,nivel,max:4,repeticiones:0,dia:PalabraSecreta.indiceDia(),intentos:words.map(palabra=>({palabra,colores:PalabraSecreta.evaluar(palabra,target)})),terminada:false,gano:false,cobrada:true}}));
   },{words,target});
   await page.reload();await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelector('#setup').style.display='none';Fichas.usar=()=>true;Extensiones.abrirJuego('palabra-secreta');});
   await page.locator('#psAyudaPanel .sf-principal').click();
  }
  const row=n=>page.locator('#psTablero .ps-fila').nth(n),cell=(n,col)=>row(n).locator('.ps-celda').nth(col);
  await fixture(['CASTIGO','PUBLICO']);
  assert.equal(await page.locator('#psTablero .ps-repetida').count(),0,'letters that appear once in the word never get a stripe');
  await fixture(['PERDIDO']);
  assert.equal(await row(0).locator('.ps-repetida').count(),1,'the first R found already warns that there is another R');
  assert(await cell(0,2).evaluate(e=>e.classList.contains('presente')&&e.classList.contains('ps-repetida')),'yellow R keeps its color and gains a stripe');
  assert(await cell(0,1).evaluate(e=>e.classList.contains('presente')&&!e.classList.contains('ps-repetida')),'single E has no stripe');
  assert(await page.locator('#psTeclado button[aria-label="Letra R"]').evaluate(e=>e.classList.contains('ps-repetida')));
  assert.match(await cell(0,2).getAttribute('aria-label'),/raya violeta: hay otra R más/);
  assert.equal(await page.locator('.ps-leyenda>span').count(),4);assert.match(await page.locator('.ps-leyenda').textContent(),/Raya violeta: hay otra más/);
  const marker=await cell(0,2).evaluate(e=>{const p=getComputedStyle(e,'::after');return{content:p.content,height:parseFloat(p.height),color:p.backgroundColor};});assert.equal(marker.content,'""');assert(marker.height>=3);assert.equal(marker.color,'rgb(194, 79, 255)');
  if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});
  await page.evaluate(()=>PalabraSecreta.tecla('R'));assert.equal(await row(1).locator('.ps-repetida').count(),0,'draft tiles have no clue marks');
  await page.evaluate(()=>{PalabraSecreta.tecla('Backspace');for(const l of 'LIBRERO')PalabraSecreta.tecla(l);PalabraSecreta.tecla('Enter');});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('gya_palabra_secreta')).partidaNivel.terminada);
  assert.equal(await page.locator('#psFinal .ps-final-tablero .ps-repetida').count(),1,'the solved row has every copy placed, so only the first row keeps its stripe');
  await page.locator('.ps-foto-compartir').click();await page.waitForFunction(()=>window.__shared);
  const shared=await page.evaluate(()=>window.__shared);assert.equal(shared.type,'image/png');assert.deepEqual(shared.pixels[0],[194,79,255,255]);assert.notDeepEqual(shared.pixels[1],[194,79,255,255],'the shared photo marks only the R that has another copy');
  await fixture(['RESTARE']);assert.equal(await row(0).locator('.ps-repetida').count(),0,'when both Rs are shown in the row there is nothing left to warn');
  await fixture(['PERDIDO','RESTARE']);assert.equal(await row(0).locator('.ps-repetida').count(),1);assert(await page.locator('#psTeclado button[aria-label="Letra R"]').evaluate(e=>!e.classList.contains('ps-repetida')),'keyboard stripe goes away once both Rs were found');
  await fixture(['ERRARON']);assert.equal(await row(0).locator('.ps-repetida').count(),0);assert(await cell(0,4).evaluate(e=>e.classList.contains('ausente')&&!e.classList.contains('ps-repetida')),'a third gray R is an excess copy and has no stripe');
  await fixture(['MANTEL'],'BANANA');assert.equal(await row(0).locator('.exacta.ps-repetida').count(),2,'one A of three and one N of two both warn');
  await fixture(['CASACA'],'BANANA');assert.equal(await row(0).locator('.ps-repetida').count(),0,'all three As placed: no stripe');
  await page.locator('#psAyuda').click();assert.match(await page.locator('#psAyudaPanel').textContent(),/palabras completas/);assert.match(await page.locator('#psAyudaPanel').textContent(),/Raya violeta: hay otra O más/);
  assert.deepEqual(errors,[]);console.log('PASS: stripe means another copy is still missing in that row, yellow/green stripes, excess gray copies, triple letters, keyboard, accessible legend, draft, final result and real shared PNG pixels.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
