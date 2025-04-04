
import { Card, CardRank, CardSuit, GameState, Player } from '@/types/game';

export function createDeck(): Card[] {
  const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        id: `${rank}-${suit}`
      });
    }
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function dealCards(players: Player[]): Player[] {
  const deck = createDeck();
  const cardCount = Math.floor(deck.length / players.length);
  
  return players.map((player, index) => {
    const startIdx = index * cardCount;
    const endIdx = index === players.length - 1 
      ? deck.length 
      : startIdx + cardCount;
    
    return {
      ...player,
      cards: deck.slice(startIdx, endIdx)
    };
  });
}

export function initializeGameState(players: Player[]): GameState {
  const playersWithCards = dealCards(players.map(p => ({
    ...p,
    isCurrentTurn: false,
    cards: []
  })));

  // Set first player's turn
  playersWithCards[0].isCurrentTurn = true;

  return {
    players: playersWithCards,
    currentPlayerIndex: 0,
    playedCards: [],
    claimedRank: null,
    claimedCount: 0,
    lastAction: null,
    actionHistory: [],
    gameStarted: true,
    gameEnded: false,
    winner: null
  };
}

export function checkWinCondition(gameState: GameState): GameState {
  const winner = gameState.players.find(p => p.cards.length === 0);
  if (winner) {
    return {
      ...gameState,
      gameEnded: true,
      winner: winner.id
    };
  }
  return gameState;
}

export function getNextPlayerIndex(currentIndex: number, totalPlayers: number): number {
  return (currentIndex + 1) % totalPlayers;
}

export function advanceTurn(gameState: GameState): GameState {
  const nextPlayerIndex = getNextPlayerIndex(
    gameState.currentPlayerIndex,
    gameState.players.length
  );
  
  const updatedPlayers = gameState.players.map((player, index) => ({
    ...player,
    isCurrentTurn: index === nextPlayerIndex
  }));

  return {
    ...gameState,
    currentPlayerIndex: nextPlayerIndex,
    players: updatedPlayers
  };
}
