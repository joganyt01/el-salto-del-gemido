import { getVolumeLevelInfo } from '../utils/humorMessages';
import './VolumeMeter.css';

export function VolumeMeter({ volume = 0, requiredVolume = null }) {
  const safeVolume = Math.max(0, Math.min(100, Math.round(volume)));
  const levelInfo = getVolumeLevelInfo(safeVolume);
  const safeTarget =
    typeof requiredVolume === 'number'
      ? Math.max(0, Math.min(100, requiredVolume))
      : null;

  return (
    <aside className="volume-meter" aria-label="Medidor de volumen en tiempo real">
      <span className="volume-meter__value">{safeVolume}%</span>

      <div className="volume-meter__track">
        <div
          className={`volume-meter__fill volume-meter__fill--${levelInfo.tone}`}
          style={{ height: `${safeVolume}%` }}
        />

        {safeTarget !== null && (
          <div
            className="volume-meter__target-line"
            style={{ bottom: `${safeTarget}%` }}
            title={`Objetivo del tramo: ${safeTarget}%`}
          />
        )}

        <div
          className="volume-meter__mega-line"
          title="Zona del Gran Gemido (95%)"
        />
      </div>

      <span className="volume-meter__label">{levelInfo.label}</span>
    </aside>
  );
}