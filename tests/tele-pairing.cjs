const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  const context=await browser.newContext({serviceWorkers:'block'}),errors=[];
  const open=async(url,w,h)=>{const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setViewportSize({width:w,height:h});await p.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));await p.goto(base+url);return p;};
  try{
    const tv=await open('/tele/?telered=local',1920,1080);
    await tv.locator('#tvLink').click();
    await tv.locator('.tl-codigo').waitFor();
    const code=await tv.locator('.tl-codigo').textContent();
    await tv.reload();
    assert.equal(await tv.locator('.tl-codigo').textContent(),code,'La tele cambió el código al recargar');
    const phone=await open('/index.html',390,844);
    await phone.locator('#bTV').waitFor({state:'visible'});
    await phone.locator('#bTV').click({force:true});
    await phone.waitForURL(/\/tele\/$/);
    await phone.goto(base+'/tele/?telered=local');
    assert(!(await phone.locator('#linked').isVisible()),'Apareció una tele vinculada antes de conectar');
    await phone.locator('#n').fill('Ana');await phone.locator('#c').fill(code);
    await phone.locator('#f button').click();
    await tv.waitForFunction(()=>document.querySelector('.tl-jugadores')?.textContent.includes('Ana'));
    assert.equal(await phone.evaluate(()=>localStorage.getItem('gya_tele_vinculada')),code,'El celular no guardó la vinculación confirmada');
    await phone.goto(base+'/tele/?telered=local');
    await phone.locator('#linked').waitFor({state:'visible'});
    await phone.locator('#quickStart').click();
    await phone.locator('[data-j="rosco"]').waitFor();
    await tv.reload();
    assert.equal(await tv.locator('.tl-codigo').textContent(),code,'La tele perdió su código vinculado');
    await tv.waitForFunction(()=>document.querySelector('.tl-jugadores')?.textContent.includes('Ana'),null,{timeout:10000});
    await phone.locator('[data-j="rosco"]').click();
    await tv.locator('.tl-rosco').waitFor();
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('PASS Sala TV: dirección corta, vinculación inicial, código estable y creación posterior con un toque');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
