import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { DynamicPage as DynamicPageType, Player } from '../types';
import { motion } from 'motion/react';
import { Calendar, User, Users, Info } from 'lucide-react';
import { getPagePlayers } from '../firebaseService';

interface DynamicPageProps {
  pages?: DynamicPageType[];
}

const DynamicPage: React.FC<DynamicPageProps> = ({ pages = [] }) => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<DynamicPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    
    // Find page in the passed props first
    const foundPage = pages.find(p => p.slug === slug);
    if (foundPage) {
      setPage(foundPage);
      setLoading(false);
    } else {
      // Fallback to direct fetch if not found in props (unlikely but safe)
      const fetchPage = async () => {
        try {
          const q = query(collection(db, 'pages'), where('slug', '==', slug));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            setPage({ id: doc.id, ...doc.data() } as DynamicPageType);
          }
        } catch (error) {
          console.error('Sayfa yüklenirken hata oluştu:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPage();
    }
  }, [slug, pages]);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (page && (!page.players || page.players.length === 0)) {
        setLoadingPlayers(true);
        const players = await getPagePlayers(page.id);
        setLocalPlayers(players as unknown as Player[]);
        setLoadingPlayers(false);
      }
    };
    fetchPlayers();
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Sayfa Bulunamadı</h1>
        <p className="text-slate-600">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      </div>
    );
  }

  const displayPlayers = page.players && page.players.length > 0 ? page.players : localPlayers;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[60vh] overflow-hidden bg-slate-950">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-0"></div>
        {/* Main image - object-contain to support transparent images and avoid cropping */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <img 
            src={page.heroImage || 'https://picsum.photos/seed/sports/1920/1080'} 
            alt={page.title}
            className="w-full h-full object-contain p-4 md:p-8"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white text-center px-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
          >
            {page.title}
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Info className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Hakkında</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">
                {page.content}
              </div>
            </section>

            {/* Coach Section */}
            {page.coach && (page.coach.name || page.coach.imageUrl) && (
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Antrenör</h2>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                    <img
                      src={page.coach.imageUrl || 'https://picsum.photos/seed/coach/400/400'}
                      alt={page.coach.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{page.coach.name}</h3>
                    <p className="text-emerald-600 font-medium text-lg">{page.coach.role}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Players Section */}
            {(displayPlayers.length > 0 || loadingPlayers) && (
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Sporcular</h2>
                </div>
                {loadingPlayers ? (
                  <div className="text-center py-10 text-gray-500">Sporcular yükleniyor...</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {displayPlayers.map((player) => (
                      <motion.div
                        key={player.id}
                        whileHover={{ y: -5 }}
                        className="group"
                      >
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm mb-3">
                          <img
                            src={player.imageUrl || 'https://picsum.photos/seed/player/300/400'}
                            alt={player.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-emerald-600">
                            #{player.number}
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-800 text-center">{player.name}</h4>
                        <p className="text-xs text-slate-500 text-center">{player.position}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar - Announcements */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Duyurular</h2>
              </div>
              
              {page.announcements && page.announcements.length > 0 ? (
                <div className="space-y-6">
                  {page.announcements.map((ann, idx) => (
                    <div key={idx} className="border-l-4 border-emerald-500 pl-4 py-1">
                      <p className="text-xs text-slate-400 mb-1">{ann.date}</p>
                      <h4 className="font-bold text-slate-800 mb-2">{ann.title}</h4>
                      <p className="text-sm text-slate-600 line-clamp-3">{ann.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8 italic">
                  Henüz bir duyuru bulunmuyor.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;
