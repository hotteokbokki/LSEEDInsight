const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getPerformanceOverviewBySEID = async (se_id) => {
    try {
        const query = `
            SELECT 
                ec.category_name AS category,
                ROUND(AVG(ec.rating), 2) AS score
            FROM evaluation_categories ec
            JOIN evaluations e ON ec.evaluation_id = e.evaluation_id
            WHERE e.se_id = $1 AND e.evaluation_type = 'Social Enterprise'
            GROUP BY ec.category_name
            ORDER BY category;
        `;
        const values = [se_id];

        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.compareSocialEnterprisesPerformance = async (se1, se2) => {
    try {
      const query = `
            SELECT 
                s.se_id,
                s.team_name AS social_enterprise, -- Use full name instead of abbreviation
                s.abbr,
                ec.category_name,
                ROUND(AVG(ec.rating), 2) AS avg_rating
            FROM evaluation_categories ec
            JOIN evaluations e ON ec.evaluation_id = e.evaluation_id
            JOIN socialenterprises s ON e.se_id = s.se_id
            WHERE e.se_id IN ($1, $2)
            AND e.evaluation_type = 'Social Enterprise'
            GROUP BY s.se_id, ec.category_name, s.team_name
            ORDER BY ec.category_name;
      `;
  
      const result = await pgDatabase.query(query, [se1, se2]); // Pass SE IDs dynamically
  
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching SE performance comparison:", error);
      return [];
    }
};

exports.getMentorAvgRating = async (mentor_id) => {
    try {
        const query = `
            SELECT 
                e.mentor_id, 
                ROUND(AVG(ec.rating), 2) AS avg_rating
            FROM evaluation_categories ec
            JOIN evaluations e ON ec.evaluation_id = e.evaluation_id
            WHERE e.mentor_id = $1 
            AND e.evaluation_type = 'Mentors'
            GROUP BY e.mentor_id;
        `;

        const result = await pgDatabase.query(query, [mentor_id]); // Correctly passing mentor_id as a parameter

        return result.rows[0]?.avg_rating || 0; // Return the average rating or 0 if no data found
    } catch (error) {
        console.error("❌ Error fetching mentor average rating:", error);
        return 0; // Return 0 in case of an error
    }
};

exports.getMentorFrequentRating = async (mentor_id) => {
    try {
        const query = `
            WITH RatingFrequency AS (
                SELECT 
                    e.mentor_id, 
                    ec.rating, 
                    COUNT(*) AS rating_count
                FROM evaluation_categories ec
                JOIN evaluations e ON ec.evaluation_id = e.evaluation_id
                WHERE e.evaluation_type = 'Mentors' AND e.mentor_id = $1
                GROUP BY e.mentor_id, ec.rating
            ),
            RankedRatings AS (
                SELECT 
                    mentor_id, 
                    rating, 
                    rating_count,
                    RANK() OVER (PARTITION BY mentor_id ORDER BY rating_count DESC, rating DESC) AS rank
                FROM RatingFrequency
            )
            SELECT mentor_id, rating AS most_frequent_rating
            FROM RankedRatings
            WHERE rank = 1;
        `;

        const result = await pgDatabase.query(query, [mentor_id]); // Correctly passing mentor_id as a parameter

        return result.rows[0]?.most_frequent_rating || 0; // Return the most frequent rating or 0 if no data found
    } catch (error) {
        console.error("❌ Error fetching mentor frequent rating:", error);
        return 0; // Return 0 in case of an error
    }
};

exports.getAvgRatingForMentor = async (mentor_id) => {
    try {
        const query = `
            SELECT 
                ec.category_name, 
                ROUND(AVG(ec.rating), 2) AS avg_rating
            FROM evaluation_categories ec
            JOIN evaluations e ON ec.evaluation_id = e.evaluation_id
            WHERE e.evaluation_type = 'Mentors' AND e.mentor_id = $1
            GROUP BY ec.category_name
            ORDER BY avg_rating DESC;
        `;

        const result = await pgDatabase.query(query, [mentor_id]); // ✅ Parameterized query

        return result.rows; // ✅ Returns array of { category_name, avg_rating }
    } catch (error) {
        console.error("❌ Error fetching mentor avg rating per category:", error);
        return []; // ✅ Returns empty array on failure
    }
};

exports.getPerformanceOverviewForMentor = async (mentor_id) => {
    try {
        const query = `
            (
                SELECT 
                    ec.category_name AS category, 
                    ROUND(AVG(ec.rating), 2) AS score
                FROM evaluation_categories ec
                JOIN evaluations e ON ec.evaluation_id = e.evaluation_id
                WHERE e.evaluation_type = 'Mentors' 
                AND e.mentor_id = $1
                GROUP BY ec.category_name
                ORDER BY score DESC
                LIMIT 3
            )
            UNION ALL
            (
                SELECT 
                    ec.category_name AS category, 
                    ROUND(AVG(ec.rating), 2) AS score
                FROM evaluation_categories ec
                JOIN evaluations e ON ec.evaluation_id = e.evaluation_id 
                WHERE e.evaluation_type = 'Mentors' 
                AND e.mentor_id = $1
                GROUP BY ec.category_name
                ORDER BY score ASC
                LIMIT 3
            )
        `;

        const result = await pgDatabase.query(query, [mentor_id]); // ✅ Parameterized query

        return result.rows; // ✅ Returns array of { category_name, avg_rating }
    } catch (error) {
        console.error("❌ Error fetching mentor avg rating per category:", error);
        return []; // ✅ Returns empty array on failure
    }
};