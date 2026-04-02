import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Trophy, 
  ChevronRight,
  Shield,
  Target
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface MatchItem {
  id: string;
  teamId: string;
  homeTeam: string;
  homeLogo?: string;
  awayTeam: string;
  awayLogo?: string;
  date: string;
  time?: string;
  location?: string;
  category?: string;
  isHidden: boolean;
  order: number;
}

interface Team {
  id: string;
  name: string;
  branchId: string;
}

const Fixture = () => {
  const { teamId } = useParams();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    // Fetch team info
    const fetchTeam = async () => {
      const docRef = doc(db, 'teams', teamId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTeam({ id: docSnap.id, ...docSnap.data() } as Team);
      }
    };
    fetchTeam();

    // Fetch matches for this team
    const q = query(
      collection(db, 'matches'), 
      where('isHidden', '==', false), 
      where('teamId', '==', teamId),
      orderBy('order', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MatchItem[];
      setMatches(teamMatches);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching matches:", error);
      // Fallback if index is missing or other error
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a5f6b] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a5f6b] text-white py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: 'radial-gradient(#f97316 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <p className="text-[#f97316] font-black uppercase tracking-[0.3em] text-xs mb-4">TAKIM FİKSTÜRÜ</p>
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter italic mb-4">{team?.name || 'FİKSTÜR'}</h1>
          <div className="h-2 w-32 bg-[#f97316] mx-auto rounded-full"></div>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-24">
        <div className="space-y-8">
          {matches.length > 0 ? (
            matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden group hover:border-[#f97316]/30 transition-all duration-500"
              >
                <div className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    {/* Home Team */}
                    <div className="flex-1 text-center md:text-right space-y-4">
                      <div className="w-24 h-24 bg-gray-50 rounded-full mx-auto md:ml-auto flex items-center justify-center border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                        {match.homeLogo ? (
                          <img src={match.homeLogo} alt={match.homeTeam} className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                        ) : (
                          <Shield className="w-12 h-12 text-[#1a5f6b]" />
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight italic">{match.homeTeam}</h3>
                    </div>

                    {/* VS / Info */}
                    <div className="flex flex-col items-center gap-6">
                      <div className="bg-[#f97316] text-white px-8 py-3 rounded-2xl font-black italic text-2xl shadow-xl shadow-[#f97316]/30 transform -skew-x-12">
                        VS
                      </div>
                      <div className="flex flex-col items-center gap-2 text-gray-400 font-black uppercase tracking-widest text-[10px]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-[#f97316]" /> {new Date(match.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        {match.time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-[#f97316]" /> {match.time}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                      <div className="w-24 h-24 bg-gray-50 rounded-full mx-auto md:mr-auto flex items-center justify-center border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                        {match.awayLogo ? (
                          <img src={match.awayLogo} alt={match.awayTeam} className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                        ) : (
                          <Target className="w-12 h-12 text-[#f97316]" />
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight italic">{match.awayTeam}</h3>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="mt-12 pt-8 border-t border-gray-50 flex flex-wrap justify-center gap-8">
                    {match.location && (
                      <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-widest text-[10px]">
                        <MapPin className="w-4 h-4 text-[#f97316]" /> {match.location}
                      </div>
                    )}
                    {match.category && (
                      <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-widest text-[10px]">
                        <Trophy className="w-4 h-4 text-[#f97316]" /> {match.category}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-32 bg-white rounded-[60px] shadow-2xl border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-8">
                <Calendar className="w-12 h-12 text-gray-200" />
              </div>
              <h3 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight italic mb-4">HENÜZ MAÇ BULUNMUYOR</h3>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Bu takım için planlanmış bir maç bulunmamaktadır.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fixture;
