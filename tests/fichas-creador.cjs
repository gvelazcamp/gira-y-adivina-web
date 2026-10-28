const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://local').pathname;
  const file=path.join(root,pathname==='/'?'index.html':pathname);
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
    for(const name of ['Gonzalo','Pepe']){
      const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});
      const page=await context.newPage();
      await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:''}));
      await page.addInitScript(n=>{
        localStorage.setItem('gya_nombre',n);
        localStorage.setItem('gya_pais','uruguay');
        localStorage.setItem('gya_bienvenida_vista','1');
        localStorage.setItem('gya_fichas_ext',JSON.stringify({'rosco-rioplatense':{n:0,prox:Date.now()+20*60*1000}}));
      },name);
      await page.goto(base,{waitUntil:'load'});
      await page.evaluate(()=>{
        document.querySelector('#splash')?.remove();
        document.documentElement.classList.remove('cargando');
        document.querySelector('#setup').style.display='none';
        Extensiones.abrirJuego('rosco-rioplatense');
      });
      const before=await page.evaluate(()=>({chip:document.querySelector('#extFichas').textContent,card:Fichas.etiqueta('rosco-rioplatense'),saved:localStorage.getItem('gya_fichas_ext')}));
      await page.locator('#rrPanel button.rr-principal').first().click();
      const after=await page.evaluate(()=>({playing:!document.querySelector('#rrJuego').hidden,blocked:!!document.querySelector('.fx-capa'),saved:localStorage.getItem('gya_fichas_ext')}));
      if(name==='Gonzalo'){
        assert.equal(before.chip,'⚡⚡⚡');
        assert.equal(before.card,'⚡⚡⚡');
        assert(!before.chip.includes('en '),'creator sees no timer');
        assert(after.playing&&!after.blocked,'creator can play with stored zero fichas');
        assert.equal(after.saved,before.saved,'creator fichas are not consumed');
      }else{
        assert(after.blocked&&!after.playing,'other players keep the fichas limit');
      }
      await context.close();
    }
    console.log('PASS creator rayitos stay visible without waiting or spending fichas');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
