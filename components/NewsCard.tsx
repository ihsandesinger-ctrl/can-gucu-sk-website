
import React from 'react';
import { Link } from 'react-router-dom';
import type { NewsArticle } from '../types';

interface NewsCardProps {
    article: NewsArticle;
    large?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, large = false }) => {
    const cardClasses = large 
        ? "md:col-span-2 md:row-span-2 flex-col"
        : "flex-col";
    
    const imageContainerClasses = large ? "h-64 sm:h-96" : "h-56";
    const contentClasses = large ? "p-6" : "p-5";

    return (
        <Link to={`/haber/${article.id}`} className={`bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-2 transition-all duration-300 flex h-full border border-gray-100 ${cardClasses}`}>
            <div className={`relative w-full ${imageContainerClasses} bg-gray-100`}>
                <img 
                    className="absolute inset-0 w-full h-full object-cover" 
                    src={article.imageUrl} 
                    alt={article.title} 
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <div className={`w-full ${contentClasses} flex flex-col flex-grow`}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-md uppercase tracking-wider">Haber</span>
                    <p className="text-[10px] text-gray-400 font-medium">{new Date(article.date).toLocaleDateString('tr-TR')}</p>
                </div>
                <h3 className={`font-bold text-gray-900 ${large ? 'text-2xl' : 'text-lg'} mb-3 leading-tight group-hover:text-orange-600 transition-colors`}>
                    {article.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                    {article.summary}
                </p>
                <div className="mt-auto flex items-center text-orange-600 text-xs font-bold group">
                    Devamını Oku
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    );
};

export default NewsCard;
