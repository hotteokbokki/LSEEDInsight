const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getMentorsBySocialEnterprises = async (se_id) => {
  try {
    // Query to get social enterprises by program_id
    const query = 'SELECT mentor_id, mentor_firstName, mentor_lastName FROM mentors WHERE se_id = $1';
    const values = [se_id];

    const result = await pgDatabase.query(query, values);

    // If no social enterprises are found, return an empty array
    if (!result.rows.length) {
      return [];
    }

    // Map the results to the desired format
    return result.rows.map(mentor => ({
      text: mentor.mentor_firstName, mentor_lastName, 
      callback_data: `mentor_${mentor.mentor_id}`
    }));
  } catch (error) {
    console.error("Error fetching Mentors:", error);
    return [];
  }
};

/*exports.getMentors = async () => {
    const { data, error } = await supabase
        .from('Mentors')
        .select('*');
    
    if (error) {
        console.error("Error fetching mentors:", error);
        return [];
    }
    
    return data;
};*/