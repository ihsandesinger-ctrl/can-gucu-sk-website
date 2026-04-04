import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Footer = () => {
  const { settings } = useAuth();
  const [visibleTeams, setVisibleTeams] = useState<any[]>([]);
  const [visibleBranches, setVisibleBranches] = useState<any[]>([]);

  useEffect(() => {
    // Fetch visible teams
    const teamsQuery = query(collection(db, 'teams'), where('isHidden', '==', false));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teams = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(data => data.showInPanel !== false);
      setVisibleTeams(teams);
    });

    // Fetch visible branches
    const branchesQuery = query(collection(db, 'branches'), where('isHidden', '==', false));
    const unsubscribeBranches = onSnapshot(branchesQuery, (snapshot) => {
      const branches = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(data => data.showInPanel !== false);
      setVisibleBranches(branches);
    });

    return () => {
      unsubscribeTeams();
      unsubscribeBranches();
    };
  }, []);

  return (
    <footer className="bg-[#1a5f6b] text-white pt-20 pb-10 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-[#2a6f7b] pb-16">
        {/* Logo & About */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={settings.clubLogo} 
              alt={settings.clubName} 
              className="h-16 w-auto"
              referrerPolicy="no-referrer"
            />
            <span className="font-bold text-2xl tracking-wider uppercase">{settings.clubName}</span>
          </Link>
          <p className="text-gray-300 text-sm leading-relaxed">
            {settings.aboutText || "Çan'ın gücü, gençlerin enerjisiyle birleşiyor. 2025 yılında kurulan kulübümüz, sporun her dalında başarıyı hedefliyor."}
          </p>
          <div className="flex space-x-4">
            {settings.facebook && settings.showFacebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#2a6f7b] rounded-full flex items-center justify-center hover:bg-[#f97316] transition-colors duration-300">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {settings.instagram && settings.showInstagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#2a6f7b] rounded-full flex items-center justify-center hover:bg-[#f97316] transition-colors duration-300">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {settings.twitter && settings.showTwitter && (
              <a href={settings.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#2a6f7b] rounded-full flex items-center justify-center hover:bg-[#f97316] transition-colors duration-300">
                <Twitter className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-bold mb-8 uppercase tracking-widest border-l-4 border-[#f97316] pl-4">Hızlı Menü</h3>
          <ul className="space-y-4 text-gray-300 text-sm">
            <li><Link to="/" className="hover:text-[#f97316] transition-colors duration-200">Ana Sayfa</Link></li>
            <li><Link to="/haberler" className="hover:text-[#f97316] transition-colors duration-200">Haberler</Link></li>
            <li><Link to="/galeri" className="hover:text-[#f97316] transition-colors duration-200">Galeri</Link></li>
            <li><Link to="/hakkimizda" className="hover:text-[#f97316] transition-colors duration-200">Hakkımızda</Link></li>
            <li><Link to="/iletisim" className="hover:text-[#f97316] transition-colors duration-200">İletişim</Link></li>
          </ul>
        </div>

        {/* Teams & Branches */}
        <div className="space-y-12">
          {visibleTeams.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-8 uppercase tracking-widest border-l-4 border-[#f97316] pl-4">Takımlarımız</h3>
              <ul className="space-y-4 text-gray-300 text-sm">
                {visibleTeams.map((team) => (
                  <li key={team.id}>
                    <Link to={`/takim/${team.id}`} className="hover:text-[#f97316] transition-colors duration-200">
                      {team.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {visibleBranches.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-8 uppercase tracking-widest border-l-4 border-[#f97316] pl-4">Branşlarımız</h3>
              <ul className="space-y-4 text-gray-300 text-sm">
                {visibleBranches.map((branch) => (
                  <li key={branch.id}>
                    <Link to={`/brans/${branch.id}`} className="hover:text-[#f97316] transition-colors duration-200">
                      {branch.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-xl font-bold mb-8 uppercase tracking-widest border-l-4 border-[#f97316] pl-4">İletişim</h3>
          <ul className="space-y-6 text-gray-300 text-sm">
            <li className="flex items-start">
              <MapPin className="h-5 w-5 mr-4 text-[#f97316] shrink-0" />
              <span>{settings.address || 'Çan, Çanakkale, Türkiye'}</span>
            </li>
            <li className="flex items-center">
              <Phone className="h-5 w-5 mr-4 text-[#f97316] shrink-0" />
              <span>{settings.phone || '+90 (555) 000 00 00'}</span>
            </li>
            <li className="flex items-center">
              <Mail className="h-5 w-5 mr-4 text-[#f97316] shrink-0" />
              <span>{settings.email || 'info@cangucu.org'}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center mt-10 text-gray-400 text-xs tracking-widest uppercase">
        <p>&copy; 2025 {settings.clubName.toUpperCase()}. TÜM HAKLARI SAKLIDIR.</p>
      </div>
    </footer>
  );
};

export default Footer;
