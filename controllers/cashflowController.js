const pgDatabase = require('../database.js');

const getCashFlowData = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.se_id,
        se.abbr AS se_abbr,
        DATE(r.dateCreated) AS date,
        COALESCE(ci.sales, 0) + COALESCE(ci.otherRevenue, 0) + COALESCE(ci.ownerCapital, 0) AS inflow,
        COALESCE(co.expenses, 0) + COALESCE(co.inventory, 0) + COALESCE(co.ownerWithdrawal, 0) AS outflow
      FROM reports r
      LEFT JOIN cash_in ci ON r.report_id = ci.report_id
      LEFT JOIN cash_out co ON r.report_id = co.report_id
      LEFT JOIN socialenterprises se ON r.se_id = se.se_id
      WHERE ci.report_id IS NOT NULL OR co.report_id IS NOT NULL
      ORDER BY date;
    `;

    const result = await pgDatabase.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching cash flow:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getCashFlowData,
};
