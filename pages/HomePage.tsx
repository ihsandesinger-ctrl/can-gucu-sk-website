import React from 'react';
import { Link } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import NewsCard from '../components/NewsCard';
import type { Fixture, NewsArticle, GalleryItem, HomePageHero, Team } from '../types';

interface HomePageProps {
    heroContent: HomePageHero;
    fixtures: Fixture[];
    teams: Team[];
    news: NewsArticle[];
    gallery: GalleryItem[];
    siteLogo: string;
    siteTitle: string;
}

const HomePage: React.FC<HomePageProps> = ({ heroContent, fixtures, teams, news, gallery, siteLogo, siteTitle }) => {
    
    // Find all upcoming matches from all fixtures
    const getUpcomingMatches = () => {
        const upcoming: any[] = [];
        if (!fixtures || !Array.isArray(fixtures)) return upcoming;

        fixtures.forEach(fixture => {
            if (fixture && Array.isArray(fixture.matches)) {
                // Find the first upcoming match for this team
                const teamUpcomingMatches = fixture.matches.filter(match => {
                    const score = match.score ? String(match.score).trim() : '';
                    return !score || 
                           score === '-' || 
                           score.toLowerCase() === 'v' ||
                           score.toLowerCase() === 'vs' ||
                           score.toLowerCase().includes('v');
                });

                if (teamUpcomingMatches.length > 0) {
                    // Sort these matches by date to find the first one
                    const sortedTeamMatches = teamUpcomingMatches.sort((a, b) => {
                        if (!a.date) return 1;
                        if (!b.date) return -1;
                        return a.date.localeCompare(b.date);
                    });
                    
                    upcoming.push({ ...sortedTeamMatches[0], teamName: fixture.teamName });
                }
            }
        });

        // Sort by date (YYYY-MM-DD)
        return upcoming.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date.localeCompare(b.date);
        });
    }

    const upcomingMatches = getUpcomingMatches();
    const recentNews = news.slice(0, 5);
    const recentPhotos = gallery.slice(0, 6);

    if (!heroContent) return null;

    const renderSection = (sectionId: string) => {
        switch (sectionId) {
            case 'matches':
                return (
                    <section key="matches" className="bg-[var(--primary-color)] py-16">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-3xl font-bold text-center text-white mb-10">SIRADAKİ MAÇLAR</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {upcomingMatches.length > 0 ? (
                                    upcomingMatches.map((match, index) => (
                                        <MatchCard 
                                            key={index}
                                            teamName={match.teamName}
                                            date={match.date}
                                            homeTeam={match.location === 'Ev' ? "Çangücü SK" : match.opponent}
                                            awayTeam={match.location === 'Ev' ? match.opponent : "Çangücü SK"}
                                            homeTeamLogo={match.homeLogo}
                                            awayTeamLogo={match.awayLogo}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-white/70 py-10">
                                        <p className="text-lg">Henüz planlanmış maç bulunmamaktadır.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                );
            case 'news':
                return (
                    <section key="news" className="py-16 bg-gray-50">
                         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-3xl font-bold text-gray-800">Haberler ve Duyurular</h2>
                                <Link to="/haberler" className="text-[var(--secondary-color)] font-semibold hover:underline">
                                    Tüm Haberler &rarr;
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {recentNews.length > 0 && <NewsCard article={recentNews[0]} large={true} />}
                                {recentNews.slice(1).map((article, index) => (
                                     <NewsCard key={index} article={article} />
                                ))}
                            </div>
                        </div>
                    </section>
                );
            case 'gallery':
                return (
                    <section key="gallery" className="py-16 bg-white">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-3xl font-bold text-gray-800">Galeri</h2>
                                <Link to="/galeri" className="text-[var(--secondary-color)] font-semibold hover:underline">
                                    Tümünü Gör &rarr;
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                {recentPhotos.map((photo, index) => (
                                     <Link to="/galeri" key={index} className="block relative rounded-lg overflow-hidden shadow-md group h-48 cursor-pointer">
                                        {photo.imageUrl ? (
                                            <img 
                                                src={photo.imageUrl} 
                                                alt={photo.title || 'Galeri Fotoğrafı'} 
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" 
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                                <span className="text-xs">Görsel Yok</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <i className="fa fa-eye text-white text-2xl"></i>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            default:
                return null;
        }
    };

    const sortedSections = [...(heroContent.sections || [])].sort((a, b) => a.order - b.order);

    return (
        <div>
            {/* Hero Section */}
            <div className="relative h-[50vh] md:h-[70vh] overflow-hidden bg-[var(--primary-color)]">
                {/* Gradient background for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-color)] via-black/40 to-black z-0"></div>
                
                {/* Blurred background to fill gaps */}
                <div 
                    className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-30"
                    style={{ backgroundImage: `url('${heroContent.heroImage}')` }}
                ></div>
                
                {/* Main image - contained on mobile, cover on desktop */}
                <div className="absolute inset-0 z-10">
                    <img 
                        src={heroContent.heroImage} 
                        alt={heroContent.heroTitle}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                </div>

                {/* Overlay for text readability */}
                <div className="absolute inset-0 bg-black/20 z-20"></div>
                <div className="relative z-30 flex flex-col items-center justify-center h-full text-white text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 drop-shadow-xl">
                        {heroContent.heroTitle}
                    </h1>
                    <p className="text-lg md:text-xl max-w-2xl drop-shadow-lg font-medium">
                        {heroContent.heroSubtitle}
                    </p>
                </div>
            </div>

            {/* Dynamic Sections */}
            {sortedSections.map(section => section.visible && renderSection(section.id))}
        </div>
    );
};

export default HomePage;