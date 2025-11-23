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
            .chatbot-widget-button svg {
              width: 28px;
              height: 28px;
              color: white;
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
            .chatbot-widget-header-text p {
              font-size: 12px;
              opacity: 0.9;
            }
            .chatbot-widget-close {
              background: rgba(255,255,255,0.2);
              border: none;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 8px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .chatbot-widget-close:hover {
              background: rgba(255,255,255,0.3);
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
            }
            .chatbot-widget-message.user .chatbot-widget-message-content {
              background-color: ${primaryColor};
              color: white;
            }
            .chatbot-widget-message.assistant .chatbot-widget-message-content {
              background-color: #f3f4f6;
              color: #111827;
            }
            .chatbot-widget-input-container {
              padding: 16px;
              border-top: 1px solid #e5e7eb;
              display: flex;
              gap: 8px;
            }
            .chatbot-widget-input {
              flex: 1;
              padding: 10px 16px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              outline: none;
            }
            .chatbot-widget-input:focus {
              border-color: ${primaryColor};
            }
            .chatbot-widget-send {
              background-color: ${primaryColor};
              border: none;
              color: white;
              width: 40px;
              height: 40px;
              border-radius: 8px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .chatbot-widget-send:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            .chatbot-widget-loading {
              display: flex;
              gap: 4px;
              padding: 8px;
            }
            .chatbot-widget-loading-dot {
              width: 8px;
              height: 8px;
              background-color: #9ca3af;
              border-radius: 50%;
              animation: loading-bounce 1.4s infinite ease-in-out both;
            }
            .chatbot-widget-loading-dot:nth-child(1) {
              animation-delay: -0.32s;
            }
            .chatbot-widget-loading-dot:nth-child(2) {
              animation-delay: -0.16s;
            }
            @keyframes loading-bounce {
              0%, 80%, 100% { transform: scale(0); }
              40% { transform: scale(1); }
            }
            @media (max-width: 640px) {
              .chatbot-widget-window {
                width: calc(100vw - 48px);
                height: calc(100vh - 150px);
              }
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
                  <p>Online</p>
                </div>
              </div>
              <button class="chatbot-widget-close" id="chatbot-close">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="chatbot-widget-messages" id="chatbot-messages"></div>
            <div class="chatbot-widget-input-container">
              <input
                type="text"
                class="chatbot-widget-input"
                id="chatbot-input"
                placeholder="Type your question..."
              />
              <button class="chatbot-widget-send" id="chatbot-send">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(widgetContainer);

        const toggleBtn = document.getElementById('chatbot-toggle');
        const closeBtn = document.getElementById('chatbot-close');
        const window = document.getElementById('chatbot-window');
        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');

        toggleBtn.addEventListener('click', toggleWidget);
        closeBtn.addEventListener('click', toggleWidget);
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') sendMessage();
        });

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
        } catch (error) {
          console.error('Failed to fetch bot data:', error);
        }
      }

      function toggleWidget() {
        isOpen = !isOpen;
        const window = document.getElementById('chatbot-window');
        if (isOpen) {
          window.classList.add('open');
        } else {
          window.classList.remove('open');
        }
      }

      function addMessage(role, content, citations) {
        messages.push({ role, content, citations });
        renderMessages();
      }

      function renderMessages() {
        const container = document.getElementById('chatbot-messages');
        container.innerHTML = messages.map(msg => `
          <div class="chatbot-widget-message ${msg.role}">
            <div class="chatbot-widget-message-content">
              ${msg.content}
            </div>
          </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
      }


      function showLoading() {
        const container = document.getElementById('chatbot-messages');
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'chatbot-loading';
        loadingDiv.className = 'chatbot-widget-message assistant';
        loadingDiv.innerHTML = `
          <div class="chatbot-widget-message-content">
            <div class="chatbot-widget-loading">
              <div class="chatbot-widget-loading-dot"></div>
              <div class="chatbot-widget-loading-dot"></div>
              <div class="chatbot-widget-loading-dot"></div>
            </div>
          </div>
        `;
        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;
      }

      function hideLoading() {
        const loading = document.getElementById('chatbot-loading');
        if (loading) loading.remove();
      }

      async function sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        if (!message) return;

        addMessage('user', message);
        input.value = '';

        showLoading();

        try {
          const response = await fetch(`${apiUrl}/chat-query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              botId: botId,
              question: message,
              sessionId: sessionId
            })
          });

          hideLoading();

          if (!response.ok) {
            throw new Error('Failed to get response');
          }

          const data = await response.json();
          addMessage('assistant', data.answer || 'I apologize, but I could not generate a response.', data.citations);
        } catch (error) {
          hideLoading();
          console.error('Chat error:', error);
          addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
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