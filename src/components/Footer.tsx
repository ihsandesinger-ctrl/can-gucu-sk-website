import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../AuthContext';

const Footer = () => {
  const { settings } = useAuth();

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
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#2a6f7b] rounded-full flex items-center justify-center hover:bg-[#f97316] transition-colors duration-300">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#2a6f7b] rounded-full flex items-center justify-center hover:bg-[#f97316] transition-colors duration-300">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {settings.twitter && (
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

        {/* Teams */}
        <div>
          <h3 className="text-xl font-bold mb-8 uppercase tracking-widest border-l-4 border-[#f97316] pl-4">Takımlarımız</h3>
          <ul className="space-y-4 text-gray-300 text-sm">
            <li><Link to="/takim/u-11" className="hover:text-[#f97316] transition-colors duration-200">U-11 Takımı</Link></li>
            <li><Link to="/takim/u-12" className="hover:text-[#f97316] transition-colors duration-200">U-12 Takımı</Link></li>
            <li><Link to="/takim/u-13" className="hover:text-[#f97316] transition-colors duration-200">U-13 Takımı</Link></li>
            <li><Link to="/takim/u-14" className="hover:text-[#f97316] transition-colors duration-200">U-14 Takımı</Link></li>
          </ul>
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
