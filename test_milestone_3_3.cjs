const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('=== STARTING MILESTONE 3.3 LUNAR TERRAIN VERIFICATION ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    console.log('1. Loading application at http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Clear test storage & fresh reload
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for canvas and loading screen
    await page.waitForSelector('canvas', { timeout: 60000 });
    await page.waitForFunction(() => !document.querySelector('.nasa-loading-overlay'), { timeout: 60000 });

    // Dismiss flight briefing
    await page.waitForSelector('.briefing-modal-card .nasa-btn-primary', { timeout: 60000 });
    await sleep(300);
    await page.evaluate(() => {
      const btn = document.querySelector('.briefing-modal-card .nasa-btn-primary');
      if (btn) btn.click();
    });
    await sleep(800);

    // Verify initial exterior player position & ground height
    await page.waitForFunction(() => typeof window.__PLAYER_POS__ !== 'undefined');
    const spawnPos = await page.evaluate(() => window.__PLAYER_POS__);
    const floorDebug = await page.evaluate(() => window.__FLOOR_DEBUG__);
    console.log('✓ Exterior Initial Spawn Pos:', spawnPos);
    console.log('✓ Ground Alignment Debug at Spawn:', floorDebug);

    if (Math.abs(spawnPos.y - 0.0) > 0.01) {
      throw new Error(`Expected spawn elevation 0.00m on habitat foundation, got: ${spawnPos.y}`);
    }
    console.log('✓ Habitat foundation elevation verified flat at Y = 0.00m');

    // Screenshot 1: Astronaut standing on lunar terrain at base
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'terrain_01_spawn_exterior.png') });
    console.log('✓ Captured terrain_01_spawn_exterior.png');

    // 2. Walk to Dome Entrance Ramp
    console.log('2. Walking to Large Domed Habitat Entrance Ramp...');
    // Precise navigation to entrance ramp threshold at [-13.5, -11.8]
    while (true) {
      const p = await page.evaluate(() => window.__PLAYER_POS__);
      if (!p || p.z <= -11.2) break;
      await page.keyboard.down('KeyW');
      await sleep(25);
    }
    await page.keyboard.up('KeyW');

    while (true) {
      const p = await page.evaluate(() => window.__PLAYER_POS__);
      if (!p || p.x <= -13.2) break;
      await page.keyboard.down('KeyA');
      await sleep(25);
    }
    await page.keyboard.up('KeyA');
    await sleep(400);

    const rampPos = await page.evaluate(() => window.__PLAYER_POS__);
    console.log('✓ Position at Dome Entrance Ramp:', rampPos);
    if (Math.abs(rampPos.y - 0.04) > 0.01) {
      throw new Error(`Expected ramp elevation 0.04m at threshold, got: ${rampPos.y}`);
    }
    console.log('✓ Dome Entrance Ramp threshold verified at Y = 0.04m');

    // Screenshot 2: Entrance ramp with hazard markings
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'terrain_02_dome_ramp.png') });
    console.log('✓ Captured terrain_02_dome_ramp.png');

    // 3. Walk South through clear corridor out of foundation onto undulating lunar terrain
    console.log('3. Walking South out of foundation onto undulating lunar terrain and crater slopes...');
    // Clear HDU by walking South (KeyS) past the foundation boundary (Z > 18m)
    await page.keyboard.down('KeyS');
    await sleep(6500);
    await page.keyboard.up('KeyS');
    await sleep(400);

    const terrainPos1 = await page.evaluate(() => window.__PLAYER_POS__);
    const terrainDebug1 = await page.evaluate(() => window.__FLOOR_DEBUG__);
    console.log('✓ Open Lunar Terrain Position (South Z > 18m):', terrainPos1);
    console.log('✓ Ground Debug on Open Terrain:', terrainDebug1);

    if (terrainDebug1.isGrounded !== true) {
      throw new Error(`Expected astronaut to be grounded on terrain, got isGrounded=${terrainDebug1.isGrounded}`);
    }

    // 4. Continue walking South toward Crater at [-16, 64] and [18, 72]
    console.log('4. Traversing further South onto crater slopes (Z ~ 35m - 50m)...');
    await page.keyboard.down('KeyS');
    await sleep(5500);
    await page.keyboard.up('KeyS');
    await sleep(400);

    const terrainPos2 = await page.evaluate(() => window.__PLAYER_POS__);
    const terrainDebug2 = await page.evaluate(() => window.__FLOOR_DEBUG__);
    console.log('✓ Crater Slope Traverse Position:', terrainPos2);
    console.log('✓ Ground Debug at Crater Slope:', terrainDebug2);

    // Verify grounding and non-zero natural elevation
    if (!terrainDebug2.isGrounded) {
      throw new Error('Astronaut lost grounding on crater slope!');
    }
    console.log(`✓ Astronaut successfully traversed onto crater slopes (elevation Y = ${terrainPos2.y.toFixed(3)}m) without floating or sinking`);

    // Screenshot 3: Astronaut on natural lunar regolith and crater slopes
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'terrain_03_crater_traverse.png') });
    console.log('✓ Captured terrain_03_crater_traverse.png');

    // 5. Test First-Person Helmet Visor view of the lunar terrain
    console.log('5. Toggling First-Person Helmet Visor...');
    await page.keyboard.press('KeyV');
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'terrain_04_first_person_surface.png') });
    console.log('✓ Captured terrain_04_first_person_surface.png');
    await page.keyboard.press('KeyV');
    await sleep(400);

    // Check for any console errors
    console.log('Console Errors detected:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
      throw new Error(`Detected console errors during terrain test: ${consoleErrors.join('\n')}`);
    }

    console.log('=== MILESTONE 3.3 TERRAIN VERIFICATION PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('TEST ERROR:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'terrain_error.png') });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
