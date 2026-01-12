import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 1. Go to Login Page
  await page.goto('http://localhost:3000/sign-in');

  // 2. Wait until the user is redirected to Dashboard (meaning they logged in)
  await page.waitForURL('http://localhost:3000/dashboard', { timeout: 0 }); // No timeout, wait for user input

  // 3. Save storage state
  await page.context().storageState({ path: authFile });
});
