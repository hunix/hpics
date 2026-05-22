import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('auth page renders and signin form is interactive', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Signup tab must be hidden when VITE_SIGNUP_ALLOWLIST is empty.
    // (Phase 1 lockdown — if this assertion ever fails we've regressed.)
    if (!process.env.VITE_SIGNUP_ALLOWLIST) {
      await expect(page.getByRole('tab', { name: /sign up/i })).toHaveCount(0);
    }
  });

  test('unauthenticated visit to /dashboard redirects to /auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/auth/, { timeout: 10_000 });
    expect(page.url()).toContain('/auth');
  });
});
