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
  upload.array("propertyImages", 5),
  async (req, res) => {
    const { propertyType, location, amenities, propertyRegion } = req.body;
    const images = req.files;
    const { latitude, longitude } = location;
    const details = JSON.parse(req.body.details);
    const userId = req.userId.id;

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
        INSERT INTO pending_property_listing_details (
          user_id, property_type, title,approximate_location, latitude,longitude, price, guests, bedrooms, beds, bathrooms, kitchens, swimming_pool, amenities, image_urls,property_region
        ) VALUES (
          $1, $2, $3,$4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,$16
        )
        RETURNING pending_property_id;
      `;

      const values = [
        userId,
        propertyType,
        details.Title,
        details.Location,
        latitude,
        longitude,
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

router.get("/rejected-properties", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  console.log(userId);
  try {
    const data = await pool.query(
      "SELECT * FROM pending_property_listing_details WHERE user_id=$1 ",
      [userId]
    );

    if (data.rows.length > 0) {
      const listings = await Promise.all(
        data.rows.map(async (listing) => {
          const {
            pending_property_id,
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

          return {
            pending_property_id,
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

      res.status(200).json(listings);
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

router.get("/booked-properties", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  console.log("Hello");
  try {
    const query = `
      SELECT 
        b.booking_id,
        b.booking_start_date,
        b.booking_end_date,
        b.total_guests,
        b.total_price,
        b.booking_status,
        p.property_id,
        p.property_type,
        p.title,
        p.approximate_location,
        p.latitude,
        p.longitude,
        p.price,
        p.guests,
        p.bedrooms,
        p.beds,
        p.bathrooms,
        p.kitchens,
        p.swimming_pool,
        p.amenities,
        p.image_urls,
        p.property_region
      FROM bookings b
      INNER JOIN property_listing_details p ON b.property_id = p.property_id
      WHERE p.user_id = $1
    `;

    const data = await pool.query(query, [userId]);

    if (data.rows.length > 0) {
      // Map over bookings and generate signed URLs for property images
      const bookedProperties = await Promise.all(
        data.rows.map(async (booking) => {
          const {
            booking_id,
            booking_start_date,
            booking_end_date,
            total_guests,
            total_price,
            booking_status,
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
            image_urls,
            property_region,
          } = booking;

          // Generate signed URLs for images
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

          // Return structured data for the booked property
          return {
            bookingId: booking_id,
            bookingStartDate: booking_start_date,
            bookingEndDate: booking_end_date,
            totalGuests: total_guests,
            totalPrice: total_price,
            bookingStatus: booking_status,
            propertyDetails: {
              propertyId: property_id,
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
              imageUrls: signedImageUrls,
              propertyRegion: property_region,
            },
          };
        })
      );

      res.status(200).json(bookedProperties);
    } else {
      res
        .status(404)
        .json({ message: "No booked properties found for this host." });
    }
  } catch (error) {
    console.error("Error retrieving booked properties:", error);
    res.status(500).json({
      message: "An error occurred while retrieving booked properties",
      error: error.message,
    });
  }
});

//delete listing
router.delete("/", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  console.log("Listing delete route");
  const { id } = req.body;
  console.log(id);

  try {
    if (!userId || !id) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const result = await pool.query(
      "SELECT image_urls FROM property_listing_details WHERE property_id=$1 AND user_id=$2",
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
      "DELETE FROM property_listing_details WHERE property_id=$1 AND user_id=$2",
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

//update listing
router.put("/", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  const {
    property_id,
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
    amenities,
  } = req.body;

  if (!property_id || !title || !price || !propertyType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const checkQuery =
      "SELECT * FROM property_listing_details WHERE property_id = $1 AND user_id = $2";
    const checkValues = [property_id, userId];
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
          guests = $5, beds = $6, bedrooms = $7, bathrooms = $8, kitchens = $9 , property_region=$10,amenities=$11
      WHERE property_id = $12
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
      JSON.stringify(amenities),
      property_id,
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

//update pending property listing
router.put("/pending-property", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  const {
    pending_property_id,
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
    amenities,
  } = req.body;

  if (!pending_property_id || !title || !price || !propertyType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const checkQuery =
      "SELECT * FROM pending_property_listing_details WHERE pending_property_id = $1 AND user_id = $2";
    const checkValues = [pending_property_id, userId];
    const checkResult = await pool.query(checkQuery, checkValues);

    if (checkResult.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this listing" });
    }

    // Proceed with updating the listing
    const updateListingQuery = `
      UPDATE pending_property_listing_details 
      SET title = $1, price = $2, property_type = $3, approximate_location = $4, 
          guests = $5, beds = $6, bedrooms = $7, bathrooms = $8, kitchens = $9 , property_region=$10,amenities=$11
      WHERE pending_property_id = $12
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
      JSON.stringify(amenities),
      pending_property_id,
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

router.delete("/pending-property", authenticateToken, async (req, res) => {
  const userId = req.userId.id;
  const { id } = req.body;
  console.log(id);

  try {
    if (!userId || !id) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const result = await pool.query(
      "SELECT image_urls FROM pending_property_listing_details WHERE pending_property_id=$1 AND user_id=$2",
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

    await Promise.all(deleteImagePromises);

    await pool.query(
      "DELETE FROM pending_property_listing_details WHERE pending_property_id=$1 AND user_id=$2",
      [id, userId]
    );

    res
      .status(200)
      .json({ message: "Pending Proeprty listing deleted successfully" });
  } catch (error) {
    console.error("Error deleting listing or images:", error);
    res.status(500).json({
      message: "Something went wrong",
      errorMessage: error.message,
    });
  }
});

//get rejected message
router.get(
  "/get-rejected-message/:propertyId",
  authenticateToken,
  async (req, res) => {
    const userId = req.userId.id;
    const { propertyId } = req.params;

    try {
      const query =
        "SELECT rejection_reason, admin_host_message_id FROM admin_host_messages WHERE host_id=$1 AND rejected_property_id=$2";
      const data = await pool.query(query, [userId, propertyId]);

      if (data.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "No rejection message found for this property" });
      }

      console.log(data.rows[0].rejection_reason);
      res.status(200).json({
        message: data.rows[0].rejection_reason,
        messageId: data.rows[0].admin_host_message_id,
      });
    } catch (error) {
      console.error("Error fetching rejection message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

//submit for review
router.post(
  "/submit-review/:propertyId",
  authenticateToken,
  async (req, res) => {
    const { propertyId } = req.params;
    console.log(propertyId);
    const userId = req.userId.id;
    console.log(userId);

    if (!userId) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const query =
      "UPDATE pending_property_listing_details SET property_status=$1 WHERE pending_property_id=$2 AND user_id=$3";

    const data = await pool.query(query, ["Pending", propertyId, userId]);

    if (data.rowCount === 0) {
      return res
        .status(400)
        .json({ message: "Porperty of give id or userid not found" });
    }
    res.status(200).json({ message: "Property sent for review" });
  }
);

export default router;
