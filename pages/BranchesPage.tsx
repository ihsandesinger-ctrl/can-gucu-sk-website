import React from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import type { Branch } from '../types';
import PlayerCard from '../components/PlayerCard';

interface BranchPageProps {
  branches: Branch[];
}

const BranchPage: React.FC<BranchPageProps> = ({ branches }) => {
  const { branchSlug } = useParams<{ branchSlug: string }>();

  const branch = branches.find(b => b.slug === branchSlug);

  if (!branch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Branş bulunamadı.</h1>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-64 md:h-80">
        <img src={branch.heroImage} alt={`${branch.name} hero`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white">{branch.name}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Description */}
        <section className="mb-12">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Branş Hakkında</h2>
            <p className="text-gray-600 leading-relaxed text-lg">{branch.description}</p>
          </div>
        </section>

        {/* Content (News/Announcements) */}
        {branch.content && (
          <section className="mb-12">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Haberler ve Duyurular</h2>
              <div className="prose prose-lg max-w-none text-gray-600">
                <ReactMarkdown>{branch.content}</ReactMarkdown>
              </div>
            </div>
          </section>
        )}

        {/* Teknik Kadro */}
        {branch.coach && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Teknik Kadro</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-6 max-w-sm">
              {branch.coach.imageUrl && (
                <img 
                  className="h-24 w-24 rounded-full object-cover" 
                  src={branch.coach.imageUrl} 
                  alt={branch.coach.name} 
                />
              )}
              <div>
                <p className="font-bold text-xl text-gray-900">{branch.coach.name}</p>
                <p className="text-md text-gray-600">{branch.coach.role}</p>
              </div>
            </div>
          </section>
        )}

        {/* Oyuncu Kadrosu */}
        {branch.players && branch.players.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Sporcularımız</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {branch.players.map((player, index) => (
                <PlayerCard key={index} player={player} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BranchPage;
