import { LevelData, EntityType } from './types';

// Physics
export const GRAVITY = 0.6;
export const FRICTION = 0.8;
export const MOVE_SPEED = 5;
export const JUMP_FORCE = -14;
export const BOUNCE_FORCE = -8; // Bouncing off enemies
export const TERMINAL_VELOCITY = 15;

// Dimensions (Logical pixels)
export const TILE_SIZE = 40;
export const SCREEN_HEIGHT = 600;

// Colors
export const COLORS = {
  sky: '#38bdf8', // day
  skyNight: '#0f172a', // night
  ground: '#16a34a',
  groundDark: '#1e293b',
  platform: '#854d0e',
  platformDark: '#334155',
  mario: '#ef4444',
  goomba: '#92400e',
  coin: '#eab308',
  flagPole: '#cbd5e1',
  flag: '#ef4444'
};

// Default Level
export const DEFAULT_LEVEL: LevelData = {
  id: 'default_1',
  name: "Classic Start",
  theme: 'day',
  width: 2000,
  startPos: { x: 50, y: 400 },
  platforms: [
    // Floor
    { x: 0, y: 500, width: 2200, height: 100, type: EntityType.PLATFORM },
    // Platforms
    { x: 300, y: 380, width: 120, height: 40, type: EntityType.PLATFORM },
    { x: 500, y: 280, width: 120, height: 40, type: EntityType.PLATFORM },
    { x: 700, y: 350, width: 40, height: 40, type: EntityType.PLATFORM },
    { x: 740, y: 350, width: 40, height: 40, type: EntityType.PLATFORM },
    { x: 900, y: 200, width: 200, height: 40, type: EntityType.PLATFORM },
    { x: 1300, y: 400, width: 120, height: 100, type: EntityType.PLATFORM }, // Wall
  ],
  enemies: [
    { x: 500, y: 460, width: 40, height: 40, type: EntityType.ENEMY, vx: 2, range: 200, originX: 500 },
    { x: 950, y: 160, width: 40, height: 40, type: EntityType.ENEMY, vx: 2, range: 100, originX: 950 }
  ],
  coins: [
    { x: 340, y: 330, width: 30, height: 30, type: EntityType.COIN },
    { x: 540, y: 230, width: 30, height: 30, type: EntityType.COIN },
    { x: 920, y: 150, width: 30, height: 30, type: EntityType.COIN },
    { x: 960, y: 150, width: 30, height: 30, type: EntityType.COIN },
    { x: 1000, y: 150, width: 30, height: 30, type: EntityType.COIN }
  ],
  goal: { x: 1800, y: 200, width: 20, height: 300, type: EntityType.GOAL }
};
