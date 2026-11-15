const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('=== STARTING GEOLOGICAL SAMPLE DISCOVERY & SCANNER ACCEPTANCE TEST ===');
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
    console.log('✓ Initial Exterior Astronaut Position:', spawnPos);

    // =========================================================================
    // TEST SECTION A: VERIFY ALL FOUR GEOLOGICAL SAMPLE SITES EXIST
    // =========================================================================
    console.log('2. Verifying all four geological specimen sites exist in the scene...');
    await page.waitForFunction(() => typeof window.__GEOLOGICAL_SAMPLES__ !== 'undefined');
    const samples = await page.evaluate(() => window.__GEOLOGICAL_SAMPLES__);
    console.log('✓ Detected Geological Samples Count:', samples.length);

    if (!Array.isArray(samples) || samples.length !== 4) {
      throw new Error(`Expected exactly 4 geological samples, found: ${samples?.length}`);
    }

    const expectedNames = ['Genesis Anorthosite', 'Lunar Basalt', 'Impact Breccia', 'Volcanic Glass'];
    for (const expected of expectedNames) {
      const found = samples.find((s) => s.name === expected);
      if (!found) throw new Error(`Missing expected specimen: "${expected}"`);
      console.log(`✓ Specimen Verified: "${found.name}" at [${found.position.map((v) => v.toFixed(2)).join(', ')}]`);
      if (found.position[1] < -0.1 || found.position[1] > 25.0) {
        throw new Error(`Specimen ${found.name} elevation Y=${found.position[1]} is invalid (underground or floating)!`);
      }
    }

    // Verify Mission HUD sample counter card exists
    await page.waitForSelector('.lunar-sample-tracker-card', { timeout: 5000 });
    const trackerInitialText = await page.$eval('.lunar-sample-tracker-card', (el) => el.textContent);
    console.log('✓ Initial HUD Tracker Text:', trackerInitialText);
    if (!trackerInitialText.includes('SAMPLES: 0/4')) {
      throw new Error(`Expected tracker to display "SAMPLES: 0/4", got: "${trackerInitialText}"`);
    }
    if (!trackerInitialText.includes('Genesis Anorthosite')) {
      throw new Error(`Expected next target to be Genesis Anorthosite, got: "${trackerInitialText}"`);
    }

    // =========================================================================
    // TEST SECTION B: BOARD ROVER & TEST GEOLOGICAL SURFACE SCANNER
    // =========================================================================
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

    console.log('3. Walking across base foundation to board Lunar Rover...');
    await walkToAxis('z', 3.5, 0.4);
    await walkToAxis('x', 0.5, 0.4);
    await sleep(400);

    await page.keyboard.press('KeyE');
    await sleep(600);

    const isDriving = await page.evaluate(() => window.__ROVER_STATE__?.isDriving);
    if (!isDriving) throw new Error('Rover isDriving is not true!');
    console.log('✓ Successfully boarded Lunar Rover');

    // Drive forward and navigate toward Site Alpha [28.0, -32.0]
    console.log('4. Driving Rover towards Site Alpha to trigger Surface Scanner within 25m...');
    await page.keyboard.down('KeyW');
    await sleep(2500);

    // Steer towards exploration basin
    await page.keyboard.down('KeyA');
    await sleep(1500);
    await page.keyboard.up('KeyA');
    await sleep(1500);
    await page.keyboard.up('KeyW');
    await sleep(400);

    // Active braking
    await page.keyboard.down('Space');
    await sleep(600);
    await page.keyboard.up('Space');
    await sleep(300);

    // Approach Site Alpha within 25m
    for (let i = 0; i < 26; i++) {
      const r = await page.evaluate(() => window.__ROVER_STATE__);
      if (!r) break;
      const [rx, , rz] = r.position;
      const dist = Math.hypot(rx - 28.0, rz - -32.0);
      if (dist < 18.0) break;

      await page.keyboard.down('KeyW');
      if (rx < 27.0) await page.keyboard.down('KeyD');
      else await page.keyboard.up('KeyD');

      if (rz > -31.0) await page.keyboard.down('KeyA');
      else await page.keyboard.up('KeyA');

      await sleep(150);
    }
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyA');
    await page.keyboard.up('KeyD');
    await sleep(500);

    const roverPosNearSite = await page.evaluate(() => window.__ROVER_STATE__);
    console.log('✓ Rover Position within Scanner Range:', roverPosNearSite?.position);

    // Verify Surface Scanner notification appears on Dashboard
    console.log('5. Verifying Rover Geological Scanner Detection within 25m...');
    await page.waitForSelector('.rover-scanner-notification', { timeout: 6000 });
    const scannerText = await page.$eval('.rover-scanner-notification', (el) => el.textContent);
    console.log('✓ Rover Scanner Content:', scannerText);

    if (!scannerText.includes('Genesis Anorthosite')) {
      throw new Error(`Scanner does not display "Genesis Anorthosite", got: "${scannerText}"`);
    }
    if (!scannerText.includes('RANGE') && !scannerText.includes('m')) {
      throw new Error(`Scanner missing distance/range readout, got: "${scannerText}"`);
    }

    const scannerArrow = await page.$('.rover-scanner-arrow');
    const scannerDirection = await page.$eval('.rover-scanner-direction', (el) => el.textContent);
    console.log('✓ Directional Indicator Active:', !!scannerArrow, `(${scannerDirection})`);
    if (!scannerArrow || !scannerDirection) {
      throw new Error('Rover scanner directional indicator is missing!');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'discovery_01_rover_scanner.png') });
    console.log('✓ Captured discovery_01_rover_scanner.png');

    // =========================================================================
    // TEST SECTION C: DISEMBARK & COLLECT SPECIMEN
    // =========================================================================
    console.log('6. Disembarking Rover to collect specimen on foot...');
    await page.keyboard.press('KeyE');
    await sleep(800);

    const posAfterDisembark = await page.evaluate(() => window.__PLAYER_POS__);
    console.log('✓ Astronaut Position after Disembarking:', posAfterDisembark);

    // Walk directly to Genesis Anorthosite rock at [28, -32]
    await walkToAxis('x', 28.0, 0.4);
    await walkToAxis('z', -32.0, 0.4);
    await sleep(400);

    const posAtRock = await page.evaluate(() => window.__PLAYER_POS__);
    console.log('✓ Astronaut Position at Rock Specimen:', posAtRock);

    // Verify Specimen Notification Badge in lower-right
    await page.waitForSelector('.specimen-notification-badge', { timeout: 5000 });
    const badgeText = await page.$eval('.specimen-notification-badge', (el) => el.textContent);
    console.log('✓ Specimen Notification Badge:', badgeText);

    if (!badgeText.includes('Genesis Anorthosite')) {
      throw new Error(`Badge does not display "Genesis Anorthosite", got: "${badgeText}"`);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'discovery_02_on_foot_badge.png') });
    console.log('✓ Captured discovery_02_on_foot_badge.png');

    // Open Inspection Modal
    console.log('7. Opening Specimen Inspection Modal...');
    await page.click('.specimen-notification-badge');
    await page.waitForSelector('.nasa-modal-card h2', { timeout: 5000 });
    await sleep(400);

    const modalTitle = await page.$eval('.nasa-modal-card h2', (el) => el.textContent);
    console.log('✓ Opened Specimen Modal Title:', modalTitle);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'discovery_03_modal_inspection.png') });
    console.log('✓ Captured discovery_03_modal_inspection.png');

    // Click COLLECT & STORE IN ROVER
    console.log('8. Clicking COLLECT & STORE IN ROVER button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.nasa-modal-card button'));
      const collectBtn = btns.find((b) => b.textContent && b.textContent.includes('COLLECT'));
      if (collectBtn) collectBtn.click();
    });
    await sleep(600);

    // =========================================================================
    // TEST SECTION D: VERIFY COUNTER UPDATE & GREEN CONFIRMATION
    // =========================================================================
    console.log('9. Verifying HUD Exploration Counter updated to SAMPLES: 1/4...');
    await page.waitForSelector('.lunar-sample-tracker-card', { timeout: 5000 });
    const trackerUpdatedText = await page.$eval('.lunar-sample-tracker-card', (el) => el.textContent);
    console.log('✓ Updated HUD Tracker Text:', trackerUpdatedText);

    if (!trackerUpdatedText.includes('SAMPLES: 1/4')) {
      throw new Error(`Expected HUD counter to update to "SAMPLES: 1/4", got: "${trackerUpdatedText}"`);
    }
    if (!trackerUpdatedText.includes('Lunar Basalt')) {
      throw new Error(`Expected next target to advance to Lunar Basalt, got: "${trackerUpdatedText}"`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'discovery_04_sample_collected_counter.png') });
    console.log('✓ Captured discovery_04_sample_collected_counter.png');

    // =========================================================================
    // TEST SECTION E: PREVENT DUPLICATE COLLECTION
    // =========================================================================
    console.log('10. Verifying duplicate collection is prevented...');
    // Click badge to re-open modal for collected rock
    await page.click('.specimen-notification-badge');
    await page.waitForSelector('.nasa-modal-card h2', { timeout: 5000 });
    await sleep(300);

    const disabledBtnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.nasa-modal-card button'));
      const storedBtn = btns.find((b) => b.textContent && b.textContent.includes('STORED'));
      return { text: storedBtn?.textContent, disabled: storedBtn?.disabled };
    });
    console.log('✓ Re-opened Modal Status Button:', disabledBtnText);
    if (!disabledBtnText.disabled || !disabledBtnText.text?.includes('STORED IN ROVER')) {
      throw new Error('Duplicate collection button is not disabled or does not indicate stored status!');
    }

    // Press Escape to close modal
    await page.keyboard.press('Escape');
    await sleep(400);

    // =========================================================================
    // TEST SECTION F: PERSISTENCE ACROSS PAGE RELOAD
    // =========================================================================
    console.log('11. Testing persistence across page reload...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 60000 });
    await page.waitForFunction(() => !document.querySelector('.nasa-loading-overlay'), { timeout: 60000 });
    await sleep(800);

    const reloadedTrackerText = await page.$eval('.lunar-sample-tracker-card', (el) => el.textContent);
    console.log('✓ Reloaded HUD Tracker Text:', reloadedTrackerText);
    if (!reloadedTrackerText.includes('SAMPLES: 1/4') || !reloadedTrackerText.includes('Lunar Basalt')) {
      throw new Error(`Persistence failed on reload! got: "${reloadedTrackerText}"`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'discovery_05_reloaded_persistence.png') });
    console.log('✓ Captured discovery_05_reloaded_persistence.png');

    console.log('Total Console Errors detected:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
      throw new Error(`Detected console errors during verification: ${consoleErrors.join('\n')}`);
    }

    console.log('=== ALL GEOLOGICAL SAMPLE DISCOVERY & SCANNER TESTS PASSED 100% ===');
  } catch (err) {
    console.error('TEST ERROR:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'discovery_test_error.png') });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
