import { useCallback, useEffect, useRef, useState } from 'react';

export function useMediaStream(initialSensitivity = 15) {
  const [stream, setStream] = useState(null);
  const [volume, setVolume] = useState(0);
  const [peakVolume, setPeakVolume] = useState(0);
  const [sensitivity, setSensitivity] = useState(initialSensitivity);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const rafIdRef = useRef(null);
  const sensitivityRef = useRef(initialSensitivity);
  const peakRef = useRef(0);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  const stopAudioLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const stopMedia = useCallback(() => {
    stopAudioLoop();

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // Ignorar si ya estaba desconectado
      }
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setStream(null);
    setIsActive(false);
    setVolume(0);
  }, [stopAudioLoop]);

  const resetPeak = useCallback(() => {
    peakRef.current = 0;
    setPeakVolume(0);
  }, []);

  const startAnalysis = useCallback(
    (mediaStream) => {
      stopAudioLoop();

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        setError('Este navegador no soporta Web Audio API.');
        return;
      }

      const audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.72;

      const sourceNode = audioContext.createMediaStreamSource(mediaStream);
      sourceNode.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceNodeRef.current = sourceNode;

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      const tick = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(dataArray);

        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i += 1) {
          const normalizedSample = (dataArray[i] - 128) / 128;
          sumSquares += normalizedSample * normalizedSample;
        }

        const rms = Math.sqrt(sumSquares / bufferLength);
        // Escala práctica para voz normal a grito/gemido intenso (0 - 100)
        const rawLevel = Math.min(100, Math.round(rms * 390));
        const threshold = sensitivityRef.current;

        const filteredLevel =
          rawLevel <= threshold
            ? 0
            : Math.min(
                100,
                Math.round(((rawLevel - threshold) / Math.max(1, 100 - threshold)) * 100)
              );

        setVolume(filteredLevel);

        if (filteredLevel > peakRef.current) {
          peakRef.current = filteredLevel;
          setPeakVolume(filteredLevel);
        }

        rafIdRef.current = requestAnimationFrame(tick);
      };

      rafIdRef.current = requestAnimationFrame(tick);
    },
    [stopAudioLoop]
  );

  const startMedia = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setError(
        'Tu navegador no permite acceder a cámara/micrófono o la conexión no es segura (usa localhost o HTTPS).'
      );
      return false;
    }

    setIsLoading(true);
    setError(null);
    stopMedia();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
      startAnalysis(mediaStream);
      setIsLoading(false);
      return true;
    } catch (err) {
      const message =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Permiso denegado para cámara o micrófono. Habilítalos en el navegador para jugar.'
          : err?.name === 'NotFoundError'
            ? 'No se detectó cámara o micrófono en este dispositivo.'
            : 'No se pudo activar la cámara o el micrófono.';
      setError(message);
      setIsActive(false);
      setIsLoading(false);
      return false;
    }
  }, [startAnalysis, stopMedia]);

  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  return {
    stream,
    volume,
    peakVolume,
    sensitivity,
    setSensitivity,
    isActive,
    isLoading,
    error,
    startMedia,
    stopMedia,
    resetPeak,
  };
}