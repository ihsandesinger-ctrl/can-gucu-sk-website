import React from 'react';
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
  List
} from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/cangucu-admin', icon: LayoutDashboard, label: 'Panel' },
    { path: '/cangucu-admin/haberler', icon: Newspaper, label: 'Haberler' },
    { path: '/cangucu-admin/branslar', icon: Trophy, label: 'Branşlar' },
    { path: '/cangucu-admin/takimlar', icon: Users, label: 'Takımlar' },
    { path: '/cangucu-admin/oyuncular', icon: UserCircle, label: 'Oyuncular' },
    { path: '/cangucu-admin/personel', icon: Users, label: 'Personel' },
    { path: '/cangucu-admin/galeri', icon: LayoutDashboard, label: 'Galeri' },
    { path: '/cangucu-admin/maclar', icon: Calendar, label: 'Maçlar' },
    { path: '/cangucu-admin/menu', icon: List, label: 'Menü Yönetimi' },
    { path: '/cangucu-admin/ayarlar', icon: Settings, label: 'Ayarlar' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a5f6b] text-white hidden md:flex flex-col shadow-2xl">
        <div className="p-8 border-b border-white/10">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">YÖNETİM</h2>
          <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase mt-1">Çangücü SK Kontrol</p>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20' 
                    : 'hover:bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#f97316]'}`} />
                  <span className="font-bold text-sm uppercase tracking-wider">{item.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
              </Link>
            );
          })}
        </nav>

        <div className="p-8 border-t border-white/10">
          <Link to="/" className="text-xs font-black text-white/40 hover:text-white transition-colors uppercase tracking-widest">
            Siteye Dön
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
