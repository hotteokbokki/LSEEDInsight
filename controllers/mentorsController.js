const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getMentorsBySocialEnterprises = async (se_id) => {
  try {
    console.log(`Fetching mentors for social enterprise ID: ${se_id}`);

    // Query to get mentors by social enterprise ID
    const query = `SELECT "mentor_id", "mentor_firstName", "mentor_lastName" FROM "mentors" WHERE "se_id" = $1`;
const values = [se_id];  // Correctly passing se_id


    const result = await pgDatabase.query(query, values);

    if (!result.rows.length) {
      return [];
    }

    // Map the results correctly
    return result.rows.map(mentor => ({
      text: `${mentor.mentor_firstName} ${mentor.mentor_lastName}`, // Fix: Properly format mentor name
      callback_data: `mentor_${mentor.mentor_id}`
    }));
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return [];
  }
};

exports.getMentorById = async (mentor_id) => {
  try {
    console.log(`Fetching mentor by ID: ${mentor_id}`);

    const query = `SELECT "mentor_id", "mentor_firstName", "mentor_lastName" FROM "mentors" WHERE "mentor_id" = $1`;
    const values = [mentor_id];

    const result = await pgDatabase.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error fetching mentor by ID:", error);
    return null;
  }
};
