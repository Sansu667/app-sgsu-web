/** Módulo de reportes: contenido para el administrador y bloqueo para los demás roles. */
import { test, expect } from '@playwright/test';
import { CUENTAS, entrar } from './ayudas.js';

test.describe('Módulo de reportes', () => {
  test('REP-01 el administrador ve los tres reportes', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.getByRole('link', { name: 'Reportes' }).click();
    await expect(page.getByRole('heading', { name: 'Solicitudes por estado' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Servicios más solicitados' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Carga por técnico' })).toBeVisible();
  });

  test('REP-02 el reporte por estado incluye los seis estados', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/reportes');
    await expect(page.locator('.barras__fila')).toHaveCount(6);
  });

  test('REP-03 los porcentajes del reporte suman aproximadamente cien', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/reportes');
    await expect(page.locator('.barras__numero').first()).toBeVisible();
    const textos = await page.locator('.barras__numero').allInnerTexts();
    const suma = textos.map((t) => Number(t.match(/\((\d+)%\)/)[1])).reduce((a, b) => a + b, 0);
    expect(suma).toBeGreaterThanOrEqual(97);
    expect(suma).toBeLessThanOrEqual(103);
  });

  test('REP-04 el técnico no puede ver los reportes', async ({ page }) => {
    await entrar(page, CUENTAS.tecnico);
    await page.goto('/reportes');
    await expect(page.getByText('Acceso denegado')).toBeVisible();
  });
});
