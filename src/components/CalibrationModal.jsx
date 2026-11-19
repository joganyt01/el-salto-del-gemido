import './CalibrationModal.css';

export function CalibrationModal({
  isActive,
  isLoading,
  error,
  volume,
  sensitivity,
  onSensitivityChange,
  onActivateMedia,
  onStartGame,
}) {
  return (
    <div className="calibration-overlay" role="dialog" aria-modal="true">
      <div className="calibration-card">
        <span className="calibration-card__tag">A puro pulmón y escándalo</span>
        <h1 className="calibration-card__title">El Salto del Gemido</h1>
        <p className="calibration-card__subtitle">
          La bolita avanza sola y salta según qué tan duro grites o gimas frente a la cámara.
        </p>

        {!isActive ? (
          <button
            type="button"
            className="calibration-card__btn calibration-card__btn--primary"
            onClick={onActivateMedia}
            disabled={isLoading}
          >
            {isLoading ? 'Activando sensores...' : 'ACTIVAR CÁMARA Y MICRÓFONO'}
          </button>
        ) : (
          <div className="calibration-card__control">
            <div className="calibration-card__label">
              <span>Filtro de ruido ambiente</span>
              <span>{sensitivity}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="60"
              value={sensitivity}
              onChange={(e) => onSensitivityChange(Number(e.target.value))}
              className="calibration-card__slider"
            />

            <div className="calibration-card__label">
              <span>Prueba tu voz ahora</span>
              <span>{Math.round(volume)}%</span>
            </div>

            <div className="calibration-card__meter">
              <div
                className="calibration-card__meter-fill"
                style={{ width: `${Math.min(100, Math.round(volume))}%` }}
              />
            </div>

            <p className="calibration-card__hint">
              Si la barra se mueve sola estando en silencio, sube un poco el filtro.
            </p>
          </div>
        )}

        {error && <p className="calibration-card__error">{error}</p>}

        {isActive && (
          <button
            type="button"
            className="calibration-card__btn calibration-card__btn--start"
            onClick={onStartGame}
          >
            ¡LISTO, A GRITAR!
          </button>
        )}
      </div>
    </div>
  );
}