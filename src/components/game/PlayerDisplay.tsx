
import React from 'react';
import { Player } from '@/types/game';
import { cn } from '@/lib/utils';
import PlayingCard from './PlayingCard';
import { User, Cpu, Crown } from 'lucide-react';

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
        "flex flex-col items-center rounded-lg transition-all balatro-panel",
        isCurrentPlayer ? "animate-pulse-glow" : "",
        isSelf && "border-purple-500/50"
      )}
    >
      <div className="w-full flex items-center gap-2 p-2 border-b border-purple-600/30 bg-gradient-to-r from-purple-900/50 to-purple-800/50">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isCurrentPlayer ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-purple-600 to-purple-800"
        )}>
          {player.isComputer ? (
            <Cpu size={16} className="text-white" />
          ) : (
            <User size={16} className="text-white" />
          )}
        </div>
        <div className="font-medium text-white flex-1 truncate">
          {player.name}
          {player.isHost && (
            <Crown size={14} className="inline ml-1 text-amber-400" />
          )}
        </div>
        <div className="px-2 py-1 bg-purple-800/50 rounded-full text-xs text-purple-200">
          {player.cards.length} card{player.cards.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="p-2 w-full bg-purple-950/30">
        {isSelf ? (
          <div className="flex flex-wrap gap-1 justify-center">
            {player.cards.map((card, i) => (
              <PlayingCard 
                key={card.id} 
                card={card}
                small={player.cards.length > 8}
                className="animate-card-deal"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
            {player.cards.length === 0 && (
              <div className="text-purple-400 text-sm italic">No cards</div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-1">
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
              <span className="ml-1 text-purple-200 bg-purple-900/50 px-2 rounded-full text-xs">
                +{player.cards.length - 5}
              </span>
            )}
            {player.cards.length === 0 && (
              <div className="text-purple-400 text-sm italic">No cards</div>
            )}
          </div>
        )}
      </div>

      {isCurrentPlayer && (
        <div className="w-full py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-center text-sm font-bold text-amber-950">
          Current Turn
        </div>
      )}
    </div>
  );
};

export default PlayerDisplay;
