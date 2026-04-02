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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';

const AdminDashboard = () => {
  const { maintenanceMode: currentMaintenanceMode, isAdmin } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(currentMaintenanceMode);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    news: 0,
    branches: 0,
    teams: 0,
    players: 0,
    matches: 0
  });

  const toggleMaintenanceMode = async () => {
    setLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(settingsRef, {
        maintenanceMode: !maintenanceMode
      }, { merge: true });
      setMaintenanceMode(!maintenanceMode);
    } catch (error) {
      console.error("Error updating maintenance mode:", error);
      alert("Bakım modu güncellenirken bir hata oluştu.");
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
            <p className="text-sm font-black text-[#1a5f6b] uppercase tracking-tight">AKTİF</p>
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
          { label: 'VERİTABANI', value: 'BAĞLI', icon: Database, color: 'text-blue-500' },
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
          <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4">HOŞ GELDİN, KRAL!</h3>
          <p className="text-white/70 font-medium max-w-2xl leading-relaxed">
            Sitenin tüm kontrolü senin elinde. Branşlar ekleyebilir, haberleri gizleyebilir veya siteyi anında bakım moduna alabilirsin. 
            Herhangi bir sorun yaşarsan sistem her zaman yedekli çalışmaktadır.
          </p>
        </div>
        <AlertCircle className="absolute -right-12 -bottom-12 w-64 h-64 text-white/5 rotate-12" />
      </div>
    </div>
  );
};

export default AdminDashboard;
