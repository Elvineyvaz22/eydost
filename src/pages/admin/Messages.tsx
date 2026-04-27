import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Mail, Clock, Search, Trash2, CheckCircle, RefreshCw } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
  status: 'new' | 'read' | 'replied';
}

export default function Messages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMessages = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        // If the table doesn't have a status column yet, we just assume they are new
        const messagesWithStatus = data.map(msg => ({
          ...msg,
          status: msg.status || 'new'
        }));
        setMessages(messagesWithStatus);
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (id: string, currentStatus: string) => {
    if (currentStatus === 'read') return;
    
    try {
      // Optimistic update
      setMessages(messages.map(m => m.id === id ? { ...m, status: 'read' } : m));
      
      const { error } = await supabase
        .from('contact_submissions')
        .update({ status: 'read' })
        .eq('id', id);
        
      if (error) {
        // Fallback if status column doesn't exist
        console.log("Could not update status. Table might need a 'status' column.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm('Bu mesajı silmək istədiyinizə əminsiniz?')) return;
    
    try {
      setMessages(messages.filter(m => m.id !== id));
      
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      fetchMessages(); // Revert on error
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.name?.toLowerCase().includes(search.toLowerCase()) || 
    msg.email?.toLowerCase().includes(search.toLowerCase()) ||
    msg.message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Mesajlar</h1>
            <p className="text-gray-500 text-sm mt-1">Saytdan göndərilən bütün müraciətlər və suallar.</p>
          </div>
          <button 
            onClick={fetchMessages}
            disabled={isRefreshing}
            className={`flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm ${isRefreshing ? 'opacity-70' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Yenilə
          </button>
        </header>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Ad, email və ya mesaja görə axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Yüklənir...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Heç bir mesaj tapılmadı.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`p-6 transition-colors ${msg.status === 'new' ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                  onClick={() => markAsRead(msg.id, msg.status)}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Avatar/Icon */}
                    <div className="shrink-0 hidden sm:block">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm
                        ${msg.status === 'new' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                      >
                        <Mail className="w-6 h-6" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-lg truncate ${msg.status === 'new' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {msg.name || 'Ad yoxdur'}
                          </h3>
                          {msg.status === 'new' && (
                            <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Yeni</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(msg.created_at).toLocaleString('az-AZ')}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
                        <a href={`mailto:${msg.email}`} className="text-blue-600 hover:underline font-medium break-all">
                          {msg.email}
                        </a>
                        {msg.phone && (
                          <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md text-xs">{msg.phone}</span>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-2xl text-gray-700 text-sm whitespace-pre-wrap border border-gray-100">
                        {msg.message}
                      </div>
                      
                      <div className="mt-4 flex items-center justify-end gap-3">
                        {msg.status === 'new' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); markAsRead(msg.id, msg.status); }}
                            className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" /> Oxundu kimi qeyd et
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
