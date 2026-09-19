/**
 * Módulo de solicitudes: ciclo de vida completo de una solicitud pasando por
 * los tres roles, que es donde más se nota la integración de los módulos.
 */
import { test, expect } from '@playwright/test';
import { CUENTAS, entrar, salir } from './ayudas.js';

let rutaSolicitud = '';
let codigo = '';

const estado = (page) => page.locator('.pagina__titulo .insignia');

test.describe.serial('Módulo de solicitudes', () => {
  test('SOL-01 el formulario de radicación valida los campos obligatorios', async ({ page }) => {
    await entrar(page, CUENTAS.cliente);
    await page.getByRole('link', { name: 'Nueva solicitud' }).click();
    await page.getByRole('button', { name: 'Radicar solicitud' }).click();
    await expect(page.getByText('Seleccione el servicio que necesita.')).toBeVisible();
    await expect(page.getByText('Describa el caso con al menos 10 caracteres.')).toBeVisible();
  });

  test('SOL-02 el cliente radica una solicitud y queda registrada', async ({ page }) => {
    await entrar(page, CUENTAS.cliente);
    await page.getByRole('link', { name: 'Nueva solicitud' }).click();
    await page.locator('#campo-idServicio').selectOption({ index: 1 });
    await expect(page.locator('.resumen-servicio')).toBeVisible();
    await page.locator('#campo-descripcion').fill('La impresora de la oficina no imprime desde la red interna.');
    await page.locator('#campo-direccion').fill('Calle 50 # 45-10, oficina 204, Medellín');
    await page.locator('#campo-prioridad').selectOption('alta');
    await page.getByRole('button', { name: 'Radicar solicitud' }).click();
    await expect(page).toHaveURL(/\/solicitudes\/\d+$/);
    await expect(page.getByText(/radicada correctamente/)).toBeVisible();
    await expect(estado(page)).toHaveText('Registrada');
    rutaSolicitud = new URL(page.url()).pathname;
    codigo = (await page.locator('.pagina__titulo').innerText()).split(/\s/)[0];
  });

  test('SOL-03 otro cliente no puede abrir esa solicitud', async ({ page }) => {
    await entrar(page, CUENTAS.otroCliente);
    await page.goto(rutaSolicitud);
    await expect(page.getByText('No se pudo abrir la solicitud')).toBeVisible();
  });

  test('SOL-04 el administrador la asigna a un técnico', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto(rutaSolicitud);
    await page.locator('#campo-tecnico').selectOption({ label: 'Laura Restrepo Ossa' });
    await page.getByRole('button', { name: 'Asignar solicitud' }).click();
    await expect(page.getByText('La solicitud quedó asignada al técnico.')).toBeVisible();
    await expect(estado(page)).toHaveText('Asignada');
  });

  test('SOL-05 el técnico la pasa a en proceso y luego a resuelta', async ({ page }) => {
    await entrar(page, CUENTAS.tecnico);
    await page.goto(rutaSolicitud);
    await expect(page.getByRole('button', { name: 'Pasar a Cerrada' })).toHaveCount(0);
    await page.locator('#campo-comentario').fill('Visita programada para revisar la impresora.');
    await page.getByRole('button', { name: 'Pasar a En proceso' }).click();
    await expect(estado(page)).toHaveText('En proceso');
    await page.locator('#campo-comentario').fill('Se reconfiguró el puerto de red de la impresora.');
    await page.getByRole('button', { name: 'Pasar a Resuelta' }).click();
    await expect(estado(page)).toHaveText('Resuelta');
    await expect(page.getByRole('button', { name: 'Pasar a Cerrada' })).toHaveCount(0);
  });

  test('SOL-06 el administrador cierra la solicitud', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto(rutaSolicitud);
    await page.locator('#campo-comentario').fill('Caso cerrado con visto bueno del cliente.');
    await page.getByRole('button', { name: 'Pasar a Cerrada' }).click();
    await expect(estado(page)).toHaveText('Cerrada');
  });

  test('SOL-07 la bitácora registra los cinco movimientos del ciclo', async ({ page }) => {
    await entrar(page, CUENTAS.cliente);
    await page.goto(rutaSolicitud);
    await expect(page.locator('.linea-tiempo__paso')).toHaveCount(5);
    await expect(page.locator('.linea-tiempo')).toContainText('Caso cerrado con visto bueno del cliente.');
  });

  test('SOL-08 el filtro por estado encuentra la solicitud cerrada', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/solicitudes');
    await page.locator('#campo-estado').selectOption('cerrada');
    await expect(page.getByRole('row', { name: new RegExp(codigo) })).toBeVisible();
    await page.locator('#campo-estado').selectOption('registrada');
    await expect(page.getByRole('row', { name: new RegExp(codigo) })).toHaveCount(0);
  });

  test('SOL-09 el cliente solo ve sus propias solicitudes en el listado', async ({ page }) => {
    await entrar(page, CUENTAS.otroCliente);
    await page.goto('/solicitudes');
    await expect(page.getByRole('row', { name: new RegExp(codigo) })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Cliente' })).toHaveCount(0);
    await salir(page);
  });
});
