
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Card, CardRank, GameState, Player, GameAction as GameActionType } from '@/types/game';
import { initializeGameState, advanceTurn, checkWinCondition, getRandomCards, getRandomCardRank } from '@/lib/gameUtils';
import { useToast } from '@/hooks/use-toast';

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
      
      if (playerId === state.players[state.currentPlayerIndex].id || state.playedCards.length === 0) {
        return state;
      }
      
      const newGameAction: GameActionType = {
        player: playerId,
        action: 'pass',
        timestamp: Date.now()
      };
      
      // Check if all other players have passed
      const allOthersHavePassed = state.players
        .filter((p, i) => i !== state.currentPlayerIndex)
        .every(p => {
          // This player is currently passing, so count them
          if (p.id === playerId) return true;
          
          // Check if this player already passed in the current round
          return state.actionHistory
            .filter(a => a.action === 'pass')
            .some(a => a.player === p.id);
        });
      
      // If all others have passed, advance to next round with empty pile
      if (allOthersHavePassed) {
        return advanceTurn({
          ...state,
          playedCards: [],
          claimedRank: null,
          claimedCount: 0,
          lastAction: newGameAction,
          actionHistory: [...state.actionHistory, newGameAction]
        });
      }
      
      // Otherwise just record the pass action
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
        .slice(-state.claimedCount)
        .every(card => card.rank === state.claimedRank);
      
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

  // This effect triggers computer player turns
  useEffect(() => {
    if (!state.gameStarted || state.gameEnded) return;
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isComputer) {
      // Add a delay to make it seem like the computer is thinking
      const timer = setTimeout(() => {
        handleComputerTurn(currentPlayer);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayerIndex, state.gameStarted, state.gameEnded]);
  
  const handleComputerTurn = (computerPlayer: Player) => {
    console.log("Computer turn triggered:", computerPlayer.name);
    
    // If computer has no cards, skip turn (this shouldn't happen but just in case)
    if (computerPlayer.cards.length === 0) {
      console.error("Computer has no cards to play!");
      return;
    }
    
    // Computer is making an initial play or playing its turn
    if (state.playedCards.length === 0 || state.claimedRank === null || state.currentPlayerIndex === state.players.findIndex(p => p.id === computerPlayer.id)) {
      const cardsByRank: Record<CardRank, Card[]> = {} as Record<CardRank, Card[]>;
      
      // Group cards by rank
      computerPlayer.cards.forEach(card => {
        if (!cardsByRank[card.rank]) {
          cardsByRank[card.rank] = [];
        }
        cardsByRank[card.rank].push(card);
      });
      
      // Find rank with most cards
      let bestRank: CardRank | null = null;
      let maxCount = 0;
      
      Object.entries(cardsByRank).forEach(([rank, cards]) => {
        if (cards.length > maxCount) {
          maxCount = cards.length;
          bestRank = rank as CardRank;
        }
      });
      
      let cardsToPlay: Card[] = [];
      let claimRank: CardRank;
      
      // Strategy: Play honestly if we have multiple cards of same rank
      if (bestRank && maxCount >= 2 && Math.random() < 0.7) {
        const numToPlay = Math.min(3, maxCount);
        cardsToPlay = cardsByRank[bestRank].slice(0, numToPlay);
        claimRank = bestRank;
        console.log(`Computer playing honestly: ${numToPlay} ${bestRank}s`);
      } 
      // Otherwise bluff or semi-bluff
      else {
        const numCardsToPlay = Math.min(Math.floor(Math.random() * 3) + 1, computerPlayer.cards.length);
        cardsToPlay = getRandomCards(computerPlayer.cards, numCardsToPlay);
        
        // Semi-honest (claim same as one of the cards)
        if (Math.random() < 0.4 && cardsToPlay.length > 0) {
          claimRank = cardsToPlay[0].rank;
          console.log(`Computer semi-honest: claiming ${cardsToPlay.length} ${claimRank}s`);
        } 
        // Complete bluff
        else {
          claimRank = getRandomCardRank();
          console.log(`Computer bluffing: claiming ${cardsToPlay.length} ${claimRank}s`);
        }
      }
      
      if (cardsToPlay.length > 0) {
        console.log(`Computer ${computerPlayer.name} playing ${cardsToPlay.length} cards claiming ${claimRank}`);
        playCards(cardsToPlay, claimRank, computerPlayer.id);
        
        toast({
          title: `${computerPlayer.name} played ${cardsToPlay.length} card(s)`,
          description: `${computerPlayer.name} claims to have played ${cardsToPlay.length} ${claimRank}${cardsToPlay.length !== 1 ? 's' : ''}`,
        });
      }
    } 
    // Computer must decide to challenge or pass on another player's claim
    else {
      // More cards claimed = higher chance of challenging
      const challengeThreshold = Math.min(0.3 + (state.claimedCount * 0.1), 0.7);
      
      if (Math.random() < challengeThreshold) {
        challengeClaim(computerPlayer.id);
        toast({
          title: `${computerPlayer.name} challenged!`,
          description: `${computerPlayer.name} doesn't believe the last claim`,
        });
      } else {
        passTurn(computerPlayer.id);
        toast({
          title: `${computerPlayer.name} passed`,
          description: `${computerPlayer.name} decided not to challenge`,
        });
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
