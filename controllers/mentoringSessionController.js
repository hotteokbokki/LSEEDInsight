const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getUpcomingSchedulesForMentor = async (mentor_id) => {
    try {
        const query = `
            SELECT 
                ms.mentoring_session_id,
                m.mentor_firstname || ' ' || m.mentor_lastname AS mentor_name, -- ✅ Mentor leading the session
                se.team_name AS social_enterprise, -- ✅ SE being mentored
                CONCAT(
                    TO_CHAR(ms.mentoring_session_date, 'FMMonth DD, YYYY'),
                    ' at ',
                    TO_CHAR(ms.start_time, 'HH12:MI AM'),
                    ' - ',
                    TO_CHAR(ms.end_time, 'HH12:MI AM')
                ) AS session_datetime, -- ✅ Formatted session schedule
				ms.zoom_link,
                ms.status -- ✅ (e.g., Scheduled, Pending, Confirmed)
            FROM 
                mentoring_session AS ms
            JOIN
                mentorships AS mps ON mps.mentorship_id = ms.mentorship_id
            JOIN 
                mentors AS m ON mps.mentor_id = m.mentor_id -- ✅ Get mentor details
            JOIN 
                socialenterprises AS se ON mps.se_id = se.se_id -- ✅ Get SE details
            WHERE 
                ms.mentoring_session_date > NOW() 
                AND ms.status = 'Accepted'
                AND m.mentor_id = $1
            ORDER BY 
                ms.mentoring_session_date ASC;
        `;

        const values = [mentor_id];
        const result = await pgDatabase.query(query, values);

        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
        return [];
    }
};