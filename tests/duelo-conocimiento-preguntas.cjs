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
  res.setHeader('Content-Type',{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    const page=await browser.newPage({serviceWorkers:'block'});
    await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await page.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    const result=await page.evaluate(()=>{
      const makePlayer=()=>({score:0,flagDeckeasy:[],flagDeckmedium:[],flagDeckhard:[],famososDeck:[],futbolDeck:[]});
      const rivals=[makePlayer(),makePlayer()];
      const keys=[];
      for(let turn=0;turn<240;turn++){
        const player=rivals[turn%2];
        player.score=Math.floor(turn/10);
        const category=['banderas','matematica','famosos','futbol'][turn%4];
        const q=buildQuestion(player,category);
        const key=questionKey(q);
        if(askedQuestions.has(key))throw Error('Pregunta repetida entre jugadores: '+key);
        askedQuestions.add(key);keys.push(key);
      }
      // Una revancha en la misma página conserva el historial de preguntas.
      const next=buildQuestion(makePlayer(),'banderas');
      const rematchKey=questionKey(next);
      if(askedQuestions.has(rematchKey))throw Error('Pregunta repetida en revancha: '+rematchKey);
      askedQuestions.add(rematchKey);
      const originalRandom=Math.random;
      Math.random=()=>0;
      try{
        for(let turn=0;turn<25;turn++){
          const q=newMath(rivals[turn%2]);
          const key=questionKey(q);
          if(askedQuestions.has(key))throw Error('Cuenta repetida: '+key);
          askedQuestions.add(key);keys.push(key);
        }
      }finally{Math.random=originalRandom}
      return{total:askedQuestions.size,categories:[...new Set(keys.map(key=>key.split(':')[0]))]};
    });
    assert.equal(result.total,266);
    assert.deepEqual(result.categories.sort(),['banderas','famosos','futbol','matematica']);
    console.log('PASS Duelo: 266 preguntas sin repetir entre ambos jugadores ni en la revancha');
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
