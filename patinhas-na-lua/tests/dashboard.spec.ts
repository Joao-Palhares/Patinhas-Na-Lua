import { test, expect } from '@playwright/test';

test('Dashboard loads correctly', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Expect header to be visible
  await expect(page.locator('h1')).toContainText('Olá,');

  // Expect "Próximas Visitas" card
  await expect(page.getByText('Próximas Visitas')).toBeVisible();

  // Expect "Ver Histórico" link
  await expect(page.getByRole('link', { name: 'Ver Histórico' })).toBeVisible();
});

test('History page works', async ({ page }) => {
    await page.goto('/dashboard/history');
    await expect(page.locator('h1')).toContainText('Histórico de Agendamentos');
});
