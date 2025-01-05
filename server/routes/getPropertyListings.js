import express from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { pool } from "../db.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// AWS S3 setup
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

router.get("/", async (req, res) => {
  try {
    // Fetch all property listings
    const data = await pool.query("SELECT * FROM property_listing_details");

    if (data.rows.length > 0) {
      // Map over the listings and generate signed URLs for each
      const listingData = await Promise.all(
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
          } = listing;

          // Generate signed URLs for the images
          const signedImageUrls = await generateSignedUrls(image_urls);

          // Return structured data including signed URLs
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
          };
        })
      );

      // Send the listings with signed URLs to the client
      return res.status(200).json(listingData);
    }

    // If no listings are found, return an empty array
    return res.status(200).json([]);
  } catch (error) {
    console.error("Error fetching property listings:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

//get property of specific id
router.get("/:propertyId", async (req, res) => {
  const propertyId = req.params.propertyId;

  const data = await pool.query(
    "SELECT * from property_listing_details WHERE property_id=$1",
    [propertyId]
  );
  try {
    if (data.rows.length > 0) {
      const listingData = await Promise.all(
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
          } = listing;

          // Generate signed URLs for the images
          const signedImageUrls = await generateSignedUrls(image_urls);

          // Return structured data including signed URLs
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
          };
        })
      );

      return res.status(200).json(listingData);
    }
  } catch (error) {
    console.error("Error fetching property listings:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/host-name/:propertyId", async (req, res) => {
  const propertyId = req.params.propertyId;

  try {
    const data = await pool.query(
      `SELECT user_details.user_name, user_details.user_phone_number, user_details.user_address, user_details.user_email
       FROM user_details 
       INNER JOIN property_listing_details 
       ON user_details.user_id = property_listing_details.user_id 
       WHERE property_listing_details.property_id = $1`,
      [propertyId]
    );

    if (data.rows.length > 0) {
      res.status(200).json({
        hostName: data.rows[0].user_name,
        hostPhoneNumber: data.rows[0].user_phone_number,
        hostAddress: data.rows[0].user_address,
        hostEmailAddress: data.rows[0].user_email,
      });
    } else {
      res.status(404).json({ message: "Host not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//toget multiple propertyDetail

router.get("/multiple/:propertyIds", async (req, res) => {
  const propertyIds = req.params.propertyIds
    .split(",")
    .map((id) => parseInt(id, 10))
    .filter((id) => !isNaN(id));

  // Check if propertyIds is valid
  if (propertyIds.length === 0) {
    return res.status(400).json({ message: "Invalid property ID(s)" });
  }

  try {
    // Dynamically create placeholders for the SQL query
    const placeholders = propertyIds
      .map((_, index) => `$${index + 1}`)
      .join(", ");
    const query = `SELECT property_id,property_type,title,approximate_location,latitude,longitude,image_urls FROM property_listing_details WHERE property_id IN (${placeholders})`;

    // Use the dynamically created query
    const data = await pool.query(query, propertyIds);

    if (data.rows.length > 0) {
      const listingData = await Promise.all(
        data.rows.map(async (listing) => {
          const {
            property_id,
            property_type,
            title,
            approximate_location,
            latitude,
            longitude,
            image_urls,
          } = listing;

          // Generate signed URLs for the images
          const signedImageUrls = await generateSignedUrls(image_urls);

          // Return structured data including signed URLs
          return {
            property_id,
            propertyType: property_type,
            title,
            approximateLocation: approximate_location,
            latitude,
            longitude,
            imageUrls: signedImageUrls,
          };
        })
      );

      return res.status(200).json(listingData);
    } else {
      return res.status(404).json({ message: "No properties found" });
    }
  } catch (error) {
    console.error("Error fetching property listings:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
