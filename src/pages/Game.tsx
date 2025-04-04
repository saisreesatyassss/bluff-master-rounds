
import { GameProvider } from '@/contexts/GameContext';
import { useGame } from '@/contexts/GameContext';
import Lobby from '@/components/game/Lobby';
import GameBoard from '@/components/game/GameBoard';

// This wrapper component accesses the game context
const GameWrapper = () => {
  const { state } = useGame();
  
  // Select the first human player as "you"
  const humanPlayerId = state.players.find(p => !p.isComputer)?.id;
  const isMultiplayer = state.players.filter(p => !p.isComputer).length > 1;
  
  return state.gameStarted ? <GameBoard selfPlayerId={humanPlayerId} isMultiplayer={isMultiplayer} /> : <Lobby />;
};

// This component provides the context
const Game = () => {
  return (
    <GameProvider>
      <GameWrapper />
    </GameProvider>
  );
};

export default Game;
