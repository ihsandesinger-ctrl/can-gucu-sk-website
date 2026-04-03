import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  UserCircle, 
  Users, 
  Hash, 
  MapPin, 
  Save, 
  X,
  MoveUp,
  MoveDown,
  Trophy
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

interface PlayerItem {
  id: string;
  teamId: string;
  branchId?: string;
  name: string;
  number: string;
  position: string;
  image: string;
  isHidden: boolean;
  order: number;
}

interface TeamItem {
  id: string;
  name: string;
}

interface BranchItem {
  id: string;
  name: string;
}

const AdminPlayers = () => {
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlayerItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');

  const [formData, setFormData] = useState({
    teamId: '',
    branchId: '',
    name: '',
    number: '',
    position: '',
    image: '',
    isHidden: false,
    order: 0
  });

  useEffect(() => {
    // Fetch players
    const qPlayers = query(collection(db, 'players'), orderBy('order', 'asc'));
    const unsubscribePlayers = onSnapshot(qPlayers, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlayerItem[];
      setPlayers(playersData);
    });

    // Fetch teams for selection
    const qTeams = query(collection(db, 'teams'), orderBy('order', 'asc'));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as TeamItem[];
      setTeams(teamsData);
      if (teamsData.length > 0 && !formData.teamId) {
        setFormData(prev => ({ ...prev, teamId: teamsData[0].id }));
      }
    });

    // Fetch branches for selection
    const qBranches = query(collection(db, 'branches'), orderBy('order', 'asc'));
    const unsubscribeBranches = onSnapshot(qBranches, (snapshot) => {
      const branchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as BranchItem[];
      setBranches(branchesData);
    });

    return () => {
      unsubscribePlayers();
      unsubscribeTeams();
      unsubscribeBranches();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamId) {
      alert("Lütfen bir takım seçin.");
      return;
    }
    setLoading(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'players', editingItem.id), formData);
      } else {
        const nextOrder = players.length > 0 ? Math.max(...players.map(p => p.order || 0)) + 1 : 0;
        await addDoc(collection(db, 'players'), { ...formData, order: nextOrder });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving player:", error);
      alert("Oyuncu kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= players.length) return;

    const batch = writeBatch(db);
    const item1 = players[index];
    const item2 = players[newIndex];

    batch.update(doc(db, 'players', item1.id), { order: item2.order || 0 });
    batch.update(doc(db, 'players', item2.id), { order: item1.order || 0 });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error reordering players:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu oyuncuyu silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, 'players', id));
    } catch (error) {
      console.error("Error deleting player:", error);
    }
  };

  const toggleVisibility = async (item: PlayerItem) => {
    try {
      await updateDoc(doc(db, 'players', item.id), {
        isHidden: !item.isHidden
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const openModal = (item: PlayerItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        teamId: item.teamId,
        branchId: item.branchId || '',
        name: item.name,
        number: item.number,
        position: item.position,
        image: item.image || '',
        isHidden: item.isHidden,
        order: item.order || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        teamId: teams[0]?.id || '',
        branchId: '',
        name: '',
        number: '',
        position: '',
        image: '',
        isHidden: false,
        order: players.length
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const getTeamName = (id: string) => {
    return teams.find(t => t.id === id)?.name || 'Bilinmeyen Takım';
  };

  const filteredPlayers = selectedTeamId === 'all' 
    ? players 
    : players.filter(p => p.teamId === selectedTeamId);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">OYUNCU YÖNETİMİ</h1>
          <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full"></div>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#f97316] text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center shadow-2xl shadow-[#f97316]/20 hover:bg-[#1a5f6b] transition-all duration-300 transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5 mr-2" /> YENİ OYUNCU EKLE
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100 flex items-center gap-4">
        <Users className="w-5 h-5 text-[#f97316]" />
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="bg-transparent border-none font-black text-[#1a5f6b] uppercase tracking-widest text-xs focus:ring-0 cursor-pointer flex-grow"
        >
          <option value="all">TÜM TAKIMLAR</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredPlayers.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className={`bg-white p-6 rounded-[32px] shadow-xl border flex flex-col items-center text-center group transition-all duration-300 ${
              item.isHidden ? 'border-red-100 bg-red-50/30 opacity-70' : 'border-gray-100'
            }`}
          >
            <div className="absolute top-4 left-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="p-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-20"
              >
                <MoveUp className="w-4 h-4" />
              </button>
              <button 
                onClick={() => moveItem(index, 'down')}
                disabled={index === players.length - 1}
                className="p-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-20"
              >
                <MoveDown className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-6">
              <div className="w-24 h-24 bg-[#1a5f6b]/10 rounded-full flex items-center justify-center text-[#1a5f6b] overflow-hidden border-2 border-gray-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserCircle className="w-12 h-12" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#f97316] text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg">
                {item.number || '0'}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-black text-[#1a5f6b] uppercase tracking-tight">{item.name}</h3>
              <p className="text-[#f97316] text-[10px] font-black uppercase tracking-[0.2em] mt-1">{item.position || 'MEVKİ BELİRTİLMEMİŞ'}</p>
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-2">{getTeamName(item.teamId)}</p>
            </div>

            <div className="flex items-center space-x-2 pt-6 border-t border-gray-100 w-full justify-center">
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
                  {editingItem ? 'OYUNCUYU DÜZENLE' : 'YENİ OYUNCU EKLE'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                      <Users className="w-3 h-3 mr-2 text-[#f97316]" /> Takım Seçin
                    </label>
                    <select
                      required
                      value={formData.teamId}
                      onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all appearance-none"
                    >
                      <option value="" disabled>Takım Seçin...</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                      <Trophy className="w-3 h-3 mr-2 text-[#f97316]" /> Branş (Opsiyonel)
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all appearance-none"
                    >
                      <option value="">Branş Yok</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <UserCircle className="w-3 h-3 mr-2 text-[#f97316]" /> Oyuncu Fotoğrafı
                  </label>
                  <ImageUpload 
                    currentImageUrl={formData.image}
                    onUploadComplete={(url) => setFormData({...formData, image: url})}
                    folder="players"
                    aspectRatio={1}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <UserCircle className="w-3 h-3 mr-2 text-[#f97316]" /> Oyuncu Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="Oyuncu adı ve soyadı..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                      <Hash className="w-3 h-3 mr-2 text-[#f97316]" /> Forma Numarası
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Örn: 10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                      <MapPin className="w-3 h-3 mr-2 text-[#f97316]" /> Mevki
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Örn: Forvet, Kaleci..."
                    />
                  </div>
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
                    BU OYUNCUYU GİZLE
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

export default AdminPlayers;
