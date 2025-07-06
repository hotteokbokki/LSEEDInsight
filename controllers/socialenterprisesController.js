const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getSocialEnterprisesByProgram = async (programId) => {
  try {
    // Query to get social enterprises by program_id
    const query = ` SELECT DISTINCT ON (se.se_id) 
                        se.se_id, 
                        se.team_name, 
                        se.abbr
                    FROM SocialEnterprises se
                    INNER JOIN Mentorships m ON se.se_id = m.se_id
                    WHERE se.program_id = $1`;
    const values = [programId];

    const result = await pgDatabase.query(query, values);

    // If no social enterprises are found, return an empty array
    if (!result.rows.length) {
      return [];
    }

    // Map the results to the desired format
    return result.rows.map(se => ({
      text: se.team_name, 
      abbr: se.abbr,
      callback_data: `enterprise_${se.se_id}`
    }));
  } catch (error) {
    console.error("Error fetching Social Enterprises:", error);
    return [];
  }
};

exports.getSocialEnterpriseByID = async (se_id) => {
  try {
    // Query to get a social enterprise by se_id
    const query = 'SELECT * FROM socialenterprises WHERE se_id = $1';
    const values = [se_id];

    const result = await pgDatabase.query(query, values);

    // If no matching social enterprise is found, return null
    if (!result.rows.length) {
      console.log(`⚠️ No social enterprise found for ID: ${se_id}`);
      return null;
    }

    return result.rows[0]; // Return the first (and only) matching row
  } catch (error) {
    console.error("❌ Error fetching social enterprise:", error);
    return null;
  }
};

exports.getAllSocialEnterprises = async () => {
  try {
    const res = await pgDatabase.query(`
      SELECT 
        se.se_id,
        se.team_name,
        se.abbr,
        se.description,
        se.accepted_application_id,
        array_agg(CONCAT('SDG ', sdg.sdg_number, ': ', sdg.name)) AS sdgs
      FROM socialenterprises se
      JOIN sdg ON sdg.sdg_id = ANY(se.sdg_id)
      GROUP BY se.se_id, se.team_name, se.abbr, se.description;
    `);

    if (!res.rows || res.rows.length === 0) {
      console.error("No SE found");
      return null; // or return []
    }

    return res.rows;
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    return null;
  }
};

exports.getAcceptedApplications = async (id) => {
  try {
    const res = await pgDatabase.query(`
      SELECT
        id AS application_id,
        team_name,
        se_abbreviation AS abbr,
        se_description AS description,
        "timestamp" AS submitted_at,
        enterprise_idea_start,
        social_problem,
        se_nature,
        team_characteristics,
        team_challenges,
        critical_areas,
        action_plans,
        pitch_deck_url,
        focal_email,
        focal_phone,
        focal_person_contact,
        social_media_link,
        mentoring_team_members,
        preferred_mentoring_time,
        mentoring_time_note,
        meeting_frequency,
        communication_modes
      FROM mentees_form_submissions
      WHERE id = $1 AND status = 'Accepted'
    `, [id]);

    if (!res.rows || res.rows.length === 0) {
      return null;
    }

    return res.rows[0];
  } catch (error) {
    console.error("Error fetching application by ID:", error);
    throw error;
  }
};


exports.getAllSocialEnterprisesForComparison = async (program = null) => {
  try {
    let programFilter = program ? `WHERE p.name = '${program}'` : '';
    
    // Query to get a social enterprise by se_id
    const query = `
        SELECT DISTINCT se.*
        FROM socialenterprises se
        JOIN evaluations e ON se.se_id = e.se_id
        JOIN programs p ON p.program_id = se.program_id
        ${programFilter};
        `;
    const res = await pgDatabase.query(query);
    
    if (!res.rows || res.rows.length === 0) {
      console.error("No SE found");
      return null; // or return an empty array []
    }

    return res.rows; // return the list of users
  } catch (error) {
    console.error("Error fetching user:", error);
    return null; // or handle error more gracefully
  }
};

exports.getFlaggedSEs = async (program = null) => {
  try {
    let programFilter = program ? ` AND p.name = '${program}'` : '';

    // Query to get a social enterprise by se_id
    const query = `
       WITH recent_evaluations AS (
          SELECT 
              e.se_id,  
              AVG(ec.rating) AS avg_rating
          FROM evaluation_categories ec
          JOIN evaluations e ON ec.evaluation_id = e.evaluation_id
          JOIN socialenterprises s ON s.se_id = e.se_id
          JOIN programs p ON p.program_id = s.program_id
          WHERE e.evaluation_type = 'Social Enterprise'
           ${programFilter}
          GROUP BY e.se_id
      )

      SELECT 
          se.se_id,
          TRIM(se.team_name) AS team_name,
          TRIM(COALESCE(se.abbr, se.team_name)) AS abbr,
          COALESCE(ROUND(re.avg_rating, 2), 0) AS avg_rating,
          CASE 
              WHEN re.avg_rating IS NULL THEN 'No Evaluations'
              ELSE 'Evaluated'
          END AS evaluation_status
      FROM socialenterprises se
      JOIN programs p ON p.program_id = se.program_id  -- ✅ Include programs in outer query
      LEFT JOIN recent_evaluations re ON se.se_id = re.se_id
      WHERE (re.avg_rating < 1.5 OR re.avg_rating IS NULL)
        ${programFilter}  -- ✅ Ensure SEs belong to the same program
      ORDER BY avg_rating ASC, evaluation_status DESC;
        `;
    const res = await pgDatabase.query(query);
    
    if (!res.rows || res.rows.length === 0) {
      console.error("No SE found");
      return null; // or return an empty array []
    }

    return res.rows; // return the list of users
  } catch (error) {
    console.error("Error fetching user:", error);
    return null; // or handle error more gracefully
  }
};

exports.getAllSocialEnterpriseswithMentorID = async (mentor_id) => {
  try {
      const query = `
        SELECT 
            se.se_id, 
            se.team_name, 
            p.name AS program_name, 
            se.contactnum,
            COALESCE(
                JSON_AGG(
                    CASE 
                        WHEN m.mentor_id IS NOT NULL 
                        THEN JSON_BUILD_OBJECT(
                            'mentor_id', m.mentor_id,
                            'mentor_name', CONCAT(m.mentor_firstname, ' ', m.mentor_lastname)
                        ) 
                        ELSE NULL 
                    END
                ) FILTER (WHERE m.mentor_id IS NOT NULL), 
                '[]'
            ) AS mentors
        FROM socialenterprises AS se
        LEFT JOIN mentorships AS ms ON se.se_id = ms.se_id
        LEFT JOIN mentors AS m ON ms.mentor_id = m.mentor_id
        LEFT JOIN programs AS p ON se.program_id = p.program_id -- ✅ Join with programs table
        WHERE m.mentor_id = $1 -- 🔍 Filter by a specific mentor
        GROUP BY se.se_id, se.team_name, p.name;
      `;
      const values = [mentor_id];

      const result = await pgDatabase.query(query, values);
      return result.rows.length ? result.rows : [];
  } catch (error) {
      console.error("❌ Error fetching social enterprises with mentorship info:", error);
      return [];
  }
};

exports.getAllSocialEnterprisesWithMentorship = async (program = null) => {
  try {
      let programFilter = program ? `WHERE p.name = '${program}'` : '';

      const query = `
      SELECT 
          se.se_id, 
          se.team_name, 
          p.name AS program_name,
          se.contactnum,
          COALESCE(
              JSON_AGG(
                  CASE 
                      WHEN m.mentor_id IS NOT NULL 
                      THEN JSON_BUILD_OBJECT(
                          'mentor_id', m.mentor_id,
                          'mentor_name', CONCAT(m.mentor_firstname, ' ', m.mentor_lastname)
                      ) 
                      ELSE NULL 
                  END
              ) FILTER (WHERE m.mentor_id IS NOT NULL), 
              '[]'
          ) AS mentors
      FROM socialenterprises AS se
      LEFT JOIN mentorships AS ms ON se.se_id = ms.se_id
      LEFT JOIN mentors AS m ON ms.mentor_id = m.mentor_id
      LEFT JOIN programs AS p ON se.program_id = p.program_id -- ✅ Join with programs table
      ${programFilter}
      GROUP BY se.se_id, se.team_name, p.name
      `;
      const result = await pgDatabase.query(query);
      return result.rows.length ? result.rows : [];
  } catch (error) {
      console.error("❌ Error fetching social enterprises with mentorship info:", error);
      return [];
  }
};



exports.getSocialEnterprisesWithoutMentor = async () => {
  try {
    const query = `
      SELECT 
          se.se_id, 
          se.team_name
      FROM socialenterprises AS se
      LEFT JOIN mentorships AS ms ON se.se_id = ms.se_id
      WHERE ms.se_id IS NULL
    `;
    const result = await pgDatabase.query(query);
    return result.rows.length ? result.rows : [];
  } catch (error) {
    console.error("❌ Error fetching social enterprises without mentors:", error);
    return [];
  }
};

exports.updateSERowUpdate = async (se_id, updatedData) => {
  try {
    const { name, program_name, mentorshipStatus, mentors } = updatedData;
    console.log("[ctrl] updatingSE: ", se_id, "\n Data: ", updatedData);

    // Update the social enterprise name and program
    const updateSEQuery = `
      UPDATE socialenterprises
      SET team_name = $1
      WHERE se_id = $2
      RETURNING *;
    `;
    await pgDatabase.query(updateSEQuery, [name, se_id]);

    console.log("updatedData.mentors: ", updatedData.mentors);

    // Proceed only if there are mentors
    if (updatedData.mentors.toLowerCase() !== 'no mentors') {
      // Remove existing mentorships for this SE
      const deleteMentorshipQuery = `DELETE FROM mentorships WHERE se_id = $1;`;
      await pgDatabase.query(deleteMentorshipQuery, [se_id]);

      const selectMentorQuery = `
          SELECT mentor_id 
          FROM mentors 
          WHERE CONCAT(mentor_firstname, ' ', mentor_lastname) = $1;
      `;
      const selectedMentors = await pgDatabase.query(selectMentorQuery, [updatedData.mentors]);

      // console.log("updatedData.mentors: ", updatedData.mentors); // Debugging purposes only
      // console.log("selectedMentors: ", selectedMentors.rows[0]?.mentor_id, "rowCount: ", selectedMentors.rowCount); // Debugging purposes only

      // // Add new mentorships if there are mentors
      const mentorNamesArray = Array.isArray(mentors) ? mentors : [mentors];
      if (selectedMentors.rowCount > 0) {
          const mentorInsertQuery = `
              INSERT INTO mentorships (se_id, mentor_id)
              SELECT $1, mentor_id FROM mentors WHERE CONCAT(mentor_firstname, ' ', mentor_lastname) = ANY($2::text[]);
          `;
          await pgDatabase.query(mentorInsertQuery, [se_id, mentorNamesArray]);
      }
      console.log("[updateSERowUpdate] You have updated the mentorships table.")
    }
    
    return { success: true, message: "Social Enterprise updated successfully" };
  } catch (error) {
    console.error("❌ Error updating Social Enterprise:", error);
    return { success: false, message: "Failed to update Social Enterprise" };
  }
};

exports.updateSocialEnterpriseStatus = async (se_id, isActive) => {
  try {
    const query = `
      UPDATE socialenterprises
      SET isactive = $1
      WHERE se_id = $2
      RETURNING *;
    `;
    const result = await pgDatabase.query(query, [isActive, se_id]);
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error updating social enterprise status:", error);
    throw error;
  }
};

exports.getTotalSECount = async (program = null) => {
  try {
      let programFilter = program ? `WHERE p.name = '${program}'` : '';

      const query = `
        SELECT COUNT(*) FROM socialenterprises AS s
        JOIN programs AS p ON p.program_id = s.program_id
        ${programFilter}
      `;

      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching se count:", error);
      return [];
  }
};

exports.addSocialEnterprise = async (socialEnterpriseData) => {
  try {
    const {
      name,
      sdg_ids,
      contactnum,
      program_id,
      isactive,
      abbr = null,
      number_of_members = 0,
      criticalAreas = [],
      description,
      preferred_mentoring_time = [],
      mentoring_time_note,
      accepted_application_id,
    } = socialEnterpriseData;

    if (!sdg_ids || !Array.isArray(sdg_ids) || sdg_ids.length === 0) {
      throw new Error("At least one SDG ID is required.");
    }
    if (!program_id) {
      throw new Error("Program ID is required but missing.");
    }

    const formatted_sdg_ids = `{${sdg_ids.join(",")}}`;

    const query = `
      INSERT INTO socialenterprises (
        team_name,
        sdg_id,
        contactnum,
        program_id,
        isactive,
        abbr,
        numMember,
        critical_areas,
        description,
        preferred_mentoring_time,
        mentoring_time_note,
        accepted_application_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING se_id;
    `;

    const values = [
      name,
      formatted_sdg_ids,
      contactnum,
      program_id,
      isactive,
      abbr,
      number_of_members,
      criticalAreas,
      description,
      preferred_mentoring_time,
      mentoring_time_note,
      accepted_application_id
    ];

    const result = await pgDatabase.query(query, values);
    const se_id = result.rows[0].se_id;

    return { se_id };
  } catch (error) {
    console.error("Error adding social enterprise:", error);
    throw error;
  }
};

exports.getPreviousTotalSECount = async (program = null) => {
  try {
      let programFilter = program ? `AND p.name = '${program}'` : '';

      const query = `
        SELECT COUNT(*) AS count 
        FROM socialenterprises AS s
        JOIN programs AS p ON p.program_id = s.program_id
        WHERE s.created_at < NOW() - INTERVAL '1 month'
        ${programFilter};
      `;
      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching se count:", error);
      return [];
  }
};

exports.getSEWithOutMentors = async (program = null) => {
  try {
      let programFilter = program ? `AND p.name = '${program}'` : '';

      const query = `
          SELECT COUNT(*) AS total_se_without_mentors
          FROM socialenterprises AS s
          JOIN programs AS p ON p.program_id = s.program_id
              WHERE s.se_id NOT IN (
                  SELECT DISTINCT se_id FROM mentorships WHERE status = 'Active'
              )
          ${programFilter};
      `;

      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching mentorships", error);
      return []; // Return an empty array in case of an error
  }
};

exports.getAreasOfFocus = async (se_id) => {
  try {
    const query = `
      SELECT unnest(critical_areas) AS area
      FROM socialenterprises
      WHERE se_id = $1;
    `;
    const values = [se_id];

    const result = await pgDatabase.query(query, values);
    return result.rows.map(row => row.area);
  } catch (error) {
    console.error("Error fetching areas of focus:", error);
    return null;
  }
};

exports.getSuggestedMentors = async (se_id) => {
  try {
    const query = `
      WITH se_areas AS (
        SELECT critical_areas
        FROM socialenterprises
        WHERE se_id = $1
      ),
      mentor_matches AS (
        SELECT
          m.mentor_id,
          m.mentor_firstname,
          m.mentor_lastname,
          m.critical_areas,
          m.is_available_for_assignment,  -- Include toggle column here
          ARRAY(
            SELECT UNNEST(m.critical_areas)
            INTERSECT
            SELECT UNNEST(se_areas.critical_areas)
          ) AS matched_areas,
          COALESCE(cardinality(
            ARRAY(
              SELECT UNNEST(m.critical_areas)
              INTERSECT
              SELECT UNNEST(se_areas.critical_areas)
            )
          ), 0) AS match_count,
          cardinality(se_areas.critical_areas) AS total_se_areas
        FROM mentors m, se_areas
      ),
      ranked_mentors AS (
        SELECT *,
          CASE
            WHEN match_count = total_se_areas AND total_se_areas > 0 THEN 3  -- Top match
            WHEN match_count >= CEIL(total_se_areas * 0.5) THEN 2           -- Good match
            ELSE 1                                                          -- Weak match
          END AS match_rank
        FROM mentor_matches
      )
      SELECT jsonb_build_object(
        'suggested', jsonb_agg(to_jsonb(ranked_mentors) ORDER BY match_rank DESC, match_count DESC)
          FILTER (WHERE match_rank > 1),
        'others', jsonb_agg(to_jsonb(ranked_mentors))
          FILTER (WHERE match_rank = 1)
      ) AS result
      FROM ranked_mentors;
    `;

    const result = await pgDatabase.query(query, [se_id]);

    // ✅ Correctly extract the JSON object from the result
    return result.rows[0]?.result || { suggested: [], others: [] };
  } catch (error) {
    console.error("❌ Error fetching mentor suggestions:", error);
    return { suggested: [], others: [] };
  }
};