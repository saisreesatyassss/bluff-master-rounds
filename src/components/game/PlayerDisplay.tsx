
import React from 'react';
import { Player } from '@/types/game';
import { cn } from '@/lib/utils';
import PlayingCard from './PlayingCard';
import { User } from 'lucide-react';

interface PlayerDisplayProps {
  player: Player;
  isCurrentPlayer: boolean;
  isSelf: boolean;
}

const PlayerDisplay: React.FC<PlayerDisplayProps> = ({ 
  player, 
  isCurrentPlayer, 
  isSelf 
}) => {
  return (
    <div 
      className={cn(
        "flex flex-col items-center p-4 rounded-lg transition-all",
        isCurrentPlayer ? "bg-game-accent/20" : "bg-black/20",
        isSelf && "border border-blue-400"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isCurrentPlayer ? "bg-game-accent" : "bg-gray-500"
        )}>
          <User size={16} className="text-white" />
        </div>
        <div className="font-medium text-white">
          {player.name}
          {player.isHost && <span className="ml-1 text-game-accent text-xs">(Host)</span>}
        </div>
      </div>
      
      <div className="flex mb-2">
        {isSelf ? (
          <div className="flex flex-wrap gap-1 justify-center max-w-[300px]">
            {player.cards.map((card, i) => (
              <PlayingCard 
                key={card.id} 
                card={card}
                small={player.cards.length > 8}
                className="animate-card-deal"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="flex">
            {Array.from({ length: Math.min(5, player.cards.length) }).map((_, i) => (
              <PlayingCard 
                key={`back-${i}`} 
                card={{ id: `back-${i}`, suit: 'hearts', rank: '2' }} 
                faceDown 
                small
                className={cn("ml-[-12px]", i === 0 && "ml-0")}
              />
            ))}
            {player.cards.length > 5 && (
              <span className="ml-1 text-white text-xs">+{player.cards.length - 5}</span>
            )}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-300">
        {player.cards.length} card{player.cards.length !== 1 ? 's' : ''}
      </div>
      
      {isCurrentPlayer && <div className="mt-1 text-game-accent text-sm">Current Turn</div>}
    </div>
  );
};

export default PlayerDisplay;
