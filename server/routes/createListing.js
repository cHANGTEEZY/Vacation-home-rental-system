import express from "express";
import { authenticateToken } from "../middlewares/authorization.js";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import multer from "multer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

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

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/",
  authenticateToken,
  upload.array("propertyImages", 5), // Allow up to 5 images
  async (req, res) => {
    const { propertyType, location, amenities, propertyRegion } = req.body;
    const images = req.files;
    const { latitude, longitude } = location;
    const details = JSON.parse(req.body.details);
    const userId = req.userId.id;

    console.log(propertyRegion);

    try {
      const uploadPromises = images.map(async (image) => {
        const imageKey = `${userId}/${uuidv4()}-${image.originalname}`;

        // Prepare the S3 upload parameters
        const uploadParams = {
          Bucket: bucketName,
          Key: imageKey,
          Body: image.buffer,
          ContentType: image.mimetype,
        };

        // Upload the image to S3
        const command = new PutObjectCommand(uploadParams);
        await s3.send(command);

        // Return the full URL of the uploaded image
        return imageKey;
      });

      const uploadedImages = await Promise.all(uploadPromises);

      const query = `
        INSERT INTO property_listing_details (
          user_id, property_type, title,approximate_location, latitude,longitude, price, guests, bedrooms, beds, bathrooms, kitchens, swimming_pool, amenities, image_urls,property_region
        ) VALUES (
          $1, $2, $3,$4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,$16
        )
        RETURNING property_id;
      `;

      const values = [
        userId,
        propertyType,
        details.Title,
        details.Location,
        longitude,
        latitude,
        details.Price,
        details.Guests,
        details.Bedrooms,
        details.Beds,
        details.Bathrooms,
        details.Kitchens,
        details["Swimming Pool"] || null,
        JSON.stringify(amenities),
        uploadedImages,
        propertyRegion,
      ];
      console.log(values);

      const result = await pool.query(query, values);

      res.json({
        message: "Listing created successfully",
        listingId: result.rows[0].id,
        uploadedImages,
      });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({
        message: "An error occurred while processing the listing",
        error: error.message,
      });
    }
  }
);

router.get("/", authenticateToken, async (req, res) => {
  const userId = req.userId.id;

  try {
    const data = await pool.query(
      "SELECT * FROM property_listing_details WHERE user_id=$1 ",
      [userId]
    );

    if (data.rows.length > 0) {
      // Map over all listings and generate signed URLs for each
      const listings = await Promise.all(
        data.rows.map(async (listing) => {
          const {
            property_id,
            property_type,
            title,
            approximate_location,
            latitude,
            longitude,
            price,
            guests,
            bedrooms,
            beds,
            bathrooms,
            kitchens,
            swimming_pool,
            amenities,
            created_at,
            image_urls,
            property_region,
          } = listing;

          // Generate signed URLs for each image in the listing
          const signedImageUrls = await Promise.all(
            image_urls.map(async (imageKey) => {
              const getObjectParams = {
                Bucket: bucketName,
                Key: imageKey,
              };
              const command = new GetObjectCommand(getObjectParams);
              return getSignedUrl(s3, command, { expiresIn: 3600 });
            })
          );

          // Return the structured listing object
          return {
            property_id,
            propertyType: property_type,
            title,
            approximateLocation: approximate_location,
            latitude,
            longitude,
            price,
            guests,
            bedrooms,
            beds,
            bathrooms,
            kitchens,
            swimmingPool: swimming_pool,
            amenities,
            createdAt: created_at,
            imageUrls: signedImageUrls,
            propertyRegion: property_region,
          };
        })
      );

      res.status(200).json(listings); // Send all listings as an array
    } else {
      res.status(404).json({ message: "No listings found for this user" });
    }
  } catch (error) {
    console.error("Error retrieving listing:", error);
    res.status(500).json({
      message: "An error occurred while retrieving the listing",
      error: error.message,
    });
  }
});

router.delete("/", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  const { id } = req.body;

  try {
    if (!userId || !id) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const result = await pool.query(
      "SELECT image_urls FROM property_listing_details WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    const rows = result.rows;

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Listing not found or unauthorized" });
    }

    const imageUrls = rows[0].image_urls;

    const deleteImagePromises = imageUrls.map(async (imageKey) => {
      const deleteParams = {
        Bucket: bucketName,
        Key: imageKey,
      };
      const command = new DeleteObjectCommand(deleteParams);
      return s3.send(command);
    });

    await Promise.all(deleteImagePromises); // Wait for all images to be deleted

    await pool.query(
      "DELETE FROM property_listing_details WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("Error deleting listing or images:", error);
    res.status(500).json({
      message: "Something went wrong",
      errorMessage: error.message,
    });
  }
});

router.put("/", authenticateToken, async (req, res) => {
  const userId = req.userId.id; // Assuming userId is valid and is added by authenticateToken
  const {
    id,
    title,
    price,
    propertyType,
    approximateLocation,
    guests,
    beds,
    bedrooms,
    bathrooms,
    kitchens,
    propertyRegion,
  } = req.body;

  // Validate incoming data (could be extended with more checks)
  if (!id || !title || !price || !propertyType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const checkQuery =
      "SELECT * FROM property_listing_details WHERE id = $1 AND user_id = $2";
    const checkValues = [id, userId];
    const checkResult = await pool.query(checkQuery, checkValues);

    if (checkResult.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this listing" });
    }

    // Proceed with updating the listing
    const updateListingQuery = `
      UPDATE property_listing_details 
      SET title = $1, price = $2, property_type = $3, approximate_location = $4, 
          guests = $5, beds = $6, bedrooms = $7, bathrooms = $8, kitchens = $9 , property_region=$10
      WHERE property_id = $11
    `;
    const values = [
      title,
      price,
      propertyType,
      approximateLocation,
      guests,
      beds,
      bedrooms,
      bathrooms,
      kitchens,
      propertyRegion,
      id,
    ];

    const updateListingData = await pool.query(updateListingQuery, values);

    if (updateListingData.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Listing not found or no changes made" });
    }

    // Successfully updated
    res.status(200).json({ message: "Listing updated successfully" });
  } catch (error) {
    console.error("Error updating listing:", error);
    res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
});

export default router;
