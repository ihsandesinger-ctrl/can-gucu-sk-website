import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  Type, 
  Tag,
  Save, 
  X,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase';

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  isHidden: boolean;
  order: number;
}

const AdminGallery = () => {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    category: 'Genel',
    isHidden: false,
    order: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const galleryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryItem[];
      setGallery(galleryData);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'gallery', editingItem.id), formData);
      } else {
        const nextOrder = gallery.length > 0 ? Math.max(...gallery.map(g => g.order || 0)) + 1 : 0;
        await addDoc(collection(db, 'gallery'), { ...formData, order: nextOrder });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving gallery:", error);
      alert("Fotoğraf kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= gallery.length) return;

    const batch = writeBatch(db);
    const item1 = gallery[index];
    const item2 = gallery[newIndex];

    batch.update(doc(db, 'gallery', item1.id), { order: item2.order || 0 });
    batch.update(doc(db, 'gallery', item2.id), { order: item1.order || 0 });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error reordering gallery:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu fotoğrafı silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (error) {
      console.error("Error deleting gallery:", error);
    }
  };

  const toggleVisibility = async (item: GalleryItem) => {
    try {
      await updateDoc(doc(db, 'gallery', item.id), {
        isHidden: !item.isHidden
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const openModal = (item: GalleryItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        imageUrl: item.imageUrl,
        category: item.category,
        isHidden: item.isHidden,
        order: item.order || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        imageUrl: '',
        category: 'Genel',
        isHidden: false,
        order: gallery.length
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">GALERİ YÖNETİMİ</h1>
          <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full"></div>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#f97316] text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center shadow-2xl shadow-[#f97316]/20 hover:bg-[#1a5f6b] transition-all duration-300 transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5 mr-2" /> YENİ FOTOĞRAF EKLE
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {gallery.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-[40px] shadow-xl border overflow-hidden group transition-all duration-300 ${
              item.isHidden ? 'border-red-100 bg-red-50/30 opacity-70' : 'border-gray-100'
            }`}
          >
            <div className="relative h-64 overflow-hidden">
              <img 
                src={item.imageUrl || `https://picsum.photos/seed/${item.id}/800/600`} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <button 
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className="p-2 bg-white/90 backdrop-blur-sm text-[#1a5f6b] rounded-xl shadow-lg disabled:opacity-20 hover:bg-[#f97316] hover:text-white transition-all"
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === gallery.length - 1}
                  className="p-2 bg-white/90 backdrop-blur-sm text-[#1a5f6b] rounded-xl shadow-lg disabled:opacity-20 hover:bg-[#f97316] hover:text-white transition-all"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => toggleVisibility(item)}
                  className={`p-2 rounded-xl backdrop-blur-sm shadow-lg transition-all ${
                    item.isHidden ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:bg-[#1a5f6b] hover:text-white'
                  }`}
                >
                  {item.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-[#1a5f6b]/10 text-[#1a5f6b] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {item.category}
                </span>
              </div>
              <h3 className="text-lg font-black text-[#1a5f6b] uppercase tracking-tight line-clamp-1">{item.title || 'İSİMSİZ FOTOĞRAF'}</h3>
              
              <div className="flex items-center justify-end space-x-2 mt-6 pt-6 border-t border-gray-50">
                <button
                  onClick={() => openModal(item)}
                  className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#f97316] hover:text-white transition-all"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-[#1a5f6b]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">
                  {editingItem ? 'FOTOĞRAFI DÜZENLE' : 'YENİ FOTOĞRAF EKLE'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <Type className="w-3 h-3 mr-2 text-[#f97316]" /> Başlık (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="Fotoğraf başlığı..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <ImageIcon className="w-3 h-3 mr-2 text-[#f97316]" /> Fotoğraf URL
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <Tag className="w-3 h-3 mr-2 text-[#f97316]" /> Kategori
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="Genel, Antrenman, Maç..."
                  />
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
                  <input
                    type="checkbox"
                    id="isHidden"
                    checked={formData.isHidden}
                    onChange={(e) => setFormData({...formData, isHidden: e.target.checked})}
                    className="w-6 h-6 text-[#f97316] border-none rounded-lg focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isHidden" className="text-sm font-black text-[#1a5f6b] uppercase tracking-widest cursor-pointer">
                    BU FOTOĞRAFI GİZLE
                  </label>
                </div>

                <div className="pt-6 border-t border-gray-100 flex gap-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all"
                  >
                    İPTAL
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#f97316] text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-[#1a5f6b] transition-all shadow-2xl shadow-[#f97316]/20 disabled:opacity-50 flex items-center justify-center"
                  >
                    <Save className="w-5 h-5 mr-2" /> {loading ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminGallery;
