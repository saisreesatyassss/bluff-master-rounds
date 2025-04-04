
import { GameProvider } from '@/contexts/GameContext';
import { useGame } from '@/contexts/GameContext';
import Lobby from '@/components/game/Lobby';
import GameBoard from '@/components/game/GameBoard';

// This wrapper component accesses the game context
const GameWrapper = () => {
  const { state } = useGame();
  return state.gameStarted ? <GameBoard /> : <Lobby />;
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
