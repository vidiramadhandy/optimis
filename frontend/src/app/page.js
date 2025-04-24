// src/app/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToHome() {
  const router = useRouter();

  useEffect(() => {
    // Redirect ke halaman home (atau halaman yang sesuai)
    router.push('/login');
  }, [router]);

  return null; // Bisa tambahkan loading spinner atau teks jika diperlukan
}
