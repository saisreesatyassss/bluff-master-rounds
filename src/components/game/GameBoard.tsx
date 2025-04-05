
import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import PlayingCard from './PlayingCard';
import PlayerDisplay from './PlayerDisplay';
import { Card as CardType, CardRank, Player } from '@/types/game';
import { AlertCircle, Trophy, Users, User, Computer } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-gold border-2 bg-gradient-to-b from-gray-900 to-gray-800">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Trophy className="h-8 w-8" /> Game Over!
            </CardTitle>
            <CardDescription className="text-center text-lg font-bold text-gray-800">
              {winner?.name} has won the game!
              {winner?.isComputer && " (Computer)"}
            </CardDescription>
          </CardHeader>
          <CardFooter className="bg-gray-900 p-6">
            <Button onClick={resetGame} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
              Play Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Game header */}
      <div className="bg-gradient-to-r from-purple-800 to-blue-700 rounded-lg shadow-xl p-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">Bluff Card Game</h1>
        <div className="text-white text-sm sm:text-base text-center">
          {isMultiplayer && (
            <div className="inline-block bg-blue-500/30 px-3 py-1 rounded-full mb-2 mx-1">
              <Users className="inline h-4 w-4 mr-1" />
              <span>Multiplayer Mode</span>
            </div>
          )}
          
          <div className="inline-block bg-purple-500/30 px-3 py-1 rounded-full mb-2 mx-1">
            <span className="font-medium">Current player: </span> 
            <span>{currentPlayer.name}</span>
            {currentPlayer.isComputer && (
              <Computer className="inline h-4 w-4 ml-1 text-blue-300" />
            )}
          </div>
          
          {state.claimedRank && (
            <div className="inline-block bg-amber-500/30 px-3 py-1 rounded-full mb-2 mx-1">
              <span className="font-medium">Current claim:</span> {state.claimedCount} {state.claimedRank}
              {state.claimedCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar - Players */}
        <div className="lg:col-span-3">
          <Card className="bg-gray-900 border-purple-600 border shadow-md">
            <CardHeader className="bg-purple-900 pb-2">
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2" /> Players
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                {state.players.map(player => (
                  <PlayerDisplay 
                    key={player.id} 
                    player={player}
                    isCurrentPlayer={player.id === currentPlayer.id}
                    isSelf={activeSelfPlayer && player.id === activeSelfPlayer.id}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Action History */}
          <Card className="bg-gray-900 border-blue-600 border shadow-md mt-4">
            <CardHeader className="bg-blue-900 pb-2">
              <CardTitle className="text-white text-sm">Recent Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-36 overflow-y-auto custom-scrollbar text-sm">
                {state.actionHistory.length === 0 ? (
                  <div className="text-gray-400 text-sm italic">No actions yet</div>
                ) : (
                  <ul className="space-y-1.5">
                    {[...state.actionHistory]
                      .reverse()
                      .slice(0, 8)
                      .map((action, i) => {
                        const player = state.players.find(p => p.id === action.player);
                        return (
                          <li key={i} className="text-sm">
                            <span className="font-medium text-blue-400">
                              {player?.name}
                              {player?.isComputer ? " (AI)" : ""}
                            </span>
                            {action.action === 'claim' 
                              ? <span className="text-amber-300"> claimed {action.claimedCount} {action.claimedRank}{action.claimedCount !== 1 ? 's' : ''}</span>
                              : action.action === 'pass' 
                                ? <span className="text-gray-300"> passed</span> 
                                : <span className="text-red-300"> challenged!</span>}
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Game rules */}
          <details className="bg-gray-900/80 p-3 rounded-lg text-white mt-4 border border-blue-800">
            <summary className="cursor-pointer font-medium flex items-center text-blue-300">
              <AlertCircle className="h-4 w-4 mr-1" /> How To Play
            </summary>
            <div className="mt-2 text-sm text-gray-300 space-y-2 pl-2 border-l-2 border-blue-600">
              <p>1. On your turn, select cards and make a claim about them (truth or bluff).</p>
              <p>2. When it's not your turn, you can pass or challenge the current player's claim.</p>
              <p>3. If you challenge and the player was bluffing, they take all cards as a penalty.</p>
              <p>4. If you challenge and the player was honest, YOU take all cards.</p>
              <p>5. First player to discard all cards wins!</p>
            </div>
          </details>
        </div>
        
        {/* Main game area */}
        <div className="lg:col-span-9">
          {/* Game table */}
          <Card className="min-h-[300px] bg-gradient-to-b from-game-table to-game-table/80 border-green-900 border-2 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://img.freepik.com/free-photo/poker-table-felt-background-green-color_47726-711.jpg')] opacity-30 bg-cover"></div>
            <CardContent className="relative p-6 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                {state.playedCards.length > 0 ? (
                  <div>
                    <h3 className="text-white font-medium mb-3">Cards in play: <span className="text-amber-300 font-bold">{state.playedCards.length}</span></h3>
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
                        <div className="ml-2 text-white bg-black/50 px-2 py-1 rounded-full">
                          +{state.playedCards.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-white text-xl italic opacity-70">No cards played yet</div>
                )}
              </div>
              
              {/* Action buttons for non-current player */}
              {humanPlayer && currentPlayer.isComputer && state.playedCards.length > 0 && (
                <div className="mt-4 bg-black/40 p-4 rounded-lg">
                  <p className="text-white mb-3 text-center">
                    <Computer className="inline h-5 w-5 mr-2 text-blue-300" />
                    <span className="font-medium">{currentPlayer.name}</span> claimed to play {state.claimedCount} {state.claimedRank}{state.claimedCount !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={handlePass}
                      variant="outline"
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-400"
                    >
                      Pass
                    </Button>
                    <Button 
                      onClick={handleChallenge}
                      variant="outline"
                      className="bg-red-600 hover:bg-red-700 text-white border-red-400"
                    >
                      Challenge!
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Human player's hand */}
          {humanPlayer && (
            <div className="mt-6">
              <Card className="bg-gray-900 border-blue-700 border">
                <CardHeader className="bg-blue-900 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-white">
                    <User className="inline h-5 w-5 mr-2" />
                    Your Hand ({humanPlayer.name})
                  </CardTitle>
                  {currentPlayer.id === humanPlayer.id && (
                    <div className="bg-game-accent text-black px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                      Your Turn!
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4">
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
                      <div className="text-gray-400 italic">No cards in hand</div>
                    )}
                  </div>
                  
                  {/* Player actions */}
                  {currentPlayer.id === humanPlayer.id && (
                    <div className="flex flex-col sm:flex-row gap-3 items-center bg-black/30 p-3 rounded-lg">
                      <div className="flex gap-2 items-center">
                        <span className="text-white">Claim as:</span>
                        <Select onValueChange={(val) => setClaimedRank(val as CardRank)} defaultValue="A">
                          <SelectTrigger className="w-20 bg-gray-800 text-white border-gray-600">
                            <SelectValue placeholder="Rank" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 text-white border-gray-600">
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
                        className="bg-game-accent text-black hover:bg-amber-400 font-medium"
                      >
                        Play Cards
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Computer thinking state */}
          {currentPlayer.isComputer && (
            <div className="mt-4 bg-black/50 p-4 rounded-lg">
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
