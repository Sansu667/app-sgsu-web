/**
 * Tabla reutilizable.
 * Recibe la definición de las columnas y las filas; cada columna puede traer
 * una función para dibujar su contenido.
 */
export default function Tabla({ columnas, filas, claveFila = 'id', vacio = 'No hay registros.' }) {
  if (!filas || filas.length === 0) {
    return <p className="tabla__vacio">{vacio}</p>;
  }
  return (
    <div className="tabla__contenedor">
      <table className="tabla">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} className={c.centrado ? 'tabla__th--centro' : undefined}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila[claveFila]}>
              {columnas.map((c) => (
                <td key={c.clave} className={c.centrado ? 'tabla__td--centro' : undefined}>
                  {c.dibujar ? c.dibujar(fila) : fila[c.clave]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
