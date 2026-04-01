
import React from 'react';
import type { GalleryItem } from '../types';

interface GalleryPageProps {
  images: GalleryItem[];
}

const GalleryPage: React.FC<GalleryPageProps> = ({ images }) => {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Fotoğraf Galerisi</h1>
          <p className="text-lg text-gray-600 mt-2">Takımlarımızın maç ve antrenmanlarından en güzel anlar.</p>
        </div>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {images.map((item) => (
            <div key={item.id} className="break-inside-avoid relative rounded-xl overflow-hidden shadow-lg group bg-slate-100">
              {item.imageUrl ? (
                <div className="relative">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title || 'Gallery Image'} 
                    className="w-full h-auto block transform group-hover:scale-[1.02] transition-transform duration-300" 
                  />
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white font-medium">{item.title}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 bg-slate-200 flex items-center justify-center text-slate-400">
                  <span>Görsel Yok</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
