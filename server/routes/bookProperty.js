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

  console.log(bookingStartDate);
  console.log(bookingEndDate);

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

//delete booking after it has matured
router.delete("/", authenticateToken, async (req, res) => {
  const { bookingIds } = req.body;
  const userId = req.userId.id;

  console.log("Received booking IDs:", bookingIds);
  console.log("User ID:", userId);

  if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
    return res.status(400).json({ message: "No booking IDs provided" });
  }

  try {
    const getBookingsQuery = `
      SELECT booking_id, booking_end_date
      FROM bookings
      WHERE user_id = $1 AND booking_id = ANY($2::int[])
    `;

    const bookings = await pool.query(getBookingsQuery, [userId, bookingIds]);

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

    // Extract booking IDs to delete
    const expiredBookingIds = expiredBookings.map(
      (booking) => booking.booking_id
    );

    // Modified query to delete using integer IDs
    const deleteBookingsQuery = `
      DELETE FROM bookings
      WHERE user_id = $1 AND booking_id = ANY($2::int[])
      RETURNING booking_id
    `;

    const deletedBookings = await pool.query(deleteBookingsQuery, [
      userId,
      expiredBookingIds,
    ]);

    return res.status(200).json({
      message: "Expired bookings deleted successfully",
      deletedBookingIds: deletedBookings.rows.map((row) => row.booking_id),
    });
  } catch (error) {
    console.error("Error deleting expired bookings:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
export default router;
