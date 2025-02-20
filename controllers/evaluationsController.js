const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getEvaluationsByMentorID = async (mentor_id) => {
    try {
        console.log(`Fetching evaluations for mentor ID: ${mentor_id}`);

        const query = `
            SELECT 
                e.evaluation_id,
                e.created_at,
                se.team_name AS social_enterprise,
                ec.category_name,
                ec.rating,
                ec.additional_comment,
                COALESCE(
                    JSON_AGG(DISTINCT esc.comment) FILTER (WHERE esc.comment IS NOT NULL), 
                    '[]'
                ) AS selected_comments
            FROM evaluations e
            JOIN mentorships m ON e.mentor_id = m.mentor_id AND e.se_id = m.se_id
            JOIN socialenterprises se ON e.se_id = se.se_id
            LEFT JOIN evaluation_categories ec ON e.evaluation_id = ec.evaluation_id
            LEFT JOIN evaluation_selected_comments esc ON ec.evaluation_category_id = esc.evaluation_category_id
            WHERE e.mentor_id = $1
            GROUP BY e.evaluation_id, e.created_at, se.team_name, ec.category_name, ec.rating, ec.additional_comment;
        `;

        const values = [mentor_id];
        const result = await pgDatabase.query(query, values);

        if (!result.rows.length) {
            console.log("⚠️ No evaluations found for mentor ID:", mentor_id);
            return [];
        }

        return result.rows.map(evaluation => ({
            evaluation_id: evaluation.evaluation_id,
            created_at: evaluation.created_at,
            social_enterprise: evaluation.social_enterprise,
            category_name: evaluation.category_name,
            rating: evaluation.rating,
            additional_comment: evaluation.additional_comment,
            selected_comments: evaluation.selected_comments
        }));
    } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
        return [];
    }
};
