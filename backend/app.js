const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

const app = express();
const port = 8000;

// Middleware untuk meng-handle body JSON
app.use(express.json());

// Mengaktifkan CORS
app.use(cors());

// Route untuk root path
app.get('/', (req, res) => {
  res.send('OptiPredict API is ON');
});

// Menggunakan rute pengguna dan postingan
app.use('/users', userRoutes);
app.use('/posts', postRoutes);

// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
