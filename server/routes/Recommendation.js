import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middlewares/authorization.js';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const router = express.Router();

// Constants
const SCORE_WEIGHTS = {
    PRICE: 0.4,
    REGION: 0.3,
    TYPE: 0.3,
    PRICE_THRESHOLD: 10000,
    MAX_RECOMMENDATIONS: 10,
    URL_EXPIRY: 3600,
    SIMILAR_USERS_THRESHOLD: 0.3  // Similarity threshold
};

// AWS setup with validation
const validateAwsConfig = () => {
    const required = ['BUCKET_NAME', 'BUCKET_REGION', 'ACCESS_KEY', 'SECRET_ACCESS_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length) {
        throw new Error(`Missing required AWS configs: ${missing.join(', ')}`);
    }
    
    return {
        bucketName: process.env.BUCKET_NAME,
        bucketRegion: process.env.BUCKET_REGION,
        accessKey: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    };
};

const initializeS3Client = () => {
    const config = validateAwsConfig();
    return new S3Client({
        credentials: {
            accessKeyId: config.accessKey,
            secretAccessKey: config.secretAccessKey,
        },
        region: config.bucketRegion
    });
};

const s3 = initializeS3Client();

const generateSignedUrls = async (imageUrls) => {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) return [];
    
    try {
        return await Promise.all(
            imageUrls.map(async (imageKey) => {
                const params = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: imageKey,
                };
                const command = new GetObjectCommand(params);
                return getSignedUrl(s3, command, { expiresIn: SCORE_WEIGHTS.URL_EXPIRY });
            })
        );
    } catch (error) {
        console.error('Error generating signed URLs:', error);
        return [];
    }
};


const getUserPreferences = async (userId) => {
    const query = `
        SELECT 
            prefered_property_type, 
            prefered_property_region, 
            prefered_price 
        FROM preferences 
        WHERE user_id = $1`;
    
    const { rows } = await pool.query(query, [userId]);
    return rows[0];
};

// 2. Get User History Weight
const getUserHistoryWeight = async (userId) => {
    const query = `
        SELECT COUNT(*) as review_count
        FROM reviews
        WHERE user_id = $1`;
    
    const { rows } = await pool.query(query, [userId]);
    const reviewCount = parseInt(rows[0]?.review_count || 0, 10);

    // Use logarithmic scaling to avoid flat scaling for high counts
    const weight = reviewCount > 0 ? Math.log10(reviewCount + 1) / 2 : 0;
    return Math.min(weight, 1); // Ensure weight does not exceed 1

};

// 3. Get Unviewed Properties
const getUnviewedProperties = async (userId, limit) => {
    const query = `
        SELECT p.*,
            COALESCE(
                (SELECT AVG(rating) FROM reviews WHERE property_id = p.property_id),
                0
            ) as average_rating
        FROM property_listing_details p
        WHERE p.property_id NOT IN (
            SELECT DISTINCT property_id
            FROM reviews
            WHERE user_id = $1
        )
        AND p.property_id NOT IN(
            SELECT DISTINCT property_id
            FROM bookings
            WHERE booking_status = 'Booked'
            AND booking_end_date >= CURRENT_DATE
            )
        LIMIT $2`;
    
    const { rows } = await pool.query(query, [userId, limit]);
    return rows;
};

// 4. Get Collaborative Score
const getCollaborativeScore = async (userId, propertyId) => {
    // Get similar users based on rating patterns
    const similarUsersQuery = `
        SELECT r2.user_id, CORR(r1.rating, r2.rating) as similarity
        FROM reviews r1
        JOIN reviews r2 ON r1.property_id = r2.property_id
        WHERE r1.user_id = $1 AND r2.user_id != $1
        GROUP BY r2.user_id
        HAVING COUNT(*) >= 3 
        AND CORR(r1.rating, r2.rating) >= $2`;
    
    const { rows: similarUsers } = await pool.query(similarUsersQuery, [
        userId, 
        SCORE_WEIGHTS.SIMILAR_USERS_THRESHOLD
    ]);
    
    if (similarUsers.length === 0) {
        // If no similar users, return average property rating
        const avgRatingQuery = `
            SELECT AVG(rating) as avg_rating
            FROM reviews
            WHERE property_id = $1`;
        const { rows } = await pool.query(avgRatingQuery, [propertyId]);
        return rows[0]?.avg_rating || 0;
    }
    
    // Calculate weighted rating based on similar users
    const weightedRatingQuery = `
        WITH similarity_weights AS (
            SELECT 
                unnest($1::float[]) as weight,
                unnest($3::int[]) as user_id
        )
        SELECT 
            SUM(r.rating * sw.weight) / SUM(sw.weight) as weighted_rating
        FROM reviews r
        JOIN similarity_weights sw ON r.user_id = sw.user_id
        WHERE r.property_id = $2`;
    
    const similarities = similarUsers.map(u => u.similarity);
    const userIds = similarUsers.map(u => u.user_id);
    const { rows } = await pool.query(weightedRatingQuery, [
        similarities,
        propertyId,
        userIds
    ]);
    
    return rows[0]?.weighted_rating || 0;
};

// 5. Calculate Content Score
const calculateContentScore = (property, preferences) => {
    if (!property || !preferences) return 0;

    const price = Number(property.price) || 0;
    const prefPrice = Number(preferences.prefered_price) || 0;
    const priceScore = Math.max(0, 1 - Math.abs(price - prefPrice) / SCORE_WEIGHTS.PRICE_THRESHOLD);
    const regionScore = property.property_region === preferences.prefered_property_region ? 1 : 0;
    const typeScore = property.property_type === preferences.prefered_property_type ? 1 : 0;

    // console.log(priceScore, regionScore, typeScore);
    const weightedScore= (
        priceScore * SCORE_WEIGHTS.PRICE + 
        regionScore * SCORE_WEIGHTS.REGION + 
        typeScore * SCORE_WEIGHTS.TYPE
    )
    return Number(weightedScore.toFixed(2));
};

// 6. Calculate Hybrid Score
const calculateHybridScore = (contentScore, collaborativeScore, userHistoryWeight) => {
    const normalizedCollabScore = Number(collaborativeScore) / 5 || 0;
    const normalizedContentScore = Number(contentScore);
    
    const adjustedHistoryWeight = Math.max(userHistoryWeight,0.2);
    const contentWeight = Math.max(0, Math.min(1, 1 - adjustedHistoryWeight));
    console.log(`User History Weight: ${userHistoryWeight}, Content Weight: ${contentWeight}`);

    return Number(
        (normalizedContentScore * contentWeight + normalizedCollabScore * adjustedHistoryWeight).toFixed(2)
    );
};

// Main recommendation endpoint
router.post('/recommendations', authenticateToken, async (req, res) => {
    const userId = req.userId.id;

    try {
        // 1. Get user preferences and history weight
        const [preferences, userHistoryWeight] = await Promise.all([
            getUserPreferences(userId),
            getUserHistoryWeight(userId)
        ]);

        if (!preferences) {
            return res.status(404).json({ 
                error: 'No preferences found',
                message: 'Please set your preferences first'
            });
        }

        // 2. Get unviewed properties
        const properties = await getUnviewedProperties(userId, SCORE_WEIGHTS.MAX_RECOMMENDATIONS);

        // 3. Calculate scores and get signed URLs for each property
        const recommendedProperties = await Promise.all(
            properties.map(async (property) => {
                const [collaborativeScore, signedImageUrls] = await Promise.all([
                    getCollaborativeScore(userId, property.property_id),
                    generateSignedUrls((property.image_urls || []).slice(0, 5))
                ]);

                const contentScore = calculateContentScore(property, preferences);
                const hybridScore = calculateHybridScore(
                    contentScore,
                    collaborativeScore,
                    userHistoryWeight
                );

                return {
                    ...property,
                    image_urls: signedImageUrls,
                    content_score: contentScore,
                    collaborative_score: collaborativeScore,
                    hybrid_score: hybridScore
                };
            })
        );

        // 4. Sort by hybrid score and return results
        const sortedRecommendations = recommendedProperties
            .sort((a, b) => b.hybrid_score - a.hybrid_score)
            .slice(0, SCORE_WEIGHTS.MAX_RECOMMENDATIONS);

        res.json({
            recommendedProperties: sortedRecommendations,
            meta: {
                total: sortedRecommendations.length,
                userHistoryWeight,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error in recommendations:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Unable to generate recommendations'
        });
    }
});

export default router;