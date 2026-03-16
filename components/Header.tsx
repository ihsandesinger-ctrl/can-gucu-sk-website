import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import type { Team, Branch, NavigationItem, SiteSettings } from '../types';

interface HeaderProps {
    logo: string;
    teams: Team[];
    branches: Branch[];
    settings: SiteSettings;
}

const NavItem: React.FC<{ item: NavigationItem; onClick: () => void }> = ({ item, onClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (item.isDropdown) {
        return (
            <div 
                ref={dropdownRef} 
                className="relative group"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <div className="flex items-center">
                    {item.path ? (
                        <NavLink
                            to={item.path}
                            onClick={onClick}
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-l-md text-sm font-medium transition-colors hover:bg-[var(--secondary-color)] ${isActive ? 'bg-[var(--secondary-color)]' : ''}`
                            }
                        >
                            {item.name}
                        </NavLink>
                    ) : (
                        <button
                            className="px-4 py-2 rounded-l-md text-sm font-medium transition-colors hover:bg-[var(--secondary-color)]"
                        >
                            {item.name}
                        </button>
                    )}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="px-2 py-2 rounded-r-md text-sm font-medium transition-colors hover:bg-[var(--secondary-color)] border-l border-white/20"
                    >
                        <i className={`fas fa-chevron-down transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                </div>
                {isOpen && (
                    <div className="absolute left-0 mt-0 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                        {item.items?.map((subItem, idx) => (
                            <div key={idx} className="relative group/sub">
                                {subItem.isDropdown ? (
                                    <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                                        {subItem.name} <i className="fas fa-chevron-right text-xs"></i>
                                        <div className="hidden group-hover/sub:block absolute left-full top-0 mt-0 w-48 bg-white rounded-md shadow-lg py-1">
                                            {subItem.items?.map((nestedItem, nIdx) => (
                                                <NavLink
                                                    key={nIdx}
                                                    to={nestedItem.path || '#'}
                                                    onClick={onClick}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    {nestedItem.name}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <NavLink
                                        to={subItem.path || '#'}
                                        onClick={onClick}
                                        className={({ isActive }) =>
                                            `block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isActive ? 'font-bold text-[var(--secondary-color)]' : ''}`
                                        }
                                    >
                                        {subItem.name}
                                    </NavLink>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <NavLink
            to={item.path || '#'}
            className={({ isActive }) =>
                `px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[var(--secondary-color)] ${isActive ? 'bg-[var(--secondary-color)]' : ''}`
            }
            onClick={onClick}
        >
            {item.name}
        </NavLink>
    );
};

const MobileNavItem: React.FC<{ item: NavigationItem; onClick: () => void }> = ({ item, onClick }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (item.isDropdown) {
        return (
            <div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex justify-between items-center px-3 py-2 rounded-md text-base font-medium text-white hover:bg-[var(--secondary-color)]"
                >
                    {item.name}
                    <i className={`fas fa-chevron-down transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                    <div className="pl-4 pt-1 pb-2 space-y-1">
                        {item.items?.map((subItem, idx) => (
                            <MobileNavItem key={idx} item={subItem} onClick={onClick} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <NavLink
            to={item.path || '#'}
            onClick={onClick}
            className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-[var(--secondary-color)] ${isActive ? 'bg-[var(--secondary-color)]' : ''}`
            }
        >
            {item.name}
        </NavLink>
    );
};

const Header: React.FC<HeaderProps> = ({ logo, teams, branches, settings }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    const handleLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    const enrichedNavigation = settings.navigation.map(item => {
        if (item.name === 'Branşlarımız' && item.isDropdown) {
            return {
                ...item,
                items: branches.map(b => ({
                    name: b.name,
                    path: `/brans/${b.slug}`,
                    isDropdown: false
                }))
            };
        }
        if (item.name === 'Takımlarımız' && item.isDropdown) {
            return {
                ...item,
                items: teams.map(t => ({
                    name: t.name,
                    path: `/takim/${t.slug}`,
                    isDropdown: false
                }))
            };
        }
        return item;
    });

    return (
        <>
            <header className="bg-[var(--primary-color)] text-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <Link to="/" className="flex items-center space-x-4" onClick={handleLinkClick}>
                            <img src={logo} alt="Logo" className="h-14 w-auto" />
                            <span className="text-2xl font-bold">ÇANGÜCÜ SK</span>
                        </Link>
                        
                        <nav className="hidden md:flex space-x-2 items-center">
                            {enrichedNavigation.filter(item => item.visible !== false).map((item, index) => (
                                <NavItem key={index} item={item} onClick={handleLinkClick} />
                            ))}
                        </nav>
                        
                         <div className="md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                aria-controls="mobile-menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? <i className="fas fa-times h-6 w-6"></i> : <i className="fas fa-bars h-6 w-6"></i>}
                            </button>
                        </div>
                    </div>
                </div>

                <div 
                    id="mobile-menu"
                    className={`absolute w-full bg-[var(--primary-color)] shadow-lg md:hidden overflow-y-auto transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <nav className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
                        {enrichedNavigation.filter(item => item.visible !== false).map((item, index) => (
                            <MobileNavItem key={index} item={item} onClick={handleLinkClick} />
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
