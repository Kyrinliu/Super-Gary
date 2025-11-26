export type Vector2 = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Rect = Vector2 & Size;

export enum EntityType {
  PLAYER = 'PLAYER',
  PLATFORM = 'PLATFORM',
  ENEMY = 'ENEMY',
  COIN = 'COIN',
  GOAL = 'GOAL',
  DECORATION = 'DECORATION'
}

export interface Platform extends Rect {
  type: EntityType.PLATFORM;
  color?: string;
}

export interface Enemy extends Rect {
  type: EntityType.ENEMY;
  vx: number;
  range: number; // How far it walks from origin
  originX: number;
  isDead?: boolean;
}

export interface Coin extends Rect {
  type: EntityType.COIN;
  collected?: boolean;
}

export interface Goal extends Rect {
  type: EntityType.GOAL;
}

export interface Player extends Rect {
  vx: number;
  vy: number;
  isGrounded: boolean;
  facingRight: boolean;
  isDead: boolean;
  won: boolean;
}

export interface LevelData {
  id: string;
  name: string;
  theme: 'day' | 'night' | 'cave';
  width: number; // Total level width
  platforms: Platform[];
  enemies: Enemy[];
  coins: Coin[];
  goal: Goal;
  startPos: Vector2;
}

export enum GameStatus {
  MENU = 'MENU',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}
