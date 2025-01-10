import express from "express";
import { pool } from "../db.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import calculateDistance from "../utils/haverSine.js";

const router = express.Router();

// AWS setup
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

// Helper function to generate signed URLs for images
const generateSignedUrls = async (imageUrls) => {
  return await Promise.all(
    imageUrls.map(async (imageKey) => {
      const params = {
        Bucket: bucketName,
        Key: imageKey,
      };
      const command = new GetObjectCommand(params);
      return getSignedUrl(s3, command, { expiresIn: 3600 });
    })
  );
};

router.post("/", async (req, res) => {
  const { startDate, endDate, regionName, totalGuest } = req.body;

  try {
    let propertyQuery;
    let queryParams;

    // Step 1: Determine the query based on regionName
    if (regionName === "Global") {
      propertyQuery = `
        SELECT * 
        FROM property_listing_details 
        WHERE guests >= $1
      `;
      queryParams = [totalGuest];
    } else {
      propertyQuery = `
        SELECT * 
        FROM property_listing_details 
        WHERE property_region = $1 
        AND guests >= $2
      `;
      queryParams = [regionName, totalGuest];
    }

    // Step 2: Fetch properties
    const propertyResult = await pool.query(propertyQuery, queryParams);

    // If no properties match, return a 200 response with an empty array
    if (propertyResult.rows.length === 0) {
      return res.status(200).json({
        properties: [],
        message: "No properties found with the given constraints.",
      });
    }

    // Step 3: Filter properties based on availability
    const availableProperties = [];

    for (const property of propertyResult.rows) {
      const { property_id, image_urls } = property;

      // Check bookings for the property
      const bookingQuery = `
        SELECT booking_start_date, booking_end_date 
        FROM bookings 
        WHERE property_id = $1
      `;
      const bookingResult = await pool.query(bookingQuery, [property_id]);

      // Check if the property is available for the given date range
      const isAvailable = bookingResult.rows.every((booking) => {
        const { booking_start_date, booking_end_date } = booking;
        return (
          new Date(endDate) <= new Date(booking_start_date) ||
          new Date(startDate) >= new Date(booking_end_date)
        );
      });

      if (isAvailable) {
        // Generate signed URLs for property images
        const signedImageUrls = await generateSignedUrls(image_urls || []);
        availableProperties.push({
          ...property,
          image_urls: signedImageUrls,
        });
      }
    }

    // Step 4: Return available properties to the user
    return res.status(200).json({
      properties: availableProperties,
      message:
        availableProperties.length === 0
          ? "No properties available for the selected date range."
          : "Available properties retrieved successfully.",
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

router.post("/options", async (req, res) => {
  const {
    minPrice,
    maxPrice,
    propertyType,
    userLatitude,
    userLongitude,
    distance,
  } = req.body;

  console.log("User Coordinates:", userLatitude, userLongitude, distance);

  try {
    let propertyQuery = `SELECT * FROM property_listing_details WHERE 1=1`;
    const queryParams = [];
    let paramCount = 1;

    if (minPrice && maxPrice) {
      propertyQuery += ` AND price BETWEEN $${paramCount} AND $${
        paramCount + 1
      }`;
      queryParams.push(minPrice, maxPrice);
      paramCount += 2;
    }

    if (propertyType && propertyType !== "Any") {
      propertyQuery += ` AND property_type = $${paramCount}`;
      queryParams.push(propertyType);
      paramCount += 1;
    }

    // Commented out rating filter as per request
    // if (rating) {
    //   propertyQuery += ` AND averate_review_rating >= $${paramCount}`;
    //   queryParams.push(rating);
    //   paramCount += 1;
    // }

    propertyQuery += ` ORDER BY averate_review_rating DESC`;

    console.log("SQL Query:", propertyQuery);
    console.log("Query Parameters:", queryParams);

    const propertyResult = await pool.query(propertyQuery, queryParams);

    if (propertyResult.rows.length === 0) {
      return res.status(200).json({
        properties: [],
        message: "No properties match the given criteria.",
      });
    }

    let propertiesWithDetails = await Promise.all(
      propertyResult.rows.map(async (property) => {
        let distance = null;
        if (userLatitude && userLongitude) {
          try {
            distance = calculateDistance(
              userLatitude,
              userLongitude,
              property.latitude,
              property.longitude
            );
          } catch (error) {
            console.error(
              `Error calculating distance for property ${property.property_id}:`,
              error
            );
          }
        }

        const signedImageUrls = await generateSignedUrls(
          property.image_urls || []
        );

        return {
          ...property,
          distance,
          image_urls: signedImageUrls,
        };
      })
    );

    console.log(
      "Distances before sorting:",
      propertiesWithDetails.map((p) => p.distance)
    );

    if (userLatitude && userLongitude) {
      propertiesWithDetails.sort((a, b) => {
        if (a.distance === null && b.distance === null) {
          return b.averate_review_rating - a.averate_review_rating;
        }
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;

        if (typeof a.distance === "string" || typeof b.distance === "string") {
          const isFurthest = distance === "Furthest";
          return isFurthest ? -1 : 1;
        }

        const distanceDiff = a.distance - b.distance;
        return distance === "Furthest" ? -distanceDiff : distanceDiff;
      });
    }

    return res.status(200).json({
      properties: propertiesWithDetails,
      message: "Properties retrieved successfully.",
      sortedBy:
        userLatitude && userLongitude ? distance || "Nearest" : "Rating",
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

export default router;
