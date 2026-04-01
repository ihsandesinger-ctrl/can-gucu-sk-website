import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User } from 'lucide-react';
import type { Team, Fixture, Player } from '../types';
import PlayerCard from '../components/PlayerCard';
import FixtureTable from '../components/FixtureTable';
import { getTeamPlayers } from '../firebaseService';

interface TeamPageProps {
  teams: Team[];
  fixtures: Fixture[];
}

const TeamPage: React.FC<TeamPageProps> = ({ teams, fixtures }) => {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const team = teams.find(t => t.slug === teamSlug);
  const teamFixtures = fixtures.find(f => f.teamSlug === teamSlug);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (team && (!team.players || team.players.length === 0)) {
        setLoadingPlayers(true);
        const players = await getTeamPlayers(team.id);
        setLocalPlayers(players as unknown as Player[]);
        setLoadingPlayers(false);
      }
    };
    fetchPlayers();
  }, [team]);

  // FIX: Only check if the team exists. The fixture is optional.
  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Takım bulunamadı.</h1>
      </div>
    );
  }

  const displayPlayers = team.players && team.players.length > 0 ? team.players : localPlayers;

  return (
    <div className="bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-64 md:h-[500px] overflow-hidden bg-[var(--primary-color)]">
        {/* Main image - object-contain to support transparent images and avoid cropping */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <img 
            src={team.heroImage || 'https://picsum.photos/seed/sports/1920/1080'} 
            alt={team.name}
            className="w-full h-full object-contain p-4 md:p-8"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{team.name}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Teknik Kadro */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Teknik Kadro</h2>
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-6 max-w-sm">
            {team.coach.imageUrl ? (
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-orange-100 bg-gray-100">
                <img 
                  className="h-full w-full object-cover" 
                  src={team.coach.imageUrl} 
                  alt={team.coach.name} 
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-orange-50 flex items-center justify-center border-2 border-orange-100">
                <User className="text-orange-300 w-12 h-12" />
              </div>
            )}
            <div>
              <p className="font-bold text-xl text-gray-900">{team.coach.name || 'Antrenör Belirtilmedi'}</p>
              <p className="text-md text-gray-600">{team.coach.role || 'Teknik Sorumlu'}</p>
            </div>
          </div>
        </section>

        {/* Oyuncu Kadrosu */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Oyuncular Kadrosu</h2>
          {loadingPlayers ? (
            <div className="text-center py-10 text-gray-500">Oyuncular yükleniyor...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {displayPlayers.map((player, index) => (
                <PlayerCard key={index} player={player} />
              ))}
              {displayPlayers.length === 0 && (
                <div className="col-span-full text-center py-10 text-gray-500">Bu takım için henüz oyuncu bilgisi girilmemiştir.</div>
              )}
            </div>
          )}
        </section>

        {/* Fikstür ve Sonuçlar */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Fikstür ve Sonuçlar</h2>
          {/* FIX: Conditionally render the fixture table or a message. */}
          {teamFixtures ? (
            <FixtureTable data={teamFixtures} />
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
                <p>Bu takım için henüz fikstür bilgisi girilmemiştir.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeamPage;