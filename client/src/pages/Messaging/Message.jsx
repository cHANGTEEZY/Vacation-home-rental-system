import { useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useRef } from "react";

import { User } from "lucide-react";
import Header from "../../components/Header/Header";
import "./Message.css";

const Message = () => {
  const { id } = useParams();
  const location = useLocation();
  const textareaRef = useRef();
  const query = new URLSearchParams(location.search);

  const hostName = query.get("hostname") || "host";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;

    let message = textareaRef.current.value;
    if (!message) return;

    try {
      const response = await fetch(`http://localhost:3000/message-host/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
      }
      toast.success(data.message);
      textareaRef.current.value = "";
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <>
      <Header showSearch={false} />

      <section className="chat-with-host-container">
        <section className="host-info">
          <div className="host-info-left">
            <h1>Contact {hostName}</h1>
            <p>Typically responds within an hour</p>
          </div>
          <div className="host-info-right">
            <div className="host-info-right-user">
              <User size={33} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        <section className="chat-section">
          <h1>Have questions? Message the host</h1>
          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="message-host-box"
              type="text"
              placeholder={`Hi ${hostName}! I'll be visiting...`}
            />
            <button type="submit">Send message</button>
          </form>
        </section>
      </section>
    </>
  );
};

export default Message;
