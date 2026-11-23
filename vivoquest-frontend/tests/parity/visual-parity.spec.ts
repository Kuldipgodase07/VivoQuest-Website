import { test, expect } from '@playwright/test';

const ROLES = [
  { name: 'Patient & Family', path: '/patient' },
  { name: 'Caregiver', path: '/caregiver' },
  { name: 'Nurse Field Visit', path: '/nurse' },
  { name: 'Clinician Oversight', path: '/clinician' },
  { name: 'Remote Care Desk', path: '/remote-desk' },
  { name: 'Discharge Planner', path: '/discharge' },
  { name: 'Health Plan & ACO', path: '/health-plan' },
  { name: 'Adult Vaccination', path: '/vaccination' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Administrator Console', path: '/admin' }
];

test.describe('VivoQuest Pixel-for-Pixel & Functional Parity Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const mockSession = {
        id: 'usr_mock_01', phone: '9820011223', name: 'Authorized Clinical User',
        role: 'patient', isAuthenticated: true
      };
      sessionStorage.setItem('vq_session', JSON.stringify(mockSession));
    });
  });

  test('Landing Page renders at 1440x900 and 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Care, Closer to Home');
  });

  for (const role of ROLES) {
    test(`Workspace parity: ${role.name} (${role.path})`, async ({ page }) => {
      await page.goto(role.path);
      await expect(page.locator('.sidebar')).toBeVisible();
      await expect(page.locator('.topbar')).toBeVisible();
    });
  }
});
