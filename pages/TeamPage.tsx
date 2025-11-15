
import React from 'react';
import type { Team, Fixture } from '../types';
import PlayerCard from '../components/PlayerCard';
import FixtureTable from '../components/FixtureTable';

interface TeamPageProps {
  team: Team;
  fixtures: Fixture;
}

const TeamPage: React.FC<TeamPageProps> = ({ team, fixtures }) => {
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
          <div className="inline-block bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="font-bold text-lg text-gray-900">{team.coach.name}</p>
            <p className="text-sm text-gray-600">{team.coach.role}</p>
          </div>
        </section>

        {/* Oyuncu Kadrosu */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Oyuncular Kadrosu</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {team.players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </section>

        {/* Fikstür ve Sonuçlar */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Fikstür ve Sonuçlar</h2>
          <FixtureTable data={fixtures} />
        </section>
      </div>
    </div>
  );
};

export default TeamPage;
