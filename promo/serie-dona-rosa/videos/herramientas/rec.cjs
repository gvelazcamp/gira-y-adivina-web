const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('http://localhost:8794/promo/serie-dona-rosa/capitulo-'+(process.argv[3]||2)+'.html');await p.waitForTimeout(1500);await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
const N=Math.ceil((await p.evaluate(()=>TOTAL))*30);for(let f=0;f<N;f++){await p.evaluate(t=>{T=t;pintar();},f/30);await p.screenshot({path:`${process.argv[2]}/fr/${String(f).padStart(5,'0')}.jpg`,type:'jpeg',quality:90});}
console.log('frames',N);await b.close();})();
