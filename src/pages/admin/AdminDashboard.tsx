import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Power, 
  ShieldCheck, 
  Activity, 
  Database, 
  AlertCircle 
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';

const AdminDashboard = () => {
  const { maintenanceMode: currentMaintenanceMode, isAdmin, settings } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(currentMaintenanceMode);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    setMaintenanceMode(currentMaintenanceMode);
  }, [currentMaintenanceMode]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        await getDoc(docRef);
        setDbStatus('connected');
      } catch (error) {
        console.error("Database connection error:", error);
        setDbStatus('error');
      }
    };
    checkConnection();
  }, []);

  const restoreDefaultData = async () => {
    if (!window.confirm("Tüm mevcut veriler (Haberler, Oyuncular, Takımlar, Galeri) silinebilir veya üzerine yazılabilir. Devam etmek istiyor musunuz?")) return;
    
    setSyncing(true);
    try {
      const batch = writeBatch(db);

      // Sample News
      const news = [
        { title: "Yeni Sezon Hazırlıkları Başladı", category: "Kulüp", date: new Date().toISOString(), content: "Takımımız yeni sezon hazırlıkları için sahaya indi.", image: "https://picsum.photos/seed/news1/800/600", isHidden: false },
        { title: "Altyapı Seçmeleri Sonuçlandı", category: "Altyapı", date: new Date().toISOString(), content: "Geleceğin yıldızları Çangücü SK bünyesine katıldı.", image: "https://picsum.photos/seed/news2/800/600", isHidden: false }
      ];
      news.forEach(n => batch.set(doc(collection(db, 'news')), n));

      // Sample Teams
      const teams = [
        { name: "A Takım", category: "Futbol", logo: "https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6", isHidden: false },
        { name: "U19", category: "Futbol", logo: "https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6", isHidden: false }
      ];
      teams.forEach(t => batch.set(doc(collection(db, 'teams')), t));

      // Sample Players
      const players = [
        { name: "Ahmet Yılmaz", position: "Forvet", number: "10", team: "A Takım", photo: "https://picsum.photos/seed/p1/400/400", isHidden: false },
        { name: "Mehmet Demir", position: "Kaleci", number: "1", team: "A Takım", photo: "https://picsum.photos/seed/p2/400/400", isHidden: false }
      ];
      players.forEach(p => batch.set(doc(collection(db, 'players')), p));

      // Sample Gallery
      const gallery = [
        { title: "Antrenman", category: "Futbol", image: "https://picsum.photos/seed/g1/800/600", isHidden: false },
        { title: "Maç Günü", category: "Futbol", image: "https://picsum.photos/seed/g2/800/600", isHidden: false }
      ];
      gallery.forEach(g => batch.set(doc(collection(db, 'gallery')), g));

      await batch.commit();
      alert("Varsayılan veriler başarıyla yüklendi. Sayfayı yenileyebilirsiniz.");
    } catch (error) {
      console.error("Error restoring data:", error);
      alert("Veriler yüklenirken bir hata oluştu: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSyncing(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    setLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'global');
      const newStatus = !maintenanceMode;
      
      // Önce yazmayı dene
      await setDoc(settingsRef, {
        maintenanceMode: newStatus
      }, { merge: true });
      
      // Yazma başarılıysa yerel durumu güncelle
      setMaintenanceMode(newStatus);
      alert(`Bakım modu başarıyla ${newStatus ? 'AÇILDI' : 'KAPATILDI'}.`);
    } catch (error: any) {
      console.error("Error updating maintenance mode:", error);
      let errorMsg = "Bakım modu güncellenirken bir hata oluştu.";
      if (error.code === 'permission-denied') errorMsg = "Yazma yetkiniz yok! Lütfen giriş yaptığınızdan emin olun.";
      if (error.code === 'not-found') errorMsg = "Veritabanı dökümanı bulunamadı.";
      alert(errorMsg + "\nDetay: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">PANEL ÖZETİ</h1>
          <div className="h-2 w-32 bg-[#f97316] mt-4 rounded-full"></div>
        </div>
        <div className="flex items-center space-x-4 bg-white p-4 rounded-3xl shadow-xl border border-gray-100">
          <div className="w-12 h-12 bg-[#1a5f6b]/10 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#1a5f6b]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yönetici Yetkisi</p>
            <p className="text-sm font-black text-[#1a5f6b] uppercase tracking-tight">SÜPER ADMİN</p>
          </div>
        </div>
      </div>

      {/* Maintenance Mode Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-8 rounded-[40px] shadow-2xl border transition-all duration-500 ${
          maintenanceMode 
            ? 'bg-red-50 border-red-100' 
            : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl transition-all duration-500 ${
              maintenanceMode ? 'bg-red-500 text-white shadow-red-200' : 'bg-[#1a5f6b] text-white shadow-[#1a5f6b]/20'
            }`}>
              <Power className={`w-10 h-10 ${loading ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h2 className={`text-2xl font-black uppercase tracking-tight ${maintenanceMode ? 'text-red-900' : 'text-[#1a5f6b]'}`}>
                BAKIM MODU
              </h2>
              <p className="text-gray-500 font-medium max-w-md">
                Bakım modu aktifken sadece yöneticiler siteyi görüntüleyebilir. Ziyaretçiler bakım sayfasıyla karşılaşır.
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleMaintenanceMode}
            disabled={loading}
            className={`px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-sm transition-all duration-500 shadow-2xl disabled:opacity-50 ${
              maintenanceMode 
                ? 'bg-white text-red-600 hover:bg-red-600 hover:text-white shadow-red-200' 
                : 'bg-[#f97316] text-white hover:bg-[#1a5f6b] shadow-[#f97316]/20'
            }`}
          >
            {loading ? 'GÜNCELLENİYOR...' : (maintenanceMode ? 'MODU KAPAT' : 'MODU AÇ')}
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'SİSTEM DURUMU', value: 'ÇALIŞIYOR', icon: Activity, color: 'text-green-500' },
          { 
            label: 'VERİTABANI', 
            value: dbStatus === 'connected' ? 'BAĞLI' : (dbStatus === 'checking' ? 'KONTROL EDİLİYOR' : 'BAĞLANTI HATASI'), 
            icon: Database, 
            color: dbStatus === 'connected' ? 'text-blue-500' : (dbStatus === 'checking' ? 'text-gray-400' : 'text-red-500') 
          },
          { label: 'GÜVENLİK', value: 'GÜVENLİ', icon: ShieldCheck, color: 'text-[#f97316]' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 flex items-center space-x-6"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className={`text-xl font-black uppercase tracking-tight ${stat.color}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Info */}
      <div className="bg-[#1a5f6b] rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4">SÜPER ADMİN PANELİ</h3>
          <p className="text-white/70 font-medium max-w-2xl leading-relaxed mb-8">
            Sitenin tüm kontrolü sizin elinizde. Branşlar ekleyebilir, haberleri gizleyebilir veya siteyi anında bakım moduna alabilirsiniz. 
            Herhangi bir sorun yaşarsanız sistem her zaman yedekli çalışmaktadır.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={restoreDefaultData}
              disabled={syncing}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-[#1a5f6b] transition-all disabled:opacity-50"
            >
              {syncing ? 'VERİLER YÜKLENİYOR...' : 'VARSAYILAN VERİLERİ YÜKLE'}
            </button>
          </div>
        </div>
        <AlertCircle className="absolute -right-12 -bottom-12 w-64 h-64 text-white/5 rotate-12" />
      </div>

      {/* Debug Info - Sadece Teknik Kontrol İçin */}
      <div className="p-6 bg-gray-100 rounded-3xl text-[10px] font-mono text-gray-500 flex flex-col gap-2">
        <p>TEKNİK BİLGİ (BAĞLANTI KONTROLÜ):</p>
        <p>Database ID: {db.app.options.projectId} / {db.databaseId}</p>
        <p>Auth User: {isAdmin ? 'Süper Admin Girişi Yapıldı' : 'Giriş Yapılmadı'}</p>
        <p className="text-red-500 font-bold italic">ÖNEMLİ: Eğer yukarıdaki Database ID "ai-studio-..." ile başlamıyorsa, config dosyanız hatalıdır.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
