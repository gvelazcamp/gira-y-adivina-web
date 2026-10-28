const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://local').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',{'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const base='http://127.0.0.1:'+server.address().port;
    await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:''}));
    await page.addInitScript(()=>{localStorage.setItem('gya_nombre','Gonzalo');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');});
    await page.goto(base);
    await page.evaluate(()=>localStorage.setItem('gya_idioma','es'));
    await page.reload();
    await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelector('#setup').style.display='none';Extensiones.abrirLobby();});
    const tv=page.locator('.ext-selector-modo [data-modo="tv"]');
    assert(await tv.isVisible(),'Debe verse el selector TV en Extensiones');
    for(const [width,height] of [[390,844],[700,320]]){
      await page.setViewportSize({width,height});
      await tv.click();
      const dialog=page.locator('.ext-tv-aviso');assert(await dialog.isVisible());
      assert.match(await dialog.innerText(),/formato horizontal/);
      assert.match(await dialog.innerText(),/micrófono/);
      assert.match(await dialog.innerText(),/teclado adaptado/);
      const box=await page.locator('.ext-tv-aviso-caja').boundingBox();
      assert(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height,`Aviso fuera de ${width}x${height}: ${JSON.stringify(box)}`);
      assert(await page.locator('.ext-tv-aviso-caja').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'El aviso no debe requerir scroll lateral');
      if(process.env.UI_SCREENSHOTS)await page.screenshot({path:path.join(process.env.UI_SCREENSHOTS,`tv-info-${width}.png`)});
      assert.equal(await tv.getAttribute('aria-pressed'),'false','Abrir el aviso no activa TV todavía');
      if(width===390){
        await page.keyboard.press('Escape');assert.equal(await dialog.count(),0,'Escape cierra el aviso');
        await tv.click();await dialog.locator('[data-tv="no"]').click();
        assert.equal(await tv.getAttribute('aria-pressed'),'false','Ahora no conserva el modo Celular');
      }else{
        await dialog.locator('[data-tv="si"]').click();
        assert.equal(await dialog.count(),0,'Usar modo TV cierra el aviso');
        assert.equal(await tv.getAttribute('aria-pressed'),'true','Usar modo TV selecciona TV');
        await page.locator('.ext-selector-modo [data-modo="celular"]').click();
        assert.equal(await tv.getAttribute('aria-pressed'),'false','Celular desactiva TV');
      }
    }
    await page.evaluate(()=>localStorage.setItem('gya_idioma','en'));
    await page.reload();
    await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelector('#setup').style.display='none';Extensiones.abrirLobby();});
    await page.locator('.ext-selector-modo [data-modo="tv"]').click();
    assert.match(await page.locator('.ext-tv-aviso').innerText(),/horizontal layout/,'El aviso debe traducirse en inglés');
    assert.match(await page.locator('.ext-tv-aviso').innerText(),/microphone/);
    assert.deepEqual(errors,[]);
    console.log('PASS aviso de modo TV: explicación, cierre y selección en vertical y horizontal');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
