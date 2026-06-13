import { useEffect, useRef, useState } from "react";

function getOrCreateThreadId() {
  let id = localStorage.getItem("threadId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("threadId", id);
  }
  return id;
}

export default function App() {
  const [threadId, setThreadId] = useState(getOrCreateThreadId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "error", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    const id = crypto.randomUUID();
    localStorage.setItem("threadId", id);
    setThreadId(id);
    setMessages([]);
  }

  function onKeyDown(e) {
    if (e.key === "Enter") send();
  }

  return (
    <div className="app">
      <div className="header">
        <h1>✈️ Travel Agent</h1>
        <button
          className="new-chat"
          data-testid="new-chat-button"
          onClick={newChat}
        >
          New chat
        </button>
      </div>

      <div className="messages" data-testid="messages" ref={listRef}>
        {messages.length === 0 && !loading && (
          <div className="empty">Ask me about destinations or the weather!</div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`msg ${m.role}`}
            data-testid={`message-${m.role}`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="msg assistant" data-testid="loading">
            Thinking…
          </div>
        )}
      </div>

      <div className="composer">
        <input
          data-testid="message-input"
          value={input}
          placeholder="Type a message…"
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          data-testid="send-button"
          onClick={send}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
