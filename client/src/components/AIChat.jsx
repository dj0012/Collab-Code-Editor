import { useState, useEffect, useRef } from "react";
import socket from "../services/socket";
import { FaArrowUp } from "react-icons/fa";

function AIChat({ roomId, code }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    socket.on("ai_response", (data) => {
      setMessages((prev) => [...prev, { role: "ai", content: data }]);
      setLoading(false);
    });

    return () => socket.off("ai_response");
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const askAI = () => {
    if (!question.trim()) return;

    const userMsg = question.trim();
    const newMessages = [...messages, { role: "user", content: userMsg }];
    
    setMessages(newMessages);
    setLoading(true);

    const historyStr = newMessages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join("\n\n");

    const prompt = `
You are a helpful, friendly, and expert AI coding assistant built right into the Collab Code Editor. 
You can help the user write, debug, and understand code, but you are also happy to chat normally!
If the user greets you (e.g. "hi", "hello", "how are you"), respond naturally and warmly, for example: "Hey there! How's it going? Ready to write some code?".
If the user asks a coding question, explain simply and provide code examples if helpful.

Current Workspace Code (use this as context if the user's question relates to it):
${code ? code : "(The workspace is currently empty)"}

Conversation History:
${historyStr}

AI Response:
`;

    socket.emit("ask_ai", { roomId, prompt });
    setQuestion("");
  };

  // 👉 Enter press = send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

  return (
    <div className="ai-chat-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="ai-answer-box" ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 ? (
          <div className="empty-state" style={{ margin: 'auto', textAlign: 'center', opacity: 0.6 }}>
            Ask something about your code...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.role === 'user' ? 'mine' : 'theirs'}`}>
              <div className="message-bubble" style={{ background: msg.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.05)', color: msg.role === 'user' ? '#fff' : 'inherit' }}>
                <div className="message-author">
                  <span className={`author-icon ${msg.role === 'user' ? '' : 'ai'}`}>
                    {msg.role === 'user' ? 'Me' : 'AI'}
                  </span>
                  <span className="author-name">
                    {msg.role === 'user' ? 'You' : 'Copilot'}
                  </span>
                </div>
                <div className={msg.role === 'user' ? '' : 'ai-answer-text'} style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="message-row theirs">
            <div className="message-bubble" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="thinking-text" style={{ margin: 0 }}>Thinking...</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            placeholder="Ask AI to explain, debug, or improve your code..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
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
            onClick={askAI}
            disabled={!question.trim() || loading}
            style={{
              position: 'absolute',
              right: '6px',
              background: question.trim() && !loading ? 'linear-gradient(135deg, var(--accent), var(--accent-strong))' : 'rgba(255, 255, 255, 0.1)',
              color: question.trim() && !loading ? '#fff' : 'rgba(255, 255, 255, 0.3)',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: question.trim() && !loading ? 'pointer' : 'default',
              transition: 'all 0.2s',
              transform: question.trim() && !loading ? 'scale(1)' : 'scale(0.95)'
            }}
          >
            <FaArrowUp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIChat;
