import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, Mail, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';

const LoginPage = () => {
  const { settings } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/cangucu-panel');
    } catch (err: any) {
      setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/cangucu-panel');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a5f6b] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-10">
          <div className="flex justify-center mb-8">
            <img 
              src={settings.clubLogo} 
              alt={settings.clubName} 
              className="h-24 w-auto drop-shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <h1 className="text-3xl font-black text-[#1a5f6b] text-center uppercase tracking-tighter italic mb-2">YÖNETİCİ GİRİŞİ</h1>
          <p className="text-gray-400 text-center text-xs font-bold uppercase tracking-widest mb-8">{settings.clubName} Güvenli Erişim</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold uppercase tracking-wide mb-6 text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="E-POSTA ADRESİ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#f97316] transition-all"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="ŞİFRE"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#f97316] transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a5f6b] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#f97316] transition-all duration-300 shadow-xl shadow-[#1a5f6b]/20 disabled:opacity-50"
            >
              {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-bold">Veya</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white border-2 border-gray-100 text-gray-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-3"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            <span>GOOGLE İLE GİRİŞ</span>
          </button>
        </div>
        
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
          <button 
            onClick={() => navigate('/')}
            className="text-[10px] font-black text-gray-400 hover:text-[#1a5f6b] uppercase tracking-[0.2em] transition-colors"
          >
            SİTEYE GERİ DÖN
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
