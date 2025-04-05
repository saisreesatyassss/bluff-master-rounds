
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
  
  // For computer players, we need to make sure they play automatically
  return state.gameStarted 
    ? <GameBoard isMultiplayer={isMultiplayer} /> 
    : <Lobby />;
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
