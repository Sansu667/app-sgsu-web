/** Módulo de autenticación: inicio de sesión, registro, salida y rutas protegidas. */
import { test, expect } from '@playwright/test';
import { CUENTAS, entrar, salir, unico } from './ayudas.js';

test.describe('Módulo de autenticación', () => {
  test('AUT-01 muestra la pantalla de inicio de sesión', async ({ page }) => {
    await page.goto('/entrar');
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.locator('.acceso__demo-boton')).toHaveCount(3);
  });

  test('AUT-02 valida los campos vacíos sin llamar a la API', async ({ page }) => {
    let peticiones = 0;
    page.on('request', (r) => { if (r.url().includes('/api/autenticacion/login')) peticiones += 1; });
    await page.goto('/entrar');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Escriba su nombre de usuario.')).toBeVisible();
    await expect(page.getByText('Escriba su contraseña.')).toBeVisible();
    expect(peticiones).toBe(0);
  });

  test('AUT-03 rechaza credenciales incorrectas', async ({ page }) => {
    await page.goto('/entrar');
    await page.locator('#campo-nombreUsuario').fill('admin');
    await page.locator('#campo-contrasena').fill('ClaveEquivocada1');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test('AUT-04 inicia sesión con cada rol y llega al panel', async ({ page }) => {
    for (const cuenta of [CUENTAS.admin, CUENTAS.tecnico, CUENTAS.cliente]) {
      await entrar(page, cuenta);
      await expect(page.locator('.pagina__titulo')).toContainText('Hola');
      await salir(page);
    }
  });

  test('AUT-05 redirige al inicio de sesión si no hay sesión', async ({ page }) => {
    await page.goto('/solicitudes');
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test('AUT-06 al salir, la sesión ya no sirve para entrar a rutas privadas', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await salir(page);
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test('AUT-07 registra un cliente nuevo que luego puede entrar', async ({ page }) => {
    const n = unico();
    await page.goto('/registro');
    await page.locator('#campo-nombreCompleto').fill(`Cliente de Prueba ${n}`);
    await page.locator('#campo-documento').fill(`90${n}12`);
    await page.locator('#campo-correo').fill(`cliente${n}@correo.com`);
    await page.locator('#campo-nombreUsuario').fill(`cliente${n}`);
    await page.locator('#campo-contrasena').fill('Cliente2026*');
    await page.locator('#campo-confirmacion').fill('Cliente2026*');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByText('Cuenta creada')).toBeVisible();
    await expect(page).toHaveURL(/\/entrar$/, { timeout: 8000 });
    await entrar(page, [`cliente${n}`, 'Cliente2026*']);
    await expect(page.getByText('Todavía no ha radicado ninguna solicitud.')).toBeVisible();
  });

  test('AUT-08 el registro rechaza un documento con letras', async ({ page }) => {
    await page.goto('/registro');
    await page.locator('#campo-documento').fill('12AB');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByText('El documento debe tener entre 6 y 15 dígitos.')).toBeVisible();
  });
});
