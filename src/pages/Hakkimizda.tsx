import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { Trophy, Users, Target, Shield } from 'lucide-react';

const Hakkimizda = () => {
  const { settings } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a5f6b] text-white py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: 'radial-gradient(#f97316 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter italic mb-4">HAKKIMIZDA</h1>
          <div className="h-2 w-32 bg-[#f97316] mx-auto rounded-full"></div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-black text-[#1a5f6b] uppercase tracking-tight mb-8 italic">
              BİZ KİMİZ?
            </h2>
            <div className="prose prose-lg text-gray-600 font-medium leading-relaxed">
              <p className="whitespace-pre-wrap">
                {settings.aboutText || 'Çangücü SK, Çan\'ın en köklü spor kulüplerinden biridir. Geleceğin yıldızlarını yetiştirmek ve sporun her dalında başarıyı hedeflemek amacıyla kurulmuştur.'}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6"
          >
            {[
              { icon: Trophy, label: 'BAŞARI', color: 'bg-orange-50 text-[#f97316]' },
              { icon: Users, label: 'BİRLİKTELİK', color: 'bg-blue-50 text-blue-600' },
              { icon: Target, label: 'DİSİPLİN', color: 'bg-green-50 text-green-600' },
              { icon: Shield, label: 'GÜVEN', color: 'bg-purple-50 text-purple-600' }
            ].map((item, i) => (
              <div key={i} className={`${item.color} p-10 rounded-[40px] text-center shadow-xl border border-white flex flex-col items-center justify-center space-y-4`}>
                <item.icon className="w-12 h-12" />
                <span className="font-black uppercase tracking-widest text-xs">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hakkimizda;
