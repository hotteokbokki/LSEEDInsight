const express = require("express");
const router = express.Router();
const { getCashFlowData } = require("../controllers/cashflowController");

router.get("/cashflow", getCashFlowData);

module.exports = router;
