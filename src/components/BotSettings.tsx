import { useState } from 'react';
import { Bot } from '../lib/database.types';
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';

interface BotSettingsProps {
  bot: Bot;
  onUpdate: () => void;
}

const COLORS = [
  { name: 'Light Blue', value: '#5eb8ff' },
  { name: 'Blue', value: '#3da8ff' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Purple', value: '#A855F7' },
];

const AVATARS = ['🤖', '💬', '🎯', '⚡', '🚀', '💡', '🌟', '🔥'];

const POSITIONS = [
  { label: 'Bottom Right', value: 'bottom-right' },
  { label: 'Bottom Left', value: 'bottom-left' },
];

export default function BotSettings({ bot, onUpdate }: BotSettingsProps) {
  const [name, setName] = useState(bot.name);
  const [description, setDescription] = useState(bot.description || '');
  const [primaryColor, setPrimaryColor] = useState(bot.primary_color);
  const [avatar, setAvatar] = useState(bot.avatar_url || AVATARS[0]);
  const [welcomeMessage, setWelcomeMessage] = useState(bot.welcome_message);
  const [widgetPosition, setWidgetPosition] = useState(bot.widget_position);
  const [isActive, setIsActive] = useState(bot.is_active);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('bots')
        .update({
          name,
          description,
          primary_color: primaryColor,
          avatar_url: avatar,
          welcome_message: welcomeMessage,
          widget_position: widgetPosition,
          is_active: isActive,
        } as any)
        .eq('id', bot.id);

      if (error) throw error;

      setMessage('Settings saved successfully!');
      onUpdate();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Bot Settings</h3>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.startsWith('Error')
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bot Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="grid grid-cols-6 gap-3">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setPrimaryColor(color.value)}
                className={`h-12 rounded-lg transition ${
                  primaryColor === color.value
                    ? 'ring-2 ring-offset-2 ring-blue-500'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Avatar
          </label>
          <div className="grid grid-cols-8 gap-3">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`h-12 text-2xl rounded-lg border-2 transition ${
                  avatar === emoji
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Welcome Message
          </label>
          <input
            type="text"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Widget Position
          </label>
          <div className="grid grid-cols-2 gap-3">
            {POSITIONS.map((position) => (
              <button
                key={position.value}
                type="button"
                onClick={() => setWidgetPosition(position.value)}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                  widgetPosition === position.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {position.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Bot Status</p>
            <p className="text-sm text-gray-600">
              {isActive ? 'Bot is active and visible' : 'Bot is inactive'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              isActive ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{loading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </form>
    </div>
  );
}