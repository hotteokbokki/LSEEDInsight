const pgDatabase = require('../database.js'); // Import PostgreSQL client

// Function to fetch all SDGs
exports.getAllSDG = async () => {
  try {
    const query = `
      SELECT sdg_id, 'SDG ' || sdg_number || ': ' || name AS name 
      FROM sdg
      ORDER BY sdg_number;`
    const result = await pgDatabase.query(query);

    // If no data, return an empty array
    if (!result.rows.length) {
      return [];
    }

    // Return the SDGs in the required format
    return result.rows.map((sdg) => ({
      id: sdg.sdg_id, // Use 'id' for consistency with frontend
      name: sdg.name,
    }));
  } catch (error) {
    console.error("❌ Error fetching SDGs:", error);
    return [];
  }
};