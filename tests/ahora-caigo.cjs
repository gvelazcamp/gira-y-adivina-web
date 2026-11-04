const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(new URL(req.url,"http://local").pathname.replace(/\/$/,"/index.html")));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader("Content-Type",{".html":"text/html",".js":"text/javascript",".css":"text/css",".webp":"image/webp",".png":"image/png",".svg":"image/svg+xml"}[path.extname(file)]||"application/octet-stream");
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(r=>server.listen(0,"127.0.0.1",r));
  const base="http://127.0.0.1:"+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||"/usr/bin/chromium",args:["--no-sandbox"]});
  try{
    for(const name of ["Gonzalo","Vale"]){
      const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:"block"});
      const page=await context.newPage();
      const errors=[];page.on("pageerror",e=>errors.push(e.message));
      await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:""}));
      await page.addInitScript(n=>{
        localStorage.setItem("gya_nombre",n);localStorage.setItem("gya_avatar","avatar-02");
        localStorage.setItem("gya_pais","uruguay");localStorage.setItem("gya_bienvenida_vista","1");
      },name);
      await page.goto(base,{waitUntil:"load"});
      await page.waitForFunction(()=>window.Extensiones&&window.AhoraCaigo);
      await page.evaluate(()=>{
        document.querySelector("#splash")?.remove();document.documentElement.classList.remove("cargando");
        Extensiones.abrirLobby();
      });
      assert.equal(await page.getByRole("button",{name:/Ahora Caigo/}).count(),name==="Gonzalo"?1:0,"catalog visibility");
      await page.evaluate(()=>Extensiones.abrirJuego("ahora-caigo"));
      assert.equal(await page.locator(".ac-juego").count(),name==="Gonzalo"?1:0,"direct entry gate");
      if(name!=="Gonzalo"){
        await page.evaluate(()=>AhoraCaigo.abrir(document.getElementById("extContenido")));
        assert.equal(await page.locator(".ac-juego").count(),0,"module entry gate");
        await context.close();continue;
      }
      assert.equal(await page.locator(".ac-participante").count(),11);
      assert.equal(await page.locator(".ac-principal .ac-nombre").textContent(),"Gonzalo");
      assert((await page.locator(".ac-principal .ac-avatar").getAttribute("src")).endsWith("avatar-02.webp"));
      // The rear pose only applies to Gonzalo's avatar in the centre.
      await page.evaluate(()=>{localStorage.setItem("gya_avatar","avatar-22");Extensiones.abrirJuego("ahora-caigo");});
      assert.equal(await page.locator(".ac-de-espaldas").count(),1);
      assert((await page.locator(".ac-principal .ac-avatar").getAttribute("src")).endsWith("avatar-22-espalda.webp"));
      assert(await page.locator(".ac-principal").evaluate(el=>
        +getComputedStyle(el.querySelector(".ac-avatar")).zIndex>+getComputedStyle(el.querySelector(".ac-atril")).zIndex),"podium behind rear-facing player");
      await page.waitForFunction(()=>[...document.querySelectorAll(".ac-juego img")].every(i=>i.complete&&i.naturalWidth>0));
      for(const viewport of [{width:1280,height:900},{width:844,height:390},{width:390,height:844}]){
        await page.setViewportSize(viewport);
        const layout=await page.evaluate(()=>{
          const s=document.querySelector(".ac-escenario").getBoundingClientRect();
          return{fits:s.right<=innerWidth&&s.left>=0,inside:[...document.querySelectorAll(".ac-participante")].every(p=>{
            const r=p.getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1;
          })};
        });
        assert(layout.fits&&layout.inside,"all eleven figures fit: "+JSON.stringify(viewport));
      }
      await page.setViewportSize({width:1280,height:900});
      await page.evaluate(()=>{window.__randomOriginal=Math.random;Math.random=()=>.99;});
      await page.locator(".ac-sortear").click();
      assert(await page.locator(".ac-sortear").isDisabled());
      await page.waitForFunction(()=>document.querySelector(".ac-elegido"),{},{timeout:10000});
      assert.equal(await page.locator(".ac-elegido .ac-nombre").textContent(),"10");
      assert.equal(await page.locator(".ac-iluminado").count(),1);
      assert.equal(await page.locator(".ac-estado").textContent(),"¡Tu rival es el participante 10!");
      if(process.env.SCREENSHOT_PATH)await page.locator(".ext-wrap").screenshot({path:process.env.SCREENSHOT_PATH});
      await page.evaluate(()=>{Math.random=()=>0;});
      await page.locator(".ac-sortear").click();
      await page.waitForFunction(()=>document.querySelector(".ac-elegido"),{},{timeout:10000});
      assert.equal(await page.locator(".ac-elegido .ac-nombre").textContent(),"1");
      await page.locator(".ac-sortear").click();
      await page.evaluate(()=>Extensiones.abrirLobby());
      assert.equal(await page.locator(".ac-abierta").count(),0,"scenario styles cleaned up");
      await page.evaluate(()=>Extensiones.abrirJuego("ahora-caigo"));
      assert.equal(await page.locator(".ac-elegido").count(),0,"new scenario has no old selection");
      assert(await page.locator(".ac-sortear").isEnabled());
      await page.evaluate(()=>{Math.random=window.__randomOriginal;Extensiones.cerrar();});
      assert.equal(await page.locator(".ac-abierta").count(),0);
      assert.deepEqual(errors,[],"no browser errors");
      await context.close();
    }
    console.log("PASS: Gonzalo-only access, existing assets, 11 figures at 3 sizes, draw endpoints and exit cleanup");
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
