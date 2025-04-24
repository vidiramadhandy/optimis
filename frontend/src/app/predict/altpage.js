'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs'; // Import exceljs
import Navbar from '../../components/navbar';

const AltPage = () => {
  const [excelData, setExcelData] = useState(null); // Menyimpan data Excel yang di-upload
  const [uploadedFileName, setUploadedFileName] = useState(""); // Menyimpan nama file yang di-upload
  const router = useRouter();

  // Fungsi untuk menangani file Excel yang di-upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]; // Ambil file yang dipilih
    setUploadedFileName(file.name); // Menyimpan nama file yang di-upload

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const buffer = evt.target.result;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer); // Memuat file Excel
      const worksheet = workbook.worksheets[0]; // Mengambil worksheet pertama

      // Menyusun data menjadi format yang bisa digunakan
      const data = worksheet.getSheetValues().map(row => {
        return row.reduce((acc, cell, idx) => {
          acc[`column${idx}`] = cell;
          return acc;
        }, {});
      });

      setExcelData(data); // Menyimpan data Excel ke state
    };

    reader.readAsArrayBuffer(file); // Membaca file sebagai ArrayBuffer
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Verifikasi jika file Excel sudah di-upload
    if (!excelData) {
      alert("Please upload an Excel file first.");
      return;
    }

    console.log(excelData); // Cetak data Excel yang sudah diproses

    // Arahkan ke halaman hasil
    router.push('/results');
  };

  // Fungsi untuk menghapus file yang sudah di-upload dan reset ke state awal
  const handleRemoveFile = () => {
    setExcelData(null); // Reset data Excel
    setUploadedFileName(""); // Reset nama file
    document.getElementById('fileInput').value = ""; // Menghapus input file yang terlihat di UI
  };

  return (
    <div className="relative min-h-screen bg-gradient-animation">
      <Navbar />
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: "url('/predictbg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'fixed',
        filter: 'brightness(0.5)',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}></div>


      <div className="absolute inset-0 w-full mt-30 animated-background bg-gradient-to-bl from-gray-800 via-zinc-800 to-violet-950 z-0"></div>

      {/* Form Upload Excel dengan dua opsi: button atau drag-and-drop */}
      <div className="text-black relative z-20 w-full lg:w-2/3 bg-white p-4 rounded-lg shadow-lg mx-auto my-8">
        <h2 className="text-3xl font-bold mb-2 text-left">Upload Excel File</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            {/* Drag-and-drop area */}
            <div className="cursor-pointer border-2 border-dashed border-gray-500 p-6 text-center rounded-lg mb-4 flex items-center justify-between">
              <input
                id="fileInput"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
              />
              <span className="ml-2 text-sm">{uploadedFileName}</span>
              {uploadedFileName && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="ml-4 p-2 bg-red-500 text-white rounded-md hover:bg-red-700"
                >
                  <img src="/delete.svg" alt="Delete Icon" className="w-6 h-6" /> {/* Ikon delete */}
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 mt-4 bg-green-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-2xl cursor-pointer"
            >
              Predict!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AltPage;
