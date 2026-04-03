import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageIcon, X, Maximize2 } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: string;
  isHidden: boolean;
}

const Gallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState('Hepsi');

  useEffect(() => {
    const q = query(
      collection(db, 'gallery'),
      where('isHidden', '==', false),
      orderBy('title', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryItem[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = ['Hepsi', ...Array.from(new Set(items.map(item => item.category)))];
  const filteredItems = filter === 'Hepsi' ? items : items.filter(item => item.category === filter);

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header Section */}
      <div className="bg-[#1a5f6b] text-white py-16 px-4 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-extrabold uppercase tracking-widest mb-4"
        >
          Fotoğraf Galerisi
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-300 font-medium"
        >
          Kulübümüzden kareler.
        </motion.p>
        <div className="h-1 w-32 bg-[#f97316] mx-auto mt-6 rounded-full"></div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-4 mt-12 flex flex-wrap justify-center gap-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              filter === cat 
                ? 'bg-[#f97316] text-white shadow-lg' 
                : 'bg-white text-[#1a5f6b] hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f97316]"></div>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="relative group cursor-pointer rounded-3xl overflow-hidden shadow-lg bg-white"
                onClick={() => setSelectedImage(item.image)}
              >
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <p className="text-[#f97316] text-[10px] font-black uppercase tracking-widest mb-1">{item.category}</p>
                  <h3 className="text-white font-bold text-lg leading-tight">{item.title}</h3>
                  <Maximize2 className="absolute top-4 right-4 text-white/50 group-hover:text-white transition-colors w-5 h-5" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
            Bu kategoride henüz fotoğraf bulunmuyor.
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
            >
              <img 
                src={selectedImage} 
                alt="Full Preview" 
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-[#f97316] transition-colors p-2"
              >
                <X className="w-8 h-8" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
