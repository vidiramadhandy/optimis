import { useEffect } from 'react';

const Image = ({ imageSrc }) => {
  useEffect(() => {
    // Menambahkan gambar secara dinamis setelah komponen dimount
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = 'Gambar Dinamis';
    img.id = 'dynamic-image';

    // Menambahkan gambar ke body atau elemen tertentu
    document.body.appendChild(img);

    // Bersihkan gambar jika komponen di-unmountgir rem
    return () => {
      img.remove();
    };
  }, [imageSrc]);

  return null; // Komponen ini tidak menghasilkan elemen UI di DOM
};

export default Image;
