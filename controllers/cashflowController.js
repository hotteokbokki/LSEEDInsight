const pgDatabase = require("../database.js");

const getCashFlowData = async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(ci.se_id, co.se_id) AS se_id,
        se.abbr AS se_abbr,
        COALESCE(ci.date, co.date) AS date,
        COALESCE(ci.sales, 0) + COALESCE(ci."otherRevenue", 0) + COALESCE(ci."ownerCapital", 0) AS inflow,
        COALESCE(co.expenses, 0) + COALESCE(co.inventory, 0) + COALESCE(co."ownerWithdrawal", 0) AS outflow
      FROM cash_in ci
      FULL OUTER JOIN cash_out co 
        ON ci.se_id = co.se_id AND ci.date = co.date
      LEFT JOIN socialenterprises se 
        ON se.se_id = COALESCE(ci.se_id, co.se_id)
      WHERE ci.se_id IS NOT NULL OR co.se_id IS NOT NULL
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
