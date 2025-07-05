const pool = require('../db');
const Omise = require('omise');
const omise = new Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});
exports.createPayment = async (req, res) => {
  const {
    order_id,
    payment_method,
    card_info,
  } = req.body;

  if (payment_method !== 'card' || !card_info) {
    return res.status(400).json({ error: 'Unsupported payment method or missing card info' });
  }

  const { card_name, card_number, expiry, cvv } = card_info;
  if (!card_name || !card_number || !expiry || !cvv) {
    return res.status(400).json({ error: 'Missing card information' });
  }

  const [expMonth, expYear] = expiry.split('/');
  if (!expMonth || !expYear) {
    return res.status(400).json({ error: 'Invalid expiry format' });
  }

  try {
    console.log('Querying order from DB');
    const { rows: orderRows } = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND status = $2',
      [order_id, 'pending']
    );

    if (orderRows.length === 0) {
      console.log('Order not found or already paid');
      return res.status(404).json({ error: 'Order not found or already paid' });
    }

    const order = orderRows[0];

    console.log('Order ID:', order_id);
    console.log('Order total_price from DB:', order.total_price);

    const amount = Math.round(order.total_price * 100) + 5000; 
    console.log('Amount to charge (satang):', amount);

    console.log('Creating token');
    let token;
    try {
      token = await omise.tokens.create({
        card: {
          name: card_name,
          number: card_number,
          expiration_month: expMonth,
          expiration_year: '20' + expYear,
          security_code: cvv,
        },
      });
      console.log('Token created:', token);
    } catch (err) {
      console.error('Error creating token:', err);
      return res.status(500).json({ error: 'Token creation failed', detail: err.message });
    }

    console.log('Creating charge');
    let charge;
    try {
      charge = await omise.charges.create({
        amount,
        currency: 'thb',
        card: token.id,
        description: `ชำระเงิน Order #${order_id}`,
      });
      console.log('Charge created:', charge);
    } catch (err) {
      console.error('Error creating charge:', err);
      return res.status(500).json({ error: 'Charge creation failed', detail: err.message });
    }

    console.log('Inserting payment record');
    await pool.query(
      `INSERT INTO payments (
        order_id, amount, payment_method, status,
        charge_id, last_digits, card_brand, paid_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        order_id,
        amount,
        'card',
        charge.status,
        charge.id,
        charge.card.last_digits,
        charge.card.brand,
        charge.paid ? new Date() : null
      ]
    );

    if (charge.paid) {
      console.log('Updating order status to paid');
     await pool.query(
  `UPDATE orders SET status = 'paid', paid_at = $2 WHERE id = $1`,
  [order_id, new Date()]
);
    }

    res.json({ success: true, charge });

  } catch (err) {
    console.error('General error:', err);
    res.status(500).json({ error: 'Payment failed', detail: err.message });
  }
};
