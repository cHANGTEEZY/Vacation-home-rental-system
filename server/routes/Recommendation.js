import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middlewares/authorization.js';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const router = express.Router();

// Constants
const SCORE_WEIGHTS = {
    PRICE: 0.5,
    REGION: 0.25,
    TYPE: 0.25,
    PRICE_THRESHOLD: 1000,
    MAX_RECOMMENDATIONS: 20,
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

const checkPropertyAvailability = async (propertyId, startDate, endDate) => {
    const query = `
        SELECT COUNT(*) as booking_count
        FROM bookings
        WHERE property_id = $1
        AND booking_status != 'cancelled'
        AND (
            (booking_start_date <= $2 AND booking_end_date >= $2)
            OR (booking_start_date <= $3 AND booking_end_date >= $3)
            OR (booking_start_date >= $2 AND booking_end_date <= $3)
        )`;
    
    try {
        const { rows } = await pool.query(query, [propertyId, startDate, endDate]);
        return rows[0].booking_count === 0;
    } catch (error) {
        console.error('Error checking property availability:', error);
        return false;
    }
};

const getPropertyAvailableDates = async (propertyId, daysAhead = 30) => {
    const query = `
        WITH RECURSIVE dates AS (
            SELECT 
                CURRENT_DATE as date
            UNION ALL
            SELECT 
                date + 1
            FROM dates
            WHERE date < CURRENT_DATE + interval '${daysAhead} days'
        ),
        booked_dates AS (
            SELECT 
                generate_series(booking_start_date, booking_end_date, '1 day'::interval)::date as booked_date
            FROM bookings
            WHERE property_id = $1
            AND booking_status NOT IN ('cancelled', 'rejected')
            AND booking_start_date >= CURRENT_DATE
            AND booking_start_date <= CURRENT_DATE + interval '${daysAhead} days'
        )
        SELECT 
            d.date as available_date
        FROM dates d
        LEFT JOIN booked_dates b ON d.date = b.booked_date
        WHERE b.booked_date IS NULL
        ORDER BY d.date
        LIMIT ${daysAhead}`;

    try {
        const { rows } = await pool.query(query, [propertyId]);
        return rows.map(row => row.available_date);
    } catch (error) {
        console.error('Error getting property available dates:', error);
        return [];
    }
};

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

const getCollaborativeScore = async (userId, propertyId, pool) => {
    const query = `
        WITH user_ratings AS (
            -- Get current user's avg rating
            SELECT AVG(rating) as user_avg
            FROM reviews
            WHERE user_id = $1
        ),
        similar_users AS (
            -- Find users with similar rating patterns
            SELECT 
                r2.user_id,
                CORR(r1.rating, r2.rating) as similarity -- Pearson correlation
            FROM reviews r1
            JOIN reviews r2 ON r1.property_id = r2.property_id 
            WHERE r1.user_id = $1 AND r2.user_id != $1
            GROUP BY r2.user_id
            HAVING COUNT(*) >= 3  -- Minimum common properties rated
            AND CORR(r1.rating, r2.rating) >= $2 -- Similarity threshold
        ),
        property_ratings AS (
            -- Get weighted average rating for the target property
            SELECT 
                r.property_id,
                SUM(r.rating * s.similarity) / SUM(s.similarity) as weighted_rating
            FROM reviews r
            JOIN similar_users s ON r.user_id = s.user_id
            WHERE r.property_id = $3
            GROUP BY r.property_id
        )
        SELECT 
            COALESCE(pr.weighted_rating, 
                    (SELECT AVG(rating) FROM reviews WHERE property_id = $3)
            ) as final_score
        FROM property_ratings pr
        RIGHT JOIN user_ratings ur ON true
    `;

    try {
        const { rows } = await pool.query(query, [
            userId, 
            SCORE_WEIGHTS.SIMILAR_USERS_THRESHOLD,
            propertyId
        ]);
        return rows[0]?.final_score || 0;
    } catch (error) {
        console.error('Error calculating collaborative score:', error);
        return 0;
    }
};


const calculateHybridScore = (property, preferences, userHistory, similarUserRatings = 0) => {
    if (!property || !preferences) return 0;

    // Validate inputs
    const price = Number(property.price) || 0;
    const prefPrice = Number(preferences.prefered_price) || 0;
    const userHistoryWeight = Math.max(0, Math.min(userHistory, 100)) / 100;

    // Content-based score components (0-1)
    const priceScore = Math.max(0, 1 - Math.abs(price - prefPrice) / SCORE_WEIGHTS.PRICE_THRESHOLD);
    const regionScore = property.property_region === preferences.prefered_property_region ? 1 : 0;
    const typeScore = property.property_type === preferences.prefered_property_type ? 1 : 0;
    
    // Combined content score
    const contentScore = (
        priceScore * SCORE_WEIGHTS.PRICE + 
        regionScore * SCORE_WEIGHTS.REGION + 
        typeScore * SCORE_WEIGHTS.TYPE
    );
    console.log(contentScore);
    
    // Collaborative score (0-1) based on average review rating
    // const collabScore = Math.min(Math.max((similarUserRatings || property.average_review_rating || 0) / 5, 0), 1);
    
    // Final weighted score
    const contentWeight = 1 - userHistoryWeight;
    return Number((contentScore * contentWeight  /* + collabScore * userHistoryWeight*/).toFixed(2));
};

router.post('/recommendations', authenticateToken, async (req, res) => {
    const userId = req.userId.id;
    const {checkIn,checkOut} = req.body;

    try {
        // Fetch user preferences
        const preferencesQuery = `
            SELECT 
                prefered_property_type, 
                prefered_property_region, 
                prefered_price 
            FROM preferences 
            WHERE user_id = $1`;
        const { rows: preferencesRows } = await pool.query(preferencesQuery, [userId]);
        
        if (!preferencesRows.length) {
            return res.status(404).json({ 
                error: 'No preferences found for user',
                message: 'Please set your preferences before requesting recommendations'
            });
        }
        const preferences = preferencesRows[0];

        // Fetch similar users' ratings with improved query
        // const similarUsersQuery = `
        //     WITH similar_preferences AS (
        //         SELECT DISTINCT property_id, averate_review_rating
        //         FROM property_listing_details pld
        //         JOIN preferences p ON p.user_id != $1
        //         WHERE 
        //             p.prefered_property_type = $2 
        //             OR p.prefered_property_region = $3
        //             OR ABS(p.prefered_price - $4) < $5
        //     )
        //     SELECT * FROM similar_preferences
        //     LIMIT 1000`;  // Reasonable limit for similar properties
        
        // const { rows: similarProperties } = await pool.query(
        //     similarUsersQuery, 
        //     [
        //         userId, 
        //         preferences.prefered_property_type, 
        //         preferences.prefered_property_region, 
        //         preferences.prefered_price,
        //         SCORE_WEIGHTS.PRICE_THRESHOLD
        //     ]
        // );
        
        // const similarPropertyRatings = new Map(
        //     similarProperties.map(prop => [prop.property_id, prop.average_review_rating])
        // );

        // Fetch properties with improved query
        // const propertiesQuery = `
        //     SELECT 
        //         p.property_id,
        //         p.property_type,
        //         p.title,
        //         p.property_region,
        //         p.price,
        //         p.guests,
        //         p.bedrooms,
        //         p.beds,
        //         p.bathrooms,
        //         p.kitchens,
        //         p.swimming_pool,
        //         p.amenities,
        //         p.image_urls,
        //         p.averate_review_rating
        //     FROM property_listing_details p
        //     LEFT JOIN (
        //         SELECT property_id 
        //         FROM property_listing_details 
        //         WHERE user_id = $1
        //     ) owned ON p.property_id = owned.property_id
        //     WHERE owned.property_id IS NULL
        //     LIMIT $2`;
        const propertiesQuery = `
        WITH user_viewed AS (
            SELECT DISTINCT property_id
            FROM reviews
            WHERE user_id = $1
        ),
        unavailable_properties AS (
            SELECT DISTINCT property_id
            FROM bookings
            WHERE booking_status NOT IN ('cancelled', 'rejected')
            AND ($2::date IS NULL OR $3::date IS NULL OR (
                (booking_start_date <= $2 AND booking_end_date >= $2)
                OR (booking_start_date <= $3 AND booking_end_date >= $3)
                OR (booking_start_date >= $2 AND booking_end_date <= $3)
            ))
        )
        SELECT 
            p.*,
            COALESCE(
                (SELECT AVG(rating) FROM reviews WHERE property_id = p.property_id),
                0
            ) as average_rating,
            COUNT(DISTINCT r.user_id) as review_count,
            COALESCE(
                (SELECT MIN(booking_start_date) 
                 FROM bookings 
                 WHERE property_id = p.property_id 
                 AND booking_start_date >= CURRENT_DATE
                 AND booking_status NOT IN ('cancelled', 'rejected')
                ),
                NULL
            ) as next_booking_date
        FROM property_listing_details p
        LEFT JOIN reviews r ON p.property_id = r.property_id
        WHERE p.property_id NOT IN (SELECT property_id FROM user_viewed)
        AND p.property_id NOT IN (SELECT property_id FROM unavailable_properties)
        GROUP BY p.property_id
        LIMIT $4`;
        
        const { rows: properties } = await pool.query(propertiesQuery, [userId,checkIn,checkOut, SCORE_WEIGHTS.MAX_RECOMMENDATIONS *2]);

        // Calculate hybrid scores with batch image processing
        const recommendedProperties = await Promise.all(
            properties.map(async (prop) => {
                const[collabScore, signedImageUrls, availableDates] = await Promise.all([
                    getCollaborativeScore(userId, prop.property_id, pool),
                //aggregated signed urls to 5 so that performance is not affected due to contacting aws s3
               generateSignedUrls((prop.image_urls || []).slice(0, 5)),
               getPropertyAvailableDates(prop.property_id)
                ])
                if (availableDates.length < SCORE_WEIGHTS.MIN_AVAILABLE_DAYS) {
                    return null;
                }

                return {
                    ...prop,
                    image_urls: signedImageUrls,
                    available_dates: availableDates,
                    next_available_date: availableDates[0],
                    next_booking_date: prop.next_booking_date,
                    hybridScore: calculateHybridScore(
                        prop,
                        preferences,
                        prop.review_count / 10, // User history weight based on review count
                        collabScore
                    )
                };
            })
        );
        // Sort and limit results
        const sortedRecommendations = recommendedProperties
            .sort((a, b) => b.hybridScore - a.hybridScore)
            .slice(0, SCORE_WEIGHTS.MAX_RECOMMENDATIONS);

        res.json({ 
            recommendedProperties: sortedRecommendations,
            meta: {
                total: sortedRecommendations.length,
                generatedAt: new Date().toISOString(),
                dateRange:checkIn && checkOut ? [checkIn,checkOut] : null
            }
           
        });
    } catch (error) {
        console.error('Error in recommendations:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Unable to generate recommendations at this time'
        });
    }
});

export default router;