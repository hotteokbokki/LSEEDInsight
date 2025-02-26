const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getPerformanceOverviewBySEID = async (se_id) => {
    try {
        console.log("Fetching top SE performance for the last 3 months");

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
