import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import type { Team } from '../types';

interface HeaderProps {
    logo: string;
    teams: Team[];
}

const Header: React.FC<HeaderProps> = ({ logo, teams }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTeamsDropdownOpen, setIsTeamsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLLIElement>(null);

    // Effect to prevent body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMobileMenuOpen]);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsTeamsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);


    const navItems = [
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Haberler', path: '/haberler' },
        { name: 'Galeri', path: '/galeri' },
        { name: 'Hakkımızda', path: '/hakkimizda' },
        { name: 'İletişim', path: '/iletisim' },
    ];

    const handleLinkClick = () => {
        setIsMobileMenuOpen(false);
        setIsTeamsDropdownOpen(false);
    };

    return (
        <>
            <header className="bg-[#267d87] text-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <Link to="/" className="flex items-center space-x-4" onClick={handleLinkClick}>
                            <img src={logo} alt="Çangücü SK Logo" className="h-14 w-auto" />
                            <span className="text-2xl font-bold">Çangücü SK</span>
                        </Link>
                        
                        <nav className="hidden md:flex space-x-2 items-center">
                            {/* FIX: Map over the navItems array to render NavLink components instead of trying to render an object directly. */}
                            {navItems.slice(0, 1).map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-orange-500 ${isActive ? 'bg-orange-600' : ''}`
                                    }
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                            {/* Teams Dropdown - Desktop */}
                            <li ref={dropdownRef} className="relative list-none">
                                <button
                                    onClick={() => setIsTeamsDropdownOpen(!isTeamsDropdownOpen)}
                                    className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-orange-500 flex items-center"
                                >
                                    Takımlarımız <i className={`fas fa-chevron-down ml-2 transition-transform duration-200 ${isTeamsDropdownOpen ? 'rotate-180' : ''}`}></i>
                                </button>
                                {isTeamsDropdownOpen && (
                                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                        {teams.map((team) => (
                                            <NavLink
                                                key={team.slug}
                                                to={`/takim/${team.slug}`}
                                                onClick={handleLinkClick}
                                                className={({ isActive }) =>
                                                    `block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isActive ? 'font-bold text-orange-600' : ''}`
                                                }
                                            >
                                                {team.name}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </li>
                            {navItems.slice(1).map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-orange-500 ${isActive ? 'bg-orange-600' : ''}`
                                    }
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </nav>
                        
                         <div className="md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                aria-controls="mobile-menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? <i className="fas fa-times h-6 w-6"></i> : <i className="fas fa-bars h-6 w-6"></i>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu panel */}
                <div 
                    id="mobile-menu"
                    className={`absolute w-full bg-[#267d87] shadow-lg md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <nav className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
                        {navItems.slice(0, 1).map((item) => (
                             <NavLink key={item.name} to={item.path} onClick={handleLinkClick} className={({isActive}) => `block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-orange-500 ${isActive ? 'bg-orange-600' : ''}`}>
                                {item.name}
                            </NavLink>
                        ))}
                        
                        {/* Teams Accordion - Mobile */}
                        <div>
                            <button onClick={() => setIsTeamsDropdownOpen(!isTeamsDropdownOpen)} className="w-full flex justify-between items-center px-3 py-2 rounded-md text-base font-medium text-white hover:bg-orange-500">
                                Takımlarımız
                                <i className={`fas fa-chevron-down transition-transform duration-200 ${isTeamsDropdownOpen ? 'rotate-180' : ''}`}></i>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isTeamsDropdownOpen ? 'max-h-96' : 'max-h-0'}`}>
                                <div className="pl-4 pt-1 pb-2 space-y-1">
                                    {teams.map((team) => (
                                        <NavLink key={team.slug} to={`/takim/${team.slug}`} onClick={handleLinkClick} className={({isActive}) => `block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-orange-500 ${isActive ? 'bg-orange-600' : ''}`}>
                                            {team.name}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {navItems.slice(1).map((item) => (
                            <NavLink key={item.name} to={item.path} onClick={handleLinkClick} className={({isActive}) => `block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-orange-500 ${isActive ? 'bg-orange-600' : ''}`}>
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </header>

            <div 
                aria-hidden="true"
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />
        </>
    );
};

export default Header;