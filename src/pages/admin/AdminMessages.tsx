import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  User,
  Calendar,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../firebase';

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: any;
  read: boolean;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu mesajı silmek istediğinize emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'messages', id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  const toggleRead = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'messages', id), {
        read: !currentStatus
      });
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'unread') return matchesSearch && !msg.read;
    if (filter === 'read') return matchesSearch && msg.read;
    return matchesSearch;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">MESAJLAR</h1>
          <p className="text-gray-500 font-medium">İletişim formundan gelen tüm mesajlar</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${messages.filter(m => !m.read).length > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-xs font-black uppercase tracking-widest text-[#1a5f6b]">
              {messages.filter(m => !m.read).length} OKUNMAMIŞ
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Message List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Mesajlarda ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-none rounded-2xl py-3 pl-12 pr-4 font-bold text-sm text-[#1a5f6b] shadow-sm focus:ring-2 focus:ring-[#f97316] transition-all"
              />
            </div>
            <div className="flex bg-white rounded-2xl shadow-sm p-1 border border-gray-100">
              {(['all', 'unread', 'read'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === f ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-[#1a5f6b]'
                  }`}
                >
                  {f === 'all' ? 'HEPSİ' : f === 'unread' ? 'OKUNMAMIŞ' : 'OKUNMUŞ'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Mesaj bulunamadı</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <motion.div
                  layout
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (!msg.read) toggleRead(msg.id, false);
                  }}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer group relative ${
                    selectedMessage?.id === msg.id 
                      ? 'bg-[#1a5f6b] border-[#1a5f6b] text-white shadow-xl shadow-[#1a5f6b]/20' 
                      : msg.read 
                        ? 'bg-white border-gray-100 text-[#1a5f6b] hover:border-[#f97316]/30' 
                        : 'bg-white border-[#f97316]/20 text-[#1a5f6b] shadow-md shadow-[#f97316]/5'
                  }`}
                >
                  {!msg.read && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-[#f97316] rounded-full"></div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMessage?.id === msg.id ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <User className={`w-5 h-5 ${selectedMessage?.id === msg.id ? 'text-white' : 'text-[#1a5f6b]'}`} />
                      </div>
                      <div>
                        <h4 className="font-black uppercase tracking-tight text-sm leading-tight">{msg.name}</h4>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedMessage?.id === msg.id ? 'text-white/60' : 'text-gray-400'}`}>
                          {msg.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className={`text-xs line-clamp-2 mb-3 font-medium ${selectedMessage?.id === msg.id ? 'text-white/80' : 'text-gray-500'}`}>
                    {msg.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(msg.id);
                      }}
                      className={`p-2 rounded-lg transition-all ${selectedMessage?.id === msg.id ? 'hover:bg-red-500 text-white/40 hover:text-white' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedMessage ? (
              <motion.div
                key={selectedMessage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden sticky top-8"
              >
                <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-[#1a5f6b] rounded-2xl flex items-center justify-center text-white">
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tighter italic leading-tight">
                          {selectedMessage.name}
                        </h2>
                        <div className="flex items-center space-x-3 mt-1">
                          <a href={`mailto:${selectedMessage.email}`} className="text-xs font-black text-[#f97316] uppercase tracking-widest hover:underline flex items-center">
                            <Mail className="w-3 h-3 mr-1" /> {selectedMessage.email}
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => toggleRead(selectedMessage.id, selectedMessage.read)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center ${
                          selectedMessage.read 
                            ? 'bg-gray-100 text-gray-500 hover:bg-[#f97316] hover:text-white' 
                            : 'bg-[#f97316] text-white hover:bg-[#1a5f6b]'
                        }`}
                      >
                        {selectedMessage.read ? <Clock className="w-3 h-3 mr-2" /> : <CheckCircle2 className="w-3 h-3 mr-2" />}
                        {selectedMessage.read ? 'OKUNMADI İŞARETLE' : 'OKUNDU İŞARETLE'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="bg-gray-50 rounded-3xl p-8 relative">
                    <MessageSquare className="absolute top-4 right-4 w-12 h-12 text-[#1a5f6b]/5" />
                    <p className="text-[#1a5f6b] font-medium text-lg leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center space-x-4 text-gray-400">
                      <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(selectedMessage.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleDelete(selectedMessage.id)}
                        className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> MESAJI SİL
                      </button>
                      <a 
                        href={`mailto:${selectedMessage.email}?subject=Çangücü SK İletişim&body=Merhaba ${selectedMessage.name},`}
                        className="px-6 py-3 bg-[#1a5f6b] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f97316] transition-all flex items-center shadow-lg shadow-[#1a5f6b]/20"
                      >
                        <Mail className="w-4 h-4 mr-2" /> CEVAPLA
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[40px] border border-dashed border-gray-200">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-[#1a5f6b] uppercase tracking-tight italic">MESAJ SEÇİN</h3>
                <p className="text-gray-400 font-medium max-w-xs mx-auto mt-2">
                  Detayları görüntülemek için sol taraftaki listeden bir mesaj seçin.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
