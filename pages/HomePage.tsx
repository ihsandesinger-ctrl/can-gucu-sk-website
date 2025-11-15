import React from 'react';
import { Link } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import NewsCard from '../components/NewsCard';
import type { Fixture, NewsArticle, GalleryItem, HomePageHero } from '../types';

interface HomePageProps {
    heroContent: HomePageHero;
    fixtures: {
        u11: Fixture;
        u12: Fixture;
    };
    news: NewsArticle[];
    gallery: GalleryItem[];
    siteLogo: string;
}

const HomePage: React.FC<HomePageProps> = ({ heroContent, fixtures, news, gallery, siteLogo }) => {
    const upcomingMatchU11 = fixtures.u11.matches.find(m => m.score === '-');
    const upcomingMatchU12 = fixtures.u12.matches.find(m => m.score === '-');
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
                        {upcomingMatchU11 && (
                            <MatchCard 
                                teamName={fixtures.u11.teamName}
                                date={upcomingMatchU11.date}
                                homeTeam="Çangücü SK"
                                awayTeam={upcomingMatchU11.opponent}
                                homeTeamLogo={siteLogo}
                            />
                        )}
                         {upcomingMatchU12 && (
                            <MatchCard 
                                teamName={fixtures.u12.teamName}
                                date={upcomingMatchU12.date}
                                homeTeam="Çangücü SK"
                                awayTeam={upcomingMatchU12.opponent}
                                homeTeamLogo={siteLogo}
                            />
                        )}
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
                        {recentNews.slice(1).map(article => (
                             <NewsCard key={article.id} article={article} />
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
                        {recentPhotos.map((photo) => (
                             <Link to="/galeri" key={photo.id} className="block relative rounded-lg overflow-hidden shadow-md group h-48 cursor-pointer">
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

// FIX: Added default export to the HomePage component.
export default HomePage;