// controllers/inventoryController.js
const pgDatabase = require('../database.js');

const getInventoryReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        ir.item_name,
        ir.qty,
        ir.price,
        ir.amount,
        se.abbr AS se_abbr
      FROM inventory_report ir
      JOIN socialenterprises se ON ir.se_id = se.se_id
      ORDER BY se.abbr, ir.item_name;
    `;

    const result = await pgDatabase.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching inventory report:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getInventoryReport,
};
