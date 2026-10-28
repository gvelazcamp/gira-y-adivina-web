const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://local').pathname;
  const file=path.join(root,pathname==='/'?'index.html':pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');
  res.end(fs.readFileSync(file));
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  try{
    const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:''}));
    await context.addInitScript(()=>{
      localStorage.setItem('gya_nombre','Gonzalo');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');
      window.__mic={starts:0,stops:0,requests:0,active:null};
      class FakeRecognition{
        start(){window.__mic.starts++;window.__mic.active=this;setTimeout(()=>this.onstart?.(),0);}
        abort(){this.onend?.();}
      }
      window.SpeechRecognition=FakeRecognition;
      Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{
        window.__mic.requests++;return{getTracks:()=>[{stop:()=>window.__mic.stops++}]};
      }}});
    });
    await page.goto(base);
    await page.evaluate(()=>{
      document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');
      document.querySelector('#setup').style.display='none';Fichas.usar=()=>true;
      Extensiones.abrirJuego('tutti-frutti');document.querySelector('#tfBienvOk')?.click();
      document.querySelector('#tfBots').click();document.querySelector('[data-m=normal]').click();
    });
    await page.locator('#tfVozSi').waitFor({timeout:20000});
    assert.equal(await page.locator('#tfLetra').count(),0,'El aviso debe salir antes del sorteo');
    const dialogo=await page.locator('.tf-mic-aviso-caja').boundingBox();
    assert(dialogo.y>=0&&dialogo.y+dialogo.height<=390,'El aviso debe entrar en la pantalla horizontal');
    await page.locator('#tfVozSi').click();
    await page.locator('#tfInput').waitFor({timeout:10000});
    assert.equal(await page.locator('#tfMic').getAttribute('aria-pressed'),'true');
    assert.equal(await page.evaluate(()=>window.__mic.requests),1);
    assert.equal(await page.evaluate(()=>window.__mic.starts),1);
    await page.waitForFunction(()=>document.querySelector('#tfMic')?.textContent.includes('Escuchando'));
    await page.setViewportSize({width:700,height:320});
    const boton=await page.locator('#tfMic').boundingBox(),teclado=await page.locator('#tfTeclado').boundingBox();
    assert(boton.y>=0&&boton.y+boton.height<=320,'El botón del micrófono debe verse en una pantalla baja');
    assert(teclado.y>=0&&teclado.y+teclado.height<=320,'El teclado debe seguir visible en una pantalla baja');
    await page.setViewportSize({width:844,height:390});
    const letra=await page.locator('.tf-letra.tf-chica').textContent();
    const decir=async(texto,final=true,alternativas=[])=>page.evaluate(({texto,final,alternativas})=>{
      const r=window.__mic.active,resultado=[{transcript:texto},...alternativas.map(transcript=>({transcript}))];
      resultado.isFinal=final;r.onresult({resultIndex:0,results:[resultado]});
    },{texto,final,alternativas});
    const anterior=await page.locator('#tfCat').textContent();
    await decir('Zorro');
    assert.equal(await page.locator('#tfCat').textContent(),anterior,'Una palabra con letra incorrecta no debe avanzar');
    await decir(letra+'oco',false);
    assert.equal(await page.locator('#tfInput').inputValue(),letra+'oco','El reconocimiento parcial debe verse');
    assert.equal(await page.locator('#tfCat').textContent(),anterior,'Una palabra parcial no debe avanzar');
    await decir('Zorro',true,[letra+'oca']);
    assert.notEqual(await page.locator('#tfCat').textContent(),anterior,'Una palabra válida debe avanzar sola');
    await page.evaluate(()=>window.__mic.active.onend());
    await page.waitForFunction(()=>window.__mic.starts>=2);
    for(let i=0;i<10&&await page.locator('#tfBasta').count()===0;i++){
      await decir(letra+'a');
    }
    assert(await page.locator('#tfMic').isVisible(),'El botón del micrófono debe seguir visible en la revisión');
    await decir('basta');
    assert.equal(await page.evaluate(()=>window.__mic.stops),1,'¡BASTA! debe liberar el micrófono');
    const starts=await page.evaluate(()=>window.__mic.starts);
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(()=>window.__mic.starts),starts,'No debe reactivarse después de ¡BASTA!');
    const sinVoz=await context.newPage();
    sinVoz.on('pageerror',e=>errors.push(e.message));
    await sinVoz.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:''}));
    await sinVoz.goto(base);
    await sinVoz.evaluate(()=>{
      document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');
      document.querySelector('#setup').style.display='none';Fichas.usar=()=>true;
      Extensiones.abrirJuego('tutti-frutti');document.querySelector('#tfBienvOk')?.click();
      document.querySelector('#tfBots').click();document.querySelector('[data-m=normal]').click();
    });
    await sinVoz.locator('#tfVozNo').waitFor({timeout:20000});
    await sinVoz.locator('#tfVozNo').click();
    await sinVoz.locator('#tfInput').waitFor({timeout:10000});
    assert.equal(await sinVoz.evaluate(()=>window.__mic.requests),0,'No debe pedir permiso al elegir No');
    await sinVoz.locator('#tfMic').click();
    await sinVoz.waitForFunction(()=>window.__mic.starts===1);
    assert.equal(await sinVoz.locator('#tfMic').getAttribute('aria-pressed'),'true');
    await sinVoz.locator('#tfMic').click();
    assert.equal(await sinVoz.locator('#tfMic').getAttribute('aria-pressed'),'false');
    assert.equal(await sinVoz.evaluate(()=>window.__mic.stops),1,'El botón debe apagar y liberar el micrófono');
    await sinVoz.setViewportSize({width:390,height:844});
    assert(await sinVoz.locator('#tfMic').isHidden(),'El botón de voz nuevo solo debe verse en horizontal');
    await sinVoz.waitForFunction(()=>!document.querySelector('#tfInput')?.readOnly);
    assert.equal(await sinVoz.locator('#tfInput').getAttribute('readonly'),null,'En vertical vuelve el teclado habitual');
    assert.deepEqual(errors,[]);
    console.log('PASS Tutti Frutti horizontal: aviso antes de la letra, Sí/No, voz, reactivación y pausa en ¡BASTA!');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
