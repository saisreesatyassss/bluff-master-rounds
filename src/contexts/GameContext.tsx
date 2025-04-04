
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Card, CardRank, GameState, Player, GameAction as GameActionType } from '@/types/game';
import { initializeGameState, advanceTurn, checkWinCondition, getRandomCards, getRandomCardRank } from '@/lib/gameUtils';
import { useToast } from '@/components/ui/use-toast';

type GameContextType = {
  state: GameState;
  addPlayer: (name: string) => void;
  addComputerPlayer: () => void;
  startGame: () => void;
  playCards: (cards: Card[], claimedRank: CardRank, playerId: string) => void;
  passTurn: (playerId: string) => void;
  challengeClaim: (challengerId: string) => void;
  resetGame: () => void;
};

const initialState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  playedCards: [],
  claimedRank: null,
  claimedCount: 0,
  lastAction: null,
  actionHistory: [],
  gameStarted: false,
  gameEnded: false,
  winner: null,
  computerPlayers: []
};

// Rename to avoid conflict with type imported from game.ts
type GameReducerAction = 
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'ADD_COMPUTER_PLAYER' }
  | { type: 'START_GAME' }
  | { type: 'PLAY_CARDS'; payload: { cards: Card[]; claimedRank: CardRank; playerId: string } }
  | { type: 'PASS_TURN'; payload: { playerId: string } }
  | { type: 'CHALLENGE_CLAIM'; payload: { challengerId: string } }
  | { type: 'RESET_GAME' }
  | { type: 'SET_STATE'; payload: GameState };

const GameContext = createContext<GameContextType | undefined>(undefined);

function gameReducer(state: GameState, action: GameReducerAction): GameState {
  switch (action.type) {
    case 'ADD_PLAYER': {
      const { name } = action.payload;
      if (state.gameStarted) return state;
      
      const isFirstPlayer = state.players.length === 0;
      
      const newPlayer: Player = {
        id: `player-${Date.now()}`,
        name,
        isHost: isFirstPlayer,
        cards: [],
        isCurrentTurn: false,
        isComputer: false
      };
      
      return {
        ...state,
        players: [...state.players, newPlayer]
      };
    }
    
    case 'ADD_COMPUTER_PLAYER': {
      if (state.gameStarted) return state;
      
      const aiPlayerNum = state.players.filter(p => p.name.startsWith("Computer")).length + 1;
      const aiName = `Computer ${aiPlayerNum}`;
      
      const newComputerPlayer: Player = {
        id: `computer-${Date.now()}`,
        name: aiName,
        cards: [],
        isCurrentTurn: false,
        isComputer: true
      };
      
      return {
        ...state,
        players: [...state.players, newComputerPlayer],
        computerPlayers: [...state.computerPlayers, newComputerPlayer.id]
      };
    }

    case 'START_GAME': {
      if (state.players.length < 2) return state;
      return initializeGameState(state.players);
    }
    
    case 'PLAY_CARDS': {
      const { cards, claimedRank, playerId } = action.payload;
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      
      if (playerIndex !== state.currentPlayerIndex) return state;
      
      const updatedPlayers = [...state.players];
      const player = { ...updatedPlayers[playerIndex] };
      
      const playedCardIds = new Set(cards.map(c => c.id));
      player.cards = player.cards.filter(c => !playedCardIds.has(c.id));
      updatedPlayers[playerIndex] = player;
      
      const newGameAction: GameActionType = {
        player: playerId,
        action: 'claim',
        timestamp: Date.now(),
        claimedRank,
        claimedCount: cards.length
      };
      
      const newState = {
        ...state,
        players: updatedPlayers,
        playedCards: [...state.playedCards, ...cards],
        claimedRank,
        claimedCount: cards.length,
        lastAction: newGameAction,
        actionHistory: [...state.actionHistory, newGameAction]
      };
      
      return checkWinCondition(advanceTurn(newState));
    }
    
    case 'PASS_TURN': {
      const { playerId } = action.payload;
      
      // Check if this player is allowed to pass
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (playerId === currentPlayer.id || state.playedCards.length === 0) {
        return state;
      }
      
      const newGameAction: GameActionType = {
        player: playerId,
        action: 'pass',
        timestamp: Date.now()
      };
      
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      
      // Check if all players have passed except the current player
      const allOthersHavePassed = state.players
        .filter((p, i) => i !== state.currentPlayerIndex)
        .every(p => {
          // This player has just passed
          if (p.id === playerId) return true;
          
          // Check if this player has already passed
          return state.actionHistory
            .filter(a => a.action === 'pass' && a.player === p.id)
            .some(a => true);
        });
      
      if (allOthersHavePassed) {
        // Everyone has passed, move to the next player
        return advanceTurn({
          ...state,
          playedCards: [],
          claimedRank: null,
          claimedCount: 0,
          lastAction: newGameAction,
          actionHistory: [...state.actionHistory, newGameAction]
        });
      }
      
      return {
        ...state,
        lastAction: newGameAction,
        actionHistory: [...state.actionHistory, newGameAction]
      };
    }
    
    case 'CHALLENGE_CLAIM': {
      const { challengerId } = action.payload;
      if (state.playedCards.length === 0 || !state.claimedRank) {
        return state;
      }
      
      const newGameAction: GameActionType = {
        player: challengerId,
        action: 'challenge',
        timestamp: Date.now()
      };
      
      const wasHonest = state.playedCards
        .slice(-state.claimedCount) // Get the last N cards that were claimed
        .every(card => card.rank === state.claimedRank);
      
      let updatedPlayers = [...state.players];
      const challengerIndex = updatedPlayers.findIndex(p => p.id === challengerId);
      const currentPlayerIndex = state.currentPlayerIndex;
      
      if (wasHonest) {
        // Current player was honest, challenger takes all cards
        const challenger = { ...updatedPlayers[challengerIndex] };
        challenger.cards = [...challenger.cards, ...state.playedCards];
        updatedPlayers[challengerIndex] = challenger;
      } else {
        // Current player was bluffing, current player takes all cards
        const currentPlayer = { ...updatedPlayers[currentPlayerIndex] };
        currentPlayer.cards = [...currentPlayer.cards, ...state.playedCards];
        updatedPlayers[currentPlayerIndex] = currentPlayer;
      }
      
      // Determine who gets the next turn
      let nextIndex = currentPlayerIndex;
      if (!wasHonest) {
        // If current player was caught bluffing, challenger gets next turn
        nextIndex = challengerIndex;
      } else {
        // If current player was honest, go to next player
        nextIndex = (currentPlayerIndex + 1) % state.players.length;
      }
      
      updatedPlayers = updatedPlayers.map((player, index) => ({
        ...player,
        isCurrentTurn: index === nextIndex
      }));
      
      const newState = {
        ...state,
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
        playedCards: [],
        claimedRank: null,
        claimedCount: 0,
        lastAction: newGameAction,
        actionHistory: [...state.actionHistory, newGameAction]
      };
      
      return checkWinCondition(newState);
    }
    
    case 'RESET_GAME':
      return {
        ...initialState,
        players: state.players.map(p => ({
          ...p,
          cards: [],
          isCurrentTurn: false
        })),
        computerPlayers: state.computerPlayers
      };
    
    case 'SET_STATE':
      return action.payload;
    
    default:
      return state;
  }
}

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { toast } = useToast();

  // Computer player AI logic
  useEffect(() => {
    if (!state.gameStarted || state.gameEnded) return;
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isComputer) {
      const timer = setTimeout(() => {
        handleComputerTurn(currentPlayer);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayerIndex, state.gameStarted, state.gameEnded]);
  
  const handleComputerTurn = (computerPlayer: Player) => {
    if (state.playedCards.length === 0 || !state.claimedRank) {
      // AI's turn to play cards
      
      // Smart AI: Try to play cards of the same rank if possible
      const cardsByRank: Record<CardRank, Card[]> = {} as Record<CardRank, Card[]>;
      
      // Group cards by rank
      computerPlayer.cards.forEach(card => {
        if (!cardsByRank[card.rank]) {
          cardsByRank[card.rank] = [];
        }
        cardsByRank[card.rank].push(card);
      });
      
      // Find the rank with the most cards
      let bestRank: CardRank | null = null;
      let maxCount = 0;
      
      Object.entries(cardsByRank).forEach(([rank, cards]) => {
        if (cards.length > maxCount) {
          maxCount = cards.length;
          bestRank = rank as CardRank;
        }
      });
      
      // Decide what to play
      let cardsToPlay: Card[] = [];
      let claimRank: CardRank;
      
      if (bestRank && maxCount >= 2 && Math.random() < 0.7) {
        // Play cards of the same rank and be honest (70% chance if we have 2+ of the same rank)
        cardsToPlay = cardsByRank[bestRank].slice(0, Math.min(3, maxCount));
        claimRank = bestRank;
      } else {
        // Random play (either bluff or just play random cards)
        const numCardsToPlay = Math.min(Math.floor(Math.random() * 3) + 1, computerPlayer.cards.length);
        cardsToPlay = getRandomCards(computerPlayer.cards, numCardsToPlay);
        
        // Sometimes be honest, sometimes bluff
        if (Math.random() < 0.4 && cardsToPlay.length > 0) {
          claimRank = cardsToPlay[0].rank; // Be honest about one card
        } else {
          claimRank = getRandomCardRank(); // Bluff
        }
      }
      
      playCards(cardsToPlay, claimRank, computerPlayer.id);
      
    } else {
      // Respond to others' claims
      
      // Higher chance to challenge if the claimed count is high
      const challengeThreshold = Math.min(0.3 + (state.claimedCount * 0.1), 0.7);
      
      if (Math.random() < challengeThreshold) {
        challengeClaim(computerPlayer.id);
      } else {
        passTurn(computerPlayer.id);
      }
    }
  };

  const addPlayer = (name: string) => {
    if (state.gameStarted) {
      toast({
        title: "Game already started",
        description: "Cannot add new players once the game has started",
        variant: "destructive"
      });
      return;
    }
    dispatch({ type: 'ADD_PLAYER', payload: { name } });
  };
  
  const addComputerPlayer = () => {
    if (state.gameStarted) {
      toast({
        title: "Game already started",
        description: "Cannot add computer players once the game has started",
        variant: "destructive"
      });
      return;
    }
    dispatch({ type: 'ADD_COMPUTER_PLAYER' });
  };

  const startGame = () => {
    if (state.players.length < 2) {
      toast({
        title: "Not enough players",
        description: "You need at least 2 players to start the game",
        variant: "destructive"
      });
      return;
    }
    dispatch({ type: 'START_GAME' });
  };

  const playCards = (cards: Card[], claimedRank: CardRank, playerId: string) => {
    if (!state.gameStarted || state.gameEnded) return;
    dispatch({ type: 'PLAY_CARDS', payload: { cards, claimedRank, playerId } });
  };

  const passTurn = (playerId: string) => {
    if (!state.gameStarted || state.gameEnded) return;
    dispatch({ type: 'PASS_TURN', payload: { playerId } });
  };

  const challengeClaim = (challengerId: string) => {
    if (!state.gameStarted || state.gameEnded) return;
    dispatch({ type: 'CHALLENGE_CLAIM', payload: { challengerId } });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <GameContext.Provider 
      value={{ 
        state, 
        addPlayer, 
        addComputerPlayer,
        startGame, 
        playCards, 
        passTurn, 
        challengeClaim, 
        resetGame 
      }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
