const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getPrograms = async () => {
  try {
    const query = ` 
      SELECT DISTINCT 
          p.program_id, 
          p.name AS program_name,
          ARRAY_AGG(DISTINCT mtr.mentor_id) AS mentor_ids,
          ARRAY_AGG(DISTINCT mtr.mentor_firstname || ' ' || mtr.mentor_lastname) AS mentor_names
      FROM 
          programs p
      INNER JOIN 
          socialenterprises se ON p.program_id = se.program_id
      INNER JOIN 
          mentorships m ON se.se_id = m.se_id
      INNER JOIN 
          mentors mtr ON m.mentor_id = mtr.mentor_id
      GROUP BY 
          p.program_id, p.name;
    `;

    const result = await pgDatabase.query(query);

    if (!result.rows.length) {
      return [];
    }

    return result.rows.map(program => ({
      id: program.program_id, // Program ID
      name: program.program_name, // Program Name
      mentors: program.mentor_names.map((mentorName, index) => ({
        id: program.mentor_ids[index], // Mentor ID
        name: mentorName, // Mentor Name
      }))
    }));
  } catch (error) {
    console.error("Error fetching programs:", error);
    return [];
  }
};

exports.getAllPrograms = async () => {
  try {
    const query = ` 
      SELECT 
          p.program_id, 
          p.name AS program_name
      FROM 
          programs p
    `;

    const result = await pgDatabase.query(query);

    if (!result.rows.length) {
      return [];
    }

    return result.rows.map(program => ({
      id: program.program_id, // Program ID
      name: program.program_name, // Program Name
    }));
  } catch (error) {
    console.error("Error fetching programs:", error);
    return [];
  }
};

exports.getProgramsForTelegram = async () => {
  try {
    // Query to get all programs
    const query = ` SELECT DISTINCT p.program_id, p.name
                    FROM programs p
                    INNER JOIN socialenterprises se ON p.program_id = se.program_id
                    INNER JOIN mentorships m ON se.se_id = m.se_id`;
    const result = await pgDatabase.query(query);

    // If there's no data, return an empty array
    if (!result.rows.length) {
      return [];
    }

    return result.rows.map(program => ({ 
      text: program.name, 
      callback_data: `program_${program.program_id}` 
    })); // Return a flat array of objects
  } catch (error) {
    console.error("Error fetching programs:", error);
    return [];
  }
};

exports.getProgramNameByID = async (programId) => {
  try {
    // Query to get program name by ID
    const query = 'SELECT name FROM Programs WHERE program_id = $1';
    const values = [programId];
    const result = await pgDatabase.query(query, values);

    // If no program is found, return null
    if (!result.rows.length) {
      return null;
    }

    return result.rows[0].name;
  } catch (error) {
    console.error("Error fetching program name:", error);
    return null; // Return null if there's an error
  }
};

exports.getProgramCount = async () => {
  try {
      const query = `
        SELECT COUNT(*) FROM programs
      `;
      const result = await pgDatabase.query(query);
      return result.rows;
  } catch (error) {
      console.error("❌ Error fetching program count:", error);
      return [];
  }
};

exports.addProgram = async (programData) => {
  try {
    const { name, description } = programData;

    // Insert the program into the database
    const query = `
      INSERT INTO programs (name, description)
      VALUES ($1, $2)
      RETURNING program_id, name, description;
    `;
    const values = [name, description];
    const result = await pgDatabase.query(query, values);

    return result.rows[0]; // Return the newly created program
  } catch (error) {
    console.error("Error adding program:", error);
    throw error; // Re-throw the error for upstream handling
  }
};