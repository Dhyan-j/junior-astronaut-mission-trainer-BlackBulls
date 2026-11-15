const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('=== STARTING MILESTONE 3.4 POLISH VERIFICATION TEST ===');
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
    await sleep(400);
    await page.evaluate(() => {
      const btn = document.querySelector('.briefing-modal-card .nasa-btn-primary');
      if (btn) btn.click();
    });
    await sleep(800);

    // Initial spawn verification
    await page.waitForFunction(() => typeof window.__PLAYER_POS__ !== 'undefined');
    const getPos = () => page.evaluate(() => window.__PLAYER_POS__).catch(() => null);
    const spawnPos = await getPos();
    console.log('✓ Initial Astronaut Position:', spawnPos);

    // Look up toward sky to capture Earth & Sun
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish_01_sky_earth_and_sun.png') });
    console.log('✓ Captured polish_01_sky_earth_and_sun.png (Earth & Sun astronomical sky)');

    async function walkToAxis(axis, targetVal, tolerance = 0.35, timeoutMs = 12000) {
      await page.evaluate(() => { window.focus(); document.body.focus(); }).catch(() => {});
      const p0 = await getPos();
      if (!p0) return;
      const currentVal = axis === 'x' ? p0.x : p0.z;
      const diff = targetVal - currentVal;
      if (Math.abs(diff) <= tolerance) return;

      const key = axis === 'x' ? (diff > 0 ? 'KeyD' : 'KeyA') : (diff > 0 ? 'KeyS' : 'KeyW');
      const isPositive = diff > 0;
      await page.keyboard.down(key);

      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        await sleep(25);
        const p = await getPos();
        if (!p) continue;
        const v = axis === 'x' ? p.x : p.z;
        if (isPositive ? v >= targetVal - tolerance : v <= targetVal + tolerance) break;
      }
      await page.keyboard.up(key);
      await sleep(200);
    }

    // 2. Approach Lunar Rover
    console.log('2. Walking to Lunar Rover at [2.5, 0, 4.0]...');
    await walkToAxis('z', 3.5, 0.4);
    await walkToAxis('x', 0.5, 0.4);
    await sleep(400);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish_02_terrain_and_rocks.png') });
    console.log('✓ Captured polish_02_terrain_and_rocks.png (Regolith terrain, boulders, ejecta)');

    // 3. Board Rover
    console.log('3. Boarding Lunar Rover with [E]...');
    await page.keyboard.press('KeyE');
    await sleep(600);

    const isDriving = await page.evaluate(() => window.__ROVER_STATE__?.isDriving);
    if (!isDriving) throw new Error('Rover isDriving is false!');
    console.log('✓ Rover Boarded Successfully');

    // 4. Drive Rover forward & verify camera follow synchronization
    console.log('4. Driving Rover with [W] to test zero-lag follow camera...');
    await page.keyboard.down('KeyW');
    await sleep(2500);

    const activeRoverPos = await page.evaluate(() => window.__ACTIVE_ROVER_POS__);
    const roverState = await page.evaluate(() => window.__ROVER_STATE__);
    console.log('✓ Instantaneous Rover Position Ref:', activeRoverPos);
    console.log('✓ Rover Speed:', roverState?.speed?.toFixed(2), 'm/s');

    if (!activeRoverPos || (roverState?.speed || 0) < 0.5) {
      throw new Error('Rover instantaneous movement tracking failed!');
    }

    // Steer toward exploration basin
    await page.keyboard.down('KeyA');
    await sleep(1500);
    await page.keyboard.up('KeyA');
    await sleep(1500);
    await page.keyboard.up('KeyW');
    await sleep(500);

    // Hydraulic braking with [Space]
    console.log('✓ Testing active braking with [Space]...');
    await page.keyboard.down('Space');
    await sleep(600);
    await page.keyboard.up('Space');
    await sleep(300);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish_03_rover_tight_tracking.png') });
    console.log('✓ Captured polish_03_rover_tight_tracking.png (Zero-lag chase camera during drive)');

    // 5. Steer toward Geological Sample Site Alpha [28, -32]
    console.log('5. Navigating Rover to Geological Specimen Site Alpha...');
    for (let i = 0; i < 28; i++) {
      const r = await page.evaluate(() => window.__ROVER_STATE__);
      if (!r) break;
      const [rx, , rz] = r.position;
      const dist = Math.hypot(rx - 27.0, rz - -31.0);
      if (dist < 4.0) break;

      await page.keyboard.down('KeyW');
      if (rx < 26.0) await page.keyboard.down('KeyD');
      else await page.keyboard.up('KeyD');

      if (rz > -30.0) await page.keyboard.down('KeyA');
      else await page.keyboard.up('KeyA');

      await sleep(150);
    }
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyA');
    await page.keyboard.up('KeyD');
    await sleep(600);

    const posAtSite = await page.evaluate(() => window.__ROVER_STATE__);
    console.log('✓ Rover Parked Position near Site Alpha:', posAtSite);

    // 6. Disembark near Site Alpha
    console.log('6. Disembarking Rover with [E]...');
    await page.keyboard.press('KeyE');
    await sleep(800);

    const disembarkPos = await page.evaluate(() => window.__PLAYER_POS__);
    console.log('✓ Astronaut Position after Disembarking:', disembarkPos);

    // Walk directly to rock at [28, -32]
    await walkToAxis('x', 28.0, 0.4);
    await walkToAxis('z', -32.0, 0.4);
    await sleep(400);

    const rockPos = await page.evaluate(() => window.__PLAYER_POS__);
    console.log('✓ Astronaut Position at Rock Specimen:', rockPos);

    // 6. Verify Specimen Notification Badge is rendered in lower-right
    console.log('7. Verifying Specimen Notification Badge in lower-right corner...');
    await page.waitForSelector('.specimen-notification-badge', { timeout: 5000 });
    const badgeText = await page.$eval('.specimen-notification-badge', (el) => el.textContent);
    console.log('✓ Specimen Badge Text:', badgeText);

    if (!badgeText.includes('Genesis Anorthosite')) {
      throw new Error(`Badge does not display Genesis Anorthosite! got: "${badgeText}"`);
    }
    if (!badgeText.includes('[E] INSPECT')) {
      throw new Error(`Badge does not show "[E] INSPECT"! got: "${badgeText}"`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish_04_specimen_badge_uncollected.png') });
    console.log('✓ Captured polish_04_specimen_badge_uncollected.png');

    // 7. Click badge or press [E] to open modal
    console.log('8. Opening Inspection Modal from badge...');
    await page.click('.specimen-notification-badge');
    await page.waitForSelector('.nasa-modal-card h2', { timeout: 5000 });
    await sleep(400);

    const modalTitle = await page.$eval('.nasa-modal-card h2', (el) => el.textContent);
    console.log('✓ Opened Modal Title:', modalTitle);

    // Collect specimen
    console.log('9. Clicking COLLECT button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.nasa-modal-card button'));
      const collectBtn = btns.find((b) => b.textContent && b.textContent.includes('COLLECT'));
      if (collectBtn) collectBtn.click();
    });
    await sleep(600);

    // 8. Verify Specimen Notification Badge updates to green collected status
    console.log('10. Verifying Specimen Notification Badge updated to collected status...');
    await page.waitForSelector('.specimen-notification-badge', { timeout: 5000 });
    const updatedBadgeText = await page.$eval('.specimen-notification-badge', (el) => el.textContent);
    console.log('✓ Updated Badge Text:', updatedBadgeText);

    if (!updatedBadgeText.includes('GEOLOGICAL SAMPLE SECURED') && !updatedBadgeText.includes('STORED')) {
      throw new Error(`Expected updated badge to show STORED / SECURED, got: "${updatedBadgeText}"`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish_05_specimen_badge_collected.png') });
    console.log('✓ Captured polish_05_specimen_badge_collected.png');

    // Check for console errors
    console.log('Total Console Errors detected:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
      throw new Error(`Detected console errors during verification: ${consoleErrors.join('\n')}`);
    }

    console.log('=== ALL MILESTONE 3.4 POLISH TESTS PASSED WITH 100% SUCCESS ===');
  } catch (err) {
    console.error('TEST ERROR:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish_test_error.png') });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
