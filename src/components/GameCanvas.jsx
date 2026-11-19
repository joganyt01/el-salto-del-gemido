import { useEffect, useRef, useState } from 'react';
import heroImgSrc from '../assets/hero.png';
import {
  FINISH_LINE_X,
  generateLevelObstacles,
  getSegmentInfo,
} from '../utils/levelGenerator';
import { soundEffects } from '../utils/soundEffects';
import './GameCanvas.css';

const GROUND_OFFSET = 58;
const BALL_RADIUS = 18;
const RUN_SPEED = 215; // px por segundo

export function GameCanvas({
  isPlaying,
  volume = 0,
  runId = 0,
  onProgressChange,
  onGameEnd,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const heroImgRef = useRef(null);

  const volumeRef = useRef(volume);
  const isPlayingRef = useRef(isPlaying);
  const onProgressRef = useRef(onProgressChange);
  const onGameEndRef = useRef(onGameEnd);
  const turboCooldownRef = useRef(0);
  const endedRef = useRef(false);

  const [hudInfo, setHudInfo] = useState({
    zoneName: 'Calentamiento',
    progressPercent: 0,
    requiredVolume: 30,
  });

  const stateRef = useRef({
    x: 90,
    y: 0,
    vy: 0,
    onGround: true,
    obstacles: generateLevelObstacles(),
  });

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    onProgressRef.current = onProgressChange;
    onGameEndRef.current = onGameEnd;
  }, [onProgressChange, onGameEnd]);

  useEffect(() => {
    const img = new Image();
    img.src = heroImgSrc;
    heroImgRef.current = img;
  }, []);

  useEffect(() => {
    endedRef.current = false;
    turboCooldownRef.current = 0;
    stateRef.current = {
      x: 90,
      y: 0,
      vy: 0,
      onGround: true,
      obstacles: generateLevelObstacles(),
    };
    setHudInfo({
      zoneName: 'Calentamiento',
      progressPercent: 0,
      requiredVolume: 30,
    });
    if (onProgressRef.current) {
      onProgressRef.current(0, 30);
    }
  }, [runId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let rafId = null;
    let lastTime = performance.now();
    let lastHudSync = 0;

    const syncCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(280, Math.floor(rect.width));
      const height = Math.max(220, Math.floor(rect.height));

      if (
        canvas.width !== Math.floor(width * dpr) ||
        canvas.height !== Math.floor(height * dpr)
      ) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width, height };
    };

    let viewport = syncCanvasSize();

    const handleResize = () => {
      viewport = syncCanvasSize();
    };

    window.addEventListener('resize', handleResize);

    const finishMatch = (outcome, failReason = '') => {
      if (endedRef.current) return;
      endedRef.current = true;
      const seg = getSegmentInfo(stateRef.current.x);

      if (outcome === 'VICTORY') {
        soundEffects.playVictoryFanfare();
      } else {
        soundEffects.playBonk();
      }

      if (onGameEndRef.current) {
        onGameEndRef.current({
          outcome,
          progressPercent: seg.progressPercent,
          failReason,
        });
      }
    };

    const step = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const { width, height } = viewport;
      const groundY = height - GROUND_OFFSET;
      const player = stateRef.current;
      const currentVol = volumeRef.current;
      const seg = getSegmentInfo(player.x);

      if (turboCooldownRef.current > 0) {
        turboCooldownRef.current = Math.max(0, turboCooldownRef.current - dt);
      }

      if (isPlayingRef.current && !endedRef.current) {
        player.x += RUN_SPEED * dt;

        if (currentVol >= 18) {
          const strength = currentVol / 100;

          if (player.onGround && currentVol >= 22) {
            const isMegaBoost = currentVol >= 95 && seg.zone === 4;
            player.vy = isMegaBoost ? 780 : 250 + strength * 470;
            player.onGround = false;

            if ((isMegaBoost || currentVol >= 80) && turboCooldownRef.current === 0) {
              soundEffects.playTurboWhoosh();
              turboCooldownRef.current = 0.45;
            }
          } else if (!player.onGround && currentVol >= 45) {
            player.vy += strength * 320 * dt;
          }
        }

        const extraGravity =
          !player.onGround && seg.sustainedGravityBoost && currentVol < 35
            ? 520
            : 0;
        player.vy -= (1280 + extraGravity) * dt;
        player.y += player.vy * dt;

        if (player.y <= 0) {
          player.y = 0;
          player.vy = 0;
          player.onGround = true;
        }

        const maxJumpY = Math.max(80, groundY - BALL_RADIUS - 16);
        if (player.y > maxJumpY) {
          player.y = maxJumpY;
          if (player.vy > 0) player.vy = 0;
        }

        const ballLeft = player.x - BALL_RADIUS + 4;
        const ballRight = player.x + BALL_RADIUS - 4;
        const ballBottomWorld = player.y;
        const ballTopWorld = player.y + BALL_RADIUS * 2;

        for (let i = 0; i < player.obstacles.length; i += 1) {
          const obs = player.obstacles[i];
          const obsLeft = obs.x;
          const obsRight = obs.x + obs.width;

          const overlapsX = ballRight > obsLeft && ballLeft < obsRight;
          if (!overlapsX) continue;

          if (obs.type === 'puddle') {
            if (ballBottomWorld < obs.height) {
              finishMatch(
                'GAMEOVER',
                'Cayó directo en el charco de agua sucia por falta de pulmón.'
              );
              break;
            }
          } else if (ballBottomWorld < obs.height && ballTopWorld > 0) {
            const reason =
              obs.type === 'megaWall'
                ? 'Se estrelló contra El Muro del Gran Gemido. ¡Faltó ese 95% a puro pulmón!'
                : 'Chocó de frente contra una tablita por gritar tarde o bajito.';
            finishMatch('GAMEOVER', reason);
            break;
          }
        }

        if (!endedRef.current && player.x >= FINISH_LINE_X) {
          finishMatch('VICTORY');
        }

        if (now - lastHudSync > 90) {
          lastHudSync = now;
          setHudInfo({
            zoneName: seg.name,
            progressPercent: seg.progressPercent,
            requiredVolume: seg.requiredVolume,
          });
          if (onProgressRef.current) {
            onProgressRef.current(seg.progressPercent, seg.requiredVolume);
          }
        }
      }

      // --- DIBUJADO TRANSPARENTE SOBRE CÁMARA ---
      ctx.clearRect(0, 0, width, height);

      const cameraX = player.x - Math.min(130, width * 0.24);

      // Suelo semitransparente para no tapar por completo la cámara
      ctx.fillStyle = 'rgba(63, 46, 33, 0.78)';
      ctx.fillRect(0, groundY, width, GROUND_OFFSET);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, groundY, width, 5);

      // Obstáculos
      for (let i = 0; i < player.obstacles.length; i += 1) {
        const obs = player.obstacles[i];
        const screenX = obs.x - cameraX;
        if (screenX + obs.width < -60 || screenX > width + 60) continue;

        if (obs.type === 'puddle') {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.fillRect(screenX, groundY - 6, obs.width, 10);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(screenX + 6, groundY - 2, obs.width - 12, 5);
        } else {
          const topY = groundY - obs.height;
          ctx.fillStyle =
            obs.type === 'megaWall'
              ? 'rgba(239, 68, 68, 0.9)'
              : 'rgba(217, 119, 6, 0.9)';
          ctx.fillRect(screenX, topY, obs.width, obs.height);

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(screenX, topY, obs.width, obs.height);

          if (obs.type === 'megaWall' && obs.signText) {
            ctx.fillStyle = '#fde047';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(obs.signText, screenX + obs.width / 2, topY - 12);
          }
        }
      }

      // Bandera de meta
      const finishScreenX = FINISH_LINE_X - cameraX;
      if (finishScreenX > -40 && finishScreenX < width + 60) {
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(finishScreenX, groundY);
        ctx.lineTo(finishScreenX, groundY - 115);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(finishScreenX, groundY - 115, 44, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('META', finishScreenX + 22, groundY - 97);
      }

      // Bolita / personaje
      const ballScreenX = player.x - cameraX;
      const ballScreenY = groundY - player.y - BALL_RADIUS;

      const img = heroImgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ballScreenX, ballScreenY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          img,
          ballScreenX - BALL_RADIUS,
          ballScreenY - BALL_RADIUS,
          BALL_RADIUS * 2,
          BALL_RADIUS * 2
        );
        ctx.restore();
      } else {
        ctx.fillStyle = '#ff2a6d';
        ctx.beginPath();
        ctx.arc(ballScreenX, ballScreenY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ballScreenX, ballScreenY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div ref={containerRef} className="game-canvas-wrap">
      <div className="game-canvas-wrap__hud">
        <span>{hudInfo.zoneName}</span>
        <span>•</span>
        <span>{hudInfo.progressPercent}%</span>
      </div>
      <canvas ref={canvasRef} className="game-canvas-wrap__canvas" />
    </div>
  );
}