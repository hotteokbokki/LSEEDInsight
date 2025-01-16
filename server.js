const express = require('express');
const cors = require('cors');
const { getSampleData } = require('./controllers/sampleController');
const app = express();
require('dotenv').config(); // Ensure environment variables are loaded

// Set up your Supabase connection
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors()); // This enables CORS for all routes

app.get("/api", async (req, res) => {
    try {
        const data = await getSampleData(); // Assuming this fetches data from your database
        res.json({ users: data });
        console.log(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(4000, () => {
    console.log("Server started on port 4000");
});
