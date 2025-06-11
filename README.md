
# OptiPredict

Aplikasi web untuk prediksi dan optimasi menggunakan React (Next.js) di frontend dan Express.js di backend dengan database MySQL.

---

## Struktur Proyek

```
backend/
├── node_modules/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── app.js
├── .env
├── package.json
└── package-lock.json

frontend/
├── node_modules/
├── pages/
├── public/
├── styles/
├── package.json
└── package-lock.json
```

---

## Fitur Utama

- Autentikasi pengguna (login, register, logout)
- Manajemen profil pengguna
- Prediksi dan optimasi data
- Visualisasi hasil prediksi

---

## Teknologi yang Digunakan

### Backend

- Node.js, Express.js
- MySQL (mysql2)
- JWT untuk autentikasi
- bcrypt untuk enkripsi password

### Frontend

- React.js dengan Next.js
- Tailwind CSS untuk styling
- Context API untuk state management

---

## Persiapan Sebelum Deploy di Azure

### Prasyarat

- Akun Azure (disarankan Azure for Students untuk kredit gratis)
- Azure CLI terinstall
- GitHub repository (repository ini)
- Node.js versi 14+ terinstall
- MySQL database (Azure Database for MySQL Flexible Server direkomendasikan)

---

## Langkah Deploy Backend (Express.js) di Azure App Service

1. **Buat Azure Database for MySQL Flexible Server**

   - Login ke [Azure Portal](https://portal.azure.com)
   - Buat resource baru: **Azure Database for MySQL Flexible Server**
   - Catat hostname, username, password, dan nama database
   - Tambahkan IP client Anda ke firewall rules agar bisa akses database

2. **Clone repository dan masuk ke folder backend**

   ```bash
   git clone https://github.com/vidiramadhandy/optimis.git
   cd optimis/backend
   ```

3. **Buat file `.env` dan isi variabel lingkungan**

   ```
   JWT_SECRET=optipredict_secret
   DB_HOST=
   DB_USER=
   DB_PASSWORD=
   DB_NAME=
   PORT=5000
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Login Azure CLI dan buat App Service**

   ```bash
   az login
   az group create --name optipredict-rg --location eastus
   az appservice plan create --name optipredict-plan --resource-group optipredict-rg --sku B1 --is-linux
   az webapp create --resource-group optipredict-rg --plan optipredict-plan --name  --runtime "NODE|18-lts"
   ```

6. **Deploy backend ke Azure**

   - Push kode backend ke GitHub
   - Hubungkan Azure Web App dengan GitHub repository backend (di portal Azure)
   - Atur environment variables di Azure Web App (Application settings) sesuai `.env`
   - Atur startup command jika perlu (`npm start`)

---

## Langkah Deploy Frontend (Next.js) di Azure Static Web Apps

1. **Masuk ke Azure Portal**

2. **Buat Static Web App baru**

   - Pilih subscription dan resource group
   - Pilih GitHub repository frontend (`optimis/frontend`)
   - Pilih branch (biasanya `main`)
   - Build preset: pilih `Next.js`
   - App location: `/frontend`
   - Output location: `.next`

3. **Set environment variables jika perlu**

4. **Deploy dan tunggu proses selesai**

---

## Menghubungkan Frontend dan Backend

- Pastikan frontend memanggil API backend menggunakan URL Azure App Service backend Anda
- Contoh di frontend `.env.local`:

  ```
  NEXT_PUBLIC_API_URL=https://.azurewebsites.net/api
  ```

---

## Testing dan Monitoring

- Gunakan Azure Portal untuk monitoring App Service dan Static Web Apps
- Gunakan Application Insights untuk analitik dan monitoring performa
- Pastikan database MySQL dapat diakses dari backend di Azure

---

## Tips dan Best Practices

- Gunakan **Azure for Students** untuk memanfaatkan kredit gratis $100
- Gunakan **Azure App Service Free/Basic tier** untuk menghemat biaya
- Pisahkan deployment frontend dan backend untuk skalabilitas
- Gunakan **CI/CD GitHub Actions** untuk deployment otomatis
- Amankan environment variables dan rahasiakan data sensitif

---