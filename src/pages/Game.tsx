
import { GameProvider } from '@/contexts/GameContext';
import { useGame } from '@/contexts/GameContext';
import Lobby from '@/components/game/Lobby';
import GameBoard from '@/components/game/GameBoard';

// This wrapper component accesses the game context
const GameWrapper = () => {
  const { state } = useGame();
  
  // Find all human players
  const humanPlayers = state.players.filter(p => !p.isComputer);
  const isMultiplayer = humanPlayers.length > 1;
  
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute h-40 w-40 rounded-full bg-purple-500/20 blur-3xl top-20 left-20 animate-pulse"></div>
        <div className="absolute h-60 w-60 rounded-full bg-violet-600/20 blur-3xl bottom-20 right-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      <div className="relative z-10 min-h-screen">
        {state.gameStarted 
          ? <GameBoard isMultiplayer={isMultiplayer} /> 
          : <Lobby />}
      </div>
    </div>
  );
};

// This component provides the context
const Game = () => {
  return (
    <GameProvider>
      <div className="min-h-screen balatro-bg overflow-hidden">
        <GameWrapper />
      </div>
    </GameProvider>
  );
};

export default Game;
