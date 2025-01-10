import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middlewares/authorization.js";

const router = express.Router();

router.post("/:propertyId", authenticateToken, async (req, res) => {
  const { propertyId } = req.params;
  const userId = req.userId.id;
  const { rating, message } = req.body;

  if (!userId || !propertyId) {
    return res
      .status(400)
      .json({ message: "User ID or Property ID not found" });
  }

  if (!rating || !message) {
    return res.status(400).json({ message: "Rating and message are required" });
  }

  try {
    const checkIfAlreadyReviewed = await pool.query(
      "SELECT * FROM reviews WHERE user_id=$1 AND property_id=$2",
      [userId, propertyId]
    );

    let result;
    if (checkIfAlreadyReviewed.rows.length > 0) {
      // Update the review if it exists
      result = await pool.query(
        "UPDATE reviews SET rating=$1, review_message=$2, review_date_time=NOW() WHERE user_id=$3 AND property_id=$4",
        [rating, message, userId, propertyId]
      );

      const getRatings = await pool.query(
        "SELECT rating FROM reviews WHERE property_id = $1",
        [propertyId]
      );

      const allRatings = getRatings.rows.map((row) => row.rating);
      const averageRating =
        allRatings.reduce((sum, rating) => sum + rating, 0) /
          allRatings.length || 0;
      const insertRatingData = await pool.query(
        "UPDATE property_listing_details SET averate_review_rating=$1 WHERE property_id=$2",
        [averageRating, propertyId]
      );
    } else {
      // Insert a new review if it doesn't exist
      result = await pool.query(
        "INSERT INTO reviews (user_id, property_id, rating, review_message) VALUES ($1, $2, $3, $4)",
        [userId, propertyId, rating, message]
      );
      const getRatings = await pool.query(
        "SELECT rating FROM reviews WHERE property_id = $1",
        [propertyId]
      );

      const allRatings = getRatings.rows.map((row) => row.rating);
      const averageRating =
        allRatings.reduce((sum, rating) => sum + rating, 0) /
          allRatings.length || 0;
      const insertRatingData = await pool.query(
        "UPDATE property_listing_details SET averate_review_rating=$1 WHERE property_id=$2",
        [averageRating, propertyId]
      );
    }

    if (result.rowCount > 0) {
      res.status(200).json({ message: "Review submitted successfully" });
    } else {
      res.status(400).json({ message: "Error submitting review" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

//gets all the reviews and ratings for given property id
router.get("/:propertyID", async (req, res) => {
  const { propertyID } = req.params;
  if (!propertyID)
    return res.status(400).json({ message: "No property Id given" });

  try {
    const data = await pool.query(
      "SELECT r.rating, r.review_message, r.review_date_time, u.user_name FROM reviews r JOIN user_details u ON r.user_id = u.user_id WHERE property_id = $1",
      [propertyID]
    );

    const getRatings = await pool.query(
      "SELECT rating FROM reviews WHERE property_id = $1",
      [propertyID]
    );

    const allRatings = getRatings.rows.map((row) => row.rating);
    const averageRating =
      allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length ||
      0;

    if (data.rowCount > 0) {
      const totalReviews = data.rowCount;
      res.status(200).json({
        message: data.rows,
        totalReviews: totalReviews,
        averageRating: averageRating.toFixed(1),
      });
    } else {
      return res.status(400).json({ message: "No Reviews found" });
    }
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ message: "Internal Server error: " + error.message });
  }
});

export default router;
