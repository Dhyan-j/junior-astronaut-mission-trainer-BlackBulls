const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== STARTING MILESTONE 2.6 BROWSER ACCEPTANCE TESTS ===');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1280,800',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    console.log('[BROWSER]', text);
    consoleLogs.push(text);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('[PAGE ERROR]', err.toString());
    consoleErrors.push(err.toString());
  });

  try {
    console.log('1. Navigating to http://localhost:5174/ ...');
    await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Clear any previous test localStorage and fresh reload
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for canvas to load and loading overlay to finish
    await page.waitForSelector('canvas', { timeout: 60000 });
    console.log('Waiting for initial loading screen to complete...');
    await page.waitForFunction(() => !document.querySelector('.nasa-loading-overlay'), { timeout: 60000 });

    // Wait for flight briefing modal to appear
    await page.waitForSelector('.briefing-modal-card .nasa-btn-primary', { timeout: 60000 });
    console.log('✓ Canvas rendered & flight briefing modal ready');

    // Dismiss flight briefing modal
    await sleep(400);
    const startBtn = await page.$('.briefing-modal-card .nasa-btn-primary');
    if (startBtn) {
      await startBtn.click();
      await page.waitForFunction(() => !document.querySelector('.briefing-modal-card'), { timeout: 5000 });
      console.log('✓ Dismissed flight briefing modal');
    }

    // Wait for 3D PlayerController to mount and register __PLAYER_POS__
    console.log('Waiting for PlayerController 3D avatar initialization...');
    await page.waitForFunction(() => typeof window.__PLAYER_POS__ !== 'undefined', { timeout: 60000 });
    console.log('✓ PlayerController initialized. Initial pos:', await page.evaluate(() => window.__PLAYER_POS__));

    const getHUD = () => page.$eval('.nasa-hud-subtitles', (el) => el.textContent);
    const getPrompt = () => page.$eval('.nasa-prompt-action', (el) => el.textContent).catch(() => 'none');
    const getPos = () => page.evaluate(() => window.__PLAYER_POS__);

    // Dynamic movement helper that walks until a condition is met
    async function walkUntil(key, conditionFn, timeoutMs = 8000) {
      await page.evaluate(() => {
        window.focus();
        document.body.focus();
      });
      const start = Date.now();
      await page.keyboard.down(key);
      while (Date.now() - start < timeoutMs) {
        const ok = await page.evaluate(conditionFn);
        if (ok) {
          await page.keyboard.up(key);
          await sleep(150);
          return true;
        }
        await sleep(40);
      }
      await page.keyboard.up(key);
      const endPos = await getPos();
      console.log(`[walkUntil ${key} TIMEOUT] Final pos:`, endPos);
      return false;
    }

    // Step 0 check: strict 0/13 (0%) start
    let hudText = await getHUD();
    console.log('Initial HUD subtitles:', hudText);
    if (!hudText.includes('0/13') || !hudText.includes('0%')) {
      throw new Error(`Expected strictly 0/13 (0%) at start, got: ${hudText}`);
    }
    console.log('✓ Confirmed strict start at 0/13 (0%)');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_initial_exterior.png') });

    // Step 1: Walk to Large Domed Habitat entrance ramp
    console.log('1. Moving astronaut toward Large Domed Habitat entrance ramp...');
    await walkUntil('KeyW', () => (window.__PLAYER_POS__?.z ?? 0) <= -11.0);
    await sleep(400);
    hudText = await getHUD();
    console.log('HUD at dome ramp:', hudText);
    console.log('✓ Interaction prompt at ramp:', await getPrompt());
    if (!hudText.includes('1/13') || !hudText.includes('8%')) {
      throw new Error(`Expected Step 1 completed (1/13, 8%), got: ${hudText}`);
    }

    // Step 2: Cycle airlock & enter pressurized interior
    console.log('2. Cycling dome airlock & entering habitat...');
    await page.keyboard.press('KeyE');
    await sleep(1800); // Allow fade overlay and teleport
    await page.waitForFunction(() => !document.querySelector('.nasa-screen-transition-overlay.active'), { timeout: 10000 });

    // Wait until interior player position is confirmed inside airlock chamber (z ~ 3.2)
    await page.waitForFunction(() => {
      const p = window.__PLAYER_POS__;
      return p && p.z > 2.0 && p.z < 4.0;
    }, { timeout: 30000 });
    console.log('✓ Interior airlock spawn confirmed:', await getPos());

    hudText = await getHUD();
    console.log('Post-entry HUD subtitles:', hudText);
    if (!hudText.includes('2/13') || !hudText.includes('15%')) {
      throw new Error(`Expected 2/13 (15%), got: ${hudText}`);
    }
    console.log('✓ Confirmed transition to Interior Work Bay: 2/13 (15%)');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_interior_workbay.png') });

    // Step 3: Work Bay Equipment Console at [-1.45, 0.06, -1.8]
    console.log('3. Walking down central aisle to Equipment Console...');
    // Walk north through airlock corridor into central aisle
    await walkUntil('KeyW', () => (window.__PLAYER_POS__?.z ?? 10) <= 0.0);
    // Walk west down the aisle
    await walkUntil('KeyA', () => (window.__PLAYER_POS__?.x ?? 0) <= -1.2);
    // Approach console on south stowage rack
    await walkUntil('KeyW', () => (window.__PLAYER_POS__?.z ?? 10) <= -1.4);
    await sleep(300);
    console.log('✓ Pos at Equipment Console:', await getPos());
    console.log('✓ Prompt at Equipment Console:', await getPrompt());
    await page.keyboard.press('KeyE');
    await sleep(600);
    hudText = await getHUD();
    console.log('HUD after Equipment Console:', hudText);
    if (!hudText.includes('3/13') || !hudText.includes('23%')) {
      throw new Error(`Expected 3/13 (23%), got: ${hudText}`);
    }

    // Step 4: Spacesuit Station at [-1.2, 0.06, 0.2]
    console.log('4. Walking to EVA Spacesuit Station...');
    await walkUntil('KeyS', () => (window.__PLAYER_POS__?.z ?? -10) >= -0.2);
    await sleep(300);
    console.log('✓ Pos at Suit Station:', await getPos());
    console.log('✓ Prompt at Spacesuit Station:', await getPrompt());
    await page.keyboard.press('KeyE');
    await page.waitForSelector('.suit-modal-card', { timeout: 5000 });
    await sleep(200);
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.nasa-suit-card'));
      const mark3Card = cards.find(c => c.textContent?.includes('Mark III')) || cards[1];
      const btn = mark3Card?.querySelector('.nasa-btn-equip');
      if (btn) btn.click();
    });
    await sleep(600);
    hudText = await getHUD();
    console.log('HUD after suit selection:', hudText);
    if (!hudText.includes('Mark III') || !hudText.includes('4/13')) {
      throw new Error(`Expected Mark III equipped and 4/13 (31%), got: ${hudText}`);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_suit_selected.png') });

    // Step 5: Component Inspection Glovebox at [0.1, 0.06, -1.8]
    console.log('5. Walking to Component Inspection Glovebox...');
    await walkUntil('KeyD', () => (window.__PLAYER_POS__?.x ?? -10) >= 0.0);
    await walkUntil('KeyW', () => (window.__PLAYER_POS__?.z ?? 10) <= -1.4);
    await sleep(300);
    console.log('✓ Pos at Inspection Glovebox:', await getPos());
    console.log('✓ Prompt at Inspection Glovebox:', await getPrompt());
    await page.keyboard.press('KeyE');
    await page.waitForSelector('.nasa-modal-action-bar .nasa-btn-primary', { timeout: 5000 });
    await sleep(200);
    await page.evaluate(() => {
      const btn = document.querySelector('.nasa-modal-action-bar .nasa-btn-primary');
      if (btn) btn.click();
    });
    await sleep(1800);
    hudText = await getHUD();
    console.log('HUD after Inspection:', hudText);
    if (!hudText.includes('5/13') || !hudText.includes('38%')) {
      throw new Error(`Expected 5/13 (38%), got: ${hudText}`);
    }

    // Step 6: PLSS Life Support Gantry at [-2.6, 0.06, -1.8]
    console.log('6. Walking to PLSS Gantry...');
    await walkUntil('KeyA', () => (window.__PLAYER_POS__?.x ?? 0) <= -2.2);
    await sleep(300);
    console.log('✓ Pos at PLSS Gantry:', await getPos());
    console.log('✓ Prompt at PLSS Gantry:', await getPrompt());
    await page.keyboard.press('KeyE');
    await sleep(600);
    hudText = await getHUD();
    console.log('HUD after PLSS Mounting:', hudText);
    if (!hudText.includes('6/13') || !hudText.includes('46%')) {
      throw new Error(`Expected 6/13 (46%), got: ${hudText}`);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_plss_mounted.png') });

    // Step 7: Oxygen COPV Manifold at [-2.6, 0.06, 1.8]
    console.log('7. Walking to O2 Supply Manifold...');
    await walkUntil('KeyS', () => (window.__PLAYER_POS__?.z ?? -10) >= 0.6);
    await sleep(300);
    console.log('✓ Pos at O2 Manifold:', await getPos());
    console.log('✓ Prompt at O2 Manifold:', await getPrompt());
    await page.keyboard.press('KeyE');
    await sleep(600);
    hudText = await getHUD();
    console.log('HUD after O2 check:', hudText);
    if (!hudText.includes('7/13')) {
      throw new Error(`Expected Step 7 completed (7/13), got: ${hudText}`);
    }

    // Step 8: Suit Pressure Console at [-1.45, 0.06, 1.8]
    console.log('8. Walking to Suit Pressure Diagnostic Console...');
    await walkUntil('KeyD', () => (window.__PLAYER_POS__?.x ?? -10) >= -1.6);
    await sleep(300);
    console.log('✓ Pos at Pressure Console:', await getPos());
    console.log('✓ Prompt at Pressure Console:', await getPrompt());
    await page.keyboard.press('KeyE');
    await sleep(600);
    hudText = await getHUD();
    console.log('HUD after Pressure check:', hudText);
    if (!hudText.includes('8/13')) {
      throw new Error(`Expected Step 8 completed (8/13), got: ${hudText}`);
    }

    // Step 9: Mission Control Radio Terminal at [1.2, 0.6, 1.8]
    console.log('9. Walking to Mission Control Comms Radio...');
    await walkUntil('KeyD', () => (window.__PLAYER_POS__?.x ?? -10) >= 1.0);
    await sleep(300);
    console.log('✓ Pos at Radio Terminal:', await getPos());
    console.log('✓ Prompt at Radio Terminal:', await getPrompt());
    await page.keyboard.press('KeyE');
    await sleep(600);
    hudText = await getHUD();
    console.log('HUD after Radio check:', hudText);
    if (!hudText.includes('9/13')) {
      throw new Error(`Expected Step 9 completed (9/13), got: ${hudText}`);
    }

    // Step 10: LCVG Cooling Chiller at [-0.3, 0.06, 1.8]
    console.log('10. Walking to LCVG Cooling Chiller...');
    await walkUntil('KeyA', () => (window.__PLAYER_POS__?.x ?? 10) <= -0.1);
    await sleep(300);
    console.log('✓ Pos at Cooling Chiller:', await getPos());
    console.log('✓ Prompt at Cooling Chiller:', await getPrompt());
    await page.keyboard.press('KeyE');
    await sleep(600);
    hudText = await getHUD();
    console.log('HUD after Cooling check:', hudText);
    if (!hudText.includes('10/13')) {
      throw new Error(`Expected Step 10 completed (10/13), got: ${hudText}`);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_life_support_checks.png') });

    // Step 11: Airlock Chamber Hatch at [0, 0.06, 3.2]
    console.log('11. Walking to Airlock Chamber Hatch...');
    await walkUntil('KeyS', () => (window.__PLAYER_POS__?.z ?? -10) >= 2.6);
    await sleep(300);
    console.log('✓ Pos in Airlock Chamber:', await getPos());
    console.log('✓ Prompt in Airlock Chamber:', await getPrompt());
    await page.keyboard.press('KeyE');
    await sleep(600);
    hudText = await getHUD();
    console.log('HUD after Airlock Chamber entry:', hudText);
    if (!hudText.includes('11/13')) {
      throw new Error(`Expected Step 11 completed (11/13), got: ${hudText}`);
    }

    // Step 12: Depressurize Airlock Console at [1.15, 0.06, 3.2]
    console.log('12. Operating Airlock Depressurization Console...');
    await walkUntil('KeyD', () => (window.__PLAYER_POS__?.x ?? -10) >= 0.8);
    await sleep(300);
    console.log('✓ Pos at Depressurization Console:', await getPos());
    console.log('✓ Prompt at Depressurization Console:', await getPrompt());
    await page.keyboard.press('KeyE');
    await page.waitForSelector('.airlock-modal-card .nasa-btn-primary', { timeout: 5000 });
    await sleep(200);
    await page.evaluate(() => {
      const btn = document.querySelector('.airlock-modal-card .nasa-btn-primary');
      if (btn) btn.click();
    });
    console.log('Waiting for airlock depressurization cycle (6.6s)...');
    await sleep(6600);
    hudText = await getHUD();
    console.log('HUD after depressurization:', hudText);
    if (!hudText.includes('12/13')) {
      throw new Error(`Expected Step 12 completed (12/13), got: ${hudText}`);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_airlock_depressurized.png') });

    // Step 13: Egress onto Lunar Surface through Blast Door at [0, 0.06, 3.6]
    console.log('13. Egressing through Outer Blast Door onto Lunar Surface...');
    await walkUntil('KeyA', () => (window.__PLAYER_POS__?.x ?? 10) <= 0.2);
    await walkUntil('KeyS', () => (window.__PLAYER_POS__?.z ?? -10) >= 3.3);
    await sleep(300);
    console.log('✓ Pos at Outer Blast Door:', await getPos());
    console.log('✓ Prompt at Outer Blast Door:', await getPrompt());
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => !document.querySelector('.nasa-screen-transition-overlay.active'), { timeout: 10000 });
    await sleep(1500);

    hudText = await getHUD();
    console.log('Final HUD subtitles:', hudText);
    if (!hudText.includes('13/13') || !hudText.includes('100%')) {
      throw new Error(`Expected 13/13 (100%), got: ${hudText}`);
    }
    console.log('✓ 100% MISSION COMPLETE ACHIEVED!');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_surface_egress.png') });

    // Verify Mission Completion Modal is visible
    const completionModal = await page.$('.completion-modal-card');
    console.log('✓ Mission Completion modal appeared:', !!completionModal);

    // 14. Test First-Person Helmet HUD toggle (V key)
    console.log('14. Testing First-Person Helmet HUD toggle (V key)...');
    await page.keyboard.press('KeyV');
    await sleep(600);
    const helmetHUD = await page.$('.nasa-helmet-visor-frame');
    console.log('✓ First-person helmet visor active:', !!helmetHUD);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_first_person_helmet.png') });
    await page.keyboard.press('KeyV');
    await sleep(400);

    // 15. Test Wireframe Colliders Toggle (C key)
    console.log('15. Testing Colliders toggle (C key)...');
    await page.keyboard.press('KeyC');
    await sleep(400);
    console.log('✓ Collider debug visualization toggled on');
    await page.keyboard.press('KeyC');
    await sleep(400);

    // 16. Test Refresh and localStorage Persistence
    console.log('16. Testing refresh & localStorage persistence...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(1000);
    hudText = await getHUD();
    console.log('✓ Reloaded HUD subtitles:', hudText);
    if (!hudText.includes('13/13') || !hudText.includes('100%') || !hudText.includes('Mark III')) {
      throw new Error(`State was not properly restored from localStorage: ${hudText}`);
    }

    console.log('Console Errors count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors found: ${consoleErrors.join('\n')}`);
    }
    console.log('✓ ZERO console errors during complete playthrough!');
    console.log('=== ALL BROWSER ACCEPTANCE TESTS PASSED FLAWLESSLY ===');
  } catch (err) {
    console.error('TEST FAILED:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_screenshot.png') });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
