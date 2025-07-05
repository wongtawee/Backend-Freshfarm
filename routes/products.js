const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const { addProduct, getProducts, updateProduct, deleteProduct, getProductById } = require('../controllers/productController');

router.get('/products', getProducts);

router.get('/products/:id', getProductById);

router.post('/products', authMiddleware, adminMiddleware, addProduct);

router.put('/products/:id', authMiddleware, adminMiddleware, updateProduct);

router.delete('/products/:id', authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;
