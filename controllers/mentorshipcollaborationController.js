const pgDatabase = require('../database.js');

// Fetches existing collaborations
exports.getExistingCollaborations = async (user_id) => {
  try {
    const query = `
      SELECT
        mc.collaboration_id,
        mc.created_at,
        mc.status AS is_active,

        -- Collaborating SE name and ID (the one NOT owned by the given mentor)
        CASE
          WHEN m1.mentor_id = $1 THEN se2.team_name
          ELSE se1.team_name
        END AS collaborating_se_name,

        CASE
          WHEN m1.mentor_id = $1 THEN se2.se_id
          ELSE se1.se_id
        END AS collaborating_se_id,

        -- Collaborating mentor's name (from mentors table)
        CASE
          WHEN m1.mentor_id = $1 THEN CONCAT(m2_mentor.mentor_firstname, ' ', m2_mentor.mentor_lastname)
          ELSE CONCAT(m1_mentor.mentor_firstname, ' ', m1_mentor.mentor_lastname)
        END AS collaborating_mentor_name

      FROM mentorship_collaborations mc
      JOIN mentorships m1 ON mc.mentorship_id_1 = m1.mentorship_id
      JOIN mentorships m2 ON mc.mentorship_id_2 = m2.mentorship_id

      JOIN socialenterprises se1 ON m1.se_id = se1.se_id
      JOIN socialenterprises se2 ON m2.se_id = se2.se_id

      JOIN mentors m1_mentor ON m1.mentor_id = m1_mentor.mentor_id
      JOIN mentors m2_mentor ON m2.mentor_id = m2_mentor.mentor_id

      WHERE m1.mentor_id = $1 OR m2.mentor_id = $1
      ORDER BY mc.created_at DESC;
    `;

    const result = await pgDatabase.query(query, [user_id]);
    return result.rows; // ✅ Return the data!
  } catch (error) {
    console.error("❌ Error fetching mentorship collaborations:", error);
    throw error;
  }
};

exports.getCollaborationRequests = async (mentor_id) => {
  try {
    const query = `
      SELECT
        mentorship_collaboration_request_id,
        tier,
        created_at,

        -- Collaborating SE: the one that initiated the request
        seeking_collaboration_mentor_name,
        seeking_collaboration_se_name,
        seeking_collaboration_se_abbreviation,

        -- Your SE: the mentorship by the suggested mentor
        suggested_collaboration_mentor_name,
        suggested_collaboration_se_name,
        suggested_collaboration_se_abbreviation,

        matched_categories,
        seeking_collaboration_se_strengths,
        seeking_collaboration_se_weaknesses,
        suggested_collaboration_se_strengths,
        suggested_collaboration_se_weaknesses

      FROM mentorship_collaboration_requests
      WHERE suggested_collaboration_mentor_id = $1
      ORDER BY created_at DESC;
    `;

    const result = await pgDatabase.query(query, [mentor_id]);
    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching collaboration requests for mentor:", error);
    throw error;
  }
};

//TODO: MAYBE NEED
// Inserts a collaboration request between two mentorships
exports.insertCollaboration = async (mentorship_id_1, mentorship_id_2, tier_id) => {
  try {
    const query = `
      INSERT INTO mentorship_collaborations (mentorship_id_1, mentorship_id_2, tier_id)
      VALUES (
        LEAST($1::uuid, $2::uuid),
        GREATEST($1::uuid, $2::uuid),
        $3
      )
      ON CONFLICT DO NOTHING;
    `;

    await pgDatabase.query(query, [mentorship_id_1, mentorship_id_2, tier_id]);
  } catch (error) {
    console.error("❌ Error inserting mentorship collaboration:", error);
    throw error;
  }
};

exports.requestCollaborationInsert = async (collaboration) => {
  try {
    const {
      tier,
      seeking_collaboration_mentor_name,
      seeking_collaboration_se_name,
      seeking_collaboration_se_abbreviation,
      suggested_collaboration_mentor_name,
      suggested_collaboration_se_name,
      suggested_collaboration_se_abbreviation,
      matched_categories,
      seeking_collaboration_se_strengths,
      seeking_collaboration_se_weaknesses,
      suggested_collaboration_se_strengths,
      suggested_collaboration_se_weaknesses,
      created_at,
      suggested_collaboration_mentor_id,
    } = collaboration;

    const query = `
      INSERT INTO mentorship_collaboration_requests (
        tier,
        seeking_collaboration_mentor_name,
        seeking_collaboration_se_name,
        seeking_collaboration_se_abbreviation,
        suggested_collaboration_mentor_name,
        suggested_collaboration_se_name,
        suggested_collaboration_se_abbreviation,
        matched_categories,
        seeking_collaboration_se_strengths,
        seeking_collaboration_se_weaknesses,
        suggested_collaboration_se_strengths,
        suggested_collaboration_se_weaknesses,
        created_at,
        suggested_collaboration_mentor_id
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13, $14
      )
    `;

    await pgDatabase.query(query, [
      tier,
      seeking_collaboration_mentor_name,
      seeking_collaboration_se_name,
      seeking_collaboration_se_abbreviation,
      suggested_collaboration_mentor_name,
      suggested_collaboration_se_name,
      suggested_collaboration_se_abbreviation,
      matched_categories,
      seeking_collaboration_se_strengths,
      seeking_collaboration_se_weaknesses,
      suggested_collaboration_se_strengths,
      suggested_collaboration_se_weaknesses,
      created_at,
      suggested_collaboration_mentor_id,
    ]);
  } catch (error) {
    console.error("❌ Error inserting mentorship collaboration request:", error);
    throw error;
  }
};