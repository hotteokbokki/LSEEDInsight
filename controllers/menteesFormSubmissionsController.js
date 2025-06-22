const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getApplicationList = async () => {
    try {
        const query = `
            SELECT
                id,                                -- Auto-generated ID (e.g. SE-APPLICATION-0001)
                team_name,                         -- Name of the SE/team
                se_abbreviation,                   -- Short name for UI display
                "timestamp" AS date_applied     -- When the form was submitted
            FROM
                public.mentees_form_submissions
            ORDER BY
                "timestamp" DESC;
        `;

        const result = await pgDatabase.query(query);

        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
        return [];
    }
};