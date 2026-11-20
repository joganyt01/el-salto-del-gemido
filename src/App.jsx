import { useCallback, useState } from 'react';
import { CalibrationModal } from './components/CalibrationModal';
import { CameraFeed } from './components/CameraFeed';
import { GameCanvas } from './components/GameCanvas';
import { ResultOverlay } from './components/ResultOverlay';
import { VolumeMeter } from './components/VolumeMeter';
import { useMediaStream } from './hooks/useMediaStream';
import './App.css';

// Estados posibles: 'CALIBRATING' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'
export function App() {
  const {
    stream,
    volume,
    peakVolume,
    sensitivity,
    setSensitivity,
    isActive,
    isLoading,
    error,
    startMedia,
    resetPeak,
  } = useMediaStream(10);

  const [gameState, setGameState] = useState('CALIBRATING');
  const [runId, setRunId] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [requiredVolume, setRequiredVolume] = useState(30);
  const [failReason, setFailReason] = useState('');

  const handleStartGame = useCallback(() => {
    resetPeak();
    setFailReason('');
    setProgressPercent(0);
    setRunId((prev) => prev + 1);
    setGameState('PLAYING');
  }, [resetPeak]);

  const handleProgressChange = useCallback((percent, nextRequiredVolume) => {
    setProgressPercent(percent);
    if (typeof nextRequiredVolume === 'number') {
      setRequiredVolume(nextRequiredVolume);
    }
  }, []);

  const handleGameEnd = useCallback(
    ({ outcome, progressPercent: finalPercent, failReason: reason }) => {
      if (typeof finalPercent === 'number') {
        setProgressPercent(finalPercent);
      }
      setFailReason(reason || '');
      setGameState(outcome);
    },
    []
  );

  const handleRetry = useCallback(() => {
    resetPeak();
    setFailReason('');
    setProgressPercent(0);
    setRunId((prev) => prev + 1);
    setGameState('PLAYING');
  }, [resetPeak]);

  const handleRecalibrate = useCallback(() => {
    setGameState('CALIBRATING');
  }, []);

  return (
    <main className="app-shell">
      <section className="filter-stage" aria-label="Escenario tipo filtro en vivo">
        <div className="filter-stage__camera">
          <CameraFeed stream={stream} volume={volume} />
        </div>

        <div className="filter-stage__canvas-layer">
          <GameCanvas
            isPlaying={gameState === 'PLAYING'}
            volume={volume}
            runId={runId}
            onProgressChange={handleProgressChange}
            onGameEnd={handleGameEnd}
          />
        </div>

        {gameState === 'PLAYING' && (
          <div className="filter-stage__meter">
            <VolumeMeter volume={volume} requiredVolume={requiredVolume} />
          </div>
        )}
      </section>

      {gameState === 'CALIBRATING' && (
        <CalibrationModal
          isActive={isActive}
          isLoading={isLoading}
          error={error}
          volume={volume}
          sensitivity={sensitivity}
          onSensitivityChange={setSensitivity}
          onActivateMedia={startMedia}
          onStartGame={handleStartGame}
        />
      )}

      {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
        <ResultOverlay
          outcome={gameState}
          progressPercent={progressPercent}
          peakVolume={peakVolume}
          failReason={failReason}
          attemptCount={runId}
          onRetry={handleRetry}
          onRecalibrate={handleRecalibrate}
        />
      )}
    </main>
  );
}

export default App;