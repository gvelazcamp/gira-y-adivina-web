const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,"http://local").pathname;
  const file=path.join(root,pathname==="/"?"index.html":pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader("Content-Type",{".html":"text/html",".js":"text/javascript",".css":"text/css",".webp":"image/webp",".png":"image/png"}[path.extname(file)]||"application/octet-stream");
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    for(const name of ["Gonzalo","Vale"]){
      const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:"block"});
      const page=await context.newPage();
      await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:""}));
      await page.addInitScript(n=>{
        localStorage.setItem("gya_nombre",n);
        localStorage.setItem("gya_avatar","avatar-01");
        localStorage.setItem("gya_pais","uruguay");
        localStorage.setItem("gya_bienvenida_vista","1");
      },name);
      await page.goto(base,{waitUntil:"load"});
      await page.waitForFunction(()=>typeof window.Extensiones==="object"&&typeof window.EXTENSIONES==="object");
      const results=await page.evaluate(()=>{
        document.querySelector("#splash")?.remove();
        document.documentElement.classList.remove("cargando");
        const gameIds=EXTENSIONES.filter(x=>x.estado==="disponible"&&
          (!x.soloGonzalo||esGonzalo())&&
          (!x.soloUsuarios||x.soloUsuarios.includes(perfil.nombre.toLowerCase()))).map(x=>x.id);
        // Test the shared extension container, without starting timers/multiplayer.
        const originals=EXTENSIONES.map(x=>x.abrir);
        EXTENSIONES.forEach(x=>x.abrir=el=>{el.innerHTML='<section class="sf-game">Juego de prueba</section>';});
        const out=[];
        for(const id of gameIds){
          Extensiones.abrirJuego(id);
          out.push({id,button:!!document.getElementById("extHorizontal"),
            width:document.querySelector(".ext-wrap")?.getBoundingClientRect().width});
        }
        Extensiones.abrirLobby();
        const lobbyVertical=!document.body.classList.contains("ext-horizontal");
        Extensiones.cerrar();
        const closed=!document.body.classList.contains("ext-horizontal");
        EXTENSIONES.forEach((x,i)=>x.abrir=originals[i]);
        return{out,lobbyVertical,closed};
      });
      assert(results.out.length>=15,"expected full extension catalog");
      for(const test of results.out){
        assert.equal(test.button,false,"no manual orientation button: "+test.id);
        assert(test.width>520,"landscape width available to every player: "+test.id);
      }
      assert(results.lobbyVertical&&results.closed,"landscape must not leak to lobby or other screens");
      await context.close();
    }
    console.log("PASS: landscape extension shell for every profile");
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
