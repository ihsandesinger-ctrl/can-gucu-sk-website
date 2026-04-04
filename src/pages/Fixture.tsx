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
  homeScore?: string;
  awayTeam: string;
  awayLogo?: string;
  awayScore?: string;
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
  const { teamId: urlTeamId } = useParams();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(urlTeamId || '');
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all teams
    const qTeams = query(collection(db, 'teams'));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Team[];
      setTeams(teamsData);
      
      // If no team selected yet, pick the first one or the one from URL
      if (!selectedTeamId && teamsData.length > 0) {
        setSelectedTeamId(teamsData[0].id);
      }
    });

    return () => unsubscribeTeams();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) return;

    // Fetch team info
    const fetchTeam = async () => {
      const docRef = doc(db, 'teams', selectedTeamId);
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
      where('teamId', '==', selectedTeamId),
      orderBy('order', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MatchItem[];
      setMatches(teamMatches);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching matches:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedTeamId]);

  if (loading && teams.length === 0) {
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
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter italic mb-8">{team?.name || 'FİKSTÜR'}</h1>
          
          {/* Team Selector */}
          <div className="max-w-xs mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full bg-transparent border-none text-white font-black uppercase tracking-widest text-xs focus:ring-0 cursor-pointer text-center"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id} className="text-[#1a5f6b]">{t.name}</option>
              ))}
            </select>
          </div>
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
                className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden group hover:border-[#f97316]/30 transition-all duration-500"
              >
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 md:gap-4">
                    {/* Date & Time */}
                    <div className="md:col-span-3 flex flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-gray-50 pb-4 md:pb-0 md:pr-6">
                      <span className="text-2xl font-black text-[#1a5f6b] tracking-tighter italic">
                        {(() => {
                          if (!match.date) return '';
                          const dateParts = match.date.split('-');
                          if (dateParts.length === 3) {
                            const [year, month, day] = dateParts;
                            const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                            return `${day} ${months[parseInt(month) - 1]} ${year}`;
                          }
                          return match.date;
                        })()}
                      </span>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center mt-2">
                        <Clock className="w-3 h-3 mr-2 text-[#f97316]" /> {match.time || '--:--'}
                      </span>
                    </div>

                    {/* Teams & Score */}
                    <div className="md:col-span-6 flex items-center justify-center gap-4 px-2">
                      <div className="flex-1 flex items-center justify-end gap-4">
                        <span className="text-lg md:text-xl font-black text-[#1a5f6b] uppercase tracking-tight text-right leading-tight">{match.homeTeam}</span>
                        {match.homeLogo && (
                          <img src={match.homeLogo} alt={match.homeTeam} className="w-12 h-12 object-contain shrink-0" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 shadow-inner">
                        {match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore !== '' && match.awayScore !== '' ? (
                          <>
                            <span className="text-3xl font-black text-[#1a5f6b]">{match.homeScore}</span>
                            <span className="text-[#f97316] font-black text-xl">:</span>
                            <span className="text-3xl font-black text-[#1a5f6b]">{match.awayScore}</span>
                          </>
                        ) : (
                          <span className="text-sm font-black text-[#f97316] italic tracking-widest">VS</span>
                        )}
                      </div>

                      <div className="flex-1 flex items-center justify-start gap-4">
                        {match.awayLogo && (
                          <img src={match.awayLogo} alt={match.awayTeam} className="w-12 h-12 object-contain shrink-0" referrerPolicy="no-referrer" />
                        )}
                        <span className="text-lg md:text-xl font-black text-[#1a5f6b] uppercase tracking-tight text-left leading-tight">{match.awayTeam}</span>
                      </div>
                    </div>

                    {/* Location & Category */}
                    <div className="md:col-span-3 flex flex-col items-center md:items-end border-t md:border-t-0 md:border-l border-gray-50 pt-4 md:pt-0 md:pl-6 space-y-2">
                      {match.location && (
                        <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-widest text-[9px] text-right">
                          <MapPin className="w-3 h-3 text-[#f97316]" /> {match.location}
                        </div>
                      )}
                      {match.category && (
                        <div className="flex items-center gap-2 text-[#f97316] font-black uppercase tracking-widest text-[9px] text-right">
                          <Trophy className="w-3 h-3" /> {match.category}
                        </div>
                      )}
                    </div>
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
