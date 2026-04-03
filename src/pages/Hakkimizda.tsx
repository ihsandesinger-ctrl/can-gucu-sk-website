import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { Trophy, Users, Target, Shield, User } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface Staff {
  id: string;
  name: string;
  role: string;
  image: string;
  isHidden: boolean;
}

const Hakkimizda = () => {
  const { settings } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'staff'),
      where('isHidden', '==', false),
      orderBy('name', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Staff[]);
    });
    return () => unsubscribe();
  }, []);

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
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div>
              <h2 className="text-4xl font-black text-[#1a5f6b] uppercase tracking-tight mb-6 italic flex items-center gap-3">
                <Target className="w-8 h-8 text-[#f97316]" /> MİSYONUMUZ
              </h2>
              <div className="prose prose-lg text-gray-600 font-medium leading-relaxed bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
                <p className="whitespace-pre-wrap">
                  {settings.missionText || 'Sporun her dalında etik değerlere bağlı, disiplinli ve başarılı bireyler yetiştirerek Türk sporuna katkı sağlamak.'}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-black text-[#1a5f6b] uppercase tracking-tight mb-6 italic flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#f97316]" /> VİZYONUMUZ
              </h2>
              <div className="prose prose-lg text-gray-600 font-medium leading-relaxed bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
                <p className="whitespace-pre-wrap">
                  {settings.visionText || 'Çan\'ın ve bölgenin en prestijli, altyapısı en güçlü ve başarılarıyla örnek gösterilen spor kulübü olmak.'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6 sticky top-32"
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

        {/* Management Board (Yönetim Kurulu) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-[#1a5f6b] uppercase tracking-tight italic mb-4">
              YÖNETİM KURULU
            </h2>
            <div className="h-1.5 w-24 bg-[#f97316] mx-auto rounded-full"></div>
          </div>

          {staff.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {staff.map((person) => (
                <motion.div
                  key={person.id}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-gray-100 group"
                >
                  <div className="aspect-[4/5] relative overflow-hidden">
                    {person.image ? (
                      <img 
                        src={person.image} 
                        alt={person.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <User className="w-20 h-20 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a5f6b]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-8 text-center">
                    <h3 className="text-xl font-black text-[#1a5f6b] uppercase tracking-tight mb-1">{person.name}</h3>
                    <p className="text-[#f97316] font-bold text-xs uppercase tracking-[0.2em]">{person.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-16 rounded-[40px] text-center shadow-xl border border-gray-100">
              <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest">Yönetim kurulu üyeleri yakında eklenecektir.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Hakkimizda;
