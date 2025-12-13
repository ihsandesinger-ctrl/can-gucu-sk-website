
import React from 'react';
import { Link } from 'react-router-dom';
import type { SiteSettings, Team } from '../types';

interface FooterProps {
    siteSettings: SiteSettings;
    teams: Team[];
}

const Footer: React.FC<FooterProps> = ({ siteSettings, teams }) => {
    return (
        <footer className="bg-[#267d87] text-white pt-12 pb-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Column 1: Club Info */}
                <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold mb-4">Çangücü SK</h3>
                    <p className="text-gray-300 max-w-md">
                        Geleceğin yıldızlarını yetiştiriyoruz. Tutku, disiplin ve takım ruhuyla zafere!
                    </p>
                    <div className="flex space-x-4 mt-4">
                        {siteSettings.socialMedia?.facebook && (
                            <a href={siteSettings.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                                <i className="fab fa-facebook-f text-xl"></i>
                            </a>
                        )}
                        {siteSettings.socialMedia?.twitter && (
                            <a href={siteSettings.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                                <i className="fab fa-twitter text-xl"></i>
                            </a>
                        )}
                        {siteSettings.socialMedia?.instagram && (
                            <a href={siteSettings.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                                <i className="fab fa-instagram text-xl"></i>
                            </a>
                        )}
                        {siteSettings.socialMedia?.youtube && (
                            <a href={siteSettings.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                                <i className="fab fa-youtube text-xl"></i>
                            </a>
                        )}
                    </div>
                </div>

                {/* Column 2: Kulüp */}
                <div>
                    <h4 className="font-bold text-lg mb-4">KULÜP</h4>
                    <ul className="space-y-2">
                        <li><Link to="/hakkimizda" className="text-gray-300 hover:text-white">Hakkımızda</Link></li>
                        <li><Link to="/haberler" className="text-gray-300 hover:text-white">Haberler</Link></li>
                        <li><Link to="/iletisim" className="text-gray-300 hover:text-white">İletişim</Link></li>
                    </ul>
                </div>

                {/* Column 3: Takımlar */}
                 <div>
                    <h4 className="font-bold text-lg mb-4">TAKIMLAR</h4>
                    <ul className="space-y-2">
                       {teams.map(team => (
                         <li key={team.slug}><Link to={`/takim/${team.slug}`} className="text-gray-300 hover:text-white">{team.name}</Link></li>
                       ))}
                    </ul>
                </div>
                
                {/* Column 4: İletişim */}
                <div className="md:col-span-4 lg:col-span-1">
                     <h4 className="font-bold text-lg mb-4">İLETİŞİM</h4>
                    <address className="not-italic text-gray-300 space-y-2">
                        {siteSettings.address && <p>Adres: {siteSettings.address}</p>}
                        {siteSettings.email && <p>E-posta: {siteSettings.email}</p>}
                        {siteSettings.phone && <p>Telefon: {siteSettings.phone}</p>}
                    </address>
                </div>
            </div>
             <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 border-t border-gray-700 pt-6 text-center text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Çangücü SK. Tüm hakları saklıdır.
            </div>
        </footer>
    );
};

export default Footer;
