const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getSocialEnterprisesByProgram = async (programId) => {
  try {
    // Query to get social enterprises by program_id
    const query = 'SELECT se_id, team_name FROM SocialEnterprises WHERE program_id = $1';
    const values = [programId];

    const result = await pgDatabase.query(query, values);

    // If no social enterprises are found, return an empty array
    if (!result.rows.length) {
      return [];
    }

    // Map the results to the desired format
    return result.rows.map(se => ({
      text: se.team_name, 
      callback_data: `se_${se.se_id}`
    }));
  } catch (error) {
    console.error("Error fetching Social Enterprises:", error);
    return [];
  }
};

// exports.getSocialEnterpriseByProgram = async (id) => {
//     // Fetch a specific Social Enterprise by ID
//     const { data, error } = await supabase.from('SocialEnterprises').select('*').eq('program_id', id);
//     if (error) {
//       console.error("Error fetching Social Enterprise by ID:", error);
//       return null;
//     }
//     return data;
//   }