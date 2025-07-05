const orderService = require('../services/order.service');

const createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.body, req.user.id);
    console.log('Order create result:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getOrders = async (req, res) => {
  try {
    const result = await orderService.getOrders(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await orderService.getOrderById(id, req.user);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrders();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await orderService.updateOrderStatus(id, status);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
