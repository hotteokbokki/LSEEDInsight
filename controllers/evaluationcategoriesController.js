const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getPerformanceOverviewBySEID = async (se_id) => {
    try {
        const query = `
            SELECT 
                ec.category_name AS category,
                ROUND(AVG(ec.rating), 2) AS score
            FROM evaluation_categories ec
            JOIN evaluations e ON ec.evaluation_id = e.evaluation_id
            WHERE e.se_id = $1  -- Pass the selected SE ID
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

exports.getEvaluationScoreDistribution = async () => {
    try {
        const query = `
            SELECT 
                ec.category_name, 
                ec.rating, 
                e.se_id, 
                se.team_name -- Fetch SE name instead of just the ID
            FROM evaluation_categories ec
            JOIN evaluations e ON ec.evaluation_id = e.evaluation_id
            JOIN socialenterprises se ON e.se_id = se.se_id; -- Join with social enterprises table
        `;
        const result = await pgDatabase.query(query);

        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};