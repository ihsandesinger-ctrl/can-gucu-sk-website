import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Newspaper, 
  Trophy, 
  Users, 
  UserCircle, 
  Calendar,
  ChevronRight,
  Settings,
  List,
  Menu,
  X,
  MessageSquare,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const AdminLayout = () => {
  const location = useLocation();
  const { settings } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/cangucu-panel', icon: LayoutDashboard, label: 'Panel' },
    { path: '/cangucu-panel/haberler', icon: Newspaper, label: 'Haberler' },
    { path: '/cangucu-panel/branslar', icon: Trophy, label: 'Branşlar' },
    { path: '/cangucu-panel/takimlar', icon: Users, label: 'Takımlar' },
    { path: '/cangucu-panel/oyuncular', icon: UserCircle, label: 'Oyuncular' },
    { path: '/cangucu-panel/personel', icon: Users, label: 'Personel' },
    { path: '/cangucu-panel/galeri', icon: LayoutDashboard, label: 'Galeri' },
    { path: '/cangucu-panel/maclar', icon: Calendar, label: 'Maçlar' },
    { path: '/cangucu-panel/mesajlar', icon: MessageSquare, label: 'Mesajlar' },
    { path: '/cangucu-panel/menu', icon: List, label: 'Menü Yönetimi' },
    { path: '/cangucu-panel/ayarlar', icon: Settings, label: 'Ayarlar' },
  ];

  const NavContent = () => (
    <>
      <div className="p-8 border-b border-white/10 flex items-center space-x-4">
        <img 
          src="/logo.png" 
          alt={settings.clubName} 
          className="h-10 w-auto drop-shadow-lg"
          referrerPolicy="no-referrer"
        />
        <div>
          <h2 className="text-xl font-black italic tracking-tighter uppercase leading-tight">YÖNETİM</h2>
          <p className="text-white/50 text-[8px] font-bold tracking-widest uppercase">{settings.clubName}</p>
        </div>
      </div>
      
      <nav className="flex-grow p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between p-3 md:p-4 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20' 
                  : 'hover:bg-[#f97316]/10 text-white/70 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <item.icon className={`w-5 h-5 mr-3 transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#f97316] group-hover:text-white'}`} />
                <span className="font-bold text-xs md:text-sm uppercase tracking-wider">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
            </Link>
          );
        })}
      </nav>

      <div className="p-8 border-t border-white/10 flex items-center justify-between">
        <Link to="/" className="text-xs font-black text-white/40 hover:text-white transition-colors uppercase tracking-widest flex items-center">
          <LogOut className="w-3 h-3 mr-2" /> Siteye Dön
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#1a5f6b] text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt={settings.clubName} 
            className="h-8 w-auto"
            referrerPolicy="no-referrer"
          />
          <span className="font-black italic tracking-tighter uppercase text-sm">YÖNETİM PANELİ</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-white/5 hover:bg-[#f97316] transition-all"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#1a5f6b] text-white z-[70] flex flex-col md:hidden shadow-2xl"
            >
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[#1a5f6b] text-white hidden md:flex flex-col shadow-2xl sticky top-0 h-screen">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
