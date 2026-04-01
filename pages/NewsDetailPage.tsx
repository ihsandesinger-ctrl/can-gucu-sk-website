
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import type { NewsArticle } from '../types';
import Markdown from 'react-markdown';

interface NewsDetailPageProps {
  news: NewsArticle[];
}

const NewsDetailPage: React.FC<NewsDetailPageProps> = ({ news }) => {
  const { id } = useParams<{ id: string }>();
  const article = news.find(a => a.id.toString() === id);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Haber bulunamadı.</h2>
        <Link to="/haberler" className="text-orange-600 font-bold hover:underline">Tüm Haberlere Dön</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[60vh] bg-gray-900 overflow-hidden">
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-20"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white z-30">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-full uppercase tracking-widest">Haber</span>
              <p className="text-sm font-medium opacity-90 drop-shadow-md">{new Date(article.date).toLocaleDateString('tr-TR')}</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-12 border border-gray-100">
          <div className="mb-8 pb-8 border-b border-gray-100">
            <p className="text-xl text-gray-600 font-medium leading-relaxed italic">
              {article.summary}
            </p>
          </div>
          
          <div className="prose prose-lg max-w-none text-gray-800 leading-loose">
            <div className="markdown-body">
              <Markdown>{article.content}</Markdown>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
            <Link to="/haberler" className="flex items-center text-gray-500 hover:text-orange-600 font-bold transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Geri Dön
            </Link>
            
            <div className="flex gap-4">
              {/* Social Share Placeholders */}
              <button className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </button>
              <button className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-pink-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;
