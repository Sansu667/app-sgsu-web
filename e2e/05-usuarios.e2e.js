/** Módulo de gestión de usuarios: creación, inactivación y efecto sobre el acceso. */
import { test, expect } from '@playwright/test';
import { CUENTAS, entrar, salir, unico } from './ayudas.js';

const n = unico();
const USUARIO = `tecnico${n}`;
const CLAVE = 'Tecnico2026*';

test.describe.serial('Módulo de gestión de usuarios', () => {
  test('USU-01 el cliente no puede entrar a la gestión de usuarios', async ({ page }) => {
    await entrar(page, CUENTAS.cliente);
    await page.goto('/usuarios');
    await expect(page.getByText('Acceso denegado')).toBeVisible();
  });

  test('USU-02 el administrador crea un técnico', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/usuarios');
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    await page.locator('#campo-nombreCompleto').fill(`Técnico de Prueba ${n}`);
    await page.locator('#campo-documento').fill(`80${n}34`);
    await page.locator('#campo-correo').fill(`${USUARIO}@sgsu.co`);
    await page.locator('#campo-telefono').fill('3001112233');
    await page.locator('#campo-nombreUsuario').fill(USUARIO);
    await page.locator('#campo-contrasena').fill(CLAVE);
    await page.locator('#campo-rol').selectOption('tecnico');
    await page.getByRole('button', { name: 'Crear usuario' }).click();
    await expect(page.getByText(`Usuario ${USUARIO} creado con rol tecnico.`)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(USUARIO) })).toBeVisible();
  });

  test('USU-03 el técnico nuevo puede entrar al sistema', async ({ page }) => {
    await entrar(page, [USUARIO, CLAVE]);
    await expect(page.getByText('Estas son las solicitudes que tiene asignadas.')).toBeVisible();
  });

  test('USU-04 una cuenta inactivada ya no puede entrar', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/usuarios');
    await page.getByRole('row', { name: new RegExp(USUARIO) }).getByRole('button', { name: 'Inactivar' }).click();
    await expect(page.getByText(/quedó inactivo/)).toBeVisible();
    await salir(page);

    await page.locator('#campo-nombreUsuario').fill(USUARIO);
    await page.locator('#campo-contrasena').fill(CLAVE);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toContainText('inactiva');
  });

  test('USU-05 al reactivarla vuelve a tener acceso', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/usuarios');
    await page.getByRole('row', { name: new RegExp(USUARIO) }).getByRole('button', { name: 'Activar' }).click();
    await expect(page.getByText(/quedó activo/)).toBeVisible();
    await salir(page);
    await entrar(page, [USUARIO, CLAVE]);
  });

  test('USU-06 el filtro por rol muestra solo técnicos', async ({ page }) => {
    await entrar(page, CUENTAS.admin);
    await page.goto('/usuarios');
    await page.locator('#filtro-rol').selectOption('tecnico');
    const roles = page.locator('table tbody tr td:nth-child(5)');
    await expect(roles.first()).toHaveText('tecnico');
    for (const texto of await roles.allInnerTexts()) expect(texto).toBe('tecnico');
  });
});
