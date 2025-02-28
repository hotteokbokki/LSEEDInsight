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
    console.log(`🔍 Fetching social enterprise with ID: ${se_id}`);

    // Query to get a social enterprise by se_id
    const query = 'SELECT * FROM "socialenterprises" WHERE "se_id" = $1';
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
    const res = await pgDatabase.query('SELECT * FROM socialenterprises');
    
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

exports.getAllSocialEnterprisesWithMentorship = async () => {
  try {
      const query = `
      SELECT 
          se.se_id, 
          se.team_name, 
          p.name AS program_name, -- ✅ Fetch program name
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
      GROUP BY se.se_id, se.team_name, p.name;
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

exports.getTotalSECount = async () => {
  try {
      const query = `
        SELECT COUNT(*) FROM socialenterprises
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
      name, // team_name
      sdg_name, // Expecting SDG name
      contactnum,
      program_name, // Expecting program name
      isactive, // Expecting a boolean
      abbr = null, // Default to null if not provided
      number_of_members = 0, // Default to 0 if not provided
    } = socialEnterpriseData;

    // Fetch SDG ID from the database
    const sdgQuery = 'SELECT id FROM sdg WHERE name = $1';
    const sdgResult = await pgDatabase.query(sdgQuery, [sdg_name]);
    if (sdgResult.rows.length === 0) {
      throw new Error(`SDG not found for name: ${sdg_name}`);
    }
    const sdg_id = sdgResult.rows[0].id;

    // Fetch Program ID from the database
    const programQuery = 'SELECT program_id FROM programs WHERE name = $1';
    const programResult = await pgDatabase.query(programQuery, [program_name]);
    if (programResult.rows.length === 0) {
      throw new Error(`Program not found for name: ${program_name}`);
    }
    const program_id = programResult.rows[0].id;

    // Insert into the socialenterprises table
    const query = `
      INSERT INTO socialenterprises (
        team_name,
        sdg_id,
        contactnum,
        program_id,
        isactive,
        abbr,
        numMember
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING se_id; // Use the correct primary key column name
    `;
    const values = [
      name,
      sdg_id,
      contactnum,
      program_id,
      isactive, // Directly use the boolean value
      abbr,
      number_of_members,
    ];

    const result = await pgDatabase.query(query, values);
    const se_id = result.rows[0].se_id; // Extract the se_id from the result

    return { se_id }; // Return the se_id to the caller
  } catch (error) {
    console.error("Error adding social enterprise:", error);
    throw error;
  }
};

exports.getPreviousTotalSECount = async () => {
  try {
      const query = `
        SELECT COUNT(*) AS count 
        FROM socialenterprises 
        WHERE created_at < NOW() - INTERVAL '1 month';
      `;
      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching se count:", error);
      return [];
  }
};

exports.getSEWithOutMentors = async () => {
  try {
      const query = `
          SELECT COUNT(*) AS total_se_without_mentors
          FROM socialenterprises 
          WHERE se_id NOT IN (
              SELECT DISTINCT se_id FROM mentorships WHERE status = 'Active'
          );
      `;

      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching mentorships", error);
      return []; // Return an empty array in case of an error
  }
};