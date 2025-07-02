const pgDatabase = require("../database.js"); // Import PostgreSQL client

exports.getUsers = async () => {
  try {
    const query = `
      SELECT
          u.user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.isactive, -- Make sure to select all necessary user columns
          -- Add other columns from the users table you need here, e.g., u.date_created, etc.
          ARRAY_AGG(uhr.role_name) AS roles -- Aggregate roles into an array
      FROM
          users u
      LEFT JOIN
          user_has_roles uhr ON u.user_id = uhr.user_id
      GROUP BY
          u.user_id, u.first_name, u.last_name, u.email, u.isactive -- Group by all non-aggregated columns
      ORDER BY
          u.last_name, u.first_name; -- Optional: Order for consistent display
    `;

    const result = await pgDatabase.query(query);

    if (!result.rows || result.rows.length === 0) {
      console.log("No users found in database."); // Use console.log for no users, not error
      return []; // Return an empty array if no users are found
    }

    // Clean up the roles array from [null] to [] for users with no roles
    const usersWithCleanRoles = result.rows.map(user => {
        const cleanedRoles = user.roles && user.roles.length > 0 && user.roles[0] !== null
                             ? user.roles
                             : [];
        return {
            ...user,
            roles: cleanedRoles,
        };
    });

    return usersWithCleanRoles; // Return the list of users with correctly formatted roles
  } catch (error) {
    console.error("Error fetching users in userController:", error);
    // It's often better to throw the error here and let the calling API route handle the 500 status
    throw error;
  }
};

exports.getUserName = async (user_id) => {
  try {
    console.log(`Fetching user by ID: ${user_id}`);

    const query = ` SELECT CONCAT(first_name, ' ', last_name) AS full_name 
                    FROM users 
                    WHERE user_id = $1`;
    const values = [user_id];

    const result = await pgDatabase.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error fetching mentor by ID:", error);
    return null;
  }
};

exports.getLSEEDCoordinators = async () => {
  try {
    const query = `
        SELECT
            u.user_id,
            u.first_name,
            u.last_name,
            u.email
        FROM
            users u
            INNER JOIN user_has_roles ur ON u.user_id = ur.user_id
        WHERE
            ur.role_name = 'LSEED-Coordinator';
    `;
    const result = await pgDatabase.query(query);

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows;
  } catch (error) {
    console.error("Error fetching LSEED coordinators:", error);
    return [];
  }
};

exports.getLSEEDDirectors = async () => {
  try {
    const query = `
      SELECT u.user_id, u.first_name, u.last_name, u.email
      FROM users u
      JOIN user_has_roles ur ON u.user_id = ur.user_id
      WHERE ur.role_name = 'LSEED-Director';
    `;
    const result = await pgDatabase.query(query);

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows;
  } catch (error) {
    console.error("Error fetching LSEED coordinators:", error);
    return [];
  }
};