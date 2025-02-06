const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getPrograms = async () => {
  try {
    // Query to get all programs
    const query = 'SELECT program_id, name FROM Programs';
    const result = await pgDatabase.query(query);

    // If there's no data, return an empty array
    if (!result.rows.length) {
      return [];
    }

    // Map the results to the desired format
    return result.rows.map(program => ({
      text: program.name,
      callback_data: `program_${program.program_id}`
    }));
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
