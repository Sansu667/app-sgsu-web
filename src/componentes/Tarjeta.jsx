/** Contenedor con título usado en todas las vistas. */
export default function Tarjeta({ titulo, descripcion, acciones, children }) {
  return (
    <section className="tarjeta">
      {(titulo || acciones) && (
        <header className="tarjeta__cabecera">
          <div>
            {titulo && <h2 className="tarjeta__titulo">{titulo}</h2>}
            {descripcion && <p className="tarjeta__descripcion">{descripcion}</p>}
          </div>
          {acciones && <div className="tarjeta__acciones">{acciones}</div>}
        </header>
      )}
      <div className="tarjeta__cuerpo">{children}</div>
    </section>
  );
}
