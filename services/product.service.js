const pool = require('../db');

const getAllProducts = async () => {
  const res = await pool.query('SELECT * FROM products');
  return res.rows;
};

const getProductById = async (id) => {
  const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return res.rows[0];
};

const createProduct = async ({ name, price, stock = 0, image_url = null, category = null }) => {
  const res = await pool.query(
    `INSERT INTO products (name, price, stock, image_url, category)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, price, stock, image_url, category]
  );
  return res.rows[0];
};

const updateProduct = async (id, { name, price, stock, image_url, category }) => {
  const res = await pool.query(
    `UPDATE products
     SET name = $1, price = $2, stock = $3, image_url = $4, category = $5
     WHERE id = $6 RETURNING *`,
    [name, price, stock, image_url, category, id]
  );
  return res.rows[0];
};

const deleteProduct = async (id) => {
  const res = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
  return res.rows[0];
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
