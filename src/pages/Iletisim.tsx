import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const Iletisim = () => {
  const { settings } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...formData,
        createdAt: serverTimestamp(),
        read: false
      });
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter italic mb-4">İLETİŞİM</h1>
          <div className="h-2 w-32 bg-[#f97316] mx-auto rounded-full"></div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div>
              <h2 className="text-4xl font-black text-[#1a5f6b] uppercase tracking-tight mb-8 italic">
                BİZE ULAŞIN
              </h2>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">
                Her türlü soru, öneri ve kayıt işlemleri için bizimle iletişime geçebilirsiniz.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { icon: Mail, label: 'E-POSTA', value: settings.email || 'info@cangucusk.com' },
                { icon: Phone, label: 'TELEFON', value: settings.phone || '+90 555 555 55 55' },
                { icon: MapPin, label: 'ADRES', value: settings.address || 'Çan, Çanakkale' }
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-6 bg-white p-6 rounded-[32px] shadow-xl border border-gray-100">
                  <div className="w-16 h-16 bg-[#1a5f6b]/10 rounded-2xl flex items-center justify-center">
                    <item.icon className="w-8 h-8 text-[#1a5f6b]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-lg font-black text-[#1a5f6b] uppercase tracking-tight">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-4 pt-8">
              {[
                { icon: Instagram, link: settings.instagram ? `https://instagram.com/${settings.instagram.replace('@', '')}` : '#' },
                { icon: Facebook, link: settings.facebook || '#' },
                { icon: Twitter, link: settings.twitter || '#' }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#1a5f6b] shadow-xl border border-gray-100 hover:bg-[#f97316] hover:text-white transition-all transform hover:-translate-y-1"
                >
                  <social.icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Contact Form Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white p-12 rounded-[48px] shadow-2xl border border-gray-100"
          >
            <h3 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight mb-8 italic">MESAJ GÖNDERİN</h3>
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h4 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tight">MESAJINIZ ALINDI!</h4>
                <p className="text-gray-500 font-medium">En kısa sürede size dönüş yapacağız.</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="text-[#f97316] font-black uppercase tracking-widest text-sm hover:underline"
                >
                  YENİ MESAJ GÖNDER
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Adınız Soyadınız</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">E-posta Adresiniz</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mesajınız</label>
                  <textarea 
                    rows={4} 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1a5f6b] focus:ring-2 focus:ring-[#f97316] transition-all" 
                  />
                </div>
                <button 
                  disabled={loading}
                  className="w-full bg-[#f97316] text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-[#f97316]/20 hover:bg-[#1a5f6b] transition-all transform hover:-translate-y-1 flex items-center justify-center disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  {loading ? 'GÖNDERİLİYOR...' : 'GÖNDER'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Iletisim;
