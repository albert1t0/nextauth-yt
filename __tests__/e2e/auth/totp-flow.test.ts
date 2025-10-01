import { test, expect } from '@playwright/test';

test.describe('TOTP Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and localStorage before each test
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should redirect to TOTP verification when 2FA is enabled', async ({ page }) => {
    // Mock user with 2FA enabled but not authenticated
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            requiresTwoFactor: true,
            isTwoFactorAuthenticated: false
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });

    await page.goto('/dashboard');

    // Should redirect to TOTP verification page
    await expect(page).toHaveURL('/auth/verify-totp');
    await expect(page.locator('h1')).toContainText('Verificación de Dos Factores');
  });

  test('should show TOTP verification form', async ({ page }) => {
    await page.goto('/auth/verify-totp');

    // Check form elements
    await expect(page.locator('label')).toContainText('Código de Verificación');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Verificar');
    await expect(page.locator('text=Usar código de respaldo')).toBeVisible();
  });

  test('should show backup code input when link is clicked', async ({ page }) => {
    await page.goto('/auth/verify-totp');

    // Click backup code link
    await page.click('text=Usar código de respaldo');

    // Check backup code input appears
    await expect(page.locator('label')).toContainText('Código de Respaldo');
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test('should successfully verify with valid TOTP token', async ({ page }) => {
    await page.goto('/auth/verify-totp');

    // Mock successful verification
    await page.route('**/api/auth/2fa/verify', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Verificación exitosa'
          })
        });
      }
    });

    // Mock updated session after verification
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            requiresTwoFactor: false,
            isTwoFactorAuthenticated: true
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });

    // Enter TOTP token
    await page.fill('input[type="text"]', '123456');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should successfully verify with valid backup code', async ({ page }) => {
    await page.goto('/auth/verify-totp');

    // Click backup code link first
    await page.click('text=Usar código de respaldo');

    // Mock successful verification with backup code
    await page.route('**/api/auth/2fa/verify', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const body = await request.postData();
        const data = JSON.parse(body || '{}');

        if (data.backupCode) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Verificación con código de respaldo exitosa'
            })
          });
        }
      }
    });

    // Enter backup code
    await page.fill('input[type="text"]', 'ABC123DEF456');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid TOTP token', async ({ page }) => {
    await page.goto('/auth/verify-totp');

    // Mock failed verification
    await page.route('**/api/auth/2fa/verify', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Código inválido'
          })
        });
      }
    });

    // Enter invalid TOTP token
    await page.fill('input[type="text"]', '000000');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Código inválido')).toBeVisible();
    // Should stay on verification page
    await expect(page).toHaveURL('/auth/verify-totp');
  });

  test('should show error for used backup code', async ({ page }) => {
    await page.goto('/auth/verify-totp');

    // Click backup code link first
    await page.click('text=Usar código de respaldo');

    // Mock error for used backup code
    await page.route('**/api/auth/2fa/verify', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Código de respaldo ya utilizado'
          })
        });
      }
    });

    // Enter used backup code
    await page.fill('input[type="text"]', 'USED123CODE');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Código de respaldo ya utilizado')).toBeVisible();
  });

  test('should handle TOTP setup flow', async ({ page }) => {
    // Login and navigate to profile
    await page.goto('/login');

    // Mock successful login without 2FA
    await page.route('**/api/auth/callback/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Location': '/dashboard' }
      });
    });

    // Mock session without 2FA
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            requiresTwoFactor: false,
            isTwoFactorAuthenticated: true
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });

    await page.goto('/dashboard/profile');

    // Mock TOTP setup endpoint
    await page.route('**/api/auth/2fa/setup', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            qrCodeDataURL: 'data:image/png;base64,mockQrCodeData',
            backupCodes: ['CODE1', 'CODE2', 'CODE3'],
            message: 'Escanea el código QR con tu aplicación de autenticación'
          })
        });
      }
    });

    // Click setup 2FA button
    await page.click('text=Configurar Autenticación de Dos Factores');

    // Should show QR code and backup codes
    await expect(page.locator('img[alt*="QR Code"]')).toBeVisible();
    await expect(page.locator('text=Códigos de Respaldo')).toBeVisible();
    await expect(page.locator('text=CODE1')).toBeVisible();
  });

  test('should complete TOTP setup after verification', async ({ page }) => {
    // Start setup process
    await page.goto('/dashboard/profile');

    // Mock setup endpoints
    await page.route('**/api/auth/2fa/setup', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            qrCodeDataURL: 'data:image/png;base64,mockQrCodeData',
            backupCodes: ['CODE1', 'CODE2', 'CODE3'],
            message: 'Escanea el código QR con tu aplicación de autenticación'
          })
        });
      }
    });

    await page.route('**/api/auth/2fa/complete', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Autenticación de dos factores configurada correctamente'
          })
        });
      }
    });

    // Mock verification
    await page.route('**/api/auth/2fa/verify', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Verificación exitosa'
          })
        });
      }
    });

    // Click setup button
    await page.click('text=Configurar Autenticación de Dos Factores');

    // Enter verification token
    await page.fill('input[type="text"]', '123456');
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Autenticación de dos factores configurada correctamente')).toBeVisible();
  });

  test('should disable TOTP when requested', async ({ page }) => {
    await page.goto('/dashboard/profile');

    // Mock disable endpoint
    await page.route('**/api/auth/2fa/disable', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Autenticación de dos factores deshabilitada correctamente'
          })
        });
      }
    });

    // Click disable button (assuming it exists when 2FA is enabled)
    await page.click('text=Deshabilitar 2FA');

    // Should confirm password (mock the confirmation)
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Autenticación de dos factores deshabilitada correctamente')).toBeVisible();
  });

  test('should generate new backup codes', async ({ page }) => {
    await page.goto('/dashboard/profile');

    // Mock backup codes endpoint
    await page.route('**/api/auth/2fa/backup-codes', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            backupCodes: ['NEWCODE1', 'NEWCODE2', 'NEWCODE3']
          })
        });
      }
    });

    // Click generate backup codes button
    await page.click('text=Generar Nuevos Códigos');

    // Should confirm password (mock the confirmation)
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Should show new backup codes
    await expect(page.locator('text=NEWCODE1')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/auth/verify-totp');

    // Mock network error
    await page.route('**/api/auth/2fa/verify', async (route) => {
      await route.abort('failed');
    });

    // Enter TOTP token
    await page.fill('input[type="text"]', '123456');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Error de conexión')).toBeVisible();
  });

  test('should validate input format', async ({ page }) => {
    await page.goto('/auth/verify-totp');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=El código es requerido')).toBeVisible();

    // Try to submit invalid characters
    await page.fill('input[type="text"]', 'ABCDEF');
    await page.click('button[type="submit"]');

    // Should show format error
    await expect(page.locator('text=El código debe tener exactamente 6 dígitos')).toBeVisible();
  });
});