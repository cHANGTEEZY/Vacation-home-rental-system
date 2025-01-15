import "./ChatBox.css";
import { useState, useEffect } from "react";
import { CircleUserRound } from "lucide-react";

export default function ChatBox() {
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const token = localStorage.getItem("token");

  const getUserIdFromToken = (token) => {
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.userId;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  useEffect(() => {
    const userId = getUserIdFromToken(token);
    setUserId(userId);
  }, [token]);

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("http://localhost:3000/message-host", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
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
    fetchConversations();
  }, [token]);

  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          `http://localhost:3000/message-host/${activeChatId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error.message);
        alert("Something went wrong while fetching messages.");
      }
    };
    fetchMessages();
  }, [activeChatId, token]);

  const handleConvClick = (chatId) => {
    setActiveChatId(chatId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() || !userId || !activeConversation) return;

    const [hostId, propertyId] = activeConversation.chatId.split("-");
    const newMessage = {
      property_id: propertyId, // Use split propertyId here
      host_id: hostId,
      sender_id: userId,
      sent_message: message,
    };

    try {
      const response = await fetch(
        `http://localhost:3000/message-host/${propertyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
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
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender_id === userId ? 'sent' : 'received'}`}
              >
                <p>{msg.sent_message || msg.received_message}</p>
                <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
              </div>
            ))
          ) : (
            <p>Please select a conversation to view messages.</p>
          )}
        </div>
        <form className="message-input" onSubmit={handleSubmit}>
          <input
            type="text"
            className="message-input"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit" className="send-button">Send</button>
        </form>
      </main>
    </div>
  );
}
