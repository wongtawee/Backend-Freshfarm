const pool = require('../db');

exports.createOrder = async (data, userId) => {
  const { items, shipping } = data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Order items are required');
  }
  if (!shipping ||
    !shipping.recipient_name?.trim() ||
    !shipping.delivery_address?.trim() ||
    !shipping.recipient_phone?.trim()) {
    throw new Error('Shipping information is incomplete');
  }

  let totalPrice = 0;
  for (const item of items) {
    const result = await pool.query('SELECT price, stock FROM products WHERE id = $1', [item.product_id]);
    if (result.rows.length === 0) throw new Error(`Product ${item.product_id} not found`);
    const product = result.rows[0];
    if (product.stock < item.quantity) throw new Error(`Insufficient stock for product ${item.product_id}`);
    totalPrice += product.price * item.quantity;
  }

  await pool.query('BEGIN');

  try {
    const orderRes = await pool.query(
      'INSERT INTO orders (user_id, total_price) VALUES ($1, $2) RETURNING *',
      [userId, totalPrice]
    );
    const order = orderRes.rows[0];

    await pool.query(
      `INSERT INTO shipping_details (order_id, recipient_name, delivery_address, recipient_phone)
       VALUES ($1, $2, $3, $4)`,
      [order.id, shipping.recipient_name, shipping.delivery_address, shipping.recipient_phone]
    );

    for (const item of items) {
      const productRes = await pool.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
      const product = productRes.rows[0];

      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, product.price]
      );

      await pool.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await pool.query('COMMIT');
    return { message: 'Order created successfully', order };

  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
};

exports.getOrders = async (userId) => {
  const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
};

exports.getOrderById = async (orderId, user) => {
  const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (orderRes.rows.length === 0) throw { message: 'Order not found', status: 404 };

  const order = orderRes.rows[0];
  if (user.role !== 'admin' && order.user_id !== user.id) {
    throw { message: 'Forbidden', status: 403 };
  }

  const itemsRes = await pool.query(`
    SELECT oi.*, p.name, p.image_url FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE order_id = $1
  `, [orderId]);

  return { order, items: itemsRes.rows };
};

exports.getAllOrders = async () => {
  const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  return result.rows;
};

exports.updateOrderStatus = async (orderId, status) => {
  const validStatuses = ['pending', 'paid', 'shipped', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw { message: 'Invalid status', status: 400 };
  }

  const result = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, orderId]
  );
  if (result.rows.length === 0) throw { message: 'Order not found', status: 404 };

  return { message: 'Order status updated', order: result.rows[0] };
};
