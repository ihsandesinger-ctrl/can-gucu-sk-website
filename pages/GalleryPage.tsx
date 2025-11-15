
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((item) => (
            <div key={item.id} className="relative rounded-xl overflow-hidden shadow-lg group">
              <img src={item.imageUrl} alt={item.title || 'Gallery Image'} className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-300" />
              {item.title && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <p className="absolute bottom-4 left-4 text-white font-semibold">{item.title}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
