
import React from 'react';

interface MatchCardProps {
    teamName: string;
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
}

const MatchCard: React.FC<MatchCardProps> = ({ teamName, date, homeTeam, awayTeam, homeTeamLogo, awayTeamLogo }) => {
    const formattedDate = React.useMemo(() => {
        try {
            return new Date(date).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                weekday: 'long'
            });
        } catch (e) {
            return date;
        }
    }, [date]);

    return (
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg text-white w-full max-w-md mx-auto">
            <p className="text-center font-semibold text-[var(--secondary-color)] mb-2">{teamName}</p>
            <p className="text-center text-sm mb-4">{formattedDate}</p>
            <div className="flex items-center justify-between">
                <div className="flex flex-col items-center w-1/3">
                    {homeTeamLogo ? (
                        <img 
                            src={homeTeamLogo} 
                            alt={`${homeTeam} Logo`} 
                            className="w-20 h-20 object-contain mb-2" 
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement?.querySelector('.logo-fallback-home')?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                    <div className={`logo-fallback-home ${homeTeamLogo ? 'hidden' : ''} w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-2`}>
                        <i className="fas fa-shield-alt text-3xl"></i>
                    </div>
                    <span className="font-bold text-center">{homeTeam}</span>
                </div>
                <div className="text-4xl font-bold">VS</div>
                <div className="flex flex-col items-center w-1/3">
                    {awayTeamLogo ? (
                        <img 
                            src={awayTeamLogo} 
                            alt={`${awayTeam} Logo`} 
                            className="w-20 h-20 object-contain mb-2" 
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement?.querySelector('.logo-fallback-away')?.classList.remove('hidden');
                            }}
                        />
                    ) : (
                        <div className="logo-fallback-away w-20 h-20 bg-gray-200/20 rounded-full flex items-center justify-center mb-2">
                            <span className="text-gray-300 text-xs font-bold">RAKİP</span>
                        </div>
                    )}
                    <span className="font-bold text-center">{awayTeam}</span>
                </div>
            </div>
        </div>
    );
};

export default MatchCard;
