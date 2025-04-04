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
        "bg-game-card rounded-md flex flex-col border border-gray-300 shadow-md cursor-pointer transition-transform hover:shadow-lg",
        small ? "w-8 h-12 text-xs p-1" : "w-16 h-24 p-2",
        selected && "ring-2 ring-game-accent transform -translate-y-2",
        className
      )}
      onClick={onClick}
      style={{ 
        perspective: '1000px', 
        transformStyle: 'preserve-3d',
        ...style
      }}
    >
      {!faceDown ? (
        <>
          <div className="flex justify-between w-full">
            <span className={isRed ? "text-red-600" : "text-black"}>{card.rank}</span>
            <span className={isRed ? "text-red-600" : "text-black"}>{suitSymbol[card.suit]}</span>
          </div>
          <div className="flex-grow flex items-center justify-center">
            <span className={cn(isRed ? "text-red-600" : "text-black", small ? "text-lg" : "text-3xl")}>
              {suitSymbol[card.suit]}
            </span>
          </div>
          <div className="flex justify-between w-full">
            <span className={isRed ? "text-red-600" : "text-black"}>{suitSymbol[card.suit]}</span>
            <span className={isRed ? "text-red-600" : "text-black"}>{card.rank}</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-blue-800 rounded-sm flex items-center justify-center">
          <div className="bg-blue-700 w-3/4 h-3/4 rounded-sm flex items-center justify-center">
            <div className="bg-blue-600 w-1/2 h-1/2 rounded-sm"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayingCard;
