const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getMentorshipsByMentorId = async (mentor_id) => {
    try {
        const query = `
            SELECT 
                ms.mentoring_session_id, -- ✅ Add to GROUP BY
                m.mentor_firstname || ' ' || m.mentor_lastname AS mentor_name, -- ✅ Mentor assigned
                se.team_name AS social_enterprise_name, -- ✅ Social Enterprise assigned
                se.se_id,
                m.mentor_id,
                p."name" AS program_name, -- ✅ Program the SE belongs to
                STRING_AGG(sdg."name", ', ') AS SDGs, -- ✅ Aggregate multiple SDGs
                TO_CHAR(ms.start_time, 'HH24:MI') AS start_time, -- ✅ Formatted start time
                TO_CHAR(ms.end_time, 'HH24:MI') AS end_time, -- ✅ Formatted end time
                TO_CHAR(ms.mentoring_session_date, 'FMMonth DD, YYYY') AS mentoring_session_date
            FROM mentoring_session AS ms
            JOIN mentorships AS mt ON ms.mentorship_id = mt.mentorship_id -- ✅ Get mentorship details
            JOIN mentors AS m ON mt.mentor_id = m.mentor_id -- ✅ Get mentor details from mentorships
            JOIN socialenterprises AS se ON mt.se_id = se.se_id -- ✅ Get SE details from mentorships
            JOIN programs AS p ON se.program_id = p.program_id -- ✅ Get the program the SE belongs to
            JOIN sdg AS sdg ON sdg.sdg_id = ANY(se.sdg_id) -- ✅ Get the SDGs for the SE
            WHERE ms.status = 'Accepted' AND mt.mentor_id = $1
            GROUP BY 
                ms.mentoring_session_id, -- ✅ Added to GROUP BY
                m.mentor_firstname, 
                m.mentor_lastname, 
                se.team_name, 
                se.se_id,
                m.mentor_id,
                p."name", 
                ms.start_time, 
                ms.end_time, 
                mentoring_session_date
            ORDER BY ms.start_time DESC; -- ✅ Show most recent sessions first
        `;
    
        const values = [mentor_id];
        const result = await pgDatabase.query(query, values);
    
        return result.rows.length ? result.rows : [];
    } catch (error) {
        console.error("❌ Error fetching mentorships by mentor_id:", error);
        return []; // Return an empty array in case of an error
    }
};

exports.getMentorshipsForScheduling = async (mentor_id) => {
    try {
        const query = `
        SELECT 
            ms.mentorship_id AS id, 
            m.mentor_id, 
            CONCAT(m.mentor_firstname, ' ', m.mentor_lastname) AS Mentor, 
            se.se_id,
            se.team_name AS SE, 
            p."name" AS Program, 
            STRING_AGG(sdg."name", ', ') AS SDGs, -- Aggregating SDGs into one column
            se.preferred_mentoring_time
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

exports.getSEWithMentors = async (program = null) => {
    try {
        let programFilter = program ? `AND p.name = '${program}'` : '';


        const query = `
            SELECT COUNT(DISTINCT ms.se_id) AS total_se_with_mentors 
            FROM mentorships AS ms
			JOIN socialenterprises AS s ON s.se_id = ms.se_id
			JOIN programs AS p ON p.program_id = s.program_id
            WHERE ms.status = 'Active'
			${programFilter};
        `;

        const result = await pgDatabase.query(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching mentorships", error);
        return []; // Return an empty array in case of an error
    }
};

exports.getHandledSEsCountByMentor = async (mentor_id) => {
  try {
      const query = `
          SELECT 
              mentor_id, 
              COUNT(DISTINCT se_id) AS num_se_handled
          FROM mentorships
          WHERE mentor_id = $1
          GROUP BY mentor_id;
      `;

      const result = await pgDatabase.query(query, [mentor_id]); // Correctly passing mentor_id

      return result.rows[0]?.num_se_handled || 0; // Return the count or 0 if no data found
  } catch (error) {
      console.error("❌ Error fetching mentorships:", error);
      return 0; // Return 0 in case of an error
  }
};

exports.getMentorshipCount = async (program = null) => {
    try {
        let programFilter = program ? `AND p.name = '${program}'` : '';
        
        const query = `
            SELECT COUNT(DISTINCT mentor_id) 
            FROM mentorships AS ms
            JOIN socialenterprises AS s ON s.se_id = ms.se_id
            JOIN programs AS p ON p.program_id = s.program_id
            WHERE status != 'Inactive'
            ${programFilter};  
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

exports.getPendingSchedules = async (program = null, mentor_id) => {
  try {
    let programFilter = "";
    let params = [mentor_id];

    if (program) {
      programFilter = " AND p.name = $2";
      params = [mentor_id, program];
    }

    const query = `
      SELECT 
        ms.mentoring_session_id,
        m.mentorship_id, 
        se.team_name, 
        CONCAT(mt.mentor_firstname, ' ', mt.mentor_lastname) AS mentor_name,
        p.name AS program_name,
        TO_CHAR(ms.mentoring_session_date, 'FMMonth DD, YYYY') AS mentoring_session_date,
        CONCAT(
          TO_CHAR(ms.start_time, 'HH24:MI'), ' - ', 
          TO_CHAR(ms.end_time, 'HH24:MI')
        ) AS mentoring_session_time,
        ms.status,
        ms.zoom_link
      FROM mentorships m
      JOIN mentoring_session ms ON m.mentorship_id = ms.mentorship_id
      JOIN mentors mt ON m.mentor_id = mt.mentor_id
      JOIN socialenterprises se ON m.se_id = se.se_id
      JOIN programs p ON p.program_id = se.program_id
      WHERE ms.status = 'Pending'
        AND m.mentor_id IS DISTINCT FROM $1
        ${programFilter}
      ORDER BY ms.mentoring_session_date, ms.start_time;
    `;

    const result = await pgDatabase.query(query, params);
    if (!result.rows.length) {
      console.log("No Pending Schedules found.");
      return [];
    }

    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching pending schedules:", error);
    return [];
  }
};

exports.getSchedulingHistory = async (program = null) => {
    try {
        
        let programFilter = program ? `AND p.name = '${program}'` : '';

        const query = `
            SELECT 
                ms.mentoring_session_id,
                m.mentorship_id, 
                se.team_name, 
                CONCAT(mt.mentor_firstname, ' ', mt.mentor_lastname) AS mentor_name,
                p.name AS program_name,
                TO_CHAR(ms.mentoring_session_date, 'FMMonth DD, YYYY') AS mentoring_session_date,  -- ✅ Proper month name without spaces
                CONCAT(
                    TO_CHAR(ms.start_time, 'HH24:MI'), ' - ', 
                    TO_CHAR(ms.end_time, 'HH24:MI')
                ) AS mentoring_session_time,
                ms.status,
                ms.zoom_link
            FROM mentorships m
            JOIN mentoring_session ms ON m.mentorship_id = ms.mentorship_id
            JOIN mentors mt ON m.mentor_id = mt.mentor_id
            JOIN socialenterprises se ON m.se_id = se.se_id
            JOIN programs p ON p.program_id = se.program_id
            WHERE ms.status <> 'Pending'  -- ❌ Exclude pending sessions
            ${programFilter}
            ORDER BY ms.mentoring_session_date DESC, ms.start_time DESC;
        `;

        const result = await pgDatabase.query(query);
        if (!result.rows.length) {
        console.log("No Pending Schedules found.");
        return [];
        }

        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching scheduling history schedules:", error);
        return [];
    }
};

exports.getSchedulingHistoryByMentorID = async (mentor_id) => {
    try {
      const query = `
          SELECT 
              ms.mentoring_session_id,
              m.mentorship_id, 
              se.team_name, 
              CONCAT(mt.mentor_firstname, ' ', mt.mentor_lastname) AS mentor_name,
              p.name AS program_name,
              TO_CHAR(ms.mentoring_session_date, 'FMMonth DD, YYYY') AS mentoring_session_date,  -- ✅ Proper month name without spaces
              CONCAT(
                  TO_CHAR(ms.start_time, 'HH24:MI'), ' - ', 
                  TO_CHAR(ms.end_time, 'HH24:MI')
              ) AS mentoring_session_time,
              ms.status,
              ms.zoom_link
          FROM mentorships m
          JOIN mentoring_session ms ON m.mentorship_id = ms.mentorship_id
          JOIN mentors mt ON m.mentor_id = mt.mentor_id
          JOIN socialenterprises se ON m.se_id = se.se_id
          JOIN programs p ON p.program_id = se.program_id
          WHERE ms.status <> 'Pending'  -- ❌ Exclude pending sessions
          AND mt.mentor_id = $1
          ORDER BY ms.mentoring_session_date, ms.start_time;
      `;

      
      const result = await pgDatabase.query(query, [mentor_id]);
      if (!result.rows.length) {
        console.log("No Schedules found.");
        return [];
      }
  
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching scheduling history by mentor schedules:", error);
      return [];
    }
};

exports.getPendingSchedulesForMentor = async (mentor_id) => {
    try {
      const query = `
        SELECT 
            ms.mentoring_session_id,
            m.mentorship_id, 
            se.team_name, 
            CONCAT(mt.mentor_firstname, ' ', mt.mentor_lastname) AS mentor_name,
            p.name AS program_name,
            TO_CHAR(ms.mentoring_session_date, 'FMMonth DD, YYYY') AS mentoring_session_date,
            CONCAT(
                TO_CHAR(ms.start_time, 'HH24:MI'), ' - ', 
                TO_CHAR(ms.end_time, 'HH24:MI')
            ) AS mentoring_session_time,
            ms.status,
            ms.zoom_link
        FROM mentorships m
        JOIN mentoring_session ms ON m.mentorship_id = ms.mentorship_id
        JOIN mentors mt ON m.mentor_id = mt.mentor_id
        JOIN socialenterprises se ON m.se_id = se.se_id
        JOIN programs p ON p.program_id = se.program_id
        WHERE ms.status IN ('Pending', 'Pending SE')
          AND mt.mentor_id = $1
        ORDER BY ms.mentoring_session_date DESC, ms.start_time DESC;
      `;

      
      const result = await pgDatabase.query(query, [mentor_id]);
      if (!result.rows.length) {
        console.log("No Schedules found.");
        return [];
      }
  
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching scheduling history by mentor schedules:", error);
      return [];
    }
};

exports.getMentorshipCountByMentorID = async (mentor_id) => {
    try {
      const query = `
        SELECT COUNT(DISTINCT se_id) AS mentorship_count
        FROM mentorships
        WHERE mentor_id = $1;
      `;
      const result = await pgDatabase.query(query, [mentor_id]);
      if (!result.rows.length) {
        console.log("No Schedules found.");
        return [];
      }
  
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching scheduling history by mentor schedules:", error);
      return [];
    }
};
  