require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; 

const products = require('./routes/products');
const auth = require('./routes/auth');
const orders = require('./routes/orders');
const paymentRoutes = require('./routes/paymentRoutes');
const pool = require('./db');

app.use(cors());
app.use(express.json());

console.log('DB_HOST =', process.env.DB_HOST);
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
app.use('/auth', auth);
app.use('/api', products);
app.use('/', orders);
app.use('/api/payments', paymentRoutes);

app.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.path}`);
  next();
});
