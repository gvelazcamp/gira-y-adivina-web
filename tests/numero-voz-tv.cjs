/* TV y dos controles reales por BroadcastChannel. Voz simulada, sin servicios externos. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  try{
    const context=await browser.newContext({serviceWorkers:'block',locale:'es-UY'}),errors=[];
    async function page(w,h){const p=await context.newPage();await p.setViewportSize({width:w,height:h});p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));return p;}
    const tv=await page(1280,720),g=await page(390,844),v=await page(390,844);
    await tv.addInitScript(()=>{
      window.__offset=0;const now=performance.now.bind(performance);performance.now=()=>now()+window.__offset;
      window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{speak(u){window.__spoken.push(u);},cancel(){},getVoices(){return[];},addEventListener(){}}});
      window.GiroRoscoPiloto={habilitado:()=>false,cerrar(){}};
    });
    for(const p of [g,v])await p.addInitScript(()=>{
      localStorage.setItem('gya_tele_mic','1');window.__mics=[];window.SpeechRecognition=class{
        start(){window.__mics.push(this);setTimeout(()=>{if(!this.aborted){this.onstart?.();this.onaudiostart?.();}},0);}
        abort(){this.aborted=true;this.onend?.();}
      };
    });
    await tv.goto(base+'/index.html?tele=1&telered=local');const code=await tv.locator('.tl-codigo').textContent();
    await tv.evaluate(c=>{window.sonidoPermitido=()=>true;window.__states=[];window.__observer=new BroadcastChannel('gya/tele/'+c);window.__observer.onmessage=e=>{if(e.data.t==='estado')window.__states.push(e.data);};},code);
    await g.goto(base+'/index.html?telecel='+code+'&telered=local&n=Gonzalo');await g.locator('[data-j="numero"]').waitFor();
    await v.goto(base+'/index.html?telecel='+code+'&telered=local&n=Vale');await tv.waitForFunction(()=>document.querySelector('.tl-jugadores')?.textContent.includes('Vale'));
    await g.locator('[data-j="numero"]').click();await g.locator('[data-nv-config]').waitFor();
    assert.equal(await g.locator('[data-nv-name]').count(),2);
    await g.locator('[data-nv-config]').click();await g.locator('[data-nv-start]').click();
    await tv.locator('.nv-answer').waitFor();assert.equal(await tv.locator('.nv-answer').textContent(),'1939');
    for(const p of [g,v]){await p.locator('.nv-phone-question').waitFor();assert(!(await p.locator('#teleCel').textContent()).includes('1939'),'answer never sent to a phone');}
    await tv.waitForFunction(()=>window.__spoken.length===1);assert(!(await tv.evaluate(()=>window.__spoken[0].text)).includes('1939'));
    assert.equal(await g.evaluate(()=>window.__mics.length),0,'microphone stays off while question is read');
    await tv.screenshot({path:'/tmp/numero-voz-tv.png'});
    await tv.evaluate(()=>window.__spoken.at(-1).onend());await g.waitForFunction(()=>document.querySelector('.nv-mic-state')?.textContent.includes('Te escucho'));
    await g.screenshot({path:'/tmp/numero-voz-cel.png'});
    const answer=async(p,text)=>p.evaluate(text=>{const m=window.__mics.at(-1),result=[{transcript:text}];result.isFinal=true;m.onresult({resultIndex:0,results:[result]});},text);
    await answer(g,'mil novecientos treinta y nueve');await g.waitForFunction(()=>document.querySelector('.nv-phone-scores')?.textContent.includes('Gonzalo: 1'));
    assert(await g.evaluate(()=>window.__mics[0].aborted),'old question microphone must stop');
    await tv.waitForFunction(()=>window.__spoken.length===2);await tv.evaluate(()=>window.__spoken.at(-1).onend());await g.waitForFunction(()=>document.querySelector('.nv-mic-state')?.textContent.includes('Te escucho'));
    await answer(g,'paso');await tv.waitForFunction(()=>window.__spoken.length===3);assert((await g.locator('.nv-phone-scores').textContent()).includes('Gonzalo: 1'));
    await tv.evaluate(()=>window.__spoken.at(-1).onend());await v.locator('[data-nv-ok]').waitFor();await v.locator('[data-nv-ok]').click();
    await g.waitForFunction(()=>document.querySelector('.nv-phone-scores')?.textContent.includes('Gonzalo: 2'));
    await tv.waitForFunction(()=>window.__spoken.length===4);await tv.evaluate(()=>window.__offset+=31000);await g.locator('[data-nv-next]').waitFor();
    await g.locator('[data-nv-next]').click();await v.locator('[data-nv-start]').waitFor();assert((await v.locator('.nv-phone h2').textContent()).includes('Vale'));
    await v.locator('[data-nv-start]').click();await tv.waitForFunction(()=>window.__spoken.length===5);await tv.evaluate(()=>window.__spoken.at(-1).onend());await v.waitForFunction(()=>document.querySelector('.nv-mic-state')?.textContent.includes('Te escucho'));
    const n=await tv.locator('.nv-answer').textContent();await answer(v,n);await v.waitForFunction(()=>document.querySelector('.nv-phone-scores')?.textContent.includes('Vale: 1'));
    await tv.evaluate(()=>window.__offset+=31000);await g.locator('[data-nv-next]').waitFor();await g.locator('[data-nv-next]').click();await g.locator('[data-nv-again]').waitFor();
    assert((await tv.locator('.tl-podio').textContent()).includes('Gonzalo'));
    await g.locator('[data-nv-menu]').click();await g.locator('[data-j="numero"]').waitFor();
    for(const p of [g,v])assert(await p.evaluate(()=>window.__mics.every(m=>m.aborted)),'all microphones stop on exit');
    const states=await tv.evaluate(()=>window.__states.filter(x=>x.cel?.pantalla==='numero-voz').map(x=>x.cel));assert(states.length);assert(states.every(c=>!('respuesta'in c)&&!('numero'in c)));
    // El permiso se pide desde un toque; denegarlo pausa el turno y permite seguir manualmente.
    await g.evaluate(()=>{
      localStorage.removeItem('gya_tele_mic');window.__sent=[];const el=document.createElement('div');el.id='probe';document.querySelector('#teleCel').replaceChildren(el);
      window.__probe=NumeroVoz.crearCel(el,'probe',(a,m)=>window.__sent.push({a,...m}));window.__probeModel={pantalla:'numero-voz',fase:'ready',ronda:1,quien:'Prueba',activo:'probe',escucha:null,token:'probe-1',resta:30,jug:[{n:'Prueba',pts:0}]};window.__probe.pintar(window.__probeModel,'<div>Prueba</div>',true);
    });
    await g.locator('#probe [data-nv-mic]').click();await g.waitForFunction(()=>localStorage.getItem('gya_tele_mic')==='1');
    await g.evaluate(()=>window.__probe.pintar({...window.__probeModel,fase:'arming',escucha:'probe'},'',true));
    await g.waitForFunction(()=>window.__sent.some(x=>x.a==='nv_listo'));
    await g.evaluate(()=>window.__mics.at(-1).onerror({error:'not-allowed'}));
    assert(await g.evaluate(()=>window.__sent.some(x=>x.a==='nv_error')));assert.equal(await g.evaluate(()=>localStorage.getItem('gya_tele_mic')),null);
    await g.evaluate(()=>{window.__probe.salir();document.querySelector('#probe').remove();});
    assert.equal(errors.length,0,errors.join('\n'));await context.close();
    // Ana sigue con el juego clásico de rangos: el piloto no modifica su modalidad.
    const classic=await browser.newContext({serviceWorkers:'block',locale:'es-UY'}),t2=await classic.newPage(),p2=await classic.newPage();
    for(const p of [t2,p2]){await p.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));await p.addInitScript(()=>{window.GiroRoscoPiloto={habilitado:()=>false,cerrar(){}};});}
    await t2.goto(base+'/index.html?tele=1&telered=local');const c2=await t2.locator('.tl-codigo').textContent();await p2.goto(base+'/index.html?telecel='+c2+'&telered=local&n=Ana');await p2.locator('[data-j="numero"]').click();await p2.locator('#tlQnNuevo').waitFor();assert.equal(await p2.locator('[data-nv-config]').count(),0);
    const entries=await p2.evaluate(()=>{
      const original=window.gyaPerfil,el=document.createElement('div');document.body.append(el);const found={};
      for(const nombre of ['Gonzalo','Vale','Ana']){el.replaceChildren();window.gyaPerfil=()=>({nombre});QueNumeroSoy.abrir(el);found[nombre]=Array.from(el.querySelectorAll('button')).some(b=>b.textContent.includes('Preguntas por voz'));QueNumeroSoy.salir();}
      el.remove();window.gyaPerfil=original;return found;
    });assert.deepEqual(entries,{Gonzalo:true,Vale:true,Ana:false});
    await classic.close();
    console.log('PASS TV + two phones: big answer only on TV, question-only voice, spoken answer/pass, moderator correction, two-player score, 30-second turns and microphone cleanup');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
