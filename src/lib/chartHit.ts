export type ChartScreenPoint = { x: number; y: number; index: number };

export type ChartHitSeries = {
  modelKey: string;
  points: ChartScreenPoint[];
};

export type ChartHit = {
  modelKey: string;
  pointIndex: number;
  alsoModels: string[];
  distance: number;
};

const MODEL_ORDER = ["lean", "nn", "goals"];

function pointDistance(point: ChartScreenPoint, x: number, y: number) {
  return Math.hypot(point.x - x, point.y - y);
}

function segmentDistance(point: ChartScreenPoint, next: ChartScreenPoint, x: number, y: number) {
  const dx = next.x - point.x;
  const dy = next.y - point.y;
  if (dx === 0 && dy === 0) return pointDistance(point, x, y);
  const amount = Math.max(0, Math.min(1, ((x - point.x) * dx + (y - point.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x + amount * dx - x, point.y + amount * dy - y);
}

function lineDistance(points: ChartScreenPoint[], x: number, y: number) {
  if (points.length === 0) return Infinity;
  if (points.length === 1) return pointDistance(points[0], x, y);
  return Math.min(...points.slice(1).map((point, index) => segmentDistance(points[index], point, x, y)));
}

export function hitChartLine(
  x: number,
  y: number,
  series: ChartHitSeries[],
  selectedModel: string | null = null,
): ChartHit | null {
  const ranked = series
    .map((item) => ({ item, distance: lineDistance(item.points, x, y) }))
    .sort((a, b) => {
      if (Math.abs(a.distance - b.distance) <= 1.5) {
        if (a.item.modelKey === selectedModel) return -1;
        if (b.item.modelKey === selectedModel) return 1;
        return MODEL_ORDER.indexOf(a.item.modelKey) - MODEL_ORDER.indexOf(b.item.modelKey);
      }
      return a.distance - b.distance;
    });
  const winner = ranked[0];
  if (!winner || winner.item.points.length === 0) return null;

  const pointIndex = winner.item.points.reduce((closest, point, index) => {
    const current = Math.abs(point.x - x);
    const previous = Math.abs(winner.item.points[closest].x - x);
    return current < previous ? index : closest;
  }, 0);
  const winningPoint = winner.item.points[pointIndex];
  const alsoModels = series
    .filter((item) => item.modelKey !== winner.item.modelKey)
    .filter((item) => item.points.some((point) => pointDistance(point, winningPoint.x, winningPoint.y) <= 1.5))
    .map((item) => item.modelKey);

  return { modelKey: winner.item.modelKey, pointIndex, alsoModels, distance: winner.distance };
}
