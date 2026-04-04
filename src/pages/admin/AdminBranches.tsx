import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Trophy, 
  User, 
  Phone, 
  AlignLeft, 
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
import ImageUpload from '../../components/admin/ImageUpload';

interface BranchItem {
  id: string;
  name: string;
  description: string;
  coachName: string;
  coachImage: string;
  coachContact: string;
  isHidden: boolean;
  showInPanel: boolean;
  order: number;
}

const AdminBranches = () => {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BranchItem | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coachName: '',
    coachImage: '',
    coachContact: '',
    isHidden: false,
    showInPanel: true,
    order: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'branches'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const branchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BranchItem[];
      setBranches(branchesData.sort((a, b) => (a.order || 0) - (b.order || 0)));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'branches', editingItem.id), formData);
      } else {
        const nextOrder = branches.length > 0 ? Math.max(...branches.map(b => b.order || 0)) + 1 : 0;
        await addDoc(collection(db, 'branches'), { ...formData, order: nextOrder });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving branch:", error);
      alert("Branş kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= branches.length) return;

    const batch = writeBatch(db);
    const item1 = branches[index];
    const item2 = branches[newIndex];

    batch.update(doc(db, 'branches', item1.id), { order: item2.order || 0 });
    batch.update(doc(db, 'branches', item2.id), { order: item1.order || 0 });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error reordering branches:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu branşı silmek istediğinizden emin misiniz? Bu branşa bağlı takımlar etkilenebilir.")) return;
    try {
      await deleteDoc(doc(db, 'branches', id));
    } catch (error) {
      console.error("Error deleting branch:", error);
    }
  };

  const toggleVisibility = async (item: BranchItem) => {
    try {
      await updateDoc(doc(db, 'branches', item.id), {
        isHidden: !item.isHidden
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const openModal = (item: BranchItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        coachName: item.coachName,
        coachImage: item.coachImage || '',
        coachContact: item.coachContact,
        isHidden: item.isHidden,
        showInPanel: item.showInPanel !== false,
        order: item.order || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        coachName: '',
        coachImage: '',
        coachContact: '',
        isHidden: false,
        showInPanel: true,
        order: branches.length
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
          <h1 className="text-5xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">BRANŞ YÖNETİMİ</h1>
          <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full"></div>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#f97316] text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center shadow-2xl shadow-[#f97316]/20 hover:bg-[#1a5f6b] transition-all duration-300 transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5 mr-2" /> YENİ BRANŞ EKLE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {branches.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white p-8 rounded-[40px] shadow-xl border flex flex-col justify-between group transition-all duration-300 ${
              item.isHidden ? 'border-red-100 bg-red-50/30 opacity-70' : 'border-gray-100'
            }`}
          >
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-20"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === branches.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-20"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-16 h-16 bg-[#1a5f6b]/10 rounded-2xl flex items-center justify-center text-[#1a5f6b] overflow-hidden border border-gray-100">
                    {item.coachImage ? (
                      <img src={item.coachImage} alt={item.coachName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Trophy className="w-8 h-8" />
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleVisibility(item)}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      item.isHidden ? 'bg-red-500 text-white shadow-red-200' : 'bg-gray-100 text-gray-400 hover:bg-[#1a5f6b] hover:text-white'
                    }`}
                  >
                    {item.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openModal(item)}
                    className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-[#f97316] hover:text-white transition-all duration-300"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight mb-2">{item.name}</h3>
                <p className="text-gray-500 text-sm font-medium line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div className="flex items-center text-gray-400">
                  <User className="w-4 h-4 mr-2 text-[#f97316]" />
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">Antrenör: {item.coachName || 'Atanmamış'}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Phone className="w-4 h-4 mr-2 text-[#f97316]" />
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">{item.coachContact || 'Yok'}</span>
                </div>
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
                  {editingItem ? 'BRANŞI DÜZENLE' : 'YENİ BRANŞ EKLE'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <Trophy className="w-3 h-3 mr-2 text-[#f97316]" /> Branş Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="Basketbol, Voleybol vb..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <AlignLeft className="w-3 h-3 mr-2 text-[#f97316]" /> Açıklama
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="Branş hakkında kısa bilgi..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                      <User className="w-3 h-3 mr-2 text-[#f97316]" /> Antrenör Adı
                    </label>
                    <input
                      type="text"
                      value={formData.coachName}
                      onChange={(e) => setFormData({...formData, coachName: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Antrenör ismi..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                      <Phone className="w-3 h-3 mr-2 text-[#f97316]" /> İletişim
                    </label>
                    <input
                      type="text"
                      value={formData.coachContact}
                      onChange={(e) => setFormData({...formData, coachContact: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Telefon veya E-posta..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <User className="w-3 h-3 mr-2 text-[#f97316]" /> Antrenör Fotoğrafı (Opsiyonel)
                  </label>
                  <ImageUpload 
                    currentImageUrl={formData.coachImage}
                    onUploadComplete={(url) => setFormData({...formData, coachImage: url})}
                    folder="coaches"
                    aspectRatio={1}
                  />
                </div>

                <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      id="isHidden"
                      checked={formData.isHidden}
                      onChange={(e) => setFormData({...formData, isHidden: e.target.checked})}
                      className="w-6 h-6 text-[#f97316] border-none rounded-lg focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="isHidden" className="text-sm font-black text-[#1a5f6b] uppercase tracking-widest cursor-pointer">
                      BU BRANŞI SİTEDEN GİZLE
                    </label>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      id="showInPanel"
                      checked={formData.showInPanel}
                      onChange={(e) => setFormData({...formData, showInPanel: e.target.checked})}
                      className="w-6 h-6 text-[#f97316] border-none rounded-lg focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="showInPanel" className="text-sm font-black text-[#1a5f6b] uppercase tracking-widest cursor-pointer">
                      MENÜDE GÖSTER
                    </label>
                  </div>
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

export default AdminBranches;
