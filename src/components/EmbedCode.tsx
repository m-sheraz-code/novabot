import { useState } from 'react';
import { Bot } from '../lib/database.types';
import { Copy, Check } from 'lucide-react';

interface EmbedCodeProps {
  bot: Bot;
}

export default function EmbedCode({ bot }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- Q&A Chatbot Widget -->
<script src="${window.location.origin}/widget.js"></script>
<script>
  window.ChatbotWidget.init({
    botId: "${bot.id}",
    primaryColor: "${bot.primary_color}",
    position: "${bot.widget_position}"
  });
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Embed Code</h3>

      <p className="text-gray-600 mb-4">
        Copy and paste this code before the closing <code className="bg-gray-100 px-2 py-1 rounded text-sm">&lt;/body&gt;</code> tag in your website's HTML:
      </p>

      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          {embedCode}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-sm">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm">Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>The chatbot will appear as a floating widget on your website</li>
          <li>Visitors can click to open and ask questions</li>
          <li>The bot uses your uploaded documents to provide answers</li>
          <li>All conversations are logged and available in your dashboard</li>
        </ol>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-semibold text-amber-900 mb-2">Requirements:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
          <li>Upload at least one document to enable the chatbot</li>
          <li>Ensure your bot status is set to "Active"</li>
          <li>The widget works on any website that allows custom JavaScript</li>
        </ul>
      </div>
    </div>
  );
}