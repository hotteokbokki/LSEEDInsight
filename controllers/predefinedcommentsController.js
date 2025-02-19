const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getPreDefinedComments = async () => {
    try {
      const res = await pgDatabase.query(
        "SELECT category_name, rating, comment_text FROM predefined_comments ORDER BY category_name, rating"
      );
  
      if (!res.rows || res.rows.length === 0) {
        console.warn("No predefined comments found.");
        return {}; // Return empty object instead of null
      }
  
      // Transform the result into the expected nested structure
      const evaluationCriteria = {};
  
      res.rows.forEach(({ category_name, rating, comment_text }) => {
        if (!evaluationCriteria[category_name]) {
          evaluationCriteria[category_name] = {};
        }
        if (!evaluationCriteria[category_name][rating]) {
          evaluationCriteria[category_name][rating] = [];
        }
        evaluationCriteria[category_name][rating].push(comment_text);
      });
  
      return evaluationCriteria; // Return structured data
    } catch (error) {
      console.error("Error fetching predefined comments:", error);
      throw new Error("Database query failed"); // Throwing error for better debugging
    }
  };
  