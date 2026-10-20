// Settings: every way to customize AlgoScope in one place, saved on this device. And installing
// AlgoScope as an app that opens without internet.
import { expect, test, type Page } from '@playwright/test';

async function fresh(page: Page, query = '') {
  await page.goto(`./${query}`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`./${query}`);
}

const html = (page: Page) => page.locator('html');

test('Settings changes the look and the playback, and remembers them', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&lang=cpp');
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('radio', { name: 'Dark' }).click();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await dialog.getByRole('button', { name: 'Bigger text' }).click();
  await dialog.getByRole('button', { name: 'Bigger text' }).click();
  await expect(dialog.locator('.set-size-value')).toHaveText('120%');
  await dialog.getByRole('radio', { name: 'Color-blind friendly' }).click();
  await expect(html(page)).toHaveAttribute('data-palette', 'colorblind');
  await dialog.getByRole('radio', { name: 'Off', exact: true }).first().click(); // Animations come first; Predict is already off
  await expect(html(page)).toHaveAttribute('data-motion', 'off');
  await dialog.getByRole('radio', { name: 'Wait for me' }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  // the code got bigger
  const size = await page.locator('.monaco-editor .view-line').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect(size).toBeGreaterThanOrEqual(16);

  // saved: still there after reopening the page
  await page.reload();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await expect(html(page)).toHaveAttribute('data-palette', 'colorblind');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(dialog.getByRole('radio', { name: 'Wait for me' })).toHaveAttribute('aria-checked', 'true');
  await expect(dialog.locator('.set-size-value')).toHaveText('120%');
  await page.keyboard.press('Escape');

  // "Wait for me": Run stops on the first step
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('.step-count')).toHaveText(/^1 \/ \d+$/);
  await page.waitForTimeout(1500);
  await expect(page.locator('.step-count')).toHaveText(/^1 \/ \d+$/);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();

  // Reset all settings
  await page.getByRole('button', { name: 'Settings' }).click();
  await dialog.getByRole('button', { name: 'Reset all settings' }).click();
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  await expect(html(page)).toHaveAttribute('data-palette', 'standard');
  await expect(html(page)).toHaveAttribute('data-motion', 'on');
  await expect(dialog.locator('.set-size-value')).toHaveText('100%');
  await expect(dialog.getByRole('radio', { name: 'Play right away' })).toHaveAttribute('aria-checked', 'true');
});

test('the playback options in Settings are the same as the ones in the playback bar', async ({ page }) => {
  await fresh(page, '?example=insertion-sort&lang=java&run=1&step=0');
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await dialog.getByRole('radio', { name: 'Every line' }).click();
  await dialog.getByRole('radio', { name: 'Full detail' }).click();
  await dialog.getByRole('radio', { name: '2×' }).click();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('.playback').getByRole('tab', { name: 'Every line' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.mode-toggle').getByRole('tab', { name: 'Full detail' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('combobox', { name: 'Speed' })).toHaveValue('2');
});

test('the theme can follow the device, and the old dark switch is kept', async ({ page }) => {
  await fresh(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'Same as device' }).click();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html(page)).toHaveAttribute('data-theme', 'light');

  // someone who chose dark before Settings existed keeps dark
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('as.dark', 'true');
  });
  await page.reload();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
});

test('AlgoScope can be installed as an app', async ({ page, browserName }) => {
  await fresh(page);
  // a valid app manifest with icons that load and have the sizes they claim
  const m = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel=manifest]')!;
    const json = await (await fetch(link.href)).json();
    const icons = await Promise.all(
      json.icons.filter((i: { type: string }) => i.type === 'image/png').map(async (i: { src: string; sizes: string }) => {
        const buf = new DataView(await (await fetch(new URL(i.src, link.href))).arrayBuffer());
        return { sizes: i.sizes, real: `${buf.getUint32(16)}x${buf.getUint32(20)}` };
      }),
    );
    const shots = await Promise.all(json.screenshots.map(async (s: { src: string }) => (await fetch(new URL(s.src, link.href))).ok));
    return { name: json.name, display: json.display, icons, shots };
  });
  expect(m.name).toBe('AlgoScope');
  expect(m.display).toBe('standalone');
  for (const i of m.icons) expect(i.real).toBe(i.sizes);
  expect(m.shots.every(Boolean)).toBe(true);
  // Chrome's own check
  if (browserName === 'chromium') {
    await page.evaluate(() => navigator.serviceWorker.ready);
    const cdp = await page.context().newCDPSession(page);
    const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
    expect(installabilityErrors).toEqual([]);
  }

  // no install offer from the browser yet: Settings explains how to install
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog.getByText('Install as an app')).toBeVisible();
  await expect(dialog.getByText(/Open AlgoScope in Chrome or Edge/)).toBeVisible();
  await page.keyboard.press('Escape');

  // the browser offers to install (Chrome and Edge): an Install button opens its dialog
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & Record<string, unknown>;
    e.prompt = async () => {
      (window as unknown as Record<string, boolean>).__prompted = true;
    };
    e.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(e);
  });
  await page.getByRole('button', { name: 'Settings' }).click();
  await dialog.getByRole('button', { name: 'Install AlgoScope' }).click();
  await expect(dialog.getByText(/Installed\. Open AlgoScope/)).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as Record<string, boolean>).__prompted)).toBe(true);
});

test('the Install button shows in the top bar while the browser offers it', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('.topbar').getByRole('button', { name: /Install/ })).toHaveCount(0);
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & Record<string, unknown>;
    e.prompt = async () => undefined;
    e.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(e);
  });
  await page.locator('.topbar').getByRole('button', { name: /Install/ }).click();
  // dismissed: the browser's offer was used up, so the button goes away
  await expect(page.locator('.topbar').getByRole('button', { name: /Install/ })).toHaveCount(0);
});

test('after the first visit AlgoScope opens and runs without internet, in every language', async ({ page, context }) => {
  test.setTimeout(90000);
  await fresh(page, '?example=bubble-sort&lang=cpp');
  // every file is saved a few seconds after the page opens
  await expect(html(page)).toHaveAttribute('data-offline', 'ready', { timeout: 45000 });
  await context.setOffline(true);
  await page.goto('./?example=binary-search&lang=java&run=1');
  await expect(page.locator('.step-say').first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.monaco-editor')).toBeVisible();
  for (const lang of ['Python', 'C#', 'C']) {
    await page.getByRole('tab', { name: lang, exact: true }).click();
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.locator('.step-count')).toHaveText(/^\d+ \/ \d+$/, { timeout: 20000 });
    await expect(page.locator('.step-count')).not.toHaveText('0 / 0');
  }
  await context.setOffline(false);
});

test.describe('phones', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'phone emulation is Chromium only');
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('Settings opens from the top and from the bottom bar, with phone-sized options', async ({ page }) => {
    await fresh(page, '?example=bubble-sort&lang=cpp&run=1&step=0');
    await page.locator('.topbar').getByRole('button', { name: 'Settings' }).tap();
    const sheet = page.getByRole('dialog', { name: 'Settings' });
    await expect(sheet).toBeVisible();
    // phones always use Focus and a fixed text size
    await expect(sheet.getByText('Text size')).toHaveCount(0);
    await expect(sheet.getByText('How much to show')).toHaveCount(0);
    const small = await sheet.locator('button').evaluateAll((bs) =>
      bs.filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && (r.height < 44 || r.width < 44);
      }).map((b) => b.textContent),
    );
    expect(small).toEqual([]);
    await sheet.getByRole('radio', { name: 'Dark' }).tap();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await sheet.getByRole('button', { name: 'Close' }).tap();
    await page.getByRole('button', { name: 'Playback settings' }).tap();
    await expect(sheet.getByRole('radio', { name: 'Key steps' })).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  });
});
