import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  Facebook, 
  Twitter,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { doc, onSnapshot, setDoc, writeBatch, collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase';
import ImageUpload from '../../components/admin/ImageUpload';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reseting, setReseting] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'factory'>('general');
  const [formData, setFormData] = useState({
    clubName: 'Çangücü SK',
    clubLogo: '/logo.png',
    email: 'info@cangucusk.com',
    phone: '+90 555 555 55 55',
    address: 'Çan, Çanakkale',
    instagram: '',
    facebook: '',
    twitter: '',
    aboutText: 'Çangücü SK, Çan\'ın en köklü spor kulüplerinden biridir.',
    missionText: 'Sporun birleştirici gücüyle, Çan gençliğini sağlıklı, ahlaklı ve başarılı bireyler olarak yetiştirmek.',
    visionText: 'Bölgemizin en başarılı ve örnek spor kulübü olarak, ulusal düzeyde sporcular yetiştiren bir marka haline gelmek.',
    maintenanceMode: false,
    branchesCount: '5+',
    athletesCount: '200+',
    coachesCount: '12',
    newsCount: '150+',
    showBranchesCount: true,
    showAthletesCount: true,
    showCoachesCount: true,
    showNewsCount: true,
    heroBgImage: 'https://picsum.photos/seed/stadium/1920/1080',
    showHeroButtons: true
  });

  useEffect(() => {
    const docRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setFormData(prev => ({ ...prev, ...docSnap.data() }));
      }
      setLoading(false);
    }, (error) => {
      console.error("Error syncing settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetDatabase = async () => {
    const confirm1 = window.confirm("DİKKAT! Tüm haberler, takımlar, oyuncular, branşlar, personel ve galeri verileri KALICI OLARAK SİLİNECEKTİR. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?");
    if (!confirm1) return;

    const confirm2 = window.confirm("SON UYARI! Tüm verileriniz tamamen silinecektir. Gerçekten devam etmek istiyor musunuz?");
    if (!confirm2) return;
    
    setReseting(true);
    try {
      const collectionsToClear = ['news', 'teams', 'players', 'branches', 'gallery', 'staff', 'matches'];
      
      for (const collName of collectionsToClear) {
        const q = query(collection(db, collName));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
      
      alert("Veritabanı başarıyla sıfırlandı. Şimdi yeni verilerinizi ekleyebilirsiniz.");
    } catch (error: any) {
      console.error("Error resetting database:", error);
      alert("Sıfırlama sırasında bir hata oluştu: " + error.message);
    } finally {
      setReseting(false);
    }
  };

  const resetNavigation = async () => {
    const confirm1 = window.confirm("Menü yapısını varsayılana döndürmek istiyor musunuz?");
    if (!confirm1) return;

    const confirm2 = window.confirm("Menü yapısı sıfırlanacaktır. Emin misiniz?");
    if (!confirm2) return;
    
    setSaving(true);
    try {
      const navRef = doc(db, 'navigation', 'main');
      const defaultNav = [
        { id: '1', title: 'ANA SAYFA', path: '/', isHidden: false, order: 1 },
        { id: '2', title: 'HABERLER', path: '/haberler', isHidden: false, order: 2 },
        { id: '3', title: 'BRANŞLARIMIZ', path: '#', isHidden: false, order: 3, isDropdown: true, dropdownType: 'branches' },
        { id: '4', title: 'TAKIMLARIMIZ', path: '#', isHidden: false, order: 4, isDropdown: true, dropdownType: 'teams' },
        { id: '5', title: 'FİKSTÜR', path: '#', isHidden: false, order: 5, isDropdown: true, dropdownType: 'fixtures' },
        { id: '6', title: 'GALERİ', path: '/galeri', isHidden: false, order: 6 },
        { id: '7', title: 'HAKKIMIZDA', path: '/hakkimizda', isHidden: false, order: 7 },
        { id: '8', title: 'İLETİŞİM', path: '/iletisim', isHidden: false, order: 8 }
      ];
      await setDoc(navRef, { items: defaultNav });
      alert("Menü yapısı başarıyla sıfırlandı.");
    } catch (error: any) {
      console.error("Error resetting navigation:", error);
      alert("Hata: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'global');
      await setDoc(docRef, formData, { merge: true });
      alert("Ayarlar başarıyla kaydedildi.");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      let errorMsg = "Ayarlar kaydedilirken bir hata oluştu.";
      if (error.code === 'permission-denied') errorMsg = "Yazma yetkiniz yok! Lütfen giriş yaptığınızdan emin olun.";
      alert(errorMsg + "\nDetay: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f97316]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">KULÜP AYARLARI</h1>
          <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full"></div>
        </div>
        
        <div className="flex bg-white p-2 rounded-3xl shadow-xl border border-gray-100">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
              activeTab === 'general' ? 'bg-[#1a5f6b] text-white shadow-lg' : 'text-gray-400 hover:text-[#1a5f6b]'
            }`}
          >
            GENEL AYARLAR
          </button>
          <button
            onClick={() => setActiveTab('factory')}
            className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
              activeTab === 'factory' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-red-600'
            }`}
          >
            FABRİKA AYARLARI
          </button>
        </div>
      </div>

      {activeTab === 'general' ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[48px] shadow-2xl border border-gray-100"
          >
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-16 h-16 bg-[#1a5f6b]/10 rounded-3xl flex items-center justify-center">
                <Globe className="w-8 h-8 text-[#1a5f6b]" />
              </div>
              <h2 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight italic">GENEL BİLGİLER</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Kulüp Adı</label>
                <input
                  type="text"
                  value={formData.clubName}
                  onChange={(e) => setFormData({...formData, clubName: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Kulüp Logosu (PNG Önerilir)</label>
                <ImageUpload 
                  currentImageUrl={formData.clubLogo}
                  onUploadComplete={(url) => setFormData({...formData, clubLogo: url})}
                  folder="settings"
                  aspectRatio={1}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Hakkımızda Metni</label>
                <textarea
                  rows={4}
                  value={formData.aboutText}
                  onChange={(e) => setFormData({...formData, aboutText: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Misyonumuz</label>
                <textarea
                  rows={4}
                  value={formData.missionText}
                  onChange={(e) => setFormData({...formData, missionText: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Vizyonumuz</label>
                <textarea
                  rows={4}
                  value={formData.visionText}
                  onChange={(e) => setFormData({...formData, visionText: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                />
              </div>
            </div>
          </motion.div>

          {/* Hero & Background Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white p-10 rounded-[48px] shadow-2xl border border-gray-100"
          >
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight italic">ANA SAYFA GÖRÜNÜMÜ</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Ana Sayfa Arka Plan Fotoğrafı</label>
                <div className="relative">
                  <ImageUpload 
                    currentImageUrl={formData.heroBgImage}
                    onUploadComplete={(url) => setFormData({...formData, heroBgImage: url})}
                    folder="hero"
                    aspectRatio={16/9}
                  />
                  {formData.heroBgImage && (
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, heroBgImage: ''})}
                      className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-2xl shadow-xl hover:bg-red-600 transition-all z-10 flex items-center space-x-2 group"
                      title="Fotoğrafı Kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block">FOTOĞRAFI KALDIR</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 font-bold italic mt-2">Not: Fotoğraf yüklenmezse kulüp renklerinde sade bir geçiş gösterilir.</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-3xl">
                  <input
                    type="checkbox"
                    id="showHeroButtons"
                    checked={formData.showHeroButtons}
                    onChange={(e) => setFormData({...formData, showHeroButtons: e.target.checked})}
                    className="w-6 h-6 text-[#f97316] border-none rounded-lg focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="showHeroButtons" className="text-sm font-black text-[#1a5f6b] uppercase tracking-widest cursor-pointer">
                    ANA SAYFA BUTONLARINI GÖSTER
                  </label>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Statistics Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-10 rounded-[48px] shadow-2xl border border-gray-100"
          >
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center">
                <SettingsIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight italic">İSTATİSTİKLER (ANA SAYFA)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Branş Sayısı</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, showBranchesCount: !formData.showBranchesCount})}
                    className={`p-1 rounded-lg transition-colors ${formData.showBranchesCount ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'}`}
                    title={formData.showBranchesCount ? "Sitede Görünür" : "Sitede Gizli"}
                  >
                    {formData.showBranchesCount ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.branchesCount}
                  onChange={(e) => setFormData({...formData, branchesCount: e.target.value})}
                  className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all ${!formData.showBranchesCount && 'opacity-50'}`}
                  placeholder="Örn: 5+"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sporcu Sayısı</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, showAthletesCount: !formData.showAthletesCount})}
                    className={`p-1 rounded-lg transition-colors ${formData.showAthletesCount ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'}`}
                    title={formData.showAthletesCount ? "Sitede Görünür" : "Sitede Gizli"}
                  >
                    {formData.showAthletesCount ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.athletesCount}
                  onChange={(e) => setFormData({...formData, athletesCount: e.target.value})}
                  className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all ${!formData.showAthletesCount && 'opacity-50'}`}
                  placeholder="Örn: 200+"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Antrenör Sayısı</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, showCoachesCount: !formData.showCoachesCount})}
                    className={`p-1 rounded-lg transition-colors ${formData.showCoachesCount ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'}`}
                    title={formData.showCoachesCount ? "Sitede Görünür" : "Sitede Gizli"}
                  >
                    {formData.showCoachesCount ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.coachesCount}
                  onChange={(e) => setFormData({...formData, coachesCount: e.target.value})}
                  className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all ${!formData.showCoachesCount && 'opacity-50'}`}
                  placeholder="Örn: 12"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Haber Sayısı</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, showNewsCount: !formData.showNewsCount})}
                    className={`p-1 rounded-lg transition-colors ${formData.showNewsCount ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'}`}
                    title={formData.showNewsCount ? "Sitede Görünür" : "Sitede Gizli"}
                  >
                    {formData.showNewsCount ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.newsCount}
                  onChange={(e) => setFormData({...formData, newsCount: e.target.value})}
                  className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all ${!formData.showNewsCount && 'opacity-50'}`}
                  placeholder="Örn: 150+"
                />
              </div>
            </div>
          </motion.div>

          {/* Contact Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-10 rounded-[48px] shadow-2xl border border-gray-100"
          >
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-16 h-16 bg-[#f97316]/10 rounded-3xl flex items-center justify-center">
                <Phone className="w-8 h-8 text-[#f97316]" />
              </div>
              <h2 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight italic">İLETİŞİM BİLGİLERİ</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                  <Mail className="w-3 h-3 mr-2" /> E-posta
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                  <Phone className="w-3 h-3 mr-2" /> Telefon
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                  <MapPin className="w-3 h-3 mr-2" /> Adres
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                />
              </div>
            </div>
          </motion.div>

          {/* Social Media */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-10 rounded-[48px] shadow-2xl border border-gray-100"
          >
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center">
                <Instagram className="w-8 h-8 text-pink-500" />
              </div>
              <h2 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight italic">SOSYAL MEDYA</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                  <Instagram className="w-3 h-3 mr-2" /> Instagram
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                  placeholder="@kullaniciadi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                  <Facebook className="w-3 h-3 mr-2" /> Facebook
                </label>
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => setFormData({...formData, facebook: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center">
                  <Twitter className="w-3 h-3 mr-2" /> Twitter (X)
                </label>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                />
              </div>
            </div>
          </motion.div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#f97316] text-white px-16 py-6 rounded-[32px] font-black uppercase tracking-widest text-lg shadow-2xl shadow-[#f97316]/30 hover:bg-[#1a5f6b] transition-all transform hover:-translate-y-1 flex items-center disabled:opacity-50"
            >
              <Save className="w-6 h-6 mr-3" /> {saving ? 'KAYDEDİLİYOR...' : 'TÜM AYARLARI KAYDET'}
            </button>
          </div>
        </form>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[48px] shadow-2xl border border-red-100"
        >
          <div className="flex items-center space-x-6 mb-10">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-red-600 uppercase tracking-tight italic">FABRİKA AYARLARI</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">DİKKAT: BU İŞLEMLER GERİ ALINAMAZ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 space-y-6">
              <div className="flex items-center gap-4 text-blue-600">
                <RefreshCw className="w-6 h-6" />
                <h3 className="text-lg font-black uppercase tracking-tight">MENÜYÜ SIFIRLA</h3>
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Üst menü yapısını varsayılan ayarlarına döndürür. Eklediğiniz özel menü öğeleri silinebilir veya gizlenebilir.
              </p>
              <button
                onClick={resetNavigation}
                disabled={saving}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> MENÜYÜ SIFIRLA
              </button>
            </div>

            <div className="p-8 bg-red-50/50 rounded-[32px] border border-red-100 space-y-6">
              <div className="flex items-center gap-4 text-red-600">
                <Trash2 className="w-6 h-6" />
                <h3 className="text-lg font-black uppercase tracking-tight">TÜM VERİLERİ SİL</h3>
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Sitedeki tüm haberleri, takımları, oyuncuları, branşları, maçları ve galeri içeriklerini KALICI OLARAK siler.
              </p>
              <button
                onClick={resetDatabase}
                disabled={reseting}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-red-700 transition-all flex items-center justify-center disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" /> {reseting ? 'SIFIRLANIYOR...' : 'VERİTABANINI SIFIRLA'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminSettings;
