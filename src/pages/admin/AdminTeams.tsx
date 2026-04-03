import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Users, 
  Trophy, 
  User, 
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

interface TeamItem {
  id: string;
  branchId: string;
  name: string;
  coachName: string;
  logo: string;
  isHidden: boolean;
  order: number;
}

interface BranchItem {
  id: string;
  name: string;
}

const AdminTeams = () => {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TeamItem | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    branchId: '',
    name: '',
    coachName: '',
    logo: '',
    isHidden: false,
    order: 0
  });

  useEffect(() => {
    // Fetch teams
    const qTeams = query(collection(db, 'teams'), orderBy('order', 'asc'));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeamItem[];
      setTeams(teamsData);
    });

    // Fetch branches for selection
    const qBranches = query(collection(db, 'branches'), orderBy('order', 'asc'));
    const unsubscribeBranches = onSnapshot(qBranches, (snapshot) => {
      const branchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as BranchItem[];
      setBranches(branchesData);
      if (branchesData.length > 0 && !formData.branchId) {
        setFormData(prev => ({ ...prev, branchId: branchesData[0].id }));
      }
    });

    return () => {
      unsubscribeTeams();
      unsubscribeBranches();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'teams', editingItem.id), formData);
      } else {
        const nextOrder = teams.length > 0 ? Math.max(...teams.map(t => t.order || 0)) + 1 : 0;
        await addDoc(collection(db, 'teams'), { ...formData, order: nextOrder });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving team:", error);
      alert("Takım kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= teams.length) return;

    const batch = writeBatch(db);
    const item1 = teams[index];
    const item2 = teams[newIndex];

    batch.update(doc(db, 'teams', item1.id), { order: item2.order || 0 });
    batch.update(doc(db, 'teams', item2.id), { order: item1.order || 0 });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error reordering teams:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu takımı silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, 'teams', id));
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const toggleVisibility = async (item: TeamItem) => {
    try {
      await updateDoc(doc(db, 'teams', item.id), {
        isHidden: !item.isHidden
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const openModal = (item: TeamItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        branchId: item.branchId,
        name: item.name,
        coachName: item.coachName,
        logo: item.logo || '',
        isHidden: item.isHidden,
        order: item.order || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        branchId: branches[0]?.id || '',
        name: '',
        coachName: '',
        logo: '',
        isHidden: false,
        order: teams.length
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const getBranchName = (id: string) => {
    return branches.find(b => b.id === id)?.name || 'Bilinmeyen Branş';
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">TAKIM YÖNETİMİ</h1>
          <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full"></div>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#f97316] text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center shadow-2xl shadow-[#f97316]/20 hover:bg-[#1a5f6b] transition-all duration-300 transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5 mr-2" /> YENİ TAKIM EKLE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {teams.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                      disabled={index === teams.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-20"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-16 h-16 bg-[#1a5f6b]/10 rounded-2xl flex items-center justify-center text-[#1a5f6b] overflow-hidden border border-gray-100">
                    {item.logo ? (
                      <img src={item.logo} alt={item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Users className="w-8 h-8" />
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
                <span className="bg-[#1a5f6b]/10 text-[#1a5f6b] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">
                  {getBranchName(item.branchId)}
                </span>
                <h3 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight">{item.name}</h3>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center text-gray-400">
                  <User className="w-4 h-4 mr-2 text-[#f97316]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Antrenör: {item.coachName || 'Atanmamış'}</span>
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
                  {editingItem ? 'TAKIMI DÜZENLE' : 'YENİ TAKIM EKLE'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <Trophy className="w-3 h-3 mr-2 text-[#f97316]" /> Branş (Opsiyonel)
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all appearance-none"
                  >
                    <option value="">Branş Yok (Genel Takım)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <Users className="w-3 h-3 mr-2 text-[#f97316]" /> Takım Logosu (Opsiyonel)
                  </label>
                  <ImageUpload 
                    currentImageUrl={formData.logo}
                    onUploadComplete={(url) => setFormData({...formData, logo: url})}
                    folder="teams"
                    aspectRatio={1}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <Users className="w-3 h-3 mr-2 text-[#f97316]" /> Takım Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="U-11, A Takımı vb..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <User className="w-3 h-3 mr-2 text-[#f97316]" /> Antrenör
                  </label>
                  <input
                    type="text"
                    value={formData.coachName}
                    onChange={(e) => setFormData({...formData, coachName: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="Antrenör ismi..."
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
                    BU TAKIMI GİZLE
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

export default AdminTeams;
