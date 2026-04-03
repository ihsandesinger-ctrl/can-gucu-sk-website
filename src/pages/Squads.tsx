import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
  image: string;
}

interface Team {
  id: string;
  name: string;
  coachName: string;
  coachImage: string;
}

const Squads = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    // Fetch team details
    const fetchTeam = async () => {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      if (teamDoc.exists()) {
        setTeam({ id: teamDoc.id, ...teamDoc.data() } as Team);
      }
    };

    fetchTeam();

    // Fetch players for this team
    const q = query(
      collection(db, 'players'), 
      where('teamId', '==', teamId),
      where('isHidden', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Player[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f97316]"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-bold text-gray-400 uppercase tracking-widest">Takım bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-[#1a5f6b] text-white py-12 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-200 flex items-center justify-center"
          >
            {team.coachImage ? (
              <img 
                src={team.coachImage} 
                alt={team.coachName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <img 
                src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" 
                alt={team.name} 
                className="w-24 h-auto object-contain opacity-20"
                referrerPolicy="no-referrer"
              />
            )}
          </motion.div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-wider mb-2">{team.name}</h1>
            <div className="flex flex-col items-center md:items-start">
              <p className="text-xl font-medium text-[#f97316]">{team.coachName || 'Atanmamış'}</p>
              <p className="text-sm text-gray-300 uppercase tracking-widest">Teknik Sorumlu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-tight border-l-8 border-[#f97316] pl-4">
            Oyuncular Kadrosu
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              className="relative group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                <img 
                  src={player.image || 'https://picsum.photos/seed/player/400/500'} 
                  alt={player.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              </div>

              {/* Player Number Badge */}
              <div className="absolute top-4 right-4 w-10 h-10 bg-[#f97316] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg z-10">
                {player.number}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <p className="text-white font-bold text-xl mb-1 group-hover:text-[#f97316] transition-colors duration-300">
                  {player.name}
                </p>
                <p className="text-gray-300 text-sm font-medium uppercase tracking-widest">
                  {player.position}
                </p>
              </div>
            </motion.div>
          ))}
          {players.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
              Henüz oyuncu eklenmemiş.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Squads;
