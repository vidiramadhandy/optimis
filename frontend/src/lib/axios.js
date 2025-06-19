import axios from 'axios';

// Mengonfigurasi axios dengan URL dasar dan kredensial untuk cookie
axios.defaults.baseURL = 'http://optipredict.my.id:5000';  // Ganti dengan URL backend Anda
axios.defaults.withCredentials = true;  // Untuk mengirimkan cookies bersama permintaan

export default axios;
