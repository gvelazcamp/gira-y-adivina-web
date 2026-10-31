/* Silabario conserva opciones activas y suma distractoras tras cada acierto.
   BROWSER_EXECUTABLE=/usr/bin/chromium node tests/silabario-dificultad.cjs */
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
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:"reduce",serviceWorkers:"block"});
    const page=await context.newPage();
    await page.route("**/*",r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:""}));
    await page.addInitScript(()=>{
      localStorage.setItem("gya_nombre","Vale");localStorage.setItem("gya_avatar","avatar-01");
      localStorage.setItem("gya_pais","uruguay");localStorage.setItem("gya_bienvenida_vista","1");
      Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{cancel(){},getVoices(){return[];},speak(u){setTimeout(()=>u.onend?.(),0);}}});
    });
    await page.goto(base+"/index.html",{waitUntil:"load"});
    await page.waitForFunction(()=>!!window.Extensiones&&!!window.SilabarioRioplatense);
    await page.evaluate(()=>{
      document.querySelector("#splash")?.remove();document.documentElement.classList.remove("cargando");
      Fichas.usar=()=>true;Extensiones.abrirJuego("silabario-rioplatense");
      document.querySelector("#sbPanel .sf-principal").click();
    });
    await page.waitForFunction(()=>document.querySelector("#sbPasar")?.disabled===false);
    const antes=await page.locator(".sb-ficha").allTextContents();
    assert.equal(antes.length,25);
    const vistos=new Set(antes);
    for(let i=1;i<=3;i++){
      await page.evaluate(()=>{
        const pista=document.querySelector("#sbPista").textContent;
        const item=SILABARIO_DATOS.find(d=>d.pista===pista);
        if(!item)throw Error("No encontré la pista: "+pista);
        for(const silaba of item.silabas){
          const ficha=[...document.querySelectorAll(".sb-ficha:not(:disabled)")].find(b=>b.textContent===silaba);
          if(!ficha)throw Error("No está la sílaba "+silaba);
          ficha.click();
        }
      });
      await page.waitForFunction(n=>document.querySelector("#sbAciertos")?.textContent.startsWith(n+"/"),i);
      await page.waitForFunction(()=>document.querySelector("#sbPasar")?.disabled===false);
      const textos=await page.locator(".sb-ficha").allTextContents();
      const activos=await page.locator(".sb-ficha:not([disabled])").count();
      assert.equal(textos.length,25,"El tablero cambió de tamaño");
      assert.equal(activos,25,"Se fueron apagando las opciones después de acertar");
      assert(textos.some(t=>!vistos.has(t)),"No aparecieron sílabas nuevas");
      textos.forEach(t=>vistos.add(t));
    }
    await context.close();
    console.log("PASS: tras tres aciertos aparecen distractoras nuevas y siguen 25 fichas activas");
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
