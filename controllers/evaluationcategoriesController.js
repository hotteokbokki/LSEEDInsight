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