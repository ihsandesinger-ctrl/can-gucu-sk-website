import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, ChevronLeft, Share2, Tag } from 'lucide-react';
import Markdown from 'react-markdown';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image: string;
  date: string;
  category: string;
}

const NewsDetail = () => {
  const { newsId } = useParams();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      if (!newsId) return;
      try {
        const docRef = doc(db, 'news', newsId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNews({ id: docSnap.id, ...docSnap.data() } as NewsItem);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [newsId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tighter mb-4">HABER BULUNAMADI</h2>
        <Link to="/haberler" className="text-[#f97316] font-black uppercase tracking-widest text-sm flex items-center">
          <ChevronLeft className="mr-2" /> HABERLERE DÖN
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[400px] bg-[#1a5f6b] overflow-hidden">
        <img 
          src={news.image || 'https://picsum.photos/seed/news/1920/1080'} 
          alt={news.title}
          className="w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a5f6b] via-transparent to-transparent"></div>
        
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-5xl mx-auto px-4 w-full pb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Link to="/haberler" className="inline-flex items-center text-white/60 hover:text-white font-black uppercase tracking-widest text-xs transition-colors">
                <ChevronLeft className="w-4 h-4 mr-2" /> HABERLERE DÖN
              </Link>
              
              <div className="flex flex-wrap items-center gap-4">
                <span className="bg-[#f97316] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                  {news.category}
                </span>
                <div className="flex items-center text-white/60 text-[10px] font-black uppercase tracking-widest">
                  <Calendar className="w-3 h-3 mr-2" /> {news.date}
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">
                {news.title}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-16 border border-gray-100">
          <div className="flex justify-between items-center mb-12 pb-8 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1a5f6b]/10 rounded-2xl flex items-center justify-center text-[#1a5f6b]">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KATEGORİ</p>
                <p className="text-sm font-black text-[#1a5f6b] uppercase tracking-tight">{news.category}</p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: news.title,
                    url: window.location.href
                  });
                }
              }}
              className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-[#f97316] hover:text-white transition-all duration-300"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <div className="prose prose-lg max-w-none prose-headings:text-[#1a5f6b] prose-headings:font-black prose-headings:uppercase prose-p:text-gray-600 prose-p:font-medium prose-p:leading-relaxed prose-img:rounded-[32px] prose-img:shadow-xl">
            <Markdown>{news.content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
