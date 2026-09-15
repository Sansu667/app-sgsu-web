/** Campo de formulario con etiqueta y mensaje de error. */
export default function CampoTexto({
  etiqueta, nombre, valor, onChange, tipo = 'text',
  error, ayuda, requerido = false, filas, opciones, deshabilitado = false,
}) {
  const id = `campo-${nombre}`;
  const comun = {
    id, name: nombre, value: valor ?? '', onChange, disabled: deshabilitado,
    className: `campo__control${error ? ' campo__control--error' : ''}`,
    'aria-invalid': error ? 'true' : 'false',
  };

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}{requerido && <span className="campo__requerido"> *</span>}
      </label>

      {opciones ? (
        <select {...comun}>
          <option value="">Seleccione…</option>
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>{o.texto}</option>
          ))}
        </select>
      ) : filas ? (
        <textarea {...comun} rows={filas} />
      ) : (
        <input {...comun} type={tipo} />
      )}

      {error ? <p className="campo__error">{error}</p>
             : ayuda ? <p className="campo__ayuda">{ayuda}</p> : null}
    </div>
  );
}
