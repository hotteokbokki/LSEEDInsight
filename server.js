const app = require("./express"); // Import the app from express.js

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
