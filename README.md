# OptiPredict

Aplikasi web untuk prediksi dan optimasi dengan menggunakan React dan Express.js.

## Struktur Proyek

```
backend/
├── node_modules/
├── src/
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── verifySignUp.js
│   ├── models/
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   └── utils/
│       ├── jwtUtils.js
│       ├── config.js
│       └── db.js
│   ├── app.js
├── .env
├── .gitignore
├── package-lock.json
└── package.json
```

## Fitur Utama

- Autentikasi pengguna (login, register, logout)
- Manajemen profil pengguna
- Prediksi dan optimasi data
- Visualisasi hasil prediksi

## Teknologi yang Digunakan

### Backend
- Node.js
- Express.js
- MySQL (dengan mysql2)
- JWT untuk autentikasi
- bcrypt untuk enkripsi password

### Frontend
- React.js dengan Next.js
- Tailwind CSS untuk styling
- Context API untuk state management

## Instalasi dan Penggunaan

### Prasyarat
- Node.js (versi 14 atau lebih baru)
- MySQL database

### Langkah Instalasi Backend

1. Clone repository
   ```bash
   git clone https://github.com/username/optimis.git
   cd optimis/backend
   ```

2. Install dependensi
   ```bash
   npm install
   ```

3. Buat file `.env` dengan konten berikut:
   ```
   JWT_SECRET=optipredict_secret
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password_anda
   DB_NAME=optipredict_database
   PORT=5000
   ```

4. Jalankan server
   ```bash
   npm start
   ```
   Atau untuk development:
   ```bash
   npm run dev
   ```

### Langkah Instalasi Frontend

1. Pindah ke direktori frontend
   ```bash
   cd ../frontend
   ```

2. Install dependensi
   ```bash
   npm install
   ```

3. Jalankan aplikasi
   ```bash
   npm run dev
   ```

## API Endpoints

### Autentikasi
- `POST /api/auth/register` - Registrasi pengguna baru
- `POST /api/auth/login` - Login pengguna
- `POST /api/auth/logout` - Logout pengguna
- `GET /api/auth/me` - Mendapatkan data pengguna yang sedang login

### Pengguna
- `GET /api/users/profile` - Mendapatkan profil pengguna
- `PUT /api/users/profile` - Memperbarui profil pengguna
