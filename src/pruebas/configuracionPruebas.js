/**
 * Configuración que se ejecuta antes de cada archivo de pruebas.
 * Agrega las aserciones de jest-dom (toBeInTheDocument, toHaveTextContent…)
 * y limpia el DOM y los dobles de prueba entre casos.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
