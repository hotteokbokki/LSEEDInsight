const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getEvaluationsByMentorID = async (mentor_id) => {
    try {
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
                e.mentor_id = $1 AND
				evaluation_type = 'Social Enterprise';
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
            WHERE e.evaluation_id = $1 AND e.evaluation_type = 'Social Enterprise'
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
        const query = `
            WITH MonthlyRatings AS (
                SELECT 
                    e.se_id,
                    s.abbr AS social_enterprise, -- Use abbreviation instead of full name
                    DATE_TRUNC('month', e.created_at) AS month,
                    ROUND(AVG(ec.rating), 2) AS avg_rating,
                    COUNT(*) AS eval_count -- Count number of evaluations per SE per month
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                JOIN socialenterprises s ON e.se_id = s.se_id
                WHERE e.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months') AND e.evaluation_type = 'Social Enterprise'
                GROUP BY e.se_id, s.abbr, month
            ),
            TopSEs AS (
                SELECT se_id, social_enterprise, 
                    SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                FROM MonthlyRatings
                GROUP BY se_id, social_enterprise
                ORDER BY weighted_avg_rating DESC
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

exports.getTopSEPerformanceByMentorships = async (mentor_id) => {
    try {

        const query = `
            WITH MonthlyRatings AS (
                SELECT 
                    e.se_id,
                    s.abbr AS social_enterprise, -- Use abbreviation instead of full name
                    DATE_TRUNC('month', e.created_at) AS month,
                    ROUND(AVG(ec.rating), 2) AS avg_rating,
                    COUNT(*) AS eval_count -- Count number of evaluations per SE per month
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                JOIN socialenterprises s ON e.se_id = s.se_id
                JOIN mentorships m ON e.se_id = m.se_id -- Join with mentorships table
                WHERE 
                    e.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months') 
                    AND e.evaluation_type = 'Social Enterprise'
                    AND m.mentor_id = $1 -- Filter by the specific mentor's ID
                GROUP BY e.se_id, s.abbr, month
            ),
            TopSEs AS (
                SELECT 
                    se_id, 
                    social_enterprise, 
                    SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                FROM MonthlyRatings
                GROUP BY se_id, social_enterprise
                ORDER BY weighted_avg_rating DESC
                LIMIT 3 -- Get the top 3 SEs
            )
            SELECT 
                m.se_id, 
                m.social_enterprise, 
                m.month, 
                m.avg_rating
            FROM MonthlyRatings m
            JOIN TopSEs t ON m.se_id = t.se_id
            ORDER BY m.social_enterprise, m.month;
        `;
        const values = [mentor_id];

        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getPerformanceTrendBySEID = async (se_id) => {
    try {
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
                WHERE e.created_at >= (CURRENT_DATE - INTERVAL '3 months') AND e.evaluation_type = 'Social Enterprise'
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

exports.getCommonChallengesBySEID = async (se_id) => {
    try {
        const query = `
            WITH top_comments AS (
                SELECT 
                    esc.comment, 
                    ec.category_name AS category,
                    COUNT(esc.selected_comment_id) AS count
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                JOIN evaluation_selected_comments esc ON ec.evaluation_category_id = esc.evaluation_category_id
                WHERE e.se_id = $1 AND e.evaluation_type = 'Social Enterprise'
                AND ec.rating <= 3  
                GROUP BY esc.comment, ec.category_name
                ORDER BY count DESC
                LIMIT 5
            ),
            total_top AS (
                SELECT SUM(count) AS top_total FROM top_comments
            )
            SELECT 
                tc.comment, 
                tc.category, 
                tc.count,
                ROUND(tc.count * 100.0 / tt.top_total, 0) AS percentage
            FROM top_comments tc
            CROSS JOIN total_top tt
            ORDER BY tc.count DESC;
        `;
        const values = [se_id];

        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getAllSECommonChallenges = async () => {
    try {
        const query = `
            WITH top_comments AS (
                SELECT 
                    esc.comment, 
                    ec.category_name AS category,
                    COUNT(esc.selected_comment_id) AS count
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                JOIN evaluation_selected_comments esc ON ec.evaluation_category_id = esc.evaluation_category_id
                WHERE ec.rating <= 3 AND e.evaluation_type = 'Social Enterprise'
                GROUP BY esc.comment, ec.category_name
                ORDER BY count DESC
                LIMIT 5
            ),
            total_top AS (
                SELECT SUM(count) AS top_total FROM top_comments
            )
            SELECT 
                tc.comment, 
                tc.category, 
                tc.count,
                ROUND(tc.count * 100.0 / tt.top_total, 2) AS percentage
            FROM top_comments tc
            CROSS JOIN total_top tt
            ORDER BY tc.count DESC;
        `;
        const result = await pgDatabase.query(query);

        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getPermanceScoreBySEID = async (se_id) => {
    try {
        const query = `
            SELECT 
                e.se_id,
                ec.category_name,
                ec.rating,
                COUNT(ec.rating) AS rating_count
            FROM evaluations e
            JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
            WHERE e.se_id = $1 AND e.evaluation_type = 'Social Enterprise'
            GROUP BY e.se_id, ec.category_name, ec.rating
            ORDER BY ec.category_name, ec.rating;
        `;
        const values = [se_id];

        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getAverageScoreForAllSEPerCategory = async () => {
    try {
        const query = `
            SELECT 
                ec.category_name AS category,
                ROUND(AVG(ec.rating), 2) AS score
            FROM evaluations e
            JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
            WHERE e.evaluation_type = 'Social Enterprise'
            GROUP BY ec.category_name
            ORDER BY category;
        `;
        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};
//Line chart
exports.getImprovementScorePerMonthAnnually= async () => {
    try {
        const query = `
            WITH MonthlyRatings AS (
                SELECT 
                    e.se_id,
                    s.abbr AS social_enterprise, 
                    DATE_TRUNC('month', e.created_at) AS month,
                    ROUND(AVG(ec.rating), 2) AS avg_rating
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                JOIN socialenterprises s ON e.se_id = s.se_id
                WHERE DATE_PART('year', e.created_at) = DATE_PART('year', CURRENT_DATE) AND e.evaluation_type = 'Social Enterprise'
                GROUP BY e.se_id, s.abbr, month
            ),
            RankedRatings AS (
                SELECT 
                    se_id, 
                    social_enterprise, 
                    month, 
                    avg_rating,
                    LAG(avg_rating) OVER (PARTITION BY se_id ORDER BY month) AS prev_avg_rating
                FROM MonthlyRatings
            )
            SELECT 
                month,
                ROUND(AVG(avg_rating - prev_avg_rating), 2) AS overall_avg_improvement
            FROM RankedRatings
            WHERE prev_avg_rating IS NOT NULL -- Exclude the first month of evaluations
            GROUP BY month
            ORDER BY month;
        `;
        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};
//Stat box
exports.getImprovementScoreOverallAnnually= async () => {
    try {
        const query = `
            WITH MonthlyRatings AS (
                SELECT 
                    e.se_id,
                    s.abbr AS social_enterprise, 
                    DATE_TRUNC('month', e.created_at) AS month,
                    ROUND(AVG(ec.rating), 2) AS avg_rating
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                JOIN socialenterprises s ON e.se_id = s.se_id
                WHERE DATE_PART('year', e.created_at) = DATE_PART('year', CURRENT_DATE) AND e.evaluation_type = 'Social Enterprise'
                GROUP BY e.se_id, s.abbr, month
            ),
            RankedRatings AS (
                SELECT 
                    se_id, 
                    social_enterprise, 
                    month, 
                    avg_rating,
                    LAG(avg_rating) OVER (PARTITION BY se_id ORDER BY month) AS prev_avg_rating
                FROM MonthlyRatings
            )
            SELECT 
                ROUND(AVG(avg_rating - prev_avg_rating), 2) AS overall_avg_improvement
            FROM RankedRatings
            WHERE prev_avg_rating IS NOT NULL; -- Exclude the first month
        `;
        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};
/* TODO */
exports.getGrowthScoreOverallAnually= async () => {
    try {
        const query = `
            WITH MonthlyRatings AS (
                SELECT 
                    e.se_id,
                    DATE_TRUNC('month', e.created_at) AS month,
                    ROUND(AVG(ec.rating), 2) AS avg_rating
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                WHERE e.evaluation_type = 'Social Enterprise'
                GROUP BY e.se_id, month
            ),
            RankedRatings AS (
                SELECT 
                    se_id, 
                    month, 
                    avg_rating,
                    LAG(avg_rating) OVER (PARTITION BY se_id ORDER BY month) AS prev_avg_rating,
                    FIRST_VALUE(avg_rating) OVER (PARTITION BY se_id ORDER BY month) AS first_recorded_rating
                FROM MonthlyRatings
            ),
            Growth AS (
                SELECT 
                    se_id,
                    month,
                    avg_rating,
                    prev_avg_rating,
                    first_recorded_rating,
                    (avg_rating - prev_avg_rating) AS monthly_growth,
                    ((avg_rating - prev_avg_rating) / NULLIF(prev_avg_rating, 0)) * 100 AS monthly_growth_rate,
                    ((avg_rating / NULLIF(first_recorded_rating, 0)) - 1) * 100 AS cumulative_growth_percentage  -- ✅ Keep original name
                FROM RankedRatings
            )
            SELECT 
                g.se_id, 
                g.month, 
                s.abbr,  -- ✅ Fetch the abbreviation from socialenterprises
                ROUND(g.avg_rating, 2) AS current_avg_rating, 
                ROUND(COALESCE(g.prev_avg_rating, g.avg_rating), 2) AS previous_avg_rating, 
                ROUND(g.monthly_growth, 2) AS growth,
                ROUND(g.monthly_growth_rate, 2) AS growth_change_rate,
                ROUND(g.cumulative_growth_percentage, 2) AS cumulative_growth  -- ✅ Correct column name
            FROM Growth g
            JOIN socialenterprises s ON g.se_id = s.se_id 
            WHERE g.cumulative_growth_percentage IS NOT NULL
            ORDER BY g.cumulative_growth_percentage DESC  -- ✅ Correct column name
            LIMIT 1;  -- ✅ Return only 1 record
        `;
        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getMonthlyGrowthDetails= async () => {
    try {
        const query = `
            WITH MonthlyRatings AS (
          SELECT 
              e.se_id,
              DATE_TRUNC('month', e.created_at) AS month,
              ROUND(AVG(ec.rating), 2) AS avg_rating
          FROM evaluations e
          JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
          WHERE e.evaluation_type = 'Social Enterprise'
          GROUP BY e.se_id, month
      ),
      RankedRatings AS (
          SELECT 
              se_id, 
              month, 
              avg_rating,
              LAG(avg_rating) OVER (PARTITION BY se_id ORDER BY month) AS prev_avg_rating
          FROM MonthlyRatings
      ),
      Growth AS (
          SELECT 
              se_id,
              month,
              avg_rating,
              prev_avg_rating,
              (avg_rating - prev_avg_rating) AS monthly_growth
          FROM RankedRatings
          WHERE prev_avg_rating IS NOT NULL
      ),
      FinalGrowth AS (
          SELECT 
              se_id, 
              month, 
              avg_rating, 
              prev_avg_rating, 
              monthly_growth,
              LAG(monthly_growth) OVER (PARTITION BY se_id ORDER BY month) AS prev_monthly_growth
          FROM Growth
      )
      SELECT 
          month, 
          ROUND(avg_rating, 2) AS current_avg_rating, 
          ROUND(prev_avg_rating, 2) AS previous_avg_rating, 
          ROUND(monthly_growth, 2) AS growth,
          ROUND(
              CASE 
                  WHEN prev_monthly_growth = 0 OR prev_monthly_growth IS NULL THEN 0 
                  ELSE ((monthly_growth - prev_monthly_growth) / prev_monthly_growth) * 100 
              END, 2
          ) AS growth_change_rate
      FROM FinalGrowth
      ORDER BY month;
        `;
        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};
// Commit
exports.getSELeaderboards= async () => {
    try {
        const query = `
            WITH MonthlyRatings AS (
                SELECT 
                    e.se_id,
                    s.abbr AS social_enterprise, -- Use abbreviation instead of full name
                    DATE_TRUNC('month', e.created_at) AS month,
                    ROUND(AVG(ec.rating), 2) AS avg_rating,
                    COUNT(*) AS eval_count -- Count number of evaluations per SE per month
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                JOIN socialenterprises s ON e.se_id = s.se_id
                WHERE e.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months') AND e.evaluation_type = 'Social Enterprise'
                GROUP BY e.se_id, s.abbr, month
            ),
            LatestRatings AS (
                SELECT se_id, MAX(month) AS latest_month
                FROM MonthlyRatings
                GROUP BY se_id
            ),
            TopSEs AS (
                SELECT 
                    mr.se_id, 
                    mr.social_enterprise, 
                    mr.avg_rating, 
                    SUM(mr.avg_rating * mr.eval_count) / SUM(mr.eval_count) AS weighted_avg_rating
                FROM MonthlyRatings mr
                JOIN LatestRatings lr ON mr.se_id = lr.se_id AND mr.month = lr.latest_month
                GROUP BY mr.se_id, mr.social_enterprise, mr.avg_rating
                ORDER BY weighted_avg_rating DESC
                LIMIT 10 -- Get the top 10 performing SEs based on most recent rating
            )
            SELECT t.se_id, t.social_enterprise, t.avg_rating AS most_recent_avg_rating
            FROM TopSEs t
            ORDER BY t.weighted_avg_rating DESC;

        `;
        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.updateAcknowledgeEvaluation= async (evaluationId) => {
    try {
        const query = `
            UPDATE evaluations SET "isAcknowledge" = true WHERE evaluation_id = $1 RETURNING *
        `;
        const values = [evaluationId];
        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};