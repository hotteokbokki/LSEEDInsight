const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getEvaluations = async () => {
    try {
        const query = `
            SELECT 
                e.evaluation_id,
                m.mentor_firstname || ' ' || m.mentor_lastname AS evaluator_name,
                se.team_name AS social_enterprise,
                e.created_at AS evaluation_date,
                e."isAcknowledge" AS acknowledged,
				e.evaluation_type
            FROM 
                evaluations AS e
            JOIN 
                mentors AS m ON e.mentor_id = m.mentor_id
            JOIN 
                socialenterprises AS se ON e.se_id = se.se_id
        `;

        const result = await pgDatabase.query(query);

        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
        return [];
    }
};

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

exports.getEvaluationsBySEID = async (se_id) => {
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
                e.se_id = $1 AND
				evaluation_type = 'Social Enterprise';
        `;

        const values = [se_id];
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

exports.getTopSEPerformance = async (period = "overall") => {
    try {
        let query;

        // Select query based on the period
        if (period === "quarterly") {
            query = `
                WITH LatestEvaluation AS (
                    -- Step 1: Determine the latest evaluation date (truncated to the start of the month)
                    SELECT DATE_TRUNC('month', MAX(created_at)) AS latest_eval_date
                    FROM evaluations
                    WHERE evaluation_type = 'Social Enterprise'
                ),
                MonthlyRatings AS (
                    -- Step 2: Calculate monthly ratings for the latest 3 months
                    SELECT 
                        e.se_id,
                        s.abbr AS social_enterprise, 
                        DATE_TRUNC('month', e.created_at) AS month, -- Group by month
                        ROUND(AVG(ec.rating), 2) AS avg_rating,
                        COUNT(*) AS eval_count
                    FROM evaluations e
                    JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                    JOIN socialenterprises s ON e.se_id = s.se_id
                    CROSS JOIN LatestEvaluation le
                    WHERE 
                        DATE_TRUNC('month', e.created_at) >= (le.latest_eval_date - INTERVAL '3 months') -- Start date (3 months before latest eval)
                        AND DATE_TRUNC('month', e.created_at) <= le.latest_eval_date -- End date (latest eval)
                        AND e.evaluation_type = 'Social Enterprise'
                    GROUP BY e.se_id, s.abbr, month
                ),
                TopSEsTrimester AS (
                    -- Step 3: Identify the top 3 social enterprises by weighted average rating
                    SELECT 
                        se_id, 
                        social_enterprise, 
                        SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                    FROM MonthlyRatings
                    GROUP BY se_id, social_enterprise
                    ORDER BY weighted_avg_rating DESC
                    LIMIT 3
                )
                -- Step 4: Retrieve the final results
                SELECT 
                    m.se_id, 
                    m.social_enterprise, 
                    m.month, 
                    m.avg_rating,
                    'trimester' AS period
                FROM MonthlyRatings m
                JOIN TopSEsTrimester t ON m.se_id = t.se_id
                ORDER BY t.weighted_avg_rating DESC, m.social_enterprise, m.month;
            `;
        } else if (period === "yearly") {
            query = `
                WITH LatestEvaluation AS (
                    -- Step 1: Determine the latest evaluation date (truncated to the start of the month)
                    SELECT DATE_TRUNC('month', MAX(created_at)) AS latest_eval_date
                    FROM evaluations
                    WHERE evaluation_type = 'Social Enterprise'
                ),
                MonthlyRatings AS (
                    -- Step 2: Calculate monthly ratings for the latest 11 months
                    SELECT 
                        e.se_id,
                        s.abbr AS social_enterprise, 
                        DATE_TRUNC('month', e.created_at) AS month, -- Group by month
                        ROUND(AVG(ec.rating), 2) AS avg_rating,
                        COUNT(*) AS eval_count
                    FROM evaluations e
                    JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                    JOIN socialenterprises s ON e.se_id = s.se_id
                    CROSS JOIN LatestEvaluation le
                    WHERE 
                        DATE_TRUNC('month', e.created_at) >= (le.latest_eval_date - INTERVAL '11 months') -- Start date (11 months before latest eval)
                        AND DATE_TRUNC('month', e.created_at) <= le.latest_eval_date -- End date (latest eval)
                        AND e.evaluation_type = 'Social Enterprise'
                    GROUP BY e.se_id, s.abbr, month
                ),
                TopSEsYearly AS (
                    -- Step 3: Identify the top 3 social enterprises by weighted average rating
                    SELECT 
                        se_id, 
                        social_enterprise, 
                        SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                    FROM MonthlyRatings
                    GROUP BY se_id, social_enterprise
                    ORDER BY weighted_avg_rating DESC
                    LIMIT 3
                )
                -- Step 4: Retrieve the final results
                SELECT 
                    m.se_id, 
                    m.social_enterprise, 
                    m.month, 
                    m.avg_rating,
                    'yearly' AS period
                FROM MonthlyRatings m
                JOIN TopSEsYearly t ON m.se_id = t.se_id
                ORDER BY t.weighted_avg_rating DESC, m.social_enterprise, m.month;
            `;
        } else if (period === "overall") {
            query = `
                WITH EvaluationRange AS (
                    -- Step 1: Determine the earliest and latest evaluation dates (truncated to the start of the month)
                    SELECT 
                        DATE_TRUNC('month', MIN(created_at)) AS earliest_eval_date,
                        DATE_TRUNC('month', MAX(created_at)) AS latest_eval_date
                    FROM evaluations
                    WHERE evaluation_type = 'Social Enterprise'
                ),
                MonthlyRatings AS (
                    -- Step 2: Calculate monthly ratings for the overall date range
                    SELECT 
                        e.se_id,
                        s.abbr AS social_enterprise, 
                        DATE_TRUNC('month', e.created_at) AS month, -- Group by month
                        ROUND(AVG(ec.rating), 2) AS avg_rating,
                        COUNT(*) AS eval_count
                    FROM evaluations e
                    JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                    JOIN socialenterprises s ON e.se_id = s.se_id
                    CROSS JOIN EvaluationRange er
                    WHERE 
                        DATE_TRUNC('month', e.created_at) >= er.earliest_eval_date -- Start date (earliest eval)
                        AND DATE_TRUNC('month', e.created_at) <= er.latest_eval_date -- End date (latest eval)
                        AND e.evaluation_type = 'Social Enterprise'
                    GROUP BY e.se_id, s.abbr, month
                ),
                TopSEsOverall AS (
                    -- Step 3: Identify the top 3 social enterprises by weighted average rating
                    SELECT 
                        se_id, 
                        social_enterprise, 
                        SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                    FROM MonthlyRatings
                    GROUP BY se_id, social_enterprise
                    ORDER BY weighted_avg_rating DESC
                    LIMIT 3
                )
                -- Step 4: Retrieve the final results
                SELECT 
                    m.se_id, 
                    m.social_enterprise, 
                    m.month, 
                    m.avg_rating,
                    'overall' AS period
                FROM MonthlyRatings m
                JOIN TopSEsOverall t ON m.se_id = t.se_id
                ORDER BY t.weighted_avg_rating DESC, m.social_enterprise, m.month;
            `;
        } else {
            throw new Error("Invalid period specified.");
        }

        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getTopSEPerformanceByMentorships = async (mentor_id, period = "overall") => {
    try {
        let query;

        // Select query based on the period
        if (period === "quarterly") {
            query = `
                WITH LatestEvaluation AS (
                    -- Step 1: Determine the latest evaluation date (truncated to the start of the month)
                    SELECT DATE_TRUNC('month', MAX(e.created_at)) AS latest_eval_date
                    FROM evaluations e
                    JOIN mentorships m ON e.se_id = m.se_id  -- Only SEs assigned to the mentor
                    WHERE e.evaluation_type = 'Social Enterprise'
                    AND m.mentor_id = $1  -- Filter by specific mentor
                ),
                MonthlyRatings AS (
                    -- Step 2: Calculate monthly ratings for the latest 3 months
                    SELECT 
                        e.se_id,
                        s.abbr AS social_enterprise, 
                        DATE_TRUNC('month', e.created_at) AS month, -- Group by month
                        ROUND(AVG(ec.rating), 2) AS avg_rating,
                        COUNT(*) AS eval_count
                    FROM evaluations e
                    JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                    JOIN socialenterprises s ON e.se_id = s.se_id
                    JOIN mentorships m ON e.se_id = m.se_id  -- Only SEs assigned to the mentor
                    CROSS JOIN LatestEvaluation le
                    WHERE 
                        DATE_TRUNC('month', e.created_at) >= (le.latest_eval_date - INTERVAL '3 months') -- Start date (3 months before latest eval)
                        AND DATE_TRUNC('month', e.created_at) <= le.latest_eval_date -- End date (latest eval)
                        AND e.evaluation_type = 'Social Enterprise'
                        AND m.mentor_id = $1
                    GROUP BY e.se_id, s.abbr, month
                ),
                TopSEsTrimester AS (
                    -- Step 3: Identify the top 3 social enterprises by weighted average rating
                    SELECT 
                        se_id, 
                        social_enterprise, 
                        SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                    FROM MonthlyRatings
                    GROUP BY se_id, social_enterprise
                    ORDER BY weighted_avg_rating DESC
                    LIMIT 3
                )
                -- Step 4: Retrieve the final results
                SELECT 
                    m.se_id, 
                    m.social_enterprise, 
                    m.month, 
                    m.avg_rating,
                    'trimester' AS period
                FROM MonthlyRatings m
                JOIN TopSEsTrimester t ON m.se_id = t.se_id
                ORDER BY t.weighted_avg_rating DESC, m.social_enterprise, m.month;
            `;
        } else if (period === "yearly") {
            query = `
                WITH LatestEvaluation AS (
                    -- Step 1: Determine the latest evaluation date (truncated to the start of the month)
                    SELECT DATE_TRUNC('month', MAX(e.created_at)) AS latest_eval_date
                    FROM evaluations e
					JOIN mentorships m ON e.se_id = m.se_id  -- Only SEs assigned to the mentor
                    WHERE e.evaluation_type = 'Social Enterprise'
					AND m.mentor_id = $1  -- Filter by specific mentor
                ),
                MonthlyRatings AS (
                    -- Step 2: Calculate monthly ratings for the latest 11 months
                    SELECT 
                        e.se_id,
                        s.abbr AS social_enterprise, 
                        DATE_TRUNC('month', e.created_at) AS month, -- Group by month
                        ROUND(AVG(ec.rating), 2) AS avg_rating,
                        COUNT(*) AS eval_count
                    FROM evaluations e
                    JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                    JOIN socialenterprises s ON e.se_id = s.se_id
					JOIN mentorships m ON e.se_id = m.se_id  -- Only SEs assigned to the mentor
                    CROSS JOIN LatestEvaluation le
                    WHERE 
                        DATE_TRUNC('month', e.created_at) >= (le.latest_eval_date - INTERVAL '11 months') -- Start date (11 months before latest eval)
                        AND DATE_TRUNC('month', e.created_at) <= le.latest_eval_date -- End date (latest eval)
                        AND e.evaluation_type = 'Social Enterprise'
						AND m.mentor_id = $1
                    GROUP BY e.se_id, s.abbr, month
                ),
                TopSEsYearly AS (
                    -- Step 3: Identify the top 3 social enterprises by weighted average rating
                    SELECT 
                        se_id, 
                        social_enterprise, 
                        SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                    FROM MonthlyRatings
                    GROUP BY se_id, social_enterprise
                    ORDER BY weighted_avg_rating DESC
                    LIMIT 3
                )
                -- Step 4: Retrieve the final results
                SELECT 
                    m.se_id, 
                    m.social_enterprise, 
                    m.month, 
                    m.avg_rating,
                    'yearly' AS period
                FROM MonthlyRatings m
                JOIN TopSEsYearly t ON m.se_id = t.se_id
                ORDER BY t.weighted_avg_rating DESC, m.social_enterprise, m.month;
            `;
        } else if (period === "overall") {
            query = `
                WITH EvaluationRange AS (
                    -- Step 1: Determine the earliest and latest evaluation dates (truncated to the start of the month)
                    SELECT 
                        DATE_TRUNC('month', MIN(e.created_at)) AS earliest_eval_date,
                        DATE_TRUNC('month', MAX(e.created_at)) AS latest_eval_date
                    FROM evaluations e
					JOIN mentorships m ON e.se_id = m.se_id  -- Only SEs assigned to the mentor
                    WHERE evaluation_type = 'Social Enterprise'
					AND m.mentor_id = $1  -- Filter by specific mentor
                ),
                MonthlyRatings AS (
                    -- Step 2: Calculate monthly ratings for the overall date range
                    SELECT 
                        e.se_id,
                        s.abbr AS social_enterprise, 
                        DATE_TRUNC('month', e.created_at) AS month, -- Group by month
                        ROUND(AVG(ec.rating), 2) AS avg_rating,
                        COUNT(*) AS eval_count
                    FROM evaluations e
                    JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                    JOIN socialenterprises s ON e.se_id = s.se_id
					JOIN mentorships m ON e.se_id = m.se_id  -- Only SEs assigned to the mentor
                    CROSS JOIN EvaluationRange er
                    WHERE 
                        DATE_TRUNC('month', e.created_at) >= er.earliest_eval_date -- Start date (earliest eval)
                        AND DATE_TRUNC('month', e.created_at) <= er.latest_eval_date -- End date (latest eval)
                        AND e.evaluation_type = 'Social Enterprise'
						AND m.mentor_id = $1  -- Filter by specific mentor
                    GROUP BY e.se_id, s.abbr, month
                ),
                TopSEsOverall AS (
                    -- Step 3: Identify the top 3 social enterprises by weighted average rating
                    SELECT 
                        se_id, 
                        social_enterprise, 
                        SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                    FROM MonthlyRatings
                    GROUP BY se_id, social_enterprise
                    ORDER BY weighted_avg_rating DESC
                    LIMIT 3
                )
                -- Step 4: Retrieve the final results
                SELECT 
                    m.se_id, 
                    m.social_enterprise, 
                    m.month, 
                    m.avg_rating,
                    'overall' AS period
                FROM MonthlyRatings m
                JOIN TopSEsOverall t ON m.se_id = t.se_id
                ORDER BY t.weighted_avg_rating DESC, m.social_enterprise, m.month;
            `;
        } else {
            throw new Error("Invalid period specified.");
        }
        const values = [mentor_id]

        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getPerformanceTrendBySEID = async (se_id, period = "overall") => {
    try {
        let query;

        // Select query based on the period
        if (period === "quarterly") {
            query = `
                WITH LatestEvaluation AS (
                    -- Step 1: Determine the latest evaluation date (truncated to the start of the month)
                    SELECT DATE_TRUNC('month', MAX(e.created_at)) AS latest_eval_date
                    FROM evaluations e
                    JOIN socialenterprises s ON e.se_id = s.se_id
                    WHERE e.evaluation_type = 'Social Enterprise'
                    AND e.se_id = $1  -- Filter by specific SE ID
                ),
                MonthlyRatings AS (
                    -- Step 2: Calculate monthly ratings for the latest 3 months
                    SELECT 
                        e.se_id,
                        s.abbr AS social_enterprise, 
                        DATE_TRUNC('month', e.created_at) AS month, -- Group by month
                        ROUND(AVG(ec.rating), 2) AS avg_rating,
                        COUNT(*) AS eval_count
                    FROM evaluations e
                    JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                    JOIN socialenterprises s ON e.se_id = s.se_id
                    CROSS JOIN LatestEvaluation le
                    WHERE 
                        DATE_TRUNC('month', e.created_at) >= (le.latest_eval_date - INTERVAL '3 months') -- Start date (3 months before latest eval)
                        AND DATE_TRUNC('month', e.created_at) <= le.latest_eval_date -- End date (latest eval)
                        AND e.evaluation_type = 'Social Enterprise'
                        AND e.se_id = $1  -- Filter by specific SE ID
                    GROUP BY e.se_id, s.abbr, month
                ),
                TopSEsTrimester AS (
                    -- Step 3: Identify the top 3 social enterprises by weighted average rating
                    SELECT 
                        se_id, 
                        social_enterprise, 
                        SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                    FROM MonthlyRatings
                    GROUP BY se_id, social_enterprise
                    ORDER BY weighted_avg_rating DESC
                    LIMIT 3
                )
                -- Step 4: Retrieve the final results
                SELECT 
                    m.se_id, 
                    m.social_enterprise, 
                    m.month, 
                    m.avg_rating,
                    'trimester' AS period
                FROM MonthlyRatings m
                JOIN TopSEsTrimester t ON m.se_id = t.se_id
                ORDER BY t.weighted_avg_rating DESC, m.social_enterprise, m.month;
            `;
        } else if (period === "yearly") {
            query = `
                WITH LatestEvaluation AS (
                    -- Step 1: Determine the latest evaluation date (truncated to the start of the month)
                    SELECT DATE_TRUNC('month', MAX(e.created_at)) AS latest_eval_date
                    FROM evaluations e
                    JOIN socialenterprises s ON e.se_id = s.se_id
                    WHERE e.evaluation_type = 'Social Enterprise'
                    AND e.se_id = $1  -- Filter by specific SE ID
                ),
                MonthlyRatings AS (
                    -- Step 2: Calculate monthly ratings for the latest 11 months
                    SELECT 
                        e.se_id,
                        s.abbr AS social_enterprise, 
                        DATE_TRUNC('month', e.created_at) AS month, -- Group by month
                        ROUND(AVG(ec.rating), 2) AS avg_rating,
                        COUNT(*) AS eval_count
                    FROM evaluations e
                    JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                    JOIN socialenterprises s ON e.se_id = s.se_id
                    CROSS JOIN LatestEvaluation le
                    WHERE 
                        DATE_TRUNC('month', e.created_at) >= (le.latest_eval_date - INTERVAL '11 months') -- Start date (11 months before latest eval)
                        AND DATE_TRUNC('month', e.created_at) <= le.latest_eval_date -- End date (latest eval)
                        AND e.evaluation_type = 'Social Enterprise'
						AND e.se_id = $1  -- Filter by specific SE ID
                    GROUP BY e.se_id, s.abbr, month
                ),
                TopSEsYearly AS (
                    -- Step 3: Identify the top 3 social enterprises by weighted average rating
                    SELECT 
                        se_id, 
                        social_enterprise, 
                        SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                    FROM MonthlyRatings
                    GROUP BY se_id, social_enterprise
                    ORDER BY weighted_avg_rating DESC
                    LIMIT 3
                )
                -- Step 4: Retrieve the final results
                SELECT 
                    m.se_id, 
                    m.social_enterprise, 
                    m.month, 
                    m.avg_rating,
                    'yearly' AS period
                FROM MonthlyRatings m
                JOIN TopSEsYearly t ON m.se_id = t.se_id
                ORDER BY t.weighted_avg_rating DESC, m.social_enterprise, m.month;
            `;
        } else if (period === "overall") {
            query = `
                WITH EvaluationRange AS (
                    -- Step 1: Determine the earliest and latest evaluation dates (truncated to the start of the month)
                    SELECT 
                        DATE_TRUNC('month', MIN(e.created_at)) AS earliest_eval_date,
                        DATE_TRUNC('month', MAX(e.created_at)) AS latest_eval_date
                    FROM evaluations e
					JOIN socialenterprises s ON e.se_id = s.se_id
                    WHERE evaluation_type = 'Social Enterprise'
					AND e.se_id = $1  -- Filter by specific SE ID
                ),
                MonthlyRatings AS (
                    -- Step 2: Calculate monthly ratings for the overall date range
                    SELECT 
                        e.se_id,
                        s.abbr AS social_enterprise, 
                        DATE_TRUNC('month', e.created_at) AS month, -- Group by month
                        ROUND(AVG(ec.rating), 2) AS avg_rating,
                        COUNT(*) AS eval_count
                    FROM evaluations e
                    JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                    JOIN socialenterprises s ON e.se_id = s.se_id
                    CROSS JOIN EvaluationRange er
                    WHERE 
                        DATE_TRUNC('month', e.created_at) >= er.earliest_eval_date -- Start date (earliest eval)
                        AND DATE_TRUNC('month', e.created_at) <= er.latest_eval_date -- End date (latest eval)
                        AND e.evaluation_type = 'Social Enterprise'
						AND e.se_id = $1  -- Filter by specific SE ID
                    GROUP BY e.se_id, s.abbr, month
                ),
                TopSEsOverall AS (
                    -- Step 3: Identify the top 3 social enterprises by weighted average rating
                    SELECT 
                        se_id, 
                        social_enterprise, 
                        SUM(avg_rating * eval_count) / SUM(eval_count) AS weighted_avg_rating
                    FROM MonthlyRatings
                    GROUP BY se_id, social_enterprise
                    ORDER BY weighted_avg_rating DESC
                    LIMIT 3
                )
                -- Step 4: Retrieve the final results
                SELECT 
                    m.se_id, 
                    m.social_enterprise, 
                    m.month, 
                    m.avg_rating,
                    'overall' AS period
                FROM MonthlyRatings m
                JOIN TopSEsOverall t ON m.se_id = t.se_id
                ORDER BY t.weighted_avg_rating DESC, m.social_enterprise, m.month;
            `;
        } else {
            throw new Error("Invalid period specified.");
        }
        const values = [se_id]

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
            WITH low_rated_categories AS (
                SELECT 
                    ec.category_name AS category,
                    ec.rating,
                    COUNT(ec.evaluation_category_id) AS count
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                WHERE e.se_id = $1 -- ✅ Filter by the specific SE
                AND e.evaluation_type = 'Social Enterprise'
                AND ec.rating <= 2  
                GROUP BY ec.category_name, ec.rating
            ),
            ranked_low_ratings AS (
                SELECT 
                    category, 
                    rating, 
                    count,
                    RANK() OVER (PARTITION BY category ORDER BY count DESC, rating ASC) AS rank
                FROM low_rated_categories
            ),
            top_low_rated AS (
                SELECT 
                    category,
                    rating,
                    count
                FROM ranked_low_ratings
                WHERE rank = 1  -- ✅ Select only the most common low rating per category
            ),
            total_top AS (
                SELECT SUM(count) AS top_total FROM top_low_rated
            ),
            final_result AS (
                SELECT 
                    tlr.category, 
                    tlr.rating,
                    MIN(esc.comment) AS comment,  -- ✅ Select only one distinct comment (avoiding repetition)
                    tlr.count,
                    ROUND(tlr.count * 100.0 / COALESCE(tt.top_total, 1), 0) AS percentage
                FROM top_low_rated tlr
                CROSS JOIN total_top tt
                LEFT JOIN evaluation_categories ec ON tlr.category = ec.category_name AND tlr.rating = ec.rating
                LEFT JOIN evaluation_selected_comments esc ON ec.evaluation_category_id = esc.evaluation_category_id
                GROUP BY tlr.category, tlr.rating, tlr.count, tt.top_total
            )
            SELECT DISTINCT * FROM final_result
            ORDER BY count DESC;
        `;
        const values = [se_id];

        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getStatsForHeatmap = async (period = "overall") => {
    try {
        let dateCondition = "";

        if (period === "quarterly") {
            dateCondition = `
                e.created_at >= (CURRENT_DATE - INTERVAL '3 months')
                AND e.created_at < CURRENT_DATE
            `;
        } else if (period === "yearly") {
            dateCondition = `
                e.created_at >= (CURRENT_DATE - INTERVAL '12 months')
                AND e.created_at < CURRENT_DATE
            `;
        } else if (period === "overall") {
            dateCondition = "1 = 1"; // No date filter, fetches all data
        }

        const query = `
            WITH recent_evaluations AS (
                SELECT 
                    e.se_id,  
                    ec.category_name,
                    AVG(ec.rating) AS avg_rating
                FROM public.evaluation_categories ec
                JOIN public.evaluations e ON ec.evaluation_id = e.evaluation_id
                WHERE 
                    ${dateCondition}
                    AND e.evaluation_type = 'Social Enterprise'
                GROUP BY e.se_id, ec.category_name
            )
            SELECT 
                ROW_NUMBER() OVER () AS row_id,  
                se.se_id,
                TRIM(se.team_name) AS team_name,
                TRIM(COALESCE(se.abbr, se.team_name)) AS abbr,  
                jsonb_object_agg(re.category_name, re.avg_rating) AS category_ratings  
            FROM recent_evaluations re
            INNER JOIN public.socialenterprises se ON re.se_id = se.se_id  -- 🔥 INNER JOIN ensures only SEs with data
            GROUP BY se.se_id, se.team_name, se.abbr
            ORDER BY se.team_name;
        `;

        const result = await pgDatabase.query(query);

        return result.rows.map(row => ({
            team_name: row.team_name,
            abbr: row.abbr,
            ...row.category_ratings
        }));
    } catch (error) {
        console.error("❌ Error fetching heatmap data:", error);
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

exports.getAcknowledgementData = async () => {
    try {
        const query = `
            SELECT 
                CONCAT(t.mentor_id, '-', t."se_ID") AS batch,  -- Grouping by mentor_id and se_ID
                s.team_name AS se_name,  -- Get the social enterprise name
                COUNT(CASE WHEN e."isAcknowledge" = true THEN 1 END) * 100.0 / COUNT(*) AS acknowledged_percentage,
                COUNT(CASE WHEN e."isAcknowledge" = false THEN 1 END) * 100.0 / COUNT(*) AS pending_percentage
            FROM evaluations e
            JOIN telegrambot t 
                ON e.mentor_id = t.mentor_id 
                AND e.se_id = t."se_ID"  
            JOIN socialenterprises s 
                ON t."se_ID" = s.se_id  -- Join with SE table to get the name
            WHERE e.evaluation_type = 'Social Enterprise'
            GROUP BY t.mentor_id, t."se_ID", s.team_name
            ORDER BY COUNT(CASE WHEN e."isAcknowledge" = true THEN 1 END) DESC  -- Sort by acknowledged evaluations
            LIMIT 10;
        `;
        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getImprovementScorePerMonthAnnually= async () => {
    try {
        const query = `
            WITH DateRange AS ( -- Dynamically finds the range of evaluations
                SELECT 
                    DATE_TRUNC('month', MIN(created_at))::DATE AS start_date,
                    DATE_TRUNC('month', MAX(created_at))::DATE AS end_date
                FROM evaluations
                WHERE evaluation_type = 'Social Enterprise'
            ),
            Months AS ( -- Generates months dynamically based on the min/max date
                SELECT generate_series(
                    (SELECT start_date FROM DateRange), 
                    (SELECT end_date FROM DateRange), 
                    INTERVAL '3 months'
                )::DATE AS month
            ),
            MonthlyRatings AS ( -- Calculates the average rating per month
                SELECT 
                    e.se_id,
                    s.abbr AS social_enterprise, 
                    DATE_TRUNC('month', e.created_at)::DATE AS month, 
                    ROUND(AVG(ec.rating), 3) AS avg_rating
                FROM evaluations e
                JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
                JOIN socialenterprises s ON e.se_id = s.se_id
                WHERE e.evaluation_type = 'Social Enterprise'
                GROUP BY e.se_id, s.abbr, month
            ),
            FilledMonths AS ( -- Ensures all months exist, even if no evaluations happened
                SELECT 
                    m.month, 
                    mr.se_id, 
                    mr.social_enterprise, 
                    COALESCE(mr.avg_rating, 0) AS avg_rating
                FROM Months m
                LEFT JOIN MonthlyRatings mr ON m.month = mr.month
            ),
            RankedRatings AS ( -- Calculates improvement compared to previous months
                SELECT 
                    se_id, 
                    social_enterprise, 
                    month, 
                    avg_rating,
                    LAG(avg_rating) OVER (PARTITION BY se_id ORDER BY month) AS prev_avg_rating
                FROM FilledMonths
            )
            SELECT 
                month,
                ROUND(AVG(avg_rating - COALESCE(prev_avg_rating, avg_rating)), 3) AS overall_avg_improvement,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY avg_rating - COALESCE(prev_avg_rating, avg_rating)) AS median_improvement
            FROM RankedRatings
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

exports.getAllEvaluationStats= async () => {
    try {
        const query = `
            SELECT 
                COUNT(*) AS totalEvaluations,
                COUNT(CASE WHEN "isAcknowledge" = true THEN 1 END) AS acknowledgedEvaluations
            FROM evaluations;
        `;
        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getTotalEvaluationCount= async (se_id) => {
    try {
        const query = `
            SELECT COUNT(*) AS total_evaluations
            FROM evaluations
            WHERE se_id = $1;
        `;

        const values = [se_id];

        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getPendingEvaluationCount= async (se_id) => {
    try {
        const query = `
            SELECT COUNT(*) AS pending_evaluations
            FROM evaluations AS e
            WHERE e."se_id" = $1
            AND e."isAcknowledge" = false;
        `;

        const values = [se_id];

        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

exports.getAcknowledgedEvaluationCount= async (se_id) => {
    try {
        const query = `
            SELECT COUNT(*) AS acknowledged_evaluations
            FROM evaluations AS e
            WHERE e."se_id" = $1
            AND e."isAcknowledge" = true;
        `;

        const values = [se_id];

        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};

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
        s.abbr AS social_enterprise, 
        s.team_name AS full_name,  -- Fetch full name for tooltip
        DATE_TRUNC('month', e.created_at) AS month,
        ROUND(AVG(ec.rating), 2) AS avg_rating,
        COUNT(*) AS eval_count -- Count number of evaluations per SE per month
    FROM evaluations e
    JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
    JOIN socialenterprises s ON e.se_id = s.se_id
    WHERE e.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months') -- Allow flexibility for time frame
        AND e.evaluation_type = 'Social Enterprise'
    GROUP BY e.se_id, s.abbr, s.team_name, month
),
WeightedRatings AS (
    SELECT 
        mr.se_id, 
        mr.social_enterprise,
        mr.full_name, -- Include full name
        mr.month,
        mr.avg_rating,
        mr.eval_count,
        CASE
            WHEN mr.month = DATE_TRUNC('month', CURRENT_DATE) THEN 1.0
            WHEN mr.month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN 0.75
            WHEN mr.month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months') THEN 0.5
            ELSE 0.25 -- Past months get decreasing weights
        END AS weight
    FROM MonthlyRatings mr
),
TopSEs AS (
    SELECT 
        wr.se_id,
        wr.social_enterprise,
        wr.full_name,
        SUM(wr.avg_rating * wr.eval_count * wr.weight) / SUM(wr.eval_count * wr.weight) AS weighted_avg_rating,
        AVG(wr.avg_rating) AS simple_avg_rating
    FROM WeightedRatings wr
    GROUP BY wr.se_id, wr.social_enterprise, wr.full_name
    HAVING COUNT(wr.se_id) >= 3  -- Ensure sufficient evaluations per SE
    ORDER BY weighted_avg_rating DESC, simple_avg_rating DESC
    LIMIT 10
)
SELECT 
    t.se_id, 
    t.social_enterprise,  -- Abbreviated name for axis
    t.full_name,          -- Full name for tooltip
    ROUND(t.simple_avg_rating, 2) AS most_recent_avg_rating,
    ROUND(t.weighted_avg_rating, 2) AS overall_weighted_avg_rating,
    ROUND(t.simple_avg_rating - t.weighted_avg_rating, 2) AS performance_change -- Ensure 2 decimal places
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

exports.avgRatingPerSE= async (se_id) => {
    try {
        const query = `
            SELECT 
                e.se_id,
                s.abbr AS social_enterprise, 
                s.team_name AS full_name,
                ROUND(AVG(ec.rating), 2) AS avg_rating
            FROM evaluations e
            JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
            JOIN socialenterprises s ON e.se_id = s.se_id
            WHERE e.evaluation_type = 'Social Enterprise'
            AND e.se_id = $1
            GROUP BY e.se_id, s.abbr, s.team_name
            ORDER BY avg_rating DESC;
        `;
        const values = [se_id];
        const result = await pgDatabase.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};