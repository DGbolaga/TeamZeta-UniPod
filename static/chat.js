// Global variables
let conversations = [];
let currentConversationId = null;
let isRecording = false;
let recognition = null;

// Initialize speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById('messageInput').value = transcript;
    stopVoiceRecording();
  };

  recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
    stopVoiceRecording();
  };

  recognition.onend = function() {
    stopVoiceRecording();
  };
}

// Sidebar functionality
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
}

// Voice recording functionality
function toggleVoiceRecording() {
  if (!recognition) {
    alert('Speech recognition is not supported in your browser.');
    return;
  }

  if (isRecording) {
    stopVoiceRecording();
  } else {
    startVoiceRecording();
  }
}

function startVoiceRecording() {
  isRecording = true;
  const voiceButton = document.getElementById('voiceButton');
  voiceButton.classList.add('recording');
  voiceButton.innerHTML = '⏹️';
  recognition.start();
}

function stopVoiceRecording() {
  isRecording = false;
  const voiceButton = document.getElementById('voiceButton');
  voiceButton.classList.remove('recording');
  voiceButton.innerHTML = '🎤';
  if (recognition) {
    recognition.stop();
  }
}

// Conversation management
function generateRandomGradient() {
  const avatars = [
    { bg: '#007aff', initial: 'Z' }, // Blue - Zeta
    { bg: '#ff3b30', initial: 'U' }, // Red - User  
    { bg: '#34c759', initial: 'S' }, // Green
    { bg: '#ff9500', initial: 'M' }, // Orange
    { bg: '#af52de', initial: 'T' }, // Purple
    { bg: '#00d4aa', initial: 'W' }, // Teal
    { bg: '#ffcc00', initial: 'F' }, // Yellow
    { bg: '#8e8e93', initial: 'Q' }  // Gray
  ];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

function createConversation(preview, time = 'now') {
  const id = Date.now().toString();
  const avatarData = generateRandomGradient();
  const conversation = {
    id: id,
    preview: preview,
    time: time,
    messages: [],
    avatar: avatarData
  };
  
  conversations.unshift(conversation);
  currentConversationId = id;
  renderConversations();
  return conversation;
}

function renderConversations() {
  const conversationsList = document.getElementById('conversationsList');
  const emptyState = document.getElementById('emptyState');
  
  if (conversations.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  conversationsList.innerHTML = conversations.map(conv => `
    <div class="conversation-item ${conv.id === currentConversationId ? 'active' : ''}" 
         onclick="switchConversation('${conv.id}')">
      <div class="avatar" style="background: ${conv.avatar.bg};">${conv.avatar.initial}</div>
      <div class="conversation-content">
        <div class="conversation-preview">${conv.preview}</div>
      </div>
      <div class="conversation-time">${conv.time}</div>
      <div class="status-indicator status-online"></div>
    </div>
  `).join('');
}

function switchConversation(conversationId) {
  currentConversationId = conversationId;
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) return;
  
  // Update active state in sidebar
  renderConversations();
  
  // Load conversation messages
  loadConversationMessages(conversation);
}

function loadConversationMessages(conversation) {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = '';
  
  if (conversation.messages.length === 0) {
    // Show welcome message for new conversations
    chatMessages.innerHTML = `
      <div class="welcome-message">
        <div class="ai-welcome-bubble">
          <div class="ai-avatar">
            <div class="ai-icon">Z</div>
          </div>
          <div class="welcome-content">
            <div class="welcome-text">
              <h2>Let's continue! 👋</h2>
              <p>I'm Zeta. What would you like to discuss?</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    // Load existing messages
    conversation.messages.forEach(message => {
      addMessageToChat(message.text, message.sender, conversation);
    });
  }
}

function searchConversations() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const conversationItems = document.querySelectorAll('.conversation-item');
  
  conversationItems.forEach(item => {
    const preview = item.querySelector('.conversation-preview').textContent.toLowerCase();
    if (preview.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Message functionality
function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Hide welcome message when first message is sent
  const welcomeMessage = document.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.style.display = 'none';
  }
  
  // Create new conversation if none exists
  if (!currentConversationId) {
    const preview = message.length > 40 ? message.substring(0, 40) + '...' : message;
    createConversation(preview);
  }
  
  // Get current conversation
  const conversation = conversations.find(c => c.id === currentConversationId);
  
  // Add user message to conversation and display
  if (conversation) {
    conversation.messages.push({ text: message, sender: 'user' });
    conversation.preview = message.length > 40 ? message.substring(0, 40) + '...' : message;
    conversation.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  addMessageToChat(message, 'user', conversation);
  input.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  // Simulate AI response after delay
  setTimeout(() => {
    hideTypingIndicator();
    const aiResponse = generateAIResponse(message);
    
    if (conversation) {
      conversation.messages.push({ text: aiResponse, sender: 'ai' });
    }
    
    addMessageToChat(aiResponse, 'ai', conversation);
    renderConversations();
  }, 1500);
}

function generateAIResponse(userMessage) {
  const responses = [
    "That's a great question! Let me help you with that.",
    "I understand what you're looking for. Here's my suggestion:",
    "Based on what you've told me, I think the best approach would be:",
    "Let's work through this step by step.",
    "That's an interesting perspective. Have you considered:",
    "I can definitely help you with your study goals!",
    "As Zeta, I'm here to support your learning journey.",
    "Great question! Let me break this down for you.",
    "I see what you're getting at. Here's how we can tackle this:",
    "Perfect! Let's dive into that topic together.",
    "That's exactly the kind of thinking that leads to success!",
    "I love your curiosity! Here's what I'd recommend:",
    "You're on the right track. Let me add some insights:",
    "Excellent point! Here's how we can build on that:",
    "I'm excited to help you explore this further!"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function addMessageToChat(message, sender, conversation = null) {
  const chatMessages = document.getElementById('chatMessages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = sender === 'ai' ? 'ai-message' : 'user-message';
  messageDiv.textContent = message;
  
  // Add message with animation
  messageDiv.style.opacity = '0';
  messageDiv.style.transform = 'translateY(20px)';
  chatMessages.appendChild(messageDiv);
  
  // Animate in
  setTimeout(() => {
    messageDiv.style.opacity = '1';
    messageDiv.style.transform = 'translateY(0)';
    messageDiv.style.transition = 'all 0.3s ease';
  }, 10);
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'ai-message typing-message';
  typingDiv.id = 'typingIndicator';
  typingDiv.innerHTML = `
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <span style="margin-left: 10px; color: #8e8e93;">Zeta is typing...</span>
  `;
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  renderConversations();
});

// Enter key to send message
document.getElementById('messageInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Mobile responsive handling
if (window.innerWidth <= 768) {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.add('collapsed');
}

// Utility functions
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateConversationId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendMessage,
    toggleSidebar,
    toggleVoiceRecording,
    switchConversation,
    searchConversations
  };
}