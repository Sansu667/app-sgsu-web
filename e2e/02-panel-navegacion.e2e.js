/** Módulo de panel y navegación: contenido y menú según el rol. */
import { test, expect } from '@playwright/test';
import { CUENTAS, entrar } from './ayudas.js';

const menu = (page) => page.getByRole('navigation', { name: 'Menú principal' }).getByRole('link');

test.describe('Módulo de panel y navegación', () => {
  test('PAN-01 el administrador ve los seis indicadores de estado', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await expect(page.locator('.indicador')).toHaveCount(6);
    await expect(page.getByRole('heading', { name: 'Últimas solicitudes' })).toBeVisible();
  });

  test('PAN-02 el cliente no ve indicadores, solo sus solicitudes', async ({ page }) => {
    await entrar(page, CUENTAS.cliente);
    await expect(page.locator('.indicador')).toHaveCount(0);
    await expect(page.getByText('Las cinco más recientes que usted radicó.')).toBeVisible();
  });

  test('PAN-03 el menú del administrador tiene las cinco opciones de su rol', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await expect(menu(page)).toHaveText(['Panel', 'Catálogo', 'Solicitudes', 'Usuarios', 'Reportes']);
  });

  test('PAN-04 el menú del técnico no ofrece usuarios, reportes ni radicar', async ({ page }) => {
    await entrar(page, CUENTAS.tecnico);
    await expect(menu(page)).toHaveText(['Panel', 'Catálogo', 'Solicitudes']);
  });

  test('PAN-05 el menú del cliente incluye «Nueva solicitud»', async ({ page }) => {
    await entrar(page, CUENTAS.cliente);
    await expect(menu(page)).toHaveText(['Panel', 'Catálogo', 'Solicitudes', 'Nueva solicitud']);
  });

  test('PAN-06 una ruta que no existe lleva al panel', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/ruta-que-no-existe');
    await expect(page).toHaveURL(/\/panel$/);
  });
});

test('PAN-07 ninguna pantalla repite un id (cada etiqueta apunta a su propio campo)', async ({ page }) => {
  await entrar(page, CUENTAS.admin);
  const rutas = ['/panel', '/catalogo', '/solicitudes', '/solicitudes/1', '/usuarios', '/reportes'];
  for (const ruta of rutas) {
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
    // Abre los formularios ocultos para revisarlos también.
    for (const nombre of ['Nuevo servicio', 'Nuevo usuario']) {
      const boton = page.getByRole('button', { name: nombre });
      if (await boton.count()) await boton.click();
    }
    const repetidos = await page.evaluate(() => {
      const vistos = {};
      document.querySelectorAll('[id]').forEach((e) => { vistos[e.id] = (vistos[e.id] || 0) + 1; });
      return Object.keys(vistos).filter((id) => vistos[id] > 1);
    });
    expect(repetidos, `ids repetidos en ${ruta}`).toEqual([]);
  }
});
