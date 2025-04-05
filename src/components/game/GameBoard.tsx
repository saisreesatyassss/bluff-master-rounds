
import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import PlayingCard from './PlayingCard';
import PlayerDisplay from './PlayerDisplay';
import { Card as CardType, CardRank, Player } from '@/types/game';
import { AlertCircle, Trophy, Users, User, Computer, Sparkles, Clock3, MessageCircle, BookText } from 'lucide-react';

interface GameBoardProps {
  selfPlayerId?: string | null;
  isMultiplayer: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ selfPlayerId, isMultiplayer = false }) => {
  const { state, playCards, passTurn, challengeClaim, resetGame } = useGame();
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [claimedRank, setClaimedRank] = useState<CardRank>('A');
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  const humanPlayer = state.players.find(p => !p.isComputer);
  
  // In single player mode, we always show the human player's hand
  // In multiplayer, we show the current player's hand if they are human
  const activeSelfPlayer = isMultiplayer 
    ? currentPlayer.isComputer ? null : currentPlayer 
    : humanPlayer;
  
  const handleCardSelect = (card: CardType) => {
    if (!activeSelfPlayer || (isMultiplayer && currentPlayer.id !== activeSelfPlayer.id)) return;
    
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
      <div className="min-h-screen flex items-center justify-center p-4 balatro-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute h-40 w-40 rounded-full bg-amber-500/20 blur-3xl top-20 left-20 animate-float"></div>
          <div className="absolute h-60 w-60 rounded-full bg-violet-600/20 blur-3xl bottom-20 right-20 animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <Card className="w-full max-w-md shadow-2xl balatro-panel border-amber-500/50">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-500 border-b border-amber-600">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl text-black">
              <Trophy className="h-8 w-8 text-amber-900" /> Game Over!
            </CardTitle>
            <CardDescription className="text-center text-lg font-bold text-amber-900">
              {winner?.name} has won the game!
              {winner?.isComputer && " (Computer)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gradient-to-b from-purple-900/30 to-violet-900/30 p-6 flex items-center justify-center">
            <div className="w-20 h-20 flex items-center justify-center">
              <div className="animate-float">
                <PlayingCard 
                  card={{ id: 'winner', suit: 'spades', rank: 'A' }}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gradient-to-t from-purple-900/50 to-purple-900/20 border-t border-purple-600/30">
            <Button onClick={resetGame} className="w-full balatro-button">
              Play Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-2 py-3 max-w-7xl min-h-screen overflow-auto">
      {/* Game header */}
      <div className="balatro-panel p-3 mb-4 shadow-lg border-purple-500/30">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200">Bluff</h1>
          </div>
          
          <div className="text-purple-200 text-sm flex flex-wrap gap-2">
            {isMultiplayer && (
              <div className="inline-block balatro-panel px-3 py-1 rounded-full">
                <Users className="inline h-4 w-4 mr-1 text-purple-300" />
                <span>Multiplayer</span>
              </div>
            )}
            
            <div className="inline-block balatro-panel px-3 py-1 rounded-full">
              <Clock3 className="inline h-4 w-4 mr-1 text-purple-300" />
              <span className="font-medium">Turn: </span> 
              <span>{currentPlayer.name}</span>
              {currentPlayer.isComputer && (
                <Computer className="inline h-4 w-4 ml-1 text-blue-300" />
              )}
            </div>
            
            {state.claimedRank && (
              <div className="inline-block balatro-panel px-3 py-1 rounded-full">
                <MessageCircle className="inline h-4 w-4 mr-1 text-purple-300" />
                <span className="font-medium">Claim:</span> {state.claimedCount} {state.claimedRank}
                {state.claimedCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left sidebar - Players */}
        <div className="lg:col-span-3 space-y-3">
          <div className="balatro-panel border-purple-500/30">
            <div className="p-2 border-b border-purple-600/30 bg-gradient-to-r from-purple-900/50 to-purple-800/50">
              <h3 className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-300" /> Players
              </h3>
            </div>
            <div className="p-2 space-y-2">
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
          
          {/* Action History */}
          <div className="balatro-panel border-purple-500/30">
            <div className="p-2 border-b border-purple-600/30 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
              <h3 className="text-white text-sm flex items-center">
                <MessageCircle className="h-4 w-4 mr-2 text-purple-300" /> Recent Actions
              </h3>
            </div>
            <div className="p-2">
              <div className="h-36 overflow-y-auto custom-scrollbar text-sm balatro-panel p-2 border border-purple-700/20">
                {state.actionHistory.length === 0 ? (
                  <div className="text-purple-400 text-sm italic">No actions yet</div>
                ) : (
                  <ul className="space-y-1.5">
                    {[...state.actionHistory]
                      .reverse()
                      .slice(0, 8)
                      .map((action, i) => {
                        const player = state.players.find(p => p.id === action.player);
                        return (
                          <li key={i} className="text-sm">
                            <span className="font-medium text-purple-200">
                              {player?.name}
                              {player?.isComputer ? " (AI)" : ""}
                            </span>
                            {action.action === 'claim' 
                              ? <span className="text-amber-300"> claimed {action.claimedCount} {action.claimedRank}{action.claimedCount !== 1 ? 's' : ''}</span>
                              : action.action === 'pass' 
                                ? <span className="text-blue-300"> passed</span> 
                                : <span className="text-red-300"> challenged!</span>}
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          {/* Game rules */}
          <details className="balatro-panel p-2 border border-purple-600/30">
            <summary className="cursor-pointer font-medium flex items-center text-purple-200 border-b border-purple-600/30 pb-2">
              <BookText className="h-4 w-4 mr-2 text-purple-300" /> How To Play
            </summary>
            <div className="mt-2 text-sm text-purple-300 space-y-2 p-2">
              <p>1. On your turn, select cards and make a claim about them (truth or bluff).</p>
              <p>2. When it's not your turn, you can pass or challenge the current player's claim.</p>
              <p>3. If you challenge and the player was bluffing, they take all cards as a penalty.</p>
              <p>4. If you challenge and the player was honest, YOU take all cards.</p>
              <p>5. First player to discard all cards wins!</p>
            </div>
          </details>
        </div>
        
        {/* Main game area */}
        <div className="lg:col-span-9 space-y-3">
          {/* Game table */}
          <div className="min-h-[300px] balatro-table rounded-xl border border-purple-600/30 shadow-lg relative overflow-hidden p-4">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center mb-8">
                {state.playedCards.length > 0 ? (
                  <div>
                    <h3 className="text-purple-200 font-medium mb-3">Cards in play: <span className="text-amber-300 font-bold">{state.playedCards.length}</span></h3>
                    <div className="flex justify-center">
                      {Array.from({ length: Math.min(5, state.playedCards.length) }).map((_, i) => (
                        <div key={`card-stack-${i}`} className="transform rotate-3 -ml-10 first:ml-0 drop-shadow-md">
                          <PlayingCard
                            faceDown
                            card={{ id: `stack-${i}`, suit: 'hearts', rank: '2' }}
                          />
                        </div>
                      ))}
                      {state.playedCards.length > 5 && (
                        <div className="ml-2 text-white bg-purple-900/70 px-2 py-1 rounded-full">
                          +{state.playedCards.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-purple-300 text-xl italic opacity-70">No cards played yet</div>
                )}
              </div>
              
              {/* Action buttons for non-current player */}
              {humanPlayer && currentPlayer.isComputer && state.playedCards.length > 0 && (
                <div className="mt-4 balatro-panel p-4 border border-purple-600/20">
                  <p className="text-purple-200 mb-3 text-center">
                    <Computer className="inline h-5 w-5 mr-2 text-blue-300" />
                    <span className="font-medium">{currentPlayer.name}</span> claimed to play {state.claimedCount} {state.claimedRank}{state.claimedCount !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={handlePass}
                      variant="outline"
                      className="bg-blue-600/80 hover:bg-blue-700 text-white border-blue-400"
                    >
                      Pass
                    </Button>
                    <Button 
                      onClick={handleChallenge}
                      variant="outline"
                      className="bg-red-600/80 hover:bg-red-700 text-white border-red-400"
                    >
                      Challenge!
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Human player's hand */}
          {humanPlayer && (
            <div className="balatro-panel border border-purple-600/30">
              <div className="p-3 border-b border-purple-600/30 bg-gradient-to-r from-purple-900/50 to-violet-900/50 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-white flex items-center">
                  <User className="inline h-5 w-5 mr-2 text-purple-300" />
                  Your Hand ({humanPlayer.name})
                </h3>
                {currentPlayer.id === humanPlayer.id && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-black px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                    Your Turn!
                  </div>
                )}
              </div>
              <div className="p-3 bg-purple-950/20">
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {humanPlayer.cards.map(card => (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      selected={selectedCards.some(c => c.id === card.id)}
                      onClick={() => handleCardSelect(card)}
                      small={humanPlayer.cards.length > 10}
                    />
                  ))}
                  {humanPlayer.cards.length === 0 && (
                    <div className="text-purple-400 italic p-4">No cards in hand</div>
                  )}
                </div>
                
                {/* Player actions */}
                {currentPlayer.id === humanPlayer.id && (
                  <div className="flex flex-col sm:flex-row gap-3 items-center balatro-panel p-3 border border-purple-600/20">
                    <div className="flex gap-2 items-center">
                      <span className="text-purple-200">Claim as:</span>
                      <Select onValueChange={(val) => setClaimedRank(val as CardRank)} defaultValue="A">
                        <SelectTrigger className="w-20 bg-purple-900/70 text-white border-purple-600/50">
                          <SelectValue placeholder="Rank" />
                        </SelectTrigger>
                        <SelectContent className="bg-purple-900 text-white border-purple-600/50">
                          {['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].map(rank => (
                            <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-purple-200">
                        {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Button 
                      onClick={handlePlayCards} 
                      disabled={selectedCards.length === 0}
                      className="balatro-button disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Play Cards
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Computer thinking state */}
          {currentPlayer.isComputer && (
            <div className="balatro-panel p-3 border border-purple-600/20">
              <div className="text-center">
                <span className="flex justify-center items-center text-blue-300 animate-pulse">
                  <Computer className="h-5 w-5 mr-2" />
                  Computer player {currentPlayer.name} is thinking...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
