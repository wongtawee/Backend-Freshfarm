const pool = require('../models/db');

const createShippingDetails = async (orderId, shippingData) => {
  const { recipient_name, delivery_address, recipient_phone } = shippingData;

  const result = await pool.query(
    `INSERT INTO shipping_details (order_id, recipient_name, delivery_address, recipient_phone)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [orderId, recipient_name, delivery_address, recipient_phone]
  );

  return result.rows[0];
};

const getShippingDetailsByOrderId = async (orderId) => {
  const result = await pool.query(
    `SELECT * FROM shipping_details WHERE order_id = $1`,
    [orderId]
  );

  return result.rows[0];
};

module.exports = {
  createShippingDetails,
  getShippingDetailsByOrderId,
};
