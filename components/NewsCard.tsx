
import React from 'react';
import type { NewsArticle } from '../types';

interface NewsCardProps {
    article: NewsArticle;
    large?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, large = false }) => {
    const cardClasses = large 
        ? "md:col-span-2 md:row-span-2 flex-col"
        : "flex-col";
    
    const imageContainerClasses = large ? "h-64 sm:h-80" : "h-48";
    const contentClasses = large ? "p-6" : "p-4";

    return (
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex ${cardClasses}`}>
            <div className={`relative w-full ${imageContainerClasses}`}>
                <img className="absolute inset-0 w-full h-full object-cover" src={article.imageUrl} alt={article.title} />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>
            <div className={`w-full ${contentClasses} flex flex-col`}>
                <p className="text-xs text-gray-500 mb-1">{article.date}</p>
                <h3 className={`font-bold text-gray-800 ${large ? 'text-2xl' : 'text-lg'} mb-2 flex-grow`}>
                    {article.title}
                </h3>
                {large && <p className="text-gray-600 text-sm">{article.summary}</p>}
            </div>
        </div>
    );
};

export default NewsCard;
