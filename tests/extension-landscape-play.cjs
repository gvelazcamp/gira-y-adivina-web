const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://local').pathname;
  const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type', {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'}[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});

const starts = {
  'puzzle':[],
  'tutti-frutti':['#tfBienvOk','#tfCrear'],
  'palabra-secreta':['#psAyudaPanel button'],
  'frases-en-giro':['#fgPanel button'],
  'memoria-en-giro':['#mgPanel button'],
  'rosco-rioplatense':['#rrPanel button'],
  'silabario-rioplatense':['#sbPanel .sf-principal'],
  'cien-rioplatenses':['#crBienvOk','#crJugar'],
  'ahorcado-rioplatense':['#ahPanel .sf-acciones button'],
  'contra-reloj-rioplatense':['#crr-grupoOk','#crr-normalBtn','#crr-lSetupGo'],
  'impostor':['.pf-bienv button:last-of-type','#impCats button'],
  'mimica':['.pf-bienv button:last-of-type','#mimEmpezar'],
  'canta-la-cancion':['.pf-bienv button:last-of-type','#ctaEmpezar'],
  'sopa-fugaz':['#sfPanel button'],
  'quien-soy':['.pf-bienv button:last-of-type','.qs-tarjeta'],
  'bomba':['.pf-bienv button:last-of-type','#bbEmpezar'],
  'que-numero-soy':['.pf-bienv button:last-of-type','#qnsEmpezar'],
  'rueda-de-letras':['#rlPanel .sf-principal'],
  'moon-tap':['#mtPanel .sf-principal'],
  'tele':['#tlSoyCelular']
};

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
  try {
    const context = await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
    const page = await context.newPage();
    const pageErrors = [];
    let activeId = '';
    page.on('pageerror', e => pageErrors.push(activeId+': '+e.stack));
    await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.fulfill({status:200,body:''}));
    await page.addInitScript(() => {try{localStorage.setItem('gya_nombre','Gonzalo');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');}catch(e){}});
    await page.goto(base, {waitUntil:'load'});
    await page.evaluate(() => {document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelector('#setup').style.display='none';Fichas.usar=()=>true;});
    for (const [id, selectors] of Object.entries(starts)) {
      activeId=id;
      const result = await page.evaluate(({id, selectors}) => {
        Extensiones.cerrar();Extensiones.abrirJuego(id);
        const clicks=[];
        for (const selector of selectors) {
          const button=document.querySelector(selector);
          if(button){button.click();clicks.push(selector);}else clicks.push('MISSING '+selector);
        }
        const shell=document.querySelector('#extShell');
        const fixed=[...document.querySelectorAll('#extContenido .qns-pantalla')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none').map(e=>({height:e.clientHeight,scroll:e.scrollHeight}));
        const buttons=[...document.querySelectorAll('#extContenido button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility==='visible';});
        return {id,clicks,root:document.querySelector('#extContenido > :first-child')?.className,scroll:shell.scrollHeight-shell.clientHeight,
          horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,fixed,
          controlsBelow:buttons.filter(e=>e.getBoundingClientRect().top>innerHeight).slice(0,8).map(e=>e.id||e.textContent.trim().slice(0,25))};
      }, {id,selectors});
      if (id === 'puzzle') {
        await page.frameLocator('iframe[title="Puzzle"]').locator('body').waitFor({state:'visible'});
        result.frame = await page.frameLocator('iframe[title="Puzzle"]').locator('body').evaluate(el=>({width:el.scrollWidth,height:el.scrollHeight,viewportWidth:innerWidth,viewportHeight:innerHeight}));
      }
      console.log(JSON.stringify(result));
      assert(!result.horizontalOverflow, id+' overflows horizontally');
      assert(!result.clicks.some(click => click.startsWith('MISSING ')), id+' did not reach the expected gameplay state');
      if (id === 'tutti-frutti' || id === 'contra-reloj-rioplatense')
        assert.deepEqual(result.controlsBelow, [], id+' hides actions below the landscape viewport');
      if (process.env.UI_SCREENSHOTS) await page.screenshot({path:path.join(process.env.UI_SCREENSHOTS,id+'-active.png')});
    }
    assert.deepEqual(pageErrors, [], 'page errors while starting games');
  } finally {await browser.close();server.close();}
})().catch(e => {console.error(e);server.close();process.exitCode=1;});
