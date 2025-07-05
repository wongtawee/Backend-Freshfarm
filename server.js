require('dotenv').config();
const express = require('express');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT;
const products = require('./routes/products');
const auth = require('./routes/auth')
const orders = require('./routes/orders')
const paymentRoutes = require('./routes/paymentRoutes');

app.use(cors());
app.use(express.json());
app.listen(3000, '0.0.0.0', () => {
  console.log('Server is running on port 3000');
});


app.use('/auth', auth);
app.use('/api', products);
app.use('/',orders);
app.use('/api/payments', paymentRoutes);

app.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.path}`);
  next();
});
