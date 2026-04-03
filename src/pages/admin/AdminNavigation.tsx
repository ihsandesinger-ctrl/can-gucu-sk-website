import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  MoveUp, 
  MoveDown, 
  Save, 
  X, 
  Link as LinkIcon, 
  Type, 
  List,
  ChevronDown
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
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

interface NavItem {
  id: string;
  title: string;
  path: string;
  order: number;
  isHidden: boolean;
  isDropdown: boolean;
  dropdownType?: 'static' | 'branches' | 'teams' | 'fixtures';
}

const AdminNavigation = () => {
  const [navigation, setNavigation] = useState<NavItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    path: string;
    order: number;
    isHidden: boolean;
    isDropdown: boolean;
    dropdownType: 'static' | 'branches' | 'teams' | 'fixtures';
  }>({
    title: '',
    path: '',
    order: 0,
    isHidden: false,
    isDropdown: false,
    dropdownType: 'static'
  });

  useEffect(() => {
    const navRef = doc(db, 'navigation', 'main');
    const unsubscribe = onSnapshot(navRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNavigation(data.items || []);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let newNav = [...navigation];
      if (editingItem) {
        newNav = newNav.map(item => item.id === editingItem.id ? { ...item, ...formData } : item);
      } else {
        const nextOrder = navigation.length > 0 ? Math.max(...navigation.map(n => n.order)) + 1 : 0;
        const newItem = { id: Date.now().toString(), ...formData, order: nextOrder };
        newNav.push(newItem);
      }
      
      await setDoc(doc(db, 'navigation', 'main'), { items: newNav });
      closeModal();
    } catch (error) {
      console.error("Error saving navigation:", error);
      alert("Menü öğesi kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu menü öğesini silmek istediğinizden emin misiniz?")) return;
    try {
      const newNav = navigation.filter(item => item.id !== id);
      await setDoc(doc(db, 'navigation', 'main'), { items: newNav });
    } catch (error) {
      console.error("Error deleting navigation:", error);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= navigation.length) return;

    const newNav = [...navigation];
    const item1 = { ...newNav[index] };
    const item2 = { ...newNav[newIndex] };

    // Swap positions
    const tempOrder = item1.order;
    item1.order = item2.order;
    item2.order = tempOrder;

    newNav[index] = item2;
    newNav[newIndex] = item1;

    // Sort by order to keep UI consistent
    newNav.sort((a, b) => a.order - b.order);

    try {
      await setDoc(doc(db, 'navigation', 'main'), { items: newNav });
    } catch (error) {
      console.error("Error reordering navigation:", error);
    }
  };

  const toggleVisibility = async (item: NavItem) => {
    try {
      const newNav = navigation.map(n => 
        n.id === item.id ? { ...n, isHidden: !n.isHidden } : n
      );
      await setDoc(doc(db, 'navigation', 'main'), { items: newNav });
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const restoreDefaults = async () => {
    if (!window.confirm("Varsayılan menü yapısını geri yüklemek istediğinizden emin misiniz? Mevcut menü silinecektir.")) return;
    
    const defaults = [
      { id: '1', title: 'Ana Sayfa', path: '/', order: 0, isHidden: false, isDropdown: false },
      { id: '2', title: 'Haberler', path: '/haberler', order: 1, isHidden: false, isDropdown: false },
      { id: '3', title: 'Branşlarımız', path: '#', order: 2, isHidden: false, isDropdown: true, dropdownType: 'branches' },
      { id: '4', title: 'Takımlarımız', path: '#', order: 3, isHidden: false, isDropdown: true, dropdownType: 'teams' },
      { id: '5', title: 'FİKSTÜR', path: '#', order: 4, isHidden: false, isDropdown: true, dropdownType: 'fixtures' },
      { id: '6', title: 'Galeri', path: '/galeri', order: 5, isHidden: false, isDropdown: false },
      { id: '7', title: 'Hakkımızda', path: '/hakkimizda', order: 6, isHidden: false, isDropdown: false },
      { id: '8', title: 'İletişim', path: '/iletisim', order: 7, isHidden: false, isDropdown: false },
    ];

    try {
      await setDoc(doc(db, 'navigation', 'main'), { items: defaults });
    } catch (error) {
      console.error("Error restoring defaults:", error);
    }
  };

  const openModal = (item: NavItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        path: item.path,
        order: item.order,
        isHidden: item.isHidden,
        isDropdown: item.isDropdown,
        dropdownType: item.dropdownType || 'static'
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        path: '',
        order: navigation.length,
        isHidden: false,
        isDropdown: false,
        dropdownType: 'static'
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
          <h1 className="text-5xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">MENÜ YÖNETİMİ</h1>
          <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full"></div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={restoreDefaults}
            className="bg-gray-100 text-gray-500 px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all"
          >
            VARSAYILANLARI YÜKLE
          </button>
          <button
            onClick={() => openModal()}
            className="bg-[#f97316] text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center shadow-2xl shadow-[#f97316]/20 hover:bg-[#1a5f6b] transition-all duration-300 transform hover:-translate-y-1"
          >
            <Plus className="w-5 h-5 mr-2" /> YENİ ÖĞE EKLE
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {navigation.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 flex items-center gap-6 group transition-all duration-300 ${
                item.isHidden ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50/50'
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
                  disabled={index === navigation.length - 1}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-20"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
              </div>

              <div className="w-12 h-12 bg-[#1a5f6b]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                {item.isDropdown ? <List className="w-6 h-6 text-[#1a5f6b]" /> : <LinkIcon className="w-6 h-6 text-[#1a5f6b]" />}
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-[#1a5f6b] uppercase tracking-tight">{item.title}</h3>
                  {item.isDropdown && (
                    <span className="bg-[#f97316]/10 text-[#f97316] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                      AÇILIR MENÜ: {item.dropdownType}
                    </span>
                  )}
                  {item.isHidden && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                      GİZLİ
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs font-bold tracking-widest mt-1">{item.path}</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleVisibility(item)}
                  className={`p-3 rounded-xl transition-all ${
                    item.isHidden ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-[#1a5f6b] hover:text-white'
                  }`}
                >
                  {item.isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => openModal(item)}
                  className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-[#f97316] hover:text-white transition-all"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
          {navigation.length === 0 && (
            <div className="py-20 text-center text-gray-400 font-black uppercase tracking-widest">
              Menü henüz oluşturulmamış. Varsayılanları yükleyerek başlayabilirsiniz.
            </div>
          )}
        </div>
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
                  {editingItem ? 'ÖĞEYİ DÜZENLE' : 'YENİ ÖĞE EKLE'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <Type className="w-3 h-3 mr-2 text-[#f97316]" /> Başlık
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="Menüde görünecek isim..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                    <LinkIcon className="w-3 h-3 mr-2 text-[#f97316]" /> Yol (Path)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.path}
                    onChange={(e) => setFormData({...formData, path: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    placeholder="/sayfa-adi veya #"
                  />
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
                  <input
                    type="checkbox"
                    id="isDropdown"
                    checked={formData.isDropdown}
                    onChange={(e) => setFormData({...formData, isDropdown: e.target.checked})}
                    className="w-6 h-6 text-[#f97316] border-none rounded-lg focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isDropdown" className="text-sm font-black text-[#1a5f6b] uppercase tracking-widest cursor-pointer">
                    BU BİR AÇILIR MENÜDÜR
                  </label>
                </div>

                {formData.isDropdown && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                      <ChevronDown className="w-3 h-3 mr-2 text-[#f97316]" /> İçerik Tipi
                    </label>
                    <select
                      value={formData.dropdownType}
                      onChange={(e) => setFormData({...formData, dropdownType: e.target.value as any})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                    >
                      <option value="static">Sabit (Yakında)</option>
                      <option value="branches">Branşlar (Otomatik)</option>
                      <option value="teams">Takımlar (Otomatik)</option>
                      <option value="fixtures">Fikstürler (Otomatik)</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
                  <input
                    type="checkbox"
                    id="isHidden"
                    checked={formData.isHidden}
                    onChange={(e) => setFormData({...formData, isHidden: e.target.checked})}
                    className="w-6 h-6 text-[#f97316] border-none rounded-lg focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isHidden" className="text-sm font-black text-[#1a5f6b] uppercase tracking-widest cursor-pointer">
                    BU ÖĞEYİ GİZLE
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

export default AdminNavigation;
