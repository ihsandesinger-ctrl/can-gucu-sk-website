
import React from 'react';

interface MatchCardProps {
    teamName: string;
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo: string;
}

const MatchCard: React.FC<MatchCardProps> = ({ teamName, date, homeTeam, awayTeam, homeTeamLogo }) => {
    return (
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg text-white w-full max-w-md mx-auto">
            <p className="text-center font-semibold text-orange-400 mb-2">{teamName}</p>
            <p className="text-center text-sm mb-4">{date}</p>
            <div className="flex items-center justify-between">
                <div className="flex flex-col items-center w-1/3">
                    <img src={homeTeamLogo} alt={`${homeTeam} Logo`} className="w-20 h-20 object-contain mb-2" />
                    <span className="font-bold text-center">{homeTeam}</span>
                </div>
                <div className="text-4xl font-bold">VS</div>
                <div className="flex flex-col items-center w-1/3">
                    <div className="w-20 h-20 bg-gray-200/20 rounded-full flex items-center justify-center mb-2">
                        <span className="text-gray-300 text-xs font-bold">RAKİP</span>
                    </div>
                    <span className="font-bold text-center">{awayTeam}</span>
                </div>
            </div>
        </div>
    );
};

export default MatchCard;
