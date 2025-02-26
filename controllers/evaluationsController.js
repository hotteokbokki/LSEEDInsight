const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getEvaluationsByMentorID = async (mentor_id) => {
    try {
        console.log(`Fetching evaluations for mentor ID: ${mentor_id}`);

        const query = `
            SELECT 
                e.evaluation_id,
                m.mentor_firstname || ' ' || m.mentor_lastname AS evaluator_name,
                se.team_name AS social_enterprise,
                e.created_at AS evaluation_date,
                e."isAcknowledge" AS acknowledged
            FROM 
                evaluations AS e
            JOIN 
                mentors AS m ON e.mentor_id = m.mentor_id
            JOIN 
                socialenterprises AS se ON e.se_id = se.se_id
            WHERE	
                e.mentor_id = $1;
        `;

        const values = [mentor_id];
        const result = await pgDatabase.query(query, values);

        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
        return [];
    }
};

exports.getEvaluationDetails = async (evaluation_id) => {
    try {
        console.log(`Fetching evaluation details for Evaluation ID: ${evaluation_id}`);

        const query = `
            SELECT 
                e.evaluation_id,
                e.created_at AS evaluation_date,
                se.team_name AS social_enterprise,
                ec.category_name,
                ec.rating AS star_rating,
                ec.additional_comment,
                COALESCE(
                    JSON_AGG(DISTINCT esc.comment) FILTER (WHERE esc.comment IS NOT NULL), 
                    '[]'
                ) AS selected_comments
            FROM evaluations e
            JOIN socialenterprises se ON e.se_id = se.se_id
            LEFT JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
            LEFT JOIN evaluation_selected_comments esc ON ec.evaluation_category_id = esc.evaluation_category_id
            WHERE e.evaluation_id = $1
            GROUP BY e.evaluation_id, e.created_at, se.team_name, ec.category_name, ec.rating, ec.additional_comment;
        `;

        const values = [evaluation_id];
        const result = await pgDatabase.query(query, values);

        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching evaluation details:", error);
        return [];
    }
};

exports.getTopSEPerformance = async () => {
    try {
        console.log("Fetching top SE performance for the last 3 months");

        const query = `
                WITH MonthlyRatings AS (
                SELECT 
                    e.se_id,
                    s.abbr AS social_enterprise, -- Use abbreviation instead of full name
                    DATE_TRUNC('month', e.created_at) AS month,
                    ROUND(AVG(ec.rating), 2) AS avg_rating
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                JOIN socialenterprises s ON e.se_id = s.se_id
                WHERE e.created_at >= (CURRENT_DATE - INTERVAL '3 months')
                GROUP BY e.se_id, s.abbr, month
                ),
                TopSEs AS (
                    SELECT se_id, social_enterprise, AVG(avg_rating) AS overall_avg_rating
                    FROM MonthlyRatings
                    GROUP BY se_id, social_enterprise
                    ORDER BY overall_avg_rating DESC
                    LIMIT 3
                )
                SELECT m.se_id, m.social_enterprise, m.month, m.avg_rating
                FROM MonthlyRatings m
                JOIN TopSEs t ON m.se_id = t.se_id
                ORDER BY m.social_enterprise, m.month;
        `;

        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getPerformanceTrendBySEID = async (se_id) => {
    try {
        console.log("Fetching top SE performance for the last 3 months");

        const query = `
            WITH MonthlyRatings AS (
                SELECT 
                    e.se_id,
                    s.abbr AS social_enterprise, -- Use abbreviation instead of full name
                    DATE_TRUNC('month', e.created_at) AS month,
                    ROUND(AVG(ec.rating), 2) AS avg_rating
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                JOIN socialenterprises s ON e.se_id = s.se_id
                WHERE e.created_at >= (CURRENT_DATE - INTERVAL '3 months') 
                AND e.se_id = $1  -- Filter by specific SE ID
                GROUP BY e.se_id, s.abbr, month
            )
            SELECT se_id, social_enterprise, month, avg_rating
            FROM MonthlyRatings
            ORDER BY month;
        `;
        const values = [se_id];

        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};
