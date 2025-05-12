const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const app = express();


// Middleware untuk meng-handle body JSON
app.use(express.json());

// Mengaktifkan CORS
app.use(
  cors({
    origin: 'http://localhost:3000',  // URL frontend Anda
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,  // Mengizinkan pengiriman cookies
  }
  ));
app.use(cookieParser("helloworld"));
app.use(
  session({
    secret: "some_secret",
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 60000 * 60,
    },
  })
);

// Menggunakan rute pengguna dan postingan
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);


const PORT = process.env.PORT || 8000;
// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

// Route untuk root path
app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.headers.origin && ['http://localhost:8000'].includes(req.headers.origin)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  }
  console.log(req.session);
  console.log(req.session.id);
  req.session.visited = true;
  res.cookie("hello", "world", {maxAge: 30000, signed: true});
  res.status(201).send({msg: "OptiPredict API is ON"});
});
