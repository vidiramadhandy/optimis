import '../app/globals.css';
import { AuthProvider } from '../lib/AuthContext'; // Impor AuthProvider

export default function Layout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        <AuthProvider>{children}</AuthProvider> {/* Membungkus aplikasi dengan AuthProvider */}
      </body>
    </html>
  );
}
