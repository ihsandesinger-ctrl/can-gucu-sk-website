import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Calendar, 
  Clock, 
  MapPin, 
  Save, 
  X,
  Users,
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

interface MatchItem {
  id: string;
  teamId: string;
  homeTeam: string;
  homeLogo?: string;
  awayTeam: string;
  awayLogo?: string;
  date: string;
  time: string;
  location: string;
  category: string;
  isHidden: boolean;
  order: number;
}

interface TeamItem {
  id: string;
  name: string;
}

const AdminMatches = () => {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MatchItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');

  const [formData, setFormData] = useState({
    teamId: '',
    homeTeam: '',
    homeLogo: '',
    awayTeam: '',
    awayLogo: '',
    date: '',
    time: '',
    location: '',
    category: '',
    isHidden: false,
    order: 0
  });

  useEffect(() => {
    // Fetch matches
    const qMatches = query(collection(db, 'matches'), orderBy('order', 'asc'));
    const unsubscribeMatches = onSnapshot(qMatches, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MatchItem[];
      setMatches(matchesData);
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

    return () => {
      unsubscribeMatches();
      unsubscribeTeams();
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
        await updateDoc(doc(db, 'matches', editingItem.id), formData);
      } else {
        const nextOrder = matches.length > 0 ? Math.max(...matches.map(m => m.order || 0)) + 1 : 0;
        await addDoc(collection(db, 'matches'), { ...formData, order: nextOrder });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving match:", error);
      alert("Maç kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= filteredMatches.length) return;

    const batch = writeBatch(db);
    const item1 = filteredMatches[index];
    const item2 = filteredMatches[newIndex];

    batch.update(doc(db, 'matches', item1.id), { order: item2.order || 0 });
    batch.update(doc(db, 'matches', item2.id), { order: item1.order || 0 });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error reordering matches:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu maçı silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, 'matches', id));
    } catch (error) {
      console.error("Error deleting match:", error);
    }
  };

  const toggleVisibility = async (item: MatchItem) => {
    try {
      await updateDoc(doc(db, 'matches', item.id), {
        isHidden: !item.isHidden
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const openModal = (item: MatchItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        teamId: item.teamId,
        homeTeam: item.homeTeam,
        homeLogo: item.homeLogo || '',
        awayTeam: item.awayTeam,
        awayLogo: item.awayLogo || '',
        date: item.date,
        time: item.time || '',
        location: item.location || '',
        category: item.category || '',
        isHidden: item.isHidden,
        order: item.order || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        teamId: selectedTeamId !== 'all' ? selectedTeamId : (teams[0]?.id || ''),
        homeTeam: '',
        homeLogo: '',
        awayTeam: '',
        awayLogo: '',
        date: '',
        time: '',
        location: '',
        category: '',
        isHidden: false,
        order: matches.length
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

  const filteredMatches = selectedTeamId === 'all' 
    ? matches 
    : matches.filter(m => m.teamId === selectedTeamId);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">FİKSTÜR YÖNETİMİ</h1>
          <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full"></div>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#f97316] text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center shadow-2xl shadow-[#f97316]/20 hover:bg-[#1a5f6b] transition-all duration-300 transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5 mr-2" /> YENİ MAÇ EKLE
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

      <div className="grid grid-cols-1 gap-6">
        {filteredMatches.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white p-6 rounded-[32px] shadow-xl border flex flex-col md:flex-row items-center justify-between gap-6 group transition-all duration-300 ${
              item.isHidden ? 'border-red-100 bg-red-50/30 opacity-70' : 'border-gray-100'
            }`}
          >
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
                  disabled={index === filteredMatches.length - 1}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-20"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center min-w-[120px]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{getTeamName(item.teamId)}</p>
                <div className="flex items-center justify-center gap-2 text-[#1a5f6b]">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs font-bold">{item.date}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-400 mt-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-bold">{item.time}</span>
                </div>
              </div>
            </div>

            <div className="flex-grow flex items-center justify-center gap-8">
              <div className="text-right flex-1 flex items-center justify-end gap-4">
                <h3 className="text-xl font-black text-[#1a5f6b] uppercase tracking-tight">{item.homeTeam}</h3>
                {item.homeLogo && (
                  <img src={item.homeLogo} alt={item.homeTeam} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="w-12 h-12 bg-[#f97316] text-white rounded-full flex items-center justify-center font-black italic shadow-lg">
                VS
              </div>
              <div className="text-left flex-1 flex items-center justify-start gap-4">
                {item.awayLogo && (
                  <img src={item.awayLogo} alt={item.awayTeam} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                )}
                <h3 className="text-xl font-black text-[#1a5f6b] uppercase tracking-tight">{item.awayTeam}</h3>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden lg:block text-right">
                <div className="flex items-center justify-end gap-2 text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{item.location}</span>
                </div>
                <p className="text-[9px] font-black text-[#f97316] uppercase tracking-[0.2em] mt-1">{item.category}</p>
              </div>

              <div className="flex items-center space-x-2">
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
              className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">
                  {editingItem ? 'MAÇI DÜZENLE' : 'YENİ MAÇ EKLE'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Ev Sahibi Takım</label>
                    <input
                      type="text"
                      required
                      value={formData.homeTeam}
                      onChange={(e) => setFormData({...formData, homeTeam: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Örn: Çangücü SK"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Ev Sahibi Logo URL (Opsiyonel)</label>
                    <input
                      type="text"
                      value={formData.homeLogo}
                      onChange={(e) => setFormData({...formData, homeLogo: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Örn: https://.../logo.png"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Rakip Takım</label>
                    <input
                      type="text"
                      required
                      value={formData.awayTeam}
                      onChange={(e) => setFormData({...formData, awayTeam: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Örn: Rakip Takım"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Rakip Logo URL (Opsiyonel)</label>
                    <input
                      type="text"
                      value={formData.awayLogo}
                      onChange={(e) => setFormData({...formData, awayLogo: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Örn: https://.../logo.png"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                      <Calendar className="w-3 h-3 mr-2 text-[#f97316]" /> Tarih
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Örn: 15 Nisan 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                      <Clock className="w-3 h-3 mr-2 text-[#f97316]" /> Saat (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Örn: 14:00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                      <MapPin className="w-3 h-3 mr-2 text-[#f97316]" /> Saha / Konum
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Örn: Çangücü Tesisleri"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Kategori / Lig</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                      placeholder="Örn: U-11 Ligi 4. Hafta"
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
                    BU MAÇI GİZLE
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

export default AdminMatches;
