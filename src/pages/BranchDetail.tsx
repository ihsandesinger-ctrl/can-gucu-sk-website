import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Trophy, 
  User, 
  Phone, 
  Users, 
  Bell, 
  ArrowLeft,
  UserCircle
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';

interface Branch {
  id: string;
  name: string;
  description: string;
  coachName: string;
  coachContact: string;
  isHidden: boolean;
}

interface Team {
  id: string;
  name: string;
  coachName: string;
}

interface Player {
  id: string;
  teamId: string;
  name: string;
  number: string;
  position: string;
}

const BranchDetail = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;

    // Fetch branch info
    const fetchBranch = async () => {
      const docRef = doc(db, 'branches', branchId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBranch({ id: docSnap.id, ...docSnap.data() } as Branch);
      }
    };

    // Fetch teams in this branch
    const qTeams = query(collection(db, 'teams'), where('branchId', '==', branchId), where('isHidden', '==', false));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Team[];
      setTeams(teamsData);
      
      // Fetch players for all teams in this branch
      if (teamsData.length > 0) {
        const teamIds = teamsData.map(t => t.id);
        const qPlayers = query(collection(db, 'players'), where('teamId', 'in', teamIds), where('isHidden', '==', false));
        const unsubscribePlayers = onSnapshot(qPlayers, (playerSnap) => {
          const playersData = playerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Player[];
          setPlayers(playersData);
          setLoading(false);
        });
        return () => unsubscribePlayers();
      } else {
        setLoading(false);
      }
    });

    fetchBranch();
    return () => unsubscribeTeams();
  }, [branchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a5f6b] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!branch || branch.isHidden) {
    return (
      <div className="min-h-screen bg-[#1a5f6b] flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-8">BRANŞ BULUNAMADI</h1>
        <Link to="/" className="bg-[#f97316] px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center shadow-2xl">
          <ArrowLeft className="mr-2" /> ANA SAYFAYA DÖN
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a5f6b]">
      {/* Hero */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-0"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[32px] flex items-center justify-center mb-8 border border-white/10"
          >
            <Trophy className="w-12 h-12 text-[#f97316]" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl sm:text-8xl font-black text-white uppercase tracking-tighter italic mb-4"
          >
            {branch.name}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto font-medium"
          >
            {branch.description}
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-32 space-y-24">
        {/* Coach Info & Announcements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Coach Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-xl p-10 rounded-[48px] border border-white/10"
          >
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-20 h-20 bg-[#f97316] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#f97316]/20">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">BAŞ ANTRENÖR</h2>
                <div className="h-1.5 w-20 bg-[#f97316] mt-2 rounded-full"></div>
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-4xl font-black text-white uppercase tracking-tighter">{branch.coachName || 'BİLGİ YOK'}</p>
              <div className="flex items-center text-gray-300 bg-white/5 p-6 rounded-3xl border border-white/5">
                <Phone className="w-6 h-6 mr-4 text-[#f97316]" />
                <span className="text-xl font-bold tracking-widest">{branch.coachContact || 'İLETİŞİM BİLGİSİ YOK'}</span>
              </div>
            </div>
          </motion.div>

          {/* Announcements Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-xl p-10 rounded-[48px] border border-white/10"
          >
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-20 h-20 bg-[#1a5f6b] rounded-3xl flex items-center justify-center border border-white/10">
                <Bell className="w-10 h-10 text-[#f97316]" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">DUYURULAR</h2>
                <div className="h-1.5 w-20 bg-[#f97316] mt-2 rounded-full"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-white font-bold mb-2 uppercase tracking-wide">Yeni Sezon Kayıtları Başladı!</p>
                <p className="text-gray-400 text-sm">Branşımıza katılmak için antrenörümüzle iletişime geçebilirsiniz.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 opacity-50">
                <p className="text-white font-bold mb-2 uppercase tracking-wide">Haftalık Antrenman Programı</p>
                <p className="text-gray-400 text-sm">Pazartesi, Çarşamba ve Cuma günleri saat 18:00'de.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Player List */}
        <section>
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">OYUNCU LİSTESİ</h2>
            <div className="h-2 w-32 bg-[#f97316] mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="space-y-16">
            {teams.map((team) => (
              <div key={team.id} className="space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="h-px flex-grow bg-white/10"></div>
                  <h3 className="text-2xl font-black text-[#f97316] uppercase tracking-widest italic">{team.name}</h3>
                  <div className="h-px flex-grow bg-white/10"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {players.filter(p => p.teamId === team.id).map((player, idx) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      viewport={{ once: true }}
                      className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 text-center group hover:bg-[#f97316] transition-all duration-500"
                    >
                      <div className="relative inline-block mb-6">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
                          <UserCircle className="w-12 h-12" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#f97316] text-white rounded-full flex items-center justify-center font-black text-sm shadow-xl border-4 border-[#1a5f6b] group-hover:bg-white group-hover:text-[#f97316] transition-all">
                          {player.number}
                        </div>
                      </div>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight mb-1">{player.name}</h4>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest group-hover:text-white/70 transition-colors">
                        {player.position}
                      </p>
                    </motion.div>
                  ))}
                  {players.filter(p => p.teamId === team.id).length === 0 && (
                    <div className="col-span-full py-12 text-center text-white/30 font-black uppercase tracking-widest">
                      Bu takımda henüz oyuncu bulunmuyor.
                    </div>
                  )}
                </div>
              </div>
            ))}
            {teams.length === 0 && (
              <div className="text-center py-20 text-white/20 font-black uppercase tracking-[0.5em]">
                HENÜZ TAKIM OLUŞTURULMAMIŞ
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BranchDetail;
