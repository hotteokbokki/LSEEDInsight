const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getAllSDG = async () => {
    try {
      // Query to get all SDGs
      const query = "SELECT sdg_id, name FROM sdg"; // ✅ Select both ID & name
      const result = await pgDatabase.query(query);
  
      // If there's no data, return an empty array
      if (!result.rows.length) {
        return [];
      }
  
      // ✅ Return correct structure: { sdg_id, name }
      return result.rows.map((sdg) => ({
        sdg_id: sdg.sdg_id, // ✅ Use actual column names
        name: sdg.name
      }));
    } catch (error) {
      console.error("❌ Error fetching SDGs:", error);
      return [];
    }
  };
  