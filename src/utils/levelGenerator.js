export const LEVEL_LENGTH = 4800;
export const FINISH_LINE_X = LEVEL_LENGTH - 180;

export function getSegmentInfo(xPosition) {
  const progress = Math.max(0, Math.min(1, xPosition / FINISH_LINE_X));
  const progressPercent = Math.round(progress * 100);

  if (progressPercent < 30) {
    return {
      zone: 1,
      name: 'Calentamiento',
      progressPercent,
      requiredVolume: 30,
      sustainedGravityBoost: false,
    };
  }

  if (progressPercent < 65) {
    return {
      zone: 2,
      name: 'El Subidón',
      progressPercent,
      requiredVolume: 60,
      sustainedGravityBoost: true,
    };
  }

  if (progressPercent < 90) {
    return {
      zone: 3,
      name: 'La Prueba de Garganta',
      progressPercent,
      requiredVolume: 80,
      sustainedGravityBoost: true,
    };
  }

  return {
    zone: 4,
    name: 'El Muro del Gran Gemido',
    progressPercent,
    requiredVolume: 95,
    sustainedGravityBoost: true,
  };
}

export function generateLevelObstacles() {
  return [
    // Tramo 1 (0% - 30%): Calentamiento - tablitas bajitas (30px - 50px)
    { id: 't1-1', type: 'plank', x: 520, width: 36, height: 34, requiredVolume: 28, zone: 1 },
    { id: 't1-2', type: 'plank', x: 960, width: 40, height: 46, requiredVolume: 36, zone: 1 },

    // Tramo 2 (30% - 65%): El Subidón - tablas medianas y huecos/charcos
    { id: 't2-1', type: 'plank', x: 1580, width: 48, height: 74, requiredVolume: 55, zone: 2 },
    { id: 't2-2', type: 'puddle', x: 2040, width: 120, height: 18, requiredVolume: 60, zone: 2 },
    { id: 't2-3', type: 'plank', x: 2560, width: 52, height: 88, requiredVolume: 68, zone: 2 },

    // Tramo 3 (65% - 90%): La Prueba de Garganta - torres y tablones inclinados
    { id: 't3-1', type: 'rampPlank', x: 3240, width: 68, height: 112, tilt: -0.22, requiredVolume: 78, zone: 3 },
    { id: 't3-2', type: 'plank', x: 3820, width: 64, height: 128, requiredVolume: 85, zone: 3 },

    // Tramo 4 (90% - 100%): El Muro del Gran Gemido antes de la meta
    {
      id: 'final-wall',
      type: 'megaWall',
      x: FINISH_LINE_X - 240,
      width: 76,
      height: 165,
      requiredVolume: 95,
      signText: 'SOLO SE PASA A PURO PULMÓN (95% VOLUMEN)',
      zone: 4,
    },
  ];
}