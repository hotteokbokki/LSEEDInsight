const express = require("express");
const router = express.Router();
const { getCashFlowData } = require("../controllers/cashflowController");

router.get("/", getCashFlowData);

module.exports = router;