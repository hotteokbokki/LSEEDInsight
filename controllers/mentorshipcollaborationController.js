const pgDatabase = require('../database.js');

// Inserts a collaboration request between two mentorships
exports.requestCollaborationInsert = async (mentorship_id_1, mentorship_id_2) => {
  try {
    const query = `
      INSERT INTO mentorship_collaborations (mentorship_id_1, mentorship_id_2)
      VALUES (
        LEAST($1::uuid, $2::uuid),
        GREATEST($1::uuid, $2::uuid)
      )
      ON CONFLICT DO NOTHING;
    `;

    await pgDatabase.query(query, [mentorship_id_1, mentorship_id_2]);
  } catch (error) {
    console.error("❌ Error inserting mentorship collaboration:", error);
    throw error;
  }
};
