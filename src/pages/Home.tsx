import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  Newspaper,
  Users,
  UserCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  image: string;
  date: string;
  category: string;
  isHidden: boolean;
}

interface TeamItem {
  id: string;
  name: string;
}

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
  category: string;
  isHidden: boolean;
  order: number;
}

const Home = () => {
  const { settings } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch news
    const qNews = query(collection(db, 'news'));
    const unsubscribeNews = onSnapshot(qNews, (snapshot) => {
      const allNews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NewsItem[];
      setNews(allNews.filter(item => !item.isHidden).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3));
    });

    // Fetch teams
    const qTeams = query(collection(db, 'teams'));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const allTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeamItem[];
      setTeams(allTeams);
    });

    // Fetch matches
    const qMatches = query(collection(db, 'matches'));
    const unsubscribeMatches = onSnapshot(qMatches, (snapshot) => {
      const allMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MatchItem[];
      
      // Get today's date in YYYY-MM-DD format for filtering
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Filter out past matches and hidden matches, sort by priority (U-11), then date, then order
      const visibleMatches = allMatches
        .filter(item => !item.isHidden && (item.date >= todayStr))
        .sort((a, b) => {
          const nameA = getTeamName(a.teamId).toUpperCase();
          const nameB = getTeamName(b.teamId).toUpperCase();
          
          const isU11A = nameA.includes('U-11') || a.category?.toUpperCase() === 'U-11';
          const isU11B = nameB.includes('U-11') || b.category?.toUpperCase() === 'U-11';
          
          if (isU11A && !isU11B) return -1;
          if (!isU11A && isU11B) return 1;

          // Sort by date first
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          // Then by order
          return (a.order || 0) - (b.order || 0);
        });
      
      const onePerTeam: MatchItem[] = [];
      const seenTeams = new Set();
      
      for (const match of visibleMatches) {
        if (!seenTeams.has(match.teamId)) {
          onePerTeam.push(match);
          seenTeams.add(match.teamId);
        }
      }

      setMatches(onePerTeam.slice(0, 4)); 
      setLoading(false);
    });

    return () => {
      unsubscribeNews();
      unsubscribeTeams();
      unsubscribeMatches();
    };
  }, [teams]); // Fixed dependency

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Bilinmeyen Takım';
  };

  return (
    <div className="bg-[#1a5f6b]">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          {settings.heroBgImage ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#1a5f6b]/40 to-[#1a5f6b] z-10"></div>
              <motion.img 
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                src={settings.heroBgImage} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                alt="Stadium Background"
              />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a5f6b] to-[#0d2f35]"></div>
          )}
        </div>

        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative inline-block mb-8">
              <motion.div
                animate={{ 
                  boxShadow: ["0 0 20px rgba(249,115,22,0.2)", "0 0 60px rgba(249,115,22,0.5)", "0 0 20px rgba(249,115,22,0.2)"] 
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-[#f97316] rounded-full blur-3xl opacity-20"
              ></motion.div>
              <img 
                src="/logo.png" 
                alt={settings.clubName} 
                className="h-48 w-auto relative z-10 drop-shadow-[0_0_30px_rgba(249,115,22,0.4)]"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">
              {settings.clubName.split(' ')[0]} <span className="text-[#f97316]">{settings.clubName.split(' ')[1] || 'SK'}</span>
            </h1>
            <p className="text-xl md:text-3xl font-black text-white/80 uppercase tracking-[0.3em] italic mb-12">
              Geleceğin Yıldızları Burada Yetişiyor
            </p>
            
            {settings.showHeroButtons !== false && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to="/hakkimizda" className="group relative px-10 py-5 bg-[#f97316] text-white font-black uppercase tracking-widest text-sm rounded-2xl overflow-hidden transition-all hover:scale-105 shadow-2xl shadow-[#f97316]/30">
                  <span className="relative z-10">KULÜBÜMÜZÜ TANIYIN</span>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-10"></div>
                </Link>
                <Link to="/iletisim" className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-white hover:text-[#1a5f6b] transition-all">
                  BİZE KATILIN
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/30"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white/30 rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Next Matches Section */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">SIRADAKİ MAÇLAR</h2>
              <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full mx-auto md:mx-0"></div>
            </div>
            <Link to="/fikstur" className="flex items-center text-[#f97316] font-black uppercase tracking-widest text-sm group">
              TÜM FİKSTÜR <ChevronRight className="ml-2 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="space-y-4">
            {matches.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] sm:rounded-full px-6 py-4 sm:py-3 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
                  {/* Category & Date */}
                  <div className="flex items-center gap-6 sm:w-1/4">
                    <span className="bg-[#f97316] text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shrink-0">
                      {match.category}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-white font-black text-sm tabular-nums leading-none">
                        {match.date ? match.date.split('-').reverse().slice(0, 2).join('.') : '--.--'}
                      </span>
                      <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">{match.time || '--:--'}</span>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8 w-full sm:w-auto">
                    {/* Home Team */}
                    <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">
                      <span className="text-white font-black uppercase tracking-tight text-right text-sm sm:text-lg line-clamp-1">
                        {match.homeTeam}
                      </span>
                      {match.homeLogo && (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl sm:rounded-2xl p-1.5 border border-white/5 shrink-0 flex items-center justify-center">
                          <img src={match.homeLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>

                    {/* VS Badge */}
                    <div className="bg-[#f97316]/10 px-4 py-2 rounded-xl border border-[#f97316]/20">
                      <span className="text-[#f97316] font-black italic text-sm sm:text-base tracking-tighter">VS</span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex items-center justify-start gap-3 sm:gap-4">
                      {match.awayLogo && (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl sm:rounded-2xl p-1.5 border border-white/5 shrink-0 flex items-center justify-center">
                          <img src={match.awayLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <span className="text-white font-black uppercase tracking-tight text-left text-sm sm:text-lg line-clamp-1">
                        {match.awayTeam}
                      </span>
                    </div>
                  </div>

                  {/* Place/Action */}
                  <div className="flex items-center justify-center sm:justify-end sm:w-1/4">
                    {match.location ? (
                      <div className="hidden lg:flex items-center text-white/30 text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        <MapPin className="w-3 h-3 mr-2 text-[#f97316]" /> {match.location.split(' ')[0]}
                      </div>
                    ) : (
                      <div className="w-32 h-1 bg-white/5 rounded-full hidden sm:block"></div>
                    )}
                    <div className="sm:hidden flex items-center text-white/40 text-[9px] font-black uppercase tracking-widest gap-2">
                       <MapPin className="w-3 h-3 text-[#f97316]" /> {match.location || 'Stadyum'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {matches.length === 0 && !loading && (
              <div className="py-20 text-center text-white/20 font-black uppercase tracking-[0.5em]">
                HENÜZ MAÇ PROGRAMI YOK
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-24 px-4 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">SON HABERLER</h2>
              <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full mx-auto md:mx-0"></div>
            </div>
            <Link to="/haberler" className="flex items-center text-[#f97316] font-black uppercase tracking-widest text-sm group">
              TÜM HABERLER <ChevronRight className="ml-2 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {news.map((item, idx) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <Link to={`/haber/${item.id}`}>
                  <div className="relative h-80 rounded-[40px] overflow-hidden mb-6 shadow-2xl">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-500 z-10"></div>
                    <div className="absolute top-6 left-6 z-20">
                      <span className="bg-[#f97316] text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">
                        {item.category}
                      </span>
                    </div>
                    <img 
                      src={item.image || 'https://picsum.photos/seed/news/800/600'} 
                      alt={item.title}
                      className="w-full h-full object-contain bg-gray-900 group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </Link>
                <div className="px-4">
                  <div className="flex items-center text-[#f97316] text-[10px] font-black uppercase tracking-widest mb-3">
                    <Calendar className="w-3 h-3 mr-2" /> {item.date}
                  </div>
                  <Link to={`/haber/${item.id}`}>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4 group-hover:text-[#f97316] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </Link>
                  <p className="text-gray-400 text-sm font-medium line-clamp-2 leading-relaxed mb-6">
                    {item.summary}
                  </p>
                  <Link to={`/haber/${item.id}`} className="inline-flex items-center text-white font-black uppercase tracking-widest text-[10px] group-hover:gap-4 transition-all">
                    DEVAMINI OKU <ArrowRight className="ml-2 w-4 h-4 text-[#f97316]" />
                  </Link>
                </div>
              </motion.article>
            ))}
            {news.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center text-white/20 font-black uppercase tracking-[0.5em]">
                HENÜZ HABER YAYINLANMAMIŞ
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats / Info */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {[
            { label: 'BRANŞ', value: settings.branchesCount || '5+', icon: Trophy, show: settings.showBranchesCount !== false },
            { label: 'SPORCU', value: settings.athletesCount || '200+', icon: Users, show: settings.showAthletesCount !== false },
            { label: 'ANTRENÖR', value: settings.coachesCount || '12', icon: UserCircle, show: settings.showCoachesCount !== false },
            { label: 'HABER', value: settings.newsCount || '150+', icon: Newspaper, show: settings.showNewsCount !== false }
          ].filter(s => s.show).map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-white/10">
                <stat.icon className="w-10 h-10 text-[#f97316]" />
              </div>
              <p className="text-5xl font-black text-white uppercase tracking-tighter italic mb-2">{stat.value}</p>
              <p className="text-[10px] font-black text-[#f97316] uppercase tracking-[0.3em]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
