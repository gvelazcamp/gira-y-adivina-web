/* Resultado del Rosco: popup compacto y regreso a la pantalla de Jugar. */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,"http://local").pathname;
  const file=path.join(root,pathname==="/"?"index.html":pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader("Content-Type",({".html":"text/html",".js":"text/javascript",".css":"text/css",".webp":"image/webp",".png":"image/png"})[path.extname(file)]||"application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    for(const {name,width,height} of [{name:"Gonzalo",width:844,height:390},{name:"Vale",width:390,height:844}]){
      const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:"block",locale:"es-UY"});
      const page=await context.newPage();
      await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:""}));
      await page.addInitScript(n=>{
        localStorage.setItem("gya_nombre",n);
        localStorage.setItem("gya_avatar","avatar-01");
        localStorage.setItem("gya_pais","uruguay");
        localStorage.setItem("gya_bienvenida_vista","1");
        localStorage.setItem("gya_rosco_rioplatense",JSON.stringify({nivelMax:3,mejor:0,ultimas:{}}));
        window.GIRO_ROSCO_PILOTO=false;
      },name);
      await page.goto(base,{waitUntil:"load"});
      await page.waitForFunction(()=>!!window.Extensiones&&!!window.RoscoRioplatense);
      await page.evaluate(()=>{
        document.querySelector("#splash")?.remove();
        document.documentElement.classList.remove("cargando");
        Fichas.usar=()=>true;
        ROSCO_CONFIG.segundosPorLetra=.03;
        ROSCO_CONFIG.giroMs=0;
        Extensiones.abrirJuego("rosco-rioplatense");
        document.querySelector("#rrPanel .rr-principal").click();
      });
      await page.waitForFunction(()=>document.querySelector("#rrPanel")?.classList.contains("rr-resultado-capa"));
      const result=await page.evaluate(()=>{
        const modal=document.querySelector("#rrPanel"),card=modal.querySelector(".rr-resultado"),rect=card.getBoundingClientRect();
        return {role:modal.getAttribute("role"),buttons:[...card.querySelectorAll("button")].filter(b=>getComputedStyle(b).display!=="none").map(b=>b.textContent),
          rows:card.querySelectorAll(".rr-res-fila").length,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,
          scrollX:card.scrollWidth-card.clientWidth};
      });
      assert.equal(result.role,"dialog");
      assert.equal(result.buttons.length,1);
      assert(/Continuar|Continue/.test(result.buttons[0]),result);
      assert.equal(result.rows,20);
      assert(result.left>=0&&result.right<=width+2&&result.top>=0&&result.bottom<=height+2,result);
      assert(result.scrollX<=2,"sin desplazamiento horizontal");
      if(process.env.ROSCO_SCREENSHOT&&width===844)await page.screenshot({path:process.env.ROSCO_SCREENSHOT});
      await page.locator("#rrPanel .rr-principal").click();
      assert.equal(await page.locator("#rrJuego").getAttribute("hidden"),"");
      assert.match(await page.locator("#rrPanel .rr-principal").textContent(),/Jugar nivel 3|Play level 3/);
      await context.close();
    }
    console.log("PASS: resultado del Rosco en popup; Continuar vuelve a Jugar en horizontal y vertical");
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
