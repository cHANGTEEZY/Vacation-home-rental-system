export const configureSocket = (io, pool) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle "sendMessage" event
    socket.on(
      "sendMessage",
      async ({ propertyId, senderId, hostId, chatMessage }) => {
        try {
          // Insert the message into the database
          const newMessage = await pool.query(
            `
          INSERT INTO messages (property_id, host_id, sender_id, chat_message)
          VALUES ($1, $2, $3, $4)
          RETURNING *;
          `,
            [propertyId, hostId, senderId, chatMessage]
          );

          // Emit the message to the specific host
          const savedMessage = newMessage.rows[0];
          io.emit(`message:${hostId}`, savedMessage);

          console.log(
            `Message saved and sent to host ${hostId}:`,
            savedMessage
          );
        } catch (err) {
          console.error("Error saving message:", err.message);
        }
      }
    );

    // Handle "disconnect" event
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
