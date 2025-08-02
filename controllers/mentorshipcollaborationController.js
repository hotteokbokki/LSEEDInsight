const pgDatabase = require('../database.js');

// Fetches existing collaborations based on the new table structure
exports.getExistingCollaborations = async (user_id) => {
  try {
    const query = `
      SELECT
        mc.collaboration_id,
        mc.created_at,
        mc.status AS is_active,

        -- Collaborating SE info (the SE not owned by the current mentor)
        CASE
          WHEN s.mentor_id = $1 THEN sce.team_name
          ELSE se.team_name
        END AS collaborating_se_name,

        CASE
          WHEN s.mentor_id = $1 THEN sce.se_id
          ELSE se.se_id
        END AS collaborating_se_id,

        -- Collaborating mentor info (not the logged-in mentor)
        CASE
          WHEN s.mentor_id = $1 THEN CONCAT(sc_mentor.mentor_firstname, ' ', sc_mentor.mentor_lastname)
          ELSE CONCAT(s_mentor.mentor_firstname, ' ', s_mentor.mentor_lastname)
        END AS collaborating_mentor_name

      FROM mentorship_collaborations mc
      -- Join on seeking and suggested mentorships
      JOIN mentorships s ON mc.seeking_collaboration_mentorship_id = s.mentorship_id
      JOIN mentorships sc ON mc.suggested_collaborator_mentorship_id = sc.mentorship_id

      -- Join to SEs
      JOIN socialenterprises se ON s.se_id = se.se_id
      JOIN socialenterprises sce ON sc.se_id = sce.se_id

      -- Join to mentors
      JOIN mentors s_mentor ON s.mentor_id = s_mentor.mentor_id
      JOIN mentors sc_mentor ON sc.mentor_id = sc_mentor.mentor_id

      -- Filter by current mentor ID
      WHERE s.mentor_id = $1 OR sc.mentor_id = $1
      ORDER BY mc.created_at DESC;
    `;

    const result = await pgDatabase.query(query, [user_id]);
    return result.rows;
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
        created_at,

        -- Collaborating SE: the one that initiated the request
        seeking_collaboration_se_name,
        seeking_collaboration_se_abbreviation

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

exports.getCollaborationRequestDetails = async (mentorship_collaboration_request_id) => {
  try {
    const query = `
      SELECT
        mentorship_collaboration_request_id,
        tier,
        created_at,
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
        subtier
      FROM mentorship_collaboration_requests
      WHERE mentorship_collaboration_request_id = $1
    `;

    const result = await pgDatabase.query(query, [mentorship_collaboration_request_id]);
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
      collaborationCardId,
      subtier,
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
        suggested_collaboration_mentor_id,
        collaboration_card_id,
        subtier
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16
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
      collaborationCardId,
      subtier,
    ]);
  } catch (error) {
    console.error("❌ Error inserting mentorship collaboration request:", error);
    throw error;
  }
};