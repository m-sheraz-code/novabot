(function() {
  'use strict';

  window.ChatbotWidget = {
    init: function(config) {
      if (!config || !config.botId) {
        console.error('ChatbotWidget: botId is required');
        return;
      }

      const botId = config.botId;
      const primaryColor = config.primaryColor || '#5eb8ff';
      const position = config.position || 'bottom-right';
      const apiUrl = config.apiUrl || '/api';

      let isOpen = false;
      let messages = [];
      let botData = null;
      let sessionId = getSessionId();

      function getSessionId() {
        let id = localStorage.getItem('chatbot_session_' + botId);
        if (!id) {
          id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('chatbot_session_' + botId, id);
        }
        return id;
      }

      function createWidget() {
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'chatbot-widget-container';
        widgetContainer.innerHTML = `
          <style>
            #chatbot-widget-container * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            .chatbot-widget-button {
              position: fixed;
              ${position.includes('left') ? 'left: 24px;' : 'right: 24px;'}
              bottom: 24px;
              width: 64px;
              height: 64px;
              border-radius: 50%;
              background-color: ${primaryColor};
              border: none;
              cursor: pointer;
              box-shadow: 0 10px 25px rgba(0,0,0,0.2);
              z-index: 999999;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.2s;
            }
            .chatbot-widget-button:hover {
              transform: scale(1.1);
            }
            .chatbot-widget-window {
              position: fixed;
              ${position.includes('left') ? 'left: 24px;' : 'right: 24px;'}
              bottom: 100px;
              width: 384px;
              height: 500px;
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              z-index: 999999;
              display: none;
              flex-direction: column;
              overflow: hidden;
            }
            .chatbot-widget-window.open {
              display: flex;
            }
            .chatbot-widget-header {
              background-color: ${primaryColor};
              color: white;
              padding: 16px 24px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .chatbot-widget-header-info {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .chatbot-widget-avatar {
              width: 40px;
              height: 40px;
              background: rgba(255,255,255,0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
            }
            .chatbot-widget-header-text h3 {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 2px;
            }
            .chatbot-widget-messages {
              flex: 1;
              overflow-y: auto;
              padding: 16px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .chatbot-widget-message {
              display: flex;
            }
            .chatbot-widget-message.user {
              justify-content: flex-end;
            }
            .chatbot-widget-message-content {
              max-width: 80%;
              padding: 12px 16px;
              border-radius: 16px;
              font-size: 14px;
              line-height: 1.5;
              white-space: pre-wrap;
            }
            .chatbot-widget-message.user .chatbot-widget-message-content {
              background-color: ${primaryColor};
              color: white;
            }
            .chatbot-widget-message.assistant .chatbot-widget-message-content {
              background-color: #f3f4f6;
              color: #111827;
            }
          </style>

          <button class="chatbot-widget-button" id="chatbot-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          <div class="chatbot-widget-window" id="chatbot-window">
            <div class="chatbot-widget-header">
              <div class="chatbot-widget-header-info">
                <div class="chatbot-widget-avatar" id="chatbot-avatar">🤖</div>
                <div class="chatbot-widget-header-text">
                  <h3 id="chatbot-name">Chatbot</h3>
                </div>
              </div>

              <button class="chatbot-widget-close" id="chatbot-close">✖</button>
            </div>

            <div class="chatbot-widget-messages" id="chatbot-messages"></div>

            <div class="chatbot-widget-input-container">
              <input type="text" class="chatbot-widget-input" id="chatbot-input" placeholder="Type your question..." />
              <button class="chatbot-widget-send" id="chatbot-send">➤</button>
            </div>
          </div>
        `;

        document.body.appendChild(widgetContainer);

        document.getElementById('chatbot-toggle').onclick = toggleWidget;
        document.getElementById('chatbot-close').onclick = toggleWidget;
        document.getElementById('chatbot-send').onclick = sendMessage;
        document.getElementById('chatbot-input').onkeypress = e => {
          if (e.key === 'Enter') sendMessage();
        };

        fetchBotData();
      }

      async function fetchBotData() {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/bots?id=eq.${botId}`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });

          const data = await response.json();
          if (data && data.length > 0) {
            botData = data[0];
            document.getElementById('chatbot-name').textContent = botData.name;
            document.getElementById('chatbot-avatar').textContent = botData.avatar_url || '🤖';

            if (messages.length === 0) {
              addMessage('assistant', botData.welcome_message);
            }
          }
        } catch (err) {
          console.error('Bot data error', err);
        }
      }

      function toggleWidget() {
        const window = document.getElementById('chatbot-window');
        isOpen = !isOpen;
        window.classList.toggle('open');
      }

      function addMessage(role, content) {
        messages.push({ role, content });
        renderMessages();
      }

      function renderMessages() {
        const container = document.getElementById('chatbot-messages');
        container.innerHTML = messages
          .map(msg => `
            <div class="chatbot-widget-message ${msg.role}">
              <div class="chatbot-widget-message-content">
                ${msg.content}
              </div>
            </div>
          `)
          .join('');
        container.scrollTop = container.scrollHeight;
      }

      function showLoading() {
        addMessage('assistant', "...");
      }

      async function sendMessage() {
        const input = document.getElementById('chatbot-input');
        const text = input.value.trim();
        if (!text) return;

        addMessage('user', text);
        input.value = '';

        showLoading();

        try {
          const response = await fetch(`${apiUrl}/chat-query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              botId,
              question: text,
              sessionId
            })
          });

          const data = await response.json();

          // remove "..." loading
          messages.pop();

          let cleanAnswer = data.answer || "I couldn't find an exact match, but here is what I can share from the documents.";

          // Remove citations text
          cleanAnswer = cleanAnswer.replace(/Page\s+\d+/gi, "");

          addMessage('assistant', cleanAnswer);
        } catch (err) {
          console.error(err);
          addMessage('assistant', 'Something went wrong. Please try again.');
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createWidget);
      } else {
        createWidget();
      }
    }
  };
})();
