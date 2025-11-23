import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Bot as BotType } from '../lib/database.types';
import { Bot, Plus, LogOut, Settings, MessageSquare, BarChart3 } from 'lucide-react';
import BotCard from '../components/BotCard';
import CreateBotModal from '../components/CreateBotModal';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBotCreated = () => {
    fetchBots();
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black text-black">NovaBot</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="inline-block px-4 py-1.5 bg-primary-100 rounded-full mb-4">
              <span className="text-primary-600 font-medium text-sm">Dashboard</span>
            </div>
            <h2 className="text-5xl font-black text-black tracking-tight mb-2">Your chatbots.</h2>
            <p className="text-gray-600 text-lg mt-2">Create and manage AI-powered chatbots</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-primary-500 text-white px-8 py-4 rounded-2xl hover:bg-primary-600 transition-all shadow-sm font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Create new bot</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bots.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <Bot className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No chatbots yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by creating your first AI chatbot. Upload documents and let your users ask questions!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create Your First Bot</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <BotCard key={bot.id} bot={bot} onUpdate={fetchBots} />
            ))}
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Upload Documents</h3>
            </div>
            <p className="text-sm text-gray-600">
              Add PDF, DOCX, or TXT files to create your chatbot's knowledge base
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Customize Design</h3>
            </div>
            <p className="text-sm text-gray-600">
              Match your brand with custom colors, avatars, and welcome messages
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Embed Anywhere</h3>
            </div>
            <p className="text-sm text-gray-600">
              Get a simple embed code to add your chatbot to any website
            </p>
          </div>
        </div>
      </main>

      {showCreateModal && (
        <CreateBotModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBotCreated}
        />
      )}
    </div>
  );
}