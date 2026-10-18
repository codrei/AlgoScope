// Click-through tests of the real interface, the way a student or teacher uses it.
import { expect, test, type Page } from '@playwright/test';

async function fresh(page: Page, query = '') {
  await page.goto(`./${query}`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`./${query}`);
}

const stepNum = (page: Page) => page.locator('.step-num');

test('the Examples menu opens on top of the editor and switches algorithm', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: /Bubble Sort/ }).click();
  // Playwright refuses to click an item that is hidden or covered by another element
  await page.getByRole('menuitem', { name: /Merge Sort/ }).click();
  await expect(page.locator('.viz-header h1')).toHaveText('Merge Sort');
  await page.getByRole('button', { name: /Merge Sort/ }).click();
  await page.getByRole('menuitem', { name: /Dijkstra/ }).click();
  await expect(page.locator('.viz-header h1')).toHaveText("Dijkstra's Shortest Path");
});

test('run, pause and step with Back / Next', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&lang=cpp');
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.step-say')).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Next step' }).click();
  await page.getByRole('button', { name: 'First step' }).click();
  await expect(stepNum(page)).toHaveText(/^Step 1 of \d+$/);
  await page.getByRole('button', { name: 'Next step' }).click();
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(stepNum(page)).toHaveText(/^Step 3 of/);
  await page.getByRole('button', { name: 'Previous step' }).click();
  await expect(stepNum(page)).toHaveText(/^Step 2 of/);
  // the gold line in the editor follows the step
  await expect(page.locator('.exec-line')).toHaveCount(1);
});

test('key steps are fewer than every line', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&lang=cpp&run=1&step=0');
  const total = async () => Number((await stepNum(page).textContent())!.match(/of (\d+)/)![1]);
  const keys = await total();
  await page.getByRole('tab', { name: 'Every line' }).click();
  const all = await total();
  expect(keys).toBeLessThan(all / 2);
  await page.getByRole('tab', { name: 'Key steps' }).click();
  expect(await total()).toBe(keys);
});

test('each language runs to the right output', async ({ page }) => {
  for (const lang of ['C', 'C++', 'Java', 'C#', 'Python']) {
    await fresh(page, '?example=bubble-sort');
    await page.getByRole('tab', { name: lang, exact: true }).click();
    await page.getByRole('button', { name: 'Run' }).click();
    await expect(page.locator('.step-say')).toBeVisible();
    await page.keyboard.press('End');
    await expect(page.locator('.console')).toHaveText('Sorted: 1 2 3 4 5 8');
  }
});

test('Focus and Full detail views', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&lang=java&run=1&step=10');
  await expect(page.locator('.counters')).toHaveCount(0);
  await expect(page.locator('.step-caption')).toContainText('Pass');
  await page.getByRole('tab', { name: 'Full detail' }).click();
  await expect(page.locator('.counters')).toBeVisible();
  await expect(page.locator('.frames')).toBeVisible();
});

test('present mode shows the picture and the code side by side', async ({ page }) => {
  await fresh(page, '?example=binary-search&lang=python');
  await page.getByRole('button', { name: /Present/ }).click();
  await expect(page.locator('.present-code')).toBeVisible();
  await expect(page.locator('.pc-line.active')).toHaveCount(1);
  await expect(page.locator('.step-say')).toBeVisible();
});

test('Complexity Lab draws the growth chart', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&lang=python');
  await page.getByRole('button', { name: /Complexity/ }).click();
  await expect(page.locator('.lab-table tbody tr')).toHaveCount(4, { timeout: 30000 });
  await expect(page.locator('.lab-table tbody tr').last()).toContainText('2,016');
  await page.keyboard.press('Escape');
  await expect(page.locator('.dialog.lab')).toHaveCount(0);
});

test('help opens and closes', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('dialog')).toContainText('How to use AlgoScope');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a syntax error points at the line', async ({ page }) => {
  await fresh(page, '?example=factorial&lang=cpp');
  await page.locator('.monaco-editor').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('int main() {\nint x = 5\nreturn 0;\n');
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.compile-error')).toContainText('Line 2');
});

test('the explanation stays visible on a small laptop screen', async ({ page }) => {
  await fresh(page, '?example=merge-sort&lang=python&run=1&step=100');
  const box = await page.locator('.step-card').boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(768);
});

test('phone screen: no sideways scrolling and the menu works', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
  await fresh(page, '?example=bubble-sort&lang=python');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: /Bubble Sort/ }).click();
  await page.getByRole('menuitem', { name: /Quick Sort/ }).click();
  await expect(page.locator('.viz-header h1')).toHaveText('Quick Sort');
  await expect(page.getByRole('button', { name: 'Run' })).toBeVisible();
  await page.close();
});

test('works offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('./?example=bubble-sort&lang=python');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // now controlled by the service worker, assets go into the cache
  await page.waitForTimeout(10000); // background grammar download
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('tab', { name: 'Java', exact: true }).click();
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.step-say')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.locator('.console')).toHaveText('Sorted: 1 2 3 4 5 8');
  await context.close();
});
