const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTest() {
  console.log('--- STARTING COMPACT ROVER DASHBOARD HUD TEST ---');
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

    console.log('2. Walking astronaut across base to Lunar Rover...');
    // Walk South (Z: -5 -> 3.5)
    await walkToAxis('z', 3.5, 0.4);
    // Walk East to Rover driver boarding threshold (X: -11 -> 0.5)
    await walkToAxis('x', 0.5, 0.4);
    await sleep(400);

    const posNearRover = await getPos();
    console.log('✓ Pos near rover:', posNearRover);

    const promptText = await page.$eval('.nasa-prompt-action', (el) => el.textContent).catch(() => '');
    console.log('✓ Prompt near Rover:', promptText);
    if (!promptText.includes('ENTER LUNAR ROVER')) {
      throw new Error(`Expected prompt "ENTER LUNAR ROVER", got: "${promptText}"`);
    }

    // Enter rover
    console.log('3. Pressing [E] to board Lunar Rover...');
    await page.keyboard.press('KeyE');
    await sleep(800);

    // 4. Verify Rover Dashboard HUD is mounted and measure dimensions
    const dashboard = await page.$('.rover-dashboard-container');
    if (!dashboard) {
      throw new Error('RoverDashboardHUD failed to mount after entering rover!');
    }

    const box = await dashboard.boundingBox();
    console.log(`✓ Dashboard bounding box: width=${box.width.toFixed(1)}px, height=${box.height.toFixed(1)}px, x=${box.x.toFixed(1)}, y=${box.y.toFixed(1)}`);

    // Verify width is approximately 600-700px on desktop
    if (box.width > 700 || box.width < 500) {
      throw new Error(`Dashboard width ${box.width}px is outside target desktop range (600-700px)!`);
    }
    console.log(`✓ Width requirement met: ${box.width.toFixed(1)}px (target ~600-700px)`);

    // Verify height is reduced (previously ~227-280px, target reduced by 35-40% -> ~115-155px)
    if (box.height > 165) {
      throw new Error(`Dashboard height ${box.height}px is too tall (expected <= 165px)!`);
    }
    console.log(`✓ Height requirement met: ${box.height.toFixed(1)}px (reduced by ~40% from previous ~227px)`);

    // Verify docked bottom center
    const viewport = page.viewport();
    const centerX = box.x + box.width / 2;
    const viewCenterX = viewport.width / 2;
    const centerDiff = Math.abs(centerX - viewCenterX);
    console.log(`✓ Centering: dashboard center=${centerX.toFixed(1)}, viewport center=${viewCenterX.toFixed(1)}, diff=${centerDiff.toFixed(1)}px`);
    if (centerDiff > 10) {
      throw new Error(`Dashboard is not docked at center! diff=${centerDiff}`);
    }

    const bottomGap = viewport.height - (box.y + box.height);
    console.log(`✓ Bottom docking: bottom gap=${bottomGap.toFixed(1)}px`);
    if (bottomGap > 30) {
      throw new Error(`Dashboard is too high from bottom! bottomGap=${bottomGap}`);
    }

    // 5. Test driving the rover with W
    console.log('5. Accelerating rover forward with [W]...');
    await page.keyboard.down('KeyW');
    await sleep(2500);

    const telemetryWhileDriving = await page.evaluate(() => window.__ROVER_STATE__);
    console.log('✓ Driving telemetry:', telemetryWhileDriving);
    if (!telemetryWhileDriving || telemetryWhileDriving.speed < 0.5) {
      throw new Error(`Rover failed to accelerate! speed=${telemetryWhileDriving?.speed}`);
    }

    // Steer with A/D
    console.log('6. Testing steering with [A] and [D]...');
    await page.keyboard.down('KeyA');
    await sleep(1000);
    await page.keyboard.up('KeyA');
    await page.keyboard.down('KeyD');
    await sleep(1000);
    await page.keyboard.up('KeyD');

    // Test braking with Space
    console.log('7. Testing braking with [Space]...');
    await page.keyboard.up('KeyW');
    await page.keyboard.down('Space');
    await sleep(800);
    await page.keyboard.up('Space');

    // Capture driving screenshot with compact dashboard
    const screenshotPath = path.join(SCREENSHOT_DIR, 'rover_compact_dashboard_driving.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`✓ Captured screenshot at: ${screenshotPath}`);

    // Verify telemetry DOM elements
    const dashboardText = await page.$eval('.rover-dashboard-container', (el) => el.textContent);
    console.log('✓ Dashboard text content preview:', dashboardText.substring(0, 180));

    if (!dashboardText.includes('NASA MMSEV')) {
      throw new Error('Dashboard missing NASA MMSEV label!');
    }
    if (!dashboardText.includes('km/h') || !dashboardText.includes('Li-Ion')) {
      throw new Error('Dashboard missing speed or battery labels!');
    }
    if (!dashboardText.includes('W/S Drive') || !dashboardText.includes('A/D Steer')) {
      throw new Error('Dashboard missing controls footer!');
    }

    // 8. Test disembark
    console.log('8. Testing disembark with [E]...');
    await page.keyboard.press('KeyE');
    await sleep(1000);

    const dashboardAfterExit = await page.$('.rover-dashboard-container');
    if (dashboardAfterExit) {
      throw new Error('Rover dashboard should unmount after disembarking!');
    }
    console.log('✓ Rover dashboard unmounted after disembark');

    const finalPlayerPos = await getPos();
    console.log('✓ Astronaut position after disembarking:', finalPlayerPos);

    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected: ${JSON.stringify(consoleErrors)}`);
    }

    console.log('\n========================================');
    console.log('ALL COMPACT ROVER DASHBOARD TESTS PASSED!');
    console.log('========================================');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
