import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middlewares/authorization.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = express.Router();

//aws setup
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

const generateSignedUrls = async (imageUrls) => {
  return await Promise.all(
    imageUrls.map(async (imageKey) => {
      const params = {
        Bucket: bucketName,
        Key: imageKey,
      };
      const command = new GetObjectCommand(params);
      return getSignedUrl(s3, command, { expiresIn: 3600 }); // URL expires in 1 hour
    })
  );
};

//routes
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.userId.id;

  try {
    // Combined query
    const query = `
      SELECT p.approximate_location,p.property_region, p.property_id, p.image_urls, p.title, p.beds, p.bedrooms 
      FROM property_listing_details p
      INNER JOIN wishlists w ON p.property_id = w.property_id
      WHERE w.user_id = $1
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No wishlists found" });
    }

    // Map and generate signed URLs
    const wishlistData = await Promise.all(
      result.rows.map(async (row) => {
        const {
          property_id,
          image_urls,
          title,
          beds,
          bedrooms,
          approximate_location,
          property_region,
        } = row;
        const signedImageUrls = await generateSignedUrls(image_urls || []);
        return {
          property_id,
          title,
          approximate_location,
          property_region,
          beds,
          bedrooms,
          images: signedImageUrls,
        };
      })
    );
    res.status(200).json({ data: wishlistData });
  } catch (error) {
    console.error("Error retrieving wishlist data:", error.message);
    res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
});

router.get("/:propertyId", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  const { propertyId } = req.params;

  try {
    const checkQuery =
      "SELECT * FROM wishlists WHERE property_id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [propertyId, userId]);

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ isWishlist: false });
    }

    res.status(200).json({ isWishlist: true });
  } catch (error) {
    console.error("Error checking wishlist:", error.message);
    res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
});

router.post("/:propertyId", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  const { propertyId } = req.params;

  try {
    const checkQuery =
      "SELECT * FROM wishlists WHERE property_id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [propertyId, userId]);

    if (checkResult.rowCount > 0) {
      return res.status(400).json({ message: "Property already in wishlist" });
    }

    const insertQuery =
      "INSERT INTO wishlists (property_id, user_id) VALUES ($1, $2)";
    await pool.query(insertQuery, [propertyId, userId]);

    res.status(200).json({ message: "Property added to wishlist" });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
});

router.delete("/:propertyId", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  const { propertyId } = req.params;

  try {
    const checkQuery =
      "DELETE FROM wishlists WHERE property_id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [propertyId, userId]);
    if (checkResult.rowCount === 0) {
      return res.status(400).json({ message: "Property is not in wishlist" });
    }
    res.status(200).json({ message: "Property removed from wishlist" });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
});

export default router;
