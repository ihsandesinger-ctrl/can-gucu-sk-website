
import React from 'react';
import type { Player } from '../types';

interface PlayerCardProps {
    player: Player;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
    return (
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg group bg-gray-50 border border-gray-100">
            <img 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300 z-10" 
                src={player.imageUrl || 'https://picsum.photos/seed/player/400/600'} 
                alt={player.name} 
                referrerPolicy="no-referrer"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/player/400/600';
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-20"></div>
            <div className="absolute top-2 right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm z-30">
                {player.number}
            </div>
            <div className="absolute bottom-0 left-0 p-4 text-white z-30">
                <h4 className="font-bold text-lg drop-shadow-md">{player.name}</h4>
                <p className="text-sm text-gray-100 drop-shadow-sm">{player.position}</p>
            </div>
        </div>
    );
};

export default PlayerCard;
