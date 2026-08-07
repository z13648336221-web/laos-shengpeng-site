const API_BASE = '/api';

class ChatWidget {
  constructor() {
    this.visitorId = this.getVisitorId();
    this.visitorName = '';
    this.isOpen = false;
    this.isPolling = false;
    this.lastMessageTime = null;
    this.init();
  }

  getVisitorId() {
    let id = localStorage.getItem('chatVisitorId');
    if (!id) {
      id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatVisitorId', id);
    }
    return id;
  }

  init() {
    this.createWidget();
    this.bindEvents();
    this.startPolling();
  }

  createWidget() {
    const widgetHTML = `
      <div class="chat-widget">
        <button class="chat-toggle" id="chatToggle" title="在线客服">
          <span>💬</span>
          <span class="chat-notification" id="chatNotification" style="display: none;">0</span>
        </button>
        <div class="chat-window" id="chatWindow">
          <div class="chat-header">
            <div class="chat-header-info">
              <div class="chat-avatar">👩‍💼</div>
              <div class="chat-title">
                <h3>在线客服</h3>
                <div class="chat-status">
                  <span class="chat-status-dot"></span>
                  <span>在线</span>
                </div>
              </div>
            </div>
            <button class="chat-close" id="chatClose">×</button>
          </div>
          <div class="chat-welcome">
            <div class="chat-welcome-avatar">🏢</div>
            <h4>您好！欢迎咨询</h4>
            <p>请问有什么可以帮助您的？</p>
          </div>
          <div class="contact-options">
            <div class="contact-option" id="contactWechat">
              <span class="contact-icon">💬</span>
              <span class="contact-text">企业微信客服</span>
            </div>
          </div>
          <div class="quick-replies">
            <span class="quick-reply" data-text="我想了解中老铁路运输">我想了解中老铁路运输</span>
            <span class="quick-reply" data-text="价格怎么计算？">价格怎么计算？</span>
            <span class="quick-reply" data-text="多久能到？">多久能到？</span>
          </div>
          <div class="chat-messages" id="chatMessages"></div>
          <div class="chat-typing" id="chatTyping">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div class="chat-input-area">
            <div class="chat-input">
              <input type="text" id="chatInput" placeholder="请输入您的问题..." />
              <button class="chat-send-btn" id="chatSendBtn">➤</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
    this.widget = document.querySelector('.chat-widget');
    this.toggleBtn = document.getElementById('chatToggle');
    this.window = document.getElementById('chatWindow');
    this.closeBtn = document.getElementById('chatClose');
    this.messagesContainer = document.getElementById('chatMessages');
    this.input = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSendBtn');
    this.typingIndicator = document.getElementById('chatTyping');
    this.notification = document.getElementById('chatNotification');
  }

  bindEvents() {
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.closeBtn.addEventListener('click', () => this.close());
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    
    // 快速回复
    this.widget.querySelectorAll('.quick-reply').forEach(btn => {
      btn.addEventListener('click', () => {
        this.input.value = btn.dataset.text;
        this.sendMessage();
      });
    });
    
    // 企业微信客服
    document.getElementById('contactWechat').addEventListener('click', () => {
      this.openWechatService();
    });
  }
  
  openWechatService() {
    // 企业微信客服链接
    // 格式：https://work.weixin.qq.com/kfid/kfXXXXXXXXXXXX
    const wechatUrl = 'https://work.weixin.qq.com/kfid/kf8f8a123456789012345678901234567';
    
    // 创建企业微信客服二维码弹窗
    const qrModal = document.createElement('div');
    qrModal.className = 'wechat-qr-modal';
    qrModal.innerHTML = `
      <div class="wechat-qr-overlay" onclick="document.body.removeChild(document.querySelector('.wechat-qr-modal'))"></div>
      <div class="wechat-qr-content">
        <button class="qr-close" onclick="document.body.removeChild(document.querySelector('.wechat-qr-modal'))">×</button>
        <h3>企业微信客服</h3>
        <p>请使用微信扫码添加客服</p>
        <div class="qr-code">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wechatUrl)}" alt="企业微信客服二维码" />
        </div>
        <p class="qr-tip">扫码后即可与客服在线沟通</p>
      </div>
    `;
    
    document.body.appendChild(qrModal);
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.open();
    } else {
      this.close();
    }
  }

  open() {
    this.window.classList.add('show');
    this.isOpen = true;
    this.hideNotification();
    this.loadMessages();
    this.input.focus();
  }

  close() {
    this.window.classList.remove('show');
    this.isOpen = false;
  }

  async loadMessages() {
    try {
      const response = await fetch(`${API_BASE}/chat/user/${this.visitorId}`);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        this.renderMessages(result.data);
        this.lastMessageTime = result.data[result.data.length - 1].createdAt;
      }
    } catch (err) {
      console.error('加载消息失败:', err);
    }
  }

  renderMessages(messages) {
    this.messagesContainer.innerHTML = '';
    
    messages.forEach(msg => {
      this.addMessage(msg, false);
    });
    
    this.scrollToBottom();
  }

  addMessage(msg, animate = true) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${msg.sender}${animate ? '' : ' no-animation'}`;
    
    const time = new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    messageEl.innerHTML = `
      <div class="message-bubble">${this.escapeHtml(msg.message)}</div>
      <div class="message-time">${time}</div>
    `;
    
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text) return;
    
    this.input.value = '';
    this.addMessage({
      sender: 'visitor',
      message: text,
      createdAt: new Date().toISOString()
    });
    
    try {
      const response = await fetch(`${API_BASE}/chat/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: this.visitorId,
          visitorName: this.visitorName || '访客',
          message: text
        })
      });
      
      const result = await response.json();
      if (result.success) {
        this.lastMessageTime = result.data.createdAt;
      }
      
      // 显示打字效果
      this.showTyping();
      setTimeout(() => {
        this.hideTyping();
        // 如果没有自动回复，这里可以加一条系统消息
      }, 1000);
      
    } catch (err) {
      console.error('发送消息失败:', err);
      alert('发送失败，请稍后重试');
    }
  }

  showTyping() {
    this.typingIndicator.classList.add('show');
    this.scrollToBottom();
  }

  hideTyping() {
    this.typingIndicator.classList.remove('show');
  }

  startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    
    setInterval(() => {
      this.checkNewMessages();
    }, 3000);
  }

  async checkNewMessages() {
    try {
      const response = await fetch(`${API_BASE}/chat/user/${this.visitorId}`);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        const newMessages = result.data.filter(msg => 
          msg.sender === 'admin' && (!this.lastMessageTime || new Date(msg.createdAt) > new Date(this.lastMessageTime))
        );
        
        if (newMessages.length > 0) {
          newMessages.forEach(msg => {
            this.addMessage(msg);
            this.lastMessageTime = msg.createdAt;
          });
          
          if (!this.isOpen) {
            this.showNotification(newMessages.length);
          }
        }
      }
    } catch (err) {
      console.error('检查新消息失败:', err);
    }
  }

  showNotification(count) {
    const current = parseInt(this.notification.textContent) || 0;
    this.notification.textContent = current + count;
    this.notification.style.display = 'flex';
  }

  hideNotification() {
    this.notification.textContent = '0';
    this.notification.style.display = 'none';
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chatWidget = new ChatWidget();
  });
} else {
  window.chatWidget = new ChatWidget();
}