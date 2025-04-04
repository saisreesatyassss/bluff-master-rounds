
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
  
  // In multiplayer mode with local play, we don't specify the selfPlayerId so that
  // the game board will show the active player's hand when it's their turn
  return state.gameStarted 
    ? <GameBoard isMultiplayer={isMultiplayer} /> 
    : <Lobby />;
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
