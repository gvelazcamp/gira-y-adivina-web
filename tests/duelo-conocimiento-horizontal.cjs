/* Duelo: configuración separada de la partida horizontal sin scroll.
   Ejecutar desde la raíz: BROWSER_EXECUTABLE=/usr/bin/chromium node tests/duelo-conocimiento-horizontal.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const css=fs.readFileSync(path.join(root,"duelo-conocimiento-horizontal.css"),"utf8");
const ext=fs.readFileSync(path.join(root,"extensiones.js"),"utf8");
const outer=fs.readFileSync(path.join(root,"extensiones.css"),"utf8");
const modes=fs.readFileSync(path.join(root,"duelo-conocimiento-modos.js"),"utf8");
const html=fs.readFileSync(path.join(root,"duelo-conocimiento.html"),"utf8");
new Function(ext);new Function(modes);
assert(css.includes("@media (orientation:landscape)"),"CSS horizontal dedicado");
assert(css.includes(".question-frame"),"Pregunta visible en horizontal");
assert(outer.includes(".ext-shell.dc-partida-horizontal"),"El marco de partida ocupa la pantalla");
assert(ext.includes('if(id!=="duelo-conocimiento"'),"No girar el celular para escribir nombres");
assert(modes.includes("sincronizarPantallaDuelo(true,true)"),"Giro solo luego de comenzar");
assert(modes.includes("sincronizarPantallaDuelo(false)"),"Volver al formulario");
assert(html.includes('duelo-conocimiento-horizontal.css?v=2'),"CSS enlazado");
assert(html.includes('Primero configurá los nombres con el celular vertical.'),"Ayuda de entrada");
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,"http://test").pathname;
  const file=path.resolve(root,"."+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader("Content-Type",({".html":"text/html",".css":"text/css",".js":"text/javascript",".webp":"image/webp",".png":"image/png"})[path.extname(file)]||"application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const base="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||"/usr/bin/chromium"});
 try{
   for(const [width,height] of [[844,390],[740,360],[1024,600],[390,844]]){
     const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:"block",reducedMotion:"reduce"});
     const page=await context.newPage();
     await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:""}));
     await page.goto(base+"/duelo-conocimiento.html",{waitUntil:"domcontentloaded"});
     assert(await page.locator("#input0").isVisible(),"El nombre se configura antes de empezar");
     assert(await page.locator("#input1").isVisible(),"El rival se configura antes de empezar");
     await page.evaluate(()=>{
       document.querySelector("#setup-overlay").classList.add("hidden");
       document.querySelector("#roulette-overlay").classList.add("hidden");
       document.querySelector("#result-overlay").classList.add("hidden");
       document.querySelector("#dots0").innerHTML='<span class="dot miss">✕</span>';
     });
     const bounds=await page.evaluate(()=>{
       const get=sel=>{const el=document.querySelector(sel),r=el.getBoundingClientRect();
         return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width,height:r.height};};
       return {
         scrollX:document.documentElement.scrollWidth-document.documentElement.clientWidth,
         scrollY:document.documentElement.scrollHeight-document.documentElement.clientHeight,
         stage:get("#stage"),question:get(".question-frame"),answer:get("#answer-form"),pass:get("#pass-button"),
         errorDot:get("#dots0 .dot.miss"),errorDotFont:parseFloat(getComputedStyle(document.querySelector("#dots0 .dot.miss")).fontSize),
         areas:getComputedStyle(document.querySelector(".stage-grid")).gridTemplateAreas,
         media:matchMedia("(orientation:landscape) and (max-height:760px)").matches
       };
     });
     if(width>height){
       assert(bounds.media,"Prueba horizontal activa");
       assert(bounds.areas.includes("left")&&bounds.areas.includes("right"),"Tres columnas: jugador, pregunta, rival");
       assert(bounds.scrollX<=2&&bounds.scrollY<=2,"Partida sin scroll "+width+"x"+height+": "+JSON.stringify(bounds));
       assert(bounds.errorDot.width>=12&&bounds.errorDot.height>=12&&bounds.errorDotFont<=bounds.errorDot.height,
         "La cruz debe entrar en el marcador rojo: "+JSON.stringify(bounds.errorDot));
       for(const [label,b] of [["pregunta",bounds.question],["respuesta",bounds.answer],["paso",bounds.pass]]){
         assert(b.x>=-2&&b.right<=width+2&&b.y>=-2&&b.bottom<=height+2,
           label+" fuera de "+width+"x"+height+": "+JSON.stringify(b));
       }
     }else{
       assert(!bounds.media,"La configuración y el estilo vertical no se fuerzan a horizontal");
     }
     await context.close();
   }
   console.log("PASS: partida horizontal sin scroll, pregunta y controles visibles, nombres antes del giro");
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
