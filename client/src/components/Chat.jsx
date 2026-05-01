import { useState, useEffect, useRef } from "react";
import socket from "../services/socket";
import { FaPaperPlane } from "react-icons/fa";

function Chat({ roomId, username, isMuted }) {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const messagesRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const chatBoxRef = useRef(null);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };
    const handleChatHistory = (history) => {
      setMessages(history);
    };
    const handleUserTyping = (user) => {
      if (user !== username) setTypingUser(user);
    };
    const handleUserStopTyping = () => {
      setTypingUser("");
    };

    socket.on("chat_history", handleChatHistory);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    const handleDownload = () => {
      const formatTime = (createdAt) => {
        try { return new Date(createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); } 
        catch { return ""; }
      };
      const text = messagesRef.current.map(m => `[${formatTime(m.createdAt)}] ${m.username}: ${m.message}`).join('\n');
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-history-${roomId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    };
    window.addEventListener('download_chat', handleDownload);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      socket.off("chat_history", handleChatHistory);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      window.removeEventListener('download_chat', handleDownload);
    };
  }, [username, roomId]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
      return;
    }

    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!msg.trim()) return;

    socket.emit("send_message", { roomId, message: msg, username });
    setMsg("");
    socket.emit("stop_typing", { roomId });
  };

  // 🔥 Enter send
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e) => {
    setMsg(e.target.value);

    socket.emit("typing", { roomId, username });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { roomId });
    }, 1000);
  };

  const formatMessageTime = (createdAt) => {
    if (!createdAt) return "";

    try {
      return new Date(createdAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-surface">


        <div className="chat-box" ref={chatBoxRef}>
          {messages.length === 0 && (
            <div className="chat-empty-state">
              <p className="empty-state">No team messages yet. Start the conversation.</p>
            </div>
          )}

          {messages.map((m) => {
            const isMe = m.username === username;

            return (
              <div
                key={m.id || `${m.username}-${m.message}`}
                className={`message-row ${isMe ? "mine" : "theirs"}`}
              >
                <div className="message-bubble">
                  <div className="message-author">
                    <span className="author-icon">{isMe ? "U" : m.username.charAt(0).toUpperCase()}</span>
                    <span className="author-name">{isMe ? "You" : m.username}</span>
                  </div>
                  <div className="message-text">{m.message}</div>
                  <div className="message-meta">
                    <span>{formatMessageTime(m.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={chatEndRef}></div>
        </div>
      </div>

      <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        {typingUser && <div className="typing-indicator" style={{ marginBottom: '8px', fontSize: '0.8rem', color: 'var(--accent)' }}>{typingUser} is typing...</div>}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            value={msg}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            disabled={isMuted}
            placeholder={isMuted ? "Chat is muted by admin..." : "Message the room..."}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '12px 48px 12px 16px',
              color: 'var(--text)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'all 0.2s',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(124, 164, 255, 0.4)';
              e.target.style.background = 'rgba(0, 0, 0, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.background = 'rgba(0, 0, 0, 0.2)';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!msg.trim() || isMuted}
            style={{
              position: 'absolute',
              right: '6px',
              background: msg.trim() ? 'linear-gradient(135deg, var(--accent), var(--accent-strong))' : 'rgba(255, 255, 255, 0.1)',
              color: msg.trim() ? '#fff' : 'rgba(255, 255, 255, 0.3)',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: msg.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s',
              transform: msg.trim() ? 'scale(1)' : 'scale(0.95)'
            }}
          >
            <FaPaperPlane size={12} style={{ marginLeft: '-2px', marginTop: '1px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
