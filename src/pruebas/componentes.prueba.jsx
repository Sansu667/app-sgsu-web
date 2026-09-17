/**
 * Pruebas unitarias del módulo de componentes reutilizables.
 * Se monta cada componente en un DOM simulado (jsdom) y se revisa lo que
 * termina viendo el usuario.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import Alerta from '../componentes/Alerta.jsx';
import Boton from '../componentes/Boton.jsx';
import CampoTexto from '../componentes/CampoTexto.jsx';
import Insignia, { colorDeEstado } from '../componentes/Insignia.jsx';
import Tabla from '../componentes/Tabla.jsx';

describe('Insignia', () => {
  it('asigna un color distinto a cada estado del flujo', () => {
    expect(colorDeEstado('registrada')).toBe('gris');
    expect(colorDeEstado('asignada')).toBe('azul');
    expect(colorDeEstado('en_proceso')).toBe('ambar');
    expect(colorDeEstado('resuelta')).toBe('verde');
    expect(colorDeEstado('cerrada')).toBe('verde-oscuro');
    expect(colorDeEstado('cancelada')).toBe('rojo');
  });

  it('usa el color gris para un estado que no conoce', () => {
    expect(colorDeEstado('inventado')).toBe('gris');
  });

  it('muestra el estado con el texto legible y la clase del color', () => {
    const { container } = render(<Insignia valor="en_proceso" />);
    expect(screen.getByText('En proceso')).toBeInTheDocument();
    expect(container.querySelector('.insignia--ambar')).not.toBeNull();
  });

  it('cambia la paleta cuando se pide una prioridad', () => {
    const { container } = render(<Insignia valor="alta" tipo="prioridad" />);
    expect(container.querySelector('.insignia--rojo')).not.toBeNull();
  });
});

describe('Boton', () => {
  it('ejecuta la acción cuando se hace clic', () => {
    const accion = vi.fn();
    render(<Boton onClick={accion}>Guardar</Boton>);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('se bloquea y avisa mientras la petición está en curso', () => {
    render(<Boton cargando>Guardar</Boton>);
    const boton = screen.getByRole('button');
    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent('Procesando');
  });

  it('respeta la propiedad de deshabilitado', () => {
    render(<Boton deshabilitado>Asignar</Boton>);
    expect(screen.getByRole('button', { name: 'Asignar' })).toBeDisabled();
  });
});

describe('Alerta', () => {
  it('no dibuja nada cuando no hay contenido', () => {
    const { container } = render(<Alerta tipo="error" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el título, el texto y la lista de errores de validación', () => {
    render(
      <Alerta tipo="error" titulo="Datos inválidos" detalles={['El correo es obligatorio.']}>
        No se pudo guardar el usuario.
      </Alerta>,
    );
    expect(screen.getByText('Datos inválidos')).toBeInTheDocument();
    expect(screen.getByText('No se pudo guardar el usuario.')).toBeInTheDocument();
    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument();
  });

  it('marca los errores con el rol alert para los lectores de pantalla', () => {
    render(<Alerta tipo="error">Falló la conexión.</Alerta>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('CampoTexto', () => {
  it('asocia la etiqueta con el control y avisa cuando es obligatorio', () => {
    render(
      <CampoTexto etiqueta="Documento" nombre="documento" requerido valor="" onChange={() => {}} />,
    );
    expect(screen.getByLabelText(/Documento/)).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('informa los cambios que escribe el usuario', () => {
    const cambiar = vi.fn();
    render(<CampoTexto etiqueta="Dirección" nombre="direccion" valor="" onChange={cambiar} />);
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Calle 45' } });
    expect(cambiar).toHaveBeenCalled();
  });

  it('muestra el error en lugar de la ayuda cuando el campo está mal', () => {
    render(
      <CampoTexto
        etiqueta="Correo" nombre="correo" valor="mal" onChange={() => {}}
        error="Escriba un correo válido." ayuda="Se usa para notificarle."
      />,
    );
    expect(screen.getByText('Escriba un correo válido.')).toBeInTheDocument();
    expect(screen.queryByText('Se usa para notificarle.')).toBeNull();
  });

  it('dibuja una lista desplegable cuando recibe opciones', () => {
    render(
      <CampoTexto
        etiqueta="Prioridad" nombre="prioridad" valor="alta" onChange={() => {}}
        opciones={[{ valor: 'baja', texto: 'Baja' }, { valor: 'alta', texto: 'Alta' }]}
      />,
    );
    const lista = screen.getByLabelText('Prioridad');
    expect(lista.tagName).toBe('SELECT');
    expect(lista.querySelectorAll('option')).toHaveLength(3); // incluye "Seleccione…"
  });
});

describe('Tabla', () => {
  const columnas = [
    { clave: 'codigo', titulo: 'Código' },
    { clave: 'total', titulo: 'Total', dibujar: (f) => `$ ${f.total}` },
  ];

  it('muestra el mensaje de vacío cuando no hay filas', () => {
    render(<Tabla columnas={columnas} filas={[]} vacio="No hay solicitudes." />);
    expect(screen.getByText('No hay solicitudes.')).toBeInTheDocument();
  });

  it('dibuja los encabezados y una fila por registro', () => {
    render(<Tabla columnas={columnas} filas={[
      { id: 1, codigo: 'SOL-0001', total: 85000 },
      { id: 2, codigo: 'SOL-0002', total: 120000 },
    ]} />);

    expect(screen.getByText('Código')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // encabezado + dos filas
  });

  it('usa la función de la columna para dar formato al contenido', () => {
    render(<Tabla columnas={columnas} filas={[{ id: 1, codigo: 'SOL-0001', total: 85000 }]} />);
    expect(screen.getByText('$ 85000')).toBeInTheDocument();
  });
});
