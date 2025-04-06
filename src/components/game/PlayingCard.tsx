
import React from 'react';
import { Card as CardType } from '@/types/game';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card?: CardType;
  faceDown?: boolean;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
  style?: React.CSSProperties;
}

const PlayingCard: React.FC<PlayingCardProps> = ({ 
  card, 
  faceDown = false, 
  className, 
  onClick,
  selected = false,
  small = false,
  style
}) => {
  const isRed = card?.suit === 'hearts' || card?.suit === 'diamonds';
  const suitSymbol = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };

  if (!card) {
    return (
      <div 
        className={cn(
          "bg-gray-200 rounded-md flex items-center justify-center",
          small ? "w-8 h-12" : "w-16 h-24",
          className
        )}
        style={style}
      >
        <span className="text-gray-400">?</span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative rounded-md cursor-pointer transition-all",
        small ? "w-8 h-12 text-xs" : "w-16 h-24",
        selected && "transform -translate-y-4",
        className
      )}
      onClick={onClick}
      style={{ 
        perspective: '1000px', 
        transformStyle: 'preserve-3d',
        ...style
      }}
    >
      <div className={cn(
        "absolute w-full h-full backface-visibility-hidden transition-all",
        faceDown ? "balatro-card-back" : "balatro-card",
        selected && "balatro-glow"
      )}>
        {!faceDown ? (
          <>
            <div className="flex justify-between w-full p-1">
              <span className={cn("font-bold", isRed ? "text-red-600" : "text-black")}>{card.rank}</span>
              <span className={cn(isRed ? "text-red-600" : "text-black")}>{suitSymbol[card.suit]}</span>
            </div>
            <div className="flex-grow flex items-center justify-center">
              <span className={cn(isRed ? "text-red-600" : "text-black", small ? "text-lg" : "text-3xl", "font-bold")}>
                {suitSymbol[card.suit]}
              </span>
            </div>
            <div className="flex justify-between w-full p-1">
              <span className={cn(isRed ? "text-red-600" : "text-black")}>{suitSymbol[card.suit]}</span>
              <span className={cn("font-bold", isRed ? "text-red-600" : "text-black")}>{card.rank}</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full p-1 flex items-center justify-center">
            <div className="w-full h-full border border-purple-300/30 rounded flex items-center justify-center bg-gradient-to-br from-purple-800 to-violet-900">
              <div className="w-2/3 h-2/3 border border-purple-300/30 rounded flex items-center justify-center bg-gradient-to-br from-purple-700 to-violet-800">
                <div className="w-1/2 h-1/2 rounded bg-gradient-to-br from-purple-600 to-violet-700"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayingCard;
