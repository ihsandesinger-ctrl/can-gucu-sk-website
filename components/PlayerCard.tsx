
import React from 'react';
import type { Player } from '../types';

interface PlayerCardProps {
    player: Player;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
    return (
        <div className="relative rounded-xl overflow-hidden shadow-lg group">
            <img className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-300" src={player.imageUrl} alt={player.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute top-2 right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {player.number}
            </div>
            <div className="absolute bottom-0 left-0 p-4 text-white">
                <h4 className="font-bold text-lg">{player.name}</h4>
                <p className="text-sm text-gray-300">{player.position}</p>
            </div>
        </div>
    );
};

export default PlayerCard;
