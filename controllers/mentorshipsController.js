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

exports.getCollaborators = async (mentor_id) => {
  try {
    const query = `
      SELECT 
        mt.mentorship_id,
        m.mentor_firstname || ' ' || m.mentor_lastname AS mentor_name,
        se.team_name AS social_enterprise_name,
        se.se_id,
        m.mentor_id,
        p."name" AS program_name,
        STRING_AGG(sdg."name", ', ') AS SDGs
      FROM mentorships AS mt
      JOIN mentors AS m ON mt.mentor_id = m.mentor_id
      JOIN socialenterprises AS se ON mt.se_id = se.se_id
      JOIN programs AS p ON se.program_id = p.program_id
      JOIN sdg AS sdg ON sdg.sdg_id = ANY(se.sdg_id)

      -- Exclude mentorships that already have a collaboration
      LEFT JOIN mentorship_collaborations mc1 
        ON mc1.mentorship_id_1 = mt.mentorship_id
      LEFT JOIN mentorship_collaborations mc2 
        ON mc2.mentorship_id_2 = mt.mentorship_id

      WHERE mt.mentor_id = $1
        AND mc1.mentorship_id_1 IS NULL
        AND mc2.mentorship_id_2 IS NULL

      GROUP BY 
        mt.mentorship_id,
        m.mentor_firstname, 
        m.mentor_lastname, 
        se.team_name, 
        se.se_id,
        m.mentor_id,
        p."name"

      ORDER BY se.team_name;
    `;

    const values = [mentor_id];
    const result = await pgDatabase.query(query, values);

    return result.rows.length ? result.rows : [];
  } catch (error) {
    console.error("❌ Error fetching mentorships (excluding current mentor):", error);
    return [];
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
              STRING_AGG(sdg."name", ', ') AS SDGs,
              se.preferred_mentoring_time,
              se.mentoring_time_note
          FROM mentorships AS ms
          JOIN socialenterprises AS se ON ms.se_id = se.se_id
          JOIN mentors AS m ON m.mentor_id = ms.mentor_id
          JOIN programs AS p ON se.program_id = p.program_id
          JOIN sdg AS sdg ON sdg.sdg_id = ANY(se.sdg_id)
          WHERE m.mentor_id =$1
            AND NOT EXISTS (
                SELECT 1
                FROM mentoring_session AS session
                WHERE session.mentorship_id = ms.mentorship_id
                  AND session.status IN ('Pending', 'Pending SE', 'Accepted', 'In Progress')
            )
          GROUP BY 
              ms.mentorship_id, 
              m.mentor_id, 
              Mentor, 
              se.se_id, 
              SE, 
              Program;

          SELECT * FROM mentoring_session;
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

exports.getMentorshipCount = async () => {
  try {
    const query = `
            SELECT COUNT(DISTINCT m.mentor_id)
            FROM mentors m
            JOIN mentorships ms ON ms.mentor_id = m.mentor_id;
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

exports.getProgramCoordinatorsByMentorshipID = async (mentorship_id) => {
  try {
    const query = `
      SELECT DISTINCT pa.user_id, p.name AS program_name
      FROM mentorships AS ms
      JOIN socialenterprises AS s ON s.se_id = ms.se_id
      JOIN programs AS p ON p.program_id = s.program_id
      JOIN program_assignment AS pa ON pa.program_id = p.program_id
      WHERE ms.mentorship_id = $1;
    `;
    const result = await pgDatabase.query(query, [mentorship_id]);
    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching program coordinators by mentorship ID:", error);
    return [];
  }
};

exports.getSuggestedCollaborations = async (mentor_id, mentorship_id) => {
  try {
    const query = `
      WITH mentorship_traits AS (
        SELECT 
          m.mentorship_id,
          m.mentor_id,
          ec.category_name,
          ROUND(AVG(ec.rating), 2) AS avg_rating
        FROM mentorships m
        JOIN evaluations e ON e.se_id = m.se_id
        JOIN evaluation_categories ec ON ec.evaluation_id = e.evaluation_id
        GROUP BY m.mentorship_id, m.mentor_id, ec.category_name
      ),

      strengths AS (
        SELECT mentorship_id, mentor_id, category_name
        FROM mentorship_traits
        WHERE avg_rating > 3
      ),

      weaknesses AS (
        SELECT mentorship_id, mentor_id, category_name
        FROM mentorship_traits
        WHERE avg_rating < 3
      ),

      complementary_matches AS (
        SELECT 
          a.mentorship_id AS mentorship_a,
          a.mentor_id AS mentor_a,
          b.mentorship_id AS mentorship_b,
          b.mentor_id AS mentor_b,
          COUNT(*) AS match_count,
          ARRAY_AGG(a.category_name ORDER BY a.category_name) AS matched_categories,
          1 AS priority
        FROM weaknesses a
        JOIN strengths b 
          ON a.category_name = b.category_name
          AND a.mentorship_id <> b.mentorship_id
          AND a.mentor_id <> b.mentor_id
        GROUP BY a.mentorship_id, a.mentor_id, b.mentorship_id, b.mentor_id
      ),

      shared_strengths AS (
        SELECT 
          a.mentorship_id AS mentorship_a,
          a.mentor_id AS mentor_a,
          b.mentorship_id AS mentorship_b,
          b.mentor_id AS mentor_b,
          COUNT(*) AS match_count,
          ARRAY_AGG(a.category_name ORDER BY a.category_name) AS matched_categories,
          2 AS priority
        FROM strengths a
        JOIN strengths b 
          ON a.category_name = b.category_name
          AND a.mentorship_id <> b.mentorship_id
          AND a.mentor_id <> b.mentor_id
        GROUP BY a.mentorship_id, a.mentor_id, b.mentorship_id, b.mentor_id
      ),

      shared_weaknesses AS (
        SELECT 
          a.mentorship_id AS mentorship_a,
          a.mentor_id AS mentor_a,
          b.mentorship_id AS mentorship_b,
          b.mentor_id AS mentor_b,
          COUNT(*) AS match_count,
          ARRAY_AGG(a.category_name ORDER BY a.category_name) AS matched_categories,
          3 AS priority
        FROM weaknesses a
        JOIN weaknesses b 
          ON a.category_name = b.category_name
          AND a.mentorship_id <> b.mentorship_id
          AND a.mentor_id <> b.mentor_id
        GROUP BY a.mentorship_id, a.mentor_id, b.mentorship_id, b.mentor_id
      ),

      all_matches AS (
        SELECT * FROM complementary_matches
        UNION ALL
        SELECT * FROM shared_strengths
        UNION ALL
        SELECT * FROM shared_weaknesses
      ),

      ranked_recommendations AS (
        SELECT 
          am.priority,
          am.mentorship_a,
          mna.mentor_firstname || ' ' || mna.mentor_lastname AS mentor_a_name,
          am.mentorship_b,
          mnb.mentor_firstname || ' ' || mnb.mentor_lastname AS mentor_b_name,
          am.match_count,
          am.matched_categories,
          ROW_NUMBER() OVER (
            PARTITION BY am.mentorship_a, am.priority
            ORDER BY am.match_count DESC, mnb.mentor_firstname
          ) AS row_num
        FROM all_matches am
        JOIN mentorships ma ON ma.mentorship_id = am.mentorship_a
        JOIN mentors mna ON mna.mentor_id = ma.mentor_id
        JOIN mentorships mb ON mb.mentorship_id = am.mentorship_b
        JOIN mentors mnb ON mnb.mentor_id = mb.mentor_id
        WHERE ma.mentorship_id = $2
          AND NOT EXISTS (
            SELECT 1 FROM mentorship_collaborations mc
            WHERE mc.mentorship_id_1 = am.mentorship_a
              OR mc.mentorship_id_2 = am.mentorship_a
          )
          AND ma.mentor_id = $1
      ),

      fallback_options AS (
        SELECT 
          m.mentorship_id AS mentorship_b,
          mentors.mentor_firstname || ' ' || mentors.mentor_lastname AS mentor_b_name,
          4 AS priority
        FROM mentorships m
        JOIN mentors ON mentors.mentor_id = m.mentor_id
        WHERE m.mentorship_id <> $2
          AND m.mentorship_id NOT IN (
            SELECT mentorship_b 
            FROM ranked_recommendations
            WHERE row_num = 1
          )
          AND m.mentorship_id NOT IN (
            SELECT mentorship_id_2 
            FROM mentorship_collaborations 
            WHERE mentorship_id_1 = $2
            UNION
            SELECT mentorship_id_1 
            FROM mentorship_collaborations 
            WHERE mentorship_id_2 = $2
          )
          AND m.mentor_id <> $1
      )

      SELECT 
        rr.priority,
        rr.mentorship_a,
        rr.mentor_a_name,
        rr.mentorship_b,
        rr.mentor_b_name,
        se_b.team_name AS se_b_name,
        rr.match_count,
        rr.matched_categories
      FROM ranked_recommendations rr
      JOIN mentorships mb ON mb.mentorship_id = rr.mentorship_b
      JOIN socialenterprises se_b ON se_b.se_id = mb.se_id
      WHERE rr.row_num = 1

      UNION ALL

      SELECT 
        f.priority,
        $2 AS mentorship_a,
        (SELECT m.mentor_firstname || ' ' || m.mentor_lastname
        FROM mentorships ma
        JOIN mentors m ON m.mentor_id = ma.mentor_id
        WHERE ma.mentorship_id = $2
        ) AS mentor_a_name,
        f.mentorship_b,
        f.mentor_b_name,
        se_b.team_name AS se_b_name,
        0 AS match_count,
        ARRAY[]::text[] AS matched_categories
      FROM fallback_options f
      JOIN mentorships mb ON mb.mentorship_id = f.mentorship_b
      JOIN socialenterprises se_b ON se_b.se_id = mb.se_id

      ORDER BY priority;
    `;

    const result = await pgDatabase.query(query, [mentor_id, mentorship_id]);
    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching collaboration stats:", error);
    return [];
  }
};