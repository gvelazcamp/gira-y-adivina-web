const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8794/promo/serie-dona-rosa/capitulo-'+(process.argv[3]||2)+'.html');await p.waitForTimeout(1500);if(errs.length)console.log(errs);
for(const t of process.argv.slice(3).map(Number)){await p.evaluate(t=>{T=t;pintar();},t);await p.screenshot({path:`${process.argv[2]}/c_${t}.png`});}
await b.close();})();
