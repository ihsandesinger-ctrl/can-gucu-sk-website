
import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';

interface HeaderProps {
    logo: string;
}

const Header: React.FC<HeaderProps> = ({ logo }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Effect to prevent body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        // Cleanup function to restore scrolling when component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMobileMenuOpen]);

    const navItems = [
        { name: 'Ana Sayfa', path: '/' },
        { name: 'U-11 Takımı', path: '/u-11' },
        { name: 'U-12 Takımı', path: '/u-12' },
        { name: 'Haberler', path: '/haberler' },
        { name: 'Galeri', path: '/galeri' },
        { name: 'Hakkımızda', path: '/hakkimizda' },
        { name: 'İletişim', path: '/iletisim' },
    ];

    const handleLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <header className="bg-[#267d87] text-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo and Title */}
                        <Link to="/" className="flex items-center space-x-4" onClick={handleLinkClick}>
                            <img src={logo} alt="Çangücü SK Logo" className="h-14 w-auto" />
                            <span className="text-2xl font-bold">Çangücü SK</span>
                        </Link>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-2">
                            {navItems.map((item) => (
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
                        
                        {/* Mobile Menu Button */}
                         <div className="md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                aria-controls="mobile-menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? (
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
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
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={handleLinkClick}
                                className={({ isActive }) =>
                                    `block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-orange-500 ${isActive ? 'bg-orange-600' : ''}`
                                }
                            >
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Overlay for when mobile menu is open */}
            <div 
                aria-hidden="true"
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />
        </>
    );
};

export default Header;
