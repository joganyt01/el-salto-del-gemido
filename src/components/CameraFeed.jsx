import { useEffect, useRef } from 'react';
import { getVolumeLevelInfo } from '../utils/humorMessages';
import './CameraFeed.css';

export function CameraFeed({ stream, volume = 0 }) {
  const videoRef = useRef(null);
  const levelInfo = getVolumeLevelInfo(volume);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return undefined;

    if (stream) {
      videoEl.srcObject = stream;
    } else {
      videoEl.srcObject = null;
    }

    return () => {
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <div className={`camera-feed camera-feed--${levelInfo.tone}`}>
      {stream ? (
        <video
          ref={videoRef}
          className="camera-feed__video"
          autoPlay
          playsInline
          muted
        />
      ) : (
        <div className="camera-feed__placeholder">
          Cámara en espera de activación
        </div>
      )}

      <span className="camera-feed__badge">EN VIVO • {Math.round(volume)}%</span>

      {levelInfo.emojis.length > 0 && (
        <div className="camera-feed__emojis" aria-hidden="true">
          {levelInfo.emojis.map((emoji, index) => (
            <span key={`${emoji}-${index}`}>{emoji}</span>
          ))}
        </div>
      )}

      {levelInfo.alertText && (
        <div className="camera-feed__alert">{levelInfo.alertText}</div>
      )}
    </div>
  );
}