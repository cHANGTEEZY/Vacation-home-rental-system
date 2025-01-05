import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middlewares/authorization.js";

const router = express.Router();

router.post("/:id", authenticateToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.userId.id;
  const hostPropertyId = req.params.id;

  try {
    const queryForHostId =
      "SELECT user_id FROM property_listing_details WHERE property_id = $1";
    const hostData = await pool.query(queryForHostId, [hostPropertyId]);

    if (hostData.rows.length > 0) {
      const hostId = hostData.rows[0].user_id;

      const checkMessage = `
        SELECT * FROM messages
        WHERE property_id = $1 AND host_id = $2 AND sender_id = $3
        LIMIT 1;
      `;
      const checkMessageExist = await pool.query(checkMessage, [
        hostPropertyId,
        hostId,
        userId,
      ]);

      if (checkMessageExist.rows.length > 0) {
        // If the message exists, update it
        const messageId = checkMessageExist.rows[0].message_id; // Get the existing message_id
        const updateMessageQuery = `
          UPDATE messages
          SET sent_message = $1, updated_at = CURRENT_TIMESTAMP
          WHERE message_id = $2
          RETURNING *;
        `;
        const result = await pool.query(updateMessageQuery, [
          message,
          messageId,
        ]);

        // Check if the update was successful
        if (result.rows.length > 0) {
          return res
            .status(200)
            .json({ message: "Message updated successfully!" });
        } else {
          return res.status(400).json({ message: "Failed to update message" });
        }
      } else {
        const insertMessageQuery = `
          INSERT INTO messages (property_id, host_id, sender_id, sent_message)
          VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        const result = await pool.query(insertMessageQuery, [
          hostPropertyId,
          hostId,
          userId,
          message,
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
        m.host_id,
        m.property_id,
        m.sent_message,
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
      chatId: `${conv.host_id}-${conv.property_id}`,
      name: conv.host_name,
      propertyTitle: conv.property_title,
      lastMessage: conv.sent_message,
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

// Add new route to fetch message history
router.get("/:chatId/messages", authenticateToken, async (req, res) => {
  const chatId = req.params.chatId;
  const [hostId, propertyId] = chatId.split("-");

  try {
    const messages = await pool.query(
      `
      SELECT 
        m.*,
        sender.user_name as sender_name
      FROM messages m
      JOIN user_details sender ON m.sender_id = sender.user_id
      WHERE m.property_id = $1 AND m.host_id = $2
      ORDER BY m.created_at ASC
      `,
      [propertyId, hostId]
    );

    res.status(200).json(messages.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Failed to fetch message history" });
  }
});

export default router;
