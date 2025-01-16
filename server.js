const express = require('express')
const { getSampleData } = require('./controllers/sampleController')
const app = express()

// Set up your Supabase connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

app.get("/api", (req, res) => {
    res.json({"users": ["userOne", "userTwo", "userThree"]})
    const data = getSampleData();
    console.log(data)
})

app.listen(4000, () => {console.log("Server started on port 4000") })