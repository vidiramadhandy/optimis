// app/layout.js

import '../app/globals.css'; // Memastikan file globals.css diimpor dari /src/app

export default function Layout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
