// Phones get their own layout: Code and Watch views, one scrolling page, nothing on top of the
// picture, and the controls in a bar at the bottom.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function fresh(page: Page, query = '') {
  await page.goto(`./${query}`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`./${query}`);
}

/** how the page is laid out right now */
async function layout(page: Page) {
  return page.evaluate(() => {
    const card = document.querySelector('.step-card')?.getBoundingClientRect();
    const stage = document.querySelector('.stage')?.getBoundingClientRect();
    const overlap = card && stage ? Math.max(0, Math.min(card.bottom, stage.bottom) - Math.max(card.top, stage.top)) : 0;
    const scrollers = [...document.querySelectorAll('body *')].filter((e) => {
      const cs = getComputedStyle(e);
      return /(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2 && !e.closest('.monaco-editor') && !e.closest('.graph-wrap');
    }).length;
    const small = [...document.querySelectorAll('button, [role=tab], summary')].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !b.closest('.monaco-editor') && (r.height < 40 || r.width < 40);
    }).map((b) => b.textContent?.trim() || b.getAttribute('aria-label'));
    return { overlap, scrollers, small, sideways: document.documentElement.scrollWidth - window.innerWidth };
  });
}

test('Run switches to the Watch view; the explanation never covers the picture', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&lang=cpp');
  await expect(page.getByRole('tab', { name: 'Code' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Run' }).tap();
  await expect(page.getByRole('tab', { name: 'Watch' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Pause' }).tap();
  for (let k = 0; k < 5; k++) await page.getByRole('button', { name: 'Next step' }).tap();
  const l = await layout(page);
  expect(l.overlap).toBe(0);
  expect(l.scrollers).toBeLessThanOrEqual(1);
  expect(l.sideways).toBe(0);
  expect(l.small).toEqual([]);
  // the line that just ran is still shown, under the explanation
  await expect(page.locator('.m-code .pc-line.active')).toHaveCount(1);
});

test('nothing is wider than the phone, even with long names and big pictures', async ({ page }) => {
  for (const q of ['?example=dijkstra&lang=python&run=1&step=60', '?example=heap-sort&lang=java&run=1&step=40', '?example=floyd-warshall&lang=java&run=1&step=50', '?example=maze-game&run=1&step=60']) {
    await page.goto(`./${q}`);
    await expect(page.locator('.step-say').first()).toBeVisible();
    const l = await layout(page);
    expect(l.sideways, q).toBe(0);
    expect(l.overlap, q).toBe(0);
  }
});

test('the bottom bar steps, scrubs and opens the playback settings', async ({ page }) => {
  await fresh(page, '?example=insertion-sort&lang=java&run=1&step=0');
  await expect(page.locator('.m-count')).toHaveText(/^1 \/ \d+$/);
  await page.getByRole('button', { name: 'Next step' }).tap();
  await page.getByRole('button', { name: 'Next step' }).tap();
  await expect(page.locator('.m-count')).toHaveText(/^3 \/ /);
  await page.getByRole('button', { name: 'Previous step' }).tap();
  await expect(page.locator('.m-count')).toHaveText(/^2 \/ /);
  await expect(page.locator('.m-chapter')).not.toBeEmpty();
  await page.getByRole('button', { name: 'Playback settings' }).tap();
  await page.getByRole('tab', { name: 'Every line' }).tap();
  await page.getByRole('button', { name: 'Close' }).tap();
  const total = Number((await page.locator('.m-count').textContent())!.split('/')[1]);
  expect(total).toBeGreaterThan(40);
});

test('the Code view gives the editor the screen and keeps Run at the bottom', async ({ page }) => {
  await fresh(page, '?example=factorial&lang=python');
  const editor = await page.locator('.editor-panel').boundingBox();
  expect(editor!.height).toBeGreaterThan(500);
  await expect(page.locator('.m-bar .m-run')).toBeVisible();
  const l = await layout(page);
  expect(l.small).toEqual([]);
  expect(l.sideways).toBe(0);
});

test('the examples panel fills the screen and can be searched', async ({ page }) => {
  await fresh(page);
  await page.locator('.topbar .menu-wrap > .topbar-btn').tap();
  const menu = await page.locator('.menu').boundingBox();
  expect(menu!.width).toBeGreaterThanOrEqual(389);
  await page.getByRole('searchbox', { name: 'Search examples' }).fill('dijkstra');
  await expect(page.getByRole('menuitem')).toHaveCount(1);
  await page.getByRole('menuitem', { name: /Dijkstra/ }).tap();
  await expect(page.locator('.viz-header h1')).toHaveText("Dijkstra's Shortest Path");
});

test('Help explains the phone controls', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: 'Help' }).tap();
  await expect(page.getByRole('heading', { name: 'On your phone' })).toBeVisible();
  await page.locator('.dialog-close').tap();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
