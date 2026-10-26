const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://local').pathname;
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:1280,height:800}}),errors=[];
  const open=async url=>{const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>{
    const u=r.request().url();if(u.startsWith(base))return r.continue();return r.fulfill({status:200,body:''});
  });await p.goto(base+url);return p;};
  try{
    const tv=await open('/index.html?tele=1&telered=local');
    const code=await tv.locator('.tl-codigo').textContent();
    const a=await open('/index.html?telecel='+code+'&telered=local&n=Ana');
    const b=await open('/index.html?telecel='+code+'&telered=local&n=Beto');
    await tv.waitForFunction(()=>document.querySelectorAll('.tl-jugadores li').length===2);
    await tv.evaluate(()=>{localStorage.setItem('gya_tutti',JSON.stringify({cats:['Nombre','Animal','Comida'],tiempo:60}));localStorage.setItem('gya_tf_letras_usadas',JSON.stringify('BCDEFGHIJLMNOPRSTUV'.split('')));TuttiFrutti._revisar=async(c,v)=>v!=='Alegre';});
    await tv.locator('[data-j="tutti"]').click();
    await a.locator('#tlTfPalabra').waitFor();await b.locator('#tlTfPalabra').waitFor();
    assert.equal(await tv.locator('.tl-tutti-centro strong').textContent(),'A');
    async function fill(p,words){for(let i=0;i<words.length;i++){await p.locator('#tlTfPalabra').fill(words[i]);if(i<words.length-1)await p.locator('#tlTfSiguiente').click();}}
    await fill(a,['Ana','Abeja','Asado']);await fill(b,['Alberto','Alegre','Asado']);
    assert(!(await tv.locator('#teleTV').textContent()).includes('Abeja'),'La TV mostró una palabra antes de Basta');
    await a.locator('#tlTfBasta').click();
    await tv.locator('.tl-tutti-resultado').waitFor({timeout:20000});
    assert(!(await tv.locator('#teleTV').textContent()).includes('Abeja'),'La TV mostró una palabra en resultados');
    await b.locator('.tl-tf-result').waitFor();
    await b.locator('[data-apelar="1"]').click();
    await a.locator('[data-decidir][data-p="10"]').click();
    await b.waitForFunction(()=>[...document.querySelectorAll('.tl-tf-revision')][1].textContent.includes('Alegre')&&[...document.querySelectorAll('.tl-tf-revision')][1].textContent.includes('10'));
    await tv.waitForFunction(()=>document.querySelector('.tl-tutti-tabla')?.textContent.includes('+25'));
    const bPid=await b.evaluate(()=>sessionStorage.getItem('gya_tele_pid'));
    await a.locator(`[data-anular="${bPid}|1"]`).click();
    await b.locator('[data-decidir][data-v="1"]').click();
    await tv.waitForFunction(()=>document.querySelector('.tl-tutti-tabla')?.textContent.includes('+15'));
    await a.locator('#tlTfSiguienteRonda').click();
    await tv.waitForFunction(()=>document.querySelector('.tl-tutti h1')?.textContent.includes('RONDA 2'));
    for(let ronda=2;ronda<=3;ronda++){
      const letra=await tv.locator('.tl-tutti-centro strong').textContent();
      await a.locator('#tlTfPalabra').waitFor();await b.locator('#tlTfPalabra').waitFor();
      await fill(a,[letra+'na',letra+'beja',letra+'sado']);
      await fill(b,[letra+'lberto',letra+'guila',letra+'sado']);
      await a.locator('#tlTfBasta').click();
      await tv.waitForFunction(n=>document.querySelector('.tl-tutti-resultado h1')?.textContent.includes('RONDA '+n),ronda);
      assert(!(await tv.locator('#teleTV').textContent()).includes(letra+'beja'),'La TV mostró palabras');
      await a.locator('#tlTfSiguienteRonda').click();
      if(ronda===2)await tv.waitForFunction(()=>document.querySelector('.tl-tutti h1')?.textContent.includes('RONDA 3'));
    }
    await tv.locator('.tl-tutti-final').waitFor();
    assert((await tv.locator('.tl-tutti-final').textContent()).includes('LETRA A'));
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('PASS Tutti TV: dos teléfonos, Basta, palabras privadas, apelación, anulación, tres rondas y final');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
