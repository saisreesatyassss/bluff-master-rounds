
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';
import { Users, Cpu } from 'lucide-react';

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
    <div className="flex min-h-screen items-center justify-center bg-game-bg">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6" /> Bluff Game Lobby
          </CardTitle>
          <CardDescription>
            Add players to join the game. You need at least 2 players to start.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPlayer} className="flex gap-2 mb-6">
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Player name"
              className="flex-1"
            />
            <Button type="submit">Add</Button>
          </form>
          
          <div className="flex justify-center mb-6">
            <Button 
              onClick={addComputerPlayer}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Cpu size={16} />
              Add Computer Player
            </Button>
          </div>

          <div className="space-y-1">
            <h3 className="font-medium">Players ({state.players.length}):</h3>
            {state.players.length === 0 ? (
              <p className="text-sm text-muted-foreground">No players yet</p>
            ) : (
              <ul className="border rounded-md divide-y">
                {state.players.map((player) => (
                  <li key={player.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      {player.isComputer ? (
                        <Cpu size={16} className="text-blue-500" />
                      ) : (
                        <Users size={16} />
                      )}
                      <span>{player.name}</span>
                    </div>
                    {player.isHost && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Host</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={startGame} 
            disabled={state.players.length < 2}
            className="w-full"
          >
            Start Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Lobby;
