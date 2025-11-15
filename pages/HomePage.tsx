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
}

const HomePage: React.FC<HomePageProps> = ({ heroContent, fixtures, teams, news, gallery, siteLogo }) => {
    
    // Find the next upcoming match for the first two teams in the list
    const getUpcomingMatches = () => {
        const upcoming = [];
        for(const team of teams.slice(0, 2)) {
            const teamFixture = fixtures.find(f => f.teamSlug === team.slug);
            if (teamFixture) {
                const nextMatch = teamFixture.matches.find(m => m.score === '-');
                if (nextMatch) {
                    upcoming.push({ ...nextMatch, teamName: teamFixture.teamName });
                }
            }
        }
        return upcoming;
    }

    const upcomingMatches = getUpcomingMatches();
    const recentNews = news.slice(0, 5);
    const recentPhotos = gallery.slice(0, 6);

    return (
        <div>
            {/* Hero Section */}
            <div className="relative h-[60vh] bg-cover bg-center" style={{ backgroundImage: `url('${heroContent.heroImage}')` }}>
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                        {heroContent.heroTitle}
                    </h1>
                    <p className="text-lg md:text-xl max-w-2xl">
                        {heroContent.heroSubtitle}
                    </p>
                </div>
            </div>

            {/* Upcoming Matches Section */}
            <section className="bg-[#267d87] py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-white mb-10">SIRADAKİ MAÇLAR</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {upcomingMatches.map((match, index) => (
                             <MatchCard 
                                key={index}
                                teamName={match.teamName}
                                date={match.date}
                                homeTeam="Çangücü SK"
                                awayTeam={match.opponent}
                                homeTeamLogo={siteLogo}
                            />
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Recent News Section */}
            <section className="py-16 bg-gray-50">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-800">Haberler ve Duyurular</h2>
                        <Link to="/haberler" className="text-orange-600 font-semibold hover:underline">
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

            {/* Gallery Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-800">Galeri</h2>
                        <Link to="/galeri" className="text-orange-600 font-semibold hover:underline">
                            Tümünü Gör &rarr;
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {recentPhotos.map((photo, index) => (
                             <Link to="/galeri" key={index} className="block relative rounded-lg overflow-hidden shadow-md group h-48 cursor-pointer">
                                <img 
                                    src={photo.imageUrl} 
                                    alt={photo.title || 'Galeri Fotoğrafı'} 
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" 
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <i className="fa fa-eye text-white text-2xl"></i>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;