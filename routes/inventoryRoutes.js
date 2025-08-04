const express = require("express");
const router = express.Router();
const { getInventoryReport } = require("../controllers/inventoryController");

router.get("/", getInventoryReport);

module.exports = router;
