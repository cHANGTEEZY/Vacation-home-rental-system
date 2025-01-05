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

router.get("/", authenticateToken, async (req, res) => {
  const userId = req.userId.id;

  if (!userId) return res.status(400).json({ message: "Unauthorized" });

  try {
    const query = `SELECT p.approximate_location,p.property_region, p.property_id, p.image_urls, p.title, p.beds, p.bedrooms FROM 
      property_listing_details p INNER JOIN visited_properties v ON p.property_id = v.property_id WHERE v.user_id = $1`;

    const result = await pool.query(query, [userId]);

    console.log(result.rows[0]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "No Visited properties found" });
    }

    const visitedPropertiesData = await Promise.all(
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
    res.status(200).json({ data: visitedPropertiesData });
  } catch (error) {
    res.status(500).json({ message: "Internal Server error" });
    throw new Error("Something went wrong", error.message);
  }
});

export default router;
