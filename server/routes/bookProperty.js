import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middlewares/authorization.js";

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  const {
    bookingStartDate,
    bookingEndDate,
    totalGuests,
    totalStay,
    bookedPropertyId,
    totalCost,
    bookingStatus,
  } = req.body;

  const bookersId = req.userId.id;

  try {
    if (bookersId && bookedPropertyId) {
      const insertBookingData = await pool.query(
        "INSERT INTO bookings (user_id,property_id,booking_start_date,booking_end_date,total_guests,total_price,booking_status) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [
          bookersId,
          bookedPropertyId,
          bookingStartDate,
          bookingEndDate,
          totalGuests,
          totalCost,
          bookingStatus,
        ]
      );

      res.status(200).json({ message: "Booking successful!" });
    } else {
      res.status(400).json({ message: "Missing booker or property ID." });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: `Server error  : ${error.message}` });
  }
});

//get all booked date and data
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.userId.id;

  if (!userId) return res.status(400).json({ message: "User ID not found" });

  try {
    const getBookedPropertyDetails = await pool.query(
      "SELECT booking_id, property_id, booking_start_date, booking_end_date FROM bookings WHERE user_id=$1 ",
      [userId]
    );

    if (getBookedPropertyDetails.rows.length > 0) {
      const bookedPropertyDetail = getBookedPropertyDetails.rows.map(
        (data) => ({
          bookingId: data.booking_id,
          propertyId: data.property_id,
          bookingStartDate: data.booking_start_date,
          bookingEndDate: data.booking_end_date,
        })
      );

      res.status(200).json({ bookedPropertyDetail });
    } else {
      res.status(404).json({ message: "No bookings found" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

//get all booked property of host
router.get("/get-booked-properties", authenticateToken, async (req, res) => {
  const hostId = req.userId.id;
  try {
    const bookingsQuery = `
            SELECT 
                b.booking_id,
                b.property_id,
                b.booking_start_date,
                b.booking_end_date,
                b.total_guests,
                b.total_price,
                b.booking_status,
                b.created_at,
                p.title as property_title,
                p.property_type,
                p.approximate_location
            FROM bookings b
            JOIN property_listing_details p ON b.property_id = p.property_id
            JOIN user_details u ON b.user_id = u.user_id
            WHERE p.user_id = $1
            ORDER BY b.booking_start_date DESC
        `;

    const { rows } = await pool.query(bookingsQuery, [hostId]);
    console.log(rows);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error in getHostBookings:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//delete booking based on user request
router.delete("/:bookingId", authenticateToken, async (req, res) => {
  const id = req.userId.id;
  const bookingId = req.params.bookingId;

  if (!id) return res.status(400).json({ message: "User not found" });

  try {
    const deleteBooking = await pool.query(
      "DELETE FROM bookings WHERE booking_id=$1",
      [bookingId]
    );

    if (deleteBooking.rowCount === 0) {
      return res
        .status(400)
        .json({ message: "Booking with given id was not found" });
    }

    return res.status(200).json({ message: "Booking Deleted successfully" });
  } catch (error) {
    console.error(error.message);
  }
});

//delete booking after it has matured and add it to the visited properties table tooez
router.delete("/", authenticateToken, async (req, res) => {
  const { bookingIds } = req.body;
  const userId = req.userId.id;

  console.log("Received booking IDs:", bookingIds);
  console.log("User ID:", userId);

  if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
    return res.status(400).json({ message: "No booking IDs provided" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // Start transaction

    // Get bookings that belong to the user and match the provided booking IDs
    const getBookingsQuery = `
      SELECT booking_id, booking_end_date, property_id
      FROM bookings
      WHERE user_id = $1 AND booking_id = ANY($2::int[])
    `;

    const bookings = await client.query(getBookingsQuery, [userId, bookingIds]);

    console.log("Fetched bookings:", bookings.rows);

    if (bookings.rows.length === 0) {
      return res.status(400).json({ message: "No valid bookings found" });
    }

    const currentDate = new Date();
    const expiredBookings = bookings.rows.filter((booking) => {
      const bookingEndDate = new Date(booking.booking_end_date);
      return currentDate > bookingEndDate;
    });

    console.log("Expired bookings:", expiredBookings);

    if (expiredBookings.length === 0) {
      return res.status(400).json({
        message: "No bookings have expired. Nothing to delete.",
      });
    }

    // Insert expired bookings into visited_properties
    for (const booking of expiredBookings) {
      const insertVisitedPropertiesQuery = `
        INSERT INTO visited_properties (user_id, property_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, property_id) DO NOTHING;
      `;
      await client.query(insertVisitedPropertiesQuery, [
        userId,
        booking.property_id,
      ]);
    }

    // Extract booking IDs to delete
    const expiredBookingIds = expiredBookings.map(
      (booking) => booking.booking_id
    );

    // Delete the expired bookings
    const deleteBookingsQuery = `
      DELETE FROM bookings
      WHERE user_id = $1 AND booking_id = ANY($2::int[])
      RETURNING booking_id
    `;
    const deletedBookings = await client.query(deleteBookingsQuery, [
      userId,
      expiredBookingIds,
    ]);

    // Commit the transaction
    await client.query("COMMIT");
    return res.status(200).json({
      message:
        "Expired bookings deleted and added to visited properties successfully",
      deletedBookingIds: deletedBookings.rows.map((row) => row.booking_id),
    });
  } catch (error) {
    // Rollback transaction in case of an error
    await client.query("ROLLBACK");
    console.error("Error deleting expired bookings:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  } finally {
    // Release the client back to the pool
    client.release();
  }
});

export default router;
