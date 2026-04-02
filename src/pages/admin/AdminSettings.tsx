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
  Image as ImageIcon
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ImageUpload from '../../components/admin/ImageUpload';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    clubName: 'Çangücü SK',
    clubLogo: 'https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6',
    email: 'info@cangucusk.com',
    phone: '+90 555 555 55 55',
    address: 'Çan, Çanakkale',
    instagram: '',
    facebook: '',
    twitter: '',
    aboutText: 'Çangücü SK, Çan\'ın en köklü spor kulüplerinden biridir.',
    maintenanceMode: false,
    branchesCount: '5+',
    athletesCount: '200+',
    coachesCount: '12',
    newsCount: '150+',
    heroBgImage: 'https://picsum.photos/seed/stadium/1920/1080',
    showHeroButtons: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'global');
      await setDoc(docRef, formData, { merge: true });
      alert("Ayarlar başarıyla kaydedildi.");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Ayarlar kaydedilirken bir hata oluştu.");
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
      <div>
        <h1 className="text-5xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">KULÜP AYARLARI</h1>
        <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full"></div>
      </div>

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
              <ImageUpload 
                currentImageUrl={formData.heroBgImage}
                onUploadComplete={(url) => setFormData({...formData, heroBgImage: url})}
                folder="hero"
                aspectRatio={16/9}
              />
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
              <div className="flex items-center space-x-4 p-6 bg-red-50 rounded-3xl border border-red-100">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={formData.maintenanceMode}
                  onChange={(e) => setFormData({...formData, maintenanceMode: e.target.checked})}
                  className="w-6 h-6 text-red-600 border-none rounded-lg focus:ring-0 cursor-pointer"
                />
                <label htmlFor="maintenanceMode" className="text-sm font-black text-red-600 uppercase tracking-widest cursor-pointer">
                  SİTEYİ BAKIM MODUNA AL
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Branş Sayısı</label>
              <input
                type="text"
                value={formData.branchesCount}
                onChange={(e) => setFormData({...formData, branchesCount: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                placeholder="Örn: 5+"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Sporcu Sayısı</label>
              <input
                type="text"
                value={formData.athletesCount}
                onChange={(e) => setFormData({...formData, athletesCount: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                placeholder="Örn: 200+"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Antrenör Sayısı</label>
              <input
                type="text"
                value={formData.coachesCount}
                onChange={(e) => setFormData({...formData, coachesCount: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                placeholder="Örn: 12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Haber Sayısı</label>
              <input
                type="text"
                value={formData.newsCount}
                onChange={(e) => setFormData({...formData, newsCount: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
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
    </div>
  );
};

export default AdminSettings;
