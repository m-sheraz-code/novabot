import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bot, Document } from '../lib/database.types';
import { ArrowLeft, FileText, Trash2, Code, Eye, Settings as SettingsIcon } from 'lucide-react';
import DocumentUpload from '../components/DocumentUpload';
import BotSettings from '../components/BotSettings';
import EmbedCode from '../components/EmbedCode';

type Tab = 'documents' | 'settings' | 'embed';

export default function BotManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<Bot | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('documents');

  useEffect(() => {
    if (id) {
      fetchBot();
      fetchDocuments();
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

  const fetchDocuments = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('bot_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase.from('documents').delete().eq('id', docId);
      if (error) throw error;
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!bot) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-primary-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: bot.primary_color + '20' }}
            >
              {bot.avatar_url || '🤖'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{bot.name}</h1>
              {bot.description && (
                <p className="text-gray-600 mt-1">{bot.description}</p>
              )}
            </div>
          </div>

          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm inline-flex border border-primary-100">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition ${
                activeTab === 'documents'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:bg-primary-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium">Documents</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition ${
                activeTab === 'settings'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:bg-primary-50'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition ${
                activeTab === 'embed'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:bg-primary-50'
              }`}
            >
              <Code className="w-4 h-4" />
              <span className="font-medium">Embed Code</span>
            </button>
          </div>
        </div>

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <DocumentUpload botId={bot.id} onUploadComplete={fetchDocuments} />

            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Uploaded Documents ({documents.length})
              </h3>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-primary-300" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-100 hover:border-primary-200 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.filename}</p>
                          <p className="text-sm text-gray-500">
                            {(doc.file_size / 1024).toFixed(1)} KB • {doc.status}
                            {doc.total_chunks > 0 && ` • ${doc.total_chunks} chunks`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && <BotSettings bot={bot} onUpdate={fetchBot} />}

        {activeTab === 'embed' && <EmbedCode bot={bot} />}

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate(`/bot/${bot.id}/preview`)}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition shadow-lg active:bg-primary-700"
          >
            <Eye className="w-5 h-5" />
            <span className="font-medium">Preview Chatbot</span>
          </button>
        </div>
      </main>
    </div>
  );
}