import { test, expect } from '@grafana/plugin-e2e';

test('tooltip opens and closes when clicking a host and its close button', async ({
  panelEditPage,
  page,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Hostmap-Panel');

  // Wait for the panel to render polygons
  await page.waitForSelector('svg polygon');

  // Click the first hexagon
  await page.locator('svg polygon').first().click();

  // Tooltip close button should appear
  const closeButton = page.getByText('×');
  await expect(closeButton).toBeVisible();

  // Click the close button to dismiss
  await closeButton.click();
  await expect(closeButton).not.toBeVisible();

  // Re-open tooltip and then click empty SVG area to close
  await page.locator('svg polygon').first().click();
  await expect(closeButton).toBeVisible();
  // Click on empty SVG background (top-left corner)
  await page.locator('svg').click({ position: { x: 10, y: 10 } });
  await expect(closeButton).not.toBeVisible();
});
