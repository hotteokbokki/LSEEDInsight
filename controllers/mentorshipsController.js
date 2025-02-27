const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getMentorshipsByMentorId = async (mentor_id) => {
    try {
        const query = `
        SELECT 
            ms.mentorship_id AS id, 
            m.mentor_id, 
            CONCAT(m.mentor_firstname, ' ', m.mentor_lastname) AS Mentor, 
            se.se_id,
            se.team_name AS SE, 
            p."name" AS Program, 
            STRING_AGG(sdg."name", ', ') AS SDGs -- Aggregating SDGs into one column
        FROM mentorships AS ms 
        JOIN socialenterprises AS se ON ms."se_id" = se."se_id"
        JOIN mentors AS m ON m."mentor_id" = ms."mentor_id"
        JOIN programs AS p ON se."program_id" = p."program_id"
        JOIN sdg AS sdg ON sdg."sdg_id" = ANY(se."sdg_id")
        WHERE m."mentor_id" = $1
        GROUP BY ms.mentorship_id, m.mentor_id, Mentor, se.se_id, SE, Program;
        `;
    
        const values = [mentor_id];
        const result = await pgDatabase.query(query, values);
    
        return result.rows.length ? result.rows : [];
    } catch (error) {
        console.error("❌ Error fetching mentorships by mentor_id:", error);
        return []; // Return an empty array in case of an error
    }
};

exports.getMentorBySEID = async (se_id) => {
    try {
        const query = `
          SELECT * 
          FROM mentorships AS ms 
          JOIN mentors AS m ON ms."mentor_id" = m."mentor_id" 
          WHERE ms."se_id" = $1;
        `;

        const values = [se_id];
        const result = await pgDatabase.query(query, values);

        // ✅ Map results correctly
        return result.rows.length
            ? result.rows.map(mentor => ({
                  name: `${mentor.mentor_firstname} ${mentor.mentor_lastname}`, // Fixed casing issue
                  mentor_id: mentor.mentor_id
              }))
            : []; // Return an empty array if no results are found
    } catch (error) {
        console.error("❌ Error fetching mentorships by SE_ID:", error);
        return []; // Return an empty array in case of an error
    }
};

exports.getSEWithMentors = async () => {
    try {
        const query = `
            SELECT COUNT(DISTINCT se_id) AS total_se_with_mentors 
            FROM mentorships 
            WHERE status = 'Active';
        `;

        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching mentorships", error);
        return []; // Return an empty array in case of an error
    }
};

exports.getMentorshipCount = async () => {
    try {
        const query = `
            SELECT COUNT(DISTINCT mentor_id) 
            FROM mentorships
            WHERE status != 'Inactive';  -- Optionally filter by active mentorships
        `;

        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching mentorships", error);
        return []; // Return an empty array in case of an error
    }
};