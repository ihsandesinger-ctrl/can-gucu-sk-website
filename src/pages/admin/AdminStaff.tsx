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
  UserCircle,
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

interface StaffItem {
  id: string;
  name: string;
  role: string;
  image: string;
  isHidden: boolean;
  order: number;
}

const AdminStaff = () => {
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StaffItem | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    image: '',
    isHidden: false,
    order: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'staff'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffItem[];
      setStaff(staffData);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'staff', editingItem.id), formData);
      } else {
        const nextOrder = staff.length > 0 ? Math.max(...staff.map(s => s.order || 0)) + 1 : 0;
        await addDoc(collection(db, 'staff'), { ...formData, order: nextOrder });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("Personel kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= staff.length) return;

    const batch = writeBatch(db);
    const item1 = staff[index];
    const item2 = staff[newIndex];

    batch.update(doc(db, 'staff', item1.id), { order: item2.order || 0 });
    batch.update(doc(db, 'staff', item2.id), { order: item1.order || 0 });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error reordering staff:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu personeli silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch (error) {
      console.error("Error deleting staff:", error);
    }
  };

  const toggleVisibility = async (item: StaffItem) => {
    try {
      await updateDoc(doc(db, 'staff', item.id), {
        isHidden: !item.isHidden
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const openModal = (item: StaffItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        role: item.role,
        image: item.image,
        isHidden: item.isHidden,
        order: item.order || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        role: '',
        image: '',
        isHidden: false,
        order: staff.length
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
          <h1 className="text-5xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">PERSONEL YÖNETİMİ</h1>
          <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full"></div>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#f97316] text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center shadow-2xl shadow-[#f97316]/20 hover:bg-[#1a5f6b] transition-all duration-300 transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5 mr-2" /> YENİ PERSONEL EKLE
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {staff.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white p-6 rounded-[32px] shadow-xl border flex flex-col md:flex-row items-center gap-8 group transition-all duration-300 ${
              item.isHidden ? 'border-red-100 bg-red-50/30 opacity-70' : 'border-gray-100'
            }`}
          >
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
                disabled={index === staff.length - 1}
                className="p-1 hover:bg-gray-200 rounded disabled:opacity-20"
              >
                <MoveDown className="w-4 h-4" />
              </button>
            </div>

            <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex-shrink-0 shadow-inner">
              <img 
                src={item.image || `https://picsum.photos/seed/${item.name}/200/200`} 
                alt={item.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-xl font-black text-[#1a5f6b] uppercase tracking-tight">{item.name}</h3>
              <p className="text-[#f97316] text-sm font-black uppercase tracking-widest mt-1">{item.role}</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => toggleVisibility(item)}
                className={`p-4 rounded-2xl transition-all duration-300 ${
                  item.isHidden ? 'bg-red-500 text-white shadow-red-200' : 'bg-gray-100 text-gray-400 hover:bg-[#1a5f6b] hover:text-white'
                }`}
                title={item.isHidden ? "Göster" : "Gizle"}
              >
                {item.isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button
                onClick={() => openModal(item)}
                className="p-4 bg-gray-100 text-gray-400 rounded-2xl hover:bg-[#f97316] hover:text-white transition-all duration-300"
                title="Düzenle"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-4 bg-gray-100 text-gray-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all duration-300"
                title="Sil"
              >
                <Trash2 className="w-5 h-5" />
              </button>
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
                  {editingItem ? 'PERSONELİ DÜZENLE' : 'YENİ PERSONEL EKLE'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <Type className="w-3 h-3 mr-2 text-[#f97316]" /> Ad Soyad
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="Personel adı..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <UserCircle className="w-3 h-3 mr-2 text-[#f97316]" /> Görev / Rol
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="Başkan, Antrenör, Sekreter..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <ImageIcon className="w-3 h-3 mr-2 text-[#f97316]" /> Fotoğraf URL
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="https://..."
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
                    BU PERSONELİ GİZLE
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

export default AdminStaff;
