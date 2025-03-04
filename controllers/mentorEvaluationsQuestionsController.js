const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getMentorQuestions = async () => {
    try {
        const query = `
            SELECT 
                *
            FROM mentor_evaluation_questions
        `;
        const result = await pgDatabase.query(query);

        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching top SE performance:", error);
        return [];
    }
};