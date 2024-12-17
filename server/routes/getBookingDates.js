import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/:propertyID", async (req, res) => {
  const propertyId = req.params.propertyID;

  if (!propertyId) {
    return res.status(400).json({ message: "Property Id not found" });
  }

  try {
    const propertyBookedDates = await pool.query(
      "SELECT booking_start_date, booking_end_date FROM bookings WHERE property_id=$1",
      [propertyId]
    );

    if (propertyBookedDates.rows.length > 0) {
      const bookings = propertyBookedDates.rows.map((row) => ({
        booking_start_date: row.booking_start_date,
        booking_end_date: row.booking_end_date,
      }));

      res.status(200).json({ message: bookings });
    } else {
      res
        .status(401)
        .json({ message: "No booking dates found for this property" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
});

export default router;
