import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Card, CardRank, GameState, Player, GameAction } from '@/types/game';
import { initializeGameState, advanceTurn, checkWinCondition } from '@/lib/gameUtils';
import { useToast } from '@/components/ui/use-toast';

type GameContextType = {
  state: GameState;
  addPlayer: (name: string) => void;
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
  winner: null
};

type GameActionReducer = 
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'START_GAME' }
  | { type: 'PLAY_CARDS'; payload: { cards: Card[]; claimedRank: CardRank; playerId: string } }
  | { type: 'PASS_TURN'; payload: { playerId: string } }
  | { type: 'CHALLENGE_CLAIM'; payload: { challengerId: string } }
  | { type: 'RESET_GAME' }
  | { type: 'SET_STATE'; payload: GameState };

const GameContext = createContext<GameContextType | undefined>(undefined);

function gameReducer(state: GameState, action: GameActionReducer): GameState {
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
        isCurrentTurn: false
      };
      
      return {
        ...state,
        players: [...state.players, newPlayer]
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
      
      const newAction: GameAction = {
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
        lastAction: newAction,
        actionHistory: [...state.actionHistory, newAction]
      };
      
      return checkWinCondition(newState);
    }
    
    case 'PASS_TURN': {
      const { playerId } = action.payload;
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      
      if (playerIndex === state.currentPlayerIndex || state.playedCards.length === 0) {
        return state;
      }
      
      const newAction: GameAction = {
        player: playerId,
        action: 'pass',
        timestamp: Date.now()
      };
      
      const allPassed = state.players
        .filter((p, i) => i !== state.currentPlayerIndex)
        .every(p => {
          const playerPassed = state.actionHistory
            .filter(a => a.action === 'pass')
            .some(a => a.player === p.id);
          return playerPassed;
        });
      
      if (allPassed) {
        return advanceTurn({
          ...state,
          playedCards: [],
          claimedRank: null,
          claimedCount: 0,
          lastAction: newAction,
          actionHistory: [...state.actionHistory, newAction]
        });
      }
      
      return {
        ...state,
        lastAction: newAction,
        actionHistory: [...state.actionHistory, newAction]
      };
    }
    
    case 'CHALLENGE_CLAIM': {
      const { challengerId } = action.payload;
      if (state.playedCards.length === 0 || !state.claimedRank) {
        return state;
      }
      
      const newAction: GameAction = {
        player: challengerId,
        action: 'challenge',
        timestamp: Date.now()
      };
      
      const wasHonest = state.playedCards.every(card => card.rank === state.claimedRank);
      
      let updatedPlayers = [...state.players];
      const challengerIndex = updatedPlayers.findIndex(p => p.id === challengerId);
      const currentPlayerIndex = state.currentPlayerIndex;
      
      if (wasHonest) {
        const challenger = { ...updatedPlayers[challengerIndex] };
        challenger.cards = [...challenger.cards, ...state.playedCards];
        updatedPlayers[challengerIndex] = challenger;
      } else {
        const currentPlayer = { ...updatedPlayers[currentPlayerIndex] };
        currentPlayer.cards = [...currentPlayer.cards, ...state.playedCards];
        updatedPlayers[currentPlayerIndex] = currentPlayer;
      }
      
      let nextIndex = currentPlayerIndex;
      if (!wasHonest) {
        nextIndex = challengerIndex;
      } else {
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
        lastAction: newAction,
        actionHistory: [...state.actionHistory, newAction]
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
        }))
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
