const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getApplicationList = async () => {
    try {
        const query = `
            SELECT
                id,
                "timestamp" AS date_applied,
                team_name,
                se_abbreviation,
                enterprise_idea_start,
                involved_people,
                current_phase,
                social_problem,
                se_nature,
                team_characteristics,
                team_challenges,
                critical_areas,
                action_plans,
                meeting_frequency,
                communication_modes,
                social_media_link,
                mentoring_team_members,
                preferred_mentoring_time,
                mentoring_time_note,
                pitch_deck_url,
                focal_email,
                focal_phone
            FROM
                mentees_form_submissions
            WHERE
                status = 'Pending'
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