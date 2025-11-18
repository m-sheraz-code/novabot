import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bot } from '../lib/database.types';
import { ArrowLeft } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';

export default function BotPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBot();
    }
  }, [id]);

  const fetchBot = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/dashboard');
        return;
      }
      setBot(data);
    } catch (error) {
      console.error('Error fetching bot:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bot) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(`/bot/${bot.id}`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Bot Management</span>
            </button>
            <div className="text-sm text-gray-600">
              Preview Mode - This is how your chatbot will appear
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{bot.name} Preview</h1>
          <p className="text-gray-600">
            This is a live preview of your chatbot. Try asking questions to test it out!
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 min-h-[600px] relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Example Website
            </h2>
            <p className="text-gray-600">
              Your chatbot widget will appear in the {bot.widget_position} corner
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Sample Content</h3>
            <p className="text-gray-600 mb-4">
              This represents a page on your website. The chatbot widget is floating
              below and visitors can click on it to start a conversation.
            </p>
            <p className="text-gray-600">
              The chatbot will use the documents you've uploaded to answer questions
              intelligently using AI and RAG technology.
            </p>
          </div>
        </div>
      </main>

      <ChatWidget bot={bot} />
    </div>
  );
}