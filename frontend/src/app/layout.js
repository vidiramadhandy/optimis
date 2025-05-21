import '../app/globals.css';
import { AuthProvider } from '../lib/AuthContext'; // Impor AuthProvider

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
