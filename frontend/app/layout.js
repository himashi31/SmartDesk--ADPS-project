import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata = {
  title: 'SmartDesk – IT Help Desk',
  description: 'Report, assign, track and resolve IT support requests.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
