import type { Direction } from './types';

export function movePlayer(
  x: number, y: number, desired: Direction, current: Direction,
  speed: number, dt: number, size: number, offsetY: number,
  canStand: (col: number, row: number) => boolean,
): { x: number; y: number; direction: Direction; moving: boolean } {
  const startX = x, startY = y, half = size / 2, epsilon = .001;
  if (desired === 'none') return { x, y, direction: current, moving: false };
  const horizontal = (direction: Direction) => direction === 'left' || direction === 'right';
  const vector = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  let budget = speed * Math.min(Math.max(dt, 0), .05);
  for (let step = 0; step < 12 && budget > epsilon; step++) {
    const col = Math.round((x - half) / size), row = Math.round((y - offsetY - half) / size);
    const cx = col * size + half, cy = row * size + half + offsetY;
    const dx = x - cx, dy = y - cy, next = vector[desired];
    const centered = Math.abs(dx) < epsilon && Math.abs(dy) < epsilon;
    const canTurn = canStand(col + next[0], row + next[1]);
    if (centered) {
      if (!canTurn) break;
      current = desired;
    } else if (current !== 'none' && horizontal(current) !== horizontal(desired)) {
      if (Math.abs(dx) <= 8 && Math.abs(dy) <= 8 && canTurn) {
        x = cx; y = cy; current = desired;
      }
    } else current = desired;
    const [vx, vy] = vector[current];
    const axis = vx ? x : y, center = vx ? cx : cy, sign = vx || vy;
    const target = sign > 0 ? (axis < center - epsilon ? center : center + size) : (axis > center + epsilon ? center : center - size);
    const amount = Math.min(budget, Math.abs(target - axis));
    x += vx * amount; y += vy * amount; budget -= amount;
  }
  return { x, y, direction: current, moving: Math.hypot(x - startX, y - startY) > epsilon };
}
