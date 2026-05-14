import React, { useState, useEffect } from 'react';
import './ChatHistory.css';

const ChatHistory = ({ teacherId, isOpen, onClose, onSelectChat }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin
      const response = await fetch(`${apiBase}/api/chat-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId })
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen, teacherId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getToolIcon = (toolName) => {
    const icons = {
      'worksheet': '📝',
      'lesson_plan': '📚',
      'assessment': '✅',
      'auto_generate': '⚡'
    };
    return icons[toolName] || '💬';
  };

  return (
    <div className={`chat-history-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="chat-history-header">
        <h3>📋 Recent Chats</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="chat-history-content">
        {loading ? (
          <div className="loading">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className="empty-state">
            <p>No recent chats yet.</p>
            <p className="hint">Start creating and your chats will appear here!</p>
          </div>
        ) : (
          <div className="chats-list">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="chat-item"
                onClick={() => onSelectChat(chat)}
              >
                <div className="chat-icon">{getToolIcon(chat.tool_name)}</div>
                <div className="chat-details">
                  <div className="chat-title">{chat.topic}</div>
                  <div className="chat-info">
                    {chat.grade_level} • {chat.subject}
                  </div>
                  <div className="chat-time">{formatDate(chat.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
