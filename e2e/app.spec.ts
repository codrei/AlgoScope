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
  // paste in one go (typing races with the editor's auto-closing brackets)
  await page.keyboard.insertText('int main() {\nint x = 5\nreturn 0;\n}\n');
  await expect(page.locator('.monaco-editor .view-lines')).toContainText('int x = 5');
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

test('predict mode asks before each comparison and checks the answer', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&lang=cpp&run=1&step=0');
  await page.getByRole('button', { name: /Predict/ }).click();
  // step forward until a question appears
  for (let i = 0; i < 10 && !(await page.locator('.step-card.quiz').count()); i++) {
    await page.getByRole('button', { name: 'Next step' }).click();
  }
  await expect(page.locator('.step-card.quiz .step-say')).toHaveText('Compare the neighbors 5 and 1: is 5 bigger?');
  await page.keyboard.press('y');
  await expect(page.locator('.quiz-verdict')).toHaveText('✓ Correct! 1 of 1 right so far. Press Play or Next to go on.');
  await expect(page.locator('.step-say')).toContainText('Yes, they are in the wrong order, so they swap');
  await expect(page.locator('.step-say-code')).toContainText('Yes, so the code inside the if runs');
  // the next comparison asks again; a wrong answer is explained
  for (let i = 0; i < 10 && !(await page.locator('.step-card.quiz').count()); i++) {
    await page.getByRole('button', { name: 'Next step' }).click();
  }
  await page.getByRole('button', { name: /^No/ }).click();
  await expect(page.locator('.quiz-verdict')).toContainText('Not this time');
  await expect(page.locator('.quiz-verdict')).toContainText('1 of 2 right so far');
});

test('turning Predict on says what will happen, and Play stops at the first question', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&lang=cpp&run=1&step=0');
  await expect(page.locator('.step-count')).toHaveText(/^1 \/ \d+$/); // the run is ready
  await page.getByRole('button', { name: /Predict/ }).click();
  await expect(page.locator('.toast')).toContainText('Predict is on: the run will stop before each of its');
  await expect(page.locator('.toast')).toContainText('Press Play or Next');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.step-card.quiz')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible(); // paused, waiting for the answer
  await page.getByRole('button', { name: /Predict/ }).click();
  await expect(page.locator('.toast')).toHaveText('Predict is off.');
});

test('Predict also asks at if-decisions, so recursion examples have questions', async ({ page }) => {
  await fresh(page, '?example=factorial&lang=python&run=1&step=0');
  await expect(page.locator('.step-count')).toHaveText(/^1 \/ \d+$/); // the run is ready
  await page.getByRole('button', { name: /Predict/ }).click();
  await expect(page.locator('.toast')).toContainText(/each of its [1-9]\d* comparisons and decisions/);
  for (let i = 0; i < 15 && !(await page.locator('.step-card.quiz').count()); i++) {
    await page.getByRole('button', { name: 'Next step' }).click();
  }
  await expect(page.locator(".step-card.quiz .step-say")).toHaveText("Is n <= 1 true? (n = 5)");
  await page.getByRole('button', { name: /^No/ }).click();
  await expect(page.locator('.quiz-verdict')).toContainText('✓ Correct!');
});

test('a run with only loops (Euclid) asks the loop checks', async ({ page }) => {
  await fresh(page, '?example=gcd&lang=java&run=1&step=0');
  await expect(page.locator('.step-count')).toHaveText(/^1 \/ \d+$/); // the run is ready
  await page.getByRole('button', { name: /Predict/ }).click();
  for (let i = 0; i < 15 && !(await page.locator('.step-card.quiz').count()); i++) {
    await page.getByRole('button', { name: 'Next step' }).click();
  }
  await expect(page.locator('.step-card.quiz .step-say')).toHaveText(/^Is b != 0 true\? \(b = \d+\)$/);
});

test('keys do not move the run behind an open panel', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&lang=cpp&run=1&step=0');
  await expect(page.locator('.step-count')).toHaveText(/^1 \//);
  for (const name of ['Settings', 'Help']) {
    await page.getByRole('button', { name }).click();
    await expect(page.getByRole('dialog')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('End');
    await page.keyboard.press(' ');
    await page.keyboard.press('Escape');
    await expect(page.locator('.step-count')).toHaveText(/^1 \//);
    await expect(page.getByRole('button', { name })).toBeFocused(); // focus goes back to the button
  }
});

test('playback controls fit on one row on a 1366px laptop', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&run=1&step=0');
  const h = await page.locator('.playback').evaluate((e) => e.getBoundingClientRect().height);
  expect(h).toBeLessThan(80);
});

test('the menu opens a single-language program from the slides', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: /Bubble Sort/ }).click();
  await page.getByRole('menuitem', { name: /Stack Using a Struct/ }).click();
  await expect(page.locator('.viz-header h1')).toHaveText('Stack Using a Struct');
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.step-say')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.locator('.struct', { hasText: 's.items' }).first()).toContainText('top');
});

test('the Turbo C maze draws on the console screen', async ({ page }) => {
  await fresh(page, '?example=maze-game&run=1');
  await expect(page.locator('.step-say')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.locator('.screen')).toContainText('Congrats, you found the secret door!!!');
});

test('"Add a main() for me" turns a slide snippet into a program', async ({ page }) => {
  await fresh(page, '?example=factorial&lang=c');
  await page.locator('.monaco-editor').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText('int sum(int arr[], int n) {\nint s = 0;\nfor (int i = 0; i < n; i++) s += arr[i];\nreturn s;\n}\n');
  // drop the brace the editor auto-closed after the paste
  await page.keyboard.press('Control+Shift+End');
  await page.keyboard.press('Delete');
  await expect(page.locator('.monaco-editor .view-lines')).toContainText('int sum');
  await page.getByRole('button', { name: 'Run' }).click();
  await page.getByRole('button', { name: 'Add a main() for me' }).click();
  await expect(page.locator('.step-say')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.locator('.console')).toContainText('sum returned 23');
});

test('a 10-element array fits the panel on a 1280×720 projector', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await fresh(page, '?example=binary-search&lang=python&run=1&step=3');
  await expect(page.locator('.step-say')).toBeVisible();
  const panel = await page.locator('section.panel.viz').boundingBox();
  const last = await page.locator('.cells .cell').last().boundingBox();
  expect(last!.x + last!.width).toBeLessThanOrEqual(panel!.x + panel!.width);
});

test('present mode on a short projector puts the explanation beside the code', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await fresh(page, '?example=heap-sort&lang=java&run=1&step=30&present=1');
  await expect(page.locator('.present-side .step-card')).toBeVisible();
  // the whole heap tree is above the bottom of the panel
  const tree = await page.locator('.struct', { hasText: 'as a heap' }).boundingBox();
  const panel = await page.locator('section.panel.viz').boundingBox();
  expect(tree!.y + tree!.height).toBeLessThanOrEqual(panel!.y + panel!.height);
});

test('Complexity Lab names the real worst case of quick sort', async ({ page }) => {
  await fresh(page, '?example=quick-sort&lang=cpp&lab=1');
  await expect(page.locator('.lab-insight')).toContainText('reversed order and already sorted', { timeout: 30000 });
});

test('a link to a one-language example opens in that language', async ({ page }) => {
  await fresh(page, '?example=bubble-sort&lang=python');
  await page.goto('./?example=maze-game&run=1');
  await expect(page.getByRole('tab', { name: 'C++', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.step-say')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.locator('.screen')).toContainText('Congrats');
});
