import '../app/globals.css';
import SessionWarningModal from '@/components/SessionWarningModal';
import { AuthProvider } from '../lib/AuthContext'; // Impor AuthProvider

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <main>{children}
            <SessionWarningModal/>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
