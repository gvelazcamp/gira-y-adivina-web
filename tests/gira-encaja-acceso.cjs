const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  try{
    for(const name of ['Gonzalo','Vale','Ana','Meg','Grace','Juan e.','Vale.','Valeria']){
      const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
      await page.addInitScript(name=>{
        localStorage.setItem('gya_nombre',name);localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');
        localStorage.setItem('gya_fichas_ext',JSON.stringify({'rosco-rioplatense':{n:0,prox:Date.now()+20*60*1000}}));
      },name);
      await page.goto(base,{waitUntil:'load'});
      await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');Extensiones.abrirLobby();});
      const allowed=['Gonzalo','Vale'].includes(name),card=page.locator('.ext-tarjeta').filter({hasText:'Girá y encajá'});
      assert.equal(await card.count(),allowed?1:0,name+': catalog visibility');
      const before=await page.evaluate(()=>localStorage.getItem('gya_fichas_ext'));
      if(allowed){
        await card.click();assert.equal(await page.locator('.ge-game').count(),1);
        await page.locator('[data-start]').click();
        const canvas=page.locator('.ge-canvas'),label=await canvas.getAttribute('aria-label');assert.match(label,/1 en caída/);
        await page.locator('.ge-rotate').click();assert.notEqual(await canvas.getAttribute('aria-label'),label,'rotation works for '+name);
        await page.locator('.ge-pause').click();assert.equal(await page.locator('[data-resume]').count(),1);await page.locator('[data-resume]').click();
        assert.equal(await page.locator('.fx-capa').count(),0);assert.equal(await page.locator('#extFichas').evaluate(e=>e.hidden),true);
        await page.evaluate(()=>Extensiones.cerrar());assert.equal(await page.locator('.ge-game').count(),0);
      }else{
        await page.evaluate(()=>Extensiones.abrirJuego('gira-encaja'));assert.equal(await page.locator('.ge-game').count(),0,name+': direct catalog opening blocked');
      }
      await page.evaluate(()=>GiraEncaja.abrir(document.body));assert.equal(await page.locator('.ge-game').count(),allowed?1:0,name+': module uses same permission');
      await page.evaluate(()=>GiraEncaja.salir());
      assert.equal(await page.evaluate(()=>localStorage.getItem('gya_fichas_ext')),before,name+': no rayitos charged');assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('PASS Girá y encajá access: Gonzalo/Vale can open and play; six other profiles blocked in catalog and module; no rayitos charged');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
