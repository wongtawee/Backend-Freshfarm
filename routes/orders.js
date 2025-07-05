const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const orderController = require('../controllers/orderController');

router.post('/orders', authMiddleware, orderController.createOrder);
router.get('/orders', authMiddleware, orderController.getOrders);
router.get('/orders/:id', authMiddleware, orderController.getOrderById);

router.get('/admin/orders', authMiddleware, adminMiddleware, orderController.getAllOrders);
router.put('/admin/orders/:id', authMiddleware, adminMiddleware, orderController.updateOrderStatus);

module.exports = router;