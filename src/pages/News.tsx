import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, ArrowRight } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  image: string;
  date: string;
  category: string;
  isHidden: boolean;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'news'), 
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NewsItem[];
      setNews(allNews.filter(item => !item.isHidden));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header Section */}
      <div className="bg-[#1a5f6b] text-white py-16 px-4 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-extrabold uppercase tracking-widest mb-4"
        >
          Haberler ve Duyurular
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-300 font-medium"
        >
          Kulübümüzden en son gelişmeler.
        </motion.p>
        <div className="h-1 w-32 bg-[#f97316] mx-auto mt-6 rounded-full"></div>
      </div>

      {/* News Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f97316]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {news.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group flex flex-col h-full"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-900 flex items-center justify-center">
                  <img 
                    src={item.image || 'https://picsum.photos/seed/news/800/600'} 
                    alt={item.title} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-[#f97316] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                    {item.category}
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center text-gray-400 text-xs font-semibold mb-4 uppercase tracking-widest">
                    <Calendar className="h-4 w-4 mr-2 text-[#f97316]" />
                    {item.date}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-[#1a5f6b] transition-colors duration-300 line-clamp-2">
                    {item.title}
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-8 line-clamp-3">
                    {item.summary}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-gray-100">
                    <button className="flex items-center text-[#f97316] font-bold text-sm uppercase tracking-widest hover:text-[#1a5f6b] transition-colors duration-200 group/btn">
                      Devamını Oku 
                      <ArrowRight className="ml-2 h-4 w-4 transform group-hover/btn:translate-x-2 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {news.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                Henüz haber yayınlanmamış.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
