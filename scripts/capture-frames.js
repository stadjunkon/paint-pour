// Снимает кадры анимации в headless Chromium (Playwright) с «замороженным» временем.
// Использование: node scripts/capture-frames.js [путь к index.html] [папка для кадров]
// Сценарий: Bring to life -> заливка -> Restore -> подсказка -> стряхивание.
// Время подменяется через window.__T: собирается тестовая копия страницы, где clock() читает __T.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const page = path.resolve(process.argv[2] || 'index.html');
  const outDir = path.resolve(process.argv[3] || 'frames');
  fs.mkdirSync(outDir, { recursive: true });
  const testFile = path.join(outDir, '_test.html');
  let html = fs.readFileSync(page, 'utf8')
    .replace('const clock = () => performance.now() / 1000;', 'const clock = () => window.__T ?? performance.now() / 1000;')
    .replace('  function frame() {\n', '  function frame() {\n    window.__fc = (window.__fc || 0) + 1;\n');
  fs.writeFileSync(testFile, html);

  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => console.log('page error:', e.message));
  // ждём, пока отрисуются ещё 3 кадра, чтобы скриншот не был устаревшим
  const settle = async () => {
    const f0 = await p.evaluate(() => window.__fc);
    await p.waitForFunction(f => window.__fc >= f + 3, f0, { timeout: 60000 });
  };
  const at = async (t, name) => { await p.evaluate(v => (window.__T = v), t); await settle(); await p.screenshot({ path: path.join(outDir, name + '.png') }); };

  await p.goto('file://' + testFile);
  await p.evaluate(() => (window.__T = 100));
  await settle();
  await p.click('#pour');                         // Bring to life
  for (const s of [0.25, 0.6, 1.0, 1.6]) await at(100 + s, `pour_${s}`);
  await p.click('#pour');                         // Restore -> подсказка 1 с, затем тряска
  for (const s of [0.5, 1.2, 1.4, 1.6, 1.9, 2.3]) await at(101.6 + s, `shake_${s}`);
  await b.close();
  console.log('кадры в', outDir);
})();
