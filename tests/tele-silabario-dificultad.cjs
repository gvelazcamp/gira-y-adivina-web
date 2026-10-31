/* Silabario TV aumenta las opciones por ronda y sincroniza el celular.
   BROWSER_EXECUTABLE=/usr/bin/chromium node tests/tele-silabario-dificultad.cjs */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
  const file=path.join(root,new URL(req.url,"http://local").pathname.replace(/^\//,""));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    const context=await browser.newContext({serviceWorkers:"block"});
    const tv=await context.newPage(),phone=await context.newPage();
    for(const p of [tv,phone])await p.route("**/*",r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:""}));
    await tv.addInitScript(()=>{window.GiroRoscoPiloto={habilitado:()=>false,cerrar(){}};});
    await tv.goto(base+"/index.html?tele=1&telered=local",{waitUntil:"load"});
    const code=await tv.locator(".tl-codigo").textContent();
    await phone.goto(base+"/index.html?telecel="+code+"&telered=local&n=Vale",{waitUntil:"load"});
    await tv.waitForFunction(()=>document.querySelector(".tl-jugadores")?.textContent.includes("Vale"));
    await tv.locator('[data-j="silabario"]').click();
    const extras=async ronda=>{
      await tv.waitForFunction(n=>document.querySelector(".tl-or-top")?.textContent.includes("RONDA "+n+"/"),ronda,{timeout:10000});
      const pista=await tv.locator(".tl-or-pista").textContent();
      await phone.waitForFunction(p=>document.querySelector(".tl-or-cel-fichas")&&document.querySelector(".tl-or-cel-pista")?.textContent===p,pista);
      const tvPiezas=await tv.locator(".tl-or-fichas span").allTextContents();
      const phonePiezas=await phone.locator(".tl-or-cel-fichas button").allTextContents();
      assert.equal(tvPiezas.length,phonePiezas.length,"TV y celular ofrecen cantidades distintas");
      const necesarias=await tv.locator(".tl-or-slots span").count();
      return tvPiezas.length-necesarias;
    };
    const primera=await extras(1);
    for(let ronda=2;ronda<=4;ronda++){
      await phone.locator("#tlOrSaltar").click();
      await extras(ronda);
    }
    const cuarta=await extras(4);
    assert.equal(cuarta,primera+1,"Las rondas siguientes no agregaron sílabas distractoras");
    await context.close();
    console.log("PASS: Silabario TV agrega sílabas por rondas y el celular muestra las mismas opciones");
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
