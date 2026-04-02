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
    maintenanceMode: false
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Logo URL</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={formData.clubLogo}
                  onChange={(e) => setFormData({...formData, clubLogo: e.target.value})}
                  className="flex-grow bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all"
                />
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden border border-gray-200">
                  <img src={formData.clubLogo} alt="Logo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              </div>
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
