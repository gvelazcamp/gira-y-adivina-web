const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://local').pathname;
  const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'}[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
  try {
    const context = await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page = await context.newPage();
    await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.fulfill({status:200,body:''}));
    await page.addInitScript(() => {localStorage.setItem('gya_nombre','Gonzalo');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');});
    await page.goto(base, {waitUntil:'load'});
    await page.evaluate(() => {document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelectorAll('.capa.ver').forEach(el => el.classList.remove('ver'));document.querySelector('#setup').style.display='none';});
    const ids = await page.evaluate(() => EXTENSIONES.filter(e => e.estado === 'disponible').map(e => e.id));
    const failures = [];
    for (const id of ids) {
      const result = await page.evaluate(id => {
        try {
          Extensiones.cerrar();
          Extensiones.abrirJuego(id);
          document.querySelector('#crBienvenida')?.setAttribute('hidden', '');
          return {id, overflow:document.documentElement.scrollWidth > innerWidth,
            shellHeight:document.querySelector('#extShell')?.clientHeight,
            shellScroll:document.querySelector('#extShell')?.scrollHeight,
            fixed:!!document.querySelector('.qns-pantalla:not([hidden])')};
        } catch (e) { return {id, error:e.message}; }
      }, id);
      if (result.error || result.overflow) failures.push(result);
      console.log(JSON.stringify(result));
      if (process.env.UI_SCREENSHOTS && ['cien-rioplatenses','rueda-de-letras','rosco-rioplatense','frases-en-giro','moon-tap'].includes(id)) {
        await page.screenshot({path:path.join(process.env.UI_SCREENSHOTS, id + '.png')});
      }
    }
    assert.deepEqual(failures, [], 'landscape extension failures');
    await page.evaluate(() => {Extensiones.cerrar();Extensiones.abrirJuego('cien-rioplatenses');});
    await page.locator('#crBienvOk').click();
    await page.locator('#crJugar').click();
    await page.locator('#crForm').waitFor({state:'visible',timeout:10000});
    await page.waitForTimeout(400);
    await page.locator('#crEntrada').focus();
    await page.waitForTimeout(400);
    const answer = await page.evaluate(() => {
      const form=document.querySelector('#crForm').getBoundingClientRect();
      const shell=document.querySelector('#extShell').getBoundingClientRect();
      return {formBottom:form.bottom,shellBottom:shell.bottom,focused:document.activeElement.id};
    });
    assert.equal(answer.focused,'crEntrada');
    assert(answer.formBottom<=answer.shellBottom+1, 'answer hidden below screen: '+JSON.stringify(answer));
    console.log('PASS 100 Rioplatenses answer stays visible');
    for (const id of ['rueda-de-letras','frases-en-giro','rosco-rioplatense']) {
      await page.evaluate(id => {Extensiones.cerrar();Extensiones.abrirJuego(id);}, id);
      const start = page.locator('#extShell .sf-panel button.sf-principal');
      if (await start.count()) await start.first().click();
      if (process.env.UI_SCREENSHOTS) await page.screenshot({path:path.join(process.env.UI_SCREENSHOTS, id + '-playing.png')});
    }
    await context.close();
  } finally {await browser.close();server.close();}
})().catch(e => {console.error(e);server.close();process.exitCode=1;});
