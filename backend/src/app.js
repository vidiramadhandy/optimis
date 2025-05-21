const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Default route for root path
app.get('/', (req, res) => {
  res.send('OptiPredict API is running...');
});


// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Terjadi kesalahan!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`OptiPredict server berjalan pada http://localhost:${PORT}`);
});

module.exports = app;
