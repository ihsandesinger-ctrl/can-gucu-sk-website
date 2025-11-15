
import React from 'react';
import type { NewsArticle } from '../types';
import NewsCard from '../components/NewsCard';

interface NewsPageProps {
  news: NewsArticle[];
}

const NewsPage: React.FC<NewsPageProps> = ({ news }) => {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Haberler ve Duyurular</h1>
          <p className="text-lg text-gray-600 mt-2">Kulübümüzden en son gelişmeler.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((article) => (
            <div key={article.id} className="h-full">
                <NewsCard article={article} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
