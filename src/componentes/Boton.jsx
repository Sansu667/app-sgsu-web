/** Botón reutilizable de la aplicación. */
export default function Boton({
  children, tipo = 'button', variante = 'primario',
  cargando = false, deshabilitado = false, onClick, ancho = false,
}) {
  return (
    <button
      type={tipo}
      className={`boton boton--${variante}${ancho ? ' boton--ancho' : ''}`}
      onClick={onClick}
      disabled={deshabilitado || cargando}
    >
      {cargando ? 'Procesando…' : children}
    </button>
  );
}
