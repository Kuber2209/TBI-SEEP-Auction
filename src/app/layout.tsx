import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEEP 4.0 — Live Startup Auction Platform | BITS Pilani TBI',
  description: 'Official real-time startup auction platform for Student Entrepreneurs Encouragement Program 4.0 at BITS Pilani Hyderabad Campus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy-950 text-slate-100 antialiased selection:bg-gold-500 selection:text-navy-950">
        {children}
      </body>
    </html>
  );
}
