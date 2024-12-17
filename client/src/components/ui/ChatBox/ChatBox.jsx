import "./ChatBox.css";
import { useState, useEffect } from "react";
import { CircleUserRound } from "lucide-react";

export default function ChatBox() {
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getConversations = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("http://localhost:3000/message-host", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch conversations");
        }
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error.message);
        alert("Something went wrong while fetching conversations.");
      } finally {
        setIsLoading(false);
      }
    };
    getConversations();
  }, []);

  const handleConvClick = (id) => {
    setActiveChatId(id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    console.log(`Message to send: ${message}`);
    setMessage(""); // Clear the input after sending
  };

  const activeConversation = conversations.find(
    (conv) => conv.chatId === activeChatId
  );

  return (
    <div className="messenger-container">
      {/* Sidebar */}
      <aside className="conversation-list">
        <div className="conversation-header">
          <h2>Chats</h2>
        </div>
        {isLoading ? (
          <p>Loading...</p>
        ) : conversations.length === 0 ? (
          <p>No conversations found.</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.chatId}
              className={`conversation-item ${
                conv.chatId === activeChatId ? "active" : ""
              }`}
              onClick={() => handleConvClick(conv.chatId)}
            >
              <CircleUserRound size={40} strokeWidth={1.4} />
              <div className="conversation-info">
                <h3>{conv.name}</h3>
                <p>{conv.lastMessage}</p>
              </div>
            </div>
          ))
        )}
      </aside>

      {/* Chat Area */}
      <main className="chat-area">
        <div className="chat-header">
          <h2>
            {activeConversation ? activeConversation.name : "Select a Chat"}
          </h2>
        </div>
        <div className="message-list">
          {activeConversation ? (
            <div>
              <p>{activeConversation.lastMessage}</p>
            </div>
          ) : (
            <p>Please select a conversation to view messages.</p>
          )}
        </div>
        <form className="message-input" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  );
}
