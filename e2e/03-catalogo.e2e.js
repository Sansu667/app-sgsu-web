/** Módulo de catálogo: consulta por todos los roles y mantenimiento por el administrador. */
import { test, expect } from '@playwright/test';
import { CUENTAS, entrar, unico } from './ayudas.js';

const CODIGO = `PRU-${unico().slice(-3)}`;

test.describe.serial('Módulo de catálogo', () => {
  test('CAT-01 el cliente consulta el catálogo sin acciones de mantenimiento', async ({ page }) => {
    await entrar(page, CUENTAS.cliente);
    await page.getByRole('link', { name: 'Catálogo' }).click();
    // El sembrado deja ocho servicios, uno de ellos inactivo; el listado muestra todos.
    await expect(page.locator('table tbody tr')).toHaveCount(8);
    await expect(page.getByRole('button', { name: 'Nuevo servicio' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Acciones' })).toHaveCount(0);
  });

  test('CAT-02 el formulario valida el formato del código', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/catalogo');
    await page.getByRole('button', { name: 'Nuevo servicio' }).click();
    await page.locator('#campo-codigo').fill('abc');
    await page.getByRole('button', { name: 'Crear servicio' }).click();
    await expect(page.getByText('El código debe tener el formato AAA-000')).toBeVisible();
  });

  test('CAT-03 el administrador crea un servicio', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/catalogo');
    await page.getByRole('button', { name: 'Nuevo servicio' }).click();
    await page.locator('#campo-codigo').fill(CODIGO);
    await page.locator('#campo-categoria').fill('Pruebas');
    await page.locator('#campo-nombre').fill('Servicio creado por la prueba E2E');
    await page.locator('#campo-precioBase').fill('45000');
    await page.locator('#campo-tiempoEstimadoHoras').fill('1.5');
    await page.locator('#campo-descripcion').fill('Servicio temporal creado por la prueba automática.');
    await page.getByRole('button', { name: 'Crear servicio' }).click();
    await expect(page.getByText('Servicio creado correctamente.')).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(CODIGO) })).toBeVisible();
  });

  test('CAT-04 el administrador edita el servicio creado', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/catalogo');
    const fila = page.getByRole('row', { name: new RegExp(CODIGO) });
    await fila.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('#campo-codigo')).toHaveValue(CODIGO);
    await page.locator('#campo-precioBase').fill('52000');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Servicio actualizado correctamente.')).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(CODIGO) })).toContainText('52.000');
  });

  test('CAT-05 el administrador elimina el servicio creado', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/catalogo');
    await page.getByRole('row', { name: new RegExp(CODIGO) }).getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText(`El servicio ${CODIGO} fue eliminado.`)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(CODIGO) })).toHaveCount(0);
  });
});
