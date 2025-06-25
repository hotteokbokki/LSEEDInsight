const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getMentorFormApplications = async () => {
  try {
    const query = `
      SELECT
        id,
        submitted_at AS date_applied,
        first_name,
        last_name,
        password,
        email,
        affiliation,
        motivation,
        expertise,
        business_areas,
        preferred_time,
        communication_mode,
        status,
        contact_no
      FROM
        mentor_form_application
      WHERE
        status = 'Pending'
      ORDER BY
        submitted_at DESC;
    `;

    const result = await pgDatabase.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching mentor form applications:", error);
    return [];
  }
};
