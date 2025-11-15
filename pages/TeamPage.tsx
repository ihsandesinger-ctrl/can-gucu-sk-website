import React from 'react';
import { useParams } from 'react-router-dom';
import type { Team, Fixture } from '../types';
import PlayerCard from '../components/PlayerCard';
import FixtureTable from '../components/FixtureTable';

interface TeamPageProps {
  teams: Team[];
  fixtures: Fixture[];
}

const TeamPage: React.FC<TeamPageProps> = ({ teams, fixtures }) => {
  const { teamSlug } = useParams<{ teamSlug: string }>();

  const team = teams.find(t => t.slug === teamSlug);
  const teamFixtures = fixtures.find(f => f.teamSlug === teamSlug);

  // FIX: Only check if the team exists. The fixture is optional.
  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Takım bulunamadı.</h1>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-64 md:h-80">
        <img src={team.heroImage} alt={`${team.name} hero`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white">{team.name}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Teknik Kadro */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Teknik Kadro</h2>
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-6 max-w-sm">
            {team.coach.imageUrl && (
              <img 
                className="h-24 w-24 rounded-full object-cover" 
                src={team.coach.imageUrl} 
                alt={team.coach.name} 
              />
            )}
            <div>
              <p className="font-bold text-xl text-gray-900">{team.coach.name}</p>
              <p className="text-md text-gray-600">{team.coach.role}</p>
            </div>
          </div>
        </section>

        {/* Oyuncu Kadrosu */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Oyuncular Kadrosu</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {team.players.map((player, index) => (
              <PlayerCard key={index} player={player} />
            ))}
          </div>
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