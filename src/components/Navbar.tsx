import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown, Trophy, Users, Calendar } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

interface Branch {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  branchId: string;
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const location = useLocation();
  const { isAdmin, settings, navigation } = useAuth();

  const visibleNav = React.useMemo(() => 
    navigation.filter(item => !item.isHidden).sort((a, b) => a.order - b.order),
    [navigation]
  );

  useEffect(() => {
    // Fetch branches
    const qBranches = query(
      collection(db, 'branches'), 
      where('isHidden', '==', false),
      orderBy('name', 'asc')
    );
    const unsubscribeBranches = onSnapshot(qBranches, (snapshot) => {
      const allBranches = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(data => data.showInPanel !== false)
        .map(data => ({ id: data.id, name: data.name })) as Branch[];
      setBranches(allBranches);
    });

    // Fetch teams
    const qTeams = query(
      collection(db, 'teams'), 
      where('isHidden', '==', false),
      orderBy('name', 'asc')
    );
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const allTeams = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(data => data.showInPanel !== false)
        .map(data => ({ id: data.id, name: data.name, branchId: data.branchId })) as Team[];
      setTeams(allTeams);
    });

    return () => {
      unsubscribeBranches();
      unsubscribeTeams();
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-[#1a5f6b] text-white sticky top-0 z-50 shadow-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <img 
                src={settings.clubLogo || "/logo.png"} 
                alt={settings.clubName} 
                className="h-14 w-auto drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="text-sm sm:text-xl font-black italic tracking-tighter uppercase block leading-none">{settings.clubName}</span>
                <span className="hidden sm:block text-[10px] font-black text-[#f97316] tracking-[0.3em] uppercase">SPOR KULÜBÜ</span>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {visibleNav.map((item) => {
              if (item.isDropdown) {
                const isDropdownOpen = activeDropdown === item.id;
                return (
                  <div key={item.id} className="relative group ml-1">
                    <button
                      onMouseEnter={() => setActiveDropdown(item.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center transition-all duration-300 ${
                        isDropdownOpen ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {item.title} <ChevronDown className={`ml-1 h-3 w-3 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          onMouseLeave={() => setActiveDropdown(null)}
                          className="absolute left-0 mt-2 w-56 bg-[#1a5f6b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden p-2"
                        >
                          {item.dropdownType === 'branches' && branches.map((branch) => (
                            <Link
                              key={branch.id}
                              to={`/brans/${branch.id}`}
                              className="flex items-center p-3 rounded-xl hover:bg-[#f97316] transition-all duration-200 group/item"
                            >
                              <Trophy className="h-4 w-4 mr-3 text-[#f97316] group-hover/item:text-white" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{branch.name}</span>
                            </Link>
                          ))}
                          {item.dropdownType === 'teams' && teams.map((team) => (
                            <Link
                              key={team.id}
                              to={`/takim/${team.id}`}
                              className="flex items-center p-3 rounded-xl hover:bg-[#f97316] transition-all duration-200 group/item"
                            >
                              <Users className="h-4 w-4 mr-3 text-[#f97316] group-hover/item:text-white" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{team.name}</span>
                            </Link>
                          ))}
                          {item.dropdownType === 'fixtures' && teams.map((team) => (
                            <Link
                              key={team.id}
                              to={`/fikstur/${team.id}`}
                              className="flex items-center p-3 rounded-xl hover:bg-[#f97316] transition-all duration-200 group/item"
                            >
                              <Calendar className="h-4 w-4 mr-3 text-[#f97316] group-hover/item:text-white" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{team.name} Fikstür</span>
                            </Link>
                          ))}
                          {((item.dropdownType === 'branches' && branches.length === 0) || 
                            ((item.dropdownType === 'teams' || item.dropdownType === 'fixtures') && teams.length === 0)) && (
                            <div className="p-4 text-center text-white/30 text-[10px] font-black uppercase tracking-widest">Henüz Veri Yok</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    isActive(item.path) 
                      ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20' 
                      : 'hover:bg-white/5 text-white/70 hover:text-white'
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-white/5 text-white hover:bg-[#f97316] transition-all duration-300"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            />
            
            {/* Menu Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[#1a5f6b] z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <img src={settings.clubLogo || "/logo.png"} alt="Logo" className="h-10 w-auto" referrerPolicy="no-referrer" />
                  <span className="font-black italic text-sm tracking-tighter uppercase">MENÜ</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-white/5 text-white hover:bg-[#f97316] transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {visibleNav.map((item, index) => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="space-y-2"
                  >
                    {!item.isDropdown ? (
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`block px-5 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                          isActive(item.path) ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => setMobileDropdown(mobileDropdown === item.id ? null : item.id)}
                          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                            mobileDropdown === item.id ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {item.title}
                          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${mobileDropdown === item.id ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence mode="wait">
                          {mobileDropdown === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="overflow-hidden bg-black/20 rounded-2xl border border-white/5"
                            >
                              <div className="p-2 space-y-1">
                                {item.dropdownType === 'branches' && branches.map(branch => (
                                  <Link
                                    key={branch.id}
                                    to={`/brans/${branch.id}`}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f97316] transition-all text-white/70 hover:text-white"
                                  >
                                    <Trophy className="h-3 w-3 mr-3 text-[#f97316]" />
                                    {branch.name}
                                  </Link>
                                ))}
                                {item.dropdownType === 'teams' && teams.map(team => (
                                  <Link
                                    key={team.id}
                                    to={`/takim/${team.id}`}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f97316] transition-all text-white/70 hover:text-white"
                                  >
                                    <Users className="h-3 w-3 mr-3 text-[#f97316]" />
                                    {team.name}
                                  </Link>
                                ))}
                                {item.dropdownType === 'fixtures' && teams.map(team => (
                                  <Link
                                    key={team.id}
                                    to={`/fikstur/${team.id}`}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f97316] transition-all text-white/70 hover:text-white"
                                  >
                                    <Calendar className="h-3 w-3 mr-3 text-[#f97316]" />
                                    {team.name} Fikstür
                                  </Link>
                                ))}
                                {((item.dropdownType === 'branches' && branches.length === 0) || 
                                  ((item.dropdownType === 'teams' || item.dropdownType === 'fixtures') && teams.length === 0)) && (
                                  <div className="p-6 text-center text-white/30 text-[10px] font-black uppercase tracking-widest">Henüz Veri Yok</div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="p-8 border-t border-white/10 bg-black/10">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] text-center">
                  © 2025 {settings.clubName.toUpperCase()}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
