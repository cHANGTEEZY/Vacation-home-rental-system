import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middlewares/authorization.js";

const router = express.Router();

router.get("/sender-id", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId.id;
    const query = "SELECT user_id FROM user_details WHERE user_id = $1";
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user_id: result.rows[0].user_id });
  } catch (error) {
    console.error("Error fetching sender ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
})


router.post("/:id", authenticateToken, async (req, res) => {
  const { message } = req.body;

  const userId = req.userId.id;
  const senderMessage = `${userId}/${message}`;


  const hostPropertyId = req.params.id;

  try {
    const queryForHostId =
      "SELECT user_id FROM property_listing_details WHERE property_id = $1";
    const hostData = await pool.query(queryForHostId, [hostPropertyId]);

    if (hostData.rows.length > 0) {
      const hostId = hostData.rows[0].user_id;

      const checkMessageQuery = `
        SELECT messages FROM messages
        WHERE property_id = $1 AND host_id = $2 AND sender_id = $3
      `;

      const existingMessages = await pool.query(checkMessageQuery, [
        hostPropertyId,
        hostId,
        userId,
      ]);

      if (existingMessages.rows.length > 0) {
        const updateMessageQuery = `
          UPDATE messages
          SET messages = COALESCE(messages, '') || ', ' || $1, updated_at = CURRENT_TIMESTAMP
          WHERE property_id = $2 AND host_id = $3 AND sender_id = $4
          RETURNING *;
        `;

        const result = await pool.query(updateMessageQuery, [
          senderMessage,
          hostPropertyId,
          hostId,
          userId,
        ]);

        if (result.rows.length > 0) {
          return res
            .status(200)
            .json({ message: "Message updated successfully!" });
        } else {
          return res.status(400).json({ message: "Failed to update message" });
        }
      } else {
        const insertMessageQuery = `
          INSERT INTO messages (property_id, host_id, sender_id, messages)
          VALUES ($1, $2, $3, $4) RETURNING *;
        `;

        const result = await pool.query(insertMessageQuery, [
          hostPropertyId,
          hostId,
          userId,
          senderMessage,
        ]);

        if (result.rows.length > 0) {
          return res
            .status(200)
            .json({ message: "Message sent successfully!" });
        } else {
          return res.status(400).json({ message: "Failed to send message" });
        }
      }
    } else {
      console.log("No host found with the given property id");
      return res.status(404).json({ message: "Host not found" });
    }
  } catch (error) {
    console.error("Error processing message:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  try {
    const getAllConversations = await pool.query(
      `
      SELECT DISTINCT ON (m.host_id, m.property_id)
        m.message_id,
        m.host_id,
        m.sender_id,
        m.property_id,
        m.messages,
        m.created_at,
        u.user_name AS host_name,
        p.title AS property_title
      FROM messages m
      JOIN user_details u ON m.host_id = u.user_id
      JOIN property_listing_details p ON m.property_id = p.property_id
      WHERE m.sender_id = $1 OR m.host_id = $1
      ORDER BY m.host_id, m.property_id, m.created_at DESC
      `,
      [userId]
    );

    if (getAllConversations.rows.length === 0) {
      return res.status(404).json({ message: "No conversations found" });
    }

    const conversations = getAllConversations.rows.map((conv) => ({
      chatId: conv.message_id,
      name: conv.host_name,
      propertyTitle: conv.property_title,
      senderId: conv.sender_id === userId ? userId : conv.host_id,
      receiverId: conv.sender_id === userId ? conv.host_id : userId,
      lastMessage: conv.messages,
      timestamp: conv.created_at,
    }));

    res.status(200).json(conversations);
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const senderId = req.userId.id;
  const { chatId, message } = req.body;
  const senderMessage = `${senderId}/${message}`;

  try {
    // Check if the conversation exists
    const checkMessageQuery = `
      SELECT messages FROM messages
      WHERE message_id = $1 
    `;

    const existingMessages = await pool.query(checkMessageQuery, [
      chatId,
    ]);

    if (existingMessages.rows.length > 0) {
      // Update existing conversation
      const updateMessageQuery = `
        UPDATE messages
        SET messages = COALESCE(messages, '') || ', ' || $1, updated_at = CURRENT_TIMESTAMP
        WHERE message_id = $2  
        RETURNING *;
      `;

      const result = await pool.query(updateMessageQuery, [
        senderMessage,
        chatId,
        
      ]);

      if (result.rows.length > 0) {
        return res.status(200).json({ message: "Message updated successfully!" });
      } else {
        return res.status(400).json({ message: "Failed to update message" });
      }
    } else {
      return res.status(404).json({ message: "Conversation not found" });
    }
  } catch (error) {
    console.error("Error processing message:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
