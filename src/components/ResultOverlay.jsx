import {
  getPerformanceTitle,
  getRandomLossMessage,
  getRandomVictoryMessage,
} from '../utils/humorMessages';
import './ResultOverlay.css';

export function ResultOverlay({
  outcome,
  progressPercent = 0,
  peakVolume = 0,
  failReason = '',
  attemptCount = 0,
  onRetry,
  onRecalibrate,
}) {
  const isVictory = outcome === 'VICTORY';
  const safeProgress = Math.max(0, Math.min(100, Math.round(progressPercent)));
  const safePeak = Math.max(0, Math.min(100, Math.round(peakVolume)));

  const title = getPerformanceTitle({
    won: isVictory,
    progressPercent: safeProgress,
    peakVolume: safePeak,
  });

  const message = isVictory
    ? getRandomVictoryMessage(attemptCount)
    : getRandomLossMessage(attemptCount);

  return (
    <div className="result-overlay" role="dialog" aria-modal="true">
      <div
        className={`result-card ${
          isVictory ? 'result-card--victory' : 'result-card--gameover'
        }`}
      >
        {isVictory && safePeak >= 95 && (
          <div className="result-card__confetti" aria-hidden="true">
            🎉 🎊 🔥 🎉 🎊
          </div>
        )}

        <h2 className="result-card__status">
          {isVictory ? '¡META SUPERADA!' : '¡SE ACABÓ EL AIRE!'}
        </h2>

        <div className="result-card__title-badge">{title}</div>

        <p className="result-card__message">{message}</p>

        {!isVictory && failReason && (
          <p className="result-card__reason">{failReason}</p>
        )}

        <div className="result-card__stats">
          <div className="result-stat">
            <span className="result-stat__label">Distancia</span>
            <span className="result-stat__value">{safeProgress}%</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">Pico de voz</span>
            <span className="result-stat__value">{safePeak}%</span>
          </div>
        </div>

        <div className="result-card__actions">
          <button
            type="button"
            className="result-card__btn result-card__btn--retry"
            onClick={onRetry}
          >
            ¡OTRA VEZ!
          </button>

          <button
            type="button"
            className="result-card__btn result-card__btn--secondary"
            onClick={onRecalibrate}
          >
            Ajustar micrófono / cámara
          </button>
        </div>
      </div>
    </div>
  );
}