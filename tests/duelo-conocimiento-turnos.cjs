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
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    const page=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await page.addInitScript(()=>{
      Math.random=()=>.1;
      window.__mics=[];window.__tones=[];
      class FakeRecognition{
        constructor(){this.running=false;window.__mics.push(this)}
        start(){this.running=true;this.onstart?.()}
        abort(){this.running=false;this.onend?.()}
        emit(text){this.onresult?.({resultIndex:0,results:[{0:{transcript:text},length:1}]})}
      }
      class FakeAudioContext{
        constructor(){this.currentTime=0}
        createOscillator(){const oscillator={frequency:{value:0},connect(){},start(){window.__tones.push(this.frequency.value)},stop(){}};return oscillator}
        createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}
      }
      window.SpeechRecognition=FakeRecognition;
      window.webkitSpeechRecognition=FakeRecognition;
      window.AudioContext=FakeAudioContext;
      Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}});
    });
    await page.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    await page.locator('#input0').fill('Gonzalo');
    await page.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='matematica'));
    await page.locator('#setup-form button[type=submit]').click();
    await page.waitForFunction(()=>phase==='playing'&&active===0&&window.__mics.some(m=>m.running),null,{timeout:10000});
    assert.equal(await page.locator('#name1').textContent(),'SOFÍA');
    assert.equal(await page.locator('#sound-text').textContent(),'ON');
    await page.evaluate(()=>window.__mics.at(-1).emit(question.answer));
    await page.waitForFunction(()=>phase==='playing'&&active===1,null,{timeout:5000});
    const bot=await page.evaluate(()=>({
      name:players[1].name,score:players[0].score,disabled:document.querySelector('#answer-input').disabled,
      focused:document.activeElement?.id==='answer-input',micRunning:window.__mics.some(m=>m.running),
      feedback:document.querySelector('#feedback').textContent,tones:window.__tones
    }));
    assert.equal(bot.name,'Sofía');
    assert.equal(bot.score,1);
    assert.equal(bot.disabled,true,'el bot no habilita la respuesta humana');
    assert.equal(bot.focused,false,'el bot no abre el teclado del celular');
    assert.equal(bot.micRunning,false,'el micrófono se pausa en el turno del bot');
    assert.match(bot.feedback,/Sofía está pensando/);
    assert(bot.tones.includes(440),'sonido de turno del bot');
    await page.evaluate(()=>window.__mics[0].emit(question.answer));
    assert.equal(await page.evaluate(()=>players[1].score),0,'audio antiguo no responde por el bot');
    await page.waitForFunction(()=>phase==='playing'&&active===0&&players[1].score===1&&window.__mics.some(m=>m.running),null,{timeout:8000});
    const human=await page.evaluate(()=>({score:players[0].score,botScore:players[1].score,tones:window.__tones}));
    assert.equal(human.score,1);
    assert.equal(human.botScore,1);
    assert(human.tones.includes(740),'sonido distinto al volver al jugador');
    await page.evaluate(()=>window.__mics[0].emit(question.answer));
    assert.equal(await page.evaluate(()=>players[0].score),1,'audio del turno anterior no responde la pregunta nueva');
    await page.evaluate(()=>window.__mics.at(-1).emit(question.answer));
    await page.waitForFunction(()=>players[0].score===2,null,{timeout:1000});
    await page.close();

    const second=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await second.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await second.addInitScript(()=>{Math.random=()=>.9});
    await second.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    await second.locator('#input0').fill('Gonzalo');
    await second.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='matematica'));
    await second.locator('[data-answer=text]').click();
    await second.locator('#setup-form button[type=submit]').click();
    await second.waitForFunction(()=>phase==='playing'&&active===1,null,{timeout:10000});
    assert.equal(await second.locator('#answer-input').isDisabled(),true,'Sofía empieza sin abrir el teclado humano');
    assert.match(await second.locator('#feedback').textContent(),/Sofía está pensando/);
    await second.waitForFunction(()=>phase==='playing'&&active===0&&players[1].score===1,null,{timeout:8000});
    await second.locator('#answer-input').fill(await second.evaluate(()=>question.answer));
    await second.locator('#answer-submit').click();
    await second.waitForFunction(()=>players[0].score===1,null,{timeout:1000});
    await second.close();

    const noVoice=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await noVoice.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await noVoice.addInitScript(()=>{Math.random=()=>.1;window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined});
    await noVoice.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    await noVoice.locator('#input0').fill('Gonzalo');
    await noVoice.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='matematica'));
    await noVoice.locator('#setup-form button[type=submit]').click();
    await noVoice.waitForFunction(()=>phase==='playing'&&active===0,null,{timeout:10000});
    assert.equal(await noVoice.locator('#dc-answer').inputValue(),'text','sin micrófono permite escribir');
    await noVoice.locator('#answer-input').fill(await noVoice.evaluate(()=>question.answer));
    await noVoice.locator('#answer-submit').click();
    await noVoice.waitForFunction(()=>players[0].score===1,null,{timeout:1000});
    await noVoice.close();
    console.log('PASS Duelo: alternancia BOT/humano en ambos inicios, voz, escritura, sin micrófono y sonidos distintos');
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
