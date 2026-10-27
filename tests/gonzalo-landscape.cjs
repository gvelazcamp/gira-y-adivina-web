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
    for (const name of ['Gonzalo', 'Vale']) {
      const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.fulfill({status:200,body:''}));
      await page.addInitScript(n => {localStorage.setItem('gya_nombre',n);localStorage.setItem('gya_avatar','avatar-01');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');}, name);
      await page.goto(base, {waitUntil:'load'});
      await page.evaluate(() => {
        document.querySelector('#splash')?.remove();
        document.documentElement.classList.remove('cargando');
        document.querySelectorAll('.capa.ver').forEach(el => el.classList.remove('ver'));
        $('setup').style.display='none';$('juego').style.display='block';
        modo='bot';miJug=0;arranca=0;meta.pistasGratis=0;enTutorial=false;
        armarTeclado();iniciarPartida(perfil.nombre,'Margarita');
        S.frase='EL JUEGO RIOPLATENSE';S.cat='Montevideo';publicar('Te toca jugar.');
      });
      const access=await page.evaluate(() => ({name:perfil.nombre,admin:document.body.classList.contains('gonzalo-admin'),display:getComputedStyle($('bHorizontalJuego')).display}));
      assert.equal(await page.locator('#bHorizontalJuego').isVisible(), name === 'Gonzalo', JSON.stringify(access));
      if (name === 'Gonzalo') {
        await page.locator('#bHorizontalJuego').click();
        assert.equal(await page.locator('#bHorizontalJuego').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#juego').evaluate(el => getComputedStyle(el).display), 'block');
        assert.equal(await page.locator('#horizontalAyuda').isVisible(), true);
        await page.setViewportSize({width:844,height:390});
        const layout = await page.evaluate(() => {
          const board=$('tablero').getBoundingClientRect(), panel=$('juego').querySelector('.zona').getBoundingClientRect();
          return {board, panel, overflow:document.documentElement.scrollWidth>innerWidth};
        });
        assert(layout.panel.x > layout.board.x + layout.board.width - 2, JSON.stringify(layout));
        assert(!layout.overflow, 'landscape has horizontal overflow');
        if (process.env.UI_SCREENSHOTS) await page.screenshot({path:path.join(process.env.UI_SCREENSHOTS,'gonzalo-landscape.png')});
        await page.evaluate(() => $('juego').style.display='none');
        await page.waitForFunction(() => !document.body.classList.contains('modo-horizontal'));
        assert.equal(await page.locator('#bHorizontalJuego').getAttribute('aria-pressed'), 'false');
      } else {
        await page.setViewportSize({width:844,height:390});
        assert.equal(await page.locator('#juego').evaluate(el => getComputedStyle(el).display), 'block');
      }
      assert.deepEqual(errors, [], name + ' page errors');
      await context.close();
    }
    console.log('PASS Gonzalo landscape game; other profiles unchanged');
  } finally {await browser.close();server.close();}
})().catch(e => {console.error(e);server.close();process.exitCode=1;});
