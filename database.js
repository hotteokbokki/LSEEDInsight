require('dotenv').config();
const { Client } = require('pg');

// Retrieve Database credentials from environment variables
const databaseURL = process.env.DATABASE_HOSTNAME;
const databaseUser = process.env.DATABASE_USER;
const databasePort = process.env.DATABASE_PORT;
const databasePassword = process.env.DATABASE_KEY;
const databaseName = process.env.DATABASE_NAME;  // Make sure you have this in your .env file

// Create a new PostgreSQL client instance using the environment variables
const client = new Client({
    host: databaseURL,
    user: databaseUser,
    port: databasePort,
    password: databasePassword,
    database: databaseName
});

// Connect to the PostgreSQL database
client.connect()
    .then(() => console.log("🔗 Connected to PostgreSQL"))
    .catch(err => console.error("Connection error", err.stack));

// Export the client so it can be used in other files
module.exports = client;
