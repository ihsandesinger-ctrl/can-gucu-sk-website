import React from 'react';
import { motion } from 'motion/react';
import { Settings } from 'lucide-react';

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-[#1a5f6b] flex flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/10 backdrop-blur-xl p-12 rounded-[40px] border border-white/10 shadow-2xl"
      >
        <div className="w-24 h-24 bg-[#f97316] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(249,115,22,0.4)]">
          <Settings className="w-12 h-12 text-white animate-spin-slow" />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter italic">BAKIM MODU</h1>
        <p className="text-gray-300 font-medium leading-relaxed mb-8">
          Sizlere daha iyi hizmet verebilmek için sitemizi güncelliyoruz. Çok yakında tekrar aranızdayız!
        </p>
        <div className="h-1 w-24 bg-[#f97316] mx-auto rounded-full"></div>
      </motion.div>
      
      <p className="mt-12 text-white/40 text-xs font-black uppercase tracking-[0.3em]">
        Çangücü SK © 2025
      </p>
    </div>
  );
};

export default Maintenance;
