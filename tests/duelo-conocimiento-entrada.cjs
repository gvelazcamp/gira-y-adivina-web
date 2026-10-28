const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.join(root,new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader('Content-Type',{'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    for(const [width,height] of [[320,486],[360,558],[390,762],[700,238],[844,308]]){
      const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});
      await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:''}));
      await page.goto(base+'/duelo-conocimiento.html',{waitUntil:'load'});
      await page.locator('[data-mode=bot]').waitFor();
      await page.waitForTimeout(650);
      const measure=await page.evaluate(()=>{
        const card=document.querySelector('#setup-form'),start=card.querySelector('button[type=submit]');
        const a=card.getBoundingClientRect(),b=start.getBoundingClientRect();
        return{top:a.top,bottom:a.bottom,left:a.left,right:a.right,buttonBottom:b.bottom,scroll:card.scrollHeight-card.clientHeight,sideScroll:document.documentElement.scrollWidth-innerWidth};
      });
      assert(measure.top>=0&&measure.bottom<=height&&measure.left>=0&&measure.right<=width,`entrada fuera de pantalla ${width}x${height}: ${JSON.stringify(measure)}`);
      assert(measure.buttonBottom<=height&&measure.scroll<=1&&measure.sideScroll<=0,`hay que desplazarse para empezar ${width}x${height}: ${JSON.stringify(measure)}`);
      await page.locator('[data-mode=online]').click();
      const online=await page.evaluate(()=>{
        const card=document.querySelector('#setup-form'),start=card.querySelector('button[type=submit]');
        const r=card.getBoundingClientRect();
        return{top:r.top,bottom:r.bottom,scroll:card.scrollHeight-card.clientHeight,buttonBottom:start.getBoundingClientRect().bottom};
      });
      assert(online.top>=0&&online.bottom<=height&&online.buttonBottom<=height&&online.scroll<=1,`entrada online fuera de pantalla ${width}x${height}: ${JSON.stringify(online)}`);
      if(width===390){
        await page.locator('[data-mode=bot]').click();
        assert.equal(await page.locator('#input0').inputValue(),'');
        assert.equal(await page.locator('#input1').inputValue(),'Sofía');
        await page.locator('#setup-form button[type=submit]').click();
        assert.equal(await page.locator('#setup-overlay').evaluate(el=>el.classList.contains('hidden')),false,'no inicia sin nombre');
        await page.locator('#input0').fill('Gonzalo');
        await page.locator('[data-mode=local]').click();
        await page.locator('#input1').fill('Martina');
        await page.locator('[data-mode=bot]').click();
        assert.equal(await page.locator('#input1').inputValue(),'Sofía');
        await page.locator('[data-mode=local]').click();
        assert.equal(await page.locator('#input1').inputValue(),'Martina','conserva el nombre local');
        await page.locator('[data-answer=text]').click();
        assert.equal(await page.locator('[data-answer=text]').getAttribute('aria-pressed'),'true');
        await page.locator('#setup-form button[type=submit]').click();
        assert.equal(await page.locator('#setup-overlay').evaluate(el=>el.classList.contains('hidden')),true,'inicia la partida');
        assert.equal(await page.locator('#roulette-name0').textContent(),'GONZALO');
        assert.equal(await page.locator('#roulette-name1').textContent(),'MARTINA');
        await page.locator('#new-btn').evaluate(button=>button.click());
        assert.equal(await page.locator('#input0').inputValue(),'','al volver la entrada queda vacía');
      }
      await page.close();
    }
    console.log('PASS Duelo: entrada visible en 5 tamaños; nombres, modos y reinicio correctos');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
