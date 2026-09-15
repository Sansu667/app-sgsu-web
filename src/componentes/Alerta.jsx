/** Mensaje de aviso, error o confirmación. */
export default function Alerta({ tipo = 'info', titulo, children, detalles }) {
  if (!children && !titulo && !(detalles && detalles.length)) return null;
  return (
    <div className={`alerta alerta--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {titulo && <strong className="alerta__titulo">{titulo}</strong>}
      {children && <p className="alerta__texto">{children}</p>}
      {detalles && detalles.length > 0 && (
        <ul className="alerta__lista">
          {detalles.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      )}
    </div>
  );
}
