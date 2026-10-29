const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const fakeMqtt=`window.mqtt={connect(){
 const channel=new BroadcastChannel('duelo-sala-test'),handlers={};let topic='';
 const client={connected:false,subscribe(value){topic=value},on(name,handler){handlers[name]=handler},publish(value,data){channel.postMessage({topic:value,data})},end(){client.connected=false;channel.close()}};
 channel.onmessage=event=>{if(event.data.topic===topic)handlers.message?.(topic,event.data.data)};
 setTimeout(()=>{client.connected=true;handlers.connect?.()},10);
 return client;
}};`;
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 const file=path.join(root,pathname==='/'?'index.html':pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',{'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).pipe(res);
});

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
 try{
  const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'});
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(url.includes('/lib/mqtt.min.js'))return route.fulfill({status:200,contentType:'application/javascript',body:fakeMqtt});
   if(url.startsWith('http://127.0.0.1:'))return route.continue();
   return route.fulfill({status:200,body:''});
  });
  await context.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text}}})});
  const base='http://127.0.0.1:'+server.address().port;
  const host=await context.newPage();
  await host.goto(base+'/duelo-conocimiento.html',{waitUntil:'load'});
  await host.locator('#input0').fill('Gonzalo');
  await host.locator('[data-mode=online]').click();
  await host.locator('[data-answer=text]').click();
  await host.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='matematica'));
  await host.locator('#setup-form button[type=submit]').click();
  await host.locator('#dc-room-code-display').waitFor();
  const code=await host.locator('#dc-room-code-display').textContent();
  assert.match(code,/^[A-HJ-NP-Z2-9]{4}$/);
  assert.equal(await host.locator('#dc-room-start').isDisabled(),true,'el anfitrión espera al rival');
  await host.locator('#dc-room-copy').click();
  assert((await host.evaluate(()=>window.__copied)).includes('duelo_conocimiento='+code),'la invitación abre el Duelo');
  const invited=await context.newPage();
  await invited.addInitScript(()=>{
   localStorage.setItem('gya_nombre','Martina');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');
  });
  await invited.goto(base+'/?duelo_conocimiento='+code,{waitUntil:'load'});
  await invited.locator('iframe[src*="duelo-conocimiento.html"][src*="sala='+code+'"]').waitFor({timeout:14000});
  await invited.close();

  const guest=await context.newPage();
  await guest.goto(base+'/duelo-conocimiento.html?sala='+code,{waitUntil:'load'});
  await guest.locator('#input0').fill('Martina');
  assert.equal(await guest.locator('#dc-room-choice').inputValue(),'join','la invitación prepara Unirme');
  await guest.locator('[data-answer=text]').click();
  await guest.locator('#setup-form button[type=submit]').click();
  await host.waitForFunction(()=>document.querySelector('#dc-room-roster').textContent.includes('Martina'),null,{timeout:10000});
  await guest.waitForFunction(()=>document.querySelector('#dc-room-roster').textContent.includes('Gonzalo'),null,{timeout:10000});
  assert.equal(await host.locator('#dc-room-start').isEnabled(),true);
  assert.equal(await host.locator('#setup-overlay').evaluate(el=>el.classList.contains('hidden')),false,'la sala no arranca sola');
  await host.locator('#dc-room-start').click();
  await host.waitForFunction(()=>phase==='playing',null,{timeout:10000});
  const first=await host.evaluate(()=>active);
  await guest.waitForFunction(index=>phase==='playing'&&active===index,first,{timeout:10000});
  const firstPage=first===0?host:guest,otherPage=first===0?guest:host;
  assert.equal(await otherPage.locator('#answer-input').isDisabled(),true,'el rival espera su turno');
  await firstPage.locator('#answer-input').fill(await firstPage.evaluate(()=>question.answer));
  await firstPage.locator('#answer-submit').click();
  await host.waitForFunction(index=>players[index].score===1,first,{timeout:10000});
  await host.waitForFunction(index=>phase==='playing'&&active===1-index,first,{timeout:10000});
  await guest.waitForFunction(index=>phase==='playing'&&active===1-index,first,{timeout:10000});
  await otherPage.locator('#answer-input').fill(await otherPage.evaluate(()=>question.answer));
  await otherPage.locator('#answer-submit').click();
  await host.waitForFunction(()=>players[0].score+players[1].score===2,null,{timeout:10000});
  await guest.waitForFunction(()=>players[0].score+players[1].score===2,null,{timeout:10000});
  assert.deepEqual(await host.evaluate(()=>players.map(player=>player.score)),[1,1]);
  assert.deepEqual(await guest.evaluate(()=>players.map(player=>player.score)),[1,1]);
  const small=await context.newPage();
  await small.setViewportSize({width:320,height:486});
  await small.goto(base+'/duelo-conocimiento.html',{waitUntil:'load'});
  await small.locator('#input0').fill('Gonzalo');
  await small.locator('[data-mode=online]').click();
  for(const choice of ['create','join']){
   await small.locator('[data-room='+choice+']').click();
   const layout=await small.evaluate(()=>({scroll:document.querySelector('#setup-form').scrollHeight-document.querySelector('#setup-form').clientHeight,side:document.documentElement.scrollWidth-innerWidth,button:document.querySelector('#setup-form>.primary').getBoundingClientRect().bottom}));
   assert(layout.scroll<=1&&layout.side<=0&&layout.button<=486,'la entrada online entra en un celular pequeño: '+JSON.stringify(layout));
  }
  await small.locator('[data-room=create]').click();
  await small.locator('#setup-form button[type=submit]').click();
  const lobbyLayout=await small.evaluate(()=>({side:document.documentElement.scrollWidth-innerWidth,code:document.querySelector('#dc-room-code-display').textContent,start:document.querySelector('#dc-room-start').getBoundingClientRect().bottom}));
  assert(lobbyLayout.side<=0&&lobbyLayout.start<=486&&lobbyLayout.code.length===4,'la sala de espera queda visible en celular pequeño: '+JSON.stringify(lobbyLayout));
  await context.close();
  console.log('PASS Duelo sala: crear, invitar, unirse, sorteo y turnos alternados en dos celulares');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
