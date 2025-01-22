import { useState, useEffect } from "react";
import { CircleUserRound } from "lucide-react";
import { toast } from "react-toastify";
import "./ChatBox.css";

const ChatBox = () => {
  const [senderId, setSenderId] = useState(null);
  console.log("sender id is", senderId)
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [message, setMessage] = useState("");
  const [hostId, setHostId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const BASE_URL = "http://localhost:3000";
  const token = localStorage.getItem("token");

  const getSenderId = async () => {
    try {
      const response = await fetch(`${BASE_URL}/message-host/sender-id`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch sender ID");
      }
      const data = await response.json();
      setSenderId(data.user_id);
    } catch (error) {
      console.error("Error fetching sender ID:", error.message);
      toast.error("Failed to load user information");
    }
  };

  useEffect(() => {
    getSenderId();
  }, []);

  useEffect(() => {
    const getConversations = async () => {
      try {
        const response = await fetch(`${BASE_URL}/message-host`, {
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
        toast.error("Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    };
    getConversations();
  }, []);

  const handleConvClick = (id, hostId) => {
    setActiveChatId(id);
    setHostId(hostId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const payload = {
      chatId: activeChatId,
      message,
      hostId,
    };
    console.log(payload)

    try {
      const response = await fetch(`${BASE_URL}/message-host`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }


      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.chatId === activeChatId
            ? {
              ...conv,
              lastMessage: conv.lastMessage
                ? `${conv.lastMessage}, ${senderId}/${message}`
                : `${senderId}/${message}`,
            }
            : conv
        )
      );

      toast.success("Message sent successfully");
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error.message);
      toast.error(error.message);
    }
  };

  const ChatMessages = ({ messages, currentSenderId }) => {
    const parseMessages = (messageString) => {
      if (!messageString) return [];
      return messageString
        .split(", ")
        .map((msg) => {
          const [senderId, content] = msg.split("/");
          return {
            senderId: parseInt(senderId),
            content,
            isSentByCurrentUser: parseInt(senderId) === currentSenderId,
          };
        })
        .reverse();
    };

    return (
      <div className="message-list">
        {parseMessages(messages).map((message, index) => (
          <div
            key={index}
            className={`message ${message.isSentByCurrentUser ? "sent" : "received"
              }`}
          >
            <p>{message.content}</p>
          </div>
        ))}
      </div>
    );
  };

  const activeConversation = conversations.find(
    (conv) => conv.chatId === activeChatId
  );

  return (
    <div className="messenger-container">
      {/* Conversation List */}
      <aside className="conversation-list">
        <div className="conversation-header">
          <h2>Conversations</h2>
        </div>
        <div>
          {isLoading ? (
            <div>Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div>No conversations found.</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.chatId}
                className={`conversation-item ${conv.chatId === activeChatId ? "active" : ""
                  }`}
                onClick={() => handleConvClick(conv.chatId, conv.hostId)}
              >
                <CircleUserRound size={40} />
                <div className="conversation-info">
                  <h3>{conv.name}</h3>
                  <p>{conv.lastMessage?.split("/").pop() || "No messages yet"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="chat-area">
        {/* Chat Header */}
        <div className="chat-header">
          <h2>
            {activeConversation ? activeConversation.name : "Select a Chat"}
          </h2>
        </div>

        {/* Messages Area */}
        <div>
          {activeConversation ? (
            <ChatMessages
              messages={activeConversation.lastMessage}
              currentSenderId={senderId}
            />
          ) : (
            <div className="message-bubble">
              Select a conversation to start messaging
            </div>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="message-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!activeChatId}
          />
          <button type="submit" disabled={!activeChatId || !message.trim()}>
            Send
          </button>
        </form>
      </main>
    </div>
  );
};

export default ChatBox;
