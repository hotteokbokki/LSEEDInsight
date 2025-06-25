const express = require("express");
const router = express.Router();
const { getInventoryReport } = require("../controllers/inventoryController");

router.get("/", getInventoryReport);

// ✅ Add this for quick testing
router.get("/test", (req, res) => {
  res.send("✅ Inventory route working!");
});

module.exports = router;
