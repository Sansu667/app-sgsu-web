/**
 * Funciones de apoyo compartidas por las pruebas de extremo a extremo.
 * Todas actúan sobre la interfaz, igual que lo haría una persona.
 */
import { expect } from '@playwright/test';

export const CUENTAS = {
  admin: ['admin', 'Admin2026*'],
  tecnico: ['laura.tecnico', 'Tecnico2026*'],
  cliente: ['ana.gomez', 'Usuario2026*'],
  otroCliente: ['carlos.perez', 'Usuario2026*'],
};

/** Inicia sesión desde la pantalla de acceso y espera a llegar al panel. */
export async function entrar(pagina, [usuario, clave]) {
  await pagina.goto('/entrar');
  await pagina.locator('#campo-nombreUsuario').fill(usuario);
  await pagina.locator('#campo-contrasena').fill(clave);
  await pagina.getByRole('button', { name: 'Entrar' }).click();
  await expect(pagina).toHaveURL(/\/panel$/);
}

/** Cierra la sesión con el botón del encabezado. */
export async function salir(pagina) {
  await pagina.getByRole('button', { name: 'Salir' }).click();
  await expect(pagina).toHaveURL(/\/entrar$/);
}

/** Texto único para no chocar con datos de otras pruebas. */
export const unico = () => String(Date.now()).slice(-6);
