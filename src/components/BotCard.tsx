import { useState } from 'react';
import { Bot as BotType } from '../lib/database.types';
import { Settings, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface BotCardProps {
  bot: BotType;
  onUpdate: () => void;
}

export default function BotCard({ bot, onUpdate }: BotCardProps) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.from('bots').delete().eq('id', bot.id);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error deleting bot:', error);
      alert('Failed to delete bot');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
      <div
        className="h-3"
        style={{ backgroundColor: bot.primary_color }}
      ></div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{bot.name}</h3>
            {bot.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{bot.description}</p>
            )}
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ml-4"
            style={{ backgroundColor: bot.primary_color + '20' }}
          >
            <span className="text-2xl">{bot.avatar_url || '🤖'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            bot.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {bot.is_active ? 'Active' : 'Inactive'}
          </span>
          <span>{new Date(bot.created_at).toLocaleDateString()}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate(`/bot/${bot.id}`)}
            className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            <span>Manage</span>
          </button>

          <button
            onClick={() => navigate(`/bot/${bot.id}/preview`)}
            className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center space-x-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}