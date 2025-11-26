import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameStatus, LevelData } from './types';
import { DEFAULT_LEVEL } from './constants';
import { generateLevel } from './services/geminiService';
import { Gamepad2, Loader2, Trophy, Skull } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [currentLevel, setCurrentLevel] = useState<LevelData>(DEFAULT_LEVEL);
  const [finalScore, setFinalScore] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);

  const startGame = () => {
    setStatus(GameStatus.PLAYING);
  };

  const handleGenerateLevel = async (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    setStatus(GameStatus.GENERATING);
    setGenError(null);
    try {
      const themes = ['day', 'night', 'cave'];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      const newLevel = await generateLevel(difficulty, randomTheme);
      setCurrentLevel(newLevel);
      setStatus(GameStatus.PLAYING);
    } catch (e: any) {
      console.error(e);
      // Extract specific error message to help debugging (e.g., "API Key missing" or "Quota exceeded")
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setGenError(`Error: ${errorMessage}. Please check API Key configuration.`);
      setStatus(GameStatus.MENU);
    }
  };

  const handleGameOver = (score: number, result: 'win' | 'lose') => {
    setFinalScore(score);
    setStatus(result === 'win' ? GameStatus.VICTORY : GameStatus.GAME_OVER);
  };

  const returnToMenu = () => {
    setStatus(GameStatus.MENU);
    setCurrentLevel(DEFAULT_LEVEL);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-600 pixel-font tracking-tighter mb-2">
          GEMINI JUMP
        </h1>
        <p className="text-slate-400 text-sm md:text-base pixel-font">AI-POWERED PLATFORMING ACTION</p>
      </div>

      {/* Main Game Container */}
      <div className="w-full max-w-5xl bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
        
        {status === GameStatus.MENU && (
          <div className="h-[500px] flex flex-col items-center justify-center gap-8 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md px-4">
              <button 
                onClick={startGame}
                className="w-full group relative px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-[0_4px_0_rgb(21,128,61)] hover:shadow-[0_2px_0_rgb(21,128,61)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-3 pixel-font"
              >
                <Gamepad2 className="w-6 h-6" />
                PLAY CLASSIC
              </button>

              <div className="w-full h-px bg-slate-600/50 my-2"></div>

              <div className="w-full flex flex-col gap-3">
                <p className="text-center text-cyan-300 pixel-font text-xs mb-2">GENERATE AI LEVEL</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => handleGenerateLevel(diff as any)}
                      className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-[0_3px_0_rgb(55,48,163)] hover:translate-y-[1px] hover:shadow-[0_2px_0_rgb(55,48,163)] active:translate-y-[3px] active:shadow-none transition-all pixel-font"
                    >
                      {diff.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {genError && (
                <div className="text-red-400 bg-red-900/50 p-2 rounded text-xs text-center border border-red-500/50 w-full">
                  {genError}
                </div>
              )}
            </div>
          </div>
        )}

        {status === GameStatus.GENERATING && (
          <div className="h-[500px] flex flex-col items-center justify-center gap-4 bg-slate-900">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
            <h2 className="text-2xl font-bold text-white pixel-font animate-pulse">BUILDING WORLD...</h2>
            <p className="text-slate-400 text-sm">Gemini is designing platforms and placing enemies</p>
          </div>
        )}

        {status === GameStatus.PLAYING && (
          <GameCanvas 
            level={currentLevel} 
            onGameOver={handleGameOver} 
            onExit={returnToMenu}
          />
        )}

        {(status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) && (
          <div className="h-[500px] flex flex-col items-center justify-center gap-6 bg-slate-900 relative overflow-hidden">
            <div className={`absolute inset-0 opacity-10 ${status === GameStatus.VICTORY ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            
            <div className="z-10 text-center">
              {status === GameStatus.VICTORY ? (
                <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              ) : (
                <Skull className="w-24 h-24 text-red-500 mx-auto mb-4" />
              )}
              
              <h2 className={`text-4xl md:text-5xl font-bold pixel-font mb-2 ${status === GameStatus.VICTORY ? 'text-yellow-400' : 'text-red-500'}`}>
                {status === GameStatus.VICTORY ? 'COURSE CLEAR!' : 'GAME OVER'}
              </h2>
              
              <p className="text-2xl text-white pixel-font mb-8">
                SCORE: {finalScore}
              </p>

              <button 
                onClick={returnToMenu}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_4px_0_rgb(30,58,138)] hover:shadow-[0_2px_0_rgb(30,58,138)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all pixel-font"
              >
                RETURN TO MENU
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-slate-500 text-xs max-w-lg text-center">
        <p>Use Arrow Keys (Desktop) or On-screen Buttons (Mobile) to move.</p>
        <p className="mt-2">Powered by React, Canvas API & Google Gemini 2.5 Flash.</p>
      </div>
    </div>
  );
};

export default App;