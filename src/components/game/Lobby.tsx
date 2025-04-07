
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';
import { Users, Cpu, Sparkles } from 'lucide-react';

const Lobby = () => {
  const [playerName, setPlayerName] = useState('');
  const { state, addPlayer, addComputerPlayer, startGame } = useGame();
  
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      addPlayer(playerName.trim());
      setPlayerName('');
    }
  };

  const isHost = state.players.some(p => p.isHost);

  return (
    <div className="flex min-h-screen items-center justify-center balatro-bg p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute h-40 w-40 rounded-full bg-purple-700/20 blur-3xl top-20 left-20 animate-float"></div>
        <div className="absolute h-60 w-60 rounded-full bg-violet-700/20 blur-3xl bottom-20 right-20 animate-float" style={{animationDelay: '1s'}}></div>
      </div>
      
      <Card className="w-full max-w-md balatro-panel border-purple-500/30 shadow-2xl">
        <CardHeader className="border-b border-purple-600/30 bg-gradient-to-r from-purple-900/50 to-violet-900/50">
          <CardTitle className="text-3xl font-bold flex items-center gap-2 text-white">
            <div className="relative">
              <Sparkles className="h-8 w-8 text-purple-300" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-500 animate-pulse-glow"></span>
            </div>
            <span className="balatro-gold">Bluff</span>
          </CardTitle>
          <CardDescription className="text-purple-300 text-lg">
            Add players to join the game. You need at least 2 players to start.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 bg-gradient-to-b from-purple-900/10 to-purple-900/20">
          <form onSubmit={handleAddPlayer} className="flex gap-2 mb-6">
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Player name"
              className="flex-1 bg-purple-950/50 border-purple-500/30 text-purple-100 placeholder:text-purple-400"
            />
            <Button type="submit" className="balatro-button">Add</Button>
          </form>
          
          <div className="flex justify-center mb-6">
            <Button 
              onClick={addComputerPlayer}
              variant="outline"
              className="flex items-center gap-2 border-purple-500/50 text-purple-300 hover:bg-purple-800/30 hover:text-purple-200"
            >
              <Cpu size={16} />
              Add Computer Player
            </Button>
          </div>

          <div className="space-y-3 bg-purple-900/20 p-3 rounded-lg border border-purple-500/20">
            <h3 className="font-medium text-purple-200 flex items-center gap-2">
              <Users size={18} className="text-purple-400" />
              Players ({state.players.length}):
            </h3>
            {state.players.length === 0 ? (
              <p className="text-sm text-purple-400">No players yet</p>
            ) : (
              <ul className="space-y-2">
                {state.players.map((player) => (
                  <li key={player.id} className="flex items-center justify-between p-2 bg-purple-800/30 rounded-md border border-purple-600/20">
                    <div className="flex items-center gap-2">
                      {player.isComputer ? (
                        <Cpu size={16} className="text-blue-400" />
                      ) : (
                        <Users size={16} className="text-purple-300" />
                      )}
                      <span className="text-purple-100">{player.name}</span>
                    </div>
                    {player.isHost && (
                      <span className="text-xs bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 rounded-full text-black font-medium">
                        Host
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-gradient-to-t from-purple-900/40 to-purple-900/10 border-t border-purple-600/20">
          <Button 
            onClick={startGame} 
            disabled={state.players.length < 2}
            className="w-full balatro-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Lobby;
