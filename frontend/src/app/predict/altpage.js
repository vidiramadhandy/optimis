'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import Navbar from '../../components/navbar';

const AltPage = () => {
  const [excelData, setExcelData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  // Fungsi untuk menangani file Excel/CSV yang di-upload
  const handleFileUpload = async (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Validasi hanya menerima CSV dan Excel
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      alert('Please upload only CSV or Excel files (.csv, .xlsx, .xls)');
      return;
    }

    setUploadedFileName(file.name);

    if (fileExtension === 'csv') {
      // Handle CSV file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim() || '';
            });
            rows.push(row);
          }
        }
        setExcelData(rows);
        setIsFileUploaded(true);
      };
      reader.readAsText(file);
    } else {
      // Handle Excel file
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const buffer = evt.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];

        const data = [];
        const headers = [];
        
        // Get headers from first row
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value;
        });

        // Get data from subsequent rows
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            const rowData = {};
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber - 1];
              if (header) {
                rowData[header] = cell.value;
              }
            });
            if (Object.keys(rowData).length > 0) {
              data.push(rowData);
            }
          }
        });

        setExcelData(data);
        setIsFileUploaded(true);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Fungsi untuk menghapus file dan kembali ke upload
  const handleUploadAgain = () => {
    setExcelData(null);
    setUploadedFileName("");
    setIsFileUploaded(false);
    document.getElementById('fileInput').value = "";
  };

  // Handle confirm and predict
  const handleConfirmPredict = () => {
    if (!excelData) {
      alert("No data to predict.");
      return;
    }
    console.log('Predicting with data:', excelData);
    router.push('/results');
  };

  // Generate parameter columns P1-P30
  const generateParameterColumns = () => {
    const columns = [];
    for (let i = 1; i <= 30; i++) {
      columns.push(`P${i}`);
    }
    columns.push('SNR');
    return columns;
  };

  const parameterColumns = generateParameterColumns();

  return (
    <div className="relative min-h-screen bg-gradient-animation flex flex-col">
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

      <div className="absolute inset-0 w-full -mt-41 animated-background bg-gradient-to-bl from-gray-800 via-zinc-800 to-violet-950 z-0"></div>

      {!isFileUploaded ? (
        /* Upload Section */
        <div className="text-black relative z-20 w-full lg:w-2/3 bg-white p-8 rounded-lg shadow-lg mx-auto my-8">
          <h2 className="text-3xl font-bold mb-6 text-left">Upload Excel/CSV File</h2>

          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-300 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="fileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <label htmlFor="fileInput" className="cursor-pointer">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                </svg>
                <p className="text-lg">
                  Choose File or Drag & Drop
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Supports: .csv, .xlsx, .xls files only
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={() => router.push('/predict')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-600 transition-all duration-300 ease-in-out"
            >
              Use Manual Input
            </button>
          </div>
        </div>
      ) : (
        /* Data Preview Section */
        <div className="text-black relative z-20 w-full lg:w-5/6 bg-white rounded-lg shadow-lg mx-auto my-8">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">
              Parameters (P1-P30)
            </h2>
            <p className="text-gray-600">
              File: {uploadedFileName} | {excelData?.length || 0} rows of data
            </p>
          </div>

          {/* Scrollable Table */}
          <div className="max-h-96 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                    Row
                  </th>
                  {parameterColumns.map((col) => (
                    <th key={col} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b min-w-[80px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData?.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b font-medium">
                      {index + 1}
                    </td>
                    {parameterColumns.map((col) => (
                      <td key={col} className="px-4 py-3 text-sm text-center border-b">
                        <input
                          type="text"
                          value={row[col] || ''}
                          onChange={(e) => {
                            const newData = [...excelData];
                            newData[index][col] = e.target.value;
                            setExcelData(newData);
                          }}
                          className="w-full text-center border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SNR Section */}
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-xl font-bold text-green-600 mb-4">
              Signal-to-Noise Ratio
            </h3>
            <div className="grid gap-4">
              {excelData?.map((row, index) => (
                <div key={index} className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 min-w-[100px]">
                    SNR Row {index + 1}:
                  </label>
                  <input
                    type="text"
                    value={row.SNR || ''}
                    onChange={(e) => {
                      const newData = [...excelData];
                      newData[index].SNR = e.target.value;
                      setExcelData(newData);
                    }}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button
              onClick={handleUploadAgain}
              className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors duration-300"
            >
              Upload Again
            </button>
            <button
              onClick={handleConfirmPredict}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors duration-300"
            >
              Confirm & Predict
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AltPage;
