import { test, expect } from '@playwright/test';

test.describe('Login smoke', () => {
  test('renders brand and sign-in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Smart Office').first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('#password input')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation when submitting empty password after clear', async ({
    page,
  }) => {
    await page.goto('/login');
    const password = page.locator('#password input');
    await password.fill('');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(
      page.locator('small').filter({ hasText: /required|password/i }).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
