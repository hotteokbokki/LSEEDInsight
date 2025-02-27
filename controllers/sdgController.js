const pgDatabase = require('../database.js'); // Import PostgreSQL client

// Function to fetch all SDGs
exports.getAllSDG = async () => {
  try {
    const query = "SELECT sdg_id, name FROM sdg"; // Fetch SDG ID and name
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