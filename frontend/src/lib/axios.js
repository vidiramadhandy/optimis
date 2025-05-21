import axios from 'axios';

// Pastikan axios selalu mengirimkan cookies di setiap permintaan
axios.defaults.withCredentials = true;  // Mengatur agar cookies selalu dikirim

// Atur URL dasar axios
axios.defaults.baseURL = 'http://localhost:5000';  // Sesuaikan dengan URL backend Anda

export default axios;
