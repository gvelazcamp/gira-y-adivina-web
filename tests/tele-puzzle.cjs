const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),errors=[];
  const open=async url=>{const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));await p.goto(base+url);return p;};
  try{
    const normal=await open('/puzzle.html');await normal.waitForFunction(()=>pieces.length>0);assert(await normal.locator('#tuto').isVisible(),'El Puzzle normal perdió su tutorial');await normal.close();
    const tv=await open('/index.html?tele=1&telered=local');await tv.setViewportSize({width:1920,height:1080});
    const code=await tv.locator('.tl-codigo').textContent();
    const a=await open('/index.html?telecel='+code+'&telered=local&n=Ana');
    await tv.waitForFunction(()=>document.querySelectorAll('.tl-jugadores li').length===1);
    await a.locator('[data-j="puzzle"]').click();
    await a.locator('#tlPzStart:enabled').waitFor({timeout:20000});
    await a.locator('[data-cat="aventura"]').click();await a.locator('[data-n="49"]').waitFor();
    await a.locator('#tlPzNext').click();
    assert((await tv.locator('#tlPzConfig img').getAttribute('src')).includes('egipto.webp'));
    await a.locator('[data-cat="dibujo"]').click();
    await a.locator('[data-n="12"]').click();await a.locator('#tlPzRot').click();
    await a.locator('#tlPzStart').click();
    await a.locator('#tlPzPad').waitFor({timeout:20000});
    if(process.env.PUZZLE_TV_SCREENSHOT){await tv.screenshot({path:process.env.PUZZLE_TV_SCREENSHOT+'-tv.png'});await a.screenshot({path:process.env.PUZZLE_TV_SCREENSHOT+'-cel.png'});}
    const frame=tv.frames().find(f=>f.url().includes('tvpuzzle=1'));assert(frame,'No abrió el motor del Puzzle');
    await frame.waitForFunction(()=>pieces.length>=12&&groups.length>=12);
    async function arrastrar(phone,vecinoDe=null,tablero=frame){
      const v=await tablero.evaluate(vecinoDe=>{const p=pieces.find(q=>!q.g.locked&&(vecinoDe===null||Math.abs(q.row-pieces[vecinoDe].row)+Math.abs(q.col-pieces[vecinoDe].col)===1)&&q.x*cam.z+cam.x>80&&q.x*cam.z+cam.x<VW-80&&q.y*cam.z+cam.y<VH-80);
        if(!p)return null;return{inicial:[(p.x*cam.z+cam.x)/VW,(p.y*cam.z+cam.y)/VH],final:[((p.col*S+S/2)*cam.z+cam.x)/VW,((p.row*S+S/2)*cam.z+cam.y)/VH],id:p.i};},vecinoDe);
      assert(v,'No hay pieza visible para mover');
      const pad=phone.locator('#tlPzPad');await pad.scrollIntoViewIfNeeded();const box=await pad.boundingBox();
      const xy=([x,y])=>({x:box.x+x*box.width,y:box.y+y*box.height});const start=xy(v.inicial),end=xy(v.final);
      await phone.mouse.move(start.x,start.y);await phone.mouse.down();await phone.waitForTimeout(100);
      await phone.mouse.move(end.x,end.y,{steps:4});await phone.waitForTimeout(100);await phone.mouse.up();
      await tablero.waitForFunction(id=>pieces[id].g.locked,v.id,{timeout:10000});return v.id;
    }
    const primero=await arrastrar(a);const pct1=await frame.evaluate(()=>Math.round((pieces.length-groups.length)/(pieces.length-1)*100));
    const b=await open('/index.html?telecel='+code+'&telered=local&n=Beto');await b.locator('#tlPzPad').waitFor();
    const z=await frame.evaluate(()=>cam.z);
    await b.locator('[data-op="pz_acercar"]').click();await frame.waitForFunction(v=>cam.z>v,z);
    await b.locator('[data-op="pz_encuadrar"]').click();await frame.waitForFunction(v=>Math.abs(cam.z-v)<.001,z);
    await b.locator('[data-op="pz_guia"]').click();await frame.waitForFunction(()=>ghost===true);
    await b.locator('[data-op="pz_guia"]').click();await frame.waitForFunction(()=>ghost===false);
    const segundo=await arrastrar(b,primero);assert.notEqual(primero,segundo);
    const pct2=await frame.evaluate(()=>Math.round((pieces.length-groups.length)/(pieces.length-1)*100));
    assert(pct2>pct1,'La pieza del segundo celular no subió el progreso');
    a.once('dialog',d=>d.accept());await a.locator('#tlPzOtro').click();await a.locator('#tlPzResume').waitFor();
    await a.locator('#tlPzResume').click();await a.locator('#tlPzPad').waitFor();
    await frame.waitForFunction(p=>Math.round((pieces.length-groups.length)/(pieces.length-1)*100)>=p,pct2);
    a.once('dialog',d=>d.accept());await a.locator('#tlMenu').click();await tv.locator('.tl-codigo').waitFor();
    await a.locator('[data-j="puzzle"]').click();await a.locator('#tlPzResume').waitFor({timeout:20000});
    await a.locator('#tlPzResume').click();await a.locator('#tlPzPad').waitFor();
    const frame2=tv.frames().find(f=>f.url().includes('tvpuzzle=1'));await frame2.waitForFunction(p=>pieces.length>0&&Math.round((pieces.length-groups.length)/(pieces.length-1)*100)>=p,pct2);
    for(let i=0;i<12&&!await frame2.evaluate(()=>won);i++)await arrastrar(a,null,frame2);
    assert(await frame2.evaluate(()=>won),'No apareció la victoria al completar el Puzzle');
    await tv.locator('.tl-pz-hud').getByText('¡Puzzle completo!').waitFor();
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('PASS Puzzle TV: modo normal, juego solo, ingreso cooperativo, encastre y guardado tras volver al menú');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
