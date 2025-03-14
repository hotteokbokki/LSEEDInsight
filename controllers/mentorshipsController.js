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
          SELECT 
            m.mentor_id, 
            m.mentor_firstname, 
            m.mentor_lastname 
          FROM mentorships AS ms 
          JOIN mentors AS m ON ms.mentor_id = m.mentor_id 
          WHERE ms.se_id = $1
          LIMIT 1;  -- ✅ Ensure only one mentor is returned
        `;

        const values = [se_id];
        const result = await pgDatabase.query(query, values);

        // ✅ Return a single object instead of an array
        return result.rows.length > 0 
            ? {
                  name: `${result.rows[0].mentor_firstname} ${result.rows[0].mentor_lastname}`, 
                  mentor_id: result.rows[0].mentor_id
              }
            : null; // Return null if no mentor is found
    } catch (error) {
        console.error("❌ Error fetching mentorship by SE_ID:", error);
        return null; // Return null in case of an error
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

exports.getMentorSchedules = async () => {
    try {
      const query = `
        SELECT 
          m.mentor_id,
          m.mentor_firstname || ' ' || m.mentor_lastname AS mentor_name,
          se.team_name AS social_enterprise,
          ARRAY(SELECT unnest(mentorship_date)) AS mentorship_dates, 
          ARRAY(SELECT unnest(mentorship_time)) AS mentorship_times
        FROM mentorships ms
        JOIN mentors m ON ms.mentor_id = m.mentor_id
        JOIN social_enterprises se ON ms.se_id = se.se_id
        WHERE ms.status = 'Active';
      `;
  
      const result = await pgDatabase.query(query);
      if (!result.rows.length) {
        console.log("⚠️ No active mentorships found.");
        return [];
      }
  
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching mentor schedules:", error);
      return [];
    }
};

exports.getPendingSchedules = async () => {
    try {
      const query = `
SELECT 
    NULL AS id,
    ms.mentorship_id,
    ms.se_id,
    ms.mentor_id,
    se.team_name AS se_name,
    m.mentor_firstname || ' ' || m.mentor_lastname AS mentor_name,
    md.mentorship_date,
    (md.mentorship_date + mt.mentorship_time)::timestamp with time zone AS mentorship_time,
    ms.zoom_link,
    'Pending' AS status
FROM public.mentorships ms
LEFT JOIN public.mentors m ON ms.mentor_id = m.mentor_id
LEFT JOIN public.socialenterprises se ON ms.se_id = se.se_id
-- Unnest dates with ordinality to track index
JOIN LATERAL unnest(ms.mentorship_date) WITH ORDINALITY AS md(mentorship_date, date_index) 
    ON md.mentorship_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
-- Unnest times with ordinality and ensure they match the same index
LEFT JOIN LATERAL unnest(ms.mentorship_time) WITH ORDINALITY AS mt(mentorship_time, time_index) 
    ON mt.time_index = md.date_index  -- Ensures correct pairing
WHERE ms.telegramstatus = 'Pending'
ORDER BY mentorship_date, mentorship_time;
      `;
  
      const result = await pgDatabase.query(query);
      if (!result.rows.length) {
        console.log("No Pending Schedules found.");
        return [];
      }
  
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching mentor schedules:", error);
      return [];
    }
};
  