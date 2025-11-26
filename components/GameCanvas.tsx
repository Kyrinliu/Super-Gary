import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LevelData, Player, EntityType, GameStatus } from '../types';
import { 
  GRAVITY, FRICTION, MOVE_SPEED, JUMP_FORCE, TERMINAL_VELOCITY, 
  TILE_SIZE, COLORS, BOUNCE_FORCE, SCREEN_HEIGHT 
} from '../constants';
import { Play, RotateCcw, ArrowRight, ArrowLeft, ArrowUp } from 'lucide-react';

interface GameCanvasProps {
  level: LevelData;
  onGameOver: (score: number, status: 'win' | 'lose') => void;
  onExit: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ level, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  // Game State Refs (Mutable for performance in game loop)
  const gameStateRef = useRef({
    player: { ...level.startPos, width: 30, height: 40, vx: 0, vy: 0, isGrounded: false, facingRight: true, isDead: false, won: false } as Player,
    enemies: JSON.parse(JSON.stringify(level.enemies)), // Deep copy
    coins: JSON.parse(JSON.stringify(level.coins)),
    camera: { x: 0 },
    keys: { left: false, right: false, up: false },
    isRunning: true
  });

  // Collision Detection Logic (AABB)
  const checkCollision = (r1: any, r2: any) => {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  };

  const updatePhysics = () => {
    const state = gameStateRef.current;
    const { player } = state;

    // 1. Horizontal Movement
    if (state.keys.right) {
      player.vx += 1;
      player.facingRight = true;
    } else if (state.keys.left) {
      player.vx -= 1;
      player.facingRight = false;
    } else {
      player.vx *= FRICTION;
    }

    // Clamp speed
    if (player.vx > MOVE_SPEED) player.vx = MOVE_SPEED;
    if (player.vx < -MOVE_SPEED) player.vx = -MOVE_SPEED;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;

    // Apply Horizontal Velocity
    player.x += player.vx;

    // Wall Collisions
    for (const plat of level.platforms) {
      if (checkCollision(player, plat)) {
        if (player.vx > 0) player.x = plat.x - player.width;
        else if (player.vx < 0) player.x = plat.x + plat.width;
        player.vx = 0;
      }
    }

    // Level Boundaries
    if (player.x < 0) player.x = 0;
    
    // 2. Vertical Movement
    player.vy += GRAVITY;
    if (player.vy > TERMINAL_VELOCITY) player.vy = TERMINAL_VELOCITY;
    
    // Jumping
    if (state.keys.up && player.isGrounded) {
      player.vy = JUMP_FORCE;
      player.isGrounded = false;
      state.keys.up = false; // Prevent hold-to-fly
    }

    // Apply Vertical Velocity
    player.y += player.vy;
    player.isGrounded = false;

    // Floor/Ceiling Collisions
    for (const plat of level.platforms) {
      if (checkCollision(player, plat)) {
        if (player.vy > 0) { // Falling
          player.y = plat.y - player.height;
          player.isGrounded = true;
          player.vy = 0;
        } else if (player.vy < 0) { // Hitting head
          player.y = plat.y + plat.height;
          player.vy = 0;
        }
      }
    }

    // Pit death
    if (player.y > SCREEN_HEIGHT + 100) {
      handleDeath();
    }

    // 3. Enemy Interaction
    state.enemies.forEach((enemy: any) => {
      if (enemy.isDead) return;

      // Enemy Patrol Logic
      enemy.x += enemy.vx;
      if (enemy.x > enemy.originX + enemy.range || enemy.x < enemy.originX - enemy.range) {
        enemy.vx *= -1;
      }

      // Player-Enemy Collision
      if (checkCollision(player, enemy)) {
        // Mario Logic: If falling onto enemy, kill enemy
        const hitFromAbove = player.vy > 0 && (player.y + player.height - player.vy) <= enemy.y;
        
        if (hitFromAbove) {
          enemy.isDead = true;
          player.vy = BOUNCE_FORCE; // Bounce
          setScore(s => s + 100);
        } else {
          handleDeath();
        }
      }
    });

    // 4. Coin Collection
    state.coins.forEach((coin: any) => {
      if (!coin.collected && checkCollision(player, coin)) {
        coin.collected = true;
        setScore(s => s + 50);
      }
    });

    // 5. Goal Reach
    if (player.x > level.goal.x && !player.won) {
      player.won = true;
      state.isRunning = false;
      onGameOver(score + 1000, 'win');
    }

    // Camera follow logic
    const targetCamX = player.x - window.innerWidth / 2 + player.width / 2;
    state.camera.x += (targetCamX - state.camera.x) * 0.1; // Smooth lerp
    if (state.camera.x < 0) state.camera.x = 0;
    if (state.camera.x > level.width - window.innerWidth) state.camera.x = level.width - window.innerWidth;
  };

  const handleDeath = () => {
    const state = gameStateRef.current;
    if (state.player.isDead) return;
    
    state.player.isDead = true;
    setLives(l => {
      const newLives = l - 1;
      if (newLives <= 0) {
        state.isRunning = false;
        onGameOver(score, 'lose');
      } else {
        // Respawn logic
        setTimeout(() => {
          state.player.x = level.startPos.x;
          state.player.y = level.startPos.y;
          state.player.vx = 0;
          state.player.vy = 0;
          state.player.isDead = false;
          state.camera.x = 0;
        }, 500);
      }
      return newLives;
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const { width, height } = ctx.canvas;
    const { camera } = state;

    // Clear Screen
    const bg = level.theme === 'night' ? COLORS.skyNight : COLORS.sky;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-camera.x, 0);

    // Draw Platforms
    ctx.fillStyle = level.theme === 'night' ? COLORS.platformDark : COLORS.platform;
    for (const plat of level.platforms) {
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      // Grass top
      ctx.fillStyle = level.theme === 'night' ? COLORS.groundDark : COLORS.ground;
      ctx.fillRect(plat.x, plat.y, plat.width, 10);
      ctx.fillStyle = level.theme === 'night' ? COLORS.platformDark : COLORS.platform;
    }

    // Draw Goal
    ctx.fillStyle = COLORS.flagPole;
    ctx.fillRect(level.goal.x, level.goal.y, 10, level.goal.height);
    ctx.fillStyle = COLORS.flag;
    ctx.beginPath();
    ctx.moveTo(level.goal.x + 10, level.goal.y + 20);
    ctx.lineTo(level.goal.x + 60, level.goal.y + 40);
    ctx.lineTo(level.goal.x + 10, level.goal.y + 60);
    ctx.fill();

    // Draw Coins
    ctx.fillStyle = COLORS.coin;
    for (const coin of state.coins) {
      if (coin.collected) continue;
      ctx.beginPath();
      ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
      ctx.fill();
      // Shine
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(coin.x + coin.width/2 - 5, coin.y + coin.height/2 - 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.coin;
    }

    // Draw Enemies
    for (const enemy of state.enemies) {
      if (enemy.isDead) continue;
      ctx.fillStyle = COLORS.goomba;
      const squish = 0; // Animation frame placeholder
      ctx.fillRect(enemy.x, enemy.y + squish, enemy.width, enemy.height - squish);
      
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(enemy.x + 5, enemy.y + 10, 8, 8);
      ctx.fillRect(enemy.x + 25, enemy.y + 10, 8, 8);
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.x + 7, enemy.y + 12, 4, 4);
      ctx.fillRect(enemy.x + 27, enemy.y + 12, 4, 4);
    }

    // Draw Player
    if (!state.player.isDead) {
      ctx.fillStyle = COLORS.mario;
      ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
      
      // Face (Simple)
      ctx.fillStyle = '#ffe4c4'; // Skin tone
      const faceOffset = state.player.facingRight ? 18 : 2;
      ctx.fillRect(state.player.x + faceOffset, state.player.y + 5, 10, 15);
      
      // Cap
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(state.player.x, state.player.y, state.player.width, 10);
      ctx.fillRect(state.player.facingRight ? state.player.x + 10 : state.player.x - 5, state.player.y + 5, 25, 5);
    }

    ctx.restore();
  };

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resize
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = SCREEN_HEIGHT;
    };
    window.addEventListener('resize', resize);
    resize();

    let animationFrameId: number;

    const render = () => {
      if (gameStateRef.current.isRunning) {
        updatePhysics();
        draw(ctx);
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]); // Re-init on level change

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'ArrowLeft': case 'KeyA': gameStateRef.current.keys.left = true; break;
        case 'ArrowRight': case 'KeyD': gameStateRef.current.keys.right = true; break;
        case 'ArrowUp': case 'KeyW': case 'Space': gameStateRef.current.keys.up = true; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'ArrowLeft': case 'KeyA': gameStateRef.current.keys.left = false; break;
        case 'ArrowRight': case 'KeyD': gameStateRef.current.keys.right = false; break;
        case 'ArrowUp': case 'KeyW': case 'Space': gameStateRef.current.keys.up = false; break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mobile Controls
  const handleTouchStart = (key: 'left' | 'right' | 'up') => {
    gameStateRef.current.keys[key] = true;
  };
  const handleTouchEnd = (key: 'left' | 'right' | 'up') => {
    gameStateRef.current.keys[key] = false;
  };

  return (
    <div className="relative w-full h-[600px] bg-black overflow-hidden shadow-2xl border-y-4 border-slate-700">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 flex gap-6 text-white pixel-font text-shadow text-xl z-10">
        <div>SCORE <br/><span className="text-yellow-400">{score.toString().padStart(6, '0')}</span></div>
        <div>LIVES <br/><span className="text-red-500">x {lives}</span></div>
        <div>LEVEL <br/><span className="text-blue-400">{level.name}</span></div>
      </div>

      <button 
        onClick={onExit}
        className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded shadow-lg z-10"
      >
        <RotateCcw size={20} />
      </button>

      {/* Mobile Controls Overlay */}
      <div className="absolute bottom-6 left-6 flex gap-4 z-20 md:hidden">
        <button 
          className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:bg-white/40 touch-none"
          onTouchStart={() => handleTouchStart('left')}
          onTouchEnd={() => handleTouchEnd('left')}
        >
          <ArrowLeft size={32} />
        </button>
        <button 
          className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:bg-white/40 touch-none"
          onTouchStart={() => handleTouchStart('right')}
          onTouchEnd={() => handleTouchEnd('right')}
        >
          <ArrowRight size={32} />
        </button>
      </div>

      <div className="absolute bottom-6 right-6 z-20 md:hidden">
        <button 
          className="w-20 h-20 bg-red-500/80 rounded-full flex items-center justify-center active:bg-red-600 shadow-lg touch-none"
          onTouchStart={() => handleTouchStart('up')}
          onTouchEnd={() => handleTouchEnd('up')}
        >
          <ArrowUp size={40} />
        </button>
      </div>
    </div>
  );
};
