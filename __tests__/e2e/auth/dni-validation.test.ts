import { test, expect } from '@playwright/test';

test.describe('DNI Validation Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and localStorage before each test
    await page.context().clearCookies();
    await page.goto('/');
  });

  test.describe('Registration Flow', () => {
    test('should show DNI field in registration form', async ({ page }) => {
      await page.goto('/register');

      // Check DNI field is present
      await expect(page.locator('label')).toContainText('Documento de Identidad (DNI)');
      await expect(page.locator('input[name="dni"]')).toBeVisible();
      await expect(page.locator('input[name="dni"]')).toHaveAttribute('required');
      await expect(page.locator('text=El DNI debe tener exactamente 8 caracteres alfanuméricos')).toBeVisible();
    });

    test('should validate DNI format during registration', async ({ page }) => {
      await page.goto('/register');

      // Try to submit empty DNI
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="name"]', 'Test User');
      await page.click('button[type="submit"]');

      // Should show DNI required error
      await expect(page.locator('text=DNI is required')).toBeVisible();

      // Try invalid DNI (too short)
      await page.fill('input[name="dni"]', '12345');
      await page.click('button[type="submit"]');

      // Should show format error
      await expect(page.locator('text=DNI must be exactly 8 alphanumeric characters')).toBeVisible();

      // Try invalid DNI (invalid characters)
      await page.fill('input[name="dni"]', '12*45678');
      await page.click('button[type="submit"]');

      // Should show format error
      await expect(page.locator('text=DNI must be exactly 8 alphanumeric characters')).toBeVisible();

      // Try valid DNI with leading zeros
      await page.fill('input[name="dni"]', '00000001');
      await page.click('button[type="submit"]');

      // Should not show DNI format error
      await expect(page.locator('text=DNI must be exactly 8 alphanumeric characters')).not.toBeVisible();
    });

    test('should check DNI uniqueness during registration', async ({ page }) => {
      await page.goto('/register');

      // Mock existing user with same DNI
      await page.route('**/api/auth/register', async (route) => {
        const request = route.request();
        if (request.method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'El DNI ya está registrado'
            })
          });
        }
      });

      // Fill form with existing DNI
      await page.fill('input[name="email"]', 'newuser@example.com');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="name"]', 'New User');
      await page.fill('input[name="dni"]', '12345678'); // Existing DNI
      await page.click('button[type="submit"]');

      // Should show uniqueness error
      await expect(page.locator('text=El DNI ya está registrado')).toBeVisible();
    });

    test('should successfully register with valid DNI', async ({ page }) => {
      await page.goto('/register');

      // Mock successful registration
      await page.route('**/api/auth/register', async (route) => {
        const request = route.request();
        if (request.method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Registro exitoso. Por favor verifica tu correo electrónico.'
            })
          });
        }
      });

      // Fill form with valid data
      await page.fill('input[name="email"]', 'newuser@example.com');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="name"]', 'New User');
      await page.fill('input[name="dni"]', '87654321'); // Valid DNI
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('text=Registro exitoso')).toBeVisible();
    });

    test('should handle various valid DNI formats', async ({ page }) => {
      await page.goto('/register');

      const validDNIs = [
        '00000001',  // Leading zeros
        '12345678',  // All numbers
        'ABCDEFGH',  // All letters
        'A1234567',  // Mixed
        '1234ABCD',  // Mixed
        '00000000',  // All zeros
        'ZZZZZZZZ'   // All Z letters
      ];

      // Mock successful registration
      await page.route('**/api/auth/register', async (route) => {
        const request = route.request();
        if (request.method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Registro exitoso'
            })
          });
        }
      });

      for (const dni of validDNIs) {
        await page.goto('/register');
        await page.fill('input[name="email"]', `test${dni}@example.com`);
        await page.fill('input[name="password"]', 'Password123!');
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="dni"]', dni);
        await page.click('button[type="submit"]');

        // Should not show DNI format error
        await expect(page.locator('text=DNI must be exactly 8 alphanumeric characters')).not.toBeVisible();
      }
    });
  });

  test.describe('Profile Management', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authenticated session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User',
              dni: '12345678',
              requiresTwoFactor: false,
              isTwoFactorAuthenticated: true
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        });
      });
    });

    test('should show DNI field in profile page', async ({ page }) => {
      await page.goto('/dashboard/profile');

      // Check DNI field is present and pre-filled
      await expect(page.locator('label')).toContainText('Documento de Identidad (DNI)');
      await expect(page.locator('input[name="dni"]')).toBeVisible();
      await expect(page.locator('input[name="dni"]')).toHaveValue('12345678');
    });

    test('should validate DNI format during profile update', async ({ page }) => {
      await page.goto('/dashboard/profile');

      // Mock profile update endpoint
      await page.route('**/api/user/profile', async (route) => {
        const request = route.request();
        if (request.method() === 'PUT') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Perfil actualizado correctamente'
            })
          });
        }
      });

      // Try to update with invalid DNI
      await page.fill('input[name="dni"]', '123');
      await page.click('button[type="submit"]');

      // Should show format error
      await expect(page.locator('text=DNI must be exactly 8 alphanumeric characters')).toBeVisible();

      // Update with valid DNI
      await page.fill('input[name="dni"]', '87654321');
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('text=Perfil actualizado correctamente')).toBeVisible();
    });

    test('should prevent DNI duplication during profile update', async ({ page }) => {
      await page.goto('/dashboard/profile');

      // Mock duplicate DNI error
      await page.route('**/api/user/profile', async (route) => {
        const request = route.request();
        if (request.method() === 'PUT') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'El DNI ya está registrado por otro usuario'
            })
          });
        }
      });

      // Try to update with existing DNI
      await page.fill('input[name="dni"]', '87654321');
      await page.click('button[type="submit"]');

      // Should show uniqueness error
      await expect(page.locator('text=El DNI ya está registrado por otro usuario')).toBeVisible();
    });

    test('should allow updating other fields without changing DNI', async ({ page }) => {
      await page.goto('/dashboard/profile');

      // Mock successful profile update
      await page.route('**/api/user/profile', async (route) => {
        const request = route.request();
        if (request.method() === 'PUT') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Perfil actualizado correctamente'
            })
          });
        }
      });

      // Update only name (keep same DNI)
      await page.fill('input[name="name"]', 'Updated Name');
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('text=Perfil actualizado correctamente')).toBeVisible();
    });
  });

  test.describe('Login Flow', () => {
    test('should include DNI in session after login', async ({ page }) => {
      await page.goto('/login');

      // Mock successful login
      await page.route('**/api/auth/callback/credentials', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'Location': '/dashboard' }
        });
      });

      // Mock session with DNI
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User',
              dni: '12345678',
              requiresTwoFactor: false,
              isTwoFactorAuthenticated: true
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        });
      });

      // Login
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');

      // Verify DNI is in session
      await page.goto('/dashboard/profile');
      await expect(page.locator('input[name="dni"]')).toHaveValue('12345678');
    });
  });

  test.describe('Admin User Management', () => {
    test.beforeEach(async ({ page }) => {
      // Mock admin session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'admin-123',
              email: 'admin@example.com',
              name: 'Admin User',
              dni: 'ADM12345',
              role: 'ADMIN',
              requiresTwoFactor: false,
              isTwoFactorAuthenticated: true
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        });
      });
    });

    test('should show DNI in user management interface', async ({ page }) => {
      await page.goto('/dashboard/admin/users');

      // Mock users list endpoint
      await page.route('**/api/admin/users', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [
              {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                dni: '12345678',
                role: 'USER',
                emailVerified: true
              }
            ]
          })
        });
      });

      // Should show DNI column in users table
      await expect(page.locator('text=12345678')).toBeVisible();
    });

    test('should allow searching users by DNI', async ({ page }) => {
      await page.goto('/dashboard/admin/users');

      // Mock search endpoint
      await page.route('**/api/admin/users/search', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const query = url.searchParams.get('query');

        if (query === '12345678') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              users: [
                {
                  id: 'user-123',
                  email: 'test@example.com',
                  name: 'Test User',
                  dni: '12345678',
                  role: 'USER',
                  emailVerified: true
                }
              ]
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ users: [] })
          });
        }
      });

      // Search by DNI
      await page.fill('input[placeholder*="Buscar"]', '12345678');
      await page.press('input[placeholder*="Buscar"]', 'Enter');

      // Should show user with matching DNI
      await expect(page.locator('text=12345678')).toBeVisible();
    });
  });

  test.describe('CSV Import', () => {
    test.beforeEach(async ({ page }) => {
      // Mock admin session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'admin-123',
              email: 'admin@example.com',
              name: 'Admin User',
              dni: 'ADM12345',
              role: 'ADMIN',
              requiresTwoFactor: false,
              isTwoFactorAuthenticated: true
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        });
      });
    });

    test('should validate DNI format during CSV import', async ({ page }) => {
      await page.goto('/dashboard/admin/import');

      // Mock CSV import with DNI validation errors
      await page.route('**/api/admin/users/import', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Error de validación en CSV',
            details: [
              'Fila 2: DNI "123" no tiene 8 caracteres',
              'Fila 3: DNI "12*45678" contiene caracteres inválidos'
            ]
          })
        });
      });

      // Upload file (mock)
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'users.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('email,name,dni\ntest1@example.com,User1,123\ntest2@example.com,User2,12*45678')
      });

      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=Fila 2: DNI "123" no tiene 8 caracteres')).toBeVisible();
      await expect(page.locator('text=Fila 3: DNI "12*45678" contiene caracteres inválidos')).toBeVisible();
    });

    test('should handle DNI duplication during CSV import', async ({ page }) => {
      await page.goto('/dashboard/admin/import');

      // Mock CSV import with duplicate DNI error
      await page.route('**/api/admin/users/import', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Error de duplicación en CSV',
            details: [
              'Fila 2: DNI "12345678" ya está registrado',
              'Fila 5: DNI "87654321" duplicado dentro del archivo'
            ]
          })
        });
      });

      // Upload file (mock)
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'users.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('email,name,dni\ntest1@example.com,User1,12345678\ntest2@example.com,User2,12345678')
      });

      await page.click('button[type="submit"]');

      // Should show duplication errors
      await expect(page.locator('text=Fila 2: DNI "12345678" ya está registrado')).toBeVisible();
    });
  });

  test.describe('Accessibility and UX', () => {
    test('should have proper DNI field attributes', async ({ page }) => {
      await page.goto('/register');

      const dniInput = await page.locator('input[name="dni"]');

      // Check accessibility attributes
      await expect(dniInput).toHaveAttribute('required');
      await expect(dniInput).toHaveAttribute('maxlength', '8');
      await expect(dniInput).toHaveAttribute('pattern', '[A-Za-z0-9]{8}');
      await expect(dniInput).toHaveAttribute('inputmode', 'numeric');

      // Check ARIA attributes
      await expect(dniInput).toHaveAttribute('aria-required', 'true');
      await expect(dniInput).toHaveAttribute('aria-describedby');
    });

    test('should show real-time validation feedback', async ({ page }) => {
      await page.goto('/register');

      const dniInput = await page.locator('input[name="dni"]');

      // Type character by character
      await dniInput.type('1');
      await expect(page.locator('text=DNI must be exactly 8 alphanumeric characters')).toBeVisible();

      await dniInput.type('2');
      await expect(page.locator('text=DNI must be exactly 8 alphanumeric characters')).toBeVisible();

      // Complete with valid DNI
      await dniInput.type('345678');
      await expect(page.locator('text=DNI must be exactly 8 alphanumeric characters')).not.toBeVisible();

      // Clear and type invalid character
      await dniInput.clear();
      await dniInput.type('1234567*');
      await expect(page.locator('text=DNI must be exactly 8 alphanumeric characters')).toBeVisible();
    });

    test('should maintain DNI format consistency across all forms', async ({ page }) => {
      const routes = ['/register', '/dashboard/profile'];

      for (const route of routes) {
        await page.goto(route);

        const dniInput = await page.locator('input[name="dni"]');
        await expect(dniInput).toBeVisible();
        await expect(dniInput).toHaveAttribute('maxlength', '8');
        await expect(dniInput).toHaveAttribute('pattern', '[A-Za-z0-9]{8}');
      }
    });
  });
});