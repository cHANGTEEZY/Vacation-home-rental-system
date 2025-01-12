import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middlewares/authorization.js";

const router = express.Router();

// GET: Fetch user preferences
router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.userId.id;

        const result = await pool.query(
            `SELECT 
                prefered_property_type, 
                prefered_property_region, 
                prefered_price 
            FROM preferences 
            WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length > 0) {
            const preferences = result.rows[0];
            res.status(200).json({
                propertyType: preferences.prefered_property_type,
                propertyRegion: preferences.prefered_property_region,
                price: preferences.prefered_price,
            });
        } else {
            res.status(404).json({ message: "Preferences not set" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.userId.id;
        const { prefered_property_type, prefered_property_region, prefered_price } = req.body;

        if (!prefered_property_type || !prefered_property_region || !prefered_price) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const result = await pool.query(
            `INSERT INTO preferences 
             (user_id, prefered_property_type, prefered_property_region, prefered_price) 
             VALUES ($1, $2, $3, $4)`,
            [userId, prefered_property_type, prefered_property_region, prefered_price]
        );

        res.status(201).json({ message: "Preferences created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// PUT: Update user preferences
router.put("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.userId.id;
        const { prefered_property_type, prefered_property_region, prefered_price } = req.body;

        if (!prefered_property_type || !prefered_property_region || !prefered_price) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const result = await pool.query(
            `UPDATE preferences 
             SET 
                 prefered_property_type = $1, 
                 prefered_property_region = $2, 
                 prefered_price = $3 
             WHERE user_id = $4`,
            [prefered_property_type, prefered_property_region, prefered_price, userId]
        );

        if (result.rowCount > 0) {
            res.status(200).json({ message: "Preferences updated successfully" });
        } else {
            res.status(404).json({ message: "Preferences not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
