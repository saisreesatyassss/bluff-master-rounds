
export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: CardSuit;
  rank: CardRank;
  id: string; // Unique identifier for each card
}

export type Player = {
  id: string;
  name: string;
  isHost?: boolean;
  cards: Card[];
  isCurrentTurn: boolean;
  isComputer?: boolean;
};

export type GameAction = {
  player: string;
  action: 'claim' | 'pass' | 'challenge';
  timestamp: number;
  claimedRank?: CardRank;
  claimedCount?: number;
};

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  playedCards: Card[];
  claimedRank: CardRank | null;
  claimedCount: number;
  lastAction: GameAction | null;
  actionHistory: GameAction[];
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  computerPlayers: string[];
}
