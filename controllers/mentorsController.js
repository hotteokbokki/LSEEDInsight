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
    const query = `
      SELECT 
        m.mentor_id,
        m.mentor_firstName,
        m.mentor_lastName,
        m.email,
        m.contactNum,
        COUNT(ms.mentor_id) AS number_SE_assigned,
        STRING_AGG(se.team_name, '||') AS assigned_se_names
      FROM 
        mentors m
      LEFT JOIN 
        mentorships ms ON ms.mentor_id = m.mentor_id
      LEFT JOIN 
        socialenterprises se ON se.se_id = ms.se_id
      GROUP BY 
        m.mentor_id, m.mentor_firstName, m.mentor_lastName, m.email, m.contactNum;
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
      assigned_se_names: mentor.assigned_se_names || "", // Include the SE names here
    }));
  } catch (error) {
    console.error("❌ Error fetching all mentors:", error);
    return [];
  }
};

exports.getUnassignedMentors = async () => {
  try {
      const query = `
            SELECT COUNT(*) FROM mentors m
            LEFT JOIN mentorships ms ON m.mentor_id = ms.mentor_id AND ms.status = 'Active'
            WHERE ms.mentor_id IS NULL AND m.isactive = true;
      `;

      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching unassigned mentors:", error);
      return [];
  }
};

exports.getPreviousUnassignedMentors = async () => {
  try {
      const query = `
            SELECT COUNT(*) FROM mentors m
            LEFT JOIN mentorships ms ON m.mentor_id = ms.mentor_id AND ms.status = 'Active'
            WHERE ms.mentor_id IS NULL AND m.isactive = true
            AND m.mentor_id NOT IN (
              SELECT mentor_id FROM mentorships 
              WHERE start_date >= NOW() - INTERVAL '7 days'
            )
      `;
      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching unassigned mentors from the previous week:", error);
      return [];
  }
};

// exports.getAssignedMentors = async () => {
//   try {
//       const query = `
//           SELECT COUNT(DISTINCT m.mentor_id) FROM mentors m
//           JOIN mentorships ms ON m.mentor_id = ms.mentor_id 
//           WHERE ms.status = 'Active' AND m.isactive = true
//       `;
//       const result = await pgDatabase.query(query);
//       return result.rows;
//   } catch (error) {
//       console.error("❌ Error fetching assigned mentors:", error);
//       return [];
//   }
// };

exports.getMentorCount = async (program = null) => {
  try {
      let programFilter = program ? `WHERE p.name = '${program}'` : '';

      const query = `
          SELECT COUNT(DISTINCT m.mentor_id)
          FROM mentors AS m
          JOIN mentorships AS ms ON ms.mentor_id = m.mentor_id
          JOIN socialenterprises AS s ON s.se_id = ms.se_id
          JOIN programs AS p ON p.program_id = s.program_id
          ${programFilter};
      `;

      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching assigned mentors:", error);
      return [];
  }
};

exports.getWithoutMentorshipCount = async (program = null) => {
  try {
      let programFilter = program ? `AND p.name = '${program}'` : '';

      const query = `
          SELECT COUNT(*) 
          FROM mentors AS m
          JOIN mentorships AS ms ON ms.mentor_id = m.mentor_id
          JOIN socialenterprises AS s ON s.se_id = ms.se_id
          JOIN programs AS p ON p.program_id = s.program_id
          WHERE m.mentor_id NOT IN (SELECT DISTINCT m.mentor_id FROM mentorships)          
          ${programFilter};
      `;
      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching assigned mentors:", error);
      return [];
  }
};

exports.getMentorDetails = async (mentor_id) => {
  try {
      const query = `
          SELECT 
              m.mentor_id,
              m.mentor_firstname,
              m.mentor_lastname,
              m."number_SE_assigned",
              m.email,
              m.contactnum,
              m.isactive
          FROM mentors m
          WHERE m.mentor_id = $1;
      `;
      const values = [mentor_id];
      const result = await pgDatabase.query(query, values);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching assigned mentors:", error);
      return [];
  }
};

exports.getMostAssignedMentor = async () => {
  try {
      const query = `
          SELECT 
              m.mentor_id,
              m.mentor_firstname,
              m.mentor_lastname,
              COUNT(ms.se_id) AS num_assigned_se
          FROM 
              public.mentors m
          JOIN 
              public.mentorships ms ON m.mentor_id = ms.mentor_id
          WHERE 
              ms.status = 'Active'
          GROUP BY 
              m.mentor_id
          ORDER BY 
              num_assigned_se DESC
          LIMIT 1;
      `;
      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching assigned mentors:", error);
      return [];
  }
};

exports.getLeastAssignedMentor = async () => {
  try {
      const query = `
          SELECT 
              m.mentor_id,
              m.mentor_firstname,
              m.mentor_lastname,
              COUNT(ms.se_id) AS num_assigned_se
          FROM 
              public.mentors m
          JOIN 
              public.mentorships ms ON m.mentor_id = ms.mentor_id
          WHERE 
              ms.status = 'Active'
          GROUP BY 
              m.mentor_id
          ORDER BY 
              num_assigned_se ASC
          LIMIT 1;
      `;
      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching assigned mentors:", error);
      return [];
  }
};