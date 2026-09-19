/**
 * Configuración de las pruebas de extremo a extremo (E2E).
 *
 * Levanta una instancia propia de la API en el puerto 3100, con la base de
 * datos en memoria y sembrada desde cero, y el servidor de Vite en el 5174
 * apuntando a esa API. Así las pruebas nunca tocan los datos de desarrollo.
 *
 * Las pruebas corren en serie (un solo trabajador) porque comparten la misma
 * base de datos y algunas dependen del estado que dejan las anteriores dentro
 * de su propio archivo.
 */
import { defineConfig, devices } from '@playwright/test';

const NAVEGADOR = process.env.CHROMIUM_RUTA || undefined;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reportes/e2e-html', open: 'never' }],
    ['json', { outputFile: 'reportes/e2e-resultados.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    viewport: { width: 1366, height: 820 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    locale: 'es-CO',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: NAVEGADOR } },
    },
  ],
  webServer: [
    {
      command: 'node --no-warnings servidor/servidor.js',
      url: 'http://127.0.0.1:3100/api/salud',
      env: { PUERTO: '3100', RUTA_BASE_DATOS: ':memory:', MODO_PRUEBAS: '1' },
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'npx vite --port 5174 --strictPort --host 127.0.0.1',
      url: 'http://127.0.0.1:5174',
      env: { API_OBJETIVO: 'http://127.0.0.1:3100' },
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
