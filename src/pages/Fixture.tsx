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
  isDateNotSet?: boolean;
  createdAt?: string;
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
      
      // Client-side sorting as requested
      const sortedMatches = [...teamMatches].sort((a, b) => {
        // If both have dates, sort by date
        if (!a.isDateNotSet && !b.isDateNotSet) {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (a.order || 0) - (b.order || 0);
        }
        
        // If one is not set, it goes after those with dates
        if (!a.isDateNotSet && b.isDateNotSet) return -1;
        if (a.isDateNotSet && !b.isDateNotSet) return 1;
        
        // Both not set, sort by createdAt (latest at bottom as requested: "en son eklenen maç en sonda")
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });

      setMatches(sortedMatches);
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
      <div className="bg-[#1a5f6b] text-white pt-32 pb-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: 'radial-gradient(#f97316 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f97316]/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <p className="text-[#f97316] font-black uppercase tracking-[0.4em] text-xs mb-4">TAKIM FİKSTÜRÜ</p>
          <h1 className="text-6xl sm:text-8xl font-black uppercase tracking-tighter italic mb-12">{team?.name || 'FİKSTÜR'}</h1>
          
          {/* Team Selector */}
          <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-[32px] p-2 border border-white/20 shadow-2xl">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full bg-transparent border-none text-white font-black uppercase tracking-widest text-sm focus:ring-0 cursor-pointer text-center py-2"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id} className="text-gray-900">{t.name}</option>
              ))}
            </select>
          </div>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 pb-32 relative z-20">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-[#1a5f6b]/10 border border-gray-100 overflow-hidden">
           {/* Row Header - Desktop */}
           <div className="hidden md:grid grid-cols-12 gap-4 px-10 py-6 border-b border-gray-50 bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
             <div className="col-span-2">TARİH</div>
             <div className="col-span-10 text-center">MAÇ DETAYI</div>
           </div>

           <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-32 flex justify-center">
                <div className="w-12 h-12 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : matches.length > 0 ? (
              matches.map((match, index) => {
                const isFinished = match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore !== '' && match.awayScore !== '';
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-gray-50/50 transition-all"
                  >
                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center px-10 py-8">
                       <div className="col-span-2">
                         <div className="text-gray-900 font-black text-base tabular-nums">
                            {match.isDateNotSet ? 'BELİRTİLMEDİ' : (match.date ? match.date.split('-').reverse().slice(0, 2).join('/') : '--/--')}
                         </div>
                         <div className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">{match.isDateNotSet ? '--:--' : (match.time || '--:--')}</div>
                       </div>

                       <div className="col-span-10 flex items-center justify-center gap-8 relative">
                          <div className="flex-1 flex items-center justify-end gap-6">
                            <span className="text-xl font-black uppercase tracking-tight text-right text-gray-900">
                              {match.homeTeam}
                            </span>
                            {match.homeLogo && (
                              <div className="w-14 h-14 bg-gray-50 rounded-2xl p-2.5 border border-gray-100 group-hover:border-gray-200 transition-colors flex items-center justify-center shrink-0">
                                 <img src={match.homeLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                            )}
                          </div>

                          <div className={`px-8 py-3 rounded-2xl border font-black text-2xl min-w-[130px] text-center tabular-nums transition-all ${
                            isFinished 
                              ? 'bg-gray-50 border-gray-100 text-[#1a5f6b] shadow-inner' 
                              : 'bg-[#f97316]/5 border-[#f97316]/10 text-[#f97316]'
                          }`}>
                            {isFinished ? `${match.homeScore} - ${match.awayScore}` : match.time || 'VS'}
                          </div>

                          <div className="flex-1 flex items-center justify-start gap-6">
                            {match.awayLogo && (
                              <div className="w-14 h-14 bg-gray-50 rounded-2xl p-2.5 border border-gray-100 group-hover:border-gray-200 transition-colors flex items-center justify-center shrink-0">
                                 <img src={match.awayLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <span className="text-xl font-black uppercase tracking-tight text-left text-gray-900">
                              {match.awayTeam}
                            </span>
                          </div>
                       </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden p-8 space-y-6">
                       <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                          <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {match.isDateNotSet ? 'BELİRTİLMEDİ' : (match.date?.split('-').reverse().join('.'))}</span>
                          <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {match.isDateNotSet ? '--:--' : (match.time || '--:--')}</span>
                       </div>

                       <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 flex flex-col items-center gap-3">
                             {match.homeLogo && (
                               <div className="w-14 h-14 bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center justify-center">
                                 <img src={match.homeLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                               </div>
                             )}
                             <span className="text-[11px] font-black uppercase tracking-tight text-center leading-tight text-gray-900">
                               {match.homeTeam}
                             </span>
                          </div>

                          <div className={`px-4 py-3 rounded-xl border font-black text-xl min-w-[80px] text-center tabular-nums ${
                            isFinished 
                              ? 'bg-gray-50 border-gray-100 text-[#1a5f6b]' 
                              : 'bg-[#f97316]/5 border-[#f97316]/10 text-[#f97316] text-xs px-2'
                          }`}>
                            {isFinished ? `${match.homeScore}-${match.awayScore}` : 'VS'}
                          </div>

                          <div className="flex-1 flex flex-col items-center gap-3">
                             {match.awayLogo && (
                               <div className="w-14 h-14 bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center justify-center">
                                 <img src={match.awayLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                               </div>
                             )}
                             <span className="text-[11px] font-black uppercase tracking-tight text-center leading-tight text-gray-900">
                               {match.awayTeam}
                             </span>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-32 px-10">
                <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-8">
                  <Calendar className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic mb-3">MATERYAL BULUNAMADI</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Bu takım için henüz maç programı girilmemiş.</p>
              </div>
            )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Fixture;
