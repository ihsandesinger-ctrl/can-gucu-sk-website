import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';

const Maintenance = () => {
  const { settings } = useAuth();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full"
      >
        <img 
          src={settings.clubLogo} 
          alt={settings.clubName} 
          className="h-48 w-auto mx-auto mb-12 drop-shadow-2xl"
          referrerPolicy="no-referrer"
        />
        
        <h1 className="text-6xl font-black text-[#1a5f6b] mb-6 uppercase tracking-tighter italic">
          SİTE BAKIMDADIR
        </h1>
        
        <div className="h-2 w-24 bg-[#f97316] mx-auto rounded-full mb-8"></div>
        
        <p className="text-gray-500 text-xl font-bold leading-relaxed max-w-lg mx-auto">
          Sizlere daha iyi bir deneyim sunabilmek için sitemizi güncelliyoruz. 
          Anlayışınız için teşekkür ederiz.
        </p>
      </motion.div>
      
      <div className="absolute bottom-12 left-0 right-0">
        <p className="text-gray-300 text-sm font-black uppercase tracking-[0.3em]">
          {settings.clubName} © 2025
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
