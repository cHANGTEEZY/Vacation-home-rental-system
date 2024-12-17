import express from "express";
import { pool } from "../db.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

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

router.post("/", async (req, res) => {
  const { startDate, endDate, regionName, totalGuest } = req.body;
  console.log(startDate, endDate, regionName, totalGuest);
  try {
    const query =
      "SELECT * from property_listing_details WHERE property_region=$1 AND guests>=$2";

    const queryResult = await pool.query(query, [regionName, totalGuest]);
    if (queryResult.rows.length === 0)
      return res
        .status(401)
        .json({ message: "Couldn't find property with following constraints" });

    console.log(queryResult.rows);
  } catch (error) {
    res.status(500).json("INTERNAL SERVER ERROR", error);
    console.log(error);
  }
});

export default router;
