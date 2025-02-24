const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getMentorsBySocialEnterprises = async (se_id) => {
  try {
    console.log(`Fetching mentors for social enterprise ID: ${se_id}`);

    // ✅ Fix: Use ANY() to match UUID in an array column
    const query = `
      SELECT "mentor_id", "mentor_firstName", "mentor_lastName"
      FROM "mentors"
      WHERE $1 = ANY("se_id")`;  // ✅ Correctly match UUID in an array

    const values = [se_id];

    const result = await pgDatabase.query(query, values);

    if (!result.rows.length) {
      console.log("⚠️ No mentors found for SE ID:", se_id);
      return [];
    }

    // ✅ Map results correctly
    return result.rows.map(mentor => ({
      name: `${mentor.mentor_firstName} ${mentor.mentor_lastName}`,
      mentor_id: `${mentor.mentor_id}`
    }));
  } catch (error) {
    console.error("❌ Error fetching mentors:", error);
    return [];
  }
};

exports.getMentorById = async (mentor_id) => {
  try {
    console.log(`Fetching mentor by ID: ${mentor_id}`);

    const query = `SELECT "mentor_id", "mentor_firstname", "mentor_lastname" FROM "mentors" WHERE "mentor_id" = $1`;
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

exports.getActiveMentors = async () => {
  try {
    console.log("Fetching active mentors...");
    const query = `
      SELECT "mentor_id", "mentor_firstname", "mentor_lastname"
      FROM "mentors"
      WHERE "isactive" = true
    `;
    const result = await pgDatabase.query(query);
    if (!result.rows.length) {
      console.log("⚠️ No active mentors found");
      return [];
    }
    // Map results to a format suitable for the frontend
    return result.rows.map(mentor => ({
      id: mentor.mentor_id,
      name: `${mentor.mentor_firstname} ${mentor.mentor_lastname}`,
    }));
  } catch (error) {
    console.error("❌ Error fetching active mentors:", error);
    return [];
  }
};

exports.getAllMentors = async () => {
  try {
    console.log("Fetching all mentors...");

    const query = `
      SELECT mentor_id, mentor_firstName, mentor_lastName, email, contactNum,
        (SELECT COUNT(*) FROM mentorships WHERE mentor_id = mentors.mentor_id) AS number_SE_assigned
      FROM mentors
    `;

    const result = await pgDatabase.query(query);

    if (!result.rows.length) {
      console.log("⚠️ No mentors found.");
      return [];
    }

    return result.rows.map(mentor => ({
      mentor_id: mentor.mentor_id,
      mentor_firstName: mentor.mentor_firstname,
      mentor_lastName: mentor.mentor_lastname,
      email: mentor.email,
      contactNum: mentor.contactnum,
      number_SE_assigned: mentor.number_se_assigned || 0,
    }));
  } catch (error) {
    console.error("❌ Error fetching all mentors:", error);
    return [];
  }
};
