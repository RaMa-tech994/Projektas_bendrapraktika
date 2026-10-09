import { expect, test } from '@playwright/test';
test('lankytojas gali atidaryti katalogą ir atlikti paiešką', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.getByRole('heading', { name: 'Atrask savo kitą filmą' })).toBeVisible();
  if (!process.env.VITE_TMDB_ACCESS_TOKEN) {
    await expect(page.getByLabel('Paieška')).toBeVisible();
    await expect(page.getByText(/TMDB prieigos raktas nesukonfigūruotas/)).toBeVisible();
    return;
  }
  await page.getByLabel('Paieška').fill('Dune');
  await expect(page.getByText('Dune', { exact: false }).first()).toBeVisible({ timeout: 15_000 });
});
