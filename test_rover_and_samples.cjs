const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('=== STARTING LUNAR ROVER & SAMPLE COLLECTION ACCEPTANCE TEST ===');
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

    // 2. Walk directly across open base foundation to Lunar Rover parked at [2.5, 0, 4.0]
    console.log('2. Walking across open base foundation to Lunar Rover MMSEV at [2.5, 0, 4.0]...');
    // Walk South (Z: -5 -> 3.5)
    await walkToAxis('z', 3.5, 0.4);
    const posAfterZ = await getPos();
    console.log('✓ Pos after walkToAxis Z:', posAfterZ);
    // Walk East to Rover driver boarding threshold (X: -11 -> 0.5)
    await walkToAxis('x', 0.5, 0.4);
    const posAfterX = await getPos();
    console.log('✓ Pos after walkToAxis X:', posAfterX);
    await sleep(400);

    const posNearRover = await getPos();
    console.log('✓ Position near Lunar Rover:', posNearRover);

    // Verify interaction prompt appears
    const promptText = await page.$eval('.nasa-prompt-action', (el) => el.textContent).catch(() => '');
    console.log('✓ Prompt near Rover:', promptText);
    if (!promptText.includes('ENTER LUNAR ROVER')) {
      throw new Error(`Expected prompt to contain "ENTER LUNAR ROVER", got: "${promptText}"`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'rover_01_approach_prompt.png') });
    console.log('✓ Captured rover_01_approach_prompt.png');

    // 3. Enter Lunar Rover
    console.log('3. Pressing [E] to board Lunar Rover...');
    await page.keyboard.press('KeyE');
    await sleep(600);

    // Verify Rover Dashboard HUD is rendered
    const dashboard = await page.$('.rover-dashboard-container');
    if (!dashboard) {
      throw new Error('RoverDashboardHUD failed to mount after entering rover!');
    }
    console.log('✓ Rover Dashboard HUD active on screen');

    const roverState1 = await page.evaluate(() => window.__ROVER_STATE__);
    console.log('✓ Initial Rover State:', roverState1);
    if (!roverState1?.isDriving) {
      throw new Error('Rover isDriving state is not true!');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'rover_02_cockpit_dashboard.png') });
    console.log('✓ Captured rover_02_cockpit_dashboard.png');

    // 4. Drive Rover Forward with [W] & Accelerate
    console.log('4. Driving Rover forward across lunar terrain with [W]...');
    await page.keyboard.down('KeyW');
    await sleep(2500);
    const drivingTelemetry = await page.evaluate(() => window.__ROVER_STATE__);
    console.log('✓ Driving Telemetry under forward throttle:', drivingTelemetry);
    if (drivingTelemetry.speed <= 0.5) {
      throw new Error(`Rover failed to accelerate forward! speed=${drivingTelemetry.speed}`);
    }
    console.log(`✓ Rover accelerating at ${drivingTelemetry.speed.toFixed(2)} m/s (${(drivingTelemetry.speed * 3.6).toFixed(1)} km/h)`);

    // Steer slightly East
    await page.keyboard.down('KeyA');
    await sleep(1500);
    await page.keyboard.up('KeyA');
    await sleep(1500);
    await page.keyboard.up('KeyW');
    await sleep(500);

    // Test Hydraulic Braking with [Space]
    console.log('✓ Testing active braking with [Space]...');
    await page.keyboard.down('Space');
    await sleep(600);
    await page.keyboard.up('Space');
    await sleep(300);

    const postBrakeTelemetry = await page.evaluate(() => window.__ROVER_STATE__);
    console.log('✓ Rover Stopped Telemetry:', postBrakeTelemetry);
    console.log(`✓ Total Odometer Distance Driven: ${postBrakeTelemetry.distance.toFixed(1)} meters`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'rover_03_driving_traverse.png') });
    console.log('✓ Captured rover_03_driving_traverse.png');

    // 5. Drive to Geological Sample Site Alpha (Anorthosite at [28, -32])
    console.log('5. Navigating Rover to Geological Specimen Site Alpha at [28, -32]...');
    // Drive toward X ~ 26, Z ~ -30
    for (let i = 0; i < 25; i++) {
      const r = await page.evaluate(() => window.__ROVER_STATE__);
      if (!r) break;
      const [rx, , rz] = r.position;
      const dist = Math.hypot(rx - 27.0, rz - -31.0);
      if (dist < 4.0) break;

      // Simple navigation toward target
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
    await sleep(500);

    const posAtSite = await page.evaluate(() => window.__ROVER_STATE__);
    console.log('✓ Rover Parked Position near Site Alpha:', posAtSite);

    // 6. Disembark Rover near Sample Site
    console.log('6. Disembarking Rover with [E]...');
    await page.keyboard.press('KeyE');
    await sleep(800);

    const disembarkPos = await page.evaluate(() => window.__PLAYER_POS__);
    console.log('✓ Astronaut On-Foot Position after Disembarking:', disembarkPos);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'rover_04_parked_disembark.png') });
    console.log('✓ Captured rover_04_parked_disembark.png');

    // 7. Approach Sample Specimen Marker
    console.log('7. Approaching Genesis Anorthosite specimen marker at [28, -32]...');
    await walkToAxis('x', 28.0, 0.4);
    await walkToAxis('z', -32.0, 0.4);
    await sleep(400);

    const posAtRock = await page.evaluate(() => window.__PLAYER_POS__);
    console.log('✓ Position at Geological Specimen:', posAtRock);

    const samplePrompt = await page.$eval('.nasa-prompt-action', (el) => el.textContent).catch(() => '');
    console.log('✓ Prompt at Rock Specimen:', samplePrompt);
    if (!samplePrompt.includes('INSPECT')) {
      throw new Error(`Expected prompt to contain "INSPECT", got: "${samplePrompt}"`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sample_01_specimen_marker.png') });
    console.log('✓ Captured sample_01_specimen_marker.png');

    // 8. Open Geological Specimen Inspection Modal
    console.log('8. Pressing [E] to open Specimen Inspection Modal...');
    await page.keyboard.press('KeyE');
    await page.waitForSelector('.nasa-modal-card h2', { timeout: 5000 });
    await sleep(400);

    const specimenTitle = await page.$eval('.nasa-modal-card h2', (el) => el.textContent);
    console.log('✓ Opened Specimen Inspection Modal for:', specimenTitle);
    if (!specimenTitle.includes('Genesis Anorthosite')) {
      throw new Error(`Expected modal title "Genesis Anorthosite", got: "${specimenTitle}"`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sample_02_inspection_modal.png') });
    console.log('✓ Captured sample_02_inspection_modal.png');

    // 9. Collect Sample & Store in Rover Inventory
    console.log('9. Collecting sample and storing into Rover geological payload...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.nasa-modal-card button'));
      const collectBtn = btns.find((b) => b.textContent && b.textContent.includes('COLLECT'));
      if (collectBtn) collectBtn.click();
    });
    await sleep(600);

    // Verify sample is marked collected in storage
    const savedSamples = await page.evaluate(() => {
      const raw = localStorage.getItem('nasa_lunar_samples_v1');
      return raw ? JSON.parse(raw) : null;
    });
    console.log('✓ Verified localStorage Sample Return Payload:', savedSamples?.map((s) => ({ id: s.id, collected: s.collected })));
    const anorthositeSaved = savedSamples?.find((s) => s.id === 'sample_anorthosite');
    if (!anorthositeSaved?.collected) {
      throw new Error('Sample was not saved as collected in localStorage!');
    }
    console.log('✓ Genesis Anorthosite successfully collected and logged in rover inventory!');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sample_03_collected_success.png') });
    console.log('✓ Captured sample_03_collected_success.png');

    // Check for any console errors
    console.log('Console Errors detected:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
      throw new Error(`Detected console errors during acceptance test: ${consoleErrors.join('\n')}`);
    }

    console.log('=== ALL LUNAR ROVER & SAMPLE COLLECTION TESTS PASSED FLAWLESSLY ===');
  } catch (err) {
    console.error('TEST ERROR:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'rover_test_error.png') });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
