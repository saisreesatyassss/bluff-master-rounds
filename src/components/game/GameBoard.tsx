
import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import PlayingCard from './PlayingCard';
import PlayerDisplay from './PlayerDisplay';
import { Card as CardType, CardRank, Player } from '@/types/game';
import { AlertCircle, Trophy } from 'lucide-react';

interface GameBoardProps {
  selfPlayerId?: string | null;
  isMultiplayer: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ selfPlayerId, isMultiplayer = false }) => {
  const { state, playCards, passTurn, challengeClaim, resetGame } = useGame();
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [claimedRank, setClaimedRank] = useState<CardRank>('A');
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  // In multiplayer, we show the current player's hand
  // In single player, we show only the human player's hand
  const activeSelfPlayer = isMultiplayer 
    ? currentPlayer.isComputer ? null : currentPlayer // Only human players in multiplayer
    : state.players.find(p => !p.isComputer); // Default to first human player in single player
  
  const handleCardSelect = (card: CardType) => {
    if (!activeSelfPlayer || currentPlayer.id !== activeSelfPlayer.id) return;
    
    if (selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };
  
  const handlePlayCards = () => {
    if (!activeSelfPlayer) return;
    
    if (selectedCards.length === 0) {
      toast({
        title: "No cards selected",
        description: "Please select at least one card to play",
        variant: "destructive"
      });
      return;
    }
    
    if (!claimedRank) {
      toast({
        title: "No rank claimed",
        description: "Please select a rank to claim",
        variant: "destructive"
      });
      return;
    }
    
    playCards(selectedCards, claimedRank, activeSelfPlayer.id);
    setSelectedCards([]);
  };
  
  const handleChallenge = () => {
    if (!activeSelfPlayer) return;
    
    if (currentPlayer.id === activeSelfPlayer.id) {
      toast({
        title: "Cannot challenge yourself",
        description: "You can't challenge your own play",
        variant: "destructive"
      });
      return;
    }
    
    challengeClaim(activeSelfPlayer.id);
  };
  
  const handlePass = () => {
    if (!activeSelfPlayer) return;
    
    if (currentPlayer.id === activeSelfPlayer.id) {
      toast({
        title: "Cannot pass your turn",
        description: "You need to play cards on your turn",
        variant: "destructive"
      });
      return;
    }
    
    passTurn(activeSelfPlayer.id);
  };
  
  if (state.gameEnded) {
    const winner = state.players.find(p => p.id === state.winner);
    return (
      <div className="min-h-screen flex items-center justify-center bg-game-bg p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-game-accent" /> Game Over!
            </CardTitle>
            <CardDescription className="text-center text-lg">
              {winner?.name} has won the game!
              {winner?.isComputer && " (Computer)"}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={resetGame} className="w-full">
              Play Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-game-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* Game info */}
        <div className="bg-black/30 p-4 rounded-lg mb-4">
          <h1 className="text-2xl font-bold text-white mb-2">Bluff Game</h1>
          <div className="text-gray-200">
            {isMultiplayer && (
              <div className="bg-blue-500/20 p-2 rounded-md mb-2">
                <span className="font-medium">Multiplayer Mode:</span> Each player will see their own cards when it's their turn
              </div>
            )}
            
            {state.lastAction && (
              <div className="mb-2">
                <strong>Last action: </strong> 
                {state.players.find(p => p.id === state.lastAction?.player)?.name} 
                {state.lastAction.action === 'claim' 
                  ? ` claimed ${state.lastAction.claimedCount} ${state.lastAction.claimedRank}${state.lastAction.claimedCount !== 1 ? 's' : ''}`
                  : state.lastAction.action === 'pass' 
                    ? ' passed' 
                    : ' challenged'}
              </div>
            )}
            
            <div className="bg-game-accent/20 p-2 rounded-md">
              <span className="text-game-accent font-medium">Current player:</span> {currentPlayer.name} {currentPlayer.isComputer ? "(AI)" : ""}
              {state.claimedRank && (
                <div className="mt-1">
                  <span className="text-game-accent font-medium">Current claim:</span> {state.claimedCount} {state.claimedRank}{state.claimedCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Players and game area */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Other players */}
          <div className="lg:w-1/4">
            <h2 className="text-white text-lg font-medium mb-2">Players</h2>
            <div className="space-y-2">
              {state.players.map(player => (
                <PlayerDisplay 
                  key={player.id} 
                  player={player}
                  isCurrentPlayer={player.id === currentPlayer.id}
                  isSelf={activeSelfPlayer && player.id === activeSelfPlayer.id}
                />
              ))}
            </div>
          </div>
          
          {/* Game table */}
          <div className="lg:flex-1 bg-game-table rounded-lg p-4 flex flex-col">
            <div className="flex-grow flex items-center justify-center">
              <div className="text-center">
                {state.playedCards.length > 0 ? (
                  <div className="mb-4">
                    <h3 className="text-white font-medium mb-2">Cards in play: {state.playedCards.length}</h3>
                    <div className="flex justify-center">
                      {Array.from({ length: Math.min(5, state.playedCards.length) }).map((_, i) => (
                        <div key={`card-stack-${i}`} className="transform rotate-3 -ml-8 first:ml-0">
                          <PlayingCard
                            faceDown
                            card={{ id: `stack-${i}`, suit: 'hearts', rank: '2' }}
                          />
                        </div>
                      ))}
                      {state.playedCards.length > 5 && (
                        <span className="ml-2 text-white">+{state.playedCards.length - 5}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-white text-lg italic">No cards played yet</div>
                )}
                
                <div className="mt-4">
                  {activeSelfPlayer && currentPlayer.id !== activeSelfPlayer.id && state.playedCards.length > 0 && (
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={handlePass}
                        variant="outline"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Pass
                      </Button>
                      <Button 
                        onClick={handleChallenge}
                        variant="outline"
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Challenge!
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action history */}
            <div className="mt-4 border-t border-white/20 pt-2">
              <h3 className="text-white font-medium mb-1">Recent Actions:</h3>
              <div className="bg-black/30 rounded p-2 h-28 overflow-y-auto">
                {state.actionHistory.length === 0 ? (
                  <div className="text-gray-400 text-sm italic">No actions yet</div>
                ) : (
                  <ul className="space-y-1">
                    {[...state.actionHistory]
                      .reverse()
                      .slice(0, 6)
                      .map((action, i) => {
                        const player = state.players.find(p => p.id === action.player);
                        return (
                          <li key={i} className="text-sm text-gray-300">
                            <strong className="text-white">
                              {player?.name}
                              {player?.isComputer ? " (AI)" : ""}
                            </strong>
                            {action.action === 'claim' 
                              ? ` claimed ${action.claimedCount} ${action.claimedRank}${action.claimedCount !== 1 ? 's' : ''}`
                              : action.action === 'pass' 
                                ? ' passed' 
                                : ' challenged'}
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Player's hand and controls */}
        {activeSelfPlayer && (
          <div className="mt-4 bg-black/30 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white text-lg font-medium">Your Hand ({activeSelfPlayer.name})</h2>
              {currentPlayer.id === activeSelfPlayer.id && (
                <div className="bg-game-accent text-black px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  Your Turn!
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {activeSelfPlayer.cards.map(card => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  selected={selectedCards.some(c => c.id === card.id)}
                  onClick={() => handleCardSelect(card)}
                  small={activeSelfPlayer.cards.length > 12}
                />
              ))}
            </div>
            
            {currentPlayer.id === activeSelfPlayer.id && (
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <div className="flex gap-2 items-center">
                  <span className="text-white">Claim as:</span>
                  <Select onValueChange={(val) => setClaimedRank(val as CardRank)} defaultValue="A">
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Rank" />
                    </SelectTrigger>
                    <SelectContent>
                      {['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].map(rank => (
                        <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-white">
                    {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button 
                  onClick={handlePlayCards} 
                  disabled={selectedCards.length === 0}
                  className="bg-game-accent text-black hover:bg-amber-400"
                >
                  Play Cards
                </Button>
              </div>
            )}
          </div>
        )}
        
        {(!activeSelfPlayer || (isMultiplayer && currentPlayer.isComputer)) && (
          <div className="mt-4 bg-black/30 p-4 rounded-lg">
            <div className="text-white text-center">
              {isMultiplayer 
                ? currentPlayer.isComputer 
                  ? <span className="animate-pulse flex justify-center items-center">Computer player {currentPlayer.name} is thinking...</span>
                  : `Waiting for ${currentPlayer.name} to play...`
                : <span className="animate-pulse flex justify-center items-center">Waiting for AI players...</span>}
            </div>
          </div>
        )}
        
        {/* Game rules */}
        <div className="mt-4">
          <details className="bg-black/30 p-3 rounded-lg text-white">
            <summary className="cursor-pointer font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" /> How To Play
            </summary>
            <div className="mt-2 text-sm text-gray-300 space-y-2">
              <p>1. On your turn, select cards and make a claim about them (truth or bluff).</p>
              <p>2. When it's not your turn, you can pass or challenge the current player's claim.</p>
              <p>3. If you challenge and the player was bluffing, they take all cards as a penalty.</p>
              <p>4. If you challenge and the player was honest, YOU take all cards.</p>
              <p>5. First player to discard all cards wins!</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
