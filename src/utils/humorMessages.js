export const VOLUME_LEVELS = [
  {
    min: 0,
    max: 24,
    label: 'Susurro inocente',
    tone: 'calm',
    alertText: null,
    emojis: [],
  },
  {
    min: 25,
    max: 49,
    label: 'Grito de susto',
    tone: 'warm',
    alertText: null,
    emojis: [],
  },
  {
    min: 50,
    max: 74,
    label: 'Escándalo en el barrio',
    tone: 'loud',
    alertText: '¡Se escuchó hasta la esquina!',
    emojis: ['📢', '😮'],
  },
  {
    min: 75,
    max: 100,
    label: '¡GEMIDO PROHIBIDO / ALERTA VECINOS!',
    tone: 'extreme',
    alertText: '¡QUE ALGUIEN LE TAPE LA BOCA!',
    emojis: ['🔥', '📢', '🔊', '😱'],
  },
];

export const LOSS_MESSAGES = [
  '¿Eso fue un grito o un suspiro de gato asustado?',
  'Su mamá tenía razón, usted no tiene pulmones ni para inflar una bomba.',
  'La bolita se estrelló por falta de actitud.',
  '¡Grite con ganas, mijo, que no le están cobrando el aire!',
  'Con ese volumen ni el perro del vecino se inmuta.',
];

export const VICTORY_MESSAGES = [
  '¡Lo logró a puro pulmón y escándalo! Los vecinos ya están llamando a la administración.',
  '¡Qué cierre tan dramático! La bolita cruzó la meta con eco incluido.',
];

export function getVolumeLevelInfo(volume) {
  const safeVolume = Math.max(0, Math.min(100, Number(volume) || 0));
  return (
    VOLUME_LEVELS.find(
      (level) => safeVolume >= level.min && safeVolume <= level.max
    ) || VOLUME_LEVELS[0]
  );
}

export function getRandomLossMessage(seedIndex = 0) {
  const index = Math.abs(Number(seedIndex) || 0) % LOSS_MESSAGES.length;
  return LOSS_MESSAGES[index];
}

export function getRandomVictoryMessage(seedIndex = 0) {
  const index = Math.abs(Number(seedIndex) || 0) % VICTORY_MESSAGES.length;
  return VICTORY_MESSAGES[index];
}

export function getPerformanceTitle({ won, progressPercent, peakVolume }) {
  if (won && peakVolume >= 95) {
    return 'Campeón Olímpico del Bochorno / Leyenda del Gemido';
  }
  if (won) {
    return 'Escandaloso promedio';
  }
  if (progressPercent < 30) {
    return 'Vergüenza del barrio';
  }
  if (progressPercent < 70) {
    return 'Garganta de cristal';
  }
  return 'Casi leyenda, pero se quedó sin aire';
}