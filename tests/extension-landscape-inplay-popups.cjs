const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://local').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',{'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
const inspect=async(page,selector)=>page.locator(selector).evaluate(el=>{
  if(!el.getClientRects().length)throw Error(`${selector} no está visible`);
  const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scrollX:el.scrollWidth-el.clientWidth,scrollY:el.scrollHeight-el.clientHeight,viewportWidth:innerWidth,viewportHeight:innerHeight};
});
const fits=(box,name)=>{
  assert(box.x>=-1&&box.x+box.width<=box.viewportWidth+1,`${name} fuera del ancho: ${JSON.stringify(box)}`);
  assert(box.y>=-1&&box.y+box.height<=box.viewportHeight+1,`${name} fuera del alto: ${JSON.stringify(box)}`);
  assert(box.scrollX<=1,`${name} requiere scroll horizontal: ${JSON.stringify(box)}`);
};
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  try{
    const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const base='http://127.0.0.1:'+server.address().port;
    await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:''}));
    await page.addInitScript(()=>{localStorage.setItem('gya_nombre','Gonzalo');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');});
    await page.goto(base);
    await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelector('#setup').style.display='none';Fichas.usar=()=>true;});
    for(const [width,height] of [[844,390],[700,320]]){
      await page.setViewportSize({width,height});
      await page.evaluate(()=>{Extensiones.cerrar();Extensiones.abrirJuego('que-numero-soy');});
      await page.locator('.pf-bienv-ok').click();await page.locator('#qnsEmpezar').click();await page.locator('#qnsSalir').click();
      fits(await inspect(page,'.pf-confirmar .pf-caja'),`confirmación ${width}`);
      await page.locator('.pf-confirmar [data-r="si"]').click();
      fits(await inspect(page,'#qnsFin .qns-panel'),`resultado número ${width}`);
      await page.evaluate(()=>{Extensiones.cerrar();Extensiones.abrirJuego('bomba');});
      await page.locator('.pf-bienv-ok').click();await page.locator('#bbEmpezar').click();
      await page.evaluate(()=>{window.__oldDateNow=Date.now;Date.now=()=>window.__oldDateNow()+60000;});
      await page.locator('#bbBoom').waitFor({state:'attached'});
      await page.evaluate(()=>{Date.now=window.__oldDateNow;});
      fits(await inspect(page,'#bbBoom .bb-panel'),`resultado Bomba ${width}`);
      await page.evaluate(()=>{Extensiones.cerrar();Extensiones.abrirJuego('palabra-secreta');});
      await page.locator('#psAyudaPanel .sf-principal').click();await page.locator('#psVozNo').click();
      await page.locator('#psEstadisticas').click();fits(await inspect(page,'#psAyudaPanel .sf-panel'),`estadísticas palabra ${width}`);
      await page.locator('#psAyudaPanel .sf-principal').click();
      await page.evaluate(()=>{const word=JSON.parse(localStorage.getItem('gya_palabra_secreta')).partidaNivel.objetivo;for(const letter of word)PalabraSecreta.tecla(letter);PalabraSecreta.tecla('Enter');});
      fits(await inspect(page,'#psFinal .ps-final-caja'),`resultado palabra ${width}`);
      await page.evaluate(()=>{Extensiones.cerrar();Extensiones.abrirJuego('rosco-rioplatense');});
      fits(await inspect(page,'#rrPanel .rr-panel'),`inicio rosco ${width}`);
      await page.locator('#rrPanel .rr-principal').click();
      await page.waitForFunction(()=>document.querySelector('.rr-game')?.dataset.fase==='resolver');
      await page.evaluate(()=>{window.__oldPerfNow=performance.now.bind(performance);Object.defineProperty(performance,'now',{configurable:true,value:()=>window.__oldPerfNow()+600000});});
      await page.waitForFunction(()=>document.querySelector('.rr-game')?.dataset.fase==='fin');
      await page.evaluate(()=>{delete performance.now;});
      fits(await inspect(page,'#rrPanel .rr-panel'),`resultado rosco ${width}`);
      const review=await inspect(page,'#rrPanel .rr-resumen');
      assert(review.scrollX<=1,`respuestas del Rosco ${width} requieren desplazamiento lateral: ${JSON.stringify(review)}`);
      if(process.env.UI_SCREENSHOTS)await page.screenshot({path:path.join(process.env.UI_SCREENSHOTS,`rosco-result-${width}.png`)});
      await page.evaluate(todas=>{
        if(todas)localStorage.setItem('gya_tutti',JSON.stringify({cats:['Nombre','Apellido','País o ciudad','Comida','Animal','Color','Marca','Fruta o verdura','Cosa','Profesión','Famoso','Película o serie'],tiempo:90}));
        Extensiones.cerrar();Extensiones.abrirJuego('tutti-frutti');
      },width===700);
      await page.locator('#tfBienvOk').click();await page.locator('#tfBots').click();
      fits(await inspect(page,'.tf-modos .pf-caja'),`elegir rivales ${width}`);
      if(process.env.UI_SCREENSHOTS)await page.screenshot({path:path.join(process.env.UI_SCREENSHOTS,`tutti-rivals-${width}.png`)});
      await page.clock.install();
      await page.locator('.tf-modos [data-m="normal"]').click();
      await page.clock.runFor(10000);
      await page.locator('#tfVozNo').click();
      await page.clock.runFor(4000);
      assert(await page.locator('#tfInput').count(),`Tutti Frutti no arrancó: ${await page.locator('#extContenido').innerText()}`);
      await page.clock.fastForward(110000);
      await page.locator('#tfGrilla').waitFor({state:'attached'});
      fits(await inspect(page,'.tf .tf-res'),`resultado Tutti Frutti ${width}`);
      const grid=await inspect(page,'.tf .tf-grilla-caja');
      assert(grid.scrollX<=1,`resultado Tutti Frutti ${width} requiere desplazamiento lateral: ${JSON.stringify(grid)}`);
      const cells=await inspect(page,'.tf .tf-grilla');
      assert(cells.scrollX<=1,`casillas de Tutti Frutti ${width} requieren desplazamiento lateral: ${JSON.stringify(cells)}`);
      await page.locator('#tfAnular').click();
      fits(await inspect(page,'.tf-anular .pf-caja'),`anular respuesta ${width}`);
      const choices=await inspect(page,'.tf-anular-lista');
      assert(choices.scrollX<=1,`lista para anular ${width} requiere desplazamiento lateral: ${JSON.stringify(choices)}`);
      await page.locator('.tf-anular [data-x]').click();
      if(process.env.UI_SCREENSHOTS)await page.screenshot({path:path.join(process.env.UI_SCREENSHOTS,`tutti-result-${width}.png`)});
      await page.clock.resume();
    }
    assert.deepEqual(errors,[]);
    console.log('PASS cuadros durante y al terminar: confirmación, número, Bomba, palabra, rosco y Tutti Frutti en 2 tamaños');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
