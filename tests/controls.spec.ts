import { test, expect } from '@grafana/plugin-e2e';

test('zoom controls update the scale indicator', async ({ panelEditPage, page, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Hostmap-Panel');

  // Wait for the indicator to appear
  const indicator = page.locator('div').filter({ hasText: /%$/ }).first();
  await expect(indicator).toBeVisible();

  const initialText = await indicator.innerText();
  const initialPct = parseInt(initialText.replace('%', '').trim(), 10);

  // Click zoom in
  await page.getByLabel('zoom in').click();
  await page.waitForTimeout(100); // small debounce

  const afterText = await indicator.innerText();
  const afterPct = parseInt(afterText.replace('%', '').trim(), 10);

  expect(afterPct).toBeGreaterThan(initialPct);

  // Click zoom out and expect value to decrease
  await page.getByLabel('zoom out').click();
  await page.waitForTimeout(100);
  const finalText = await indicator.innerText();
  const finalPct = parseInt(finalText.replace('%', '').trim(), 10);
  expect(finalPct).toBeLessThanOrEqual(afterPct);
});
