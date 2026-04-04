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

  useEffect(() => {
    // Fetch branches
    const qBranches = query(collection(db, 'branches'), where('showInPanel', '==', true), orderBy('name', 'asc'));
    const unsubscribeBranches = onSnapshot(qBranches, (snapshot) => {
      const allBranches = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })) as Branch[];
      setBranches(allBranches);
    });

    // Fetch teams
    const qTeams = query(collection(db, 'teams'), where('showInPanel', '==', true), orderBy('name', 'asc'));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const allTeams = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, branchId: doc.data().branchId })) as Team[];
      setTeams(allTeams);
    });

    return () => {
      unsubscribeBranches();
      unsubscribeTeams();
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  // Filter visible navigation items - Hidden means hidden for everyone on public site
  const visibleNav = navigation.filter(item => !item.isHidden);

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
                src="/logo.png" 
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
                const isOpen = activeDropdown === item.id;
                return (
                  <div key={item.id} className="relative group ml-1">
                    <button
                      onMouseEnter={() => setActiveDropdown(item.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center transition-all duration-300 ${
                        isOpen ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {item.title} <ChevronDown className={`ml-1 h-3 w-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#1a5f6b] border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 pt-4 pb-8 space-y-2">
              {visibleNav.map((item) => (
                <div key={item.id} className="space-y-1">
                  {!item.isDropdown ? (
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-200 ${
                        isActive(item.path) ? 'bg-[#f97316] text-white' : 'hover:bg-[#f97316]/10'
                      }`}
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <div className="space-y-1">
                      <button
                        onClick={() => setMobileDropdown(mobileDropdown === item.id ? null : item.id)}
                        className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-200 ${
                          mobileDropdown === item.id ? 'bg-white/5' : 'hover:bg-white/5'
                        }`}
                      >
                        {item.title}
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${mobileDropdown === item.id ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {mobileDropdown === item.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-black/10 rounded-2xl"
                          >
                            <div className="p-2 space-y-1">
                              {item.dropdownType === 'branches' && branches.map(branch => (
                                <Link
                                  key={branch.id}
                                  to={`/brans/${branch.id}`}
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-center px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#f97316] transition-all"
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
                                  className="flex items-center px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#f97316] transition-all"
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
                                  className="flex items-center px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#f97316] transition-all"
                                >
                                  <Calendar className="h-3 w-3 mr-3 text-[#f97316]" />
                                  {team.name} Fikstür
                                </Link>
                              ))}
                              {((item.dropdownType === 'branches' && branches.length === 0) || 
                                ((item.dropdownType === 'teams' || item.dropdownType === 'fixtures') && teams.length === 0)) && (
                                <div className="p-4 text-center text-white/30 text-[10px] font-black uppercase tracking-widest">Henüz Veri Yok</div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
