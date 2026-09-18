/**
 * Punto de entrada de la aplicación.
 * Monta el árbol de React en el elemento #raiz y activa el enrutador.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import './estilos/global.css';

createRoot(document.getElementById('raiz')).render(
  <React.StrictMode>
    {/* Se activan por anticipado las banderas de la versión 7 del enrutador
        para que el proyecto no dependa del comportamiento antiguo. */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
